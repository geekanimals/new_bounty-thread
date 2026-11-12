"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import { Panel, Table, Notice } from "@/components/admin/settings/kit";
import { ACT_PEOPLE, personById } from "@/components/admin/settings/people";

const SORTS = [
  { k: "recent", label: "Recently active", fn: (a, b) => a.ago - b.ago },
  { k: "time", label: "Most time", fn: (a, b) => b.mins - a.mins },
  { k: "sessions", label: "Most sessions", fn: (a, b) => b.sessions - a.sessions },
  { k: "pages", label: "Most pages", fn: (a, b) => b.pages - a.pages },
];
const COOKIE = { All: "green", Essential: "", "No choice": "orange" };

/**
 * /admin/activity — sab log, kitna time, kya kar rahe (consent-aware).
 * person diya ho (/admin/activity/[id]) to right side timeline panel khulta hai.
 */
export default function ActivityPage({ person }) {
  const router = useRouter();
  const [sort, setSort] = useState("recent");
  const rows = useMemo(() => [...ACT_PEOPLE].sort(SORTS.find((s) => s.k === sort).fn), [sort]);
  const p = person ? personById(person) : null;

  useEffect(() => {
    if (!p) return undefined;
    const onKey = (e) => e.key === "Escape" && router.push("/admin/activity");
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [p, router]);

  return (
    <AdminShell>
      <PageHead title="Activity" sub="Who is on the platform, for how long and doing what — consent-aware." />
      <Stats
        items={[
          { value: 1, label: "Active now", note: "Last 15 minutes" },
          { value: 13, label: "Today", note: "Seen in 24 hours" },
          { value: 58, label: "This week", note: "Seen in 7 days" },
          { value: 276, label: "Everyone", note: "1,587 sessions" },
          { value: 98, label: "No cookie choice", note: "Never answered" },
        ]}
      />
      <Notice icon="🔒" className="ac-note">
        Sign-ins, Instagram connect, publish and apply are always logged. Pages and time show only for people who allowed analytics cookies.
      </Notice>

      <Panel
        title="Everyone · 276 people"
        sub="1,587 sessions · 22h 17m · 1,854 pages"
        className="ac-panel"
        action={
          <div className="ac-sorts" role="tablist">
            {SORTS.map((s) => (
              <button key={s.k} type="button" role="tab" aria-selected={sort === s.k} className={`ad-tab ${sort === s.k ? "is-on" : ""}`} onClick={() => setSort(s.k)}>
                {s.label}
              </button>
            ))}
          </div>
        }
      >
        <Table
          rowH={57}
          minW={860}
          cols={[
            { label: "Person", w: 233 },
            { label: "Role", w: 115 },
            { label: "Last seen", w: 145 },
            { label: "Sessions", w: 134 },
            { label: "Time", w: 102 },
            { label: "Cookies", w: 163 },
            { label: "", w: 184 },
          ]}
          rows={rows.map((r) => [
            <b key="n">{r.name}</b>,
            r.role,
            r.last,
            r.sessions,
            r.time,
            <span key="c" className={`ad-badge ad-badge--${COOKIE[r.cookies]}`}>
              {r.cookies}
            </span>,
            <Link key="t" href={`/admin/activity/${r.id}`} className="sk-link sk-link--blue">
              🕒 Timeline →
            </Link>,
          ])}
        />
      </Panel>

      {p && (
        <div className="ac-wrap" onClick={() => router.push("/admin/activity")}>
          <aside className="ac-side" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${p.name} timeline`}>
            <Link href="/admin/activity" className="ac-x" aria-label="Close">
              ✕
            </Link>
            <p className="ac-eye">Person · Timeline</p>
            <h2>{p.name}</h2>
            <p className="ac-meta">{p.meta}</p>
            <div className="ac-nums">
              <div>
                <strong>{p.sessions}</strong>
                <span>Sessions</span>
              </div>
              <div>
                <strong>{p.time}</strong>
                <span>Time on Geek OS</span>
              </div>
            </div>
            <div className="ac-tl">
              <p className="ac-day">Today</p>
              <ol>
                {p.timeline.map((t, i) => (
                  <li key={i}>
                    <i>{i + 1}</i>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      )}

      <style>{`
        .ac-note { margin-bottom: 17px; padding: 12px 15px; }
        .ac-panel .sk-panel__txt { padding-top: 4px; }
        .ac-panel .sk-tw { margin-top: 14px; }
        .ac-sorts { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .ac-sorts .ad-tab { height: 37px; }
        .ac-sorts .ad-tab:not(.is-on) { color: #67718a; }

        .ac-wrap { position: fixed; inset: 0; z-index: 90; background: rgba(20,33,59,.45); animation: adFade .15s ease; }
        .ac-side { position: absolute; right: 0; top: 0; bottom: 0; width: min(560px, 100%); overflow-y: auto; padding: 30px 30px 30px; background: #fff; box-shadow: -20px 0 60px -30px rgba(20,33,59,.5); animation: acIn .2s ease; }
        @keyframes acIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
        .ac-x { position: absolute; right: 30px; top: 30px; width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: var(--ad-soft); color: var(--ad-muted-2); font-size: 14px; }
        .ac-x:hover { background: var(--ad-lilac); color: var(--ad-primary); }
        .ac-eye { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8b92aa; }
        .ac-side h2 { margin-top: 22px; font-family: var(--ad-head); font-size: 25px; font-weight: 800; letter-spacing: -0.9px; color: var(--ad-ink); }
        .ac-meta { margin-top: 18px; font-size: 12px; color: var(--ad-muted); }
        .ac-nums { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--ad-line); }
        .ac-nums div { display: flex; flex-direction: column; padding: 18px 16px 14px; border-radius: 14px; background: var(--ad-soft-2); }
        .ac-nums strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.8px; color: var(--ad-ink); }
        .ac-nums span { margin-top: 5px; font-size: 12px; color: var(--ad-muted); }
        .ac-tl { padding: 18px 0 18px; border-bottom: 1px solid var(--ad-line); }
        .ac-day { font-size: 13px; font-weight: 700; color: var(--ad-ink); }
        .ac-tl ol { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 12px; }
        .ac-tl li { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ad-ink); }
        .ac-tl li i { width: 24px; height: 24px; flex-shrink: 0; border-radius: 50%; display: grid; place-items: center; background: var(--ad-lilac); font-style: normal; font-size: 11px; font-weight: 800; color: var(--ad-primary); }

        @media (max-width: 1023px) { .ac-panel .sk-panel__head { flex-direction: column; } .ac-sorts { justify-content: flex-start; } }
        @media (max-width: 640px) {
          .ac-panel .sk-panel__act { width: 100%; min-width: 0; }
          .ac-sorts { flex-wrap: nowrap; overflow-x: auto; width: 100%; min-width: 0; scrollbar-width: none; }
          .ac-sorts .ad-tab { flex-shrink: 0; }
          .ac-side { padding: 22px 18px; }
          .ac-x { right: 18px; top: 18px; }
        }
      `}</style>
    </AdminShell>
  );
}
