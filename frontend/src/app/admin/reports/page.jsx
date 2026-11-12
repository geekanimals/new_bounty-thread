"use client";

import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { CREATORS } from "@/components/admin/data";
import { REPORT_TABS, LinkTabs, Panel, Table, downloadFile, toCsv, useToast } from "@/components/admin/settings/kit";


const TOP = [
  { n: "298", l: "Creators" },
  { n: "5", l: "Active campaigns" },
  { n: "5", l: "Live barters" },
  { n: "₹5L", l: "EMV generated" },
];
const MID = [
  { n: "228", l: "Applications" },
  { n: "151", l: "Approved" },
  { n: "63", l: "Posts live" },
  { n: "34,315", l: "Reach" },
  { n: "76,059", l: "Views", s: "11% eng. / reach" },
];
const ROWS = [
  ["Circle Diwali Declutter · 100", "Completed", 58, 0, 58, 0, 23, "47,283", "59,653", "1,487", 50],
  ["Circle Diwali Declutter · 10", "Completed", 38, 19, 18, 1, 19, "13,299", "47,581", "738", 193],
  ["Beardo Detan Express Kit", "Live", 66, 12, 48, 6, 10, "8,240", "19,300", "1,120", 88],
  ["Home Spa · Yes Madam", "In execution", 0, 0, 0, 0, 0, "—", "—", "—", "—"],
];
const HEAD = ["Campaign", "Status", "Applied", "Pending", "Approved", "Declined", "Posts", "Reach", "Views", "Likes", "Comments"];
const TONE = { Completed: "", Live: "green", "In execution": "violet" };

export default function ReportsPage() {
  const [toast, say] = useToast();
  const csv = () => {
    downloadFile("geek-os-campaign-performance.csv", toCsv(HEAD, ROWS));
    say("Campaign report downloaded");
  };
  const creatorsCsv = () => {
    downloadFile(
      "geek-os-all-creators.csv",
      toCsv(["Name", "Handle", "Followers", "City", "Category", "Instagram"], CREATORS.map((c) => [c.name, c.handle, c.followers, c.city, c.category, c.ig ? "Connected" : "Not connected"]))
    );
    say("All creators CSV downloaded");
  };

  return (
    <AdminShell>
      <PageHead title="Reports" sub="Live campaign performance across Geek OS.">
        <button type="button" className="rp-dl" onClick={csv}>
          ⬇️ Download CSV
        </button>
        <button type="button" className="rp-dl" onClick={creatorsCsv}>
          ⬇️ All creators CSV
        </button>
      </PageHead>
      <LinkTabs tabs={REPORT_TABS} />

      <div className="rp-top">
        {TOP.map((s, i) => (
          <div key={s.l} className={`rp-stat ${i === 0 ? "rp-stat--hero" : ""}`}>
            <strong>{s.n}</strong>
            <span>{s.l}</span>
          </div>
        ))}
      </div>
      <div className="rp-mid">
        {MID.map((s) => (
          <div key={s.l} className="rp-stat rp-stat--tall">
            <strong>{s.n}</strong>
            <span>{s.l}</span>
            {s.s && <small>{s.s}</small>}
          </div>
        ))}
      </div>

      <Panel title="Campaign performance" sub="8 campaigns" className="rp-panel">
        <Table
          rowH={57}
          minW={980}
          cols={[{ w: 216 }, { w: 125 }, { w: 81 }, { w: 85 }, { w: 98 }, { w: 92 }, { w: 69 }, { w: 71 }, { w: 73 }, { w: 63 }, { w: 103 }].map((c, i) => ({ ...c, label: HEAD[i] }))}
          rows={ROWS.map((r) => [
            r[0],
            <span key="s" className={`ad-badge ad-badge--${TONE[r[1]]}`}>
              {r[1]}
            </span>,
            ...r.slice(2),
          ])}
        />
      </Panel>
      {toast}

      <style>{`
        .rp-dl { height: 36px; padding: 0 8px; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; }
        .rp-dl:hover { color: var(--ad-primary-2); }
        .rp-top { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; margin-bottom: 23px; }
        .rp-mid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 13px; margin-bottom: 23px; }
        .rp-stat { display: flex; flex-direction: column; min-height: 106px; padding: 23px 19px 16px; border-radius: 18px; background: #fff; border: 1px solid var(--ad-line); box-shadow: 0 8px 24px rgba(30,37,73,.02); }
        .rp-stat--tall { min-height: 120px; }
        .rp-stat strong { font-family: var(--ad-head); font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1.15; color: var(--ad-ink); }
        .rp-stat span { margin-top: 12px; font-size: 12px; color: var(--ad-muted); }
        .rp-stat small { margin-top: 7px; font-size: 11px; color: var(--ad-faint); }
        .rp-stat--hero { background: var(--ad-grad); border-color: transparent; box-shadow: 0 16px 30px -18px rgba(103,87,245,.9); }
        .rp-stat--hero strong { color: #fff; }
        .rp-stat--hero span { color: #e4ddff; }
        .rp-panel { padding-bottom: 22px; }
        .rp-panel .sk-tw { margin-top: 12px; }
        @media (max-width: 1180px) { .rp-mid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 820px) { .rp-top { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .rp-top, .rp-mid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
          .rp-mid .rp-stat:last-child { grid-column: 1 / -1; }
          .rp-stat, .rp-stat--tall { min-height: 0; padding: 16px 14px; }
          .rp-stat strong { font-size: 24px; }
          .rp-dl { padding: 0; justify-content: flex-start; text-align: left; }
        }
      `}</style>
    </AdminShell>
  );
}
