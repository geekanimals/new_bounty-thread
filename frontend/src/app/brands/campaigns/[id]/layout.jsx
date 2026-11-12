import { CAMPAIGNS } from "@/components/brands/data";

// Har campaign ke saare tabs (Creators, Analytics, Links, Brief, Activity) build ke time ban jaate hain
export function generateStaticParams() {
  return CAMPAIGNS.map((c) => ({ id: c.id }));
}

export default function CampaignLayout({ children }) {
  return children;
}
