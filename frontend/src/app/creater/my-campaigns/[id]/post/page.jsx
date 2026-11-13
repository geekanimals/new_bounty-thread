"use client";

import { useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import TrackerFrame, { useTracker, TrackerWait, StepMismatch } from "@/components/creater/TrackerSteps";
import PostStats from "@/components/creater/PostStats";
import { postProgress, recordPost } from "@/services/creator";
import { Instagram } from "@/components/ui/Icons";

/**
 * /creater/my-campaigns/[id]/post — purane "Approved — let's post!" + openPostModal jaisa:
 * kya post kiya (Reel / Story / Feed post) + Instagram link + caption → api.record_campaign_post
 * (caption ka hashtag/mention check server par). Har deliverable post hone tak yahi step.
 */
export default function PostStep() {
  const t = useTracker();
  const [link, setLink] = useState("");
  const [caption, setCaption] = useState("");
  const [kind, setKind] = useState("");
  const [err, setErr] = useState("");
  const [warn, setWarn] = useState("");
  const [busy, setBusy] = useState(false);

  if (!t.m)
    return (
      <BountyShell>
        <TrackerWait t={t} />
      </BountyShell>
    );
  const { c, m } = t;
  const onStep = t.step === "post";
  const pp = postProgress(m);
  const first = (pp.left[0] || "Reel").toLowerCase();
  const mt = kind || (first === "post" ? "post" : first);

  const submit = async () => {
    setErr("");
    setWarn("");
    const permalink = link.trim();
    if (!/^https?:\/\/(www\.|m\.)?instagram\.com\/(reel|reels|p|tv|stories)\//i.test(permalink))
      return setErr("Paste the Instagram link of the post (instagram.com/reel/… , /p/… or /stories/…).");
    setBusy(true);
    const r = await recordPost(m.participation_id, { media_type: mt, permalink, caption: caption.trim() });
    setBusy(false);
    if (r.error) return setErr(r.error.message || String(r.error));
    if (r.data && r.data.caption_check === "issues")
      setWarn("Recorded — but your caption looks like it's missing a required hashtag or mention from the brief. Check your alerts and update it.");
    setLink("");
    setCaption("");
    setKind("");
    t.reload();
  };

  const body = () => {
    if (!onStep) return <StepMismatch t={t} />;
    return (
      <>
        <span className="ts-ic ts-ic--green">✓</span>
        <h2>{m.stage === "published" ? `Next: post your ${pp.left.join(" + ")}` : "Approved — post it on Instagram!"}</h2>
        <p>
          {m.stage === "published"
            ? "Your first post is live ✓. The campaign completes when every post is up — post the rest, then add its link here."
            : "Post with the collab tag and #ad, then paste the link here. We check the caption against the brief and start tracking its performance."}
        </p>
        {pp.items.length > 0 && (
          <div className="po-pp">
            {pp.items.map((x) => (
              <span key={x.key} className={x.done >= x.need ? "is-ok" : ""}>
                {x.done >= x.need ? "✓ " : ""}
                {x.label} <b>{x.done}/{x.need}</b>
              </span>
            ))}
          </div>
        )}
        <label className="bx-label" htmlFor="po-kind">
          What did you post?
        </label>
        <select id="po-kind" className="bx-input" value={mt} onChange={(e) => setKind(e.target.value)}>
          <option value="reel">Reel</option>
          <option value="story">Story</option>
          <option value="post">Feed post</option>
        </select>
        <label className="bx-label" htmlFor="po-link">
          <Instagram size={12} /> Your post link
        </label>
        <input id="po-link" className="bx-input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.instagram.com/reel/…" />
        <label className="bx-label" htmlFor="po-cap">
          Caption you used
        </label>
        <textarea id="po-cap" className="bx-input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Paste your caption incl. #hashtags and @mentions" />
        {err && <p className="ts-err">{err}</p>}
        {warn && <p className="ts-note">{warn}</p>}
        <div className="po-btns">
          <button type="button" className="bx-btn bx-btn--dark ts-mt" disabled={busy} onClick={submit}>
            {busy ? "Recording…" : "Submit link →"}
          </button>
          <Link href="/creater/media-kit" className="bx-btn bx-btn--ghost ts-mt">
            Open Media Kit
          </Link>
        </div>
        <PostStats m={m} />
      </>
    );
  };

  return (
    <BountyShell>
      <title>{`Post link — ${c.title} — Bounty`}</title>
      <TrackerFrame t={t} step={onStep ? "post" : undefined}>
        {body()}
      </TrackerFrame>
      <style>{`
        .po-pp { display: flex; gap: 6px; flex-wrap: wrap; margin: 0 0 12px; }
        .po-pp span { padding: 4px 10px; border-radius: 999px; background: #fffaf0; border: 1px solid var(--bx-line); font-size: 12px; }
        .po-pp span.is-ok { background: var(--bx-ok-bg); border-color: transparent; color: var(--bx-ok); }
        .po-btns { display: flex; gap: 10px; flex-wrap: wrap; }
      `}</style>
    </BountyShell>
  );
}
