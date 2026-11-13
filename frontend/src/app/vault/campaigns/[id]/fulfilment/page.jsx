"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Stats } from "@/components/admin/ui";
import { useRpc, errText } from "@/lib/supabase";
import { useCampaign, useToast, fmtDate } from "@/components/admin/campaign/live";

const STATUSES = ["All statuses", "To send", "In transit", "Received", "No address"];
const SHIP_STAGES = ["contract_signed", "address_confirmed", "product_sent", "product_delivered", "content_created", "content_submitted", "changes_requested", "content_approved", "published", "completed"];

/* barter_tracker creator → shipment row */
function partRow(x, camp) {
  const sh = x.shipment || null;
  const cr = x.creator || {};
  const status = sh ? (sh.status === "delivered" ? "Received" : "In transit") : x.has_address || x.stage === "address_confirmed" ? "To send" : "No address";
  return {
    id: "p-" + x.participation_id,
    href: `/vault/logistics/${x.participation_id}`,
    who: cr.name || (cr.username ? "@" + cr.username : "Creator"),
    camp,
    product: (sh && sh.product) || x.contract?.product || "—",
    status,
    courier: sh ? [sh.courier, sh.tracking_ref].filter(Boolean).join(" · ") || "Courier assigned" : "—",
    at: sh ? fmtDate(sh.delivered_at || sh.shipped_at) : status === "No address" ? "Needs address" : "Awaiting pickup",
  };
}
/* sheet invite (bulk) → shipment row */
function invRow(i, camp, idCamp) {
  const st = i.status;
  const status = ["courier_delivered", "video_brief_sent", "video_submitted", "client_approved", "posted"].includes(st) ? "Received" : st === "courier_sent" ? "In transit" : i.has_address ? "To send" : "No address";
  return { id: "i-" + i.invite_id, href: `/vault/campaigns/${idCamp}/creators/i-${i.invite_id}`, who: i.name || (i.handle ? "@" + i.handle : "Creator"), camp, product: "—", status, courier: [i.courier, i.tracking].filter(Boolean).join(" · ") || "—", at: "From the sheet" };
}

/* Figma: Campaign workspace — Fulfilment (barter_tracker shipments + sheet invites) */
export default function WorkspaceFulfilment() {
  const { id } = useParams();
  const router = useRouter();
  const c = { id };
  const { c: camp } = useCampaign(id);
  const on = !!id && id !== "sample";
  const bt = useRpc("admin", "api.barter_tracker", { p_campaign: id }, { skip: !on, refreshMs: 300000 });
  const people = useRpc("admin", "api.campaign_people", { p_campaign: id }, { skip: !on });
  const [q, setQ] = useState("");
  const [st, setSt] = useState(STATUSES[0]);
  const [toast, setToast] = useToast();

  const name = camp?.name || bt.data?.campaign?.name || "Campaign";
  const all = [
    ...(bt.data?.creators || []).filter((x) => SHIP_STAGES.includes(x.stage)).map((x) => partRow(x, name)),
    ...(people.data?.invites || []).filter((i) => ["contract_signed", "address_confirmed", "courier_sent", "courier_delivered", "video_brief_sent", "video_submitted", "client_approved", "posted"].includes(i.status)).map((i) => invRow(i, name, id)),
  ];
  const cnt = (s) => all.filter((r) => r.status === s).length;
  const rows = all.filter((s) => st === STATUSES[0] || s.status === st).filter((s) => `${s.who} ${s.camp} ${s.product} ${s.courier}`.toLowerCase().includes(q.trim().toLowerCase()));
  const loading = bt.loading || people.loading;
  const v = (n) => (loading ? "…" : n);
  return (
    <AdminShell>
      <WorkspaceHead id={id} campaign={camp} />
      <Stats
        items={[
          { value: v(all.length), label: "All shipments", note: "This campaign" },
          { value: v(cnt("To send")), label: "To send", note: "Needs handoff" },
          { value: v(cnt("In transit")), label: "In transit", note: "Tracking active" },
          { value: v(cnt("Received")), label: "Received", note: "Confirmed by creator" },
          { value: v(cnt("No address")), label: "No address", note: "Resolve before shipping" },
        ]}
      />

      <section className="ga-card wf">
        <div className="wf-head">
          <h2 className="ga-h2">Shipment tracker</h2>
          {/* courier + tracking ek saath — Bulk sheet se (purane app jaisa: sheet mein Courier / Tracking columns) */}
          <button type="button" className="ga-btn ga-btn--ghost wf-imp" onClick={() => router.push(`/vault/campaigns/${id}/upload`)}>
            ⇧ Import tracking
          </button>
        </div>
        <div className="wf-bar">
          <input className="ga-input wf-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creator, kit, courier…" aria-label="Search shipments" />
          <select className="ga-input wf-sel" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status">
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="wf-wrap">
          <table className="ga-table wf-table">
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
                    <span className={`ga-badge ga-badge--${s.status === "To send" ? "orange" : s.status === "No address" ? "red" : s.status === "Received" ? "green" : "violet"}`}>{s.status}</span>
                  </td>
                  <td>{s.courier}</td>
                  <td>{s.at}</td>
                  <td>
                    <Link href={s.href} className="wf-det">
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
            <Link key={s.id} href={s.href} className="wf-card">
              <div className="wf-card__top">
                <b>{s.who}</b>
                <span className={`ga-badge ga-badge--${s.status === "To send" ? "orange" : s.status === "No address" ? "red" : s.status === "Received" ? "green" : "violet"}`}>{s.status}</span>
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
        {!rows.length && <p className="wf-empty">{bt.error ? errText(bt.error) : loading ? "Loading shipments…" : all.length ? "No shipments match." : "Nothing to ship yet — creators show here once they sign the contract."}</p>}
      </section>
      {toast && <div className="ga-toast">{toast}</div>}

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
