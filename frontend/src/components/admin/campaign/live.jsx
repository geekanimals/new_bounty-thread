"use client";

/**
 * Campaigns — Supabase se juda hissa (purane app.js ke same rules / naam / RPC).
 * Campaign id = public.campaigns.id (purane app jaisa) — workspace ke saare api.* RPC isi id se chalte hain.
 */
import { useCallback, useEffect, useState } from "react";
import { sbFor } from "@/lib/supabase";

/* ---------- Types / status (app.js: CAMP_TYPES, BARTER_SUBTYPES, CAMP_STATUSES) ---------- */
export const CAMP_TYPES = [
  ["barter", "Barter"],
  ["paid", "Paid"],
  ["barter_paid", "Barter + Paid"],
];
export const BARTER_SUBTYPES = [
  ["normal_barter", "Normal"],
  ["celebrity_story", "Story"],
  ["pr_package", "PR package"],
];
export const CAMP_STATUSES = ["Draft", "Approval", "Live", "Shortlist completed", "Completed"];

export function campTypeLabel(t, st) {
  const T = Object.fromEntries(CAMP_TYPES);
  const S = Object.fromEntries(BARTER_SUBTYPES);
  return (T[t] || "") + (st && S[st] && (t !== "paid" || st === "celebrity_story") ? " · " + S[st] : "");
}
/** Figma jaisa chhota label — "Normal" barter subtype nahi dikhate */
export const typeShort = (t, st) => campTypeLabel(t, st).replace(" · Normal", "");
export function legacyTypeFor(t, st) {
  if (t === "paid") return "Paid Campaign";
  if (t === "barter_paid") return "Hybrid";
  return { celebrity_story: "Story", pr_package: "Product Seeding", normal_barter: "Mass Barter" }[st] || "Mass Barter";
}
export const campStatusPick = (st) => ({ Sourcing: "Live", "In Production": "Live", Approval: "Approval" })[st] || st || "Live";
export const campKind = (c) => c.campaign_type || (/hybrid/i.test(c.type || "") ? "barter_paid" : /paid|ugc/i.test(c.type || "") ? "paid" : "barter");
export const isCelebrityCamp = (c) => c.barter_subtype === "celebrity_story" || (!c.barter_subtype && /celebrity/i.test(c.type || ""));
export function campInBucket(c, b) {
  // Har type apne filter mein — "Barter + Paid" sirf apne alag filter mein aata hai (Paid / Barter mein nahi)
  if (b === "paid") return campKind(c) === "paid";
  if (b === "barter") return campKind(c) === "barter" && !isCelebrityCamp(c);
  if (b === "barter_paid") return campKind(c) === "barter_paid";
  return true;
}
const todayISO = () => new Date().toISOString().slice(0, 10);
/** status select ke options (campStatusOptions) → [[value, label]], selected */
export function campStatusOptions(cur, endDate) {
  const ended = !!endDate && endDate < todayISO();
  const pick = !cur && ended ? "Completed" : campStatusPick(cur);
  const list = [
    ["Draft", "Draft — not visible to creators"],
    ["Live", "Live — creators can apply"],
    ["Shortlist completed", "Shortlist completed — running, no new applications"],
  ];
  if (pick === "Approval") list.splice(1, 0, ["Approval", "Waiting for approval"]);
  if (ended || pick === "Completed") list.push(["Completed", "Completed" + (ended ? " — already ended" : "")]);
  const sel = list.some((x) => x[0] === pick) ? pick : ended ? "Completed" : "Live";
  return { list, sel };
}
export const statusTone = (s) => ({ Live: "green", Draft: "orange", Approval: "orange", "Shortlist completed": "violet", Completed: "" })[s] ?? "";

/* ---------- Deliverables / tags (parseDeliverablesText, splitTags) ---------- */
export const DELIV_KINDS = [
  ["reel", "Reel", "🎬", "Reels"],
  ["story", "Story", "⭕", "Stories"],
  ["post", "Post", "🖼️", "Posts"],
  ["carousel", "Carousel", "🗂️", "Carousels"],
];
export function parseDeliverablesText(t) {
  const out = { counts: {}, other: [] };
  String(t || "")
    .split(/\s*(?:\+|,|&|;|\n|\band\b)\s*/i)
    .map((x) => x.trim())
    .filter(Boolean)
    .forEach((part) => {
      const m = /^(\d+)\s*[x×]?\s*(.*)$/i.exec(part);
      const q = m ? Math.max(1, Math.min(20, parseInt(m[1]))) : 1;
      const lbl = (m ? m[2] : part).toLowerCase();
      const k = /reel/.test(lbl) ? "reel" : /stor/.test(lbl) ? "story" : /carousel/.test(lbl) ? "carousel" : /(post|static|feed)/.test(lbl) ? "post" : null;
      if (k) out.counts[k] = (out.counts[k] || 0) + q;
      else out.other.push(part);
    });
  return out;
}
export function deliverablesText(counts, other) {
  const parts = DELIV_KINDS.filter(([k]) => counts[k] > 0).map(([k, l, , pl]) => `${counts[k]} ${counts[k] > 1 ? pl : l}`);
  return parts.concat((other || []).filter(Boolean)).join(" + ");
}
export const delivChips = (t) => {
  const d = parseDeliverablesText(t);
  return DELIV_KINDS.filter(([k]) => d.counts[k])
    .map(([k, l, ic, pl]) => `${ic} ${d.counts[k]} ${d.counts[k] > 1 ? pl : l}`)
    .concat(d.other.map((o) => `📎 ${o}`))
    .join(" · ");
};
export function splitTags(t) {
  const toks = String(t || "")
    .split(/[\s,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  return {
    tags: [...new Set(toks.filter((x) => x[0] === "#").map((x) => "#" + x.slice(1).replace(/[^\p{L}\p{N}_]/gu, "")).filter((x) => x.length > 1))],
    ments: [...new Set(toks.filter((x) => x[0] === "@").map((x) => "@" + x.slice(1).replace(/[^A-Za-z0-9._]/g, "").toLowerCase()).filter((x) => x.length > 1))],
  };
}

/* ---------- Creator journey (BARTER_STEPS, BP_ALIAS, BP_JOURNEY) ---------- */
export const BARTER_STEPS = [
  ["applied", "1. Registered"],
  ["eligible", "2. Screened"],
  ["sent_to_brand", "3. Sent to brand"],
  ["brand_confirmed", "4. Brand confirmed"],
  ["contract_sent", "5. Contract sent"],
  ["contract_signed", "6. Contract signed"],
  ["address_confirmed", "7. Address confirmed"],
  ["product_sent", "8. Courier sent"],
  ["product_delivered", "9. Courier delivered"],
  ["content_created", "10. Video brief sent"],
  ["content_submitted", "11. Video submitted"],
  ["changes_requested", "12. Changes asked"],
  ["content_approved", "13. Client approved"],
  ["published", "14. Posted"],
  ["completed", "15. Done"],
];
export const BP_ALIAS = { invited: "applied", shortlisted: "applied", accepted: "brand_confirmed" };
export const BP_SHIP = ["address_confirmed", "product_sent", "product_delivered"];
export const BP_FAIL = ["dropped", "rejected", "ineligible", "brand_declined"];
export const APPLICANT_PENDING = ["applied", "eligible", "sent_to_brand"];
export const REPORT_APPROVED = (s) => !APPLICANT_PENDING.includes(s) && !BP_FAIL.includes(s);
export function stageIndex(stage) {
  const s = BP_ALIAS[stage] || stage;
  const i = BARTER_STEPS.findIndex((x) => x[0] === s);
  return i < 0 ? 0 : i;
}
/** courier delivered = product_sent + shipment delivered (bpEffectiveIndex) */
export const effIndex = (x) => (x.stage === "product_sent" && x.shipment && x.shipment.status === "delivered" ? stageIndex("product_delivered") : stageIndex(x.stage));
export function stepLabel(stage) {
  const s = BP_ALIAS[stage] || stage;
  const b = BARTER_STEPS.find((x) => x[0] === s);
  if (b) return b[1];
  return { ineligible: "Declined", brand_declined: "Declined by brand", dropped: "Dropped", rejected: "Rejected" }[stage] || String(stage || "").replace(/_/g, " ");
}
/* Bulk-sheet (invite) ke steps — invite_set_step / bulk_set_status (app.js bkStatuses) */
export const INVITE_STEPS = [
  ["registered", "Applied"],
  ["screened", "Screened"],
  ["sent_to_brand", "Sent to brand"],
  ["approved", "Approved"],
  ["contract_sent", "Contract sent"],
  ["contract_signed", "Contract signed"],
  ["address_confirmed", "Address confirmed"],
  ["courier_sent", "Courier sent"],
  ["courier_delivered", "Courier delivered"],
  ["video_brief_sent", "Video brief sent"],
  ["video_submitted", "Video submitted"],
  ["client_approved", "Client approved"],
  ["posted", "Posted / Done"],
];
export const inviteStepRank = (k) => Math.max(0, INVITE_STEPS.findIndex((x) => x[0] === (k === "invited" ? "registered" : k)));

/* ---------- Format ---------- */
export const fmtNum = (n) => (Number(n) || 0).toLocaleString("en-IN");
export const fmtMoney = (n) => (n == null || n === "" ? "—" : "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN"));
export function fmtDate(d, withYear = false) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", withYear ? { day: "2-digit", month: "short", year: "numeric" } : { day: "2-digit", month: "short" });
  } catch {
    return String(d);
  }
}
export const daysLeft = (end) => (end ? Math.round((new Date(end) - new Date(todayISO())) / 86400000) : null);
export const maskPhone = (p) => {
  const s = String(p || "").replace(/\s+/g, "");
  if (!s) return "";
  const m = /^\+?(\d{1,3})?(\d{5})(\d{3})(\d{2})$/.exec(s.replace(/^\+/, "+"));
  if (s.startsWith("+91") && s.length === 13) return `+91 ${s.slice(3, 8)}•••${s.slice(11)}`;
  return m ? s.slice(0, -5) + "•••" + s.slice(-2) : s;
};
export const initials = (n = "") =>
  String(n)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

/* ---------- Hooks ---------- */
/**
 * Ek campaign ki row (purana: sb.from("campaigns").select("*").eq("id", id).maybeSingle()).
 * id do tarah ka ho sakta hai: public.campaigns.id (legacy) YA intel campaign_id (Logistics / alerts se aata hai —
 * purane app mein open_id = legacy_campaign_id || campaign_id). Intel id aaye to barter_tracker (jo dono id samajhta hai)
 * se campaign ka naam lekar uski legacy row dhundhte hain. c.id hamesha legacy id hota hai (status / delete / edit isi se).
 * api.* RPC dono id lete hain, isliye unhe URL wala id dena theek hai.
 */
export function useCampaign(id) {
  const [st, setSt] = useState({ c: null, loading: true, error: null });
  const load = useCallback(async () => {
    if (!id || id === "sample") return setSt({ c: null, loading: false, error: id === "sample" ? null : { message: "No campaign" } });
    const sb = sbFor("admin");
    const { data, error } = await sb.from("campaigns").select("*").eq("id", id).maybeSingle();
    if (data) return setSt({ c: data, loading: false, error: null });
    // intel campaign_id → legacy row (naam + brand se)
    const { data: bt } = await sb.schema("api").rpc("barter_tracker", { p_campaign: id });
    const ic = bt && bt.campaign;
    if (ic && ic.name) {
      let q = sb.from("campaigns").select("*").eq("name", ic.name);
      if (ic.brand) q = q.eq("brand", ic.brand);
      const { data: rows } = await q.order("created_at", { ascending: false }).limit(1);
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (row) return setSt({ c: row, loading: false, error: null });
      // legacy row nahi mili — intel campaign se jitna pata hai utna dikhao (status/delete legacy id ke bina nahi chalte)
      return setSt({ c: { id: null, intel_id: ic.campaign_id, name: ic.name, brand: ic.brand, status: ic.status === "active" ? "Live" : ic.status, start_date: ic.starts_on, end_date: ic.ends_on, intelOnly: true }, loading: false, error: null });
    }
    setSt({ c: null, loading: false, error: error || { message: "Couldn't open this campaign." } });
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);
  return { ...st, reload: load };
}

/** Chhota toast hook — const [toast, say] = useToast(); say("Saved ✓") */
export function useToast(ms = 2400) {
  const [t, setT] = useState("");
  useEffect(() => {
    if (!t) return;
    const x = setTimeout(() => setT(""), ms);
    return () => clearTimeout(x);
  }, [t, ms]);
  return [t, setT];
}
