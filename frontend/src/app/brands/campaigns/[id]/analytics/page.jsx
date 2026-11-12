"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import BrandShell, { ToneIcon } from "@/components/brands/BrandShell";
import CampaignTop from "@/components/brands/CampaignTop";
import { getCampaign, getCreator, VIEWS_DAILY, TOP_POSTS, WHO_WATCHED, CAMPAIGN_CREATORS } from "@/components/brands/data";
import { BarChart, Play, Eye, ChevronDown, Rupee } from "@/components/ui/Icons";

const STATS = [
  { label: "Views", value: "1.62M", note: "goal 1.37M · +18%", icon: "eye", dark: true },
  { label: "Reach", value: "1.08M", note: "unique people", icon: "users", tone: "blue" },
  { label: "Engagement", value: "6.8%", note: "likes, comments, saves", icon: "heart", tone: "red" },
  { label: "Saves", value: "21.4K", note: "strong buy signal", icon: "package", tone: "orange" },
  { label: "Cost per view", value: "₹0.26", note: "vs ₹0.40 target", icon: "wallet", tone: "green" },
];
// Chart ke 3 modes — har mode mein numbers ka scale alag
const MODES = [
  { key: "views", label: "Views", scale: 1, unit: (v) => `${Math.round(v * 2.4)}K views` },
  { key: "eng", label: "Engagement", scale: 0.8, unit: (v) => `${(4 + v / 30).toFixed(1)}% eng.` },
  { key: "clicks", label: "Clicks", scale: 0.6, unit: (v) => `${Math.round(v * 22)} clicks` },
];

const vNum = (s) => (s === "—" ? 0 : parseFloat(s) * (/M/.test(s) ? 1000 : 1));

/** /brands/campaigns/[id]/analytics — views, top posts, kisne dekha */
export default function CampaignAnalytics() {
  const { id } = useParams();
  const c = getCampaign(id);
  const [mode, setMode] = useState("views");
  const [shown, setShown] = useState(5);
  if (!c) notFound();

  const m = MODES.find((x) => x.key === mode);
  // Engagement / clicks ke liye thoda alag shape — taaki toggle par chart badle
  const data = VIEWS_DAILY.map((d, i) => ({
    ...d,
    v: mode === "views" ? d.v : Math.max(6, Math.round(d.v * m.scale + (i % 3) * 6 * (mode === "eng" ? 1 : -0.5))),
  }));
  const max = Math.max(...data.map((d) => d.v));
  const byCreator = CAMPAIGN_CREATORS.filter((r) => r.views !== "—").sort((a, b) => vNum(b.views) - vNum(a.views));
  const top = vNum(byCreator[0].views);

  return (
    <BrandShell crumbs={[{ label: "Campaigns", href: "/brands/campaigns" }, { label: c.title }]}>
      <title>{`${c.title} · Analytics — Geek OS Brand`}</title>
      <CampaignTop c={c} />

      <div className="ca-stats">
        {STATS.map((s) => (
          <div key={s.label} className={`br-stat ${s.dark ? "br-stat--dark" : ""}`}>
            <p className="br-stat__label">
              <ToneIcon icon={s.icon} tone={s.dark ? "dark" : s.tone} size={30} />
              {s.label}
            </p>
            <p className="br-stat__value">{s.label === "Views" && c.status !== "live" ? c.views : s.value}</p>
            <p className="br-stat__note">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Views over time */}
      <section className="br-card ca-card">
        <div className="br-card__head">
          <div className="ca-titlerow">
            <span className="ca-ic">
              <BarChart size={16} />
            </span>
            <div>
              <h2 className="br-card__title">{m.label} over time</h2>
              <p className="br-card__sub">Every live post, added up daily</p>
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
        <div className="ca-chart" data-scroll>
          {data.map((d, i) => {
            const last = i === data.length - 1;
            const recent = i >= data.length - 4;
            return (
              <div key={d.d} className="ca-col" title={m.unit(d.v)}>
                <span className="ca-tip">{m.unit(d.v)}</span>
                <span className={`ca-barv ${last ? "is-last" : recent ? "is-recent" : ""}`} style={{ height: `${(d.v / max) * 100}%` }} />
                <small>{d.d}</small>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top 5 posts */}
      <section className="br-card ca-card">
        <div className="br-card__head">
          <div>
            <h2 className="br-card__title">Top 5 posts</h2>
            <p className="br-card__sub">Pictures are saved copies — they never break</p>
          </div>
          <span className="br-link">All {c.postsLive} posts</span>
        </div>
        <div className="ca-posts" data-scroll>
          {TOP_POSTS.map((p, i) => (
            <a key={p.id} href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="ca-post">
              <span className="br-thumb" style={{ background: p.g }}>
                <span className="br-thumb__rank">#{i + 1}</span>
                <span className="br-thumb__play">
                  <Play size={11} />
                </span>
                <span className="br-thumb__views">
                  <Eye size={11} /> {p.views}
                </span>
              </span>
              <strong>{p.handle}</strong>
              <small>
                {p.eng} eng. · {p.clicks} clicks
              </small>
            </a>
          ))}
        </div>
      </section>

      <div className="ca-grid">
        {/* By creator */}
        <section className="br-card ca-card ca-by">
          <h2 className="br-card__title">By creator</h2>
          <p className="br-card__sub">Views · engagement · clicks</p>
          <ul>
            {byCreator.slice(0, shown).map((r) => {
              const cr = getCreator(r.id);
              return (
                <li key={r.id}>
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
                    <i style={{ width: `${(vNum(r.views) / top) * 100}%` }} />
                  </span>
                  <strong className="ca-by__v">{r.views}</strong>
                  <span className="ca-by__e">{r.eng}</span>
                </li>
              );
            })}
          </ul>
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
          <ul>
            {WHO_WATCHED.map((w) => (
              <li key={w.label}>
                <span className="ca-who__row">
                  <span>{w.label}</span>
                  <strong>{w.value}%</strong>
                </span>
                <span className="ca-who__bar">
                  <i style={{ width: `${w.value}%`, background: w.tone }} />
                </span>
              </li>
            ))}
          </ul>
          <p className="ca-who__note">
            <Rupee size={12} /> ₹0.26 per view — 35% cheaper than your target.
          </p>
        </section>
      </div>

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
      `}</style>
    </BrandShell>
  );
}
