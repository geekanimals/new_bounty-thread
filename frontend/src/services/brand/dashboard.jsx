"use client";

/**
 * Dashboard ke numbers — purana paintDash:
 *  - live campaigns / creators on board / videos / posts → api.brand_portal (brand store) se
 *  - views + likes/comments → har campaign ka api.campaign_analytics { p_campaign } .totals
 *  - 🏆 top posts → posts wale campaigns ka api.brand_top_posts { p_campaign, p_limit:5 }, views se top 5
 *  - post ki photo na ho → edge function post-thumb { permalinks } (purana thumbsFix)
 */
import { useEffect, useState } from "react";
import { api, fn } from "./core";

const _an = {}; // campaign_analytics cache (purana BP.an)
const _top = {}; // brand_top_posts cache (purana BP.top)

/** Ek campaign ki analytics (purana loadAn) → data ya { error } */
export async function loadAnalytics(id, force = false) {
  if (_an[id] && !force) return _an[id];
  const r = await api("campaign_analytics", { p_campaign: id });
  _an[id] = r.error ? { error: r.error.message } : r.data;
  return _an[id];
}
/** Ek campaign ke top posts (purana loadTop) → [] */
export async function loadTopPosts(id, force = false) {
  if (_top[id] && !force) return _top[id];
  const r = await api("brand_top_posts", { p_campaign: id, p_limit: 5 });
  _top[id] = r.error ? [] : r.data || [];
  return _top[id];
}
/** Cache saaf (purana refresh: BP.an = {}; BP.top = {}) */
export function resetDashCache() {
  Object.keys(_an).forEach((k) => delete _an[k]);
  Object.keys(_top).forEach((k) => delete _top[k]);
}

/** Post ki photo Instagram se (purana thumbsFix → post-thumb) → { permalink: url } */
export async function fetchPostThumbs(permalinks) {
  const L = (permalinks || []).filter(Boolean).slice(0, 30);
  if (!L.length) return {};
  const r = await fn("post-thumb", { permalinks: L });
  return (r.data && r.data.thumbs) || {};
}

/**
 * React: campaigns ki list do (portal.campaigns) → { views, engagement, top, loading }
 * views / engagement null = abhi load ho raha hai.
 */
export function useCampaignTotals(campaigns) {
  const [st, setSt] = useState({ views: null, engagement: null, top: [], loading: true });
  const ids = (campaigns || []).map((c) => c.campaign_id).join(",");
  useEffect(() => {
    let alive = true;
    const C = campaigns || [];
    (async () => {
      const all = await Promise.all(C.map((c) => loadAnalytics(c.campaign_id)));
      let v = 0,
        e = 0;
      all.forEach((a) => {
        const t = (a && a.totals) || {};
        v += Number(t.views) || 0;
        e += (Number(t.likes) || 0) + (Number(t.comments) || 0);
      });
      const withPosts = C.filter((c) => Number(c.posts) > 0);
      const tops = await Promise.all(withPosts.map((c) => loadTopPosts(c.campaign_id).then((L) => L.map((x) => ({ ...x, campaign: c.name, campaign_id: c.campaign_id })))));
      let top = [].concat(...tops).sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)).slice(0, 5);
      // photo nahi hai to post-thumb se
      const need = top.filter((p) => !p.thumb && p.permalink).map((p) => p.permalink);
      if (need.length) {
        const t = await fetchPostThumbs(need);
        top = top.map((p) => (!p.thumb && t[p.permalink] ? { ...p, thumb: t[p.permalink] } : p));
      }
      if (alive) setSt({ views: v, engagement: e, top, loading: false });
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
  return st;
}
