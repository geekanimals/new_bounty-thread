"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandShell, { ToneIcon } from "@/components/brands/BrandShell";
import { BrEmpty, useToast } from "@/components/brands/BrandStates";
import { CheckSquare, Plus, Zap, ChevronRight, TrendUp, Play, Eye, Facebook } from "@/components/ui/Icons";
import {
  useBrand,
  brandView,
  canAct,
  useCampaignTotals,
  useOpenBillsCount,
  startFacebookLink,
  short,
  n,
  fdate,
  uniq,
  isLive,
  sumStep,
  stepCount,
  totalCreators,
  STATUS_LABEL,
  gradFor,
} from "@/services/brand";

const SORTS = [
  { key: "views", label: "Views" },
  { key: "eng", label: "Engagement" },
  { key: "clicks", label: "Clicks" },
];

/**
 * /brands/dashboard — purana paintDash:
 * KPIs (live campaigns, creators on board, posts, views, likes + comments), "Waiting for you" (to_approve / videos / bills / requests),
 * campaigns (steps progress), 🏆 top posts, Facebook business. Data: brand store (api.brand_portal) + useCampaignTotals.
 */
export default function BrandDashboard() {
  const b = useBrand();
  const v = brandView(b);
  const C = v.campaigns;
  const tot = useCampaignTotals(b.loggedIn ? C : null);
  const openBills = useOpenBillsCount();
  const [toast, say] = useToast();
  const [sort, setSort] = useState("views");
  const posts = [...tot.top].sort((a, c) => (sort === "eng" ? (Number(c.er) || 0) - (Number(a.er) || 0) : (Number(c.views) || 0) - (Number(a.views) || 0)));
  const mine = C.filter((c) => !/completed|closed/.test(c.status || ""));
  const live = C.filter(isLive);
  const reqs = ((b.portal && b.portal.requests) || []).filter((r) => !/done|approved|declined|rejected|created/i.test(r.status || ""));
  const act = canAct(b);
  // Time sirf browser mein (server prerender par Date nahi chalana)
  const [greet, setGreet] = useState("Hello");
  const [today, setToday] = useState("Today");
  useEffect(() => {
    const d = new Date();
    const h = d.getHours();
    setGreet(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    setToday(d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }));
  }, []);

  const nA = v.toApprove.length;
  const nV = v.videos.length;
  const STATS = [
    { label: "Total views", value: tot.views == null ? "…" : short(tot.views), note: "across all campaigns", icon: "eye", dark: true },
    { label: "Likes + comments", value: tot.engagement == null ? "…" : short(tot.engagement), note: "across all campaigns", icon: "heart", tone: "red" },
    { label: "Posts live", value: n(C.reduce((a, c) => a + (Number(c.posts) || 0), 0)), note: `${sumStep(C, "posted")} creators posted`, icon: "play", tone: "violet" },
    {
      label: "Creators on board",
      value: n(["approved", "shipped", "video_review", "posting", "posted"].reduce((a, k) => a + sumStep(C, k), 0)),
      note: `${sumStep(C, "to_approve")} waiting for you`,
      icon: "users",
      tone: "green",
    },
    { label: "Live campaigns", value: n(live.length), note: `${C.length} in total`, icon: "megaphone", tone: "orange" },
  ];
  const WAIT = [
    nA && {
      icon: "users",
      tone: "violet",
      title: `${nA} creator${nA === 1 ? "" : "s"} to approve`,
      text: uniq(v.toApprove.map((x) => x.campaign)).join(", "),
      action: "Review",
      href: "/brands/approvals",
    },
    nV && {
      icon: "play",
      tone: "orange",
      title: `${nV} video${nV === 1 ? "" : "s"} to review`,
      text: uniq(v.videos.map((x) => (x.creator && (x.creator.name || x.creator.username)) || x.campaign)).join(", "),
      action: "Watch",
      href: "/brands/approvals/videos",
    },
    openBills && { icon: "receipt", tone: "red", title: `${openBills} bill${openBills === 1 ? "" : "s"} to pay`, text: "Pay online or download the bill", action: "Pay", href: "/brands/billing" },
    ...reqs.slice(0, 2).map((r) => ({
      icon: "megaphone",
      tone: "blue",
      title: "Campaign request in review",
      text: `${r.name} · sent ${fdate(r.created_at)}`,
      action: "View",
      href: "/brands/approvals/requests",
    })),
  ].filter(Boolean);
  const fb = v.facebook;
  const fbPage = fb && (fb.pages || [])[0];
  const fbIg = fbPage && fbPage.instagram;

  return (
    <BrandShell>
      <title>Dashboard — Geek OS Brand</title>

      {/* Hero */}
      <section className="bd-hero">
        <div className="bd-hero__text">
          <p className="bd-hero__date">{today}</p>
          <h1>
            {greet}, {v.user.first}
          </h1>
          <p>
            {nA || nV
              ? `${nA} creator${nA === 1 ? "" : "s"} and ${nV} video${nV === 1 ? "" : "s"} ${nA + nV === 1 ? "is" : "are"} waiting for your OK.`
              : `You're all caught up. ${live.length} campaign${live.length === 1 ? " is" : "s are"} live for ${v.name}.`}
          </p>
        </div>
        <div className="bd-hero__btns">
          <Link href="/brands/approvals" className="bd-hero__light">
            <CheckSquare size={15} /> Review approvals
          </Link>
          {act && (
            <Link href="/brands/campaigns/new" className="bd-hero__ghost">
              <Plus size={15} /> Request a campaign
            </Link>
          )}
        </div>
      </section>

      {/* Stats */}
      <div className="bd-stats">
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
            <span className={`br-badge br-badge--${WAIT.length ? "red" : "green"}`}>{WAIT.length ? `${WAIT.length} item${WAIT.length === 1 ? "" : "s"}` : "All clear"}</span>
          </div>
          <ul className="bd-wait">
            {WAIT.map((w) => (
              <li key={w.title + w.text}>
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
            {!WAIT.length && (
              <li>
                <ToneIcon icon="check" tone="green" size={36} />
                <span className="bd-wait__txt">
                  <strong>Nothing waiting for you</strong>
                  <small>New creators and videos to approve show up here.</small>
                </span>
              </li>
            )}
          </ul>
        </section>

        {/* Your campaigns */}
        <section className="br-card bd-card">
          <div className="br-card__head">
            <div>
              <h2 className="br-card__title">Your campaigns</h2>
              <p className="br-card__sub">
                {live.length} live · {C.length} in total
              </p>
            </div>
            <Link href="/brands/campaigns" className="br-link">
              See all
            </Link>
          </div>
          {mine.length ? (
            <ul className="bd-camps">
              {mine.slice(0, 5).map((c) => {
                const t = totalCreators(c);
                const done = stepCount(c, "posted");
                return (
                  <li key={c.campaign_id}>
                    <Link href={`/brands/campaigns/${c.campaign_id}`}>
                      <span className="bd-camps__thumb" style={{ background: gradFor(c.name) }} />
                      <span className="bd-camps__body">
                        <span className="bd-camps__title">
                          <strong>{c.name}</strong>
                          <span className={`br-badge br-badge--${isLive(c) ? "green" : c.status === "draft" ? "orange" : "grey"}`}>{STATUS_LABEL[c.status] || c.status || ""}</span>
                        </span>
                        <span className="bd-camps__prog">
                          <span className="br-bar">
                            <i style={{ width: `${Math.max(4, t ? (done / t) * 100 : 0)}%` }} />
                          </span>
                          <small>
                            {done}/{t} creators posted{c.ends_on ? ` · till ${fdate(c.ends_on)}` : ""}
                          </small>
                        </span>
                      </span>
                      <ChevronRight size={15} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <BrEmpty title="No campaigns yet" text="Your campaigns show up here as soon as the Geek team sets them up.">
              {act && (
                <Link href="/brands/campaigns/new" className="br-btn br-btn--soft br-btn--sm">
                  Request one
                </Link>
              )}
            </BrEmpty>
          )}
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
              <h2 className="br-card__title">Top posts</h2>
              <p className="br-card__sub">Ranked by {SORTS.find((s) => s.key === sort).label.toLowerCase()} across your campaigns — tap a post to open it on Instagram</p>
            </div>
          </div>
          <div className="br-seg">
            {SORTS.map((s) => (
              <button key={s.key} type="button" className={sort === s.key ? "is-on" : ""} onClick={() => (s.key === "clicks" ? say("Link clicks — coming soon") : setSort(s.key))}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {posts.length ? (
          <div className="bd-posts" data-scroll>
            {posts.map((p, i) => {
              const cr = p.creator || {};
              const img = p.thumb || cr.profile_picture_url;
              return (
                <a key={(p.permalink || "") + i} href={p.permalink || "#"} target="_blank" rel="noreferrer" className="bd-post">
                  <span className="br-thumb" style={{ background: gradFor(cr.username || p.campaign) }}>
                    {img && <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" className="bd-post__img" onError={(e) => (e.currentTarget.style.display = "none")} />}
                    <span className="br-thumb__rank">#{i + 1}</span>
                    <span className="br-thumb__play">
                      <Play size={11} />
                    </span>
                    <span className="br-thumb__views">
                      {sort === "views" ? <Eye size={11} /> : null}
                      {sort === "views" ? short(p.views) : p.er != null ? `${p.er}% eng.` : `${short((Number(p.likes) || 0) + (Number(p.comments) || 0))} eng.`}
                    </span>
                  </span>
                  <strong>@{cr.username || cr.name || "creator"}</strong>
                  <small>
                    {p.campaign} · {p.type || "Post"}
                  </small>
                </a>
              );
            })}
          </div>
        ) : (
          <p className="bd-none">{tot.loading ? "Loading posts…" : "No posts yet — the best posts from your campaigns show up here once creators post."}</p>
        )}
      </section>

      {/* Facebook business */}
      <section className="br-card bd-fb">
        <span className="bd-fb__ic">
          <Facebook size={18} />
        </span>
        <div className="bd-fb__txt">
          <strong>{fb ? "Facebook & Instagram business connected" : "Link your Facebook business"}</strong>
          <small>
            {fb
              ? `${fbPage ? fbPage.name : fb.fb_name || v.name}${fbIg ? ` · @${fbIg.username}` : ""} — posts, comments, insights and ads are in Social`
              : "Link Facebook (Business Manager) once — sign in with one tap and manage your Pages and ads from here."}
          </small>
        </div>
        {fb ? (
          <>
            <span className="br-badge br-badge--green">Connected</span>
            <Link href="/brands/facebook" className="br-btn br-btn--ghost br-btn--sm">
              Open Facebook
            </Link>
          </>
        ) : (
          <button
            type="button"
            className="br-btn br-btn--ghost br-btn--sm"
            onClick={async () => {
              const r = await startFacebookLink("settings");
              if (r.error) say(r.error.message);
            }}
          >
            Link Facebook business
          </button>
        )}
      </section>
      {toast}

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

        .bd-post__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .bd-none { margin: 0; padding: 8px 0 4px; font-size: 13px; color: var(--br-muted); }
        .bd-fb { display: flex; align-items: center; gap: 14px; margin-top: 18px; padding: 16px 20px; flex-wrap: wrap; }
        .bd-fb__ic { width: 40px; height: 40px; border-radius: 11px; background: var(--br-fb); color: #fff; display: grid; place-items: center; flex-shrink: 0; }
        .bd-fb__txt { flex: 1; min-width: 200px; }
        .bd-fb__txt strong { display: block; font-size: 14px; font-weight: 700; }
        .bd-fb__txt small { display: block; font-size: 12.5px; color: var(--br-muted); }

        @media (max-width: 1280px) {
          .bd-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 1100px) {
          .bd-grid { grid-template-columns: minmax(0, 1fr); }
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
