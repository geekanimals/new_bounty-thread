"use client";

import { useEffect, useState } from "react";

/**
 * WhatsApp / Instagram / Facebook ke andar wala browser (in-app) → creator ka apna browser (Chrome / Safari).
 * Wahan pehle se login (Bounty + Instagram) hota hai, isliye Instagram connect par sirf "Allow" aata hai.
 *  Android: ek baar apne aap default browser mein khulta hai (intent link), na khule to neeche button.
 *  iPhone: "Open in Safari" button (x-safari link, iOS 17+).
 * Normal browser mein kuch nahi dikhta.
 */
const IN_APP = /WhatsApp|FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|; wv\)/i;

export function inAppBrowser() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (!IN_APP.test(ua)) return null;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return null;
}

export function browserUrl(kind, href = window.location.href) {
  const u = new URL(href);
  if (kind === "android") {
    return `intent://${u.host}${u.pathname}${u.search}${u.hash}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${encodeURIComponent(href)};end`;
  }
  return "x-safari-" + href;
}

export default function OpenInBrowser() {
  const [kind, setKind] = useState(null);
  useEffect(() => {
    const k = inAppBrowser();
    setKind(k);
    if (k === "android") {
      try {
        if (!window.sessionStorage.getItem("bx_open_browser")) {
          window.sessionStorage.setItem("bx_open_browser", "1");
          window.location.href = browserUrl(k);
        }
      } catch {
        /* ignore */
      }
    }
  }, []);
  if (!kind) return null;
  return (
    <div className="bx-oib" role="note">
      <span>For the best experience, open Bounty in your {kind === "ios" ? "Safari" : "browser"}.</span>
      <a href={browserUrl(kind)}>Open in {kind === "ios" ? "Safari" : "browser"}</a>
      <style>{`
        .bx-oib{position:sticky;top:0;z-index:60;display:flex;gap:10px;align-items:center;justify-content:space-between;
          padding:10px 14px;background:var(--bx-green,#123524);color:var(--bx-cream,#fbf3e2);font-size:13px;line-height:1.35}
        .bx-oib a{flex:none;padding:7px 12px;border-radius:999px;background:var(--bx-gold,#e8b04a);color:var(--bx-ink,#14231a);
          font-weight:700;text-decoration:none;white-space:nowrap}
      `}</style>
    </div>
  );
}
