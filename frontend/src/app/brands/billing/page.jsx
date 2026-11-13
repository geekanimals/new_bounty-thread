"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import { BrLoading, BrError, BrEmpty } from "@/components/brands/BrandStates";
import { useInvoices, payInvoice, resetOpenBills, printInvoice, inr, fdate } from "@/services/brand";
import { Receipt, CreditCard, FileText, Download, Bank, QrCode, Check, ChevronDown } from "@/components/ui/Icons";

const FIRST = 5;

/**
 * /brands/billing — purana paintBilling:
 *  api.brand_invoices (bills + due / paid + online + can_pay), Razorpay wapsi (?rzpbill → brand-billing check),
 *  Pay now (brand-billing pay → Razorpay), bill / receipt download (printInvoice).
 */
export default function BrandBilling() {
  const inv = useInvoices();
  const d = inv.data;
  const L = inv.list;
  const [shown, setShown] = useState(FIRST);
  const [paying, setPaying] = useState("");
  const [year, setYear] = useState(""); // "This year" — saal effect mein (render mein Date nahi)
  const [toast, setToast] = useState("");
  useEffect(() => {
    setYear(String(new Date().getFullYear()));
  }, []);
  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2800);
  };
  // Razorpay se wapsi ka jawab (purana gateToast)
  useEffect(() => {
    if (inv.returned) flash(inv.returned.paid ? "Payment received — thank you! The receipt is ready." : "Payment not completed yet — you can try again.");
  }, [inv.returned]);

  const open = L.filter((i) => i.status === "requested");
  const due = open.find((i) => i.overdue) || open[0];
  const canPay = !!(d && d.can_pay);
  const yr = L.filter((i) => i.status !== "cancelled" && (!year || String(i.issued_on || "").startsWith(year)));
  const billed = yr.reduce((a, i) => a + (Number(i.total) || 0), 0);
  const paidY = yr.filter((i) => i.status === "paid").reduce((a, i) => a + (Number(i.paid_amount || i.total) || 0), 0);
  const dueY = yr.filter((i) => i.status === "requested").reduce((a, i) => a + (Number(i.total) || 0), 0);

  const download = (b) => {
    if (!printInvoice(b)) flash("Allow pop-ups to download the bill.");
  };
  // Pay now (purana data-bpxpay → brand-billing pay)
  const pay = async (b) => {
    setPaying(b.invoice_id);
    const r = await payInvoice(b.invoice_id);
    if (r.error || (r.data && r.data.error)) {
      setPaying("");
      return flash((r.error && r.error.message) || r.data.error);
    }
    if (r.data && r.data.paid) {
      setPaying("");
      resetOpenBills();
      flash("This bill is already paid ✓");
      return inv.reload();
    }
    window.location.href = r.data.url;
  };

  return (
    <BrandShell>
      <title>Billing — Geek OS Brand</title>

      <p className="br-eyebrow">Insights</p>
      <h1 className="br-h1">Billing</h1>
      <p className="br-sub">Bills from Geek Creative Agency, payments and receipts.</p>

      {due && (
        <section className="bl-due">
          <span className="bl-due__ic">
            <Receipt size={20} />
          </span>
          <div className="bl-due__txt">
            <strong>
              {inr(due.total)} {due.overdue ? "overdue since" : "due"} {due.due_on ? `${due.overdue ? "" : "on "}${fdate(due.due_on)}` : "now"}
            </strong>
            <small>
              {due.invoice_no} · {due.campaign || due.title}
              {open.length > 1 ? ` — ${open.length} bills open` : ""}
            </small>
          </div>
          <div className="bl-due__btns">
            <Link href={`/brands/billing/${due.invoice_id}`} className="br-btn br-btn--ghost">
              View bill
            </Link>
            {canPay && (
              <button type="button" className="br-btn br-btn--primary" onClick={() => pay(due)} disabled={!!paying}>
                <CreditCard size={15} /> {paying === due.invoice_id ? "Opening Razorpay…" : "Pay now"}
              </button>
            )}
          </div>
        </section>
      )}

      <div className="bl-grid">
        <div>
          {inv.loading && !d ? (
            <BrLoading rows={5} />
          ) : inv.error && !d ? (
            <BrError error={inv.error} onRetry={inv.reload} />
          ) : !L.length ? (
            <BrEmpty title="No bills yet" text="When the Geek team sends a payment request, it shows up here — you get an alert too." />
          ) : (
            <div className="br-table-wrap">
              <table className="br-table bl-table">
                <thead>
                  <tr>
                    <th>Bill</th>
                    <th>Campaign</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {L.slice(0, shown).map((b) => (
                    <tr key={b.invoice_id} className={b.status === "requested" ? "is-due" : ""}>
                      <td>
                        <Link href={`/brands/billing/${b.invoice_id}`} className="bl-no">
                          <FileText size={14} /> {b.invoice_no}
                        </Link>
                      </td>
                      <td>{b.campaign || b.title}</td>
                      <td className="bl-muted">{fdate(b.issued_on)}</td>
                      <td>
                        <strong>{inr(b.total)}</strong>
                      </td>
                      <td>
                        {b.status === "requested" ? (
                          <span className={`br-badge br-badge--${b.overdue ? "red" : "orange"}`}>{b.overdue ? "Overdue" : "Due"}</span>
                        ) : b.status === "cancelled" ? (
                          <span className="br-badge br-badge--grey">Cancelled</span>
                        ) : (
                          <span className="br-badge br-badge--green">{b.paid_via === "manual" ? "Paid · bank" : "Paid"}</span>
                        )}
                      </td>
                      <td className="bl-act">
                        {b.status === "requested" && canPay ? (
                          <button type="button" className="br-btn br-btn--primary br-btn--sm" onClick={() => pay(b)} disabled={!!paying}>
                            {paying === b.invoice_id ? "Opening…" : "Pay now"}
                          </button>
                        ) : (
                          <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={() => download(b)}>
                            <Download size={13} /> {b.status === "paid" ? "Receipt" : "Bill"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {shown < L.length && (
            <div className="br-more">
              <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(L.length)}>
                Load more <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>

        <aside className="br-card bl-side">
          <h2 className="br-card__title">This year</h2>
          <dl className="bl-sum">
            <div>
              <dt>Total billed</dt>
              <dd>{inr(billed)}</dd>
            </div>
            <div>
              <dt>Paid</dt>
              <dd className="is-green">{inr(paidY)}</dd>
            </div>
            <div>
              <dt>Due</dt>
              <dd className="is-red">{inr(dueY)}</dd>
            </div>
          </dl>
          <p className="bl-how">How to pay</p>
          <ul className="bl-ways">
            <li>
              <span>
                <CreditCard size={15} />
              </span>
              <p>
                <strong>Razorpay</strong>
                <small>{d && !d.online ? "Not available right now — pay by bank / UPI" : "Card, UPI, net banking — instant"}</small>
              </p>
            </li>
            <li>
              <span>
                <Bank size={15} />
              </span>
              <p>
                <strong>Bank transfer</strong>
                <small>Account details are on each bill</small>
              </p>
            </li>
            <li>
              <span>
                <QrCode size={15} />
              </span>
              <p>
                <strong>UPI</strong>
                <small>UPI details are on each bill</small>
              </p>
            </li>
          </ul>
          <p className="bl-note">Bank and UPI payments are marked paid after Geek confirms them (usually same day).</p>
        </aside>
      </div>

      {toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .bl-due {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          margin: 22px 0 18px; padding: 20px 22px; border-radius: 18px;
          background: linear-gradient(100deg, #fff1f5 0%, #fff 70%);
          border: 1px solid #fbd3df;
        }
        .bl-due__ic { width: 46px; height: 46px; border-radius: 13px; background: linear-gradient(135deg, #e8336d, #ff6a95); color: #fff; display: grid; place-items: center; flex-shrink: 0; }
        .bl-due__txt { flex: 1; min-width: 220px; }
        .bl-due__txt strong { display: block; font-size: 21px; font-weight: 800; letter-spacing: -0.02em; }
        .bl-due__txt small { display: block; margin-top: 2px; font-size: 12.5px; color: var(--br-muted); }
        .bl-due__btns { display: flex; gap: 10px; }

        .bl-grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: start; }
        .bl-table tr.is-due td { background: #faf9ff; }
        .bl-no { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; }
        .bl-no:hover { color: var(--br-primary); }
        .bl-muted { color: var(--br-muted); }
        .bl-act { text-align: right; }

        .bl-side { padding: 20px; }
        .bl-sum { margin: 14px 0 0; display: grid; gap: 8px; }
        .bl-sum div { display: flex; justify-content: space-between; font-size: 13px; }
        .bl-sum dt { color: var(--br-muted); }
        .bl-sum dd { margin: 0; font-weight: 800; }
        .bl-sum .is-green { color: var(--br-green); }
        .bl-sum .is-red { color: var(--br-red); }
        .bl-how { margin: 18px 0 10px; padding-top: 14px; border-top: 1px solid var(--br-border); font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--br-faint); }
        .bl-ways { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
        .bl-ways li { display: flex; gap: 10px; align-items: flex-start; }
        .bl-ways span { width: 30px; height: 30px; border-radius: 9px; background: #f1f2f7; display: grid; place-items: center; flex-shrink: 0; }
        .bl-ways p { margin: 0; }
        .bl-ways strong { display: block; font-size: 13px; font-weight: 700; }
        .bl-ways small { display: block; font-size: 11.5px; color: var(--br-muted); }
        .bl-note { margin: 14px 0 0; font-size: 11.5px; line-height: 1.5; color: var(--br-faint); }

        @media (max-width: 1100px) { .bl-grid { grid-template-columns: minmax(0, 1fr); } }
        @media (max-width: 640px) {
          .bl-due { padding: 16px; }
          .bl-due__txt strong { font-size: 18px; }
          .bl-due__btns { width: 100%; }
          .bl-due__btns > * { flex: 1; }
        }
      `}</style>
    </BrandShell>
  );
}
