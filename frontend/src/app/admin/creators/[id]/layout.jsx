import { ALL_CREATOR_IDS } from "@/components/admin/creator/profiles";

// Creator profile ke saare pages pehle se ban jaayein (dummy ids)
export function generateStaticParams() {
  return ALL_CREATOR_IDS.map((id) => ({ id }));
}

export default function CreatorLayout({ children }) {
  return children;
}
