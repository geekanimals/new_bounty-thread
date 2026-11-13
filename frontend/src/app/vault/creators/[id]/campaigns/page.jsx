"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import CreatorDrawer from "@/components/admin/creator/CreatorDrawer";

/* Creator profile → Campaigns tab (Figma: table Campaign / Applied / Step / Result) */
export default function CreatorCampaignsTab() {
  const { id } = useParams();
  return (
    <CreatorDrawer id={id} tab="campaigns">
      {(p) => (
        <div className="cpc">
          <div className="cpc-wrap">
            <table className="ga-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Applied</th>
                  <th>Step</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {p.campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={c.campaignId ? `/vault/campaigns/${c.campaignId}/creators/${c.id}` : "/vault/campaigns"}>{c.name}</Link>
                    </td>
                    <td>{c.applied}</td>
                    <td>{c.step}</td>
                    <td>
                      <span className={`ga-badge ga-badge--${c.tone}`}>{c.result}</span>
                    </td>
                  </tr>
                ))}
                {!p.campaigns.length && (
                  <tr>
                    <td colSpan={4} className="cpc-none">
                      No campaign applications yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <style>{`
            .cpc { margin-top: 0; }
            .cpc-wrap { overflow-x: auto; }
            .cpc .ga-table th { background: transparent; padding: 12px 11px; }
            .cpc .ga-table td { height: 57px; padding: 12px 11px; }
            .cpc .ga-table th:nth-child(1) { width: 41%; }
            .cpc .ga-table th:nth-child(2) { width: 18%; }
            .cpc .ga-table th:nth-child(3) { width: 21%; }
            .cpc .ga-table a:hover { color: var(--ad-primary); }
            .cpc + .cdw-priv { margin-top: 30px; }
            .cpc-none { color: var(--ad-muted); }
          `}</style>
        </div>
      )}
    </CreatorDrawer>
  );
}
