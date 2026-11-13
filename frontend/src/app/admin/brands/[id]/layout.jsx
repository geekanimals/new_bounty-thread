import { Suspense } from "react";
import { BrandPanelFrame } from "@/components/admin/brand/BrandPanel";

// Brand ids asli UUID hain (database se) — sirf ek sample pehle se banta hai, baaki khulne par
export function generateStaticParams() {
  return [{ id: "sample" }];
}

/* Brand panel yahin ek baar banta hai — tab badalne par flash nahi */
export default function BrandLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <BrandPanelFrame>{children}</BrandPanelFrame>
    </Suspense>
  );
}
