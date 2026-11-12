"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import Drawer from "@/components/admin/queue/Drawer";
import DecisionPanel from "@/components/admin/queue/DecisionPanel";
import { FILTERS, FILTER_LABEL, queueFor, queueItem } from "@/components/admin/queue/queueData";

const KEY = "geek_aq_done";
const readDone = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const base = (f) => (f === "all" ? "/admin/action-queue" : `/admin/action-queue/${f}`);

/**
 * Action queue (Figma 007, 009–017). filter = tab, openId = drawer wala item (008/011/013/015).
 */
export default function ActionQueueView({ filter = "all", openId }) {
  const router = useRouter();
  const [done, setDone] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => setDone(readDone()), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const finish = (id, msg) => {
    const next = [...new Set([...done, id])];
    setDone(next);
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setToast(msg);
  };

  const items = queueFor(filter).filter((q) => !done.includes(q.id));
  const open = openId ? queueItem(openId) : null;
  const closeHref = base(filter);

  return (
    <AdminShell>
      <PageHead title="Action queue" sub="Every decision in one place. Prioritize by urgency, campaign and action type." />

      <Stats
        items={[
          { value: 60, label: "Creator decisions", note: "Pending screening", href: "/admin/action-queue/applications" },
          { value: 21, label: "Video reviews", note: "Submitted content", href: "/admin/action-queue/content" },
          { value: 1, label: "Contracts to send", note: "Ready for verification", href: "/admin/action-queue/contracts" },
          { value: 25, label: "Logistics actions", note: "To send + in transit", href: "/admin/action-queue/logistics" },
          { value: 82, label: "Priority items", note: "Illustrative aggregate", href: "/admin/action-queue" },
        ]}
      />

      <section className="ad-card aq">
        <div className="aq-head">
          <h2 className="ad-h2">Decision inbox</h2>
          <p className="aq-note">Sample tasks · read-only until demo action</p>
        </div>
        <nav className="ad-tabs aq-tabs" aria-label="Filter decisions" data-scroll>
          {FILTERS.map((f) => (
            <Link key={f.k} href={base(f.k)} className={`ad-tab ${filter === f.k ? "is-on" : ""}`} aria-current={filter === f.k ? "page" : undefined}>
              {f.label}
            </Link>
          ))}
        </nav>

        <div className="aq-list">
          {items.map((q) => (
            <div key={q.id} className="aq-row">
              <span className="aq-ic">{q.icon}</span>
              <div className="aq-main">
                <p className="aq-title">
                  <Link href={`${closeHref === "/admin/action-queue" ? "/admin/action-queue/all" : closeHref}/${q.id}`}>{q.title}</Link> <span className="ad-count">{q.count}</span>
                </p>
                <p className="aq-sub">{q.line || `${q.campaign} · ${q.reason}`}</p>
              </div>
              <div className="aq-side">
                <span className={`ad-badge ad-badge--${q.tone}`}>{q.pri}</span>
                <span className="aq-when">{q.when}</span>
                {q.kind === "campaign" ? (
                  <>
                    <Link href={`/admin/action-queue/campaigns/${q.id}`} className="aq-text">
                      Open brief
                    </Link>
                    <button type="button" className="ad-btn ad-btn--primary aq-solid" onClick={() => finish(q.id, "Monsoon Menu Launch is live — creators can apply now")}>
                      Approve &amp; go live
                    </button>
                  </>
                ) : q.kind === "signup" ? (
                  <>
                    <button type="button" className="aq-text" onClick={() => finish(q.id, `Declined — ${q.title.split(" wants")[0]} was notified`)}>
                      Decline
                    </button>
                    <button type="button" className="ad-btn ad-btn--primary aq-solid" onClick={() => finish(q.id, `Approved — ${q.title.split(" wants")[0]} can sign in now`)}>
                      Approve
                    </button>
                  </>
                ) : (
                  <Link href={`${closeHref === "/admin/action-queue" ? "/admin/action-queue/all" : closeHref}/${q.id}`} className="ad-btn ad-btn--ghost aq-review">
                    Review →
                  </Link>
                )}
              </div>
            </div>
          ))}
          {!items.length && (
            <div className="aq-empty">
              <strong>All clear ✨</strong>
              <span>Nothing waiting in {FILTER_LABEL[filter]}.</span>
              {done.length > 0 && (
                <button
                  type="button"
                  className="aq-text"
                  onClick={() => {
                    setDone([]);
                    try {
                      window.sessionStorage.removeItem(KEY);
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  Reset demo
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {open && (
        <Drawer eyebrow="Decision workspace" title={open.title} closeHref={closeHref}>
          <DecisionPanel
            meta={`${open.campaign} · ${open.when} · ${open.count} records`}
            badges={[
              { label: open.pri, tone: open.tone },
              { label: FILTER_LABEL[open.f], tone: "violet" },
            ]}
            why={`${open.reason}. Review campaign brief and evidence before making a decision.`}
            actions={
              <>
                <button
                  type="button"
                  className="ad-btn ad-btn--primary"
                  onClick={() => {
                    finish(open.id, open.kind === "campaign" ? "Monsoon Menu Launch is live — creators can apply now" : open.kind === "signup" ? "Account approved" : "Marked reviewed (demo)");
                    router.push(closeHref);
                  }}
                >
                  {open.kind === "campaign" ? "Approve & go live" : open.kind === "signup" ? "Approve" : "Mark reviewed (demo)"}
                </button>
                {open.cid ? (
                  <Link href={`/admin/campaigns/${open.cid}/overview`} className="ad-btn ad-btn--ghost">
                    Open campaign
                  </Link>
                ) : (
                  <Link href="/admin/users" className="ad-btn ad-btn--ghost">
                    Open all users
                  </Link>
                )}
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
        .aq { padding: 22px 22px 30px; }
        .aq-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .aq-note { font-size: 12px; color: var(--ad-muted); }
        .aq-tabs { margin-top: 17px; }
        .aq-tabs .ad-tab { height: 37px; }
        .aq-tabs .ad-tab:not(.is-on) { color: #67718a; }
        .aq-tabs .ad-tab:not(.is-on):hover { background: var(--ad-lilac); color: var(--ad-primary-2); }
        .aq-list { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
        .aq-row {
          display: flex; align-items: center; gap: 14px; min-height: 74px; padding: 12px 14px 12px 13px; border-radius: 14px;
          border: 1px solid var(--ad-line); background: #fff; transition: border-color .15s, box-shadow .15s;
        }
        .aq-row:hover { border-color: #cfd2ee; box-shadow: 0 10px 24px -20px rgba(30,37,73,.5); }
        .aq-ic { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; background: var(--ad-soft); font-size: 19px; color: var(--ad-ink); }
        .aq-main { flex: 1; min-width: 0; }
        .aq-title { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        .aq-title a:hover { color: var(--ad-primary); }
        .aq-title .ad-count { min-width: 26px; height: 24px; border-radius: 12px; }
        .aq-sub { margin-top: 8px; font-size: 12px; line-height: 1.33; color: #8791a7; }
        .aq-side { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .aq-when { font-size: 12px; color: var(--ad-muted); }
        .aq-review { height: 40px; padding: 0 15px; border-color: var(--ad-line-2); }
        .aq-text { border: 0; background: none; padding: 0 4px; font-size: 14px; font-weight: 800; color: #6657e9; white-space: nowrap; }
        a.aq-text { color: var(--ad-primary-ink); }
        .aq-text:hover { color: var(--ad-primary-2); }
        .aq-solid { height: 40px; padding: 0 16px; box-shadow: none; }
        .aq-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 40px 16px; border-radius: 14px; border: 1px dashed var(--ad-line-2); text-align: center; }
        .aq-empty strong { font-family: var(--ad-head); font-size: 17px; font-weight: 800; }
        .aq-empty span { font-size: 13px; color: var(--ad-muted); }

        @media (max-width: 1023px) {
          .aq-row { flex-wrap: wrap; }
          .aq-side { width: 100%; padding-left: 52px; }
          .aq-side > :last-child { margin-left: auto; }
        }
        @media (max-width: 640px) {
          .aq { padding: 18px 16px 20px; }
          .aq-tabs { flex-wrap: nowrap; overflow-x: auto; margin: 18px -16px 0; padding: 0 16px; scrollbar-width: none; }
          .aq-tabs::-webkit-scrollbar { display: none; }
          .aq-tabs .ad-tab { flex-shrink: 0; }
          .aq-row { gap: 12px; align-items: flex-start; }
          .aq-side { padding-left: 0; flex-wrap: wrap; }
        }
      `}</style>
    </AdminShell>
  );
}
