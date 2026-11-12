"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Right side panel (Figma: brand detail 820px, new chat 620px).
 * Peeche wala page halka dikhta hai; ✕ / bahar click / Esc → closeHref.
 * Mobile par poori screen.
 */
export default function Drawer({ closeHref, width = 820, label, children }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && router.push(closeHref);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [closeHref, router]);

  return (
    <div className="dr-wrap" onClick={() => router.push(closeHref)}>
      <aside className="dr" style={{ "--dr-w": `${width}px` }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={label}>
        <button type="button" className="dr-x" onClick={() => router.push(closeHref)} aria-label="Close">
          ✕
        </button>
        {children}
      </aside>
      <style>{`
        .dr-wrap { position: fixed; inset: 0; z-index: 80; background: rgba(20,33,59,.42); animation: adFade .15s ease; }
        .dr {
          position: absolute; right: 0; top: 0; bottom: 0; width: min(var(--dr-w), 100%); overflow-y: auto;
          padding: 30px 30px 40px; background: #fff; box-shadow: -20px 0 60px -30px rgba(20,33,59,.5); animation: drIn .2s ease;
        }
        @keyframes drIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
        .dr-x {
          position: absolute; right: 30px; top: 30px; z-index: 2; width: 36px; height: 36px; border: 0; border-radius: 10px;
          background: var(--ad-soft); color: var(--ad-muted-2); font-size: 14px;
        }
        .dr-x:hover { background: var(--ad-lilac); color: var(--ad-primary); }
        @media (max-width: 640px) {
          .dr { padding: 20px 16px 32px; }
          .dr-x { right: 14px; top: 16px; }
        }
      `}</style>
    </div>
  );
}
