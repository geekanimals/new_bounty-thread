"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import BrandShell, { ToneIcon } from "@/components/brands/BrandShell";
import CampaignTop from "@/components/brands/CampaignTop";
import { getCampaign, getCreator, LINKS } from "@/components/brands/data";
import { Info, Copy, Check, ChevronDown } from "@/components/ui/Icons";

const STATS = [
  { label: "Link clicks", value: "14.1K", note: "from 18 live posts", icon: "link", dark: true },
  { label: "Orders", value: "962", note: "tracked by code + link", icon: "package", tone: "blue" },
  { label: "Sales", value: "₹3.85L", note: "92% of campaign cost", icon: "wallet", tone: "green" },
  { label: "Return on spend", value: "0.92×", note: "break-even at 1×", icon: "trend", tone: "orange" },
];

/** /brands/campaigns/[id]/links — har creator ka link + code aur usse kitni sale hui */
export default function CampaignLinks() {
  const { id } = useParams();
  const c = getCampaign(id);
  const [shown, setShown] = useState(6);
  const [copied, setCopied] = useState("");
  if (!c) notFound();

  const copy = (row) => {
    const text = `https://${row.link} · Code ${row.code}`;
    setCopied(row.code);
    setTimeout(() => setCopied(""), 2000);
    try {
      navigator.clipboard?.writeText(text).catch(() => {});
    } catch {
      // clipboard na mile (http / purana browser) to bhi UI chale
    }
  };

  return (
    <BrandShell crumbs={[{ label: "Campaigns", href: "/brands/campaigns" }, { label: c.title }]}>
      <title>{`${c.title} · Links & sales — Geek OS Brand`}</title>
      <CampaignTop c={c} />

      <div className="cl-stats">
        {STATS.map((s) => (
          <div key={s.label} className={`br-stat ${s.dark ? "br-stat--dark" : ""}`}>
            <p className="br-stat__label">
              <ToneIcon icon={s.icon} tone={s.dark ? "dark" : s.tone} size={30} />
              {s.label}
            </p>
            <p className="br-stat__value">{s.value}</p>
            <p className="br-stat__note">{s.note}</p>
          </div>
        ))}
      </div>

      <p className="cl-info">
        <Info size={14} /> Each creator gets their own short link and promo code. Sales come from your store’s order data, matched by code.
      </p>

      <div className="br-table-wrap">
        <table className="br-table">
          <thead>
            <tr>
              <th>Creator</th>
              <th>Link / code</th>
              <th>Clicks</th>
              <th>Orders</th>
              <th>Sales</th>
              <th>Conv.</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {LINKS.slice(0, shown).map((r) => {
              const cr = getCreator(r.id);
              return (
                <tr key={r.code}>
                  <td>
                    <span className="br-who">
                      <span className="br-av br-av--sm" style={{ background: cr.av }}>
                        {cr.initials}
                      </span>
                      <span>
                        <strong>{cr.name}</strong>
                        <small>{cr.handle}</small>
                      </span>
                    </span>
                  </td>
                  <td>
                    <a href={`https://${r.link}`} target="_blank" rel="noreferrer" className="cl-link">
                      {r.link}
                    </a>
                    <small className="cl-code">Code {r.code}</small>
                  </td>
                  <td>
                    <strong>{r.clicks}</strong>
                  </td>
                  <td>{r.orders}</td>
                  <td className="cl-sales">{r.sales}</td>
                  <td>{r.conv}</td>
                  <td>
                    <button type="button" className={`br-btn br-btn--ghost br-btn--sm cl-copy ${copied === r.code ? "is-done" : ""}`} onClick={() => copy(r)}>
                      {copied === r.code ? <Check size={13} /> : <Copy size={13} />}
                      {copied === r.code ? "Copied" : "Copy"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {LINKS.length > shown && (
          <div className="br-more cl-more">
            <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 6)}>
              Load more <ChevronDown size={14} />
            </button>
          </div>
        )}
      </div>

      {copied && (
        <div className="br-toast" role="status">
          <Check size={14} /> Copied link + code {copied}
        </div>
      )}

      <style>{`
        .cl-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        .cl-info {
          display: flex; align-items: center; gap: 8px; margin: 16px 0;
          padding: 11px 14px; border-radius: 11px; background: var(--br-blue-bg); color: var(--br-blue);
          font-size: 12.5px; font-weight: 500; line-height: 1.5;
        }
        .cl-info svg { flex-shrink: 0; }
        .cl-link { display: block; font-weight: 700; color: var(--br-primary); }
        .cl-link:hover { text-decoration: underline; }
        .cl-code { display: block; font-size: 11.5px; color: var(--br-muted); }
        .cl-sales { font-weight: 800; color: var(--br-green); }
        .cl-copy { min-width: 86px; }
        .cl-copy.is-done { border-color: var(--br-green); color: var(--br-green); }
        .cl-more { padding: 4px 0 16px; margin-top: 12px; }

        @media (max-width: 1100px) { .cl-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .cl-stats { gap: 10px; }
          .cl-stats .br-stat:first-child { grid-column: 1 / -1; }
          .cl-info { align-items: flex-start; }
        }
      `}</style>
    </BrandShell>
  );
}
