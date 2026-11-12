"use client";

import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { Stats } from "@/components/admin/ui";
import MsgHead from "@/components/admin/msg/MsgHead";
import PTable from "@/components/admin/brand/PTable";

const ROWS = [
  { who: "@rohit_ggarg", up: "16 · last 4:47 pm", wa: "Held", em: "OK", fix: "Turn on auto messages", href: "/admin/settings/auto-messages" },
  { who: "@nishastories", up: "9 · last 3:10 pm", wa: "No number", em: "OK", fix: "Ask for WhatsApp number", href: "/admin/creators/nisha-rao/profile" },
  { who: "@kabirfoodtrail", up: "4 · last 1:02 pm", wa: "OK", em: "No email", fix: "Ask for email", href: "/admin/creators/kabir-mehta/profile" },
  { who: "@ananya.travels", up: "3 · yesterday", wa: "Stopped", em: "OK", fix: "Replied STOP — email only", href: "/admin/messaging/opted-out" },
];
const TONE = { OK: "green", Held: "orange", "No number": "red", "No email": "red", Stopped: "" };
const badge = (v) => <span className={`ad-badge ad-badge--${TONE[v]}`}>{v}</span>;

/** /admin/messaging/doctor — Delivery doctor (Figma 075) */
export default function DeliveryDoctor() {
  return (
    <AdminShell>
      <MsgHead />
      <Stats
        items={[
          { value: 82, label: "Everyone", note: "Had an update · 7 days" },
          { value: 0, label: "Reaching them", note: "WhatsApp + email OK" },
          { value: 39, label: "WhatsApp problem", note: "No number / failed" },
          { value: 8, label: "Email problem", note: "No email / failed" },
          { value: 80, label: "Waiting", note: "Held — auto messages off", href: "/admin/settings/auto-messages" },
        ]}
      />
      <section className="ad-card mdd-card">
        <h2 className="ad-h2">Why a message did or didn’t reach them</h2>
        <PTable
          minW={760}
          cols={[
            { label: "Person", w: "20.8%" },
            { label: "Updates", w: "19%" },
            { label: "WhatsApp", w: "16.4%" },
            { label: "Email", w: "14.4%" },
            { label: "Fix", w: "29.4%" },
          ]}
          rows={ROWS.map((r) => [
            <b key="w">{r.who}</b>,
            r.up,
            badge(r.wa),
            badge(r.em),
            <Link key="f" href={r.href} className="mdd-fix">
              {r.fix}
            </Link>,
          ])}
        />
      </section>
      <style>{`
        .mdd-card { padding: 24px 22px 18px; }
        .mdd-card .ad-h2 { margin-bottom: 26px; }
        .mdd-fix { color: var(--ad-ink); }
        .mdd-fix:hover { color: var(--ad-primary); text-decoration: underline; }
        @media (max-width: 640px) { .mdd-card { padding: 18px 16px; } .mdd-card .ad-h2 { margin-bottom: 14px; } }
      `}</style>
    </AdminShell>
  );
}
