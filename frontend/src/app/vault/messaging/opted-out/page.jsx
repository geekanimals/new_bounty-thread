"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Stats } from "@/components/admin/ui";
import MsgHead from "@/components/admin/msg/MsgHead";
import PTable from "@/components/admin/brand/PTable";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { fmtDate, useToast } from "@/components/admin/brand/util";

/** /vault/messaging/opted-out — Opted out (Figma 076) · public.admin_optouts · Resume: public.admin_optout_clear */
export default function OptedOut() {
  const { data, error, loading, reload } = useRpc("admin", "admin_optouts");
  const all = Array.isArray(data) ? data : [];
  const [ask, setAsk] = useState(null);
  const [toast, say] = useToast();
  const wa = all.filter((x) => x.channel === "whatsapp").length;
  const em = all.length - wa;
  const held = all.reduce((a, x) => a + (Number(x.skipped) || 0), 0);
  const who = (x) => (x.handle ? `@${x.handle}` : x.name || x.to || "—");

  const resume = async (x) => {
    setAsk(null);
    const r = await rpc("admin", "admin_optout_clear", { p_channel: x.channel, p_to: x.to });
    if (r.error) return say(errText(r.error));
    say(`${who(x)} will get ${x.channel === "whatsapp" ? "WhatsApp" : "email"} updates again`);
    reload(true);
  };

  return (
    <AdminShell>
      <MsgHead />
      <Stats
        items={[
          { value: loading ? "—" : all.length, label: "Everyone who stopped" },
          { value: loading ? "—" : wa, label: "WhatsApp stopped", note: "Replied STOP / stop link" },
          { value: loading ? "—" : em, label: "Email stopped", note: "Unsubscribed" },
          { value: loading ? "—" : held, label: "Messages held back", note: "Login codes still go" },
        ]}
      />
      <section className="ga-card mo-card">
        <h2 className="ga-h2">Opted out · {loading ? "…" : all.length}</h2>
        <p className="mo-sub">They get no more campaign updates on that channel. Login codes still go.</p>
        {ask && (
          <div className="mo-ask">
            <p>
              Turn {ask.channel === "whatsapp" ? "WhatsApp" : "email"} updates back on for {who(ask)}? Only do this if they asked for it.
            </p>
            <div className="mo-ask__b">
              <button type="button" className="ga-btn ga-btn--primary ga-btn--sm" onClick={() => resume(ask)}>
                Yes, resume
              </button>
              <button type="button" className="pt-link" onClick={() => setAsk(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {error ? (
          <p className="mo-state">
            Couldn’t load: {errText(error)}{" "}
            <button type="button" onClick={() => reload()}>
              Retry
            </button>
          </p>
        ) : (
        <PTable
          minW={680}
          rowH={64}
          cols={[
            { label: "Person", w: "25.8%" },
            { label: "Channel", w: "17.2%" },
            { label: "Stopped", w: "14.9%" },
            { label: "How", w: "25%" },
            { label: "", w: "17.1%" },
          ]}
          rows={all.map((x, i) => [
            <b key="w" title={[x.name, x.to, x.campaign].filter(Boolean).join(" · ")}>
              {who(x)}
            </b>,
            x.channel === "whatsapp" ? "WhatsApp" : "Email",
            fmtDate(x.at),
            <span key="h" title={x.via}>
              {x.via || "—"}
            </span>,
            <button key={`r${i}`} type="button" className="pt-link mo-r" onClick={() => setAsk(x)}>
              Resume
            </button>,
          ])}
          empty={loading ? "Loading…" : "Nobody has opted out."}
        />
        )}
      </section>
      {toast && <div className="ga-toast">{toast}</div>}
      <style>{`
        .mo-card { padding: 24px 22px 14px; }
        .mo-sub { margin: 9px 0 26px; font-size: 12px; color: var(--ad-muted); }
        .mo-r { color: #6657e9; }
        .mo-ask { margin: -10px 0 16px; padding: 12px 14px; border-radius: 13px; background: var(--ad-soft-2); border: 1px solid var(--ad-line); font-size: 13px; }
        .mo-ask__b { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
        .mo-state { padding: 14px 11px; font-size: 13px; color: var(--ad-red); }
        .mo-state button { border: 0; background: none; padding: 0; font-weight: 800; color: #6657e9; }
        @media (max-width: 640px) { .mo-card { padding: 18px 16px; } .mo-sub { margin-bottom: 14px; } }
      `}</style>
    </AdminShell>
  );
}
