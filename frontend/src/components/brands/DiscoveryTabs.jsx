"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Find creators", href: "/brands/discovery" },
  { label: "Creators for a campaign", href: "/brands/discovery/campaign" },
  { label: "My shortlist", href: "/brands/discovery/shortlist", count: 6 },
];

/** Discovery ke 3 pages ka common heading + tabs */
export default function DiscoveryTabs() {
  const pathname = usePathname() || "";
  return (
    <div>
      <p className="br-eyebrow">Social</p>
      <h1 className="br-h1">Discovery</h1>
      <p className="br-sub">Search 40,000+ Indian creators with real, checked numbers.</p>
      <nav className="br-tabs" style={{ marginTop: 20 }} aria-label="Discovery sections">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={pathname === t.href ? "is-active" : ""}>
            {t.label}
            {t.count ? <em>{t.count}</em> : null}
          </Link>
        ))}
      </nav>
    </div>
  );
}
