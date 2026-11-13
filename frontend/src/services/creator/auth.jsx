"use client";

/**
 * Creator login + ek hi creator store + flow gates. Bilkul purane app jaisa
 * (login.js + app.js creatorProfileGate / creatorHasInstagram / claimCreatorInvites + bounty-welcome.js):
 *
 *  1. WhatsApp OTP: wa-otp-start → wa-otp-verify → auth.verifyOtp(token_hash, magiclink)   (sirf "creator" door)
 *  2. Login ke baad: campaign invite claim (claim_my_invites) → Instagram hai? (social_accounts)
 *     - nahi hai aur "baad mein" nahi chuna → sidekick (pehli baar) → Instagram step
 *  3. App khulta hai. Profile setup (content → dream brands → terms → [IG nahi to details]) ek baar,
 *     agar categories / formats khaali hain.
 *  4. Locked mode = my_join_status.needs (Instagram / WhatsApp connect baaki) — campaigns band, baaki dikhta hai.
 *
 * Koi naya backend nahi — sirf purane RPC / edge functions.
 */
import { useEffect, useState } from "react";
import { DOOR, sb, call, api, fn, K, ls } from "./core";
import { buildReq } from "./helpers";
import { clearRpcCache } from "@/lib/supabase";

/* ---------- Store (har component mein ek hi creator state) ---------- */
const EMPTY = {
  ready: false, // pehli load poori hui?
  loggedIn: false,
  user: null, // supabase auth user
  member: null, // { id, email, name, role, status, whatsapp_e164 }
  meta: {}, // auth user_metadata (bx_manual, bx_prefs, bx_terms_ack)
  igAccounts: [], // social_accounts (instagram) rows, naya pehle
  hasIg: false,
  igLater: false,
  kidSeen: false,
  onbDone: false,
  profile: null, // api.get_my_profile
  req: null, // { items, total, done, complete, missing, pct } — ek hi % har jagah
  joinNeeds: [], // ["Connect Instagram (media kit)", "Connect WhatsApp"]
  locked: false, // __profileGate
  prefs: { kid: "pip", name: "", avatar: false },
  inviteGo: null, // claim_my_invites ka jawab (campaign invite se aaye)
  error: null,
};
let state = { ...EMPTY };
const subs = new Set();
const emit = () => subs.forEach((f) => f(state));
/** Store mein patch (sirf services/creator/* ke liye) */
export const patchCreator = (patch) => {
  state = { ...state, ...patch };
  emit();
};
/** Abhi ka creator state (React ke bahar) */
export const getCreator = () => state;

/** React: const c = useCreator()  → upar wala state (pehli baar khud load karta hai) */
export function useCreator() {
  const [s, setS] = useState(state);
  useEffect(() => {
    subs.add(setS);
    setS(state);
    if (!state.ready) loadCreator();
    return () => subs.delete(setS);
  }, []);
  return s;
}

/* ---------- Sidekick prefs ---------- */
const KIDS = ["pip", "mochi", "sprout", "pebble", "rumi", "dot"];
const OLD_KIDS = { flick: "mochi", nimbus: "pip" };
/** prefs saaf karo — purane naam (flick/nimbus) naye mein, galat kid → pip */
export const fixPrefs = (p) => {
  const o = { kid: "pip", name: "", avatar: false, ...(p || {}) };
  if (OLD_KIDS[o.kid]) o.kid = OLD_KIDS[o.kid];
  if (!KIDS.includes(o.kid)) o.kid = "pip";
  return o;
};
/** Is browser ka aakhri chuna sidekick (login check se pehle loader ke liye) — sirf effect mein bulao */
export function lastKid() {
  try {
    const j = JSON.parse(ls.get(K.prefsLast) || "null");
    return fixPrefs(j).kid;
  } catch {
    return "pip";
  }
}
const isWaEmail = (e) => /@creators\.bountythreads\.app$/i.test(String(e || ""));

/* ---------- Load ---------- */
/** social_accounts (instagram) rows — read hiccup par null (creator ko lock mat karo, purana rule) */
async function loadIg(memberId) {
  if (!memberId) return [];
  try {
    const r = await sb()
      .from("social_accounts")
      .select("id,username,name,followers_count,media_count,recent_media,profile_picture_url,account_type,biography,website,edits,updated_at")
      .eq("platform", "instagram")
      .eq("member_id", memberId)
      .order("updated_at", { ascending: false });
    if (r.error) return null;
    return r.data || [];
  } catch {
    return null;
  }
}

/** Profile (get_my_profile) — naye creator ka profile nahi hai to bootstrap (purane profile.js jaisa) */
async function loadProfileData() {
  let p = await api("get_my_profile");
  const fresh = p.error && /no creator identity/i.test(String(p.error.message || ""));
  if (fresh || (!p.error && !p.data)) {
    const b = await api("bootstrap_my_profile", { p_correlation: "ui-bootstrap" });
    if (!b.error) p = await api("get_my_profile");
  }
  return p.error ? null : p.data || null;
}

/** Profile + checklist + join gate dobara (save ke baad) */
export async function reloadProfile() {
  if (!state.loggedIn) return state;
  const [rq, js, mp, ig] = await Promise.all([api("get_profile_requirements"), api("my_join_status"), loadProfileData(), loadIg(state.member?.id)]);
  const igRows = ig === null ? state.igAccounts : ig;
  const hasIg = ig === null ? true : igRows.length > 0;
  const joinNeeds = !js.error && js.data ? js.data.needs || [] : [];
  patchCreator({
    profile: mp || state.profile,
    igAccounts: igRows,
    hasIg,
    req: buildReq(rq.error ? null : rq.data, mp, hasIg, state.meta) || state.req,
    joinNeeds,
    locked: joinNeeds.length > 0,
  });
  return state;
}

let loading = null;
/** Poora creator load (session → member → invites → Instagram → profile gate). force = dobara */
export function loadCreator({ force = false } = {}) {
  if (loading && !force) return loading;
  loading = (async () => {
    try {
      const {
        data: { session },
      } = await sb().auth.getSession();
      if (!session) {
        state = { ...EMPTY, ready: true };
        emit();
        return state;
      }
      const user = session.user;
      const { data: m } = await sb().from("members").select("*").eq("id", user.id).maybeSingle();
      // member row nahi mili → admin ne user delete kiya ho sakta hai: server se login check karo.
      // Login hi nahi bacha (user delete) → is phone ka saara purana data hatao, logout → WhatsApp login se naya shuru
      if (!m) {
        const g = await sb().auth.getUser();
        if (g.error && (g.error.status === 401 || g.error.status === 403 || /not.*exist|not.*found|jwt|session/i.test(g.error.message || ""))) {
          forgetDevice(user.id);
          await signOut();
          return state;
        }
      }
      const md = user.user_metadata || {};
      const member = m
        ? { id: user.id, email: m.email || user.email, name: m.name || md.full_name || "", role: m.role || "creator", status: m.status || "active", whatsapp_e164: m.whatsapp_e164 || null, org_id: m.org_id || null }
        : { id: user.id, email: user.email, name: md.full_name || "", role: md.role || "creator", status: "active", whatsapp_e164: null };
      // sidekick prefs: login ke metadata → is device ki copy
      let prefs = md.bx_prefs;
      if (!prefs) {
        try {
          prefs = JSON.parse(ls.get(K.prefs(user.id)) || ls.get(K.prefsLast) || "null");
        } catch {
          prefs = null;
        }
      }
      patchCreator({ loggedIn: true, user, member, meta: md, prefs: fixPrefs(prefs) });
      // agli baar loader (login check se pehle) isi sidekick ko dikhaye
      ls.set(K.prefsLast, JSON.stringify(fixPrefs(prefs)));

      const inviteGo = await claimInvites();
      const [ig, rq, js, mp] = await Promise.all([loadIg(user.id), api("get_profile_requirements"), api("my_join_status"), loadProfileData()]);
      const igRows = ig || [];
      const hasIg = ig === null ? true : igRows.length > 0;
      const joinNeeds = !js.error && js.data ? js.data.needs || [] : []; // network error → khula rakho
      state = {
        ...state,
        ready: true,
        igAccounts: igRows,
        hasIg,
        igLater: ls.get(K.igLater(user.id)) === "1",
        kidSeen: !!ls.get(K.kidSeen(user.id)),
        onbDone: !!ls.get(K.onbDone(user.id)),
        profile: mp,
        req: buildReq(rq.error ? null : rq.data, mp, hasIg, md),
        joinNeeds,
        locked: joinNeeds.length > 0,
        inviteGo: inviteGo || state.inviteGo,
        error: null,
      };
      emit();
      waOptin();
      return state;
    } catch (e) {
      state = { ...state, ready: true, error: e?.message || String(e) };
      emit();
      return state;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

/* ---------- Login (WhatsApp OTP — purane login.js) ---------- */
/** 10 digit (India) → +91XXXXXXXXXX */
export const e164 = (phone10) => "+91" + String(phone10 || "").replace(/\D/g, "").slice(-10);

/** WhatsApp par login code bhejo (wa-otp-start). phone = 10 digit. Error par throw */
export async function sendOtp(phone10) {
  const r = await fn("wa-otp-start", { phone: e164(phone10) });
  if (r.error) throw new Error(r.error.message);
  return true;
}

/** Code check (wa-otp-verify) → session (verifyOtp magiclink). alerts = "campaign alerts on WhatsApp" tick */
export async function verifyOtp(phone10, code, { alerts = false } = {}) {
  const r = await fn("wa-otp-verify", { phone: e164(phone10), code, link: false, door: "creator", name: "", org: "" });
  if (r.error) throw new Error(r.error.message);
  const th = r.data && r.data.token_hash;
  if (!th) throw new Error("Couldn't verify — please try again.");
  const v = await sb().auth.verifyOtp({ token_hash: th, type: "magiclink" });
  if (v.error) throw new Error(v.error.message);
  if (alerts) ls.set(K.waAlerts, "1");
  track("login", { method: "whatsapp_otp", door: "creator" });
  return loadCreator({ force: true });
}

/** Security log (purana track.js: public.log_activity({ p_events })) — fail chupchaap */
export function track(event, detail = {}, kind = "security") {
  call("log_activity", { p_events: [{ kind, event, detail, page: typeof window !== "undefined" ? window.location.pathname : "" }] }).catch?.(() => {});
}

/** "Send me matching campaign alerts on WhatsApp" → contact opt-in (purana waOptin) */
async function waOptin() {
  if (ls.get(K.waAlerts) !== "1" || !state.loggedIn) return;
  const r = await api("save_profile_section", { p_section: "contact", p_patch: { whatsapp_optin: true }, p_correlation: "ui-signin" });
  if (!r.error) ls.set(K.waAlerts, "done");
}

/** Logout — sirf is door ka, sirf is browser mein. UI ko bhi khabar ("bounty-session" event) */
/** Is device par us user ka bacha hua data (onboarding flags, sidekick, Instagram state) hatao */
export function forgetDevice(id) {
  [K.igLater(id), K.kidSeen(id), K.onbDone(id), K.obCommercial(id), K.prefs(id), K.prefsLast, K.igConnected, K.afterIg, K.oauthState, K.waAlerts].forEach((k) => ls.del(k));
}

export async function signOut() {
  // pehle UI ka state turant "logged out" — taaki koi guard purane login par aage na bheje
  state = { ...EMPTY, ready: true };
  emit();
  clearRpcCache(DOOR);
  try {
    await sb().auth.signOut({ scope: "local" });
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new Event("bounty-session"));
  } catch {
    /* SSR */
  }
}

/* ---------- Campaign invite (?cinv=) — purane login.js / claimCreatorInvites ---------- */
/** URL / localStorage ka invite token rakh lo (login se pehle bhi) */
export function captureInvite() {
  try {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("cinv");
    if (t && /^[0-9a-f-]{36}$/i.test(t)) ls.set(K.cinv, t);
    const a = q.get("apply");
    if (a && /^[0-9a-f-]{36}$/i.test(a)) ls.set(K.apply, a);
  } catch {
    /* ignore */
  }
  return ls.get(K.cinv);
}
/** Login se pehle banner ke liye: kis brand ne kis campaign mein bulaya (invite_preview) */
export async function invitePreview() {
  const t = captureInvite();
  if (!t) return null;
  const { data } = await call("invite_preview", { p_token: t });
  return data || null;
}
/** Login ke baad invite claim (claim_my_invites) — token use hote hi hata do */
export async function claimInvites() {
  const tok = ls.get(K.cinv);
  const { data, error } = await api("claim_my_invites", { p_token: tok || null });
  if (error) return null;
  if (tok) ls.del(K.cinv);
  return tok || (data && (data.joined || data.waiting)) ? data || {} : null;
}

/* ---------- Flow flags (is device par) ---------- */
export function setIgLater() {
  ls.set(K.igLater(state.member?.id), "1");
  patchCreator({ igLater: true });
}
export function setKidSeen(v = "seen") {
  ls.set(K.kidSeen(state.member?.id), v);
  patchCreator({ kidSeen: true });
}
export function markOnbDone() {
  ls.set(K.onbDone(state.member?.id), "1");
  ls.set(K.obCommercial(state.member?.id), "1");
  patchCreator({ onbDone: true });
}
/** Profile setup (content / brands / terms) dikhana hai? — purana bxMaybeOnboard */
export function needsOnboarding(c = state) {
  if (!c.loggedIn || c.onbDone) return false;
  const pro = (c.profile && c.profile.professional) || {};
  if ((pro.categories || []).length || (pro.content_formats || []).length) return false;
  return !!c.profile; // profile load nahi hua to zabardasti mat karo
}
/** IG nahi hai aur manual details (handle/city) bhi nahi → setup ka aakhri step "details" */
export function needsManualDetails(c = state) {
  const md = (c.meta && c.meta.bx_manual) || {};
  const noIg = !c.hasIg || (c.joinNeeds || []).some((x) => /instagram/i.test(x));
  return noIg && !(md.ig_handle || md.at);
}

/* ---------- Gates ---------- */
/**
 * Is page par rehna hai ya kahin aur jaana hai? (null = theek hai)
 *  mode "guest"  — welcome / login / verify: login hai to aage bhejo
 *  mode "member" — onboarding steps: login zaroori
 *  mode "app"    — app pages: login + Instagram step (ya "baad mein") + ek baar profile setup
 */
export function gateRoute(c, mode, pathname = "") {
  if (!c.ready) return null;
  if (mode === "guest") return c.loggedIn ? afterLoginRoute(c) : null;
  if (!c.loggedIn) return "/creator/login";
  if (mode === "member") return null;
  if (!c.hasIg && !c.igLater) return c.kidSeen ? "/creator/onboarding/instagram" : "/creator/onboarding";
  if (needsOnboarding(c) && !/^\/creator\/media-kit/.test(pathname)) return "/creator/onboarding/content";
  return null;
}
/** Login ke turant baad kahan (purana bootOS) */
export function afterLoginRoute(c = state) {
  if (!c.hasIg && !c.igLater) return c.kidSeen ? "/creator/onboarding/instagram" : "/creator/onboarding";
  if (needsOnboarding(c)) return "/creator/onboarding/content";
  // campaign invite se aaye: pehle profile (locked ho to), warna My campaigns
  if (c.inviteGo) return c.locked ? "/creator/profile" : "/creator/my-campaigns";
  const apply = ls.get(K.apply);
  if (apply) {
    ls.del(K.apply);
    return c.locked ? "/creator/media-kit" : `/creator/discover/${apply}`;
  }
  return "/creator/home";
}

/** React hook: guard chalao (redirect). Return: creator state */
export function useCreatorGate(mode, router, pathname) {
  const c = useCreator();
  useEffect(() => {
    if (!mode) return;
    const to = gateRoute(c, mode, pathname);
    if (to && to !== pathname) router.replace(to);
  }, [c, mode, router, pathname]);
  return c;
}

/* ---------- Display ---------- */
/** Creator ka naam: display_name → first+last → Instagram name → member name (wa_ wala nahi) */
export function displayName(c = state) {
  const pro = (c.profile && c.profile.professional) || {};
  const per = (c.profile && c.profile.personal) || {};
  const ig = c.igAccounts[0] || {};
  const nm = c.member && !/^wa_\d+@/.test(c.member.name || "") ? c.member.name : "";
  return pro.display_name || [per.first_name, per.last_name].filter(Boolean).join(" ") || ig.name || nm || "";
}
/** Backup email (WhatsApp wala placeholder email nahi) */
export const backupEmailOf = (c = state) => {
  const ct = (c.profile && c.profile.contact) || {};
  return ct.email && !isWaEmail(ct.email) ? ct.email : "";
};
