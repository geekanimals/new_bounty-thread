import { Suspense } from "react";
// Creator profile (id = member id, database se) — pages pehli baar khulne par bante hain
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function CreatorLayout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return <Suspense fallback={null}>{children}</Suspense>;
}
