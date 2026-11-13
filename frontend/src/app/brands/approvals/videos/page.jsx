"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import ApprovalTabs from "@/components/brands/ApprovalTabs";
import { BrLoading, BrEmpty, BrError } from "@/components/brands/BrandStates";
import { useApprovals, bWho, bGrad, bAgo } from "@/services/brand";
import { Play, Clock, Check, ArrowRight } from "@/components/ui/Icons";

/** /brands/approvals/videos — creators ke videos jo aapke OK ka wait kar rahe hain (purana paintApprovals "videos") */
export default function VideosToReview() {
  const a = useApprovals();
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), []); // "2 h ago" ke liye — render mein Date.now() nahi

  return (
    <BrandShell>
      <title>Videos to review — Geek OS Brand</title>
      <ApprovalTabs />

      <p className="vr-note">
        <Clock size={14} /> Videos go live only after you approve them. Geek nudges creators if you ask for changes.
      </p>

      {a.loading ? (
        <BrLoading rows={4} />
      ) : a.error ? (
        <BrError error={a.error} onRetry={a.reload} />
      ) : !a.videos.length ? (
        <BrEmpty title="No videos to review" text="When a creator sends their video, it shows up here. You approve it, or ask for changes, before anything posts." />
      ) : (
        <div className="vr-list">
          {a.videos.map((v) => {
            const c = bWho(v.creator);
            const href = `/brands/approvals/video/${v.participation_id}`;
            return (
              <article key={v.participation_id} className="br-card vr-card">
                <Link href={href} className="vr-thumb" style={{ background: bGrad(v.participation_id) }} aria-label={`Watch ${c.name}'s video`}>
                  <span className="vr-thumb__play">
                    <Play size={16} />
                  </span>
                  <span className="vr-thumb__len">Video</span>
                </Link>

                <div className="vr-body">
                  <div className="vr-head">
                    <span className="br-av" style={{ background: c.av }}>
                      {c.initials}
                    </span>
                    <span className="vr-name">
                      <strong>{c.name}</strong>
                      <small>{[c.handle, v.campaign].filter(Boolean).join(" · ")}</small>
                    </span>
                    <span className="br-badge br-badge--orange">Sent {bAgo(v.submitted_at, now)}</span>
                  </div>
                  <p className="vr-cap">{v.note || "No note from the creator — open the video to watch it."}</p>
                  <div className="vr-meta">
                    <span className="vr-check">
                      <Check size={12} /> Waiting for your OK
                    </span>
                  </div>
                </div>

                <Link href={href} className="br-btn br-btn--primary vr-watch">
                  {a.can ? "Watch & review" : "Watch"} <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </div>
      )}

      <style>{`
        .vr-note { display: flex; align-items: center; gap: 8px; margin: 0 0 16px; padding: 11px 14px; border-radius: 12px; background: var(--br-blue-bg); color: var(--br-blue); font-size: 12.5px; font-weight: 500; }
        .vr-list { display: grid; gap: 14px; }
        .vr-card { display: flex; align-items: center; gap: 20px; padding: 16px; }
        .vr-thumb { position: relative; flex-shrink: 0; width: 96px; aspect-ratio: 9 / 16; border-radius: 14px; display: grid; place-items: center; color: #fff; }
        .vr-thumb__play { width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,.28); display: grid; place-items: center; }
        .vr-thumb__len { position: absolute; bottom: 8px; right: 8px; padding: 1px 6px; border-radius: 6px; background: rgba(0,0,0,.35); font-size: 10.5px; font-weight: 700; }
        .vr-body { flex: 1; min-width: 0; }
        .vr-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .vr-name { flex: 1; min-width: 0; }
        .vr-name strong { display: block; font-size: 15px; font-weight: 800; }
        .vr-name small { display: block; font-size: 12px; color: var(--br-muted); }
        .vr-cap { margin: 12px 0 10px; font-size: 13.5px; line-height: 1.55; color: var(--br-text); }
        .vr-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; font-weight: 600; }
        .vr-check { display: inline-flex; align-items: center; gap: 5px; color: var(--br-green); }
        .vr-warn { display: inline-flex; align-items: center; gap: 5px; color: var(--br-orange); }
        .vr-watch { flex-shrink: 0; }

        @media (max-width: 760px) {
          .vr-card { flex-wrap: wrap; align-items: flex-start; gap: 14px; }
          .vr-thumb { width: 78px; }
          .vr-body { flex-basis: calc(100% - 92px); }
          .vr-watch { width: 100%; }
        }
      `}</style>
    </BrandShell>
  );
}
