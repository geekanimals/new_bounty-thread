"use client";

import { useEffect, useRef, useState } from "react";
import { uploadMedia, privateLink } from "@/lib/media";
import { rpc, sbFor, errText } from "@/lib/supabase";
import { inr, when } from "@/components/admin/campaign2/kit";

/* Payments ke chhote helpers (purane payments.js jaisa) */
export const PART = { advance: "Advance", balance: "Balance", full: "Fee" };
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

export const STATUS_TXT = { waiting: "not due yet", due: "due", queued: "sending…", processing: "sent — waiting for the bank", paid: "paid ✓", failed: "failed", cancelled: "cancelled" };
export const DET_TXT = { pending: "Not added", submitted: "Check by hand", verifying: "Checking…", verified: "Verified ✓", failed: "Failed ✗", needs_update: "Asked again" };
export const termsLine = (p, days) => {
  if (p.amount == null) return "";
  const d = p.due_days || days || 7,
    a = +p.advance_pct || 0;
  return a >= 100 ? "all in advance (after signing)" : a > 0 ? `${a}% advance (${inr(Math.round((p.amount * a) / 100))}) after signing · balance ${d} days after posts` : `paid ${d} days after every post is live`;
};

/* Ek popup, kai kaam (purane payments.js ki har row ke saare button):
 * manage (sab ek jagah) · fee set · bank / UPI bharna · poori details dekhna · verify · auto-check · details maango ·
 * payment record / Razorpay · mark paid (UTR) · wapas due · screenshot add / dekhna · hold / release */
export default function PayModal({ modal, days, connected, onClose, onDone }) {
  const r = modal.row;
  const [kind, setKind] = useState(modal.kind);
  const [payout, setPayout] = useState(modal.payout || null);
  const [rev, setRev] = useState(null);
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
    method: p.method === "upi" ? "upi" : "bank",
    aname: p.account_name || "",
    ano: "",
    ifsc: p.ifsc || "",
    upi: p.upi_id || "",
    reason: "",
  }));
  const fileRef = useRef(null);
  // aaj ki date effect mein (render mein new Date() nahi)
  useEffect(() => setF((o) => (o.on ? o : { ...o, on: new Date().toISOString().slice(0, 10) })), []);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const name = who(r);
  const markOut = payout || busyOut;
  const anyBusy = !!busyOut;
  const go = (k, o = null) => {
    setErr("");
    setPayout(o);
    if (k === "verify") setF((x) => ({ ...x, note: "checked by the Geek team" }));
    if (k === "ask") setF((x) => ({ ...x, note: p.details_status === "failed" ? "the bank could not verify this account" : "the account name doesn't match your name" }));
    if (k === "fee") setF((x) => ({ ...x, note: p.terms_note || "" }));
    setKind(k);
  };

  // poori bank / UPI details (log hota hai) — sirf jab "Full details" khole
  useEffect(() => {
    if (kind !== "reveal") return;
    let alive = true;
    rpc("admin", "api.payment_reveal", { p_participation: r.participation_id }).then(({ data, error }) => {
      if (!alive) return;
      if (error) setErr(errText(error));
      else setRev(data || {});
    });
    return () => {
      alive = false;
    };
  }, [kind, r.participation_id]);

  // seedha chalne wale kaam (auto-check, release, wapas due) — popup band, list reload
  const quick = async (fnName, args, msg, ask) => {
    if (ask && !window.confirm(ask)) return;
    setBusy(true);
    setErr("");
    const { error } = await rpc("admin", fnName, args);
    if (error) {
      setErr(errText(error));
      return setBusy(false);
    }
    onDone(msg);
  };
  const openProof = async (path) => {
    try {
      window.open(await privateLink("admin", path), "_blank", "noopener");
    } catch (er) {
      setErr("Couldn't open the screenshot: " + errText(er));
    }
  };
  const copy = async (v) => {
    try {
      await navigator.clipboard.writeText(v);
    } catch {
      window.prompt("Copy:", v);
    }
  };

  // payment ka screenshot — purane jaisa "payment-proofs" bucket
  const upProof = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return null;
    if (file.size > 10 * 1024 * 1024) throw new Error("The screenshot must be under 10 MB.");
    const ext = (String(file.name || "").match(/\.([a-z0-9]{2,5})$/i) || [, "png"])[1].toLowerCase();
    const path = `${r.participation_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    // R2 (private) — compress ke saath; R2 na chale to purana payment-proofs bucket
    try {
      const up = await uploadMedia("admin", "payment-proofs", file, { scope: r.participation_id, fallback: { bucket: "payment-proofs", path, private: true } });
      return up.path;
    } catch (er) {
      throw new Error("Couldn't upload the screenshot: " + (er.message || er));
    }
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
      if (kind === "bank") {
        const bank = f.method === "bank";
        if (!f.aname.trim()) throw new Error("Enter the account holder name.");
        if (bank && !/^\d{9,18}$/.test(f.ano.replace(/[\s-]/g, ""))) throw new Error("Enter the full account number (9–18 digits).");
        if (bank && !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(f.ifsc.trim())) throw new Error("Enter a valid IFSC (like HDFC0001234).");
        if (!bank && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(f.upi.trim())) throw new Error("Enter a valid UPI ID (like name@okhdfcbank).");
        const { error } = await rpc("admin", "api.payment_admin_details", {
          p_participation: r.participation_id,
          p_method: f.method,
          p_account_name: f.aname.trim(),
          p_account_no: bank ? f.ano.replace(/[\s-]/g, "") : null,
          p_ifsc: bank ? f.ifsc.trim().toUpperCase() : null,
          p_upi: bank ? null : f.upi.trim().toLowerCase(),
        });
        if (error) throw error;
        return onDone(`Payment details saved for ${name} ✓ — the check runs again`);
      }
      if (kind === "hold") {
        if (!f.reason.trim()) throw new Error("Write why the payment is on hold.");
        const { error } = await rpc("admin", "api.payment_hold", { p_participation: r.participation_id, p_hold: true, p_reason: f.reason.trim() });
        if (error) throw error;
        return onDone(`${name}'s payment is on hold ✓`);
      }
      if (kind === "proof") {
        const path = await upProof();
        if (!path) throw new Error("Choose the screenshot (image or PDF).");
        const { error } = await rpc("admin", "api.payout_set_proof", { p_payout: payout.payout_id, p_path: path });
        if (error) throw error;
        return onDone("Screenshot added ✓ — the creator can open it");
      }
      if (kind === "mark") {
        const proof = await upProof();
        if (!f.utr.trim() && !proof) throw new Error("Add the UTR or a screenshot of the payment.");
        const { error } = await rpc("admin", "api.payout_mark_paid", { p_payout: markOut.payout_id, p_utr: f.utr.trim() || null, p_paid_on: f.on || null, p_note: f.note.trim() || null, p_proof_path: proof });
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

  const title = { manage: "Payment", fee: "Fee & terms", bank: "Bank / UPI details", reveal: "Full payment details", verify: "Verify", ask: "Ask for details", pay: "Record payment", mark: "Mark paid", details: "Payments", proof: "Payment screenshot", hold: "Put on hold" }[kind];
  const where = p.method === "upi" ? `UPI ${p.upi_id || ""}` : p.method === "bank" ? `A/c ••${p.account_last4 || ""} · ${p.ifsc || ""}${p.bank_name ? ` · ${p.bank_name}` : ""}` : "No bank / UPI yet";
  const back = modal.kind === "manage" && kind !== "manage";
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
        {kind === "mark" && markOut && (
          <>
            <p className="pm-txt">
              {PART[markOut.part] || "Payment"} of {inr(markOut.amount)} paid outside the app. The creator is told, with the UTR.
            </p>
            {manualFields}
          </>
        )}
        {kind === "manage" && (
          <div className="pm-mg">
            <section>
              <h4>Fee</h4>
              {p.amount != null ? (
                <p>
                  <b>{inr(p.amount)}</b> · {termsLine(p, days)}
                  {p.fee_source === "bulk" ? " · from sheet" : ""}
                  <br />
                  Paid <b>{inr(p.paid_total || 0)}</b> · left <b>{inr(left)}</b>
                  {p.terms_note ? <><br />📝 {p.terms_note}</> : null}
                </p>
              ) : (
                <p>Fee not set — the contract waits for it.</p>
              )}
              {r.first_fee && (
                <p className="pm-dim">
                  First fee with Geek: <b>{inr(r.first_fee.amount)}</b> · {r.first_fee.campaign || ""}
                </p>
              )}
              <div className="pm-btns">
                <button type="button" className="ga-btn ga-btn--ghost" onClick={() => go("fee")}>
                  {p.amount == null ? "💰 Set fee & terms" : "✏️ Fee & terms"}
                </button>
                {p.amount != null && left > 0 && (
                  <button type="button" className="ga-btn ga-btn--ghost" onClick={() => go("pay")}>
                    💸 Pay
                  </button>
                )}
              </div>
            </section>
            <section>
              <h4>Bank / UPI</h4>
              <p>
                {where} · <b>{DET_TXT[p.details_status] || p.details_status || "—"}</b>
                {p.details_source && p.details_source !== "creator" ? ` (${p.details_source === "bulk" ? "from sheet" : "added by team"})` : ""}
                {p.verify_name ? <><br />Name at bank: <b>{p.verify_name}</b>{p.account_name && p.verify_name.toLowerCase() !== String(p.account_name).toLowerCase() ? ` · typed: ${p.account_name}` : ""}</> : p.account_name ? <><br />Name: {p.account_name}</> : null}
                {p.verify_message && p.details_status !== "verified" ? <><br />{p.verify_message}</> : null}
                {p.details_status === "needs_update" && p.request_reason ? <><br />Asked: “{p.request_reason}”</> : null}
              </p>
              <div className="pm-btns">
                <button type="button" className="ga-btn ga-btn--ghost" onClick={() => go("bank")} disabled={anyBusy}>
                  ✏️ {p.method ? "Edit" : "Add"} details
                </button>
                {p.method && (
                  <button type="button" className="ga-btn ga-btn--ghost" onClick={() => go("reveal")}>
                    👁 Full details
                  </button>
                )}
                {p.method && p.details_status !== "verified" && (
                  <button type="button" className="ga-btn ga-btn--ghost" onClick={() => go("verify")}>
                    ✓ Verified by me
                  </button>
                )}
                {p.method && connected && p.details_status !== "verifying" && (
                  <button type="button" className="ga-btn ga-btn--ghost" disabled={busy} onClick={() => quick("api.payment_verify", { p_participation: r.participation_id, p_mode: "auto" }, "Automatic check started — the result shows in a minute ✓")}>
                    ↻ Auto-check
                  </button>
                )}
                <button type="button" className="ga-btn ga-btn--ghost" onClick={() => go("ask")} disabled={anyBusy}>
                  ✉️ Ask again
                </button>
              </div>
            </section>
            <section>
              <h4>Payments</h4>
              {po.length ? (
                po.map((o) => {
                  const bulk = o.status === "processing" && o.provider === "razorpayx_bulk";
                  return (
                    <div key={o.payout_id} className="pm-out">
                      <span>
                        {PART[o.part] || o.part} · <b>{inr(o.amount)}</b> · {STATUS_TXT[o.status] || o.status}
                        {o.status === "due" && o.due_at ? ` · by ${when(o.due_at)}` : ""}
                        {o.utr ? ` · UTR ${o.utr}` : ""}
                        {o.note === "part payment" ? " · part payment" : ""}
                        {o.status === "failed" && o.failure_reason ? ` · ${o.failure_reason}` : ""}
                        {bulk ? ` · in the bulk file (ref ${o.ref_code})` : ""}
                      </span>
                      <span className="pm-btns">
                        {(["due", "failed"].includes(o.status) || bulk) && (
                          <button type="button" className="ga-btn ga-btn--ghost" onClick={() => go("mark", o)}>
                            ✅ Paid (UTR)
                          </button>
                        )}
                        {(bulk || o.status === "failed") && (
                          <button type="button" className="ga-btn ga-btn--ghost" disabled={busy} onClick={() => quick("api.payout_reset", { p_payout: o.payout_id }, "Back to due ✓", "Put this payment back to “due”?\n\nOnly if it was NOT paid through the RazorpayX bulk file (or it failed). It can then be paid again.")}>
                            ↺ Back to due
                          </button>
                        )}
                        {o.proof_path ? (
                          <button type="button" className="ga-btn ga-btn--ghost" onClick={() => openProof(o.proof_path)}>
                            📎 Screenshot
                          </button>
                        ) : o.status === "paid" ? (
                          <button type="button" className="ga-btn ga-btn--ghost" onClick={() => go("proof", o)}>
                            📎 Add screenshot
                          </button>
                        ) : null}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p>{p.amount == null ? "—" : "No payments yet."}</p>
              )}
              <div className="pm-btns">
                {p.on_hold ? (
                  <>
                    <span className="pm-hold">⏸ On hold{p.hold_reason ? `: ${p.hold_reason}` : ""}</span>
                    <button type="button" className="ga-btn ga-btn--ghost" disabled={busy} onClick={() => quick("api.payment_hold", { p_participation: r.participation_id, p_hold: false, p_reason: null }, "Released ✓")}>
                      ▶ Release
                    </button>
                  </>
                ) : (
                  <button type="button" className="ga-btn ga-btn--ghost" onClick={() => go("hold")}>
                    ⏸ Hold
                  </button>
                )}
              </div>
            </section>
          </div>
        )}
        {kind === "bank" && (
          <>
            <p className="pm-txt">Use this when the creator sent their details another way (WhatsApp, email). They must be in the creator&apos;s own name. The automatic check runs again.</p>
            <div className="pm-seg">
              <button type="button" className={f.method === "bank" ? "is-on" : ""} onClick={() => setF((o) => ({ ...o, method: "bank" }))}>
                🏦 Bank account
              </button>
              <button type="button" className={f.method === "upi" ? "is-on" : ""} onClick={() => setF((o) => ({ ...o, method: "upi" }))}>
                📱 UPI ID
              </button>
            </div>
            <label className="ga-label" htmlFor="pm-an">
              Account holder name
            </label>
            <input id="pm-an" className="ga-input" value={f.aname} onChange={set("aname")} maxLength={80} />
            {f.method === "bank" ? (
              <div className="pm-row">
                <div>
                  <label className="ga-label" htmlFor="pm-ano">
                    Account number
                  </label>
                  <input id="pm-ano" className="ga-input" value={f.ano} onChange={set("ano")} inputMode="numeric" autoComplete="off" maxLength={22} placeholder={p.account_last4 ? `•••• ${p.account_last4} — type the full number` : "9–18 digits"} />
                </div>
                <div>
                  <label className="ga-label" htmlFor="pm-ifsc">
                    IFSC
                  </label>
                  <input id="pm-ifsc" className="ga-input" value={f.ifsc} onChange={set("ifsc")} maxLength={11} style={{ textTransform: "uppercase" }} placeholder="HDFC0001234" />
                </div>
              </div>
            ) : (
              <>
                <label className="ga-label" htmlFor="pm-upi">
                  UPI ID
                </label>
                <input id="pm-upi" className="ga-input" value={f.upi} onChange={set("upi")} maxLength={100} autoComplete="off" placeholder="name@okhdfcbank" />
              </>
            )}
          </>
        )}
        {kind === "reveal" && (
          <div className="pm-outs">
            {!rev && !err && <p className="pm-txt">Loading…</p>}
            {rev &&
              [
                ["Name", rev.account_name],
                ...(rev.method === "upi" ? [["UPI ID", rev.upi_id]] : [["Account number", rev.account_no], ["IFSC", rev.ifsc]]),
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <span>{k}</span>
                    <span>
                      <b>{v}</b>{" "}
                      <button type="button" className="pm-copy" onClick={() => copy(v)}>
                        Copy
                      </button>
                    </span>
                  </div>
                ))}
            {rev && <p className="pm-txt">This view is logged. Don&apos;t share these details outside the payment.</p>}
          </div>
        )}
        {kind === "proof" && payout && (
          <>
            <p className="pm-txt">
              {PART[payout.part] || "Payment"} of {inr(payout.amount)}
              {payout.utr ? ` · UTR ${payout.utr}` : ""}. The creator can open and download it from the campaign in their app.
            </p>
            <label className="ga-label" htmlFor="pm-proof">
              Screenshot (image or PDF, under 10 MB)
            </label>
            <input id="pm-proof" ref={fileRef} type="file" accept="image/*,.pdf" className="ga-input pm-file" />
          </>
        )}
        {kind === "hold" && (
          <>
            <p className="pm-txt">No payment goes to {name} until you release it. Use it when a post was taken down or something needs checking.</p>
            <label className="ga-label" htmlFor="pm-reason">
              Why?
            </label>
            <input id="pm-reason" className="ga-input" value={f.reason} onChange={set("reason")} maxLength={200} placeholder="e.g. a post was taken down" autoFocus />
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
          {back && (
            <button type="button" className="ga-btn ga-btn--ghost pm-back" onClick={() => go("manage")}>
              ← Back
            </button>
          )}
          <button type="button" className="ga-btn ga-btn--ghost" onClick={onClose}>
            {["details", "manage", "reveal"].includes(kind) ? "Close" : "Cancel"}
          </button>
          {!["details", "manage", "reveal"].includes(kind) && (
            <button type="submit" className="ga-btn ga-btn--primary" disabled={busy}>
              {busy ? "Saving…" : kind === "verify" ? "Mark verified" : kind === "ask" ? "Send" : kind === "pay" && f.how === "razorpay" ? "⚡ Pay now" : kind === "bank" ? "Save & verify" : kind === "proof" ? "Upload" : kind === "hold" ? "Put on hold" : "Save"}
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
        .pm { max-height: calc(100vh - 40px); overflow-y: auto; }
        .pm-mg { display: grid; gap: 14px; margin-top: 14px; }
        .pm-mg section { padding: 12px 14px; border-radius: 12px; background: var(--ad-soft-2); }
        .pm-mg h4 { margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--ad-muted); }
        .pm-mg p { margin: 0; font-size: 13px; line-height: 1.55; }
        .pm-dim { margin-top: 4px !important; color: var(--ad-muted); }
        .pm-btns { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .pm-btns .ga-btn { height: 32px; padding: 0 11px; font-size: 12px; }
        .pm-out { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 10px; padding: 8px 0; border-bottom: 1px solid var(--ad-line-2); font-size: 13px; }
        .pm-out .pm-btns { margin-top: 0; }
        .pm-hold { align-self: center; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
        .pm-copy { margin-left: 6px; padding: 2px 8px; border: 1px solid var(--ad-line-2); border-radius: 8px; background: #fff; font-size: 11.5px; }
        .pm-back { margin-right: auto; }
        .pm-err { margin-top: 12px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
        .pm-act { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
        @media (max-width: 640px) { .pm-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
