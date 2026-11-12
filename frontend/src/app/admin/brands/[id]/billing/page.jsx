"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BrandPanel from "@/components/admin/brand/BrandPanel";
import PTable from "@/components/admin/brand/PTable";
import { brandInfo } from "@/components/admin/brand/store";
import { CAMPAIGNS, brandById } from "@/components/admin/data";

const inr = (n) => (n >= 100000 ? `₹${(n / 100000).toFixed(1).replace(".0", "")}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1).replace(".0", "")}K` : `₹${n}`);

/** /admin/brands/[id]/billing — Billing (Figma 070) */
export default function BrandBilling() {
  const { id } = useParams();
  const b = brandById(id);
  const camps = CAMPAIGNS.filter((c) => !c.hidden && c.brand === b.name);
  const [value, setValue] = useState(() => brandInfo(id).value);
  const [inv, setInv] = useState([]);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ campaign: camps[0]?.name || "", amount: "" });
  const [toast, setToast] = useState("");

  useEffect(() => setValue(brandInfo(id).value), [id]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const billed = inv.reduce((s, i) => s + i.amount, 0);
  const paid = inv.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);

  const add = (e) => {
    e.preventDefault();
    const amount = parseInt(String(f.amount).replace(/\D/g, ""), 10);
    if (!amount) return setToast("Enter an amount");
    const no = `GEEK-${b.name.slice(0, 3).toUpperCase()}-${String(inv.length + 1).padStart(3, "0")}`;
    setInv([...inv, { no, campaign: f.campaign || "General", amount, status: "Due" }]);
    setF({ ...f, amount: "" });
    setAdding(false);
    setToast(`Invoice ${no} created`);
  };

  return (
    <BrandPanel id={id}>
      <div className="bb-stats">
        {[
          [value, "Product value"],
          [inr(billed), "Fees billed"],
          [inr(paid), "Paid"],
          [inr(billed - paid), "Due"],
        ].map(([n, l]) => (
          <div key={l}>
            <strong>{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <section className="bp-sec bb-sec">
        <PTable
          minW={600}
          rowH={50}
          cols={[
            { label: "Invoice", w: "22%" },
            { label: "Campaign", w: "35.5%" },
            { label: "Amount", w: "22.5%" },
            { label: "Status", w: "20%" },
          ]}
          rows={
            inv.length
              ? inv.map((i, k) => [
                  i.no,
                  i.campaign,
                  inr(i.amount),
                  <button key="s" type="button" className={`ad-badge ad-badge--${i.status === "Paid" ? "green" : "orange"} bb-st`} title="Click to mark paid / due" onClick={() => setInv(inv.map((x, j) => (j === k ? { ...x, status: x.status === "Paid" ? "Due" : "Paid" } : x)))}>
                    {i.status}
                  </button>,
                ])
              : [["—", "No invoices yet", "—", "—"]]
          }
        />
        {adding && (
          <form className="bb-form" onSubmit={add}>
            <select className="ad-input" value={f.campaign} onChange={(e) => setF({ ...f, campaign: e.target.value })} aria-label="Campaign">
              {camps.map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
              <option>General</option>
            </select>
            <input className="ad-input" inputMode="numeric" placeholder="Amount (₹)" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} aria-label="Amount" autoFocus />
            <button type="submit" className="ad-btn ad-btn--primary">
              Create
            </button>
          </form>
        )}
        <div className="bp-btns">
          <button type="button" className="ad-btn ad-btn--primary" onClick={() => setAdding(!adding)}>
            {adding ? "Cancel" : "➕ New invoice"}
          </button>
        </div>
      </section>
      {toast && <div className="ad-toast">✓ {toast}</div>}
      <style>{`
        .bb-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 11px; margin-top: 0; }
        .bb-stats div { display: flex; flex-direction: column; padding: 18px 16px 16px; border-radius: 13px; background: var(--ad-soft-2); }
        .bb-stats strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.8px; line-height: 1.15; color: var(--ad-ink); }
        .bb-stats span { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }
        .bb-sec { margin-top: 2px; }
        .bb-sec .pt th { height: 36px; }
        .bb-sec .bp-btns { margin-top: 10px; }
        .bb-st { border: 0; cursor: pointer; }
        .bb-form { display: grid; grid-template-columns: 1.6fr 1fr auto; gap: 8px; margin-top: 12px; }
        @media (max-width: 640px) {
          .bb-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 0; }
          .bb-form { grid-template-columns: 1fr; }
        }
      `}</style>
    </BrandPanel>
  );
}
