import { FILTERS } from "@/components/admin/queue/queueData";

/* /admin/action-queue/<filter> — har tab ka apna route */
export function generateStaticParams() {
  return FILTERS.map((f) => ({ filter: f.k }));
}

export default function FilterLayout({ children }) {
  return children;
}
