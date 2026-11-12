"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BrandPanel from "@/components/admin/brand/BrandPanel";
import PTable from "@/components/admin/brand/PTable";
import { CAMPAIGNS, CREATORS, brandById } from "@/components/admin/data";

/* Figma 067 — Beardo ke creators */
const BEARDO = [
  { id: "nisha-rao", name: "Nisha Rao", campaign: "Detan Express Kit", step: "Done", posted: true },
  { id: "kabir-mehta", name: "Kabir Mehta", campaign: "Detan Express Kit", step: "Delivered", posted: false },
  { id: "aditi-verma", name: "Aditi Verma", campaign: "Festive Essential Kit", step: "Video submitted", posted: false },
];
const STEPS = ["Done", "Delivered", "Video submitted", "Approved", "Contract signed"];
const TONE = { Done: "green", Delivered: "orange", "Video submitted": "violet", Approved: "green", "Contract signed": "blue" };
const short = (n) => n.replace(/^(Beardo|Circle|Vaaree)\s+/, "").replace(/ · (Paid|Barter)$/, "");

/** /admin/brands/[id]/creators */
export default function BrandCreators() {
  const { id } = useParams();
  const b = brandById(id);
  const camps = CAMPAIGNS.filter((c) => !c.hidden && c.brand === b.name);
  const rows =
    b.id === "beardo"
      ? BEARDO
      : b.creators
        ? CREATORS.slice(0, Math.min(4, b.creators)).map((c, i) => ({ id: c.id, name: c.name, campaign: short(camps[i % Math.max(camps.length, 1)]?.name || "—"), step: STEPS[i % STEPS.length], posted: i === 0 }))
        : [];
  const [q, setQ] = useState("");
  const [camp, setCamp] = useState("all");
  const shown = rows.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()) && (camp === "all" || r.campaign === camp));
  const options = [...new Set(rows.map((r) => r.campaign))];

  return (
    <BrandPanel id={id}>
      <div className="bcr-f">
        <input className="ad-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creator…" aria-label="Search creator" />
        <select className="ad-input" value={camp} onChange={(e) => setCamp(e.target.value)} aria-label="Campaign">
          <option value="all">All campaigns</option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
      <PTable
        minW={620}
        cols={[
          { label: "Creator", w: "22.5%" },
          { label: "Campaign", w: "34%" },
          { label: "Step", w: "32.5%" },
          { label: "Posted", w: "11%" },
        ]}
        rows={shown.map((r) => [
          <Link key="n" href={`/admin/creators/${r.id}/profile`} className="bcr-n">
            {r.name}
          </Link>,
          r.campaign,
          <span key="s" className={`ad-badge ad-badge--${TONE[r.step] || ""}`}>
            {r.step}
          </span>,
          <span key="p" className="bcr-p">
            {r.posted ? "✓" : "—"}
          </span>,
        ])}
        empty={rows.length ? "No creator matches." : "No creators on this brand’s campaigns yet."}
      />
      <style>{`
        .bcr-f { display: flex; gap: 9px; margin: 0 0 24px; }
        .bcr-f .ad-input:first-child { width: 270px; height: 43px; }
        .bcr-f select.ad-input { width: 170px; height: 44px; padding: 0 12px; }
        .bcr-n:hover { color: var(--ad-primary); }
        .bcr-p { font-size: 15px; }
        @media (max-width: 640px) {
          .bcr-f { flex-direction: column; margin-top: 0; }
          .bcr-f .ad-input:first-child, .bcr-f select.ad-input { width: 100%; }
        }
      `}</style>
    </BrandPanel>
  );
}
