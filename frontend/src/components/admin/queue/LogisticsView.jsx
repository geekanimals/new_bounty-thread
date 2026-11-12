"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import Drawer from "@/components/admin/queue/Drawer";
import { SHIPMENTS, SHIP_STATUSES, SHIP_STEPS, STEP_DONE } from "@/components/admin/queue/queueData";

const KEY = "geek_ship_status";
/* "Update status (demo)" → agla status */
const NEXT = { "No address": "To send", "To send": "In transit", "In transit": "Received", Received: "Received" };
const NEXT_INFO = {
  "To send": { courier: "—", update: "Awaiting pickup" },
  "In transit": { courier: "Courier assigned", update: "Today" },
  Received: { courier: "Delivered", update: "Today" },
};

/**
 * Logistics (Figma 049) + Shipment details drawer (Figma 050) jab openId ho.
 */
export default function LogisticsView({ openId }) {
  const router = useRouter();
  const [over, setOver] = useState({});
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [toast, setToast] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      setOver(JSON.parse(window.sessionStorage.getItem(KEY) || "{}"));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const all = useMemo(() => SHIPMENTS.map((s) => (over[s.id] ? { ...s, ...over[s.id] } : s)), [over]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all
      .filter((s) => !st || s.status === st)
      .filter((s) => !t || [s.creator, s.campaign, s.product, s.courier].join(" ").toLowerCase().includes(t));
  }, [all, q, st]);

  const open = openId ? all.find((s) => s.id === openId) : null;

  const advance = (s) => {
    const status = NEXT[s.status];
    if (status === s.status) return setToast("Already delivered — nothing to update");
    const next = { ...over, [s.id]: { status, ...NEXT_INFO[status] } };
    setOver(next);
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setToast(`${s.creator} · ${s.product} → ${status}`);
  };

  return (
    <AdminShell>
      <PageHead title="Logistics" sub="Every parcel from approval to proof of delivery, with clear exceptions." />

      <Stats
        items={[
          { value: 141, label: "All shipments", note: "Reference snapshot" },
          { value: 10, label: "To send", note: "Needs handoff" },
          { value: 15, label: "In transit", note: "Tracking active" },
          { value: 116, label: "Received", note: "Confirmed by creator" },
          { value: 1, label: "No address", note: "Resolve before shipping" },
        ]}
      />

      <section className="ad-card lg">
        <div className="lg-head">
          <h2 className="ad-h2">Shipment tracker</h2>
          <button type="button" className="ad-btn ad-btn--ghost lg-import" onClick={() => fileRef.current?.click()}>
            ⇧ Import tracking
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setToast(`${f.name} uploaded — tracking will match by creator and AWB`);
              e.target.value = "";
            }}
          />
        </div>

        <div className="lg-filters">
          <input className="ad-input lg-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creator, kit, courier…" aria-label="Search shipments" />
          <select className="ad-input lg-select" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status">
            <option value="">All statuses</option>
            {SHIP_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="lg-wrap" data-scroll>
          <table className="lg-table">
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
                <tr key={s.id} onClick={() => router.push(`/admin/logistics/${s.id}`)}>
                  <td>{s.creator}</td>
                  <td>{s.campaign}</td>
                  <td>{s.product}</td>
                  <td>
                    <span className={`ad-badge ad-badge--${s.status === "To send" ? "orange" : "violet"}`}>{s.status}</span>
                  </td>
                  <td>{s.courier}</td>
                  <td>{s.update}</td>
                  <td>
                    <Link href={`/admin/logistics/${s.id}`} className="lg-more" onClick={(e) => e.stopPropagation()}>
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="lg-empty">No shipments match these filters.</p>}
        </div>
      </section>

      {open && (
        <Drawer eyebrow="Shipment" title="Fulfilment record" closeHref="/admin/logistics">
          <h3 className="lg-h">Shipment timeline</h3>
          <ol className="lg-steps">
            {SHIP_STEPS.map((s, i) => (
              <li key={s} className={i < STEP_DONE[open.status] ? "is-done" : ""}>
                <i>{i + 1}</i>
                {s}
              </li>
            ))}
          </ol>
          <p className="lg-lock">
            <span>🔒</span> Full shipping addresses appear only for authorized fulfilment staff.
          </p>
          <button type="button" className="ad-btn ad-btn--primary lg-update" onClick={() => advance(open)}>
            Update status (demo)
          </button>
        </Drawer>
      )}

      {toast && (
        <div className="ad-toast" role="status">
          ✓ {toast}
        </div>
      )}

      <style>{`
        .lg { padding: 22px 22px 22px; }
        .lg-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .lg-import { height: 40px; padding: 0 20px 0 15px; border-color: var(--ad-line-2); }
        .lg-filters { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
        .lg-search { width: 270px; height: 44px; }
        .lg-search::placeholder { color: #757575; }
        .lg-select { width: 116px; height: 44px; padding-right: 12px; appearance: none; color: var(--ad-text); cursor: pointer; }

        .lg-wrap { margin-top: 22px; overflow-x: auto; }
        .lg-table { width: 100%; min-width: 940px; border-collapse: collapse; font-size: 13px; }
        .lg-table th { padding: 0 11px 13px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #9aa2b4; border-bottom: 1px solid var(--ad-line); white-space: nowrap; }
        .lg-table td { height: 57.5px; padding: 0 11px; border-bottom: 1px solid var(--ad-line); color: var(--ad-ink); white-space: nowrap; }
        .lg-table tbody tr:last-child td { border-bottom: 0; }
        .lg-table tbody tr { cursor: pointer; transition: background .15s; }
        .lg-table tbody tr:hover { background: var(--ad-soft-2); }
        .lg-table th:nth-child(1) { width: 119px; }
        .lg-table th:nth-child(2) { width: 236px; }
        .lg-table th:nth-child(3) { width: 161px; }
        .lg-table th:nth-child(4) { width: 130px; }
        .lg-table th:nth-child(5) { width: 161px; }
        .lg-table th:nth-child(6) { width: 166px; }
        .lg-more { font-size: 13px; font-weight: 800; color: #6151ea; }
        .lg-more:hover { color: var(--ad-primary-2); }
        .lg-empty { padding: 30px 0 10px; text-align: center; font-size: 13px; color: var(--ad-muted); }

        .lg-h { margin: 42px 0 0; font-size: 13px; font-weight: 700; color: var(--ad-ink); }
        .lg-steps { list-style: none; margin: 10px 0 0; padding: 0 0 18px; display: grid; gap: 12.5px; border-bottom: 1px solid var(--ad-line); }
        .lg-steps li { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ad-ink); }
        .lg-steps i { width: 24px; height: 24px; flex-shrink: 0; border-radius: 50%; display: grid; place-items: center; background: var(--ad-lilac); color: #6657f5; font-style: normal; font-size: 11px; font-weight: 800; }
        .lg-lock { display: flex; align-items: center; gap: 10px; margin-top: 0; padding: 12px 16px; border-radius: 12px; border: 1px solid #f3dfbd; background: #fff7ea; font-size: 12px; color: #986016; }
        .lg-update { height: 40px; margin-top: 16px; padding: 0 16px; background: #6757f5; box-shadow: none; }

        @media (max-width: 640px) {
          .lg { padding: 18px 16px; }
          .lg-head { flex-wrap: wrap; }
          .lg-search { flex: 1 1 100%; width: auto; }
          .lg-select { flex: 1 1 100%; width: auto; }
          .lg-wrap { margin: 16px -16px 0; padding: 0 16px; }
        }
      `}</style>
    </AdminShell>
  );
}
