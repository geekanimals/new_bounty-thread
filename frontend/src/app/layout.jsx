import { Cormorant_Garamond, Hanken_Grotesk } from "next/font/google";
import { Suspense } from "react";
import SiteChrome from "@/components/layout/SiteChrome";
import "./globals.css";

// Serif — headings ke liye (italic olive words bhi isi se)
const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

// Sans — body text, buttons, nav
const sans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Geek Influencer OS — Where creators chase dreams",
  description:
    "Geek Influencer OS is the operating system for influencer marketing — creators build careers, brands launch campaigns and watch results live, and agencies run it all end to end.",
};

// Header + Footer + Cookie banner yahin se aate hain (SiteChrome).
// /unsubscribe pages par ye apne aap hide ho jaate hain.
export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${serif.variable} ${sans.variable}`}>
      <body>
        {/* Suspense: dynamic routes (/kit/x, /vault/.../[id]) ka URL browser mein padha jata hai — build ke liye boundary zaroori */}
        <Suspense fallback={null}>
          <SiteChrome>{children}</SiteChrome>
        </Suspense>
      </body>
    </html>
  );
}
