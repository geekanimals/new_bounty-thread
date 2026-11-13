import { Suspense } from "react";
import { FILTERS } from "@/components/admin/queue/queueData";

/* /admin/action-queue/<filter>/<item> — item ids database se aate hain, isliye sirf sample pehle se banta hai */
export function generateStaticParams() {
  return FILTERS.map((f) => ({ filter: f.k, id: "sample" }));
}

export default function ItemLayout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return <Suspense fallback={null}>{children}</Suspense>;
}
