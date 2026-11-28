"use client";

import { useState } from "react";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { useAsk } from "@/components/admin/campaign/journey";
import { fmtDate } from "@/components/admin/campaign/live";

/*
 * 🚪 Backouts & returns — team side (api.campaign_backouts / backout_create / backout_decide /
 * backout_mark_shipped / backout_mark_returned / set_campaign_return_address).
 *  - <Backouts campaignId /> : poore campaign ki list (creators page ke upar) + default return address
 *  - <Backouts campaignId only={{ pid }} | {{ iid }} row /> : ek creator (creator detail page) — "on their behalf" request bhi
 * Approve karte hi creator campaign se hat jata hai (stage dropped / sheet row delete). Courier cost ki baat sirf note mein.
 */
const ST = {
  requested: ["⏳ Waiting for decision", "is-warn"],
  approved: ["📦 Waiting for the product — still on campaign", "is-info"],
  shipped: ["🚚 Return on the way", "is-info"],
  returned: ["✅ Product returned", "is-ok"],
  declined: ["Declined — still on campaign", ""],
};
const STEP_TXT = {
  applied: "Applied", eligible: "Screened", sent_to_brand: "Sent to brand", brand_confirmed: "Approved", accepted: "Approved", contract_sent: "Contract sent",
  contract_signed: "Contract signed", address_confirmed: "Address confirmed", product_sent: "Courier sent", content_created: "Video brief sent",
  content_submitted: "Video submitted", changes_requested: "Changes asked", content_approved: "Client approved", registered: "Applied", approved: "Approved",
  courier_sent: "Courier sent", courier_delivered: "Courier delivered", video_brief_sent: "Video brief sent", video_submitted: "Video submitted", client_approved: "Client approved",
};
const dt = (v) => (v ? fmtDate(v, true) : "—");

export default function Backouts({ campaignId, only = null, row = null, onChanged, foldable = false }) {
  const [foldOpen, setFoldOpen] = useState(false); // campaign page: band aata hai, header tap = khule
  const on = !!campaignId && campaignId !== "sample";
  const bo = useRpc("admin", "api.campaign_backouts", { p_campaign: campaignId }, { skip: !on, refreshMs: 60000 });
  const [askEl, ask] = useAsk();
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const d = bo.data || {};
  const all = Array.isArray(d.rows) ? d.rows : [];
  const mineRows = only ? all.filter((r) => (only.pid && r.participation_id === only.pid) || (only.iid && r.invite_id === only.iid)) : all;
  // campaign board: chalu wale hamesha; khatam (returned / backed out / declined) "Show past" ke peeche
  const isDone = (r) => r.status === "returned" || r.status === "declined" || (r.kind === "withdraw" && r.status === "approved");
  const [showPast, setShowPast] = useState(false);
  const pastN = only ? 0 : mineRows.filter(isDone).length;
  const rows = only || showPast ? mineRows : mineRows.filter((r) => !isDone(r));
  const c = d.counts || {};
  const reasons = (d.reasons || []).map((r) => [r.code, r.label]);
  const openReq = rows.find((r) => r.status === "requested");
  const who = (r) => (r.handle ? "@" + r.handle : r.full_name || "creator");
  // barter / barter+paid → "Backouts & returns"; paid / visit → sirf "Backout"
  const product = ["barter", "barter_paid"].includes(d.campaign_kind || "barter");
  const stOf = (r) => (r.kind === "withdraw" && r.status === "approved" ? ["✓ Backed out — removed from campaign", "is-ok"] : r.status === "returned" ? ["✅ Product returned — removed from campaign", "is-ok"] : ST[r.status] || [r.status, ""]);

  const run = async (key, fn, args, ok) => {
    setBusy(key);
    const { error } = await rpc("admin", fn, args);
    setBusy("");
    if (error) {
      setMsg("⚠ " + errText(error));
      return false;
    }
    setMsg(ok);
    await bo.reload(true);
    onChanged && (await onChanged());
    return true;
  };

  const create = async () => {
    const v = await ask({
      title: "Backout request for this creator",
      text: "Use this when the creator told you on call / WhatsApp that they can’t continue. You can approve it right after.",
      ok: "Create request",
      fields: [
        { k: "code", label: "Reason", options: reasons.length ? reasons : [["other", "Other"]], required: true },
        { k: "note", label: "What did they say?", area: true, placeholder: "e.g. Moving city next week, can’t shoot" },
      ],
    });
    if (!v) return;
    if (v.code === "other" && !String(v.note || "").trim()) return setMsg("⚠ Write the reason.");
    await run("create", "api.backout_create", { p_participation: only?.pid || null, p_invite: only?.pid ? null : only?.iid || null, p_reason_code: v.code, p_note: String(v.note || "").trim() || null }, "🚪 Request created — approve or decline it below");
  };

  const approve = async (r) => {
    const ret = r.kind === "return";
    const v = await ask({
      title: ret ? `Approve ${who(r)}’s backout — product comes back` : `Approve ${who(r)}’s backout`,
      text: ret
        ? `${who(r)} gets the return address now and stays on the campaign until you mark the product received — then they’re removed automatically. Write anything about courier charges in the note — the system message never mentions cost.`
        : `${who(r)} will be removed from the campaign right away.`,
      ok: ret ? "✅ Approve & send address" : "✅ Approve & remove",
      danger: !ret,
      fields: ret
        ? [
            { k: "addr", label: "Return address", area: true, required: true, value: d.return_address || "", placeholder: "Name, full address, pin code, phone" },
            { k: "save", label: "Save as this campaign’s default return address?", options: [["yes", "Yes — use it next time too"], ["no", "No — only for this creator"]], value: d.return_address ? "no" : "yes" },
            { k: "days", label: "Days to send it back", type: "number", value: "7" },
            { k: "note", label: "Note to the creator (optional)", area: true, placeholder: "e.g. Courier charges will be reimbursed — share the receipt" },
          ]
        : [{ k: "note", label: "Note to the creator (optional)", area: true }],
      preview: ret
        ? (x) => (
            <>
              <b>Creator gets (app + email)</b>
              Your backout request has been approved. Please send the product back by{" "}
              {fmtDate(new Date(Date.now() + 86400000 * (Number(x.days) || 7)), true)} to: {x.addr || "…"}
              {x.note ? ` — Note from the team: ${x.note}` : ""}
            </>
          )
        : null,
    });
    if (!v) return;
    await run(
      "ap:" + r.id,
      "api.backout_decide",
      { p_id: r.id, p_approve: true, p_address: ret ? String(v.addr || "").trim() : null, p_note: String(v.note || "").trim() || null, p_days: Number(v.days) || 7, p_save_default: ret && v.save === "yes" },
      ret ? `✅ Approved — ${who(r)} told where to send the product. They leave the campaign once you mark it received.` : `✅ Approved — ${who(r)} removed from the campaign`
    );
  };
  const decline = async (r) => {
    const v = await ask({ title: `Decline — ${who(r)} stays on the campaign`, ok: "Decline", fields: [{ k: "note", label: "Message to the creator (optional)", area: true, placeholder: "e.g. Your courier is already on the way — please continue" }] });
    if (!v) return;
    await run("dc:" + r.id, "api.backout_decide", { p_id: r.id, p_approve: false, p_note: String(v.note || "").trim() || null }, `${who(r)} stays on the campaign — they were told`);
  };
  const shipped = async (r) => {
    const v = await ask({
      title: `${who(r)} sent the product back`,
      ok: "Save",
      fields: [
        { k: "courier", label: "Courier", required: true, value: r.courier || "" },
        { k: "tracking", label: "Tracking number", required: true, value: r.tracking || "" },
        { k: "url", label: "Tracking link (optional)", value: r.tracking_url || "", placeholder: "https://" },
      ],
    });
    if (!v) return;
    await run("sh:" + r.id, "api.backout_mark_shipped", { p_id: r.id, p_courier: v.courier.trim(), p_tracking: v.tracking.trim(), p_url: String(v.url || "").trim() || null }, "🚚 Return shipment saved");
  };
  const returned = async (r) => {
    const v = await ask({ title: `Product received back from ${who(r)}?`, text: `${who(r)} will be removed from the campaign now.`, ok: "📦 Mark received", fields: [{ k: "note", label: "Condition / note (team only, optional)", placeholder: "e.g. Box sealed, all items ok" }] });
    if (!v) return;
    await run("rt:" + r.id, "api.backout_mark_returned", { p_id: r.id, p_note: String(v.note || "").trim() || null }, `📦 Product received — ${who(r)} removed from the campaign`);
  };
  const editAddr = async () => {
    const v = await ask({ title: "Default return address", text: "Pre-filled every time you approve a return on this campaign. You can still change it per creator.", ok: "Save", fields: [{ k: "addr", label: "Address", area: true, value: d.return_address || "", placeholder: "Name, full address, pin code, phone" }] });
    if (!v) return;
    await run("addr", "api.set_campaign_return_address", { p_campaign: campaignId, p_address: String(v.addr || "").trim() }, "Default return address saved ✓");
  };

  if (!on || bo.error) return null;
  // ek creator ke page par: kuch nahi hai aur request ban bhi nahi sakti (post live / bahar) → kuch mat dikhao
  // post live / done → backout nahi (sirf Delete); server bhi rokta hai
  const posted = !!row && (!!row.posted || (row.kind === "p" ? ["published", "completed"].includes(row.x?.stage) || (row.x?.posts || []).length > 0 : row.i?.status === "posted" || (row.i?.post_links || []).length > 0));
  const canCreate = only && row && !posted && !openReq && !rows.some((r) => ["approved", "shipped"].includes(r.status)) && !row.failed;
  if (only && !mineRows.length && !canCreate) return null;

  return (
    <section className={`ga-card bk ${only ? "bk--one" : ""}`}>
      <div className={`bk-head${foldable ? " is-fold" : ""}`} onClick={foldable ? () => setFoldOpen((o) => !o) : undefined} role={foldable ? "button" : undefined} aria-expanded={foldable ? foldOpen : undefined}>
        <div>
          <h2 className="ga-h2">🚪 {product ? (only ? "Backout / return" : "Backouts & returns") : only ? "Backout" : "Backouts"}</h2>
          {!only && (
            <p className="bk-sub">
              {product
                ? "Creators who asked to back out before posting. If the product went out, they stay here (and on the campaign) until you mark it received — then they’re removed. Otherwise approving removes them."
                : "Creators who asked to back out before posting. Approving removes them from the campaign."}
            </p>
          )}
        </div>
        {!only && (
          <div className="bk-chips">
            {c.requested > 0 && <span className="bk-chip is-warn">{c.requested} waiting</span>}
            {c.to_return > 0 && <span className="bk-chip is-info">{c.to_return} to come back</span>}
            {c.overdue > 0 && <span className="bk-chip is-bad">{c.overdue} overdue</span>}
            {c.shipped > 0 && <span className="bk-chip is-info">{c.shipped} on the way</span>}
            {c.returned > 0 && <span className="bk-chip is-ok">{c.returned} returned</span>}
          </div>
        )}
      </div>
      {(!foldable || foldOpen) && (
        <>

      {!only && product && (
        <p className="bk-addr">
          <span>Default return address:</span> {d.return_address ? <b>{d.return_address}</b> : <i>not set</i>}{" "}
          <button type="button" className="bk-txt" disabled={busy === "addr"} onClick={editAddr}>
            {d.return_address ? "Edit" : "Add"}
          </button>
        </p>
      )}

      {!mineRows.length && !only && <p className="bk-none">No backout requests on this campaign.</p>}
      {!rows.length && !only && pastN > 0 && <p className="bk-none">Nothing open right now.</p>}

      {rows.length > 0 && (
        <ul className="bk-list">
          {rows.map((r) => {
            const [stl, stc] = stOf(r);
            return (
              <li key={r.id} className="bk-row">
                <div className="bk-top">
                  <b>{who(r)}</b>
                  {r.full_name && r.handle ? <span className="bk-mut"> · {r.full_name}</span> : null}
                  <span className={`bk-chip ${r.kind === "return" ? "is-info" : ""}`}>{r.kind === "return" ? "Backout · return product" : "Backout"}</span>
                  <span className={`bk-chip ${stc}`}>{stl}</span>
                  {r.overdue && <span className="bk-chip is-bad">Overdue since {dt(r.return_by)}</span>}
                </div>
                <p className="bk-line">
                  <b>Reason:</b> {r.reason_label}
                  {r.reason_note ? ` — “${r.reason_note}”` : ""}
                </p>
                <p className="bk-mut">
                  Asked {dt(r.created_at)} {r.requested_via === "team" ? `by the team${r.requested_by_name ? ` (${r.requested_by_name})` : ""}` : "by the creator in the app"}
                  {r.prev_stage ? ` · was at ${STEP_TXT[r.prev_stage] || r.prev_stage.replace(/_/g, " ")}` : ""}
                  {r.decided_at ? ` · ${r.status === "declined" ? "declined" : "approved"} ${dt(r.decided_at)}${r.decided_by_name ? ` by ${r.decided_by_name}` : ""}` : ""}
                </p>
                <p className="bk-mut">
                  {!r.phone && !r.email ? "No phone or email saved" : null}
                  {r.phone ? (
                    <a href={`https://wa.me/${String(r.phone).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                      💬 {r.phone}
                    </a>
                  ) : null}
                  {r.email ? <>{r.phone ? " · " : ""}✉ {r.email}</> : null}
                  {!r.has_app ? " · not on the app — tell them on WhatsApp" : ""}
                </p>
                {r.return_address && (
                  <p className="bk-line">
                    <b>Return to:</b> {r.return_address} {r.return_by ? <> · <b>by {dt(r.return_by)}</b></> : null}
                    {r.reminded_at ? <span className="bk-mut"> · reminder sent {dt(r.reminded_at)}</span> : null}
                  </p>
                )}
                {r.admin_note && <p className="bk-line"><b>Note sent:</b> {r.admin_note}</p>}
                {r.decline_note && <p className="bk-line"><b>Decline message:</b> {r.decline_note}</p>}
                {r.courier && (
                  <p className="bk-line">
                    <b>Sent back:</b> {r.courier} · {r.tracking} {r.shipped_at ? `· ${dt(r.shipped_at)}` : ""}{" "}
                    {r.tracking_url && (
                      <a href={r.tracking_url} target="_blank" rel="noopener noreferrer">
                        Track ↗
                      </a>
                    )}
                  </p>
                )}
                {r.status === "returned" && (
                  <p className="bk-line">
                    <b>Received:</b> {dt(r.returned_at)}
                    {r.returned_note ? ` — ${r.returned_note}` : ""}
                  </p>
                )}
                <div className="bk-acts">
                  {r.status === "requested" && (
                    <>
                      <button type="button" className="ga-btn ga-btn--primary" disabled={!!busy} onClick={() => approve(r)}>
                        {busy === "ap:" + r.id ? "…" : "✅ Approve"}
                      </button>
                      <button type="button" className="ga-btn ga-btn--ghost" disabled={!!busy} onClick={() => decline(r)}>
                        {busy === "dc:" + r.id ? "…" : "✗ Decline"}
                      </button>
                    </>
                  )}
                  {r.kind === "return" && r.status === "approved" && (
                    <button type="button" className="ga-btn ga-btn--ghost" disabled={!!busy} onClick={() => shipped(r)}>
                      {busy === "sh:" + r.id ? "…" : "🚚 They sent it — add tracking"}
                    </button>
                  )}
                  {r.kind === "return" && ["approved", "shipped"].includes(r.status) && (
                    <button type="button" className="ga-btn ga-btn--primary" disabled={!!busy} onClick={() => returned(r)}>
                      {busy === "rt:" + r.id ? "…" : "📦 Product received"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pastN > 0 && (
        <button type="button" className="bk-txt bk-past" onClick={() => setShowPast((v) => !v)}>
          {showPast ? "Hide finished" : `Show finished (${pastN})`}
        </button>
      )}

      {canCreate && (
        <div className="bk-new">
          <button type="button" className="ga-btn ga-btn--ghost" disabled={!!busy} onClick={create}>
            {busy === "create" ? "…" : "🚪 Creator wants to leave — create request"}
          </button>
          <span className="bk-mut">Only before the post is live. After posting, use Delete instead.</span>
        </div>
      )}

      {msg && <p className={`bk-msg ${msg.startsWith("⚠") ? "is-bad" : ""}`}>{msg}</p>}
      {askEl}
        </>
      )}
     <style>{`
        .bk { padding: 18px 20px; margin-top: 14px; }
        .bk-head { display: flex; gap: 12px; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; }
        .bk-sub { margin-top: 4px; font-size: 12.5px; color: var(--ad-muted); }
        .bk-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .bk-chip { display: inline-block; margin-left: 6px; padding: 2px 9px; border-radius: 999px; background: var(--ad-soft-2, #f2f3f7); font-size: 11.5px; font-weight: 700; color: var(--ad-text); }
        .bk-chips .bk-chip { margin-left: 0; }
        .bk-chip.is-warn { background: #fff4d6; color: #8a5d14; }
        .bk-chip.is-info { background: #e7f0ff; color: #2650a8; }
        .bk-chip.is-ok { background: #e3f6ea; color: #1d7a45; }
        .bk-chip.is-bad { background: #fdecec; color: #b42335; }
        .bk-addr { margin-top: 10px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
        .bk-addr span { color: var(--ad-muted); }
        .bk-txt { border: 0; background: none; padding: 0; font-weight: 700; color: var(--ad-primary); cursor: pointer; }
        .bk-past { margin-top: 10px; font-size: 12.5px; }
        .bk-none { margin-top: 10px; font-size: 13px; color: var(--ad-muted); }
        .bk-list { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 10px; }
        .bk-row { padding: 12px 14px; border-radius: 12px; border: 1px solid var(--ad-line-2); background: #fff; }
        .bk-top { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; font-size: 14px; }
        .bk-line { margin-top: 6px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
        .bk-mut { margin-top: 4px; font-size: 12px; color: var(--ad-muted); }
        .bk-mut a, .bk-line a { font-weight: 700; color: var(--ad-primary); }
        .bk-acts { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .bk-acts:empty { display: none; }
        .bk-new { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 12px; }
        .bk--one .bk-new { margin-top: 8px; }
        .bk-msg { margin-top: 10px; font-size: 12.5px; font-weight: 700; color: #1d7a45; }
        .bk-msg.is-bad { color: var(--ad-red); }
      
        .bk-head.is-fold { cursor: pointer; position: relative; padding-right: 34px; }
        .bk-head.is-fold::after { content: "▾"; position: absolute; right: 6px; top: 4px; font-size: 16px; color: #6b6f99; }
        .bk-head.is-fold[aria-expanded="true"]::after { content: "▴"; }
      `}</style>
    </section>
  );
}
