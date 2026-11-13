"use client";

import { useState } from "react";
import { act, errText, who, short, ago, fmtDate } from "@/components/admin/queue/live";
import { safeUrl } from "@/lib/supabasePublic";
import IgImg from "@/lib/igFresh";

/**
 * Drawer ke andar group ke records — har creator par wahi button jo purane Approvals page par the:
 *  applicants → Approve / Decline · review → Watch / Approve video / Ask changes · ship → Add courier
 *  deliver → Mark delivered · contract → Send contract · blocked/overdue → Call
 */
export default function QueueRecords({ group, ask, toast, onDone }) {
  const [busy, setBusy] = useState("");
  const [gone, setGone] = useState([]);
  const [ship, setShip] = useState(null); // courier form wala record

  const run = async (key, fn, okMsg) => {
    setBusy(key);
    const { error } = await fn();
    setBusy("");
    if (error) return toast(errText(error), true);
    toast(okMsg);
    setGone((g) => [...g, key]);
    onDone && onDone();
  };

  const decline = async (x) => {
    const pick = await ask("Why are you declining this creator?");
    if (!pick) return;
    const k = x.participation_id || x.id;
    run(k, () => (x._legacy ? act.declineLegacy(x.id, pick) : act.declineApplicant(x.participation_id, pick)), `${x._legacy ? x.creator_name : who(x.creator)} declined — message sent`);
  };
  const changes = async (x) => {
    const pick = await ask("Ask for changes", { mode: "text", label: "What should they change?", placeholder: "Show the box logo in the first 3 seconds; add #ad at the start of the caption", hint: "The creator gets this on the app, WhatsApp and email, and resubmits.", cta: "Send to creator" });
    if (!pick) return;
    run(x.participation_id, () => act.changesVideo(x.participation_id, pick.note), "Changes requested — creator notified");
  };

  const list = group.items.filter((x) => !gone.includes(x.participation_id || x.id));

  return (
    <div className="qr">
      <h3 className="qr-h">
        Records <span className="ga-count">{list.length}</span>
      </h3>
      {!list.length && <p className="qr-empty">All done here ✓</p>}
      <ul className="qr-list">
        {list.map((x) => {
          const k = x.participation_id || x.id;
          const c = x.creator || {};
          const name = x._legacy ? x.creator_name || "Creator" : who(c);
          const sub = x._legacy
            ? "Marketplace application"
            : [c.followers != null ? `${short(c.followers)} followers` : "", c.engagement != null ? `${c.engagement}% eng.` : "", c.city, x.due_on ? `due ${fmtDate(x.due_on)}` : "", ago(x.applied_at || x.since)].filter(Boolean).join(" · ");
          return (
            <li key={k} className="qr-row">
              <IgImg className="qr-pic" handle={c.username || c.handle} src={c.profile_picture_url ? safeUrl(c.profile_picture_url) : ""} fallback={<span className="ga-av qr-pic">{(name.replace("@", "") || "?").slice(0, 2).toUpperCase()}</span>} />
              <div className="qr-main">
                <p className="qr-name">
                  {c.username ? (
                    <a href={`https://instagram.com/${encodeURIComponent(c.username)}`} target="_blank" rel="noopener noreferrer">
                      {name}
                    </a>
                  ) : (
                    name
                  )}
                  {x.applied_profile && c.username && x.applied_profile.toLowerCase() !== c.username.toLowerCase() && <span className="ga-badge qr-via">via @{x.applied_profile}</span>}
                </p>
                <p className="qr-sub">{sub || "Instagram not connected"}</p>
              </div>
              <div className="qr-act">
                {group.f === "applications" && (
                  <>
                    <button type="button" className="qr-text" disabled={busy === k} onClick={() => decline(x)}>
                      Decline
                    </button>
                    <button
                      type="button"
                      className="ga-btn ga-btn--primary ga-btn--sm"
                      disabled={busy === k}
                      onClick={() => run(k, () => (x._legacy ? act.approveLegacy(x.id) : act.approveApplicant(x.participation_id)), `${name} approved`)}
                    >
                      {busy === k ? "…" : "Approve"}
                    </button>
                  </>
                )}
                {group.proc === "review" && (
                  <>
                    {x.video_url && (
                      <a className="qr-text" href={safeUrl(x.video_url)} target="_blank" rel="noopener noreferrer">
                        ▶ Watch
                      </a>
                    )}
                    <button type="button" className="qr-text" onClick={() => changes(x)}>
                      Ask changes
                    </button>
                    <button type="button" className="ga-btn ga-btn--primary ga-btn--sm" disabled={busy === k} onClick={() => run(k, () => act.approveVideo(k), `Video approved — ${name} can post`)}>
                      {busy === k ? "…" : "Approve video"}
                    </button>
                  </>
                )}
                {group.proc === "deliver" && (
                  <button type="button" className="ga-btn ga-btn--primary ga-btn--sm" disabled={busy === k} onClick={() => run(k, () => act.markDelivered(k), `Marked delivered — ${name}`)}>
                    {busy === k ? "…" : "📦 Mark delivered"}
                  </button>
                )}
                {group.proc === "ship" && (
                  <button type="button" className="ga-btn ga-btn--primary ga-btn--sm" onClick={() => setShip(x)}>
                    🚚 Add courier
                  </button>
                )}
                {group.proc === "contract" && (
                  <button type="button" className="ga-btn ga-btn--primary ga-btn--sm" disabled={busy === k} onClick={() => run(k, () => act.sendContract(k), `Contract sent to ${name}`)}>
                    {busy === k ? "…" : "Send contract"}
                  </button>
                )}
                {x.phone && (
                  <a className="qr-text" href={`tel:${x.phone}`}>
                    📞 {x.phone}
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {ship && (
        <CourierForm
          rec={ship}
          onClose={() => setShip(null)}
          onSave={async (payload) => {
            const k = ship.participation_id;
            const { error } = await act.recordCourier(k, payload);
            if (error) return errText(error);
            toast(`Tracking saved — ${who(ship.creator)} can track the parcel`);
            setGone((g) => [...g, k]);
            setShip(null);
            onDone && onDone();
            return "";
          }}
        />
      )}

      <style>{`
        .qr { margin-top: 24px; padding-top: 4px; border-top: 1px solid var(--ad-line); }
        .qr-h { display: flex; align-items: center; gap: 8px; margin: 18px 0 0; font-size: 13px; font-weight: 700; color: var(--ad-ink); }
        .qr-empty { margin-top: 12px; font-size: 13px; color: var(--ad-green); font-weight: 700; }
        .qr-list { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 8px; max-height: 360px; overflow-y: auto; }
        .qr-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--ad-line); flex-wrap: wrap; }
        .qr-pic { width: 34px; height: 34px; flex-shrink: 0; border-radius: 50%; object-fit: cover; font-size: 12px; }
        .qr-main { flex: 1; min-width: 140px; }
        .qr-name { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; font-weight: 800; color: var(--ad-ink); }
        .qr-name a:hover { color: var(--ad-primary); }
        .qr-via { height: 20px; font-size: 10px; }
        .qr-sub { margin-top: 3px; font-size: 11.5px; color: #8791a7; }
        .qr-act { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-left: auto; }
        .qr-text { border: 0; background: none; padding: 0 2px; font-size: 12.5px; font-weight: 800; color: #6657e9; white-space: nowrap; }
        .qr-text:hover { color: var(--ad-primary-2); }
        .qr-text:disabled, .qr-act .ga-btn:disabled { opacity: .5; }
      `}</style>
    </div>
  );
}

/* Courier & tracking (purane openBpShipment jaisa) */
function CourierForm({ rec, onClose, onSave }) {
  const [f, setF] = useState({ product: rec.product || "", courier: "", tracking: "", url: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="ga-overlay" onClick={onClose}>
      <form
        className="ga-modal cf"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!f.courier.trim()) return setErr("Add the courier name.");
          setBusy(true);
          const m = await onSave({ product: f.product.trim() || null, courier: f.courier.trim(), tracking_ref: f.tracking.trim() || null, tracking_url: f.url.trim() || null });
          if (m) {
            setErr(m);
            setBusy(false);
          }
        }}
      >
        <div className="cf-head">
          <h3>Courier &amp; tracking</h3>
          <button type="button" className="cf-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="ga-hint">The creator sees this straight away and can track the parcel from the app.</p>
        <label className="ga-label">Product</label>
        <input className="ga-input" value={f.product} onChange={set("product")} placeholder="Momo box" />
        <div className="cf-row">
          <div>
            <label className="ga-label">Courier</label>
            <input className="ga-input" value={f.courier} onChange={set("courier")} placeholder="DTDC / Delhivery / Blue Dart" required />
          </div>
          <div>
            <label className="ga-label">Tracking number</label>
            <input className="ga-input" value={f.tracking} onChange={set("tracking")} placeholder="DT123456789" />
          </div>
        </div>
        <label className="ga-label">Tracking link (optional)</label>
        <input className="ga-input" type="url" value={f.url} onChange={set("url")} placeholder="https://www.dtdc.in/tracking…" />
        {err && <p className="cf-err">{err}</p>}
        <button type="submit" className="ga-btn ga-btn--primary cf-go" disabled={busy}>
          {busy ? "Saving…" : "Save — creator gets the tracking"}
        </button>
        <style>{`
          .cf { padding: 22px; }
          .cf-head { display: flex; justify-content: space-between; gap: 12px; }
          .cf-head h3 { font-family: var(--ad-head); font-size: 19px; font-weight: 800; letter-spacing: -0.5px; }
          .cf-x { width: 34px; height: 34px; border: 0; border-radius: 10px; background: var(--ad-soft); color: #65718c; }
          .cf .ga-hint { margin: 6px 0 10px; }
          .cf .ga-label { margin-top: 12px; }
          .cf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .cf-err { margin-top: 10px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
          .cf-go { width: 100%; margin-top: 16px; }
          @media (max-width: 480px) { .cf-row { grid-template-columns: 1fr; } }
        `}</style>
      </form>
    </div>
  );
}
