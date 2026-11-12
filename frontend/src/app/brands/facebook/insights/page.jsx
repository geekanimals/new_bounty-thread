"use client";

import { useState } from "react";
import BrandShell, { ToneIcon } from "@/components/brands/BrandShell";
import FacebookTabs from "@/components/brands/FacebookTabs";
import { FB_INSIGHTS } from "@/components/brands/data";
import { BarChart, ChevronDown } from "@/components/ui/Icons";

const SERIES = [
  { key: "reach", label: "Reach", sub: "People who saw anything from your Page, by day", unit: "K people" },
  { key: "engagement", label: "Engagement", sub: "Reactions, comments and shares, by day", unit: "K actions" },
  { key: "video", label: "Video views", sub: "3-second video views, by day", unit: "K views" },
];

/** /brands/facebook/insights — Page ke numbers */
export default function FacebookInsights() {
  const [series, setSeries] = useState("reach");
  const [shown, setShown] = useState(4);
  const s = SERIES.find((x) => x.key === series);
  const vals = FB_INSIGHTS.series[series];
  const max = Math.max(...vals);

  return (
    <BrandShell>
      <title>Facebook insights — Geek OS Brand</title>
      <FacebookTabs />

      <div className="fi-stats">
        {FB_INSIGHTS.stats.map((st, i) => (
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

        <div className="fi-chart" role="img" aria-label={`Page ${s.label} chart`}>
          {vals.map((v, i) => {
            const last = i === vals.length - 1;
            const recent = i >= vals.length - 4;
            return (
              <div key={i} className="fi-col">
                <span className={`fi-bar ${last ? "is-last" : recent ? "is-recent" : ""}`} style={{ height: `${(v / max) * 100}%` }} title={`${FB_INSIGHTS.days[i]}: ${v}${s.unit}`} />
                <small>{FB_INSIGHTS.days[i]}</small>
              </div>
            );
          })}
        </div>
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
            {FB_INSIGHTS.posts.slice(0, shown).map((p) => (
              <tr key={p.title}>
                <td>
                  <span className="fi-post">
                    <span style={{ background: p.g }} />
                    <strong>{p.title}</strong>
                  </span>
                </td>
                <td>
                  <b>{p.reach}</b>
                </td>
                <td>{p.reactions}</td>
                <td>{p.comments}</td>
                <td>{p.shares}</td>
                <td>{p.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="br-more fi-more">
          {shown < FB_INSIGHTS.posts.length ? (
            <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 4)}>
              Load more <ChevronDown size={14} />
            </button>
          ) : (
            <span>That’s all posts from the last 28 days</span>
          )}
        </div>
      </div>

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
      `}</style>
    </BrandShell>
  );
}
