import { Suspense } from "react";
// Har insaan ka id (member_id) database se aata hai — sirf ek sample pehle se banta hai, baaki khulne par.
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function ActivityPersonLayout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return <Suspense fallback={null}>{children}</Suspense>;
}
