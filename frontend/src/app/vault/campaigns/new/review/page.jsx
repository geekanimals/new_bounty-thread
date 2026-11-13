"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Wizard, { useDraft, saveCampaign } from "@/components/admin/campaign/Wizard";

/* Figma: New campaign — 5 Review */
export default function NewCampaignReview() {
  const router = useRouter();
  const { d, set, clear } = useDraft();
  const [done, setDone] = useState("");
  const [err, setErr] = useState("");
  const n = (k) => Number(d[k]) || 0;
  const plural = (v, one, many) => `${v} ${v === 1 ? one : many}`;
  const parts = [n("reels") && plural(n("reels"), "Reel", "Reels"), n("stories") && plural(n("stories"), "Story", "Stories"), n("posts") && plural(n("posts"), "Post", "Posts"), n("carousels") && plural(n("carousels"), "Carousel", "Carousels")].filter(Boolean);

  const checks = [
    { t: "Campaign name and brand", ok: !!(d.name.trim() && d.brand.trim()) },
    { t: "Deliverables defined", ok: parts.length > 0 },
    { t: "Product / payment terms", ok: !!(d.reward.trim() && d.value) },
    { t: "Creative brief", ok: !!d.brief.trim() },
    { t: "Tracking destination, if enabled", ok: !d.tracking || !!d.url.trim() },
  ];

  /* Save — public.campaigns insert/update (purana openCampaignModal). Naya campaign → seedha Bulk sheet (creators add karo) */
  const finish = async () => {
    setErr("");
    try {
      const r = await saveCampaign(d);
      const wasEdit = !!d.editId;
      clear();
      setDone(wasEdit ? "✓ Campaign saved" : d.status === "Draft" ? "✓ Saved as draft" : "✓ Campaign launched — add creators next");
      setTimeout(() => router.push(r.id ? (wasEdit ? `/vault/campaigns/${r.id}/overview` : `/vault/campaigns/${r.id}/upload`) : "/vault/campaigns"), 900);
    } catch (e) {
      setErr(e.message || "Couldn't save.");
    }
    return false;
  };

  return (
    <Wizard step={4} draft={{ d, set }} onNext={finish} error={err} nextLabel={d.editId ? "Save changes" : d.status === "Draft" ? "Save as draft" : "Launch campaign"}>
      <div className="nr-box">
        <h2>Review campaign draft</h2>
        <p>
          <b>{d.name.trim() || "Untitled campaign"}</b>· {d.brand.trim() || "No brand yet"} · {d.type}
        </p>
        <p>
          {parts.join(" · ") || "No deliverables"} · {n("target")} creators · {n("due")} days due after delivery
        </p>
        <p>
          {d.reward.trim() || "Reward not specified"} · ₹{d.value || "—"} · {n("rights")} month(s) usage rights
        </p>
        <p>
          Eligibility: {d.locations.trim() || "Any location"} · Min followers {d.minF || "Any"}
        </p>
        <p>
          Tracking: {d.tracking ? "Enabled" : "Off"}
          {d.tracking && ` · ${d.url.trim() ? "Shop URL added" : "Shop URL missing"}`}
        </p>
      </div>

      <p className="nc-sec">Pre-launch checks</p>
      <div className="nr-checks">
        {checks.map((c) => (
          <div key={c.t} className="nr-check">
            <span className="nr-ic">{c.ok ? "✓" : "!"}</span>
            <b>{c.t}</b>
            <span className={`ga-badge ga-badge--${c.ok ? "green" : "orange"}`}>{c.ok ? "Ready" : "Needs detail"}</span>
          </div>
        ))}
      </div>
      <p className="nr-note">Saving creates the campaign for every admin; creators see it once it is Live.</p>
      {done && <div className="ga-toast">{done}</div>}

      <style>{`
        .nr-box { padding: 18px 16px 22px; border-radius: 14px; background: #f5f3ff; border: 1px solid #e3dfff; color: #6257a1; }
        .nr-box h2 { font-family: var(--ad-head); font-size: 17px; font-weight: 800; letter-spacing: -0.4px; }
        .nr-box p { margin-top: 14px; font-size: 14px; line-height: 1.33; }
        .nr-box h2 + p { margin-top: 16px; }
        .nr-box b { font-weight: 700; }
        .nr-box + .nc-sec { margin-top: 24px; }
        .nr-checks { display: flex; flex-direction: column; gap: 9px; }
        .nr-check { display: flex; align-items: center; gap: 14px; min-height: 66px; padding: 12px 13px; border-radius: 12px; border: 1px solid var(--ad-line); }
        .nr-check b { flex: 1; min-width: 0; font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        .nr-ic { width: 38px; height: 38px; flex-shrink: 0; border-radius: 10px; display: grid; place-items: center; background: var(--ad-soft); font-size: 19px; color: var(--ad-ink); }
        .nr-note { margin-top: 12px; font-size: 12px; color: var(--ad-muted); }
      `}</style>
    </Wizard>
  );
}
