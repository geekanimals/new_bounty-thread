"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import { useRpc } from "@/lib/supabase";
import { useApprovals, buildQueue, fmtNum, ago, N, StateBox } from "@/components/admin/queue/live";

/* Live activity: event → icon / text / tab (purane adminOverview jaisa) */
const EV = {
  login: ["🟢", "signed in", "in"],
  sign_out: ["🚪", "signed out", "in"],
  consent: ["🍪", "chose cookies", "in"],
  campaign_apply: ["📝", "applied to a campaign", "camp"],
  instagram_connect_start: ["⏳", "started connecting Instagram", "ig"],
  instagram_connect: ["📸", "connected Instagram", "ig"],
  instagram_connected: ["📸", "connected Instagram", "ig"],
  instagram_publish: ["📤", "published on Instagram", "camp"],
  publish: ["📤", "published on Instagram", "camp"],
  profile_completed: ["✅", "completed their profile", "prof"],
  official_email_verified: ["✉️", "verified official email", "prof"],
  campaign_create: ["📣", "created a campaign", "camp"],
  campaign_edit: ["✏️", "edited a campaign", "camp"],
  application_approve: ["👍", "approved an application", "camp"],
  application_decline: ["👎", "declined an application", "camp"],
  contract_sign: ["✍️", "signed a contract", "camp"],
};
const evOf = (e) => EV[e] || ["•", String(e || "").replace(/_/g, " "), "other"];
const TABS = [
  ["All", "all"],
  ["Campaigns", "camp"],
  ["Instagram", "ig"],
  ["Sign-ins", "in"],
  ["Profiles", "prof"],
];
const KIND = { camp: ["Campaign", "green"], ig: ["Instagram", "violet"], in: ["Sign-in", ""], prof: ["Profile", "blue"], other: ["Activity", ""] };
const ROLE = { creator: "Creator", owner: "Agency", brand: "Brand", manager: "Manager", corporate: "Corporate" };

/* AdminShell ke andar render hota hai, isliye login kiye admin ka naam yahan milta hai */
function Hello({ hello }) {
  const me = useAdmin();
  return (
    <>
      {hello}, {(me?.name || "").split(" ")[0] || "there"} ✳️
    </>
  );
}

export default function AdminOverview() {
  const [hello, setHello] = useState("Good afternoon");
  const [tab, setTab] = useState("all");

  // Time ke hisaab se greeting (render ke baad — Next cache rule)
  useEffect(() => {
    const h = new Date().getHours();
    setHello(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  // purane Super Admin overview ki hi calls: admin_dashboard + api.workspace_live (har 30 sec)
  const dash = useRpc("admin", "admin_dashboard", {}, { refreshMs: 30000 });
  const live = useRpc("admin", "api.workspace_live", {}, { refreshMs: 30000 });
  const { inbox, proc, loading: qLoading, error: qError, reload: qReload } = useApprovals(30000);

  const d = dash.data || {},
    t = d.todo || {},
    pe = d.people || {},
    c = d.campaigns || {};
  const W = live.data || {},
    wc = W.campaigns || {},
    wco = W.content || {},
    B = W.barter || {};
  const actions = N(t.accounts_pending) + N(t.applications_pending) + N(t.campaigns_awaiting) + N(t.contracts_to_send) + N(t.content_to_review);
  const toSend = Math.max(0, N(B.total) - N(B.shipped) - N(B.delivered)),
    inTransit = N(B.shipped);
  const pct = (a, b) => (N(b) ? Math.round((100 * N(a)) / N(b)) : 0);
  const queue = buildQueue(inbox, proc).slice(0, 3);
  const qHref = (q) => (q.kind === "group" ? `/admin/action-queue/all/${q.id}` : `/admin/action-queue/${q.f}/${q.id}`);

  const rec = Array.isArray(d.recent) ? d.recent : [];
  const feed = rec.filter((r) => tab === "all" || evOf(r.event)[2] === tab);
  const tabN = (k) => (k === "all" ? rec.length : rec.filter((r) => evOf(r.event)[2] === k).length);

  const PEOPLE = [
    { n: pe.creators, l: "Creators", s: `${pct(pe.instagram_connected, pe.creators)}% on Instagram`, href: "/admin/creators" },
    { n: pe.instagram_connected, l: "Instagram connected", s: `of ${fmtNum(pe.creators)} creators`, href: "/admin/creators" },
    { n: pe.agencies, l: "Agencies", href: "/admin/users" },
    { n: pe.brands, l: "Brands", href: "/admin/brands" },
    { n: pe.joined_today, l: "Joined today", s: "new accounts", href: "/admin/users" },
    { n: pe.signed_in_today, l: "Signed in today", s: "active people", href: "/admin/activity" },
  ];
  const PIPE = [
    [pe.creators, "Signed up"],
    [pe.instagram_connected, "IG linked"],
    [Math.max(0, N(pe.creators) - N(t.creators_incomplete)), "Profile ready"],
    [c.applications, "Applied"],
    [c.approved, "Approved"],
  ];
  const dash0 = dash.loading && !dash.data;

  return (
    <AdminShell>
      <PageHead title={<Hello hello={hello} />} sub="One workspace for the decisions, people and campaigns that move Geek OS forward.">
        <Link href="/admin/campaigns/new" className="ga-btn ga-btn--primary">
          ＋ New campaign
        </Link>
      </PageHead>

      <Stats
        items={[
          { value: dash0 ? "—" : fmtNum(actions), label: "Actions requiring review", note: "Across campaign operations", href: "/admin/action-queue" },
          { value: dash0 ? "—" : fmtNum(wc.live != null ? wc.live : c.live), label: "Campaigns live", note: `${fmtNum(c.total)} campaigns total`, href: "/admin/campaigns/live" },
          { value: dash0 ? "—" : fmtNum(pe.creators), label: "Creators", note: `${fmtNum(pe.instagram_connected)} connected to Instagram`, href: "/admin/creators" },
          { value: live.data ? fmtNum(toSend + inTransit) : "—", label: "Shipments need progress", note: `${fmtNum(toSend)} to send · ${fmtNum(inTransit)} in transit`, href: "/admin/logistics" },
          { value: live.data ? fmtNum(wco.published) : "—", label: "Posts published", note: "Across all campaigns", href: "/admin/reports" },
        ]}
      />

      <div className="ov-grid">
        <div className="ov-col">
          {/* Priority queue */}
          <section className="ga-card ov-card">
            <div className="ov-card__head">
              <div>
                <h2 className="ga-h2">⚡ Your priority queue</h2>
                <p className="ov-sub">One-click triage. Open an item to review its context before acting.</p>
              </div>
              <Link href="/admin/action-queue" className="ov-link">
                View all tasks →
              </Link>
            </div>
            <div className="ov-list">
              <StateBox loading={qLoading && !queue.length} error={!queue.length && qError} onRetry={qReload} />
              {!qLoading && !qError && !queue.length && <div className="ov-clear">✅ All clear — nothing waiting on you right now.</div>}
              {queue.map((q) => (
                <div key={q.id} className="ov-q">
                  <span className="ov-ic">{q.icon}</span>
                  <div className="ov-q__main">
                    <p className="ov-q__title">
                      {q.title} <span className="ga-count">{q.count}</span>
                    </p>
                    <p className="ov-q__sub">{q.line || `${q.campaign} · ${q.reason}`}</p>
                  </div>
                  <div className="ov-q__side">
                    <span className={`ga-badge ga-badge--${q.tone}`}>{q.pri}</span>
                    <span className="ov-when">{q.when}</span>
                    <Link href={qHref(q)} className="ga-btn ga-btn--ghost ov-review">
                      Review →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Live activity */}
          <section className="ga-card ov-card">
            <h2 className="ga-h2">🕒 Live activity</h2>
            <p className="ov-sub">Sign-ins, campaigns and Instagram connections as they happen.</p>
            <div className="ga-tabs ov-tabs" role="tablist">
              {TABS.filter(([, k]) => k !== "prof" || tabN(k)).map(([label, k]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className={`ga-tab ${tab === k ? "is-on" : ""}`} onClick={() => setTab(k)}>
                  {label} {tabN(k)}
                </button>
              ))}
            </div>
            <div className="ov-list">
              {dash0 && <StateBox loading />}
              {!dash.data && dash.error && <StateBox error={dash.error} onRetry={dash.reload} />}
              {dash.data && !feed.length && <div className="ov-clear">Nothing here yet.</div>}
              {feed.map((r, i) => {
                const [ic, txt, k] = evOf(r.event);
                const det = r.detail || {};
                const sub = [ROLE[r.role] || r.role, det.campaign ? `📣 ${det.campaign}` : "", det.profile ? `@${det.profile}` : "", r.city, ago(r.at)].filter(Boolean).join(" · ");
                return (
                  <Link key={`${r.at}-${i}`} href="/admin/activity" className="ov-a">
                    <span className="ov-ic">{ic}</span>
                    <div className="ov-q__main">
                      <p className="ov-q__title">
                        {r.who || "Someone"} {txt}
                        {r.event === "consent" && det.choice ? ` (${det.choice})` : ""}
                      </p>
                      <p className="ov-q__sub">{sub}</p>
                    </div>
                    <span className={`ga-badge ga-badge--${KIND[k][1]}`}>{KIND[k][0]}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="ov-col">
          {/* People */}
          <section className="ga-card ov-card">
            <h2 className="ga-h2">👥 People</h2>
            <p className="ov-sub">Who is on Geek OS right now.</p>
            <div className="ov-people">
              {PEOPLE.map((p) => (
                <Link key={p.l} href={p.href} className={`ov-p ${p.s ? "" : "ov-p--short"}`}>
                  <strong>{dash0 ? "—" : fmtNum(p.n)}</strong>
                  <span>{p.l}</span>
                  {p.s && <small>{p.s}</small>}
                </Link>
              ))}
            </div>
          </section>

          {/* Creator pipeline */}
          <section className="ga-card ov-card">
            <div className="ov-card__head ov-card__head--c">
              <h2 className="ga-h2">Creator pipeline</h2>
              <span className="ga-badge ga-badge--green">Live</span>
            </div>
            <div className="ov-pipe">
              {PIPE.map(([n, l]) => (
                <div key={l}>
                  <strong>{dash0 ? "—" : fmtNum(n)}</strong>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Fulfilment pulse */}
          <section className="ga-card ov-card">
            <div className="ov-card__head ov-card__head--c">
              <h2 className="ga-h2">Fulfilment pulse</h2>
              <Link href="/admin/logistics" className="ov-link">
                Open logistics →
              </Link>
            </div>
            <div className="ov-pulse">
              {[
                [toSend, "To send"],
                [inTransit, "In transit"],
                [B.delivered, "Delivered"],
              ].map(([n, l]) => (
                <Link key={l} href="/admin/logistics">
                  <strong>{live.data ? fmtNum(n) : "—"}</strong>
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
        .ov-clear { padding: 18px 14px; border-radius: 14px; background: var(--ad-soft-2); font-size: 13px; color: var(--ad-muted); }

        .ov-q, .ov-a {
          display: flex; align-items: center; gap: 14px; padding: 18px 14px 14px 13px; border-radius: 14px;
          border: 1px solid var(--ad-line); background: #fff; transition: border-color .15s, box-shadow .15s;
        }
        .ov-a { padding: 15px 14px 14px 13px; }
        .ov-q:hover, .ov-a:hover { border-color: #cfd2ee; box-shadow: 0 10px 24px -20px rgba(30,37,73,.5); }
        .ov-ic { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; background: var(--ad-soft); font-size: 19px; color: var(--ad-ink); }
        .ov-q__main { flex: 1; min-width: 0; }
        .ov-q__title { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        .ov-q__title .ga-count { min-width: 30px; height: 24px; border-radius: 12px; }
        .ov-q__sub { margin-top: 6px; font-size: 12px; line-height: 1.33; color: #8791a7; }
        .ov-q__side { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .ov-when { font-size: 12px; color: var(--ad-muted); }
        .ov-review { height: 42px; padding: 0 15px; border-color: var(--ad-line-2); color: var(--ad-primary-ink); }
        .ov-tabs { margin-top: 26px; }
        .ov-tabs .ga-tab { height: 37px; }
        .ov-tabs .ga-tab:not(.is-on) { color: #67718a; }

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
          .ov-a .ga-badge { display: none; }
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
