"use client";

/**
 * 🔎 Discovery — purana paintDiscover / mountCreatorSearch (brand mode) / dxBrief / dxPicks / dxFbStrip / brandPick:
 *  - search: api.creator_search { p_filters (source platform | external), p_page, p_size, p_campaign:null }
 *  - handle lookup: edge ig-discover { action:"lookup", username }
 *  - ⭐ shortlist: api.brand_discover_pick { p:{ handle, member_id, campaign_id, note, snapshot } }
 *  - my shortlist: api.brand_discover_picks {} · remove: api.brand_discover_unpick { p_pick }
 *  - campaign ka ideal creator: api.brand_discover_brief { p_campaign }
 *  - Instagram live search strip: public.my_discovery_connection · connect: edge fb-connect (url / exchange)
 */
import { useCallback, useEffect, useState } from "react";
import { call, api, fn, ls } from "./core";

/** Ek source (platform = Geek OS creators, external = Instagram pool) ka search (purana ask(src, page, size)) */
export const searchCreators = (filters, { source = "platform", page = 1, size = 24 } = {}) =>
  api("creator_search", { p_filters: { ...clean(filters), source }, p_page: page, p_size: size, p_campaign: null });

// khali filters hatao (purana: filters[k]==="" || null → delete)
const clean = (f) => {
  const o = {};
  Object.keys(f || {}).forEach((k) => {
    const v = f[k];
    if (v === "" || v == null || (Array.isArray(v) && !v.length)) return;
    o[k] = v;
  });
  return o;
};

/**
 * Dono source ek saath (purana S.source==="all": platform 12 + external 24) → { data:{ rows, total }, error }
 * rows mein har creator: { handle, member_id, kind, name, city, followers, engagement, profile_picture_url, categories … }
 */
export async function searchAll(filters, page = 1) {
  const [p, e] = await Promise.all([searchCreators(filters, { source: "platform", page, size: 12 }), searchCreators(filters, { source: "external", page, size: 24 })]);
  const error = p.error || e.error;
  if (error) return { data: null, error };
  const rows = [...((p.data && p.data.rows) || []), ...((e.data && e.data.rows) || [])];
  return { data: { rows, total: ((p.data && p.data.total) || 0) + ((e.data && e.data.total) || 0) }, error: null };
}

/** @handle Instagram par dhoondo (purana ig-discover lookup) → { data:{ profile, added }, error } */
export async function lookupHandle(handle) {
  const r = await fn("ig-discover", { action: "lookup", username: String(handle || "").replace(/^@/, "").toLowerCase() });
  if (!r.error && r.data && r.data.error) return { data: r.data, error: { message: r.data.error } };
  return r;
}
/** Search box ka text handle jaisa hai? (purana /^[a-z0-9._]{2,30}$/) */
export const asHandle = (q) => {
  const h = String(q || "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?].*$/, "")
    .toLowerCase();
  return /^[a-z0-9._]{2,30}$/.test(h) && (/^@|instagram\.com\//i.test(String(q || "").trim()) || /[._0-9]/.test(h)) ? h : "";
};

// pick + ginti refresh
async function _pick(args) {
  const r = await api("brand_discover_pick", args);
  if (!r.error) refreshPickCount();
  return r;
}

/** ⭐ Shortlist (purana brandPick → api.brand_discover_pick) — c = search wala creator row */
export const pickCreator = (c, { campaignId = null, note = "" } = {}) =>
  _pick({
    p: {
      handle: c.handle,
      member_id: c.member_id || null,
      campaign_id: campaignId || null,
      note,
      snapshot: { name: c.name || c.display_name || null, followers: c.followers, engagement: c.engagement, city: c.city || null, profile_picture_url: c.profile_picture_url || null },
    },
  });

/** Mera shortlist (purana dxPicks → api.brand_discover_picks {}) */
export const getPicks = () => api("brand_discover_picks", {});

/* Shortlist ki ginti (Discovery tab "My shortlist" ka number) — ek cache, pick / unpick par dobara */
let _pickN = null;
const _pickSubs = new Set();
const _pickEmit = () => _pickSubs.forEach((f) => f(_pickN));
let _pickLoading = null;
function refreshPickCount() {
  if (_pickLoading) return _pickLoading;
  _pickLoading = getPicks().then((r) => {
    _pickLoading = null;
    if (!r.error) {
      _pickN = (r.data || []).length;
      _pickEmit();
    }
    return r;
  });
  return _pickLoading;
}
/** React: shortlist mein kitne creators → number (load hone tak 0) */
export function usePickCount() {
  const [k, setK] = useState(_pickN || 0);
  useEffect(() => {
    _pickSubs.add(setK);
    if (_pickN == null) refreshPickCount();
    else setK(_pickN);
    return () => _pickSubs.delete(setK);
  }, []);
  return k;
}
/** Shortlist se hatao (purana data-dxun → api.brand_discover_unpick { p_pick }) */
export async function unpickCreator(pickId) {
  const r = await api("brand_discover_unpick", { p_pick: pickId });
  if (!r.error) refreshPickCount();
  return r;
}
/** React: shortlist → { list, loading, error, reload } */
export function usePicks() {
  const [st, setSt] = useState({ list: [], loading: true, error: null });
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setSt((s) => ({ ...s, loading: true }));
    const r = await getPicks();
    setSt((s) => ({ list: r.error ? s.list : r.data || [], loading: false, error: r.error ? r.error.message || String(r.error) : null }));
    return r;
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { ...st, reload: () => load(true) };
}
/** Shortlist status ka label (purana ST) */
export const PICK_STATUS = { new: ["With the Geek team", "orange"], invited: ["Invited", "green"], declined: ["Not this time", "grey"] };

/** Campaign ka ideal creator (purana dxBrief fill → api.brand_discover_brief) */
export const getDiscoverBrief = (campaignId) => api("brand_discover_brief", { p_campaign: campaignId });

/**
 * Brief → search filters (purana dxBrief fill + onsubmit ka saar)
 * → { q, categories, location, gender, gender_soft, min_followers, max_followers, min_engagement, min_age, max_age, words }
 */
export function briefToFilters(d) {
  const ip = (d && d.ideal) || {};
  const f = { categories: [], location: "", gender: "", min_followers: "", max_followers: "", min_engagement: "", min_age: "", max_age: "", words: [] };
  const cat = (ip.categories || [])[0] || (d && d.category) || "";
  if (cat) f.categories = [cat];
  f.location = (ip.locations || [])[0] || ((d && d.cities) || [])[0] || "";
  if (ip.gender && /^(male|female)$/i.test(ip.gender)) {
    f.gender = ip.gender.toLowerCase();
    f.gender_soft = "yes";
  }
  if (ip.min_followers != null) f.min_followers = ip.min_followers;
  if (ip.max_followers != null) f.max_followers = ip.max_followers;
  if (ip.age_min) f.min_age = ip.age_min;
  if (ip.age_max) f.max_age = ip.age_max;
  const e = Number(ip.min_engagement);
  if (e > 0) f.min_engagement = String([1, 2, 3, 5].filter((x) => x <= e).pop() || 1);
  if (ip.pet === "yes") f.words = [PET_WORDS[/cat/i.test(ip.pet_type || "") ? "cat" : /dog/i.test(ip.pet_type || "") ? "dog" : "any"]];
  return f;
}
// purane dxBrief ke pet words
export const PET_WORDS = {
  any: ["pet", "petparent", "pet parent", "petlover", "petsofinstagram", "furbaby", "dog", "doggo", "doglover", "dogsofinstagram", "cat", "catlover", "catsofinstagram", "puppy", "kitten"],
  dog: ["dog", "dogs", "puppy", "doggo", "doglover", "dogmom", "dogdad", "dogsofinstagram", "labrador", "retriever", "pug", "beagle", "husky", "indie dog"],
  cat: ["cat", "cats", "kitten", "kitty", "catmom", "catdad", "catlover", "catsofinstagram"],
};

/** Instagram live search ka connection (purana dxFbStrip → sb.rpc("my_discovery_connection")) → data.facebook */
export const getDiscoveryConnection = () => call("my_discovery_connection");

/** "Connect Facebook" (purana connectFacebookSearch → fb-connect url) — Facebook par bhej deta hai */
export async function connectFacebookSearch() {
  const state = "facebook:" + Array.from(crypto.getRandomValues(new Uint8Array(6))).map((x) => x.toString(16).padStart(2, "0")).join("");
  ls.set("geekos_oauth_state", state);
  ls.set("geekos_after_ig", "discover");
  try {
    window.sessionStorage.setItem("geek_tab_door", "brand");
  } catch {
    /* ignore */
  }
  const r = await fn("fb-connect", { action: "url", redirect_uri: window.location.origin + "/app.html", state });
  if (r.error || !r.data || !r.data.url) return { data: null, error: r.error || { message: (r.data && r.data.error) || "Couldn't start Facebook connect." } };
  window.location.href = r.data.url;
  return { data: true, error: null };
}
/**
 * Facebook se wapsi (state "facebook:…") — purana finishFacebookSearch → fb-connect exchange.
 * → null (wapsi nahi), ya { ok, message }
 */
export async function finishFacebookSearch() {
  const q = new URLSearchParams(window.location.search);
  const st = q.get("state") || "";
  if (!/^facebook:/.test(st)) return null;
  const code = q.get("code");
  window.history.replaceState(window.history.state, "", window.location.pathname);
  const saved = ls.get("geekos_oauth_state");
  ls.del("geekos_oauth_state");
  if (saved && saved !== st) return { ok: false, message: "That Facebook connect expired — try again." };
  if (!code) return { ok: false, message: q.get("error_description") || "Facebook connect was cancelled." };
  const r = await fn("fb-connect", { action: "exchange", code, redirect_uri: window.location.origin + "/app.html" });
  const d = r.data || {};
  const msg = r.error ? r.error.message : d.error;
  if (msg) {
    ls.set("geekos_fb_last_error", String(msg));
    return { ok: false, message: "Instagram search: " + msg };
  }
  ls.del("geekos_fb_last_error");
  return {
    ok: true,
    message: d.discovery_ok ? `Instagram search is on — via @${d.ig_username}.` : `Connected @${d.ig_username}, but Meta refused the lookup: ${d.discovery_error || ""}`,
  };
}
/** Pichhli baar ka Facebook connect error (purana geekos_fb_last_error) */
export const lastFacebookError = () => ls.get("geekos_fb_last_error") || "";
