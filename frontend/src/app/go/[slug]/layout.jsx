import { Suspense } from "react";
// Ye link har kisi ke liye alag hai (database se aata hai), isliye sirf ek sample pehle se banta hai —
// baaki pehli baar khulne par bante hain.
export function generateStaticParams() {
  return [{ slug: "sample" }];
}

export default function Layout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return <Suspense fallback={null}>{children}</Suspense>;
}
