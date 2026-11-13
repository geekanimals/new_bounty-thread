"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import ReportTabs from "@/components/admin/campaign2/ReportTabs";
import { Panel, TableState } from "@/components/admin/campaign2/kit";
import { useRpc } from "@/lib/supabase";
import { stepLabel } from "@/components/admin/campaign/live";

/*
 * 🧩 Creator traits — purane mountTraitReport / ctrGroup jaisa (is campaign ke creators).
 * Data: api.creator_trait_rows({ p_campaign, p_brand: null, p_only: null }) → { rows[] } · grouping browser mein (purane jaisa).
 */
const TRAITS = [
  ["categories", "Category"],
  ["city", "City"],
  ["followers", "Followers"],
  ["gender", "Gender"],
  ["skills", "Skill"],
  ["formats", "Content type"],
  ["languages", "Language"],
  ["state", "State"],
  ["age", "Age"],
  ["profile", "Profile completion"],
  ["engagement", "Engagement"],
  ["barter", "Takes barter"],
  ["pet", "Pet parent"],
  ["parent", "Mom / parent"],
  ["joined_via", "Joined via"],
  ["stage", "Campaign step"],
  ["posted", "Posted?"],
  ["kind", "On Geek OS?"],
];
const cap1 = (s) => String(s || "").replace(/^./, (c) => c.toUpperCase());
function vals(r, t) {
  const one = (v) => (v == null || v === "" ? ["Not given"] : [v]);
  const f = Number(r.followers),
    e = Number(r.engagement),
    p = r.profile_pct;
  switch (t) {
    case "categories":
    case "skills":
    case "formats":
    case "languages":
      return (r[t] || []).length ? r[t].map(cap1) : ["Not given"];
    case "city":
    case "state":
      return one(r[t] ? cap1(String(r[t]).toLowerCase()) : null);
    case "gender":
      return one(r.gender ? cap1(r.gender) : null);
    case "age":
      return r.age == null ? ["Not given"] : [r.age < 25 ? "18–24" : r.age < 35 ? "25–34" : r.age < 45 ? "35–44" : "45+"];
    case "profile":
      return p == null ? ["No profile"] : [p >= 100 ? "100% complete" : p >= 75 ? "75–99%" : p >= 50 ? "50–74%" : p >= 25 ? "25–49%" : "0–24%"];
    case "followers":
      return r.followers == null ? ["No numbers"] : [f < 1e3 ? "Under 1K" : f < 1e4 ? "Nano 1K–10K" : f < 5e4 ? "Micro 10K–50K" : f < 2e5 ? "Mid 50K–200K" : f < 1e6 ? "Macro 200K–1M" : "Mega 1M+"];
    case "engagement":
      return r.engagement == null ? ["No numbers"] : [e < 1 ? "Under 1%" : e < 3 ? "1–3%" : e < 5 ? "3–5%" : e < 10 ? "5–10%" : "10%+"];
    case "barter":
      return [r.barter === true ? "Yes" : r.barter === false ? "No" : "Not given"];
    case "pet":
      return [r.pet ? "🐾 Has a pet" : "No pet"];
    case "parent":
      return [r.parent ? (r.gender === "male" ? "👨 Dad" : "👩 Mom / parent") : "Not a parent"];
    case "joined_via":
      return [r.joined_via ? cap1(r.joined_via) : "Signed up themselves"];
    case "stage":
      return [r.stage ? stepLabel(r.stage) || cap1(r.stage) : "Not on a campaign"];
    case "posted":
      return [Number(r.posted) > 0 ? "✅ Posted" : "Not posted"];
    case "kind":
      return [r.kind === "invite" ? "Not on Geek OS (uploaded)" : "On Geek OS"];
  }
  return ["—"];
}
const LAST = ["Not given", "No profile", "No numbers", "Not on a campaign"];
function group(rows, t) {
  const G = new Map();
  rows.forEach((r) =>
    [...new Set(vals(r, t))].forEach((v) => {
      if (!G.has(v)) G.set(v, []);
      G.get(v).push(r);
    })
  );
  const n = rows.length || 1;
  const avg = (a, k) => {
    const x = a.map((r) => Number(r[k])).filter((v) => !isNaN(v));
    return x.length ? x.reduce((s, v) => s + v, 0) / x.length : null;
  };
  return [...G.entries()]
    .map(([v, a]) => ({
      v,
      n: a.length,
      pct: Math.round((100 * a.length) / n),
      followers: avg(a.filter((r) => r.followers != null), "followers"),
      eng: avg(a.filter((r) => r.engagement != null), "engagement"),
      posted: a.filter((r) => Number(r.posted) > 0).length,
      completed: a.filter((r) => Number(r.completed) > 0).length,
    }))
    .sort((x, y) => LAST.includes(x.v) - LAST.includes(y.v) || y.n - x.n || String(x.v).localeCompare(String(y.v)));
}
const kfmt = (v) => (v == null ? "—" : v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1e3 ? (v / 1e3).toFixed(1) + "k" : String(Math.round(v)));

export default function CampaignTraits() {
  const { id } = useParams();
  const [by, setBy] = useState("categories");
  const { data, error, loading, reload } = useRpc("admin", "api.creator_trait_rows", { p_campaign: id, p_brand: null, p_only: null }, { skip: !id || id === "sample" });
  const rows = useMemo(() => (data && data.rows) || [], [data]);
  const G = useMemo(() => group(rows, by), [rows, by]);
  const label = (TRAITS.find((t) => t[0] === by) || [])[1];

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <ReportTabs id={id} active="traits" />

      <Panel
        className="tr-panel"
        title="🧩 Creator traits — what this campaign’s creators have in common"
        sub="Group by any trait to see who posted and completed."
        actions={
          <select className="ga-input tr-by" value={by} onChange={(e) => setBy(e.target.value)} aria-label="Group by">
            {TRAITS.map(([k, l]) => (
              <option key={k} value={k}>
                Group by: {l}
              </option>
            ))}
          </select>
        }
      >
        <div className="c2-tw">
          <table className="c2-t tr-t">
            <thead>
              <tr>
                <th>{label}</th>
                <th>Creators</th>
                <th>Share</th>
                <th>Avg followers</th>
                <th>Avg engagement</th>
                <th>Posted</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              <TableState cols={7} loading={loading && !data} error={!data && (data?.error || error)} onRetry={reload} empty={data && !rows.length && "No creators in this campaign yet."} />
              {G.map((g) => (
                <tr key={g.v}>
                  <td>{g.v}</td>
                  <td>{g.n}</td>
                  <td>{g.pct}%</td>
                  <td>{kfmt(g.followers)}</td>
                  <td>{g.eng == null ? "—" : `${Math.round(g.eng * 10) / 10}%`}</td>
                  <td>{g.posted}</td>
                  <td>{g.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <style>{`
        .tr-panel .c2-panel__head { align-items: center; }
        .tr-panel .c2-panel__act { padding-top: 0; }
        .tr-by { width: auto; min-width: 168px; height: 44px; padding: 0 12px; cursor: pointer; -webkit-appearance: none; appearance: none; }
        .tr-t td { height: 48px; padding-top: 6px; padding-bottom: 6px; }
        @media (max-width: 640px) { .tr-by { width: 100%; } .tr-panel .c2-panel__act { width: 100%; } }
      `}</style>
    </AdminShell>
  );
}
