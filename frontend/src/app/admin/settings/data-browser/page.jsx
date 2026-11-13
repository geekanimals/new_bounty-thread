"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, downloadFile, objectsToCsv, useToast, fmtDate, emptyState } from "@/components/admin/settings/kit";
import { rpc, useRpc, errText } from "@/lib/supabase";

/* purane app ki ADMIN_TABLES / ADMIN_EDITABLE / ADMIN_READONLY_FIELDS */
const TABLES = [
  ["members", "Members (all accounts)"],
  ["creators", "Agency creator rosters"],
  ["campaigns", "Campaigns"],
  ["barter_items", "Barter items"],
  ["applications", "Applications"],
  ["invites", "Invites"],
  ["irm_contacts", "IRM contacts"],
  ["story_deals", "Celebrity deals"],
  ["dream_plans", "Dream plans"],
  ["org_profiles", "Org profiles"],
];
const EDITABLE = new Set(TABLES.map((t) => t[0]).filter((t) => t !== "org_profiles"));
const LOCKED = new Set(["id", "org_id", "created_at", "updated_at"]);
const SHOW = ["name", "email", "product", "celebrity", "campaign_name", "creator_name", "goal", "status", "role", "stage", "org_name"];
const cellTxt = (v) => (v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)).slice(0, 60);

/**
 * /admin/settings/data-browser — koi bhi table dekho, dhoondho, download, edit / delete
 * (admin_list_table · admin_update_row · admin_delete_row — sab audit log mein jaata hai)
 */
export default function SettingsData() {
  const [t, setT] = useState("creators");
  const [q, setQ] = useState("");
  const [qq, setQq] = useState(""); // debounce
  const [open, setOpen] = useState(null); // { row, edit }
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState("");
  const [toast, say] = useToast();
  useEffect(() => {
    const x = setTimeout(() => setQq(q.trim()), 300);
    return () => clearTimeout(x);
  }, [q]);
  const res = useRpc("admin", "admin_list_table", { p_table: t, p_search: qq, p_limit: 200, p_offset: 0 });
  const rows = res.data || [];
  const keys = rows.length ? Object.keys(rows[0]) : [];
  let shown = SHOW.filter((k) => keys.includes(k)).slice(0, 3);
  if (!shown.length && keys.length) shown = [keys.find((k) => k !== "id" && k !== "org_id") || "id"];
  const label = TABLES.find((x) => x[0] === t)?.[1] || t;
  const cols = [{ label: "ID", w: 170 }, ...shown.map((k) => ({ label: k.replace(/_/g, " "), w: 640 / shown.length })), { label: "Created", w: 266 }];

  // poori table (search ke saath) — 500-500 karke, 20,000 tak
  const exportAll = async (fmt) => {
    setBusy(fmt);
    let all = [];
    let off = 0;
    for (;;) {
      const { data, error } = await rpc("admin", "admin_list_table", { p_table: t, p_search: qq, p_limit: 500, p_offset: off });
      if (error) {
        setBusy("");
        return say(`Export failed: ${errText(error)}`, true);
      }
      const chunk = data || [];
      all = all.concat(chunk);
      if (chunk.length < 500 || all.length >= 20000) break;
      off += 500;
    }
    setBusy("");
    if (!all.length) return say("No rows to export.", true);
    const stamp = new Date().toISOString().slice(0, 10);
    if (fmt === "json") downloadFile(`${t}-${stamp}.json`, JSON.stringify(all, null, 2), "application/json");
    else downloadFile(`${t}-${stamp}.csv`, objectsToCsv(all));
    say(`${fmt.toUpperCase()} downloaded · ${all.length} rows`);
  };
  const doDelete = async () => {
    const r = del;
    setDel(null);
    const { error } = await rpc("admin", "admin_delete_row", { p_table: t, p_id: r.id });
    if (error) return say(`Couldn't delete: ${errText(error)}`, true);
    say("Deleted — logged in the audit trail");
    res.reload();
  };

  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />
      <Panel
        title="Data browser"
        sub="Look at any table and download it."
        className="sd-panel"
        action={
          <>
            <button type="button" className="sd-dl" disabled={!!busy} onClick={() => exportAll("csv")}>
              {busy === "csv" ? "Exporting…" : "⬇️ CSV"}
            </button>
            <button type="button" className="sd-dl" disabled={!!busy} onClick={() => exportAll("json")}>
              {busy === "json" ? "Exporting…" : "⬇️ JSON"}
            </button>
          </>
        }
      >
        <div className="sd-filters">
          <label className="sd-sel">
            <span>{label}</span>
            <select
              value={t}
              onChange={(e) => {
                setT(e.target.value);
                setQ("");
              }}
              aria-label="Table"
            >
              {TABLES.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <input className="ad-input sd-q" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter rows" />
          {!res.loading && <span className="sd-count">{rows.length} row{rows.length === 1 ? "" : "s"}{rows.length >= 200 ? " (showing first 200)" : ""}</span>}
        </div>
        <Table
          rowH={48}
          minW={680}
          empty={emptyState({ loading: res.loading, error: res.error, reload: res.reload, empty: q ? "No rows match this filter." : "No rows." })}
          cols={[...cols, { label: "", w: 150 }]}
          rows={rows.map((r) => [
            <span key="i" className="sk-muted" title={r.id}>
              {String(r.id || "—").slice(0, 4)}…
            </span>,
            ...shown.map((k, i) => (i === 0 ? <b key={k}>{cellTxt(r[k])}</b> : cellTxt(r[k]))),
            fmtDate(r.created_at),
            <span key="a" className="sd-acts">
              <button type="button" className="sk-link" onClick={() => setOpen({ row: r, edit: false })}>
                View
              </button>
              {EDITABLE.has(t) && (
                <>
                  <button type="button" className="sk-link" onClick={() => setOpen({ row: r, edit: true })}>
                    Edit
                  </button>
                  <button type="button" className="sk-link sd-del" onClick={() => setDel(r)}>
                    Delete
                  </button>
                </>
              )}
            </span>,
          ])}
        />
      </Panel>
      {open && (
        <RowModal
          table={t}
          row={open.row}
          edit={open.edit}
          onClose={() => setOpen(null)}
          onSaved={() => {
            setOpen(null);
            say("Saved — logged in the audit trail");
            res.reload();
          }}
        />
      )}
      {del && (
        <div className="ad-overlay" onClick={() => setDel(null)}>
          <div className="ad-modal sd-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Delete record">
            <h2 className="ad-h2">Delete this {label.toLowerCase()} record?</h2>
            <p className="sd-modal__p">
              <b>{del.name || del.email || del.product || del.campaign_name || del.id}</b> — this is permanent (logged to the audit trail).
            </p>
            <div className="sd-modal__btns">
              <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setDel(null)}>
                Cancel
              </button>
              <button type="button" className="ad-btn ad-btn--danger" onClick={doDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {toast}
      <style>{`
        .sd-panel { padding-bottom: 20px; }
        .sd-dl { height: 32px; padding: 0 8px; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; margin-top: 6px; }
        .sd-dl:hover { color: var(--ad-primary-2); }
        .sd-filters { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 18px; }
        .sd-sel { position: relative; display: flex; align-items: center; height: 44px; min-width: 195px; padding: 0 13px; border-radius: 11px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 14px; color: #293652; cursor: pointer; }
        .sd-sel:hover { border-color: var(--ad-primary); }
        .sd-sel select { position: absolute; inset: 0; opacity: 0; width: 100%; cursor: pointer; }
        .sd-q { width: 270px; height: 44px; }
        .sd-q::placeholder { color: #757575; }
        .sd-panel .sk-tw { margin-top: 14px; }
        .sd-count { align-self: center; font-size: 12px; color: var(--ad-muted); }
        .sd-acts { display: inline-flex; gap: 12px; }
        .sd-del { color: var(--ad-red); }
        .sd-modal { width: min(460px, 100%); padding: 24px; }
        .sd-modal__p { margin-top: 10px; font-size: 13.5px; line-height: 1.5; color: var(--ad-muted); word-break: break-word; }
        .sd-modal__p b { color: var(--ad-ink); }
        .sd-modal__btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
        @media (max-width: 640px) { .sd-sel, .sd-q { flex: 1 1 100%; width: 100%; } .sd-dl { margin-top: 0; padding: 0; } }
      `}</style>
    </AdminShell>
  );
}

/* Ek row dekho / badlo — sirf badle hue, unlocked fields jaate hain (admin_update_row) */
function RowModal({ table, row, edit, onClose, onSaved }) {
  const str = (v) => (v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));
  const [vals, setVals] = useState(() => Object.fromEntries(Object.keys(row).map((k) => [k, str(row[k])])));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    const patch = {};
    Object.keys(vals).forEach((k) => {
      if (LOCKED.has(k)) return;
      if (vals[k] !== str(row[k])) patch[k] = vals[k] === "" ? null : vals[k];
    });
    if (!Object.keys(patch).length) return onClose();
    setBusy(true);
    const { error } = await rpc("admin", "admin_update_row", { p_table: table, p_id: row.id, p_patch: patch });
    setBusy(false);
    if (error) return setErr(errText(error));
    onSaved();
  };
  return (
    <div className="ad-overlay" onClick={onClose}>
      <form className="ad-modal sd-rm" onClick={(e) => e.stopPropagation()} onSubmit={save} role="dialog" aria-label="Record">
        <h2 className="ad-h2">
          {edit ? "Edit" : "View"} {table} record
        </h2>
        <div className="sd-rm__f">
          {Object.keys(row).map((k) => {
            const ro = !edit || LOCKED.has(k);
            const multi = vals[k].length > 60 || ["brief", "notes", "deliverables"].includes(k);
            return (
              <label key={k}>
                <span className="ad-label">
                  {k}
                  {LOCKED.has(k) && <em> (locked)</em>}
                </span>
                {multi ? (
                  <textarea className="ad-input" rows={2} readOnly={ro} value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />
                ) : (
                  <input className="ad-input" readOnly={ro} value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />
                )}
              </label>
            );
          })}
        </div>
        {err && <p className="sd-rm__err">{err}</p>}
        <div className="sd-modal__btns">
          <button type="button" className="ad-btn ad-btn--ghost" onClick={onClose}>
            {edit ? "Cancel" : "Close"}
          </button>
          {edit && (
            <button type="submit" className="ad-btn ad-btn--primary" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          )}
        </div>
        <style>{`
          .sd-rm { width: min(640px, 100%); padding: 24px; }
          .sd-rm__f { display: grid; gap: 10px; margin-top: 16px; max-height: 60vh; overflow-y: auto; padding-right: 4px; }
          .sd-rm__f em { font-style: normal; font-weight: 500; color: var(--ad-muted); }
          .sd-rm__f .ad-input[readonly] { background: var(--ad-soft-2); color: var(--ad-muted-2); }
          .sd-rm__err { margin-top: 10px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
        `}</style>
      </form>
    </div>
  );
}
