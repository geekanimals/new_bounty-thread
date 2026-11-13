"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import BrandPanel, { useBrand } from "@/components/admin/brand/BrandPanel";
import { rpc, errText } from "@/lib/supabase";
import { fmtDate, fmtDateTime, useToast } from "@/components/admin/brand/util";

const KINDS = { note: "📝", call: "📞", email: "✉️", meeting: "🤝", deal: "💰", task: "✅" };
const cap = (k) => k[0].toUpperCase() + k.slice(1);

/** /admin/brands/[id]/notes — Notes & tasks (Figma 068) · brand_note_add / brand_note_update */
export default function BrandNotesPage() {
  const { id } = useParams();
  return (
    <BrandPanel id={id}>
      <BrandNotes />
    </BrandPanel>
  );
}

function BrandNotes() {
  const { d, b, reload } = useBrand();
  const items = d.notes || [];
  const [text, setText] = useState("");
  const [kind, setKind] = useState("note");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const [rm, setRm] = useState(null);
  const [toast, say] = useToast();

  const add = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return say("Write the note first.");
    setBusy(true);
    const r = await rpc("admin", "api.brand_note_add", { p_brand: b.brand_id, p_kind: kind, p_body: t, p_due: (kind === "task" && due) || null });
    setBusy(false);
    if (r.error) return say(errText(r.error));
    setText("");
    setDue("");
    reload(true);
  };
  const upd = async (n, done, del) => {
    setRm(null);
    const r = await rpc("admin", "api.brand_note_update", { p_note: n.note_id, p_done: del ? null : done, p_delete: !!del });
    if (r.error) return say(errText(r.error));
    if (del) say("Note deleted");
    reload(true);
  };

  return (
    <>
      <form className="bn-f" onSubmit={add}>
        <input className="ad-input" value={text} maxLength={4000} onChange={(e) => setText(e.target.value)} placeholder="Add a note or a task…" aria-label="Add a note or a task" />
        <select className="ad-input" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type">
          {Object.keys(KINDS).map((k) => (
            <option key={k} value={k}>
              {cap(k)}
            </option>
          ))}
        </select>
        {kind === "task" && <input className="ad-input bn-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" title="Due date (optional)" />}
        <button type="submit" className="ad-btn ad-btn--primary" disabled={busy}>
          {busy ? "Adding…" : "Add"}
        </button>
      </form>

      <div className="bn-list">
        {items.length ? (
          items.map((n) => (
            <div key={n.note_id} className={`bn-i ${n.done_at ? "is-done" : ""}`}>
              {n.kind === "task" ? (
                <button type="button" className="bn-chk" aria-label={n.done_at ? "Mark as not done" : "Mark as done"} onClick={() => upd(n, !n.done_at)}>
                  {n.done_at ? "✓" : ""}
                </button>
              ) : (
                <span className="bn-dot">{KINDS[n.kind] || "📝"}</span>
              )}
              <div className="bn-i__main">
                <p>{n.body}</p>
                <small>
                  {cap(n.kind || "note")}
                  {n.by ? ` · ${n.by}` : ""} · {fmtDateTime(n.at)}
                  {n.due_on && !n.done_at ? ` · due ${fmtDate(n.due_on)}` : ""}
                </small>
              </div>
              {rm === n.note_id ? (
                <>
                  <button type="button" className="bp-plain bn-rm" onClick={() => upd(n, null, true)}>
                    Yes, delete
                  </button>
                  <button type="button" className="bp-plain" onClick={() => setRm(null)}>
                    Keep
                  </button>
                </>
              ) : (
                <button type="button" className="bp-plain" onClick={() => setRm(n.note_id)}>
                  Delete
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="bn-empty">No notes yet — calls, follow-ups and reminders for this brand live here.</p>
        )}
      </div>

      {toast && <div className="ad-toast">{toast}</div>}
      <style>{`
        .bn-due { width: 150px; height: 44px; }
        .bn-rm { color: var(--ad-red) !important; }
        .bn-i p { white-space: pre-wrap; }
        .bn-f { display: flex; gap: 9px; margin-top: 0; }
        .bn-f .ad-input:first-child { width: 270px; height: 43px; }
        .bn-f select.ad-input { width: 139px; height: 44px; padding: 0 12px; }
        .bn-f .ad-btn { height: 41px; margin-top: 1px; padding: 0 16px; }
        .bn-list { margin-top: 22px; padding-bottom: 22px; border-bottom: 1px solid var(--ad-line); }
        .bn-empty { padding: 14px 0 0; text-align: center; font-size: 14px; color: #8a8aa0; }
        .bn-i { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid var(--ad-line); }
        .bn-i:first-child { border-top: 0; }
        .bn-i__main { flex: 1; min-width: 0; }
        .bn-i p { font-size: 14px; color: var(--ad-ink); overflow-wrap: anywhere; }
        .bn-i small { display: block; margin-top: 3px; font-size: 12px; color: var(--ad-muted); }
        .bn-i.is-done p { text-decoration: line-through; color: var(--ad-muted); }
        .bn-chk { width: 22px; height: 22px; flex-shrink: 0; border-radius: 7px; border: 1.5px solid var(--ad-line-2); background: #fff; color: #fff; font-size: 12px; font-weight: 800; }
        .bn-i.is-done .bn-chk { background: var(--ad-primary); border-color: var(--ad-primary); }
        .bn-dot { width: 22px; text-align: center; font-size: 15px; }
        .bn-i .bp-plain { height: 32px; padding: 0 6px; font-size: 13px; }
        @media (max-width: 640px) {
          .bn-f { flex-wrap: wrap; margin-top: 0; }
          .bn-f .ad-input:first-child { width: 100%; }
          .bn-f select.ad-input { flex: 1; width: auto; }
        }
      `}</style>
    </>
  );
}
