"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Creators to approve", href: "/brands/approvals", count: 7 },
  { label: "Videos to review", href: "/brands/approvals/videos", count: 2 },
  { label: "Campaign requests", href: "/brands/approvals/requests", count: 1 },
];

/** Approvals ke 3 pages ka common heading + tabs */
export default function ApprovalTabs() {
  const pathname = usePathname() || "";
  return (
    <div>
      <p className="br-eyebrow">Today</p>
      <h1 className="br-h1">Approvals</h1>
      <p className="br-sub">Creators Geek picked for you, and videos waiting before they go live. Nothing posts without your OK.</p>
      <nav className="br-tabs" style={{ marginTop: 20 }} aria-label="Approval sections">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={pathname === t.href ? "is-active" : ""}>
            {t.label}
            <em>{t.count}</em>
          </Link>
        ))}
      </nav>
    </div>
  );
}
