"use client";

import { useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import { useSession } from "@/components/creater/session";
import { CREATOR, KIT_POSTS } from "@/components/creater/data";
import { Check } from "@/components/ui/Icons";

// Har post ki dummy date (Instagram se aayegi)
const POST_DATES = ["22 Feb", "14 Feb", "2 Feb"];

/** /creater/analytics — "Creator pulse": Instagram ke numbers, performance, insights, top content (Figma 067 / 079) */
export default function Analytics() {
  const [s] = useSession();
  const [range, setRange] = useState("3");
  const [pinned, setPinned] = useState([]);
  const [toast, setToast] = useState("");
  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };

  const posts = KIT_POSTS.map((p, i) => ({ ...p, total: p.likes + p.comments, date: POST_DATES[i] || "Jan" }));
  const best = posts.reduce((a, b) => (b.total > a.total ? b : a), posts[0]);
  const max = Math.max(...posts.map((p) => p.total), 1);
  const avgLikes = Math.round(posts.reduce((a, p) => a + p.likes, 0) / posts.length);

  const tiles = [
    { v: CREATOR.followers, l: "Followers" },
    { v: CREATOR.reach, l: "Avg reach" },
    { v: avgLikes, l: "Avg likes" },
    { v: CREATOR.eng, l: "Engagement" },
  ];

  const togglePin = (i) => {
    const on = pinned.includes(i);
    setPinned(on ? pinned.filter((x) => x !== i) : [...pinned, i]);
    flash(on ? "Removed from your media kit" : "Pinned to your media kit");
  };

  return (
    <BountyShell>
      <title>Analytics — Bounty</title>

      <p className={`bx-eyebrow ${s.ig ? "an-mob" : ""}`}>Creator pulse</p>
      <h1 className="bx-title">Analytics</h1>
      {s.ig ? (
        <p className="bx-lede">
          <span className="an-desk">Your campaigns and Instagram performance — live, downloadable.</span>
          <span className="an-mob">How your content is doing — from Instagram.</span>
        </p>
      ) : (
        <p className="bx-lede">How your content is doing — from Instagram.</p>
      )}

      {!s.ig ? (
        <section className="bx-card an-lock">
          <span>📊</span>
          <h2>Connect Instagram to see your pulse</h2>
          <p>Followers, reach, engagement and your top content show up here once Instagram is connected.</p>
          <Link href="/creater/onboarding/meta" className="an-connect">
            Connect Instagram
          </Link>
        </section>
      ) : (
        <div className="an">
          <div className="an-acc">
            <span className="an-acc__me">{CREATOR.handle}</span>
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
                <div className="an-bars" role="img" aria-label="Likes and comments on your last 3 posts">
                  {posts.map((p, i) => (
                    <span key={i} className={i === posts.length - 1 ? "is-gold" : ""} style={{ height: `${Math.max(6, (p.total / max) * 100)}%` }} title={`${p.total} likes + comments`} />
                  ))}
                </div>
                <p>Likes + comments · last 3 posts</p>
              </section>
            </div>
            <div>
              <p className="bx-section-label">Insights</p>
              <section className="an-card an-ins">
                <p>Your best post got {best.total} likes + comments — lead with posts like it</p>
                <p>{posts.length} posts synced from Instagram</p>
                <p>Pin your best work below — brands see it first</p>
              </section>
            </div>
          </div>

          <p className="bx-section-label">Your top content</p>
          <ul className="an-top">
            {posts.map((p, i) => (
              <li key={i} className="an-card">
                <img src={p.img} alt="" />
                <span>
                  <strong>Post · {p.date}</strong>
                  <small>❤️ {p.total} likes + comments</small>
                </span>
                <button type="button" className={pinned.includes(i) ? "is-on" : ""} onClick={() => togglePin(i)}>
                  {pinned.includes(i) ? "✓ Pinned" : "📌 Pin to media kit"}
                </button>
              </li>
            ))}
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
