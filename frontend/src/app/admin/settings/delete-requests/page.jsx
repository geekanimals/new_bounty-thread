"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, useToast } from "@/components/admin/settings/kit";

/** /admin/settings/delete-requests — brand/agency delete maange, super admin decide kare */
export default function SettingsDeleteRequests() {
  const [reqs, setReqs] = useState([{ id: "demo-foods", campaign: "Demo Foods Trial", by: "Demo Foods", reason: "Test campaign", when: "28 Oct 2026" }]);
  const [confirm, setConfirm] = useState(null);
  const [toast, say] = useToast();

  const keep = (r) => {
    setReqs((l) => l.filter((x) => x.id !== r.id));
    say(`Kept “${r.campaign}” — ${r.by} has been told`);
  };
  const del = () => {
    setReqs((l) => l.filter((x) => x.id !== confirm.id));
    say(`“${confirm.campaign}” deleted`);
    setConfirm(null);
  };

  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />
      <Panel title="Campaign delete requests" sub="Agencies and brands ask — a super admin decides. Nothing is deleted without approval." className="sx-panel">
        <Table
          rowH={62}
          minW={720}
          empty="No delete requests waiting."
          cols={[
            { label: "Campaign", w: 240 },
            { label: "Asked by", w: 179 },
            { label: "Reason", w: 201 },
            { label: "When", w: 189 },
            { label: "", w: 267 },
          ]}
          rows={reqs.map((r) => [
            <b key="c">{r.campaign}</b>,
            r.by,
            r.reason,
            r.when,
            <span key="a" className="sx-acts">
              <button type="button" className="sk-link" onClick={() => keep(r)}>
                Keep
              </button>
              <button type="button" className="ad-btn ad-btn--primary sx-del" onClick={() => setConfirm(r)}>
                Delete
              </button>
            </span>,
          ])}
        />
      </Panel>

      {confirm && (
        <div className="ad-overlay" onClick={() => setConfirm(null)}>
          <div className="ad-modal sx-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Delete campaign">
            <h2 className="ad-h2">Delete “{confirm.campaign}”?</h2>
            <p className="sx-modal__p">
              Asked by <b>{confirm.by}</b> · {confirm.reason}. The campaign, its applications and messages are removed for everyone. This can’t be undone.
            </p>
            <div className="sx-modal__btns">
              <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button type="button" className="ad-btn ad-btn--danger" onClick={del}>
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
        .sx-modal__btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
        @media (max-width: 640px) { .sx-modal__btns > * { flex: 1; } }
      `}</style>
    </AdminShell>
  );
}
