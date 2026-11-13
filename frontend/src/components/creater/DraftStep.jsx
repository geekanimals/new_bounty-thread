"use client";

import { useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import TrackerFrame, { useTracker, TrackerWait, StepMismatch } from "@/components/creater/TrackerSteps";
import { checkVideoLink, fdate, fdt, safeLink, submitVideo } from "@/services/creator";
import { Upload } from "@/components/ui/Icons";

/**
 * Draft + Revision dono pages ka step (purane openVideoModal / "Shoot your video" / "brand asked for changes"):
 * video ka link (Google Drive, "Anyone with the link") + note → video-link-check (brand khol sake?) → api.submit_campaign_video.
 * content_submitted = brand dekh raha hai (post mat karo). changes_requested = brand ka note + dobara bhejo.
 */
export default function DraftStep({ revision = false }) {
  const t = useTracker();
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  if (!t.m)
    return (
      <BountyShell>
        <TrackerWait t={t} />
      </BountyShell>
    );
  const { c, m } = t;
  const rv = m.review || {};
  const sb = m.submission;
  const changes = m.stage === "changes_requested";
  const onStep = t.step === "draft" || !!m.blocked_at;

  const submit = async () => {
    setErr("");
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) return setErr("Paste a link that starts with https://");
    setBusy("Checking the link…");
    // brand ko link khulna chahiye — private / deleted Drive link yahin rok do
    const chk = await checkVideoLink(u);
    if (!chk.ok) {
      setBusy("");
      return setErr("⚠️ " + (chk.message || "The brand can't open this link."));
    }
    setBusy("Submitting…");
    const r = await submitVideo(m.participation_id, u, note.trim());
    setBusy("");
    if (r.error) return setErr(r.error.message || String(r.error));
    setUrl("");
    setNote("");
    t.reload();
  };

  const form = (again) => (
    <>
      <div className="dr-note">
        <b>⚠️ The link must open for everyone.</b> Upload your video to Google Drive and set <b>Share → General access → “Anyone with the link” → Viewer</b>. Open the link
        in a private / incognito window to check before you submit.
      </div>
      <label className={`dr-upload ${url ? "is-on" : ""}`} htmlFor="dr-url">
        <Upload size={18} />
        <strong>{url ? "Link added ✓" : "Link to your video"}</strong>
        <small>Don’t post it on Instagram yet — the brand approves it first.</small>
      </label>
      <input id="dr-url" className="bx-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/…" inputMode="url" />
      <label className="bx-label" htmlFor="dr-note">
        Note for the brand (optional)
      </label>
      <textarea id="dr-note" className="bx-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Two versions — v2 has the voice-over" />
      {err && <p className="ts-err">{err}</p>}
      <div>
        <button type="button" className="bx-btn bx-btn--dark ts-mt" disabled={!!busy || !url.trim()} onClick={submit}>
          {busy || (again ? "Resubmit draft →" : "Submit for review →")}
        </button>
      </div>
      {m.video_brief && (
        <Link href={`${t.base}#brief`} className="ts-link">
          📖 Read your video brief{m.deadline ? ` · due ${fdate(m.deadline)}` : ""}
        </Link>
      )}
    </>
  );

  const body = () => {
    if (!onStep) return <StepMismatch t={t} />;
    if (["contract_signed", "address_confirmed", "product_sent", "product_delivered"].includes(m.stage) && !m.blocked_at)
      return (
        <>
          <span className="ts-ic">🎬</span>
          <h2>Your video brief is on its way</h2>
          <p>Contract signed ✓ — there is nothing to ship on this campaign, so your video brief opens here in a moment.</p>
        </>
      );
    if (m.stage === "content_submitted")
      return (
        <>
          <span className="ts-ic">👀</span>
          <h2>Draft sent — {c.brand} is reviewing</h2>
          <p>
            {sb ? (
              <>
                <a href={safeLink(sb.url)} target="_blank" rel="noopener noreferrer" className="dr-link">
                  Your link ↗
                </a>{" "}
                · sent {fdt(sb.submitted_at)}.{" "}
              </>
            ) : null}
            We’ll tell you the moment it’s approved. Don’t post yet.
          </p>
        </>
      );
    if (changes)
      return (
        <>
          <div className="dr-rev">
            <strong>🔁 {/^New video link needed/.test(rv.reason || "") ? "We need a new video link" : `${c.brand} asked for a change`}</strong>
            {rv.reason && <p>“{rv.reason}”</p>}
            {m.deadline && <small>Due {fdate(m.deadline)}</small>}
          </div>
          <h2>Fix &amp; resubmit your draft</h2>
          {form(true)}
        </>
      );
    return (
      <>
        <span className="ts-ic">{m.blocked_at ? "⛔" : "🎬"}</span>
        <h2>{m.blocked_at ? "Submit your video now" : "Shoot & submit your draft"}</h2>
        <p>
          Read the brief, shoot your video{m.deadline ? (
            <>
              {" "}
              and submit by <b>{fdate(m.deadline)}</b>
            </>
          ) : null}
          . <b>Don’t post it on Instagram yet</b> — the brand approves it first.
        </p>
        {form(false)}
      </>
    );
  };

  return (
    <BountyShell>
      <title>{`${changes ? "Fix your draft" : "Submit draft"} — ${c.title} — Bounty`}</title>
      <TrackerFrame t={t} step={onStep ? "draft" : undefined}>
        {body()}
      </TrackerFrame>
      <style>{`
        .dr-rev { margin-bottom: 6px; padding: 12px 14px; border-radius: 12px; background: #f8e1d6; border: 1px solid #ebbca6; }
        .dr-rev strong { font-size: 14px; color: var(--bx-red); }
        .dr-rev p { margin: 4px 0 0; font-family: var(--bx-serif); font-style: italic; font-size: 13.5px; }
        .dr-rev small { display: block; margin-top: 4px; font-size: 12px; font-weight: 700; }
        .dr-note { margin: 4px 0 10px; padding: 10px 12px; border-radius: 12px; background: #fbe7b5; font-size: 12.5px; line-height: 1.5; }
        .dr-upload { display: flex; flex-direction: column; align-items: center; gap: 4px; margin: 8px 0 8px; padding: 18px; border-radius: 14px; border: 2px dashed #d3c19a; background: #fffaf0; text-align: center; cursor: text; }
        .dr-upload.is-on { border-color: var(--bx-teal); background: #eef8f3; }
        .dr-upload strong { font-size: 13.5px; overflow-wrap: anywhere; }
        .dr-upload small { font-size: 12px; color: var(--bx-muted); }
        .dr-link { font-weight: 700; color: #2e9c94; }
      `}</style>
    </BountyShell>
  );
}
