"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BrandShell from "@/components/brands/BrandShell";
import { BrLoading, BrEmpty, BrError, useToast } from "@/components/brands/BrandStates";
import { useApprovals, useBrandCampaign, approveVideo, askVideoChanges, bWho, bGrad, bEmbed, bLines, bWhen } from "@/services/brand";
import { ArrowLeft, Play, Check, Clock, Edit, Send, LinkIcon } from "@/components/ui/Icons";

/**
 * /brands/approvals/video/[id] — creator ka video dekho, approve ya changes maango
 * (purana openVideo + data-bpxvok confirm → bp_review_video approve, data-bpxvno → bp_review_video changes 5–800 akshar).
 * id = participation_id.
 */
export default function VideoReview() {
  const { id } = useParams();
  const a = useApprovals();
  const live = a.videos.find((x) => x.participation_id === id);
  const [snap, setSnap] = useState(null); // review ke baad list se hat jaata hai — naam / campaign dikhte rahein
  useEffect(() => {
    if (live) setSnap(live);
  }, [live]);
  const camp = useBrandCampaign((live || snap || {}).campaign_id || null);
  const vb = ((camp.data || {}).campaign || {}).video_brief || {};
  const checks = [...bLines(vb.key_messages), ...bLines(vb.dos)].slice(0, 6);
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const [ask, setAsk] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [state, setState] = useState(null); // "approved" | "changes"
  const [toast, say] = useToast();
  const v = live || (state ? snap : null);

  const c = bWho(v ? v.creator : null);
  const first = c.name.split(" ")[0];
  const emb = v ? bEmbed(v.video_url) : null;

  // approve (purana data-bpxvok: confirm → bp_review_video p_approve:true)
  const approve = async () => {
    if (!window.confirm("Approve this video? The creator is told to post it.")) return;
    setBusy(true);
    const r = await approveVideo(id);
    setBusy(false);
    if (r.error) return say(r.error.message);
    setState("approved");
    say("✓ Video approved — the creator can post it now");
    a.reload();
  };
  // changes (purana bpxCh form: kam se kam 5 akshar)
  const sendChanges = async (e) => {
    e.preventDefault();
    const t = ask.trim();
    if (t.length < 5) return setErr("Write at least a few words for the creator.");
    setBusy(true);
    setErr("");
    const r = await askVideoChanges(id, t);
    setBusy(false);
    if (r.error) return setErr(r.error.message);
    setState("changes");
    setAsking(false);
    say("Sent — the creator will fix the video");
    a.reload();
  };

  const crumbs = [{ label: "Approvals", href: "/brands/approvals/videos" }, { label: v ? `${c.name}’s video` : "Video" }];

  return (
    <BrandShell crumbs={crumbs}>
      <title>{v ? `Review ${c.name}’s video — Geek OS Brand` : "Review video — Geek OS Brand"}</title>

      <Link href="/brands/approvals/videos" className="br-back">
        <span>
          <ArrowLeft size={13} />
        </span>
        Back to Approvals
      </Link>

      {a.loading ? (
        <BrLoading rows={5} />
      ) : a.error ? (
        <BrError error={a.error} onRetry={a.reload} />
      ) : !v && !state ? (
        <BrEmpty title="This video isn’t waiting for review" text="It was already approved or sent back for changes — or the link is old.">
          <Link href="/brands/approvals/videos" className="br-btn br-btn--primary br-btn--sm">
            See videos to review
          </Link>
        </BrEmpty>
      ) : (
        <div className="br-card vv">
          {/* Phone preview — asli video (Drive / Instagram / YouTube / file) */}
          <div className="vv-phone" style={{ background: bGrad(id) }}>
            {emb && emb.kind === "video" && <video className="vv-embed" src={emb.src} controls playsInline preload="metadata" />}
            {emb && emb.kind === "frame" && (
              <iframe className="vv-embed" src={emb.src} title={`${c.name}'s video`} allow="autoplay; encrypted-media; fullscreen" allowFullScreen loading="lazy" referrerPolicy="no-referrer" />
            )}
            <div className="vv-phone__top">
              <span className="vv-phone__who">
                <i>{c.initials}</i>
                {c.handle ? c.handle.slice(1) : c.name}
              </span>
              <span className="vv-draft">Draft</span>
            </div>
            {!emb && (
              <a className="vv-play" href={v ? v.video_url : "#"} target="_blank" rel="noopener noreferrer" aria-label="Open the video">
                <Play size={22} />
              </a>
            )}
            <div className="vv-phone__bottom">
              {!emb && <p>This link can’t be played here — open it in a new tab.</p>}
              {v && v.video_url && (
                <a className="vv-time vv-open" href={v.video_url} target="_blank" rel="noopener noreferrer">
                  <LinkIcon size={11} /> Open in a new tab ↗
                </a>
              )}
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
                <small>{[c.handle, v && v.campaign].filter(Boolean).join(" · ")}</small>
              </span>
              {state === "approved" ? (
                <span className="br-badge br-badge--green">Approved</span>
              ) : state === "changes" ? (
                <span className="br-badge br-badge--blue">Changes requested</span>
              ) : (
                <span className="br-badge br-badge--orange">Sent {v ? bWhen(v.submitted_at) : ""}</span>
              )}
            </div>

            <p className="vv-label">Note from the creator</p>
            <p className="vv-caption">{(v && v.note) || "No note — just the video."}</p>

            <p className="vv-label">Brief check</p>
            {checks.length ? (
              <ul className="vv-checks">
                {checks.map((x) => (
                  <li key={x}>
                    <span>
                      <Check size={11} />
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="vv-caption vv-muted">{camp.loading ? "Loading the video brief…" : "No video brief points for this campaign — check it against the campaign brief."}</p>
            )}

            <p className="vv-label">Your notes on the video</p>
            <form
              className="vv-addnote"
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim()) say("Coming soon — timed notes. Use “Ask for changes” to send notes to the creator.");
              }}
            >
              <Clock size={14} />
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" />
              {note.trim() && (
                <button type="submit" className="br-btn br-btn--soft br-btn--sm">
                  Add
                </button>
              )}
            </form>

            {asking && !state && (
              <form className="vv-ask" onSubmit={sendChanges}>
                <label className="br-label" htmlFor="vv-ask">
                  What should {first} change?
                </label>
                <textarea
                  id="vv-ask"
                  className="br-input"
                  rows={3}
                  maxLength={800}
                  value={ask}
                  autoFocus
                  onChange={(e) => {
                    setAsk(e.target.value);
                    setErr("");
                  }}
                  placeholder="e.g. Show the product in the first 3 seconds and say the brand name clearly."
                />
                {err && <p className="vv-err">{err}</p>}
                <div className="vv-ask__btns">
                  <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={() => setAsking(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="br-btn br-btn--primary br-btn--sm" disabled={!ask.trim() || busy}>
                    <Send size={13} /> {busy ? "Sending…" : `Send to ${first}`}
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
                      ? `${c.name} is told to post it. You’ll see views in the campaign.`
                      : `${c.name} gets your notes. The new cut comes back here for your OK.`}
                  </small>
                </div>
                <Link href="/brands/approvals/videos" className="vv-undo">
                  Next video
                </Link>
              </div>
            ) : !a.can ? (
              <p className="vv-caption vv-muted vv-view">👁 View-only login — videos are approved by your team’s approvers.</p>
            ) : (
              !asking && (
                <div className="vv-actions">
                  <button type="button" className="br-btn br-btn--ghost" onClick={() => setAsking(true)} disabled={busy}>
                    <Edit size={14} /> Ask for changes
                  </button>
                  <button type="button" className="br-btn br-btn--primary" onClick={approve} disabled={busy}>
                    <Check size={14} /> {busy ? "Approving…" : "Approve video"}
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {toast}

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
              .vv-embed { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: #000; object-fit: contain; }
        .vv-phone__top, .vv-phone__bottom { position: relative; z-index: 1; pointer-events: none; }
        .vv-phone__top *, .vv-phone__bottom a { pointer-events: auto; }
        .vv-open { display: inline-flex; align-items: center; gap: 5px; color: #fff; text-decoration: none; padding: 3px 8px; border-radius: 6px; background: rgba(0,0,0,.35); }
        a.vv-play { text-decoration: none; position: relative; z-index: 1; }
        .vv-muted { color: var(--br-muted); font-size: 13px; }
        .vv-view { margin-top: 22px; }
        .vv-err { margin: 8px 0 0; font-size: 12.5px; font-weight: 600; color: var(--br-red); }
`}</style>
    </BrandShell>
  );
}
