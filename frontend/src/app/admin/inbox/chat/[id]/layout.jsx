import { Suspense } from "react";
// Chat ids = wa_conversations ke UUID (database se) — sirf ek sample pehle se banta hai, baaki khulne par
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function ChatLayout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return <Suspense fallback={null}>{children}</Suspense>;
}
