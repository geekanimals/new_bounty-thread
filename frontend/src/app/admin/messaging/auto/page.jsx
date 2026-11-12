"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import MsgHead from "@/components/admin/msg/MsgHead";
import PTable from "@/components/admin/brand/PTable";

const STEPS = [
  { step: "Invited to a campaign", text: "You’re invited to {campaign} by {brand}…" },
  { step: "Application approved", text: "Good news — {brand} picked you for {campaign}…" },
  { step: "Contract ready", text: "Your contract for {campaign} is ready to sign…" },
  { step: "Product shipped", text: "Your {product} is on the way · {tracking}…" },
  { step: "Submit your draft", text: "Reminder: draft due in 2 days…" },
  { step: "Post verified", text: "Your post is verified — payment is on the way…" },
];

/** /admin/messaging/auto — Automatic messages (Figma 077) */
export default function AutoMessages() {
  const [on, setOn] = useState(() => STEPS.map(() => ({ wa: false, em: false })));
  const [pick, setPick] = useState(0);
  const [picked, setPicked] = useState(false); // Figma: shuru mein koi step highlight nahi
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const flip = (i, k) => {
    setOn(on.map((x, j) => (j === i ? { ...x, [k]: !x[k] } : x)));
    setPick(i);
    setDirty(true);
  };

  const copy = async () => {
    const body = STEPS[pick].text;
    try {
      await navigator.clipboard.writeText(body);
      setToast(`Copied “${STEPS[pick].step}” message`);
    } catch {
      setToast("Couldn’t copy — select the text instead");
    }
  };

  const tg = (i, k, label) => (
    <button type="button" className={`ad-toggle ma-tg ${on[i][k] ? "is-on" : ""}`} aria-pressed={on[i][k]} aria-label={`${label} for ${STEPS[i].step}`} onClick={() => flip(i, k)} />
  );

  return (
    <AdminShell>
      <MsgHead />
      <section className="ad-card ma-card">
        <h2 className="ad-h2">Automatic messages</h2>
        <p className="ma-sub">The texts creators get at each step. WhatsApp uses the approved template geek_campaign_update.</p>
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
            <button key="s" type="button" className={`ma-step ${picked && pick === i ? "is-pick" : ""}`} onClick={() => { setPick(i); setPicked(true); }}>
              {s.step}
            </button>,
            <span key="w">{tg(i, "wa", "WhatsApp")}</span>,
            <span key="e">{tg(i, "em", "Email")}</span>,
            <span key="p" className="ma-prev">
              {s.text}
            </span>,
          ])}
        />
        <div className="ma-act">
          <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setToast(`Test “${STEPS[pick].step}” sent to your WhatsApp`)}>
            Send test
          </button>
          <button type="button" className="ma-plain" onClick={copy}>
            Copy body
          </button>
          <button type="button" className="ad-btn ad-btn--primary" onClick={() => (setDirty(false), setToast("Automatic messages saved"))}>
            Save{dirty ? " changes" : ""}
          </button>
        </div>
      </section>
      {toast && <div className="ad-toast">✓ {toast}</div>}
      <style>{`
        .ma-card { padding: 24px 22px 22px; }
        .ma-sub { margin: 9px 0 20px; font-size: 12px; color: var(--ad-muted); }
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
        .ma-act .ad-btn { height: 41px; padding: 0 15px; }
        .ma-act .ad-btn--ghost { border-color: var(--ad-line-2); }
        .ma-plain { height: 41px; padding: 0 10px; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; }
        @media (max-width: 640px) { .ma-card { padding: 18px 16px; } }
      `}</style>
    </AdminShell>
  );
}
