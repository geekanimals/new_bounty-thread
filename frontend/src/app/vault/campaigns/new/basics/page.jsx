"use client";

import { useState } from "react";
import Wizard, { Field, useDraft, useBrands, uploadCampaignFile } from "@/components/admin/campaign/Wizard";

const TYPES = ["Barter", "Paid", "Barter + Paid"];

/* Figma: New campaign — 1 Basics */
export default function NewCampaignBasics() {
  const { d, set } = useDraft();
  const BRANDS = useBrands(); // Brand CRM (api.brand_list)
  const [err, setErr] = useState("");
  const [up, setUp] = useState("");
  const paid = d.type === "Paid";
  const barter = d.type === "Barter";
  const files = Array.isArray(d.files) ? d.files : [];
  const addFiles = async (list, kind) => {
    setErr("");
    let acc = files.slice();
    for (const f of list) {
      setUp(`Uploading ${f.name}…`);
      try {
        const r = await uploadCampaignFile(f, kind);
        if (kind === "cover") set("cover", r.url);
        else if (kind === "wa") set("waImage", r.url);
        else {
          acc = [...acc, r];
          set("files", acc);
        }
      } catch (e) {
        setErr(e.message || String(e));
      }
    }
    setUp("");
  };
  const next = () => {
    if (!d.name.trim() || !d.brand.trim()) {
      setErr("Add a campaign name and brand to continue.");
      return false;
    }
    setErr("");
  };
  return (
    <Wizard step={0} draft={{ d, set }} onNext={next} error={err}>
      <p className="nc-sec">Campaign type</p>
      <div className="ga-tabs nb-types" role="radiogroup" aria-label="Campaign type">
        {TYPES.map((t) => (
          <button key={t} type="button" role="radio" aria-checked={d.type === t} className={`ga-tab ${d.type === t ? "is-on" : ""}`} onClick={() => set("type", t)}>
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
          <input
            id="nc-brand"
            className="ga-input nc-input nb-brand"
            list="nb-brands"
            value={d.brand}
            onChange={(e) => {
              const v = e.target.value;
              const hit = BRANDS.find((b) => String(b.name).toLowerCase() === v.trim().toLowerCase());
              set("brand", v);
              set("brandId", hit ? hit.brand_id : ""); // CRM ka brand mila to uska id, warna naya brand
            }}
          />
          <datalist id="nb-brands">
            {BRANDS.map((b) => (
              <option key={b.brand_id} value={b.name} />
            ))}
          </datalist>
        </div>
        <Field label="Objective" k="objective" d={d} set={set} options={["Awareness", "Engagement", "Sales / Conversions", "UGC content", "Product launch", "App installs", "Store visits"]} />
        <Field label="Target creator count" k="target" d={d} set={set} type="number" />
        <Field label="Status" k="status" d={d} set={set} options={["Draft", "Live", "Shortlist"]} />
        {!paid && (
          <Field
            label="Barter kind"
            k="subtype"
            d={d}
            set={set}
            options={[
              ["normal_barter", "Normal — product for content"],
              ["celebrity_story", "Story — celebrity / story shout-out"],
              ["pr_package", "PR package — gift, no fixed content"],
            ]}
          />
        )}
        <Field label="Start date" k="startDate" d={d} set={set} type="date" />
        <Field label="End date" k="endDate" d={d} set={set} type="date" />
        {!barter && <Field label="Budget (₹)" k="budget" d={d} set={set} type="number" placeholder="e.g. 100000" />}
        {!barter && <Field label="Pay creators within (days after the post)" k="payDue" d={d} set={set} type="number" placeholder="7" />}
      </div>
      <p className="nc-sec">Campaign photo &amp; files</p>
      <div className="nb-media">
        <div className="nb-cover">
          {d.cover ? <img src={d.cover} alt="" referrerPolicy="no-referrer" /> : <span>No photo — creators see a matching stock photo</span>}
        </div>
        <div className="nb-mediact">
          <label className="ga-btn ga-btn--ghost nb-b">
            ⬆ Upload photo
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => e.target.files[0] && addFiles([e.target.files[0]], "cover")} />
          </label>
          {d.cover && (
            <button type="button" className="ga-btn ga-btn--ghost nb-b" onClick={() => set("cover", "")}>
              Remove photo
            </button>
          )}
          <input id="nc-cover" className="ga-input nb-link" type="url" value={d.cover} onChange={(e) => set("cover", e.target.value)} placeholder="…or paste an image link (https://…)" aria-label="Campaign photo link" />
        </div>
      </div>
      <p className="nc-sec">WhatsApp invite photo (optional)</p>
      <label className="nb-tick">
        <input type="checkbox" checked={!!d.waPhotoOn} onChange={(e) => set("waPhotoOn", e.target.checked)} />
        <span>
          <b>Send the WhatsApp invite with this photo</b> — uses the photo template (campaign_invite_pic). Unticked → the normal text invite.
        </span>
      </label>
      <p className="nb-hint">Upload the photo here (JPG / PNG — WebP is turned into JPG on upload). This photo is shown at the top of the invite and in &quot;One template for everyone&quot; photo templates.</p>
      <div className="nb-media">
        <div className="nb-cover">
          {d.waImage ? <img src={d.waImage} alt="" referrerPolicy="no-referrer" /> : <span>{d.waPhotoOn ? "Upload the WhatsApp photo" : "No WhatsApp photo — text invite"}</span>}
        </div>
        <div className="nb-mediact">
          <label className="ga-btn ga-btn--ghost nb-b">
            ⬆ Upload WhatsApp photo
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => e.target.files[0] && addFiles([e.target.files[0]], "wa")} />
          </label>
          {d.waImage && (
            <button type="button" className="ga-btn ga-btn--ghost nb-b" onClick={() => set("waImage", "")}>
              Remove
            </button>
          )}
          <input className="ga-input nb-link" type="url" value={d.waImage || ""} onChange={(e) => set("waImage", e.target.value)} placeholder="…or paste a JPG / PNG link (https://…)" aria-label="WhatsApp invite photo link" />
        </div>
      </div>
      <div className="nb-files" id="nc-files">
        <label className="ga-btn ga-btn--ghost nb-b">
          📎 Attach files
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.heic,.mp4,.mov,.csv,.txt,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx" hidden onChange={(e) => addFiles([...e.target.files], "file")} />
        </label>
        <span className="nb-fhint">Brief PDF, mood board, product images — max 10 MB each</span>
        {up && <span className="nb-fhint">{up}</span>}
        {files.map((f, i) => (
          <span key={(f.url || "") + i} className="nb-file">
            <a href={f.url} target="_blank" rel="noopener noreferrer">
              📎 {f.name || "file"}
            </a>
            <button type="button" aria-label={`Remove ${f.name}`} onClick={() => set("files", files.filter((_, j) => j !== i))}>
              ✕
            </button>
          </span>
        ))}
      </div>
      <p className="nc-note nc-note--warn">
        <span>💡</span> Save as draft first. Going live should require a complete brief, rights/terms, budget and creator eligibility validation.
      </p>
      <style>{`
        .nb-types { margin-bottom: 9px; }
        .nb-types .ga-tab { height: 38px; font-weight: 800; color: #65718a; }
        .nb-types .ga-tab.is-on { color: #fff; }
        .nb-hint { margin: 0 0 14px; font-size: 12px; color: var(--ad-muted); }
        .nb-tick { display: flex; gap: 8px; align-items: flex-start; margin: 0 0 8px; font-size: 13px; color: var(--ad-ink); cursor: pointer; }
        .nb-tick input { margin-top: 3px; }
        .nb-brand { height: 43px; }
        .nb-media { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
        .nb-cover { width: 150px; height: 94px; border-radius: 12px; border: 1px dashed #c9cde0; display: grid; place-items: center; overflow: hidden; font-size: 11px; color: var(--ad-muted); text-align: center; padding: 6px; }
        .nb-cover img { width: 100%; height: 100%; object-fit: cover; }
        .nb-mediact { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; flex: 1; min-width: 260px; }
        .nb-b { height: 38px; padding: 0 13px; font-size: 13px; cursor: pointer; }
        .nb-link { flex: 1; min-width: 220px; height: 38px; }
        .nb-files { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 14px; }
        .nb-fhint { font-size: 12px; color: var(--ad-muted); }
        .nb-file { display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px; border-radius: 9px; border: 1px solid var(--ad-line); font-size: 12.5px; }
        .nb-file a { color: var(--ad-primary); font-weight: 700; text-decoration: none; }
        .nb-file button { border: 0; background: none; color: var(--ad-muted); cursor: pointer; }
      `}</style>
    </Wizard>
  );
}
