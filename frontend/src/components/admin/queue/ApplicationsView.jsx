"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import Drawer from "@/components/admin/queue/Drawer";
import DecisionPanel from "@/components/admin/queue/DecisionPanel";
import { APPLICATIONS, applicationById } from "@/components/admin/queue/queueData";

const KEY = "geek_app_done";
const TYPES = [
  { k: "All", label: "All" },
  { k: "Paid", label: "💰 Paid 21" },
  { k: "Barter", label: "🎁 Barter 39" },
];
const CAMPAIGN_LIST = [...new Set(APPLICATIONS.map((a) => a.campaign))];

/**
 * Applications (Figma 006) + creator review drawer (Figma 005) jab openId ho.
 */
export default function ApplicationsView({ openId }) {
  const router = useRouter();
  const [done, setDone] = useState({});
  const [type, setType] = useState("All");
  const [camp, setCamp] = useState("");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      setDone(JSON.parse(window.sessionStorage.getItem(KEY) || "{}"));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const decide = (a, how) => {
    const next = { ...done, [a.id]: how };
    setDone(next);
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setToast(how === "approved" ? `${a.name} approved for ${a.campaign}` : `${a.name} declined — no message sent (auto messages off)`);
  };

  const approvedN = Object.values(done).filter((v) => v === "approved").length;
  const declinedN = Object.values(done).filter((v) => v === "declined").length;
  const pending = 60 - approvedN - declinedN;

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return APPLICATIONS.filter((a) => !done[a.id])
      .filter((a) => type === "All" || a.type === type)
      .filter((a) => !camp || a.campaign === camp)
      .filter((a) => !t || a.name.toLowerCase().includes(t) || a.handle.toLowerCase().includes(t));
  }, [done, type, camp, q]);

  const csv = () => {
    const head = "Creator,Handle,Campaign,Type,Followers,Applied,Fit";
    const body = rows.map((a) => [a.name, a.handle, a.campaign, a.type, a.followers, a.applied, a.fit].join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([head + "\n" + body], { type: "text/csv" }));
    const el = document.createElement("a");
    el.href = url;
    el.download = "pending-applications.csv";
    el.click();
    URL.revokeObjectURL(url);
  };

  const open = openId ? applicationById(openId) : null;

  return (
    <AdminShell>
      <PageHead title="Applications" sub="Every creator who applied, across all campaigns — decide in one place." />

      <Stats
        items={[
          { value: pending, label: "Pending", note: "Waiting for you", href: "/admin/applications/screening" },
          { value: 151 + approvedN, label: "Approved", note: "Selected creators" },
          { value: 17 + declinedN, label: "Declined", note: "Not selected" },
          { value: 228, label: "All applications", note: "Everything" },
        ]}
      />

      <section className="ad-card apl">
        <div className="apl-head">
          <h2 className="ad-h2">Pending · {pending}</h2>
          <button type="button" className="apl-csv" onClick={csv}>
            ⬇️ CSV
          </button>
        </div>

        <div className="apl-filters">
          <div className="ad-tabs apl-tabs" role="tablist">
            {TYPES.map((t) => (
              <button key={t.k} type="button" role="tab" aria-selected={type === t.k} className={`ad-tab ${type === t.k ? "is-on" : ""}`} onClick={() => setType(t.k)}>
                {t.label}
              </button>
            ))}
          </div>
          <select className="ad-input apl-select" value={camp} onChange={(e) => setCamp(e.target.value)} aria-label="Campaign">
            <option value="">All campaigns</option>
            {CAMPAIGN_LIST.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input className="ad-input apl-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creator…" aria-label="Search creator" />
        </div>

        <div className="apl-wrap" data-scroll>
          <table className="apl-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Campaign</th>
                <th>Type</th>
                <th>Followers</th>
                <th>Applied</th>
                <th>Fit</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} onClick={() => router.push(`/admin/applications/${a.id}`)}>
                  <td>
                    <Link href={`/admin/applications/${a.id}`} className="apl-name" onClick={(e) => e.stopPropagation()}>
                      {a.name}
                    </Link>
                    <span className="apl-handle">{a.handle}</span>
                  </td>
                  <td>{a.campaign}</td>
                  <td>
                    <span className={`ad-badge ad-badge--${a.type === "Paid" ? "violet" : "orange"}`}>{a.type}</span>
                  </td>
                  <td>{a.followers}</td>
                  <td>{a.applied}</td>
                  <td>
                    <span className={`ad-badge ad-badge--${a.fit === "Good fit" ? "green" : "orange"}`}>{a.fit}</span>
                  </td>
                  <td className="apl-act" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="apl-decline" onClick={() => decide(a, "declined")}>
                      Decline
                    </button>
                    <button type="button" className="ad-btn ad-btn--primary apl-approve" onClick={() => decide(a, "approved")}>
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="apl-empty">No pending applications match these filters.</p>}
        </div>
      </section>

      {open && (
        <Drawer eyebrow="Decision workspace" title={`Screen ${open.name} for ${open.campaign}`} closeHref="/admin/applications">
          <DecisionPanel
            meta={`${open.campaign} · ${open.type} · Applied ${open.applied.toLowerCase()} · ${open.followers} followers`}
            badges={[
              { label: open.fit, tone: open.fit === "Good fit" ? "green" : "orange" },
              { label: "Applications", tone: "violet" },
            ]}
            why={`${open.name} (${open.handle}) is waiting for a decision. Review campaign brief and evidence before making a decision.`}
            actions={
              done[open.id] ? (
                <>
                  <span className={`ad-badge ad-badge--${done[open.id] === "approved" ? "green" : "red"} apl-state`}>{done[open.id] === "approved" ? "✓ Approved" : "Declined"}</span>
                  <Link href={`/admin/campaigns/${open.cid}/creators`} className="ad-btn ad-btn--ghost">
                    Open campaign
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="ad-btn ad-btn--primary"
                    onClick={() => {
                      decide(open, "approved");
                      router.push("/admin/applications");
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="ad-btn ad-btn--ghost"
                    onClick={() => {
                      decide(open, "declined");
                      router.push("/admin/applications");
                    }}
                  >
                    Decline
                  </button>
                  <Link href={`/admin/creators/${open.id}/profile`} className="ad-btn ad-btn--ghost">
                    View 360°
                  </Link>
                  <Link href={`/admin/campaigns/${open.cid}/overview`} className="ad-btn ad-btn--ghost">
                    Open campaign
                  </Link>
                </>
              )
            }
          />
        </Drawer>
      )}

      {toast && (
        <div className="ad-toast" role="status">
          ✓ {toast}
        </div>
      )}

      <style>{`
        .apl { padding: 22px 22px 22px; }
        .apl-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 7px; }
        .apl-csv { margin-right: 8px; border: 0; background: none; padding: 0; font-size: 14px; font-weight: 800; color: #6657e9; }
        .apl-csv:hover { color: var(--ad-primary-2); }
        .apl-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 26px; }
        .apl-tabs .ad-tab { height: 37px; }
        .apl-tabs .ad-tab:not(.is-on) { color: #67718a; }
        .apl-select { width: 233px; height: 44px; margin-left: 4px; padding-right: 30px; appearance: none; color: var(--ad-text); background: #fff; }
        .apl-search { width: 270px; height: 44px; }
        .apl-search::placeholder { color: #757575; }

        .apl-wrap { margin-top: 31px; overflow-x: auto; }
        .apl-table { width: 100%; min-width: 960px; border-collapse: collapse; font-size: 13px; }
        .apl-table th { padding: 0 11px 14px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #9aa2b4; border-bottom: 1px solid var(--ad-line); white-space: nowrap; }
        .apl-table td { height: 70px; padding: 0 11px; border-bottom: 1px solid var(--ad-line); color: var(--ad-ink); white-space: nowrap; }
        .apl-table tbody tr:last-child td { border-bottom: 0; }
        .apl-table tbody tr { cursor: pointer; transition: background .15s; }
        .apl-table tbody tr:hover { background: var(--ad-soft-2); }
        .apl-table th:nth-child(1) { width: 145px; }
        .apl-table th:nth-child(2) { width: 240px; }
        .apl-table th:nth-child(3) { width: 102px; }
        .apl-table th:nth-child(4) { width: 124px; }
        .apl-table th:nth-child(5) { width: 109px; }
        .apl-table th:nth-child(6) { width: 112px; }
        .apl-name { display: block; font-size: 13px; font-weight: 800; color: var(--ad-ink); }
        .apl-name:hover { color: var(--ad-primary); }
        .apl-handle { display: block; margin-top: 6px; font-size: 11px; font-weight: 500; color: #9aa1b3; }
        .apl-act { text-align: left; }
        .apl-decline { border: 0; background: none; padding: 0 10px 0 0; font-size: 13px; font-weight: 800; color: #6657e9; }
        .apl-decline:hover { color: var(--ad-red); }
        .apl-approve { height: 40px; padding: 0 16px; font-size: 13px; box-shadow: none; margin-left: 2px; }
        .apl-empty { padding: 30px 0 10px; text-align: center; font-size: 13px; color: var(--ad-muted); }
        .apl-state { height: 40px; padding: 0 14px; font-size: 13px; }

        @media (max-width: 1023px) {
          .apl-select, .apl-search { flex: 1 1 200px; width: auto; margin-left: 0; }
        }
        @media (max-width: 640px) {
          .apl { padding: 18px 16px; }
          .apl-filters { gap: 8px; }
          .apl-tabs { width: 100%; }
          .apl-select, .apl-search { flex: 1 1 100%; }
          .apl-wrap { margin: 16px -16px 0; padding: 0 16px; }
        }
      `}</style>
    </AdminShell>
  );
}
