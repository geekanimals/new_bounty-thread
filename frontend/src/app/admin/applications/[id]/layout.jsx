import { Suspense } from "react";
/* id database se aata hai (UUID) — sirf ek sample pehle se banta hai, baaki pehli baar khulne par */
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function IdLayout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return <Suspense fallback={null}>{children}</Suspense>;
}
