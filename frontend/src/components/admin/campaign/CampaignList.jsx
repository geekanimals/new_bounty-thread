"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { useRpc, errText } from "@/lib/supabase";
import { campTypeLabel, campStatusPick, campInBucket, statusTone, APPLICANT_PENDING, REPORT_APPROVED, fmtDate } from "@/components/admin/campaign/live";

/* Campaign list ke tabs — har tab apna route (Back ek step) */
const TABS = [
  { k: "all", label: "All", href: "/admin/campaigns", test: () => true },
  { k: "live", label: "Live", href: "/admin/campaigns/live", test: (c) => c.status === "Live" },
  { k: "draft", label: "Draft", href: "/admin/campaigns/draft", test: (c) => c.status === "Draft" },
  { k: "barter", label: "Barter", href: "/admin/campaigns/barter", test: (c) => campInBucket(c.raw, "barter") },
  { k: "paid", label: "Paid", href: "/admin/campaigns/paid", test: (c) => campInBucket(c.raw, "paid") },
  { k: "completed", label: "Completed", href: "/admin/campaigns/completed", test: (c) => c.status === "Completed" },
];

const pct = (a, b) => (b ? Math.min(100, Math.round((a / b) * 100)) : 0);
const sum = (o, pred) => Object.entries(o || {}).reduce((n, [k, v]) => n + (pred(k) ? Number(v) || 0 : 0), 0);

/* admin_campaigns ki ek row → list ki row (purane adminCampaigns jaisa hisaab) */
function toRow(c) {
  const pc = c.pipeline_stage_counts || {};
  const applied = (Number(c.applied) || 0) + sum(pc, () => true);
  const approved = (Number(c.approved) || 0) + sum(pc, REPORT_APPROVED);
  const done = sum(pc, (k) => k === "published" || k === "completed");
  const pending = sum(pc, (k) => APPLICANT_PENDING.includes(k)) + Math.max(0, (Number(c.applied) || 0) - (Number(c.approved) || 0) - (Number(c.declined) || 0));
  const status = campStatusPick(c.status);
  const risk =
    status === "Approval" ? "Waiting for approval" : pending ? `${pending} awaiting screening` : status === "Draft" ? "Not visible to creators" : status === "Completed" ? "Closed" : approved && done >= approved ? "All posted" : "On track";
  return { id: c.id, raw: c, name: c.name || "Untitled", brand: c.brand || c.org_name || "", type: (campTypeLabel(c.campaign_type, c.barter_subtype) || c.campaign_type || "—").replace(" · Normal", ""), status, applied, approved, done, ends: c.end_date ? fmtDate(c.end_date) : "—", risk };
}

/** Figma: Campaigns (All / Live / Draft / Barter / Paid / Completed) */
export default function CampaignList({ filter = "all" }) {
  const [q, setQ] = useState("");
  const tab = TABS.find((t) => t.k === filter) || TABS[0];
  // purana app: admin_campaigns (har 30 sec refresh)
  const { data, error, loading, reload } = useRpc("admin", "admin_campaigns", { p_status: null }, { refreshMs: 30000 });
  const all = useMemo(() => (Array.isArray(data) ? data.map(toRow) : []), [data]);
  const rows = all.filter(tab.test).filter((c) => `${c.name} ${c.brand}`.toLowerCase().includes(q.trim().toLowerCase()));
  const emptyMsg = error ? null : loading ? "Loading campaigns…" : q.trim() ? `No campaigns match “${q}”.` : "No campaigns here yet.";

  return (
    <AdminShell>
      <PageHead title="Campaigns" sub="A connected view of briefs, people, deliveries, creative and outcomes.">
        <Link href="/admin/campaigns/new" className="ga-btn ga-btn--primary">
          ＋ New campaign
        </Link>
      </PageHead>

      <section className="ga-card cl">
        <div className="cl-bar">
          <input className="ga-input cl-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search campaigns or brands…" aria-label="Search campaigns or brands" />
          <nav className="ga-tabs cl-tabs" aria-label="Campaign filter" data-scroll>
            {TABS.map((t) => (
              <Link key={t.k} href={t.href} className={`ga-tab ${t.k === tab.k ? "is-on" : ""}`}>
                {t.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="cl-wrap" data-scroll>
          <table className="ga-table cl-table">
            <thead>
              <tr>
                <th>Campaign / Brand</th>
                <th>Type</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Approved</th>
                <th>Completed</th>
                <th>Ends</th>
                <th>Action / Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/campaigns/${c.id}/overview`} className="cl-name">
                      {c.name}
                    </Link>
                    <span className="cl-brand">{c.brand}</span>
                  </td>
                  <td>{c.type}</td>
                  <td>
                    <span className={`ga-badge ga-badge--${c.status === "Completed" ? "green" : statusTone(c.status)}`}>{c.status === "Shortlist completed" ? "Shortlist" : c.status}</span>
                  </td>
                  <td>{c.applied}</td>
                  <td>{c.approved}</td>
                  <td>
                    <div className="cl-prog">
                      <span className="ga-bar">
                        <i style={{ width: `${pct(c.done, c.approved)}%` }} />
                      </span>
                      <small>
                        {c.done}/{c.approved}
                      </small>
                    </div>
                  </td>
                  <td>{c.ends}</td>
                  <td>
                    <Link href={`/admin/campaigns/${c.id}/overview`} className="cl-open">
                      Open workspace →
                    </Link>
                    <span className="cl-risk">{c.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && emptyMsg && <p className="cl-empty">{emptyMsg}</p>}
          {error && (
            <p className="cl-empty">
              {errText(error)}{" "}
              <button type="button" className="cl-retry" onClick={() => reload()}>
                Retry
              </button>
            </p>
          )}
        </div>

        {/* Mobile: cards */}
        <div className="cl-cards">
          {rows.map((c) => (
            <Link key={c.id} href={`/admin/campaigns/${c.id}/overview`} className="cl-card">
              <div className="cl-card__top">
                <div>
                  <p className="cl-name">{c.name}</p>
                  <span className="cl-brand">
                    {c.brand} · {c.type}
                  </span>
                </div>
                <span className={`ga-badge ga-badge--${c.status === "Completed" ? "green" : statusTone(c.status)}`}>{c.status === "Shortlist completed" ? "Shortlist" : c.status}</span>
              </div>
              <div className="cl-card__nums">
                <span>
                  <b>{c.applied}</b> applied
                </span>
                <span>
                  <b>{c.approved}</b> approved
                </span>
                <span>
                  Ends <b>{c.ends}</b>
                </span>
              </div>
              <div className="cl-prog">
                <span className="ga-bar">
                  <i style={{ width: `${pct(c.done, c.approved)}%` }} />
                </span>
                <small>
                  {c.done}/{c.approved}
                </small>
              </div>
              <div className="cl-card__foot">
                <span className="cl-risk">{c.risk}</span>
                <span className="cl-open">Open workspace →</span>
              </div>
            </Link>
          ))}
          {!rows.length && <p className="cl-empty">{error ? errText(error) : emptyMsg}</p>}
        </div>
      </section>

      <style>{`
        .cl { padding: 22px 22px 26px; }
        .cl-bar { display: flex; align-items: center; gap: 9px; margin-bottom: 20px; }
        .cl-search { width: 270px; flex-shrink: 0; height: 43px; }
        .cl-search::placeholder { color: #757575; }
        .cl-tabs { flex-wrap: nowrap; }
        .cl-tabs .ga-tab { height: 37px; }
        .cl-tabs .ga-tab:not(.is-on) { color: #67718a; }
        .cl-wrap { overflow-x: auto; }
        .cl-table { font-size: 13px; }
        .cl-table th { background: none; padding: 14px 10px 13px; }
        .cl-table td { padding: 15px 10px 14px; height: 69.5px; }
        .cl-table th:first-child, .cl-table td:first-child { padding-left: 11px; }
        .cl-name { display: block; font-size: 13px; font-weight: 800; color: var(--ad-ink); }
        a.cl-name:hover { color: var(--ad-primary); }
        .cl-brand { display: block; margin-top: 6px; font-size: 11px; font-weight: 500; color: #9aa1b3; }
        .cl-prog { display: flex; flex-direction: column; gap: 3px; width: 116px; }
        .cl-prog .ga-bar { height: 6px; background: #eceef6; }
        .cl-prog small { font-size: 12px; color: var(--ad-muted); }
        .cl-open { display: block; font-size: 13px; font-weight: 800; color: #6151ea; }
        .cl-open:hover { color: var(--ad-primary-2); }
        .cl-risk { display: block; margin-top: 5px; font-size: 12px; color: var(--ad-muted); }
        .cl-empty { padding: 30px 10px; text-align: center; font-size: 13px; color: var(--ad-muted); }
        .cl-cards { display: none; }
        .cl-retry { border: 0; background: none; padding: 0; font-weight: 800; color: var(--ad-primary); }

        @media (max-width: 1023px) {
          .cl-bar { flex-direction: column; align-items: stretch; }
          .cl-search { width: 100%; }
          .cl-tabs { overflow-x: auto; scrollbar-width: none; }
        }
        @media (max-width: 640px) {
          .cl { padding: 14px; }
          .cl-wrap { display: none; }
          .cl-cards { display: flex; flex-direction: column; gap: 10px; }
          .cl-card { display: flex; flex-direction: column; gap: 12px; padding: 14px; border-radius: 14px; border: 1px solid var(--ad-line); }
          .cl-card__top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
          .cl-card__nums { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 12px; color: var(--ad-muted); }
          .cl-card__nums b { color: var(--ad-ink); font-weight: 700; }
          .cl-card .cl-prog { width: 100%; }
          .cl-card__foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-top: 10px; border-top: 1px solid var(--ad-line); }
          .cl-card__foot .cl-risk { margin: 0; }
        }
      `}</style>
    </AdminShell>
  );
}
