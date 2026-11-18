"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { REPORT_TABS, LinkTabs } from "@/components/admin/settings/kit";
import { useRpc } from "@/lib/supabase";
import TraitsReport from "@/components/admin/campaign2/TraitsReport";

/**
 * /vault/reports/traits — 🧩 Creator traits report (purane mountTraitReport jaisa):
 *  Creators: Every creator / One campaign / One brand · Who · Group by · Split by · filter · Groups CSV · All creators CSV
 *  data = api.creator_trait_rows(p_campaign, p_brand, p_only) · lists = api.org_reports + api.brand_list
 */
export default function ReportsTraits() {
  const [scope, setScope] = useState("all");
  const [camp, setCamp] = useState("");
  const [brand, setBrand] = useState("");
  const camps = useRpc("admin", "api.org_reports");
  const brands = useRpc("admin", "api.brand_list");
  const campList = (Array.isArray(camps.data) ? camps.data : []).map((x) => ({ id: x.campaign_id || x.legacy_campaign_id || x.id, name: x.name, brand: x.brand, status: x.lifecycle_status }));
  const brandList = (Array.isArray(brands.data) ? brands.data : []).map((x) => ({ id: x.brand_id, name: x.name }));
  const c = scope === "campaign" ? camp || null : null;
  const b = scope === "brand" ? brand || null : null;
  const waiting = (scope === "campaign" && !camp) || (scope === "brand" && !brand);

  return (
    <AdminShell>
      <PageHead title="Reports" sub="Cross-campaign performance with source-aware analytics." />
      <LinkTabs tabs={REPORT_TABS} />
      <TraitsReport
        key={`${scope}:${c || ""}:${b || ""}`}
        campaign={waiting ? "sample" : c}
        brand={b}
        title="🧩 Creator traits report"
        sub="Group creators by what they have in common — category, city, followers, profile completion. Tap a group to see its creators."
      >
        <label>
          <span>Creators</span>
          <select className="ga-input tr-sel" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">Every creator</option>
            <option value="campaign">One campaign</option>
            <option value="brand">One brand</option>
          </select>
        </label>
        {scope === "campaign" && (
          <label>
            <span>Campaign</span>
            <select className="ga-input tr-sel" value={camp} onChange={(e) => setCamp(e.target.value)}>
              <option value="">Pick a campaign…</option>
              {campList.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                  {x.brand ? ` · ${x.brand}` : ""}
                  {x.status ? ` (${String(x.status).replace(/_/g, " ")})` : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        {scope === "brand" && (
          <label>
            <span>Brand</span>
            <select className="ga-input tr-sel" value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="">Pick a brand…</option>
              {brandList.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </TraitsReport>
    </AdminShell>
  );
}
