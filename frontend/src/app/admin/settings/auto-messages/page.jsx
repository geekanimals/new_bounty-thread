"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, Notice, useToast } from "@/components/admin/settings/kit";

/** /admin/settings/auto-messages — poore platform ka master switch (WhatsApp / Email) */
export default function SettingsAutoMessages() {
  const [ch, setCh] = useState([
    { k: "wa", name: "💬 WhatsApp", on: false, held: 80 },
    { k: "email", name: "✉️ Email", on: true, held: 0 },
  ]);
  const [toast, say] = useToast();

  const flip = (k) => {
    setCh((l) =>
      l.map((c) => {
        if (c.k !== k) return c;
        const on = !c.on;
        say(on ? `${c.name.slice(3)} on — ${c.held} held updates sent` : `${c.name.slice(3)} paused for all campaigns`);
        return { ...c, on, held: on ? 0 : c.held };
      })
    );
  };

  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />
      <Panel title="📣 Automatic messages — whole platform" sub="Master switch. OFF stops every automatic message on that channel for all campaigns (invites, step updates, reminders, alerts). Login codes always go." className="sa-panel">
        <Table
          rowH={68}
          minW={640}
          cols={[
            { label: "Channel", w: 292 },
            { label: "Status", w: 179 },
            { label: "Held messages", w: 320 },
            { label: "", w: 285 },
          ]}
          rows={ch.map((c) => [
            <b key="n">{c.name}</b>,
            <span key="s" className={`ad-badge ${c.on ? "ad-badge--green" : ""}`}>
              {c.on ? "ON" : "OFF"}
            </span>,
            c.held ? `${c.held} waiting` : "0",
            c.on ? (
              <button key="b" type="button" className="sk-link sa-off" onClick={() => flip(c.k)}>
                Turn off
              </button>
            ) : (
              <button key="b" type="button" className="ad-btn ad-btn--primary sa-on" onClick={() => flip(c.k)}>
                Turn on
              </button>
            ),
          ])}
        />
        <Notice>Turning a channel on sends the held updates. Every change is saved in the audit log.</Notice>
      </Panel>
      {toast}
      <style>{`
        .sa-panel { padding-bottom: 38px; }
        .sa-panel .sk-tw { margin-top: 16px; }
        .sa-panel .sk-note { margin-top: 0; }
        .sa-on { height: 38px; padding: 0 16px; font-size: 13px; }
        .sa-off { padding-left: 8px; }
      `}</style>
    </AdminShell>
  );
}
