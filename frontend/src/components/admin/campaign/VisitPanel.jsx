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
  const missed = list.filter((x) => x.v && x.v.missed_at).length;
  const today = new Date().toISOString().slice(0, 10);
  const todayN = list.filter((x) => x.v && x.v.visit_on === today && !x.v.visited_at).length;
  // din + slot ke hisaab se groups (ek slot ke saare creators ek saath)
  const groups = [];
  list.forEach((row) => {
    const v = row.v || {};
    const k = `${v.visit_on || "zz"}|${v.slot || ""}`;
    let g = groups.find((x) => x.k === k);
    if (!g) groups.push((g = { k, on: v.visit_on, slot: v.slot, rows: [] }));
    g.rows.push(row);
  });
  return (
    <section className="vp">
      <div className="vp-head">
        <div>
          <h2>📍 Visits</h2>
          <p>
            {venues[0] && venues[0].name ? `${venues[0].name} · ` : ""}Mark each creator after their slot. Nothing here messages the creator.
          </p>
        </div>
        <div className="vp-stats">
          <span>
            <b>{booked}</b> booked
          </span>
          <span className="is-today">
            <b>{todayN}</b> today
          </span>
          <span className="is-ok">
            <b>{done}</b> visited
          </span>
          <span className="is-no">
            <b>{missed}</b> missed
          </span>
        </div>
      </div>
      {msg && <p className="vp-msg">{msg}</p>}
      {groups.map((g) => (
        <div key={g.k} className={`vp-group ${g.on === today ? "is-today" : ""}`}>
          <div className="vp-ghead">
            <b>{g.on ? fd(g.on) : "No date yet"}</b>
            {g.slot && <span>{g.slot}</span>}
            {g.on === today && <em>Today</em>}
            <small>
              {g.rows.length} creator{g.rows.length > 1 ? "s" : ""}
            </small>
          </div>
          {g.rows.map((row) => {
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
                    <button type="button" className="vp-b vp-b--main" disabled={!edit.on || !!busy} onClick={() => set(row, "booked", { on: edit.on, slot: edit.slot })}>
                      Save
                    </button>
                    <button type="button" className="vp-b" onClick={() => setEdit(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="vp-acts">
                    <span className={`vp-chip vp-chip--${st}`}>{st === "visited" ? "✓ Visited" : st === "missed" ? "Missed" : st === "booked" ? "Booked" : "Not booked"}</span>
                    {v.visit_on && !v.visited_at && (
                      <button type="button" className="vp-b vp-b--main" disabled={!!busy} onClick={() => set(row, "visited")}>
                        Visited
                      </button>
                    )}
                    {v.visit_on && !v.visited_at && !v.missed_at && (
                      <button type="button" className="vp-b" disabled={!!busy} onClick={() => set(row, "missed")}>
                        Missed
                      </button>
                    )}
                    {v.visited_at && (
                      <button type="button" className="vp-b" disabled={!!busy} onClick={() => set(row, "booked")}>
                        Undo
                      </button>
                    )}
                    <button type="button" className="vp-b vp-b--link" onClick={() => setEdit({ id: row.c.id, on: v.visit_on || "", slot: v.slot || "" })}>
                      {v.visit_on ? "Change" : "Book visit"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      {!list.length && <p className="vp-empty">No creators yet.</p>}
      <style>{`
        .vp { margin-top: 18px; padding: 20px 22px 18px; border-radius: 18px; border: 1px solid var(--ad-line, #e6e8f0); background: #fff; }
        .vp-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
        .vp-head h2 { margin: 0; font-family: var(--ad-head); font-size: 20px; font-weight: 800; color: var(--ad-ink); }
        .vp-head p { margin: 4px 0 0; font-size: 13px; color: var(--ad-muted, #7a8099); }
        .vp-stats { display: flex; gap: 8px; flex-wrap: wrap; }
        .vp-stats span { padding: 6px 12px; border-radius: 10px; background: #f4f5fa; font-size: 12.5px; color: #4b5563; }
        .vp-stats b { font-size: 15px; color: var(--ad-ink); margin-right: 3px; }
        .vp-stats .is-today { background: #eef0ff; }
        .vp-stats .is-ok { background: #e6f7ee; }
        .vp-stats .is-no { background: #fdecec; }
        .vp-msg { margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #4b3fd6; }
        .vp-group { margin-top: 12px; border: 1px solid var(--ad-line, #e6e8f0); border-radius: 14px; overflow: hidden; }
        .vp-group.is-today { border-color: #c9c4f7; box-shadow: 0 6px 16px -12px rgba(103, 87, 245, .5); }
        .vp-ghead { display: flex; align-items: center; gap: 10px; padding: 9px 14px; background: #fafbff; border-bottom: 1px solid var(--ad-line, #eef0f5); font-size: 13px; }
        .vp-ghead b { color: var(--ad-ink); font-size: 14px; }
        .vp-ghead span { color: #4b5563; font-weight: 600; }
        .vp-ghead em { padding: 2px 8px; border-radius: 999px; background: #6757f5; color: #fff; font-style: normal; font-size: 11px; font-weight: 700; }
        .vp-ghead small { margin-left: auto; color: var(--ad-muted, #7a8099); font-size: 12px; }
        .vp-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 14px; border-top: 1px solid #f1f2f7; }
        .vp-row:first-of-type { border-top: 0; }
        .vp-who { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
        .vp-who b { font-size: 14px; color: var(--ad-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
        .vp-who span { font-size: 12.5px; color: var(--ad-muted, #7a8099); white-space: nowrap; }
        .vp-acts { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .vp-chip { padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 700; background: #eef0f5; color: #4b5563; white-space: nowrap; }
        .vp-chip--booked { background: #fff4dc; color: #a16207; }
        .vp-chip--visited { background: #dcf5e7; color: #15803d; }
        .vp-chip--missed { background: #fde2e2; color: #b91c1c; }
        .vp-b { height: 30px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--ad-line, #e2e4ee); background: #fff; font-size: 12.5px; font-weight: 700; color: var(--ad-ink); cursor: pointer; }
        .vp-b:hover { border-color: #c9c4f7; }
        .vp-b--main { border-color: transparent; background: var(--ad-grad, #6757f5); color: #fff; }
        .vp-b--link { border-color: transparent; background: none; color: #5b45e0; padding: 0 6px; }
        .vp-b:disabled { opacity: .55; cursor: default; }
        .vp-edit { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .vp-edit .ga-input { width: auto; min-width: 140px; height: 32px; }
        .vp-empty { margin: 10px 0 0; font-size: 13px; color: var(--ad-muted, #7a8099); }
        @media (max-width: 760px) { .vp-row { flex-direction: column; align-items: flex-start; } .vp-acts { justify-content: flex-start; } }
      `}</style>
    </section>
  );
}
