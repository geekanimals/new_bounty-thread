"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "🔔 Alerts", href: "/creater/messages" },
  { label: "📸 Instagram DMs", href: "/creater/messages/instagram" },
  { label: "💬 WhatsApp", href: "/creater/messages/whatsapp" },
];

/** Inbox ke 3 pages ka common heading + tabs (Alerts / Instagram DMs / WhatsApp) */
export default function InboxTabs() {
  const pathname = usePathname() || "";
  return (
    <div className="ibt">
      <h1 className="bx-title">Inbox</h1>
      <p className="bx-lede">Campaign alerts, Instagram DMs and WhatsApp — all in one place.</p>
      <nav className="ibt-tabs" aria-label="Inbox sections" data-scroll>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`bx-pill ${pathname === t.href ? "is-on" : ""}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      <style>{`
        .ibt .bx-title { margin-top: 6px; }
        .ibt-tabs { display: flex; justify-content: center; gap: 8px; margin: 14px 0 20px; overflow-x: auto; scrollbar-width: none; }
        .ibt-tabs::-webkit-scrollbar { display: none; }
        .ibt-tabs a { flex-shrink: 0; height: 36px; padding: 0 16px; font-size: 13.5px; font-weight: 700; }
        @media (max-width: 767px) {
          .ibt .bx-title { margin-top: 8px; }
          .ibt .bx-lede { padding: 0 6px; }
          .ibt-tabs { margin: 17px -16px 16px; padding: 0 16px; gap: 7px; }
          .ibt-tabs a { height: 32px; padding: 0 12px; font-size: 12.5px; }
        }
      `}</style>
    </div>
  );
}
