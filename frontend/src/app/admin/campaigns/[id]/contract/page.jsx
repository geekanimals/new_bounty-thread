"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { campaignById } from "@/components/admin/data";

const RULES = ["Collab rights — creator adds the brand as an Instagram collaborator", "Non-delivery = blacklist from the platform", "Re-ship the product at their cost to another creator we name"];

/* Figma: Campaign workspace — Contract & video brief */
export default function WorkspaceContract() {
  const { id } = useParams();
  const c = campaignById(id);
  const [k, setK] = useState({ product: "Beardo Detan Express Kit", value: "1,099", due: "2", rights: "1", deliver: "1 Reel · 1 Story" });
  const [rules, setRules] = useState([true, true, true]);
  const [b, setB] = useState({ shoot: "Morning routine using the Detan kit", keys: "Removes tan in 15 min · use code {code}", tags: "#BeardoDetan @beardo.official", dos: "Natural light · show before / after", donts: "No competitor products" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const F = ({ label, v, set, field, full }) => (
    <div className={`wc-f ${full ? "" : ""}`}>
      <label className="wc-l" htmlFor={`wc-${field}`}>
        {label}
      </label>
      <input id={`wc-${field}`} className="ad-input wc-in" value={v[field]} onChange={(e) => set((p) => ({ ...p, [field]: e.target.value }))} />
    </div>
  );

  return (
    <AdminShell>
      <WorkspaceHead id={c.id} />

      <div className="wc-grid">
        <section className="ad-card wc-card">
          <div className="wc-head">
            <div>
              <h2 className="ad-h2">📜 Contract</h2>
              <p className="wc-sub">Goes out automatically when a creator is approved. Changes apply to contracts sent from now on.</p>
            </div>
            <button type="button" className="wc-resend" onClick={() => setToast("✓ Contract re-sent to 31 approved creators")}>
              Resend contract
            </button>
          </div>
          <div className="wc-two">
            {F({ label: "Product the creator gets", v: k, set: setK, field: "product" })}
            {F({ label: "Product value (₹)", v: k, set: setK, field: "value" })}
            {F({ label: "Content due (days after delivery)", v: k, set: setK, field: "due" })}
            {F({ label: "Ad rights (months)", v: k, set: setK, field: "rights" })}
            {F({ label: "Deliverables", v: k, set: setK, field: "deliver" })}
          </div>
          <h3 className="wc-rules">Rules</h3>
          {RULES.map((r, i) => (
            <label key={r} className="wc-rule">
              <input type="checkbox" checked={rules[i]} onChange={() => setRules((p) => p.map((x, j) => (j === i ? !x : x)))} />
              {r}
            </label>
          ))}
          <button type="button" className="ad-btn ad-btn--primary wc-save" onClick={() => setToast("✓ Contract saved")}>
            Save contract
          </button>
        </section>

        <section className="ad-card wc-card">
          <h2 className="ad-h2">🎬 Video brief</h2>
          <p className="wc-sub">Goes out automatically when the product is delivered.</p>
          <div className="wc-two wc-two--b">
            {F({ label: "What to shoot", v: b, set: setB, field: "shoot" })}
            {F({ label: "Key messages", v: b, set: setB, field: "keys" })}
            {F({ label: "Hashtags & mentions", v: b, set: setB, field: "tags" })}
            {F({ label: "Do’s", v: b, set: setB, field: "dos" })}
            {F({ label: "Don’ts", v: b, set: setB, field: "donts" })}
          </div>
          <button type="button" className="ad-btn ad-btn--primary wc-save wc-save--b" onClick={() => setToast("✓ Video brief saved")}>
            Save brief
          </button>
        </section>
      </div>
      {toast && <div className="ad-toast">{toast}</div>}

      <style>{`
        .wc-grid { display: grid; grid-template-columns: minmax(0, 652fr) minmax(0, 450fr); gap: 20px; align-items: start; }
        .wc-card { padding: 22px 22px 22px; min-width: 0; }
        .wc-head { display: flex; justify-content: space-between; gap: 24px; }
        .wc-sub { margin-top: 8px; font-size: 12px; line-height: 1.33; color: var(--ad-muted); }
        .wc-resend { flex-shrink: 0; width: 86px; margin: 12px 28px 0 0; padding: 0; border: 0; background: none; font-size: 14px; font-weight: 800; line-height: 1.33; color: #6657e9; }
        .wc-resend:hover { color: var(--ad-primary-2); }
        .wc-two { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; margin-top: 20px; }
        .wc-two--b { margin-top: 18px; gap: 0 16px; }
        .wc-f { margin-bottom: 13px; min-width: 0; }
        .wc-l { display: block; margin-bottom: 9px; font-size: 12px; font-weight: 800; color: #60708c; }
        .wc-in { height: 41px; padding: 0 12px; border-color: #dfe2ee; font-size: 12px; font-weight: 800; color: #1d2943; text-overflow: ellipsis; }
        .wc-rules { margin-top: 14px; font-size: 16.4px; font-weight: 700; color: var(--ad-ink); }
        .wc-rule { display: flex; align-items: center; gap: 4px; margin-top: 12px; font-size: 12px; color: var(--ad-ink); cursor: pointer; }
        .wc-rule input { width: 13px; height: 13px; margin: 0 2px 0 4px; accent-color: #5a4bf2; }
        .wc-save { height: 41px; margin-top: 16px; padding: 0 16px; }
        .wc-save--b { margin-top: 4px; }
        @media (max-width: 1180px) { .wc-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .wc-card { padding: 18px 16px; }
          .wc-head { flex-direction: column; gap: 0; }
          .wc-resend { width: auto; margin: 10px 0 0; text-align: left; }
          .wc-two { grid-template-columns: 1fr; }
          .wc-rule { align-items: flex-start; }
          .wc-rule input { margin-top: 1px; flex-shrink: 0; }
          .wc-save { width: 100%; }
        }
      `}</style>
    </AdminShell>
  );
}
