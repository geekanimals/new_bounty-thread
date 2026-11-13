"use client";

import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { Stats } from "@/components/admin/ui";
import MsgHead from "@/components/admin/msg/MsgHead";
import PTable from "@/components/admin/brand/PTable";
import { useRpc, errText } from "@/lib/supabase";
import { fmtWhen } from "@/components/admin/brand/util";

const TONE = { OK: "green", Held: "orange", Sending: "violet", Failed: "red", "No number": "red", "No email": "red", Stopped: "", "—": "" };
const badge = (v, title) => (
  <span className={`ad-badge ad-badge--${TONE[v] ?? ""}`} title={title || ""}>
    {v}
  </span>
);
/* purane app ka st(): off → Stopped, number/email nahi → No …, failed → Failed, held → Held, sent/queued → OK */
const sum = (o) => (o?.sent || 0) + (o?.held || 0) + (o?.failed || 0) + (o?.queued || 0);
const waState = (c) => (c.wa_off ? "Stopped" : !c.wa_number ? "No number" : c.wa?.failed ? "Failed" : c.wa?.held ? "Held" : c.wa?.sent ? "OK" : c.wa?.queued ? "Sending" : "—");
const emState = (c) => (c.email_off ? "Stopped" : !sum(c.email) ? "No email" : c.email?.failed ? "Failed" : c.email?.held ? "Held" : c.email?.sent ? "OK" : c.email?.queued ? "Sending" : "—");
const bad = (x) => ["Failed", "No number", "No email"].includes(x);
const profile = (c) => (c.member_id ? `/admin/creators/${c.member_id}/profile` : "/admin/users");
function fix(c) {
  const w = waState(c), e = emState(c);
  if (w === "Held" || e === "Held") return ["Turn on auto messages", "/admin/settings/auto-messages"];
  if (w === "No number") return ["Ask for WhatsApp number", profile(c)];
  if (w === "Stopped") return ["Replied STOP — email only", "/admin/messaging/opted-out"];
  if (e === "No email") return ["Ask for email", profile(c)];
  if (e === "Stopped") return ["Unsubscribed — WhatsApp only", "/admin/messaging/opted-out"];
  if (w === "Failed" || e === "Failed") return ["See failed messages", "/admin/messaging"];
  return ["—", null];
}

/** /admin/messaging/doctor — Delivery doctor (Figma 075) · public.admin_delivery_doctor (last 7 days) */
export default function DeliveryDoctor() {
  const { data, error, loading, reload } = useRpc("admin", "admin_delivery_doctor");
  const L = Array.isArray(data) ? data : [];
  const cnt = (fn) => (loading ? "—" : L.filter(fn).length);
  return (
    <AdminShell>
      <MsgHead />
      <Stats
        items={[
          { value: cnt(() => true), label: "Everyone", note: "Had an update · 7 days" },
          { value: cnt((c) => waState(c) === "OK" && emState(c) === "OK"), label: "Reaching them", note: "WhatsApp + email OK" },
          { value: cnt((c) => bad(waState(c))), label: "WhatsApp problem", note: "No number / failed" },
          { value: cnt((c) => bad(emState(c))), label: "Email problem", note: "No email / failed" },
          { value: cnt((c) => waState(c) === "Held" || emState(c) === "Held"), label: "Waiting", note: "Held — auto messages off", href: "/admin/settings/auto-messages" },
        ]}
      />
      <section className="ad-card mdd-card">
        <h2 className="ad-h2">Why a message did or didn’t reach them</h2>
        {error ? (
          <p className="mdd-state">
            Couldn’t load: {errText(error)}{" "}
            <button type="button" onClick={() => reload()}>
              Retry
            </button>
          </p>
        ) : (
        <PTable
          minW={760}
          cols={[
            { label: "Person", w: "20.8%" },
            { label: "Updates", w: "19%" },
            { label: "WhatsApp", w: "16.4%" },
            { label: "Email", w: "14.4%" },
            { label: "Fix", w: "29.4%" },
          ]}
          rows={L.map((c) => {
            const [ft, fh] = fix(c);
            return [
              <b key="w" title={c.who}>
                {c.who || "—"}
              </b>,
              `${c.alerts || 0} · last ${fmtWhen(c.last_at)}`,
              badge(waState(c), [c.wa_number, c.wa?.error].filter(Boolean).join(" · ")),
              badge(emState(c), [c.email?.to, c.email?.error].filter(Boolean).join(" · ")),
              fh ? (
                <Link key="f" href={fh} className="mdd-fix">
                  {ft}
                </Link>
              ) : (
                <span key="f">—</span>
              ),
            ];
          })}
          empty={loading ? "Loading…" : "No updates in the last 7 days."}
        />
        )}
      </section>
      <style>{`
        .mdd-card { padding: 24px 22px 18px; }
        .mdd-card .ad-h2 { margin-bottom: 26px; }
        .mdd-fix { color: var(--ad-ink); }
        .mdd-state { padding: 14px 11px; font-size: 13px; color: var(--ad-red); }
        .mdd-state button { border: 0; background: none; padding: 0; font-weight: 800; color: #6657e9; }
        .mdd-fix:hover { color: var(--ad-primary); text-decoration: underline; }
        @media (max-width: 640px) { .mdd-card { padding: 18px 16px; } .mdd-card .ad-h2 { margin-bottom: 14px; } }
      `}</style>
    </AdminShell>
  );
}
