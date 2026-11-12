"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { campaignById } from "@/components/admin/data";
import { Panel, SubTabs, Note, useToast } from "@/components/admin/campaign2/kit";

const STEPS = (name) => [
  { step: "1 · Not selected", tpl: "geek_step_not_selected", state: "With Meta", subject: `Update on ${name}`, body: `Hi {name}, thank you for applying to ${name}. This time the brand went with other creators — we'll ping you for the next one that fits.` },
  { step: "2 · Approved — invite", tpl: "geek_campaign_access", state: "Approved", subject: `Approved for ${name} 🎉`, body: `Hi {name}, you're approved for ${name}! Open Geek OS to see the brief and accept the campaign.` },
  { step: "3 · Contract sent", tpl: "geek_step_contract", state: "Approved", subject: "Sign your contract", body: "Hi {name}, your contract is ready. Read it and sign in the app — it takes a minute." },
  { step: "4 · Address", tpl: "geek_step_address", state: "Approved", subject: "Confirm your delivery address", body: "Hi {name}, confirm where we should send your product so it reaches you on time." },
  { step: "5 · Courier sent", tpl: "geek_step_shipped", state: "Approved", subject: "Your product is on the way", body: "Hi {name}, your product has shipped. Track it here: {tracking_link}" },
  { step: "6 · Video due", tpl: "geek_step_video_due", state: "Approved", subject: "Your video is due in 2 days", body: "Hi {name}, a reminder that your video is due in 2 days. Upload your draft in the app." },
  { step: "7 · Go live", tpl: "geek_step_go_live", state: "Approved", subject: "Your video is approved — post it", body: "Hi {name}, the brand approved your video 🎉 Post it today and add your post link in the app." },
];

export default function CampaignMessages() {
  const { id } = useParams();
  const c = campaignById(id);
  const base = c.name.split(" · ")[0];
  const [toast, show] = useToast();
  const [rows, setRows] = useState(() => STEPS(base));
  const [open, setOpen] = useState(null);

  const submit = (i) => {
    setRows((r) => r.map((x, j) => (j === i ? { ...x, state: "Submitted" } : x)));
    show("Template submitted to Meta (Utility) — usually approved in a few minutes");
  };
  const pending = rows.filter((r) => r.state === "With Meta").length;

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <SubTabs
        active="messages"
        items={[
          { k: "messages", label: "💬 Messages & templates", href: `/admin/campaigns/${id}/messages` },
          { k: "outreach", label: "✉️ Outreach message", href: `/admin/campaigns/${id}/outreach` },
        ]}
      />

      <Panel
        title="💬 Messages & templates — every step"
        sub="What the creator gets at every step — on WhatsApp, by email and in the app. Tap a row to see the full message."
        actions={
          <div className="mt-pills">
            <Link href="/admin/settings/auto-messages" className="ad-badge">
              WhatsApp OFF in Settings
            </Link>
            <Link href="/admin/settings/auto-messages" className="ad-badge">
              Email OFF in Settings
            </Link>
          </div>
        }
      >
        {pending > 0 && (
          <Note tone="amber" icon="⏳">
            <b>{pending} WhatsApp template is not approved yet</b>— until then those messages go on the general update template. Open it and tap Submit to Meta (Utility).
          </Note>
        )}

        <div className="c2-tw">
          <table className="c2-t mt-t">
            <thead>
              <tr>
                <th>Step</th>
                <th>WhatsApp template</th>
                <th>Email subject</th>
                <th>In app</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <FragmentRow key={r.tpl} r={r} open={open === i} onToggle={() => setOpen(open === i ? null : i)} onSubmit={() => submit(i)} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {toast}

      <style>{`
        .mt-pills { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 0; }
        .mt-pills .ad-badge { height: 26px; }
        .mt-pills .ad-badge:hover { background: var(--ad-lilac); color: var(--ad-primary); }
        .mt-t { margin-top: 23px; }
        .mt-row { cursor: pointer; }
        .mt-row:hover td { background: var(--ad-soft-2); }
        .mt-row td { height: 57px; padding-top: 8px; padding-bottom: 8px; }
        .mt-row .ad-badge { margin-left: 4px; height: 24px; }
        .mt-row td.mt-sub { font-size: 12px; color: var(--ad-muted); }
        .mt-row td.mt-ck { font-size: 13px; color: var(--ad-ink); }
        .mt-open td { padding: 0 11px 16px; white-space: normal; }
        .mt-open__box { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 14px; border-radius: 12px; background: var(--ad-soft-2); }
        .mt-open__box p { margin-top: 6px; font-size: 13px; line-height: 1.5; color: var(--ad-text); }
        .mt-open__box em { font-style: normal; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #9aa2b4; }
        .mt-open__act { grid-column: 1 / -1; display: flex; gap: 8px; }
        @media (max-width: 640px) { .mt-open__box { grid-template-columns: 1fr; } }
      `}</style>
    </AdminShell>
  );
}

function FragmentRow({ r, open, onToggle, onSubmit }) {
  const tone = r.state === "Approved" ? "green" : r.state === "Submitted" ? "violet" : "orange";
  return (
    <>
      <tr className="mt-row" onClick={onToggle} aria-expanded={open}>
        <td>
          <b>{r.step}</b>
        </td>
        <td>
          {r.tpl}
          <span className={`ad-badge ad-badge--${tone}`}>{r.state}</span>
        </td>
        <td className="mt-sub">{r.subject}</td>
        <td className="mt-ck">✓</td>
      </tr>
      {open && (
        <tr className="mt-open">
          <td colSpan={4}>
            <div className="mt-open__box">
              <div>
                <em>WhatsApp · {r.tpl}</em>
                <p>{r.body}</p>
              </div>
              <div>
                <em>Email · {r.subject}</em>
                <p>{r.body}</p>
              </div>
              {r.state === "With Meta" && (
                <div className="mt-open__act">
                  <button
                    type="button"
                    className="ad-btn ad-btn--primary ad-btn--sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSubmit();
                    }}
                  >
                    Submit to Meta (Utility)
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
