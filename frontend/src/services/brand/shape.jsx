/**
 * Brand ke pure helpers (approvals / campaigns / reports / facebook / instagram pages ke liye) — koi Supabase call nahi, koi React nahi.
 * Purane brand-portal.js ke TYPE / STATUS / STEPS / count / total / short / n / date / embedUrl ka naya ghar,
 * plus Figma cards ke liye real data → UI shape (rang, initials, funnel).
 * Naam "b…" se shuru — taaki dusri brand files ke helpers se takraayein nahi.
 */

/* ---------- labels (purane brand-portal.js TYPE / STATUS / STEPS / RS) ---------- */
export const B_TYPE = { paid: "💰 Paid", barter: "🎁 Barter", barter_paid: "🎁 Barter + 💰 Paid" };
export const B_TYPE_SHORT = { paid: "Paid", barter: "Barter", barter_paid: "Barter + Paid" };
export const B_STATUS = { creator_discovery: "Live · taking creators", in_execution: "Live · in progress", completed: "Completed", draft: "Draft", paused: "Paused", closed: "Closed" };
export const B_STEPS = [
  ["to_approve", "To approve"],
  ["approved", "Approved"],
  ["shipped", "Shipped / making"],
  ["video_review", "Video review"],
  ["posting", "Posting"],
  ["posted", "Posted"],
];
/** campaign request ka status brand ke shabdon mein (purana RS) */
export const B_REQ = { new: "Sent", in_review: "Geek team is working on it", converted: "Set up ✓", declined: "Not taken up" };

/** campaign ke counts se ek step ki ginti (purana count) */
export const bCount = (c, k) => {
  const x = (c && c.counts) || {};
  return k === "shipped" ? (x.shipped || 0) + (x.making || 0) : x[k] || 0;
};
/** campaign ke kul creators (not_selected chhod ke) — purana total */
export const bTotal = (c) => {
  const x = (c && c.counts) || {};
  return Object.keys(x).reduce((t, k) => (k === "not_selected" ? t : t + (x[k] || 0)), 0);
};

/** lifecycle status → Figma ka bucket (live / review / completed) */
export const bBucket = (s) => (["completed", "closed"].includes(s) ? "completed" : ["draft", "paused"].includes(s) ? "review" : "live");

/* ---------- numbers & dates (purane short / n / date / fmtDateTime) ---------- */
/** 12400 → "12.4K" (purana short) */
export function bShort(v) {
  if (v == null || v === "" || isNaN(Number(v))) return "—";
  const x = Number(v);
  const a = Math.abs(x);
  if (a >= 1e7) return (x / 1e7).toFixed(a >= 1e8 ? 0 : 1).replace(/\.0$/, "") + "Cr";
  if (a >= 1e6) return (x / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return (x / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, "") + "K";
  return String(Math.round(x));
}
/** 12400 → "12,400" (purana n) */
export const bNum = (v) => (v == null || v === "" || isNaN(Number(v)) ? "—" : Number(v).toLocaleString("en-IN"));
/** ₹ Indian format (tracking.js inr) */
export const bInr = (v) => (v == null || v === "" ? "—" : "₹" + Math.round(Number(v) || 0).toLocaleString("en-IN"));
/** "2026-11-15" → "15 Nov 2026" (purana date) */
export function bDate(d, withYear = true) {
  if (!d) return "—";
  const x = new Date(d);
  if (isNaN(x)) return "—";
  return x.toLocaleDateString("en-IN", withYear ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" });
}
/** date + time (purana fmtDateTime) */
export function bWhen(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (isNaN(x)) return "—";
  return x.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
/** "3 h ago" — `now` bahar se do (render mein Date.now() mana hai) */
export function bAgo(d, now) {
  if (!d || !now) return d ? bDate(d, false) : "—";
  const s = Math.max(0, (now - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return bDate(d, false);
}
/** campaign ki dates "12 Oct – 6 Nov 2026" */
export function bRange(a, b) {
  if (!a && !b) return "Dates not set yet";
  if (a && !b) return `From ${bDate(a)}`;
  if (!a && b) return `Till ${bDate(b)}`;
  return `${bDate(a, false)} – ${bDate(b)}`;
}
/** engagement on views (purana er): (likes+comments+shares+saves) / views */
export function bEr(t) {
  const v = Number((t && t.views) || 0);
  if (!v) return "—";
  const e = ["likes", "comments", "shares", "saves"].reduce((a, k) => a + (Number(t[k]) || 0), 0);
  return ((e * 100) / v).toFixed(1) + "%";
}

/* ---------- rang / initials (Figma avatars aur covers ke liye — id se hamesha wahi rang) ---------- */
const GRADS = [
  ["linear-gradient(120deg,#ff2d78 0%,#ff5f6d 45%,#ffa94d 100%)", "linear-gradient(110deg,#ff2d78 0%,#d63fa8 55%,#8b5cf6 100%)"],
  ["linear-gradient(120deg,#0f1030 0%,#23306b 50%,#4f7cff 100%)", "linear-gradient(110deg,#0f1030 0%,#23306b 55%,#4f7cff 100%)"],
  ["linear-gradient(120deg,#21c38a 0%,#7ae3bb 100%)", "linear-gradient(110deg,#0fa679 0%,#21c38a 50%,#14b8c4 100%)"],
  ["linear-gradient(120deg,#c026d3 0%,#e879f9 55%,#fb7185 100%)", "linear-gradient(110deg,#a21caf 0%,#d946ef 55%,#fb7185 100%)"],
  ["linear-gradient(120deg,#e5484d 0%,#ff8fa3 100%)", "linear-gradient(110deg,#e5484d 0%,#ff6b81 55%,#ff9ab0 100%)"],
  ["linear-gradient(120deg,#f59e0b 0%,#fbbf24 100%)", "linear-gradient(110deg,#f59e0b 0%,#fb923c 55%,#fbbf24 100%)"],
];
const AVS = [
  "linear-gradient(135deg,#ff3d7f,#ff7aa8)",
  "linear-gradient(135deg,#5b8cff,#9db8ff)",
  "linear-gradient(135deg,#21c38a,#7ae3bb)",
  "linear-gradient(135deg,#8b5cf6,#c084fc)",
  "linear-gradient(135deg,#ffb15c,#ffd29a)",
  "linear-gradient(135deg,#0ea5e9,#7dd3fc)",
];
const hash = (s) => String(s || "").split("").reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
/** campaign card ka cover (gradient) */
export const bGrad = (id) => GRADS[hash(id) % GRADS.length][0];
/** campaign hero ka gradient */
export const bHero = (id) => GRADS[hash(id) % GRADS.length][1];
/** avatar ka rang */
export const bAv = (seed) => AVS[hash(seed) % AVS.length];
/** "Meera Iyer" → "MI" */
export function bInitials(name) {
  const w = String(name || "?")
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return ((w[0] || "?")[0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
}
/** creator card (ci_brand_card) → Figma avatar/naam/handle */
export function bWho(cr) {
  cr = cr || {};
  const name = cr.name || cr.username || "Creator";
  return {
    name,
    handle: cr.username ? "@" + cr.username : "",
    initials: bInitials(name),
    av: bAv(cr.username || name),
    pic: cr.profile_picture_url || "",
    followers: cr.followers != null ? bShort(cr.followers) : "—",
    city: cr.city || "",
  };
}

/* ---------- stage (brand ke shabdon mein) → Figma badge ---------- */
export const B_STAGE_TONE = { to_approve: "red", approved: "violet", shipped: "blue", making: "blue", video_review: "orange", posting: "green", posted: "green", invited: "grey", not_selected: "grey" };

/* ---------- campaign → Figma card / hero shape ---------- */
/** api.brand_portal ka campaign row → campaigns list / reports card */
export function bCampaignCard(c) {
  const total = bTotal(c);
  const need = Number(c.creators_needed) || 0;
  return {
    id: c.campaign_id,
    title: c.name || "Campaign",
    status: bBucket(c.status),
    statusLabel: B_STATUS[c.status] || c.status || "",
    dates: bRange(c.starts_on, c.ends_on),
    product: c.product || "",
    type: B_TYPE_SHORT[c.campaign_type] || "",
    creators: total,
    toApprove: bCount(c, "to_approve"),
    videoReview: bCount(c, "video_review"),
    posted: bCount(c, "posted"),
    posts: Number(c.posts) || 0,
    planned: Math.max(need, total, 1),
    gradient: bGrad(c.campaign_id),
    hero: bHero(c.campaign_id),
    raw: c,
  };
}

/** api.brand_campaign ({campaign, creators}) → CampaignTop ka shape */
export function bCampaignHead(d, now) {
  const c = (d && d.campaign) || {};
  const rows = (d && d.creators) || [];
  const step = (r) => Number((r.status || {}).step) || 0;
  const key = (r) => (r.status || {}).key;
  const live = rows.filter((r) => key(r) !== "not_selected");
  const ends = c.ends_on ? new Date(c.ends_on).getTime() : 0;
  return {
    id: c.campaign_id,
    title: c.name || "Campaign",
    status: bBucket(c.status),
    statusLabel: B_STATUS[c.status] || c.status || "",
    dates: bRange(c.starts_on, c.ends_on),
    daysLeft: now && ends ? Math.max(0, Math.ceil((ends - now) / 86400000)) : 0,
    product: c.product || "Product to be confirmed",
    deliver: bLines(c.deliverables_text).join(" + ") || "Deliverables in the brief",
    budget: B_TYPE[c.campaign_type] || "",
    hero: bHero(c.campaign_id),
    creators: live.length,
    activity: ((d && d.timeline) || []).length,
    funnel: {
      invited: live.length,
      applied: live.filter((r) => key(r) !== "invited").length,
      approved: live.filter((r) => step(r) >= 2).length,
      videoOk: live.filter((r) => step(r) >= 5).length,
      live: live.filter((r) => key(r) === "posted").length,
    },
  };
}

/** post ke stats ka jod (views / likes / …) */
export function bSum(posts, k) {
  return (posts || []).reduce((a, p) => a + (Number(((p && p.stats) || {})[k]) || 0), 0);
}

/* ---------- video link → player (purana embedUrl) ---------- */
export function bEmbed(u) {
  u = String(u || "");
  let m;
  if ((m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/))) return { kind: "frame", src: "https://drive.google.com/file/d/" + m[1] + "/preview" };
  if ((m = u.match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/))) return { kind: "frame", src: "https://www.instagram.com/" + (m[1] === "reels" ? "reel" : m[1]) + "/" + m[2] + "/embed", tall: true };
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/))) return { kind: "frame", src: "https://www.youtube.com/embed/" + m[1] };
  if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(u) || /\/storage\/v1\/object\//.test(u)) return { kind: "video", src: u };
  return null;
}

/** text (lines / commas) → list — brief ke dos / donts / messages */
export function bLines(t) {
  if (Array.isArray(t)) return t.map(String).filter(Boolean);
  return String(t || "")
    .split(/\r?\n|•/)
    .map((x) => x.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
}
