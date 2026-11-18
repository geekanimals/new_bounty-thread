"use client";

import CampaignList from "@/components/admin/campaign/CampaignList";

/* Campaigns — ⏳ Awaiting approval (brand ne banaya, Super Admin ki approval baaki) — purane app ka filter */
export default function CampaignsApprovalPage() {
  return <CampaignList filter="approval" />;
}
