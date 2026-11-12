import { ACTIVITY_IDS } from "@/components/admin/settings/people";

// Static build ke liye saare person ids (timeline panel)
export function generateStaticParams() {
  return ACTIVITY_IDS.map((id) => ({ id }));
}

export default function ActivityPersonLayout({ children }) {
  return children;
}
