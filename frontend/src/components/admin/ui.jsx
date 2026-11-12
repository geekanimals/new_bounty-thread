"use client";

import Link from "next/link";

/**
 * Super Admin ke chhote common blocks (Figma mein har page par repeat hote hain):
 *  - PageHead: "GEEK OS / SUPER ADMIN" + bada title + sub + right side buttons
 *  - Stats: 5 stat cards (pehla purple gradient)
 *  - Back: "← Back" link
 */
export function PageHead({ title, sub, eyebrow = "Geek OS / Super Admin", children }) {
  return (
    <div className="ad-head ap-head">
      <div className="ap-head__txt">
        <p className="ad-eyebrow">{eyebrow}</p>
        <h1 className="ad-h1">{title}</h1>
        {sub && <p className="ad-sub">{sub}</p>}
      </div>
      {children && <div className="ap-head__act">{children}</div>}
      <style>{`
        .ap-head { margin-bottom: 24px; }
        .ap-head .ad-eyebrow { margin-bottom: 10px; }
        .ap-head .ad-sub { margin-top: 7px; }
        .ap-head__txt { min-width: 0; flex: 1 1 420px; }
        .ap-head__act { display: flex; gap: 10px; flex-wrap: wrap; padding-top: 0; }
        .ap-head__act .ad-btn { height: 42px; padding: 0 17px; }
        @media (max-width: 640px) {
          .ap-head__act { width: 100%; padding-top: 0; }
          .ap-head__act > * { flex: 1; }
        }
      `}</style>
    </div>
  );
}

export function Stats({ items }) {
  return (
    <div className="ap-stats">
      {items.map((s, i) => {
        const inner = (
          <>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
            {s.note && <small>{s.note}</small>}
          </>
        );
        return s.href ? (
          <Link key={i} href={s.href} className={`ap-stat ${i === 0 ? "ap-stat--hero" : ""}`}>
            {inner}
          </Link>
        ) : (
          <div key={i} className={`ap-stat ${i === 0 ? "ap-stat--hero" : ""}`}>
            {inner}
          </div>
        );
      })}
      <style>{`
        .ap-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 13px; margin-bottom: 23px; }
        .ap-stat {
          display: flex; flex-direction: column; min-height: 120px; padding: 23px 19px 18px; border-radius: 18px;
          background: #fff; border: 1px solid var(--ad-line); box-shadow: 0 8px 24px rgba(30,37,73,.02); transition: transform .15s, box-shadow .15s;
        }
        a.ap-stat:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -18px rgba(30,37,73,.35); }
        .ap-stat strong { font-family: var(--ad-head); font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1.15; color: var(--ad-ink); }
        .ap-stat span { margin-top: 12px; font-size: 12px; color: var(--ad-muted); }
        .ap-stat small { margin-top: 6px; font-size: 11px; color: var(--ad-faint); }
        .ap-stat--hero { background: var(--ad-grad); border-color: transparent; box-shadow: 0 8px 24px rgba(30,37,73,.02); }
        .ap-stat--hero strong { color: #fff; }
        .ap-stat--hero span, .ap-stat--hero small { color: #e4ddff; }
        @media (max-width: 1180px) { .ap-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .ap-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .ap-stat { min-height: 104px; padding: 16px 14px; }
          .ap-stat:first-child { grid-column: 1 / -1; }
          .ap-stat strong { font-size: 24px; }
        }
      `}</style>
    </div>
  );
}

export function Back({ href, children = "Back" }) {
  return (
    <Link href={href} className="ap-back">
      ← {children}
      <style>{`
        .ap-back { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 14px; font-size: 13px; font-weight: 800; color: var(--ad-primary-ink); }
        .ap-back:hover { color: var(--ad-primary); }
      `}</style>
    </Link>
  );
}
