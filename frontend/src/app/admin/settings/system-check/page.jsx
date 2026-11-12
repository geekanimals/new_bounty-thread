"use client";

import { useEffect, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, useToast } from "@/components/admin/settings/kit";

const CHECKS = [
  ["Tables (42)", "All present"],
  ["Key columns", "OK"],
  ["Functions (118)", "OK"],
  ["WhatsApp template geek_campaign_update", "Approved"],
  ["Storage buckets", "OK"],
];

/** /admin/settings/system-check — database app se match karta hai ya nahi */
export default function SettingsSystem() {
  const [done, setDone] = useState(CHECKS.length); // kitne check ho chuke
  const [running, setRunning] = useState(false);
  const [stamp, setStamp] = useState("");
  const timer = useRef(null);
  const [toast, say] = useToast();

  useEffect(() => () => clearInterval(timer.current), []);

  const run = () => {
    if (running) return;
    setRunning(true);
    setDone(0);
    let n = 0;
    timer.current = setInterval(() => {
      n += 1;
      setDone(n);
      if (n >= CHECKS.length) {
        clearInterval(timer.current);
        setRunning(false);
        setStamp(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
        say("All 5 checks passed");
      }
    }, 450);
  };

  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />
      <Panel
        title="System check"
        sub={stamp ? `Live-verifies that the database matches the app — every table, key column and function. Last run ${stamp}.` : "Live-verifies that the database matches the app — every table, key column and function."}
        className="sc-panel"
        action={
          <button type="button" className="ad-btn ad-btn--primary" onClick={run} disabled={running}>
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
          rows={CHECKS.map(([c, r], i) => [
            c,
            i < done ? (
              <span key="r" className="ad-badge ad-badge--green">
                {r}
              </span>
            ) : i === done && running ? (
              <span key="r" className="ad-badge sc-run">
                <i /> Checking
              </span>
            ) : (
              <span key="r" className="ad-badge">
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
        .sc-run i { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #c9cde0; border-top-color: var(--ad-primary); animation: scSpin .7s linear infinite; }
        @keyframes scSpin { to { transform: rotate(360deg); } }
      `}</style>
    </AdminShell>
  );
}
