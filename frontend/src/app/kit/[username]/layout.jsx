import { Suspense } from "react";
import { Fraunces, DM_Sans, Cinzel } from "next/font/google";

// Bounty media kit — creator side jaise fonts (Fraunces headings, DM Sans text, Cinzel logo)
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["400", "600", "700"] });
const dmSans = DM_Sans({ variable: "--font-dm", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["700"] });

// Ye link har kisi ke liye alag hai (database se aata hai), isliye sirf ek sample pehle se banta hai —
// baaki pehli baar khulne par bante hain.
export function generateStaticParams() {
  return [{ username: "sample" }];
}

export default function Layout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return (
    <div className={`${fraunces.variable} ${dmSans.variable} ${cinzel.variable}`}>
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  );
}
