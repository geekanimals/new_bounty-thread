"use client";

import CampaignList from "@/components/admin/campaign/CampaignList";

/* Campaigns — Barter + Paid tab (sirf hybrid campaigns, Paid / Barter tab se alag) */
export default function CampaignsBarterPaidPage() {
  return <CampaignList filter="barter_paid" />;
}
