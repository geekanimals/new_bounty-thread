"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import BrandPanel from "@/components/admin/brand/BrandPanel";
import PTable from "@/components/admin/brand/PTable";
import { CAMPAIGNS, brandById } from "@/components/admin/data";

/* Figma 066 — Beardo ki campaigns jaise dikhi */
const OVERRIDE = {
  "beardo-detan": { status: "Live", creators: 66, posts: 10 },
  "beardo-festive": { status: "Completed", creators: 5, posts: 0 },
};
const TONE = { Live: "green", Draft: "orange", Shortlist: "violet" };

/** /admin/brands/[id]/campaigns */
export default function BrandCampaigns() {
  const { id } = useParams();
  const b = brandById(id);
  const list = CAMPAIGNS.filter((c) => !c.hidden && c.brand === b.name).map((c) => ({
    ...c,
    creators: c.approved,
    posts: parseInt(c.done, 10) || 0,
    ...(OVERRIDE[c.id] || {}),
  })).sort((x, y) => (x.status === "Live" ? 0 : 1) - (y.status === "Live" ? 0 : 1)); // Figma: live campaign upar

  return (
    <BrandPanel id={id}>
      <div className="bk">
        <PTable
          minW={680}
          cols={[
            { label: "Campaign", w: "34%" },
            { label: "Type", w: "17.5%" },
            { label: "Status", w: "18%" },
            { label: "Creators", w: "15%" },
            { label: "Posts", w: "10.5%" },
            { label: "", w: "11%" },
          ]}
          rows={list.map((c) => [
            c.name.replace(" · Paid", "").replace(" · Barter", ""),
            c.type,
            <span key="s" className={`ad-badge ad-badge--${TONE[c.status] || ""}`}>
              {c.status}
            </span>,
            c.creators,
            c.posts,
            <Link key="o" href={`/admin/campaigns/${c.id}/overview`} className="pt-link">
              Open →
            </Link>,
          ])}
          empty="No campaigns for this brand yet."
        />
      </div>
      <style>{`
        .bk { margin-top: 12px; }
        .bk .pt th { height: 25px; padding-bottom: 14px; }
        .bk .pt td:last-child { overflow: visible; }
      `}</style>
    </BrandPanel>
  );
}
