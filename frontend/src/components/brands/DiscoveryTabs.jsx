"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePickCount } from "@/services/brand";

const TABS = [
  { label: "Find creators", href: "/brands/discovery" },
  { label: "Creators for a campaign", href: "/brands/discovery/campaign" },
  { label: "My shortlist", href: "/brands/discovery/shortlist", count: true },
];

/** Discovery ke 3 pages ka common heading + tabs */
export default function DiscoveryTabs() {
  const pathname = usePathname() || "";
  const picks = usePickCount(); // api.brand_discover_picks ki ginti
  return (
    <div>
      <p className="br-eyebrow">Social</p>
      <h1 className="br-h1">Discovery</h1>
      <p className="br-sub">Search Geek OS creators and Instagram — shortlist them and the Geek team invites them.</p>
      <nav className="br-tabs" style={{ marginTop: 20 }} aria-label="Discovery sections">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={pathname === t.href ? "is-active" : ""}>
            {t.label}
            {t.count && picks ? <em>{picks}</em> : null}
          </Link>
        ))}
      </nav>
    </div>
  );
}
