"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import Drawer from "@/components/admin/queue/Drawer";
import { useRpc, sbFor } from "@/lib/supabase";
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
  const [imp, setImp] = useState(null); // { rows:[{s, courier, tracking, url}], miss:[], busy, done }
  const [batches, setBatches] = useState(null);
  useEffect(() => {
    // purane Logistics ka "Barter batches" (public.barter_items)
    sbFor("admin")
      .from("barter_items")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data: b }) => setBatches(b || []));
  }, []);

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
          { value: all.length, label: "All shipments", note: st === "" ? "● showing now" : "Every barter product", onClick: () => setSt(""), on: st === "" },
          { value: n((s) => s.status === "pending" && s.has_address), label: "To send", note: st === "To send" ? "● showing now" : "Needs handoff", onClick: () => setSt("To send"), on: st === "To send" },
          { value: n((s) => s.status === "shipped"), label: "In transit", note: st === "In transit" ? "● showing now" : "Tracking active", onClick: () => setSt("In transit"), on: st === "In transit" },
          { value: n((s) => s.status === "delivered"), label: "Received", note: st === "Received" ? "● showing now" : "Confirmed by creator", onClick: () => setSt("Received"), on: st === "Received" },
          { value: n((s) => !s.has_address && s.status === "pending"), label: "No address", note: st === "No address" ? "● showing now" : "Resolve before shipping", onClick: () => setSt("No address"), on: st === "No address" },
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
            onChange={async (e) => {
              const f = e.target.files && e.target.files[0];
              e.target.value = "";
              if (!f) return;
              if (!/\.csv$/i.test(f.name)) return toast("Save the sheet as CSV first (File → Download → CSV).", true);
              const text = await f.text();
              const lines = text.split(/\r?\n/).filter((l) => l.trim());
              const split = (l) => (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) || []).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim());
              const H = split(lines[0] || "").map((h) => h.toLowerCase());
              const col = (...k) => H.findIndex((h) => k.some((x) => h.includes(x)));
              const ci = { h: col("instagram", "handle", "username"), c: col("courier"), t: col("tracking", "awb", "docket"), u: col("link", "url") };
              if (ci.h < 0 || ci.c < 0) return toast("The CSV needs an Instagram handle column and a Courier column.", true);
              const rows = [];
              const miss = [];
              lines.slice(1).forEach((l) => {
                const v = split(l);
                const h = (v[ci.h] || "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/[/?#].*$/, "").replace(/^@/, "").toLowerCase();
                if (!h) return;
                const ship = all.find((x) => x.status === "pending" && x.has_address && ((x.creator && x.creator.username) || "").toLowerCase() === h);
                if (!ship || !(v[ci.c] || "").trim()) return miss.push("@" + h);
                rows.push({ s: ship, courier: v[ci.c].trim(), tracking: ci.t >= 0 ? v[ci.t] || "" : "", url: ci.u >= 0 ? v[ci.u] || "" : "" });
              });
              setImp({ rows, miss, busy: false, done: 0 });
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
                  <th>Sent</th>
                  <th>Received</th>
                  <th>Last update</th>
                  <th aria-label="Details" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const status = statusOf(s);
                  const last = s.delivered_at || s.shipped_at;
                  return (
                    <tr key={s.shipment_id} onClick={() => router.push(`/vault/logistics/${s.shipment_id}`)}>
                      <td>
                        {who(s.creator)}
                        {s.creator && s.creator.username && s.creator.name ? <small className="lg-sub">@{s.creator.username}</small> : null}
                        {!s.has_address && <small className="lg-sub">⚠️ no address on file</small>}
                      </td>
                      <td>
                        {s.campaign || "—"}
                        {(s.brand || s.org_name) && <small className="lg-sub">{s.brand || s.org_name}</small>}
                      </td>
                      <td>{s.product || "—"}</td>
                      <td>
                        <span className={`ga-badge ga-badge--${status === "To send" || status === "No address" ? "orange" : status === "Received" ? "green" : "violet"}`}>{status}</span>
                      </td>
                      <td>{s.courier ? `${s.courier}${s.tracking_ref ? ` · ${s.tracking_ref}` : ""}` : "—"}</td>
                      <td>{s.shipped_at ? fmtDate(s.shipped_at) : "—"}</td>
                      <td>{s.delivered_at ? fmtDate(s.delivered_at) : "—"}</td>
                      <td>{last ? ago(last) : status === "No address" ? "Needs verification" : "Awaiting pickup"}</td>
                      <td>
                        <Link href={`/vault/logistics/${s.shipment_id}`} className="lg-more" onClick={(e) => e.stopPropagation()}>
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

      {batches && batches.length > 0 && (
        <section className="ga-card lg lg-batches">
          <h2 className="ga-h2">Barter batches</h2>
          {batches.map((b) => {
            const lab = { Requested: "To ship", Matched: "To ship", Shipped: "In transit", "Content Live": "Delivered", Completed: "Delivered" }[b.stage] || b.stage || "To ship";
            return (
              <div key={b.id} className="lg-batch">
                <span>
                  <b>{b.product || b.creator || "Barter item"}</b>
                  <small className="lg-sub">{b.creator || "—"}</small>
                </span>
                <span className={`ga-badge ga-badge--${lab === "Delivered" ? "green" : lab === "In transit" ? "violet" : "orange"}`}>{lab}</span>
              </div>
            );
          })}
        </section>
      )}

      {imp && (
        <div className="ga-overlay" onClick={() => !imp.busy && setImp(null)}>
          <div className="ga-modal lg-imp" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Import tracking">
            <h2 className="ga-h2">⇧ Import tracking</h2>
            <p className="lg-sub">
              {imp.rows.length} parcel(s) matched to creators waiting for their product. Saving marks them <b>In transit</b> — each creator can track their parcel.
            </p>
            {imp.miss.length > 0 && <p className="lg-sub">Skipped {imp.miss.length} (no waiting shipment with an address, or no courier): {imp.miss.slice(0, 12).join(", ")}{imp.miss.length > 12 ? "…" : ""}</p>}
            <div className="lg-implist">
              {imp.rows.map((r) => (
                <div key={r.s.shipment_id}>
                  <b>{who(r.s.creator)}</b> · {r.s.campaign} — {r.courier}
                  {r.tracking ? ` · ${r.tracking}` : ""}
                </div>
              ))}
            </div>
            {imp.busy && <p className="lg-sub">Saving {imp.done}/{imp.rows.length}…</p>}
            <div className="lg-fact">
              <button type="button" className="ga-btn ga-btn--ghost" disabled={imp.busy} onClick={() => setImp(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="ga-btn ga-btn--primary"
                disabled={imp.busy || !imp.rows.length}
                onClick={async () => {
                  setImp((v) => ({ ...v, busy: true }));
                  let ok = 0;
                  const bad = [];
                  for (const r of imp.rows) {
                    const { error: e2 } = await act.recordCourier(r.s.participation_id, { product: r.s.product || null, courier: r.courier, tracking_ref: r.tracking.trim() || null, tracking_url: r.url.trim() || null });
                    if (e2) bad.push(who(r.s.creator));
                    else ok++;
                    setImp((v) => ({ ...v, done: ok + bad.length }));
                  }
                  setImp(null);
                  toast(`✓ Tracking saved for ${ok}${bad.length ? ` · failed: ${bad.join(", ")}` : ""}`, bad.length > 0);
                  reload(true);
                }}
              >
                Save {imp.rows.length} tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <Drawer eyebrow="Shipment" title="Fulfilment record" closeHref="/vault/logistics">
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
              {busy ? "…" : "📦 Courier delivered"}
            </button>
          )}
          {open.campaign_id && (
            <Link href={`/vault/campaigns/${open.campaign_id}/fulfilment`} className="ga-btn ga-btn--ghost lg-update lg-camp">
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
        <Drawer eyebrow="Shipment" title="Shipment not found" closeHref="/vault/logistics">
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
        .lg-sub { display: block; margin-top: 3px; font-size: 11.5px; color: var(--ad-muted); }
        .lg-batches { margin-top: 18px; }
        .lg-batch { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 0; border-top: 1px solid var(--ad-line); font-size: 13px; }
        .lg-imp { padding: 22px; max-width: 560px; }
        .lg-implist { max-height: 260px; overflow: auto; margin-top: 10px; font-size: 12.5px; display: grid; gap: 6px; }
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
