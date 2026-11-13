import { Suspense } from "react";
import { CreatorDrawerFrame } from "@/components/admin/creator/CreatorDrawer";

// Creator profile (id = member id, database se) — pages pehli baar khulne par bante hain
export function generateStaticParams() {
  return [{ id: "sample" }];
}

/* Drawer yahin ek baar banta hai — tab (Profile / Instagram / …) badalne par sirf andar ka hissa badalta hai */
export default function CreatorLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <CreatorDrawerFrame>{children}</CreatorDrawerFrame>
    </Suspense>
  );
}
