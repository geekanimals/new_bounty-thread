"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { rpc, visitorId, deviceKind } from "@/lib/supabasePublic";

/**
 * /s/<slug> — WhatsApp / email messages ka short link.
 * Click count karta hai (msg_link_open), phir asli page par bhej deta hai. Live app ke s.html jaisa.
 */
export default function ShortLink() {
  const { slug = "" } = useParams();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!/^[a-z0-9-]{3,40}$/i.test(slug)) return setFailed(true);
    let done = false;
    const timer = setTimeout(() => !done && setFailed(true), 9000);
    const sp = new URLSearchParams(window.location.search);
    let ref = sp.get("r") || "";
    try {
      if (!ref && document.referrer) {
        const rh = new URL(document.referrer).hostname;
        if (rh !== window.location.hostname) ref = rh;
      }
    } catch {
      /* ignore */
    }
    // location ka andaaza — 1.2 sec se zyada wait nahi, link fast rahe
    const geo = Promise.race([
      fetch("/api/geo", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({})),
      new Promise((res) => setTimeout(() => res({}), 1200)),
    ]);
    geo
      .then((g) =>
        rpc(
          "msg_link_open",
          {
            p_slug: slug,
            p_visitor: visitorId(),
            p_device: deviceKind(),
            p_ua: navigator.userAgent,
            p_ref: ref,
            p_city: g?.city || null,
            p_region: g?.region || null,
            p_country: g?.country || null,
          },
          { keepalive: true }
        )
      )
      .then((d) => {
        done = true;
        clearTimeout(timer);
        if (!d || !d.ok || !/^https?:\/\//i.test(d.dest || "")) return setFailed(true);
        window.location.replace(d.dest);
      })
      .catch(() => {
        done = true;
        clearTimeout(timer);
        setFailed(true);
      });
    return () => clearTimeout(timer);
  }, [slug]);

  return (
    <main className="pl">
      <div className="pl-box">
        {failed ? (
          <>
            <h1>Link not found</h1>
            <p>This link isn’t active any more.</p>
            <a href="/" className="pl-btn">
              Open Geek
            </a>
          </>
        ) : (
          <>
            <span className="pl-spin" aria-hidden="true" />
            <p>Opening your link…</p>
          </>
        )}
      </div>
      <style>{`
        .pl { min-height: 100vh; display: grid; place-items: center; padding: 24px 20px; background: #fcfdef; color: #23251a; }
        .pl-box { width: min(420px, 100%); text-align: center; }
        .pl h1 { margin: 0 0 8px; font-family: var(--font-serif), Georgia, serif; font-size: 40px; font-weight: 500; }
        .pl p { margin: 0; font-size: 15px; color: #6b6d5c; }
        .pl-btn { display: inline-flex; margin-top: 20px; height: 44px; align-items: center; padding: 0 22px; border-radius: 999px; background: #33381f; color: #fcfdef; font-weight: 600; text-decoration: none; }
        .pl-spin { display: inline-block; width: 34px; height: 34px; margin-bottom: 14px; border-radius: 50%; border: 3px solid #e3e5cf; border-top-color: #5d6b2e; animation: plSpin .8s linear infinite; }
        @keyframes plSpin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
