"use client";

/**
 * Super Admin login — purane login.js jaisa:
 *  email + password (Supabase Auth) → phir database se pucho "kya ye platform admin hai?" (is_platform_admin).
 *  Admin nahi hai to turant logout + error. Browser kabhi decide nahi karta — database karta hai.
 */
import { sbFor, rpc, signOutDoor } from "@/lib/supabase";

const DOOR = "admin";
const MEMO = "geek_admin_ok"; // is tab mein check ho chuka (har page par dobara network call na ho)

export async function adminSignIn(email, password) {
  const sb = sbFor(DOOR);
  const { error } = await sb.auth.signInWithPassword({ email: String(email).trim().toLowerCase(), password });
  if (error) throw new Error(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
  const { data: isAdmin, error: e2 } = await rpc(DOOR, "is_platform_admin");
  if (e2 || isAdmin !== true) {
    await signOutDoor(DOOR);
    throw new Error(e2 ? e2.message : "This account is not a Super Admin.");
  }
  try {
    sessionStorage.setItem(MEMO, "1");
  } catch {
    /* ignore */
  }
  return true;
}

/** Login hai + admin hai? → { ok, user, name } */
export async function adminCheck() {
  const sb = sbFor(DOOR);
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return { ok: false };
  let ok = false;
  try {
    ok = sessionStorage.getItem(MEMO) === "1";
  } catch {
    /* ignore */
  }
  if (!ok) {
    const { data } = await rpc(DOOR, "is_platform_admin");
    ok = data === true;
    if (ok) {
      try {
        sessionStorage.setItem(MEMO, "1");
      } catch {
        /* ignore */
      }
    }
  }
  if (!ok) return { ok: false };
  const u = session.user;
  const md = u.user_metadata || {};
  let name = md.full_name || "";
  const { data: me } = await sb.from("members").select("name,email").eq("id", u.id).maybeSingle();
  if (me?.name) name = me.name;
  return { ok: true, user: u, name: name || (u.email || "").split("@")[0], email: u.email };
}

export async function adminSignOut() {
  try {
    sessionStorage.removeItem(MEMO);
  } catch {
    /* ignore */
  }
  await signOutDoor(DOOR);
}
