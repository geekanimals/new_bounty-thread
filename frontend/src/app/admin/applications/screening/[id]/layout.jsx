import { SCREENING } from "@/components/admin/queue/queueData";

/* /admin/applications/screening/<item> — drawer */
export function generateStaticParams() {
  return SCREENING.map((id) => ({ id }));
}

export default function ScreeningItemLayout({ children }) {
  return children;
}
