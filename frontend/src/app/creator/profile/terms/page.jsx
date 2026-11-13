"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creator/BountyShell";
import { useCreator, saveSection, reloadProfile, ackTerms, termsOf, termsPatch, ratesOf, saveRate } from "@/services/creator";

const RATE_TYPE = { reel: "IG Reel", story: "IG Story", post: "IG Static Post" };
import { COLLAB_TYPES } from "@/components/creator/data";
import { Check } from "@/components/ui/Icons";

// Figma (profile) ke chhote notes
const NOTES = { barter: "Products or experiences for content", paid: "A cash fee for your work", hybrid: "Product + payment", discuss: "" };

/** /creator/profile/terms — kis tarah ke collab + rate card */
export default function Terms() {
  const c = useCreator();
  const loaded = useRef(false);
  const [busy, setBusy] = useState(false);
  const [collab, setCollab] = useState([]);
  const [rates, setRates] = useState({ reel: "", story: "", post: "", product: "" });
  const [tick, setTick] = useState(false);
  const [toast, setToast] = useState("");
  const [err, setErr] = useState("");

  // Saved terms (commercial_preference) + rate card
  useEffect(() => {
    if (loaded.current || !c.ready || !c.profile) return;
    loaded.current = true;
    const cp = c.profile.commercial_preference || {};
    const r = ratesOf(c.profile);
    setCollab(termsOf(cp));
    setRates({ reel: r["IG Reel"] ? String(r["IG Reel"]) : "", story: r["IG Story"] ? String(r["IG Story"]) : "", post: r["IG Static Post"] ? String(r["IG Static Post"]) : "", product: cp.min_product_value != null ? String(Math.round(cp.min_product_value)) : "" });
    if (c.meta?.bx_terms_ack) setTick(true);
  }, [c]);

  const flip = (id) => setCollab(collab.includes(id) ? collab.filter((x) => x !== id) : [...collab, id]);
  const num = (k) => (e) => setRates({ ...rates, [k]: e.target.value.replace(/\D/g, "").slice(0, 7) });

  // commercial_preference + rate card items (sirf badle hue) — purane onbStep(3) / profile.js jaisa
  const save = async (e) => {
    e.preventDefault();
    if (!collab.length) return setErr("Pick at least one.");
    if (!tick) return setErr("Tick the box above to save.");
    setErr("");
    setBusy(true);
    try {
      await ackTerms();
      const patch = { ...termsPatch(collab) };
      const min = String(rates.product || "").replace(/[^\d.]/g, "");
      patch.min_product_value = min === "" ? null : Number(min);
      await saveSection("commercial_preference", patch);
      const old = ratesOf(c.profile);
      for (const k of ["reel", "story", "post"]) {
        const v = Number(rates[k] || 0);
        if (v > 0 && v !== old[RATE_TYPE[k]])
          await saveRate(RATE_TYPE[k], v, { reload: false });
      }
      reloadProfile();
      setToast("Terms & rate card saved");
      setTimeout(() => setToast(""), 2200);
    } catch (ex) {
      setErr("Couldn't save: " + (ex.message || ex));
    }
    setBusy(false);
  };

  return (
    <BountyShell>
      <title>Your terms & rate card — Bounty</title>
      <Link href="/creator/profile" className="pf-back">
        ← My profile
      </Link>

      <form className="pf-card tr" onSubmit={save}>
        <h1 className="tr-h">Your terms &amp; rate card</h1>

        <p className="tr-label">
          What are you open to? <small>pick all that fit</small>
        </p>
        <div className="tr-opts">
          {COLLAB_TYPES.map((t) => {
            const on = collab.includes(t.id);
            return (
              <button key={t.id} type="button" className={`tr-opt ${on ? "is-on" : ""}`} onClick={() => flip(t.id)} aria-pressed={on}>
                <span className="tr-opt__ic">{t.icon}</span>
                <span className="tr-opt__txt">
                  <strong>{t.label}</strong>
                  {NOTES[t.id] && <small>{NOTES[t.id]}</small>}
                </span>
                <span className="tr-opt__dot" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <p className="tr-label">
          Your rates <small>optional · shown only to brands you apply to</small>
        </p>
        <div className="tr-rates">
          {[
            ["reel", "Reel"],
            ["story", "Story"],
            ["post", "Post"],
          ].map(([k, l]) => (
            <label key={k} className="tr-rate">
              <span>{l}</span>
              <span className="tr-rate__in">
                ₹
                <input inputMode="numeric" placeholder="—" value={rates[k]} onChange={num(k)} aria-label={`${l} rate`} />
              </span>
            </label>
          ))}
        </div>

        <label className="tr-label" htmlFor="tr-prod">
          Product value you prefer (optional)
        </label>
        <input id="tr-prod" className="pf-input tr-prod" placeholder="Any" inputMode="numeric" value={rates.product} onChange={(e) => setRates({ ...rates, product: e.target.value.replace(/[^\d]/g, "").slice(0, 7) })} />

        <label className="tr-tick">
          <input type="checkbox" checked={tick} onChange={(e) => setTick(e.target.checked)} />
          <i aria-hidden="true">{tick && <Check size={13} />}</i>
          <span>You decide on each offer. Ad rights, exclusivity and deadlines are always shown before you accept.</span>
        </label>

        <button type="submit" className="tr-save" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        {err && <p className="bx-err tr-center">{err}</p>}
      </form>

      {toast && (
        <div className="bx-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        /* Figma: DM Sans form card — header line, safed inputs, "Private" chip */
        .pf-back { display: inline-block; margin: 4px 0 26px; font-size: 14px; font-weight: 700; color: var(--bx-ink); }
        .pf-back:hover { color: var(--bx-red); }
        .pf-card { padding: 20px 20px 18px; border-radius: 16px; background: rgba(251,241,220,.82); border: 1px solid var(--bx-line); box-shadow: 0 10px 24px -20px rgba(60,40,10,.45); }
        .pf-h { margin: 0 0 12px; padding-bottom: 14px; font-family: var(--bx-sans); font-size: 15px; font-weight: 700; letter-spacing: -0.1px; border-bottom: 1px solid var(--bx-line); }
        .pf-label { display: flex; align-items: center; gap: 8px; margin: 0 0 7px; font-size: 12.5px; font-weight: 600; color: #6b5a3a; }
        .pf-label small { padding: 1px 6px; border-radius: 5px; background: #ebe2cd; font-size: 10px; font-weight: 600; color: #7a8290; }
        .pf-input { width: 100%; height: 38px; padding: 0 10px; border-radius: 10px; border: 1px solid #d9c9a3; background: #fffdf8; outline: none; font-size: 14px; font-weight: 500; color: var(--bx-ink); }
        .pf-input::placeholder { color: #757575; }
        .pf-input:focus { border-color: var(--bx-gold); box-shadow: 0 0 0 3px rgba(232,176,74,.2); }
        select.pf-input { appearance: none; }
        textarea.pf-input { height: auto; padding: 9px 10px; }
        .pf-hint { margin: 6px 0 0; font-size: 12px; color: #6b5a3a; }
        .pf-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 38px; padding: 0 16px; border: 0; border-radius: 999px; background: var(--bx-green); color: var(--bx-cream); font-family: var(--bx-jak); font-size: 14px; font-weight: 700; white-space: nowrap; }
        .pf-btn:disabled { opacity: .5; cursor: not-allowed; }
        @media (max-width: 767px) {
          .pf-back { margin-bottom: 20px; }
          .pf-card { padding: 16px; }
        }
        .tr { padding: 18px 20px 20px; }
        .tr-h { font-family: var(--bx-serif); font-size: 18px; font-weight: 600; }
        .tr-label { display: block; margin: 16px 0 10px; font-size: 14px; font-weight: 700; color: var(--bx-ink); }
        .tr-h + .tr-label { margin-top: 12px; }
        .tr-label small { margin-left: 6px; font-size: 12px; font-weight: 400; color: #3e4b52; }
        .tr-opts { display: grid; gap: 8px; }
        .tr-opt { display: flex; align-items: center; gap: 0; width: 100%; min-height: 58px; padding: 8px 14px; border-radius: 12px; border: 1px solid #e0cfa6; background: #fffbf1; text-align: left; box-shadow: 0 2px 6px -4px rgba(0,0,0,.2); }
        .tr-opt.is-on { background: #ecf5ec; border: 1.5px solid #1d4a35; }
        .tr-opt__ic { width: 32px; margin-right: 12px; padding-right: 10px; border-right: 1px solid #e0cfa6; white-space: nowrap; font-family: var(--bx-sans); font-size: 20px; text-align: center; color: var(--bx-ink); flex-shrink: 0; letter-spacing: -0.4px; }
        .tr-opt:nth-child(3) .tr-opt__ic { font-size: 11px; }
        .tr-opt__txt { flex: 1; min-width: 0; }
        .tr-opt__txt strong { display: block; font-family: var(--bx-jak); font-size: 16px; font-weight: 800; color: var(--bx-ink); }
        .tr-opt__txt small { display: block; font-family: var(--bx-jak); font-size: 12px; font-weight: 500; color: #3e4b52; }
        .tr-opt__dot { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #c9b07c; flex-shrink: 0; }
        .tr-opt.is-on .tr-opt__dot { background: var(--bx-green); border-color: var(--bx-green); }
        .tr-rates { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .tr-rate { padding: 10px 12px 10px; border-radius: 12px; border: 1px solid #e0cfa6; background: #fffbf1; cursor: text; }
        .tr-rate > span:first-child { display: block; font-size: 12px; font-weight: 600; color: #3e4b52; margin-bottom: 4px; }
        .tr-rate__in { display: flex; align-items: center; gap: 4px; font-size: 16px; font-weight: 700; color: var(--bx-ink); }
        .tr-rate__in input { flex: 1; min-width: 0; height: 22px; padding: 0 6px; border: 1px solid #b9b2a4; border-radius: 999px; outline: none; background: #fffdf8; font-size: 14px; font-weight: 500; color: var(--bx-ink); }
        .tr-rate__in input:focus { border-color: var(--bx-gold); }
        .tr-rate__in input::placeholder { color: #757575; }
        .tr-prod { height: 44px; padding: 0 12px; border-radius: 12px; }
        .tr-tick { position: relative; display: flex; gap: 12px; align-items: flex-start; margin: 16px 0; padding: 13px 14px; border-radius: 12px; border: 1px solid #e0cfa6; background: #fffbf1; font-family: var(--bx-jak); font-size: 13.5px; font-weight: 500; color: var(--bx-ink); cursor: pointer; }
        .tr-tick input { position: absolute; opacity: 0; width: 1px; height: 1px; }
        .tr-tick i { width: 22px; height: 22px; flex-shrink: 0; margin-top: -1px; border-radius: 6px; border: 2px solid #b8945a; background: #fffdf8; display: grid; place-items: center; color: #fff; }
        .tr-tick input:checked + i { background: var(--bx-green); border-color: var(--bx-green); }
        .tr-tick input:focus-visible + i { box-shadow: 0 0 0 3px rgba(232,176,74,.35); }
        .tr-save { display: block; width: 100%; height: 48px; border: 0; border-radius: 14px; background: var(--bx-green); color: var(--bx-cream); font-family: var(--bx-jak); font-size: 16px; font-weight: 800; letter-spacing: -0.1px; box-shadow: 0 8px 18px -12px rgba(0,0,0,.6); }
        .tr-center { text-align: center; }
        @media (max-width: 767px) {
          .tr { padding: 16px; }
          .tr-rates { gap: 8px; }
          .tr-rate { padding: 10px; }
          .tr-label small { margin-left: 4px; letter-spacing: -0.1px; }
          .tr-tick { margin: 20px 0 22px; }
        }
      `}</style>
    </BountyShell>
  );
}
