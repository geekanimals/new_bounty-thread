"use client";

import { useState } from "react";
import Wizard, { Field, useDraft, uploadCampaignFile } from "@/components/admin/campaign/Wizard";

/* Figma: New campaign — 3 Terms & creative */
export default function NewCampaignTerms() {
  const { d, set } = useDraft();
  const imgs = Array.isArray(d.refImgs) ? d.refImgs : [];
  const [up, setUp] = useState("");
  const [err, setErr] = useState("");
  const addImgs = async (list) => {
    setErr("");
    let acc = imgs.slice();
    for (const f of list) {
      setUp(`Uploading ${f.name}…`);
      try {
        const r = await uploadCampaignFile(f, "file");
        acc = [...acc, { url: r.url, note: "" }];
        set("refImgs", acc);
      } catch (e) {
        setErr(e.message || String(e));
      }
    }
    setUp("");
  };
  return (
    <Wizard step={2} draft={{ d, set }}>
      <div className="nc-grid">
        <Field full area label="Central brief — applies to every deliverable (each Reel / Story / Post can add its own in Deliverables)" k="brief" d={d} set={set} placeholder="Format, angle, opening hook, product demonstration…" />
        <Field area label="Do’s" k="dos" d={d} set={set} placeholder="Natural lighting, honest product experience…" />
        <Field area label="Don’ts" k="donts" d={d} set={set} placeholder="Avoid unsupported claims or competitor logos…" />
        <Field full area label="Key message, hashtags & mentions" k="message" d={d} set={set} placeholder="Brand messages, disclosure guidance, reference links…" />
        <Field label="Required hashtags" k="hashtags" d={d} set={set} placeholder="#ad #brand" />
        <Field label="Brand mentions" k="mentions" d={d} set={set} placeholder="@brand" />
      </div>
      <p className="nc-sec">Reference images — creators see these in the brief</p>
      <div className="tr-imgs">
        {imgs.map((im, i) => (
          <div key={im.url + i} className="tr-img">
            <img src={im.url} alt="" />
            <input className="ga-input" value={im.note || ""} placeholder="What should they copy from this? e.g. review style" onChange={(e) => set("refImgs", imgs.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
            <button type="button" className="tr-img__x" aria-label="Remove image" onClick={() => set("refImgs", imgs.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
        ))}
        <label className="tr-add">
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { const l = [...(e.target.files || [])]; e.target.value = ""; addImgs(l); }} />
          <b>＋ Add reference image</b>
          <small>{up || "Screenshots of reviews, posts or reels to copy the style from"}</small>
        </label>
      </div>
      {err && <p className="tr-err">{err}</p>}
      <p className="nc-note nc-note--red">
        <span>⚖️</span>
        <span>
          <b>Fair-contract improvement:</b>The reference form includes automatic blacklisting and creator-paid re-shipping for non-delivery. This redesign recommends a documented dispute / cure process and reviewed, proportionate remedies instead of automatic penalties.
        </span>
      </p>
      <style>{`
        .tr-imgs { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr)); gap: 12px; margin-bottom: 14px; }
        .tr-img { position: relative; display: grid; gap: 6px; padding: 8px; border-radius: 12px; background: #fff; border: 1px solid var(--ad-line, #e6e8f0); }
        .tr-img img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; border-radius: 8px; background: #f2f3f7; }
        .tr-img input { font-size: 12.5px; }
        .tr-img__x { position: absolute; top: 12px; right: 12px; width: 26px; height: 26px; border-radius: 50%; border: 0; background: rgba(0,0,0,.6); color: #fff; cursor: pointer; }
        .tr-add { display: grid; place-content: center; gap: 4px; min-height: 160px; padding: 14px; border-radius: 12px; border: 1.5px dashed #c9c2f5; background: #f8f7ff; text-align: center; cursor: pointer; }
        .tr-add b { font-size: 13.5px; color: #4b3fc0; }
        .tr-add small { font-size: 12px; color: var(--ad-muted, #8793a9); }
        .tr-err { margin: 0 0 10px; font-size: 13px; color: #c0392b; }
      `}</style>
    </Wizard>
  );
}
