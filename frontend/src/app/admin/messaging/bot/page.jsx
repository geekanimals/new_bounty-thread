"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import MsgHead from "@/components/admin/msg/MsgHead";
import PTable from "@/components/admin/brand/PTable";

const MENU = [
  ["1 · Help me", "Answers from FAQs and their data"],
  ["2 · Complete my profile", "Sends the missing fields + link"],
  ["3 · My campaign", "Step, deadline, courier status"],
  ["4 · Talk to a team member", "Alerts the team · bot goes quiet"],
  ["5 · Something else", "Hands to the team"],
];
const REPLIES = [
  ["4:12 pm", "@nishastories", "When will my product arrive?"],
  ["2:40 pm", "@kabirfoodtrail", "How do I submit my reel?"],
  ["11:05 am", "@rohanfitlife", "Payment kab aayega?"],
];

/** /admin/messaging/bot — WhatsApp help bot (Figma 081) */
export default function WhatsAppBot() {
  const [bot, setBot] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [delay, setDelay] = useState(false);
  const [sees, setSees] = useState(false);
  const [pause, setPause] = useState(false);
  const [num, setNum] = useState("");
  const [paused, setPaused] = useState([]);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const doPause = (e) => {
    e.preventDefault();
    const n = num.replace(/[^\d+]/g, "");
    if (n.replace(/\D/g, "").length < 10) return setToast("Enter a 10-digit WhatsApp number");
    setPaused([...paused, n]);
    setNum("");
    setPause(false);
    setToast(`Bot paused for ${n} for 24 h`);
  };

  return (
    <AdminShell>
      <MsgHead />
      <div className="mb-grid">
        <section className="ad-card mb-card">
          <div className="mb-top">
            <div>
              <h2 className="ad-h2">🤖 WhatsApp help bot</h2>
              <p className="mb-sub">Answers creators on WhatsApp from their live data — campaign, step, deadline, courier, profile.</p>
            </div>
            <span className={`ad-badge ${bot ? "ad-badge--green" : ""}`}>{bot ? "ON" : "OFF"}</span>
            <button type="button" className={`ad-btn ${bot ? "ad-btn--ghost" : "ad-btn--primary"} mb-turn`} onClick={() => (setBot(!bot), setToast(bot ? "Help bot turned off" : "Help bot is answering creators"))}>
              {bot ? "Turn bot off" : "Turn bot on"}
            </button>
          </div>

          <h3 className="mb-h3">Welcome menu</h3>
          <p className="mb-sub">A new chat (or one quiet for 24 h) first gets the welcome + 5 options. The bot answers only after one is picked · 0 brings the menu back.</p>
          <div className="mb-menu">
            <PTable minW={520} rowH={48} cols={[{ label: "Option", w: "57.4%" }, { label: "What happens", w: "42.6%" }]} rows={MENU} />
          </div>

          <h3 className="mb-h3 mb-rules-h">Rules</h3>
          <div className="mb-rules">
            <button type="button" className="mb-rule" onClick={() => setQuiet(!quiet)} aria-pressed={quiet}>
              <i className={`ad-toggle ${quiet ? "is-on" : ""}`} />
              <span>
                <strong>Stay quiet when the team replies</strong>
                <small>from snapto or the app</small>
              </span>
            </button>
            <button type="button" className="mb-rule" onClick={() => setDelay(!delay)} aria-pressed={delay}>
              <i className={`ad-toggle ${delay ? "is-on" : ""}`} />
              <span>
                <strong>Reply after</strong>
                <small>30 seconds</small>
              </span>
            </button>
          </div>
        </section>

        <section className="ad-card mb-card mb-side">
          <div className="mb-side__head">
            <h2 className="ad-h2">Recent replies</h2>
            <button type="button" className="mb-link" onClick={() => setSees(!sees)}>
              {sees ? "Hide data" : "What the bot sees"}
            </button>
          </div>
          {sees && (
            <pre className="mb-sees">{`creator: @nishastories
campaign: Beardo Detan Express Kit
step: Product shipped
courier: DTDC 7D1439… · in transit
deadline: draft due 18 Nov
profile: 92% complete`}</pre>
          )}
          <PTable minW={400} rowH={48} cols={[{ label: "When", w: "26.5%" }, { label: "Creator", w: "44.5%" }, { label: "Asked", w: "29%" }]} rows={REPLIES.map(([w, c, a]) => [w, <b key="c">{c}</b>, <span key="a" title={a}>{a}</span>])} />
          {paused.length > 0 && (
            <p className="mb-paused">
              ⏸ Paused 24 h: {paused.join(", ")}
            </p>
          )}
          {pause ? (
            <form className="mb-pause" onSubmit={doPause}>
              <input className="ad-input" inputMode="tel" placeholder="+91 98765 43210" value={num} onChange={(e) => setNum(e.target.value)} aria-label="WhatsApp number" autoFocus />
              <button type="submit" className="ad-btn ad-btn--primary">
                Pause
              </button>
            </form>
          ) : (
            <button type="button" className="mb-link mb-pause-btn" onClick={() => setPause(true)}>
              ⏸️ Pause bot for a number (24 h)
            </button>
          )}
        </section>
      </div>
      {toast && <div className="ad-toast">✓ {toast}</div>}
      <style>{`
        .mb-grid { display: grid; grid-template-columns: minmax(0, 652fr) minmax(0, 450fr); gap: 20px; align-items: start; }
        .mb-card { padding: 24px 22px 22px; min-width: 0; }
        .mb-top { display: flex; align-items: flex-start; gap: 10px; }
        .mb-top > div { flex: 1; min-width: 0; }
        .mb-top .ad-badge { margin-top: 17px; height: 26px; }
        .mb-turn { flex-shrink: 0; width: 88px; height: 59px; padding: 0 18px; white-space: normal; line-height: 1.3; }
        .mb-sub { margin-top: 9px; font-size: 12px; line-height: 1.33; color: var(--ad-muted); }
        .mb-h3 { margin-top: 18px; font-family: var(--ad-sans); font-size: 16.4px; font-weight: 700; color: var(--ad-ink); }
        .mb-menu { margin: 8px 0 0; }
        .mb-rules-h { margin-top: 12px; }
        .mb-rules { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
        .mb-rule { display: flex; align-items: center; gap: 12px; min-height: 112px; padding: 14px 16px; border: 0; border-radius: 14px; background: var(--ad-soft-2); text-align: left; }
        .mb-rule i { flex-shrink: 0; width: 26px; height: 22px; background: #d3d7e4; }
        .mb-rule i:not(.is-on)::after { opacity: 0; }
        .mb-rule i::after { width: 16px; height: 16px; }
        .mb-rule i.is-on { width: 40px; background: var(--ad-primary); }
        .mb-rule strong { display: block; font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.37; color: var(--ad-ink); }
        .mb-rule small { display: block; margin-top: 3px; font-size: 12px; color: var(--ad-muted); }
        .mb-side__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 30px; }
        .mb-side__head .ad-h2 { margin-top: 8px; }
        .mb-link { border: 0; background: none; padding: 0; font-size: 14px; font-weight: 800; color: #6657e9; }
        .mb-link:hover { color: var(--ad-primary-2); }
        .mb-pause-btn { margin-top: 30px; }
        .mb-pause { display: flex; gap: 8px; margin-top: 18px; }
        .mb-pause .ad-btn { flex-shrink: 0; }
        .mb-paused { margin-top: 14px; font-size: 12px; color: var(--ad-orange); }
        .mb-sees { margin: -14px 0 18px; padding: 12px 14px; border-radius: 12px; background: var(--ad-soft-2); font-family: ui-monospace, monospace; font-size: 12px; line-height: 1.6; color: var(--ad-text); white-space: pre-wrap; }
        .mb-side .pt-wrap { overflow-x: hidden; }
        .mb-side .pt { min-width: 0 !important; }
        @media (max-width: 1180px) { .mb-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .mb-card { padding: 18px 16px; }
          .mb-top { flex-wrap: wrap; }
          .mb-top .ad-badge { margin-top: 0; }
          .mb-turn { width: auto; height: 40px; margin-left: auto; }
          .mb-rules { grid-template-columns: 1fr; }
          .mb-rule { min-height: 0; }
          .mb-rule strong { font-size: 19px; }
          .mb-side__head { margin-bottom: 14px; }
        }
      `}</style>
    </AdminShell>
  );
}
