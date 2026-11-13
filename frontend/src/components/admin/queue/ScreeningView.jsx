"use client";

import { useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import Drawer from "@/components/admin/queue/Drawer";
import DecisionPanel from "@/components/admin/queue/DecisionPanel";
import QueueRecords from "@/components/admin/queue/QueueRecords";
import { useRpc } from "@/lib/supabase";
import { useToast, useReason, campId, typeLabel, StateBox } from "@/components/admin/queue/live";

const BASE = "/admin/applications/screening";
const TABS = ["Pending screening", "Shortlisted", "Approved"];
const DECLINED = ["ineligible", "brand_declined", "dropped", "rejected"];
/* tab → kaunse stage (purane APPLICANT_STAGE jaisa) */
const tabOf = (st) => (st === "applied" || st === "Applied" ? TABS[0] : st === "eligible" || st === "sent_to_brand" ? TABS[1] : DECLINED.includes(st) || st === "Declined" ? null : TABS[2]);
const slug = (s) =>
  String(s || "x")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "x";
const daysSince = (t) => {
  if (!t) return "Today";
  const d = Math.floor((Date.now() - new Date(t).getTime()) / 86400000);
  return d <= 0 ? "Today" : d === 1 ? "1 day" : `${d} days`;
};

/**
 * Applications → screening queue (Figma 005) — applicants campaign-wise groups mein.
 * Data: api.org_applicants + admin_applications. openId = group ("c-<campaign>-<tab>") ka drawer.
 */
export default function ScreeningView({ openId }) {
  const pr = useRpc("admin", "api.org_applicants", { p_campaign: null, p_stage: null }, { refreshMs: 30000 });
  const ar = useRpc("admin", "admin_applications", { p_campaign: null, p_status: null }, { refreshMs: 30000 });
  const [tab, setTab] = useState(TABS[0]);
  const [toastNode, toast] = useToast();
  const [reasonNode, ask] = useReason();

  const recs = [
    ...(Array.isArray(pr.data) ? pr.data : []),
    ...(Array.isArray(ar.data) ? ar.data : []).map((x) => ({ ...x, _legacy: true, stage: x.status, applied_at: x.created_at })),
  ];
  // groups: campaign + tab
  const groups = {};
  recs.forEach((x) => {
    const t = tabOf(x.stage);
    if (!t) return;
    const name = x.campaign_name || "Campaign";
    const id = `c-${slug(name)}-${TABS.indexOf(t)}`;
    if (!groups[id]) groups[id] = { id, tab: t, name, items: [], ctype: x.campaign_type, cid: x._legacy ? x.campaign_id : campId(x) };
    groups[id].items.push(x);
  });
  const all = Object.values(groups).map((g) => {
    const since = g.items.reduce((m, x) => (!m || (x.applied_at && x.applied_at < m) ? x.applied_at : m), null);
    const n = g.items.length;
    return {
      ...g,
      count: n,
      icon: g.tab === TABS[0] ? "✍️" : g.tab === TABS[1] ? "♙" : "✓",
      title: g.tab === TABS[0] ? `Screen new creators for ${g.name}` : g.tab === TABS[1] ? `Confirm shortlisted creators for ${g.name}` : `Approved creators for ${g.name}`,
      campaign: [g.name, typeLabel(g.ctype) !== "—" ? typeLabel(g.ctype) : ""].filter(Boolean).join(" · "),
      reason: g.tab === TABS[2] ? `${n} creator${n > 1 ? "s" : ""} selected` : `${n} applicant${n > 1 ? "s" : ""} waiting for a decision`,
      pri: g.tab === TABS[2] ? "Done" : n >= 10 ? "High" : "Medium",
      tone: g.tab === TABS[2] ? "green" : n >= 10 ? "orange" : "violet",
      when: daysSince(since),
      since,
    };
  });
  all.sort((a, b) => b.count - a.count);
  const items = all.filter((g) => g.tab === tab);
  const open = openId ? all.find((g) => g.id === decodeURIComponent(openId)) : null;
  const pending = recs.filter((x) => tabOf(x.stage) === TABS[0]).length;
  const shortlisted = recs.filter((x) => tabOf(x.stage) === TABS[1]).length;
  const loading = pr.loading && !pr.data;
  const reload = () => {
    pr.reload(true);
    ar.reload(true);
  };

  return (
    <AdminShell>
      <PageHead title="Applications" sub="Review campaign applicants with brand fit and verified signals." />

      <Stats
        items={[
          { value: pending, label: "Pending screening", note: "Waiting for a decision" },
          { value: shortlisted, label: "Shortlisted", note: "Screened · awaiting brand" },
          { value: "●", label: "Live data", note: "Refreshes every 30s" },
        ]}
      />

      <section className="ad-card sq">
        <div className="ad-tabs sq-tabs" role="tablist" data-scroll>
          {TABS.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={`ad-tab ${tab === t ? "is-on" : ""}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="sq-list">
          <StateBox loading={loading} error={!pr.data && pr.error} onRetry={reload} />
          {items.map((q) => (
            <div key={q.id} className="sq-row">
              <span className="sq-ic">{q.icon}</span>
              <div className="sq-main">
                <p className="sq-title">
                  <Link href={`${BASE}/${q.id}`}>{q.title}</Link> <span className="ad-count">{q.count}</span>
                </p>
                <p className="sq-sub">
                  {q.campaign} · {q.reason}
                </p>
              </div>
              <div className="sq-side">
                <span className={`ad-badge ad-badge--${q.tone}`}>{q.pri}</span>
                <span className="sq-when">{q.when}</span>
                <Link href={`${BASE}/${q.id}`} className="ad-btn ad-btn--ghost sq-review">
                  Review →
                </Link>
              </div>
            </div>
          ))}
          {!loading && pr.data && !items.length && (
            <div className="sq-empty">
              <strong>{tab === "Approved" ? "No approvals yet" : "Nothing here yet"}</strong>
              <span>{tab === "Approved" ? "Approve creators from the full applications list." : "New applicants show up here."}</span>
              <Link href="/admin/applications" className="sq-link">
                Open all applications →
              </Link>
            </div>
          )}
        </div>
      </section>

      {open && (
        <Drawer eyebrow="Decision workspace" title={open.title} closeHref={BASE}>
          <DecisionPanel
            meta={`${open.campaign} · ${open.when} · ${open.count} record${open.count > 1 ? "s" : ""}`}
            badges={[
              { label: open.pri, tone: open.tone },
              { label: "Applications", tone: "violet" },
            ]}
            why={`${open.reason}. Review campaign brief and evidence before making a decision.`}
            actions={
              <>
                <Link href="/admin/applications" className="ad-btn ad-btn--primary">
                  Open applications
                </Link>
                {open.cid && (
                  <Link href={`/admin/campaigns/${open.cid}/overview`} className="ad-btn ad-btn--ghost">
                    Open campaign
                  </Link>
                )}
              </>
            }
          >
            <QueueRecords group={{ ...open, f: open.tab === TABS[2] ? "approved" : "applications" }} ask={ask} toast={toast} onDone={reload} />
          </DecisionPanel>
        </Drawer>
      )}
      {openId && !open && !loading && (
        <Drawer eyebrow="Decision workspace" title="Nothing waiting here" closeHref={BASE}>
          <p className="sq-sub">These creators were already handled.</p>
        </Drawer>
      )}

      {reasonNode}
      {toastNode}

      <style>{`
        .sq { padding: 22px 22px 30px; }
        .sq-tabs .ad-tab { height: 37px; }
        .sq-tabs .ad-tab:not(.is-on) { color: #67718a; }
        .sq-list { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
        .sq-row { display: flex; align-items: center; gap: 14px; min-height: 74px; padding: 12px 14px 12px 13px; border-radius: 14px; border: 1px solid var(--ad-line); background: #fff; transition: border-color .15s; }
        .sq-row:hover { border-color: #cfd2ee; }
        .sq-ic { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; background: var(--ad-soft); font-size: 19px; color: var(--ad-ink); }
        .sq-main { flex: 1; min-width: 0; }
        .sq-title { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        .sq-title a:hover { color: var(--ad-primary); }
        .sq-title .ad-count { min-width: 26px; height: 24px; border-radius: 12px; }
        .sq-sub { margin-top: 8px; font-size: 12px; line-height: 1.33; color: #8791a7; }
        .sq-side { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .sq-when { font-size: 12px; color: var(--ad-muted); }
        .sq-review { height: 40px; padding: 0 15px; border-color: var(--ad-line-2); }
        .sq-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 36px 16px; border-radius: 14px; border: 1px dashed var(--ad-line-2); text-align: center; }
        .sq-empty strong { font-family: var(--ad-head); font-size: 17px; font-weight: 800; }
        .sq-empty span { font-size: 13px; color: var(--ad-muted); }
        .sq-link { margin-top: 4px; font-size: 13px; font-weight: 800; color: var(--ad-primary-ink); }
        @media (max-width: 1023px) {
          .sq-row { flex-wrap: wrap; }
          .sq-side { width: 100%; padding-left: 52px; }
          .sq-side > :last-child { margin-left: auto; }
        }
        @media (max-width: 640px) {
          .sq { padding: 18px 16px 20px; }
          .sq-row { align-items: flex-start; gap: 12px; }
          .sq-side { padding-left: 0; }
        }
      `}</style>
    </AdminShell>
  );
}
