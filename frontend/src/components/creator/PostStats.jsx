"use client";

import { fdate, safeLink } from "@/services/creator";

const kfmt = (n) => {
  n = Number(n) || 0;
  return n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(n);
};

/** Campaign ke posts + unke numbers (purane postsHtml — views, reach, likes, comments, shares, saves) */
export default function PostStats({ m }) {
  const ps = m.posts || [];
  if (!ps.length) return null;
  return (
    <div className="pst">
      {ps.map((p, i) => {
        const s = p.stats || {};
        const rows = [
          ["👁", "Views", s.views],
          ["📈", "Reach", s.reach],
          ["❤️", "Likes", s.likes],
          ["💬", "Comments", s.comments],
          ["↗️", "Shares", s.shares],
          ["🔖", "Saves", s.saves],
        ].filter((x) => x[2] != null);
        return (
          <div key={i} className="pst-row">
            <p className="pst-h">
              <b>{p.media_type}</b> · posted {fdate(p.posted_at)}
              {p.permalink && (
                <>
                  {" "}
                  ·{" "}
                  <a href={safeLink(p.permalink)} target="_blank" rel="noopener noreferrer">
                    Open ↗
                  </a>
                </>
              )}
            </p>
            {rows.length ? (
              <div className="pst-m">
                {rows.map((x) => (
                  <div key={x[1]}>
                    <b>{kfmt(x[2])}</b>
                    <span>
                      {x[0]} {x[1]}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pst-s">Numbers appear within a few hours.</p>
            )}
          </div>
        );
      })}
      <style>{`
        .pst { display: grid; gap: 10px; margin-top: 16px; }
        .pst-row { padding: 12px 14px; border-radius: 12px; background: #fffaf0; border: 1px solid var(--bx-line); }
        .pst-h { margin: 0 0 8px; font-size: 13px; color: #14231a; }
        .pst-h a { font-weight: 700; color: #2e9c94; }
        .pst-m { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; }
        .pst-m div { padding: 8px; border-radius: 10px; background: #fbf1dc; }
        .pst-m b { display: block; font-size: 16px; }
        .pst-m span { font-size: 11px; color: var(--bx-muted); }
        .pst-s { margin: 0; font-size: 12px; color: var(--bx-muted); }
      `}</style>
    </div>
  );
}
