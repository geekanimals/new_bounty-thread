"use client";

import CampaignList from "@/components/admin/campaign/CampaignList";

/* Campaigns — Physical visit tab (creator goes to the place) */
export default function CampaignsVisitPage() {
  return <CampaignList filter="visit" />;
}
