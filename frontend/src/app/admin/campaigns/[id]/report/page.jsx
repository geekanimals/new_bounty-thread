"use client";

import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import ReportTabs from "@/components/admin/campaign2/ReportTabs";
import { Panel, MiniStats, useToast, downloadFile } from "@/components/admin/campaign2/kit";

const ROWS = [
  { name: "Nisha Rao", post: "Reel", url: "https://instagram.com/reel/nishastories", views: "12,400", reach: "6,100", likes: "812", comments: "64", shares: "40", saves: "58" },
  { name: "Kabir Mehta", post: "Reel", url: "https://instagram.com/reel/kabirfoodtrail", views: "9,800", reach: "4,900", likes: "540", comments: "31", shares: "22", saves: "41" },
  { name: "Aditi Verma", post: "Story", url: "https://instagram.com/stories/aditiverma", views: "2,100", reach: "1,800", likes: "—", comments: "—", shares: "—", saves: "—" },
];

export default function CampaignReport() {
  const { id } = useParams();
  const [toast, show] = useToast();

  const download = () => {
    downloadFile(`${id}-report.csv`, [["Creator", "Post", "Views", "Reach", "Likes", "Comments", "Shares", "Saves"], ...ROWS.map((r) => [r.name, r.url, r.views, r.reach, r.likes, r.comments, r.shares, r.saves])]);
    show("Campaign report downloaded");
  };

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <ReportTabs id={id} active="report" />

      <Panel
        title="📈 Campaign report"
        sub="Every creator who posted, with their numbers. Updates on its own as Instagram shares insights."
        actions={
          <button type="button" className="ad-btn ad-btn--primary" onClick={download}>
            ⬇️ Download report
          </button>
        }
      >
        <div className="rp-stats">
          <MiniStats
            items={[
              { value: 10, label: "Creators live" },
              { value: 14, label: "Posts" },
              { value: "48,300", label: "Views" },
              { value: "21,900", label: "Reach" },
              { value: "4.6%", label: "Engagement on followers" },
            ]}
          />
        </div>
        <div className="c2-tw">
          <table className="c2-t rp-t">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Post</th>
                <th>Views</th>
                <th>Reach</th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Shares</th>
                <th>Saves</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.name}>
                  <td>
                    <b>{r.name}</b>
                  </td>
                  <td>
                    <a className="c2-link" href={r.url} target="_blank" rel="noreferrer">
                      {r.post} ↗
                    </a>
                  </td>
                  <td>{r.views}</td>
                  <td>{r.reach}</td>
                  <td>{r.likes}</td>
                  <td>{r.comments}</td>
                  <td>{r.shares}</td>
                  <td>{r.saves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {toast}

      <style>{`
        .rp-stats { margin-top: -8px; }
        .rp-t { margin-top: 23px; }
        .rp-t td { height: 48px; padding-top: 6px; padding-bottom: 6px; }
      `}</style>
    </AdminShell>
  );
}
