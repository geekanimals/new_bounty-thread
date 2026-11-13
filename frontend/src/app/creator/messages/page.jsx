"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creator/BountyShell";
import InboxTabs from "@/components/creator/InboxTabs";
import { RumiTip } from "@/components/creator/OnboardShell";
import { useSession, hrefOf, isAct, isMsg, iconOf, when, useNotifications, markRead, markActed, markAllRead } from "@/services/creator";
import { getSidekick } from "@/components/creator/data";
import { ChevronRight, Check } from "@/components/ui/Icons";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "action", label: "Action needed" },
  { key: "update", label: "Updates" },
];
const GEEK_WA = "916398566704"; // purane inbox ka "Reply" isi number par jata tha


/**
 * /creator/messages — Inbox: campaign alerts (Action needed / Updates)
 * Purane Bounty inbox jaisa: get_my_notifications · mark_notification_read · mark_notification_acted · mark_all_notifications_read
 */
export default function InboxAlerts() {
  const [s] = useSession();
  const sk = getSidekick(s.sidekick);
  const [f, setF] = useState("all");
  const notes = useNotifications({ refreshMs: 30000 });
  const [local, setLocal] = useState({}); // id → { read, acted } (turant dikhane ke liye)
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), []);
  const all = (Array.isArray(notes.data) ? notes.data : []).map((n) => ({ ...n, ...(local[n.notification_id] || {}) }));
  const list = f === "all" ? all : all.filter((n) => (f === "action" ? isAct(n) : !isAct(n)));
  const isUnread = (n) => !n.read;
  const patch = (id, v) => setLocal((m) => ({ ...m, [id]: { ...(m[id] || {}), ...v } }));

  const open = (n) => {
    if (!n.read) patch(n.notification_id, { read: true });
    if (isAct(n)) {
      patch(n.notification_id, { read: true, acted: true });
      markActed(n.notification_id);
    } else if (!n.read) markRead(n.notification_id);
  };
  const markAll = async () => {
    const unread = all.filter((n) => !n.read);
    if (!unread.length) return;
    unread.forEach((n) => patch(n.notification_id, { read: true }));
    await markAllRead();
  };

  return (
    <BountyShell>
      <title>Inbox — Bounty</title>
      <InboxTabs />

      <div className="ia">
        <div className="ia-main">
          <div className="ia-bar">
            <div className="ia-filters">
              {FILTERS.map((x) => (
                <button key={x.key} type="button" className={`bx-pill ia-pill ${f === x.key ? "is-on" : ""}`} onClick={() => setF(x.key)}>
                  {x.label}
                  {x.key === "action" && all.some((n) => isAct(n)) && <i className="ia-dot" />}
                </button>
              ))}
            </div>
            <button type="button" className="ia-mark" onClick={markAll} disabled={!all.some(isUnread)}>
              <Check size={12} /> Mark all read
            </button>
          </div>

          {notes.loading && !notes.data ? (
            <div className="bx-card ia-empty">Loading your inbox…</div>
          ) : notes.error && !notes.data ? (
            <div className="bx-card ia-empty">
              Couldn&apos;t load your inbox.{" "}
              <button type="button" className="ia-retry" onClick={() => notes.reload()}>
                Try again
              </button>
            </div>
          ) : list.length === 0 ? (
            <div className="bx-card ia-empty">
              {f === "action" ? "Nothing needs you right now. We'll tell you the moment something does." : f === "update" ? "No updates yet." : "No alerts yet. When something needs you, it’ll show here."}
            </div>
          ) : (
            <ul className="ia-list">
              {list.map((n) => {
                const msg = isMsg(n);
                const href = msg
                  ? `https://wa.me/${GEEK_WA}?text=${encodeURIComponent("Hi Geek team, about: " + (n.title || "my campaign") + " — ")}`
                  : hrefOf(n);
                const inner = (
                  <>
                    <span className="ia-ic">{iconOf(n)}</span>
                    <span className="ia-txt">
                      <strong>
                        {isUnread(n) && <i className="ia-dot" />}
                        {n.title || "Update"}
                      </strong>
                      {n.body && <small>{String(n.body).replace(/[*_`]/g, "")}</small>}
                    </span>
                    <span className="ia-meta">
                      {isAct(n) && <span className="bx-tag bx-tag--red">Action needed</span>}
                      {msg && <span className="bx-tag">Reply</span>}
                      <small>{when(n.created_at, now)}</small>
                    </span>
                    <ChevronRight size={15} />
                  </>
                );
                return (
                  <li key={n.notification_id} className={`bx-card ${isUnread(n) ? "is-unread" : ""}`}>
                    {msg ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => open(n)}>
                        {inner}
                      </a>
                    ) : href ? (
                      <Link href={href} onClick={() => open(n)}>
                        {inner}
                      </Link>
                    ) : (
                      <button type="button" className="ia-row" onClick={() => open(n)}>
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <RumiTip className="ia-rumi" name={sk.name} img={sk.img} text="Red dot = something only you can do." />
      </div>

      <style>{`
        .ia { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; max-width: 720px; margin: 0 auto; align-items: start; }
        .ia-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
        .ia-filters { display: flex; gap: 6px; flex-wrap: wrap; }
        .ia-pill { position: relative; height: 32px; padding: 0 14px; font-size: 13px; font-weight: 600; }
        .ia-dot { display: inline-block; width: 8px; height: 8px; margin-right: 6px; border-radius: 50%; background: var(--bx-red-2); vertical-align: 1px; }
        .ia-pill .ia-dot { position: absolute; top: -2px; right: -2px; margin: 0; }
        .ia-mark { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; border: 0; background: none; padding: 0; font-size: 13px; font-weight: 700; color: #2a9d8f; }
        .ia-mark:disabled { opacity: .45; cursor: default; }
        .ia-empty { padding: 14px 18px; font-size: 14px; line-height: 18px; color: #6f6250; text-align: center; }
        .ia-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .ia-retry { border: 0; background: none; padding: 0; font: inherit; font-weight: 700; color: #2a9d8f; cursor: pointer; }
        .ia-list li .ia-row { width: 100%; border: 0; background: none; font: inherit; text-align: left; cursor: pointer; }
        .ia-list li a, .ia-list li .ia-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; color: var(--bx-muted); }
        .ia-list li.is-unread { background: #f8e8c6; border-color: #e8cf98; }
        .ia-ic { width: 38px; height: 38px; flex-shrink: 0; border-radius: 12px; background: #fffaf0; display: grid; place-items: center; font-size: 17px; }
        .ia-txt { flex: 1; min-width: 0; color: var(--bx-ink); }
        .ia-txt strong { display: block; font-size: 14px; font-weight: 700; }
        .ia-txt small { display: block; font-size: 12.5px; color: var(--bx-text); }
        .ia-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .ia-meta small { font-size: 11.5px; color: var(--bx-muted); white-space: nowrap; }
        .ia-rumi { justify-content: center; }

        @media (max-width: 900px) {
          .ia { grid-template-columns: minmax(0, 1fr); }
          .ia-rumi { position: static; justify-content: center; }
        }
        @media (max-width: 767px) {
          .ia-meta .bx-tag { display: none; }
          .ia-list li a > svg, .ia-list li .ia-row > svg { display: none; }
        }
      `}</style>
    </BountyShell>
  );
}
