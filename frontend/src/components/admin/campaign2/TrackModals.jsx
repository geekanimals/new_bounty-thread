"use client";

import { useState } from "react";
import { rpc, errText } from "@/lib/supabase";
import { splitCsv } from "@/components/admin/campaign2/kit";

/*
 * 🔗 Links & codes ke popups — purane tracking.js jaisa:
 *  paste  → track_links_bulk (@handle, CODE, link) + track_codes_bulk (sirf codes ki list)
 *  sales  → track_sales_add (source "manual")
 *  report → brand ka order CSV → code se creator match → track_sales_add (source "csv", 500 ek baar mein)
 */
export default function TrackModal({ kind, campaign, data, onClose, onDone }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const title = { paste: "📋 Paste codes & brand links", sales: "➕ Add orders / sales", report: "📤 Upload the brand's order report" }[kind];
  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-modal tm" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <h3 className="ad-h2">{title}</h3>
        {kind === "paste" && <Paste campaign={campaign} busy={busy} setBusy={setBusy} setErr={setErr} onDone={onDone} />}
        {kind === "sales" && <Sales campaign={campaign} data={data} busy={busy} setBusy={setBusy} setErr={setErr} onDone={onDone} />}
        {kind === "report" && <Report campaign={campaign} data={data} busy={busy} setBusy={setBusy} setErr={setErr} onDone={onDone} />}
        {err && <p className="tm-err">{err}</p>}
        <div className="tm-x">
          <button type="button" className="ad-btn ad-btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <style>{`
        .tm { width: min(720px, 100%); padding: 24px; }
        .tm-txt { margin-top: 10px; font-size: 13px; line-height: 1.5; color: var(--ad-muted); }
        .tm textarea.ad-input { margin-top: 12px; min-height: 180px; font-family: ui-monospace, monospace; font-size: 12.5px; }
        .tm-check { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 13px; }
        .tm-lines { display: grid; gap: 8px; margin-top: 12px; }
        .tm-line { display: grid; grid-template-columns: 1.6fr 1fr .6fr .9fr 1fr; gap: 8px; }
        .tm-line .ad-input { height: 38px; font-size: 12.5px; padding: 0 10px; }
        .tm-head { display: grid; grid-template-columns: 1.6fr 1fr .6fr .9fr 1fr; gap: 8px; margin-top: 12px; font-size: 10px; font-weight: 700; letter-spacing: 1.1px; text-transform: uppercase; color: #9aa2b4; }
        .tm-map { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; margin-top: 12px; }
        .tm-map select { height: 40px; }
        .tm-go { display: flex; gap: 10px; align-items: center; margin-top: 16px; flex-wrap: wrap; }
        .tm-err { margin-top: 12px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
        .tm-x { display: flex; justify-content: flex-end; margin-top: 18px; }
        @media (max-width: 640px) { .tm-line, .tm-head { grid-template-columns: 1fr 1fr; } .tm-map { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

function Paste({ campaign, busy, setBusy, setErr, onDone }) {
  const [t, setT] = useState("");
  const [ow, setOw] = useState(false);
  const save = async () => {
    setErr("");
    const withH = [],
      pool = [];
    t.split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((l) => {
        const url = (l.match(/https?:\/\/\S+/i) || [""])[0];
        const p = l
          .replace(url, " ")
          .split(/[,\t;]+|\s+/)
          .map((x) => x.trim())
          .filter(Boolean);
        const h = p.length && (/^@/.test(p[0]) || p.length > 1 || url) ? p[0].replace(/^@/, "") : "";
        let code = p.length > 1 ? p[p.length - 1] : (!h && p[0]) || "";
        if (h && p.length === 1) code = "";
        if (h) withH.push({ handle: h, code, url });
        else if (code) pool.push({ code });
      });
    if (!withH.length && !pool.length) return setErr("Paste at least one line.");
    setBusy(true);
    const msg = [];
    if (withH.length) {
      const { data, error } = await rpc("admin", "api.track_links_bulk", { p_campaign: campaign, p_rows: withH, p_overwrite: ow });
      if (error) return setBusy(false), setErr(errText(error));
      if (data?.codes) msg.push(`${data.codes} code${data.codes === 1 ? "" : "s"}`);
      if (data?.links) msg.push(`${data.links} brand link${data.links === 1 ? "" : "s"}`);
      if (data?.skipped) msg.push(`${data.skipped} @handle not on this campaign`);
    }
    if (pool.length) {
      const { data, error } = await rpc("admin", "api.track_codes_bulk", { p_campaign: campaign, p_rows: pool, p_overwrite: false });
      if (error) return setBusy(false), setErr(errText(error));
      msg.push(`${data?.set ?? 0} code${data?.set === 1 ? "" : "s"} from the list`);
    }
    setBusy(false);
    onDone(`✓ Saved: ${msg.join(" · ") || "nothing new"}`);
  };
  return (
    <>
      <p className="tm-txt">
        One per line, straight from the brand&apos;s sheet: <b>@handle, CODE</b> · <b>@handle, https://brand-link</b> · <b>@handle, CODE, https://brand-link</b>. A line with only a code goes to the next creator without one.
      </p>
      <textarea className="ad-input" value={t} onChange={(e) => setT(e.target.value)} placeholder={"@riya.sharma, OLIORIYA15, https://brand.com/p/serum?ref=riya\n@foodie.aman, https://brand.com/p/combo\n@style.neha, OLIONEHA15\nOLIO15A"} />
      <label className="tm-check">
        <input type="checkbox" checked={ow} onChange={(e) => setOw(e.target.checked)} /> Replace codes / links creators already have
      </label>
      <div className="tm-go">
        <button type="button" className="ad-btn ad-btn--primary" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </>
  );
}

function Sales({ campaign, data, busy, setBusy, setErr, onDone }) {
  const L = data?.links || [];
  const cfg = data?.config || {};
  const blank = () => ({ w: "", o: "", n: "1", a: "", d: "" });
  const [lines, setLines] = useState([blank(), blank(), blank()]);
  const set = (i, k) => (e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)));
  const save = async () => {
    setErr("");
    const rows = lines
      .map((x) => ({ handle: /^h:/.test(x.w) ? x.w.slice(2) : "", code: /^c:/.test(x.w) ? x.w.slice(2) : "", order_ref: x.o.trim(), orders: x.n, amount: x.a, date: x.d }))
      .filter((x) => x.handle || x.code);
    if (!rows.length) return setErr("Pick a creator on at least one line.");
    setBusy(true);
    const { data: r, error } = await rpc("admin", "api.track_sales_add", { p_campaign: campaign, p_rows: rows, p_source: "manual" });
    setBusy(false);
    if (error) return setErr(errText(error));
    onDone(`✓ ${r?.added ?? 0} saved${r?.duplicates ? ` · ${r.duplicates} already there` : ""}`);
  };
  return (
    <>
      <p className="tm-txt">From the brand&apos;s store or seller panel. One line per order — or one line per creator with the total orders and amount. With an order number, the same order is never counted twice.</p>
      <div className="tm-head">
        <span>Creator / code</span>
        <span>Order no.</span>
        <span>Orders</span>
        <span>Amount</span>
        <span>Date</span>
      </div>
      <div className="tm-lines">
        {lines.map((x, i) => (
          <div key={i} className="tm-line">
            <select className="ad-input" value={x.w} onChange={set(i, "w")} aria-label="Creator">
              <option value="">Pick the creator…</option>
              {L.map((l) => (
                <option key={l.link_id} value={`h:${l.handle || ""}`}>
                  @{l.handle || l.slug}
                  {l.code ? ` · ${l.code}` : ""}
                </option>
              ))}
              {cfg.mode === "common" && <option value={`c:${cfg.common_code || ""}`}>Shared code {cfg.common_code} (not split)</option>}
            </select>
            <input className="ad-input" value={x.o} onChange={set(i, "o")} placeholder="Order no." aria-label="Order number" />
            <input className="ad-input" type="number" min="1" value={x.n} onChange={set(i, "n")} aria-label="Orders" />
            <input className="ad-input" inputMode="decimal" value={x.a} onChange={set(i, "a")} placeholder="₹" aria-label="Amount" />
            <input className="ad-input" type="date" value={x.d} onChange={set(i, "d")} aria-label="Date" />
          </div>
        ))}
      </div>
      <div className="tm-go">
        <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => setLines((ls) => [...ls, blank()])}>
          + Another line
        </button>
        <button type="button" className="ad-btn ad-btn--primary" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </>
  );
}

function Report({ campaign, data, busy, setBusy, setErr, onDone }) {
  const [R, setR] = useState(null);
  const [map, setMap] = useState({});
  const head = R ? R[0].map((h) => String(h).trim()) : [];
  const body = R ? R.slice(1) : [];
  const codes = {};
  (data?.links || []).forEach((l) => {
    if (l.code) codes[String(l.code).toUpperCase()] = l.handle;
  });
  if (data?.config?.common_code) codes[String(data.config.common_code).toUpperCase()] = null;

  const onFile = async (e) => {
    setErr("");
    const f = e.target.files?.[0];
    if (!f) return;
    const rows = splitCsv(await f.text());
    if (rows.length < 2) return setErr("That file has no rows.");
    const h = rows[0].map((x) => String(x).trim());
    const g = (re) => h.findIndex((x) => re.test(x));
    setMap({ code: g(/discount ?code|coupon|promo|voucher|code/i), order: g(/^name$|order ?(id|no|number|#)|^order$|^id$/i), amount: g(/^total$|order ?total|grand ?total|amount|subtotal|net sales|revenue/i), date: g(/created ?at|order ?date|^date$|paid ?at|purchase ?date/i) });
    setR(rows);
  };
  const build = () => {
    const seen = {},
      rows = [];
    let other = 0;
    body.forEach((r) => {
      const raw = map.code >= 0 ? String(r[map.code] || "") : "";
      if (!raw.trim()) return;
      const hit = raw
        .toUpperCase()
        .split(/[\s,;|+]+/)
        .map((x) => x.trim())
        .find((x) => x && Object.prototype.hasOwnProperty.call(codes, x));
      if (!hit) return other++;
      const ord = map.order >= 0 ? String(r[map.order] || "").trim() : "";
      if (ord && seen[ord]) return; // store export har product line par order repeat karta hai
      if (ord) seen[ord] = 1;
      const dt = map.date >= 0 ? String(r[map.date] || "").trim() : "";
      const dd = dt ? new Date(dt.replace(/ [+-]\d{4}$/, "")) : null;
      rows.push({ code: hit, order_ref: ord, amount: map.amount >= 0 ? String(r[map.amount] || "").replace(/[^0-9.]/g, "") : "", orders: 1, date: dd && !isNaN(dd) ? dd.toISOString().slice(0, 10) : "" });
    });
    return { rows, other };
  };
  const { rows, other } = R ? build() : { rows: [], other: 0 };
  const go = async () => {
    if (!rows.length) return setErr("No order in this file used this campaign's codes.");
    setBusy(true);
    let added = 0,
      dup = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const { data: r, error } = await rpc("admin", "api.track_sales_add", { p_campaign: campaign, p_rows: rows.slice(i, i + 500), p_source: "csv" });
      if (error) return setBusy(false), setErr(errText(error));
      added += r?.added || 0;
      dup += r?.duplicates || 0;
    }
    setBusy(false);
    onDone(`✓ ${added} order${added === 1 ? "" : "s"} added${dup ? ` · ${dup} were already there` : ""}`);
  };
  const Sel = ({ k, label }) => (
    <label>
      <span className="ad-label">{label}</span>
      <select className="ad-input" value={map[k] ?? -1} onChange={(e) => setMap((m) => ({ ...m, [k]: +e.target.value }))}>
        <option value={-1}>{k === "code" ? "— pick —" : "Not in this file"}</option>
        {head.map((h, i) => (
          <option key={i} value={i}>
            {h || `Column ${i + 1}`}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <>
      <p className="tm-txt">Download the orders / discount-code report from the brand&apos;s store as CSV (Shopify → Orders → Export, WooCommerce, Amazon / Flipkart / Nykaa seller panel). We match each order to its creator by the coupon code.</p>
      <input type="file" accept=".csv,text/csv,.txt" className="ad-input" style={{ marginTop: 12, paddingTop: 9 }} onChange={onFile} />
      {R && (
        <>
          <div className="tm-map">
            <Sel k="code" label="Coupon / discount code column" />
            <Sel k="order" label="Order number column" />
            <Sel k="amount" label="Amount column" />
            <Sel k="date" label="Date column" />
          </div>
          <p className="tm-txt">
            {map.code < 0 ? "Pick the column that has the coupon code." : `${rows.length} order${rows.length === 1 ? "" : "s"} used this campaign's codes${other ? ` · ${other} other orders skipped (other codes)` : ""}`}
            {map.order < 0 ? " · ⚠️ No order number column — uploading the same file twice will count orders twice." : ""}
          </p>
          <div className="tm-go">
            <button type="button" className="ad-btn ad-btn--primary" onClick={go} disabled={busy}>
              {busy ? "Adding…" : "Add these orders"}
            </button>
          </div>
        </>
      )}
    </>
  );
}
