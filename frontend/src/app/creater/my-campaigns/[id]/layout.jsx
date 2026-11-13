import { Suspense } from "react";
// Participation id asli (UUID) hai — sirf ek sample pehle se banta hai, baaki pehli baar khulne par (page client hai, useParams).
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function TrackerLayout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return <Suspense fallback={null}>{children}</Suspense>;
}
