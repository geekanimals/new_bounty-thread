"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHead } from "@/components/admin/ui";
import { campaignById } from "@/components/admin/data";

/* Campaign workspace ke tabs (Figma) — har tab apna route */
export const WS_TABS = [
  { k: "overview", label: "Overview", also: ["contract", "find"] },
  { k: "creators", label: "Creators", also: ["upload"] },
  { k: "content", label: "Content" },
  { k: "fulfilment", label: "Fulfilment", also: ["payments"] },
  { k: "messages", label: "Messages", also: ["outreach"] },
  { k: "attribution", label: "Attribution" },
  { k: "report", label: "Report", also: ["list", "traits"] },
];

/**
 * Campaign workspace ka upar wala hissa: title + "← All campaigns" + "Edit brief" + tabs.
 * id = campaign id (URL se). title/sub override kar sakte ho.
 */
export default function WorkspaceHead({ id, title, sub, actions }) {
  const pathname = usePathname() || "";
  const c = campaignById(id);
  const seg = pathname.split("/")[4] || "overview";
  const active = WS_TABS.find((t) => t.k === seg || (t.also || []).includes(seg))?.k;
  return (
    <>
      <PageHead title={title || `${c.name}${c.name.includes("·") ? "" : ` · ${c.type}`}`} sub={sub || `${c.brand} · ${c.type} · ${c.status}`}>
        {actions || (
          <>
            <Link href="/admin/campaigns" className="ad-btn ad-btn--ghost wh-back">
              ← All campaigns
            </Link>
            <Link href={`/admin/campaigns/new?edit=${c.id}`} className="ad-btn ad-btn--primary">
              Edit brief
            </Link>
          </>
        )}
      </PageHead>
      <nav className="wh-tabs" aria-label="Campaign workspace" data-scroll>
        {WS_TABS.map((t) => (
          <Link key={t.k} href={`/admin/campaigns/${c.id}/${t.k}`} className={`ad-tab ${active === t.k ? "is-on" : ""}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      <style>{`
        @media (min-width: 1181px) { .wh-back { margin-right: 200px; } }
        .wh-tabs { display: flex; gap: 8px; margin: -4px 0 26px; overflow-x: auto; scrollbar-width: none; }
        .wh-tabs::-webkit-scrollbar { display: none; }
        .wh-tabs .ad-tab { height: 37px; flex-shrink: 0; }
        .wh-tabs .ad-tab:not(.is-on) { color: #67718a; }
        @media (max-width: 640px) { .wh-tabs { margin: 0 -16px 20px; padding: 0 16px; } }
      `}</style>
    </>
  );
}
