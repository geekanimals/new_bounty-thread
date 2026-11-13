"use client";

import Wizard, { Field, useDraft } from "@/components/admin/campaign/Wizard";

/* Figma: New campaign — 4 Eligibility & tracking */
export default function NewCampaignEligibility() {
  const { d, set } = useDraft();
  return (
    <Wizard step={3} draft={{ d, set }}>
      <h2 className="ne-h">Eligibility</h2>
      <p className="ne-sub">Make eligibility transparent and relevant to the brief. Avoid unnecessary sensitive demographic filters.</p>
      <div className="nc-grid">
        <Field label="Locations" k="locations" d={d} set={set} placeholder="e.g. Bengaluru, Mumbai" />
        <Field label="Minimum followers" k="minF" d={d} set={set} type="number" placeholder="e.g. 1000" />
        <Field label="Maximum followers" k="maxF" d={d} set={set} type="number" placeholder="e.g. 100000" />
        <Field label="Instagram account requirement" k="igReq" d={d} set={set} options={["Verified Instagram connection", "Any Instagram handle", "No Instagram needed"]} />
      </div>
      <p className="nc-sec">Attribution</p>
      <label className="ne-check">
        <input type="checkbox" checked={d.tracking} onChange={(e) => set("tracking", e.target.checked)} />
        <span className="ne-box" aria-hidden="true">{d.tracking ? "✓" : ""}</span>
        Enable per-creator tracking links
      </label>
      <div className="nc-grid">
        <Field label="Brand shop / landing URL" k="url" d={d} set={set} type="url" placeholder="https://brand.example/offer" />
        <Field label="Offer or coupon code" k="code" d={d} set={set} placeholder="Optional" />
      </div>
      <p className="nc-note nc-note--warn">
        <span>ℹ️</span> Never display zero clicks or sales until links are valid and tracking is actually enabled. Link and coupon settings should be verified before launch.
      </p>
      <style>{`
        .ne-h { margin-top: 6px; font-family: var(--ad-head); font-size: 17px; font-weight: 800; letter-spacing: -0.4px; color: var(--ad-ink); }
        .ne-sub { margin: 8px 0 18px; font-size: 12px; color: var(--ad-muted); }
        .ne-check { position: relative; display: inline-flex; align-items: center; gap: 4px; margin: -2px 0 18px; font-size: 14px; color: var(--ad-ink); cursor: pointer; }
        .ne-check input { position: absolute; opacity: 0; pointer-events: none; }
        .ne-box { width: 38px; height: 22px; margin-left: 4px; border-radius: 4px; display: grid; place-items: center; background: #fff; border: 2px solid #c9cde0; color: #fff; font-size: 12px; font-weight: 800; }
        .ne-check input:checked + .ne-box { background: #5a4bf2; border-color: #4a3ce0; }
        .ne-check input:focus-visible + .ne-box { box-shadow: 0 0 0 3px rgba(103,87,245,.25); }
      `}</style>
    </Wizard>
  );
}
