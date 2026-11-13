"use client";

/**
 * Approvals — purane brand-portal.js paintApprovals / wireActions / wireBulk / openReasonModal (app.js) jaisa.
 *  - creators to approve  → api.org_decide_applicant (approve / decline + reason)
 *  - videos to review     → api.bp_review_video (approve / ask for changes)
 *  - campaign requests    → api.brand_portal.requests (sirf dikhana — Geek team jawab deti hai)
 * List data api.brand_portal (auth.jsx ka store) se aata hai; har action ke baad reloadPortal().
 */
import { useEffect, useState } from "react";
import { api } from "./core";
import { useBrand, reloadPortal, canAct } from "./auth";

/** Approvals ka data (purana paintApprovals: d.to_approve / d.videos / d.requests + can()) */
export function useApprovals() {
  const b = useBrand();
  const p = b.portal || {};
  return {
    loading: !b.ready || (b.loggedIn && !b.portal && !b.portalError),
    error: b.portalError,
    toApprove: p.to_approve || [],
    videos: p.videos || [],
    requests: p.requests || [],
    brands: p.brands || [],
    can: canAct(b),
    reload: reloadPortal,
  };
}

/** Creator approve (purana data-bpxok → org_decide_applicant p_approve:true) */
export function approveCreator(participationId) {
  return api("org_decide_applicant", { p_participation: participationId, p_approve: true, p_reason_code: null, p_note: null });
}

/** Creator decline, wajah ke saath (purana data-bpxno → openReasonModal → org_decide_applicant p_approve:false) */
export function declineCreator(participationId, reasonCode, note) {
  return api("org_decide_applicant", { p_participation: participationId, p_approve: false, p_reason_code: reasonCode, p_note: note || null });
}

/** Video approve (purana data-bpxvok / openVideo → bp_review_video p_approve:true) */
export function approveVideo(participationId) {
  return api("bp_review_video", { p_participation: participationId, p_approve: true, p_reason: null });
}

/** Video mein badlav maango (purana data-bpxvno → bp_review_video p_approve:false, p_reason) — 5 se 800 akshar */
export function askVideoChanges(participationId, text) {
  return api("bp_review_video", { p_participation: participationId, p_approve: false, p_reason: String(text || "").trim().slice(0, 800) });
}

/**
 * Kai ek saath approve (purana wireBulk — ek-ek karke wahi RPC). kind "c" = creators, "v" = videos.
 * onStep(i, n) progress ke liye. → { ok, bad: [message…] }
 */
export async function approveMany(kind, ids, onStep) {
  let ok = 0;
  const bad = [];
  for (let i = 0; i < ids.length; i++) {
    if (onStep) onStep(i + 1, ids.length);
    const r = kind === "c" ? await approveCreator(ids[i]) : await approveVideo(ids[i]);
    if (r.error) bad.push(r.error.message || String(r.error));
    else ok++;
  }
  return { ok, bad };
}

/** Decline ki wajahein (app.js rejectionReasons → api.rejection_reasons) → [{code, label}] */
let _reasons = null;
export async function rejectionReasons() {
  if (_reasons) return { data: _reasons, error: null };
  const r = await api("rejection_reasons");
  if (!r.error) _reasons = r.data || [];
  return r;
}
/** React: wajahein + loading */
export function useRejectionReasons() {
  const [st, setSt] = useState({ list: _reasons || [], loading: !_reasons, error: null });
  useEffect(() => {
    let on = true;
    rejectionReasons().then((r) => on && setSt({ list: r.data || [], loading: false, error: r.error }));
    return () => {
      on = false;
    };
  }, []);
  return st;
}
/** app.js openReasonModal: "brief se match nahi" wali wajahein upar */
export const BRIEF_REASON = /^(low_followers|high_followers|low_engagement|location_mismatch|gender_mismatch|age_mismatch|category_mismatch|language_mismatch|pet_mismatch|marital_mismatch|barter_not_open)$/;
