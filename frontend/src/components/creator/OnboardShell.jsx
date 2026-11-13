"use client";

import { useEffect, useState } from "react";
import { pushTip, useRumiTip } from "@/components/creator/rumiBus";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BootLoader from "@/components/creator/BootLoader";
import { useCreatorGate, useCreator } from "@/services/creator";
import Logo from "@/components/creator/Logo";
import { SIDEKICKS, getSidekick } from "@/components/creator/data";
import { Play, Close } from "@/components/ui/Icons";

// Left panel ke sidekicks ka order (Figma)
const KID_ROW = ["pip", "rumi", "mochi", "sprout", "dot", "pebble"];

/* ---------- "How Bounty works" video popup ---------- */
export function VideoModal({ open, onClose, onFind }) {
  const [playing, setPlaying] = useState(false);
  // Escape se popup band
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="bx-overlay" onClick={onClose}>
      <div className="vm" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="How Bounty works">
        <div className="vm-head">
          <h2>How Bounty works</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <Close size={15} />
          </button>
        </div>
        <button type="button" className="vm-video" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"}>
          <span className="vm-kids">
            {SIDEKICKS.map((s) => (
              <img key={s.id} src={s.img} alt="" />
            ))}
          </span>
          <span className={`vm-play ${playing ? "is-on" : ""}`}>{playing ? <span className="vm-pause" /> : <Play size={18} />}</span>
          <span className="vm-time">{playing ? "0:12" : "0:00"} / 3:44</span>
          <span className="vm-bar">
            <i style={{ width: playing ? "6%" : "0%" }} />
          </span>
        </button>
        <ol className="vm-steps">
          <li>
            <b>1</b>
            <span>
              <strong>Discover campaigns</strong>
              <small>Real brands, clear briefs — made for your world.</small>
            </span>
          </li>
          <li>
            <b>2</b>
            <span>
              <strong>Apply &amp; create</strong>
              <small>Get selected, receive the kit, shoot your Reel.</small>
            </span>
          </li>
          <li>
            <b>3</b>
            <span>
              <strong>Get paid &amp; grow</strong>
              <small>Post, get verified, payment lands. Your media kit grows.</small>
            </span>
          </li>
        </ol>
        <button type="button" className="bx-btn bx-btn--cream bx-btn--lg bx-btn--block vm-go" onClick={onFind}>
          Find my collaborations →
        </button>
      </div>
      <style>{`
        .vm { width: min(560px, 100%); max-height: calc(100vh - 40px); overflow-y: auto; padding: 16px; border-radius: 22px; background: linear-gradient(180deg,#123524,#0f2e22); border: 1px solid rgba(232,176,74,.6); color: var(--bx-cream); animation: bxPop .2s ease; }
        .vm-head { display: flex; align-items: center; justify-content: center; position: relative; margin-bottom: 12px; }
        .vm-head h2 { font-family: var(--bx-serif); font-size: 22px; font-weight: 600; color: #fbf3e2; }
        .vm-head button { position: absolute; right: 0; width: 32px; height: 32px; border-radius: 50%; border: 0; background: rgba(255,255,255,.1); display: grid; place-items: center; color: var(--bx-cream); }
        .vm-video { position: relative; display: block; width: 100%; aspect-ratio: 16 / 9; padding: 0; border: 0; border-radius: 14px; overflow: hidden; background: url("/creator/forest-gate.jpg") center 70% / cover; }
        .vm-kids { position: absolute; left: 0; right: 0; bottom: 18%; display: flex; justify-content: center; gap: 2%; }
        .vm-kids img { width: 13%; }
        .vm-play { position: absolute; left: 50%; top: 32%; transform: translate(-50%,-50%); width: 54px; height: 54px; border-radius: 50%; background: rgba(255,255,255,.92); color: var(--bx-ink); display: grid; place-items: center; }
        .vm-pause { width: 14px; height: 16px; border-left: 4px solid var(--bx-ink); border-right: 4px solid var(--bx-ink); }
        .vm-time { position: absolute; left: 10px; bottom: 14px; font-family: var(--bx-sans); font-size: 11px; font-weight: 700; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.6); }
        .vm-bar { position: absolute; left: 10px; right: 10px; bottom: 8px; height: 3px; border-radius: 3px; background: rgba(255,255,255,.3); }
        .vm-bar i { display: block; height: 100%; border-radius: inherit; background: var(--bx-gold); transition: width .4s; }
        .vm-steps { list-style: none; margin: 14px 0; padding: 0; display: grid; gap: 10px; }
        .vm-steps li { display: flex; gap: 12px; align-items: flex-start; }
        .vm-steps b { width: 30px; height: 30px; flex-shrink: 0; border-radius: 50%; background: var(--bx-gold); color: #14231a; display: grid; place-items: center; font-family: var(--bx-serif); font-size: 15px; font-weight: 700; }
        .vm-steps strong { display: block; font-family: var(--bx-serif); font-size: 16px; font-weight: 600; line-height: 21px; color: #fbf3e2; }
        .vm-steps small { display: block; font-family: var(--bx-sans); font-size: 12.5px; font-weight: 400; color: #d9cdb2; }
        .vm-go { height: 56px !important; border-radius: 28px !important; background: #f6ebd3 !important; color: #14231a !important; font-family: var(--bx-jak); font-size: 18px !important; font-weight: 800 !important; }
        @media (max-width: 767px) { .vm { border-radius: 22px 22px 0 0; max-height: 92vh; } }
      `}</style>
    </div>
  );
}

/* ---------- Rumi (sidekick) ki baat wala bubble ---------- */
export function RumiTip({ text, name: nameIn, img: imgIn, onClose, className = "", mobileDark = false, inline = false }) {
  // naam / photo na diya ho to wahi sidekick bole jo creator ne chuna hai (Rumi hardcode nahi)
  const me = useCreator();
  const sk = getSidekick(me.prefs?.kid);
  const name = nameIn || sk.name;
  const img = imgIn || sk.img;
  // Page ki baat us sidekick tak bhejo jo screen par already hai (footer / sidebar / left panel).
  // inline = page ka apna bada sidekick hai, to bubble wahin (bina doosri image ke).
  useEffect(() => {
    if (inline) return undefined;
    const tip = { text, name, img };
    pushTip(tip);
    return () => pushTip(null);
  }, [text, name, img, inline]);

  return (
    <div className={`rt ${inline ? "rt--inline" : "rt-page"} ${mobileDark ? "rt--mdark" : ""} ${className}`}>
      {!inline && <img src={img} alt="" />}
      <p>
        <b>{name}:</b> {text}
      </p>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Close">
          <Close size={11} />
        </button>
      )}
      <style>{`
        /* Figma: Rumi 72×59 + cream bubble (Fraunces italic 13.5) */
        .rt { display: flex; align-items: center; gap: 10px; }
        .rt img { width: 72px; height: 59px; object-fit: contain; flex-shrink: 0; }
        .rt p { position: relative; margin: 0; padding: 11px 16px; border-radius: 20px; background: #fffdf6; border: 1px solid #d8c9a3; text-align: left; font-family: var(--bx-serif); font-style: italic; font-size: 13.5px; line-height: 18.2px; color: #14231a; box-shadow: 0 4px 8px -2px rgba(60,40,10,.18); }
        .rt b { font-style: normal; font-weight: 700; color: #b8452f; }
        .rt button { margin-left: -4px; border: 0; background: none; color: #7a6a4a; }
        .rt--inline { justify-content: center; }
        /* Mobile setup screens par Figma mein dark bubble */
        @media (max-width: 767px) {
          .rt--mdark p { background: #163b2a; border-color: rgba(232,176,74,.8); color: #fbf3e2; }
          .rt--mdark b { color: #e8b04a; }
        }
      `}</style>
    </div>
  );
}

/**
 * Login + onboarding ka split frame (Figma jaisa):
 *  - Desktop: left jungle panel (logo, headline, "See how it works", sidekicks) + right form panel
 *  - Mobile: sirf form panel, poori screen
 * tone: "dark" (jungle) | "light" (parchment) — right panel ka background
 * step: 1–6 (progress bar), back: link/handler, footer: neeche chhota text
 */
export default function OnboardShell({ children, tone = "dark", step, stepText, eyebrow, back, onBack, avatar = false, avatarKid, footer = "by Geek Creative Agency", gate }) {
  const [video, setVideo] = useState(false);
  // Login / flow guard (purane app jaisa): gate="guest" (login ho chuka to aage), "member" (login zaroori)
  const router = useRouter();
  const pathname = usePathname() || "";
  const gc = useCreatorGate(gate, router, pathname);
  const tip = useRumiTip();
  // login wale step par check chal raha hai → wahi "Getting your world ready…" loader
  if (gate === "member" && (!gc.ready || !gc.loggedIn)) return <BootLoader kid={gc.loggedIn ? gc.prefs?.kid : ""} />;
  // login / OTP wale step: login ho chuka hai (Back dabane par yahan aaye) → form mat dikhao, seedha aage
  if (gate === "guest" && (!gc.ready || gc.loggedIn)) return <BootLoader kid={gc.loggedIn ? gc.prefs?.kid : ""} />;
  return (
    <div className={`os os--${tone}`}>
      <section className="os-left">
        <div className="os-left__top">
          <Logo size={28} withTag />
          <h1>
            Your next dream
            <br />
            brand starts here.
          </h1>
          <p>
            Discover collaborations. Create your story.
            <br />
            Grow on your terms.
          </p>
          <button type="button" className="os-how" onClick={() => setVideo(true)}>
            <Play size={10} /> See how it works
          </button>
        </div>
        {/* Figma order: Pip, Rumi, Mochi, Sprout, Dot, Pebble — rock ledge par */}
        <div className="os-kids">
          {KID_ROW.map((id, i) => {
            const s = SIDEKICKS.find((k) => k.id === id);
            // Page ki baat yahi sidekick bolega (desktop par alag se doosra Rumi nahi)
            const speaks = tip && (tip.name === s.name || (!SIDEKICKS.some((k) => k.name === tip.name) && id === "rumi"));
            return (
              <span key={id} className="os-kid">
                {speaks && (
                  <span className="os-say" role="status">
                    <b>{tip.name}:</b> {tip.text}
                  </span>
                )}
                <img src={s.img} alt={s.name} style={{ animationDelay: `${i * 0.25}s` }} />
              </span>
            );
          })}
        </div>
        <p className="os-left__foot">Real brands • Clear briefs • Your choice</p>
      </section>

      <section className="os-right">
        <div className="os-right__in">
          <div className="os-mtop">
            <Logo size={22} tone={tone === "light" ? "dark" : "light"} />
            {avatar === "C" ? <span className="os-av os-av--c">C</span> : avatar && <OnbAvatar />}
          </div>
          {eyebrow && <p className="os-eyebrow">{eyebrow}</p>}
          {step && !eyebrow && (
            <div className="os-prog" aria-label={`Step ${step} of 6`}>
              <span className="os-prog__bars">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <i key={n} className={n <= step ? "is-on" : ""} />
                ))}
              </span>
              <span>{stepText || (tone === "light" ? `0${step}/06` : `0${step} / 06`)}</span>
            </div>
          )}
          {(back || onBack) &&
            (onBack ? (
              <button type="button" className="os-back" onClick={onBack}>
                ← Back
              </button>
            ) : (
              <Link href={back} className="os-back">
                ← Back
              </Link>
            ))}
          <div className="os-body">{children}</div>
          {footer && <p className="os-foot">{footer}</p>}
        </div>
      </section>

      <VideoModal open={video} onClose={() => setVideo(false)} onFind={() => setVideo(false)} />

      <style>{`
        /* Figma desktop: left 922px jungle, right 518px panel (1440 par) */
        .os { display: grid; grid-template-columns: minmax(0, 1fr) clamp(420px, 36vw, 560px); min-height: 100vh; font-family: var(--bx-jak); }
        .os-left {
          position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; align-items: center;
          padding: 58px 32px 0; text-align: center; color: #fbf3e2; overflow: hidden;
          background: url("/creator/forest-gate.jpg") center / cover, #0f2e22;
        }
        .os-left h1 { margin: 22px 0 0; font-family: var(--bx-serif); font-size: 51.8px; font-weight: 600; line-height: 57px; letter-spacing: -0.5px; color: #fbf3e2; }
        .os-left__top > p { margin: 22px 0 0; font-size: 16px; font-weight: 500; line-height: 23.2px; color: #f4eedf; }
        .os-how {
          display: inline-flex; align-items: center; justify-content: center; gap: 9px; width: 185px; height: 40px; margin-top: 28px;
          border-radius: 20px; border: 1px solid rgba(251,243,226,.6); background: rgba(10,34,25,.55); backdrop-filter: blur(4px);
          color: #fbf3e2; font-family: var(--bx-jak); font-size: 14px; font-weight: 700;
        }
        .os-how:hover { background: rgba(10,34,25,.8); }
        .os-kids { position: absolute; left: 0; right: 0; bottom: 20.2%; display: flex; justify-content: center; align-items: flex-end; gap: min(26px, 2.8%); }
        .os-kid { position: relative; width: min(95px, 10.3%); display: flex; justify-content: center; }
        .os-kids img { width: 100%; filter: drop-shadow(0 8px 10px rgba(0,0,0,.45)); }
        /* Lineup wala sidekick khud bolta hai (bubble upar) */
        .os-say {
          position: absolute; bottom: calc(100% + 12px); left: 50%; transform: translateX(-50%); width: max-content; max-width: 260px;
          padding: 10px 14px; border-radius: 18px; background: #fffdf6; border: 1px solid #d8c9a3; box-shadow: 0 10px 22px -12px rgba(0,0,0,.6);
          font-family: var(--bx-serif); font-style: italic; font-size: 13.5px; line-height: 18.2px; color: #14231a; text-align: left;
          animation: bxPop .25s ease;
        }
        .os-say::after { content: ""; position: absolute; left: 50%; bottom: -7px; width: 12px; height: 12px; margin-left: -6px; background: #fffdf6; border-right: 1px solid #d8c9a3; border-bottom: 1px solid #d8c9a3; transform: rotate(45deg); }
        .os-say b { font-style: normal; font-weight: 700; color: #b8452f; }
        /* Desktop: page wala alag Rumi bubble chhupa — lineup bolta hai */
        @media (min-width: 768px) { .os .rt-page { display: none !important; } }
        .os-left__foot { position: absolute; left: 0; right: 0; bottom: 30px; margin: 0; font-size: 14px; font-weight: 500; color: #f4eedf; }

        .os-right { position: relative; display: flex; justify-content: center; padding: 44px 40px 0; }
        .os--dark .os-right { color: #fbf3e2; background: linear-gradient(180deg, rgba(9,30,21,.55), rgba(9,30,21,.8)), url("/creator/forest-gate.jpg") center / cover, #0f2e22; }
        .os--light .os-right { color: #0e2a33; background: url("/creator/parchment.jpg") center top / cover, #f1e3c4; }
        .os-right__in { width: 100%; max-width: 400px; display: flex; flex-direction: column; min-height: calc(100vh - 44px); }
        .os-mtop { display: none; }
        .os-prog { display: flex; align-items: center; justify-content: center; gap: 15px; height: 17px; font-size: 13px; font-weight: 700; }
        .os-prog__bars { display: flex; gap: 6px; }
        .os-prog__bars i { width: 28px; height: 5px; border-radius: 2.5px; }
        .os--dark .os-prog__bars i { background: rgba(255,255,255,.2); }
        .os--dark .os-prog__bars i.is-on { background: #3fd9e8; }
        .os--light .os-prog__bars i { background: #d9cfb8; }
        .os--light .os-prog__bars i.is-on { background: #14b4e2; }
        .os-eyebrow { margin: 5px 0 0; text-align: center; font-size: 11.5px; font-weight: 700; line-height: 14px; letter-spacing: .9px; text-transform: uppercase; }
        .os-back { align-self: flex-start; margin: 14px 0 -6px; border: 0; background: none; padding: 0; font-family: var(--bx-jak); font-size: 16px; font-weight: 700; color: inherit; }
        .os-body { flex: 1; display: flex; flex-direction: column; padding-top: 29px; }
        .os-foot { margin: 0; padding: 18px 0 20px; text-align: center; font-size: 12px; font-weight: 500; }
        .os--dark .os-foot { color: rgba(251,243,226,.95); }
        .os--light .os-foot { color: #14231a; font-weight: 600; }

        @media (max-width: 1180px) {
          .os-left h1 { font-size: 44px; line-height: 50px; }
        }
        @media (max-width: 1023px) {
          .os-left h1 { font-size: 36px; line-height: 42px; }
          .os-right { padding: 44px 28px 0; }
        }
        /* Mobile (390): sirf right panel, Figma mobile frames jaisa */
        @media (max-width: 767px) {
          .os { display: block; }
          .os-left { display: none; }
          .os-right { min-height: 100vh; min-height: 100dvh; padding: 36px 24px 0; }
          .os-right__in { max-width: none; min-height: calc(100dvh - 36px); }
          .os-mtop { position: relative; display: flex; justify-content: center; align-items: center; height: 26px; margin-bottom: 10px; }
          .os-av { position: absolute; right: -6px; top: -20px; width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--bx-gold); object-fit: cover; }
          .os-body { padding-top: 29px; }
          .os-av--kid { object-fit: contain; padding: 3px; }
          .os-av--c { display: grid; place-items: center; background: #e8c46a; border-color: #b88a2a; font-family: var(--bx-serif); font-size: 20px; font-weight: 600; color: #1e2a1e; }
          .os-foot { padding: 18px 0 19px; }
        }
      `}</style>
    </div>
  );
}

/* Upar right ka gola: sirf Instagram connect hone par uski photo — warna kuch nahi */
function OnbAvatar() {
  const c = useCreator();
  const ig = (c.igAccounts || [])[0];
  const [bad, setBad] = useState(false);
  // Instagram connect nahi → kuch nahi dikhana (koi dummy / sidekick photo nahi)
  if (!c.hasIg || !ig?.profile_picture_url || bad) return null;
  return <img src={ig.profile_picture_url} alt="" className="os-av" referrerPolicy="no-referrer" onError={() => setBad(true)} />;
}
