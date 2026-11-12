/**
 * Bounty logo — "B◎UNTY" (O ki jagah target), Cinzel font.
 * tone: "light" (dark background par cream) | "dark" (parchment par ink)
 * withTag: neeche "CREATOR UNIVERSE" line
 */
export default function Logo({ tone = "light", size = 22, withTag = false }) {
  const color = tone === "light" ? "#f3e6c8" : "#14231a";
  return (
    <span className={`bl ${withTag ? "bl--tag" : ""}`} style={{ "--bl-c": color, "--bl-s": `${size}px` }} aria-label="Bounty">
      <span className="bl-word" aria-hidden="true">
        B
        <svg viewBox="0 0 24 24" className="bl-o">
          {/* Figma target: laal + gehra hara rings */}
          <circle cx="12" cy="12.6" r="11.4" fill="#7d1510" />
          <circle cx="12" cy="12" r="11.4" fill="#e0392f" />
          <circle cx="12" cy="12" r="8.2" fill="#123524" />
          <circle cx="12" cy="12" r="5.8" fill="#e0392f" />
          <circle cx="12" cy="12" r="2.9" fill="#123524" />
          <circle cx="12" cy="12" r="1.2" fill="#ef4a3c" />
          <path d="M6.5 6.2a8 8 0 0 1 5-2.2" stroke="rgba(255,255,255,.45)" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        </svg>
        UNTY
      </span>
      {withTag && (
        <span className="bl-tag" aria-hidden="true">
          <i />
          Creator universe
          <i />
        </span>
      )}
      <style>{`
        .bl { display: inline-flex; flex-direction: column; align-items: center; color: var(--bl-c); line-height: 1; }
        /* Figma: Cinzel Bold, letter-spacing ~0.06em, target O = 0.71em */
        .bl-word { display: inline-flex; align-items: center; font-family: var(--bx-logo); font-weight: 700; font-size: var(--bl-s); line-height: 1; letter-spacing: .06em; }
        .bl-o { width: .72em; height: .72em; margin: 0 .1em 0 .06em; }
        .bl-tag { display: inline-flex; align-items: center; gap: 10px; margin-top: 9px; font-family: var(--bx-sans); font-size: 10.5px; font-weight: 500; letter-spacing: 2.9px; text-transform: uppercase; }
        .bl-tag i { width: 56px; height: 1px; background: rgba(232,176,74,.7); }
      `}</style>
    </span>
  );
}
