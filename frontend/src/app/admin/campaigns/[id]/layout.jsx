import { CAMPAIGNS } from "@/components/admin/data";

// Static build ke liye saare campaign ids
export function generateStaticParams() {
  return CAMPAIGNS.map((c) => ({ id: c.id }));
}

export default function CampaignWorkspaceLayout({ children }) {
  return children;
}
