"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BountyShell from "@/components/creater/BountyShell";
import TrackerFrame, { useTracker } from "@/components/creater/TrackerSteps";
import { CREATOR } from "@/components/creater/data";
import { Check } from "@/components/ui/Icons";

const TERMS = (c) => [
  `Deliverables: ${c.deliver}, posted within ${c.deadline}.`,
  `Reward: ${c.rewardKit}. Paid fees are released 7 days after your post is verified.`,
  `Usage rights: ${c.usage} — the brand can boost your Reel as an ad.`,
  `Exclusivity: ${c.excl}. Collab post: ${c.collab}.`,
  "Disclose the collaboration (Paid partnership / #ad) as per ASCI.",
  "Keep the post live for at least 30 days.",
];

/** /creater/my-campaigns/[id]/agreement — terms padho, tick karo, naam likh ke sign */
export default function AgreementStep() {
  const router = useRouter();
  const { c, afterSign } = useTracker();
  const [agree, setAgree] = useState(false);
  const [sign, setSign] = useState("");
  const nameOk = sign.trim().toLowerCase() === CREATOR.name.toLowerCase();

  return (
    <BountyShell>
      <title>{`Agreement — ${c.title} — Bounty`}</title>
      <TrackerFrame step="agreement">
        <span className="ts-ic">✍️</span>
        <h2>Review &amp; sign your agreement</h2>
        <ol className="ag-terms">
          {TERMS(c).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        <label className="ag-check">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          I’ve read the agreement and accept these terms.
        </label>
        <label className="bx-label" htmlFor="ag-sign">
          Type your full name to sign <small>{CREATOR.name}</small>
        </label>
        <input id="ag-sign" className="bx-input" value={sign} onChange={(e) => setSign(e.target.value)} placeholder={CREATOR.name} />
        {sign && !nameOk && <p className="bx-err">Type your name exactly as on your profile.</p>}
        <button type="button" className="bx-btn bx-btn--dark ts-mt" disabled={!(agree && nameOk)} onClick={() => router.push(afterSign)}>
          <Check size={14} /> Sign agreement
        </button>
      </TrackerFrame>
      <style>{`
        .ag-terms { margin: 10px 0 14px; padding: 12px 14px 12px 32px; border-radius: 12px; background: #fffaf0; border: 1px solid var(--bx-line); font-size: 13px; line-height: 1.6; }
        .ag-check { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 14px; font-size: 13px; font-weight: 600; }
        .ag-check input { width: 18px; height: 18px; margin-top: 1px; accent-color: var(--bx-green); }
      `}</style>
    </BountyShell>
  );
}
