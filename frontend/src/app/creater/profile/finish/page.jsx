"use client";

import { useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import { useSession, useCreator } from "@/services/creator";
import { RumiTip } from "@/components/creater/OnboardShell";
import { getSidekick } from "@/components/creater/data";

// Checklist section → kis page par bharna hai (purane creatorProfileGate items)
const HREF = {
  dreams: "/creater/profile/dream-brands",
  address: "/creater/profile/address",
  personal: "/creater/profile/about",
  skills: "/creater/profile/skills",
  contact: "/creater/profile/contact",
  professional: "/creater/profile/content",
  pages: "/creater/profile/instagram",
  terms: "/creater/profile/terms",
};

/** /creater/profile/finish — campaign-ready status + bache hue kaam (asli checklist: get_profile_requirements) */
export default function FinishProfile() {
  const [s] = useSession();
  const c = useCreator();
  const needs = c.joinNeeds || [];
  const igOk = c.hasIg && !needs.some((x) => /instagram/i.test(x));
  const waOk = !needs.some((x) => /whatsapp/i.test(x));
  const locked = !igOk || !waOk;
  const sk = getSidekick(s.sidekick);
  const [tip, setTip] = useState(true);
  const items = (c.req?.items || []).map((it) => ({ key: it.key || it.label, label: it.label, href: HREF[it.section] || "/creater/profile", done: !!it.done }));
  const left = items.filter((t) => !t.done);
  const pct = c.req ? c.req.pct : 0;

  return (
    <BountyShell>
      <title>Finish your profile — Bounty</title>
      <Link href="/creater/profile" className="fp-back">
        ← My profile
      </Link>

      <section className="fp">
        <h1 className="fp-h">Finish your profile</h1>

        <div className="fp-ready">
          <div className="fp-ready__top">
            <strong>{locked ? "⏳ Almost campaign-ready" : "✅ You're campaign-ready"}</strong>
            <span className="fp-pct">{pct}% profile</span>
          </div>
          <div className="fp-chips">
            <span className="fp-chip is-on">✓ STARTED</span>
            <span className="fp-arrow">→</span>
            <span className={`fp-chip ${locked ? "" : "is-on"}`}>{locked ? "○" : "✓"} CONNECTED</span>
            <span className="fp-arrow">→</span>
            <span className={`fp-chip ${locked ? "" : "is-on"}`}>{locked ? "○" : "✓"} CAMPAIGN READY</span>
          </div>
          <div className="fp-conn">
            {locked ? (
              <Link href="/creater/onboarding/meta" className="fp-box fp-box--todo">
                ○ Instagram (media kit) — connect ›
              </Link>
            ) : (
              <span className="fp-box is-ok">✓ Instagram connected (media kit)</span>
            )}
            <span className={`fp-box ${waOk ? "is-ok" : "fp-box--todo"}`}>{waOk ? "✓ WhatsApp connected" : "○ WhatsApp — connect"}</span>
            <span className={`fp-box ${c.req?.complete ? "is-ok" : "fp-box--opt"}`}>{c.req?.complete ? "✓ Profile complete" : "○ Profile complete (optional)"}</span>
          </div>
          <p className="fp-note">
            {locked
              ? "Connect Instagram to apply — brands check your real reach. Completing your profile is optional but helps brands pick you."
              : "You're connected — invitations appear under “My Campaigns”. Completing your profile is optional but helps brands pick you."}
          </p>
        </div>

        <h2 className="fp-sub">{left.length} things left to finish</h2>
        <ul className="fp-list">
          {items.map((t) => (
            <li key={t.key}>
              <Link href={t.href} className={t.done ? "is-done" : ""}>
                {t.done ? "✓" : "○"} {t.label} ›
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Mobile: Rumi tip (Figma) */}
      {tip && <RumiTip className="fp-rumi" name={sk.name} img={sk.img} text="Add your city — nearby campaigns show up first." onClose={() => setTip(false)} />}

      <style>{`
        /* Figma: sab DM Sans — card ke andar plain list */
        .fp-back { display: inline-block; margin: 4px 0 26px; font-size: 14px; font-weight: 700; color: var(--bx-ink); }
        .fp-back:hover { color: var(--bx-red); }
        .fp { padding: 20px 20px 22px; border-radius: 16px; background: rgba(251,241,220,.78); border: 1px solid var(--bx-line); box-shadow: 0 10px 24px -20px rgba(60,40,10,.45); }
        .fp-h { margin: 0 -20px; padding: 0 20px 16px; font-family: var(--bx-sans); font-size: 15px; font-weight: 700; letter-spacing: -0.1px; border-bottom: 1px solid var(--bx-line); }
        .fp-ready { padding: 18px 0 16px; border-bottom: 1px solid var(--bx-line); }
        .fp-ready__top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .fp-ready__top strong { font-size: 16px; font-weight: 700; }
        .fp-pct { padding: 3px 9px; border-radius: 999px; background: #dcefd9; color: #2f7d4f; font-size: 11px; font-weight: 600; }
        .fp-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 10px 0 14px; }
        .fp-chip { padding: 3px 9px; border-radius: 999px; background: #ece4d2; color: #6b5a3a; font-size: 12px; font-weight: 600; }
        .fp-chip.is-on { background: #dcefd9; color: #2f7d4f; }
        .fp-arrow { color: #6b5a3a; font-size: 16px; }
        .fp-conn { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; }
        .fp-box { display: flex; align-items: center; gap: 4px; min-height: 34px; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--bx-line); background: rgba(255,250,240,.6); font-size: 13px; color: #6b5a3a; }
        .fp-box.is-ok { color: var(--bx-ink); }
        .fp-box--todo { border-color: var(--bx-gold); background: #fff4dc; font-weight: 700; color: var(--bx-ink); }
        .fp-note { margin: 12px 0 0; font-size: 12px; color: #6b5a3a; }
        .fp-sub { margin: 18px 0 12px; font-family: var(--bx-sans); font-size: 14px; font-weight: 700; }
        .fp-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .fp-list a { display: flex; align-items: center; min-height: 40px; padding: 8px 12px; border-radius: 8px; border: 1px solid #d9c7a0; background: #fffdf8; font-size: 14px; font-weight: 500; color: var(--bx-ink); transition: border-color .2s; }
        .fp-list a:hover { border-color: var(--bx-gold); }
        .fp-list a.is-done { color: #2f7d4f; background: #f3faf1; }
        .fp-rumi { display: none !important; }
        @media (max-width: 767px) {
          .fp-rumi { display: flex !important; position: fixed; left: 16px; right: 16px; bottom: 86px; z-index: 34; }
          .fp-rumi img { display: none; }
          .fp-rumi p { flex: 1; padding-right: 34px; }
          .fp-rumi button { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); }
          .fp-back { margin-bottom: 20px; }
        }
        @media (max-width: 640px) {
          .fp { padding: 16px; }
          .fp-h { margin: 0 -16px; padding: 0 16px 14px; }
          .fp-conn { grid-template-columns: 1fr; }
          .fp-ready__top { flex-wrap: wrap; }
        }
      `}</style>
    </BountyShell>
  );
}
