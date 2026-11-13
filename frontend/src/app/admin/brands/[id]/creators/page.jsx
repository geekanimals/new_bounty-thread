"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BrandPanel, { useBrand } from "@/components/admin/brand/BrandPanel";
import PTable from "@/components/admin/brand/PTable";

/* purane app ke barter steps (hubStepLabel) — number hata ke */
const STEP = {
  applied: "Registered", invited: "Registered", shortlisted: "Registered", eligible: "Screened", sent_to_brand: "Sent to brand",
  brand_confirmed: "Brand confirmed", accepted: "Brand confirmed", contract_sent: "Contract sent", contract_signed: "Contract signed",
  address_confirmed: "Address confirmed", product_sent: "Courier sent", product_delivered: "Delivered", content_created: "Video brief sent",
  content_submitted: "Video submitted", changes_requested: "Changes asked", content_approved: "Client approved", published: "Posted", completed: "Done",
  ineligible: "Declined", brand_declined: "Declined by brand", dropped: "Dropped", rejected: "Rejected",
};
const label = (s) => STEP[s] || String(s || "—").replace(/_/g, " ");
const tone = (s) =>
  ["completed", "published", "content_approved"].includes(s) ? "green"
  : ["product_sent", "product_delivered", "address_confirmed"].includes(s) ? "orange"
  : ["content_submitted", "content_created", "changes_requested"].includes(s) ? "violet"
  : ["contract_sent", "contract_signed", "brand_confirmed", "accepted"].includes(s) ? "blue"
  : ["ineligible", "brand_declined", "dropped", "rejected"].includes(s) ? "red" : "";
const POSTED = ["published", "completed"];

/** /admin/brands/[id]/creators — is brand ki campaigns ke creators (brand_detail.creators) */
export default function BrandCreatorsPage() {
  const { id } = useParams();
  return (
    <BrandPanel id={id}>
      <BrandCreators />
    </BrandPanel>
  );
}

function BrandCreators() {
  const { d } = useBrand();
  const rows = (d.creators || []).map((p) => {
    const c = p.creator || {};
    return { key: p.participation_id, mid: c.member_id, name: c.username ? `@${c.username}` : c.name || "Creator", campaign: p.campaign || "—", stage: p.stage };
  });
  const [q, setQ] = useState("");
  const [camp, setCamp] = useState("all");
  const qq = q.trim().toLowerCase();
  const shown = rows.filter((r) => r.name.toLowerCase().includes(qq) && (camp === "all" || r.campaign === camp));
  const options = [...new Set(rows.map((r) => r.campaign))];

  return (
    <>
      <div className="bcr-f">
        <input className="ga-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creator…" aria-label="Search creator" />
        <select className="ga-input" value={camp} onChange={(e) => setCamp(e.target.value)} aria-label="Campaign">
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
          r.mid ? (
            <Link key="n" href={`/admin/creators/${r.mid}/profile`} className="bcr-n" title={r.name}>
              {r.name}
            </Link>
          ) : (
            <span key="n" title={r.name}>
              {r.name}
            </span>
          ),
          <span key="c" title={r.campaign}>
            {r.campaign}
          </span>,
          <span key="s" className={`ga-badge ga-badge--${tone(r.stage)}`}>
            {label(r.stage)}
          </span>,
          <span key="p" className="bcr-p">
            {POSTED.includes(r.stage) ? "✓" : "—"}
          </span>,
        ])}
        empty={rows.length ? "No creator matches." : "No creators on this brand’s campaigns yet."}
      />
      <style>{`
        .bcr-f { display: flex; gap: 9px; margin: 0 0 24px; }
        .bcr-f .ga-input:first-child { width: 270px; height: 43px; }
        .bcr-f select.ga-input { width: 170px; height: 44px; padding: 0 12px; }
        .bcr-n:hover { color: var(--ad-primary); }
        .bcr-p { font-size: 15px; }
        @media (max-width: 640px) {
          .bcr-f { flex-direction: column; margin-top: 0; }
          .bcr-f .ga-input:first-child, .bcr-f select.ga-input { width: 100%; }
        }
      `}</style>
    </>
  );
}
