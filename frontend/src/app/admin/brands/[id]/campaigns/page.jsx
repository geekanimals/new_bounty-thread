"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import BrandPanel, { useBrand } from "@/components/admin/brand/BrandPanel";
import PTable from "@/components/admin/brand/PTable";
import { num } from "@/components/admin/brand/util";

const TYPE = { barter: "Barter", paid: "Paid", barter_paid: "Barter + Paid" };
const tone = (s = "") => (/live/i.test(s) ? "green" : /draft|approval|sourcing/i.test(s) ? "orange" : /shortlist|production/i.test(s) ? "violet" : "");

/** /admin/brands/[id]/campaigns — is brand ki campaigns (brand_detail.campaigns) */
export default function BrandCampaignsPage() {
  const { id } = useParams();
  return (
    <BrandPanel id={id}>
      <BrandCampaigns />
    </BrandPanel>
  );
}

function BrandCampaigns() {
  const { d } = useBrand();
  // Figma: live campaign upar
  const list = [...(d.campaigns || [])].sort((x, y) => (/live/i.test(y.status || "") ? 1 : 0) - (/live/i.test(x.status || "") ? 1 : 0));
  return (
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
          <span key="n" title={c.name}>
            {c.name}
          </span>,
          TYPE[c.type] || c.type || "—",
          <span key="s" className={`ga-badge ga-badge--${tone(c.status)}`}>
            {c.status || "—"}
          </span>,
          num(c.creators),
          num(c.posts),
          <Link key="o" href={`/admin/campaigns/${c.id}/overview`} className="pt-link">
            Open →
          </Link>,
        ])}
        empty="No campaigns for this brand yet."
      />
      <style>{`
        .bk { margin-top: 12px; }
        .bk .pt th { height: 25px; padding-bottom: 14px; }
        .bk .pt td:last-child { overflow: visible; }
      `}</style>
    </div>
  );
}
