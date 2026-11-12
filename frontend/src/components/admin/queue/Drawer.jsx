"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Right side panel (Figma: "Decision workspace" / "Shipment").
 * Apna route hai — band karne par closeHref par wapas (Back ek step).
 */
export default function Drawer({ eyebrow, title, closeHref, children }) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") router.push(closeHref);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [router, closeHref]);

  return (
    <div className="qd-wrap" onClick={() => router.push(closeHref)}>
      <aside className="qd" role="dialog" aria-label={typeof title === "string" ? title : eyebrow} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="qd-x" onClick={() => router.push(closeHref)} aria-label="Close">
          ✕
        </button>
        <p className="qd-eye">{eyebrow}</p>
        <h2 className="qd-title">{title}</h2>
        {children}
      </aside>
      <style>{`
        .qd-wrap { position: fixed; inset: 0; z-index: 90; background: rgba(28,38,66,.42); animation: adFade .15s ease; }
        .qd {
          position: absolute; right: 0; top: 0; bottom: 0; width: min(560px, 100%); overflow-y: auto;
          padding: 30px 30px 40px; background: #fff; box-shadow: -20px 0 60px -30px rgba(20,33,59,.5); animation: qdIn .2s ease;
        }
        @keyframes qdIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
        .qd-x { position: absolute; right: 30px; top: 30px; width: 36px; height: 36px; border: 0; border-radius: 10px; background: var(--ad-soft); color: #65718c; font-size: 14px; }
        .qd-x:hover { background: var(--ad-lilac); color: var(--ad-primary); }
        .qd-eye { margin: 0; padding-right: 50px; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8b92aa; }
        .qd-title { margin-top: 21px; padding-right: 30px; font-family: var(--ad-head); font-size: 25px; font-weight: 800; letter-spacing: -0.9px; line-height: 1.3; color: var(--ad-ink); }
        @media (max-width: 640px) {
          .qd { padding: 22px 18px 32px; }
          .qd-x { right: 18px; top: 18px; }
          .qd-title { font-size: 22px; margin-top: 18px; }
        }
      `}</style>
    </div>
  );
}
