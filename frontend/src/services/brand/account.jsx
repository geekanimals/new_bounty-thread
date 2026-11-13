"use client";

/**
 * ⚙️ Settings ke kaam — purana paintSettings / paintTeam / fbStart("link") / fbReturn / data-bpxfbrefresh / data-bpxfbunlink:
 *  - team: api.brand_team → { me, my_role, max, members[{ member_id, name, email, role, last_sign_in }] }
 *  - team add / role / remove: edge brand-login { action:"team_add" | "team_role" | "team_remove" }
 *  - Facebook business link: edge brand-fb-login { action:"url" (state fbbrand:link:<nonce>) → Facebook → action:"link" }
 *  - refresh / unlink: brand-fb-login { action:"refresh" } / { action:"unlink" }
 * Password badalna auth.jsx ke changePassword mein hai.
 */
import { useCallback, useEffect, useState } from "react";
import { api, fn, ss } from "./core";

/* ---------- 👥 Team (purana paintTeam) ---------- */
/** Team list (purana api("brand_team")) */
export const getTeam = () => api("brand_team");
/** React: team → { data, loading, error, reload } */
export function useTeam() {
  const [st, setSt] = useState({ data: null, loading: true, error: null });
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setSt((s) => ({ ...s, loading: true }));
    const r = await getTeam();
    setSt((s) => ({ data: r.error ? s.data : r.data, loading: false, error: r.error ? r.error.message || String(r.error) : null }));
    return r;
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { ...st, reload: () => load(true) };
}
/** Team roles ke naam (purana RL) */
export const TEAM_ROLES = { owner: "Admin (owner)", approver: "Approver", viewer: "View only" };

// brand-login edge function — data.error ko bhi error maano (purana call())
const brandLogin = async (body) => {
  const r = await fn("brand-login", body);
  if (!r.error && r.data && r.data.error) return { data: null, error: { message: r.data.error } };
  return r;
};
/** Naya teammate (purana team_add) → { data:{ email, password, login_url }, error } — password sirf abhi dikhta hai */
export const addTeammate = ({ email, name, role }) => brandLogin({ action: "team_add", email: String(email || "").trim(), name: String(name || "").trim(), role });
/** Teammate ka access badlo (purana team_role) */
export const setTeammateRole = (memberId, role) => brandLogin({ action: "team_role", member_id: memberId, role });
/** Teammate hatao (purana team_remove) */
export const removeTeammate = (memberId) => brandLogin({ action: "team_remove", member_id: memberId });
/** Teammate ko bhejne wala login text (purana "📋 Copy login") */
export const teammateLoginText = (d, brand) =>
  `Your Geek OS login for ${brand}\nLink: ${d.login_url || window.location.origin + "/brands"}\nEmail: ${d.email}\nPassword: ${d.password}\n(Change the password in Settings after signing in.)`;

/* ---------- 📘 Facebook business link (purana fbStart("link") / fbReturn) ---------- */
// brand-fb-login — data.error ko bhi error maano
const fbLogin = async (body) => {
  const r = await fn("brand-fb-login", body);
  if (!r.error && r.data && r.data.error) return { data: null, error: { message: r.data.error } };
  return r;
};
const fbRedirect = () => window.location.origin + "/app.html";

/** "Link Facebook business" (purana fbStart("link")) — after = "settings" | "facebook" (wapsi kahan) */
export async function startFacebookLink(after = "settings") {
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
  ss.set("geek_fb_brand", nonce + ":link");
  ss.set("geek_fb_after", "fbreturn=" + after);
  ss.set("geek_tab_door", "brand"); // /legacy router wapsi par brand door par bheje
  const r = await fbLogin({ action: "url", redirect_uri: fbRedirect(), state: "fbbrand:link:" + nonce });
  if (r.error) return r;
  window.location.href = r.data.url;
  return { data: true, error: null };
}
/** URL mein Facebook link ki wapsi hai? (state "fbbrand:link:…") */
export function hasFacebookLinkReturn() {
  try {
    return /^fbbrand:link:/.test(new URLSearchParams(window.location.search).get("state") || "");
  } catch {
    return false;
  }
}
/**
 * Facebook link wapsi poori karo (purana fbReturn) → null (wapsi nahi) ya { ok, message, after }
 * after = "facebook" ho to Facebook page par bhejo, warna settings.
 */
export async function finishFacebookLink() {
  const q = new URLSearchParams(window.location.search);
  const st = q.get("state") || "";
  const code = q.get("code");
  if (!/^fbbrand:link:/.test(st)) return null;
  window.history.replaceState(window.history.state, "", window.location.pathname);
  const saved = ss.get("geek_fb_brand") || "";
  ss.del("geek_fb_brand");
  const after = /fbreturn=facebook/.test(ss.get("geek_fb_after") || "") ? "facebook" : "settings";
  ss.del("geek_fb_after");
  if (saved !== st.split(":")[2] + ":link") return { ok: false, message: "Facebook link expired — try again.", after };
  if (!code) return { ok: false, message: "Facebook link was cancelled.", after };
  const r = await fbLogin({ action: "link", code, redirect_uri: fbRedirect() });
  return r.error
    ? { ok: false, message: r.error.message, after }
    : { ok: true, message: "Facebook business linked — next time just tap Continue with Facebook", after };
}
/** Facebook data refresh (purana data-bpxfbrefresh) */
export const refreshFacebook = () => fbLogin({ action: "refresh" });
/** Facebook unlink (purana data-bpxfbunlink) */
export const unlinkFacebook = () => fbLogin({ action: "unlink" });
