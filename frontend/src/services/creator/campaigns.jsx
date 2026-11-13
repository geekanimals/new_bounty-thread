"use client";

/**
 * Creator ke campaigns — purane operations.js / bounty-welcome.js / bounty-creator.js jaise hi:
 *  - Discover:      api.list_open_campaigns   (login + Instagram/WhatsApp connected)
 *                   public.explore_campaigns  (guest, ya jab Instagram abhi connect nahi — sirf dekhna)
 *  - My campaigns:  api.get_my_campaigns + api.my_campaign_flows + api.my_track_links
 *  - Photo:         public.campaign_covers (Super Admin ki upload ki photo)
 *  - Har step ka action: respond / sign / address / received / video / post / feedback
 * Koi naya RPC nahi — sab wahi jo purana app call karta tha, wahi args ke saath. Actions → { data, error }.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRpc } from "@/lib/supabase";
import { DOOR, sb, call, api, apiCreator, myUserId, K, ls } from "./core";
import { useCreator } from "./auth";
import { myIgRow, getIgAccounts } from "./instagram";

/* =====================================================================
 * Lists
 * ===================================================================== */
let _covers = null;
let _coversP = null;
/** Super Admin ki upload ki campaign photos (campaign_covers) — ek baar load, map { campaign_id: url } */
export function useCovers() {
  const [cv, setCv] = useState(_covers || {});
  useEffect(() => {
    if (_covers) return;
    if (!_coversP)
      _coversP = call("campaign_covers").then((r) => {
        _covers = r && !r.error && r.data && typeof r.data === "object" ? r.data : {};
        return _covers;
      });
    let alive = true;
    _coversP.then((x) => alive && setCv(x));
    return () => {
      alive = false;
    };
  }, []);
  return cv;
}

/** Instagram + WhatsApp gate (purane creatorProfileGate / my_join_status) — { loading, needs, locked }.
 *  needs khali = sab connected. Network error par lock nahi (fail open, purane jaisa). */
export function useJoinGate() {
  const c = useCreator();
  return { loading: !c.ready, needs: c.joinNeeds || [], locked: !!c.locked };
}

/**
 * Open campaigns — { list, loading, error, reload }.
 * publicList = guest / locked → explore_campaigns (purane bxMemberExplore jaisa), warna api.list_open_campaigns.
 */
export function useOpenCampaigns({ publicList = false, skip = false } = {}) {
  const [st, setSt] = useState({ loading: !skip, list: [], error: null });
  const load = useCallback(async () => {
    if (skip) return;
    setSt((s) => ({ ...s, loading: true }));
    const r = publicList ? await call("explore_campaigns") : await api("list_open_campaigns");
    setSt({ loading: false, list: (!r.error && r.data) || [], error: r.error });
  }, [publicList, skip]);
  useEffect(() => {
    load();
  }, [load]);
  return { ...st, reload: load };
}

/** Sirf get_my_campaigns ki rows (flows/links ke bina) — { data, loading, error, reload } */
export const useMyCampaignRows = ({ skip = false } = {}) => useRpc(DOOR, "api.get_my_campaigns", {}, { skip });

/**
 * My campaigns poore — get_my_campaigns + har participation ka flow (paid? product chahiye?) + mera link/code
 * (purane loadMyCampaigns jaisa) — { list, loading, error, reload }.
 * live = har 20 sec chupke se refresh (sirf tab visible ho aur koi input focus mein na ho).
 */
export function useMyCampaigns({ skip = false, live = true } = {}) {
  const [st, setSt] = useState({ loading: !skip, list: [], error: null });
  const sig = useRef("");
  const load = useCallback(
    async (silent = false) => {
      if (skip) return;
      if (!silent) setSt((s) => ({ ...s, loading: true }));
      const r = await apiCreator("get_my_campaigns");
      if (r.error) {
        if (!silent) setSt({ loading: false, list: [], error: r.error });
        return;
      }
      const fl = await apiCreator("my_campaign_flows");
      const flows = (!fl.error && fl.data) || {};
      const tk = await apiCreator("my_track_links");
      const tks = {};
      ((!tk.error && tk.data) || []).forEach((t) => (tks[t.participation_id] = t));
      const list = (r.data || []).map((c) => ({ ...c, _flow: flows[c.participation_id] || null, _trk: tks[c.participation_id] || null }));
      const s = JSON.stringify(list);
      if (silent && s === sig.current) return;
      sig.current = s;
      setSt({ loading: false, list, error: null });
    },
    [skip]
  );
  useEffect(() => {
    load();
    if (!live) return;
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const a = document.activeElement;
      if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
      load(true);
    }, 20000);
    return () => clearInterval(t);
  }, [load, live]);
  return { ...st, reload: load };
}

/** Saari campaigns ek baar (Download my data / media kit work) → { data, error } */
export const getMyCampaigns = () => api("get_my_campaigns");

/* =====================================================================
 * Apply (purane applyToCampaign / myApplyProfiles)
 * ===================================================================== */
/** Apply karne wale profiles: connected Instagram + baaki IG accounts + managed profiles → [{ handle, followers, label }] */
export async function myApplyProfiles() {
  const out = [];
  try {
    const row = await myIgRow(await myUserId());
    if (row && row.username) out.push({ handle: String(row.username).toLowerCase(), followers: row.followers_count, label: "Connected Instagram" });
  } catch {
    /* ignore */
  }
  try {
    const ig = await getIgAccounts();
    ((!ig.error && ig.data) || []).forEach((a) => {
      if (a.username && !out.some((o) => o.handle === a.username)) out.push({ handle: a.username, followers: a.followers_count, label: a.active ? "Instagram · active" : "Instagram" });
    });
  } catch {
    /* ignore */
  }
  try {
    const m = await apiCreator("get_my_managed_profiles");
    ((!m.error && m.data) || []).forEach((x) => {
      if (!out.some((o) => o.handle === x.handle)) out.push({ handle: x.handle, followers: x.followers, label: x.category || "Managed profile" });
    });
  } catch {
    /* ignore */
  }
  return out;
}

/** Meri eligibility (api.my_campaign_eligibility) → eligibility | fallback | null */
export async function checkEligibility(campaignId, fallback) {
  const er = await apiCreator("my_campaign_eligibility", { p_campaign: campaignId });
  return (!er.error && er.data) || fallback || null;
}
/**
 * Apply: apply_to_campaign_v2 (purana backend ho to apply_to_campaign). "not eligible" aaye to eligibility dobara.
 * → { ok } | { notEligible: eligibility } | { error: message }
 */
export async function applyTo(campaignId, profile) {
  let r = await apiCreator("apply_to_campaign_v2", { p_campaign: campaignId, p_profile: profile ?? null });
  if (r.error && /apply_to_campaign_v2|could not find the function/i.test(r.error.message || "")) r = await apiCreator("apply_to_campaign", { p_campaign: campaignId });
  if (r.error) {
    const msg = r.error.message || String(r.error);
    if (/not eligible/i.test(msg)) {
      const e2 = await checkEligibility(campaignId);
      if (e2 && e2.eligible === false) return { notEligible: e2 };
    }
    return { error: msg };
  }
  return { ok: true };
}

/** Guest ne Apply dabaya → login ke baad wahi campaign khule (purana localStorage "geek_apply") */
export const rememberApply = (id) => ls.set(K.apply, String(id));
/** Yaad rakha campaign lo (aur bhool jao) → id | null */
export function takeApply() {
  const id = ls.get(K.apply);
  if (id) ls.del(K.apply);
  return id;
}

/* =====================================================================
 * Campaign steps (har participation ke actions) → { data, error }
 * ===================================================================== */
/** Invite: accept / pass (api.respond_to_campaign) */
export const respondToInvite = (participation, accept, reason) =>
  api("respond_to_campaign", { p_participation: participation, p_accept: accept, p_reason: accept ? null : reason });
/** Agreement padho (api.get_my_contract) */
export const getContract = (participation) => api("get_my_contract", { p_participation: participation });
/** Agreement sign (api.sign_contract_v2) */
export const signContract = (participation, { name, termsAck }) =>
  api("sign_contract_v2", { p_participation: participation, p_signature_name: name, p_asci_ack: true, p_terms_ack: termsAck });
/** Naya / edit address is campaign ke liye (api.upsert_address, correlation ui-campaign) */
export const saveCampaignAddress = (payload) => api("upsert_address", { p_payload: payload, p_correlation: "ui-campaign" });
/** Campaign ka delivery address pakka (api.confirm_campaign_address) */
export const confirmAddress = (participation, addressId) => api("confirm_campaign_address", { p_participation: participation, p_address_id: addressId });
/** Package mil gaya (api.creator_mark_received) */
export const markReceived = (participation) => api("creator_mark_received", { p_participation: participation });
/** Draft video bhejo (api.submit_campaign_video) */
export const submitVideo = (participation, url, note) => api("submit_campaign_video", { p_participation: participation, p_url: url, p_note: note || null });
/** Post ka link (api.record_campaign_post) — payload { media_type, permalink, caption } */
export const recordPost = (participation, payload) => api("record_campaign_post", { p_participation: participation, p_payload: payload });
/** Campaign ke baad feedback (api.submit_campaign_feedback) */
export const submitFeedback = (participation, payload) => api("submit_campaign_feedback", { p_participation: participation, p_payload: payload });

/** Google Drive video link brand khol sakta hai? (purane geekCheckVideoLink — video-link-check function).
 *  → { ok, checked, … } — check na ho paye to { ok: true, checked: false } */
export async function checkVideoLink(url) {
  if (!/^https?:\/\/(drive|docs)\.google\.com\//i.test(String(url || "").trim())) return { ok: true, checked: false };
  try {
    // raw invoke: function {ok:false, error} bhi bhejta hai — use error mat samjho
    const { data, error } = await sb().functions.invoke("video-link-check", { body: { url: String(url).trim() } });
    if (error || !data || typeof data.ok !== "boolean") return { ok: true, checked: false };
    return data;
  } catch {
    return { ok: true, checked: false };
  }
}
