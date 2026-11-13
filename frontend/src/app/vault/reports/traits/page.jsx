"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { REPORT_TABS, LinkTabs, Panel, Table, downloadFile, toCsv, useToast, kfmt, emptyState } from "@/components/admin/settings/kit";
import { useRpc } from "@/lib/supabase";
import { CTR_TRAITS, ctrGroup, traitCsvRows } from "@/components/admin/settings/traits";

const HEAD = ["Creators", "Share", "Avg followers", "Avg engagement", "Avg profile", "Posted", "Completed"];
const fmtA = (v, d) => (v == null ? "—" : d ? Math.round(v * 10) / 10 + d : kfmt(v));

/**
 * /vault/reports/traits — 🧩 Creator traits report (purane app jaisa):
 *  data = api.creator_trait_rows(p_campaign, p_brand, p_only) · campaign list = api.org_reports
 */
export default function ReportsTraits() {
  const [by, setBy] = useState("categories");
  const [camp, setCamp] = useState(""); // "" = sab creators
  const [toast, say] = useToast();
  const camps = useRpc("admin", "api.org_reports");
  const campList = (Array.isArray(camps.data) ? camps.data : []).map((x) => ({ id: x.campaign_id || x.legacy_campaign_id || x.id, name: x.name, brand: x.brand }));
  const res = useRpc("admin", "api.creator_trait_rows", { p_campaign: camp || null, p_brand: null, p_only: null });
  const all = useMemo(() => res.data?.rows || [], [res.data]);
  const groups = useMemo(() => ctrGroup(all, by), [all, by]);
  const label = CTR_TRAITS.find((t) => t[0] === by)?.[1] || by;
  const campName = campList.find((c) => String(c.id) === String(camp))?.name || "All campaigns";
  const head = [label, ...HEAD];
  const rows = groups.map((g) => [
    <b key="v">{g.v}</b>,
    g.n,
    `${g.pct}%`,
    fmtA(g.followers),
    fmtA(g.eng, "%"),
    g.profile == null ? "—" : `${Math.round(g.profile)}%`,
    `${g.posted}`,
    g.completed,
  ]);
  const tag = (campName === "All campaigns" ? "all" : campName).replace(/\s+/g, "-").toLowerCase();

  const groupsCsv = () => {
    if (!groups.length) return say("Nothing to download in this view.", true);
    downloadFile(
      `creator-traits-${label}-${tag}.csv`.replace(/\s+/g, "-").toLowerCase(),
      toCsv(
        [label, "Creators", "Share %", "Avg followers", "Avg engagement %", "Avg profile %", "Posted", "Completed", "Views", "Likes"],
        groups.map((g) => [g.v, g.n, g.pct, g.followers == null ? "" : Math.round(g.followers), g.eng == null ? "" : Math.round(g.eng * 10) / 10, g.profile == null ? "" : Math.round(g.profile), g.posted, g.completed, g.views, g.likes])
      )
    );
    say("Groups CSV downloaded");
  };
  const rawCsv = () => {
    const [h, ...b] = traitCsvRows(all);
    if (!b.length) return say("No creators in this view yet.", true);
    downloadFile(`creators-${tag}.csv`, toCsv(h, b));
    say("Creators CSV downloaded");
  };

  return (
    <AdminShell>
      <PageHead title="Reports" sub="Cross-campaign performance with source-aware analytics.">
        <button type="button" className="rt-dl" onClick={rawCsv}>
          ⬇️ Download CSV
        </button>
      </PageHead>
      <LinkTabs tabs={REPORT_TABS} />

      <Panel
        title="🧩 Creator traits report"
        sub="Group creators by what they have in common — category, city, followers, profile completion."
        action={
          <button type="button" className="rt-dl rt-dl--in" onClick={groupsCsv}>
            ⬇️ Groups CSV
          </button>
        }
        className="rt-panel"
      >
        <div className="rt-filters">
          <label className="rt-sel">
            <span className="rt-sel__txt">Group by: {label}</span>
            <select value={by} onChange={(e) => setBy(e.target.value)} aria-label="Group by">
              {CTR_TRAITS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="rt-sel rt-sel--w">
            <span className="rt-sel__txt">{campName}</span>
            <select value={camp} onChange={(e) => setCamp(e.target.value)} aria-label="Campaign">
              <option value="">All campaigns</option>
              {campList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.brand ? ` · ${c.brand}` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Table
          rowH={48}
          minW={820}
          empty={emptyState({ loading: res.loading, error: res.error, reload: res.reload, empty: "No creators in this view yet." })}
          cols={[124, 121, 88, 175, 191, 142, 99, 136].map((w, i) => ({ w, label: head[i] }))}
          rows={rows}
        />
      </Panel>
      {toast}

      <style>{`
        .rt-dl { height: 36px; padding: 0 8px; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; }
        .rt-dl:hover { color: var(--ad-primary-2); }
        .rt-dl--in { margin-top: 12px; }
        .rt-panel { padding-bottom: 20px; }
        .rt-filters { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
        .rt-sel { position: relative; display: flex; align-items: center; height: 44px; min-width: 168px; padding: 0 13px; border-radius: 11px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 14px; color: #293652; cursor: pointer; }
        .rt-sel--w { min-width: 185px; }
        .rt-sel:hover { border-color: var(--ad-primary); }
        .rt-sel select { position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; }
        .rt-sel__txt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rt-panel .sk-tw { margin-top: 13px; }
        @media (max-width: 640px) {
          .rt-sel, .rt-sel--w { flex: 1 1 100%; }
          .rt-dl { padding: 0; }
          .rt-dl--in { margin-top: 0; }
        }
      `}</style>
    </AdminShell>
  );
}
