"use client";

import { useEffect, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, useToast } from "@/components/admin/settings/kit";
import { sbFor } from "@/lib/supabase";

/* Purane app ke SYS_TABLES / SYS_COLUMNS / SYS_RPCS — sirf padhna (kuch badalta nahi) */
const SYS_TABLES = ["members", "creators", "campaigns", "barter_items", "applications", "invites", "irm_contacts", "story_deals", "dream_plans", "org_profiles", "social_accounts", "audit_log", "platform_admins", "leads"];
const SYS_COLUMNS = [
  ["creators", "whatsapp"], ["creators", "invite_status"], ["creators", "lat"], ["campaigns", "deliverables"], ["campaigns", "deliverables_done"], ["campaigns", "budget"],
  ["barter_items", "tracking_number"], ["barter_items", "deadline"], ["invites", "token"], ["members", "status"], ["irm_contacts", "whatsapp"], ["org_profiles", "slug"],
];
const SYS_RPCS = [
  ["is_platform_admin", {}], ["open_campaigns", {}], ["my_applications", {}], ["campaign_applications", {}],
  ["public_profile", { p_username: "__healthcheck__" }], ["public_org", { p_slug: "__healthcheck__" }],
  ["pending_members", {}], ["admin_overview", {}], ["admin_list_orgs", {}],
  ["admin_list_table", { p_table: "creators", p_limit: 1, p_offset: 0 }], ["admin_audit", { p_limit: 1, p_offset: 0 }], ["admin_list_platform_admins", {}],
];
const MISSING_RE = /does not exist|schema cache|could not find|not find the function|relation .* does not/i;
const GROUPS = [
  { k: "Table", label: `Tables (${SYS_TABLES.length})` },
  { k: "Column", label: `Key columns (${SYS_COLUMNS.length})` },
  { k: "Function", label: `Functions (${SYS_RPCS.length})` },
];

/** /admin/settings/system-check — live dekhta hai ki database app se match karta hai (har table, column, function) */
export default function SettingsSystem() {
  const [res, setRes] = useState([]); // [{group, name, ok, detail}]
  const [running, setRunning] = useState(false);
  const [stamp, setStamp] = useState("");
  const alive = useRef(true);
  const [toast, say] = useToast();

  const run = async () => {
    if (running) return;
    const sb = sbFor("admin");
    setRunning(true);
    setRes([]);
    const checks = [
      ...SYS_TABLES.map((t) => ({ group: "Table", name: t, run: async () => { const { error } = await sb.from(t).select("*", { count: "exact", head: true }); return { ok: !(error && MISSING_RE.test(error.message)), detail: error ? error.message : "" }; } })),
      ...SYS_COLUMNS.map(([t, c]) => ({ group: "Column", name: `${t}.${c}`, run: async () => { const { error } = await sb.from(t).select(c).limit(1); return { ok: !(error && /column|does not exist/i.test(error.message)), detail: error ? error.message : "" }; } })),
      ...SYS_RPCS.map(([n, a]) => ({ group: "Function", name: `${n}()`, run: async () => { const { error } = await sb.rpc(n, a); return { ok: !(error && MISSING_RE.test(error.message)), detail: error ? error.message : "" }; } })),
    ];
    const out = [];
    for (const c of checks) {
      let r;
      try {
        r = await c.run();
      } catch (ex) {
        r = { ok: false, detail: String(ex?.message || ex) };
      }
      out.push({ group: c.group, name: c.name, ...r });
      if (alive.current) setRes([...out]);
    }
    if (!alive.current) return;
    setRunning(false);
    setStamp(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    const fail = out.filter((x) => !x.ok).length;
    say(fail ? `${fail} item${fail > 1 ? "s" : ""} not deployed — see below` : `All ${out.length} checks passed`, !!fail);
  };

  useEffect(() => {
    alive.current = true;
    run();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fails = res.filter((x) => !x.ok);
  const needOf = (k) => (k === "Table" ? SYS_TABLES.length : k === "Column" ? SYS_COLUMNS.length : SYS_RPCS.length);
  const curGroup = GROUPS.find((g) => res.filter((x) => x.group === g.k).length < needOf(g.k))?.k; // abhi jo chal raha hai
  const rows = [
    ...GROUPS.map((g) => {
      const all = res.filter((x) => x.group === g.k);
      const bad = all.filter((x) => !x.ok).length;
      const state = all.length < needOf(g.k) ? (running && curGroup === g.k ? "run" : "wait") : bad ? "fail" : "ok";
      return { label: g.label, state, text: state === "ok" ? (g.k === "Table" ? "All present" : "OK") : state === "fail" ? `${bad} missing` : "" };
    }),
    ...fails.map((f) => ({ label: `${f.group}: ${f.name}`, state: "fail", text: "FAIL", detail: f.detail })),
  ];

  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />
      <Panel
        title="System check"
        sub={stamp ? `Live-verifies that the database matches the app — every table, key column and function. Last run ${stamp}.` : "Live-verifies that the database matches the app — every table, key column and function."}
        className="sc-panel"
        action={
          <button type="button" className="ga-btn ga-btn--primary" onClick={run} disabled={running}>
            {running ? "Checking…" : "Run checks"}
          </button>
        }
      >
        <Table
          rowH={58}
          minW={560}
          cols={[
            { label: "Check", w: 813 },
            { label: "Result", w: 263 },
          ]}
          rows={rows.map((r) => [
            <span key="c" title={r.detail || ""}>
              {r.label}
              {r.detail ? <small className="sc-det"> · {r.detail.slice(0, 80)}</small> : null}
            </span>,
            r.state === "ok" ? (
              <span key="r" className="ga-badge ga-badge--green">
                {r.text}
              </span>
            ) : r.state === "fail" ? (
              <span key="r" className="ga-badge ga-badge--red">
                {r.text}
              </span>
            ) : r.state === "run" ? (
              <span key="r" className="ga-badge sc-run">
                <i /> Checking
              </span>
            ) : (
              <span key="r" className="ga-badge">
                Waiting
              </span>
            ),
          ])}
        />
      </Panel>
      {toast}
      <style>{`
        .sc-panel { padding-bottom: 20px; }
        .sc-panel .sk-tw { margin-top: 15px; }
        .sc-run { gap: 6px; }
        .sc-det { font-size: 11.5px; color: var(--ad-muted); }
        .sc-run i { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #c9cde0; border-top-color: var(--ad-primary); animation: scSpin .7s linear infinite; }
        @keyframes scSpin { to { transform: rotate(360deg); } }
      `}</style>
    </AdminShell>
  );
}
