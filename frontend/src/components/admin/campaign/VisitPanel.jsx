"use client";

import { useMemo, useState } from "react";
import { rpc, useRpc, errText } from "@/lib/supabase";
/* Physical visit — kaun kab aayega (date + slot) · Visited / Missed */
export default function VisitPanel({ campaignId, all, V: V0, reload: reload0, venues = [] }) {
  // khud bhi chal sakta hai (Fulfilment page) — tab visit_list yahin se aata hai
  const own = useRpc("admin", "api.visit_list", { p_campaign: campaignId }, { skip: !campaignId || !!V0 });
  const V = useMemo(() => {
    if (V0) return V0;
    const m = { i: {}, p: {} };
    (Array.isArray(own.data) ? own.data : []).forEach((v) => {
      if (v.invite_id) m.i[v.invite_id] = v;
      if (v.participation_id) m.p[v.participation_id] = v;
    });
    return m;
  }, [V0, own.data]);
  const reload = reload0 || (() => own.reload(true));
  const base = all || (Array.isArray(own.data) ? own.data : []).map((v) => ({ id: v.participation_id || v.invite_id, pid: v.participation_id, iid: v.participation_id ? null : v.invite_id, name: v.name || v.handle || "Creator", handle: v.handle ? "@" + v.handle : "" }));
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const list = base
    .filter((c) => !c.failed)
    .map((c) => ({ c, v: (c.pid && V.p[c.pid]) || (c.iid && V.i[c.iid]) || null }))
    .sort((a, b) => String((a.v && a.v.visit_on) || "9999").localeCompare(String((b.v && b.v.visit_on) || "9999")) || String((a.v && a.v.slot) || "").localeCompare(String((b.v && b.v.slot) || "")));
  const set = async (row, state, extra = {}) => {
    setBusy(row.c.id + state);
    setMsg("");
    const { error } = await rpc("admin", "api.visit_set", { p_campaign: campaignId, p_invite: row.c.pid ? null : row.c.iid || null, p_participation: row.c.pid || null, p_state: state, p_on: extra.on || null, p_slot: extra.slot || null, p_note: null });
    setBusy("");
    if (error) return setMsg(errText(error));
    setEdit(null);
    setMsg(state === "visited" ? `✓ ${row.c.name} marked visited` : state === "missed" ? `${row.c.name} marked missed — set a new date` : `✓ Visit saved for ${row.c.name}`);
    reload();
  };
  const fd = (d) => (d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "No date yet");
  const booked = list.filter((x) => x.v && x.v.visit_on).length;
  const done = list.filter((x) => x.v && x.v.visited_at).length;
  return (
    <section className="ga-card wcr-card vp">
      <div className="vp-head">
        <div>
          <h2 className="ga-h2">📍 Visits</h2>
          <p className="wcr-sub">
            {booked} booked · {done} visited{venues[0] && venues[0].name ? ` · ${venues[0].name}` : ""} — no message goes to the creator from here.
          </p>
        </div>
      </div>
      {msg && <p className="vp-msg">{msg}</p>}
      <div className="vp-list">
        {list.map((row) => {
          const v = row.v || {};
          const st = v.visited_at ? "visited" : v.missed_at ? "missed" : v.visit_on ? "booked" : "none";
          const ed = edit && edit.id === row.c.id;
          return (
            <div key={row.c.id} className={`vp-row vp-row--${st}`}>
              <div className="vp-who">
                <b>{row.c.name}</b>
                <span>{row.c.handle}</span>
              </div>
              {ed ? (
                <div className="vp-edit">
                  <input type="date" className="ga-input" value={edit.on} onChange={(e) => setEdit({ ...edit, on: e.target.value })} aria-label="Visit date" />
                  <input className="ga-input" value={edit.slot} onChange={(e) => setEdit({ ...edit, slot: e.target.value })} placeholder="e.g. Dinner 7:30 PM" aria-label="Slot" />
                  <button type="button" className="ga-btn ga-btn--primary" disabled={!edit.on || !!busy} onClick={() => set(row, "booked", { on: edit.on, slot: edit.slot })}>
                    Save
                  </button>
                  <button type="button" className="ga-btn" onClick={() => setEdit(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="vp-when">
                  <b>{fd(v.visit_on)}</b>
                  <span>{v.slot || v.note || ""}</span>
                </div>
              )}
              <span className={`vp-chip vp-chip--${st}`}>{st === "visited" ? "✓ Visited" : st === "missed" ? "Missed" : st === "booked" ? "Booked" : "Not booked"}</span>
              {!ed && (
                <div className="vp-acts">
                  <button type="button" className="ga-btn" onClick={() => setEdit({ id: row.c.id, on: v.visit_on || "", slot: v.slot || "" })}>
                    {v.visit_on ? "Change" : "Book visit"}
                  </button>
                  {v.visit_on && !v.visited_at && (
                    <button type="button" className="ga-btn ga-btn--primary" disabled={!!busy} onClick={() => set(row, "visited")}>
                      Visited
                    </button>
                  )}
                  {v.visit_on && !v.visited_at && !v.missed_at && (
                    <button type="button" className="ga-btn" disabled={!!busy} onClick={() => set(row, "missed")}>
                      Missed
                    </button>
                  )}
                  {v.visited_at && (
                    <button type="button" className="ga-btn" disabled={!!busy} onClick={() => set(row, "booked")}>
                      Undo
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {!list.length && <p className="wcr-sub">No creators yet.</p>}
      </div>
      <style>{`
        .vp { margin-top: 18px; }
        .vp-msg { margin: 8px 0 0; font-size: 13px; font-weight: 600; color: #4b3fd6; }
        .vp-list { display: grid; gap: 8px; margin-top: 12px; }
        .vp-row { display: grid; grid-template-columns: minmax(150px, 1.2fr) minmax(170px, 1.4fr) auto auto; gap: 12px; align-items: center; padding: 10px 12px; border: 1px solid var(--ad-line); border-radius: 12px; background: #fff; }
        .vp-who, .vp-when { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .vp-who b, .vp-when b { font-size: 14px; color: var(--ad-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-who span, .vp-when span { font-size: 12.5px; color: var(--ad-muted, #6b7280); }
        .vp-edit { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .vp-edit .ga-input { width: auto; min-width: 140px; }
        .vp-chip { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #eef0f5; color: #4b5563; white-space: nowrap; }
        .vp-chip--booked { background: #fff4dc; color: #a16207; }
        .vp-chip--visited { background: #dcf5e7; color: #15803d; }
        .vp-chip--missed { background: #fde2e2; color: #b91c1c; }
        .vp-acts { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        @media (max-width: 860px) { .vp-row { grid-template-columns: 1fr 1fr; } .vp-acts { justify-content: flex-start; } }
      `}</style>
    </section>
  );
}
