"use client";

import { useRouter } from "next/navigation";
import BountyShell from "@/components/creater/BountyShell";
import TrackerFrame, { useTracker } from "@/components/creater/TrackerSteps";

/** /creater/my-campaigns/[id]/verified — post verify ho gaya 🎉 */
export default function VerifiedStep() {
  const router = useRouter();
  const { c, base, isPaid } = useTracker();
  return (
    <BountyShell>
      <title>{`Post verified — ${c.title} — Bounty`}</title>
      <TrackerFrame step="verified">
        <span className="ts-ic ts-ic--gold">🎉</span>
        <h2>Post verified!</h2>
        <p>Your post is live with the right tags. {isPaid || c.type === "hybrid" ? "Your payment releases in 7 days." : "Your products are yours to keep."}</p>
        <button type="button" className="ts-demo" onClick={() => router.push(`${base}/paid`)}>
          Demo: release payment →
        </button>
      </TrackerFrame>
    </BountyShell>
  );
}
