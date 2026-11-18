"use client";

import { useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { Stats } from "@/components/admin/ui";
import MsgHead from "@/components/admin/msg/MsgHead";
import WaUpdateCard from "@/components/admin/msg/WaUpdateCard";
import PTable from "@/components/admin/brand/PTable";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { fmtWhen, fmtDateTime, useToast } from "@/components/admin/brand/util";

/* outbox status → Figma badge (purane app ke "waiting" rule ke saath) */
const isWait = (r) => r.status === "skipped" && /^(Waiting for WhatsApp template approval|WhatsApp 24h window closed)/i.test(r.error || "");
const badge = (r) => {
  if (isWait(r)) return ["Waiting", "orange"];
  if (/^paused:/i.test(r.error || "") && r.status === "skipped") return ["Held", "orange"];
  return { sent: ["Sent", "green"], queued: ["Queued", "violet"], sending: ["Sending", "violet"], failed: ["Failed", "red"], skipped: ["Skipped", ""] }[r.status] || [r.status || "—", ""];
};

/**
 * /vault/messaging — Delivery (Figma 074). Purane app jaisa:
 *  public.admin_delivery (har 20 sec) · switches: admin_messaging_switches + api.ops_auto_messages
 *  "Retry failed" → public.admin_delivery_retry({ p_channel: null })
 */
export default function MessagingDelivery() {
  const { data, error, loading, reload } = useRpc("admin", "admin_delivery", {}, { refreshMs: 20000 });
  const sw = useRpc("admin", "admin_messaging_switches");
  const au = useRpc("admin", "api.ops_auto_messages");
  const [toast, say] = useToast();
  const [fk, setFk] = useState("all");
  const [now] = useState(() => Date.now());
  const [tp, setTp] = useState({ phone: "", email: "", busy: false });

  const d = data || {};
  const st = d.stats || {};
  const n = (k) => Number(st[k] || 0);
  const recent = d.recent || [];
  const waOff = sw.data && sw.data.wa_on === false;
  const autoOff = au.data && au.data.auto_on === false;
  const held = Number(sw.data?.held_wa) || 0;
  // purane app ke tiles = "Latest messages" ke filters
  const F = {
    all: ["All messages", () => true],
    wa_sent: ["WhatsApp sent", (r) => r.channel === "whatsapp" && r.status === "sent"],
    wa_not: ["WhatsApp not sent", (r) => r.channel === "whatsapp" && ["skipped", "failed"].includes(r.status)],
    em_sent: ["Emails sent", (r) => r.channel === "email" && r.status === "sent"],
    em_not: ["Emails not sent", (r) => r.channel === "email" && ["skipped", "failed"].includes(r.status)],
    not: ["Not sent", (r) => ["skipped", "failed"].includes(r.status)],
    queue: ["In queue", (r) => ["queued", "sending"].includes(r.status)],
  };
  const list = recent.filter((F[fk] || F.all)[1]);
  const pick = (k) => setFk(fk === k ? "all" : k);
  // health checks (purane "Messages & health")
  const ago = (t) => {
    if (!t) return "never";
    const m = Math.round((now - new Date(t).getTime()) / 60000);
    return m < 1 ? "just now" : m < 60 ? m + "m ago" : m < 1440 ? Math.round(m / 60) + "h ago" : Math.round(m / 1440) + "d ago";
  };
  const jobs = d.jobs || [];
  const runs = d.runs || [];
  const stuck = d.oldest_queued && now - new Date(d.oldest_queued).getTime() > 5 * 60000;
  const waWaiting = recent.filter((r) => r.channel === "whatsapp" && isWait(r)).length;
  const noTpl = recent.filter((r) => r.channel === "whatsapp" && r.status === "skipped" && /WA_UPDATE_TEMPLATE/i.test(r.error || "")).length;
  const checks = [
    [!!d.worker_configured, "Dispatcher connected", d.worker_configured ? "Database can trigger sends instantly" : "Run the one-time connect command after deploying ops-notify-dispatch"],
    [jobs.some((j) => j.name === "ci-notify-dispatch" && j.active), "Every-minute safety run", jobs.length ? `Sends every minute · ${jobs.filter((j) => j.active).length} background jobs running` : "pg_cron schedule not found"],
    [!stuck, "Queue moving", stuck ? `Oldest queued message waiting since ${ago(d.oldest_queued)}` : "No messages stuck in the queue"],
    [
      n("whatsapp:sent") > 0 && !noTpl && !waWaiting,
      waWaiting ? "⏳ WhatsApp waiting" : "WhatsApp delivering",
      waWaiting ? `${waWaiting} WhatsApp alert(s) parked (template approval / 24h window)` : noTpl ? `${noTpl} recent WhatsApp alert(s) skipped — template not set` : n("whatsapp:sent") ? `Last sent ${ago(d.last_sent && d.last_sent.whatsapp)}` : "Nothing sent on WhatsApp yet",
    ],
    [n("email:sent") > 0 && !n("email:failed"), "Email delivering", n("email:failed") ? `${n("email:failed")} failed in 7 days — check SMTP secrets` : n("email:sent") ? `Last sent ${ago(d.last_sent && d.last_sent.email)}` : "Nothing sent by email yet"],
  ];
  const okAll = checks.every((c) => c[0]);
  const sendTest = async () => {
    if (!tp.phone.trim() && !tp.email.trim()) return say("Type your own WhatsApp number or email.");
    setTp((v) => ({ ...v, busy: true }));
    const r = await rpc("admin", "admin_delivery_test", { p_phone: tp.phone.trim() || null, p_email: tp.email.trim() || null });
    setTp((v) => ({ ...v, busy: false }));
    if (r.error) return say(errText(r.error));
    say(`${r.data} test message(s) queued — status updates below`);
    setTimeout(() => reload(true), 4000);
  };

  const retry = async () => {
    const r = await rpc("admin", "admin_delivery_retry", { p_channel: null });
    if (r.error) return say(errText(r.error));
    say(`${Number(r.data) || 0} message(s) re-queued`);
    setTimeout(() => reload(true), 3000);
  };

  return (
    <AdminShell>
      <MsgHead />
      <WaUpdateCard />
      <Stats
        items={[
          { value: loading ? "—" : recent.length, label: "All messages", note: fk === "all" ? "● showing now" : `Latest ${recent.length}`, onClick: () => setFk("all"), on: fk === "all" },
          { value: loading ? "—" : n("whatsapp:sent"), label: "WhatsApp sent", note: fk === "wa_sent" ? "● showing now" : "Last 7 days", onClick: () => pick("wa_sent"), on: fk === "wa_sent" },
          { value: loading ? "—" : n("email:sent"), label: "Emails sent", note: fk === "em_sent" ? "● showing now" : "Last 7 days", onClick: () => pick("em_sent"), on: fk === "em_sent" },
          { value: loading ? "—" : n("whatsapp:skipped") + n("whatsapp:failed") + n("email:skipped") + n("email:failed"), label: "Not sent", note: fk === "not" ? "● showing now" : "Skipped / failed · 7 days", onClick: () => pick("not"), on: fk === "not" },
          { value: loading ? "—" : n("whatsapp:queued") + n("email:queued") + n("whatsapp:sending") + n("email:sending"), label: "In queue", note: fk === "queue" ? "● showing now" : "Sending now", onClick: () => pick("queue"), on: fk === "queue" },
        ]}
      />
      {(waOff || autoOff) && (
        <p className="md-warn">
          <span>⚠️</span>
          <span>
            <b>Automatic {waOff ? "WhatsApp updates" : "messages"} are off.</b>
            {held ? `${held} update${held === 1 ? " was" : "s were"} held in the last 7 days` : "Updates are held"} — turn on in <Link href="/vault/settings/auto-messages">Settings › Auto messages</Link> to send them.
          </span>
        </p>
      )}
      <section className="ga-card md-card md-health">
        <div className="md-head">
          <h2 className="ga-h2">{okAll ? "✅ Everything is delivering" : "⚠️ Needs a look"}</h2>
          <span className="md-mute">{runs.length ? `last run ${ago(runs[0].at)}` : ""}</span>
        </div>
        <div className="md-checks">
          {checks.map(([ok, t, sub]) => (
            <div key={t} className={`md-check ${ok ? "ok" : "bad"}`}>
              <span>{ok ? "✅" : "⚠️"}</span>
              <span>
                <b>{t}</b>
                <small>{sub}</small>
              </span>
            </div>
          ))}
        </div>
        <div className="md-test">
          <span className="md-mute">Send a test to yourself:</span>
          <input className="ga-input" value={tp.phone} onChange={(e) => setTp({ ...tp, phone: e.target.value })} placeholder="+91… WhatsApp" aria-label="Your WhatsApp" />
          <input className="ga-input" value={tp.email} onChange={(e) => setTp({ ...tp, email: e.target.value })} placeholder="email" aria-label="Your email" />
          <button type="button" className="ga-btn ga-btn--ghost" disabled={tp.busy} onClick={sendTest}>
            {tp.busy ? "Sending…" : "Send test"}
          </button>
          <Link href="/vault/messaging/doctor" className="md-retry">
            🩺 Delivery doctor →
          </Link>
        </div>
      </section>

      <section className="ga-card md-card">
        <div className="md-head">
          <h2 className="ga-h2">
            {(F[fk] || F.all)[0]} <span className="md-mute">· {list.length} in the latest {recent.length}</span>
          </h2>
          <span className="md-chips">
            <button type="button" className={`ga-tab ${fk === "wa_not" ? "is-on" : ""}`} onClick={() => pick("wa_not")}>
              ⚠️ WhatsApp not sent · {n("whatsapp:skipped") + n("whatsapp:failed")}
            </button>
            <button type="button" className={`ga-tab ${fk === "em_not" ? "is-on" : ""}`} onClick={() => pick("em_not")}>
              📭 Emails not sent · {n("email:skipped") + n("email:failed")}
            </button>
            {fk !== "all" && (
              <button type="button" className="ga-tab" onClick={() => setFk("all")}>
                ✕ Show all
              </button>
            )}
          </span>
          <button type="button" className="md-retry" onClick={retry}>
            ↻ Retry failed (3 days)
          </button>
        </div>
        {error ? (
          <p className="md-state">
            Couldn’t load: {errText(error)}{" "}
            <button type="button" onClick={() => reload()}>
              Retry
            </button>
          </p>
        ) : (
        <PTable
          minW={720}
          cols={[
            { label: "To", w: "17.5%" },
            { label: "Channel", w: "16%" },
            { label: "Message", w: "36.5%" },
            { label: "Status", w: "17.3%" },
            { label: "When", w: "12.7%" },
          ]}
          rows={list.map((r) => {
            const [label, tone] = badge(r);
            return [
              <span key="t" title={r.to}>
                {r.who || r.to || "—"}
              </span>,
              r.channel === "whatsapp" ? "WhatsApp" : "Email",
              <span key="m" title={r.error || r.title || r.template}>
                {r.title || r.template || "—"}
                {r.error && <small className="md-why">{r.error}</small>}
              </span>,
              <span key="s" className={`ga-badge ga-badge--${tone}`} title={r.error || ""}>
                {label}
                {r.attempts > 1 ? ` ×${r.attempts}` : ""}
              </span>,
              <span key="w" title={fmtDateTime(r.created_at)}>
                {fmtWhen(r.created_at)}
              </span>,
            ];
          })}
          empty={loading ? "Loading…" : recent.length ? "Nothing here." : "No messages yet."}
        />
        )}
      </section>
      {toast && <div className="ga-toast">↻ {toast}</div>}
      <style>{`
        .md-warn { display: flex; gap: 10px; align-items: flex-start; min-height: 41px; margin: 0 0 18px; padding: 12px 15px; border-radius: 13px; border: 1px solid #f5c9d0; background: #fdeef0; font-size: 12px; line-height: 1.35; color: #b64455; }
        .md-warn b { font-weight: 700; }
        .md-warn a:hover { text-decoration: underline; text-underline-offset: 2px; }
        .md-card { padding: 22px 22px 18px; }
        .md-health { margin-bottom: 18px; }
        .md-mute { font-size: 12px; font-weight: 500; color: var(--ad-muted); }
        .md-checks { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-top: -14px; }
        .md-check { display: flex; gap: 10px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--ad-line); font-size: 12.5px; }
        .md-check.bad { border-color: #f3dfbd; background: #fff7ea; }
        .md-check b { display: block; font-weight: 800; color: var(--ad-ink); }
        .md-check small { display: block; margin-top: 3px; color: var(--ad-muted); }
        .md-test { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; }
        .md-test .ga-input { height: 38px; width: 190px; }
        .md-test .ga-btn { height: 38px; }
        .md-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .md-chips .ga-tab { height: 34px; }
        .md-why { display: block; margin-top: 3px; font-size: 11px; color: #b64455; white-space: normal; }
        .md-state { padding: 14px 11px; font-size: 13px; color: var(--ad-red); }
        .md-state button { border: 0; background: none; padding: 0; font-weight: 800; color: #6657e9; }
        .md-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 30px; }
        .md-head .ga-h2 { margin-top: 6px; }
        .md-retry { border: 0; background: none; padding: 0; font-size: 14px; font-weight: 800; color: #6657e9; }
        .md-retry:hover { color: var(--ad-primary-2); }
        @media (max-width: 640px) {
          .md-card { padding: 18px 16px; }
          .md-head { flex-wrap: wrap; margin-bottom: 14px; }
        }
      `}</style>
    </AdminShell>
  );
}
