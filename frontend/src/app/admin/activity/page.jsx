"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import { Panel, Table, Notice, fmtNum, ago, emptyState } from "@/components/admin/settings/kit";
import { useRpc, errText } from "@/lib/supabase";

/* purane app ke ACT_LBL / actMins */
const ACT_LBL = {
  login: "🔐 Signed in", sign_out: "🚪 Signed out", session_start: "🟢 Opened the app", page_view: "📄 Opened a page", time: "⏱️ Time on a page",
  consent: "🍪 Chose cookies", campaign_apply: "📝 Applied to a campaign", instagram_connect_start: "⏳ Started connecting Instagram", instagram_connect: "📸 Connected Instagram",
  instagram_connected: "📸 Connected Instagram", instagram_publish: "📤 Published on Instagram", publish: "📤 Published on Instagram", profile_completed: "✅ Completed profile",
  official_email_verified: "✉️ Verified email", campaign_create: "📣 Created a campaign", campaign_edit: "✏️ Edited a campaign", application_approve: "👍 Approved an application",
  application_decline: "👎 Declined an application", contract_sign: "✍️ Signed a contract", click: "👆 Clicked", error: "⚠️ Saw an error",
};
const actLbl = (e) => ACT_LBL[e] || "• " + String(e || "—").replace(/_/g, " ");
const actMins = (m) => {
  m = Number(m) || 0;
  if (m < 1) return m ? "<1 min" : "0 min";
  if (m < 60) return Math.round(m) + " min";
  return Math.floor(m / 60) + "h " + Math.round(m % 60) + "m";
};
const ageMin = (r) => (r.last_seen ? (Date.now() - new Date(r.last_seen).getTime()) / 60000 : 1e9);
const SORTS = [
  { k: "recent", label: "Recently active", fn: (a, b) => ageMin(a) - ageMin(b) },
  { k: "time", label: "Most time", fn: (a, b) => (Number(b.minutes) || 0) - (Number(a.minutes) || 0) },
  { k: "sessions", label: "Most sessions", fn: (a, b) => (b.sessions || 0) - (a.sessions || 0) },
  { k: "pages", label: "Most pages", fn: (a, b) => (b.page_views || 0) - (a.page_views || 0) },
];
const COOKIE = (c) => (c === "all" ? ["All", "green"] : c === "essential" ? ["Essential", ""] : ["No choice", "orange"]);
const ROLE = { creator: "Creator", owner: "Agency", brand: "Brand", manager: "Manager", corporate: "Corporate", admin: "Admin" };

/**
 * /admin/activity — sab log, kitna time, kya kar rahe (admin_activity_summary 30 din, consent-aware).
 * person diya ho (/admin/activity/[member_id]) to right side timeline panel khulta hai (admin_activity_timeline).
 */
export default function ActivityPage({ person }) {
  const router = useRouter();
  const [sort, setSort] = useState("recent");
  const res = useRpc("admin", "admin_activity_summary", { p_days: 30 }, { refreshMs: 30000 });
  const all = useMemo(() => res.data || [], [res.data]);
  const rows = useMemo(() => [...all].sort(SORTS.find((s) => s.k === sort).fn), [all, sort]);
  const tot = useMemo(() => all.reduce((a, r) => ({ s: a.s + (r.sessions || 0), m: a.m + (Number(r.minutes) || 0), p: a.p + (r.page_views || 0) }), { s: 0, m: 0, p: 0 }), [all]);
  const cnt = (fn) => (res.loading ? "…" : fmtNum(all.filter(fn).length));
  const p = person ? all.find((r) => r.member_id === person) || { member_id: person } : null;

  useEffect(() => {
    if (!person) return undefined;
    const onKey = (e) => e.key === "Escape" && router.push("/admin/activity");
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [person, router]);

  return (
    <AdminShell>
      <PageHead title="Activity" sub="Who is on the platform, for how long and doing what — consent-aware." />
      <Stats
        items={[
          { value: cnt((r) => ageMin(r) <= 15), label: "Active now", note: "Last 15 minutes" },
          { value: cnt((r) => ageMin(r) <= 1440), label: "Today", note: "Seen in 24 hours" },
          { value: cnt((r) => ageMin(r) <= 10080), label: "This week", note: "Seen in 7 days" },
          { value: cnt(() => true), label: "Everyone", note: `${fmtNum(tot.s)} sessions` },
          { value: cnt((r) => !r.consent), label: "No cookie choice", note: "Never answered" },
        ]}
      />
      <Notice icon="🔒" className="ac-note">
        Sign-ins, Instagram connect, publish and apply are always logged. Pages and time show only for people who allowed analytics cookies.
      </Notice>

      <Panel
        title={`Everyone · ${res.loading ? "…" : fmtNum(all.length)} people`}
        sub={`${fmtNum(tot.s)} sessions · ${actMins(tot.m)} · ${fmtNum(tot.p)} pages`}
        className="ac-panel"
        action={
          <div className="ac-sorts" role="tablist">
            {SORTS.map((s) => (
              <button key={s.k} type="button" role="tab" aria-selected={sort === s.k} className={`ga-tab ${sort === s.k ? "is-on" : ""}`} onClick={() => setSort(s.k)}>
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
          empty={emptyState({ loading: res.loading, error: res.error, reload: res.reload, empty: "Nobody in this view." })}
          rows={rows.map((r) => {
            const live = ageMin(r) <= 15;
            const [cl, ct] = COOKIE(r.consent);
            return [
              <b key="n" title={[r.ig_username ? `@${r.ig_username}` : "", [r.last_city, r.last_region, r.last_country].filter(Boolean).join(", "), r.last_ip].filter(Boolean).join(" · ")}>
                {r.name || r.email || "—"}
              </b>,
              ROLE[r.role] || r.role || "—",
              live ? <span key="l" className="ac-live">● Online now</span> : ago(r.last_seen),
              fmtNum(r.sessions || 0),
              r.consent === "all" || Number(r.minutes) > 0 ? actMins(r.minutes) : "—",
              <span key="c" className={`ga-badge ga-badge--${ct}`}>
                {cl}
              </span>,
              <Link key="t" href={`/admin/activity/${r.member_id}`} className="sk-link sk-link--blue">
                🕒 Timeline →
              </Link>,
            ];
          })}
        />
      </Panel>

      {p && <Timeline person={p} />}

      <style>{`
        .ac-note { margin-bottom: 17px; padding: 12px 15px; }
        .ac-panel .sk-panel__txt { padding-top: 4px; }
        .ac-panel .sk-tw { margin-top: 14px; }
        .ac-sorts { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .ac-sorts .ga-tab { height: 37px; }
        .ac-sorts .ga-tab:not(.is-on) { color: #67718a; }
        .ac-live { font-weight: 700; color: var(--ad-green); }

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
          .ac-sorts .ga-tab { flex-shrink: 0; }
          .ac-side { padding: 22px 18px; }
          .ac-x { right: 18px; top: 18px; }
        }
      `}</style>
    </AdminShell>
  );
}

/* Ek insaan ki timeline — din ke hisaab se, saaf bhasha mein (purane adminActivityTimeline jaisa) */
const devOf = (ua) => {
  ua = String(ua || "");
  return /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Macintosh/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : ua ? "Computer" : "";
};
const dayOf = (t) => {
  const x = new Date(t);
  const n = new Date();
  if (x.toDateString() === n.toDateString()) return "Today";
  const y = new Date(n);
  y.setDate(n.getDate() - 1);
  return x.toDateString() === y.toDateString() ? "Yesterday" : x.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};
const tm = (t) => new Date(t).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

function Timeline({ person: p }) {
  const router = useRouter();
  const tl = useRpc("admin", "admin_activity_timeline", { p_member: p.member_id, p_limit: 300 });
  const L = tl.data || [];
  const days = [];
  L.forEach((e) => {
    const k = dayOf(e.created_at);
    const last = days[days.length - 1];
    if (last && last.k === k) last.list.push(e);
    else days.push({ k, list: [e] });
  });
  const first = L[0] || {};
  const meta = [
    `${fmtNum(p.sessions ?? 0)} sessions`,
    days.length ? `${days.length} day${days.length > 1 ? "s" : ""}` : "",
    [p.last_city || first.city].filter(Boolean).join(""),
    devOf(first.user_agent),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="ac-wrap" onClick={() => router.push("/admin/activity")}>
      <aside className="ac-side" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${p.name || "Person"} timeline`}>
        <Link href="/admin/activity" className="ac-x" aria-label="Close">
          ✕
        </Link>
        <p className="ac-eye">Person · Timeline</p>
        <h2>
          {p.name || p.email || "Activity"}
          {p.ig_username ? <span className="ac-ig"> @{p.ig_username}</span> : null}
        </h2>
        <p className="ac-meta">
          {meta}
          {p.last_ip ? ` · last IP ${p.last_ip}` : ""}
        </p>
        <div className="ac-nums">
          <div>
            <strong>{fmtNum(p.sessions ?? 0)}</strong>
            <span>Sessions</span>
          </div>
          <div>
            <strong>{p.consent === "all" || Number(p.minutes) > 0 ? actMins(p.minutes) : "—"}</strong>
            <span>Time on Geek OS</span>
          </div>
        </div>
        {tl.loading && <p className="ac-msg">Loading timeline…</p>}
        {tl.error && <p className="ac-msg">{errText(tl.error)}</p>}
        {!tl.loading && !tl.error && !L.length && <p className="ac-msg">No activity in the log yet.</p>}
        {days.map((d) => (
          <div key={d.k} className="ac-tl">
            <p className="ac-day">
              {d.k} <span>{d.list.length}</span>
            </p>
            <ol>
              {d.list.map((e, i) => {
                const where = [e.city, e.region, e.country].filter(Boolean).join(", ");
                const det =
                  e.detail && typeof e.detail === "object"
                    ? Object.entries(e.detail)
                        .filter(([k, v]) => v != null && v !== "" && typeof v !== "object" && !/_id$|^id$/.test(k))
                        .slice(0, 3)
                        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${String(v).slice(0, 50)}`)
                        .join(" · ")
                    : "";
                return (
                  <li key={e.id || i}>
                    <i>{i + 1}</i>
                    <span className="ac-ev">
                      <b>
                        {tm(e.created_at)} · {actLbl(e.event)}
                      </b>
                      {e.duration_ms ? ` · ${Math.round(e.duration_ms / 1000)}s` : ""}
                      {e.page ? <em> {e.page}</em> : null}
                      {(det || where || e.ip) && <small>{[det, where && `📍 ${where}`, e.ip, devOf(e.user_agent)].filter(Boolean).join(" · ")}</small>}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </aside>
      <style>{`
        .ac-ig { font-family: var(--ad-sans); font-size: 14px; font-weight: 600; color: var(--ad-muted); letter-spacing: 0; }
        .ac-msg { padding: 18px 0; font-size: 13px; color: var(--ad-muted); }
        .ac-day span { margin-left: 6px; font-weight: 600; color: var(--ad-muted); }
        .ac-tl li { align-items: flex-start; }
        .ac-ev { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .ac-ev b { font-weight: 600; }
        .ac-ev em { font-style: normal; font-size: 12px; color: var(--ad-primary-ink); }
        .ac-ev small { font-size: 11.5px; color: var(--ad-muted); word-break: break-word; }
      `}</style>
    </div>
  );
}
