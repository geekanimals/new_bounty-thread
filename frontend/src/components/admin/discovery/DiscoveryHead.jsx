"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHead } from "@/components/admin/ui";

const TABS = [
  { href: "/admin/discovery", label: "🔎 Creator search" },
  { href: "/admin/discovery/brief", label: "🎯 Match to a brief" },
  { href: "/admin/discovery/hashtag", label: "#️⃣ Hashtag search" },
  { href: "/admin/discovery/business", label: "📇 Business discovery" },
];

/* Discovery ka heading + 4 tabs (har tab apna route) */
export default function DiscoveryHead() {
  const path = usePathname() || "";
  return (
    <>
      <PageHead title="Discovery" sub="Every creator we know — on Geek OS and on Instagram. Search, match to a brief, then invite." />
      <nav className="dh-tabs" data-scroll aria-label="Discovery">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`ad-tab ${path === t.href ? "is-on" : ""}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      <style>{`
        .dh-tabs { display: flex; gap: 8px; margin: -6px 0 17px; overflow-x: auto; scrollbar-width: none; }
        .dh-tabs::-webkit-scrollbar { display: none; }
        .dh-tabs .ad-tab { flex-shrink: 0; height: 37px; }
        .dh-tabs .ad-tab:not(.is-on) { color: #67718a; }
        @media (max-width: 640px) { .dh-tabs { margin: 0 -16px 16px; padding: 0 16px; } }
      `}</style>
    </>
  );
}
