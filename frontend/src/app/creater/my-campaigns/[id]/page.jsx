"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import BountyShell from "@/components/creater/BountyShell";
import TrackerFrame, { useTracker, stepPath } from "@/components/creater/TrackerSteps";
import { STEPS } from "@/components/creater/data";

/** /creater/my-campaigns/[id] — campaign overview: abhi kis step par ho + agla step kholne ka button */
export default function CampaignOverview() {
  const router = useRouter();
  const { id, m, c, isPaid, base } = useTracker();
  // Paid campaign mein address/package skip
  const stage = isPaid && (m.stage === "address" || m.stage === "package") ? "draft" : m.stage;
  const label = (STEPS.find((x) => x.key === stage) || {}).label;
  const next = stepPath(id, stage, m.revision);

  const card = () => {
    if (stage === "applied") {
      if (m.notSelected)
        return (
          <>
            <span className="ts-ic ts-ic--red">✗</span>
            <h2>Not eligible for this one</h2>
            <p>{c.why || "The brand picked creators closer to their brief."} It doesn’t affect your other applications.</p>
            <Link href="/creater/discover" className="bx-btn bx-btn--dark">
              Find campaigns that fit you →
            </Link>
          </>
        );
      return (
        <>
          <span className="ts-ic">⏳</span>
          <h2>Applied — the brand is reviewing</h2>
          <p>Brands usually decide within 3–5 days. We’ll WhatsApp you the moment you’re selected.</p>
          <button type="button" className="ts-demo" onClick={() => router.push(`${base}/agreement`)}>
            Demo: brand selects you →
          </button>
        </>
      );
    }
    if (stage === "selected")
      return (
        <>
          <span className="ts-ic ts-ic--gold">🎉</span>
          <h2>{c.brand} selected you!</h2>
          <p>Review the agreement and sign it to lock your spot. Nothing starts until you sign.</p>
          <Link href={`${base}/agreement`} className="bx-btn bx-btn--dark bx-btn--lg">
            Continue: Review &amp; sign agreement →
          </Link>
        </>
      );
    return (
      <>
        <span className="ts-ic">{stage === "paid" ? "💸" : m.revision ? "🔁" : "👉"}</span>
        <h2>{stage === "paid" ? "Campaign complete" : `You’re at: ${m.revision ? "Draft — change requested" : label}`}</h2>
        <p>{m.note}</p>
        <Link href={next} className="bx-btn bx-btn--dark bx-btn--lg">
          {stage === "paid" ? "See details →" : `Continue: ${m.revision ? "Fix your draft" : label} →`}
        </Link>
      </>
    );
  };

  return (
    <BountyShell>
      <title>{`${c.title} — My campaigns — Bounty`}</title>
      <TrackerFrame step={stage} overview>
        {card()}
      </TrackerFrame>
    </BountyShell>
  );
}
