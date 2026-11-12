"use client";

import Link from "next/link";

/* Campaign creator journey ke 12 steps (Figma: "Step 9/12 · Courier delivered", "11. Video submitted") */
export const JOURNEY_STEPS = ["Invited", "Registered", "Instagram connected", "Applied", "Approved", "Contract signed", "Address confirmed", "Courier sent", "In transit", "Courier delivered", "Video brief sent", "Video submitted", "Done"];

/* Workspace creators (Figma 033/034) */
export const WS_CREATORS = [
  {
    id: "aditi-verma",
    name: "Aditi Verma",
    handle: "@aditi.creates",
    tags: [["via upload · 30 Oct", "violet"], ["On Geek · connect Instagram", "orange"]],
    phone: "+91 93172•••35",
    followers: "19,740",
    city: "Chandigarh",
    step: 1,
    stepNote: "Registered · sheet: Video submitted",
    turn: "⏳ Creator’s turn · Instagram not connected · 13 days · 💬 05 Nov · delivered ✓✓ · sent by the team",
    action: "📸 Connect Instagram",
    next: "Connect Instagram (media kit) — or pick a step below",
    ig: false,
    registered: true,
    posted: false,
  },
  {
    id: "chirag-khatri",
    name: "Chirag Khatri",
    handle: "@chiraagk",
    tags: [["via upload · 30 Oct", "violet"], ["Not yet on Geek", ""]],
    phone: "+91 81695•••72",
    followers: "4,737",
    city: "Mumbai",
    step: 0,
    stepNote: "Sheet: Address confirmed · joins once registered",
    turn: "⏳ Creator’s turn · Not registered · 13 days · 💬 05 Nov · sent ✓ · automatic",
    action: "↻ Resend invite",
    next: "Register on Geek OS from the invite link",
    ig: false,
    registered: false,
    posted: false,
  },
  {
    id: "kabir-mehta",
    name: "Kabir Mehta",
    handle: "@kabirfoodtrail",
    tags: [["applied", "violet"], ["On Geek", "orange"]],
    phone: "+91 98300•••45",
    followers: "41,200",
    city: "Delhi",
    step: 9,
    stepNote: "Courier delivered",
    turn: "⏳ Creator’s turn · video due in 1 day · 💬 10 Nov · read ✓✓",
    action: "▶ Remind",
    next: "Submit the video draft (due in 1 day)",
    ig: true,
    registered: true,
    posted: false,
  },
  {
    id: "nisha-rao",
    name: "Nisha Rao",
    handle: "@nishastories",
    tags: [["applied", "violet"], ["On Geek", "orange"]],
    phone: "+91 98765•••10",
    followers: "28,100",
    city: "Mumbai",
    step: 11,
    stepNote: "Video submitted",
    turn: "⏳ Our turn · review the video · 💬 11 Nov · delivered ✓✓",
    action: "✅ Approve video",
    next: "Review and approve the video",
    ig: true,
    registered: true,
    posted: true,
  },
];
export const wsCreator = (id) => WS_CREATORS.find((c) => c.id === id) || WS_CREATORS[0];

/**
 * Ek creator ki row (Figma 033/034): avatar, naam, tags, WhatsApp/followers/city, step bar, kiski baari, action button.
 * href diya ho to naam row ko open karta hai.
 */
export function CreatorRow({ c, href, checked, onCheck, onAction, onChat, open }) {
  const pct = Math.max(4, Math.round((c.step / 12) * 100));
  return (
    <div className={`jr ${open ? "is-open" : ""}`}>
      {onCheck && <input type="checkbox" className="jr-check" checked={!!checked} onChange={onCheck} aria-label={`Select ${c.name}`} />}
      <span className="jr-av">{c.name[0]}</span>
      <div className="jr-main">
        <p className="jr-top">
          {href ? (
            <Link href={href} className="jr-name">
              {c.name}
            </Link>
          ) : (
            <b className="jr-name">{c.name}</b>
          )}
          <span className="jr-handle">{c.handle}</span>
          {c.tags.map(([t, tn]) => (
            <span key={t} className={`ad-badge ad-badge--${tn}`}>
              {t}
            </span>
          ))}
        </p>
        <p className="jr-meta">
          🟢 WhatsApp {c.phone} <span className="ad-badge ad-badge--green">ON</span> · 👥 {c.followers} followers · 📍 {c.city}
        </p>
        <div className="jr-step">
          <span className="ad-bar">
            <i style={{ width: c.step ? `${pct}%` : 0 }} />
          </span>
          <span>
            Step {c.step}/12 · {c.stepNote}
          </span>
        </div>
        <p className="jr-turn">{c.turn}</p>
      </div>
      <div className="jr-act">
        <button type="button" className="ad-btn ad-btn--primary jr-btn" onClick={onAction}>
          {c.action}
        </button>
        <button type="button" className="jr-chat" onClick={onChat} aria-label={`Chat with ${c.name}`}>
          💬
        </button>
        {href ? (
          <Link href={href} className="jr-more" aria-label="Open creator">
            ▾
          </Link>
        ) : (
          <span className="jr-more">▾</span>
        )}
      </div>
      <style>{`
        .jr { display: flex; align-items: flex-start; gap: 14px; padding: 13px 14px 14px 13px; border-radius: 14px; border: 1px solid var(--ad-line); background: #fff; transition: border-color .15s; }
        .jr:hover { border-color: #cfd2ee; }
        .jr-check { margin-top: 12px; accent-color: var(--ad-primary); }
        .jr-av { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; background: var(--ad-soft); font-size: 19px; color: var(--ad-ink); }
        .jr-main { flex: 1; min-width: 0; padding-top: 2px; }
        .jr-top { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
        .jr-name { font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        a.jr-name:hover { color: var(--ad-primary); }
        .jr-handle { margin-right: 2px; font-size: 12px; font-weight: 700; color: var(--ad-muted); }
        .jr-meta { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-top: 8px; font-size: 12px; color: #8791a7; }
        .jr-meta .ad-badge { height: 22px; padding: 0 9px; }
        .jr-step { display: flex; align-items: center; gap: 10px; margin-top: 8px; font-size: 12px; color: var(--ad-ink); }
        .jr-step .ad-bar { width: 160px; height: 6px; flex-shrink: 0; background: #eceef6; }
        .jr-turn { margin-top: 8px; font-size: 12px; line-height: 1.35; color: #8791a7; }
        .jr-act { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .jr-btn { height: 41px; padding: 0 15px; }
        .jr-chat { width: 46px; height: 39px; border-radius: 10px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 12px; color: var(--ad-primary-ink); }
        .jr-chat:hover { border-color: var(--ad-primary); }
        .jr-more { width: 26px; text-align: center; font-size: 12px; font-weight: 800; color: #6657e9; }
        @media (max-width: 1023px) {
          .jr { flex-wrap: wrap; }
          .jr-act { width: 100%; padding-left: 52px; }
          .jr-btn { flex: 1; }
        }
        @media (max-width: 640px) {
          .jr { gap: 10px; padding: 12px; }
          .jr-av { width: 32px; height: 32px; font-size: 15px; }
          .jr-act { padding-left: 0; }
          .jr-step { flex-direction: column; align-items: flex-start; gap: 6px; }
        }
      `}</style>
    </div>
  );
}
