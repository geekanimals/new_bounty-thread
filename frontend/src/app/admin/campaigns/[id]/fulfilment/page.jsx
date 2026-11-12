"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Stats } from "@/components/admin/ui";
import { campaignById } from "@/components/admin/data";

const SHIP = [
  { id: "aarav-shah", who: "Aarav Shah", camp: "Beardo Detan Express Kit", product: "Detan Express Kit", status: "To send", courier: "—", at: "Awaiting pickup" },
  { id: "nisha-rao", who: "Nisha Rao", camp: "Circle Diwali Declutter", product: "Declutter kit", status: "In transit", courier: "Courier assigned", at: "Today" },
  { id: "ritika-sen", who: "Ritika Sen", camp: "Snuggles Barter", product: "PR box", status: "No address", courier: "—", at: "Needs verification" },
  { id: "kabir-mehta", who: "Kabir Mehta", camp: "Beardo Festive Essential Kit", product: "Festive kit", status: "Received", courier: "Delivered", at: "Yesterday" },
  { id: "meera-patel", who: "Meera Patel", camp: "Vaaree Biggest Diwali Sale", product: "Home set", status: "In transit", courier: "Tracking available", at: "Yesterday" },
];
const STATUSES = ["All statuses", "To send", "In transit", "Received", "No address"];

/* Figma: Campaign workspace — Fulfilment */
export default function WorkspaceFulfilment() {
  const { id } = useParams();
  const c = campaignById(id);
  const [q, setQ] = useState("");
  const [st, setSt] = useState(STATUSES[0]);
  const [toast, setToast] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const rows = SHIP.filter((s) => st === STATUSES[0] || s.status === st).filter((s) => `${s.who} ${s.camp} ${s.product} ${s.courier}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <AdminShell>
      <WorkspaceHead id={c.id} />
      <Stats
        items={[
          { value: 141, label: "All shipments", note: "Reference snapshot" },
          { value: 10, label: "To send", note: "Needs handoff" },
          { value: 15, label: "In transit", note: "Tracking active" },
          { value: 116, label: "Received", note: "Confirmed by creator" },
          { value: 1, label: "No address", note: "Resolve before shipping" },
        ]}
      />

      <section className="ad-card wf">
        <div className="wf-head">
          <h2 className="ad-h2">Shipment tracker</h2>
          <button type="button" className="ad-btn ad-btn--ghost wf-imp" onClick={() => fileRef.current?.click()}>
            ⇧ Import tracking
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx" hidden onChange={(e) => e.target.files?.[0] && setToast(`⇧ ${e.target.files[0].name} imported — tracking updated`)} />
        </div>
        <div className="wf-bar">
          <input className="ad-input wf-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creator, kit, courier…" aria-label="Search shipments" />
          <select className="ad-input wf-sel" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status">
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="wf-wrap">
          <table className="ad-table wf-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Campaign</th>
                <th>Product</th>
                <th>Status</th>
                <th>Courier</th>
                <th>Last update</th>
                <th aria-label="Details" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>{s.who}</td>
                  <td>{s.camp}</td>
                  <td>{s.product}</td>
                  <td>
                    <span className={`ad-badge ad-badge--${s.status === "To send" ? "orange" : "violet"}`}>{s.status}</span>
                  </td>
                  <td>{s.courier}</td>
                  <td>{s.at}</td>
                  <td>
                    <Link href={`/admin/logistics/${s.id}`} className="wf-det">
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="wf-cards">
          {rows.map((s) => (
            <Link key={s.id} href={`/admin/logistics/${s.id}`} className="wf-card">
              <div className="wf-card__top">
                <b>{s.who}</b>
                <span className={`ad-badge ad-badge--${s.status === "To send" ? "orange" : "violet"}`}>{s.status}</span>
              </div>
              <span>
                {s.camp} · {s.product}
              </span>
              <span>
                {s.courier} · {s.at}
              </span>
              <em>Details →</em>
            </Link>
          ))}
        </div>
        {!rows.length && <p className="wf-empty">No shipments match.</p>}
      </section>
      {toast && <div className="ad-toast">{toast}</div>}

      <style>{`
        .wf { padding: 22px 22px 20px; }
        .wf-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .wf-imp { height: 41px; padding: 0 15px; }
        .wf-bar { display: flex; gap: 9px; margin-top: 18px; }
        .wf-q { width: 270px; height: 43px; }
        .wf-q::placeholder { color: #757575; }
        .wf-sel { width: 117px; height: 43px; padding: 0 12px; font-size: 14px; color: #293652; appearance: none; background: #fff; }
        .wf-wrap { overflow-x: auto; margin-top: 8px; }
        .wf-table th { background: none; padding: 14px 11px 13px; }
        .wf-table td { height: 57.5px; padding: 8px 11px; }
        .wf-det { font-size: 13px; font-weight: 800; color: #6151ea; }
        .wf-cards { display: none; }
        .wf-empty { padding: 24px; text-align: center; font-size: 13px; color: var(--ad-muted); }
        @media (max-width: 640px) {
          .wf { padding: 18px 14px; }
          .wf-bar { flex-direction: column; }
          .wf-q, .wf-sel { width: 100%; }
          .wf-wrap { display: none; }
          .wf-cards { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
          .wf-card { display: flex; flex-direction: column; gap: 6px; padding: 14px; border-radius: 14px; border: 1px solid var(--ad-line); font-size: 12px; color: var(--ad-muted); }
          .wf-card__top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
          .wf-card b { font-size: 14px; color: var(--ad-ink); }
          .wf-card em { font-style: normal; font-weight: 800; color: #6151ea; }
        }
      `}</style>
    </AdminShell>
  );
}
