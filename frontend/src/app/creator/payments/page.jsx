"use client";

import { useState } from "react";
import BountyShell from "@/components/creator/BountyShell";
import { RumiTip } from "@/components/creator/OnboardShell";
import { useSession, errText, inr, fmtDate, savePaymentDetails, useMyCampaignRows, useCampaignFlows } from "@/services/creator";
import { getSidekick } from "@/components/creator/data";
import { ChevronDown, Lock, Check } from "@/components/ui/Icons";

const FIRST = 4;
const STATUS = { paid: ["Paid", "bx-tag--green"], pending: ["Pending", ""], waiting: ["Waiting for post", ""], action: ["Action needed", "bx-tag--red"], product: ["Product", "bx-tag--teal"] };
// product mil gaya (barter) — purane Bounty payments jaisa
const GOT = ["product_sent", "content_created", "changes_requested", "content_submitted", "content_approved", "published", "completed", "brand_confirmed"];

/**
 * /creator/payments — "Payments & rewards": kamaai, payouts aur bank/UPI details
 * Purane Bounty payments jaisa: get_my_campaigns + my_campaign_flows (payment + payouts). Bank / UPI → save_payment_details
 * (har paid campaign par hota hai — sign ke baad; koi paid campaign nahi to form nahi khulta, purane jaisa message).
 */
export default function Payments() {
  const [s] = useSession();
  const sk = getSidekick(s.sidekick);
  const mine = useMyCampaignRows();
  const flows = useCampaignFlows();
  const [shown, setShown] = useState(FIRST);
  const [form, setForm] = useState(false);
  const [mode, setMode] = useState("upi");
  const [upi, setUpi] = useState("");
  const [bank, setBank] = useState({ name: "", acc: "", acc2: "", ifsc: "" });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2600);
  };

  // purane loadPayments jaisa hisaab
  const list = Array.isArray(mine.data) ? mine.data : [];
  const F = flows.data || {};
  const payouts = [];
  let earned = 0;
  let pending = 0;
  let needPart = null;
  let haveBank = null;
  const prods = list.filter((c) => c.product_value && GOT.includes(c.stage) && (c.campaign_type || "") !== "paid");
  const prodVal = prods.reduce((x, c) => x + (+c.product_value || 0), 0);
  list.forEach((c) => {
    const f = F[c.participation_id] || {};
    const p = f.payment;
    if (!f.paid || !p) return;
    const pos = p.payouts || [];
    const sumPaid = pos.filter((o) => o.status === "paid").reduce((x, o) => x + (+o.amount || 0), 0);
    const amt = p.amount != null ? +p.amount : null;
    if (amt != null) {
      earned += sumPaid;
      pending += Math.max(0, amt - sumPaid);
    }
    const need = !p.method || ["pending", "failed", "needs_update"].includes(p.details_status);
    if (need && !needPart) needPart = { part: c.participation_id, p };
    if (p.method && !haveBank) haveBank = { part: c.participation_id, p };
    const title = `${c.campaign || "Campaign"}${c.brand ? " · " + c.brand : ""}`;
    const to = p.method === "upi" ? `UPI · ${p.upi_id || ""}` : p.method ? `Bank ••••${p.account_last4 || ""}` : "";
    pos.forEach((o) =>
      payouts.push({
        id: o.payout_id || `${c.participation_id}-${o.part}`,
        title,
        note: o.status === "paid" ? to || "Paid" : o.part === "advance" ? "Advance" : o.part === "balance" ? "Releases after your post is verified" : "Fee",
        amount: inr(o.amount),
        status: o.status === "paid" ? "paid" : ["queued", "processing", "due"].includes(o.status) ? "pending" : "waiting",
        date: o.status === "paid" && o.paid_at ? fmtDate(o.paid_at) : "",
      })
    );
    if (!pos.length) payouts.push({ id: c.participation_id, title, note: need ? "Add payout details" : "After your post", amount: amt != null ? inr(amt) : "—", status: need ? "action" : "waiting", date: "" });
  });
  prods.forEach((c) =>
    payouts.push({ id: `prod-${c.participation_id}`, title: `${c.campaign || "Campaign"}${c.brand ? " · " + c.brand : ""}`, note: `Products worth ${inr(c.product_value)} · delivered`, amount: "Products", status: "product", date: "" })
  );
  const e = { total: inr(earned), paid: inr(earned), pending: inr(pending), products: prods.length };
  const target = needPart || haveBank; // form kis campaign par save hoga
  const tp = target?.p;
  const saved = haveBank && !needPart ? (tp.method === "upi" ? `UPI · ${tp.upi_id || ""}` : `Bank · ••••${tp.account_last4 || ""}${tp.ifsc ? " · " + tp.ifsc : ""}`) : null;
  const savedNote = saved ? (tp.details_status === "verified" ? "verified" : "the Geek team is checking it") : "";
  const loading = (mine.loading || flows.loading) && !mine.data;

  const upiOk = /^[a-z0-9._-]{2,255}@[a-z][a-z0-9.-]{1,63}$/i.test(upi.trim());
  const ifscOk = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc);
  const accOk = /^\d{9,18}$/.test(bank.acc) && bank.acc === bank.acc2;
  const nameOk = bank.name.trim().length >= 3;
  const valid = mode === "upi" ? upiOk && nameOk : nameOk && accOk && ifscOk;

  const openForm = () => {
    if (!target) return flash("You'll add bank / UPI details when a paid campaign needs them — right after you sign its agreement.");
    setMode(tp?.method === "bank" ? "bank" : "upi");
    setUpi(tp?.upi_id || "");
    setBank({ name: tp?.account_name || "", acc: "", acc2: "", ifsc: tp?.ifsc || "" });
    setTried(false);
    setErr("");
    setForm(true);
  };
  const save = async (ev) => {
    ev.preventDefault();
    setTried(true);
    if (!valid || !target) return;
    setBusy(true);
    setErr("");
    const { error } = await savePaymentDetails({ participation: target.part, method: mode, name: bank.name.trim(), accountNo: bank.acc, ifsc: bank.ifsc, upi: upi.trim().toLowerCase() });
    setBusy(false);
    if (error) return setErr(errText(error));
    setForm(false);
    flash("Saved — we're verifying your details");
    flows.reload();
  };

  return (
    <BountyShell>
      <title>Payments — Bounty</title>

      <p className="py-eye">Your earnings</p>
      <h1 className="py-h1">Payments &amp; rewards</h1>
      <p className="py-lede">Every rupee and every product, in one place.</p>

      <div className="py">
        <div className="py-left">
          <section className="py-earned">
            <small>Earned so far</small>
            <strong>{e.total}</strong>
            <p>Paid and hybrid campaigns add up here</p>
          </section>
          <div className="py-tiles">
            <div className="py-tile">
              <strong>{e.paid}</strong>
              <small className="is-green">Paid</small>
            </div>
            <div className="py-tile">
              <strong>{e.pending}</strong>
              <small className="is-orange">Pending</small>
            </div>
            <div className="py-tile">
              <strong>{e.products}</strong>
              <small>Products</small>
            </div>
          </div>
        </div>

        <div className="py-right">
          <p className="py-label">— Payouts —</p>
          {loading ? (
            <div className="py-empty">Loading your payouts…</div>
          ) : mine.error && !mine.data ? (
            <div className="py-empty">
              Couldn&apos;t load payouts.{" "}
              <button type="button" className="py-retry" onClick={() => (mine.reload(), flows.reload())}>
                Try again
              </button>
            </div>
          ) : payouts.length === 0 ? (
            <div className="py-empty">No payouts yet — paid and barter campaigns show up here once you&apos;re selected.</div>
          ) : (
            <ul className="py-list">
              {payouts.slice(0, shown).map((p) => (
                <li key={p.id}>
                  <span className="py-ic">{p.status === "product" ? "🎁" : p.status === "paid" ? "💸" : p.status === "action" ? "🏦" : "⏳"}</span>
                  <span className="py-txt">
                    <strong>{p.title}</strong>
                    <small>{p.note}</small>
                  </span>
                  <span className="py-amt">
                    <strong>{p.amount}</strong>
                    <span className={`bx-tag ${STATUS[p.status][1]}`}>{STATUS[p.status][0]}</span>
                    <small>{p.date}</small>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {shown < payouts.length && (
            <button type="button" className="bx-btn bx-btn--ghost py-more" onClick={() => setShown(payouts.length)}>
              Load more <ChevronDown size={14} />
            </button>
          )}

          {/* Bank / UPI */}
          <section className="py-bank">
            {!form ? (
              <div className="py-bank__row">
                <span>
                  <strong>🏦 {saved ? "Payout details" : "Add your bank / UPI details"}</strong>
                  <small>{saved ? `${saved} · ${savedNote}` : needPart?.p?.details_status === "failed" || needPart?.p?.details_status === "needs_update" ? "Your last details didn't verify — please add them again." : "Must be in your own name. Only you and the Geek team see it."}</small>
                </span>
                <button type="button" className="py-add" onClick={openForm}>
                  {saved ? "Change" : "Add"}
                </button>
              </div>
            ) : (
              <form onSubmit={save}>
                <strong className="py-bank__title">Where should we pay you?</strong>
                <div className="py-seg">
                  <button type="button" className={mode === "upi" ? "is-on" : ""} onClick={() => setMode("upi")}>
                    UPI ID
                  </button>
                  <button type="button" className={mode === "bank" ? "is-on" : ""} onClick={() => setMode("bank")}>
                    Bank account
                  </button>
                </div>
                <label className="bx-label" htmlFor="py-name">
                  Account holder name (exactly as in the bank)
                </label>
                <input id="py-name" className="bx-input" value={bank.name} maxLength={80} autoComplete="name" onChange={(ev) => setBank({ ...bank, name: ev.target.value })} />
                {tried && !nameOk && <p className="bx-err">Type the account holder&apos;s full name.</p>}
                {mode === "upi" ? (
                  <>
                    <label className="bx-label py-gap" htmlFor="py-upi">
                      UPI ID
                    </label>
                    <input id="py-upi" className="bx-input" value={upi} onChange={(ev) => setUpi(ev.target.value)} placeholder="name@okhdfcbank" />
                    {tried && !upiOk && <p className="bx-err">Enter a valid UPI ID, like name@okhdfcbank.</p>}
                  </>
                ) : (
                  <div className="py-grid">
                    <div>
                      <label className="bx-label">Account number</label>
                      <input className="bx-input" inputMode="numeric" value={bank.acc} onChange={(ev) => setBank({ ...bank, acc: ev.target.value.replace(/\D/g, "").slice(0, 18) })} />
                    </div>
                    <div>
                      <label className="bx-label">Re-enter account number</label>
                      <input className="bx-input" inputMode="numeric" value={bank.acc2} onChange={(ev) => setBank({ ...bank, acc2: ev.target.value.replace(/\D/g, "").slice(0, 18) })} />
                    </div>
                    <div className="py-full">
                      <label className="bx-label">IFSC</label>
                      <input className="bx-input" value={bank.ifsc} onChange={(ev) => setBank({ ...bank, ifsc: ev.target.value.toUpperCase().slice(0, 11) })} placeholder="HDFC0001234" />
                    </div>
                    {tried && nameOk && !valid && <p className="bx-err py-full">Check the account numbers match (9–18 digits) and the IFSC looks like HDFC0001234.</p>}
                  </div>
                )}
                <p className="py-safe">
                  <Lock size={12} /> Saved encrypted. Payouts to someone else’s account are blocked.
                </p>
                {err && <p className="bx-err">{err}</p>}
                <div className="py-actions">
                  <button type="button" className="bx-btn bx-btn--ghost" onClick={() => setForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="bx-btn bx-btn--dark" disabled={busy}>
                    <Check size={14} /> {busy ? "Saving…" : "Save & verify"}
                  </button>
                </div>
              </form>
            )}
          </section>

          <RumiTip className="py-rumi" name={sk.name} img={sk.img} text="Add your UPI once — every payout goes there automatically." />
        </div>
      </div>

      {toast && (
        <div className="bx-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        /* Figma: 6 · Payments */
        .py-eye { margin: 8px 0 0; text-align: center; font-size: 11.5px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #b8452f; }
        .py-h1 { margin: 2px 0 0; text-align: center; font-family: var(--bx-serif); font-size: 32px; font-weight: 600; letter-spacing: -0.3px; line-height: 1.25; color: #14231a; }
        .py-lede { margin: 2px 0 0; text-align: center; font-family: var(--bx-serif); font-style: italic; font-size: 14.5px; color: #4a4436; }
        .py { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; max-width: 920px; margin: 16px auto 0; align-items: start; }
        .py-earned { padding: 18px 22px 20px; border-radius: 16px; background: #123524; border: 1px solid rgba(232,176,74,.6); color: #fbf3e2; box-shadow: 0 16px 30px -22px rgba(0,0,0,.6); }
        .py-earned small { font-size: 11px; font-weight: 700; letter-spacing: 1.3px; text-transform: uppercase; color: #f6d98b; }
        .py-earned strong { display: block; margin: 2px 0 6px; font-family: var(--bx-serif); font-size: 44px; font-weight: 600; line-height: 1.2; color: #fbf3e2; }
        .py-earned p { margin: 0; font-size: 13px; color: #d9cdb2; }
        .py-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
        .py-tile { padding: 14px 10px; border-radius: 14px; background: #fbf1dc; border: 1px solid #e6d5ae; text-align: center; }
        .py-tiles strong { display: block; font-family: var(--bx-serif); font-size: 22px; font-weight: 600; color: #14231a; }
        .py-tiles small { font-size: 12px; font-weight: 700; color: #14231a; }
        .py-tiles small.is-green { color: #2e9c94; }
        .py-tiles small.is-orange { color: #c47a1a; }
        .py-label { margin: 0 0 12px; text-align: center; font-family: var(--bx-serif); font-size: 12px; font-weight: 600; letter-spacing: 1.7px; text-transform: uppercase; color: #14231a; }
        .py-empty { padding: 12px 14px; border-radius: 14px; background: #fbf1dc; border: 1px solid #e6d5ae; font-size: 13px; line-height: 1.35; color: #3e4b52; }
        .py-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .py-list li { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; background: #fbf1dc; border: 1px solid #e6d5ae; }
        .py-ic { width: 36px; height: 36px; flex-shrink: 0; border-radius: 10px; background: #fffaf0; display: grid; place-items: center; font-size: 16px; }
        .py-txt { flex: 1; min-width: 0; }
        .py-txt strong { display: block; font-size: 13.5px; font-weight: 700; }
        .py-txt small { display: block; font-size: 12px; color: var(--bx-text); }
        .py-amt { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; text-align: right; }
        .py-amt strong { font-family: var(--bx-serif); font-size: 15px; font-weight: 700; }
        .py-amt small { font-size: 11px; color: var(--bx-muted); }
        .py-more { display: flex; margin: 10px auto 0; }
        .py-bank { margin-top: 14px; padding: 14px 16px; border-radius: 14px; background: #fbf1dc; border: 1px solid #e6d5ae; }
        .py-bank__row { display: flex; align-items: center; gap: 12px; }
        .py-bank__row > span { flex: 1; }
        .py-bank__row strong { display: block; font-size: 16px; font-weight: 700; color: #14231a; }
        .py-add { flex-shrink: 0; height: 34px; padding: 0 18px; border: 0; border-radius: 999px; background: #123524; color: #fbf3e2; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; }
        .py-bank__row small { display: block; margin-top: 2px; font-size: 12.5px; color: #3e4b52; }
        .py-bank__title { display: block; margin-bottom: 10px; font-family: var(--bx-serif); font-size: 17px; font-weight: 600; }
        .py-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; margin-bottom: 12px; border-radius: 999px; background: #efe4cc; }
        .py-seg button { height: 34px; border: 0; border-radius: 999px; background: none; font-size: 13px; font-weight: 600; }
        .py-seg button.is-on { background: var(--bx-green); color: var(--bx-cream); }
        .py-gap { margin-top: 10px; }
        .py-retry { border: 0; background: none; padding: 0; font: inherit; font-weight: 700; color: #2a9d8f; cursor: pointer; }
        .py-grid { margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .py-full { grid-column: 1 / -1; }
        .py-safe { display: flex; align-items: center; gap: 6px; margin: 12px 0; font-size: 12px; color: var(--bx-muted); }
        .py-actions { display: flex; justify-content: flex-end; gap: 8px; }
        .py-rumi { justify-content: center; margin-top: 18px; }
        .py-rumi p { max-width: 230px; }

        @media (max-width: 900px) { .py { grid-template-columns: minmax(0, 1fr); } }
        @media (max-width: 767px) {
          .py-eye { margin-top: 6px; }
          .py { margin-top: 18px; gap: 26px; }
          .py-earned strong { font-size: 40px; }
          .py-tiles strong { font-size: 21px; }
          .py-grid { grid-template-columns: 1fr; }
          .py-actions > * { flex: 1; }
          .py-list li { flex-wrap: wrap; }
        }
      `}</style>
    </BountyShell>
  );
}
