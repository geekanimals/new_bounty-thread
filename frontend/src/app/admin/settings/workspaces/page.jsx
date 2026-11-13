"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, fmtDate, fmtNum, emptyState } from "@/components/admin/settings/kit";
import { useRpc } from "@/lib/supabase";

/** /admin/settings/workspaces — har agency, brand, creator workspace (admin_list_orgs) */
export default function SettingsWorkspaces() {
  const ws = useRpc("admin", "admin_list_orgs");
  const [q, setQ] = useState("");
  const all = useMemo(() => ws.data || [], [ws.data]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all.filter((w) => !t || String(w.org_name || "").toLowerCase().includes(t) || String(w.org_id || "").includes(t));
  }, [all, q]);
  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />
      <Panel
        title={`Workspaces · ${ws.loading ? "…" : fmtNum(all.length)}`}
        sub="Every agency, brand and creator workspace."
        className="sw-panel"
        action={<input className="ga-input sw-q" placeholder="Search workspace…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search workspace" />}
      >
        <Table
          rowH={48}
          minW={760}
          empty={emptyState({ loading: ws.loading, error: ws.error, reload: ws.reload, empty: q ? `No workspace matches “${q}”.` : "No workspaces yet." })}
          cols={[
            { label: "Workspace", w: 301 },
            { label: "Members", w: 143 },
            { label: "Creators", w: 152 },
            { label: "Campaigns", w: 168 },
            { label: "Pending", w: 136 },
            { label: "Created", w: 176 },
          ]}
          rows={rows.map((w) => [
            <b key="n" title={w.org_id}>
              {w.org_name || "—"}
            </b>,
            w.members ?? 0,
            w.creators ?? 0,
            w.campaigns ?? 0,
            w.pending ? (
              <span key="p" className="ga-badge ga-badge--orange">
                {w.pending}
              </span>
            ) : (
              0
            ),
            fmtDate(w.created_at),
          ])}
        />
      </Panel>
      <style>{`
        .sw-panel { padding-bottom: 20px; }
        .sw-q { width: 172px; height: 40px; margin-top: 2px; }
        .sw-q::placeholder { color: #757575; }
        .sw-panel .sk-tw { margin-top: 14px; }
        @media (max-width: 640px) { .sw-panel .sk-panel__act { width: 100%; } .sw-q { width: 100%; height: 42px; } }
      `}</style>
    </AdminShell>
  );
}
