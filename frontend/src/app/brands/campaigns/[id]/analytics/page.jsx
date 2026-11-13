"use client";

import { useState } from "react";
import { ToneIcon } from "@/components/brands/BrandShell";
import CampaignFrame from "@/components/brands/CampaignFrame";
import { BrLoading, BrError } from "@/components/brands/BrandStates";
import { useCampaignAnalytics, useTopPosts, useTrackReport, bWho, bShort, bEr, bGrad } from "@/services/brand";
import { BarChart, Play, Eye, ChevronDown, Rupee } from "@/components/ui/Icons";

const MODES = [
  { key: "views", label: "Views", unit: (v) => `${bShort(v)} views` },
  { key: "eng", label: "Engagement", unit: (v) => `${bShort(v)} likes, comments, shares & saves` },
  { key: "clicks", label: "Clicks", unit: (v) => `${bShort(v)} link clicks` },
];

/** posts ko din ke hisaab se jodo (post ki date / numbers ki date) → [{ d: "12", v }] */
function daily(creators, mode) {
  const by = {};
  (creators || []).forEach((r) =>
    (r.posts || []).forEach((p) => {
      const st = p.stats || {};
      const day = String(p.posted_at || st.at || "").slice(0, 10);
      if (!day) return;
      const v = mode === "views" ? Number(st.views) || 0 : ["likes", "comments", "shares", "saves"].reduce((a, k) => a + (Number(st[k]) || 0), 0);
      by[day] = (by[day] || 0) + v;
    })
  );
  return Object.keys(by)
    .sort()
    .slice(-14)
    .map((k) => ({ key: k, d: String(Number(k.slice(8, 10))), v: by[k] }));
}

/** /brands/campaigns/[id]/analytics — views, top posts, har creator (purana paintAnalytics: campaign_analytics + brand_top_posts) */
export default function CampaignAnalytics() {
  return (
    <>
      <CampaignFrame tab="Analytics">{(d, c) => <AnalyticsTab id={c.id} />}</CampaignFrame>

      <style>{`
        .ca-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
        .ca-card { padding: 22px; margin-top: 18px; }
        .ca-titlerow { display: flex; align-items: center; gap: 12px; }
        .ca-ic { width: 36px; height: 36px; border-radius: 10px; background: var(--br-lilac); color: var(--br-primary); display: grid; place-items: center; flex-shrink: 0; }

        .ca-chart { display: flex; align-items: flex-end; gap: 10px; height: 220px; padding-top: 24px; }
        .ca-col { position: relative; flex: 1; min-width: 26px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 8px; }
        .ca-barv { width: 100%; max-width: 46px; border-radius: 8px 8px 4px 4px; background: #eceef5; transition: height .3s ease; }
        .ca-barv.is-recent { background: #ddd6fe; }
        .ca-barv.is-last { background: linear-gradient(180deg, #7c5cff, #c026d3); }
        .ca-col small { font-size: 11px; color: var(--br-faint); }
        .ca-tip {
          position: absolute; bottom: calc(100% - 18px); left: 50%; transform: translateX(-50%);
          padding: 3px 8px; border-radius: 6px; background: var(--br-ink); color: #fff; font-size: 11px; font-weight: 600;
          white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .15s;
        }
        .ca-col:hover .ca-tip { opacity: 1; }
        .ca-col:hover .ca-barv:not(.is-last) { background: #c4b5fd; }

        .ca-posts { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
        .ca-post strong { display: block; margin-top: 10px; font-size: 13.5px; font-weight: 700; }
        .ca-post small { display: block; font-size: 12px; color: var(--br-muted); }

        .ca-grid { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); gap: 18px; align-items: start; }
        .ca-by ul, .ca-who ul { list-style: none; margin: 14px 0 0; padding: 0; }
        .ca-by li { display: grid; grid-template-columns: minmax(150px, 1.3fr) minmax(80px, 1fr) 60px 50px; align-items: center; gap: 14px; padding: 11px 0; border-top: 1px solid var(--br-border); }
        .ca-by__v { font-size: 13px; font-weight: 800; }
        .ca-by__e { font-size: 12.5px; color: var(--br-muted); }
        .ca-who li { padding: 8px 0; }
        .ca-who__row { display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 6px; }
        .ca-who__row strong { font-weight: 800; }
        .ca-who__bar { display: block; height: 6px; border-radius: 999px; background: #eceef5; overflow: hidden; }
        .ca-who__bar i { display: block; height: 100%; border-radius: inherit; }
        .ca-who__note { display: flex; align-items: center; gap: 6px; margin: 12px 0 0; padding: 10px 12px; border-radius: 10px; background: var(--br-green-bg); color: var(--br-green); font-size: 12px; font-weight: 600; }

        @media (max-width: 1280px) { .ca-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 1100px) {
          .ca-grid { grid-template-columns: 1fr; }
          .ca-posts { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .ca-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .ca-stats .br-stat:first-child { grid-column: 1 / -1; }
          .ca-card { padding: 18px; }
          .ca-card .br-card__head { flex-wrap: wrap; }
          .ca-chart { overflow-x: auto; gap: 8px; height: 200px; }
          .ca-posts { display: flex; overflow-x: auto; padding-bottom: 4px; }
          .ca-post { flex: 0 0 44%; }
          .ca-by li { grid-template-columns: minmax(0, 1fr) 54px 42px; }
          .ca-by__bar { grid-column: 1 / -1; grid-row: 2; }
        }
              .ca-none { margin: 6px 0 0; font-size: 13px; color: var(--br-muted); line-height: 1.55; }
        .ca-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
        .ca-post .br-thumb { position: relative; overflow: hidden; }
        .ca-post .br-thumb > span { z-index: 1; }
`}</style>
    </>
  );
}

function AnalyticsTab({ id }) {
  const an = useCampaignAnalytics(id);
  const top = useTopPosts(id);
  const [mode, setMode] = useState("views");
  const [shown, setShown] = useState(5);
  const trk = useTrackReport(mode === "clicks" ? id : null); // clicks sirf maangne par (tracking.js track_report)

  if (an.loading && !an.data) return <BrLoading rows={6} />;
  if (an.error) return <BrError error={an.error.message} onRetry={an.reload} />;

  const a = an.data || {};
  const t = a.totals || {};
  const R = (a.creators || []).filter((r) => (r.posts || []).length);
  const STATS = [
    { label: "Views", value: bShort(t.views), note: `${bShort(t.posts)} posts live`, icon: "eye", dark: true },
    { label: "Reach", value: bShort(t.reach), note: "unique people", icon: "users", tone: "blue" },
    { label: "Engagement", value: bEr(t), note: "likes, comments, shares, saves on views", icon: "heart", tone: "red" },
    { label: "Saves", value: bShort(t.saves), note: `${bShort(t.shares)} shares`, icon: "package", tone: "orange" },
    { label: "Creators posted", value: bShort(t.creators_live), note: `${bShort(t.followers)} followers reached`, icon: "user", tone: "green" },
  ];
  const m = MODES.find((x) => x.key === mode);
  const data =
    mode === "clicks"
      ? (((trk.data || {}).daily || []).slice(-14).map((x) => ({ key: x.d, d: String(Number(String(x.d).slice(8, 10))), v: Number(x.clicks) || 0 })))
      : daily(a.creators, mode);
  const max = Math.max(1, ...data.map((x) => x.v));
  const byCreator = [...R].sort((p, q) => (Number(q.totals?.views) || 0) - (Number(p.totals?.views) || 0));
  const topV = Math.max(1, Number(byCreator[0]?.totals?.views) || 0);

  return (
    <>
      <div className="ca-stats">
        {STATS.map((s) => (
          <div key={s.label} className={`br-stat ${s.dark ? "br-stat--dark" : ""}`}>
            <p className="br-stat__label">
              <ToneIcon icon={s.icon} tone={s.dark ? "dark" : s.tone} size={30} />
              {s.label}
            </p>
            <p className="br-stat__value">{s.value}</p>
            <p className="br-stat__note">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Over time */}
      <section className="br-card ca-card">
        <div className="br-card__head">
          <div className="ca-titlerow">
            <span className="ca-ic">
              <BarChart size={16} />
            </span>
            <div>
              <h2 className="br-card__title">{m.label} over time</h2>
              <p className="br-card__sub">{mode === "clicks" ? "Clicks on creators’ links, by day" : "Every live post, added up by the day it went live"}</p>
            </div>
          </div>
          <div className="br-seg">
            {MODES.map((x) => (
              <button key={x.key} type="button" className={mode === x.key ? "is-on" : ""} onClick={() => setMode(x.key)}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
        {data.length ? (
          <div className="ca-chart" data-scroll>
            {data.map((x, i) => {
              const last = i === data.length - 1;
              const recent = i >= data.length - 4;
              return (
                <div key={x.key} className="ca-col" title={`${x.key}: ${m.unit(x.v)}`}>
                  <span className="ca-tip">{m.unit(x.v)}</span>
                  <span className={`ca-barv ${last ? "is-last" : recent ? "is-recent" : ""}`} style={{ height: `${Math.max(2, (x.v / max) * 100)}%` }} />
                  <small>{x.d}</small>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="ca-none">{mode === "clicks" && trk.loading ? "Loading clicks…" : "Numbers show up here as soon as creators post."}</p>
        )}
      </section>

      {/* Top 5 posts */}
      <section className="br-card ca-card">
        <div className="br-card__head">
          <div>
            <h2 className="br-card__title">Top 5 posts</h2>
            <p className="br-card__sub">Pictures are saved copies — they never break</p>
          </div>
          <span className="br-link">All {bShort(t.posts)} posts</span>
        </div>
        {top.list.length ? (
          <div className="ca-posts" data-scroll>
            {top.list.map((p, i) => {
              const c = bWho(p.creator);
              const img = p.thumb || (p.creator || {}).profile_picture_url;
              return (
                <a key={p.permalink + i} href={p.permalink} target="_blank" rel="noopener noreferrer" className="ca-post">
                  <span className="br-thumb" style={{ background: bGrad(p.permalink) }}>
                    {img && <img className="ca-img" src={img} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => e.currentTarget.remove()} />}
                    <span className="br-thumb__rank">#{i + 1}</span>
                    <span className="br-thumb__play">
                      <Play size={11} />
                    </span>
                    <span className="br-thumb__views">
                      <Eye size={11} /> {bShort(p.views)}
                    </span>
                  </span>
                  <strong>{c.handle || c.name}</strong>
                  <small>
                    {p.er != null ? `${p.er}% eng.` : "—"} · {bShort(p.likes)} likes
                  </small>
                </a>
              );
            })}
          </div>
        ) : (
          <p className="ca-none">{top.loading ? "Loading top posts…" : "No posts yet."}</p>
        )}
      </section>

      <div className="ca-grid">
        {/* By creator */}
        <section className="br-card ca-card ca-by">
          <h2 className="br-card__title">By creator</h2>
          <p className="br-card__sub">Views · engagement</p>
          {byCreator.length ? (
            <ul>
              {byCreator.slice(0, shown).map((r) => {
                const cr = bWho(r.creator);
                const q = r.totals || {};
                return (
                  <li key={r.participation_id || r.invite_id || cr.name}>
                    <span className="br-who">
                      <span className="br-av br-av--sm" style={{ background: cr.av }}>
                        {cr.initials}
                      </span>
                      <span>
                        <strong>{cr.name}</strong>
                        <small>{cr.handle}</small>
                      </span>
                    </span>
                    <span className="br-bar ca-by__bar">
                      <i style={{ width: `${((Number(q.views) || 0) / topV) * 100}%` }} />
                    </span>
                    <strong className="ca-by__v">{bShort(q.views)}</strong>
                    <span className="ca-by__e">{bEr(q)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="ca-none">No posts yet — numbers show up as soon as creators post.</p>
          )}
          {byCreator.length > shown && (
            <div className="br-more">
              <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 5)}>
                Load more <ChevronDown size={14} />
              </button>
            </div>
          )}
        </section>

        {/* Who watched */}
        <section className="br-card ca-card ca-who">
          <h2 className="br-card__title">Who watched</h2>
          <p className="br-card__sub">From creators’ connected Instagram</p>
          <p className="ca-none">Audience (city / age / gender) shows on each creator’s profile once they share their Instagram insights.</p>
          <p className="ca-who__note">
            <Rupee size={12} /> {t.waiting_numbers ? `${t.waiting_numbers} post${t.waiting_numbers === 1 ? "" : "s"} still waiting for numbers.` : "Numbers refresh as Instagram updates them."}
          </p>
        </section>
      </div>
    </>
  );
}
