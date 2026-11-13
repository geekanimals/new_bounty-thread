"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import CreatorDrawer from "@/components/admin/creator/CreatorDrawer";
import { useRpc } from "@/lib/supabase";
import { kNum } from "@/components/admin/creator/live";

/* public_profile ki audience → % (purane mk-audience.js jaisa) */
const AGES = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
function audience(aud) {
  aud = aud || {};
  const g = { F: 0, M: 0, U: 0 }, ages = {};
  Object.entries(aud.gender_age || {}).forEach(([k, v]) => {
    v = Number(v) || 0;
    const m = /^\s*([A-Za-z])[^0-9]*(.*)$/.exec(String(k)) || [];
    let s = String(m[1] || "").toUpperCase();
    if (!(s in g)) s = "U";
    g[s] += v;
    const a = String(m[2] || "").trim() || "?";
    ages[a] = (ages[a] || 0) + v;
  });
  const tot = g.F + g.M + g.U;
  const pc = (v, t) => (t ? Math.round((100 * v) / t) : 0);
  const top = (o, k) => {
    const t = Object.values(o || {}).reduce((s, v) => s + (Number(v) || 0), 0);
    return Object.entries(o || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([n, v]) => `${n.split(",")[0]} ${pc(v, t)}%`)
      .join(" · ");
  };
  return {
    split: tot ? `F ${pc(g.F, tot)}% · M ${pc(g.M, tot)}%` : "—",
    ages: tot ? AGES.filter((a) => ages[a]).slice(0, 3).map((a) => `${a.replace("-", "–")} ${pc(ages[a], tot)}%`).join(" · ") : "—",
    cities: top(aud.city, 3) || "—",
    countries: top(aud.country, 3) || "—",
  };
}

/* Creator profile → Media kit tab (Figma: note + "⤢ Bigger" + 4 numbers) */
export default function CreatorKitTab() {
  const { id } = useParams();
  return (
    <CreatorDrawer id={id} tab="media-kit">
      {(p) => <Kit p={p} />}
    </CreatorDrawer>
  );
}

// Media kit = wahi jo brands /kit/<username> par dekhte hain (public_profile)
function Kit({ p }) {
  const [big, setBig] = useState(false);
  const { data } = useRpc("admin", "public_profile", { p_username: p.igUser }, { skip: !p.igUser });
  if (!p.igUser) return <p className="cpk-none">No media kit yet — it builds itself once the creator connects Instagram.</p>;
  const a = (Array.isArray(data) ? data[0] : data) || {};
  const au = audience(a.audience);
  const media = Array.isArray(a.recent_media) && a.recent_media.length ? a.recent_media : p.ig.media.map((m) => ({ like_count: m.likes, comments_count: m.comments, media_url: m.img, permalink: m.permalink }));
  const tops = [...media].sort((x, y) => (y.like_count || 0) + (y.comments_count || 0) - ((x.like_count || 0) + (x.comments_count || 0))).slice(0, 3);
  return (
        <div className={`cpk ${big ? "is-big" : ""}`}>
          <div className="cpk-top">
            <p>Everything brands see: audience (gender, age, countries, cities), top posts, work portfolio, content showcase.</p>
            <button type="button" onClick={() => setBig(!big)}>
              {big ? "⤡ Smaller" : "⤢ Bigger"}
            </button>
            <a href={`/kit/${encodeURIComponent(p.igUser)}`} target="_blank" rel="noopener noreferrer">
              Open ↗
            </a>
          </div>
          <div className="cpk-nums">
            {[
              [p.ig.followers, "Followers"],
              [p.ig.eng, "Engagement"],
              [a.avg_reach ? kNum(a.avg_reach) : p.ig.avgReach, "Avg reach"],
              [au.split, "Audience"],
            ].map(([n, l]) => (
              <div key={l}>
                <strong>{n}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <div className="cpk-tiles">
            {[0, 1, 2].map((i) => {
              const m = tops[i];
              const img = m && (m.media_type === "VIDEO" ? m.thumbnail_url || m.media_url : m.media_url);
              return m ? (
                <a key={i} href={m.permalink || "#"} target="_blank" rel="noopener noreferrer" aria-label={`Top post ${i + 1}`}>
                  {img && <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />}
                </a>
              ) : (
                <span key={i} aria-hidden="true" />
              );
            })}
          </div>
          {big && (
            <div className="cpk-more">
              {[
                ["Top cities", au.cities],
                ["Age", au.ages],
                ["Countries", au.countries],
                ["Top posts", tops.map((m) => `❤️ ${kNum(m.like_count || 0)}`).join(" · ") || "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <span>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          )}
          <style>{`
            .cpk { margin-top: 6px; }
            .cpk + .cdw-priv { margin-top: 40px; }
            .cpk-top { display: flex; align-items: baseline; gap: 8px; }
            .cpk-top p { min-width: 0; font-size: 12px; line-height: 1.4; color: var(--ad-muted); }
            .cpk-top button { flex-shrink: 0; border: 0; background: none; padding: 0; font-size: 12px; font-weight: 800; color: #6657e9; }
            .cpk-nums { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 11px; margin-top: 18px; }
            .cpk-nums div { display: flex; flex-direction: column; padding: 18px 16px 17px; border-radius: 14px; background: var(--ad-soft-2); }
            .cpk-nums strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.8px; line-height: 1.35; }
            .cpk-nums span { margin-top: 6px; font-size: 12px; color: var(--ad-muted); }
            .cpk-tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
            .cpk-tiles span, .cpk-tiles a { display: block; height: 110px; overflow: hidden; border-radius: 14px; background: #ebe7fc; }
            .cpk-tiles img { width: 100%; height: 100%; object-fit: cover; }
            .is-big .cpk-tiles span, .is-big .cpk-tiles a { height: 180px; }
            .cpk-top a { flex-shrink: 0; font-size: 12px; font-weight: 800; color: #6657e9; }
            .cpk-none { font-size: 13px; color: var(--ad-muted); }
            .cpk-more { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; margin-top: 11px; }
            .cpk-more div { padding: 16px; border-radius: 14px; border: 1px solid var(--ad-line); }
            .cpk-more span { display: block; font-size: 11px; letter-spacing: .8px; text-transform: uppercase; color: var(--ad-muted); }
            .cpk-more strong { display: block; margin-top: 6px; font-size: 13.5px; font-weight: 700; }
            @media (max-width: 640px) {
              .cpk-top { flex-direction: column; gap: 8px; }
              .cpk-tiles span, .cpk-tiles a { height: 80px; }
              .cpk-nums, .cpk-more { grid-template-columns: 1fr 1fr; gap: 8px; }
              .cpk-more { grid-template-columns: 1fr; }
            }
          `}</style>
        </div>
  );
}
