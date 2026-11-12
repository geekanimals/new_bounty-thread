"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import ReportTabs from "@/components/admin/campaign2/ReportTabs";
import { Panel, useToast, downloadFile } from "@/components/admin/campaign2/kit";

const ROWS = [
  { name: "Nisha Rao", handle: "@nishastories", followers: "28.1k", eng: "4.1%", city: "Mumbai", cat: "Beauty", rate: "₹2,000", status: "Sent to brand" },
  { name: "Kabir Mehta", handle: "@kabirfoodtrail", followers: "41.2k", eng: "2.8%", city: "Delhi", cat: "Food", rate: "₹2,000", status: "Sent to brand" },
  { name: "Ananya Iyer", handle: "@ananya.travels", followers: "17.6k", eng: "3.9%", city: "Chennai", cat: "Travel", rate: "Barter", status: "Screened" },
];

export default function CampaignBrandList() {
  const { id } = useParams();
  const [toast, show] = useToast();
  const [rows, setRows] = useState(ROWS);

  const download = () => {
    downloadFile(`${id}-final-list.csv`, [["Creator", "Handle", "Followers", "Engagement", "City", "Category", "Rate", "Status"], ...rows.map((r) => [r.name, r.handle, r.followers, r.eng, r.city, r.cat, r.rate, r.status])]);
    show("Final list downloaded — send it to the brand to sign off");
  };
  const send = (i) => {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, status: "Sent to brand" } : r)));
    show(`${rows[i].name} added to the brand’s list`);
  };

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <ReportTabs id={id} active="list" />

      <Panel
        title="📋 Final list for the brand"
        sub="Everyone who cleared screening. Download it and send it to the brand to sign off."
        actions={
          <button type="button" className="ad-btn ad-btn--primary" onClick={download}>
            ⬇️ Download Excel
          </button>
        }
      >
        <div className="c2-tw">
          <table className="c2-t bl-t">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Followers</th>
                <th>Engagement</th>
                <th>City</th>
                <th>Category</th>
                <th>Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.handle}>
                  <td>
                    <b>
                      {r.name} · {r.handle}
                    </b>
                  </td>
                  <td>{r.followers}</td>
                  <td>{r.eng}</td>
                  <td>{r.city}</td>
                  <td>{r.cat}</td>
                  <td>{r.rate}</td>
                  <td>
                    {r.status === "Screened" ? (
                      <button type="button" className="ad-badge bl-send" onClick={() => send(i)} title="Add to the brand’s list">
                        Screened
                      </button>
                    ) : (
                      <span className="ad-badge ad-badge--violet">{r.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {toast}

      <style>{`
        .bl-t { margin-top: -6px; }
        .bl-t td { height: 57px; padding-top: 8px; padding-bottom: 8px; }
        .bl-t .ad-badge { height: 25px; }
        .bl-send { border: 0; cursor: pointer; }
        .bl-send:hover { background: var(--ad-lilac); color: #6857ec; }
      `}</style>
    </AdminShell>
  );
}
