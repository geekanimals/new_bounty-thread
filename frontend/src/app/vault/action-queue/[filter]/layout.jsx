import { Suspense } from "react";
import { FILTERS } from "@/components/admin/queue/queueData";

/* /vault/action-queue/<filter> — har tab ka apna route */
export function generateStaticParams() {
  return FILTERS.map((f) => ({ filter: f.k }));
}

export default function FilterLayout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return <Suspense fallback={null}>{children}</Suspense>;
}
