"use client";

import { useState } from "react";
import Wizard, { Field, useDraft, eligFromBrief } from "@/components/admin/campaign/Wizard";

/* Figma: New campaign — 4 Eligibility & tracking */
export default function NewCampaignEligibility() {
  const { d, set } = useDraft();
  const [note, setNote] = useState("");
  // purana cmEligAuto: brief / video brief padh kar sirf khali boxes bharo (team ka likha kabhi nahi badalta)
  const fromBrief = () => {
    const e = eligFromBrief([d.brief, d.message, d.dos, d.donts].join("\n"));
    const got = [];
    const put = (k, v, label, show) => {
      if (v == null || v === "" || String(d[k] || "").trim()) return;
      set(k, String(v));
      got.push(`${label}: ${show ?? v}`);
    };
    put("locations", (e.locations || []).join(", "), "Location");
    put("gender", e.gender, "Gender");
    put("minF", e.min_followers, "Min followers");
    put("maxF", e.max_followers, "Max followers");
    put("ageMin", e.age_min, "Age from");
    put("ageMax", e.age_max, "Age to");
    put("marital", e.marital, "Married / unmarried", e.marital === "single" ? "Unmarried" : "Married");
    put("pet", e.pet, "Pet", "Must have a pet");
    put("petType", e.pet_type, "Pet type");
    setNote(got.length ? `✨ Filled from the brief — ${got.join(" · ")}. Check it; change it or type Any if it's wrong.` : "Nothing new found in the brief — every box it could fill is already filled, or the brief doesn't say.");
  };
  return (
    <Wizard step={3} draft={{ d, set }}>
      <h2 className="ne-h">Eligibility</h2>
      <p className="ne-sub">Only creators who match get through when they apply — every box is checked automatically (leave it empty or type Any for no rule). The same rules pick who shows in 🎯 Find matching creators.</p>
      <button type="button" className="ga-btn ga-btn--ghost ne-auto" onClick={fromBrief}>
        ✨ Fill from the brief
      </button>
      {note && <p className="ne-note">{note}</p>}
      <div className="nc-grid">
        <Field label="Locations" k="locations" d={d} set={set} placeholder="Any (e.g. Bengaluru, Mumbai)" />
        <Field label="Gender" k="gender" d={d} set={set} options={[["", "Any"], ["female", "Female"], ["male", "Male"], ["other", "Other"]]} />
        <Field label="Minimum followers" k="minF" d={d} set={set} type="number" placeholder="Any (e.g. 1000)" />
        <Field label="Maximum followers" k="maxF" d={d} set={set} type="number" placeholder="Any (e.g. 100000)" />
        <Field
          label="Instagram account requirement"
          k="igReq"
          d={{ ...d, igReq: /^verified/i.test(d.igReq) ? "verified" : /^(any|handle)/i.test(d.igReq) ? "handle" : /^(no|none)/i.test(d.igReq) ? "none" : d.igReq }}
          set={set}
          options={[
            ["verified", "Verified Instagram connection"],
            ["handle", "Any Instagram handle"],
            ["none", "No Instagram needed"],
          ]}
        />
        <Field label="Category" k="cats" d={d} set={set} placeholder="Any (e.g. Beauty, Lifestyle)" />
        <Field label="Avg engagement (min %)" k="minEng" d={d} set={set} type="number" placeholder="Any (e.g. 2.5)" />
        <Field label="Creator age from" k="ageMin" d={d} set={set} type="number" placeholder="Any (e.g. 18)" />
        <Field label="Creator age to" k="ageMax" d={d} set={set} type="number" placeholder="Any (e.g. 35)" />
        <Field label="Pet" k="pet" d={d} set={set} options={[["", "Any"], ["yes", "Must have a pet"], ["no", "No pet"]]} />
        <Field label="Pet type" k="petType" d={d} set={set} placeholder="Any (e.g. dog, cat)" />
        <Field label="Married / unmarried" k="marital" d={d} set={set} options={[["", "Any"], ["married", "Married"], ["single", "Unmarried"]]} />
        <Field label="Open to barter" k="barterOpen" d={d} set={set} options={[["", "Any"], ["yes", "Must be open to barter"]]} />
        <Field full label="Audience notes (team only — not checked)" k="audNotes" d={d} set={set} placeholder="e.g. 18–34, 60% female, metro India" />
      </div>
      <p className="nc-sec" id="tracking">🔗 Link &amp; coupon tracking</p>
      <p className="ne-sub">Every creator gets their own link (and code) — we count clicks, code copies and sales per creator in the campaign’s 🔗 Links &amp; codes.</p>
      <label className="ne-check">
        <input type="checkbox" checked={!!d.tracking} onChange={(e) => set("tracking", e.target.checked)} />
        <span className="ne-box" aria-hidden="true">{d.tracking ? "✓" : ""}</span>
        Give every creator a tracking link — shown in their post instructions
      </label>
      {d.tracking && (
        <>
          <div className="nc-grid">
            <Field label="Shop link (where the link opens)" k="url" d={d} set={set} type="url" placeholder="https://brand.com/offer — empty = the product link" />
            <Field label="Offer line (shown with the code)" k="tkDisc" d={d} set={set} placeholder="Flat 15% off on your first order" />
            <Field
              label="Coupon code"
              k="tkMode"
              d={{ ...d, tkMode: d.tkMode || (d.code ? "common" : "none") }}
              set={set}
              options={[
                ["none", "No code — link only"],
                ["common", "One code for every creator"],
                ["per_creator", "A different code for each creator"],
              ]}
            />
            {(d.tkMode || (d.code ? "common" : "none")) === "common" && <Field label="Code for every creator" k="code" d={d} set={set} placeholder="OLIO15" />}
            {d.tkMode === "per_creator" && <Field label="Make each code from (optional)" k="tkPrefix" d={d} set={set} placeholder="OLIO → OLIORIYASHARMA" />}
          </div>
          <label className="ne-tk">
            <input type="checkbox" checked={d.tkUtm !== false} onChange={(e) => set("tkUtm", e.target.checked)} /> Add tracking tags to the brand&apos;s link <span>(utm_source=geek · utm_content=@creator — the brand sees these visits in its own Google Analytics / Shopify)</span>
          </label>
          {(d.tkMode || "none") !== "none" && (
            <>
              <label className="ne-tk">
                <input type="checkbox" checked={!!d.tkSay} onChange={(e) => set("tkSay", e.target.checked)} /> 🎟️ <b>Creators say their own code in the video</b>
              </label>
              {d.tkSay && (
                <div className="ne-how">
                  <p>
                    <b>1 · Codes</b> — type each one in the campaign’s 🔗 Links &amp; codes, paste the brand’s list there (@handle, CODE), add a <b>Coupon code</b> column to the bulk-upload sheet, or set a prefix above and they’re made for you.
                  </p>
                  <p>
                    <b>2 · Brief</b> — write <code>{"{code}"}</code> where they say it, e.g. “Use my code {"{code}"} for 15% off”.{" "}
                    <button
                      type="button"
                      className="ne-ins"
                      onClick={() => !/\{\s*code\s*\}/i.test(d.message || "") && set("message", ((d.message || "").trim() ? d.message.trim() + "\n" : "") + "Use my code {code} for an extra discount")}
                    >
                      + Insert {"{code}"} in Key message
                    </button>
                  </p>
                  <p>
                    <b>3 · Creator</b> — sees their own code on top of the video brief (with Copy) and gets it in the brief email + WhatsApp. Creators without a code show as missing in 🔗 Links &amp; codes.
                  </p>
                </div>
              )}
              <label className="ne-tk">
                <input type="checkbox" checked={!!d.tkShop} onChange={(e) => set("tkShop", e.target.checked)} /> Shopify store — apply the creator&apos;s code automatically at checkout
              </label>
            </>
          )}
        </>
      )}
      <p className="nc-note nc-note--warn">
        <span>ℹ️</span> Never display zero clicks or sales until links are valid and tracking is actually enabled. Link and coupon settings should be verified before launch.
      </p>
      <style>{`
        .ne-h { margin-top: 6px; font-family: var(--ad-head); font-size: 17px; font-weight: 800; letter-spacing: -0.4px; color: var(--ad-ink); }
        .ne-sub { margin: 8px 0 18px; font-size: 12px; color: var(--ad-muted); }
        .ne-tk { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 4px 0 10px; font-size: 13px; color: var(--ad-ink); cursor: pointer; }
        .ne-tk input { accent-color: #5a4bf2; width: 16px; height: 16px; }
        .ne-tk span { font-size: 12px; color: var(--ad-muted); }
        .ne-how { margin: -2px 0 12px 22px; padding: 10px 12px; border-radius: 10px; background: #f5f3ff; font-size: 12.5px; line-height: 1.55; color: #3f3a6b; }
        .ne-how p + p { margin-top: 6px; }
        .ne-how code { padding: 1px 5px; border-radius: 5px; background: #fff; }
        .ne-ins { margin-left: 4px; padding: 3px 8px; border-radius: 7px; border: 1px solid #d9d4ff; background: #fff; font-size: 12px; font-weight: 800; color: #5a4bf2; cursor: pointer; }
        .ne-auto { height: 38px; padding: 0 14px; font-size: 13px; margin-bottom: 10px; }
        .ne-note { margin: -2px 0 14px; padding: 10px 12px; border-radius: 10px; background: #f5f3ff; font-size: 12.5px; color: #4b3fb5; }
        .ne-check { position: relative; display: inline-flex; align-items: center; gap: 4px; margin: -2px 0 18px; font-size: 14px; color: var(--ad-ink); cursor: pointer; }
        .ne-check input { position: absolute; opacity: 0; pointer-events: none; }
        .ne-box { width: 38px; height: 22px; margin-left: 4px; border-radius: 4px; display: grid; place-items: center; background: #fff; border: 2px solid #c9cde0; color: #fff; font-size: 12px; font-weight: 800; }
        .ne-check input:checked + .ne-box { background: #5a4bf2; border-color: #4a3ce0; }
        .ne-check input:focus-visible + .ne-box { box-shadow: 0 0 0 3px rgba(103,87,245,.25); }
      `}</style>
    </Wizard>
  );
}
