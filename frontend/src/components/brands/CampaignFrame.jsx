"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import CampaignTop from "@/components/brands/CampaignTop";
import { BrLoading, BrEmpty, BrError } from "@/components/brands/BrandStates";
import { useBrandCampaign, bCampaignHead } from "@/services/brand";

/**
 * Campaign ke 5 tabs ka common dhaancha: URL ka id → api.brand_campaign (purana loadCamp) → BrandShell + CampaignTop.
 * children = (data, head, reload) => JSX. Loading / error / "not your campaign" yahin.
 */
export default function CampaignFrame({ tab, children }) {
  const { id } = useParams();
  const d = useBrandCampaign(id);
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), []); // days left — render mein Date.now() nahi
  const head = d.data ? bCampaignHead(d.data, now) : null;
  const title = head ? head.title : d.loading ? "Campaign" : "Campaign not found";

  return (
    <BrandShell crumbs={[{ label: "Campaigns", href: "/brands/campaigns" }, { label: title }]}>
      <title>{`${title}${tab ? ` · ${tab}` : ""} — Geek OS Brand`}</title>
      {d.loading && !d.data ? (
        <BrLoading rows={6} />
      ) : d.error ? (
        /not your campaign|not found|P0002|42501/i.test(d.error.message || "") ? (
          <BrEmpty title="Campaign not found" text="This campaign isn’t on your brand’s account — or the link is old.">
            <Link href="/brands/campaigns" className="br-btn br-btn--primary br-btn--sm">
              All campaigns
            </Link>
          </BrEmpty>
        ) : (
          <BrError error={d.error.message} onRetry={() => d.reload()} />
        )
      ) : head ? (
        <>
          <CampaignTop c={head} />
          {children(d.data, head, () => d.reload(true))}
        </>
      ) : null}
    </BrandShell>
  );
}
