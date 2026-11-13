"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BrandShell from "@/components/brands/BrandShell";
import { BrLoading, BrError, BrEmpty } from "@/components/brands/BrandStates";
import { useInvoices, payInvoice, resetOpenBills, printInvoice, inr, fdate } from "@/services/brand";
import { ArrowLeft, Download, CreditCard, Check, Copy, Bank, QrCode } from "@/components/ui/Icons";

// bank_note (Super Admin ka likha) → "Account no.: 123" jaisi lines alag rows mein; UPI id alag
const bankRows = (note) =>
  String(note || "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^([^:]{2,30}):\s*(.+)$/);
      return m ? [m[1].trim(), m[2].trim()] : ["", l];
    });
const upiOf = (note) => (String(note || "").match(/\b[\w.-]{2,}@[a-z]{2,}\b(?![.\w])/i) || [""])[0];

/**
 * /brands/billing/[id] — ek bill (id = invoice_id): purane bill print jaisi details + pay.
 *  - Pay with Razorpay → brand-billing { action:"pay" } → Razorpay link (wapsi /app.html?rzpbill → /brands/billing)
 *  - Download PDF / Receipt → printInvoice (purana BrandBilling.print — "Save as PDF")
 *  - Bank / UPI → bill ke seller.bank_note se
 */
export default function BillPage() {
  const { id } = useParams();
  const inv = useInvoices();
  const d = inv.data;
  const b = inv.list.find((x) => x.invoice_id === id);
  const [mode, setMode] = useState(null); // null | "bank"
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState("");

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2800);
  };

  if (inv.loading && !d) {
    return (
      <BrandShell crumbs={[{ label: "Billing", href: "/brands/billing" }, { label: "Bill" }]}>
        <BrLoading rows={6} />
      </BrandShell>
    );
  }
  if (inv.error && !d) {
    return (
      <BrandShell crumbs={[{ label: "Billing", href: "/brands/billing" }, { label: "Bill" }]}>
        <BrError error={inv.error} onRetry={inv.reload} />
      </BrandShell>
    );
  }
  if (!b) {
    return (
      <BrandShell crumbs={[{ label: "Billing", href: "/brands/billing" }, { label: "Bill" }]}>
        <BrEmpty title="Bill not found" text="This bill isn't in your account any more.">
          <Link href="/brands/billing" className="br-btn br-btn--soft br-btn--sm">
            Back to Billing
          </Link>
        </BrEmpty>
      </BrandShell>
    );
  }

  const s = b.seller || {};
  const by = b.buyer || {};
  const status = b.status; // requested | paid | cancelled
  const isDue = status === "requested";
  const canPay = isDue && d && d.can_pay;

  // Pay now (purana data-bpxpay)
  const payRazorpay = async () => {
    setPaying(true);
    const r = await payInvoice(b.invoice_id);
    if (r.error || (r.data && r.data.error)) {
      setPaying(false);
      return flash((r.error && r.error.message) || r.data.error);
    }
    if (r.data && r.data.paid) {
      setPaying(false);
      resetOpenBills();
      flash("This bill is already paid ✓");
      return inv.reload();
    }
    window.location.href = r.data.url;
  };
  const download = () => {
    if (!printInvoice(b)) flash("Allow pop-ups to download the bill.");
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard na mile to bhi chalega */
    }
    flash("Copied");
  };
  const rows = bankRows(s.bank_note);
  const upi = upiOf(s.bank_note);

  return (
    <BrandShell crumbs={[{ label: "Billing", href: "/brands/billing" }, { label: b.invoice_no }]}>
      <title>{`${b.invoice_no} — Geek OS Brand`}</title>

      <Link href="/brands/billing" className="br-back">
        <span>
          <ArrowLeft size={13} />
        </span>
        Back to Billing
      </Link>

      <article className="br-card iv">
        <header className="iv-head">
          <div>
            <p className="iv-from">
              <span>g</span> {s.trade_name || s.legal_name || "Geek Creative Agency"}
            </p>
            <h1>{status === "paid" ? "Payment receipt" : "Tax invoice"}</h1>
          </div>
          <div className="iv-no">
            {status === "paid" ? (
              <span className="br-badge br-badge--green">Paid{b.paid_at ? ` · ${fdate(b.paid_at)}` : ""}</span>
            ) : status === "cancelled" ? (
              <span className="br-badge br-badge--grey">Cancelled</span>
            ) : (
              <span className={`br-badge br-badge--${b.overdue ? "red" : "orange"}`}>
                {b.overdue ? "Overdue" : "Due"}
                {b.due_on ? ` ${fdate(b.due_on)}` : ""}
              </span>
            )}
            <strong>{b.invoice_no}</strong>
            <small>Issued {fdate(b.issued_on)}</small>
          </div>
        </header>

        <div className="iv-parties">
          <div>
            <small>Billed to</small>
            <strong>{by.name || b.brand || "—"}</strong>
            <span>{by.gstin ? `GSTIN ${by.gstin}` : by.address || "GSTIN not on file"}</span>
          </div>
          <div>
            <small>For</small>
            <strong>{b.campaign || b.title}</strong>
            <span>{b.campaign ? b.title : s.sac_code ? `SAC ${s.sac_code}` : ""}</span>
          </div>
        </div>

        <div className="iv-items">
          <div className="iv-row iv-row--head">
            <span>Item</span>
            <span>Qty</span>
            <span>Amount</span>
          </div>
          {(b.items || []).map((it, k) => (
            <div key={k} className="iv-row">
              <span>{it.description}</span>
              <span>{it.qty}</span>
              <strong>{inr((Number(it.qty) || 0) * (Number(it.rate) || 0), true)}</strong>
            </div>
          ))}
        </div>

        <div className="iv-total">
          <div>
            <span>Subtotal</span>
            <span>{inr(b.subtotal, true)}</span>
          </div>
          <div>
            <span>GST {Number(b.gst_pct)}%</span>
            <span>{inr(b.gst_amount, true)}</span>
          </div>
          <div className="iv-total__big">
            <strong>{isDue ? "Total due" : "Total"}</strong>
            <strong>{inr(b.total, true)}</strong>
          </div>
        </div>

        <footer className="iv-foot" id="pay">
          <button type="button" className="br-btn br-btn--ghost" onClick={download}>
            <Download size={15} /> Download PDF
          </button>
          {isDue && (
            <div className="iv-pay">
              <button type="button" className={`br-btn br-btn--ghost ${mode === "bank" ? "is-on" : ""}`} onClick={() => setMode(mode === "bank" ? null : "bank")}>
                Bank / UPI
              </button>
              {canPay && (
                <button type="button" className="br-btn br-btn--primary" onClick={payRazorpay} disabled={paying}>
                  <CreditCard size={15} /> {paying ? "Opening Razorpay…" : "Pay with Razorpay"}
                </button>
              )}
            </div>
          )}
          {status === "paid" && (
            <button type="button" className="br-btn br-btn--soft" onClick={download}>
              <Download size={15} /> Receipt
            </button>
          )}
        </footer>

        {/* Bank / UPI details (inline) */}
        {isDue && mode === "bank" && (
          <section className="iv-bank">
            <div className="iv-bank__col">
              <p className="iv-bank__title">
                <Bank size={15} /> Bank transfer
              </p>
              {[...rows, ["Reference", b.invoice_no]].map(([k, v], i) => (
                <div key={i} className="iv-bank__row">
                  <span>{k}</span>
                  <strong>{v}</strong>
                  <button type="button" onClick={() => copy(v)} aria-label={`Copy ${k || "line"}`}>
                    <Copy size={13} />
                  </button>
                </div>
              ))}
              {!rows.length && <p className="iv-bank__none">The Geek team hasn&apos;t added bank details yet — ask your account manager.</p>}
            </div>
            {upi && (
              <div className="iv-bank__qr">
                <p className="iv-bank__title">
                  <QrCode size={15} /> UPI
                </p>
                <button type="button" className="iv-upi" onClick={() => copy(upi)}>
                  {upi} <Copy size={12} />
                </button>
              </div>
            )}
            <div className="iv-bank__done">
              <p>Paid by bank or UPI? Tell Geek — they confirm it the same day.</p>
              <button type="button" className="br-btn br-btn--dark" onClick={() => flash("Telling Geek from here — coming soon. Share the UTR with your account manager.")}>
                <Check size={14} /> I’ve paid
              </button>
            </div>
          </section>
        )}

        {status === "paid" && (
          <p className="iv-msg iv-msg--ok">
            <Check size={14} /> Payment received{b.paid_amount || b.total ? ` — ${inr(b.paid_amount || b.total, true)}` : ""} on {fdate(b.paid_at)} ·{" "}
            {b.paid_via === "razorpay" ? "Online (Razorpay)" : "Bank transfer / UPI / cheque"}
            {b.paid_ref ? ` · Ref ${b.paid_ref}` : ""}
          </p>
        )}
        {b.notes && <p className="iv-msg">{b.notes}</p>}
      </article>

      {toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .iv { padding: 28px; }
        .iv-bank__none { margin: 6px 0 0; font-size: 12.5px; color: var(--br-muted); }
        .iv-upi { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; padding: 8px 12px; border: 1px dashed var(--br-border-2); border-radius: 10px; background: #fff; font-size: 13px; font-weight: 700; }
        .iv-head { display: flex; justify-content: space-between; gap: 16px; }
        .iv-from { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 14px; font-weight: 700; }
        .iv-from span { width: 26px; height: 26px; border-radius: 8px; background: var(--br-grad); color: #fff; display: grid; place-items: center; font-weight: 800; }
        .iv-head h1 { margin: 8px 0 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
        .iv-no { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; text-align: right; }
        .iv-no strong { font-size: 14px; font-weight: 800; }
        .iv-no small { font-size: 12px; color: var(--br-muted); }

        .iv-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 22px 0 14px; }
        .iv-parties div { padding: 14px 16px; border-radius: 12px; background: #f4f5fa; }
        .iv-parties small { display: block; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--br-faint); }
        .iv-parties strong { display: block; margin-top: 4px; font-size: 13.5px; font-weight: 700; }
        .iv-parties span { display: block; font-size: 12px; color: var(--br-muted); }

        .iv-row { display: grid; grid-template-columns: minmax(0, 1fr) 80px 120px; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--br-border); font-size: 13.5px; }
        .iv-row > :last-child { text-align: right; }
        .iv-row--head { font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--br-faint); }

        .iv-total { margin-top: 16px; padding: 14px 16px; border-radius: 12px; background: #f4f5fa; display: grid; gap: 6px; }
        .iv-total div { display: flex; justify-content: space-between; font-size: 13px; color: var(--br-muted); }
        .iv-total__big { margin-top: 6px; padding-top: 10px; border-top: 1px solid var(--br-border-2); color: var(--br-ink) !important; }
        .iv-total__big strong:first-child { font-size: 14px; }
        .iv-total__big strong:last-child { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }

        .iv-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: 20px; scroll-margin-top: 100px; }
        .iv-pay { display: flex; gap: 10px; }
        .iv-pay .is-on { border-color: var(--br-primary); color: var(--br-primary); }

        .iv-bank {
          display: grid; grid-template-columns: minmax(0, 1.3fr) auto; gap: 18px;
          margin-top: 18px; padding: 18px; border-radius: 14px; border: 1px dashed var(--br-border-2);
          animation: ivIn .2s ease;
        }
        @keyframes ivIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        .iv-bank__title { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; font-size: 13.5px; font-weight: 800; }
        .iv-bank__row { display: flex; align-items: center; gap: 10px; padding: 7px 0; font-size: 13px; }
        .iv-bank__row span { width: 110px; color: var(--br-muted); flex-shrink: 0; }
        .iv-bank__row strong { flex: 1; min-width: 0; overflow-wrap: anywhere; }
        .iv-bank__row button { border: 0; background: #f1f2f7; width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; color: var(--br-text); }
        .iv-bank__qr { text-align: center; }
        .iv-qr { display: grid; grid-template-columns: repeat(7, 14px); gap: 2px; padding: 10px; border-radius: 12px; border: 1px solid var(--br-border); background: #fff; }
        .iv-qr i { width: 14px; height: 14px; border-radius: 2px; background: #f1f2f7; }
        .iv-qr i.on { background: var(--br-ink); }
        .iv-bank__qr small { display: block; margin-top: 8px; font-size: 11.5px; color: var(--br-muted); }
        .iv-bank__done { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-top: 14px; border-top: 1px solid var(--br-border); }
        .iv-bank__done p { margin: 0; font-size: 12.5px; color: var(--br-muted); }

        .iv-msg { display: flex; align-items: center; gap: 8px; margin: 16px 0 0; padding: 12px 14px; border-radius: 12px; background: var(--br-orange-bg); font-size: 13px; font-weight: 600; }
        .iv-msg--ok { background: var(--br-green-bg); color: var(--br-green); }

        @media (max-width: 640px) {
          .iv { padding: 18px; }
          .iv-head { flex-direction: column; }
          .iv-no { align-items: flex-start; text-align: left; }
          .iv-parties { grid-template-columns: 1fr; }
          .iv-row { grid-template-columns: minmax(0, 1fr) 36px 92px; font-size: 12.5px; }
          .iv-foot > *, .iv-pay { width: 100%; }
          .iv-pay > * { flex: 1; }
          .iv-bank { grid-template-columns: 1fr; }
          .iv-bank__qr { justify-self: start; text-align: left; }
          .iv-bank__row span { width: 92px; }
        }
      `}</style>
    </BrandShell>
  );
}
