"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Panel, SubTabs, Note, TableState, useToast, copyText } from "@/components/admin/campaign2/kit";
import { useRpc } from "@/lib/supabase";
import { useCampaign } from "@/components/admin/campaign/live";
import { DRIPS, STEP_DRIP, ACCOUNT_DRIPS, SAMPLE, fillParts } from "@/components/admin/msg/snaptoDrips";

/*
 * 💬 Messages — what each creator actually gets now, step by step.
 *  WhatsApp = the Snapto drips (Utility templates) — components/admin/msg/snaptoDrips.js (old Meta step templates are not sent).
 *  Email + in-app = api.campaign_message_map (same as before) · switches from the same call.
 */
const fmt = (t) => String(t || "").replace(/\*\*/g, "").replace(/\*([^*\n]+)\*/g, "$1");

export default function CampaignMessages() {
  const { id } = useParams();
  const [toast, show] = useToast();
  const { c: camp } = useCampaign(id);
  const { data, error, loading, reload } = useRpc("admin", "api.campaign_message_map", { p_campaign: id }, { skip: !id || id === "sample" });
  const [open, setOpen] = useState(null);
  const [openAcc, setOpenAcc] = useState(null);

  const d = data || {};
  const sw = d.switches || {};
  const phases = d.phases || [];
  const waOn = sw.wa_global !== false && sw.wa !== false;
  const emOn = sw.email_global !== false && sw.email !== false;
  const vals = { ...SAMPLE, campaign: camp?.name || "your campaign" };
  const nWa = phases.filter((p) => STEP_DRIP[p.key]).length;
  const pill = (g, c, n) => (g === false ? `${n} OFF in Settings` : c === false ? `${n} OFF for this campaign` : `${n} ON`);
  const copy = async (t) => (await copyText(t), show("Copied ✓"));

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <SubTabs
        active="messages"
        items={[
          { k: "messages", label: "💬 Messages & templates", href: `/vault/campaigns/${id}/messages` },
          { k: "outreach", label: "✉️ Outreach message", href: `/vault/campaigns/${id}/outreach` },
        ]}
      />

      <Panel
        title="💬 What creators get — every step"
        sub="WhatsApp (Snapto drips), email and the in-app alert for each step of this campaign. Tap a step to read the exact messages."
        actions={
          data && (
            <div className="mt-pills">
              <Link href={`/vault/campaigns/${id}/overview`} className={`ga-badge ${waOn ? "ga-badge--green" : "ga-badge--orange"}`}>
                {pill(sw.wa_global, sw.wa, "WhatsApp")}
              </Link>
              <Link href={`/vault/campaigns/${id}/overview`} className={`ga-badge ${emOn ? "ga-badge--green" : "ga-badge--orange"}`}>
                {pill(sw.email_global, sw.email, "Email")}
              </Link>
            </div>
          )
        }
      >
        <div className="mt-legend">
          <span>
            <i className="mt-dot mt-dot--wa" /> <b>WhatsApp</b> goes only through the <b>Snapto drips</b> (approved Utility templates) — {nWa} steps have one. A drip sends a few reminders and stops by itself once the creator does the task. Old Meta step templates are no longer sent.
          </span>
          <span>
            <i className="mt-dot mt-dot--em" /> <b>Email</b> and the <b>in-app alert</b> go at every step.
          </span>
        </div>
        {data && !waOn && (
          <Note tone="amber" icon="⏸">
            <b>WhatsApp is OFF for this campaign</b> — no drip messages go to its creators. Turn it on in the campaign Overview.
          </Note>
        )}
        {data && !emOn && (
          <Note tone="amber" icon="⏸">
            <b>Email is OFF for this campaign</b> — step emails are held, only the in-app alert shows.
          </Note>
        )}

        <div className="c2-tw">
          <table className="c2-t mt-t">
            <thead>
              <tr>
                <th>Step</th>
                <th>WhatsApp</th>
                <th>Email</th>
                <th>In app</th>
              </tr>
            </thead>
            <tbody>
              <TableState cols={4} loading={loading && !data} error={!data && error} onRetry={reload} empty={data && !phases.length && "No messages for this campaign type."} />
              {phases.map((p, i) => {
                const dk = STEP_DRIP[p.key];
                const dr = dk && DRIPS[dk];
                const e = p.email || {};
                const a = p.app || {};
                const isOpen = open === i;
                return [
                  <tr key={`r${i}`} className={`mt-row ${isOpen ? "is-open" : ""}`} onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                    <td>
                      <b>
                        {i + 1} · {p.phase}
                      </b>
                    </td>
                    <td>
                      {dr ? (
                        <span className={`ga-badge ga-badge--${waOn ? "green" : "orange"}`}>
                          {waOn ? "✓" : "⏸"} Drip {dk} · {dr.msgs.length} message{dr.msgs.length > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="mt-none">No WhatsApp</span>
                      )}
                    </td>
                    <td className="mt-sub">
                      {e.subject ? (
                        <>
                          <span className={emOn ? "" : "mt-held"}>{e.subject}</span>
                          {!emOn && <small> · held</small>}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="mt-ck">{a.title ? "✓" : "—"}</td>
                  </tr>,
                  isOpen && (
                    <tr key={`o${i}`} className="mt-open">
                      <td colSpan={4}>
                        <div className="mt-open__box">
                          <div className="mt-wa">
                            <em>WhatsApp {dr ? `· Snapto drip ${dk} — ${dr.name}` : ""}</em>
                            {dr ? (
                              <>
                                <p className="mt-when">
                                  Starts: {dr.when}
                                  {dk === "01" ? " (creators already on Bounty get the in-app alert + email instead)" : ""}. Stops when {dr.stops}.
                                </p>
                                <Bubbles drip={dr} vals={vals} onCopy={copy} off={!waOn} />
                              </>
                            ) : (
                              <p className="mt-when">No WhatsApp at this step — the creator gets the email and the in-app alert.</p>
                            )}
                          </div>
                          <div className="mt-side">
                            <div>
                              <em>Email · {e.subject || "—"}</em>
                              <p>{fmt(e.text) || "—"}</p>
                            </div>
                            <div>
                              <em>In the app · {a.title || "—"}</em>
                              <p>{fmt(a.text) || "—"}</p>
                              {a.button && <small>[ {a.button} ]</small>}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="👤 Account messages — not tied to a campaign" sub="Sent once a creator has a Bounty account, for every campaign. They follow only the global WhatsApp switch in Settings.">
        <div className="mt-acc">
          {ACCOUNT_DRIPS.map((k) => {
            const dr = DRIPS[k];
            const isOpen = openAcc === k;
            return (
              <div key={k} className={`mt-accc ${isOpen ? "is-open" : ""}`}>
                <button type="button" className="mt-acch" onClick={() => setOpenAcc(isOpen ? null : k)} aria-expanded={isOpen}>
                  <b>
                    Drip {k} · {dr.name}
                  </b>
                  <span>
                    {dr.when} · stops when {dr.stops} · {dr.msgs.length} messages {isOpen ? "▴" : "▾"}
                  </span>
                </button>
                {isOpen && <Bubbles drip={dr} vals={vals} onCopy={copy} off={sw.wa_global === false} />}
              </div>
            );
          })}
        </div>
      </Panel>
      {toast}

      <style>{`
        .mt-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .mt-pills .ga-badge { height: 26px; }
        .mt-legend { display: grid; gap: 6px; margin-top: 16px; padding: 12px 14px; border-radius: 12px; background: var(--ad-soft-2); font-size: 12.5px; color: var(--ad-text); line-height: 1.45; }
        .mt-legend b { color: var(--ad-ink); }
        .mt-dot { display: inline-block; width: 8px; height: 8px; border-radius: 99px; margin-right: 4px; vertical-align: 1px; }
        .mt-dot--wa { background: #22c55e; }
        .mt-dot--em { background: #6657e9; }
        .mt-t { margin-top: 18px; }
        .mt-row { cursor: pointer; }
        .mt-row:hover td, .mt-row.is-open td { background: var(--ad-soft-2); }
        .mt-row td { height: 54px; padding-top: 8px; padding-bottom: 8px; }
        .mt-row .ga-badge { height: 24px; }
        .mt-none { font-size: 12px; color: #a3a9b8; }
        .mt-row td.mt-sub { font-size: 12px; color: var(--ad-muted); white-space: normal; }
        .mt-held { text-decoration: line-through; }
        .mt-row td.mt-ck { font-size: 13px; color: var(--ad-ink); }
        .mt-open td { padding: 0 11px 16px; white-space: normal; }
        .mt-open__box { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 16px; padding: 16px; border-radius: 14px; background: var(--ad-soft-2); }
        .mt-open__box em { font-style: normal; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #9aa2b4; }
        .mt-open__box p { margin-top: 6px; font-size: 13px; line-height: 1.5; color: var(--ad-text); white-space: pre-line; }
        .mt-open__box small { display: block; margin-top: 6px; font-size: 11.5px; color: var(--ad-muted); }
        .mt-when { font-size: 12px !important; color: var(--ad-muted) !important; }
        .mt-side { display: grid; gap: 14px; align-content: start; }
        .mt-side > div { padding: 12px 14px; border-radius: 12px; background: #fff; border: 1px solid var(--ad-line); }
        .mt-bub { display: grid; gap: 12px; margin-top: 10px; padding: 14px; border-radius: 14px; background: #efe7dd; }
        .mt-bub.is-off { opacity: .55; filter: grayscale(.4); }
        .mt-msg { max-width: 460px; }
        .mt-msg__when { display: inline-block; margin-bottom: 4px; padding: 2px 8px; border-radius: 99px; background: rgba(0,0,0,.08); font-size: 10.5px; font-weight: 700; color: #5b6478; }
        .mt-msg__b { position: relative; padding: 10px 12px 8px; border-radius: 4px 12px 12px 12px; background: #dcf8c6; font-size: 13px; line-height: 1.5; color: #1f2937; white-space: pre-line; box-shadow: 0 1px 1px rgba(0,0,0,.08); }
        .mt-msg__b mark { padding: 0 2px; border-radius: 3px; background: #fff3c4; color: inherit; }
        .mt-msg__stop { display: block; margin-top: 4px; font-size: 11px; color: #6b7280; }
        .mt-msg__btns { display: grid; gap: 4px; margin-top: 4px; }
        .mt-msg__btns span { padding: 7px; border-radius: 10px; background: #fff; text-align: center; font-size: 12.5px; font-weight: 700; color: #0b84ff; }
        .mt-msg__copy { margin-top: 4px; border: 0; background: none; padding: 0; font-size: 11px; font-weight: 700; color: #6657e9; cursor: pointer; }
        .mt-acc { display: grid; gap: 10px; margin-top: 16px; }
        .mt-accc { border: 1px solid var(--ad-line); border-radius: 12px; padding: 0 14px; }
        .mt-accc.is-open { padding-bottom: 14px; }
        .mt-acch { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; width: 100%; padding: 12px 0; border: 0; background: none; text-align: left; cursor: pointer; }
        .mt-acch b { font-size: 13.5px; color: var(--ad-ink); }
        .mt-acch span { font-size: 12px; color: var(--ad-muted); }
        @media (max-width: 1023px) { .mt-open__box { grid-template-columns: 1fr; } }
      `}</style>
    </AdminShell>
  );
}

/* WhatsApp-style preview of a drip — sample values highlighted */
function Bubbles({ drip, vals, onCopy, off }) {
  return (
    <div className={`mt-bub ${off ? "is-off" : ""}`}>
      {drip.msgs.map((m, j) => (
        <div key={j} className="mt-msg">
          <span className="mt-msg__when">{j === 0 ? `${m.after} after it starts` : `+ ${m.after} later, if not done`}</span>
          <div className="mt-msg__b">
            {fillParts(m.text, vals).map((x, k) => (x.v ? <mark key={k}>{x.t}</mark> : <span key={k}>{x.t}</span>))}
            <small className="mt-msg__stop">Reply STOP to stop all messages</small>
          </div>
          <div className="mt-msg__btns">
            {m.buttons.map((b) => (
              <span key={b}>{b}</span>
            ))}
          </div>
          <button
            type="button"
            className="mt-msg__copy"
            onClick={(ev) => {
              ev.stopPropagation();
              onCopy(fillParts(m.text, vals).map((x) => x.t).join(""));
            }}
          >
            Copy text
          </button>
        </div>
      ))}
    </div>
  );
}
