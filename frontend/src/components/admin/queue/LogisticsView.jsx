"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import Drawer from "@/components/admin/queue/Drawer";
import { useRpc } from "@/lib/supabase";
import { SHIP_STATUSES, SHIP_STEPS, SHIP_STATUS } from "@/components/admin/queue/queueData";
import { act, errText, useToast, who, ago, fmtDate } from "@/components/admin/queue/live";
import { safeUrl } from "@/lib/supabasePublic";

/* shipments_board row → table ka status */
const statusOf = (s) => (!s.has_address && s.status === "pending" ? "No address" : SHIP_STATUS[s.status] || s.status || "—");
/* timeline mein kitne steps ho chuke */
const stepsDone = (s) => (s.status === "delivered" ? 5 : s.status === "shipped" ? 4 : s.courier ? 3 : s.has_address ? 2 : 1);

/**
 * Logistics (Figma 049) + Shipment details drawer (Figma 050) jab openId (shipment_id) ho.
 * Data: api.shipments_board (purane Logistics page jaisa). Drawer actions purane barter process wale:
 * To send → courier + tracking (api.bp_record_courier) · In transit → Mark delivered (api.bp_mark_delivered).
 */
export default function LogisticsView({ openId }) {
  const router = useRouter();
  const { data, error, loading, reload } = useRpc("admin", "api.shipments_board", {}, { refreshMs: 30000 });
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(null);
  const [toastNode, toast] = useToast();
  const fileRef = useRef(null);

  const all = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all
      .filter((s) => !st || statusOf(s) === st)
      .filter((s) => {
        const c = s.creator || {};
        return !t || [c.name, c.username, s.campaign, s.brand, s.product, s.courier, s.tracking_ref].filter(Boolean).join(" ").toLowerCase().includes(t);
      });
  }, [all, q, st]);
  const n = (fn) => all.filter(fn).length;
  // id = shipment_id (yahan se) ya participation_id (campaign Fulfilment se) — dono chalega
  const oid = openId ? decodeURIComponent(openId) : "";
  const open = oid ? all.find((s) => s.shipment_id === oid) || all.find((s) => s.participation_id === oid) : null;

  const markDelivered = async (s) => {
    setBusy(true);
    const { error: e } = await act.markDelivered(s.participation_id);
    setBusy(false);
    if (e) return toast(errText(e), true);
    toast(`${who(s.creator)} · ${s.product || "product"} → Received`);
    reload(true);
  };
  const saveCourier = async (e) => {
    e.preventDefault();
    if (!form.courier.trim()) return setForm({ ...form, err: "Add the courier name." });
    setBusy(true);
    const { error: err } = await act.recordCourier(open.participation_id, {
      product: form.product.trim() || null,
      courier: form.courier.trim(),
      tracking_ref: form.tracking.trim() || null,
      tracking_url: form.url.trim() || null,
    });
    setBusy(false);
    if (err) return setForm({ ...form, err: errText(err) });
    setForm(null);
    toast(`Tracking saved — ${who(open.creator)} can track the parcel`);
    reload(true);
  };

  return (
    <AdminShell>
      <PageHead title="Logistics" sub="Every parcel from approval to proof of delivery, with clear exceptions." />

      <Stats
        items={[
          { value: all.length, label: "All shipments", note: "Every barter product" },
          { value: n((s) => s.status === "pending"), label: "To send", note: "Needs handoff" },
          { value: n((s) => s.status === "shipped"), label: "In transit", note: "Tracking active" },
          { value: n((s) => s.status === "delivered"), label: "Received", note: "Confirmed by creator" },
          { value: n((s) => !s.has_address), label: "No address", note: "Resolve before shipping" },
        ]}
      />

      <section className="ga-card lg">
        <div className="lg-head">
          <h2 className="ga-h2">Shipment tracker</h2>
          <button type="button" className="ga-btn ga-btn--ghost lg-import" onClick={() => fileRef.current?.click()}>
            ⇧ Import tracking
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            hidden
            onChange={(e) => {
              // purane app mein tracking ek-ek creator par (barter process) ya campaign bulk upload se aata tha
              toast("Coming soon — add tracking per creator, or use the campaign's Bulk upload");
              e.target.value = "";
            }}
          />
        </div>

        <div className="lg-filters">
          <input className="ga-input lg-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creator, kit, courier…" aria-label="Search shipments" />
          <select className="ga-input lg-select" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status">
            <option value="">All statuses</option>
            {SHIP_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="lg-wrap" data-scroll>
          {loading && !data && <p className="lg-empty">Loading shipments…</p>}
          {!data && error && (
            <p className="lg-empty lg-err">
              ⚠️ {errText(error)}{" "}
              <button type="button" className="lg-more" onClick={() => reload()}>
                Retry
              </button>
            </p>
          )}
          {data && (
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
                {rows.map((s) => {
                  const status = statusOf(s);
                  const last = s.delivered_at || s.shipped_at;
                  return (
                    <tr key={s.shipment_id} onClick={() => router.push(`/admin/logistics/${s.shipment_id}`)}>
                      <td>{who(s.creator)}</td>
                      <td>{s.campaign || "—"}</td>
                      <td>{s.product || "—"}</td>
                      <td>
                        <span className={`ga-badge ga-badge--${status === "To send" || status === "No address" ? "orange" : status === "Received" ? "green" : "violet"}`}>{status}</span>
                      </td>
                      <td>{s.courier ? `${s.courier}${s.tracking_ref ? ` · ${s.tracking_ref}` : ""}` : "—"}</td>
                      <td>{last ? ago(last) : status === "No address" ? "Needs verification" : "Awaiting pickup"}</td>
                      <td>
                        <Link href={`/admin/logistics/${s.shipment_id}`} className="lg-more" onClick={(e) => e.stopPropagation()}>
                          Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {data && !rows.length && <p className="lg-empty">{all.length ? "No shipments match these filters." : "No products shipped yet."}</p>}
        </div>
      </section>

      {open && (
        <Drawer eyebrow="Shipment" title="Fulfilment record" closeHref="/admin/logistics">
          <h3 className="lg-h">Shipment timeline</h3>
          <ol className="lg-steps">
            {SHIP_STEPS.map((s, i) => (
              <li key={s} className={i < stepsDone(open) ? "is-done" : ""}>
                <i>{i < stepsDone(open) ? "✓" : i + 1}</i>
                {s}
                {i === 3 && open.shipped_at && <small className="lg-when">{fmtDate(open.shipped_at)}</small>}
                {i === 4 && open.delivered_at && <small className="lg-when">{fmtDate(open.delivered_at)}</small>}
              </li>
            ))}
          </ol>
          {(open.courier || open.tracking_ref) && (
            <p className="lg-track">
              {open.courier || "Courier"}
              {open.tracking_ref ? ` · ${open.tracking_ref}` : ""}
              {open.tracking_url && (
                <a href={safeUrl(open.tracking_url)} target="_blank" rel="noopener noreferrer">
                  {" "}
                  Track →
                </a>
              )}
            </p>
          )}
          <p className="lg-lock">
            <span>🔒</span> Full shipping addresses appear only for authorized fulfilment staff.
          </p>
          {open.status === "pending" && (
            <button
              type="button"
              className="ga-btn ga-btn--primary lg-update"
              disabled={!open.has_address}
              title={open.has_address ? "" : "Creator hasn't added an address yet"}
              onClick={() => setForm({ product: open.product || "", courier: open.courier || "", tracking: open.tracking_ref || "", url: open.tracking_url || "", err: "" })}
            >
              🚚 Add courier &amp; tracking
            </button>
          )}
          {open.status === "shipped" && (
            <button type="button" className="ga-btn ga-btn--primary lg-update" disabled={busy} onClick={() => markDelivered(open)}>
              {busy ? "…" : "📦 Mark delivered"}
            </button>
          )}
          {open.campaign_id && (
            <Link href={`/admin/campaigns/${open.campaign_id}/fulfilment`} className="ga-btn ga-btn--ghost lg-update lg-camp">
              Open campaign
            </Link>
          )}

          {form && (
            <form className="lg-form" onSubmit={saveCourier}>
              <label className="ga-label">Product</label>
              <input className="ga-input" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder="Momo box" />
              <label className="ga-label">Courier</label>
              <input className="ga-input" value={form.courier} onChange={(e) => setForm({ ...form, courier: e.target.value, err: "" })} placeholder="DTDC / Delhivery / Blue Dart" />
              <label className="ga-label">Tracking number</label>
              <input className="ga-input" value={form.tracking} onChange={(e) => setForm({ ...form, tracking: e.target.value })} placeholder="DT123456789" />
              <label className="ga-label">Tracking link (optional)</label>
              <input className="ga-input" type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://www.dtdc.in/tracking…" />
              {form.err && <p className="lg-ferr">{form.err}</p>}
              <div className="lg-fact">
                <button type="submit" className="ga-btn ga-btn--primary" disabled={busy}>
                  {busy ? "Saving…" : "Save — creator gets the tracking"}
                </button>
                <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setForm(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Drawer>
      )}
      {openId && !open && data && (
        <Drawer eyebrow="Shipment" title="Shipment not found" closeHref="/admin/logistics">
          <p className="lg-empty">This shipment isn’t on the board any more.</p>
        </Drawer>
      )}

      {toastNode}

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
        .lg-update:disabled { opacity: .5; }
        .lg-camp { background: #fff; margin-left: 6px; }
        .lg-steps li.is-done i { background: #6757f5; color: #fff; }
        .lg-when { margin-left: auto; font-size: 11.5px; color: var(--ad-muted); }
        .lg-track { margin: 0 0 12px; padding-top: 12px; font-size: 13px; font-weight: 700; color: var(--ad-ink); }
        .lg-track a { color: var(--ad-primary); }
        .lg-err { color: var(--ad-red); font-weight: 700; }
        .lg-form { margin-top: 18px; padding-top: 4px; border-top: 1px solid var(--ad-line); }
        .lg-form .ga-label { margin-top: 12px; }
        .lg-ferr { margin-top: 10px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
        .lg-fact { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }

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
