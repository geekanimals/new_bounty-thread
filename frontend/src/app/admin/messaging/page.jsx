"use client";

import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { Stats } from "@/components/admin/ui";
import MsgHead from "@/components/admin/msg/MsgHead";
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
 * /admin/messaging — Delivery (Figma 074). Purane app jaisa:
 *  public.admin_delivery (har 20 sec) · switches: admin_messaging_switches + api.ops_auto_messages
 *  "Retry failed" → public.admin_delivery_retry({ p_channel: null })
 */
export default function MessagingDelivery() {
  const { data, error, loading, reload } = useRpc("admin", "admin_delivery", {}, { refreshMs: 20000 });
  const sw = useRpc("admin", "admin_messaging_switches");
  const au = useRpc("admin", "api.ops_auto_messages");
  const [toast, say] = useToast();

  const d = data || {};
  const st = d.stats || {};
  const n = (k) => Number(st[k] || 0);
  const recent = d.recent || [];
  const waOff = sw.data && sw.data.wa_on === false;
  const autoOff = au.data && au.data.auto_on === false;
  const held = Number(sw.data?.held_wa) || 0;

  const retry = async () => {
    const r = await rpc("admin", "admin_delivery_retry", { p_channel: null });
    if (r.error) return say(errText(r.error));
    say(`${Number(r.data) || 0} message(s) re-queued`);
    setTimeout(() => reload(true), 3000);
  };

  return (
    <AdminShell>
      <MsgHead />
      <Stats
        items={[
          { value: loading ? "—" : recent.length, label: "All messages", note: `Latest ${recent.length}` },
          { value: loading ? "—" : n("whatsapp:sent"), label: "WhatsApp sent", note: "Last 7 days" },
          { value: loading ? "—" : n("email:sent"), label: "Emails sent", note: "Last 7 days" },
          { value: loading ? "—" : n("whatsapp:skipped") + n("whatsapp:failed") + n("email:skipped") + n("email:failed"), label: "Not sent", note: "Skipped / failed · 7 days", href: "/admin/messaging/doctor" },
          { value: loading ? "—" : n("whatsapp:queued") + n("email:queued") + n("whatsapp:sending") + n("email:sending"), label: "In queue", note: "Sending now" },
        ]}
      />
      {(waOff || autoOff) && (
        <p className="md-warn">
          <span>⚠️</span>
          <span>
            <b>Automatic {waOff ? "WhatsApp updates" : "messages"} are off.</b>
            {held ? `${held} update${held === 1 ? " was" : "s were"} held in the last 7 days` : "Updates are held"} — turn on in <Link href="/admin/settings/auto-messages">Settings › Auto messages</Link> to send them.
          </span>
        </p>
      )}
      <section className="ga-card md-card">
        <div className="md-head">
          <h2 className="ga-h2">All messages</h2>
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
          rows={recent.map((r) => {
            const [label, tone] = badge(r);
            return [
              <span key="t" title={r.to}>
                {r.who || r.to || "—"}
              </span>,
              r.channel === "whatsapp" ? "WhatsApp" : "Email",
              <span key="m" title={r.error || r.title || r.template}>
                {r.title || r.template || "—"}
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
          empty={loading ? "Loading…" : "No messages yet."}
        />
        )}
      </section>
      {toast && <div className="ga-toast">↻ {toast}</div>}
      <style>{`
        .md-warn { display: flex; gap: 10px; align-items: flex-start; min-height: 41px; margin: 0 0 18px; padding: 12px 15px; border-radius: 13px; border: 1px solid #f5c9d0; background: #fdeef0; font-size: 12px; line-height: 1.35; color: #b64455; }
        .md-warn b { font-weight: 700; }
        .md-warn a:hover { text-decoration: underline; text-underline-offset: 2px; }
        .md-card { padding: 22px 22px 18px; }
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
