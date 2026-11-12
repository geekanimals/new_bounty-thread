"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { campaignById } from "@/components/admin/data";

const STATUS = ["Live — creators can apply", "Shortlist — invite only", "Paused — hidden from creators", "Draft — not visible", "Completed — closed"];

const DETAILS = [
  ["Each creator posts", "🎬 1 Reel · ⭕ 1 Story"],
  ["Product", "Beardo Detan Express Kit · ₹1,099"],
  ["Dates", "19 Oct → 20 Nov 2026 · 8 days left"],
  ["Video due", "2 days after delivery"],
  ["Ad rights", "1 month · posts stay live"],
  ["Terms", "Collab with brand · blacklist if no video"],
  ["Creators needed", "22"],
  ["Eligibility", "10k+ followers · Mysore, Bengaluru · Travel, Lifestyle · 3%+ eng."],
];

/* Figma: Campaign workspace — Overview (status, messages, details, tools) */
export default function WorkspaceOverview() {
  const { id } = useParams();
  const router = useRouter();
  const c = campaignById(id);
  const [status, setStatus] = useState(STATUS[0]);
  const [auto, setAuto] = useState({ wa: false, mail: false });
  const [ask, setAsk] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const TOOLS = [
    { ic: "🎯", t: "Find matching creators", href: `/admin/campaigns/${c.id}/find` },
    { ic: "📄", t: "Bulk sheet", href: `/admin/campaigns/${c.id}/upload` },
    { ic: "💰", t: "Payments", href: `/admin/campaigns/${c.id}/payments` },
    { ic: "💬", t: "Messages & templates", href: `/admin/campaigns/${c.id}/messages` },
    { ic: "📜", t: "Contract & video brief", href: `/admin/campaigns/${c.id}/contract` },
    { ic: "🔗", t: "Links & codes", href: `/admin/campaigns/${c.id}/attribution` },
    { ic: "✉️", t: "Outreach message", href: `/admin/campaigns/${c.id}/outreach`, short: true },
    { ic: "📋", t: "List for the brand", href: `/admin/campaigns/${c.id}/list`, short: true },
    { ic: "📈", t: "Report", href: `/admin/campaigns/${c.id}/report`, short: true },
    { ic: "🧩", t: "Creator traits", href: `/admin/campaigns/${c.id}/traits`, short: true },
  ];

  const toggle = (k, label) => {
    setAuto((a) => ({ ...a, [k]: !a[k] }));
    setToast(`${label} auto messages ${auto[k] ? "paused" : "turned on"} for this campaign`);
  };

  return (
    <AdminShell>
      <WorkspaceHead id={c.id} />

      <div className="wo-grid">
        <div className="wo-col">
          <section className="ad-card wo-card">
            <div className="wo-status">
              <div>
                <h2 className="ad-h2">Campaign status</h2>
                <p className="wo-sub">Who can see and apply.</p>
              </div>
              <select className="ad-input wo-select" value={status} onChange={(e) => (setStatus(e.target.value), setToast("Status updated · " + e.target.value.split(" — ")[0]))} aria-label="Campaign status">
                {STATUS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            {!auto.wa && !auto.mail && (
              <p className="wo-alert">
                <span>⏸</span>
                <span>
                  <b>Automatic messages are OFF</b>(
                  <Link href="/admin/settings/auto-messages">Settings › Auto messages</Link>) — changing a step does not message the creator. Send by hand with WhatsApp to selected.
                </span>
              </p>
            )}
            <div className="wo-chan">
              {[
                ["wa", "💬", "WhatsApp"],
                ["mail", "✉️", "Email"],
              ].map(([k, ic, label]) => (
                <div key={k} className="wo-ch">
                  <button type="button" className={`ad-toggle wo-tg ${auto[k] ? "is-on" : ""}`} onClick={() => toggle(k, label)} aria-pressed={auto[k]} aria-label={`${label} auto messages`} />
                  <div>
                    <p className="wo-ch__t">
                      {ic} {label}
                    </p>
                    <p className="wo-ch__s">{auto[k] ? "ON — sending step updates" : "OFF — paused for all campaigns"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ad-card wo-card">
            <div className="wo-dhead">
              <div>
                <h2 className="ad-h2">Campaign details</h2>
                <p className="wo-sub">Everything creators see in the brief.</p>
              </div>
              <Link href={`/admin/campaigns/${c.id}/contract`} className="wo-edit">
                ✏️ Edit
              </Link>
            </div>
            <div className="wo-details">
              {DETAILS.map(([k, v]) => (
                <div key={k} className="wo-d">
                  <p>{k}</p>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="wo-col">
          <section className="ad-card wo-card">
            <h2 className="ad-h2">Campaign tools</h2>
            <div className="wo-tools">
              {TOOLS.map((t) => (
                <Link key={t.t} href={t.href} className={`wo-tool ${t.short ? "wo-tool--s" : ""}`}>
                  {t.ic} {t.t}
                </Link>
              ))}
            </div>
            <button type="button" className="wo-del" onClick={() => setAsk(true)}>
              🗑 Delete campaign
            </button>
          </section>

          <section className="ad-card wo-card">
            <h2 className="ad-h2">Creator journey</h2>
            <div className="wo-journey">
              <Link href={`/admin/campaigns/${c.id}/creators`}>
                <strong>66</strong>
                <span>Total</span>
              </Link>
              <Link href={`/admin/campaigns/${c.id}/creators`}>
                <strong>31</strong>
                <span>Approved</span>
              </Link>
              <Link href={`/admin/campaigns/${c.id}/content`}>
                <strong>10</strong>
                <span>Done</span>
                <small>every post up</small>
              </Link>
            </div>
          </section>
        </div>
      </div>

      {ask && (
        <div className="ad-overlay" onClick={() => setAsk(false)}>
          <div className="ad-modal wo-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Delete campaign">
            <h2 className="ad-h2">Delete “{c.name}”?</h2>
            <p>Creators, content and payment history stay in the audit log. The brief disappears for creators right away.</p>
            <div className="wo-modal__act">
              <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setAsk(false)}>
                Cancel
              </button>
              <button type="button" className="ad-btn ad-btn--danger" onClick={() => router.push("/admin/campaigns")}>
                Delete campaign
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="ad-toast">{toast}</div>}

      <style>{`
        .wo-grid { display: grid; grid-template-columns: minmax(0, 652fr) minmax(0, 450fr); gap: 20px; align-items: start; }
        .wo-col { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .wo-card { padding: 22px 22px 22px; }
        .wo-sub { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }
        .wo-status { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        .wo-select { width: 319px; height: 45px; padding: 0 32px 0 12px; font-size: 14px; color: #293652; appearance: none; background: #fff; }
        .wo-alert { display: flex; gap: 8px; margin-top: 18px; padding: 13px 16px 12px; border-radius: 12px; background: #ffeef0; border: 1px solid #f7cdd4; font-size: 12px; line-height: 1.33; color: #b64455; }
        .wo-alert b { font-weight: 700; }
        .wo-alert a { text-decoration: none; color: inherit; }
        .wo-alert a:hover { text-decoration: underline; }
        .wo-chan { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; }
        .wo-ch { display: flex; align-items: center; gap: 12px; padding: 18px 15px 16px; border-radius: 14px; background: var(--ad-soft-2); }
        .wo-tg { width: 38px; height: 22px; }
        .wo-tg:not(.is-on) { background: #dfe2ec; }
        .wo-tg:not(.is-on)::after { box-shadow: none; background: #dfe2ec; }
        .wo-ch__t { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.6px; line-height: 1.1; color: var(--ad-ink); }
        .wo-ch__s { margin-top: 6px; font-size: 12px; color: var(--ad-muted); }

        .wo-dhead { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .wo-edit { margin-top: 12px; margin-right: 6px; font-size: 14px; font-weight: 800; color: #6657e9; }
        .wo-details { display: grid; grid-template-columns: 1fr 1fr; gap: 13px 12px; margin-top: 24px; }
        .wo-d { min-height: 78px; padding: 20px 19px 18px; border-radius: 14px; border: 1px solid var(--ad-line); }
        .wo-d:nth-child(n+5) { min-height: 96px; }
        .wo-d p { font-size: 11px; letter-spacing: .8px; text-transform: uppercase; color: var(--ad-muted); }
        .wo-d b { display: block; margin-top: 6px; font-size: 14px; font-weight: 700; line-height: 1.33; color: var(--ad-ink); }

        .wo-tools { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 10px; margin-top: 18px; }
        .wo-tool { display: grid; place-items: center; min-height: 59px; padding: 8px 18px; border-radius: 12px; border: 1px solid var(--ad-line-2); text-align: center; font-size: 14px; font-weight: 800; line-height: 1.33; color: var(--ad-primary-ink); transition: border-color .15s, background .15s; }
        .wo-tool--s { min-height: 41px; }
        .wo-tool:hover { border-color: var(--ad-primary); background: var(--ad-soft-2); }
        .wo-del { margin: 20px 0 6px 8px; padding: 0; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; }
        .wo-del:hover { color: var(--ad-red); }

        .wo-journey { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; margin: 20px 0 22px; }
        .wo-journey a { display: flex; flex-direction: column; min-height: 120px; padding: 25px 19px 16px; border-radius: 14px; border: 1px solid var(--ad-line); transition: border-color .15s; }
        .wo-journey a:hover { border-color: #cfd2ee; }
        .wo-journey strong { font-family: var(--ad-head); font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; color: var(--ad-ink); }
        .wo-journey span { margin-top: 13px; font-size: 12px; color: var(--ad-muted); }
        .wo-journey small { margin-top: 7px; font-size: 11px; color: var(--ad-faint); }

        .wo-modal { padding: 24px; }
        .wo-modal p { margin-top: 10px; font-size: 13px; line-height: 1.5; color: var(--ad-muted); }
        .wo-modal__act { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }

        @media (max-width: 1180px) { .wo-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .wo-card { padding: 18px 16px; }
          .wo-status { flex-direction: column; }
          .wo-select { width: 100%; }
          .wo-chan, .wo-details { grid-template-columns: 1fr; }
          .wo-d, .wo-d:nth-child(n+5) { min-height: 0; padding: 14px 16px; }
          .wo-ch__t { font-size: 20px; }
          .wo-journey { gap: 8px; }
          .wo-journey a { min-height: 0; padding: 16px 12px; }
          .wo-journey strong { font-size: 24px; }
          .wo-modal__act > * { flex: 1; }
        }
      `}</style>
    </AdminShell>
  );
}
