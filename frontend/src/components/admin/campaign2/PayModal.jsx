"use client";

import { useEffect, useRef, useState } from "react";
import { rpc, sbFor, errText } from "@/lib/supabase";
import { inr, when } from "@/components/admin/campaign2/kit";

/* Payments ke chhote helpers (purane payments.js jaisa) */
const PART = { advance: "Advance", balance: "Balance", full: "Fee" };
export const who = (r) => {
  const c = r.creator || {};
  return c.username || r.applied_profile ? "@" + (c.username || r.applied_profile) : r.name || c.name || "Creator";
};
// purane payReadyOuts: due / failed, details verified, hold nahi
export const readyOuts = (r) => {
  const p = r.payment || {};
  if (p.on_hold || p.details_status !== "verified") return [];
  return (p.payouts || []).filter((o) => ["due", "failed"].includes(o.status) && +o.amount > 0);
};
export const statusOf = (r) => {
  const p = r.payment || {},
    po = p.payouts || [];
  if (p.on_hold) return "On hold";
  if (p.amount == null) return "Fee not set";
  if (!p.method) return "No bank / UPI";
  if (p.details_status !== "verified") return "Not verified";
  if (po.some((o) => ["queued", "processing"].includes(o.status))) return "Being paid";
  if (po.some((o) => ["due", "failed"].includes(o.status))) return "Due now";
  if (po.length && po.every((o) => o.status === "paid")) return "Fully paid";
  const left = p.left != null ? +p.left : +p.amount;
  return left > 0 ? "Not due yet" : "Fully paid";
};

/* Ek popup, kai kaam: fee set · verify · details maango · payment record / Razorpay · mark paid · details */
export default function PayModal({ modal, days, connected, onClose, onDone }) {
  const { row: r, kind } = modal;
  const p = r.payment || {};
  const po = p.payouts || [];
  const left = p.left != null ? +p.left : +p.amount || 0;
  const dueNow = po.filter((o) => ["due", "failed"].includes(o.status)).reduce((a, o) => a + (+o.amount || 0), 0);
  const busyOut = po.find((o) => ["queued", "processing"].includes(o.status));
  const canRzp = connected && p.details_status === "verified" && !p.on_hold;
  const [f, setF] = useState(() => ({
    amount: p.amount ?? "",
    adv: p.advance_pct ?? "",
    days: p.due_days ?? "",
    note: kind === "verify" ? "checked by the Geek team" : kind === "ask" ? (p.details_status === "failed" ? "the bank could not verify this account" : "the account name doesn't match your name") : kind === "fee" ? p.terms_note || "" : "",
    pay: dueNow || left || "",
    how: canRzp ? "razorpay" : "manual",
    utr: "",
    on: "",
  }));
  const fileRef = useRef(null);
  // aaj ki date effect mein (render mein new Date() nahi)
  useEffect(() => setF((o) => (o.on ? o : { ...o, on: new Date().toISOString().slice(0, 10) })), []);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const name = who(r);

  // payment ka screenshot — purane jaisa "payment-proofs" bucket
  const upProof = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return null;
    if (file.size > 10 * 1024 * 1024) throw new Error("The screenshot must be under 10 MB.");
    const ext = (String(file.name || "").match(/\.([a-z0-9]{2,5})$/i) || [, "png"])[1].toLowerCase();
    const path = `${r.participation_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sbFor("admin").storage.from("payment-proofs").upload(path, file, { contentType: file.type || "image/png", upsert: false });
    if (error) throw new Error("Couldn't upload the screenshot: " + (error.message || error));
    return path;
  };

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      setBusy(true);
      if (kind === "fee") {
        const amt = Math.round(+f.amount);
        if (!(amt > 0)) throw new Error("Enter the fee in ₹.");
        const adv = f.adv === "" ? null : Math.min(100, Math.max(0, parseInt(f.adv, 10) || 0));
        const d = f.days === "" ? null : Math.min(90, Math.max(1, parseInt(f.days, 10) || 7));
        const { error } = await rpc("admin", "api.payment_set_terms", { p_participation: r.participation_id, p_amount: amt, p_advance_pct: adv, p_due_days: d, p_note: f.note.trim() || null });
        if (error) throw error;
        return onDone(`Fee set for ${name} ✓ — their contract carries it`);
      }
      if (kind === "verify") {
        const { error } = await rpc("admin", "api.payment_verify", { p_participation: r.participation_id, p_mode: "manual", p_note: f.note.trim() || null });
        if (error) throw error;
        return onDone("Payment details verified ✓");
      }
      if (kind === "ask") {
        if (!f.note.trim()) throw new Error("Write what's wrong — the creator gets this.");
        const { error } = await rpc("admin", "api.payment_request_details", { p_participation: r.participation_id, p_reason: f.note.trim() });
        if (error) throw error;
        return onDone(`Asked ${name} for new details ✓`);
      }
      if (kind === "mark") {
        const proof = await upProof();
        if (!f.utr.trim() && !proof) throw new Error("Add the UTR or a screenshot of the payment.");
        const { error } = await rpc("admin", "api.payout_mark_paid", { p_payout: busyOut.payout_id, p_utr: f.utr.trim() || null, p_paid_on: f.on || null, p_note: f.note.trim() || null, p_proof_path: proof });
        if (error) throw error;
        return onDone(`Marked paid ✓ — ${name} was told`);
      }
      if (kind === "pay") {
        const amt = Math.round(+f.pay || 0);
        if (amt <= 0 || amt > left) throw new Error(`Enter an amount up to ${inr(left)}.`);
        const manual = f.how === "manual";
        if (!manual && !window.confirm(`Pay ${inr(amt)} to ${name} through Razorpay?\n\nTo ${p.method === "upi" ? "UPI " + p.upi_id : "bank a/c ••" + p.account_last4}. Money leaves your RazorpayX account right away.`)) return setBusy(false);
        const proof = manual ? await upProof() : null;
        if (manual && !f.utr.trim() && !proof) throw new Error("Add the UTR or a screenshot of the payment.");
        const { data, error } = await rpc("admin", "api.payout_pay", {
          p_participation: r.participation_id,
          p_amount: amt,
          p_how: f.how,
          p_utr: manual ? f.utr.trim() || null : null,
          p_paid_on: manual ? f.on || null : null,
          p_note: manual ? f.note.trim() || null : null,
          p_proof_path: proof,
        });
        if (error) throw error;
        return onDone(manual ? `Recorded ${inr(amt)} ✓ — the creator was told${data && +data.left > 0 ? ` · ${inr(data.left)} left` : ""}` : `⚡ ${inr(amt)} sent to Razorpay ✓ — the UTR shows here when it lands`);
      }
      onClose();
    } catch (ex) {
      setErr(errText(ex));
      setBusy(false);
    }
  };

  const title = { fee: "Set fee", verify: "Verify", ask: "Ask for details", pay: "Record payment", mark: "Mark paid", details: "Payments" }[kind];
  const manualFields = (
    <>
      <div className="pm-row">
        <div>
          <label className="ga-label" htmlFor="pm-utr">
            UTR / reference
          </label>
          <input id="pm-utr" className="ga-input" value={f.utr} onChange={set("utr")} maxLength={40} placeholder="e.g. 425123456789" />
        </div>
        <div>
          <label className="ga-label" htmlFor="pm-on">
            Paid on
          </label>
          <input id="pm-on" type="date" className="ga-input" value={f.on} onChange={set("on")} />
        </div>
      </div>
      <label className="ga-label" htmlFor="pm-proof">
        Screenshot of the payment (optional)
      </label>
      <input id="pm-proof" ref={fileRef} type="file" accept="image/*,.pdf" className="ga-input pm-file" />
      <p className="ga-hint">Add the UTR, the screenshot, or both — the creator can open it.</p>
    </>
  );

  return (
    <div className="ga-overlay" onClick={onClose}>
      <form className="ga-modal pm" onClick={(e) => e.stopPropagation()} onSubmit={save} role="dialog" aria-label={title}>
        <h3 className="ga-h2">
          {title} · {name}
        </h3>
        {kind === "fee" && (
          <>
            <label className="ga-label" htmlFor="pm-amt">
              Fee (₹)
            </label>
            <input id="pm-amt" className="ga-input" value={f.amount} onChange={set("amount")} inputMode="numeric" placeholder="15000" autoFocus />
            <div className="pm-row">
              <div>
                <label className="ga-label" htmlFor="pm-adv">
                  Advance % (after signing)
                </label>
                <input id="pm-adv" className="ga-input" value={f.adv} onChange={set("adv")} inputMode="numeric" placeholder="0" />
              </div>
              <div>
                <label className="ga-label" htmlFor="pm-days">
                  Pay days after posts
                </label>
                <input id="pm-days" className="ga-input" value={f.days} onChange={set("days")} inputMode="numeric" placeholder={String(days || 7)} />
              </div>
            </div>
            <label className="ga-label" htmlFor="pm-note">
              Terms (goes into their contract)
            </label>
            <input id="pm-note" className="ga-input" value={f.note} onChange={set("note")} maxLength={300} placeholder="includes 1 story repost" />
          </>
        )}
        {kind === "verify" && (
          <>
            <p className="pm-txt">
              Only do this after you&apos;ve checked {p.method === "upi" ? `UPI ${p.upi_id || ""}` : `a/c ••${p.account_last4 || ""} · ${p.ifsc || ""}`} is in {name}&apos;s own name
              {p.account_name ? ` (name given: ${p.account_name})` : ""}.
            </p>
            <label className="ga-label" htmlFor="pm-note">
              How did you check?
            </label>
            <input id="pm-note" className="ga-input" value={f.note} onChange={set("note")} placeholder="₹1 test transfer, bank statement…" />
          </>
        )}
        {kind === "ask" && (
          <>
            <p className="pm-txt">They get this on WhatsApp, email and in the app.</p>
            <label className="ga-label" htmlFor="pm-note">
              What&apos;s wrong / what you need
            </label>
            <input id="pm-note" className="ga-input" value={f.note} onChange={set("note")} autoFocus />
          </>
        )}
        {kind === "pay" && (
          <>
            <p className="pm-txt">
              Total {inr(p.amount)} · paid {inr(p.paid_total || 0)} · left {inr(left)} · due now {inr(dueNow)}
            </p>
            <label className="ga-label" htmlFor="pm-pay">
              Amount to pay now (₹)
            </label>
            <input id="pm-pay" className="ga-input" value={f.pay} onChange={set("pay")} inputMode="numeric" />
            <div className="pm-seg">
              <button type="button" className={f.how === "razorpay" ? "is-on" : ""} disabled={!canRzp} onClick={() => setF((o) => ({ ...o, how: "razorpay" }))} title={canRzp ? "" : "Razorpay needs verified details and a connected account"}>
                ⚡ Pay via Razorpay
              </button>
              <button type="button" className={f.how === "manual" ? "is-on" : ""} onClick={() => setF((o) => ({ ...o, how: "manual" }))}>
                ✅ Paid manually
              </button>
            </div>
            {f.how === "manual" && manualFields}
          </>
        )}
        {kind === "mark" && busyOut && (
          <>
            <p className="pm-txt">
              {PART[busyOut.part] || "Payment"} of {inr(busyOut.amount)} paid outside the app. The creator is told, with the UTR.
            </p>
            {manualFields}
          </>
        )}
        {kind === "details" && (
          <div className="pm-outs">
            {po.length ? (
              po.map((o) => (
                <div key={o.payout_id}>
                  <span>
                    {PART[o.part] || o.part} · <b>{inr(o.amount)}</b>
                  </span>
                  <span>
                    {o.status}
                    {o.utr ? ` · UTR ${o.utr}` : ""}
                    {o.paid_at ? ` · ${when(o.paid_at)}` : ""}
                  </span>
                </div>
              ))
            ) : (
              <p className="pm-txt">No payments yet.</p>
            )}
          </div>
        )}
        {err && <p className="pm-err">{err}</p>}
        <div className="pm-act">
          <button type="button" className="ga-btn ga-btn--ghost" onClick={onClose}>
            {kind === "details" ? "Close" : "Cancel"}
          </button>
          {kind !== "details" && (
            <button type="submit" className="ga-btn ga-btn--primary" disabled={busy}>
              {busy ? "Saving…" : kind === "verify" ? "Mark verified" : kind === "ask" ? "Send" : kind === "pay" && f.how === "razorpay" ? "⚡ Pay now" : "Save"}
            </button>
          )}
        </div>
      </form>
      <style>{`
        .pm { padding: 24px; }
        .pm .ga-label { margin-top: 16px; }
        .pm-txt { margin-top: 12px; font-size: 13px; line-height: 1.5; color: var(--ad-muted); }
        .pm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
        .pm-file { padding-top: 9px; }
        .pm-seg { display: flex; gap: 8px; margin-top: 14px; }
        .pm-seg button { flex: 1; height: 38px; border-radius: 10px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 13px; font-weight: 700; color: var(--ad-muted-2); }
        .pm-seg button.is-on { border-color: var(--ad-primary); background: var(--ad-lilac); color: var(--ad-primary-2); }
        .pm-seg button:disabled { opacity: .45; cursor: not-allowed; }
        .pm-outs { margin-top: 12px; display: grid; gap: 6px; font-size: 13px; }
        .pm-outs div { display: flex; justify-content: space-between; gap: 10px; padding: 9px 12px; border-radius: 10px; background: var(--ad-soft-2); }
        .pm-err { margin-top: 12px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
        .pm-act { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
        @media (max-width: 640px) { .pm-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
