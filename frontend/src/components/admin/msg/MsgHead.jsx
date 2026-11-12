"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHead } from "@/components/admin/ui";

/* Messaging & bot ke tabs (Figma 074–081) — har tab apna route */
const TABS = [
  { href: "/admin/messaging", label: "📨 Delivery" },
  { href: "/admin/messaging/doctor", label: "🩺 Delivery doctor" },
  { href: "/admin/messaging/opted-out", label: "🚫 Opted out" },
  { href: "/admin/messaging/auto", label: "📝 Auto messages" },
  { href: "/admin/messaging/bot", label: "🤖 WhatsApp bot" },
];

export default function MsgHead() {
  const pathname = usePathname() || "";
  return (
    <>
      <PageHead title="Messaging & bot" sub="WhatsApp and email delivery, automatic messages and the help bot — in one place." />
      <nav className="mh-tabs" aria-label="Messaging sections">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={`ad-tab ${pathname === t.href ? "is-on" : ""}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      <style>{`
        .mh-tabs { display: flex; gap: 8px; margin: -4px 0 16px; overflow-x: auto; scrollbar-width: none; }
        .mh-tabs::-webkit-scrollbar { display: none; }
        .mh-tabs .ad-tab { height: 37px; flex-shrink: 0; }
        .mh-tabs .ad-tab:not(.is-on) { color: #67718a; background: #f1f2f8; }
        @media (max-width: 767px) { .mh-tabs { margin: 0 -16px 16px; padding: 0 16px; } }
      `}</style>
    </>
  );
}
