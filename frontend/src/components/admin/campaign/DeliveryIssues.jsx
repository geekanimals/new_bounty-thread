"use client";

import { useState } from "react";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { useAsk } from "@/components/admin/campaign/journey";
import { fmtDate } from "@/components/admin/campaign/live";

/*
 * ⚠ Delivery issues — team only (api.campaign_delivery_issues / delivery_issue_add / delivery_issue_resolve).
 *  - <DeliveryIssues campaignId /> : campaign ke saare khule issues (wrong product, courier lost, damaged, not delivered)
 *  - <DeliveryIssues campaignId only={{ pid }} | {{ iid }} /> : ek creator — "Report a delivery issue" + uske issues
 * Creator ko koi message nahi jaata, step nahi badalta. Resolve karne tak box mein dikhta hai.
 */
const dt = (v) => (v ? fmtDate(v, true) : "—");

export default function DeliveryIssues({ campaignId, only = null, shipped = false, onChanged }) {
  const on = !!campaignId && campaignId !== "sample";
  const di = useRpc("admin", "api.campaign_delivery_issues", { p_campaign: campaignId }, { skip: !on, refreshMs: 60000 });
  const [askEl, ask] = useAsk();
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [showPast, setShowPast] = useState(false);
  const d = di.data || {};
  const all = Array.isArray(d.rows) ? d.rows : [];
  const mine = only ? all.filter((r) => (only.pid && r.participation_id === only.pid) || (only.iid && r.invite_id === only.iid)) : all;
  const pastN = mine.filter((r) => r.status === "resolved").length;
  const rows = showPast ? mine : mine.filter((r) => r.status === "open");
  const types = (d.types || []).map((t) => [t.code, t.label]);
  const who = (r) => (r.handle ? "@" + String(r.handle).replace(/^@/, "") : r.full_name || "creator");

  const run = async (key, fn, args, ok) => {
    setBusy(key);
    const { error } = await rpc("admin", fn, args);
    setBusy("");
    if (error) return setMsg("⚠ " + errText(error));
    setMsg(ok);
    await di.reload(true);
    onChanged && (await onChanged());
  };
  const report = async () => {
    const v = await ask({
      title: "Report a delivery issue",
      text: "Team only — the creator isn’t messaged and their step doesn’t change. It stays in Delivery issues until you mark it resolved.",
      ok: "⚠ Report issue",
      fields: [
        { k: "type", label: "What went wrong?", options: types.length ? types : [["other", "Other"]], required: true },
        { k: "note", label: "Details", area: true, placeholder: "e.g. Got the 100 ml bottle instead of 50 ml · AWB 1234 lost at hub" },
      ],
    });
    if (!v) return;
    if (v.type === "other" && !String(v.note || "").trim()) return setMsg("⚠ Write what went wrong.");
    await run("add", "api.delivery_issue_add", { p_participation: only?.pid || null, p_invite: only?.pid ? null : only?.iid || null, p_type: v.type, p_note: String(v.note || "").trim() || null }, "Delivery issue added ✓ — it stays in Delivery issues until resolved");
  };
  const resolve = async (r) => {
    const v = await ask({ title: `Resolve — ${r.label}`, text: who(r), ok: "✓ Mark resolved", fields: [{ k: "res", label: "How was it fixed? (optional)", placeholder: "e.g. Right product re-shipped, AWB 5678" }] });
    if (!v) return;
    await run("rs:" + r.id, "api.delivery_issue_resolve", { p_id: r.id, p_resolution: String(v.res || "").trim() || null }, "✓ Issue resolved");
  };

  if (!on || di.error) return null;
  // creator page: sirf product nikalne (courier sent / delivered) ke baad — warna box hi nahi
  if (only && !mine.length && !shipped) return null;
  if (!only && !all.length) return null; // campaign page: koi issue nahi to box hi nahi (journey mein "Delivery issue" box 0 dikhata hai)

  return (
    <section className={`ga-card di ${only ? "di--one" : ""}`}>
      <div className="di-head">
        <h2 className="ga-h2">⚠ Delivery issues</h2>
        {!only && d.open > 0 && <span className="di-chip is-bad">{d.open} open</span>}
      </div>
      {!only && <p className="di-sub">Wrong product, lost courier, damage — stays here until someone marks it resolved.</p>}
      {rows.length > 0 && (
        <ul className="di-list">
          {rows.map((r) => (
            <li key={r.id} className={`di-row ${r.status === "resolved" ? "is-done" : ""}`}>
              <div className="di-top">
                {!only && <b>{who(r)}</b>}
                <span className={`di-chip ${r.status === "open" ? "is-bad" : "is-ok"}`}>{r.status === "open" ? `⚠ ${r.label}` : `✓ ${r.label} — resolved`}</span>
              </div>
              {r.note && <p className="di-line">{r.note}</p>}
              <p className="di-mut">
                Reported {dt(r.created_at)}
                {r.created_by_name ? ` by ${r.created_by_name}` : ""}
                {r.status === "resolved" ? ` · resolved ${dt(r.resolved_at)}${r.resolved_by_name ? ` by ${r.resolved_by_name}` : ""}` : ""}
              </p>
              {r.resolution && <p className="di-line"><b>Fix:</b> {r.resolution}</p>}
              {r.status === "open" && (
                <button type="button" className="ga-btn ga-btn--ghost di-btn" disabled={!!busy} onClick={() => resolve(r)}>
                  {busy === "rs:" + r.id ? "…" : "✓ Mark resolved"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!rows.length && mine.length > 0 && <p className="di-mut">No open issues.</p>}
      <div className="di-foot">
        {only && shipped && (
          <button type="button" className="ga-btn ga-btn--ghost" disabled={!!busy} onClick={report}>
            {busy === "add" ? "…" : "⚠ Report a delivery issue"}
          </button>
        )}
        {pastN > 0 && (
          <button type="button" className="di-txt" onClick={() => setShowPast((x) => !x)}>
            {showPast ? "Hide resolved" : `Show resolved (${pastN})`}
          </button>
        )}
      </div>
      {msg && <p className={`di-msg ${msg.startsWith("⚠") ? "is-bad" : ""}`}>{msg}</p>}
      {askEl}
      <style>{`
        .di { padding: 18px 20px; margin-top: 14px; }
        .di-head { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .di-sub { margin-top: 4px; font-size: 12.5px; color: var(--ad-muted); }
        .di-chip { display: inline-block; padding: 2px 9px; border-radius: 999px; background: var(--ad-soft-2, #f2f3f7); font-size: 11.5px; font-weight: 700; }
        .di-chip.is-bad { background: #fdecec; color: #b42335; }
        .di-chip.is-ok { background: #e3f6ea; color: #1d7a45; }
        .di-list { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 10px; }
        .di-row { padding: 12px 14px; border-radius: 12px; border: 1px solid var(--ad-line-2); background: #fff; }
        .di-row.is-done { background: #fafbfc; }
        .di-top { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; font-size: 14px; }
        .di-line { margin-top: 6px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
        .di-mut { margin-top: 4px; font-size: 12px; color: var(--ad-muted); }
        .di-btn { margin-top: 8px; }
        .di-foot { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 10px; }
        .di-foot:empty { display: none; }
        .di-txt { border: 0; background: none; padding: 0; font-size: 12.5px; font-weight: 700; color: var(--ad-primary); cursor: pointer; }
        .di-msg { margin-top: 10px; font-size: 12.5px; font-weight: 700; color: #1d7a45; }
        .di-msg.is-bad { color: var(--ad-red); }
      `}</style>
    </section>
  );
}
