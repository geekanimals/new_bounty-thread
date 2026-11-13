"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import BrandPanel, { useBrand } from "@/components/admin/brand/BrandPanel";
import PTable from "@/components/admin/brand/PTable";
import { rpc, invoke, useRpc, errText } from "@/lib/supabase";
import { fmtDate, inr, inrFull, useToast } from "@/components/admin/brand/util";

/**
 * /vault/brands/[id]/billing — Billing (Figma 070), purane app jaisa:
 *  bills: api.brand_invoices · GST default: api.admin_billing_settings
 *  new bill: api.admin_invoice_save · paid / undo / cancel: api.admin_invoice_mark · Razorpay pay link: brand-billing { action: "pay" }
 */
export default function BrandBillingPage() {
  const { id } = useParams();
  return (
    <BrandPanel id={id}>
      <BrandBilling />
    </BrandPanel>
  );
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function BrandBilling() {
  const { d, b } = useBrand();
  const inv = useRpc("admin", "api.brand_invoices", { p_brand: b.brand_id });
  const set = useRpc("admin", "api.admin_billing_settings", { p: null });
  const L = inv.data?.invoices || [];
  const camps = d.campaigns || [];
  const T = d.totals || {};
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ campaign: "", amount: "" });
  const [pay, setPay] = useState(null); // bill jise "paid" mark kar rahe
  const [pf, setPf] = useState({ amt: "", on: "", ref: "" });
  const [ask, setAsk] = useState(null); // { kind: "cancel" | "unpay", i }
  const [busy, setBusy] = useState(false);
  const [toast, say] = useToast();

  const billed = L.filter((i) => i.status !== "cancelled").reduce((s, i) => s + (Number(i.total) || 0), 0);
  const product = Number(T.product_value) ? inr(T.product_value) : "—";

  const add = async (e) => {
    e.preventDefault();
    const rate = parseFloat(String(f.amount).replace(/[^\d.]/g, ""));
    if (!rate) return say("Enter an amount");
    setBusy(true);
    const p = {
      invoice_id: null, brand_id: b.brand_id, campaign_id: f.campaign || null, title: "Campaign services",
      gst_pct: set.data?.default_gst ?? 18, due_on: null, notes: "",
      items: [{ description: "Influencer campaign management", qty: 1, rate }],
    };
    const r = await rpc("admin", "api.admin_invoice_save", { p });
    setBusy(false);
    if (r.error) return say(errText(r.error));
    setF({ campaign: "", amount: "" });
    setAdding(false);
    say(`✓ Payment request sent to ${b.name}`);
    inv.reload(true);
  };

  const openPay = (i) => {
    setPay(i);
    setPf({ amt: String(i.total ?? ""), on: today(), ref: "" });
  };
  const markPaid = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await rpc("admin", "api.admin_invoice_mark", { p_invoice: pay.invoice_id, p_action: "paid", p_ref: pf.ref || null, p_amount: parseFloat(pf.amt) || null, p_paid_on: pf.on || null, p_note: null });
    setBusy(false);
    if (r.error) return say(errText(r.error));
    setPay(null);
    say("✓ Marked paid — the brand gets the receipt");
    inv.reload(true);
  };
  const confirm = async () => {
    const { kind, i } = ask;
    setAsk(null);
    const r = await rpc("admin", "api.admin_invoice_mark", { p_invoice: i.invoice_id, p_action: kind });
    if (r.error) return say(errText(r.error));
    say(kind === "cancel" ? "Bill cancelled" : "Back to unpaid");
    inv.reload(true);
  };
  const payLink = async (i) => {
    const r = await invoke("admin", "brand-billing", { action: "pay", invoice_id: i.invoice_id });
    if (r.error) return say(errText(r.error));
    if (r.data?.paid) {
      say("Already paid ✓");
      return inv.reload(true);
    }
    try {
      await navigator.clipboard.writeText(r.data.url);
      say("Razorpay pay link copied ✓ — send it to the brand");
    } catch {
      say(`Pay link: ${r.data.url}`);
    }
    inv.reload(true);
  };

  const status = (i) =>
    i.status === "paid" ? (
      <button type="button" className="ga-badge ga-badge--green bb-st" title={i.paid_via === "manual" ? "Paid by hand — click to undo" : "Paid on Razorpay"} onClick={() => i.paid_via === "manual" && setAsk({ kind: "unpay", i })}>
        Paid
      </button>
    ) : i.status === "cancelled" ? (
      <span className="ga-badge">Cancelled</span>
    ) : (
      <button type="button" className={`ga-badge ga-badge--${i.overdue ? "red" : "orange"} bb-st`} title="Click to mark paid" onClick={() => openPay(i)}>
        {i.overdue ? "Overdue" : "Due"}
      </button>
    );

  return (
    <>
      <div className="bb-stats">
        {[
          [product, "Product value"],
          [inv.loading ? "—" : inr(billed), "Fees billed"],
          [inv.loading ? "—" : inr(inv.data?.paid), "Paid"],
          [inv.loading ? "—" : inr(inv.data?.due), "Due"],
        ].map(([n, l]) => (
          <div key={l}>
            <strong>{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <section className="bp-sec bb-sec">
        {inv.error ? (
          <p className="bb-state">
            Couldn’t load bills: {errText(inv.error)}{" "}
            <button type="button" onClick={() => inv.reload()}>
              Retry
            </button>
          </p>
        ) : (
          <PTable
            minW={660}
            rowH={50}
            cols={[
              { label: "Invoice", w: "20%" },
              { label: "Campaign", w: "31%" },
              { label: "Amount", w: "18%" },
              { label: "Status", w: "14%" },
              { label: "", w: "17%" },
            ]}
            rows={
              inv.loading
                ? [["…", "Loading bills…", "—", "—", ""]]
                : L.length
                  ? L.map((i) => [
                      <span key="n" title={`${i.title || ""} · issued ${fmtDate(i.issued_on)}`}>
                        {i.invoice_no}
                      </span>,
                      <span key="c" title={i.campaign || "General"}>
                        {i.campaign || "General"}
                      </span>,
                      inrFull(i.total),
                      status(i),
                      i.status === "requested" ? (
                        <span key="a" className="bb-acts">
                          <button type="button" className="pt-link" onClick={() => payLink(i)}>
                            🔗 Pay link
                          </button>
                          <button type="button" className="pt-link" onClick={() => setAsk({ kind: "cancel", i })}>
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <span key="a" className="bb-when">
                          {i.status === "paid" ? fmtDate(i.paid_at) : ""}
                        </span>
                      ),
                    ])
                  : [["—", "No invoices yet", "—", "—", ""]]
            }
          />
        )}

        {pay && (
          <form className="bb-pay" onSubmit={markPaid}>
            <p>
              Mark <b>{pay.invoice_no}</b> paid — for a bank transfer, UPI or cheque outside Razorpay.
            </p>
            <div className="bb-pay__grid">
              <input className="ga-input" type="number" min="0" step="0.01" value={pf.amt} onChange={(e) => setPf({ ...pf, amt: e.target.value })} aria-label="Amount received (₹)" placeholder="Amount received (₹)" />
              <input className="ga-input" type="date" value={pf.on} onChange={(e) => setPf({ ...pf, on: e.target.value })} aria-label="Paid on" />
              <input className="ga-input" maxLength={120} value={pf.ref} onChange={(e) => setPf({ ...pf, ref: e.target.value })} placeholder="UTR / UPI ref / cheque no" aria-label="Reference" />
            </div>
            <div className="bp-btns">
              <button type="submit" className="ga-btn ga-btn--primary" disabled={busy}>
                {busy ? "Saving…" : "Mark paid & send receipt"}
              </button>
              <button type="button" className="bp-plain" onClick={() => setPay(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {ask && (
          <div className="bb-ask">
            <p>{ask.kind === "cancel" ? `Cancel ${ask.i.invoice_no}? The brand won’t be able to pay it.` : `Undo the manual “paid” on ${ask.i.invoice_no}? The bill goes back to unpaid.`}</p>
            <div className="bp-btns">
              <button type="button" className="ga-btn ga-btn--danger" onClick={confirm}>
                {ask.kind === "cancel" ? "Yes, cancel bill" : "Yes, undo"}
              </button>
              <button type="button" className="bp-plain" onClick={() => setAsk(null)}>
                Keep it
              </button>
            </div>
          </div>
        )}

        {adding && (
          <form className="bb-form" onSubmit={add}>
            <select className="ga-input" value={f.campaign} onChange={(e) => setF({ ...f, campaign: e.target.value })} aria-label="Campaign">
              <option value="">General (no campaign)</option>
              {camps.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input className="ga-input" inputMode="decimal" placeholder="Amount (₹, before GST)" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} aria-label="Amount" autoFocus />
            <button type="submit" className="ga-btn ga-btn--primary" disabled={busy}>
              {busy ? "Sending…" : "Create"}
            </button>
          </form>
        )}
        <div className="bp-btns">
          <button type="button" className="ga-btn ga-btn--primary" onClick={() => setAdding(!adding)}>
            {adding ? "Cancel" : "➕ New invoice"}
          </button>
        </div>
      </section>
      {toast && <div className="ga-toast">{toast}</div>}
      <style>{`
        .bb-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 11px; margin-top: 0; }
        .bb-stats div { display: flex; flex-direction: column; padding: 18px 16px 16px; border-radius: 13px; background: var(--ad-soft-2); }
        .bb-stats strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.8px; line-height: 1.15; color: var(--ad-ink); }
        .bb-stats span { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }
        .bb-sec { margin-top: 2px; }
        .bb-sec .pt th { height: 36px; }
        .bb-sec .bp-btns { margin-top: 10px; }
        .bb-st { border: 0; cursor: pointer; }
        .bb-acts { display: inline-flex; gap: 10px; }
        .bb-when { font-size: 12px; color: var(--ad-muted); }
        .bb-state { padding: 14px 0; font-size: 13px; color: var(--ad-red); }
        .bb-state button { border: 0; background: none; padding: 0; font-weight: 800; color: #6657e9; }
        .bb-form { display: grid; grid-template-columns: 1.6fr 1fr auto; gap: 8px; margin-top: 12px; }
        .bb-pay, .bb-ask { margin-top: 12px; padding: 12px 14px; border-radius: 13px; font-size: 13px; }
        .bb-pay { background: var(--ad-soft-2); border: 1px solid var(--ad-line); color: var(--ad-ink); }
        .bb-pay__grid { display: grid; grid-template-columns: 1fr 1fr 1.4fr; gap: 8px; margin-top: 10px; }
        .bb-ask { background: var(--ad-red-bg); color: var(--ad-red); }
        @media (max-width: 640px) {
          .bb-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 0; }
          .bb-form, .bb-pay__grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
