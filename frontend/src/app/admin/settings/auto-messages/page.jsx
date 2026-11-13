"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, Notice, useToast, fmtDateTime, emptyState } from "@/components/admin/settings/kit";
import { rpc, useRpc, errText } from "@/lib/supabase";

/**
 * /admin/settings/auto-messages — poore platform ka master switch (purane app ka "Automatic messages"):
 *  🤖 auto (ops_auto_messages / ops_set_auto_messages) + 💬 WhatsApp / ✉️ Email (admin_messaging_switches / admin_set_messaging_switch)
 */
export default function SettingsAutoMessages() {
  const sw = useRpc("admin", "admin_messaging_switches");
  const au = useRpc("admin", "api.ops_auto_messages");
  const [busy, setBusy] = useState("");
  const [ask, setAsk] = useState(null); // auto ON/OFF confirm
  const [toast, say] = useToast();
  const d = sw.data || {};
  const autoOn = !(au.data && au.data.auto_on === false);

  const ch = sw.data
    ? [
        { k: "auto", name: "🤖 Automatic messages (every step)", on: autoOn, held: 0, sub: autoOn ? "Invites, step updates, reminders and bot replies go by themselves" : "Only what the team sends by hand goes" },
        { k: "wa", name: "💬 WhatsApp", on: d.wa_on !== false, held: d.wa_on === false ? d.held_wa || 0 : 0 },
        { k: "email", name: "✉️ Email", on: d.email_on !== false, held: d.email_on === false ? d.held_email || 0 : 0 },
      ]
    : [];

  const flipAuto = async (on) => {
    setAsk(null);
    setBusy("auto");
    const { data: r, error } = await rpc("admin", "api.ops_set_auto_messages", { p_on: on });
    setBusy("");
    if (error) return say(errText(error), true);
    say(on ? "🤖 Automatic messages ON" : `⏸ Automatic messages OFF${r && r.stopped_now ? ` · ${r.stopped_now} waiting message${r.stopped_now > 1 ? "s" : ""} stopped` : ""}`);
    au.reload();
  };
  const flip = async (c) => {
    if (c.k === "auto") return setAsk({ on: !c.on });
    const channel = c.k === "wa" ? "whatsapp" : "email";
    const on = !c.on;
    setBusy(c.k);
    const { data: r, error } = await rpc("admin", "admin_set_messaging_switch", { p_channel: channel, p_on: on });
    setBusy("");
    if (error) return say(errText(error), true);
    say(`${channel === "whatsapp" ? "WhatsApp" : "Email"} messages ${on ? "turned ON for every campaign" : "turned OFF for every campaign"}${r && r.held_now ? ` · ${r.held_now} waiting message${r.held_now > 1 ? "s" : ""} stopped` : ""}`);
    sw.reload();
  };

  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />
      <Panel title="📣 Automatic messages — whole platform" sub="Master switch. OFF stops every automatic message on that channel for all campaigns (invites, step updates, reminders, alerts; WhatsApp also pauses the bot). Login codes always go." className="sa-panel">
        <Table
          rowH={68}
          minW={640}
          cols={[
            { label: "Channel", w: 292 },
            { label: "Status", w: 179 },
            { label: "Held messages", w: 320 },
            { label: "", w: 285 },
          ]}
          empty={emptyState({ loading: sw.loading, error: sw.error, reload: sw.reload, empty: "—" })}
          rows={ch.map((c) => [
            <b key="n" title={c.sub || ""}>{c.name}</b>,
            <span key="s" className={`ad-badge ${c.on ? "ad-badge--green" : ""}`}>
              {c.on ? "ON" : "OFF"}
            </span>,
            c.held ? `${c.held} stopped (last 7 days)` : "0",
            c.on ? (
              <button key="b" type="button" className="sk-link sa-off" disabled={busy === c.k} onClick={() => flip(c)}>
                {busy === c.k ? "…" : "Turn off"}
              </button>
            ) : (
              <button key="b" type="button" className="ad-btn ad-btn--primary sa-on" disabled={busy === c.k} onClick={() => flip(c)}>
                {busy === c.k ? "…" : "Turn on"}
              </button>
            ),
          ])}
        />
        <Notice>
          Messages stopped while a channel is OFF are not sent later. Every change is saved in the audit log.
          {d.updated_by ? ` Last changed by ${d.updated_by} · ${fmtDateTime(d.updated_at)}.` : ""}
          {d.campaigns_off ? ` ${d.campaigns_off} campaign${d.campaigns_off > 1 ? "s have" : " has"} its own switch off.` : ""}
        </Notice>
      </Panel>
      {ask && (
        <div className="ad-overlay" onClick={() => setAsk(null)}>
          <div className="ad-modal sa-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Automatic messages">
            <h2 className="ad-h2">{ask.on ? "Turn automatic messages back ON?" : "Turn automatic messages OFF?"}</h2>
            <p className="sa-modal__p">
              {ask.on
                ? "New invites, step updates, reminders and bot replies will go by themselves again. What was stopped while OFF is NOT sent."
                : "Nothing goes by itself any more — only what the team sends by hand. Login codes and team alerts still go."}
            </p>
            <div className="sa-modal__btns">
              <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setAsk(null)}>
                Cancel
              </button>
              <button type="button" className={`ad-btn ${ask.on ? "ad-btn--primary" : "ad-btn--danger"}`} onClick={() => flipAuto(ask.on)}>
                {ask.on ? "Turn on" : "Turn off"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast}
      <style>{`
        .sa-panel { padding-bottom: 38px; }
        .sa-panel .sk-tw { margin-top: 16px; }
        .sa-panel .sk-note { margin-top: 0; }
        .sa-on { height: 38px; padding: 0 16px; font-size: 13px; }
        .sa-off { padding-left: 8px; }
        .sa-modal { width: min(460px, 100%); padding: 24px; }
        .sa-modal__p { margin-top: 10px; font-size: 13.5px; line-height: 1.5; color: var(--ad-muted); }
        .sa-modal__btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
      `}</style>
    </AdminShell>
  );
}
