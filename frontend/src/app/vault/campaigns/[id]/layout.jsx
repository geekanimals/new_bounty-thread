import { Suspense } from "react";
// Campaign ids asli (database se) hain — ek sample pehle se banta hai, baaki pehli baar khulne par.
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function CampaignWorkspaceLayout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return <Suspense fallback={null}>{children}</Suspense>;
}
