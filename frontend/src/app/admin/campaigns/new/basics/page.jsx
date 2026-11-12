"use client";

import { useState } from "react";
import Wizard, { Field, useDraft } from "@/components/admin/campaign/Wizard";
import { BRANDS } from "@/components/admin/data";

const TYPES = ["Barter", "Paid", "Barter + Paid"];

/* Figma: New campaign — 1 Basics */
export default function NewCampaignBasics() {
  const { d, set } = useDraft();
  const [err, setErr] = useState("");
  const next = () => {
    if (!d.name.trim() || !d.brand.trim()) {
      setErr("Add a campaign name and brand to continue.");
      return false;
    }
    setErr("");
  };
  return (
    <Wizard step={0} onNext={next} error={err}>
      <p className="nc-sec">Campaign type</p>
      <div className="ad-tabs nb-types" role="radiogroup" aria-label="Campaign type">
        {TYPES.map((t) => (
          <button key={t} type="button" role="radio" aria-checked={d.type === t} className={`ad-tab ${d.type === t ? "is-on" : ""}`} onClick={() => set("type", t)}>
            {t}
          </button>
        ))}
      </div>
      <p className="nb-hint">The creator journey, product and payout fields adapt to campaign type.</p>
      <div className="nc-grid">
        <Field label="Campaign name *" k="name" d={d} set={set} placeholder="e.g. Winter Essentials Launch" />
        <div className="nc-field">
          <label className="nc-label" htmlFor="nc-brand">
            Brand *
          </label>
          <input id="nc-brand" className="ad-input nc-input nb-brand" list="nb-brands" value={d.brand} onChange={(e) => set("brand", e.target.value)} />
          <datalist id="nb-brands">
            {BRANDS.map((b) => (
              <option key={b.id} value={b.name} />
            ))}
          </datalist>
        </div>
        <Field label="Objective" k="objective" d={d} set={set} options={["Awareness", "Engagement", "Sales", "UGC content", "App installs"]} />
        <Field label="Target creator count" k="target" d={d} set={set} type="number" />
        <Field label="Status" k="status" d={d} set={set} options={["Draft", "Live", "Shortlist"]} />
        <Field label="Creator deadline (days)" k="deadline" d={d} set={set} type="number" />
      </div>
      <p className="nc-note nc-note--warn">
        <span>💡</span> Save as draft first. Going live should require a complete brief, rights/terms, budget and creator eligibility validation.
      </p>
      <style>{`
        .nb-types { margin-bottom: 9px; }
        .nb-types .ad-tab { height: 38px; font-weight: 800; color: #65718a; }
        .nb-types .ad-tab.is-on { color: #fff; }
        .nb-hint { margin: 0 0 14px; font-size: 12px; color: var(--ad-muted); }
        .nb-brand { height: 43px; }
      `}</style>
    </Wizard>
  );
}
