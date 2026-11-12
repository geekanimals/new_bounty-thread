"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BountyShell from "@/components/creater/BountyShell";
import TrackerFrame, { useTracker } from "@/components/creater/TrackerSteps";
import { Upload } from "@/components/ui/Icons";

/** /creater/my-campaigns/[id]/revision — brand ne change maanga: note padho, fix karke dobara bhejo */
export default function RevisionStep() {
  const router = useRouter();
  const { c, base } = useTracker();
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [sent, setSent] = useState(false); // bhejne ke baad brand review

  return (
    <BountyShell>
      <title>{`Fix your draft — ${c.title} — Bounty`}</title>
      <TrackerFrame step="draft">
        {sent ? (
          <>
            <span className="ts-ic">👀</span>
            <h2>Draft sent — {c.brand} is reviewing</h2>
            <p>Usually within 24 hours. Don’t post yet — wait for the OK.</p>
            <div className="ts-demos">
              <button type="button" className="ts-demo" onClick={() => router.push(`${base}/post`)}>
                Demo: brand approves →
              </button>
            </div>
          </>
        ) : (
          <>
        <div className="dr-rev">
          <strong>🔁 {c.brand} asked for a change</strong>
          <p>“Love it! Please show the product in the first 3 seconds and keep the music low.”</p>
        </div>
            <h2>Fix &amp; resubmit your draft</h2>
            <label className={`dr-upload ${file ? "is-on" : ""}`}>
              <input type="file" accept="video/*,image/*" onChange={(e) => setFile(e.target.files?.[0]?.name || null)} />
              <Upload size={18} />
              <strong>{file || "Upload your Reel (mp4, up to 200 MB)"}</strong>
              <small>{file ? "Ready to send ✓" : "Tap to choose a file"}</small>
            </label>
            <label className="bx-label" htmlFor="dr-cap">
              Caption
            </label>
            <textarea
              id="dr-cap"
              className="bx-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={`Your caption… remember #ad and tag @${c.brand.toLowerCase().replace(/\s/g, "")}`}
            />
            <div>
              <button type="button" className="bx-btn bx-btn--dark ts-mt" disabled={!file} onClick={() => setSent(true)}>
                Resubmit draft →
              </button>
            </div>
          </>
        )}
      </TrackerFrame>
      <style>{`
        .dr-rev { margin-bottom: 6px; padding: 12px 14px; border-radius: 12px; background: #f8e1d6; border: 1px solid #ebbca6; }
        .dr-rev strong { font-size: 14px; color: var(--bx-red); }
        .dr-rev p { margin: 4px 0 0; font-family: var(--bx-serif); font-style: italic; font-size: 13.5px; }
        .dr-upload { display: flex; flex-direction: column; align-items: center; gap: 4px; margin: 12px 0 14px; padding: 22px; border-radius: 14px; border: 2px dashed #d3c19a; background: #fffaf0; text-align: center; cursor: pointer; }
        .dr-upload input { display: none; }
        .dr-upload.is-on { border-color: var(--bx-teal); background: #eef8f3; }
        .dr-upload strong { font-size: 13.5px; overflow-wrap: anywhere; }
        .dr-upload small { font-size: 12px; color: var(--bx-muted); }
      `}</style>
    </BountyShell>
  );
}
