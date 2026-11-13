"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import FacebookTabs, { FbGate } from "@/components/brands/FacebookTabs";
import { useToast } from "@/components/brands/BrandStates";
import { useFbPages, fbPublish, bInitials, bGrad } from "@/services/brand";
import { Close, Upload, LinkIcon, Sparkle, Smile, Calendar, Clock, Check, Send, Globe, ChevronDown, Heart, Chat, Share } from "@/components/ui/Icons";

// Agla Saturday (shaam 7:30 — suggestion)
const nextSat = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const URL_RE = /https?:\/\/[^\s]+/i;

/**
 * /brands/facebook/create — Facebook Page par post likho / schedule karo
 * (purana fbCreate: photo campaign-files mein (8 MB tak), link = text ka pehla https link, schedule 10 min – 75 din → brand-facebook publish).
 */
export default function FacebookCreate() {
  const fb = useFbPages();
  return (
    <BrandShell>
      <title>Create post — Facebook — Geek OS Brand</title>
      <FacebookTabs fb={fb} />
      <FbGate fb={fb}>{(pg) => <CreatePane fb={fb} pg={pg} />}</FbGate>
      <style>{`
        .fc { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 18px; align-items: start; }
        .fc-form { padding: 20px; }
        .fc-to { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; font-size: 13px; font-weight: 600; color: var(--br-text); }
        .fc-page { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 10px 0 6px; border: 1px solid var(--br-border-2); border-radius: 10px; background: #fff; }
        .fc-page select { border: 0; outline: none; background: none; font-size: 13px; font-weight: 700; appearance: none; padding-right: 2px; cursor: pointer; }
        .fc-page__logo { width: 24px; height: 24px; border-radius: 7px; display: grid; place-items: center; color: #fff; font-size: 11px; font-weight: 800; flex-shrink: 0; }
        .fc-page__logo--lg { width: 36px; height: 36px; border-radius: 10px; font-size: 14px; }
        .fc-text { min-height: 120px; font-size: 14px; border-color: var(--br-primary); }

        .fc-media { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
        .fc-tile { position: relative; width: 96px; height: 96px; border-radius: 12px; }
        .fc-tile button {
          position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; border-radius: 50%; border: 0;
          background: rgba(18,16,42,.6); color: #fff; display: grid; place-items: center;
        }
        .fc-add {
          width: 96px; height: 96px; border-radius: 12px; border: 1.5px dashed var(--br-border-2); background: #fafafd;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
          font-size: 11px; font-weight: 600; color: var(--br-muted); text-align: center; padding: 6px;
        }
        .fc-add svg { color: var(--br-primary); }
        .fc-add:hover { border-color: var(--br-primary); }
        .fc-tools { display: flex; gap: 8px; flex-wrap: wrap; margin: 14px 0 0; padding-bottom: 16px; border-bottom: 1px solid var(--br-border); }
        .fc-tools .br-chip { height: 32px; font-size: 12.5px; }
        .fc-tools .br-chip svg { color: var(--br-primary); }

        .fc-when { padding-top: 16px; }
        .fc-dt { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .fc-field { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; border: 1px solid var(--br-border-2); border-radius: 10px; color: var(--br-muted); background: #fff; }
        .fc-field input { border: 0; outline: none; background: none; font-size: 13px; color: var(--br-ink); }
        .fc-best { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 12px; border: 0; border-radius: 10px; background: var(--br-green-bg); color: var(--br-green); font-size: 12.5px; font-weight: 700; }
        .fc-foot { display: flex; justify-content: space-between; gap: 10px; margin-top: 20px; }

        .fc-prev { position: sticky; top: 92px; }
        .fc-prev__label { margin: 0 0 8px; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--br-faint); }
        .fc-card { padding: 14px; }
        .fc-card__head { display: flex; align-items: center; gap: 10px; }
        .fc-card__head strong { display: block; font-size: 13.5px; font-weight: 800; }
        .fc-card__head small { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--br-muted); }
        .fc-card__text { margin: 10px 0; font-size: 13px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
        .fc-card__media { display: grid; gap: 4px; border-radius: 10px; overflow: hidden; }
        .fc-card__media span { display: grid; place-items: center; aspect-ratio: 4 / 3; }
        .fc-card__media.is-multi { grid-template-columns: 1fr 1fr; }
        .fc-card__media.is-multi span { aspect-ratio: 1; }
        .fc-card__media b { color: #fff; font-size: 22px; font-weight: 800; }
        .fc-card__acts { display: flex; justify-content: space-around; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--br-border); font-size: 12px; font-weight: 600; color: var(--br-muted); }
        .fc-card__acts span { display: inline-flex; align-items: center; gap: 5px; }

        .fc-done { max-width: 560px; margin: 10px auto 0; padding: 40px 24px; text-align: center; }
        .fc-done > span { width: 54px; height: 54px; margin: 0 auto 14px; border-radius: 50%; background: var(--br-green); color: #fff; display: grid; place-items: center; }
        .fc-done h2 { margin: 0 0 6px; font-size: 20px; font-weight: 800; }
        .fc-done p { margin: 0 0 20px; font-size: 13.5px; color: var(--br-muted); }
        .fc-done div { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

        @media (max-width: 1023px) {
          .fc { grid-template-columns: minmax(0, 1fr); }
          .fc-prev { position: static; }
        }
        @media (max-width: 640px) {
          .fc-form { padding: 16px; }
          .fc-tile, .fc-add { width: calc((100% - 20px) / 3); height: auto; aspect-ratio: 1; }
          .fc-dt > * { flex: 1 1 140px; }
          .fc-field input { width: 100%; }
          .fc-foot .br-btn { flex: 1; }
        }
              .fc-err { margin: 12px 0 0; padding: 10px 14px; border-radius: 11px; background: var(--br-red-bg); color: var(--br-red); font-size: 12.5px; font-weight: 600; }
        .fc-hint { margin: 10px 0 0; font-size: 12px; color: var(--br-muted); line-height: 1.5; }
`}</style>
    </BrandShell>
  );
}

function CreatePane({ fb, pg }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [when, setWhen] = useState("now");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:30");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null); // { scheduled, at }
  const fileRef = useRef(null);
  const textRef = useRef(null);
  const [toast, say] = useToast();
  // default date browser mein (prerender par Date nahi)
  useEffect(() => setDate(nextSat()), []);
  // photo ka preview URL — badalne / hatane par chhod do
  useEffect(() => {
    if (!file) return setPreview("");
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const niceDate = !date ? "Pick a date" : new Date(`${date}T${time}`).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const media = preview ? [preview] : [];

  const submit = async () => {
    if (!fb.can) return;
    if (!text.trim() && !file) return setErr("Write something, or add a photo.");
    let at = null;
    if (when === "schedule") {
      if (!date || !time) return setErr("Pick the date and time.");
      at = new Date(`${date}T${time}`);
      const s = (at.getTime() - Date.now()) / 1000;
      if (!(s >= 600 && s <= 75 * 86400)) return setErr("Schedule between 10 minutes and 75 days from now.");
    }
    setErr("");
    setBusy(true);
    const link = (text.match(URL_RE) || [""])[0];
    const r = await fbPublish({ pageId: pg.id, message: text, link: file ? "" : link, file, at });
    setBusy(false);
    if (r.error) return setErr(r.error.message);
    setDone({ scheduled: !!(r.data && r.data.scheduled), at: niceDate });
  };

  if (done)
    return (
      <section className="br-card fc-done">
        <span>
          <Check size={22} />
        </span>
        <h2>{done.scheduled ? "Post scheduled" : "Posted to your Page"}</h2>
        <p>{done.scheduled ? `It will go live on ${done.at}. You’ll see it under Posts → Scheduled.` : `It’s live on ${pg.name}’s Facebook Page now.`}</p>
        <div>
          <Link href="/brands/facebook" className="br-btn br-btn--primary">
            See posts
          </Link>
          <button
            type="button"
            className="br-btn br-btn--ghost"
            onClick={() => {
              setDone(null);
              setText("");
              setFile(null);
            }}
          >
            Write another
          </button>
        </div>
      </section>
    );

  return (
    <div className="fc">
      <section className="br-card fc-form">
        <div className="fc-to">
          <span>Post to</span>
          <label className="fc-page">
            <span className="fc-page__logo" style={{ background: bGrad(pg.id) }}>
              {bInitials(pg.name).slice(0, 1)}
            </span>
            <select value={pg.id} onChange={(e) => fb.setPage(e.target.value)}>
              {fb.pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown size={13} />
          </label>
        </div>

        <textarea ref={textRef} className="br-input fc-text" rows={5} maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} placeholder="What do you want to tell your followers?" />

        <div className="fc-media">
          {media.map((g, i) => (
            <span key={i} className="fc-tile" style={{ background: `center / cover no-repeat url("${g}")` }}>
              <button type="button" aria-label="Remove photo" onClick={() => setFile(null)}>
                <Close size={11} />
              </button>
            </span>
          ))}
          {!media.length && (
            <button type="button" className="fc-add" onClick={() => fileRef.current?.click()}>
              <Upload size={16} />
              Add photo
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              const f = (e.target.files || [])[0];
              e.target.value = "";
              if (!f) return;
              if (f.size > 8 * 1024 * 1024) return setErr("The photo must be under 8 MB.");
              setErr("");
              setFile(f);
            }}
          />
        </div>

        <div className="fc-tools">
          <button
            type="button"
            className="br-chip"
            onClick={() => {
              if (!URL_RE.test(text)) setText(`${text.trim()}${text.trim() ? " " : ""}https://`);
              setTimeout(() => textRef.current?.focus(), 0);
            }}
          >
            <LinkIcon size={13} /> Add link
          </button>
          <button type="button" className="br-chip" onClick={() => say("Coming soon — AI captions.")}>
            <Sparkle size={13} /> AI caption
          </button>
          <button type="button" className="br-chip" onClick={() => setText(`${text} ✨`)}>
            <Smile size={13} /> Emoji
          </button>
        </div>

        <div className="fc-when">
          <p className="br-label">When</p>
          <div className="br-seg">
            <button type="button" className={when === "now" ? "is-on" : ""} onClick={() => setWhen("now")}>
              Post now
            </button>
            <button type="button" className={when === "schedule" ? "is-on" : ""} onClick={() => setWhen("schedule")}>
              Schedule
            </button>
          </div>
          {when === "schedule" && (
            <div className="fc-dt">
              <label className="fc-field">
                <Calendar size={14} />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label className="fc-field">
                <Clock size={14} />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </label>
              <button
                type="button"
                className="fc-best"
                onClick={() => {
                  setDate(nextSat());
                  setTime("19:30");
                }}
              >
                <Sparkle size={12} /> Saturday evening
              </button>
            </div>
          )}
        </div>

        {err && <p className="fc-err">{err}</p>}
        {!fb.can && <p className="fc-err">View-only login — posting is done by your team’s admin or approvers.</p>}

        <div className="fc-foot">
          <button type="button" className="br-btn br-btn--ghost" onClick={() => say("Coming soon — drafts.")}>
            Save draft
          </button>
          <button type="button" className="br-btn br-btn--primary" disabled={(!text.trim() && !file) || busy || !fb.can} onClick={submit}>
            {when === "now" ? <Send size={14} /> : <Calendar size={14} />}
            {busy ? "Working…" : when === "now" ? "Post now" : "Schedule post"}
          </button>
        </div>
        <p className="fc-hint">A photo post uses the photo; otherwise a link in your text shows as a link preview. Scheduling: 10 minutes to 75 days ahead.</p>
      </section>

      {/* Live preview */}
      <aside className="fc-prev">
        <p className="fc-prev__label">Preview</p>
        <div className="br-card fc-card">
          <div className="fc-card__head">
            <span className="fc-page__logo fc-page__logo--lg" style={{ background: pg.picture ? `center / cover no-repeat url("${pg.picture}")` : bGrad(pg.id) }}>
              {pg.picture ? "" : bInitials(pg.name).slice(0, 1)}
            </span>
            <div>
              <strong>{pg.name}</strong>
              <small>
                {when === "now" ? "Just now" : niceDate} · <Globe size={10} />
              </small>
            </div>
          </div>
          <p className="fc-card__text">{text || "Your post text shows here…"}</p>
          {media.length > 0 && (
            <div className="fc-card__media">
              <span style={{ background: `center / cover no-repeat url("${media[0]}")` }} />
            </div>
          )}
          <div className="fc-card__acts">
            <span>
              <Heart size={13} /> Like
            </span>
            <span>
              <Chat size={13} /> Comment
            </span>
            <span>
              <Share size={13} /> Share
            </span>
          </div>
        </div>
      </aside>
      {toast}


    </div>
  );
}
