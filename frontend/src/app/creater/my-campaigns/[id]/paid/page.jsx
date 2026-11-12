"use client";

import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import TrackerFrame, { useTracker } from "@/components/creater/TrackerSteps";

/** /creater/my-campaigns/[id]/paid — payment release / products delivered */
export default function PaidStep() {
  const { c } = useTracker();
  const barter = c.type === "barter";
  return (
    <BountyShell>
      <title>{`${barter ? "Complete" : "Paid"} — ${c.title} — Bounty`}</title>
      <TrackerFrame step="paid">
        <span className="ts-ic ts-ic--green">💸</span>
        <h2>{barter ? "Campaign complete" : "Payment released"}</h2>
        <p>{barter ? `${c.rewardKit} — delivered and yours. Thanks for posting on time!` : `${c.worth} is on its way to your UPI. It shows in Payments.`}</p>
        <div className="pd-btns">
          <Link href="/creater/payments" className="bx-btn bx-btn--dark">
            Open Payments →
          </Link>
          <Link href="/creater/my-campaigns" className="bx-btn bx-btn--ghost">
            Back to My campaigns
          </Link>
        </div>
      </TrackerFrame>
      <style>{`
        .pd-btns { display: flex; gap: 10px; flex-wrap: wrap; }
      `}</style>
    </BountyShell>
  );
}
