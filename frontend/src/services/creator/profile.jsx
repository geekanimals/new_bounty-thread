"use client";

/**
 * Creator profile — save / read + purana "session" shape (useSession) jo pages padhte hain.
 * Purane app ke profile.js / bounty-welcome.js / address-form.js / settings ke calls, wahi args.
 *
 * Return ka rule:
 *  - save* / set* / add* / remove* (profile badalne wale) → Error throw karte hain + creator store reload (page try/catch karta hai)
 *  - get* / start* / verify* / geoLookup → { data, error } (lib/supabase jaisa)
 */
import { useEffect, useState } from "react";
import { useRpc } from "@/lib/supabase";
import { DOOR, sb, call, api, fn, K, ls } from "./core";
import { useCreator, getCreator, patchCreator, reloadProfile, fixPrefs, displayName, backupEmailOf, signOut, track } from "./auth";
import { termsOf, ratesOf, fmtFollowers } from "./helpers";
import { CATEGORIES, DREAM_BRANDS } from "@/components/creater/data";

/* =====================================================================
 * Generic save (purane saveProfileSection / apiCall)
 * ===================================================================== */
/** api.save_profile_section — section: personal | contact | professional | commercial_preference */
export async function saveSection(section, patch, corr = "ui") {
  const r = await api("save_profile_section", { p_section: section, p_patch: patch, p_correlation: corr });
  if (r.error) throw new Error(r.error.message);
  reloadProfile();
  return true;
}
/** Koi bhi api.* call jo profile badle, phir profile reload (andar ka helper — pages naam wale functions use karein) */
async function profileCall(name, args, { reload = true } = {}) {
  const r = await api(name, args);
  if (r.error) throw new Error(r.error.message);
  if (reload) reloadProfile();
  return r.data;
}
/** Login ke metadata mein likho (bx_manual, bx_terms_ack …) — auth.updateUser */
export async function updateMeta(data) {
  const { data: u, error } = await sb().auth.updateUser({ data });
  if (error) throw new Error(error.message);
  const s = getCreator();
  patchCreator({ meta: { ...s.meta, ...data, ...((u && u.user && u.user.user_metadata) || {}) } });
  return true;
}
/** Sidekick prefs (kid, name, avatar, tips…) — device + login metadata (purana bxKid.save) */
export async function savePrefs(next) {
  const s = getCreator();
  const P = fixPrefs({ ...s.prefs, ...(next || {}) });
  ls.set(K.prefs(s.member?.id), JSON.stringify(P));
  ls.set(K.prefsLast, JSON.stringify(P));
  patchCreator({ prefs: P });
  if (s.loggedIn) {
    try {
      await sb().auth.updateUser({ data: { bx_prefs: P } });
    } catch {
      /* device copy kaafi hai */
    }
  }
  return P;
}
/** "You decide on each offer…" tick — ek baar login par save (bx_terms_ack) */
export async function ackTerms() {
  const s = getCreator();
  if (s.meta && s.meta.bx_terms_ack) return;
  try {
    await updateMeta({ bx_terms_ack: new Date().toISOString() });
  } catch {
    /* ignore */
  }
}

/* =====================================================================
 * Content / availability / travel (purane profile.js)
 * ===================================================================== */
/** api.get_my_availability → { data: { status } , error } */
export const getAvailability = () => api("get_my_availability");
/** api.get_my_travel → { data: { city … }, error } */
export const getTravel = () => api("get_my_travel");
/** api.set_my_availability (available | busy | …) */
export const setAvailability = (status, { reload = true } = {}) => profileCall("set_my_availability", { p_status: status, p_limit: null }, { reload });
/** api.set_my_travel — city khaali = travel band */
export const setTravel = (city) => profileCall("set_my_travel", { p_city: city, p_state: null, p_country: null, p_until: null });

/* =====================================================================
 * Dream brands · skills · resources · rates
 * ===================================================================== */
/** api.upsert_dream_brand */
export const addDreamBrand = (name, rank, { corr = "ui", reload = true } = {}) =>
  profileCall("upsert_dream_brand", { p_payload: { submitted_brand_name: name, priority_rank: rank }, p_correlation: corr }, { reload });
/** api.delete_dream_brand */
export const removeDreamBrand = (aspirationId, { corr = "ui", reload = true } = {}) => profileCall("delete_dream_brand", { p_aspiration_id: aspirationId, p_correlation: corr }, { reload });
/** api.upsert_skill / api.remove_skill */
export const setSkill = (key, on, isCustom) =>
  on ? profileCall("upsert_skill", { p_payload: { skill_key: key, is_custom: isCustom }, p_correlation: "ui" }) : profileCall("remove_skill", { p_skill_key: key, p_correlation: "ui" });
/** api.upsert_resource / api.remove_resource */
export const setResource = (key, on, isCustom) =>
  on ? profileCall("upsert_resource", { p_payload: { resource_key: key, is_custom: isCustom }, p_correlation: "ui" }) : profileCall("remove_resource", { p_resource_key: key, p_correlation: "ui" });
/** api.save_rate_card_item — type = "IG Reel" | "IG Story" | "IG Static Post" */
export const saveRate = (type, amount, { corr = "ui", reload = true } = {}) => profileCall("save_rate_card_item", { p_payload: { deliverable_type: type, amount }, p_correlation: corr }, { reload });

/* =====================================================================
 * Address (purane address-form.js)
 * ===================================================================== */
/** geo-lookup edge function: { action: "pincode" | "reverse" | "verify", … } → { data, error } */
export const geoLookup = (body) => fn("geo-lookup", body);
/** api.upsert_address (naya ya edit) */
export const saveAddress = (payload, { corr = "ui" } = {}) => profileCall("upsert_address", { p_payload: payload, p_correlation: corr });
/** Default address banao */
export const setDefaultAddress = (id) => profileCall("upsert_address", { p_payload: { address_id: id, is_default: true }, p_correlation: "ui" });
/** api.delete_address */
export const deleteAddress = (id) => profileCall("delete_address", { p_address_id: id, p_correlation: "ui" });

/* =====================================================================
 * Contact — WhatsApp link + backup email (purane whatsapp.js / email-otp)
 * ===================================================================== */
/** WhatsApp link ke liye code (wa-otp-start). phone = +91XXXXXXXXXX */
export const startWaLink = (phone) => fn("wa-otp-start", { phone });
/** WhatsApp link code check (wa-otp-verify, link: true) */
export const verifyWaLink = (phone, code) => fn("wa-otp-verify", { phone, code, link: true, door: "creator", name: "", org: "" });
/** Backup email par code (email-otp start) */
export const startEmailOtp = (email) => fn("email-otp", { action: "start", email });
/** Backup email code check (email-otp verify) */
export const verifyEmailOtp = (code) => fn("email-otp", { action: "verify", code });

/* =====================================================================
 * Account — data download + delete (purane settings)
 * ===================================================================== */
/** "Download my data" ka JSON (profile + Instagram + campaigns + sidekick) */
export async function exportMyData(c = getCreator()) {
  const id = c.member?.id || c.user?.id;
  const [pf, sa, mc] = await Promise.all([
    api("get_my_profile"),
    sb()
      .from("social_accounts")
      .select("username,name,followers_count,media_count,biography,website,updated_at,edits")
      .eq("member_id", id)
      .then((r) => r, (e) => ({ error: e })),
    api("get_my_campaigns"),
  ]);
  return {
    exported_at: new Date().toISOString(),
    account: { name: c.member?.name || displayName(c), role: c.member?.role || "creator" },
    profile: pf.data || null,
    instagram: (sa && sa.data) || [],
    campaigns: mc.data || [],
    sidekick: c.prefs || null,
  };
}
/** creator_delete_me ("DELETE" likhna zaroori) → is device ke creator flags saaf + logout. Return { error } */
export async function deleteAccount(confirm) {
  const r = await call("creator_delete_me", { p_confirm: confirm });
  if (r.error) return r;
  try {
    Object.keys(window.localStorage)
      .filter((x) => /^bx_|geek_apply|ci_ob_|bounty_creator/.test(x))
      .forEach((x) => window.localStorage.removeItem(x));
  } catch {
    /* ignore */
  }
  await signOut();
  return { data: r.data, error: null };
}

/* =====================================================================
 * Session view (purane pages ka "session" shape — ab asli creator store se)
 * ===================================================================== */
/**
 * Purane pages same fields padhte rahein isliye ye shape wahi rakhi hai:
 *   { phone, sidekick, ig, locked, setupDone, cookie, name, first, handle, city, followers, categories, formats,
 *     languages, dreamBrands, collab, rates, about, backupEmail, profilePct, avatar, loggedIn, ready }
 * Sirf device-wali cheezein (cookie choice, kuch UI flags) localStorage (bounty_creator_ui) mein rehti hain.
 */
const FMT = { reel: "Reels", story: "Stories", carousel: "Carousels", ugc: "UGC videos", post: "Posts", live: "Lives" };

function readLocal() {
  try {
    return JSON.parse(ls.get(K.uiFlags) || "{}");
  } catch {
    return {};
  }
}

/** creator state → purana session shape */
export function sessionFrom(c, local = {}) {
  const pro = (c.profile && c.profile.professional) || {};
  const per = (c.profile && c.profile.personal) || {};
  const ct = (c.profile && c.profile.contact) || {};
  const cp = (c.profile && c.profile.commercial_preference) || {};
  const md = (c.meta && c.meta.bx_manual) || {};
  const ig = (c.igAccounts || [])[0] || null;
  const name = displayName(c);
  const catIds = (pro.categories || []).map((x) => (CATEGORIES.find((k) => k.label.toLowerCase() === String(x).toLowerCase()) || {}).id || x);
  const dream = (c.profile?.dream_brands || []).map((d) => d.submitted_brand_name).filter(Boolean);
  const dreamIds = dream.map((n) => (DREAM_BRANDS.find((b) => b.name.toLowerCase() === n.toLowerCase()) || {}).id || n);
  const r = ratesOf(c.profile);
  const handle = ig ? "@" + ig.username : md.ig_handle || (pro.ig_handle_self ? "@" + pro.ig_handle_self : "");
  return {
    ready: c.ready,
    loggedIn: c.loggedIn,
    phone: ct.whatsapp_e164 || c.member?.whatsapp_e164 || (c.user?.phone ? "+" + c.user.phone : ""),
    sidekick: c.prefs?.kid || "pip",
    useSidekickPic: !!c.prefs?.avatar,
    ig: c.hasIg,
    locked: c.locked,
    joinNeeds: c.joinNeeds || [],
    setupDone: c.onbDone || !!(pro.categories || []).length || !!(pro.content_formats || []).length,
    cookie: local.cookie ?? null,
    name,
    first: (per.first_name || name.split(" ")[0] || "").trim(),
    handle,
    city: pro.city_coarse || md.city || "",
    followers: ig ? String(ig.followers_count || "") : md.followers ? String(md.followers) : pro.followers_self ? String(pro.followers_self) : "",
    followersShort: ig ? fmtFollowers(ig.followers_count) : "",
    avatar: ig?.profile_picture_url || "",
    categories: catIds,
    formats: (pro.content_formats || []).map((f) => FMT[f] || f),
    languages: pro.languages || [],
    dreamBrands: dreamIds,
    collab: termsOf(cp),
    rates: {
      reel: r["IG Reel"] ? String(r["IG Reel"]) : "",
      story: r["IG Story"] ? String(r["IG Story"]) : "",
      post: r["IG Static Post"] ? String(r["IG Static Post"]) : "",
      product: cp.min_product_value != null ? String(cp.min_product_value) : "Any",
    },
    available: pro.availability_status || "available",
    about: per,
    backupEmail: backupEmailOf(c),
    profilePct: c.req ? c.req.pct : 0,
    profileLeft: c.req ? c.req.total - c.req.done : 0,
    req: c.req,
    ...local,
  };
}

/** Local UI flags (cookie choice …). sidekick / useSidekickPic → login ke prefs mein save */
export function writeSession(patch) {
  const { sidekick, useSidekickPic, ...rest } = patch || {};
  if (sidekick !== undefined || useSidekickPic !== undefined) {
    savePrefs({ ...(sidekick !== undefined ? { kid: sidekick } : {}), ...(useSidekickPic !== undefined ? { avatar: !!useSidekickPic } : {}) });
  }
  if (Object.keys(rest).length) ls.set(K.uiFlags, JSON.stringify({ ...readLocal(), ...rest }));
  window.dispatchEvent(new Event("bounty-session"));
  return sessionFrom(getCreator(), readLocal());
}

/** React hook: [session, update] — har component mein same (asli) session */
export function useSession() {
  const c = useCreator();
  const [local, setLocal] = useState({});
  useEffect(() => {
    const sync = () => setLocal(readLocal());
    sync();
    window.addEventListener("bounty-session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("bounty-session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [sessionFrom(c, local), writeSession];
}

/* =====================================================================
 * Seedhe reads (store ke bina — jahan page ko taaza copy chahiye)
 * ===================================================================== */
/** api.get_my_profile → { data, error } */
export const getMyProfile = () => api("get_my_profile");
/** api.get_my_profile hook — { data, loading, error, reload } */
export const useMyProfile = () => useRpc(DOOR, "api.get_my_profile");
/** api.get_profile_requirements hook (profile checklist) — { data, loading, error, reload } */
export const useProfileRequirements = () => useRpc(DOOR, "api.get_profile_requirements");

/* =====================================================================
 * Cookie consent (purana ensureConsent / Tracker.consentChanged)
 * ===================================================================== */
const CONSENT_KEY = "geekos_consent";
/** Pehle is device ki choice, warna server (my_consent). → "all" | "essential" | null */
export async function getConsent() {
  const local = ls.get(CONSENT_KEY);
  if (local === "all" || local === "essential") return local;
  const r = await call("my_consent");
  return r.data === "all" || r.data === "essential" ? r.data : null;
}
/** Choice device par + server log (log_activity kind "consent") — Super Admin har device par dekhta hai */
export function saveConsent(v) {
  ls.set(CONSENT_KEY, v);
  track("consent", { choice: v }, "consent");
}
