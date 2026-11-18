"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Panel, SubTabs, Note, TableState, useToast } from "@/components/admin/campaign2/kit";
import { useRpc } from "@/lib/supabase";
import { DRIPS } from "@/components/admin/msg/snaptoDrips";

/*
 * 📋 Delivery log — every message we tried to send for this campaign and, when it did not go, why.
 * Data: api.campaign_delivery_log(p_campaign, p_days) → Snapto drip queue (WhatsApp) + ci_outbox (email / WhatsApp).
 * "Sent" for a drip = handed to Snapto; delivered / read is in Snapto → Reports.
 */
const DONE = { join: "joined the campaign", profile: "completed the profile", instagram: "connected Instagram", contract: "signed the contract", address: "confirmed the address", video: "uploaded the video", post: "added the post link" };
const when = (t) => (t ? new Date(t).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

/** one row → { what, status, tone, reason, fix, code } in plain words */
function explain(r) {
  const drip = r.source === "drip";
  const what = drip
    ? r.kind === "done"
      ? `Stop drip — ${DONE[r.drip] || r.drip}`
      : `WhatsApp drip ${r.drip} · ${(DRIPS[r.drip] && DRIPS[r.drip].name) || "drip"}`
    : `${r.channel === "email" ? "Email" : "WhatsApp"} · ${r.title || r.template || "step update"}`;
  const err = String(r.error || "");
  if (r.channel === "whatsapp" && r.phone_ok === false && r.kind !== "done")
    return {
      what,
      code: "bad_number",
      status: "Not delivered",
      tone: "red",
      reason: `${r.to || "This number"} is not a real mobile number — it looks like a date / time (e.g. the sheet's Timestamp column was taken as WhatsApp). ${r.status === "sent" ? "Snapto took it, but WhatsApp rejects it (Meta error 131026 · undeliverable)." : ""}`,
      fix: "Correct the WhatsApp column in the sheet (10-digit mobile) and send the invite again.",
    };
  if (r.opted_out) return { what, code: "opted_out", status: "Not delivered", tone: "red", reason: "The creator replied STOP on WhatsApp — no more messages go to this number.", fix: "Only if they ask again: Messaging & bot → Opted out → Turn back on." };
  if (r.status === "held") return { what, code: "held", status: "Held", tone: "orange", reason: err.replace(/^paused:\s*/i, "") ? `Held — ${err.replace(/^paused:\s*/i, "")}.` : "Held — messages are OFF for this campaign.", fix: "Turn the channel ON in the campaign Overview. Held messages are not sent later." };
  if (r.status === "skipped")
    return {
      what,
      code: /moved past/i.test(err) ? "past_step" : "skipped",
      status: "Skipped",
      tone: "",
      reason: /moved past/i.test(err) ? "Not needed — the creator was already past this step (e.g. already joined)." : err.replace(/^skipped:\s*/i, "") || "Skipped.",
      fix: "",
    };
  if (r.status === "failed") return { what, code: "failed", status: "Failed", tone: "red", reason: err || "Failed to send.", fix: /template|WA_UPDATE/i.test(err) ? "WhatsApp template missing — the drips handle WhatsApp now." : /smtp|email/i.test(err) ? "Check the email settings (SMTP)." : "Retry from Messaging & bot → Retry failed." };
  if (r.status === "stopped") return { what, code: "stopped", status: "Drip stopped", tone: "violet", reason: /stop-bad-number/.test(r.id) ? "Stopped by us — the number was wrong." : `The creator ${DONE[r.drip] || "finished the task"} — the reminders stop.`, fix: "" };
  if (r.status === "queued" || r.status === "sending") return { what, code: "queued", status: "Waiting", tone: "orange", reason: "Waiting to be sent (goes within a minute).", fix: "" };
  return { what, code: "sent", status: drip ? "Sent to Snapto" : "Sent", tone: "green", reason: drip ? "Handed to Snapto — the drip's messages go on its timeline. Delivered / read: Snapto → Reports." : "Sent.", fix: "" };
}

const REASON_TITLE = { bad_number: "Wrong WhatsApp number", opted_out: "Replied STOP", held: "Held — channel OFF", failed: "Failed", skipped: "Skipped", past_step: "Not needed (already past the step)" };

export default function DeliveryLog() {
  const { id } = useParams();
  const [days, setDays] = useState(7);
  const [toast, show] = useToast();
  const { data, error, loading, reload } = useRpc("admin", "api.campaign_delivery_log", { p_campaign: id, p_days: days }, { skip: !id || id === "sample", refreshMs: 60000 });
  const [f, setF] = useState("all");
  const [ch, setCh] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);

  const rows = useMemo(() => ((data && data.rows) || []).map((r) => ({ ...r, x: explain(r) })), [data]);
  const sw = (data && data.switches) || {};
  const bad = (r) => ["bad_number", "opted_out", "held", "failed"].includes(r.x.code);
  const F = {
    all: ["All", () => true],
    sent: ["Sent", (r) => r.x.code === "sent"],
    bad: ["Not delivered", bad],
    queued: ["Waiting", (r) => r.x.code === "queued"],
    stopped: ["Drip stopped / skipped", (r) => ["stopped", "skipped", "past_step"].includes(r.x.code)],
  };
  const cnt = (k) => rows.filter(F[k][1]).length;
  const reasons = useMemo(() => {
    const m = {};
    rows.filter(bad).forEach((r) => {
      const k = r.x.code;
      m[k] = m[k] || { n: 0, fix: r.x.fix, sample: r.x.reason, people: new Set() };
      m[k].n++;
      m[k].people.add(r.who || r.to);
    });
    return Object.entries(m).sort((a, b) => b[1].n - a[1].n);
  }, [rows]);
  const list = rows
    .filter(F[f][1])
    .filter((r) => ch === "all" || r.channel === ch)
    .filter((r) => {
      const t = q.trim().toLowerCase();
      return !t || [r.who, r.handle, r.to, r.x.what, r.error].filter(Boolean).join(" ").toLowerCase().includes(t);
    });
  const shown = list.slice(0, 400);

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <SubTabs
        active="delivery"
        items={[
          { k: "messages", label: "💬 Messages & templates", href: `/vault/campaigns/${id}/messages` },
          { k: "delivery", label: "📋 Delivery log", href: `/vault/campaigns/${id}/delivery` },
          { k: "outreach", label: "✉️ Outreach message", href: `/vault/campaigns/${id}/outreach` },
        ]}
      />

      <Panel
        title="📋 Delivery log — what went, what did not, and why"
        sub="Every WhatsApp (Snapto drip) and email we tried to send for this campaign. Tap a row for the full reason and how to fix it."
        actions={
          <div className="dl-acts">
            <select className="ga-input dl-sel" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Period">
              {[1, 3, 7, 30].map((d) => (
                <option key={d} value={d}>
                  Last {d === 1 ? "24 hours" : `${d} days`}
                </option>
              ))}
            </select>
            <button type="button" className="ga-btn ga-btn--ghost dl-b" onClick={() => reload()}>
              ↻ Refresh
            </button>
          </div>
        }
      >
        {data && (sw.wa === false || sw.wa_global === false) && (
          <Note tone="amber" icon="⏸">
            <b>WhatsApp is OFF</b> {sw.wa_global === false ? "in Settings (all campaigns)" : "for this campaign"} — new drip messages are not sent.
          </Note>
        )}
        <div className="dl-tiles">
          {Object.entries(F).map(([k, [l]]) => (
            <button key={k} type="button" className={`dl-tile ${f === k ? "is-on" : ""} dl-tile--${k}`} onClick={() => setF(k)}>
              <b>{loading && !data ? "…" : cnt(k)}</b>
              <span>{l}</span>
            </button>
          ))}
        </div>

        {reasons.length > 0 && (
          <div className="dl-why">
            <h3>⛔ Why messages did not go</h3>
            {reasons.map(([k, v]) => (
              <button key={k} type="button" className="dl-why__row" onClick={() => (setF("bad"), setQ(""), setOpen(null))}>
                <span className="dl-why__n">{v.n}</span>
                <span className="dl-why__t">
                  <b>
                    {REASON_TITLE[k] || k} · {v.people.size} creator{v.people.size > 1 ? "s" : ""}
                  </b>
                  <small>{v.sample}</small>
                  {v.fix && <small className="dl-fix">👉 {v.fix}</small>}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="dl-bar">
          <input className="ga-input dl-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Name, @handle, number, message…" aria-label="Search" />
          <span className="dl-chs">
            {[["all", "All"], ["whatsapp", "WhatsApp"], ["email", "Email"]].map(([k, l]) => (
              <button key={k} type="button" className={`ga-tab ${ch === k ? "is-on" : ""}`} onClick={() => setCh(k)}>
                {l}
              </button>
            ))}
          </span>
          <span className="dl-mute">
            {list.length} {list.length > shown.length ? `· showing the latest ${shown.length}` : ""} · delivered / read: <a href="https://app.snapto.ai/Reporting/MessageReport" target="_blank" rel="noopener noreferrer">Snapto → Reports</a>
          </span>
        </div>

        <div className="c2-tw">
          <table className="c2-t dl-t">
            <thead>
              <tr>
                <th>When</th>
                <th>Creator</th>
                <th>Message</th>
                <th>To</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              <TableState cols={6} loading={loading && !data} error={!data && error} onRetry={reload} empty={data && !shown.length && "Nothing in this view."} />
              {shown.map((r) => {
                const isOpen = open === r.id;
                return [
                  <tr key={r.id} className={`dl-row ${isOpen ? "is-open" : ""}`} onClick={() => setOpen(isOpen ? null : r.id)}>
                    <td className="dl-mute">{when(r.at)}</td>
                    <td>
                      <b>{r.who || "—"}</b>
                      {r.handle && <small className="dl-sub">@{String(r.handle).replace(/^@/, "")}</small>}
                    </td>
                    <td>{r.x.what}</td>
                    <td className={r.channel === "whatsapp" && r.phone_ok === false ? "dl-badnum" : "dl-mute"}>{r.to || "—"}</td>
                    <td>
                      <span className={`ga-badge ga-badge--${r.x.tone}`}>{r.x.status}</span>
                    </td>
                    <td className="dl-reason">{r.x.reason}</td>
                  </tr>,
                  isOpen && (
                    <tr key={`${r.id}o`} className="dl-open">
                      <td colSpan={6}>
                        <div className="dl-box">
                          <div>
                            <em>What happened</em>
                            <p>{r.x.reason}</p>
                            {r.x.fix && <p className="dl-fix">👉 {r.x.fix}</p>}
                            {r.error && (
                              <>
                                <em>Raw error</em>
                                <code>{r.error}</code>
                              </>
                            )}
                          </div>
                          <div>
                            <em>Details</em>
                            <dl>
                              <dt>Channel</dt>
                              <dd>{r.source === "drip" ? "WhatsApp · Snapto drip" : r.channel === "email" ? "Email" : "WhatsApp"}</dd>
                              <dt>To</dt>
                              <dd>{r.to || "—"}</dd>
                              <dt>Created</dt>
                              <dd>{when(r.at)}</dd>
                              <dt>Sent</dt>
                              <dd>{when(r.sent_at)}</dd>
                              <dt>Tries</dt>
                              <dd>{r.tries ?? "—"}</dd>
                              {r.attrs && Object.keys(r.attrs).length > 0 && (
                                <>
                                  <dt>Values sent</dt>
                                  <dd>
                                    {Object.entries(r.attrs)
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(" · ")}
                                  </dd>
                                </>
                              )}
                            </dl>
                            <div className="dl-links">
                              {r.member_id && (
                                <Link href={`/vault/creators/${r.member_id}/profile`} className="ga-btn ga-btn--ghost ga-btn--sm" onClick={(e) => e.stopPropagation()}>
                                  👤 Open creator
                                </Link>
                              )}
                              <button
                                type="button"
                                className="ga-btn ga-btn--ghost ga-btn--sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try { await navigator.clipboard.writeText([r.who, r.to, r.x.what, r.x.status, r.x.reason, r.error].filter(Boolean).join(" · ")); } catch {}
                                  show("Copied ✓");
                                }}
                              >
                                Copy details
                              </button>
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
      {toast}

      <style>{`
        .dl-acts { display: flex; gap: 8px; align-items: center; }
        .dl-sel { height: 36px; padding: 0 10px; width: auto; }
        .dl-b { height: 36px; padding: 0 12px; }
        .dl-tiles { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin-top: 18px; }
        .dl-tile { display: flex; flex-direction: column; align-items: flex-start; padding: 14px; border-radius: 14px; border: 1px solid var(--ad-line); background: #fff; text-align: left; cursor: pointer; }
        .dl-tile b { font-family: var(--ad-head); font-size: 24px; color: var(--ad-ink); }
        .dl-tile span { margin-top: 4px; font-size: 12px; color: var(--ad-muted); }
        .dl-tile.is-on { border-color: #6657e9; box-shadow: 0 0 0 2px rgba(103,87,245,.15); }
        .dl-tile--bad b { color: #dc2626; }
        .dl-tile--sent b { color: #16a34a; }
        .dl-why { margin-top: 16px; padding: 14px; border-radius: 14px; border: 1px solid #f5c9d0; background: #fff5f6; }
        .dl-why h3 { font-size: 14px; font-weight: 800; color: #b42335; }
        .dl-why__row { display: flex; gap: 12px; width: 100%; margin-top: 10px; padding: 10px 12px; border: 0; border-radius: 12px; background: #fff; text-align: left; cursor: pointer; }
        .dl-why__n { min-width: 42px; font-family: var(--ad-head); font-size: 20px; font-weight: 800; color: #dc2626; }
        .dl-why__t b { display: block; font-size: 13px; color: var(--ad-ink); }
        .dl-why__t small { display: block; margin-top: 3px; font-size: 12px; color: var(--ad-muted); line-height: 1.45; }
        .dl-fix { color: #8a5a00 !important; font-weight: 600; }
        .dl-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 18px; }
        .dl-q { width: 280px; height: 38px; }
        .dl-chs { display: flex; gap: 6px; }
        .dl-chs .ga-tab { height: 34px; }
        .dl-mute { font-size: 12px; color: var(--ad-muted); }
        .dl-t { margin-top: 12px; }
        .dl-row { cursor: pointer; }
        .dl-row:hover td, .dl-row.is-open td { background: var(--ad-soft-2); }
        .dl-row td { vertical-align: top; padding-top: 10px; padding-bottom: 10px; font-size: 12.5px; }
        .dl-sub { display: block; font-size: 11px; color: var(--ad-muted); }
        .dl-badnum { color: #dc2626; font-weight: 700; font-size: 12px; }
        .dl-reason { white-space: normal; min-width: 260px; max-width: 420px; color: var(--ad-text); }
        .dl-open td { padding: 0 11px 14px; white-space: normal; }
        .dl-box { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 14px; border-radius: 12px; background: var(--ad-soft-2); }
        .dl-box em { display: block; margin-top: 8px; font-style: normal; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #9aa2b4; }
        .dl-box p { margin-top: 4px; font-size: 13px; line-height: 1.5; }
        .dl-box code { display: block; margin-top: 4px; padding: 8px 10px; border-radius: 8px; background: #fff; font-size: 12px; color: #b42335; white-space: pre-wrap; word-break: break-word; }
        .dl-box dl { display: grid; grid-template-columns: 90px 1fr; gap: 4px 10px; margin-top: 6px; font-size: 12.5px; }
        .dl-box dt { color: var(--ad-muted); }
        .dl-box dd { color: var(--ad-ink); word-break: break-word; }
        .dl-links { display: flex; gap: 8px; margin-top: 10px; }
        @media (max-width: 900px) { .dl-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } .dl-box { grid-template-columns: 1fr; } }
      `}</style>
    </AdminShell>
  );
}
