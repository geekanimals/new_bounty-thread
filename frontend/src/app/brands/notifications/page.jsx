"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandShell, { ToneIcon } from "@/components/brands/BrandShell";
import { BrError, useToast } from "@/components/brands/BrandStates";
import { useNotifications, markRead, markAllRead, routeFor, notifLook, ago } from "@/services/brand";
import { Check, ChevronDown, Info } from "@/components/ui/Icons";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "approvals", label: "Approvals" },
  { key: "campaigns", label: "Campaigns" },
  { key: "money", label: "Money" },
  { key: "social", label: "Social" },
];
const GROUPS = ["Today", "Yesterday", "Earlier"];
const FIRST = 8;
// "How we tell you" — purane brand portal mein ye settings nahi thi (Figma control, abhi backend nahi → Coming soon)
const PREFS = [
  { label: "Approvals", app: true, email: true, wa: true },
  { label: "Videos to review", app: true, email: true, wa: true },
  { label: "Campaign results", app: true, email: true, wa: false },
  { label: "Bills & payments", app: true, email: true, wa: false },
  { label: "Facebook comments", app: true, email: false, wa: false },
];
// alert → filter wala dabba (icon se)
const CAT = { users: "approvals", play: "approvals", receipt: "money", trend: "campaigns", megaphone: "campaigns", check: "social" };

/**
 * /brands/notifications — purane app ke alerts (api.get_my_notifications, har 20 sec) + mark read / all read.
 * Har alert ka button uske action_route ("?go=…") wale naye page par le jaata hai.
 */
export default function BrandNotifications() {
  const notif = useNotifications();
  const [toast, say] = useToast();
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [now, setNow] = useState(0); // Today / Yesterday ke liye — effect mein
  useEffect(() => {
    setNow(Date.now());
  }, [notif.list]);

  const all = notif.list.map((x) => {
    const look = notifLook(x);
    const d = new Date(x.created_at);
    const day = now ? Math.floor((new Date(now).setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000) : 2;
    return { ...x, ...look, cat: CAT[look.icon] || "social", group: day <= 0 ? "Today" : day === 1 ? "Yesterday" : "Earlier" };
  });
  const count = (k) => (k === "all" ? all.length : all.filter((n) => n.cat === k).length);
  const filtered = filter === "all" ? all : all.filter((n) => n.cat === filter);
  const list = showAll ? filtered : filtered.slice(0, FIRST);
  const soon = () => say("Choosing where each update reaches you — coming soon");

  return (
    <BrandShell crumbs={[{ label: "Notifications" }]}>
      <title>Notifications — Geek OS Brand</title>

      <p className="br-eyebrow">Today</p>
      <h1 className="br-h1">Notifications</h1>
      <p className="br-sub">Everything that needs you or changed in your campaigns.</p>

      <div className="nt-grid">
        <section className="br-card nt-feed">
          <div className="nt-bar">
            <div className="br-seg" data-scroll>
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={filter === f.key ? "is-on" : ""}
                  onClick={() => {
                    setFilter(f.key);
                    setShowAll(false);
                  }}
                >
                  {f.label} {count(f.key)}
                </button>
              ))}
            </div>
            <button type="button" className="nt-mark" onClick={() => markAllRead()} disabled={!notif.unread}>
              <Check size={13} /> {notif.unread ? "Mark all as read" : "All read"}
            </button>
          </div>

          {GROUPS.map((g) => {
            const items = list.filter((n) => n.group === g);
            if (!items.length) return null;
            return (
              <div key={g}>
                <p className="nt-group">{g}</p>
                <ul className="nt-list">
                  {items.map((n) => {
                    const un = !n.read;
                    return (
                      <li key={n.notification_id} className={un ? "is-unread" : ""} onClick={() => un && markRead(n.notification_id)}>
                        <i className="nt-dot" aria-hidden="true" />
                        <ToneIcon icon={n.icon} tone={n.tone} size={36} />
                        <span className="nt-txt">
                          <strong>{n.title}</strong>
                          <small>{n.body}</small>
                        </span>
                        <span className="nt-time">{ago(n.created_at, now)}</span>
                        {n.action_route && (
                          <Link href={routeFor(n.action_route)} className={`br-btn br-btn--sm ${un ? "br-btn--primary" : "br-btn--ghost"}`}>
                            {n.action_label || "Open"}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          {notif.error && !all.length && (
            <div className="nt-errbox">
              <BrError error={notif.error} onRetry={notif.reload} />
            </div>
          )}
          {!list.length && !notif.error && <p className="nt-empty">{notif.loading ? "Loading…" : "Nothing here yet — new approvals, videos, posts and bills show up here."}</p>}

          {!showAll && filtered.length > FIRST && (
            <div className="br-more nt-more">
              <button type="button" className="br-btn br-btn--ghost" onClick={() => setShowAll(true)}>
                Load more <ChevronDown size={13} />
              </button>
            </div>
          )}
        </section>

        <aside className="br-card nt-prefs">
          <h2 className="br-card__title">How we tell you</h2>
          <p className="br-card__sub">Pick where each kind of update reaches you.</p>

          <div className="nt-table">
            <div className="nt-row nt-row--head">
              <span />
              <span>App</span>
              <span>Email</span>
              <span>WhatsApp</span>
            </div>
            {PREFS.map((r) => (
              <div key={r.label} className="nt-row">
                <span className="nt-row__label">{r.label}</span>
                {["app", "email", "wa"].map((k) => (
                  <span key={k}>
                    <button
                      type="button"
                      className={`br-toggle ${r[k] ? "is-on" : ""}`}
                      aria-pressed={r[k]}
                      aria-label={`${r.label} on ${k}`}
                      onClick={soon}
                    />
                  </span>
                ))}
              </div>
            ))}
          </div>

          <div className="nt-daily">
            <span>
              <strong>Daily summary</strong>
              <small>Every morning at 9:00</small>
            </span>
            <button type="button" className="br-toggle" aria-pressed={false} aria-label="Daily summary" onClick={soon} />
          </div>
          <p className="nt-wa">
            <Info size={13} /> WhatsApp updates go to the number the Geek team has for you
          </p>
        </aside>
      </div>
      {toast}

      <style>{`
        .nt-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 18px; align-items: start; margin-top: 22px; }
        .nt-feed { overflow: hidden; }
        .nt-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; border-bottom: 1px solid var(--br-border); flex-wrap: wrap; }
        .nt-mark { display: inline-flex; align-items: center; gap: 6px; border: 0; background: none; color: var(--br-primary); font-size: 12.5px; font-weight: 700; }
        .nt-mark:disabled { color: var(--br-faint); cursor: default; }
        .nt-group { margin: 0; padding: 10px 18px; background: #f7f7fb; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--br-faint); }
        .nt-list { list-style: none; margin: 0; padding: 0; }
        .nt-list li { display: flex; align-items: center; gap: 12px; padding: 13px 18px; border-bottom: 1px solid var(--br-border); }
        .nt-list li.is-unread { background: #fcfbff; }
        .nt-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: transparent; }
        .nt-list li.is-unread .nt-dot { background: var(--br-primary); }
        .nt-txt { flex: 1; min-width: 0; }
        .nt-txt strong { display: block; font-size: 13.5px; font-weight: 600; }
        .nt-list li.is-unread .nt-txt strong { font-weight: 800; }
        .nt-txt small { display: block; font-size: 12px; color: var(--br-muted); }
        .nt-time { font-size: 11.5px; color: var(--br-faint); white-space: nowrap; }
        .nt-empty { padding: 30px; text-align: center; color: var(--br-muted); }
        .nt-more { margin: 0; padding: 16px; }
        .nt-errbox { padding: 16px; }

        .nt-prefs { padding: 20px; position: sticky; top: 92px; }
        .nt-table { margin-top: 14px; }
        .nt-row { display: grid; grid-template-columns: minmax(0, 1fr) 46px 46px 62px; align-items: center; gap: 4px; padding: 9px 0; }
        .nt-row > span:not(.nt-row__label) { display: flex; justify-content: center; }
        .nt-row--head { padding: 0 0 2px; font-size: 10.5px; color: var(--br-faint); font-weight: 600; text-align: center; }
        .nt-row__label { font-size: 13px; font-weight: 500; }
        .nt-daily { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px; padding-top: 14px; border-top: 1px solid var(--br-border); }
        .nt-daily strong { display: block; font-size: 13px; font-weight: 700; }
        .nt-daily small { display: block; font-size: 11.5px; color: var(--br-muted); }
        .nt-wa { display: flex; align-items: center; gap: 8px; margin: 14px 0 0; padding: 10px 12px; border-radius: 10px; background: #f4f5fa; font-size: 12px; color: var(--br-muted); }

        @media (max-width: 1100px) {
          .nt-grid { grid-template-columns: 1fr; }
          .nt-prefs { position: static; }
        }
        @media (max-width: 640px) {
          .nt-bar { padding: 14px; }
          .nt-bar .br-seg { width: 100%; }
          .nt-list li { flex-wrap: wrap; padding: 13px 14px; gap: 10px; }
          .nt-txt { flex-basis: calc(100% - 120px); }
          .nt-list li .br-btn { margin-left: 61px; }
          .nt-group { padding: 10px 14px; }
          .nt-prefs { padding: 18px; }
        }
      `}</style>
    </BrandShell>
  );
}
