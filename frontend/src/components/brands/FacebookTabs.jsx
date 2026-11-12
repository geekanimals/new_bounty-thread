"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook } from "@/components/ui/Icons";
import { BRAND } from "@/components/brands/data";

const TABS = [
  { label: "Posts", href: "/brands/facebook" },
  { label: "Create post", href: "/brands/facebook/create" },
  { label: "Insights", href: "/brands/facebook/insights" },
  { label: "Ads", href: "/brands/facebook/ads" },
];

/** Facebook ke 4 pages ka common heading + tabs */
export default function FacebookTabs() {
  const pathname = usePathname() || "";
  return (
    <div className="fbt">
      <p className="br-eyebrow">Social</p>
      <div className="fbt-head">
        <div>
          <h1 className="br-h1">Facebook</h1>
          <p className="br-sub">Your Facebook Page and ads — reply to comments, post, and see results without leaving Geek OS.</p>
        </div>
        <span className="fbt-page">
          <Facebook size={12} /> {BRAND.fbPage}
        </span>
      </div>
      <nav className="br-tabs" style={{ marginTop: 20 }} aria-label="Facebook sections">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={pathname === t.href ? "is-active" : ""}>
            {t.label}
          </Link>
        ))}
      </nav>
      <style>{`
        .fbt-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
        .fbt-page {
          display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 12px;
          border-radius: 999px; background: var(--br-blue-bg); color: var(--br-fb);
          font-size: 12px; font-weight: 700; white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
