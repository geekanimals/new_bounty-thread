"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creator/BountyShell";
import { errText, useMyIg, fmtK, fmtNum, fmtDate, togglePin, pinnedOf, MAX_PINS } from "@/services/creator";
import { Check } from "@/components/ui/Icons";

const imgOf = (m) => (m.media_type === "VIDEO" ? m.thumbnail_url || m.media_url : m.media_url);

/**
 * /creator/analytics — "Creator pulse": Instagram ke numbers, performance, insights, top content (Figma 067 / 079)
 * Data: social_accounts (Instagram sync, purane Reports / media kit jaisa). Pin → social_accounts.edits.pinned (media kit pehle dikhata hai).
 */
export default function Analytics() {
  const ig = useMyIg();
  const a = ig.acct;
  const [range, setRange] = useState("3");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };

  const media = Array.isArray(a?.recent_media) ? [...a.recent_media].sort((x, y) => String(y.timestamp || "").localeCompare(String(x.timestamp || ""))) : [];
  // "Last 3 posts" ya "Last 30 days" (timestamp se)
  // 30 din pehle ka time — render ke baad set (Next prerender rule: Date.now() render mein nahi)
  const [since, setSince] = useState(0);
  useEffect(() => setSince(Date.now() - 30 * 86400000), []);
  const sel = range === "3" ? media.slice(0, 3) : media.filter((m) => m.timestamp && new Date(m.timestamp).getTime() >= since);
  const posts = sel.map((m) => ({ ...m, total: (Number(m.like_count) || 0) + (Number(m.comments_count) || 0), date: fmtDate(m.timestamp) || "—" })).reverse();
  const best = posts.length ? posts.reduce((x, y) => (y.total > x.total ? y : x), posts[0]) : null;
  const max = Math.max(...posts.map((p) => p.total), 1);
  const avgLikes = posts.length ? Math.round(posts.reduce((x, p) => x + (Number(p.like_count) || 0), 0) / posts.length) : 0;
  const eng = a?.followers_count && posts.length ? ((posts.reduce((x, p) => x + p.total, 0) / posts.length / a.followers_count) * 100).toFixed(2) + "%" : "—";
  const pinned = pinnedOf(a);
  const tiles = [
    { v: fmtK(a?.followers_count || 0), l: "Followers" },
    { v: a?.avg_reach ? fmtK(a.avg_reach) : "—", l: "Avg reach" },
    { v: fmtK(avgLikes), l: "Avg likes" },
    { v: eng, l: "Engagement" },
  ];
  const label = range === "3" ? "last 3 posts" : "last 30 days";

  const onPin = async (m) => {
    if (!a || busy) return;
    setBusy(true);
    const r = await togglePin(a, m.id);
    setBusy(false);
    if (r.full) return flash(`You can pin up to ${MAX_PINS} — unpin one first.`);
    if (r.error) return flash(errText(r.error) || "Couldn't save.");
    flash(r.removed ? "Removed from your media kit" : "Pinned to your media kit");
    ig.reload();
  };
  const locked = !ig.loading && !a;

  return (
    <BountyShell>
      <title>Analytics — Bounty</title>

      <p className={`bx-eyebrow ${!locked ? "an-mob" : ""}`}>Creator pulse</p>
      <h1 className="bx-title">Analytics</h1>
      {!locked ? (
        <p className="bx-lede">
          <span className="an-desk">Your campaigns and Instagram performance — live, downloadable.</span>
          <span className="an-mob">How your content is doing — from Instagram.</span>
        </p>
      ) : (
        <p className="bx-lede">How your content is doing — from Instagram.</p>
      )}

      {ig.loading ? (
        <p className="bx-lede">Loading your Instagram numbers…</p>
      ) : locked ? (
        <section className="bx-card an-lock">
          <span>📊</span>
          <h2>Connect Instagram to see your pulse</h2>
          <p>Followers, reach, engagement and your top content show up here once Instagram is connected.</p>
          <Link href="/creator/onboarding/meta" className="an-connect">
            Connect Instagram
          </Link>
        </section>
      ) : (
        <div className="an">
          <div className="an-acc">
            <span className="an-acc__me">@{a.username}</span>
            <button type="button" className="an-acc__range" onClick={() => setRange(range === "3" ? "30" : "3")}>
              {range === "3" ? "Last 3 posts" : "Last 30 days"}
            </button>
          </div>

          <div className="an-tiles">
            {tiles.map((t) => (
              <div key={t.l} className="an-tile">
                <strong>{t.v}</strong>
                <small>{t.l}</small>
              </div>
            ))}
          </div>

          <div className="an-two">
            <div>
              <p className="bx-section-label">Performance over time</p>
              <section className="an-card an-chart">
                <div className="an-bars" role="img" aria-label={`Likes and comments on your ${label}`}>
                  {posts.map((p, i) => (
                    <span key={i} className={i === posts.length - 1 ? "is-gold" : ""} style={{ height: `${Math.max(6, (p.total / max) * 100)}%` }} title={`${p.total} likes + comments`} />
                  ))}
                </div>
                <p>Likes + comments · {label}</p>
              </section>
            </div>
            <div>
              <p className="bx-section-label">Insights</p>
              <section className="an-card an-ins">
                {best ? <p>Your best post got {fmtNum(best.total)} likes + comments — lead with posts like it</p> : <p>No posts in the {label} yet</p>}
                <p>{fmtNum(media.length)} posts synced from Instagram</p>
                <p>Pin your best work below — brands see it first</p>
              </section>
            </div>
          </div>

          <p className="bx-section-label">Your top content</p>
          <ul className="an-top">
            {[...posts].sort((x, y) => y.total - x.total).map((p) => (
              <li key={p.id} className="an-card">
                <a href={p.permalink || "#"} target="_blank" rel="noopener noreferrer">
                  <img src={imgOf(p)} alt="" referrerPolicy="no-referrer" loading="lazy" />
                </a>
                <span>
                  <strong>Post · {p.date}</strong>
                  <small>❤️ {fmtNum(p.total)} likes + comments</small>
                </span>
                <button type="button" className={pinned.includes(String(p.id)) ? "is-on" : ""} onClick={() => onPin(p)} disabled={busy}>
                  {pinned.includes(String(p.id)) ? "✓ Pinned" : "📌 Pin to media kit"}
                </button>
              </li>
            ))}
            {!posts.length && <li className="an-card an-none">No posts in the {label}.</li>}
          </ul>
        </div>
      )}

      {toast && (
        <div className="bx-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .an-mob { display: none; }
        .an-none { padding: 14px; font-size: 13px; color: #7a6a4a; }
        .an { max-width: 980px; margin: 0 auto; }
        .an-acc { display: flex; justify-content: center; gap: 8px; margin: 32px 0 13px; }
        .an-acc__me, .an-acc__range { display: inline-flex; align-items: center; height: 32px; padding: 0 16px; border-radius: 999px; font-size: 13px; font-weight: 600; }
        .an-acc__me { background: #123524; color: #fbf3e2; }
        .an-acc__range { border: 1px solid #d9c49a; background: #fffaef; color: #14231a; }
        .an-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .an-tile, .an-card { background: #fbf0db; border: 1px solid #e6d3ab; border-radius: 14px; box-shadow: 0 10px 24px -22px rgba(60,40,10,.5); }
        .an-tile { padding: 11px 15px 10px; }
        .an-tile strong { display: block; font-family: var(--bx-serif); font-size: 23px; line-height: 28px; font-weight: 600; color: #14231a; }
        .an-tile small { display: block; margin-top: 4px; font-size: 12px; line-height: 16px; color: #3e4b52; }
        .an-two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; }
        .an .bx-section-label { margin: 22px 0 13px; }
        .an-chart { padding: 14px 16px 16px; }
        .an-bars { display: flex; align-items: flex-end; gap: 8px; height: 147px; padding: 0 4px; border-bottom: 1px solid #e0cfa8; }
        .an-bars span { flex: 1; border-radius: 4px 4px 0 0; background: #2e9c94; min-height: 6px; }
        .an-bars span.is-gold { background: #e8b04a; }
        .an-chart p { margin: 8px 0 0; text-align: center; font-size: 12px; line-height: 16px; color: #3e4b52; }
        .an-ins { padding: 11px 16px 12px 35px; min-height: 168px; }
        .an-ins p { margin: 0; font-size: 14px; line-height: 25.2px; color: #14231a; }
        .an-top { list-style: none; margin: 6px 0 0; padding: 0; display: grid; gap: 12px; }
        .an-top li { display: flex; align-items: center; gap: 20px; height: 66px; padding: 0 12px 0 15px; }
        .an-top img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .an-top span { flex: 1; min-width: 0; }
        .an-top strong { display: block; font-size: 14px; line-height: 18px; font-weight: 700; color: #14231a; }
        .an-top small { display: block; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; line-height: 16px; color: #3e4b52; }
        .an-top button { flex-shrink: 0; height: 28px; padding: 0 12px; border-radius: 999px; border: 1px solid #d9c49a; background: #fffaef; font-size: 11.5px; font-weight: 700; color: #14231a; }
        .an-top button.is-on { background: #123524; border-color: #123524; color: #fbf3e2; }

        .an-lock { max-width: 560px; margin: 40px auto 0; padding: 40px 24px 36px; border-radius: 16px; text-align: center; }
        .an-lock span { display: block; font-size: 40px; line-height: 44px; }
        .an-lock h2 { margin: 12px 0 4px; font-family: var(--bx-serif); font-size: 24px; line-height: 30px; font-weight: 600; color: #14231a; }
        .an-lock p { max-width: 440px; margin: 0 auto 20px; font-size: 13px; line-height: 17px; color: #7a6a4a; }
        .an-connect { display: inline-flex; align-items: center; height: 42px; padding: 0 22px; border-radius: 14px; background: #123524; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: #fbf3e2; }

        @media (max-width: 767px) {
          .an-desk { display: none; }
          p.an-mob { display: block; }
          span.an-mob { display: inline; }
          .an-acc { margin: 28px 0 13px; }
          .an-two > div + div .bx-section-label { margin-top: 33px; }
          .an-ins + .bx-section-label, .an-two + .bx-section-label { margin-top: 26px; }
          .an-tiles { grid-template-columns: 1fr 1fr; }
          .an-two { grid-template-columns: minmax(0, 1fr); gap: 0; }
          .an-two .an-chart { padding-bottom: 18px; }
          .an-ins { min-height: 0; }
          .an-lock { margin-top: 28px; }
        }
      `}</style>
    </BountyShell>
  );
}
