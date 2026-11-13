"use client";

/**
 * Creators section — Supabase se asli data (purane app ke Super Admin → Creators jaisa).
 *  - useCreatorsList(): admin_creators + admin_ig_accounts + admin_creator_facts (merge, har 30 sec)
 *  - useCreatorProfile(id): admin_creator_profile (360° drawer)
 *  - useMsgPause(): admin_msg_pauses / admin_msg_pause (WhatsApp + email ek switch)
 * Koi naya RPC nahi — wahi calls jo purana app karta tha.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { rpc, useRpc } from "@/lib/supabase";
export { errText } from "@/lib/supabase";

/* ---------- chhote format helpers (purane app jaise) ---------- */
export const kNum = (n) => (n == null || n === "" ? "—" : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(n));
export const agoTxt = (t) => {
  if (!t) return "—";
  const m = Math.round((Date.now() - new Date(t).getTime()) / 60000);
  return m < 2 ? "just now" : m < 60 ? m + "m ago" : m < 1440 ? Math.round(m / 60) + "h ago" : m < 43200 ? Math.round(m / 1440) + "d ago" : Math.round(m / 43200) + "mo ago";
};
export const fmtDate = (t) => (t ? new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const fmtDay = (t) => (t ? new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—");
export const fmtDateTime = (t) =>
  t ? new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).replace(/\s?(am|pm)/i, (x) => " " + x.trim().toLowerCase()) : "—";
export const cap1 = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "");
export const fmtMoney = (n) => (n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN"));
export const uaShort = (ua) => {
  ua = String(ua || "");
  if (!ua) return "";
  const os = /Android/i.test(ua) ? "Android" : /iPhone/i.test(ua) ? "iPhone" : /iPad/i.test(ua) ? "iPad" : /Mac OS X|Macintosh/i.test(ua) ? "Mac" : /Windows/i.test(ua) ? "Windows" : /Linux/i.test(ua) ? "Linux" : "";
  const br = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return [os, br].filter(Boolean).join(" · ") || ua.slice(0, 40);
};
export const csv = (rows, cols, file) => {
  const cell = (v) => {
    v = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  const text = [cols.join(",")].concat(rows.map((r) => cols.map((k) => cell(r[k])).join(","))).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  a.download = file;
  a.click();
};
export const CSV_COLS = ["name", "ig_username", "followers", "engagement", "whatsapp", "email", "city", "state", "categories", "gender", "accepts_barter", "reel_rate", "done", "total", "applied", "approved", "completed", "joined_at", "last_seen"];

/* ---------- Creators list ---------- */
export function useCreatorsList() {
  const [st, setSt] = useState({ all: [], loading: true, error: null });
  const load = useCallback(async (quiet) => {
    if (!quiet) setSt((s) => ({ ...s, loading: !s.all.length }));
    const [a, ig, fx] = await Promise.all([rpc("admin", "admin_creators"), rpc("admin", "admin_ig_accounts"), rpc("admin", "admin_creator_facts")]);
    if (a.error) return setSt((s) => ({ ...s, loading: false, error: a.error }));
    const IGM = (ig && ig.data) || {};
    const FX = (fx && fx.data) || {};
    setSt({ all: (a.data || []).map((c) => ({ ...c, ...(FX[c.member_id] || {}), ig_accounts: IGM[c.member_id] || [] })), loading: false, error: null });
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === "visible" && !document.querySelector(".cdw-wrap") && load(true), 30000);
    return () => clearInterval(t);
  }, [load]);
  return { ...st, reload: load };
}

/** Purane app ke counters (Creators page ke upar wale boxes) */
export function creatorCounts(all) {
  const n = (f) => all.filter(f).length;
  return {
    total: all.length,
    ig: n((c) => c.ig_username),
    complete: n((c) => c.complete),
    incomplete: n((c) => !c.complete),
    barter: n((c) => c.accepts_barter),
    rate: n((c) => c.reel_rate),
    applied: n((c) => c.applied > 0),
    approved: n((c) => c.approved > 0),
    multi: n((c) => (c.ig_accounts || []).length > 1),
  };
}

/** Ek creator → table / card row */
export function rowOf(c) {
  const accts = Math.max((c.ig_accounts || []).length, c.ig_username ? 1 : 0);
  return {
    id: c.member_id,
    raw: c,
    name: c.name || "Creator",
    handle: c.ig_username ? "@" + c.ig_username : "Instagram not connected",
    followers: kNum(c.followers),
    eng: c.engagement != null ? c.engagement + "%" : "—",
    reel: c.reel_rate ? "₹" + kNum(Number(c.reel_rate)) : "—",
    applied: `${c.applied || 0}/${c.approved || 0}`,
    city: c.city ? [c.city, c.state].filter(Boolean).join(", ") : "—",
    category: (c.categories || [])[0] ? cap1((c.categories || [])[0]) : "—",
    ig: !!c.ig_username,
    igCount: accts,
    complete: !!c.complete,
    score: c.complete ? "Ready" : `${c.done ?? 0}/${c.total ?? "?"}`,
    wa: !!c.wa_verified,
    pic: c.pic || "",
  };
}

const since = (t) => (t ? (Date.now() - new Date(t).getTime()) / 864e5 : Infinity);
/** List page ke search (naam, @handle, city, niche, phone…) — purane filteredCreators jaisa */
export const matchQ = (c, q) =>
  !q ||
  [c.name, c.ig_username, (c.ig_accounts || []).map((a) => a.username).join(" "), c.city, c.state, c.whatsapp, c.email, (c.categories || []).join(" "), (c.skills || []).join(" ")]
    .join(" ")
    .toLowerCase()
    .includes(q.toLowerCase());

/* Cards page ke 12 filters — Figma ke labels, purane app ke rules */
export const CARD_FILTERS = [
  ["Profile", ["Any", "Complete", "Incomplete"], (c, v) => (v === "Complete" ? !!c.complete : !c.complete)],
  ["Instagram", ["Any", "Connected", "Not connected", "2+ accounts"], (c, v) => (v === "Connected" ? !!c.ig_username : v === "Not connected" ? !c.ig_username : (c.ig_accounts || []).length > 1)],
  ["Barter & rates", ["Any", "Open to barter", "Reel rate added", "No rate yet"], (c, v) => (v === "Open to barter" ? !!c.accepts_barter : v === "Reel rate added" ? !!c.reel_rate : !c.reel_rate)],
  ["WhatsApp", ["Any", "ON", "OFF"], (c, v) => (v === "ON" ? !!c.wa_verified : !c.wa_verified)],
  ["Last active", ["Any", "Today", "This week", "This month", "30+ days ago", "Never"], (c, v) =>
    v === "Never" ? !c.last_seen : v === "30+ days ago" ? c.last_seen && since(c.last_seen) > 30 : since(c.last_seen) <= { Today: 1, "This week": 7, "This month": 30 }[v]],
  ["Joined", ["Any", "Today", "This week", "This month"], (c, v) => since(c.joined_at) <= { Today: 1, "This week": 7, "This month": 30 }[v]],
  ["Joined via", ["Any", "Website", "Bulk upload", "Invite"], (c, v) => {
    const h = (c.joined_via && c.joined_via.how) || "";
    return v === "Website" ? !h : v === "Bulk upload" ? /bulk/.test(h) : /invite/.test(h);
  }],
  ["Campaigns", ["Any", "Applied", "Waiting for approval", "Approved", "Completed", "None"], (c, v) =>
    v === "None" ? !c.applied : v === "Applied" ? c.applied > 0 : v === "Waiting for approval" ? c.pending > 0 : v === "Approved" ? c.approved > 0 : c.completed > 0],
  ["State", null, (c, v) => String(c.state || "").toLowerCase() === v.toLowerCase()],
  ["Language", null, (c, v) => (c.languages || []).some((x) => String(x).toLowerCase() === v.toLowerCase())],
  ["Marital status", ["Any", "Single", "Married"], (c, v) => String(c.marital || "").toLowerCase() === v.toLowerCase()],
  ["Blocklist", ["Any", "Not blocked", "Blocked"], (c, v) => (v === "Blocked" ? !!c.blocked : !c.blocked)],
];
/** State / Language ke options data se */
export function filterOptions(all, label) {
  const uniq = (f) => [...new Set(all.flatMap(f).filter(Boolean).map((x) => cap1(String(x).trim())))].sort((a, b) => a.localeCompare(b));
  if (label === "State") return ["Any", ...uniq((c) => [c.state])];
  if (label === "Language") return ["Any", ...uniq((c) => c.languages || [])];
  return ["Any"];
}

export const CARD_SORTS = {
  "Newest first": (a, b) => new Date(b.joined_at || 0) - new Date(a.joined_at || 0),
  "Oldest first": (a, b) => new Date(a.joined_at || 0) - new Date(b.joined_at || 0),
  "Most followers": (a, b) => (b.followers || 0) - (a.followers || 0),
  "Best engagement": (a, b) => (b.engagement || 0) - (a.engagement || 0),
  "Highest reel rate": (a, b) => (+b.reel_rate || 0) - (+a.reel_rate || 0),
  "Most applied": (a, b) => (b.applied || 0) - (a.applied || 0),
  "Recently active": (a, b) => new Date(b.last_seen || 0) - new Date(a.last_seen || 0),
  "Name A–Z": (a, b) => String(a.name || "").localeCompare(String(b.name || "")),
};

/* ---------- Creator 360° (drawer) ---------- */
const L = { prefer_not_to_say: "Prefer not to say", single: "Unmarried", married: "Married", divorced: "Divorced", widowed: "Widowed", non_binary: "Non-binary", female: "Female", male: "Male", other: "Other" };
const STAGE = {
  applied: ["Applied", "orange"], eligible: ["Eligible", "orange"], invited: ["Invited", "orange"], sent_to_brand: ["Sent to brand", "orange"], shortlisted: ["Shortlisted", "violet"],
  approved: ["Approved", "violet"], contract_sent: ["Contract sent", "violet"], contract_signed: ["Contract signed", "violet"], address_pending: ["Address pending", "orange"],
  product_shipped: ["Product shipped", "violet"], delivered: ["Delivered", "violet"], content_pending: ["Video pending", "orange"], content_submitted: ["Video submitted", "violet"],
  content_approved: ["Video approved", "green"], posted: ["Posted", "green"], completed: ["Completed", "green"], rejected: ["Rejected", "red"], dropped: ["Dropped", "red"],
  ineligible: ["Not eligible", "red"], brand_declined: ["Brand declined", "red"],
};
export const stageOf = (s) => STAGE[s] || [cap1(String(s || "").replace(/_/g, " ")) || "—", ""];

/** admin_creator_profile → drawer ka `p` (wahi shape jo tabs use karte hain) */
export function profileView(id, D) {
  D = D || {};
  const mem = D.member || {}, ig = D.instagram || {}, per = D.personal || {}, con = D.contact || {}, cp = D.commercial_preference || {}, pro = D.professional || {}, req = D.requirements || {};
  const name = mem.name || [per.first_name, per.last_name].filter(Boolean).join(" ") || ig.username || "Creator";
  const synthetic = /@creators\.bountythreads\.app$/i.test(con.email || "");
  const age = per.date_of_birth ? Math.floor((Date.now() - new Date(per.date_of_birth).getTime()) / 31557600000) : null;
  const wa = con.whatsapp_e164 || mem.whatsapp || "";
  const media = ig.media || [];
  const eng = ig.followers && media.length ? ((media.reduce((s, m) => s + (m.likes || 0) + (m.comments || 0), 0) / media.length / ig.followers) * 100).toFixed(2) + "%" : "—";
  const addr = (D.addresses || []).find((a) => a.is_default) || (D.addresses || [])[0];
  const pets = (D.pets || []).map((x) => `🐾 ${x.name} (${x.pet_type})`).join(" · ");
  const rate = (D.rate_items || []).find((i) => /reel/i.test(i.deliverable_type || ""));
  const yn = (v) => (v === true ? "Yes" : v === false ? "No" : "—");
  return {
    id,
    raw: D,
    identity: D.identity_id,
    name,
    handle: ig.username ? "@" + ig.username : "",
    igUser: ig.username || "",
    pic: ig.pic || "",
    followers: kNum(ig.followers),
    joined: fmtDate(mem.joined_at),
    status: mem.status || "",
    score: !D.identity_id ? "No profile yet" : req.complete ? "complete" : `${req.done ?? 0}/${req.total ?? "?"}`,
    whatsapp: wa,
    email: !synthetic && con.email ? con.email : "",
    missing: !req.complete && (req.missing || []).length ? req.missing.join(" · ") : "",
    noProfile: !D.identity_id,
    personal: [
      ["Name", [per.first_name, per.last_name].filter(Boolean).join(" ") || "—"],
      ["Gender", L[per.gender] || per.gender || "—"],
      ["Birthday", per.date_of_birth ? `${fmtDate(per.date_of_birth)}${age != null ? ` · ${age} yrs` : ""}` : "—"],
      ["Marital status", L[per.marital_status] || per.marital_status || "—"],
      ["Pets", per.has_pet === false ? "No" : pets || (per.has_pet ? `${per.pet_name || ""} (${per.pet_type || ""})` : "—")],
    ],
    contact: [
      ["WhatsApp", wa ? `${wa}${con.whatsapp_verified_at || mem.whatsapp ? " · verified" : ""}` : "—"],
      ["Backup email", !synthetic && con.email ? `${con.email}${con.email_verified_at ? " · verified" : " · not verified"}` : "—"],
      ["Home address", addr ? [addr.line1, addr.line2, addr.landmark, addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ") : "—"],
      ...(D.travel && D.travel.city ? [["Travelling to", [D.travel.city, D.travel.state].filter(Boolean).join(", ") + (D.travel.until_date ? ` · till ${fmtDate(D.travel.until_date)}` : "")]] : []),
    ],
    professional: [
      ["Niche", (pro.categories || []).join(", ") || "—"],
      ["Languages", (pro.languages || []).join(", ") || "—"],
      ["Content formats", (pro.content_formats || []).join(", ") || "—"],
      ["Open to barter", `${yn(cp.accepts_barter)}${rate ? ` · ${fmtMoney(rate.amount)} per Reel` : ""}`],
      ...(pro.city_coarse ? [["Primary city", [pro.city_coarse, pro.state_coarse].filter(Boolean).join(", ")]] : []),
      ...((D.skills || []).length ? [["Skills", D.skills.join(", ")]] : []),
      ...((D.fav_brands || []).length ? [["Favourite brands", D.fav_brands.join(", ")]] : []),
      ...((D.brands_worked || []).length ? [["Brands worked with", D.brands_worked.map((b) => b.brand).join(", ")]] : []),
    ],
    ig: {
      followers: kNum(ig.followers),
      following: kNum(ig.follows),
      posts: kNum(ig.media_count),
      eng,
      type: String(ig.account_type || "").replace(/_/g, " ").toLowerCase() || "account",
      connected: fmtDay(ig.connected_at),
      synced: agoTxt(ig.synced_at),
      bio: ig.biography || "",
      website: ig.website || "",
      avgReach: ig.avg_reach != null ? kNum(Math.round(ig.avg_reach)) : "—",
      media,
    },
    campaigns: (D.campaigns || []).map((c) => {
      const [label, tone] = stageOf(c.stage);
      return { id: c.participation_id, campaignId: c.campaign_id, name: [c.campaign || "Campaign", c.brand].filter(Boolean).join(" · "), applied: fmtDay(c.applied_at), step: label, result: c.reason || label, tone };
    }),
    marketplace: D.marketplace || [],
  };
}

export function useCreatorProfile(id) {
  return useRpc("admin", "admin_creator_profile", { p_member: id }, { skip: !id });
}

/* ---------- Messages pause (WhatsApp + email ek switch) ---------- */
export function useMsgPause() {
  const { data, reload } = useRpc("admin", "api.admin_msg_pauses", {});
  const z = useMemo(() => {
    const rows = (data && data.rows) || [];
    const d10 = (v) => String(v || "").replace(/\D/g, "").slice(-10);
    return { m: new Set(rows.map((x) => x.member).filter(Boolean)), p: new Set(rows.map((x) => d10(x.phone)).filter(Boolean)), d10 };
  }, [data]);
  const pausedFor = (o) => !!((o.member && z.m.has(o.member)) || (o.phone && z.p.has(z.d10(o.phone))));
  const toggle = async (o) => {
    const on = !pausedFor(o);
    const r = await rpc("admin", "api.admin_msg_pause", { p: { ...o, on } });
    if (!r.error) await reload(true);
    return { ...r, on };
  };
  return { pausedFor, toggle };
}
