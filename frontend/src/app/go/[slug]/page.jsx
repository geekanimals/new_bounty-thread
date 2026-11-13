"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { rpc, visitorId, deviceKind } from "@/lib/supabasePublic";

/**
 * /go/<slug> — creator ka offer link (brand ka discount code + shop link).
 * Click / copy / shop teeno count hote hain (track_open). Live app ke go.html jaisa.
 */
export default function OfferLink() {
  const { slug = "" } = useParams();
  const [st, setSt] = useState({ phase: "load" }); // load | redirect | code | fail
  const [copied, setCopied] = useState(false);
  const counted = useRef(false);

  const call = (kind) => {
    const ua = navigator.userAgent;
    let ref = "";
    try {
      ref = document.referrer ? new URL(document.referrer).hostname : /Instagram/i.test(ua) ? "instagram app" : /FBAN|FBAV/i.test(ua) ? "facebook app" : "";
    } catch {
      /* ignore */
    }
    return rpc("track_open", { p_slug: slug, p_kind: kind, p_visitor: visitorId(), p_device: deviceKind(), p_ref: ref }, { keepalive: true });
  };

  useEffect(() => {
    if (!/^[a-z0-9]{5,16}$/i.test(slug)) return setSt({ phase: "fail" });
    call("click")
      .then((d) => {
        if (!d || !d.ok) return setSt({ phase: "fail" });
        let dest = d.dest && /^https?:\/\//i.test(d.dest) ? d.dest : "";
        // brand ka link + UTM tags + Shopify par code apne aap lag jaye
        try {
          if (dest) {
            let u = new URL(dest);
            if (d.utm && !u.searchParams.has("utm_source")) {
              u.searchParams.set("utm_source", "geek");
              u.searchParams.set("utm_medium", "influencer");
              if (d.utm_campaign) u.searchParams.set("utm_campaign", d.utm_campaign);
              if (d.creator) u.searchParams.set("utm_content", d.creator);
            }
            if (d.shopify_code && d.code && !/\/discount\//i.test(u.pathname)) {
              const w = new URL(u.origin + "/discount/" + encodeURIComponent(d.code));
              w.searchParams.set("redirect", (u.pathname || "/") + u.search);
              u = w;
            }
            dest = u.toString();
          }
        } catch {
          /* ignore */
        }
        if (!d.code) {
          if (!dest) return setSt({ phase: "fail", msg: "The shop link isn’t set yet — please try again later." });
          setSt({ phase: "redirect", brand: d.brand });
          window.location.replace(dest);
          return;
        }
        setSt({ phase: "code", ...d, dest });
      })
      .catch(() => setSt({ phase: "fail", msg: "Couldn’t open the offer — check your internet and try again." }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const copy = () => {
    const done = () => setCopied(true);
    try {
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(st.code).then(done, done);
      else done();
    } catch {
      done();
    }
    if (!counted.current) {
      counted.current = true;
      call("copy").catch(() => {});
    }
  };
  const shop = (e, withCopy) => {
    e.preventDefault();
    if (withCopy) copy();
    call("shop").catch(() => {});
    setTimeout(() => window.location.replace(st.dest), withCopy ? 350 : 200);
  };

  return (
    <main className="go">
      <div className="go-box">
        {st.phase === "load" && (
          <>
            <span className="go-spin" aria-hidden="true" />
            <p className="go-sub">Opening your offer…</p>
          </>
        )}
        {st.phase === "redirect" && (
          <>
            <span className="go-spin" aria-hidden="true" />
            <p className="go-sub">Taking you to {st.brand || "the shop"}…</p>
          </>
        )}
        {st.phase === "fail" && (
          <>
            <h1>Link not found</h1>
            <p className="go-sub">{st.msg || "This link isn’t active any more."}</p>
          </>
        )}
        {st.phase === "code" && (
          <>
            {st.brand && <p className="go-brand">{st.brand}</p>}
            <h1>{st.discount || "Your discount code"}</h1>
            <p className="go-sub">
              {st.creator ? `From @${st.creator} · ` : ""}use this code at checkout
            </p>
            <button type="button" className="go-code" onClick={copy} title="Tap to copy">
              <b>{st.code}</b>
              <span className={copied ? "is-ok" : ""}>{copied ? "✓ COPIED" : "TAP TO COPY"}</span>
            </button>
            {st.dest ? (
              <>
                <button type="button" className="go-btn" onClick={(e) => shop(e, true)}>
                  Copy code &amp; shop now →
                </button>
                <a className="go-skip" href={st.dest} onClick={(e) => shop(e, false)}>
                  Continue without copying
                </a>
              </>
            ) : (
              <p className="go-sub">Use it on {st.brand || "the brand"}’s website or app.</p>
            )}
            <p className="go-by">Offer shared by your creator · Geek</p>
          </>
        )}
      </div>
      <style>{`
        .go { min-height: 100vh; display: grid; place-items: center; padding: 24px 20px; background: #fcfdef; color: #23251a; }
        .go-box { width: min(420px, 100%); padding: 34px 26px; border-radius: 24px; background: #fff; border: 1px solid #e6e8d3; box-shadow: 0 24px 50px -34px rgba(35,37,26,.45); text-align: center; }
        .go-brand { margin: 0 0 6px; font-size: 12px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #5d6b2e; }
        .go h1 { margin: 0; font-family: var(--font-serif), Georgia, serif; font-size: 38px; font-weight: 500; line-height: 1.1; }
        .go-sub { margin: 10px 0 0; font-size: 14.5px; color: #6b6d5c; }
        .go-code { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 100%; margin-top: 22px; padding: 18px 12px; border-radius: 16px; border: 2px dashed #b7bd8f; background: #f7f8e6; cursor: pointer; font: inherit; color: inherit; }
        .go-code b { font-size: 28px; font-weight: 700; letter-spacing: 3px; word-break: break-all; }
        .go-code span { font-size: 11px; font-weight: 700; letter-spacing: 1.4px; color: #6b6d5c; }
        .go-code span.is-ok { color: #2f7a3e; }
        .go-btn { width: 100%; height: 50px; margin-top: 16px; border: 0; border-radius: 999px; background: #33381f; color: #fcfdef; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
        .go-btn:hover { filter: brightness(1.15); }
        .go-skip { display: inline-block; margin-top: 14px; font-size: 13px; font-weight: 600; color: #5d6b2e; }
        .go-by { margin: 22px 0 0; font-size: 12px; color: #9a9c86; }
        .go-spin { display: inline-block; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #e3e5cf; border-top-color: #5d6b2e; animation: goSpin .8s linear infinite; }
        @keyframes goSpin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
