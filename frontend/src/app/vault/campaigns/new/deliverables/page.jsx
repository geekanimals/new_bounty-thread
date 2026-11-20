"use client";

import Link from "next/link";
import Wizard, { Field, useDraft, DELIV_KINDS } from "@/components/admin/campaign/Wizard";

/* Figma: New campaign — 2 Deliverables */
const LABELS = { reel: "Reels", story: "Stories", post: "Feed posts", carousel: "Carousels", google_review: "Google reviews", district_review: "District reviews" };

export default function NewCampaignDeliverables() {
  const { d, set } = useDraft();
  const n = (k) => Number(d[k]) || 0;
  const briefs = d.dBriefs && typeof d.dBriefs === "object" ? d.dBriefs : {};
  const setBrief = (key, patch) => set("dBriefs", { ...briefs, [key]: { central: true, text: "", ...(briefs[key] || {}), ...patch } });
  const central = String(d.brief || "").trim();
  return (
    <Wizard step={1} draft={{ d, set }}>
      <p className="nc-sec">What each creator delivers</p>
      <div className="db-central">
        <b>📋 Central brief</b>
        {central ? <p>{central.length > 220 ? central.slice(0, 220) + "…" : central}</p> : <p className="db-muted">Not written yet — it goes in the next step (Terms &amp; creative). Every deliverable with “Follow the central brief” ticked uses it.</p>}
        <Link href={`/vault/campaigns/new/terms?${d.editId ? `edit=${d.editId}&` : ""}focus=brief`}>{central ? "Edit central brief ›" : "Write central brief ›"}</Link>
      </div>
      <div className="db-list">
        {DELIV_KINDS.map((x) => {
          const on = n(x.k) > 0;
          const b = briefs[x.key] || {};
          const useC = b.central !== false;
          return (
            <div key={x.key} className={`db-card ${on ? "is-on" : ""} ${on && !useC ? "is-own" : ""}`}>
              <div className="db-card__h">
                <label className="db-name" htmlFor={`nc-${x.k}`}>
                  {x.icon} {LABELS[x.key]}
                </label>
                <input id={`nc-${x.k}`} className="ga-input db-num" type="number" min={0} value={d[x.k] ?? ""} placeholder="0" onChange={(e) => set(x.k, e.target.value)} />
              </div>
              {(x.key === "google_review" || x.key === "district_review") && <small className="db-muted">Creator uploads a screenshot of the review.</small>}
              {on ? (
                <>
                  <label className="db-tick">
                    <input type="checkbox" checked={useC} onChange={(e) => setBrief(x.key, { central: e.target.checked })} />
                    <span>Follow the central brief</span>
                  </label>
                  <textarea
                    className="ga-input db-area"
                    value={b.text || ""}
                    onChange={(e) => setBrief(x.key, { text: e.target.value })}
                    placeholder={useC ? `Anything extra just for the ${x.label.toLowerCase()} (optional) — hook, length, what to show` : `Brief for the ${x.label.toLowerCase()} — what to shoot / write, length, hook, must-show items…`}
                  />
                  <small className="db-muted">{useC ? `Creators see the central brief${b.text ? " + these extra notes" : ""}.` : "Creators see only this brief for it."}</small>
                </>
              ) : (
                <small className="db-muted">Set a number to add it and write its brief.</small>
              )}
            </div>
          );
        })}
      </div>
      <div className="nc-grid">
        <Field full label="Anything else each creator does (optional)" k="other" d={d} set={set} placeholder="e.g. tag the store location" />
      </div>
      <p className="nc-sec">{d.type === "Physical visit" ? "Content timing & rights" : "Commercial value"}</p>
      <div className="nc-grid">
        {d.type !== "Physical visit" && <Field label="Product / reward" k="reward" d={d} set={set} placeholder="e.g. curated PR kit" />}
        {d.type !== "Physical visit" && <Field label="Product value ₹" k="value" d={d} set={set} type="number" placeholder="e.g. 2000" />}
        <Field label={d.type === "Physical visit" ? "Content due after the visit (days)" : "Content due after delivery (days)"} k="due" d={d} set={set} type="number" />
        <Field label="Usage / ad rights (months)" k="rights" d={d} set={set} type="number" />
        {d.type !== "Paid" && d.type !== "Physical visit" && <Field full label="Product link (optional)" k="productLink" d={d} set={set} type="url" placeholder="https://brand.example/product" />}
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
        .db-central { display: grid; gap: 6px; padding: 14px 16px; border-radius: 14px; background: #f5f3ff; border: 1px solid #e3dfff; margin-bottom: 12px; }
        .db-central b { font-size: 14px; color: #3d347a; }
        .db-central p { margin: 0; font-size: 13px; line-height: 1.5; color: #4b4470; white-space: pre-line; }
        .db-central a { justify-self: start; font-size: 12.5px; font-weight: 700; color: #6257a1; }
        .db-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 12px; margin-bottom: 14px; }
        .db-card { display: grid; align-content: start; gap: 8px; padding: 12px 14px; border-radius: 14px; background: #fafbfd; border: 1px solid var(--ad-line, #e6e8f0); }
        .db-card.is-on { background: #fff; border-color: #d6d0fb; }
        .db-name { font-size: 14px; font-weight: 700; color: #1d2340; }
        .db-num { width: 84px; text-align: center; }
        .db-card.is-own { border-color: #b9aef5; box-shadow: 0 0 0 3px #f1eeff; }
        .db-card__h { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .db-card__h b { font-size: 14px; color: #1d2340; }
        .db-card__h small { font-weight: 500; color: var(--ad-muted, #8793a9); }
        .db-tick { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: #4b4470; cursor: pointer; }
        .db-tick input { width: 16px; height: 16px; accent-color: #6257a1; }
        .db-area { min-height: 84px; resize: vertical; font-size: 13px; }
        .db-muted { margin: 0; font-size: 12px; color: var(--ad-muted, #8793a9); }
        .nd-sum { margin-top: 4px; padding: 17px 16px 34px; border-radius: 14px; background: #f5f3ff; border: 1px solid #e3dfff; }
        .nd-sum__t { font-size: 14px; font-weight: 700; color: #6257a1; }
        .nd-sum__v { margin-top: 14px; font-size: 14px; color: #6257a1; }
        .nd-sum__n { margin-top: 14px; font-size: 12px; color: var(--ad-muted); }
      `}</style>
    </Wizard>
  );
}
