"use client";

/**
 * Brand login + brand ka store — purane login.js (brand door) + brand-portal.js load() jaisa.
 *  - Login: email + password (Supabase Auth) → members.role "brand" hona chahiye (warna turant logout)
 *  - "Continue with Facebook": brand-fb-login (url → Facebook → /app.html?code&state → /legacy → /brands?code&state → login)
 *  - WhatsApp OTP (wa-otp-start / wa-otp-verify door:"brand") — purana "Sign in with WhatsApp" link
 *  - Store: login user + member row + api.brand_portal (brands, campaigns, videos, to_approve, facebook, role)
 */
import { useEffect, useState } from "react";
import { DOOR, sb, call, api, fn, ss } from "./core";
import { signOutDoor } from "@/lib/supabase";
import { clearNotifications } from "./notifications";
import { resetDashCache } from "./dashboard";
import { initials, gradFor, isLive } from "./helpers";

/* ---------- Store (har component mein ek hi brand state) ---------- */
const EMPTY = {
  ready: false, // pehli load poori hui?
  loggedIn: false,
  user: null, // supabase auth user
  member: null, // members row { id, name, email, role, org_id, org_name }
  portal: null, // api.brand_portal ka jawab { me, brands, campaigns, videos, to_approve, facebook, role }
  portalError: null,
  error: null,
};
let state = { ...EMPTY };
const subs = new Set();
const emit = () => subs.forEach((f) => f(state));
const setState = (patch) => {
  state = { ...state, ...patch };
  emit();
};
export const getBrand = () => state;

/** React: const b = useBrand() → upar wala state (pehli baar khud load karta hai) */
export function useBrand() {
  const [s, setS] = useState(state);
  useEffect(() => {
    subs.add(setS);
    setS(state);
    if (!state.ready) loadBrand();
    return () => subs.delete(setS);
  }, []);
  return s;
}

let _loading = null;
/** Session + member + brand_portal load (purana Auth.currentSession + BrandPortal load) */
export function loadBrand({ force = false } = {}) {
  if (_loading && !force) return _loading;
  _loading = (async () => {
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
      // brand door par sirf brand login (purana login.js: "This isn't a brand login")
      if (m && m.role && m.role !== "brand") {
        await signOutDoor(DOOR);
        state = { ...EMPTY, ready: true, error: "This isn't a brand login. Use the login page for your account type." };
        emit();
        return state;
      }
      const md = user.user_metadata || {};
      const member = m
        ? { id: user.id, email: m.email || user.email, name: m.name || md.full_name || "", role: m.role || "brand", org_id: m.org_id || null, org_name: m.org_name || "", status: m.status || "active" }
        : { id: user.id, email: user.email, name: md.full_name || "", role: "brand", org_id: null, org_name: md.org_name || "", status: "active" };
      const r = await api("brand_portal", { p_brand: null });
      setState({ ready: true, loggedIn: true, user, member, portal: r.error ? null : r.data, portalError: r.error ? r.error.message || String(r.error) : null, error: null });
      return state;
    } catch (e) {
      state = { ...EMPTY, ready: true, error: e?.message || String(e) };
      emit();
      return state;
    } finally {
      _loading = null;
    }
  })();
  return _loading;
}

/** brand_portal dobara laao (koi approve / decline / request ke baad — purana refresh()) */
export async function reloadPortal() {
  const r = await api("brand_portal", { p_brand: null });
  if (!r.error) setState({ portal: r.data, portalError: null });
  return r;
}

/** View-only login? (purana can(): role "viewer" ko approve buttons nahi) */
export const canAct = (b = state) => !b.portal || b.portal.role !== "viewer";

/** Brand ka naam (purana brandName) */
export const brandName = (b = state) => {
  const L = (b.portal && b.portal.brands) || [];
  return L.length ? L.map((x) => x.name).join(", ") : b.member?.org_name || "your brand";
};

/** Brand role ka naam (purana RL — owner / approver / viewer) */
export const ROLE_LABEL = { owner: "Admin", approver: "Approver", viewer: "View only" };

/**
 * Shell / header ke liye ready values (Figma ke BRAND / USER / WORKSPACES jagah):
 * { name, letter, gradient, workspaces[{ id, name, letter, gradient, note }], user{ name, first, initials, email, role, gradient },
 *   liveCount, campaigns, toApprove, videos, approvalsCount, facebook, role }
 */
export function brandView(b = state) {
  const p = b.portal || {};
  const L = p.brands || [];
  const name = brandName(b);
  const first = L[0] ? L[0].name : name;
  const me = p.me || {};
  const uname = me.name || b.member?.name || (b.member?.email || "").split("@")[0] || "You";
  const C = p.campaigns || [];
  return {
    name,
    letter: initials(first).slice(0, 1),
    gradient: gradFor(first),
    workspaces: (L.length ? L : [{ brand_id: "me", name: first }]).map((x) => ({ id: x.brand_id, name: x.name, letter: initials(x.name).slice(0, 1), gradient: gradFor(x.name), note: "Brand workspace" })),
    user: {
      name: uname,
      first: uname.split(/\s+/)[0],
      initials: initials(uname),
      email: me.email || b.member?.email || "",
      role: (ROLE_LABEL[p.role] || "Admin") + " · " + first,
      gradient: gradFor(uname),
    },
    campaigns: C,
    liveCount: C.filter(isLive).length,
    toApprove: p.to_approve || [],
    videos: p.videos || [],
    approvalsCount: (p.to_approve || []).length + (p.videos || []).length,
    facebook: p.facebook || null,
    role: p.role || "owner",
  };
}

/* ---------- Login ---------- */
/** Email + password (purana Auth.signIn + brand role check) — galat hone par Error throw */
export async function signIn(email, password) {
  const { error } = await sb().auth.signInWithPassword({ email: String(email || "").trim().toLowerCase(), password });
  if (error) throw new Error(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
  const s = await loadBrand({ force: true });
  if (!s.loggedIn) throw new Error(s.error || "Couldn't sign you in. Try again.");
  track("login", { method: "password", door: "brand" });
  return s;
}

/** WhatsApp OTP bhejo (purana send → wa-otp-start) → { data, error } */
export async function sendOtp(phone) {
  const r = await fn("wa-otp-start", { phone: String(phone || "").trim() });
  return r;
}
/** WhatsApp OTP verify + session (purana verify → wa-otp-verify door:"brand" → verifyOtp magiclink) — Error throw */
export async function verifyOtp(phone, code, { name = "", org = "" } = {}) {
  const r = await fn("wa-otp-verify", { phone, code, link: false, door: DOOR, name, org });
  if (r.error) throw new Error(r.error.message);
  const v = await sb().auth.verifyOtp({ token_hash: (r.data || {}).token_hash, type: "magiclink" });
  if (v.error) throw new Error(v.error.message);
  const s = await loadBrand({ force: true });
  if (!s.loggedIn) throw new Error(s.error || "Couldn't sign you in. Try again.");
  track("login", { method: "whatsapp_otp", door: "brand" });
  return s;
}

/* ---------- Facebook Login for Business (brand-fb-login) ---------- */
const FB_KEY = "geek_fb_brand";
// purane app jaisa: redirect hamesha <site>/app.html (Meta mein yahi URL registered) → /legacy router → /brands?code&state
const fbRedirect = () => window.location.origin + "/app.html";

/** "Continue with Facebook" (purana startBrandFacebook) — Facebook ki window par bhejta hai, error par Error throw */
export async function startFacebookLogin() {
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
  ss.set(FB_KEY, nonce + ":login");
  ss.set("geek_tab_door", "brand"); // /legacy router wapsi par isi door par bheje
  const r = await fn("brand-fb-login", { action: "url", redirect_uri: fbRedirect(), state: "fbbrand:login:" + nonce });
  if (r.error) throw new Error(r.error.message);
  window.location.href = r.data.url;
}

/** URL mein Facebook wapsi hai? (state "fbbrand:login:…") */
export function hasFacebookReturn() {
  try {
    return /^fbbrand:login:/.test(new URLSearchParams(window.location.search).get("state") || "");
  } catch {
    return false;
  }
}

/** Facebook se wapsi poori karo (purana finishBrandFacebook) → "" = login ho gaya, warna error message */
export async function finishFacebookLogin() {
  const q = new URLSearchParams(window.location.search);
  const st = q.get("state") || "";
  const code = q.get("code");
  if (!/^fbbrand:login:/.test(st)) return null;
  window.history.replaceState(window.history.state, "", window.location.pathname);
  const saved = ss.get(FB_KEY) || "";
  ss.del(FB_KEY);
  if (saved !== st.split(":")[2] + ":login") return "That Facebook sign-in expired — please try again.";
  if (!code)
    return q.get("error") === "access_denied" || /permission/i.test(q.get("error_description") || "")
      ? "Facebook sign-in was cancelled — tap Continue with Facebook to try again."
      : q.get("error_description") || "Facebook sign-in was cancelled.";
  const r = await fn("brand-fb-login", { action: "login", code, redirect_uri: fbRedirect() });
  if (r.error) return r.error.message;
  const v = await sb().auth.verifyOtp({ token_hash: r.data.token_hash, type: "magiclink" });
  if (v.error) return v.error.message;
  const s = await loadBrand({ force: true });
  if (!s.loggedIn) return s.error || "Couldn't sign you in.";
  track("login", { method: "facebook", door: "brand" });
  return "";
}

/* ---------- Password ---------- */
/**
 * "Forgot password" — purane brand door mein reset nahi tha ("No login yet? Ask your Geek account manager").
 * Supabase Auth ka reset email bhejte hain; link /brands/forgot-password?… par wapas aata hai.
 */
export async function sendPasswordReset(email) {
  const { error } = await sb().auth.resetPasswordForEmail(String(email || "").trim().toLowerCase(), { redirectTo: window.location.origin + "/brands/forgot-password" });
  return { data: !error, error };
}
/**
 * Reset email ka link wapas /brands/forgot-password#access_token=…&type=recovery par aata hai.
 * Session set karo (detectSessionInUrl band hai) → "" = ho gaya (ab Settings mein naya password), null = link nahi, warna error.
 */
export async function takeRecoverySession() {
  const h = new URLSearchParams(String(window.location.hash || "").replace(/^#/, ""));
  if (h.get("type") !== "recovery" && !h.get("error_description")) return null;
  window.history.replaceState(window.history.state, "", window.location.pathname);
  if (h.get("error_description")) return h.get("error_description").replace(/\+/g, " ");
  const { error } = await sb().auth.setSession({ access_token: h.get("access_token") || "", refresh_token: h.get("refresh_token") || "" });
  if (error) return error.message;
  const s = await loadBrand({ force: true });
  return s.loggedIn ? "" : s.error || "That reset link didn't work — ask for a new one.";
}
/** Settings: "Current password" sahi hai? (Supabase updateUser purana password nahi maangta — isliye ek baar sign-in se jaanch) */
export async function verifyPassword(password) {
  const email = state.member?.email || state.user?.email || "";
  const { error } = await sb().auth.signInWithPassword({ email, password });
  return { data: !error, error: error ? { message: error.message === "Invalid login credentials" ? "Your current password is wrong." : error.message } : null };
}
/** Login ke baad naya password (purane Settings "Change password" jaisa — auth.updateUser) */
export async function changePassword(password) {
  const { error } = await sb().auth.updateUser({ password });
  return { data: !error, error };
}

/** Logout — pehle UI state saaf, phir sirf is door / is browser se (purana signOut scope:"local") */
export async function signOut() {
  state = { ...EMPTY, ready: true };
  emit();
  clearNotifications();
  resetDashCache();
  track("logout", { door: "brand" });
  await signOutDoor(DOOR);
}

/** Security / activity log (purana Tracker.security → log_activity) */
export function track(event, detail = {}, kind = "security") {
  call("log_activity", { p_events: [{ kind, event, detail, page: typeof window !== "undefined" ? window.location.pathname : "" }] }).catch?.(() => {});
}

/* ---------- Gates ---------- */
/**
 * Kahan bhejna hai? mode "guest" (login page: login ho chuka to dashboard), "app" (login zaroori).
 * null = yahin raho.
 */
export function gateRoute(b, mode) {
  if (!b.ready) return null;
  if (mode === "guest") return b.loggedIn ? "/brands/dashboard" : null;
  if (mode === "app") return b.loggedIn ? null : "/brands";
  return null;
}
/** React hook: guard chalao (router.replace) aur brand state lautao */
export function useBrandGate(mode, router) {
  const b = useBrand();
  useEffect(() => {
    if (!mode) return;
    const to = gateRoute(b, mode);
    if (to) router.replace(to);
  }, [b, mode, router]);
  return b;
}
