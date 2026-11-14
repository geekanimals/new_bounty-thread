"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardShell from "@/components/creator/OnboardShell";
import { getCreator, savePrefs, setKidSeen, useCreator } from "@/services/creator";
import { SIDEKICKS, getSidekick } from "@/components/creator/data";

// Figma card colours
const CARD_BG = { pip: "#eaf4f8", mochi: "#fbe7d6", sprout: "#eef3dc", pebble: "#e5f1f6", rumi: "#fbe7d6", dot: "#e5f1f6" };

/** /creator/onboarding — naya creator: apna sidekick chuno */
export default function PickSidekick() {
  const router = useRouter();
  const [pick, setPick] = useState("rumi");

  // pehle se chuna hua sidekick select dikhe — creator ka data aane ke baad (pehle "pip" default aa jaata tha)
  const me = useCreator();
  const touched = useRef(false);
  useEffect(() => {
    if (touched.current) return;
    setPick(me.prefs?.kid || getCreator().prefs?.kid || "pip");
  }, [me.ready, me.prefs?.kid]);

  // Chuna hua sidekick login par save (purana bxKid.save) → Instagram step
  const [busy, setBusy] = useState(false);
  const go = async (save) => {
    if (busy) return;
    setBusy(true);
    // server par save 2 sec se zyada ruke to bhi aage badho (device par copy turant save ho jaati hai)
    if (save) {
      try {
        await Promise.race([savePrefs({ kid: pick }), new Promise((r) => setTimeout(r, 2000))]);
      } catch {
        /* device copy kaafi hai */
      }
    }
    try {
      setKidSeen(save ? pick : "later");
    } catch {
      /* ignore */
    }
    router.push("/creator/onboarding/instagram");
  };

  return (
    <OnboardShell tone="light" step={3} avatar gate="member">
      <title>Pick your sidekick — Bounty</title>
      <div className="sk">
        <h2 className="sk-h">Pick your sidekick.</h2>
        <p className="sk-sub">A little personality for your creator journey. You can switch anytime.</p>
        <p className="sk-note">
          <span aria-hidden="true">✨</span>
          <span>Your avatar is just for fun — brands still see your real creator profile.</span>
        </p>
        <div className="sk-grid" role="radiogroup" aria-label="Sidekicks">
          {SIDEKICKS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={pick === s.id}
              className={`sk-card ${pick === s.id ? "is-on" : ""}`}
              style={{ background: CARD_BG[s.id] }}
              onClick={() => ((touched.current = true), setPick(s.id))}
            >
              <img src={s.img} alt="" />
              <strong>{s.name}</strong>
              <small>{s.trait}</small>
            </button>
          ))}
        </div>
        <button type="button" className="bx-btn bx-btn--dark bx-btn--lg bx-btn--block sk-cta" disabled={busy} onClick={() => go(true)}>
          Continue with {getSidekick(pick).name} →
        </button>
        <button type="button" className="sk-later" onClick={() => go(false)}>
          I&apos;ll choose later
        </button>
      </div>

      <style>{`
        /* Figma: Plus Jakarta Sans, ink #0e2a33 */
        .sk { text-align: center; color: #0e2a33; }
        .sk-h { font-family: var(--bx-jak); font-size: 40px; font-weight: 800; line-height: 44px; letter-spacing: -1px; color: #0e2a33; }
        .sk-sub { margin: 9px 0 0; font-size: 15px; font-weight: 500; line-height: 21px; color: #3e4b52; }
        .sk-note { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 48px; margin: 14px 0 0; padding: 7px 14px; border-radius: 14px; background: rgba(205,239,248,.85); font-size: 12px; font-weight: 500; line-height: 16.2px; color: #0e2a33; }
        .sk-note > span:first-child { flex-shrink: 0; }
        .sk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; margin-top: 8px; }
        .sk-card { position: relative; display: flex; flex-direction: column; align-items: center; height: 140px; padding: 9px 8px 0; border-radius: 16px; border: 3px solid transparent; transition: transform .15s; }
        .sk-card:hover { transform: translateY(-2px); }
        .sk-card img { width: 96px; height: 82px; object-fit: contain; }
        .sk-card strong { margin-top: 4px; font-size: 15px; font-weight: 800; line-height: 19px; letter-spacing: .3px; text-transform: uppercase; color: #0e2a33; }
        .sk-card small { margin-top: 0; font-size: 12.5px; font-weight: 500; line-height: 16px; color: #3e4b52; }
        .sk-card.is-on { border-color: #32a8cf; background: #dff2fa !important; }
        .sk-card.is-on::after { content: ""; position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border-radius: 50%; background: #14b4e2; }
        .sk-cta { height: 58px !important; margin-top: 18px; border-radius: 16px !important; background: #0e2a33 !important; color: #fff !important; font-family: var(--bx-jak); font-size: 21px !important; font-weight: 800 !important; letter-spacing: -0.1px; box-shadow: 0 10px 22px -12px rgba(14,42,51,.7); }
        .sk-later { margin-top: 18px; border: 0; background: none; padding: 0; font-family: var(--bx-jak); font-size: 16px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; color: #0e2a33; }
        @media (max-width: 767px) {
          .sk-h { font-size: 36px; line-height: 39.6px; letter-spacing: -0.89px; }
          .sk-card { height: auto; min-height: 140px; padding-bottom: 8px; }
          .sk-card img { width: 96px; height: 84px; }
        }
      `}</style>
    </OnboardShell>
  );
}
