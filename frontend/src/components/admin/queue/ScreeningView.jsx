"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import Drawer from "@/components/admin/queue/Drawer";
import DecisionPanel from "@/components/admin/queue/DecisionPanel";
import { SCREENING, queueItem } from "@/components/admin/queue/queueData";

const KEY = "geek_aq_done";
const BASE = "/admin/applications/screening";
const TABS = ["Pending screening", "Shortlisted", "Approved"];

/**
 * Applications → screening queue (Figma 005).
 * openId = drawer wala item ("Decision workspace"), apne route par.
 */
export default function ScreeningView({ openId }) {
  const router = useRouter();
  const [tab, setTab] = useState(TABS[0]);
  const [done, setDone] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      setDone(JSON.parse(window.sessionStorage.getItem(KEY) || "[]"));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const finish = (id) => {
    const next = [...new Set([...done, id])];
    setDone(next);
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setToast("Marked reviewed (demo)");
  };

  const all = SCREENING.map(queueItem).filter(Boolean);
  const pending = all.filter((q) => !done.includes(q.id));
  const reviewed = all.filter((q) => done.includes(q.id));
  const items = tab === "Pending screening" ? pending : tab === "Shortlisted" ? reviewed : [];
  const open = openId ? queueItem(openId) : null;

  return (
    <AdminShell>
      <PageHead title="Applications" sub="Review campaign applicants with brand fit and verified signals." />

      <Stats
        items={[
          { value: 60, label: "Pending screening", note: "Illustrative reference" },
          { value: "●", label: "Safe design mode", note: "No writes to production" },
          { value: "—", label: "Data sync", note: "Not connected to backend" },
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
          {!items.length && (
            <div className="sq-empty">
              <strong>{tab === "Approved" ? "No approvals yet" : "Nothing here yet"}</strong>
              <span>{tab === "Approved" ? "Approve creators from the full applications list." : "Reviewed items show up here."}</span>
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
            meta={`${open.campaign} · ${open.when} · ${open.count} records`}
            badges={[
              { label: open.pri, tone: open.tone },
              { label: "Applications", tone: "violet" },
            ]}
            why={`${open.reason}. Review campaign brief and evidence before making a decision.`}
            actions={
              <>
                <button
                  type="button"
                  className="ad-btn ad-btn--primary"
                  onClick={() => {
                    finish(open.id);
                    router.push(BASE);
                  }}
                >
                  Mark reviewed (demo)
                </button>
                <Link href={`/admin/campaigns/${open.cid}/overview`} className="ad-btn ad-btn--ghost">
                  Open campaign
                </Link>
              </>
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
