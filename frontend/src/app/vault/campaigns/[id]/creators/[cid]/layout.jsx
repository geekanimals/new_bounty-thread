import { Suspense } from "react";
// Creator (participation / invite) ids asli hain — ek sample pehle se banta hai, baaki pehli baar khulne par.
export function generateStaticParams() {
  return [{ cid: "sample" }];
}

export default function WorkspaceCreatorLayout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return <Suspense fallback={null}>{children}</Suspense>;
}
