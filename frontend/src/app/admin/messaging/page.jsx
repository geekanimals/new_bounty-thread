"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { Stats } from "@/components/admin/ui";
import MsgHead from "@/components/admin/msg/MsgHead";
import PTable from "@/components/admin/brand/PTable";

const ROWS = [
  { to: "Nisha Rao", ch: "WhatsApp", msg: "Campaign update · approved", st: "Delivered", when: "4:47 pm" },
  { to: "Kabir Mehta", ch: "Email", msg: "Contract ready to sign", st: "Sent", when: "4:30 pm" },
  { to: "Ananya Iyer", ch: "WhatsApp", msg: "Product shipped · tracking", st: "Held", when: "3:12 pm" },
  { to: "Rohan Das", ch: "WhatsApp", msg: "Login code", st: "Delivered", when: "2:55 pm" },
  { to: "Ritika Sen", ch: "Email", msg: "Reminder · submit draft", st: "Failed", when: "1:20 pm" },
];
const TONE = { Delivered: "green", Sent: "green", Held: "orange", Failed: "red", Retrying: "violet" };

/** /admin/messaging — Delivery (Figma 074) */
export default function MessagingDelivery() {
  const [rows, setRows] = useState(ROWS);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const retry = () => {
    const n = rows.filter((r) => r.st === "Failed").length;
    if (!n) return setToast("No failed messages in the last 3 days");
    setRows(rows.map((r) => (r.st === "Failed" ? { ...r, st: "Retrying" } : r)));
    setToast(`Retrying ${n} failed message${n > 1 ? "s" : ""}`);
    setTimeout(() => setRows((rs) => rs.map((r) => (r.st === "Retrying" ? { ...r, st: "Sent" } : r))), 1500);
  };

  return (
    <AdminShell>
      <MsgHead />
      <Stats
        items={[
          { value: 80, label: "All messages", note: "Latest 80" },
          { value: 42, label: "WhatsApp sent", note: "Last 7 days" },
          { value: 124, label: "Emails sent", note: "Last 7 days" },
          { value: 110, label: "Not sent", note: "Skipped / failed · 7 days", href: "/admin/messaging/doctor" },
          { value: 0, label: "In queue", note: "Sending now" },
        ]}
      />
      <p className="md-warn">
        <span>⚠️</span>
        <span>
          <b>Automatic WhatsApp updates are off.</b>80 updates are held — turn on in <Link href="/admin/settings/auto-messages">Settings › Auto messages</Link> to send them.
        </span>
      </p>
      <section className="ad-card md-card">
        <div className="md-head">
          <h2 className="ad-h2">All messages</h2>
          <button type="button" className="md-retry" onClick={retry}>
            ↻ Retry failed (3 days)
          </button>
        </div>
        <PTable
          minW={720}
          cols={[
            { label: "To", w: "17.5%" },
            { label: "Channel", w: "16%" },
            { label: "Message", w: "36.5%" },
            { label: "Status", w: "17.3%" },
            { label: "When", w: "12.7%" },
          ]}
          rows={rows.map((r) => [
            r.to,
            r.ch,
            r.msg,
            <span key="s" className={`ad-badge ad-badge--${TONE[r.st]}`}>
              {r.st}
            </span>,
            r.when,
          ])}
        />
      </section>
      {toast && <div className="ad-toast">↻ {toast}</div>}
      <style>{`
        .md-warn { display: flex; gap: 10px; align-items: flex-start; min-height: 41px; margin: 0 0 18px; padding: 12px 15px; border-radius: 13px; border: 1px solid #f5c9d0; background: #fdeef0; font-size: 12px; line-height: 1.35; color: #b64455; }
        .md-warn b { font-weight: 700; }
        .md-warn a:hover { text-decoration: underline; text-underline-offset: 2px; }
        .md-card { padding: 22px 22px 18px; }
        .md-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 30px; }
        .md-head .ad-h2 { margin-top: 6px; }
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
