"use client";

/**
 * Creator ka Instagram — connect (OAuth), wapsi, accounts, media kit row, sync, edits, DMs.
 * Purane app ke ig-connect.js / app.js connectInstagram + handleOAuthCallback + finishInstagram,
 * media-kit (mkFetchAcct / refreshMediaKit) aur instagram-dm inbox ke calls — wahi args.
 */
import { useCallback, useEffect, useState } from "react";
import { sb, call, fn, K, ls } from "./core";
import { loadCreator, reloadProfile } from "./auth";
import { authReturnUrl } from "@/lib/authReturn";

/* ---------- Constants (purane app.js) ---------- */
export const INSTAGRAM_APP_ID = "944216414793314";
export const IG_SCOPES =
  "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights,instagram_business_manage_comments,instagram_business_manage_messages";
// Meta mein registered redirect: <site>/auth/callback → /legacy router → /creator?code&state
export const igRedirect = authReturnUrl;

/* =====================================================================
 * Connect (OAuth)
 * ===================================================================== */
/**
 * "Connect Instagram" — seedha Instagram (Meta) par, koi Geek page beech mein nahi (purana connectInstagram).
 * after = wapas aakar kahan jaana hai (purana geekos_after_ig)
 */
export async function startInstagramConnect({ after } = {}) {
  let ticket = "";
  try {
    const {
      data: { session },
    } = await sb().auth.getSession();
    if (session) {
      const r = await call("ig_connect_begin");
      if (!r.error && r.data) ticket = String(r.data);
    }
  } catch {
    /* ticket optional */
  }
  const st = "instagram:" + Math.random().toString(36).slice(2) + (ticket ? ":" + ticket : "");
  ls.set(K.oauthState, st);
  if (after) ls.set(K.afterIg, after);
  try {
    window.sessionStorage.setItem("geek_tab_door", "creator"); // /legacy router wapsi par isi door par bheje
  } catch {
    /* ignore */
  }
  const p = new URLSearchParams({ client_id: INSTAGRAM_APP_ID, redirect_uri: igRedirect(), response_type: "code", scope: IG_SCOPES, state: st });
  // "#weblink" + trailing slash: phone par Instagram app mein nahi, browser mein hi login + Allow (purana note)
  window.location.href = "https://www.instagram.com/oauth/authorize/?" + p.toString() + "#weblink";
}

/** URL mein Instagram ka ?code&state hai? (wapsi) → { code, state, error } | null */
export function readIgReturn() {
  try {
    const q = new URLSearchParams(window.location.search);
    const code = q.get("code");
    const st = q.get("state") || "";
    const err = q.get("error_description") || q.get("error") || "";
    if (/^instagram:/.test(st)) return { code, state: st, error: err };
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Instagram wapsi poori karo (purana handleOAuthCallback + finishInstagram):
 *  login hai → instagram-auth (is account se jodo)
 *  login nahi, ticket hai → instagram-login + ticket (doosre browser mein wapas aaye)
 *  login nahi → instagram-login (Instagram se hi sign in)
 * Return: { ok, after } | { ok, signIn } ya throw
 */
export async function finishInstagram(code, st) {
  if (!code) throw new Error("Instagram connect was cancelled.");
  const expected = ls.get(K.oauthState);
  const ticket = (String(st).split(":")[2] || "").trim();
  if (st !== expected && !/^[0-9a-f]{48}$/.test(ticket)) throw new Error("That Instagram link expired — please try again.");
  ls.del(K.oauthState);
  const redirect_uri = igRedirect();
  const {
    data: { session },
  } = await sb().auth.getSession();
  if (session) {
    const r = await fn("instagram-auth", { code, redirect_uri });
    if (r.error) throw new Error(r.error.message);
    ls.set(K.igConnected, "1");
  } else {
    const body = ticket ? { code, redirect_uri, ticket } : { code, redirect_uri };
    const r = await fn("instagram-login", body);
    if (r.error) throw new Error(r.error.message);
    ls.set(K.igConnected, "1");
    if (r.data && r.data.token_hash) {
      const v = await sb().auth.verifyOtp({ token_hash: r.data.token_hash, type: "magiclink" });
      if (v.error) throw new Error(v.error.message);
    } else if (ticket) {
      return { ok: true, signIn: true }; // jud gaya, par yahan login karna padega
    }
  }
  const after = ls.get(K.afterIg);
  ls.del(K.afterIg);
  await loadCreator({ force: true });
  return { ok: true, after };
}

/* =====================================================================
 * Accounts (kai Instagram — ek active)
 * ===================================================================== */
/** my_ig_accounts → { data: [...], error } */
export const getIgAccounts = () => call("my_ig_accounts");

/** Active account badlo (ig_switch_account) — throw on error */
export async function switchIg(igUserId) {
  const r = await call("ig_switch_account", { p_ig_user_id: igUserId });
  if (r.error) throw new Error(r.error.message);
  await reloadProfile();
  return true;
}

/**
 * Account hatao (ig_disconnect_account — purana igDisconnect). Doosra active bana to media sync,
 * phir creator store reload (aakhri gaya to poora reload → app phir Instagram step maangega). → { data, error }
 */
export async function disconnectIg(igUserId) {
  const r = await call("ig_disconnect_account", { p_ig_user_id: igUserId });
  if (r.error) return r;
  const d = r.data || {};
  if (d.switched) await fn("instagram-media-sync", { force: true });
  await reloadProfile();
  if (d.none_left) loadCreator({ force: true });
  return r;
}

/** Brands ko verified experience dikhe? (api.set_profile_visibility brand_experience) → { data, error } */
export const setExperienceVisible = (on) =>
  call("api.set_profile_visibility", { p_field_or_group: "brand_experience", p_tier: "marketplace_summary", p_allowed: on, p_correlation: "ui" });

/* =====================================================================
 * Media kit row (social_accounts) + sync + edits
 * ===================================================================== */
/** Login creator ka auth user (session se) — { user, ready } */
export function useCreatorUser() {
  const [u, setU] = useState({ user: null, ready: false });
  useEffect(() => {
    let alive = true;
    sb()
      .auth.getSession()
      .then(({ data }) => alive && setU({ user: data?.session?.user || null, ready: true }))
      .catch(() => alive && setU({ user: null, ready: true }));
    return () => {
      alive = false;
    };
  }, []);
  return u;
}

/** Instagram media kit row (social_accounts) — purane mkFetchAcct jaisa: is creator ka sabse naya Instagram.
 *  → { acct, loading, error, reload, user } */
export function useMyIg() {
  const { user, ready } = useCreatorUser();
  const [st, setSt] = useState({ acct: null, loading: true, error: null });
  const load = useCallback(async () => {
    if (!user) return setSt({ acct: null, loading: false, error: null });
    const { data, error } = await sb()
      .from("social_accounts")
      .select("*")
      .eq("platform", "instagram")
      .eq("member_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1);
    setSt({ acct: error ? null : (data && data[0]) || null, loading: false, error });
  }, [user]);
  useEffect(() => {
    if (ready) load();
  }, [ready, load]);
  return { ...st, loading: st.loading || !ready, reload: load, user };
}

/** Instagram se taaza posts (instagram-media-sync — server khud throttle karta hai) → { data, error } */
export const syncIgMedia = (force = false) => fn("instagram-media-sync", { force: !!force });

/** Media kit edits (naam, bio, pinned, show…) social_accounts.edits mein → { data, error } */
export const saveIgEdits = (accountId, edits) => sb().from("social_accounts").update({ edits, updated_at: new Date().toISOString() }).eq("id", accountId);

/** Connected Instagram ka chhota row (apply profiles ke liye) → row | null */
export async function myIgRow(memberId) {
  if (!memberId) return null;
  const sa = await sb().from("social_accounts").select("username,followers_count").eq("platform", "instagram").eq("member_id", memberId).limit(1);
  return (sa && sa.data && sa.data[0]) || null;
}

/* =====================================================================
 * Instagram DMs (instagram-dm edge function — purana IG inbox)
 * ===================================================================== */
/** DM conversations list → { data, error } */
export const igConversations = () => fn("instagram-dm", { action: "conversations" });
/** Ek conversation ke messages → { data, error } */
export const igThread = (conversationId) => fn("instagram-dm", { action: "thread", conversation_id: conversationId });
/** DM bhejo → { data, error } */
export const igSend = (recipientId, text) => fn("instagram-dm", { action: "send", recipient_id: recipientId, text });
