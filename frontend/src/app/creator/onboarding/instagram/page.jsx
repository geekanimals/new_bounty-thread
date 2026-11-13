"use client";

import { useRouter } from "next/navigation";
import OnboardShell from "@/components/creator/OnboardShell";
import { signOut as creatorSignOut, setIgLater, afterLoginRoute, getCreator, track, useCreator } from "@/services/creator";
import { getSidekick } from "@/components/creator/data";

/** /creator/onboarding/instagram — Instagram connect karo (ya baad mein) */
export default function ConnectInstagram() {
  const router = useRouter();
  const sk = getSidekick(useCreator().prefs?.kid);

  const signOut = async () => {
    await creatorSignOut();
    router.push("/creator");
  };

  // "Connect Instagram" → Meta ki official window (meta page khud kholta hai)
  const connect = () => {
    track("ig_connect_start", { from: "onboarding" }, "activity");
    router.push("/creator/onboarding/meta");
  };

  // "Baad mein" → purane app jaisa: is login ke liye yaad rakho, aage badho
  const later = () => {
    setIgLater();
    router.push(afterLoginRoute(getCreator()));
  };

  return (
    <OnboardShell tone="light" step={4} avatar gate="member">
      <title>Connect Instagram — Bounty</title>
      <div className="ci">
        <h2 className="ci-h">Let your work speak.</h2>
        <p className="ci-sub">Connect Instagram to build your media kit in seconds.</p>

        <div className="ci-visual">
          <p className="ci-bubble">
            <b>{sk.name}:</b> Connect once — I&apos;ll build your media kit while you wait.
          </p>
          <img src={sk.img} alt="" className="ci-rumi" />
          <div className="ci-kit" aria-hidden="true">
            <div className="ci-kit__top">
              <img src="/creator/avatar-woman.jpg" alt="" />
              <strong>Your Media Kit</strong>
            </div>
            <i className="ci-kit__line" />
            <i className="ci-kit__line ci-kit__line--s" />
            <div className="ci-kit__row">
              <span>👥 Audience</span>
              <span className="ci-kit__bars">
                <i style={{ height: 6 }} />
                <i style={{ height: 9 }} />
                <i style={{ height: 12 }} />
                <i style={{ height: 15 }} />
                <i style={{ height: 18 }} />
              </span>
            </div>
            <div className="ci-kit__row">
              <span>▶ Top content</span>
              <span className="ci-kit__tiles">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        </div>

        <ul className="ci-list">
          <li>
            <span>🗂</span> Auto-build your media kit
          </li>
          <li>
            <span>🎯</span> Get better-fit campaign matches
          </li>
          <li>
            <span>🛡</span> Share verified insights with brands
          </li>
        </ul>

        <button type="button" className="bx-btn bx-btn--dark bx-btn--lg bx-btn--block ci-cta" onClick={connect}>
          <span className="ci-ig" aria-hidden="true" /> Connect with Instagram →
        </button>
        <button type="button" className="ci-later" onClick={later}>
          I&apos;ll do this later
        </button>
        <p className="ci-note">
          <span aria-hidden="true">🛡</span>
          <span>Official Meta connection. No password shared. Disconnect anytime.</span>
        </p>
        <button type="button" className="ci-out" onClick={signOut}>
          Sign out
        </button>
      </div>

      <style>{`
        /* Figma 028/044 — panel 400px wide */
        .ci { text-align: center; color: #0e2a33; }
        .ci-h { font-family: var(--bx-jak); font-size: 40px; font-weight: 800; line-height: 44px; letter-spacing: -1px; color: #0e2a33; }
        .ci-sub { margin: 9px 0 0; font-size: 15px; font-weight: 500; line-height: 21px; color: #3e4b52; }
        .ci-visual { position: relative; height: 243px; margin-top: 17px; }
        .ci-bubble { position: absolute; left: 0; top: 0; z-index: 2; width: 200px; margin: 0; padding: 7px 11px; border-radius: 12px; background: #fffdf6; border: 1px solid #e8dcc2; text-align: left; font-family: var(--bx-serif); font-style: italic; font-size: 12.5px; line-height: 16.9px; color: #14231a; box-shadow: 0 8px 18px -12px rgba(0,0,0,.4); }
        .ci-bubble b { font-style: normal; font-weight: 700; color: #b8452f; }
        .ci-rumi { position: absolute; left: -2px; top: 58px; width: 151px; height: 125px; object-fit: contain; filter: drop-shadow(0 10px 12px rgba(0,0,0,.2)); }
        .ci-kit { position: absolute; right: -3px; top: 52px; width: 197px; height: 154px; padding: 12px 15px 0 17px; border-radius: 14px; background: #fff; text-align: left; box-shadow: 0 16px 30px -14px rgba(0,0,0,.35); }
        .ci-kit__top { display: flex; align-items: center; gap: 7px; }
        .ci-kit__top img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
        .ci-kit__top strong { font-family: var(--bx-serif); font-size: 14px; font-weight: 600; color: #14231a; }
        .ci-kit__line { display: block; width: 116px; height: 11px; margin: 9px 0 0 49px; border-radius: 3px; background: #ece6da; }
        .ci-kit__line--s { width: 67px; height: 9px; margin-top: 2px; }
        .ci-kit__row { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 8px; font-size: 11.5px; font-weight: 700; color: #0e2a33; }
        .ci-kit__bars { display: flex; align-items: flex-end; gap: 2px; }
        .ci-kit__bars i { width: 6px; border-radius: 2px; background: #14b4e2; }
        .ci-kit__tiles { display: flex; gap: 3px; }
        .ci-kit__tiles i { width: 17px; height: 15px; border-radius: 3px; background: #dfe5ea; }
        .ci-list { list-style: none; margin: 0; padding: 4px 17px; border-radius: 16px; background: rgba(255,253,246,.92); border: 1px solid #e8dcc2; text-align: left; }
        .ci-list li { display: flex; align-items: center; gap: 18px; height: 53px; font-size: 15px; font-weight: 700; color: #0e2a33; }
        .ci-list li span { width: 20px; font-size: 18px; text-align: center; }
        .ci-list li + li { border-top: 1px solid #efe5cf; }
        .ci-cta { height: 56px !important; margin-top: 15px; border-radius: 16px !important; background: #0e2a33 !important; color: #fff !important; font-family: var(--bx-jak); font-size: 18px !important; font-weight: 800 !important; letter-spacing: -0.1px; gap: 10px !important; box-shadow: 0 10px 20px -12px rgba(14,42,51,.7); }
        .ci-ig { width: 28px; height: 28px; flex-shrink: 0; border-radius: 8px; background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 33%, #d6249f 67%, #285aeb 100%); position: relative; }
        .ci-ig::after { content: ""; position: absolute; inset: 7px; border: 2px solid #fff; border-radius: 50%; }
        .ci-later { margin-top: 18px; border: 0; background: none; padding: 0; font-family: var(--bx-jak); font-size: 16px; font-weight: 700; color: #0e2a33; }
        .ci-later:hover { text-decoration: underline; }
        .ci-note { display: flex; align-items: center; justify-content: center; gap: 18px; min-height: 48px; margin: 20px 0 0; padding: 7px 16px; border-radius: 14px; background: rgba(205,239,248,.85); font-size: 12px; font-weight: 500; line-height: 16.2px; color: #0e2a33; }
        .ci-note > span:first-child { flex-shrink: 0; }
        .ci-out { margin: 19px auto 0; border: 0; background: none; padding: 0; font-family: var(--bx-jak); font-size: 13px; font-weight: 500; color: #5b6770; }
        @media (max-width: 767px) {
          .ci-h { font-size: 36px; line-height: 39.6px; letter-spacing: -0.89px; }
          .ci-visual { height: 245px; margin-top: 15px; }
          .ci-bubble { left: 6px; width: 212px; }
          .ci-rumi { left: -4px; top: 66px; width: 151px; height: 125px; }
          .ci-kit { right: -4px; top: 50px; width: 197px; }
          .ci-out { display: none; }
        }
      `}</style>
    </OnboardShell>
  );
}
