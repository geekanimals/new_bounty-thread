"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Ek line mein jitne fit hon utne dikhao, baaki "Load more" se (har click par 2 line aur).
 * items: array · render(item, i) → element (key ke saath) · min: card ki kam se kam chaudai (px)
 */
export default function MoreGrid({ items, render, min = 160, gap = 12, step = 2, className = "", empty = null, all = false }) {
  const ref = useRef(null);
  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setCols(Math.max(1, Math.floor((e.contentRect.width + gap) / (min + gap)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [min, gap]);
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return empty;
  const shown = all ? list.length : cols ? cols * rows : Math.min(list.length, 4);
  const left = list.length - shown;
  return (
    <>
      <div ref={ref} className={`mg-grid ${className}`} style={{ display: "grid", gap, gridTemplateColumns: cols ? `repeat(${cols}, minmax(0, 1fr))` : `repeat(auto-fill, minmax(${min}px, 1fr))` }}>
        {list.slice(0, shown).map(render)}
      </div>
      {(left > 0 || rows > 1) && (
        <div className="mg-more">
          {left > 0 && (
            <button type="button" onClick={() => setRows((r) => r + step)}>
              Load more <span>· {left} more</span>
            </button>
          )}
          {left <= 0 && rows > 1 && (
            <button type="button" onClick={() => setRows(1)}>
              Show less
            </button>
          )}
        </div>
      )}
      <style>{`
        .mg-more { display: flex; justify-content: center; margin-top: 14px; }
        .mg-more button { padding: 9px 20px; border-radius: 999px; border: 1px solid var(--bx-line, #e3d6b8); background: #fffaf0; color: #14231a; font-size: 13px; font-weight: 700; cursor: pointer; }
        .mg-more button:hover { background: #123524; border-color: #123524; color: #fbf3e2; }
        .mg-more span { font-weight: 500; opacity: .7; }
        @media print { .mg-more { display: none; } }
      `}</style>
    </>
  );
}
