"use client";

import BountyShell from "@/components/creater/BountyShell";
import TrackerFrame, { useTracker, TrackerWait, StepMismatch } from "@/components/creater/TrackerSteps";
import PostStats from "@/components/creater/PostStats";
import PayBox from "@/components/creater/PayBox";

/** /creater/my-campaigns/[id]/verified — saare posts live (purane "You're live!"): numbers + payment */
export default function VerifiedStep() {
  const t = useTracker();
  if (!t.m)
    return (
      <BountyShell>
        <TrackerWait t={t} />
      </BountyShell>
    );
  const { c, m, isPaid } = t;
  const onStep = t.step === "verified";
  return (
    <BountyShell>
      <title>{`You're live — ${c.title} — Bounty`}</title>
      <TrackerFrame t={t} step={onStep ? "verified" : undefined}>
        {onStep ? (
          <>
            <span className="ts-ic ts-ic--gold">🎉</span>
            <h2>You’re live!</h2>
            <p>
              Your post is recorded on the campaign. The brand wraps up once the numbers are in.{" "}
              {isPaid ? "Your payment follows the terms in your agreement." : "Your products are yours to keep."}
            </p>
            <PayBox t={t} />
            <PostStats m={m} />
          </>
        ) : (
          <StepMismatch t={t} />
        )}
      </TrackerFrame>
    </BountyShell>
  );
}
