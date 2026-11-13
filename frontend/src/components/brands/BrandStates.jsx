"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gradFor, initials } from "@/services/brand";

/**
 * Brand pages ke common states — Figma ke card style mein:
 *  BrLoading (skeleton), BrEmpty (khali), BrError (error + "Try again"), useToast (chhota message neeche)
 */

/** Loading skeleton — `rows` patti, ya `cards` grid */
export function BrLoading({ rows = 3, cards = 0, label = "Loading…" }) {
  return (
    <div className="bst-load" role="status" aria-label={label}>
      {cards ? (
        <div className="bst-cards">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="br-card bst-card">
              <i />
              <i />
              <i />
            </div>
          ))}
        </div>
      ) : (
        <div className="br-card bst-rows">
          {Array.from({ length: rows }).map((_, i) => (
            <i key={i} />
          ))}
        </div>
      )}
      <style>{`
        .bst-rows { padding: 18px; display: grid; gap: 12px; }
        .bst-rows i, .bst-card i { display: block; height: 14px; border-radius: 8px; background: linear-gradient(90deg, #eef0f6 0%, #f7f8fb 50%, #eef0f6 100%); background-size: 200% 100%; animation: bstSh 1.2s infinite linear; }
        .bst-rows i:nth-child(2n) { width: 72%; }
        .bst-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
        .bst-card { padding: 18px; display: grid; gap: 10px; }
        .bst-card i:first-child { height: 28px; width: 40%; }
        .bst-card i:last-child { width: 60%; }
        @keyframes bstSh { from { background-position: 200% 0; } to { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}

/** Khali state — title + text + (optional) action */
export function BrEmpty({ title, text, children }) {
  return (
    <div className="br-card bst-empty">
      {title && <strong>{title}</strong>}
      {text && <p>{text}</p>}
      {children}
      <style>{`
        .bst-empty { padding: 28px 22px; text-align: center; display: grid; justify-items: center; gap: 8px; }
        .bst-empty strong { font-size: 15px; font-weight: 800; }
        .bst-empty p { margin: 0; max-width: 460px; font-size: 13px; line-height: 1.55; color: var(--br-muted); }
      `}</style>
    </div>
  );
}

/** Error state — message + "Try again" */
export function BrError({ error, onRetry }) {
  return (
    <div className="br-card bst-err" role="alert">
      <strong>Something went wrong</strong>
      <p>{String(error || "Couldn't load this. Try again.")}</p>
      {onRetry && (
        <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={onRetry}>
          Try again
        </button>
      )}
      <style>{`
        .bst-err { padding: 22px; display: grid; justify-items: start; gap: 8px; border-color: #f5c2c4; }
        .bst-err strong { font-size: 14px; font-weight: 800; color: var(--br-red); }
        .bst-err p { margin: 0; font-size: 13px; color: var(--br-text); overflow-wrap: anywhere; }
      `}</style>
    </div>
  );
}

/** Toast — const [toast, say] = useToast(); say("Saved ✓"); … {toast} JSX mein rakho */
export function useToast(ms = 2800) {
  const [msg, setMsg] = useState("");
  const t = useRef(null);
  const say = useCallback(
    (m) => {
      setMsg(String(m || ""));
      clearTimeout(t.current);
      t.current = setTimeout(() => setMsg(""), ms);
    },
    [ms]
  );
  useEffect(() => () => clearTimeout(t.current), []);
  const el = msg ? (
    <div className="br-toast" role="status">
      {msg}
    </div>
  ) : null;
  return [el, say];
}

/**
 * Creator / user avatar — Figma ka br-av (gradient + initials), photo ho to upar (photo toot jaaye to initials hi).
 * cls = "br-av--lg" / "br-av--sm" (layout.jsx ke size)
 */
export function BrAvatar({ name, src, cls = "", grad, initials: ini }) {
  const [bad, setBad] = useState(false);
  const letters = ini || initials(name);
  const bg = grad || gradFor(name);
  return (
    <span className={`br-av ${cls}`} style={{ background: bg, position: "relative", overflow: "hidden" }}>
      {letters}
      {src && !bad && (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBad(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </span>
  );
}
