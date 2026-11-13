"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApprovals } from "@/services/brand";

/** Approvals ke 3 pages ka common heading + tabs — counts asli (api.brand_portal: to_approve / videos / khule requests) */
export default function ApprovalTabs() {
  const pathname = usePathname() || "";
  const a = useApprovals();
  const open = a.requests.filter((r) => r.status === "new" || r.status === "in_review").length;
  const TABS = [
    { label: "Creators to approve", href: "/brands/approvals", count: a.toApprove.length },
    { label: "Videos to review", href: "/brands/approvals/videos", count: a.videos.length },
    { label: "Campaign requests", href: "/brands/approvals/requests", count: open },
  ];
  return (
    <div>
      <p className="br-eyebrow">Today</p>
      <h1 className="br-h1">Approvals</h1>
      <p className="br-sub">Creators Geek picked for you, and videos waiting before they go live. Nothing posts without your OK.</p>
      {!a.loading && !a.can && <p className="apt-view">👁 View-only login — approvals are done by your team’s approvers.</p>}
      <nav className="br-tabs" style={{ marginTop: 20 }} aria-label="Approval sections">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={pathname === t.href ? "is-active" : ""}>
            {t.label}
            {t.count > 0 && <em>{t.count}</em>}
          </Link>
        ))}
      </nav>
      <style>{`.apt-view { margin: 12px 0 0; padding: 10px 14px; border-radius: 12px; background: var(--br-orange-bg); color: var(--br-orange); font-size: 12.5px; font-weight: 600; }`}</style>
    </div>
  );
}
