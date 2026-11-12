"use client";

import { useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import { BILLS, BILL_YEAR } from "@/components/brands/data";
import { Receipt, CreditCard, FileText, Download, Bank, QrCode, Check, ChevronDown } from "@/components/ui/Icons";

const FIRST = 5;

/** /brands/billing — Geek Creative Agency ke bills, payment aur receipts */
export default function BrandBilling() {
  const [shown, setShown] = useState(FIRST);
  const [toast, setToast] = useState("");
  const due = BILLS.find((b) => b.status === "due");

  const receipt = (b) => {
    setToast(`Receipt for ${b.no} is downloading…`);
    setTimeout(() => setToast(""), 2400);
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
              {due.amount} due on {due.due}
            </strong>
            <small>
              {due.no} · {due.campaign} — {due.note}
            </small>
          </div>
          <div className="bl-due__btns">
            <Link href={`/brands/billing/${due.id}`} className="br-btn br-btn--ghost">
              View bill
            </Link>
            <Link href={`/brands/billing/${due.id}#pay`} className="br-btn br-btn--primary">
              <CreditCard size={15} /> Pay now
            </Link>
          </div>
        </section>
      )}

      <div className="bl-grid">
        <div>
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
                {BILLS.slice(0, shown).map((b) => (
                  <tr key={b.id} className={b.status === "due" ? "is-due" : ""}>
                    <td>
                      <Link href={`/brands/billing/${b.id}`} className="bl-no">
                        <FileText size={14} /> {b.no}
                      </Link>
                    </td>
                    <td>{b.campaign}</td>
                    <td className="bl-muted">{b.date}</td>
                    <td>
                      <strong>{b.amount}</strong>
                    </td>
                    <td>
                      {b.status === "due" ? (
                        <span className="br-badge br-badge--red">Due</span>
                      ) : (
                        <span className="br-badge br-badge--green">{b.paidVia === "bank" ? "Paid · bank" : "Paid"}</span>
                      )}
                    </td>
                    <td className="bl-act">
                      {b.status === "due" ? (
                        <Link href={`/brands/billing/${b.id}#pay`} className="br-btn br-btn--primary br-btn--sm">
                          Pay now
                        </Link>
                      ) : (
                        <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={() => receipt(b)}>
                          <Download size={13} /> Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shown < BILLS.length && (
            <div className="br-more">
              <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(BILLS.length)}>
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
              <dd>{BILL_YEAR.billed}</dd>
            </div>
            <div>
              <dt>Paid</dt>
              <dd className="is-green">{BILL_YEAR.paid}</dd>
            </div>
            <div>
              <dt>Due</dt>
              <dd className="is-red">{BILL_YEAR.due}</dd>
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
                <small>Card, UPI, net banking — instant</small>
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
                <small>Scan the QR on the bill</small>
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
