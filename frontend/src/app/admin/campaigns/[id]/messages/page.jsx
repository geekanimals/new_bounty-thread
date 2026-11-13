"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Panel, SubTabs, Note, TableState, useToast, copyText } from "@/components/admin/campaign2/kit";
import { useRpc, rpc, errText } from "@/lib/supabase";

/*
 * 💬 Messages & templates — purane payments.js ka msgMap.
 * Data: api.campaign_message_map (har step: WhatsApp template · email · app) · Submit to Meta: admin_step_template_mark (status queued).
 */
const ST = {
  approved: ["Approved", "green"],
  submitted: ["With Meta", "orange"],
  queued: ["Sending to Meta", "orange"],
  draft: ["Draft — not submitted", "orange"],
  manual: ["Create in WhatsApp Manager", "orange"],
  failed: ["Failed", "red"],
  rejected: ["Rejected", "red"],
  none: ["No WhatsApp", ""],
};
const stateOf = (w) => (w.general ? ["General update", "green"] : ST[w.status || "none"] || [w.status, ""]);
const fmt = (t) => String(t || "").replace(/\*([^*\n]+)\*/g, "$1");

export default function CampaignMessages() {
  const { id } = useParams();
  const [toast, show] = useToast();
  const { data, error, loading, reload } = useRpc("admin", "api.campaign_message_map", { p_campaign: id }, { skip: !id || id === "sample" });
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState("");

  const d = data || {};
  const sw = d.switches || {};
  const phases = d.phases || [];
  const notLive = phases.filter((p) => p.whatsapp && p.whatsapp.template && !p.whatsapp.general && p.whatsapp.status !== "approved").length;
  const pill = (g, c, n) => (!g ? `${n} OFF in Settings` : !c ? `${n} OFF for this campaign` : `${n} ON`);

  const submit = async (w) => {
    if (!window.confirm(`Submit “${w.template}” to Meta for approval?\n\nCategory Utility, English, the exact text shown. Meta usually reviews within a few minutes to a day; it goes out automatically once approved.`)) return;
    setBusy(w.template);
    const { error: e } = await rpc("admin", "admin_step_template_mark", { p_name: w.template, p_status: "queued" });
    setBusy("");
    if (e) return show(errText(e));
    show("Sent to Meta for approval ✓ — the status updates here");
    reload(true);
  };

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
          data && (
            <div className="mt-pills">
              <Link href="/admin/settings/auto-messages" className={`ad-badge ${sw.wa_global && sw.wa ? "ad-badge--green" : ""}`}>
                {pill(sw.wa_global, sw.wa, "WhatsApp")}
              </Link>
              <Link href="/admin/settings/auto-messages" className={`ad-badge ${sw.email_global && sw.email ? "ad-badge--green" : ""}`}>
                {pill(sw.email_global, sw.email, "Email")}
              </Link>
            </div>
          )
        }
      >
        {notLive > 0 && (
          <Note tone="amber" icon="⏳">
            <b>
              {notLive} WhatsApp template{notLive > 1 ? "s are" : " is"} not approved yet
            </b>
            — until then those messages go on the general update template. Open it and tap Submit to Meta (Utility).
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
              <TableState cols={4} loading={loading && !data} error={!data && error} onRetry={reload} empty={data && !phases.length && "No messages for this campaign type."} />
              {phases.map((p, i) => (
                <Row key={i} n={i + 1} p={p} open={open === i} busy={busy} onToggle={() => setOpen(open === i ? null : i)} onSubmit={submit} onCopy={async (t) => (await copyText(t), show("Copied ✓"))} />
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
        .mt-open__box { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; padding: 14px; border-radius: 12px; background: var(--ad-soft-2); }
        .mt-open__box p { margin-top: 6px; font-size: 13px; line-height: 1.5; color: var(--ad-text); white-space: pre-line; }
        .mt-open__box em { font-style: normal; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #9aa2b4; }
        .mt-open__box small { display: block; margin-top: 6px; font-size: 11.5px; color: var(--ad-muted); }
        .mt-open__act { grid-column: 1 / -1; display: flex; gap: 8px; flex-wrap: wrap; }
        @media (max-width: 1023px) { .mt-open__box { grid-template-columns: 1fr; } }
      `}</style>
    </AdminShell>
  );
}

function Row({ n, p, open, busy, onToggle, onSubmit, onCopy }) {
  const w = p.whatsapp || {},
    e = p.email || {},
    a = p.app || {};
  const [label, tone] = stateOf(w);
  const canSubmit = w.template && !w.general && ["draft", "manual", "failed", "rejected"].includes(w.status);
  return (
    <>
      <tr className="mt-row" onClick={onToggle} aria-expanded={open}>
        <td>
          <b>
            {n} · {p.phase}
          </b>
        </td>
        <td>
          {w.template || "—"}
          <span className={`ad-badge ad-badge--${tone}`}>{label}</span>
        </td>
        <td className="mt-sub">{e.subject || "—"}</td>
        <td className="mt-ck">{a.title ? "✓" : "—"}</td>
      </tr>
      {open && (
        <tr className="mt-open">
          <td colSpan={4}>
            <div className="mt-open__box">
              <div>
                <em>WhatsApp{w.template ? ` · ${w.template}` : ""}</em>
                <p>{fmt(w.text) || "—"}</p>
                {w.template && !w.general && w.status !== "none" && (
                  <small>
                    Category Utility · English · {"{{1}}"} name · {"{{2}}"} campaign · {"{{3}}"} brand · {"{{4}}"} app link.
                    {w.fallback ? ` Until it is approved this message goes on ${w.fallback}.` : ""}
                  </small>
                )}
              </div>
              <div>
                <em>Email · {e.subject || "—"}</em>
                <p>{fmt(e.text) || "—"}</p>
              </div>
              <div>
                <em>In the app · {a.title || "—"}</em>
                <p>{fmt(String(a.text || "").replace(/\*\*/g, "*")) || "—"}</p>
                {a.button && <small>[ {a.button} ]</small>}
              </div>
              {(canSubmit || w.text) && (
                <div className="mt-open__act">
                  {canSubmit && (
                    <button
                      type="button"
                      className="ad-btn ad-btn--primary ad-btn--sm"
                      disabled={busy === w.template}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onSubmit(w);
                      }}
                    >
                      {busy === w.template ? "Submitting…" : "📤 Submit to Meta (Utility)"}
                    </button>
                  )}
                  {w.text && (
                    <button
                      type="button"
                      className="ad-btn ad-btn--ghost ad-btn--sm"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onCopy(String(w.text));
                      }}
                    >
                      Copy text
                    </button>
                  )}
                </div>
              )}
              {p.exists === false && <small>This step has no app / email message.</small>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
