"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, downloadFile, toCsv, useToast } from "@/components/admin/settings/kit";

/* Tables jo browse kar sakte ho (dummy rows) */
const TABLES = {
  "Members (all accounts)": {
    head: ["ID", "Name", "Role", "City", "Created"],
    w: [170, 261, 183, 196, 266],
    rows: [
      ["3f16…", "Mayank", "owner", "Delhi", "17 Oct 2026"],
      ["90a2…", "Nisha Rao", "creator", "Mumbai", "2 Oct 2026"],
      ["c7fe…", "Kabir Mehta", "creator", "Delhi", "12 Oct 2026"],
      ["f26e…", "Pixel Bloom", "agency", "Pune", "12 Nov 2026"],
    ],
  },
  Campaigns: {
    head: ["ID", "Name", "Brand", "Status", "Created"],
    w: [170, 261, 183, 196, 266],
    rows: [
      ["a91c…", "Beardo Detan Express Kit", "Beardo", "live", "20 Oct 2026"],
      ["5d0b…", "Circle Diwali Declutter", "Circle", "live", "18 Oct 2026"],
      ["e44a…", "Pujo with Olio", "Olio Pizza", "completed", "26 Sep 2026"],
      ["0b7f…", "Wedding bells", "The Wedding Company", "draft", "9 Nov 2026"],
    ],
  },
  "Barter items": {
    head: ["ID", "Creator", "Courier", "Status", "Updated"],
    w: [170, 261, 183, 196, 266],
    rows: [
      ["7d14…", "Nisha Rao", "DTDC", "in transit", "12 Nov 2026"],
      ["2c88…", "Aarav Shah", "Delhivery", "delivered", "10 Nov 2026"],
      ["9e31…", "Ananya Iyer", "—", "to send", "12 Nov 2026"],
    ],
  },
  Applications: {
    head: ["ID", "Creator", "Campaign", "Status", "Applied"],
    w: [170, 261, 183, 196, 266],
    rows: [
      ["b20e…", "Nisha Rao", "Home Spa", "approved", "12 Nov 2026"],
      ["61fa…", "Rohan Das", "Snuggles Barter", "pending", "11 Nov 2026"],
      ["d3c9…", "Meera Iyer", "Circle Diwali", "pending", "11 Nov 2026"],
    ],
  },
};

/** /admin/settings/data-browser — koi bhi table dekho aur download karo */
export default function SettingsData() {
  const [t, setT] = useState(Object.keys(TABLES)[0]);
  const [q, setQ] = useState("");
  const [toast, say] = useToast();
  const tb = TABLES[t];
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? tb.rows.filter((r) => r.some((c) => String(c).toLowerCase().includes(s))) : tb.rows;
  }, [tb, q]);
  const slug = t.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, "");

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
            <button
              type="button"
              className="sd-dl"
              onClick={() => {
                downloadFile(`${slug}.csv`, toCsv(tb.head, rows));
                say("CSV downloaded");
              }}
            >
              ⬇️ CSV
            </button>
            <button
              type="button"
              className="sd-dl"
              onClick={() => {
                downloadFile(`${slug}.json`, JSON.stringify(rows.map((r) => Object.fromEntries(tb.head.map((h, i) => [h.toLowerCase(), r[i]]))), null, 2), "application/json");
                say("JSON downloaded");
              }}
            >
              ⬇️ JSON
            </button>
          </>
        }
      >
        <div className="sd-filters">
          <label className="sd-sel">
            <span>{t}</span>
            <select
              value={t}
              onChange={(e) => {
                setT(e.target.value);
                setQ("");
              }}
              aria-label="Table"
            >
              {Object.keys(TABLES).map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <input className="ad-input sd-q" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter rows" />
        </div>
        <Table rowH={48} minW={680} empty="No rows match this filter." cols={tb.head.map((label, i) => ({ label, w: tb.w[i] }))} rows={rows} />
      </Panel>
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
        @media (max-width: 640px) { .sd-sel, .sd-q { flex: 1 1 100%; width: 100%; } .sd-dl { margin-top: 0; padding: 0; } }
      `}</style>
    </AdminShell>
  );
}
