"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import ReportTabs from "@/components/admin/campaign2/ReportTabs";
import { Panel } from "@/components/admin/campaign2/kit";

/* Trait ke hisaab se group — [naam, creators, share, avg followers, avg engagement, posted, completed] */
const GROUPS = {
  Category: [
    ["Lifestyle", 22, "33%", "14.2k", "3.4%", 6, 5],
    ["Travel", 18, "27%", "16.9k", "2.9%", 4, 3],
    ["Food", 14, "21%", "22.5k", "3.0%", 3, 2],
    ["Beauty", 12, "18%", "19.8k", "4.1%", 1, 0],
  ],
  City: [
    ["Bengaluru", 24, "36%", "15.8k", "3.2%", 6, 4],
    ["Mysore", 19, "29%", "12.1k", "3.6%", 5, 4],
    ["Mumbai", 13, "20%", "24.3k", "3.1%", 2, 1],
    ["Delhi", 10, "15%", "21.0k", "2.8%", 1, 1],
  ],
  Followers: [
    ["5k–10k", 21, "32%", "7.4k", "4.2%", 5, 4],
    ["10k–25k", 27, "41%", "16.2k", "3.3%", 6, 5],
    ["25k–50k", 13, "20%", "34.8k", "2.7%", 2, 1],
    ["50k+", 5, "7%", "71.5k", "2.1%", 1, 0],
  ],
  Gender: [
    ["Women", 41, "62%", "17.1k", "3.5%", 9, 7],
    ["Men", 25, "38%", "18.4k", "2.9%", 5, 3],
  ],
};

export default function CampaignTraits() {
  const { id } = useParams();
  const [by, setBy] = useState("Category");

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <ReportTabs id={id} active="traits" />

      <Panel
        className="tr-panel"
        title="🧩 Creator traits — what this campaign’s creators have in common"
        sub="Group by any trait to see who posted and completed."
        actions={
          <select className="ad-input tr-by" value={by} onChange={(e) => setBy(e.target.value)} aria-label="Group by">
            {Object.keys(GROUPS).map((g) => (
              <option key={g} value={g}>
                Group by: {g}
              </option>
            ))}
          </select>
        }
      >
        <div className="c2-tw">
          <table className="c2-t tr-t">
            <thead>
              <tr>
                <th>{by}</th>
                <th>Creators</th>
                <th>Share</th>
                <th>Avg followers</th>
                <th>Avg engagement</th>
                <th>Posted</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {GROUPS[by].map((r) => (
                <tr key={r[0]}>
                  {r.map((v, i) => (
                    <td key={i}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <style>{`
        .tr-panel .c2-panel__head { align-items: center; }
        .tr-panel .c2-panel__act { padding-top: 0; }
        .tr-by { width: 168px; height: 44px; padding: 0 12px; cursor: pointer; -webkit-appearance: none; appearance: none; }
        .tr-t td { height: 48px; padding-top: 6px; padding-bottom: 6px; }
        @media (max-width: 640px) { .tr-by { width: 100%; } .tr-panel .c2-panel__act { width: 100%; } }
      `}</style>
    </AdminShell>
  );
}
