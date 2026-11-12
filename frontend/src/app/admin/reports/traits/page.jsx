"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { REPORT_TABS, LinkTabs, Panel, Table, downloadFile, toCsv, useToast } from "@/components/admin/settings/kit";

/* Group by ke hisaab se dummy groups (Figma: Category) */
const GROUPS = {
  Category: [
    ["Lifestyle", 82, "27%", "14.2k", "3.4%", "71%", 38, 31],
    ["Beauty", 61, "20%", "19.8k", "4.1%", "66%", 29, 22],
    ["Food", 44, "14%", "22.5k", "3.0%", "58%", 21, 18],
    ["Fashion", 39, "13%", "11.3k", "3.8%", "62%", 17, 12],
    ["Travel", 22, "7%", "16.9k", "2.9%", "55%", 8, 6],
  ],
  City: [
    ["Mumbai", 74, "25%", "21.4k", "3.7%", "68%", 31, 25],
    ["Delhi", 58, "19%", "18.2k", "3.2%", "63%", 24, 19],
    ["Bengaluru", 51, "17%", "15.9k", "3.9%", "70%", 22, 18],
    ["Kolkata", 33, "11%", "10.6k", "3.5%", "57%", 12, 9],
    ["Chennai", 27, "9%", "14.8k", "3.1%", "59%", 10, 8],
  ],
  Followers: [
    ["Under 10k", 96, "32%", "6.1k", "4.6%", "61%", 30, 24],
    ["10k – 25k", 118, "40%", "16.4k", "3.6%", "67%", 49, 40],
    ["25k – 50k", 61, "20%", "34.2k", "3.0%", "72%", 24, 19],
    ["50k+", 23, "8%", "78.5k", "2.4%", "74%", 10, 7],
  ],
  "Profile completion": [
    ["Complete", 35, "12%", "24.8k", "3.9%", "100%", 22, 19],
    ["Half done", 142, "48%", "16.1k", "3.4%", "58%", 61, 46],
    ["Just started", 121, "40%", "11.7k", "3.1%", "22%", 30, 22],
  ],
};
const CAMPS = ["All campaigns", "Circle Diwali Declutter", "Beardo Detan Express Kit", "Vaaree Biggest Diwali Sale", "Pujo with Olio"];
const HEAD = ["Creators", "Share", "Avg followers", "Avg engagement", "Avg profile", "Posted", "Completed"];

export default function ReportsTraits() {
  const [by, setBy] = useState("Category");
  const [camp, setCamp] = useState(CAMPS[0]);
  const [toast, say] = useToast();
  const rows = useMemo(() => GROUPS[by], [by]);
  const head = [by === "Profile completion" ? "Profile" : by, ...HEAD];

  const csv = (name) => {
    downloadFile(name, toCsv(head, rows));
    say("CSV downloaded");
  };

  return (
    <AdminShell>
      <PageHead title="Reports" sub="Cross-campaign performance with source-aware analytics.">
        <button type="button" className="rt-dl" onClick={() => csv("geek-os-creator-traits.csv")}>
          ⬇️ Download CSV
        </button>
      </PageHead>
      <LinkTabs tabs={REPORT_TABS} />

      <Panel
        title="🧩 Creator traits report"
        sub="Group creators by what they have in common — category, city, followers, profile completion."
        action={
          <button type="button" className="rt-dl rt-dl--in" onClick={() => csv(`geek-os-groups-${by.toLowerCase().replace(/\s+/g, "-")}.csv`)}>
            ⬇️ Groups CSV
          </button>
        }
        className="rt-panel"
      >
        <div className="rt-filters">
          <label className="rt-sel">
            <span className="rt-sel__txt">Group by: {by}</span>
            <select value={by} onChange={(e) => setBy(e.target.value)} aria-label="Group by">
              {Object.keys(GROUPS).map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="rt-sel rt-sel--w">
            <span className="rt-sel__txt">{camp}</span>
            <select value={camp} onChange={(e) => setCamp(e.target.value)} aria-label="Campaign">
              {CAMPS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <Table rowH={48} minW={820} cols={[124, 121, 88, 175, 191, 142, 99, 136].map((w, i) => ({ w, label: head[i] }))} rows={rows} />
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
