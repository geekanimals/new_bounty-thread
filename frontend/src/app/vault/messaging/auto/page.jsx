"use client";

import { useState } from "react";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import MsgHead from "@/components/admin/msg/MsgHead";
import PTable from "@/components/admin/brand/PTable";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { useToast } from "@/components/admin/brand/util";

const pretty = (s) => String(s || "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/**
 * /vault/messaging/auto — Automatic messages (Figma 077)
 * Texts: public.admin_step_templates (purane app ke "Step templates") · switches: public.admin_messaging_switches
 * Send test: public.admin_delivery_test (aapke email par)
 */
export default function AutoMessagesPage() {
  return (
    <AdminShell>
      <MsgHead />
      <AutoMessages />
    </AdminShell>
  );
}

function AutoMessages() {
  const me = useAdmin();
  const { data, error, loading, reload } = useRpc("admin", "admin_step_templates");
  const sw = useRpc("admin", "admin_messaging_switches");
  const STEPS = (Array.isArray(data) ? data : []).map((t) => ({ name: t.name, step: (t.used_for || []).length ? pretty(t.used_for[0]) + (t.used_for.length > 1 ? ` +${t.used_for.length - 1}` : "") : pretty(t.name), text: t.body || "", status: t.status }));
  const waOn = sw.data ? sw.data.wa_on !== false : false;
  const emOn = sw.data ? sw.data.email_on !== false : false;
  const [pick, setPick] = useState(0);
  const [picked, setPicked] = useState(false); // Figma: shuru mein koi step highlight nahi
  const [toast, say] = useToast();

  const flip = (i) => {
    setPick(i);
    say("Per-step switches are coming soon — turn WhatsApp / email on or off for every step in Settings › Auto messages.");
  };

  const copy = async () => {
    const s = STEPS[pick];
    if (!s) return;
    try {
      await navigator.clipboard.writeText(s.text);
      say(`Copied “${s.step}” message`);
    } catch {
      say("Couldn’t copy — select the text instead");
    }
  };

  const test = async () => {
    if (!me?.email) return say("Your email isn’t known — sign in again.");
    const r = await rpc("admin", "admin_delivery_test", { p_phone: null, p_email: me.email });
    if (r.error) return say(errText(r.error));
    say(`${Number(r.data) || 0} test message(s) queued to ${me.email} — see Delivery`);
  };

  const tg = (i, on, label) => (
    <button type="button" className={`ga-toggle ma-tg ${on ? "is-on" : ""}`} aria-pressed={on} aria-label={`${label} for ${STEPS[i].step}`} onClick={() => flip(i)} />
  );

  return (
    <>
      <section className="ga-card ma-card">
        <h2 className="ga-h2">Automatic messages</h2>
        <p className="ma-sub">The texts creators get at each step. WhatsApp uses the approved template geek_campaign_update.</p>
        {error ? (
          <p className="ma-state">
            Couldn’t load: {errText(error)}{" "}
            <button type="button" onClick={() => reload()}>
              Retry
            </button>
          </p>
        ) : (
        <PTable
          minW={720}
          rowH={53}
          cols={[
            { label: "Step", w: "26.4%" },
            { label: "WhatsApp", w: "14.1%" },
            { label: "Email", w: "9.9%" },
            { label: "Preview", w: "49.6%" },
          ]}
          rows={STEPS.map((s, i) => [
            <button key="s" type="button" className={`ma-step ${picked && pick === i ? "is-pick" : ""}`} title={s.name} onClick={() => { setPick(i); setPicked(true); }}>
              {s.step}
            </button>,
            <span key="w">{tg(i, waOn && s.status === "approved", "WhatsApp")}</span>,
            <span key="e">{tg(i, emOn, "Email")}</span>,
            <span key="p" className="ma-prev" title={s.text}>
              {s.text}
            </span>,
          ])}
          empty={loading ? "Loading…" : "No step messages yet."}
        />
        )}
        <div className="ma-act">
          <button type="button" className="ga-btn ga-btn--ghost" onClick={test}>
            Send test
          </button>
          <button type="button" className="ma-plain" onClick={copy}>
            Copy body
          </button>
          <button type="button" className="ga-btn ga-btn--primary" onClick={() => say("Nothing to save yet — per-step switches are coming soon.")}>
            Save
          </button>
        </div>
      </section>
      {toast && <div className="ga-toast">{toast}</div>}
      <style>{`
        .ma-card { padding: 24px 22px 22px; }
        .ma-sub { margin: 9px 0 20px; font-size: 12px; color: var(--ad-muted); }
        .ma-state { padding: 14px 11px; font-size: 13px; color: var(--ad-red); }
        .ma-state button { border: 0; background: none; padding: 0; font-weight: 800; color: #6657e9; }
        .ma-step { border: 0; background: none; padding: 0; font-size: 13px; font-weight: 700; color: var(--ad-ink); text-align: left; }
        .ma-step.is-pick { color: var(--ad-primary-2); }
        .ma-tg { width: 38px; height: 22px; background: #d3d7e4; }
        .ma-tg:not(.is-on)::after { opacity: 0; } /* Figma: off = saada grey pill */
        .ma-tg:not(.is-on):hover::after { opacity: .9; }
        .ma-tg::after { width: 16px; height: 16px; }
        .ma-tg.is-on::after { transform: translateX(16px); }
        .ma-tg.is-on { background: var(--ad-primary); }
        .ma-prev { font-size: 12px; color: var(--ad-muted); }
        .ma-act { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 13px; }
        .ma-act .ga-btn { height: 41px; padding: 0 15px; }
        .ma-act .ga-btn--ghost { border-color: var(--ad-line-2); }
        .ma-plain { height: 41px; padding: 0 10px; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; }
        @media (max-width: 640px) { .ma-card { padding: 18px 16px; } }
      `}</style>
    </>
  );
}
