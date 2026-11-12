"use client";

import Wizard, { Field, useDraft } from "@/components/admin/campaign/Wizard";

/* Figma: New campaign — 3 Terms & creative */
export default function NewCampaignTerms() {
  const { d, set } = useDraft();
  return (
    <Wizard step={2}>
      <div className="nc-grid">
        <Field full area label="Video brief — what to shoot" k="brief" d={d} set={set} placeholder="Format, angle, opening hook, product demonstration…" />
        <Field area label="Do’s" k="dos" d={d} set={set} placeholder="Natural lighting, honest product experience…" />
        <Field area label="Don’ts" k="donts" d={d} set={set} placeholder="Avoid unsupported claims or competitor logos…" />
        <Field full area label="Key message, hashtags & mentions" k="message" d={d} set={set} placeholder="Brand messages, disclosure guidance, reference links…" />
        <Field label="Required hashtags" k="hashtags" d={d} set={set} placeholder="#ad #brand" />
        <Field label="Brand mentions" k="mentions" d={d} set={set} placeholder="@brand" />
      </div>
      <p className="nc-note nc-note--red">
        <span>⚖️</span>
        <span>
          <b>Fair-contract improvement:</b>The reference form includes automatic blacklisting and creator-paid re-shipping for non-delivery. This redesign recommends a documented dispute / cure process and reviewed, proportionate remedies instead of automatic penalties.
        </span>
      </p>
    </Wizard>
  );
}
