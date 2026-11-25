"use client";

import { useRpc } from "@/lib/supabase";
import { fmtDate } from "@/components/admin/campaign/live";

/*
 * 🐾 Brief details + 📦 delivered date — creator page (api.campaign_creator_extras).
 * Campaign ke criteria (gender / age / marital / categories / pets) jo bhi brief mein hain, unki values
 * (account se, ya sheet-only creator ki sheet se) + courier kis din delivered hua.
 */
const PET = { dog: "Dog", cat: "Cat", bird: "Bird", fish: "Fish", rabbit: "Rabbit", hamster: "Hamster", reptile: "Reptile", horse: "Horse", small_mammal: "Small pet", other: "Other" };
const cap = (v) => String(v || "").replace(/_/g, " ").replace(/^./, (m) => m.toUpperCase());
const petAge = (a) => {
  if (a == null || a === "") return "";
  const n = Number(a);
  if (!isNaN(n)) return n < 1 ? `${Math.max(1, Math.round(n * 12))} months` : `${Math.round(n * 10) / 10} yr${n >= 2 ? "s" : ""}`;
  return String(a);
};

export default function CreatorExtras({ campaignId, row }) {
  const on = !!campaignId && campaignId !== "sample" && !!row;
  const x = useRpc("admin", "api.campaign_creator_extras", { p_campaign: campaignId }, { skip: !on, refreshMs: 120000 });
  if (!on || x.error || !x.data) return null;
  const crit = x.data.criteria || {};
  const e = (x.data.rows || {})[row.kind === "p" ? "p:" + row.pid : "i:" + row.iid] || {};
  const items = [];
  if (crit.gender) items.push(["Gender", e.gender ? cap(e.gender) : null, `brief: ${crit.gender}`]);
  if (crit.age) items.push(["Age", e.age || e.dob ? `${e.age || ""}${e.dob && !e.age ? e.dob : ""}` : null, `brief: ${crit.age}`]);
  if (crit.marital) items.push(["Marital status", e.marital ? cap(e.marital) : null, `brief: ${crit.marital}`]);
  if (crit.categories) items.push(["Categories", (e.categories || []).length ? e.categories.join(", ") : null, `brief: ${(crit.categories || []).join(", ")}`]);
  const pets = Array.isArray(e.pets) ? e.pets : [];
  if (!items.length && !crit.pet && !e.delivered_at) return null;

  return (
    <section className="ga-card cx">
      <div className="cx-head">
        <h2 className="ga-h2">🐾 Brief details</h2>
        {e.delivered_at && <span className="cx-del">📦 Delivered on {fmtDate(e.delivered_at, true)}</span>}
      </div>
      {(items.length > 0 || crit.pet) && (
        <div className="cx-grid">
          {items.map(([k, v, b]) => (
            <div key={k} className={`cx-it ${v ? "" : "is-miss"}`}>
              <p className="cx-k">{k}</p>
              <p className="cx-v">{v || "Missing"}</p>
              <p className="cx-b">{b}</p>
            </div>
          ))}
          {crit.pet && (
            <div className={`cx-it cx-pets ${pets.length ? "" : "is-miss"}`}>
              <p className="cx-k">Pets {pets.length ? `· ${pets.length}` : ""}</p>
              {pets.length ? (
                <ul>
                  {pets.map((p, i) => (
                    <li key={i}>
                      <b>{p.name || "—"}</b> · {PET[String(p.type || "").toLowerCase()] || cap(p.type) || "—"}
                      {p.breed ? ` · ${p.breed}` : ""}
                      {petAge(p.age) ? ` · ${petAge(p.age)}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cx-v">Missing</p>
              )}
              <p className="cx-b">brief: {crit.pet === "any" ? "has a pet" : crit.pet}</p>
            </div>
          )}
        </div>
      )}
      <style>{`
        .cx { padding: 16px 20px; margin-top: 14px; }
        .cx-head { display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
        .cx-del { padding: 3px 10px; border-radius: 999px; background: #e3f6ea; color: #1d7a45; font-size: 12px; font-weight: 700; }
        .cx-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; margin-top: 12px; }
        .cx-it { padding: 10px 12px; border-radius: 12px; background: var(--ad-soft-2, #f6f7fb); }
        .cx-it.is-miss { background: #fff4f4; }
        .cx-pets { grid-column: span 2; }
        .cx-k { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: #9aa2b4; }
        .cx-v { margin: 4px 0 0; font-size: 14px; font-weight: 700; }
        .cx-it.is-miss .cx-v { color: #b42335; }
        .cx-b { margin: 3px 0 0; font-size: 11.5px; color: #9aa2b4; }
        .cx-pets ul { list-style: none; margin: 6px 0 0; padding: 0; display: grid; gap: 4px; font-size: 13px; }
      `}</style>
    </section>
  );
}
