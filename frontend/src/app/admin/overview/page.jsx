"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";

const QUEUE = [
  { icon: "✍️", title: "Screen new creators for Circle Diwali", count: 25, sub: "Circle Diwali Declutter · Paid · 25 applicants waiting for a decision", pri: "High", tone: "orange", when: "2 days", href: "/admin/action-queue/applications" },
  { icon: "▣", title: "Review submitted video drafts", count: 21, sub: "Beardo Detan Express Kit · Creator submissions need approval", pri: "Critical", tone: "red", when: "Overdue", href: "/admin/action-queue/content" },
  { icon: "🏢", title: "Approve new account signups", count: 2, sub: "1 agency · 1 brand waiting for access", pri: "Medium", tone: "violet", when: "Today", href: "/admin/action-queue/signups" },
];

const ACTIVITY = [
  { icon: "🟢", title: "Nisha Rao signed in", sub: "Creator · Mumbai · 2 min ago", kind: "Sign-in", href: "/admin/activity/nisha-rao" },
  { icon: "📸", title: "Kabir Mehta connected Instagram", sub: "@kabirfoodtrail · 41.2k followers · 14 min ago", kind: "Instagram", href: "/admin/creators/kabir-mehta/instagram" },
  { icon: "📣", title: "Home Spa went live", sub: "Yes Madam · Paid + product · 1 h ago", kind: "Campaign", href: "/admin/campaigns" },
  { icon: "🟢", title: "Ananya Iyer signed in", sub: "Creator · Chennai · 1 h ago", kind: "Sign-in", href: "/admin/activity/ananya-iyer" },
];
const KIND_TONE = { "Sign-in": "", Instagram: "violet", Campaign: "green" };
const TABS = [
  { k: "All", n: 20 },
  { k: "Campaigns", n: 1 },
  { k: "Instagram", n: 1 },
  { k: "Sign-ins", n: 18 },
];
const TAB_KIND = { Campaigns: "Campaign", Instagram: "Instagram", "Sign-ins": "Sign-in" };

const PEOPLE = [
  { n: "298", l: "Creators", s: "57% on Instagram", href: "/admin/creators" },
  { n: "169", l: "Instagram connected", s: "of 298 creators", href: "/admin/creators" },
  { n: "7", l: "Agencies", href: "/admin/users" },
  { n: "4", l: "Brands", href: "/admin/brands" },
  { n: "2", l: "Joined today", s: "new accounts", href: "/admin/users" },
  { n: "2", l: "Signed in today", s: "active people", href: "/admin/activity" },
];
const PIPE = [
  ["298", "Signed up"],
  ["169", "IG linked"],
  ["35", "Profile ready"],
  ["228", "Applied"],
  ["151", "Approved"],
];

export default function AdminOverview() {
  const [hello, setHello] = useState("Good afternoon");
  const [tab, setTab] = useState("All");

  // Time ke hisaab se greeting (render ke baad — Next cache rule)
  useEffect(() => {
    const h = new Date().getHours();
    setHello(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  const feed = tab === "All" ? ACTIVITY : ACTIVITY.filter((a) => a.kind === TAB_KIND[tab]);

  return (
    <AdminShell>
      <PageHead title={<>{hello}, Mayank ✳️</>} sub="One workspace for the decisions, people and campaigns that move Geek OS forward.">
        <Link href="/admin/campaigns/new" className="ad-btn ad-btn--primary">
          ＋ New campaign
        </Link>
      </PageHead>

      <Stats
        items={[
          { value: 82, label: "Actions requiring review", note: "Across campaign operations", href: "/admin/action-queue" },
          { value: 5, label: "Campaigns live", note: "8 campaigns total", href: "/admin/campaigns/live" },
          { value: 298, label: "Creators", note: "174 connected to Instagram", href: "/admin/creators" },
          { value: 25, label: "Shipments need progress", note: "10 to send · 15 in transit", href: "/admin/logistics" },
          { value: 63, label: "Posts published", note: "Across all campaigns", href: "/admin/reports" },
        ]}
      />

      <div className="ov-grid">
        <div className="ov-col">
          {/* Priority queue */}
          <section className="ad-card ov-card">
            <div className="ov-card__head">
              <div>
                <h2 className="ad-h2">⚡ Your priority queue</h2>
                <p className="ov-sub">One-click triage. Open an item to review its context before acting.</p>
              </div>
              <Link href="/admin/action-queue" className="ov-link">
                View all tasks →
              </Link>
            </div>
            <div className="ov-list">
              {QUEUE.map((q) => (
                <div key={q.title} className="ov-q">
                  <span className="ov-ic">{q.icon}</span>
                  <div className="ov-q__main">
                    <p className="ov-q__title">
                      {q.title} <span className="ad-count">{q.count}</span>
                    </p>
                    <p className="ov-q__sub">{q.sub}</p>
                  </div>
                  <div className="ov-q__side">
                    <span className={`ad-badge ad-badge--${q.tone}`}>{q.pri}</span>
                    <span className="ov-when">{q.when}</span>
                    <Link href={q.href} className="ad-btn ad-btn--ghost ov-review">
                      Review →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Live activity */}
          <section className="ad-card ov-card">
            <h2 className="ad-h2">🕒 Live activity</h2>
            <p className="ov-sub">Sign-ins, campaigns and Instagram connections as they happen.</p>
            <div className="ad-tabs ov-tabs" role="tablist">
              {TABS.map((t) => (
                <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} className={`ad-tab ${tab === t.k ? "is-on" : ""}`} onClick={() => setTab(t.k)}>
                  {t.k} {t.n}
                </button>
              ))}
            </div>
            <div className="ov-list">
              {feed.map((a) => (
                <Link key={a.title} href={a.href} className="ov-a">
                  <span className="ov-ic">{a.icon}</span>
                  <div className="ov-q__main">
                    <p className="ov-q__title">{a.title}</p>
                    <p className="ov-q__sub">{a.sub}</p>
                  </div>
                  <span className={`ad-badge ad-badge--${KIND_TONE[a.kind]}`}>{a.kind}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="ov-col">
          {/* People */}
          <section className="ad-card ov-card">
            <h2 className="ad-h2">👥 People</h2>
            <p className="ov-sub">Who is on Geek OS right now.</p>
            <div className="ov-people">
              {PEOPLE.map((p) => (
                <Link key={p.l} href={p.href} className={`ov-p ${p.s ? "" : "ov-p--short"}`}>
                  <strong>{p.n}</strong>
                  <span>{p.l}</span>
                  {p.s && <small>{p.s}</small>}
                </Link>
              ))}
            </div>
          </section>

          {/* Creator pipeline */}
          <section className="ad-card ov-card">
            <div className="ov-card__head ov-card__head--c">
              <h2 className="ad-h2">Creator pipeline</h2>
              <span className="ad-badge ad-badge--green">Live</span>
            </div>
            <div className="ov-pipe">
              {PIPE.map(([n, l]) => (
                <div key={l}>
                  <strong>{n}</strong>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Fulfilment pulse */}
          <section className="ad-card ov-card">
            <div className="ov-card__head ov-card__head--c">
              <h2 className="ad-h2">Fulfilment pulse</h2>
              <Link href="/admin/logistics" className="ov-link">
                Open logistics →
              </Link>
            </div>
            <div className="ov-pulse">
              {[
                ["10", "To send"],
                ["15", "In transit"],
                ["116", "Delivered"],
              ].map(([n, l]) => (
                <Link key={l} href="/admin/logistics">
                  <strong>{n}</strong>
                  <span>{l}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .ov-grid { display: grid; grid-template-columns: minmax(0, 652fr) minmax(0, 450fr); gap: 20px; align-items: start; }
        .ov-col { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .ov-card { padding: 22px 22px 30px; }
        .ov-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .ov-card__head--c { align-items: center; }
        .ov-sub { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }
        .ov-link { margin-top: 12px; margin-right: 10px; font-size: 14px; font-weight: 800; color: #6657e9; white-space: nowrap; }
        .ov-card__head--c .ov-link { margin-top: 0; }
        .ov-link:hover { color: var(--ad-primary-2); }
        .ov-list { display: flex; flex-direction: column; gap: 10px; margin-top: 22px; }

        .ov-q, .ov-a {
          display: flex; align-items: center; gap: 14px; padding: 18px 14px 14px 13px; border-radius: 14px;
          border: 1px solid var(--ad-line); background: #fff; transition: border-color .15s, box-shadow .15s;
        }
        .ov-a { padding: 15px 14px 14px 13px; }
        .ov-q:hover, .ov-a:hover { border-color: #cfd2ee; box-shadow: 0 10px 24px -20px rgba(30,37,73,.5); }
        .ov-ic { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; background: var(--ad-soft); font-size: 19px; color: var(--ad-ink); }
        .ov-q__main { flex: 1; min-width: 0; }
        .ov-q__title { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        .ov-q__title .ad-count { min-width: 30px; height: 24px; border-radius: 12px; }
        .ov-q__sub { margin-top: 6px; font-size: 12px; line-height: 1.33; color: #8791a7; }
        .ov-q__side { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .ov-when { font-size: 12px; color: var(--ad-muted); }
        .ov-review { height: 42px; padding: 0 15px; border-color: var(--ad-line-2); color: var(--ad-primary-ink); }
        .ov-tabs { margin-top: 26px; }
        .ov-tabs .ad-tab { height: 37px; }
        .ov-tabs .ad-tab:not(.is-on) { color: #67718a; }

        .ov-people { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; }
        .ov-p { display: flex; flex-direction: column; min-height: 120px; padding: 25px 19px 16px; border-radius: 14px; border: 1px solid var(--ad-line); transition: border-color .15s; }
        .ov-p--short { min-height: 105px; }
        .ov-p:hover { border-color: #cfd2ee; }
        .ov-p strong, .ov-pipe strong { font-family: var(--ad-head); font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; color: var(--ad-ink); }
        .ov-p span { margin-top: 13px; font-size: 12px; color: var(--ad-muted); }
        .ov-p small { margin-top: 7px; font-size: 11px; color: var(--ad-faint); }

        .ov-pipe { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 13px; margin-top: 22px; }
        .ov-pipe div { display: flex; flex-direction: column; min-height: 120px; padding: 25px 0 16px 19px; border-radius: 14px; border: 1px solid var(--ad-line); overflow: hidden; }
        .ov-pipe span { margin-top: 13px; max-width: 56px; font-size: 12px; line-height: 1.25; color: var(--ad-muted); }

        .ov-pulse { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 22px; }
        .ov-pulse a { display: flex; flex-direction: column; padding: 20px 16px 16px; border-radius: 14px; background: var(--ad-soft-2); transition: background .15s; }
        .ov-pulse a:hover { background: var(--ad-lilac); }
        .ov-pulse strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.8px; color: var(--ad-ink); }
        .ov-pulse span { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }

        @media (max-width: 1180px) {
          .ov-grid { grid-template-columns: 1fr; }
          .ov-q { flex-wrap: wrap; }
          .ov-pipe span { max-width: none; }
        }
        @media (max-width: 640px) {
          .ov-card { padding: 18px 16px 20px; }
          .ov-card__head:not(.ov-card__head--c) { flex-direction: column; gap: 0; }
          .ov-link { margin: 10px 0 0; }
          .ov-q { flex-wrap: wrap; gap: 12px; }
          .ov-q__side { width: 100%; padding-left: 52px; }
          .ov-review { margin-left: auto; height: 38px; }
          .ov-a .ad-badge { display: none; }
          .ov-people { gap: 10px; }
          .ov-p, .ov-p--short { min-height: 0; padding: 16px 14px; }
          .ov-p strong, .ov-pipe strong { font-size: 24px; }
          .ov-pipe { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
          .ov-pipe div { min-height: 0; padding: 14px 10px; }
          .ov-pipe span { margin-top: 6px; }
        }
      `}</style>
    </AdminShell>
  );
}
