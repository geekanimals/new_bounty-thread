"use client";

/**
 * Facebook — purane brand-portal.js fbCall / paintFacebook / fbPosts / fbComments / fbCreate / fbInsights / fbAds / fbStart / fbReturn jaisa.
 * Saare kaam edge function "brand-facebook" se (brand ka apna linked Facebook business), link "brand-fb-login" se.
 * Chuna hua Page / ad account localStorage mein (purane geek_fb_page / geek_fb_act).
 */
import { useEffect, useState } from "react";
import { fn, sb } from "./core";
import { startFacebookLink, refreshFacebook } from "./account";
import { useBrand, getBrand, reloadPortal, canAct } from "./auth";

const ls = {
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
      /* ignore */
    }
  },
};

/** brand-facebook call (purana fbCall) → { data, error, reconnect, notLinked } */
export async function fbCall(body) {
  const r = await fn("brand-facebook", body);
  const d = r.data || {};
  return { data: r.error ? null : r.data, error: r.error, reconnect: !!d.reconnect, notLinked: !!d.not_linked };
}

/* ---------- Pages (purana paintFacebook: FB.pages ek baar, phir cache) ---------- */
let FB = { pages: null, err: null };
const subs = new Set();
const emit = () => subs.forEach((f) => f({ ...FB }));
let _loading = null;
function loadPages(force = false) {
  if (_loading && !force) return _loading;
  _loading = fbCall({ action: "pages" }).then((r) => {
    FB = r.error ? { pages: null, err: r } : { pages: (r.data && r.data.pages) || [], err: null };
    _loading = null;
    emit();
    return FB;
  });
  return _loading;
}

/** Chuna hua Page id (purana FB.page / geek_fb_page) */
export const getFbPageId = () => ls.get("geek_fb_page");
/** Page badlo (purana fbPageSel onchange) */
export function setFbPageId(id) {
  ls.set("geek_fb_page", id);
  emit();
}

/**
 * React: brand ke Facebook Pages.
 * → { linked, pages, page, loading, error, reconnect, can, setPage, reload }
 * linked=false → "Connect Facebook" dikhao (brand_portal.facebook khaali — purana fbhero)
 */
export function useFbPages() {
  const b = useBrand();
  const [st, setSt] = useState({ ...FB });
  const [sel, setSel] = useState(null);
  const linked = !!(b.portal && b.portal.facebook);
  useEffect(() => {
    const f = (x) => {
      setSt(x);
      setSel(getFbPageId());
    };
    subs.add(f);
    setSel(getFbPageId());
    if (linked && !FB.pages && !FB.err) loadPages();
    return () => subs.delete(f);
  }, [linked]);
  const pages = st.pages || [];
  const page = pages.find((p) => p.id === sel) || pages[0] || null;
  return {
    ready: b.ready && (!!b.portal || !!b.portalError || !b.loggedIn),
    linked,
    pages,
    page,
    loading: linked && !st.pages && !st.err,
    error: b.portalError ? { message: b.portalError } : st.err ? st.err.error : null,
    reconnect: !!(st.err && (st.err.reconnect || st.err.notLinked)),
    can: canAct(b),
    setPage: setFbPageId,
    reload: () => loadPages(true),
  };
}

/* ---------- posts + comments ---------- */
/** Published / scheduled posts (purana fbPosts) */
export const fbPosts = (pageId, scheduled = false) => fbCall({ action: scheduled ? "scheduled" : "posts", page_id: pageId });
/** Post delete (purana data-fbdel) */
export const fbDeletePost = (pageId, postId) => fbCall({ action: "delete_post", page_id: pageId, post_id: postId });
/** Post ke comments (purana fbComments) */
export const fbComments = (pageId, postId) => fbCall({ action: "comments", page_id: pageId, post_id: postId });
/** Comment ka reply (purana data-fbre) */
export const fbReply = (pageId, commentId, message) => fbCall({ action: "reply", page_id: pageId, comment_id: commentId, message });
/** Comment hide / unhide (purana data-fbhide) */
export const fbHide = (pageId, commentId, hide) => fbCall({ action: "hide", page_id: pageId, comment_id: commentId, hide });
/** Comment delete (purana data-fbdc) */
export const fbDeleteComment = (pageId, commentId) => fbCall({ action: "delete_comment", page_id: pageId, comment_id: commentId });

/**
 * Post publish / schedule (purana fbCreate submit): photo file → campaign-files `<org>/facebook/<time>-<name>` (8 MB tak) → public URL.
 * at = Date (schedule) ya null. → { data: { scheduled }, error }
 */
export async function fbPublish({ pageId, message, link, file, imageUrl, at }) {
  let img = String(imageUrl || "").trim();
  if (file) {
    if (file.size > 8 * 1024 * 1024) return { data: null, error: { message: "The photo must be under 8 MB." } };
    const org = (getBrand().member || {}).org_id;
    if (!org) return { data: null, error: { message: "Your workspace isn't ready to upload files." } };
    const path = org + "/facebook/" + Date.now() + "-" + file.name.replace(/[^\w.\-]+/g, "_").slice(-60);
    const up = await sb().storage.from("campaign-files").upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) return { data: null, error: { message: "Couldn't upload the photo: " + up.error.message } };
    img = sb().storage.from("campaign-files").getPublicUrl(path).data.publicUrl;
  }
  const sec = at ? Math.floor(at.getTime() / 1000) : 0;
  return fbCall({ action: "publish", page_id: pageId, message: message || "", link: String(link || "").trim(), image_url: img, schedule_at: sec || undefined });
}

/* ---------- insights + ads ---------- */
/** Page insights (purana fbInsights, days 7 / 14 / 28) */
export const fbInsights = (pageId, days = 28) => fbCall({ action: "insights", page_id: pageId, days });
/** Ad accounts (purana fbAds) */
export const fbAdAccounts = () => fbCall({ action: "ad_accounts" });
/** Ad campaigns + totals (purana fbAds, days 7 / 30 / 90) */
export const fbAdCampaigns = (accountId, days = 30) => fbCall({ action: "ad_campaigns", account_id: accountId, days });
/** Campaign pause / resume (purana data-fbcs) — status "PAUSED" | "ACTIVE" */
export const fbAdStatus = (campaignId, status) => fbCall({ action: "ad_status", campaign_id: campaignId, status });
/** Chuna hua ad account (purana geek_fb_act) */
export const getFbActId = () => ls.get("geek_fb_act");
export const setFbActId = (id) => ls.set("geek_fb_act", id);
/** Ad account ka status (purana ST) */
export const FB_ACT_STATUS = { 1: "Active", 2: "Disabled", 3: "Unsettled", 7: "Pending review", 9: "In grace period", 101: "Closed" };

/* ---------- Facebook business link — account.jsx (R1) ka startFacebookLink / finishFacebookLink hi use hota hai ---------- */
/** "Connect / Reconnect Facebook" Facebook pages se (purana data-bpxfb, wapsi Facebook page par) */
export const fbLinkStart = () => startFacebookLink("facebook");

/** Facebook snapshot dobara padho (purana data-bpxfbrefresh → brand-fb-login refresh) → phir brand_portal + Pages reload */
export async function fbRefresh() {
  const r = await refreshFacebook();
  await reloadPortal();
  if (getBrand().portal && getBrand().portal.facebook) await loadPages(true);
  return r;
}
