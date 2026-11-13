"use client";

/**
 * Brand services ki neev — door, Supabase client, api() wrappers aur chhote utils.
 * Sirf services/brand/* isse import karte hain; pages kabhi seedha nahi.
 * Har call ka return wahi { data, error } jo lib/supabase ka rpc / invoke deta hai.
 */
import { sbFor, rpc, invoke } from "@/lib/supabase";

/** Brand ka Supabase door (purane app ka "brand" login — apni storage key "<base>-brand") */
export const DOOR = "brand";

/** Brand door ka Supabase client */
export const sb = () => sbFor(DOOR);

/** public.* RPC (jaise my_discovery_connection) → { data, error } */
export const call = (fn, args = {}) => rpc(DOOR, fn, args);

/** api.* RPC (purane brand-portal.js ka api()) → { data, error } */
export const api = (fn, args = {}) => rpc(DOOR, `api.${fn}`, args);

/** Edge function (brand-fb-login, brand-billing, brand-facebook …) → { data, error } */
export const fn = (name, body = {}) => invoke(DOOR, name, body);

/** sessionStorage — private mode / SSR mein chupchaap fail */
export const ss = {
  get(k) {
    try {
      return window.sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      window.sessionStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  del(k) {
    try {
      window.sessionStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

/** Supabase error → throw (jahan page try/catch se message dikhata hai) */
/** localStorage — private mode / SSR mein chupchaap fail */
export const ls = {
  get(k) {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      window.localStorage.setItem(k, v);
    } catch {
      /* private mode */
    }
  },
  del(k) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

export function must(r) {
  if (r && r.error) throw new Error(r.error.message || String(r.error));
  return r ? r.data : null;
}
export { errText } from "@/lib/supabase";
