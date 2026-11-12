"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BountyShell from "@/components/creater/BountyShell";
import TrackerFrame, { useTracker } from "@/components/creater/TrackerSteps";
import { Instagram } from "@/components/ui/Icons";

/** /creater/my-campaigns/[id]/post — draft approve ho gaya: Instagram par post karo, link daalo */
export default function PostStep() {
  const router = useRouter();
  const { c, base } = useTracker();
  const [link, setLink] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    if (!/^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels)\/[\w-]+/i.test(link.trim())) {
      setErr("Paste the link of your Instagram post or Reel, like instagram.com/reel/abc123");
      return;
    }
    setErr("");
    router.push(`${base}/verified`);
  };

  return (
    <BountyShell>
      <title>{`Post link — ${c.title} — Bounty`}</title>
      <TrackerFrame step="post">
        <span className="ts-ic ts-ic--green">✓</span>
        <h2>Approved — post it on Instagram!</h2>
        <p>Post with the collab tag and #ad, then paste the link here. We check it’s live with the right tags, then release your reward.</p>
        <label className="bx-label" htmlFor="po-link">
          <Instagram size={12} /> Your post link
        </label>
        <input id="po-link" className="bx-input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.instagram.com/reel/…" />
        {err && <p className="bx-err">{err}</p>}
        <div>
          <button type="button" className="bx-btn bx-btn--dark ts-mt" onClick={submit}>
            Submit link →
          </button>
        </div>
      </TrackerFrame>
    </BountyShell>
  );
}
