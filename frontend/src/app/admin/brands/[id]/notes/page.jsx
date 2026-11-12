"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BrandPanel, { notesKey } from "@/components/admin/brand/BrandPanel";

/** /admin/brands/[id]/notes — Notes & tasks (Figma 068) */
export default function BrandNotes() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [kind, setKind] = useState("Note");

  useEffect(() => {
    try {
      setItems(JSON.parse(window.localStorage.getItem(notesKey(id)) || "[]"));
    } catch {
      setItems([]);
    }
  }, [id]);

  const save = (next) => {
    setItems(next);
    try {
      window.localStorage.setItem(notesKey(id), JSON.stringify(next));
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("geek-brands"));
  };

  const add = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const when = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date());
    save([{ id: Date.now(), kind, text: t, done: false, when, by: "Mayank" }, ...items]);
    setText("");
  };

  return (
    <BrandPanel id={id}>
      <form className="bn-f" onSubmit={add}>
        <input className="ad-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note or a task…" aria-label="Add a note or a task" />
        <select className="ad-input" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type">
          <option>Note</option>
          <option>Task</option>
        </select>
        <button type="submit" className="ad-btn ad-btn--primary" >
          Add
        </button>
      </form>

      <div className="bn-list">
        {items.length ? (
          items.map((n) => (
            <div key={n.id} className={`bn-i ${n.done ? "is-done" : ""}`}>
              {n.kind === "Task" ? (
                <button type="button" className="bn-chk" aria-label={n.done ? "Mark as open" : "Mark as done"} onClick={() => save(items.map((x) => (x.id === n.id ? { ...x, done: !x.done } : x)))}>
                  {n.done ? "✓" : ""}
                </button>
              ) : (
                <span className="bn-dot">📝</span>
              )}
              <div className="bn-i__main">
                <p>{n.text}</p>
                <small>
                  {n.kind} · {n.by} · {n.when}
                </small>
              </div>
              <button type="button" className="bp-plain" onClick={() => save(items.filter((x) => x.id !== n.id))}>
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="bn-empty">No notes yet — calls, follow-ups and reminders for this brand live here.</p>
        )}
      </div>

      <style>{`
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
    </BrandPanel>
  );
}
