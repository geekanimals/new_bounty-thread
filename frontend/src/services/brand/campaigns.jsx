"use client";

/**
 * Campaigns — purane brand-portal.js paintCampaignList / loadCamp / loadAn / loadTop / thumbsFix / paintTab
 * + tracking.js mount(readOnly) + app.js openCampaignModal({mode:"request"}).
 * Sab calls door "brand" se, purane args ke saath.
 */
import { useEffect, useState, useCallback } from "react";
import { useRpc } from "@/lib/supabase";
import { DOOR, api, sb } from "./core";
import { loadAnalytics, loadTopPosts, fetchPostThumbs } from "./dashboard";
import { useBrand, getBrand, reloadPortal, canAct, brandName } from "./auth";

/** id asli hai? (static export ka "sample" placeholder par call nahi) */
const real = (id) => !!id && id !== "sample";

/** Campaign list + requests (purana paintCampaignList: d.campaigns + d.requests) */
export function useBrandCampaigns() {
  const b = useBrand();
  const p = b.portal || {};
  return {
    loading: !b.ready || (b.loggedIn && !b.portal && !b.portalError),
    error: b.portalError,
    list: p.campaigns || [],
    requests: p.requests || [],
    brand: brandName(b),
    can: canAct(b),
    reload: reloadPortal,
  };
}

/** Ek campaign: details + creators + timeline (purana loadCamp → api.brand_campaign) */
export function useBrandCampaign(id) {
  return useRpc(DOOR, "api.brand_campaign", { p_campaign: id }, { skip: !real(id) });
}
/** Ek baar (download ke liye) — purana loadCamp */
export function loadBrandCampaign(id) {
  return api("brand_campaign", { p_campaign: id });
}

/* ---------- analytics (purana loadAn — dashboard.jsx ka loadAnalytics cache hi, reports page sab campaigns ke liye bulata hai) ---------- */
/** api.campaign_analytics → { data: { totals, creators, funnel }, error } (purana loadAn) */
export async function loadCampaignAnalytics(id, force = false) {
  const a = await loadAnalytics(id, force);
  return a && a.error ? { data: null, error: { message: a.error } } : { data: a, error: null };
}
/** React: analytics */
export function useCampaignAnalytics(id) {
  const [st, setSt] = useState({ data: null, loading: real(id), error: null });
  const load = useCallback(
    async (force = false) => {
      if (!real(id)) return;
      setSt((s) => ({ ...s, loading: true }));
      const r = await loadCampaignAnalytics(id, force);
      setSt({ data: r.data, loading: false, error: r.error });
    },
    [id]
  );
  useEffect(() => {
    load();
  }, [load]);
  return { ...st, reload: () => load(true) };
}

/* ---------- top posts (purana loadTop + thumbsFix: post-thumb se missing pictures) ---------- */
export function useTopPosts(id) {
  const [st, setSt] = useState({ list: [], loading: real(id) });
  useEffect(() => {
    if (!real(id)) return;
    let on = true;
    (async () => {
      const L = await loadTopPosts(id);
      if (!on) return;
      setSt({ list: L, loading: false });
      const map = await fetchPostThumbs(L.filter((p) => !p.thumb && p.permalink).map((p) => p.permalink));
      if (on && Object.keys(map).length) setSt((s) => ({ ...s, list: s.list.map((p) => (map[p.permalink] ? { ...p, thumb: map[p.permalink] } : p)) }));
    })();
    return () => {
      on = false;
    };
  }, [id]);
  return st;
}

/** Links & sales (tracking.js mount readOnly → api.track_report) */
export function useTrackReport(id) {
  return useRpc(DOOR, "api.track_report", { p_campaign: id }, { skip: !real(id) });
}


/* ---------- naya campaign request (app.js openCampaignModal mode "request" → api.brand_campaign_request) ---------- */
/**
 * Files purane jaise campaign-files bucket mein (`<org>/<time>-<rand>-<name>`), phir poora form Geek team ko.
 * row = purane campaign form jaisa object (name, brief, deliverables, budget, start_date, end_date, creators, ideal_profile, contract_terms …)
 * → { data: { request_id }, error }
 */
export async function sendCampaignRequest(row, files = [], onStep) {
  const b = getBrand(); // store ka abhi ka snapshot (event handler se bulaya jaata hai)
  if (!canAct(b)) return { data: null, error: { message: "This login can only view — ask your team's admin to send the request." } };
  const org = b.member && b.member.org_id;
  const attachments = [];
  if (files.length) {
    if (!org) return { data: null, error: { message: "Your workspace isn't set up yet — can't upload files." } };
    for (const file of files) {
      if (onStep) onStep(`Uploading ${file.name}…`);
      const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
      const path = `${org}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
      const up = await sb().storage.from("campaign-files").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (up.error) return { data: null, error: { message: `Couldn't upload ${file.name}: ${up.error.message}` } };
      const { data: pub } = sb().storage.from("campaign-files").getPublicUrl(path);
      attachments.push({ name: file.name, url: pub.publicUrl, type: file.type || "", size: file.size, path });
    }
  }
  const brands = (b.portal && b.portal.brands) || [];
  const brand_id = (brands[0] && brands[0].brand_id) || null;
  const form = { ...row, attachments, brand_id, brand: brandName(b) };
  if (onStep) onStep("Sending…");
  const r = await api("brand_campaign_request", { p: { brand_id, name: row.name, form } });
  if (!r.error) reloadPortal();
  return r;
}
