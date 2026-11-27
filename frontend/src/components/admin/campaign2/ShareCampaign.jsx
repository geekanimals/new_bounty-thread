"use client";

import { useEffect, useRef, useState } from "react";
import { rpc, errText } from "@/lib/supabase";

/**
 * 🔗 Share — har campaign page par. Public brief ka link (/creator/explore/<campaign_id>):
 * koi bhi bina login dekh sakta hai; Apply dabane par login (WhatsApp verify) → wapas yahi campaign.
 */
export default function ShareCampaign({ id }) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = async () => {
    const nx = !open;
    setOpen(nx);
    if (!nx || info) return;
    setErr("");
    const r = await rpc("admin", "api.campaign_share_info", { p_campaign: id });
    if (r.error) setErr(errText(r.error));
    else setInfo(r.data || {});
  };
  const url = info && info.campaign_id ? `${typeof window !== "undefined" ? window.location.origin : ""}/creator/explore/${info.campaign_id}` : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard band — link dikh raha hai, haath se copy */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const waText = info ? `${info.name || "Campaign"} — see the brief and apply on Geek OS: ${url}` : "";

  return (
    <span className="shc" ref={box}>
      <button type="button" className="ga-btn ga-btn--ghost shc-btn" onClick={toggle} aria-expanded={open}>
        🔗 Share
      </button>
      {open && (
        <div className="shc-pop" role="dialog" aria-label="Share campaign">
          <b>Share this campaign</b>
          <small>Anyone with the link can see the brief — no login. They log in only to apply.</small>
          {err && <p className="shc-err">{err}</p>}
          {!info && !err && <p className="shc-mute">Getting the link…</p>}
          {info && (
            <>
              {!info.public && (
                <p className="shc-warn">
                  ⚠️ Guests can’t see it right now — {info.why_hidden || "it isn’t open"}. The link starts working once the campaign is live and taking applications.
                </p>
              )}
              <div className="shc-row">
                <input className="ga-input" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Public link" />
                <button type="button" className="ga-btn ga-btn--primary" onClick={copy}>
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              {info.via_link && (
                <p className="shc-stat">
                  📈 Applied through this link: <b>{info.via_link.applied || 0}</b>
                  {info.via_link.from_ads ? <> · from Instagram / Facebook ads: <b>{info.via_link.from_ads}</b></> : null}
                </p>
              )}
              <div className="shc-acts">
                <a className="ga-btn ga-btn--ghost ga-btn--sm" href={url} target="_blank" rel="noopener noreferrer">
                  ↗ Open as a guest
                </a>
                <a className="ga-btn ga-btn--ghost ga-btn--sm" href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer">
                  🟢 Share on WhatsApp
                </a>
              </div>
            </>
          )}
        </div>
      )}
      <style>{`
        .shc { position: relative; display: inline-flex; }
        .shc-pop { position: absolute; right: 0; top: calc(100% + 8px); z-index: 60; width: 380px; max-width: 86vw; padding: 14px; border-radius: 14px; border: 1px solid var(--ad-line); background: #fff; box-shadow: 0 18px 40px rgba(30, 34, 80, .14); text-align: left; }
        .shc-pop > b { display: block; font-size: 14px; color: var(--ad-ink); }
        .shc-pop > small { display: block; margin-top: 3px; font-size: 12px; line-height: 1.4; color: var(--ad-muted); }
        .shc-row { display: flex; gap: 8px; margin-top: 10px; }
        .shc-row .ga-input { flex: 1; min-width: 0; height: 38px; font-size: 12px; }
        .shc-row .ga-btn { height: 38px; padding: 0 14px; }
        .shc-acts { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .shc-warn { margin-top: 10px; padding: 8px 10px; border-radius: 10px; background: #fff7e8; font-size: 12px; line-height: 1.4; color: #7a4b00; }
        .shc-err { margin-top: 10px; font-size: 12px; color: #d4493f; }
        .shc-stat { margin-top: 10px; font-size: 12px; color: var(--ad-ink); }
        .shc-mute { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
      `}</style>
    </span>
  );
}
