"use client";

import { CHECKLIST } from "@/components/admin/queue/queueData";

/**
 * Drawer ke andar ka "Decision workspace" content (Figma 005/008/011/013/015).
 * meta, badges [{label,tone}], why, actions (buttons/links)
 */
export default function DecisionPanel({ meta, badges = [], why, actions, children }) {
  return (
    <div className="dp">
      <p className="dp-meta">{meta}</p>
      <div className="dp-badges">
        {badges.map((b) => (
          <span key={b.label} className={`ad-badge ad-badge--${b.tone || ""}`}>
            {b.label}
          </span>
        ))}
      </div>
      <h3 className="dp-h">Why this needs attention</h3>
      <p className="dp-why">{why}</p>
      {children}
      <div className="dp-sec">
        <h3 className="dp-h">Context checklist</h3>
        <ul className="dp-list">
          {CHECKLIST.map((c) => (
            <li key={c}>
              <i>✓</i>
              {c}
            </li>
          ))}
        </ul>
      </div>
      <div className="dp-sec">
        <h3 className="dp-h">Suggested action</h3>
        <p className="dp-why dp-why--muted">
          A production decision should capture a reason, actor and timestamp and notify the relevant people only after confirming automation state.
        </p>
        <div className="dp-act">{actions}</div>
      </div>
      <style>{`
        .dp-meta { margin-top: 22px; font-size: 12px; color: var(--ad-muted); }
        .dp-badges { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 15px; }
        .dp-badges .ad-badge { height: 26px; }
        .dp-h { margin: 22px 0 0; font-size: 13px; font-weight: 700; color: var(--ad-ink); }
        .dp-why { margin-top: 13px; font-size: 14px; line-height: 1.36; color: var(--ad-ink); }
        .dp-why--muted { color: var(--ad-muted); }
        .dp-sec { margin-top: 32px; border-top: 1px solid var(--ad-line); }
        .dp-sec + .dp-sec { margin-top: 16px; }
        .dp-sec .dp-h { margin-top: 20px; }
        .dp-list { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 10.5px; }
        .dp-list li { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--ad-ink); }
        .dp-list i { width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; display: grid; place-items: center; background: var(--ad-lilac); color: #6657f5; font-style: normal; font-size: 11px; font-weight: 800; }
        .dp-act { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 14px; padding-bottom: 18px; border-bottom: 1px solid var(--ad-line); }
        .dp-act .ad-btn { height: 40px; padding: 0 15px; }
        .dp-act .ad-btn--primary { background: #6757f5; box-shadow: none; }
        .dp-act .ad-btn--ghost { border-color: var(--ad-line-2); }
        @media (max-width: 480px) { .dp-act .ad-btn { flex: 1; } }
      `}</style>
    </div>
  );
}
