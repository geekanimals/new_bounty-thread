"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/layout/CookieBanner";

// In pages par website ka header / footer / cookie banner nahi dikhega
// (unsubscribe screens + poora creator panel /creator + poora brand panel /brands)
const BARE_ROUTES = ["/unsubscribe", "/creator", "/brands", "/admin", "/kit", "/s", "/go", "/o"];

export default function SiteChrome({ children }) {
  const pathname = usePathname() || "/";
  const bare = BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (bare) return <>{children}</>;

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}
