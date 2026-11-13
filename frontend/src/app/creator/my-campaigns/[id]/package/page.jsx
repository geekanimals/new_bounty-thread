"use client";

import { useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creator/BountyShell";
import TrackerFrame, { useTracker, TrackerWait, StepMismatch } from "@/components/creator/TrackerSteps";
import { fdt, safeLink, markReceived } from "@/services/creator";
import { Truck, Check } from "@/components/ui/Icons";

/**
 * /creator/my-campaigns/[id]/package — purane "Your product is on the way" card jaisa:
 * address confirm → packing, product_sent → courier + tracking (Track parcel), "📦 Received" → api.creator_mark_received
 * (video brief khulta hai, deadline shuru).
 */
export default function PackageStep() {
  const t = useTracker();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  if (!t.m)
    return (
      <BountyShell>
        <TrackerWait t={t} />
      </BountyShell>
    );
  const { c, m } = t;
  const sh = m.shipment || {};
  const st = m.steps || {};
  const onStep = t.step === "package";
  const delivered = sh.status === "delivered";
  const shipped = m.stage === "product_sent" || !!sh.shipped_at;

  // timeline (purane journey ke timestamps)
  const rows = [
    { label: "Address confirmed", time: st.address_confirmed, on: true },
    { label: `Shipped${sh.courier ? " · " + sh.courier : ""}${sh.tracking_ref ? " #" + sh.tracking_ref : ""}`, time: sh.shipped_at || st.product_sent, on: shipped },
    { label: sh.status === "failed" ? "⚠️ Delivery failed — our team is on it" : "Delivered", time: sh.delivered_at, on: delivered || sh.status === "failed" },
  ];

  const received = async () => {
    if (!window.confirm("Confirm you've received the product? Your video brief unlocks now and your deadline starts.")) return;
    setBusy(true);
    setErr("");
    const r = await markReceived(m.participation_id);
    setBusy(false);
    if (r.error) return setErr(r.error.message || String(r.error));
    t.reload();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sh.tracking_ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  const trackUrl = sh.tracking_url
    ? safeLink(sh.tracking_url)
    : sh.tracking_ref
    ? `https://www.google.com/search?q=${encodeURIComponent((sh.courier || "courier") + " tracking " + sh.tracking_ref)}`
    : null;

  const body = () => {
    if (!onStep) return <StepMismatch t={t} />;
    if (!shipped)
      return (
        <>
          <span className="ts-ic">📦</span>
          <h2>Your product is being packed</h2>
          <p>
            The courier and tracking number show here the moment it ships. Your <b>video brief</b> is ready — read it now and start planning your video; the deadline starts once
            the parcel reaches you.
          </p>
          {m.video_brief && (
            <Link href={`${t.base}#brief`} className="bx-btn bx-btn--ghost">
              📖 Read brief
            </Link>
          )}
        </>
      );
    return (
      <>
        <span className="ts-ic">
          <Truck size={18} />
        </span>
        <h2>{delivered ? "Delivered" : "Your package is on the way"}</h2>
        <ul className="pk-ship">
          {rows.map((x) => (
            <li key={x.label} className={x.on ? "is-on" : ""}>
              <i />
              <span>
                <strong>{x.label}</strong>
                <small>{x.time ? fdt(x.time) : x.on ? "" : "Waiting"}</small>
              </span>
            </li>
          ))}
        </ul>
        {sh.tracking_ref && (
          <p className="pk-small">
            Tracking no. <b>{sh.tracking_ref}</b>{" "}
            <button type="button" className="pk-copy" onClick={copy}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </p>
        )}
        {delivered ? (
          <p className="pk-small">Your video brief is on its way to you.</p>
        ) : (
          <p className="pk-small">Tap Track — paste the tracking number on the courier page if it asks. Got the parcel? Tap Received and your video brief opens.</p>
        )}
        <div className="pk-btns">
          {trackUrl && !delivered && (
            <a className="bx-btn bx-btn--ghost" href={trackUrl} target="_blank" rel="noopener noreferrer" onClick={() => sh.tracking_ref && navigator.clipboard?.writeText(sh.tracking_ref).catch(() => {})}>
              🔎 Track parcel ↗
            </a>
          )}
          {!delivered && (
            <button type="button" className="bx-btn bx-btn--dark" disabled={busy} onClick={received}>
              <Check size={14} /> {busy ? "…" : "Received"}
            </button>
          )}
        </div>
        {err && <p className="ts-err">{err}</p>}
      </>
    );
  };

  return (
    <BountyShell>
      <title>{`Track package — ${c.title} — Bounty`}</title>
      <TrackerFrame t={t} step={onStep ? "package" : undefined}>
        {body()}
      </TrackerFrame>
      <style>{`
        .pk-ship { list-style: none; margin: 12px 0 14px; padding: 0; }
        .pk-ship li { position: relative; display: flex; gap: 12px; padding-bottom: 14px; }
        .pk-ship li::before { content: ""; position: absolute; left: 6px; top: 16px; bottom: 0; width: 2px; background: #e2d3b0; }
        .pk-ship li:last-child::before { display: none; }
        .pk-ship i { position: relative; z-index: 1; width: 14px; height: 14px; margin-top: 2px; border-radius: 50%; border: 2px solid #d3c19a; background: #fffaf0; flex-shrink: 0; }
        .pk-ship li.is-on i { border-color: var(--bx-teal); background: var(--bx-teal); }
        .pk-ship strong { display: block; font-size: 13.5px; overflow-wrap: anywhere; }
        .pk-ship small { font-size: 12px; color: var(--bx-muted); }
        .pk-small { margin: 0 0 12px; font-size: 12.5px; color: var(--bx-text); }
        .pk-copy { border: 1px solid var(--bx-line); border-radius: 999px; background: #fffaf0; padding: 2px 9px; font: inherit; font-size: 11.5px; font-weight: 700; cursor: pointer; }
        .pk-btns { display: flex; gap: 10px; flex-wrap: wrap; }
      `}</style>
    </BountyShell>
  );
}
