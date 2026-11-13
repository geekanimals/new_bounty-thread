"use client";

/**
 * Supabase — naya frontend, purana backend (koi table / function nahi badla).
 *
 * Bilkul purane auth.js ki tarah:
 *  - Har "door" (creator · brand · admin · agency) ka login ALAG rehta hai — ek browser mein
 *    creator, brand aur Super Admin teeno ek saath login reh sakte hain.
 *  - Storage keys wahi hain jo purane app mein the.
 *  - Login beech mein expire ho jaye to ek baar refresh karke dobara try, warna "login expired".
 *
 * Keys: .env.local mein NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_KEY.
 * Sirf publishable (browser-safe) key yahan aati hai — secret / service_role key KABHI nahi.
 */
import { createClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://edibibytqfrrxfztukpm.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "sb_publishable_3tB8b43BqyJSO6_5HIVbTw_d5QOZqDf";

/* purane auth.js: creator = base key, baaki doors = base + "-<door>" */
const KEY_BASE = (() => {
  try {
    return "sb-" + new URL(SUPABASE_URL).hostname.split(".")[0] + "-auth-token";
  } catch {
    return "sb-auth-token";
  }
})();
export const DOORS = ["creator", "brand", "admin", "owner"];
export const storageKeyFor = (door) => (door === "creator" ? KEY_BASE : `${KEY_BASE}-${door}`);

const lapsed = (e) =>
  !!e && (/permission denied for schema api|jwt expired|invalid jwt|not authenticated/i.test(String(e.message || "")) || ["PGRST301", "PGRST303"].includes(e.code));

const clients = {};

/** Ek door ka Supabase client (browser mein ek hi baar banta hai) */
export function sbFor(door = "creator") {
  if (!DOORS.includes(door)) door = "creator";
  if (clients[door]) return clients[door];
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: storageKeyFor(door), detectSessionInUrl: false },
  });

  // login chupke se expire ho gaya → ek baar refresh + retry (purane guardSession jaisa)
  const retrying = (call) =>
    async function (...args) {
      let r = await call(...args);
      if (r && lapsed(r.error)) {
        const { data } = await sb.auth.refreshSession().catch(() => ({ data: {} }));
        if (data && data.session) r = await call(...args);
        else {
          r = { data: null, error: { message: "Your login expired — please sign in again.", code: "SESSION_EXPIRED" } };
          try {
            window.dispatchEvent(new CustomEvent("geek-session-expired", { detail: { door } }));
          } catch {
            /* ignore */
          }
        }
      }
      return r;
    };
  const rawRpc = sb.rpc.bind(sb);
  sb.rpc = retrying((fn, a, o) => rawRpc(fn, a, o));
  const rawSchema = sb.schema.bind(sb);
  sb.schema = (name) => {
    const c = rawSchema(name);
    const raw = c.rpc.bind(c);
    c.rpc = retrying((fn, a, o) => raw(fn, a, o));
    return c;
  };
  clients[door] = sb;
  return sb;
}

/**
 * RPC call. Purane app mein do tarah ki calls thi:
 *   sb.rpc("x")                → public schema   → rpc(door, "x", args)
 *   sb.schema("api").rpc("x")  → api schema      → rpc(door, "api.x", args)
 * Hamesha { data, error } lautata hai (throw nahi karta).
 */
export async function rpc(door, fn, args = {}) {
  const sb = sbFor(door);
  const [schema, name] = fn.includes(".") ? fn.split(".") : [null, fn];
  try {
    return schema ? await sb.schema(schema).rpc(name, args) : await sb.rpc(name, args);
  } catch (e) {
    return { data: null, error: { message: e?.message || String(e) } };
  }
}

/** Edge function call — error mein function ka apna message (purane fnError jaisa) */
export async function invoke(door, name, body = {}) {
  const sb = sbFor(door);
  try {
    const { data, error } = await sb.functions.invoke(name, { body });
    if (error) return { data: null, error: { message: await fnError(error) } };
    if (data && data.error) return { data, error: { message: String(data.error) } };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: e?.message || String(e) } };
  }
}
async function fnError(error) {
  try {
    const b = await error.context.json();
    const m = b && (b.error || b.message);
    const d = b && b.detail;
    const dm = typeof d === "string" ? d : d && (d.error_user_msg || d.message || (d.error && d.error.message));
    if (typeof m === "string") return dm && typeof dm === "string" && dm !== m ? `${m} — ${dm}` : m;
  } catch {
    /* ignore */
  }
  return (error && error.message) || String(error);
}

/** Supabase ka error → seedhi English line */
export function errText(e) {
  if (!e) return "";
  const m = String(e.message || e);
  if (/failed to fetch|network/i.test(m)) return "No internet connection — please try again.";
  // Database ki technical lines user ko seedhi na dikhen
  if (/invalid input syntax for type uuid/i.test(m)) return "This link isn't valid — we couldn't find that item.";
  if (/jwt expired|invalid jwt|not authenticated/i.test(m)) return "Your session has ended — please sign in again.";
  if (/permission denied|row-level security/i.test(m)) return "You don't have access to this.";
  if (/function .* does not exist|could not find the function/i.test(m)) return "This feature isn't available right now.";
  return m;
}

/* useRpc ka memory cache (sirf is browser tab mein, refresh par khali) — door|fn|args → data */
const RPC_CACHE = new Map();
/** Is door ka cache saaf (logout par — doosre user ko pichla data na dikhe) */
export function clearRpcCache(door) {
  for (const k of [...RPC_CACHE.keys()]) if (!door || k.startsWith(door + "|")) RPC_CACHE.delete(k);
}

/**
 * Screen ke liye data hook:
 *   const { data, error, loading, reload } = useRpc("admin", "api.admin_campaigns", { p_status: "live" })
 * args badalte hi dobara load. `skip: true` = abhi mat chalao.
 */
export function useRpc(door, fn, args = {}, { skip = false, refreshMs = 0 } = {}) {
  const key = JSON.stringify(args);
  const ck = `${door}|${fn}|${key}`;
  // Pichli baar ka data turant dikhao (tab / page wapas khulne par "Loading…" flash nahi), phir chupchaap naya laao
  const [st, setSt] = useState(() => (!skip && RPC_CACHE.has(ck) ? { data: RPC_CACHE.get(ck), error: null, loading: false } : { data: null, error: null, loading: !skip }));
  const alive = useRef(true);
  const load = useCallback(
    async (quiet = false) => {
      if (skip) return;
      if (!quiet) setSt((s) => (RPC_CACHE.has(ck) ? { data: RPC_CACHE.get(ck), error: null, loading: false } : { ...s, loading: true }));
      const r = await rpc(door, fn, JSON.parse(key));
      if (!r.error) RPC_CACHE.set(ck, r.data);
      if (alive.current) setSt({ data: r.data, error: r.error, loading: false });
      return r;
    },
    [door, fn, key, ck, skip]
  );
  useEffect(() => {
    alive.current = true;
    load();
    let t;
    if (refreshMs) t = setInterval(() => document.visibilityState === "visible" && load(true), refreshMs);
    return () => {
      alive.current = false;
      if (t) clearInterval(t);
    };
  }, [load, refreshMs]);
  return { ...st, reload: load };
}

/** Logout sirf IS door ka, sirf is browser mein (purane jaisa "local") */
export async function signOutDoor(door) {
  clearRpcCache(door);
  try {
    await sbFor(door).auth.signOut({ scope: "local" });
  } catch {
    /* ignore */
  }
}
