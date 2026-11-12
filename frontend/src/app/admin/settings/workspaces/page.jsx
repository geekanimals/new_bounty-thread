"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table } from "@/components/admin/settings/kit";

const WS = [
  ["Geek Creative Agency", 3, 298, 10, 57, "13 Sep 2026"],
  ["Beardo", 2, 0, 2, 0, "14 Sep 2026"],
  ["Pixel Bloom Media", 1, 0, 0, 0, "12 Nov 2026"],
  ["My Creator Space", 1, 0, 0, 0, "12 Nov 2026"],
];

/** /admin/settings/workspaces — har agency, brand, creator workspace */
export default function SettingsWorkspaces() {
  const [q, setQ] = useState("");
  const rows = useMemo(() => WS.filter((w) => w[0].toLowerCase().includes(q.trim().toLowerCase())), [q]);
  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />
      <Panel
        title="Workspaces · 318"
        sub="Every agency, brand and creator workspace."
        className="sw-panel"
        action={<input className="ad-input sw-q" placeholder="Search workspace…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search workspace" />}
      >
        <Table
          rowH={48}
          minW={760}
          empty={`No workspace matches “${q}”.`}
          cols={[
            { label: "Workspace", w: 301 },
            { label: "Members", w: 143 },
            { label: "Creators", w: 152 },
            { label: "Campaigns", w: 168 },
            { label: "Pending", w: 136 },
            { label: "Created", w: 176 },
          ]}
          rows={rows.map((w) => [<b key="n">{w[0]}</b>, ...w.slice(1)])}
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
