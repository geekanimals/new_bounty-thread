"use client";

import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/layout/CookieBanner";

// In pages par website ka header / footer / cookie banner nahi dikhega
// (unsubscribe screens + poora creator panel /creator + poora brand panel /brands)
const BARE_ROUTES = ["/unsubscribe", "/creator", "/brands", "/vault", "/kit", "/s", "/go", "/o"];

// Legal / info pages: upar "← Back" (creator / brand panel se aaye log wapas ja sakein)
const BACK_ROUTES = ["/terms", "/privacy", "/refund-cancellation", "/shipping-delivery", "/data-deletion", "/about", "/contact"];

function BackBar() {
  const router = useRouter();
  const back = () => {
    let same = false;
    try {
      same = !!document.referrer && new URL(document.referrer).origin === window.location.origin;
    } catch {
      /* ignore */
    }
    if (same && window.history.length > 1) router.back();
    else router.push("/");
  };
  return (
    <div className="sc-back">
      <button type="button" onClick={back} aria-label="Go back">
        <span aria-hidden="true">←</span> Back
      </button>
      <style>{`
        .sc-back { max-width: 1200px; margin: 0 auto; padding: 14px 20px 0; }
        .sc-back button { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(20,40,30,.18); background: #fff; font: inherit; font-size: 14px; font-weight: 600; color: #1d3a2c; cursor: pointer; }
        .sc-back button:hover { background: #f3f1e8; }
      `}</style>
    </div>
  );
}

export default function SiteChrome({ children }) {
  const pathname = usePathname() || "/";
  const bare = BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (bare) return <>{children}</>;

  return (
    <>
      <Header />
      {BACK_ROUTES.includes(pathname) && <BackBar />}
      <main>{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}
