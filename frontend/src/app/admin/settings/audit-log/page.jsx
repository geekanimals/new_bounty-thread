"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, useToast, fmtDateTime, emptyState } from "@/components/admin/settings/kit";
import { rpc, useRpc, errText } from "@/lib/supabase";

const TONE = { UPDATE: "violet", INSERT: "green", DELETE: "red" };
/* purane app ki ADMIN_TABLES (org_profiles chhod ke) */
const TABLE_LIST = [
  ["members", "Members (all accounts)"],
  ["creators", "Agency creator rosters"],
  ["campaigns", "Campaigns"],
  ["barter_items", "Barter items"],
  ["applications", "Applications"],
  ["invites", "Invites"],
  ["irm_contacts", "IRM contacts"],
  ["story_deals", "Celebrity deals"],
  ["dream_plans", "Dream plans"],
];
const TABLE_NAME = Object.fromEntries(TABLE_LIST);
const TABLES = ["All tables", ...TABLE_LIST.map((t) => t[1])];
const ACTIONS = ["All actions", "UPDATE", "INSERT", "DELETE"];
const RESTORE = { DELETE: "Restore", UPDATE: "Revert", INSERT: "Undo" };
const EDITABLE = new Set(TABLE_LIST.map((t) => t[0]));
/** badlav ki ek line — kaunsa record / kya badla */
function changeLine(r) {
  const o = r.old_data || {};
  const n = r.new_data || {};
  const rec = n.name || o.name || n.email || o.email || n.product || o.product || n.campaign_name || o.campaign_name || (r.row_id ? String(r.row_id).slice(0, 8) + "…" : "");
  if (r.action === "UPDATE") {
    const keys = Object.keys(n).filter((k) => !["updated_at"].includes(k) && JSON.stringify(n[k]) !== JSON.stringify(o[k]));
    const k = keys[0];
    if (k) return `${rec} · ${k.replace(/_/g, " ")} → ${String(typeof n[k] === "object" ? JSON.stringify(n[k]) : n[k]).slice(0, 40)}${keys.length > 1 ? ` (+${keys.length - 1})` : ""}`;
  }
  return rec || "—";
}

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

/** /admin/settings/audit-log — kisne kya kab badla (admin_audit) + Diff + Restore/Revert/Undo (admin_restore) */
export default function SettingsAudit() {
  const [table, setTable] = useState(TABLES[0]);
  const [act, setAct] = useState(ACTIONS[0]);
  const tKey = TABLE_LIST.find((t) => t[1] === table)?.[0] || null;
  const log = useRpc("admin", "admin_audit", { p_limit: 150, p_offset: 0, p_table: tKey, p_action: act === ACTIONS[0] ? null : act });
  const rows = log.data || [];
  const [diff, setDiff] = useState(null);
  const [ask, setAsk] = useState(null);
  const [toast, say] = useToast();

  const restore = async () => {
    const r = ask;
    setAsk(null);
    const { error } = await rpc("admin", "admin_restore", { p_audit_id: Number(r.id) });
    if (error) return say(`Couldn't ${RESTORE[r.action].toLowerCase()}: ${errText(error)}`, true);
    say(`${RESTORE[r.action]} done`);
    log.reload();
  };

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
          empty={emptyState({ loading: log.loading, error: log.error, reload: log.reload, empty: "No changes match these filters." })}
          cols={[
            { label: "When", w: 165 },
            { label: "Who", w: 163 },
            { label: "Table", w: 222 },
            { label: "Action", w: 191 },
            { label: "Change", w: 335 },
          ]}
          rows={rows.map((l) => [
            fmtDateTime(l.at),
            <b key="w">{l.actor_email || "System"}</b>,
            TABLE_NAME[l.table_name] || l.table_name,
            <span key="a" className={`ga-badge ga-badge--${TONE[l.action] || ""}`}>
              {l.action}
            </span>,
            <span key="c" className="sg-chg">
              <button type="button" className="sk-muted sg-diff" onClick={() => setDiff(l)} title="See before / after">
                {changeLine(l)}
              </button>
              {EDITABLE.has(l.table_name) && RESTORE[l.action] && (
                <button type="button" className="sk-link" onClick={() => setAsk(l)}>
                  {RESTORE[l.action]}
                </button>
              )}
            </span>,
          ])}
        />
      </Panel>
      {diff && (
        <div className="ga-overlay" onClick={() => setDiff(null)}>
          <div className="ga-modal sg-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Change detail">
            <h2 className="ga-h2">Change detail</h2>
            <p className="sg-modal__p">
              {fmtDateTime(diff.at)} · {diff.actor_email || "System"} · {TABLE_NAME[diff.table_name] || diff.table_name} · {diff.action}
            </p>
            <p className="sg-lbl">Before</p>
            <pre className="sg-pre">{diff.old_data ? JSON.stringify(diff.old_data, null, 2) : "—"}</pre>
            <p className="sg-lbl">After</p>
            <pre className="sg-pre">{diff.new_data ? JSON.stringify(diff.new_data, null, 2) : "—"}</pre>
            <div className="sg-modal__btns">
              <button type="button" className="ga-btn ga-btn--primary" onClick={() => setDiff(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {ask && (
        <div className="ga-overlay" onClick={() => setAsk(null)}>
          <div className="ga-modal sg-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Restore">
            <h2 className="ga-h2">{RESTORE[ask.action]} this change?</h2>
            <p className="sg-modal__p">The row will be brought back / reverted to its earlier state. This action is itself logged.</p>
            <div className="sg-modal__btns">
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setAsk(null)}>
                Cancel
              </button>
              <button type="button" className="ga-btn ga-btn--primary" onClick={restore}>
                {RESTORE[ask.action]}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast}
      <style>{`
        .sg-chg { display: inline-flex; align-items: center; gap: 12px; max-width: 100%; }
        .sg-diff { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: 0; background: none; padding: 0; text-align: left; cursor: pointer; }
        .sg-diff:hover { color: var(--ad-primary); }
        .sg-modal { width: min(640px, 100%); padding: 24px; }
        .sg-modal__p { margin-top: 8px; font-size: 12.5px; color: var(--ad-muted); }
        .sg-lbl { margin-top: 14px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #8b92aa; }
        .sg-pre { margin: 6px 0 0; max-height: 220px; overflow: auto; padding: 12px; border-radius: 12px; background: var(--ad-soft-2); font-size: 11.5px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
        .sg-modal__btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        .sg-panel { padding-bottom: 20px; }
        .sg-filters { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 18px; }
        .sg-sel { position: relative; display: flex; align-items: center; height: 44px; padding: 0 13px; border-radius: 11px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 14px; color: #293652; cursor: pointer; }
        .sg-sel:hover { border-color: var(--ad-primary); }
        .sg-sel select { position: absolute; inset: 0; opacity: 0; width: 100%; cursor: pointer; }
        .sg-panel .sk-tw { margin-top: 14px; }
        .sg-panel .ga-badge { padding: 0 9px; }
      `}</style>
    </AdminShell>
  );
}
