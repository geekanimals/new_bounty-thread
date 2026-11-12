import { CAMPAIGNS } from "@/components/admin/data";

// Workspace creators (components/admin/campaign/journey.jsx wale ids)
const CIDS = ["aditi-verma", "chirag-khatri", "kabir-mehta", "nisha-rao"];

export function generateStaticParams() {
  return CAMPAIGNS.flatMap((c) => CIDS.map((cid) => ({ id: c.id, cid })));
}

export default function CampaignCreatorLayout({ children }) {
  return children;
}
