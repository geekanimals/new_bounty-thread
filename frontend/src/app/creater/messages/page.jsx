"use client";

import { useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import InboxTabs from "@/components/creater/InboxTabs";
import { RumiTip } from "@/components/creater/OnboardShell";
import { useSession } from "@/components/creater/session";
import { ALERTS, getSidekick } from "@/components/creater/data";
import { ChevronRight, Check } from "@/components/ui/Icons";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "action", label: "Action needed" },
  { key: "update", label: "Updates" },
];

/** /creater/messages — Inbox: campaign alerts (Action needed / Updates) */
export default function InboxAlerts() {
  const [s] = useSession();
  const sk = getSidekick(s.sidekick);
  const fresh = !s.ig;
  const [f, setF] = useState("all");
  const [read, setRead] = useState([]);
  const all = fresh ? [] : ALERTS;
  const list = f === "all" ? all : all.filter((a) => a.kind === f);
  const isUnread = (a) => a.unread && !read.includes(a.id);

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
                  {x.key === "action" && all.filter((a) => a.kind === "action" && isUnread(a)).length > 0 && <i className="ia-dot" />}
                </button>
              ))}
            </div>
            <button type="button" className="ia-mark" onClick={() => setRead(all.map((a) => a.id))} disabled={!all.some(isUnread)}>
              <Check size={12} /> Mark all read
            </button>
          </div>

          {list.length === 0 ? (
            <div className="bx-card ia-empty">No alerts yet. When something needs you, it’ll show here.</div>
          ) : (
            <ul className="ia-list">
              {list.map((a) => (
                <li key={a.id} className={`bx-card ${isUnread(a) ? "is-unread" : ""}`}>
                  <Link href={a.href} onClick={() => setRead((r) => [...r, a.id])}>
                    <span className="ia-ic">{a.icon}</span>
                    <span className="ia-txt">
                      <strong>
                        {isUnread(a) && <i className="ia-dot" />}
                        {a.title}
                      </strong>
                      <small>{a.text}</small>
                    </span>
                    <span className="ia-meta">
                      {a.kind === "action" && <span className="bx-tag bx-tag--red">Action needed</span>}
                      <small>{a.time}</small>
                    </span>
                    <ChevronRight size={15} />
                  </Link>
                </li>
              ))}
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
        .ia-list li a { display: flex; align-items: center; gap: 12px; padding: 12px 14px; color: var(--bx-muted); }
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
          .ia-list li a > svg { display: none; }
        }
      `}</style>
    </BountyShell>
  );
}
