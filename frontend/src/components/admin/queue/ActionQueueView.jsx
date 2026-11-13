"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import Drawer from "@/components/admin/queue/Drawer";
import DecisionPanel from "@/components/admin/queue/DecisionPanel";
import QueueRecords from "@/components/admin/queue/QueueRecords";
import { FILTERS, FILTER_LABEL } from "@/components/admin/queue/queueData";
import { useApprovals, buildQueue, useToast, useReason, act, errText, StateBox } from "@/components/admin/queue/live";

const base = (f) => (f === "all" ? "/admin/action-queue" : `/admin/action-queue/${f}`);

/**
 * Action queue (Figma 007, 009–017) — asli data: api.approvals_inbox + api.process_inbox (har 20 sec).
 * filter = tab, openId = drawer wala group (008/011/013/015).
 */
export default function ActionQueueView({ filter = "all", openId }) {
  const router = useRouter();
  const { inbox, proc, loading, error, reload } = useApprovals();
  const [toastNode, toast] = useToast();
  const [reasonNode, ask] = useReason();
  const [busy, setBusy] = useState("");

  const all = buildQueue(inbox, proc);
  const items = filter === "all" ? all : all.filter((q) => q.f === filter);
  const open = openId ? all.find((q) => q.id === openId) : null;
  const closeHref = base(filter);
  const itemHref = (q) => `${filter === "all" ? "/admin/action-queue/all" : closeHref}/${q.id}`;

  const kindN = (...k) => proc.filter((x) => k.includes(x.kind)).length;
  const apps = (inbox.applicants || []).length + (inbox.marketplace || []).length;
  const total = apps + proc.length + (inbox.campaigns || []).length + (inbox.signups || []).length;

  /* ek decision chalao → toast → data dobara */
  const run = async (key, fn, okMsg, after) => {
    setBusy(key);
    const { error: e } = await fn();
    setBusy("");
    if (e) return toast(errText(e), true);
    toast(okMsg);
    reload();
    after && after();
  };
  const approveCampaign = (q) => run(q.id, () => act.approveCampaign(q.rec.id), `${q.rec.name} is live — creators can apply now`, () => openId && router.push(closeHref));
  const sendBack = async (q) => {
    const pick = await ask("Send this campaign back as a draft — what needs changing?", { mode: "text", required: false, label: "What needs changing?", placeholder: "e.g. Add the product value and deliverables", hint: false, cta: "Send back" });
    if (!pick) return;
    run(q.id, () => act.sendBackCampaign(q.rec.id, pick.note), `${q.rec.name} sent back as a draft`, () => openId && router.push(closeHref));
  };
  const approveSignup = (q) => run(q.id, () => act.approveSignup(q.rec.id), `Approved — ${q.rec.name || q.rec.email} can sign in now`, () => openId && router.push(closeHref));
  const declineSignup = async (q) => {
    const pick = await ask("Why are you declining this signup?", { mode: "text", label: "Reason", placeholder: "They are told this reason in the app, on WhatsApp and by email.", hint: false, cta: "Decline signup" });
    if (!pick) return;
    run(q.id, () => act.declineSignup(q.rec.id, pick.note), `Declined — ${q.rec.name || q.rec.email} was notified`, () => openId && router.push(closeHref));
  };

  return (
    <AdminShell>
      <PageHead title="Action queue" sub="Every decision in one place. Prioritize by urgency, campaign and action type." />

      <Stats
        items={[
          { value: apps, label: "Creator decisions", note: "Pending screening", href: "/admin/action-queue/applications" },
          { value: kindN("review"), label: "Video reviews", note: "Submitted content", href: "/admin/action-queue/content" },
          { value: kindN("contract", "unsigned"), label: "Contracts to send", note: "Ready for verification", href: "/admin/action-queue/contracts" },
          { value: kindN("ship", "deliver", "blocked"), label: "Logistics actions", note: "To send + in transit", href: "/admin/action-queue/logistics" },
          { value: total, label: "Priority items", note: "Everything waiting on you", href: "/admin/action-queue" },
        ]}
      />

      <section className="ga-card aq">
        <div className="aq-head">
          <h2 className="ga-h2">Decision inbox</h2>
          <p className="aq-note">Live · refreshes every 20s</p>
        </div>
        <nav className="ga-tabs aq-tabs" aria-label="Filter decisions" data-scroll>
          {FILTERS.map((f) => (
            <Link key={f.k} href={base(f.k)} className={`ga-tab ${filter === f.k ? "is-on" : ""}`} aria-current={filter === f.k ? "page" : undefined}>
              {f.label}
            </Link>
          ))}
        </nav>

        <div className="aq-list">
          <StateBox loading={loading && !items.length} error={!items.length && error} onRetry={reload} />
          {items.map((q) => (
            <div key={q.id} className="aq-row">
              <span className="aq-ic">{q.icon}</span>
              <div className="aq-main">
                <p className="aq-title">
                  <Link href={itemHref(q)}>{q.title}</Link> <span className="ga-count">{q.count}</span>
                </p>
                <p className="aq-sub">{q.line || `${q.campaign} · ${q.reason}`}</p>
              </div>
              <div className="aq-side">
                <span className={`ga-badge ga-badge--${q.tone}`}>{q.pri}</span>
                <span className="aq-when">{q.when}</span>
                {q.kind === "campaign" ? (
                  <>
                    <Link href={itemHref(q)} className="aq-text">
                      Open brief
                    </Link>
                    <button type="button" className="ga-btn ga-btn--primary aq-solid" disabled={busy === q.id} onClick={() => approveCampaign(q)}>
                      {busy === q.id ? "…" : "Approve & go live"}
                    </button>
                  </>
                ) : q.kind === "signup" ? (
                  <>
                    <button type="button" className="aq-text" disabled={busy === q.id} onClick={() => declineSignup(q)}>
                      Decline
                    </button>
                    <button type="button" className="ga-btn ga-btn--primary aq-solid" disabled={busy === q.id} onClick={() => approveSignup(q)}>
                      {busy === q.id ? "…" : "Approve"}
                    </button>
                  </>
                ) : (
                  <Link href={itemHref(q)} className="ga-btn ga-btn--ghost aq-review">
                    Review →
                  </Link>
                )}
              </div>
            </div>
          ))}
          {!loading && !error && !items.length && (
            <div className="aq-empty">
              <strong>All clear ✨</strong>
              <span>Nothing waiting in {FILTER_LABEL[filter] || "this tab"}.</span>
            </div>
          )}
        </div>
      </section>

      {open && (
        <Drawer eyebrow="Decision workspace" title={open.title} closeHref={closeHref}>
          <DecisionPanel
            meta={`${open.campaign} · ${open.when} · ${open.count} record${open.count > 1 ? "s" : ""}`}
            badges={[
              { label: open.pri, tone: open.tone },
              { label: FILTER_LABEL[open.f], tone: "violet" },
            ]}
            why={`${open.reason}. Review campaign brief and evidence before making a decision.`}
            actions={
              <>
                {open.kind === "campaign" ? (
                  <>
                    <button type="button" className="ga-btn ga-btn--primary" disabled={busy === open.id} onClick={() => approveCampaign(open)}>
                      {busy === open.id ? "…" : "Approve & go live"}
                    </button>
                    <button type="button" className="ga-btn ga-btn--ghost" onClick={() => sendBack(open)}>
                      Send back
                    </button>
                  </>
                ) : open.kind === "signup" ? (
                  <>
                    <button type="button" className="ga-btn ga-btn--primary" disabled={busy === open.id} onClick={() => approveSignup(open)}>
                      {busy === open.id ? "…" : "Approve"}
                    </button>
                    <button type="button" className="ga-btn ga-btn--ghost" onClick={() => declineSignup(open)}>
                      Decline
                    </button>
                  </>
                ) : open.f === "applications" ? (
                  <Link href="/admin/applications" className="ga-btn ga-btn--primary">
                    Open applications
                  </Link>
                ) : open.f === "logistics" ? (
                  <Link href="/admin/logistics" className="ga-btn ga-btn--primary">
                    Open logistics
                  </Link>
                ) : null}
                {open.cid ? (
                  <Link href={`/admin/campaigns/${open.cid}/overview`} className="ga-btn ga-btn--ghost">
                    Open campaign
                  </Link>
                ) : (
                  <Link href="/admin/users" className="ga-btn ga-btn--ghost">
                    Open all users
                  </Link>
                )}
              </>
            }
          >
            {open.kind === "group" && <QueueRecords group={open} ask={ask} toast={toast} onDone={reload} />}
          </DecisionPanel>
        </Drawer>
      )}
      {openId && !open && !loading && (
        <Drawer eyebrow="Decision workspace" title="Already handled" closeHref={closeHref}>
          <p className="aq-gone">This item isn’t waiting any more — someone already took care of it.</p>
        </Drawer>
      )}

      {reasonNode}
      {toastNode}

      <style>{`
        .aq { padding: 22px 22px 30px; }
        .aq-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .aq-note { font-size: 12px; color: var(--ad-muted); }
        .aq-tabs { margin-top: 17px; }
        .aq-tabs .ga-tab { height: 37px; }
        .aq-tabs .ga-tab:not(.is-on) { color: #67718a; }
        .aq-tabs .ga-tab:not(.is-on):hover { background: var(--ad-lilac); color: var(--ad-primary-2); }
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
        .aq-title .ga-count { min-width: 26px; height: 24px; border-radius: 12px; }
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
        .aq-gone { margin-top: 18px; font-size: 14px; color: var(--ad-muted); }
        .aq-text:disabled { opacity: .5; }

        @media (max-width: 1023px) {
          .aq-row { flex-wrap: wrap; }
          .aq-side { width: 100%; padding-left: 52px; }
          .aq-side > :last-child { margin-left: auto; }
        }
        @media (max-width: 640px) {
          .aq { padding: 18px 16px 20px; }
          .aq-tabs { flex-wrap: nowrap; overflow-x: auto; margin: 18px -16px 0; padding: 0 16px; scrollbar-width: none; }
          .aq-tabs::-webkit-scrollbar { display: none; }
          .aq-tabs .ga-tab { flex-shrink: 0; }
          .aq-row { gap: 12px; align-items: flex-start; }
          .aq-side { padding-left: 0; flex-wrap: wrap; }
        }
      `}</style>
    </AdminShell>
  );
}
