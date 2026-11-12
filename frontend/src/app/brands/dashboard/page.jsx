"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandShell, { ToneIcon } from "@/components/brands/BrandShell";
import { USER, BRAND, DASH_STATS, WAITING, CAMPAIGNS, TOP_POSTS, STATUS } from "@/components/brands/data";
import { CheckSquare, Plus, Zap, ChevronRight, TrendUp, Play, Eye, Facebook } from "@/components/ui/Icons";

const SORTS = [
  { key: "views", label: "Views" },
  { key: "eng", label: "Engagement" },
  { key: "clicks", label: "Clicks" },
];
const num = (s) => {
  const n = parseFloat(String(s).replace(/[^\d.]/g, "")) || 0;
  return /K/i.test(s) ? n * 1000 : /M/i.test(s) ? n * 1e6 : n;
};

/** /brands/dashboard — aaj kya karna hai + saari campaigns ek nazar mein */
export default function BrandDashboard() {
  const [sort, setSort] = useState("views");
  const posts = [...TOP_POSTS].sort((a, b) => num(b[sort]) - num(a[sort]));
  const mine = CAMPAIGNS.filter((c) => c.status !== "completed");
  // Time sirf browser mein (server prerender par Date nahi chalana)
  const [greet, setGreet] = useState("Hello");
  const [today, setToday] = useState("Today");
  useEffect(() => {
    const d = new Date();
    const h = d.getHours();
    setGreet(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    setToday(d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }));
  }, []);

  return (
    <BrandShell>
      <title>Dashboard — Geek OS Brand</title>

      {/* Hero */}
      <section className="bd-hero">
        <div className="bd-hero__text">
          <p className="bd-hero__date">{today}</p>
          <h1>
            {greet}, {USER.first}
          </h1>
          <p>7 creators and 2 videos are waiting for your OK. Festive Glow Edit is beating its view goal by 18%.</p>
        </div>
        <div className="bd-hero__btns">
          <Link href="/brands/approvals" className="bd-hero__light">
            <CheckSquare size={15} /> Review approvals
          </Link>
          <Link href="/brands/campaigns/new" className="bd-hero__ghost">
            <Plus size={15} /> Request a campaign
          </Link>
        </div>
      </section>

      {/* Stats */}
      <div className="bd-stats">
        {DASH_STATS.map((s) => (
          <div key={s.label} className={`br-stat ${s.dark ? "br-stat--dark" : ""}`}>
            <p className="br-stat__label">
              <ToneIcon icon={s.icon} tone={s.dark ? "dark" : ["red", "violet", "green", "orange"][DASH_STATS.indexOf(s) - 1] || "violet"} size={30} />
              {s.label}
            </p>
            <p className="br-stat__value">{s.value}</p>
            <p className="br-stat__note">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="bd-grid">
        {/* Waiting for you */}
        <section className="br-card bd-card">
          <div className="br-card__head">
            <div className="bd-titlerow">
              <span className="bd-ic">
                <Zap size={16} />
              </span>
              <div>
                <h2 className="br-card__title">Waiting for you</h2>
                <p className="br-card__sub">Things only you can decide</p>
              </div>
            </div>
            <span className="br-badge br-badge--red">9 items</span>
          </div>
          <ul className="bd-wait">
            {WAITING.map((w) => (
              <li key={w.title}>
                <ToneIcon icon={w.icon} tone={w.tone} size={36} />
                <span className="bd-wait__txt">
                  <strong>{w.title}</strong>
                  <small>{w.text}</small>
                </span>
                <Link href={w.href} className="br-btn br-btn--soft br-btn--sm">
                  {w.action}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Your campaigns */}
        <section className="br-card bd-card">
          <div className="br-card__head">
            <div>
              <h2 className="br-card__title">Your campaigns</h2>
              <p className="br-card__sub">3 live · 1 in review</p>
            </div>
            <Link href="/brands/campaigns" className="br-link">
              See all
            </Link>
          </div>
          <ul className="bd-camps">
            {mine.map((c) => (
              <li key={c.id}>
                <Link href={`/brands/campaigns/${c.id}`}>
                  <span className="bd-camps__thumb" style={{ background: c.gradient }} />
                  <span className="bd-camps__body">
                    <span className="bd-camps__title">
                      <strong>{c.title}</strong>
                      <span className={`br-badge br-badge--${STATUS[c.status].tone}`}>{STATUS[c.status].label}</span>
                    </span>
                    <span className="bd-camps__prog">
                      <span className="br-bar">
                        <i style={{ width: `${Math.max(4, (c.postsLive / c.postsPlanned) * 100)}%` }} />
                      </span>
                      <small>
                        {c.status === "review" ? "starts 15 Nov" : `${c.postsLive}/${c.postsPlanned} posts${c.ends ? ` · ${c.ends}` : ""}`}
                      </small>
                    </span>
                  </span>
                  <ChevronRight size={15} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Top posts */}
      <section className="br-card bd-card bd-top">
        <div className="br-card__head">
          <div className="bd-titlerow">
            <span className="bd-ic">
              <TrendUp size={16} />
            </span>
            <div>
              <h2 className="br-card__title">Top posts this week</h2>
              <p className="br-card__sub">Ranked by {SORTS.find((s) => s.key === sort).label.toLowerCase()} — tap a post to open it on Instagram</p>
            </div>
          </div>
          <div className="br-seg">
            {SORTS.map((s) => (
              <button key={s.key} type="button" className={sort === s.key ? "is-on" : ""} onClick={() => setSort(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bd-posts" data-scroll>
          {posts.map((p, i) => (
            <a key={p.id} href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="bd-post">
              <span className="br-thumb" style={{ background: p.g }}>
                <span className="br-thumb__rank">#{i + 1}</span>
                <span className="br-thumb__play">
                  <Play size={11} />
                </span>
                <span className="br-thumb__views">
                  {sort === "views" ? <Eye size={11} /> : null}
                  {sort === "views" ? p.views : sort === "eng" ? `${p.eng} eng.` : `${p.clicks} clicks`}
                </span>
              </span>
              <strong>{p.handle}</strong>
              <small>{p.campaign} · Reel</small>
            </a>
          ))}
        </div>
      </section>

      {/* Facebook connected */}
      <section className="br-card bd-fb">
        <span className="bd-fb__ic">
          <Facebook size={18} />
        </span>
        <div className="bd-fb__txt">
          <strong>Facebook &amp; Instagram business connected</strong>
          <small>
            {BRAND.name} · {BRAND.ig} — comments, posts, insights and ads are in Social
          </small>
        </div>
        <span className="br-badge br-badge--green">Connected</span>
        <Link href="/brands/facebook" className="br-btn br-btn--ghost br-btn--sm">
          Open Facebook
        </Link>
      </section>

      <style>{`
        .bd-hero {
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
          padding: 30px 32px; border-radius: 22px; color: #fff;
          background: radial-gradient(120% 140% at 85% 30%, #7a1f5c 0%, rgba(122,31,92,0) 55%), var(--br-hero);
        }
        .bd-hero__date { margin: 0 0 8px; font-size: 11.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #ff8fb1; }
        .bd-hero h1 { margin: 0 0 10px; font-size: 32px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
        .bd-hero__text p:last-child { margin: 0; max-width: 580px; font-size: 14.5px; line-height: 1.55; color: rgba(255,255,255,.82); }
        .bd-hero__btns { display: flex; gap: 10px; flex-shrink: 0; }
        .bd-hero__light, .bd-hero__ghost {
          display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 18px;
          border-radius: 11px; font-size: 13.5px; font-weight: 700; white-space: nowrap;
        }
        .bd-hero__light { background: #fff; color: var(--br-ink); }
        .bd-hero__ghost { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.28); color: #fff; }
        .bd-hero__ghost:hover { background: rgba(255,255,255,.2); }

        .bd-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; margin: 18px 0; }
        .bd-stats .br-stat__value { font-size: 30px; }

        .bd-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 18px; align-items: start; }
        .bd-card { padding: 22px; }
        .bd-titlerow { display: flex; align-items: center; gap: 12px; }
        .bd-ic { width: 36px; height: 36px; border-radius: 10px; background: var(--br-lilac); color: var(--br-primary); display: grid; place-items: center; flex-shrink: 0; }

        .bd-wait { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .bd-wait li { display: flex; align-items: center; gap: 14px; padding: 13px 14px; border: 1px solid var(--br-border); border-radius: 14px; }
        .bd-wait__txt { flex: 1; min-width: 0; }
        .bd-wait__txt strong { display: block; font-size: 14px; font-weight: 700; }
        .bd-wait__txt small { display: block; font-size: 12.5px; color: var(--br-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .bd-camps { list-style: none; margin: 0; padding: 0; }
        .bd-camps a { display: flex; align-items: center; gap: 14px; padding: 12px 0; color: var(--br-faint); }
        .bd-camps li + li a { border-top: 1px solid var(--br-border); }
        .bd-camps a:hover .bd-camps__title strong { color: var(--br-primary); }
        .bd-camps__thumb { width: 44px; height: 44px; border-radius: 11px; flex-shrink: 0; }
        .bd-camps__body { flex: 1; min-width: 0; color: var(--br-ink); }
        .bd-camps__title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .bd-camps__title strong { font-size: 14px; font-weight: 700; }
        .bd-camps__prog { display: flex; align-items: center; gap: 10px; margin-top: 7px; }
        .bd-camps__prog .br-bar { width: 130px; flex-shrink: 0; }
        .bd-camps__prog small { font-size: 12px; color: var(--br-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .bd-top { margin-top: 18px; }
        .bd-posts { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
        .bd-post strong { display: block; margin-top: 10px; font-size: 13.5px; font-weight: 700; }
        .bd-post small { display: block; font-size: 12px; color: var(--br-muted); }
        .bd-post:hover .br-thumb { transform: translateY(-2px); }
        .bd-post .br-thumb { transition: transform .2s; }

        .bd-fb { display: flex; align-items: center; gap: 14px; margin-top: 18px; padding: 16px 20px; flex-wrap: wrap; }
        .bd-fb__ic { width: 40px; height: 40px; border-radius: 11px; background: var(--br-fb); color: #fff; display: grid; place-items: center; flex-shrink: 0; }
        .bd-fb__txt { flex: 1; min-width: 200px; }
        .bd-fb__txt strong { display: block; font-size: 14px; font-weight: 700; }
        .bd-fb__txt small { display: block; font-size: 12.5px; color: var(--br-muted); }

        @media (max-width: 1280px) {
          .bd-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 1100px) {
          .bd-grid { grid-template-columns: 1fr; }
          .bd-posts { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 900px) {
          .bd-hero { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 640px) {
          .bd-hero { padding: 22px 20px; border-radius: 18px; }
          .bd-hero h1 { font-size: 25px; }
          .bd-hero__btns { width: 100%; flex-direction: column; }
          .bd-hero__btns a { justify-content: center; }
          .bd-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .bd-stats .br-stat:first-child { grid-column: 1 / -1; }
          .bd-stats .br-stat__value { font-size: 24px; }
          .bd-card { padding: 18px; }
          .bd-card .br-card__head { flex-wrap: wrap; }
          .bd-wait li { flex-wrap: wrap; padding: 12px; }
          .bd-wait__txt small { white-space: normal; }
          .bd-camps__prog .br-bar { width: 80px; }
          .bd-posts { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 4px; }
          .bd-post { flex: 0 0 44%; scroll-snap-align: start; }
          .bd-fb { padding: 16px; }
        }
      `}</style>
    </BrandShell>
  );
}
