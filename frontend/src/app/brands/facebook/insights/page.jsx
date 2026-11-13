"use client";

import { useEffect, useState } from "react";
import BrandShell, { ToneIcon } from "@/components/brands/BrandShell";
import FacebookTabs, { FbGate } from "@/components/brands/FacebookTabs";
import { BrLoading, BrError } from "@/components/brands/BrandStates";
import { useFbPages, fbInsights, fbPosts, bShort, bGrad, bDate } from "@/services/brand";
import { BarChart, ChevronDown } from "@/components/ui/Icons";

// purana fbInsights ke metrics (Facebook kabhi-kabhi naam badalta hai — jo mile wahi)
const SERIES = [
  { key: "reach", label: "Reach", sub: "People who saw anything from your Page, by day", metrics: ["page_impressions_unique", "page_impressions"], unit: "people" },
  { key: "engagement", label: "Engagement", sub: "Reactions, comments and shares, by day", metrics: ["page_post_engagements"], unit: "actions" },
  { key: "video", label: "Video views", sub: "Video views, by day", metrics: ["page_video_views"], unit: "views" },
];

/** /brands/facebook/insights — Page ke numbers (purana fbInsights: brand-facebook insights, last 28 days + posts ke reach / clicks) */
export default function FacebookInsights() {
  const fb = useFbPages();
  return (
    <BrandShell>
      <title>Facebook insights — Geek OS Brand</title>
      <FacebookTabs fb={fb} />
      <FbGate fb={fb}>{(pg) => <InsightsPane key={pg.id} pg={pg} />}</FbGate>

      <style>{`
        .fi-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        .fi-card { margin-top: 18px; padding: 22px; }
        .fi-titlerow { display: flex; align-items: center; gap: 12px; }
        .fi-ic { width: 36px; height: 36px; border-radius: 10px; background: var(--br-lilac); color: var(--br-primary); display: grid; place-items: center; flex-shrink: 0; }
        .fi-chart { display: flex; align-items: stretch; gap: 10px; height: 220px; padding-top: 10px; }
        .fi-col { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: flex-end; align-items: stretch; gap: 8px; }
        .fi-bar { display: block; border-radius: 8px 8px 4px 4px; background: #eef0f5; transition: height .3s; }
        .fi-bar.is-recent { background: #c2dafc; }
        .fi-bar.is-last { background: var(--br-fb); }
        .fi-col small { text-align: center; font-size: 10.5px; color: var(--br-faint); white-space: nowrap; }
        .fi-table { margin-top: 18px; }
        .fi-table td b { font-weight: 800; }
        .fi-post { display: inline-flex; align-items: center; gap: 12px; }
        .fi-post span { width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0; }
        .fi-post strong { font-weight: 700; }
        .fi-more { padding: 6px 0 16px; }
        .fi-more span { font-size: 12.5px; color: var(--br-faint); }

        @media (max-width: 1100px) {
          .fi-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .fi-stats { gap: 10px; }
          .fi-card { padding: 18px; }
          .fi-card .br-card__head { flex-wrap: wrap; }
          .fi-chart { height: 170px; gap: 4px; }
          .fi-col small { visibility: hidden; }
          .fi-col:nth-child(4n+1) small { visibility: visible; }
        }
              .fi-none { margin: 8px 0 0; padding: 14px !important; font-size: 13px; color: var(--br-muted); text-align: center; }
`}</style>
    </BrandShell>
  );
}

function InsightsPane({ pg }) {
  const [series, setSeries] = useState("reach");
  const [shown, setShown] = useState(4);
  const [ins, setIns] = useState({ data: null, loading: true, error: null });
  const [posts, setPosts] = useState({ list: [], loading: true });
  useEffect(() => {
    let on = true;
    fbInsights(pg.id, 28).then((r) => on && setIns({ data: r.data, loading: false, error: r.error }));
    fbPosts(pg.id).then((r) => on && setPosts({ list: (r.data && r.data.posts) || [], loading: false }));
    return () => {
      on = false;
    };
  }, [pg.id]);

  if (ins.loading) return <BrLoading rows={5} />;
  if (ins.error) return <BrError error={ins.error.message} />;
  const M = (ins.data && ins.data.metrics) || {};
  const days = (ins.data && ins.data.days) || 28;
  const pick = (L) => L.map((k) => M[k]).find(Boolean) || null;
  const v = (k) => (M[k] ? M[k].total : null);
  const follows = v("page_daily_follows_unique") != null ? v("page_daily_follows_unique") : v("page_fan_adds_unique");
  const STATS = [
    { label: "Page followers", value: bShort(pg.followers), note: follows != null ? `+${bShort(follows)} new follows in ${days} days` : "on Facebook", icon: "users", dark: true },
    { label: "Reach", value: bShort(v("page_impressions_unique")), note: `last ${days} days · ${bShort(v("page_impressions"))} impressions`, icon: "eye" },
    { label: "Engagement", value: bShort(v("page_post_engagements")), note: "reactions, comments, shares", icon: "heart" },
    { label: "Video views", value: bShort(v("page_video_views")), note: `${bShort(v("page_views_total"))} Page views`, icon: "play" },
  ];
  const s = SERIES.find((x) => x.key === series);
  const vals = ((pick(s.metrics) || {}).series || []).slice(-14);
  const max = Math.max(1, ...vals.map((x) => x.v));

  return (
    <>
      <div className="fi-stats">
        {STATS.map((st, i) => (
          <div key={st.label} className={`br-stat ${st.dark ? "br-stat--dark" : ""}`}>
            <p className="br-stat__label">
              <ToneIcon icon={st.icon} tone={st.dark ? "dark" : ["blue", "red", "orange"][i - 1]} size={30} />
              {st.label}
            </p>
            <p className="br-stat__value">{st.value}</p>
            <p className="br-stat__note">{st.note}</p>
          </div>
        ))}
      </div>

      <section className="br-card fi-card">
        <div className="br-card__head">
          <div className="fi-titlerow">
            <span className="fi-ic">
              <BarChart size={16} />
            </span>
            <div>
              <h2 className="br-card__title">Page {s.label.toLowerCase()}</h2>
              <p className="br-card__sub">{s.sub}</p>
            </div>
          </div>
          <div className="br-seg">
            {SERIES.map((x) => (
              <button key={x.key} type="button" className={series === x.key ? "is-on" : ""} onClick={() => setSeries(x.key)}>
                {x.label}
              </button>
            ))}
          </div>
        </div>

        {vals.length ? (
          <div className="fi-chart" role="img" aria-label={`Page ${s.label} chart`}>
            {vals.map((x, i) => {
              const last = i === vals.length - 1;
              const recent = i >= vals.length - 4;
              return (
                <div key={x.d + i} className="fi-col">
                  <span className={`fi-bar ${last ? "is-last" : recent ? "is-recent" : ""}`} style={{ height: `${Math.max(2, (x.v / max) * 100)}%` }} title={`${bDate(x.d, false)}: ${bShort(x.v)} ${s.unit}`} />
                  <small>{bDate(x.d, false)}</small>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="fi-none">Facebook doesn’t report this number for this Page.</p>
        )}
      </section>

      <div className="br-table-wrap fi-table">
        <table className="br-table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Reach</th>
              <th>Reactions</th>
              <th>Comments</th>
              <th>Shares</th>
              <th>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {posts.list.slice(0, shown).map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="fi-post">
                    <span style={{ background: p.image ? `center / cover no-repeat url("${p.image}")` : bGrad(p.id) }} />
                    <strong>{(p.message || "(no text)").split("\n")[0].slice(0, 60)}</strong>
                  </span>
                </td>
                <td>
                  <b>{bShort(p.reach)}</b>
                </td>
                <td>{bShort(p.reactions)}</td>
                <td>{bShort(p.comments)}</td>
                <td>{bShort(p.shares)}</td>
                <td>{bShort(p.clicks)}</td>
              </tr>
            ))}
            {!posts.list.length && (
              <tr>
                <td colSpan={6} className="fi-none">
                  {posts.loading ? "Loading posts…" : "No posts yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="br-more fi-more">
          {shown < posts.list.length ? (
            <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 4)}>
              Load more <ChevronDown size={14} />
            </button>
          ) : (
            <span>Straight from Facebook Page insights. A dash means Facebook doesn’t report that number.</span>
          )}
        </div>
      </div>
    </>
  );
}
