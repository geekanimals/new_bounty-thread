"use client";

/**
 * Creator services ki neev — door, Supabase client, api() wrappers aur localStorage keys.
 * Sirf services/creator/* isse import karte hain; pages kabhi seedha nahi.
 * Har call ka return wahi { data, error } jo lib/supabase ka rpc / invoke deta hai.
 */
import { sbFor, rpc, invoke } from "@/lib/supabase";

/** Creator ka Supabase door (purane app ka "creator" login — apni hi storage key) */
export const DOOR = "creator";

/** Creator door ka Supabase client */
export const sb = () => sbFor(DOOR);

/** public.* RPC (jaise campaign_covers, wa_set_opt_out) → { data, error } */
export const call = (fn, args = {}) => rpc(DOOR, fn, args);

/** api.* RPC (purane app ka api schema) → { data, error } */
export const api = (fn, args = {}) => rpc(DOOR, `api.${fn}`, args);

/** Edge function (wa-otp-start, instagram-dm …) → { data, error } */
export const fn = (name, body = {}) => invoke(DOOR, name, body);

/** Login user ki id (session se) — nahi to null */
export async function myUserId() {
  try {
    const {
      data: { session },
    } = await sb().auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

// WhatsApp/email se login kiye creator ki "creator identity" pehli baar banti hai — purane apiCreator jaisa:
// "no creator identity" aaye to bootstrap_my_profile karke ek baar dobara try
let _idBoot = null;
const noIdentity = (e) => !!e && /no creator identity|not a creator/i.test(e.message || String(e));
/** api.* call jo creator identity na ho to bootstrap karke ek baar retry kare (purana apiCreator) */
export async function apiCreator(name, args = {}) {
  let r = await api(name, args);
  if (r && noIdentity(r.error)) {
    if (!_idBoot)
      _idBoot = api("bootstrap_my_profile", { p_correlation: "ui-ops" }).then((b) => {
        if (b.error) {
          _idBoot = null;
          throw b.error;
        }
        return true;
      });
    try {
      await _idBoot;
    } catch {
      return r;
    }
    r = await api(name, args);
  }
  return r;
}

/* ---------- localStorage keys (purane app wale hi — naam mat badlo, purane users ka data inhi mein hai) ---------- */
export const K = {
  igLater: (id) => "bx_ig_later_" + (id || ""),
  kidSeen: (id) => "bx_sidekick_" + (id || ""),
  onbDone: (id) => "bx_onb_done_" + (id || ""),
  obCommercial: (id) => "ci_ob_commercial_" + (id || "me"),
  prefs: (id) => "bx_prefs_" + (id || "anon"),
  prefsLast: "bx_prefs_last",
  cinv: "geek_cinv",
  apply: "geek_apply",
  waAlerts: "bx_wa_alerts",
  oauthState: "geekos_oauth_state",
  afterIg: "geekos_after_ig",
  igConnected: "geekos_conn_instagram",
  uiFlags: "bounty_creator_ui",
};

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

/** Supabase error → throw (jahan page try/catch se message dikhata hai) */
export function must(r) {
  if (r && r.error) throw new Error(r.error.message || String(r.error));
  return r ? r.data : null;
}
export { errText } from "@/lib/supabase";
