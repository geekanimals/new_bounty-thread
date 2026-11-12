"use client";

import { useParams } from "next/navigation";
import CreatorDrawer from "@/components/admin/creator/CreatorDrawer";

/* Creator profile → Activity tab (Figma: 4 numbers + Recent activity table) */
export default function CreatorActivityTab() {
  const { id } = useParams();
  return (
    <CreatorDrawer id={id} tab="activity">
      {(p) => (
        <div className="cpa">
          <div className="cpa-nums">
            {p.activity.stats.map(([n, l]) => (
              <div key={l}>
                <strong>{n}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <h3>Recent activity</h3>
          <div className="cpa-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>What</th>
                </tr>
              </thead>
              <tbody>
                {p.activity.rows.map(([w, t], i) => (
                  <tr key={i}>
                    <td>{w}</td>
                    <td>{t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <style>{`
            .cpa-nums { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
            .cpa-nums div { display: flex; flex-direction: column; min-height: 105px; padding: 22px 19px 16px; border-radius: 14px; border: 1px solid var(--ad-line); }
            .cpa-nums strong { font-family: var(--ad-head); font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; }
            .cpa-nums span { margin-top: 12px; font-size: 12px; color: var(--ad-muted); }
            .cpa h3 { margin-top: 26px; font-size: 13px; font-weight: 700; }
            .cpa-wrap { margin-top: 10px; overflow-x: auto; }
            .cpa .ad-table th { background: transparent; padding: 12px 11px; width: 46%; }
            .cpa .ad-table td { height: 48px; padding: 10px 11px; }
            @media (max-width: 640px) {
              .cpa-nums { grid-template-columns: 1fr 1fr; gap: 8px; }
              .cpa-nums div { min-height: 0; padding: 14px; }
              .cpa-nums strong { font-size: 23px; }
              .cpa .ad-table td { white-space: normal; }
            }
          `}</style>
        </div>
      )}
    </CreatorDrawer>
  );
}
