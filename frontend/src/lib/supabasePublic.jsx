/**
 * Supabase — public (bina login) calls.
 * Live app wala hi project + publishable key (ye browser ke liye safe hai, live app mein bhi khula hai).
 * .env.local mein NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_KEY daal do to wahi use hoga.
 * service_role / secret keys yahan KABHI nahi aati.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://edibibytqfrrxfztukpm.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "sb_publishable_3tB8b43BqyJSO6_5HIVbTw_d5QOZqDf";

/** public schema ka RPC — jaise rpc("public_profile", { p_username: "x" }) */
export async function rpc(fn, args = {}, { keepalive = false } = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    keepalive,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`${fn} failed (${r.status})`);
  return r.json();
}

/** browser ka anonymous visitor id (link click ginne ke liye) */
export function visitorId() {
  try {
    let v = localStorage.getItem("gk_v");
    if (!v) {
      v = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("gk_v", v);
    }
    return v;
  } catch {
    return "";
  }
}

export const deviceKind = () => (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop");

/** sirf http(s) / relative links — javascript: wagera block */
export function safeUrl(u) {
  if (u == null) return "#";
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s) || s.startsWith("/") || s.startsWith("#")) return s;
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/?#]|$)/i.test(s)) return "https://" + s;
  return "#";
}

export const fmtNum = (n) => (Number(n) || 0).toLocaleString("en-IN");
