"use client";

import { useState } from "react";
import BrandShell, { ToneIcon } from "@/components/brands/BrandShell";
import { IG, BRAND } from "@/components/brands/data";
import { Refresh, Users, Clock, Play, Eye, Check } from "@/components/ui/Icons";

const RANGES = ["7", "30", "90"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = ["9a", "11a", "1p", "3p", "5p", "7p", "9p", "11p"];
// Heatmap: kab followers online hote hain (0–4 level)
const HEAT = [
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 3, 3, 3, 3, 2, 1],
  [1, 2, 3, 4, 4, 4, 3, 1],
  [1, 2, 3, 4, 4, 4, 3, 1],
];
const SHADES = ["#fdeef3", "#f9cfdc", "#f2a4bf", "#e86b98", "#d9346f"];
const SORTS = [
  { key: "reach", label: "Reach" },
  { key: "saves", label: "Saves" },
  { key: "shares", label: "Shares" },
];
const num = (s) => {
  const n = parseFloat(String(s).replace(/[^\d.]/g, "")) || 0;
  return /M/i.test(s) ? n * 1e6 : /K/i.test(s) ? n * 1000 : n;
};

/** /brands/instagram — brand ka apna Instagram business account */
export default function BrandInstagram() {
  const [range, setRange] = useState("30");
  const [busy, setBusy] = useState(false);
  const [updated, setUpdated] = useState(IG.updated);
  const [sort, setSort] = useState("reach");

  const stats = IG.stats[range];
  // range ke hisaab se chart ke bars (7 din = kam bars)
  const bars = range === "7" ? IG.growth.slice(-7) : range === "90" ? [...IG.growth.slice(0, 4).map((v) => Math.round(v * 0.6)), ...IG.growth] : IG.growth;
  const max = Math.max(...bars);
  const best = [...IG.best].sort((a, b) => num(b[sort]) - num(a[sort]));
  const gain = { "7": "+6.1K in 7 days", "30": "+28.4K in 30 days", "90": "+71.2K in 90 days" }[range];
  const pct = { "7": "+0.2%", "30": "+0.9%", "90": "+2.1%" }[range];

  const refresh = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setUpdated("updated just now");
    }, 1100);
  };

  return (
    <BrandShell>
      <title>Instagram — Geek OS Brand</title>

      <p className="br-eyebrow">Social</p>
      <h1 className="br-h1">Instagram</h1>
      <p className="br-sub">Your own Instagram business account — how it grows while campaigns run.</p>

      {/* Account row */}
      <section className="br-card ig-acc">
        <span className="ig-acc__ring">
          <span style={{ background: BRAND.gradient }}>{BRAND.letter}</span>
        </span>
        <div className="ig-acc__txt">
          <strong>
            {IG.handle} <Check size={13} />
          </strong>
          <small>Business account · connected through Facebook · {updated}</small>
        </div>
        <div className="ig-acc__right">
          <div className="br-seg">
            {RANGES.map((r) => (
              <button key={r} type="button" className={range === r ? "is-on" : ""} onClick={() => setRange(r)}>
                {r} days
              </button>
            ))}
          </div>
          <button type="button" className="br-btn br-btn--ghost br-btn--sm ig-refresh" onClick={refresh} disabled={busy}>
            <span className={busy ? "ig-spin" : ""}>
              <Refresh size={13} />
            </span>
            {busy ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      {/* Stats */}
      <div className="ig-stats">
        {stats.map((s, i) => (
          <div key={s.label} className={`br-stat ${s.dark ? "br-stat--dark" : ""}`}>
            <p className="br-stat__label">
              <ToneIcon icon={s.icon} tone={s.dark ? "dark" : ["blue", "orange", "green"][i - 1]} size={30} />
              {s.label}
            </p>
            <p className="br-stat__value">{s.value}</p>
            <p className="br-stat__note">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="ig-grid">
        {/* Followers growth */}
        <section className="br-card ig-card">
          <div className="br-card__head">
            <div className="ig-titlerow">
              <span className="ig-ic">
                <Users size={16} />
              </span>
              <div>
                <h2 className="br-card__title">Followers</h2>
                <p className="br-card__sub">{gain}</p>
              </div>
            </div>
            <span className="br-badge br-badge--green">{pct}</span>
          </div>
          <div className="ig-chart" role="img" aria-label="Followers growth chart">
            {bars.map((v, i) => {
              const last = i === bars.length - 1;
              const recent = i >= bars.length - 4;
              return (
                <span
                  key={i}
                  className={last ? "is-last" : recent ? "is-recent" : ""}
                  style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
                  title={`${v}K new followers`}
                />
              );
            })}
          </div>
        </section>

        {/* Best time */}
        <section className="br-card ig-card">
          <h2 className="br-card__title">Best time to post</h2>
          <p className="br-card__sub">When your followers are online</p>
          <div className="ig-heat">
            {DAYS.map((d, di) => (
              <div key={d} className="ig-heat__row">
                <span className="ig-heat__day">{d}</span>
                {HEAT[di].map((lv, hi) => (
                  <i key={hi} style={{ background: SHADES[lv] }} title={`${d} ${HOURS[hi]}`} />
                ))}
              </div>
            ))}
            <div className="ig-heat__row ig-heat__hours">
              <span className="ig-heat__day" />
              {HOURS.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
          </div>
          <p className="ig-best">
            <Clock size={14} /> Best: Sat &amp; Sun, 7–9 pm
          </p>
        </section>
      </div>

      {/* Best posts */}
      <section className="br-card ig-card ig-posts">
        <div className="br-card__head">
          <div>
            <h2 className="br-card__title">Your best posts</h2>
            <p className="br-card__sub">Last {range} days, by {sort}</p>
          </div>
          <div className="br-seg">
            {SORTS.map((s) => (
              <button key={s.key} type="button" className={sort === s.key ? "is-on" : ""} onClick={() => setSort(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="ig-tiles" data-scroll>
          {best.map((p) => (
            <a key={p.title} href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="ig-tile">
              <span className="br-thumb" style={{ background: p.g }}>
                <span className="br-thumb__play">
                  <Play size={11} />
                </span>
                <span className="br-thumb__views">
                  {sort === "reach" && <Eye size={11} />}
                  {p[sort]}
                  {sort !== "reach" && ` ${sort}`}
                </span>
              </span>
              <strong>{p.title}</strong>
            </a>
          ))}
        </div>
      </section>

      <style>{`
        .ig-acc { display: flex; align-items: center; gap: 14px; margin: 22px 0 16px; padding: 16px 18px; flex-wrap: wrap; }
        .ig-acc__ring { padding: 3px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #e8336d, #8b5cf6); flex-shrink: 0; }
        .ig-acc__ring span { width: 46px; height: 46px; border-radius: 50%; border: 2px solid #fff; display: grid; place-items: center; color: #fff; font-weight: 800; font-size: 16px; }
        .ig-acc__txt { flex: 1; min-width: 200px; }
        .ig-acc__txt strong { display: inline-flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 800; }
        .ig-acc__txt strong svg { color: var(--br-blue); }
        .ig-acc__txt small { display: block; font-size: 12.5px; color: var(--br-muted); }
        .ig-acc__right { display: flex; align-items: center; gap: 10px; }
        .ig-refresh { min-width: 110px; }
        .ig-refresh > span { display: inline-grid; }
        .ig-spin { animation: igSpin .8s linear infinite; }
        @keyframes igSpin { to { transform: rotate(360deg); } }

        .ig-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        .ig-grid { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr); gap: 18px; margin-top: 18px; }
        .ig-card { padding: 22px; }
        .ig-titlerow { display: flex; align-items: center; gap: 12px; }
        .ig-ic { width: 36px; height: 36px; border-radius: 10px; background: var(--br-lilac); color: var(--br-primary); display: grid; place-items: center; }
        .ig-chart { display: flex; align-items: flex-end; gap: 8px; height: 200px; padding-top: 10px; }
        .ig-chart span { flex: 1; min-width: 0; border-radius: 7px 7px 4px 4px; background: #eef0f5; transition: height .3s; }
        .ig-chart span.is-recent { background: #ffd2e0; }
        .ig-chart span.is-last { background: linear-gradient(180deg, #f59e0b, #e8336d); }

        .ig-heat { margin-top: 14px; display: grid; gap: 4px; }
        .ig-heat__row { display: grid; grid-template-columns: 34px repeat(8, minmax(0, 1fr)); gap: 4px; align-items: center; }
        .ig-heat__row i { height: 16px; border-radius: 4px; }
        .ig-heat__day { font-size: 11px; color: var(--br-muted); }
        .ig-heat__hours span:not(.ig-heat__day) { text-align: center; font-size: 10px; color: var(--br-faint); }
        .ig-best { display: flex; align-items: center; gap: 8px; margin: 14px 0 0; padding: 10px 12px; border-radius: 10px; background: var(--br-pink-bg); color: var(--br-pink); font-size: 13px; font-weight: 700; }

        .ig-posts { margin-top: 18px; }
        .ig-tiles { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; }
        .ig-tile strong { display: block; margin-top: 8px; font-size: 13px; font-weight: 700; }
        .ig-tile .br-thumb { aspect-ratio: 5 / 6; transition: transform .2s; }
        .ig-tile:hover .br-thumb { transform: translateY(-2px); }

        @media (max-width: 1200px) {
          .ig-tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 1100px) {
          .ig-grid { grid-template-columns: minmax(0, 1fr); }
          .ig-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .ig-acc { padding: 14px; }
          .ig-acc__right { width: 100%; }
          .ig-acc__right .br-seg { flex: 1; }
          .ig-acc__right .br-seg button { flex: 1; }
          .ig-stats { gap: 10px; }
          .ig-card { padding: 18px; }
          .ig-card .br-card__head { flex-wrap: wrap; }
          .ig-chart { height: 150px; gap: 4px; }
          .ig-tiles { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 4px; }
          .ig-tile { flex: 0 0 42%; scroll-snap-align: start; }
        }
      `}</style>
    </BrandShell>
  );
}
