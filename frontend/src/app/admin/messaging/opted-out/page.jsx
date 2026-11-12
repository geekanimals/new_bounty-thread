"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Stats } from "@/components/admin/ui";
import MsgHead from "@/components/admin/msg/MsgHead";
import PTable from "@/components/admin/brand/PTable";

const ROWS = [
  { who: "@ananya.travels", ch: "WhatsApp", on: "10 Nov", how: "Replied STOP" },
  { who: "@decor.daily", ch: "WhatsApp", on: "8 Nov", how: "Stop link" },
  { who: "@thefestiveedit", ch: "Email", on: "5 Nov", how: "Unsubscribe link" },
];

/** /admin/messaging/opted-out — Opted out (Figma 076) */
export default function OptedOut() {
  const [rows, setRows] = useState(ROWS);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const gone = ROWS.length - rows.length;
  const total = 8 - gone;

  return (
    <AdminShell>
      <MsgHead />
      <Stats
        items={[
          { value: total, label: "Everyone who stopped" },
          { value: total - rows.filter((r) => r.ch === "Email").length, label: "WhatsApp stopped", note: "Replied STOP / stop link" },
          { value: rows.filter((r) => r.ch === "Email").length, label: "Email stopped", note: "Unsubscribed" },
          { value: Math.max(0, 6 - gone), label: "Messages held back", note: "Login codes still go" },
        ]}
      />
      <section className="ad-card mo-card">
        <h2 className="ad-h2">Opted out · {total}</h2>
        <p className="mo-sub">They get no more campaign updates on that channel. Login codes still go.</p>
        <PTable
          minW={680}
          rowH={64}
          cols={[
            { label: "Person", w: "25.8%" },
            { label: "Channel", w: "17.2%" },
            { label: "Stopped", w: "14.9%" },
            { label: "How", w: "25%" },
            { label: "", w: "17.1%" },
          ]}
          rows={rows.map((r) => [
            <b key="w">{r.who}</b>,
            r.ch,
            r.on,
            r.how,
            <button key="r" type="button" className="pt-link mo-r" onClick={() => (setRows(rows.filter((x) => x !== r)), setToast(`${r.who} will get ${r.ch} updates again`))}>
              Resume
            </button>,
          ])}
          empty="Nobody has opted out."
        />
      </section>
      {toast && <div className="ad-toast">✓ {toast}</div>}
      <style>{`
        .mo-card { padding: 24px 22px 14px; }
        .mo-sub { margin: 9px 0 26px; font-size: 12px; color: var(--ad-muted); }
        .mo-r { color: #6657e9; }
        @media (max-width: 640px) { .mo-card { padding: 18px 16px; } .mo-sub { margin-bottom: 14px; } }
      `}</style>
    </AdminShell>
  );
}
