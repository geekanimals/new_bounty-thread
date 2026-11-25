"use client";

import { useState } from "react";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { useAsk } from "@/components/admin/campaign/journey";
import { fmtDate } from "@/components/admin/campaign/live";

/*
 * ⏰ Video overdue — creator page (api.campaign_video_overdue / video_overdue_mark / video_overdue_clear).
 * Sirf tab dikhta hai jab creator video ka intezaar hai (product / brief mil gaya, video nahi aaya).
 * Apne aap bhi "overdue" (delivery ke 3+ din / due date nikal gayi) — `auto` prop.
 * Video aate hi ye box hat jaata hai (waiting=false).
 */
export const OVERDUE_DAYS = 3;
/** row (buildRows) apne aap overdue? — product delivered 3+ din pehle ya due date nikal gayi, video nahi */
export function autoOverdue(c, deliveredAt = null) {
  if (!c) return false;
  const x = (c.kind === "p" && c.x) || {};
  const today = new Date().toISOString().slice(0, 10);
  if (x.due_on && x.due_on < today) return true;
  // sheet creator: delivered date (bulk "Delivered on" / Move to / apne aap) se
  const d = (x.shipment && x.shipment.delivered_at) || deliveredAt;
  return !!d && Date.now() - new Date(d).getTime() > OVERDUE_DAYS * 86400000;
}

export default function VideoOverdue({ campaignId, row, waiting, deliveredAt = null }) {
  const on = !!campaignId && campaignId !== "sample" && !!row;
  const vo = useRpc("admin", "api.campaign_video_overdue", { p_campaign: campaignId }, { skip: !on });
  const [askEl, ask] = useAsk();
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  if (!on || vo.error || !waiting) return null;
  const list = Array.isArray(vo.data) ? vo.data : [];
  const mark = list.find((m) => (row.kind === "p" ? m.participation_id === row.pid : m.invite_id === row.iid));
  const auto = autoOverdue(row, deliveredAt);

  const doMark = async () => {
    const v = await ask({ title: "Mark video overdue", text: "Team only — the creator isn’t messaged. It stays in Video overdue until their video comes in or you clear it.", ok: "⏰ Mark overdue", fields: [{ k: "note", label: "Note (optional)", placeholder: "e.g. Parcel delivered 20 Nov, no reply on WhatsApp" }] });
    if (!v) return;
    setBusy("m");
    const { error } = await rpc("admin", "api.video_overdue_mark", { p_participation: row.kind === "p" ? row.pid : null, p_invite: row.kind === "p" ? null : row.iid, p_note: String(v.note || "").trim() || null });
    setBusy("");
    if (error) return setMsg("⚠ " + errText(error));
    setMsg("⏰ Marked video overdue");
    vo.reload(true);
  };
  const clear = async () => {
    setBusy("c");
    const { error } = await rpc("admin", "api.video_overdue_clear", { p_id: mark.id });
    setBusy("");
    if (error) return setMsg("⚠ " + errText(error));
    setMsg("Cleared ✓");
    vo.reload(true);
  };

  return (
    <section className={`ga-card vo ${mark || auto ? "is-late" : ""}`}>
      <div className="vo-row">
        <div>
          <h2 className="ga-h2">⏰ Video {mark || auto ? "overdue" : "— waiting"}</h2>
          {mark ? (
            <p className="vo-t">
              Marked {fmtDate(mark.marked_at, true)}
              {mark.marked_by_name ? ` by ${mark.marked_by_name}` : ""}
              {mark.note ? ` — ${mark.note}` : ""}
            </p>
          ) : auto ? (
            <p className="vo-t">Overdue on its own — product delivered {OVERDUE_DAYS}+ days ago (or the due date passed) and no video yet.</p>
          ) : (
            <p className="vo-t">Got the product / brief, no video yet.</p>
          )}
        </div>
        <div className="vo-acts">
          {mark ? (
            <button type="button" className="ga-btn ga-btn--ghost" disabled={!!busy} onClick={clear}>
              {busy === "c" ? "…" : "Clear overdue"}
            </button>
          ) : (
            <button type="button" className="ga-btn ga-btn--ghost" disabled={!!busy} onClick={doMark}>
              {busy === "m" ? "…" : "⏰ Mark video overdue"}
            </button>
          )}
        </div>
      </div>
      {msg && <p className={`vo-msg ${msg.startsWith("⚠") ? "is-bad" : ""}`}>{msg}</p>}
      {askEl}
      <style>{`
        .vo { padding: 14px 20px; margin-top: 14px; }
        .vo.is-late { border-color: #f5c2c2; background: #fff8f8; }
        .vo-row { display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
        .vo-t { margin-top: 4px; font-size: 13px; color: var(--ad-muted); }
        .vo.is-late .vo-t { color: #b42335; }
        .vo-msg { margin-top: 8px; font-size: 12.5px; font-weight: 700; color: #1d7a45; }
        .vo-msg.is-bad { color: var(--ad-red); }
      `}</style>
    </section>
  );
}
