"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import BrandShell from "@/components/brands/BrandShell";
import { getVideo, getCreator } from "@/components/brands/data";
import { ArrowLeft, Play, Pause, Check, AlertTriangle, Clock, Edit, Send } from "@/components/ui/Icons";

const toSec = (t) => {
  const [m, s] = t.split(":").map(Number);
  return m * 60 + s;
};
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** /brands/approvals/video/[id] — creator ka video dekho, note likho, approve ya changes */
export default function VideoReview() {
  const { id } = useParams();
  const v = getVideo(id);
  const c = getCreator(id);
  const total = v ? toSec(v.length) : 60;
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(34);
  const [notes, setNotes] = useState(v ? v.notes : []);
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const [ask, setAsk] = useState("");
  const [state, setState] = useState(null); // "approved" | "changes"

  // Play dabane par progress chalta hai (dummy video)
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setT((x) => {
        if (x + 1 >= total) {
          setPlaying(false);
          return total;
        }
        return x + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [playing, total]);

  if (!v || !c) notFound();

  const addNote = (e) => {
    e.preventDefault();
    const txt = note.trim();
    if (!txt) return;
    setNotes((n) => [...n, { at: fmt(t), text: txt, by: "You · just now" }]);
    setNote("");
  };

  return (
    <BrandShell crumbs={[{ label: "Approvals", href: "/brands/approvals/videos" }, { label: `${c.name}’s video` }]}>
      <title>{`Review ${c.name}’s video — Geek OS Brand`}</title>

      <Link href="/brands/approvals/videos" className="br-back">
        <span>
          <ArrowLeft size={13} />
        </span>
        Back to Approvals
      </Link>

      <div className="br-card vv">
        {/* Phone preview */}
        <div className="vv-phone" style={{ background: v.g }}>
          <div className="vv-phone__top">
            <span className="vv-phone__who">
              <i>{c.initials}</i>
              {c.handle.slice(1)}
            </span>
            <span className="vv-draft">Draft</span>
          </div>
          <button type="button" className="vv-play" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause video" : "Play video"}>
            {playing ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <div className="vv-phone__bottom">
            <p>{v.caption.slice(0, 64)}…</p>
            <button
              type="button"
              className="vv-track"
              aria-label="Seek"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setT(Math.round(((e.clientX - r.left) / r.width) * total));
              }}
            >
              <i style={{ width: `${(t / total) * 100}%` }} />
            </button>
            <span className="vv-time">
              {fmt(t)} / {v.length}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="vv-info">
          <div className="vv-head">
            <span className="br-av" style={{ background: c.av }}>
              {c.initials}
            </span>
            <span className="vv-head__name">
              <strong>{c.name}</strong>
              <small>
                {c.handle} · {v.campaign}
              </small>
            </span>
            {state === "approved" ? (
              <span className="br-badge br-badge--green">Approved</span>
            ) : state === "changes" ? (
              <span className="br-badge br-badge--blue">Changes requested</span>
            ) : (
              <span className="br-badge br-badge--orange">{v.due}</span>
            )}
          </div>

          <p className="vv-label">Caption</p>
          <p className="vv-caption">{v.caption}</p>

          <p className="vv-label">Brief check</p>
          <ul className="vv-checks">
            {v.checks.map((x) => (
              <li key={x.text} className={x.ok ? "" : "is-warn"}>
                <span>{x.ok ? <Check size={11} /> : <AlertTriangle size={11} />}</span>
                {x.text}
              </li>
            ))}
          </ul>

          <p className="vv-label">Your notes on the video</p>
          {notes.length > 0 && (
            <ul className="vv-notes">
              {notes.map((n, i) => (
                <li key={i}>
                  <button type="button" className="vv-at" onClick={() => setT(toSec(n.at))}>
                    {n.at}
                  </button>
                  <span>
                    {n.text}
                    <small>{n.by}</small>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form className="vv-addnote" onSubmit={addNote}>
            <Clock size={14} />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Add a note at ${fmt(t)}…`} />
            {note.trim() && (
              <button type="submit" className="br-btn br-btn--soft br-btn--sm">
                Add
              </button>
            )}
          </form>

          {asking && !state && (
            <form
              className="vv-ask"
              onSubmit={(e) => {
                e.preventDefault();
                if (!ask.trim()) return;
                setState("changes");
                setAsking(false);
              }}
            >
              <label className="br-label" htmlFor="vv-ask">
                What should {c.name.split(" ")[0]} change?
              </label>
              <textarea
                id="vv-ask"
                className="br-input"
                rows={3}
                value={ask}
                autoFocus
                onChange={(e) => setAsk(e.target.value)}
                placeholder="e.g. Please say the price once and keep the serum close-up 2 sec longer."
              />
              <div className="vv-ask__btns">
                <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={() => setAsking(false)}>
                  Cancel
                </button>
                <button type="submit" className="br-btn br-btn--primary br-btn--sm" disabled={!ask.trim()}>
                  <Send size={13} /> Send to {c.name.split(" ")[0]}
                </button>
              </div>
            </form>
          )}

          {state ? (
            <div className={`vv-result vv-result--${state}`}>
              <span>{state === "approved" ? <Check size={15} /> : <Edit size={14} />}</span>
              <div>
                <strong>{state === "approved" ? "Video approved — it can go live" : "Changes requested"}</strong>
                <small>
                  {state === "approved"
                    ? `${c.name} gets a WhatsApp now and posts on the agreed date. You’ll see views in the campaign.`
                    : `${c.name} gets your notes on WhatsApp. The new cut comes back here for your OK.`}
                </small>
              </div>
              <button type="button" className="vv-undo" onClick={() => setState(null)}>
                Undo
              </button>
            </div>
          ) : (
            !asking && (
              <div className="vv-actions">
                <button type="button" className="br-btn br-btn--ghost" onClick={() => setAsking(true)}>
                  <Edit size={14} /> Ask for changes
                </button>
                <button type="button" className="br-btn br-btn--primary" onClick={() => setState("approved")}>
                  <Check size={14} /> Approve video
                </button>
              </div>
            )
          )}
        </div>
      </div>

      <style>{`
        .vv { display: grid; grid-template-columns: 330px minmax(0, 1fr); gap: 28px; padding: 22px; }
        .vv-phone {
          position: relative; aspect-ratio: 9 / 16; max-height: 600px; border-radius: 22px; overflow: hidden; color: #fff;
          display: flex; flex-direction: column; justify-content: space-between; padding: 14px;
        }
        .vv-phone__top { display: flex; justify-content: space-between; align-items: center; }
        .vv-phone__who { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; }
        .vv-phone__who i { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,.3); display: grid; place-items: center; font-style: normal; font-size: 9px; }
        .vv-draft { padding: 2px 8px; border-radius: 6px; background: rgba(0,0,0,.25); font-size: 10.5px; font-weight: 700; }
        .vv-play { align-self: center; width: 64px; height: 64px; border: 0; border-radius: 50%; background: rgba(255,255,255,.28); color: #fff; display: grid; place-items: center; backdrop-filter: blur(4px); }
        .vv-play:hover { background: rgba(255,255,255,.38); }
        .vv-phone__bottom p { margin: 0 0 10px; font-size: 12.5px; line-height: 1.45; font-weight: 600; }
        .vv-track { display: block; width: 100%; height: 4px; padding: 0; border: 0; border-radius: 999px; background: rgba(255,255,255,.35); cursor: pointer; }
        .vv-track i { display: block; height: 100%; border-radius: inherit; background: #fff; transition: width .3s linear; }
        .vv-time { display: block; margin-top: 6px; font-size: 11px; font-weight: 600; opacity: .9; }

        .vv-info { min-width: 0; }
        .vv-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .vv-head__name { flex: 1; min-width: 0; }
        .vv-head__name strong { display: block; font-size: 15px; font-weight: 800; }
        .vv-head__name small { display: block; font-size: 12px; color: var(--br-muted); }
        .vv-label { margin: 16px 0 8px; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--br-faint); }
        .vv-caption { margin: 0; font-size: 14px; line-height: 1.6; }
        .vv-checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 9px; }
        .vv-checks li { display: flex; align-items: center; gap: 10px; font-size: 13.5px; }
        .vv-checks li span { width: 20px; height: 20px; border-radius: 6px; background: var(--br-green-bg); color: var(--br-green); display: grid; place-items: center; flex-shrink: 0; }
        .vv-checks li.is-warn span { background: var(--br-orange-bg); color: var(--br-orange); }
        .vv-notes { list-style: none; margin: 0 0 8px; padding: 0; display: grid; gap: 6px; }
        .vv-notes li { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 11px; background: #f6f6fa; font-size: 13px; }
        .vv-notes small { display: block; font-size: 11px; color: var(--br-faint); margin-top: 2px; }
        .vv-at { flex-shrink: 0; border: 0; padding: 2px 7px; border-radius: 6px; background: var(--br-ink); color: #fff; font-size: 11px; font-weight: 700; }
        .vv-addnote { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 8px 0 14px; border: 1px solid var(--br-border-2); border-radius: 11px; color: var(--br-faint); }
        .vv-addnote:focus-within { border-color: var(--br-primary); }
        .vv-addnote input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font-size: 13.5px; color: var(--br-ink); }
        .vv-ask { margin-top: 16px; padding: 14px; border-radius: 14px; background: #f6f6fa; }
        .vv-ask__btns { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
        .vv-actions { display: flex; justify-content: space-between; gap: 10px; margin-top: 24px; flex-wrap: wrap; }
        .vv-result { display: flex; align-items: center; gap: 12px; margin-top: 22px; padding: 14px; border-radius: 14px; }
        .vv-result--approved { background: var(--br-green-bg); }
        .vv-result--changes { background: var(--br-blue-bg); }
        .vv-result > span { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; color: #fff; flex-shrink: 0; background: var(--br-green); }
        .vv-result--changes > span { background: var(--br-blue); }
        .vv-result div { flex: 1; min-width: 0; }
        .vv-result strong { display: block; font-size: 14px; }
        .vv-result small { display: block; font-size: 12.5px; color: var(--br-text); line-height: 1.5; }
        .vv-undo { border: 0; background: none; color: var(--br-primary); font-size: 12.5px; font-weight: 700; }

        @media (max-width: 900px) {
          .vv { grid-template-columns: 1fr; }
          .vv-phone { width: min(280px, 100%); margin: 0 auto; }
        }
        @media (max-width: 640px) {
          .vv { padding: 16px; gap: 18px; }
          .vv-actions .br-btn { flex: 1; }
        }
      `}</style>
    </BrandShell>
  );
}
