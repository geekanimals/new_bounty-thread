"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * "Not eligible" card se aaye creator ko seedha woh field dikhao jo bharni hai.
 * URL: ?focus=<element id>&back=/creator/discover/<id>
 *  - focus → us field tak scroll, focus, 2.5s highlight
 *  - back  → neeche "← Back to the campaign" (sirf /creator/... wapas)
 */
export default function FieldFocus() {
  const [back, setBack] = useState("");
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const b = sp.get("back") || "";
    if (/^\/creator\//.test(b)) setTimeout(() => setBack(b), 0);
    const id = sp.get("focus");
    if (!id) return;
    let tries = 0;
    const t = setInterval(() => {
      const el = document.getElementById(id);
      tries++;
      if (!el && tries < 30) return;
      clearInterval(t);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      try {
        el.focus({ preventScroll: true });
      } catch {}
      el.classList.add("ff-hl");
      setTimeout(() => el.classList.remove("ff-hl"), 2600);
    }, 120);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      {back && (
        <Link href={back} className="ff-back">
          ← Back to the campaign — check again
        </Link>
      )}
      <style>{`
        .ff-hl { outline: 3px solid #e8b04a !important; outline-offset: 3px; border-radius: 10px; transition: outline-color .3s; }
        .ff-back { position: fixed; left: 50%; bottom: 18px; z-index: 60; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 6px; padding: 11px 18px; border-radius: 999px; background: #1b2a20; color: #fbf1dc; font-size: 13.5px; font-weight: 700; box-shadow: 0 10px 28px -10px rgba(0,0,0,.5); white-space: nowrap; }
      `}</style>
    </>
  );
}
