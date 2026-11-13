"use client";

import { useState } from "react";
import { fdate, savePaymentDetails, paymentProofLinks } from "@/services/creator";

const INR = (n) => "₹" + Math.round(+n || 0).toLocaleString("en-IN");
const ST = {
  pending: ["Add your bank / UPI details", "warn"],
  submitted: ["Received — being checked", "na"],
  verifying: ["Checking with your bank…", "na"],
  verified: ["Verified ✓", "ok"],
  failed: ["Couldn't verify — please update", "warn"],
  needs_update: ["Please update your details", "warn"],
};
const PART = { advance: "Advance", balance: "Balance", full: "Fee" };

/**
 * 💰 Paid campaign par MERI payment (purane payBoxMine + openPayDetailsModal):
 * fee, advance/balance, bank/UPI details (api.save_payment_details), payouts ka status, payment screenshot.
 * Sirf jab my_campaign_flows bole ki campaign paid hai.
 */
export default function PayBox({ t }) {
  const m = t.m;
  const f = m._flow || {};
  const p = f.payment;
  const [form, setForm] = useState(false);
  const [method, setMethod] = useState(p && p.method === "upi" ? "upi" : "bank");
  const [v, setV] = useState({ name: (p && p.account_name) || "", no: "", no2: "", ifsc: (p && p.ifsc) || "", upi: (p && p.upi_id) || "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [proof, setProof] = useState(null);
  if (!f.paid || !p) return null;

  const days = p.due_days || f.due_days || 7;
  const st = ST[p.details_status] || [p.details_status, "na"];
  const det =
    p.method === "upi" ? (
      <>
        UPI <b>{p.upi_id}</b>
      </>
    ) : p.method === "bank" ? (
      <>
        Bank account ••••<b>{p.account_last4}</b> · {p.ifsc}
        {p.bank_name ? " · " + p.bank_name : ""}
      </>
    ) : (
      "not added yet"
    );
  const fee =
    p.amount != null ? (
      <>
        <b>{INR(p.amount)}</b> —{" "}
        {p.advance_pct >= 100
          ? "paid in advance once you sign"
          : p.advance_pct > 0
          ? `${INR(Math.round((p.amount * p.advance_pct) / 100))} advance once you sign, the rest ${days} days after every post is live`
          : `paid ${days} days after every post is live`}
      </>
    ) : (
      "being finalised by the Geek team — you'll see it in your contract"
    );
  const payouts = p.payouts || [];
  const needs = ["pending", "failed", "needs_update"].includes(p.details_status);
  const busyPay = payouts.some((o) => o.status === "queued" || o.status === "processing");
  const allPaid = payouts.length && payouts.every((o) => o.status === "paid");
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  const save = async () => {
    setErr("");
    const name = v.name.trim();
    const no = v.no.replace(/[\s-]/g, "");
    const no2 = v.no2.replace(/[\s-]/g, "");
    const ifsc = v.ifsc.trim().toUpperCase();
    const upi = v.upi.trim().toLowerCase();
    if (name.length < 3) return setErr("Type the account holder's full name.");
    if (method === "bank") {
      if (!/^\d{9,18}$/.test(no)) return setErr("The account number should be 9 to 18 digits.");
      if (no !== no2) return setErr("The two account numbers don't match.");
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return setErr("The IFSC code is 11 characters, like HDFC0001234.");
    } else if (!/^[a-z0-9._-]{2,255}@[a-z][a-z0-9.-]{1,63}$/.test(upi)) return setErr("The UPI ID looks wrong — it is like name@okhdfcbank.");
    setBusy(true);
    const r = await savePaymentDetails({ participation: m.participation_id, method, name, accountNo: no, ifsc, upi });
    setBusy(false);
    if (r.error) return setErr(r.error.message || String(r.error));
    setForm(false);
    setV({ ...v, no: "", no2: "" });
    t.reload();
  };

  // Geek team ka upload kiya payment screenshot (payment-proofs bucket, 10 min ka link)
  const openProof = async (path) => {
    const links = await paymentProofLinks(path);
    if (!links) return setErr("Couldn't open the screenshot — try again.");
    setProof(links);
  };

  return (
    <div className={`py ${needs ? "is-act" : ""}`}>
      <p className="py-h">
        💰 <b>Your payment</b> <span className={`py-pill py-pill--${st[1]}`}>{st[0]}</span>
      </p>
      <p className="py-t">
        Fee: {fee}
        {p.amount != null && (+p.paid_total || 0) > 0 && (
          <>
            <br />
            Paid so far: <b>{INR(p.paid_total)}</b> · left <b>{INR(p.left)}</b>
          </>
        )}
        <br />
        Paid to: {det}
      </p>
      {p.details_status === "needs_update" && p.request_reason && <p className="py-note">“{p.request_reason}”</p>}
      {p.details_status === "failed" && p.verify_message && <p className="py-note">{p.verify_message}</p>}
      {payouts.length > 0 && (
        <ul className="py-rows">
          {payouts.map((o, i) => (
            <li key={i}>
              <span>
                {o.note === "part payment" ? "Part payment" : PART[o.part] || o.part} · {INR(o.amount)}
              </span>
              <span>
                {{
                  waiting: "Not due yet",
                  due: "Due" + (o.due_at ? " by " + fdate(o.due_at) : ""),
                  queued: "Being sent",
                  processing: "Sent — reaching your bank",
                  paid: "Paid ✓" + (o.paid_at ? " " + fdate(o.paid_at) : "") + (o.utr ? " · UTR " + o.utr : ""),
                  failed: "Delayed — our team is on it",
                  cancelled: "Cancelled",
                }[o.status] || o.status}
                {o.proof_path && (
                  <button type="button" className="py-link" onClick={() => openProof(o.proof_path)}>
                    📎 Screenshot
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!busyPay && !allPaid && !form && (
        <button type="button" className={`bx-btn bx-btn--sm ${needs ? "bx-btn--dark" : "bx-btn--ghost"}`} onClick={() => setForm(true)}>
          {p.method ? "✏️ Update payment details" : "🏦 Add payment details"}
        </button>
      )}

      {form && (
        <div className="py-form">
          <p className="py-small">
            Use a bank account or UPI ID in <b>your own name</b>. We verify it with the bank before any payment.
          </p>
          <div className="py-seg" role="radiogroup">
            {[
              ["bank", "🏦 Bank account"],
              ["upi", "📱 UPI ID"],
            ].map(([k, l]) => (
              <label key={k} className={method === k ? "is-on" : ""}>
                <input type="radio" name="py-m" checked={method === k} onChange={() => setMethod(k)} /> {l}
              </label>
            ))}
          </div>
          <label className="bx-label" htmlFor="py-name">
            Account holder name (exactly as in the bank)
          </label>
          <input id="py-name" className="bx-input" maxLength={80} autoComplete="name" value={v.name} onChange={set("name")} />
          {method === "bank" ? (
            <>
              <label className="bx-label" htmlFor="py-no">
                Account number
              </label>
              <input
                id="py-no"
                className="bx-input"
                inputMode="numeric"
                autoComplete="off"
                maxLength={22}
                value={v.no}
                onChange={set("no")}
                placeholder={p.account_last4 ? `•••• ${p.account_last4} — type the full number to change it` : "e.g. 50100123456789"}
              />
              <label className="bx-label" htmlFor="py-no2">
                Type the account number again
              </label>
              <input id="py-no2" className="bx-input" inputMode="numeric" autoComplete="off" maxLength={22} value={v.no2} onChange={set("no2")} />
              <label className="bx-label" htmlFor="py-ifsc">
                IFSC code
              </label>
              <input id="py-ifsc" className="bx-input py-up" maxLength={11} autoComplete="off" value={v.ifsc} onChange={set("ifsc")} placeholder="HDFC0001234" />
            </>
          ) : (
            <>
              <label className="bx-label" htmlFor="py-upi">
                UPI ID
              </label>
              <input id="py-upi" className="bx-input" maxLength={100} autoComplete="off" value={v.upi} onChange={set("upi")} placeholder="yourname@okhdfcbank" />
            </>
          )}
          {err && <p className="ts-err">{err}</p>}
          <div className="py-btns">
            <button type="button" className="bx-btn bx-btn--dark bx-btn--sm" disabled={busy} onClick={save}>
              {busy ? "Saving…" : "Save & verify"}
            </button>
            <button type="button" className="bx-btn bx-btn--ghost bx-btn--sm" onClick={() => setForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {!form && err && <p className="ts-err">{err}</p>}
      <p className="py-small">Must be in your own name. Your fee is private — only you and the Geek team see it.</p>

      {proof && (
        <div className="py-proof">
          {proof.pdf ? <p className="py-small">PDF receipt — open or download it below.</p> : <img src={proof.url} alt="Payment screenshot" />}
          <div className="py-btns">
            <a className="bx-btn bx-btn--dark bx-btn--sm" href={proof.dl} download>
              ⬇ Download
            </a>
            <a className="bx-btn bx-btn--ghost bx-btn--sm" href={proof.url} target="_blank" rel="noopener noreferrer">
              Open ↗
            </a>
            <button type="button" className="bx-btn bx-btn--ghost bx-btn--sm" onClick={() => setProof(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        .py { margin-top: 16px; padding: 14px; border-radius: 12px; background: #fffaf0; border: 1px solid var(--bx-line); }
        .py.is-act { border-color: var(--bx-gold); box-shadow: 0 0 0 3px rgba(232,176,74,.18); }
        .py-h { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 0 0 6px; font-size: 14px; color: #14231a; }
        .py-pill { padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #efe6d2; color: #6b5a3a; }
        .py-pill--ok { background: var(--bx-ok-bg); color: var(--bx-ok); }
        .py-pill--warn { background: #fbe7b5; color: #8a5d14; }
        .py-t { margin: 0 0 8px; font-size: 13px; line-height: 1.55; color: #14231a; }
        .py-note { margin: 0 0 8px; padding: 8px 10px; border-radius: 10px; background: #f8e1d6; font-size: 12.5px; color: var(--bx-red); }
        .py-rows { list-style: none; margin: 0 0 10px; padding: 0; display: grid; gap: 6px; }
        .py-rows li { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding: 8px 10px; border-radius: 10px; background: #fbf1dc; font-size: 12.5px; }
        .py-link { margin-left: 6px; border: 0; background: none; padding: 0; font: inherit; font-weight: 700; color: #2e9c94; cursor: pointer; }
        .py-form { display: grid; gap: 2px; margin-top: 6px; }
        .py-form .bx-label { margin-top: 8px; }
        .py-up { text-transform: uppercase; }
        .py-seg { display: flex; gap: 8px; flex-wrap: wrap; margin: 6px 0 2px; }
        .py-seg label { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; border: 1px solid var(--bx-line); font-size: 12.5px; font-weight: 600; cursor: pointer; }
        .py-seg label.is-on { border-color: var(--bx-teal); background: #eef8f3; }
        .py-seg input { accent-color: var(--bx-teal); }
        .py-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .py-small { margin: 8px 0 0; font-size: 11.5px; color: var(--bx-muted); }
        .py-proof { margin-top: 12px; padding: 10px; border-radius: 12px; background: #fff; border: 1px solid var(--bx-line); }
        .py-proof img { display: block; max-width: 100%; margin: 0 auto; border-radius: 8px; }
      `}</style>
    </div>
  );
}
