import { Suspense } from "react";
// Brand ids asli UUID hain (database se) — sirf ek sample pehle se banta hai, baaki khulne par (Next cacheComponents)
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function BrandLayout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return <Suspense fallback={null}>{children}</Suspense>;
}
