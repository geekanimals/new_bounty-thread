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

// CSV download (purane ctrCsv / ctrCsvRaw jaisa)
function csvDl(name, aoa) {
  const csv = aoa.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = name.replace(/\s+/g, "-").toLowerCase();
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const GLANCE = ["categories", "skills", "city", "gender", "age", "profile", "followers"];
const tl = (k) => (TRAITS.find((t) => t[0] === k) || [])[1] || k;

export default function CampaignTraits() {
  const { id } = useParams();
  const [by, setBy] = useState("categories");
  const [who, setWho] = useState("");
  const [split, setSplit] = useState("");
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState("");
  const { data, error, loading, reload } = useRpc("admin", "api.creator_trait_rows", { p_campaign: id, p_brand: null, p_only: who || null }, { skip: !id || id === "sample" });
  const rowsAll = useMemo(() => (data && data.rows) || [], [data]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? rowsAll.filter((r) => `${r.name || ""} ${r.handle || ""} ${r.city || ""}`.toLowerCase().includes(t)) : rowsAll;
  }, [rowsAll, q]);
  const G = useMemo(() => group(rows, by), [rows, by]);
  const SG = useMemo(() => (split ? group(rows, split).map((x) => x.v) : []), [rows, split]);
  const label = tl(by);
  const maxN = Math.max(1, ...G.map((g) => g.n));
  const posted = rows.filter((r) => Number(r.posted) > 0).length;
  const prof = rows.filter((r) => r.profile_pct != null);
  const views = rows.reduce((a, r) => a + (Number(r.views) || 0), 0);
  const folA = rows.filter((r) => r.followers != null);
  const inG = (r, v) => [...new Set(vals(r, by))].includes(v);
  const tag = (data && data.campaign && data.campaign.name) || "campaign";
  const dlGroups = () =>
    csvDl(`creator-traits-${label}-${tag}.csv`, [
      [label, "Creators", "Share %", "Avg followers", "Avg engagement %", "Posted", "Completed", "Views"],
      ...G.map((g) => {
        const a = rows.filter((r) => inG(r, g.v));
        return [g.v, g.n, g.pct, g.followers == null ? "" : Math.round(g.followers), g.eng == null ? "" : Math.round(g.eng * 10) / 10, g.posted, g.completed, a.reduce((t, r) => t + (Number(r.views) || 0), 0)];
      }),
    ]);
  const dlRaw = () =>
    csvDl(`creators-${tag}.csv`, [
      ["Name", "Instagram", "On Geek OS", "Followers", "Engagement %", "Profile %", "Categories", "Skills", "Content types", "Languages", "City", "State", "Gender", "Age", "Takes barter", "Pet", "Parent", "Joined via", "Step", "Posted", "Completed", "Views", "Likes"],
      ...rows.map((r) => [r.name, r.handle, r.kind === "invite" ? "no" : "yes", r.followers, r.engagement, r.profile_pct, (r.categories || []).join("; "), (r.skills || []).join("; "), (r.formats || []).join("; "), (r.languages || []).join("; "), r.city, r.state, r.gender, r.age, r.barter, r.pet ? "yes" : "", r.parent ? "yes" : "", r.joined_via, r.stage, r.posted, r.completed, r.views, r.likes]),
    ]);

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <ReportTabs id={id} active="traits" />

      <Panel className="tr-panel" title="🧩 Creator traits — what this campaign’s creators have in common" sub="Group by any trait to see who posted and completed — tap a group to see its creators.">
        <div className="tr-bar">
          <label>
            <span>Who</span>
            <select className="ga-input tr-sel" value={who} onChange={(e) => (setWho(e.target.value), setOpen(null))}>
              <option value="">Everyone</option>
              <option value="approved">Approved by the brand</option>
              <option value="completed">Posted / completed only</option>
            </select>
          </label>
          <label>
            <span>Group by</span>
            <select className="ga-input tr-sel" value={by} onChange={(e) => (setBy(e.target.value), split === e.target.value && setSplit(""), setOpen(null))}>
              {TRAITS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Split by</span>
            <select className="ga-input tr-sel" value={split} onChange={(e) => setSplit(e.target.value)}>
              <option value="">— nothing —</option>
              {TRAITS.filter((t) => t[0] !== by).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <input className="ga-input tr-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎 Filter — name, @handle, city" aria-label="Filter creators" />
          <span className="tr-acts">
            <button type="button" className="ga-btn ga-btn--ghost tr-b" onClick={dlGroups} disabled={!rows.length}>
              ⬇ Groups CSV
            </button>
            <button type="button" className="ga-btn ga-btn--ghost tr-b" onClick={dlRaw} disabled={!rows.length}>
              ⬇ All creators CSV
            </button>
          </span>
        </div>

        {rows.length > 0 && (
          <>
            <div className="tr-kpis">
              <div>
                <b>{rows.length}</b>Creators
              </div>
              <div>
                <b>{prof.length ? Math.round(prof.reduce((a, r) => a + r.profile_pct, 0) / prof.length) + "%" : "—"}</b>Avg profile complete
              </div>
              <div>
                <b>{posted}</b>Posted ({Math.round((100 * posted) / rows.length)}%)
              </div>
              <div>
                <b>{views ? kfmt(views) : "—"}</b>Views from posts
              </div>
              <div>
                <b>{folA.length ? kfmt(folA.reduce((a, r) => a + Number(r.followers), 0) / folA.length) : "—"}</b>Avg followers
              </div>
            </div>
            <div className="tr-glance">
              <p>What they have in common</p>
              {GLANCE.map((t) => {
                const top = group(rows, t)
                  .filter((g) => !["Not given", "No profile", "No numbers"].includes(g.v))
                  .slice(0, 3);
                return top.length ? (
                  <div key={t} className="tr-gl">
                    <span>{tl(t)}</span>
                    {top.map((g) => (
                      <b key={g.v} title={`${g.n} creators`}>
                        {g.v} <i>{g.pct}%</i>
                      </b>
                    ))}
                  </div>
                ) : null;
              })}
            </div>
          </>
        )}

        <div className="c2-tw">
          <table className="c2-t tr-t">
            <thead>
              <tr>
                <th>{label}</th>
                <th>Creators</th>
                <th>Share</th>
                {split ? (
                  SG.map((v) => <th key={v}>{v}</th>)
                ) : (
                  <>
                    <th>Avg followers</th>
                    <th>Avg engagement</th>
                    <th>Posted</th>
                    <th>Completed</th>
                    <th>Views</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              <TableState cols={split ? 3 + SG.length : 8} loading={loading && !data} error={!data && (data?.error || error)} onRetry={reload} empty={data && !rows.length && "No creators in this view yet."} />
              {G.map((g) => {
                const a = rows.filter((r) => inG(r, g.v));
                return [
                  <tr key={g.v} className={`tr-row ${open === g.v ? "is-on" : ""}`} onClick={() => setOpen(open === g.v ? null : g.v)}>
                    <td>
                      <b>{g.v}</b>
                    </td>
                    <td>{g.n}</td>
                    <td>
                      <span className="tr-meter">
                        <i style={{ width: `${Math.round((100 * g.n) / maxN)}%` }} />
                      </span>{" "}
                      {g.pct}%
                    </td>
                    {split ? (
                      SG.map((v) => {
                        const k = a.filter((r) => vals(r, split).includes(v)).length;
                        return (
                          <td key={v} className={k ? "" : "tr-mute"}>
                            {k || "·"}
                          </td>
                        );
                      })
                    ) : (
                      <>
                        <td>{kfmt(g.followers)}</td>
                        <td>{g.eng == null ? "—" : `${Math.round(g.eng * 10) / 10}%`}</td>
                        <td>
                          {g.posted} <span className="tr-mute">({Math.round((100 * g.posted) / g.n)}%)</span>
                        </td>
                        <td>{g.completed}</td>
                        <td>{(() => { const v = a.reduce((t, r) => t + (Number(r.views) || 0), 0); return v ? kfmt(v) : "—"; })()}</td>
                      </>
                    )}
                  </tr>,
                  open === g.v ? (
                    <tr key={g.v + ":open"} className="tr-open">
                      <td colSpan={split ? 3 + SG.length : 8}>
                        <div className="tr-people">
                          {a.slice(0, 200).map((r, i) => (
                            <span key={i} className="tr-p">
                              <b>{r.name || r.handle || "Creator"}</b>
                              {r.handle ? <em> @{String(r.handle).replace(/^@/, "")}</em> : null}
                              {r.followers != null ? ` · ${kfmt(r.followers)}` : ""}
                              {r.profile_pct != null ? ` · ${r.profile_pct}%` : ""}
                              {Number(r.posted) > 0 ? " · ✅" : ""}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <style>{`
        .tr-bar { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; margin-bottom: 14px; }
        .tr-bar label { display: flex; flex-direction: column; gap: 5px; font-size: 11px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; color: var(--ad-muted); }
        .tr-sel { width: auto; min-width: 170px; height: 42px; padding: 0 12px; cursor: pointer; -webkit-appearance: none; appearance: none; text-transform: none; letter-spacing: 0; font-weight: 600; }
        .tr-q { width: 230px; height: 42px; }
        .tr-acts { display: flex; gap: 8px; margin-left: auto; }
        .tr-b { height: 40px; padding: 0 13px; font-size: 13px; }
        .tr-kpis { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
        .tr-kpis div { display: flex; flex-direction: column; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--ad-line); font-size: 12px; color: var(--ad-muted); }
        .tr-kpis b { font-family: var(--ad-head); font-size: 22px; font-weight: 800; color: var(--ad-ink); }
        .tr-glance { padding: 12px 14px; border-radius: 12px; background: var(--ad-soft-2); margin-bottom: 14px; font-size: 12.5px; }
        .tr-glance > p { font-weight: 800; color: var(--ad-ink); margin-bottom: 6px; }
        .tr-gl { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 5px; }
        .tr-gl span { min-width: 120px; color: var(--ad-muted); }
        .tr-gl b { padding: 3px 8px; border-radius: 999px; background: #fff; font-weight: 700; color: var(--ad-ink); }
        .tr-gl i { font-style: normal; color: var(--ad-muted); font-weight: 600; }
        .tr-t td { height: 48px; padding-top: 6px; padding-bottom: 6px; }
        .tr-row { cursor: pointer; }
        .tr-row:hover td, .tr-row.is-on td { background: var(--ad-soft-2); }
        .tr-meter { display: inline-block; width: 60px; height: 6px; border-radius: 99px; background: #eceef6; vertical-align: middle; overflow: hidden; }
        .tr-meter i { display: block; height: 100%; background: var(--ad-primary); }
        .tr-mute { color: var(--ad-muted); }
        .tr-people { display: flex; flex-wrap: wrap; gap: 6px; white-space: normal; }
        .tr-p { padding: 5px 9px; border-radius: 9px; border: 1px solid var(--ad-line); font-size: 12px; background: #fff; }
        .tr-p em { font-style: normal; color: var(--ad-muted); }
        @media (max-width: 900px) { .tr-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .tr-acts { margin-left: 0; } }
      `}</style>
    </AdminShell>
  );
}
