"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table } from "@/components/admin/settings/kit";

const LOG = [
  ["4:47 pm", "Mayank", "Applications", "UPDATE", "Nisha Rao → approved"],
  ["4:30 pm", "Mayank", "Campaigns", "UPDATE", "Home Spa → live"],
  ["2:10 pm", "System", "Barter items", "INSERT", "Tracking DTDC 7D14…"],
  ["11:02 am", "Shivam", "Members", "DELETE", "Test account removed"],
];
const TONE = { UPDATE: "violet", INSERT: "green", DELETE: "red" };
const TABLES = ["All tables", ...new Set(LOG.map((l) => l[2]))];
const ACTIONS = ["All actions", "UPDATE", "INSERT", "DELETE"];

function Sel({ value, set, opts, w }) {
  return (
    <label className="sg-sel" style={{ minWidth: w }}>
      <span>{value}</span>
      <select value={value} onChange={(e) => set(e.target.value)} aria-label={opts[0]}>
        {opts.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

/** /admin/settings/audit-log — kisne kya kab badla */
export default function SettingsAudit() {
  const [table, setTable] = useState(TABLES[0]);
  const [act, setAct] = useState(ACTIONS[0]);
  const rows = useMemo(() => LOG.filter((l) => (table === TABLES[0] || l[2] === table) && (act === ACTIONS[0] || l[3] === act)), [table, act]);
  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />
      <Panel title="Audit log" sub="Every change to accounts, campaigns and data — who, what and when." className="sg-panel">
        <div className="sg-filters">
          <Sel value={table} set={setTable} opts={TABLES} w={123} />
          <Sel value={act} set={setAct} opts={ACTIONS} w={110} />
        </div>
        <Table
          rowH={58}
          minW={760}
          empty="No changes match these filters."
          cols={[
            { label: "When", w: 165 },
            { label: "Who", w: 163 },
            { label: "Table", w: 222 },
            { label: "Action", w: 191 },
            { label: "Change", w: 335 },
          ]}
          rows={rows.map((l) => [
            l[0],
            <b key="w">{l[1]}</b>,
            l[2],
            <span key="a" className={`ad-badge ad-badge--${TONE[l[3]]}`}>
              {l[3]}
            </span>,
            <span key="c" className="sk-muted">
              {l[4]}
            </span>,
          ])}
        />
      </Panel>
      <style>{`
        .sg-panel { padding-bottom: 20px; }
        .sg-filters { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 18px; }
        .sg-sel { position: relative; display: flex; align-items: center; height: 44px; padding: 0 13px; border-radius: 11px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 14px; color: #293652; cursor: pointer; }
        .sg-sel:hover { border-color: var(--ad-primary); }
        .sg-sel select { position: absolute; inset: 0; opacity: 0; width: 100%; cursor: pointer; }
        .sg-panel .sk-tw { margin-top: 14px; }
        .sg-panel .ad-badge { padding: 0 9px; }
      `}</style>
    </AdminShell>
  );
}
