"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, useToast, fmtDateTime, emptyState } from "@/components/admin/settings/kit";
import { rpc, useRpc, errText } from "@/lib/supabase";

/**
 * /vault/settings/delete-requests — brand/agency delete maange, super admin decide kare
 * list = admin_campaign_delete_requests('pending') · Keep / Delete = admin_decide_campaign_delete(p_request, p_approve, p_note)
 */
export default function SettingsDeleteRequests() {
  const list = useRpc("admin", "admin_campaign_delete_requests", { p_status: "pending" });
  const reqs = Array.isArray(list.data) ? list.data : [];
  const [confirm, setConfirm] = useState(null);
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, say] = useToast();
  const nameOf = (r) => r.campaign_name || "Campaign";

  const keep = async (r) => {
    setBusy(true);
    const { error } = await rpc("admin", "admin_decide_campaign_delete", { p_request: r.id, p_approve: false, p_note: null });
    setBusy(false);
    if (error) return say(errText(error), true);
    say(`Kept “${nameOf(r)}” — ${r.requester || "they"} will be told`);
    list.reload();
  };
  const del = async () => {
    const r = confirm;
    if (typed.trim().toLowerCase() !== nameOf(r).trim().toLowerCase()) return say(`Type “${nameOf(r)}” exactly to confirm.`, true);
    setBusy(true);
    const { error } = await rpc("admin", "admin_decide_campaign_delete", { p_request: r.id, p_approve: true, p_note: note.trim() || null });
    setBusy(false);
    if (error) return say(errText(error), true);
    say(`Approved — “${nameOf(r)}” deleted`);
    setConfirm(null);
    list.reload();
  };

  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />
      <Panel title="Campaign delete requests" sub="Agencies and brands ask — a super admin decides. Nothing is deleted without approval." className="sx-panel">
        <Table
          rowH={62}
          minW={720}
          empty={emptyState({ loading: list.loading, error: list.error, reload: list.reload, empty: "No delete requests waiting." })}
          cols={[
            { label: "Campaign", w: 240 },
            { label: "Asked by", w: 179 },
            { label: "Reason", w: 201 },
            { label: "When", w: 189 },
            { label: "", w: 267 },
          ]}
          rows={reqs.map((r) => [
            <b key="c" title={[r.brand, `${Number(r.creators || 0)} creators`].filter(Boolean).join(" · ")}>
              {nameOf(r)}
              {r.still_exists === false ? " · already gone" : ""}
            </b>,
            [r.requester, r.org_name].filter(Boolean).join(" · ") || "—",
            <span key="r" title={r.reason || ""}>
              {r.reason || "—"}
            </span>,
            fmtDateTime(r.created_at),
            <span key="a" className="sx-acts">
              <button type="button" className="sk-link" disabled={busy} onClick={() => keep(r)}>
                Keep
              </button>
              <button
                type="button"
                className="ga-btn ga-btn--primary sx-del"
                onClick={() => {
                  setTyped("");
                  setNote("");
                  setConfirm(r);
                }}
              >
                Delete
              </button>
            </span>,
          ])}
        />
      </Panel>

      {confirm && (
        <div className="ga-overlay" onClick={() => setConfirm(null)}>
          <div className="ga-modal sx-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Delete campaign">
            <h2 className="ga-h2">Delete “{nameOf(confirm)}”?</h2>
            <p className="sx-modal__p">
              Asked by <b>{confirm.requester || "—"}</b>
              {confirm.reason ? ` · “${confirm.reason}”` : ""}. The campaign, its {Number(confirm.creators || 0)} creators’ applications and messages are removed for everyone. This can’t be undone.
            </p>
            <label className="ga-label sx-l" htmlFor="sx-type">
              Type “{nameOf(confirm)}” to confirm
            </label>
            <input id="sx-type" className="ga-input" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
            <label className="ga-label sx-l" htmlFor="sx-note">
              Note (optional)
            </label>
            <input id="sx-note" className="ga-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why it was approved" />
            <div className="sx-modal__btns">
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button type="button" className="ga-btn ga-btn--danger" onClick={del} disabled={busy || typed.trim().toLowerCase() !== nameOf(confirm).trim().toLowerCase()}>
                Delete campaign
              </button>
            </div>
          </div>
        </div>
      )}
      {toast}
      <style>{`
        .sx-panel { padding-bottom: 24px; }
        .sx-panel .sk-tw { margin-top: 15px; }
        .sx-acts { display: inline-flex; align-items: center; gap: 12px; padding-left: 12px; }
        .sx-del { height: 34px; padding: 0 14px; font-size: 13px; }
        .sx-modal { width: min(460px, 100%); padding: 24px; }
        .sx-modal__p { margin-top: 10px; font-size: 13.5px; line-height: 1.5; color: var(--ad-muted); }
        .sx-modal__p b { color: var(--ad-ink); }
        .sx-l { margin-top: 14px; }
        .sx-modal__btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
        @media (max-width: 640px) { .sx-modal__btns > * { flex: 1; } }
      `}</style>
    </AdminShell>
  );
}
