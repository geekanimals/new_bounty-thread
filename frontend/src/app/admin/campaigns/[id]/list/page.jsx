"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import ReportTabs from "@/components/admin/campaign2/ReportTabs";
import { Panel, TableState, useToast, downloadXlsx } from "@/components/admin/campaign2/kit";
import { useRpc, rpc, errText } from "@/lib/supabase";
import { stageIndex, fmtNum } from "@/components/admin/campaign/live";

/*
 * 📋 List for the brand — purane bpShortlistHtml / bpDownloadShortlist jaisa.
 * Data: api.barter_tracker(p_campaign).creators — screening clear karne wale (eligible, sent_to_brand, brand_confirmed aur aage).
 * "Screened" par click → api.advance_participation (sent_to_brand) — purane "📋 Add to the brand's list" jaisa.
 */
const FAILED = ["dropped", "rejected", "ineligible", "brand_declined"];
const okFor = (x) => x.stage === "eligible" || x.stage === "sent_to_brand" || (stageIndex(x.stage) >= stageIndex("brand_confirmed") && !FAILED.includes(x.stage));
const label = (x) => (stageIndex(x.stage) >= stageIndex("brand_confirmed") ? "Brand confirmed" : x.stage === "sent_to_brand" ? "Sent to brand" : "Screened");

export default function CampaignBrandList() {
  const { id } = useParams();
  const [toast, show] = useToast();
  const { data, error, loading, reload } = useRpc("admin", "api.barter_tracker", { p_campaign: id }, { skip: !id || id === "sample" });
  const [busy, setBusy] = useState("");
  const list = ((data && data.creators) || []).filter(okFor);
  const camp = (data && data.campaign) || {};

  const download = async () => {
    const cols = ["#", "Creator", "Instagram", "Followers", "Engagement %", "City", "Categories", "Applied with", "Status", "Applied on"];
    const rows = list.map((x, i) => {
      const cr = x.creator || {};
      return [i + 1, cr.name || "", cr.username ? "@" + cr.username : "", cr.followers ?? "", cr.engagement ?? "", cr.city || "", (cr.categories || []).join("; "), x.applied_profile ? "@" + x.applied_profile : "", label(x), x.applied_at ? new Date(x.applied_at).toLocaleDateString("en-IN") : ""];
    });
    try {
      await downloadXlsx(`${String(camp.name || "campaign").replace(/[^\w-]+/g, "_")}_final_list.xlsx`, [cols, ...rows], "Final list");
      show("Final list downloaded — send it to the brand to sign off");
    } catch (e) {
      show(errText(e));
    }
  };
  const send = async (x) => {
    setBusy(x.participation_id);
    const { error: e } = await rpc("admin", "api.advance_participation", { p_participation: x.participation_id, p_to: "sent_to_brand", p_reason: "added to the brand's list" });
    setBusy("");
    show(e ? errText(e) : `${(x.creator || {}).name || "Creator"} added to the brand’s list`);
    if (!e) reload(true);
  };

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <ReportTabs id={id} active="list" />

      <Panel
        title="📋 Final list for the brand"
        sub="Everyone who cleared screening. Download it and send it to the brand to sign off."
        actions={
          <button type="button" className="ad-btn ad-btn--primary" onClick={download} disabled={!list.length}>
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
                <th>Applied with</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <TableState cols={7} loading={loading && !data} error={!data && error} onRetry={reload} empty={data && !list.length && "Nobody has cleared screening yet — screen the creators in the Creators tab first."} />
              {list.map((x) => {
                const cr = x.creator || {},
                  st = label(x);
                return (
                  <tr key={x.participation_id}>
                    <td>
                      <b>
                        {cr.name || "—"}
                        {cr.username ? ` · @${cr.username}` : ""}
                      </b>
                    </td>
                    <td>{cr.followers != null ? fmtNum(cr.followers) : "—"}</td>
                    <td>{cr.engagement != null ? `${cr.engagement}%` : "—"}</td>
                    <td>{cr.city || "—"}</td>
                    <td>{(cr.categories || []).join(", ") || "—"}</td>
                    <td>{x.applied_profile ? "@" + x.applied_profile : "—"}</td>
                    <td>
                      {st === "Screened" ? (
                        <button type="button" className="ad-badge bl-send" onClick={() => send(x)} disabled={busy === x.participation_id} title="Add to the brand’s list">
                          {busy === x.participation_id ? "…" : "Screened"}
                        </button>
                      ) : (
                        <span className={`ad-badge ad-badge--${st === "Brand confirmed" ? "green" : "violet"}`}>{st}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
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
