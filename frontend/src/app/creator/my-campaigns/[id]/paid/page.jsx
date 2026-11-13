"use client";

import { useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creator/BountyShell";
import TrackerFrame, { useTracker, TrackerWait, StepMismatch } from "@/components/creator/TrackerSteps";
import PostStats from "@/components/creator/PostStats";
import PayBox from "@/components/creator/PayBox";
import { postProgress, submitFeedback } from "@/services/creator";

/**
 * /creator/my-campaigns/[id]/paid — campaign complete (purane "Campaign complete 🎉"):
 * baaki posts (agar koi), payment (paid campaign), numbers, aur ⭐ quick feedback (api.submit_campaign_feedback, optional).
 */
export default function PaidStep() {
  const t = useTracker();
  const [stars, setStars] = useState(0);
  const [yn, setYn] = useState({ clear: "", smooth: "", again: "" });
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!t.m)
    return (
      <BountyShell>
        <TrackerWait t={t} />
      </BountyShell>
    );
  const { c, m, isPaid } = t;
  const onStep = t.step === "paid";
  const left = postProgress(m).left;
  const val = (k) => (yn[k] ? yn[k] === "yes" : null);

  const sendFb = async () => {
    if (!stars) return setMsg("Tap the stars to rate the campaign.");
    setBusy(true);
    setMsg("");
    const r = await submitFeedback(m.participation_id, { rating: stars, brief_clear: val("clear"), smooth: val("smooth"), again: val("again"), comment: text.trim() });
    setBusy(false);
    if (r.error) return setMsg(r.error.message || String(r.error));
    t.reload();
  };

  return (
    <BountyShell>
      <title>{`Complete — ${c.title} — Bounty`}</title>
      <TrackerFrame t={t} step={onStep ? "paid" : undefined}>
        {!onStep ? (
          <StepMismatch t={t} />
        ) : (
          <>
            <span className="ts-ic ts-ic--green">🏁</span>
            <h2>Campaign complete 🎉</h2>
            <p>Thank you! Your post is live and your numbers are below.</p>
            {left.length > 0 && (
              <p className="ts-note">
                Still to post: <b>{left.join(" + ")}</b> — <Link href={`${t.base}/post`}>add the link</Link>
              </p>
            )}
            <PayBox t={t} />

            {!m.feedback_at ? (
              <div className="pd-fb">
                <p className="pd-fb__h">
                  ⭐ Quick feedback <span>(optional)</span>
                </p>
                <div className="pd-stars" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" className={n <= stars ? "is-on" : ""} onClick={() => setStars(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
                      ★
                    </button>
                  ))}
                </div>
                {[
                  ["clear", "Was the brief clear?"],
                  ["smooth", "Was everything smooth?"],
                  ["again", "Work with this brand again?"],
                ].map(([k, q]) => (
                  <label key={k} className="pd-q">
                    <span>{q}</span>
                    <select className="bx-input" value={yn[k]} onChange={(e) => setYn({ ...yn, [k]: e.target.value })}>
                      <option value="">—</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                ))}
                <textarea className="bx-input" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Anything to tell the brand or the Geek team? (optional)" />
                {msg && <p className="ts-err">{msg}</p>}
                <button type="button" className="bx-btn bx-btn--dark bx-btn--sm ts-mt" disabled={busy} onClick={sendFb}>
                  {busy ? "Sending…" : "Submit feedback"}
                </button>
              </div>
            ) : (
              <p className="ts-note">⭐ Thanks for your feedback!</p>
            )}

            <PostStats m={m} />
            <div className="pd-btns">
              {isPaid && (
                <Link href="/creator/payments" className="bx-btn bx-btn--dark">
                  Open Payments →
                </Link>
              )}
              <Link href="/creator/my-campaigns" className="bx-btn bx-btn--ghost">
                Back to My campaigns
              </Link>
            </div>
          </>
        )}
      </TrackerFrame>
      <style>{`
        .pd-btns { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
        .pd-fb { margin-top: 16px; padding: 14px; border-radius: 12px; background: #fffaf0; border: 1px solid var(--bx-line); display: grid; gap: 8px; }
        .pd-fb__h { margin: 0; font-size: 14px; font-weight: 700; }
        .pd-fb__h span { font-weight: 400; color: var(--bx-muted); }
        .pd-stars { display: flex; gap: 4px; }
        .pd-stars button { border: 0; background: none; padding: 0 2px; font-size: 26px; line-height: 1; color: #e2d3b0; cursor: pointer; }
        .pd-stars button.is-on { color: #e8b04a; }
        .pd-q { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13px; }
        .pd-q select { max-width: 110px; height: 36px; }
      `}</style>
    </BountyShell>
  );
}
