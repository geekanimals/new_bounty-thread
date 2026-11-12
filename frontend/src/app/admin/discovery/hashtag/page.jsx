"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DiscoveryHead from "@/components/admin/discovery/DiscoveryHead";

const POSTS = {
  top: [
    ["@homewithriya", "2.4k", 86],
    ["@decor.daily", "1.8k", 41],
    ["@thefestiveedit", "3.1k", 120],
    ["@nestandnook", "0.9k", 22],
  ],
  recent: [
    ["@nestandnook", "0.9k", 22],
    ["@diyadesigns", "0.4k", 12],
    ["@homewithriya", "2.4k", 86],
    ["@rangoli.by.ritu", "0.2k", 9],
  ],
};

/* Discovery → Hashtag search (Figma 054) */
export default function DiscoveryHashtag() {
  const [tag, setTag] = useState("");
  const [mode, setMode] = useState("top");
  const [shown, setShown] = useState({ tag: "#diwalidecor", mode: "top" });
  const [used, setUsed] = useState(1);

  const search = (e) => {
    e?.preventDefault();
    const t = tag.trim().replace(/^#?/, "#");
    const next = t.length > 1 ? t : "#diwalidecor";
    if (next !== shown.tag) setUsed((u) => Math.min(30, u + 1));
    setShown({ tag: next, mode });
  };

  return (
    <AdminShell>
      <DiscoveryHead />
      <section className="dg-card ad-card">
        <div className="dg-top">
          <div>
            <h2 className="ad-h2">Hashtag search</h2>
            <p className="dg-sub">See the top and most recent public posts using a hashtag on Instagram.</p>
          </div>
          <span className="ad-badge">Searching with @geekanimals</span>
        </div>
        <form className="dg-row" onSubmit={search}>
          <input className="ad-input dg-q" placeholder="#diwalidecor" value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Hashtag" />
          <div className="dg-mode" role="tablist">
            {[
              ["top", "Top posts"],
              ["recent", "Most recent"],
            ].map(([k, l]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={mode === k}
                className={`ad-tab ${mode === k ? "is-on" : ""}`}
                onClick={() => {
                  setMode(k);
                  setShown((s) => ({ ...s, mode: k }));
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <button type="submit" className="ad-btn ad-btn--primary dg-go">
            🔎 Search
          </button>
        </form>
        <p className="dg-note">
          <span>ℹ️</span> Meta allows 30 different hashtags per 7 days for each connected account.
          {used > 1 && <b> {used}/30 used this week.</b>}
        </p>
        <div className="dg-grid">
          {POSTS[shown.mode].map(([h, likes, com]) => (
            <div key={h + shown.mode} className="dg-post">
              <span className="dg-img" />
              <strong>{h}</strong>
              <small>
                ❤️ {likes} · 💬 {com}
              </small>
              <a href={`https://www.instagram.com/explore/tags/${shown.tag.slice(1)}/`} target="_blank" rel="noreferrer">
                Open post ↗
              </a>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .dg-card { padding: 25px 22px 44px; }
        .dg-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .dg-top .ad-badge { margin-top: 9px; }
        .dg-sub { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .dg-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 17px; }
        .dg-q { width: 270px; height: 44px; margin-top: 10px; }
        .dg-mode { display: flex; gap: 8px; }
        .dg-mode .ad-tab:not(.is-on) { color: #67718a; }
        .dg-go { height: 42px; margin-top: 12px; }
        .dg-note { display: flex; align-items: center; gap: 10px; margin-top: 20px; padding: 12px 15px; border-radius: 12px; background: #fff7e8; border: 1px solid #f5dfb5; font-size: 12px; color: #986016; }
        .dg-note b { font-weight: 700; }
        .dg-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 17px; }
        .dg-post { display: flex; flex-direction: column; padding: 20px 19px 20px; border-radius: 16px; border: 1px solid var(--ad-line); }
        .dg-img { display: block; aspect-ratio: 220 / 120; border-radius: 12px; background: #ebe7fc; margin-bottom: 12px; }
        .dg-post strong { font-size: 14px; font-weight: 700; }
        .dg-post small { margin-top: 2px; font-size: 12px; color: var(--ad-muted); }
        .dg-post a { margin-top: 3px; font-size: 14px; font-weight: 800; color: #6151ea; }
        @media (max-width: 1023px) { .dg-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .dg-card { padding: 18px 16px 20px; }
          .dg-top { flex-direction: column; gap: 0; }
          .dg-q { width: 100%; margin-top: 0; }
          .dg-go { margin-top: 0; margin-left: auto; }
          .dg-note { align-items: flex-start; }
          .dg-grid { gap: 10px; }
          .dg-post { padding: 12px; }
        }
      `}</style>
    </AdminShell>
  );
}
