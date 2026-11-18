"use client";

import Wizard, { Field, useDraft } from "@/components/admin/campaign/Wizard";

/* Figma: New campaign — 2 Deliverables */
export default function NewCampaignDeliverables() {
  const { d, set } = useDraft();
  const n = (k) => Number(d[k]) || 0;
  return (
    <Wizard step={1} draft={{ d, set }}>
      <p className="nc-sec">What each creator delivers</p>
      <div className="nc-grid">
        <Field label="Reels" k="reels" d={d} set={set} type="number" />
        <Field label="Stories" k="stories" d={d} set={set} type="number" />
        <Field label="Feed posts" k="posts" d={d} set={set} type="number" />
        <Field label="Carousels" k="carousels" d={d} set={set} type="number" />
        <Field label="⭐ Google reviews (creator uploads a screenshot)" k="googleReviews" d={d} set={set} type="number" placeholder="0" />
        <Field label="🎟️ District reviews (creator uploads a screenshot)" k="districtReviews" d={d} set={set} type="number" placeholder="0" />
        <Field full label="Anything else each creator does (optional)" k="other" d={d} set={set} placeholder="e.g. tag the store location" />
      </div>
      <p className="nc-sec">Commercial value</p>
      <div className="nc-grid">
        <Field label="Product / reward" k="reward" d={d} set={set} placeholder="e.g. curated PR kit" />
        <Field label="Product value ₹" k="value" d={d} set={set} type="number" placeholder="e.g. 2000" />
        <Field label="Content due after delivery (days)" k="due" d={d} set={set} type="number" />
        <Field label="Usage / ad rights (months)" k="rights" d={d} set={set} type="number" />
        {d.type !== "Paid" && <Field full label="Product link (optional)" k="productLink" d={d} set={set} type="url" placeholder="https://brand.example/product" />}
      </div>
      <div className="nd-sum">
        <p className="nd-sum__t">Creator-facing summary</p>
        <p className="nd-sum__v">
          {n("reels")} Reel(s) · {n("stories")} Story(ies) · {n("posts")} Post(s) · {n("carousels")} Carousel(s)
          {n("googleReviews") ? ` · ${n("googleReviews")} Google review(s)` : ""}
          {n("districtReviews") ? ` · ${n("districtReviews")} District review(s)` : ""}
          {d.other ? ` · ${d.other}` : ""}
        </p>
        {(n("googleReviews") > 0 || n("districtReviews") > 0) && <p className="nd-sum__n">⭐ Reviews: each creator uploads a screenshot of the review (or you upload a folder of screenshots in Content → Review screenshots). A creator isn’t marked done until the screenshots are in.</p>}
        <p className="nd-sum__n">Use explicit licensing scope and fee, especially for paid amplification and perpetual usage.</p>
      </div>
      <style>{`
        .nd-sum { margin-top: 4px; padding: 17px 16px 34px; border-radius: 14px; background: #f5f3ff; border: 1px solid #e3dfff; }
        .nd-sum__t { font-size: 14px; font-weight: 700; color: #6257a1; }
        .nd-sum__v { margin-top: 14px; font-size: 14px; color: #6257a1; }
        .nd-sum__n { margin-top: 14px; font-size: 12px; color: var(--ad-muted); }
      `}</style>
    </Wizard>
  );
}
