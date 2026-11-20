"use client";

import { useMemo, useRef, useState } from "react";
import { privateLink } from "@/lib/media";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Panel, SubTabs, Note, MiniStats, TextBtn, TableState, useToast, downloadFile, readSheetFile, inr, when } from "@/components/admin/campaign2/kit";
import { useRpc, rpc, errText, sbFor } from "@/lib/supabase";
import PayModal, { who, readyOuts, statusOf, termsLine, PART, STATUS_TXT, DET_TXT } from "@/components/admin/campaign2/PayModal";
import { useCampaign } from "@/components/admin/campaign/live";

/*
 * 💰 Payments — purane app ka payments.js (Super Admin only).
 * Data: api.campaign_payments · Actions: payment_set_terms, payment_verify, payment_request_details, payment_hold,
 * payout_pay, payout_mark_paid, payout_queue (Razorpay), payout_export (bulk file), payout_import_results, payments_ping,
 * payment_admin_details (team bank / UPI), payment_reveal, payout_set_proof, payout_reset, payment_bulk_terms (fees sheet).
 * Sirf Paid aur Barter + Paid campaign mein — Barter mein payment nahi hota.
 */

// fees sheet ke columns (purane PAY_COLS jaisa) — campaign mein pehle se jude creators ke liye
const FEE_COLS = [
  ["handle", /insta|handle|username|^ig\b|profile/],
  ["phone", /whats ?app|phone|mobile/],
  ["email", /e-?mail/],
  ["name", /^(full ?name|name|creator( name)?)$/],
  ["fee", /^(?!.*(advance|%|day|term|note|mode|status|upi|account|ifsc|bank)).*(fee|amount|commercial|price|rate|charge|budget|deal|payment)/],
  ["advance_pct", /advance/],
  ["pay_days", /days/],
  ["pay_terms", /terms|note/],
  ["upi", /upi|vpa/],
  ["account_no", /^(?!.*(name|holder|type)).*(a\/?c|account)/],
  ["ifsc", /ifsc/],
  ["account_name", /holder|account ?name|beneficiary|bene ?name|name (as )?(in|on|per) bank/],
];

const FILTERS = [
  ["all", "Everyone"],
  ["nofee", "Fee not set"],
  ["nodetails", "No bank / UPI"],
  ["unverified", "Not verified"],
  ["due", "Due now"],
  ["sent", "Being paid"],
  ["paid", "Fully paid"],
];
const TONE = { "Due now": "violet", "Not verified": "orange", "No bank / UPI": "orange", "Fee not set": "", "Being paid": "blue", "Fully paid": "green", "Not due yet": "", "On hold": "red" };
const ACTION = { "Due now": "Record payment", "Not verified": "Verify", "No bank / UPI": "Ask for details", "Fee not set": "Set fee", "Being paid": "Mark paid", "Fully paid": "Details", "Not due yet": "Pay early", "On hold": "Release" };

const matches = (r, f) => {
  const p = r.payment || {},
    po = p.payouts || [];
  if (f === "nofee") return p.amount == null;
  if (f === "nodetails") return !p.method;
  if (f === "unverified") return !!p.method && p.details_status !== "verified";
  if (f === "due") return po.some((o) => ["due", "failed"].includes(o.status));
  if (f === "sent") return po.some((o) => ["queued", "processing"].includes(o.status));
  if (f === "paid") return po.length > 0 && po.every((o) => o.status === "paid");
  return true;
};
const payoutLine = (p) => {
  if (!p.method) return null;
  const where = p.method === "upi" ? "UPI" : "Bank";
  return p.details_status === "verified" ? `${where} ✓ verified` : `${where} · ${p.details_status === "failed" ? "failed" : "not verified"}`;
};
const dueSum = (r) => ((r.payment || {}).payouts || []).filter((o) => ["due", "failed"].includes(o.status)).reduce((a, o) => a + (+o.amount || 0), 0);

export default function CampaignPayments() {
  const { id } = useParams();
  const [toast, show] = useToast();
  const { data, error, loading, reload } = useRpc("admin", "api.campaign_payments", { p_campaign: id }, { skip: !id || id === "sample" });
  // sheet se fee / UPI aa gayi, par creator abhi Geek OS par join nahi hua — join karte hi neeche list mein aa jaata hai
  const staged = useRpc("admin", "api.payment_stage_list", { p_campaign: id }, { skip: !id || id === "sample" });
  const stagedRows = Array.isArray(staged.data) ? staged.data : [];
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(() => new Set()); // payout ids
  const [modal, setModal] = useState(null); // { row, kind }
  // purane payRowHtml jaisa — row khol kar fee, bank / UPI, har payout aur saare buttons ek saath
  const [openRow, setOpenRow] = useState(null);
  const [busy, setBusy] = useState(false);
  const impRef = useRef(null);
  const feeRef = useRef(null);
  const [fees, setFees] = useState(null); // { rows, cols, result, err }
  const camp = useCampaign(id && id !== "sample" ? id : null);
  const kind = camp.c ? camp.c.campaign_type || "" : "";
  const noPay = !!camp.c && !["paid", "barter_paid", "visit"].includes(kind);

  const rows = useMemo(() => (data && data.rows) || [], [data]);
  const prov = (data && data.provider) || {};
  const allOuts = rows.flatMap((r) => (r.payment || {}).payouts || []);
  const sum = (st) => allOuts.filter((o) => st.includes(o.status)).reduce((a, o) => a + (+o.amount || 0), 0);
  const agreed = rows.reduce((a, r) => a + (+(r.payment || {}).amount || 0), 0);
  // Poore campaign ka hisaab: joined creators ki fees + sheet ki fees (jo abhi join nahi hue)
  const stagedLeft = stagedRows.filter((r) => !r.joined && Number(r.amount) > 0);
  const stagedTotal = stagedLeft.reduce((a, r) => a + (Number(r.amount) || 0), 0);
  const grandTotal = agreed + stagedTotal;
  const paidTotal = sum(["paid"]);
  const leftTotal = Math.max(0, grandTotal - paidTotal);
  const paidPct = grandTotal > 0 ? Math.min(100, Math.round((paidTotal / grandTotal) * 100)) : 0;
  const withFee = rows.filter((r) => (r.payment || {}).amount != null).length;
  const nofee = rows.filter((r) => (r.payment || {}).amount == null).length;
  const nodet = rows.filter((r) => !(r.payment || {}).method).length;
  const unv = rows.filter((r) => (r.payment || {}).method && (r.payment || {}).details_status !== "verified").length;

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      const p = r.payment || {};
      if (t && ![who(r), r.name, (r.creator || {}).name, p.upi_id, p.account_name].join(" ").toLowerCase().includes(t)) return false;
      return matches(r, filter);
    });
  }, [rows, filter, q]);

  const visibleReady = list.flatMap(readyOuts);
  const selOuts = rows.flatMap(readyOuts).filter((o) => sel.has(o.payout_id));
  const selTotal = selOuts.reduce((a, o) => a + (+o.amount || 0), 0);
  const allPicked = visibleReady.length > 0 && visibleReady.every((o) => sel.has(o.payout_id));

  const toggleRow = (r) =>
    setSel((s) => {
      const n = new Set(s),
        outs = readyOuts(r),
        on = outs.every((o) => n.has(o.payout_id));
      outs.forEach((o) => (on ? n.delete(o.payout_id) : n.add(o.payout_id)));
      return n;
    });

  const after = async (msg, err) => {
    show(err ? errText(err) : msg);
    if (!err) await reload(true);
  };

  const act = async (r) => {
    const st = statusOf(r);
    if (st === "On hold") {
      if (!window.confirm(`Release ${who(r)}'s payment from hold?`)) return;
      const { error: e } = await rpc("admin", "api.payment_hold", { p_participation: r.participation_id, p_hold: false, p_reason: null });
      return after("Released ✓", e);
    }
    const kind = { "Fee not set": "fee", "Not verified": "verify", "No bank / UPI": "ask", "Due now": "pay", "Not due yet": "pay", "Being paid": "mark", "Fully paid": "details" }[st];
    setModal({ row: r, kind });
  };

  const quickRpc = async (fn, args, msg, askTxt) => {
    if (askTxt && !window.confirm(askTxt)) return;
    const { error: e } = await rpc("admin", fn, args);
    after(msg, e);
  };
  const openProof = async (path) => {
    try {
      window.open(await privateLink("admin", path), "_blank", "noopener");
    } catch (er) {
      show("Couldn't open the screenshot: " + errText(er));
    }
  };
  const rowDetail = (r) => {
    const p = r.payment || {};
    const po = p.payouts || [];
    const anyBusy = po.some((o) => ["queued", "processing"].includes(o.status));
    const where = p.method === "upi" ? `UPI ${p.upi_id || ""}` : p.method === "bank" ? `A/c ••${p.account_last4 || ""} · ${p.ifsc || ""}${p.bank_name ? ` · ${p.bank_name}` : ""}` : "no bank / UPI yet";
    const left = p.left != null ? +p.left : +p.amount || 0;
    const B = (label, onClick, opt = {}) => (
      <button type="button" className={`py-mini ${opt.pri ? "is-pri" : ""}`} disabled={opt.disabled} onClick={onClick}>
        {label}
      </button>
    );
    return (
      <div className="py-det">
        <div className="py-col">
          <p className="py-ct">💰 Fee</p>
          {p.amount != null ? (
            <p>
              <b>{inr(p.amount)}</b> <span className="py-mute">{termsLine(p, (data || {}).due_days)}</span>
              {p.fee_source === "bulk" && <span className="ga-badge">from sheet</span>}
            </p>
          ) : (
            <p>
              <span className="ga-badge ga-badge--orange">Fee not set</span>
            </p>
          )}
          {p.terms_note && <p className="py-mute">📝 {p.terms_note}</p>}
          {r.first_fee && (
            <p className="py-mute">
              First fee with Geek: <b>{inr(r.first_fee.amount)}</b> · {r.first_fee.campaign || ""}
            </p>
          )}
          {p.amount != null && (
            <p>
              Paid <b>{inr(p.paid_total || 0)}</b> · left <b>{inr(left)}</b>
            </p>
          )}
          <div className="py-btns">
            {B(p.amount == null ? "💰 Set fee & terms" : "✏️ Fee & terms", () => setModal({ row: r, kind: "fee" }), { pri: p.amount == null })}
            {p.amount != null && left > 0 && B("💸 Pay", () => setModal({ row: r, kind: "pay" }), { pri: true })}
          </div>
        </div>
        <div className="py-col">
          <p className="py-ct">🏦 Bank / UPI</p>
          <p>
            {where} <span className="ga-badge">{DET_TXT[p.details_status] || p.details_status || "—"}</span>
            {p.details_source && p.details_source !== "creator" ? <span className="py-mute"> ({p.details_source === "bulk" ? "from sheet" : "added by team"})</span> : null}
          </p>
          {p.verify_name ? (
            <p className="py-mute">
              Name at bank: <b>{p.verify_name}</b>
              {p.account_name && p.verify_name.toLowerCase() !== String(p.account_name).toLowerCase() ? ` · typed: ${p.account_name}` : ""}
            </p>
          ) : p.account_name ? (
            <p className="py-mute">Name: {p.account_name}</p>
          ) : null}
          {p.verify_message && p.details_status !== "verified" && <p className="py-mute">{p.verify_message}</p>}
          {p.details_status === "needs_update" && p.request_reason && <p className="py-mute">Asked: “{p.request_reason}”</p>}
          <div className="py-btns">
            {B("✏️ Edit", () => setModal({ row: r, kind: "bank" }), { disabled: anyBusy })}
            {p.method && B("👁 Full details", () => setModal({ row: r, kind: "reveal" }))}
            {p.method && p.details_status !== "verified" && B("✓ Verified by me", () => setModal({ row: r, kind: "verify" }), { pri: true })}
            {p.method && prov.connected && p.details_status !== "verifying" && B("↻ Auto-check", () => quickRpc("api.payment_verify", { p_participation: r.participation_id, p_mode: "auto" }, "Automatic check started — the result shows in a minute ✓"))}
            {B("✉️ Ask again", () => setModal({ row: r, kind: "ask" }), { disabled: anyBusy })}
          </div>
        </div>
        <div className="py-col">
          <p className="py-ct">🧾 Payments</p>
          {po.length ? (
            po.map((o) => (
              <div key={o.payout_id} className="py-out">
                <span>
                  {PART[o.part] || o.part} <b>{inr(o.amount)}</b>
                </span>{" "}
                <span className="ga-badge">
                  {STATUS_TXT[o.status] || o.status}
                  {o.status === "due" && o.due_at ? ` · by ${when(o.due_at)}` : ""}
                </span>
                {o.utr && <span className="py-mute"> UTR {o.utr}</span>}
                {o.status === "failed" && o.failure_reason && <span className="py-mute"> · {o.failure_reason}</span>}
                <div className="py-btns">
                  {o.proof_path ? B("📎 Screenshot", () => openProof(o.proof_path)) : o.status === "paid" ? B("📎 Add screenshot", () => setModal({ row: r, kind: "proof", payout: o })) : null}
                  {(["due", "failed"].includes(o.status) || (o.status === "processing" && o.provider === "razorpayx_bulk")) && B("✅ Paid (UTR)", () => setModal({ row: r, kind: "mark", payout: o }), { pri: o.status === "due" })}
                  {((o.status === "processing" && o.provider === "razorpayx_bulk") || o.status === "failed") &&
                    B("↺ Back to due", () => quickRpc("api.payout_reset", { p_payout: o.payout_id }, "Back to due ✓", "Put this payment back to “due”?\n\nOnly if it was NOT paid through the bulk file."))}
                </div>
              </div>
            ))
          ) : (
            <p className="py-mute">{p.amount == null ? "—" : "no payments yet"}</p>
          )}
          <div className="py-btns">
            {p.on_hold
              ? B("▶ Release", () => quickRpc("api.payment_hold", { p_participation: r.participation_id, p_hold: false, p_reason: null }, "Released ✓", `Release ${who(r)}'s payment from hold?`))
              : B("⏸ Hold", () => setModal({ row: r, kind: "hold" }))}
          </div>
        </div>
      </div>
    );
  };

  const paySelected = async () => {
    if (!selOuts.length) return show("Tick creators who are due to pay them");
    if (!prov.connected) return show("Connect RazorpayX first — or use the RazorpayX bulk file");
    if (!window.confirm(`Pay ${selOuts.length} creator payment${selOuts.length > 1 ? "s" : ""} — ${inr(selTotal)} — through Razorpay?\n\nMoney leaves your RazorpayX account right away (IMPS / UPI). Each creator is told with the UTR once it lands.`)) return;
    setBusy(true);
    const { data: d, error: e } = await rpc("admin", "api.payout_queue", { p_payouts: selOuts.map((o) => o.payout_id) });
    setBusy(false);
    if (e) return show(errText(e));
    const bad = (d && d.errors) || [];
    setSel(new Set());
    show(`⚡ ${d?.queued ?? 0} payment${d?.queued === 1 ? "" : "s"} sent to RazorpayX (${inr(d?.total)})${bad.length ? ` · ${bad.length} skipped` : ""} ✓`);
    if (bad.length) window.alert("Skipped:\n" + bad.map((x) => x.error).join("\n"));
    reload(true);
  };

  // RazorpayX dashboard ka bulk-payout file (purane payBulkFile jaisa — bank + UPI alag files)
  const bulkFile = async () => {
    if (!selOuts.length) return show("Tick creators who are due to pay them");
    if (!window.confirm(`Make the RazorpayX bulk-payout file — ${selOuts.length} payment${selOuts.length > 1 ? "s" : ""}, ${inr(selTotal)}?\n\nThey are marked “sent” here. Upload the file on RazorpayX → Payouts → Bulk, then ⬆ Import the RazorpayX report here so each creator gets their UTR.`)) return;
    setBusy(true);
    const { data: d, error: e } = await rpc("admin", "api.payout_export", { p_payouts: selOuts.map((o) => o.payout_id) });
    setBusy(false);
    if (e) return show(errText(e));
    const out = (d && d.rows) || [],
      stamp = new Date().toISOString().slice(0, 10);
    const narr = (x) => ("Geek " + (x.campaign || "")).replace(/[^A-Za-z0-9 ]/g, "").slice(0, 30);
    const ph = (x) => String(x.phone || "").replace(/\D/g, "").slice(-10);
    const bank = out.filter((x) => x.method === "bank");
    const upi = out.filter((x) => x.method === "upi");
    if (bank.length)
      downloadFile(`razorpayx-bulk-bank-${stamp}.csv`, [
        ["Bene Name", "Bene Account number", "IFSC", "Payout Amount", "Payout Mode", "Payout Narration", "Phone number", "Email ID", "Contact reference ID", "Payout reference ID"],
        ...bank.map((x) => [x.account_name, x.account_no, x.ifsc, Math.round(+x.amount), +x.amount > 200000 ? "NEFT" : "IMPS", narr(x), ph(x), "", x.handle ? "@" + x.handle : "", x.ref_code]),
      ]);
    if (upi.length)
      setTimeout(
        () =>
          downloadFile(`razorpayx-bulk-upi-${stamp}.csv`, [
            ["Bene Name", "Bene UPI ID", "Payout Amount", "Payout Mode", "Payout Narration", "Phone number", "Email ID", "Contact reference ID", "Payout reference ID"],
            ...upi.map((x) => [x.account_name, x.upi_id, Math.round(+x.amount), "UPI", narr(x), ph(x), "", x.handle ? "@" + x.handle : "", x.ref_code]),
          ]),
        400
      );
    setSel(new Set());
    const bad = (d && d.errors) || [];
    show(`⬇ RazorpayX file ready — ${out.length} payment${out.length === 1 ? "" : "s"} ✓ · delete it from Downloads after uploading`);
    if (bad.length) window.alert("Skipped:\n" + bad.map((x) => x.error).join("\n"));
    reload(true);
  };

  // RazorpayX ka report wapas (UTR) — purane payImportModal jaisa
  const importReport = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const sheet = await readSheetFile(f);
      if (!sheet || sheet.length < 2) throw new Error("No rows in that file.");
      const hi = sheet.findIndex((r) => r.some((c) => /reference/i.test(c)));
      if (hi < 0) throw new Error("Couldn't find a “Payout reference ID” column.");
      const head = sheet[hi].map((h) => String(h || "").toLowerCase());
      const col = (re) => head.findIndex((h) => re.test(h));
      const iRef = head.findIndex((h) => /payout ?reference|reference ?id/.test(h) && !/contact/.test(h)),
        iUtr = col(/\butr\b/),
        iSt = col(/^status$|payout status|^status /),
        iWhy = col(/reason|failure|status ?details|description/);
      if (iRef < 0) throw new Error("Couldn't find the “Payout reference ID” column.");
      const rowsIn = sheet
        .slice(hi + 1)
        .map((r) => ({ ref: String(r[iRef] || "").trim(), utr: iUtr >= 0 ? String(r[iUtr] || "").trim() : "", status: iSt >= 0 ? String(r[iSt] || "").trim() : "", reason: iWhy >= 0 ? String(r[iWhy] || "").trim() : "" }))
        .filter((x) => /^GEEK[0-9A-F]{6,}$/i.test(x.ref));
      if (!rowsIn.length) throw new Error("No GEEK… payment references in that file — is it the report of the file made here?");
      const { data: res, error: er } = await rpc("admin", "api.payout_import_results", { p_rows: rowsIn });
      if (er) throw er;
      show(`✓ ${res?.paid ?? 0} paid · ${res?.failed ?? 0} failed · ${res?.not_found ?? 0} not found`);
      reload(true);
    } catch (ex) {
      show(errText(ex));
    }
  };

  // 📥 fees sheet — creators already on this campaign (purane payUploadModal jaisa)
  const readFees = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const all = await readSheetFile(file);
      if (!all || all.length < 2) throw new Error("No rows in that file.");
      const head = all[0].map((h) => String(h || "").trim().toLowerCase()),
        used = new Set(),
        map = {};
      FEE_COLS.forEach(([k, re]) => {
        const i = head.findIndex((h, ix) => !used.has(ix) && re.test(h));
        if (i >= 0) {
          map[k] = i;
          used.add(i);
        }
      });
      if (map.fee == null && map.upi == null && map.account_no == null) throw new Error("Couldn't find a Fee (or UPI / Account no) column.");
      if (map.handle == null && map.phone == null && map.email == null) throw new Error("Add an Instagram, WhatsApp or email column to match the creators.");
      const list2 = all
        .slice(1)
        .filter((r) => r.some(Boolean))
        .map((r, i) => {
          const o = { i: String(i + 2) };
          Object.entries(map).forEach(([k, ix]) => (o[k] = String(r[ix] ?? "").trim()));
          return o;
        });
      setFees({ rows: list2, cols: Object.keys(map), result: null, err: "" });
    } catch (ex) {
      show(errText(ex));
    }
  };
  const saveFees = async () => {
    setBusy(true);
    const { data: d, error: e } = await rpc("admin", "api.payment_bulk_terms", { p_campaign: id, p_rows: fees.rows });
    setBusy(false);
    if (e) return setFees((x) => ({ ...x, err: errText(e) }));
    setFees((x) => ({ ...x, result: d || {}, err: "" }));
    reload(true);
  };

  const csv = () => {
    downloadFile(`payments-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Creator", "Name", "Step", "Fee", "Advance %", "Pay days", "Terms", "Method", "Pay to", "Details", "Advance", "Advance status", "Advance UTR", "Balance", "Balance status", "Balance due", "Balance UTR", "On hold"],
      ...rows.map((r) => {
        const p = r.payment || {},
          po = p.payouts || [];
        const adv = po.find((o) => o.part === "advance") || {},
          bal = po.find((o) => o.part === "balance" || o.part === "full") || {};
        return [who(r), r.name || "", r.stage, p.amount ?? "", p.advance_pct ?? "", p.due_days ?? "", p.terms_note || "", p.method || "", p.method === "upi" ? p.upi_id : p.method === "bank" ? `a/c ••${p.account_last4 || ""} ${p.ifsc || ""}` : "", p.details_status || "", adv.amount ?? "", adv.status || "", adv.utr || "", bal.amount ?? "", bal.status || "", bal.due_at || "", bal.utr || "", p.on_hold ? p.hold_reason || "yes" : ""];
      }),
    ]);
    show("Payments CSV downloaded");
  };

  const ping = async () => {
    const { error: e } = await rpc("admin", "api.payments_ping");
    if (e) return show(errText(e));
    show("Checking Razorpay… the status updates in a few seconds");
    setTimeout(() => reload(true), 6000);
  };

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <SubTabs
        active="payments"
        items={[
          // Physical visit mein koi product nahi jaata — Shipping tab nahi
          kind === "visit" ? { k: "visits", label: "📍 Visits", href: `/vault/campaigns/${id}/fulfilment` } : { k: "shipping", label: "📦 Shipping", href: `/vault/campaigns/${id}/fulfilment` },
          { k: "payments", label: "💰 Payments", href: `/vault/campaigns/${id}/payments` },
        ]}
      />

      <Panel
        className="py"
        title="💰 Payments — every creator A–Z"
        sub="Fees are visible only to Super Admins — never to brands, agencies or other creators."
        actions={
          <>
            <TextBtn onClick={() => feeRef.current?.click()}>📥 Upload fees (sheet)</TextBtn>
            <input ref={feeRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={readFees} />
            <TextBtn href={`/vault/campaigns/${id}/upload`}>📄 Bulk upload (new creators)</TextBtn>
            <TextBtn onClick={csv}>⬇️ CSV</TextBtn>
            <TextBtn onClick={() => impRef.current?.click()}>⬆ Import RazorpayX report</TextBtn>
            <input ref={impRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={importReport} />
          </>
        }
      >
        {noPay && (
          <div className="py-note">
            <Note tone="amber" icon="🎁">
              <b>This is a Barter campaign</b> — creators get the product, so there are no fees or payouts here. Payments are for <b>Paid</b> and <b>Barter + Paid</b> campaigns.
            </Note>
          </div>
        )}
        {!noPay && (
          <div className="py-tot">
            <div className="py-tot__c">
              <small>Total to pay</small>
              <b>{inr(grandTotal)}</b>
              <span>
                {withFee + stagedLeft.length} creator{withFee + stagedLeft.length === 1 ? "" : "s"}
                {stagedLeft.length ? ` · incl. ${inr(stagedTotal)} for ${stagedLeft.length} not joined yet` : ""}
              </span>
            </div>
            <div className="py-tot__c is-paid">
              <small>Paid so far</small>
              <b>{inr(paidTotal)}</b>
              <span>{paidPct}% of the total</span>
            </div>
            <div className="py-tot__c is-left">
              <small>Left to pay</small>
              <b>{inr(leftTotal)}</b>
              <span>{sum(["queued", "processing"]) ? `${inr(sum(["queued", "processing"]))} being paid now` : "after every payout so far"}</span>
            </div>
            <div className="py-tot__bar" aria-label={`${paidPct}% paid`}>
              <i style={{ width: `${paidPct}%` }} />
            </div>
          </div>
        )}
        <MiniStats
          items={[
            { value: inr(agreed), label: "Agreed", note: `${withFee} creator${withFee === 1 ? "" : "s"}` },
            { value: inr(sum(["paid"])), label: "Paid" },
            { value: inr(sum(["due", "failed"])), label: "Due", note: "ready to pay" },
            { value: inr(sum(["queued", "processing"])), label: "Being paid" },
            { value: nofee, label: "Fee not set" },
            { value: `${nodet} · ${unv}`, label: "No details", note: "not verified" },
          ]}
        />

        <div className="py-note">
          {prov.connected ? (
            <Note tone="green" icon="🟢">
              <b>Razorpay connected</b>
              {prov.mode === "test" ? " (test mode)" : ""}
              {prov.account ? ` · paying from ••${prov.account}` : ""}
              {prov.balance != null ? ` · balance ${inr(prov.balance)}` : ""} — tick creators and pay them together.{" "}
              <button type="button" className="py-check" onClick={ping}>
                ↻ Check Razorpay
              </button>
              {prov.checked_at ? ` · checked ${when(prov.checked_at)}` : ""}
            </Note>
          ) : (
            <Note tone="amber" icon="⚪">
              <b>Razorpay not connected</b>
              {prov.error ? ` (${prov.error})` : ""}— until then: verify details by hand, pay from your bank / UPI and record it with the UTR + screenshot, or use the RazorpayX bulk file.{" "}
              <button type="button" className="py-check" onClick={ping}>
                ↻ Check Razorpay
              </button>
            </Note>
          )}
        </div>

        <div className="py-bar">
          <input className="ga-input py-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="@handle, name, UPI…" aria-label="Search creators" />
          <div className="py-filters" data-scroll>
            {FILTERS.map(([k, l]) => (
              <button key={k} type="button" className={`ga-tab ${filter === k ? "is-on" : ""}`} onClick={() => setFilter(k)}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="c2-tw">
          <table className="c2-t py-t">
            <thead>
              <tr>
                <th aria-label="Select" />
                <th>Creator</th>
                <th>Fee</th>
                <th>Advance</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Payout</th>
                <th>Status</th>
                <th aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              <TableState
                cols={9}
                loading={loading && !data}
                error={!data && error}
                onRetry={reload}
                empty={!list.length && (rows.length ? `No creators in “${FILTERS.find((x) => x[0] === filter)[1]}”${q ? ` matching “${q}”` : ""}.` : "No creator is approved on this campaign yet — they appear here as soon as they are.")}
              />
              {list.map((r) => {
                const p = r.payment || {},
                  st = statusOf(r),
                  ready = readyOuts(r),
                  nm = r.name || (r.creator || {}).name;
                return (
                  [<tr key={r.participation_id}>
                    <td className="py-ck">{ready.length > 0 && <input type="checkbox" checked={ready.every((o) => sel.has(o.payout_id))} onChange={() => toggleRow(r)} aria-label={`Select ${who(r)}`} />}</td>
                    <td>
                      <button type="button" className="py-name" onClick={() => setModal({ row: r, kind: "manage" })} title="All payment details and actions">
                        <b>{nm || who(r)}</b>
                        {nm && who(r).startsWith("@") ? ` · ${who(r)}` : ""}
                      </button>
                      {p.on_hold && p.hold_reason ? <div className="py-sub">⏸ {p.hold_reason}</div> : null}
                    </td>
                    <td>{inr(p.amount)}</td>
                    <td>{p.amount == null ? "—" : `${+p.advance_pct || 0}%`}</td>
                    <td>{p.amount == null ? "—" : inr(p.paid_total || 0)}</td>
                    <td>{p.amount == null ? "—" : inr(dueSum(r))}</td>
                    <td>{payoutLine(p) ?? "—"}</td>
                    <td>
                      <span className={`ga-badge ga-badge--${TONE[st]}`} title={st === "On hold" ? p.hold_reason || "" : ""}>
                        {st}
                      </span>
                    </td>
                    <td>
                      <span className="py-acts">
                        <button type="button" className="ga-btn ga-btn--ghost py-act" onClick={() => act(r)}>
                          {ACTION[st]}
                        </button>
                        <button type="button" className="ga-btn ga-btn--ghost py-act py-more" onClick={() => setModal({ row: r, kind: "manage" })} aria-label={`Manage ${who(r)}`} title="Manage: fee, bank / UPI, payments, screenshots, hold">
                          ⋯
                        </button>
                        <button type="button" className="ga-btn ga-btn--ghost py-act py-more" onClick={() => setOpenRow(openRow === r.participation_id ? null : r.participation_id)} aria-label={`Open ${who(r)}`} title="Show everything — fee, bank / UPI, every payment">
                          {openRow === r.participation_id ? "▴" : "▾"}
                        </button>
                      </span>
                    </td>
                  </tr>,
                  openRow === r.participation_id ? (
                    <tr key={r.participation_id + ":open"} className="py-open">
                      <td colSpan={9}>{rowDetail(r)}</td>
                    </tr>
                  ) : null,
                  ]
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="py-foot">
          <label className="py-all">
            <input
              type="checkbox"
              checked={allPicked}
              onChange={() =>
                setSel((s) => {
                  if (allPicked) return new Set();
                  const n = new Set(s);
                  visibleReady.forEach((o) => n.add(o.payout_id));
                  return n;
                })
              }
            />{" "}
            Select everything ready to pay
          </label>
          <b className="py-sum">
            {selOuts.length} payment{selOuts.length === 1 ? "" : "s"} · {inr(selTotal)}
          </b>
          <button type="button" className="ga-btn ga-btn--primary py-pay" onClick={paySelected} disabled={busy}>
            ⚡ Pay selected via Razorpay
          </button>
          <TextBtn onClick={bulkFile}>⬇️ RazorpayX bulk file</TextBtn>
        </div>
      </Panel>

      {stagedRows.length > 0 && (
        <Panel className="py py-staged" title={`🕓 Fees from the sheet — waiting for ${stagedRows.length} creator${stagedRows.length > 1 ? "s" : ""} to join`} sub="These fees and UPI / bank details came from the bulk sheet. Each creator moves into the list above with this fee as soon as they join Geek OS — nothing to do here.">
          <div className="pys-wrap">
            <table className="pys-t">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Fee</th>
                  <th>Advance</th>
                  <th>Pay to</th>
                  <th>Terms</th>
                </tr>
              </thead>
              <tbody>
                {stagedRows.map((r) => (
                  <tr key={r.stage_id}>
                    <td>
                      <b>{r.name || r.handle}</b>
                      <small>{[r.handle ? "@" + r.handle : "", r.phone].filter(Boolean).join(" · ")}</small>
                    </td>
                    <td>
                      <b>₹{Number(r.amount || 0).toLocaleString("en-IN")}</b>
                    </td>
                    <td>{r.advance_pct ? `${r.advance_pct}% · ₹${Math.round((Number(r.amount || 0) * r.advance_pct) / 100).toLocaleString("en-IN")}` : "—"}</td>
                    <td>{r.upi ? `UPI ${r.upi}` : r.account_last4 ? `A/c ••${r.account_last4}${r.ifsc ? " · " + r.ifsc : ""}` : <span className="pys-miss">Not given — creator adds it after joining</span>}</td>
                    <td className="pys-terms">{r.terms || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <style>{`

            .py-staged { margin-top: 18px; }
            .pys-wrap { overflow-x: auto; }
            .pys-t { width: 100%; border-collapse: collapse; font-size: 13px; }
            .pys-t th { text-align: left; padding: 9px 10px; font-size: 11px; letter-spacing: .6px; text-transform: uppercase; color: var(--ad-muted, #7a8099); border-bottom: 1px solid var(--ad-line, #e6e8f0); }
            .pys-t td { padding: 10px; border-bottom: 1px solid var(--ad-line, #eef0f5); vertical-align: top; }
            .pys-t td small { display: block; margin-top: 2px; font-size: 12px; color: var(--ad-muted, #7a8099); }
            .pys-terms { max-width: 360px; font-size: 12.5px; color: #4b5563; }
            .pys-miss { color: #b45309; font-size: 12.5px; }
          `}</style>
        </Panel>
      )}

      {modal && <PayModal modal={modal} days={data?.due_days} connected={!!prov.connected} onClose={() => setModal(null)} onDone={(m) => (setModal(null), after(m))} />}
      {fees && (
        <div className="ga-overlay" onClick={() => !busy && setFees(null)}>
          <div className="ga-modal py-fm" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Upload fees">
            <h3 className="ga-h2">📥 Upload fees for this campaign&apos;s creators</h3>
            <p className="py-fm__t">
              One row per creator already on this campaign — matched on Instagram, WhatsApp or email. Columns: Fee · Advance % · Pay days · Terms · and optionally UPI or Account no + IFSC + Account holder. Contracts that were waiting go out with the fee. New creators? Use 📄 Bulk upload.
            </p>
            <p className="py-fm__t">
              Found <b>{fees.rows.length}</b> rows · columns: {fees.cols.map((k) => k.replace("_", " ")).join(", ")}
            </p>
            <div className="c2-tw">
              <table className="c2-t">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Creator</th>
                    <th>Fee</th>
                    <th>Advance</th>
                    <th>Days</th>
                    <th>Pay to</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.rows.slice(0, 8).map((x) => (
                    <tr key={x.i}>
                      <td>{x.i}</td>
                      <td>{x.handle || x.phone || x.email || ""}</td>
                      <td>{x.fee || ""}</td>
                      <td>{x.advance_pct || ""}</td>
                      <td>{x.pay_days || ""}</td>
                      <td>{x.upi || (x.account_no ? "a/c ••" + x.account_no.slice(-4) : "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fees.rows.length > 8 && <p className="py-fm__t">…and {fees.rows.length - 8} more</p>}
            {fees.result && (
              <Note tone="green" icon="✓">
                {fees.result.updated ?? 0} updated{fees.result.not_found ? ` · ${fees.result.not_found} not on this campaign` : ""}
                {(fees.result.errors || []).length ? ` · ${fees.result.errors.length} with a problem` : ""}
                {(fees.result.errors || []).slice(0, 20).map((x, i) => (
                  <div key={i}>
                    Row {x.row || "?"}: {x.error}
                  </div>
                ))}
              </Note>
            )}
            {fees.err && <p className="py-fm__err">{fees.err}</p>}
            <div className="py-fm__act">
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setFees(null)} disabled={busy}>
                {fees.result ? "Close" : "Cancel"}
              </button>
              {!fees.result && (
                <button type="button" className="ga-btn ga-btn--primary" onClick={saveFees} disabled={busy || !fees.rows.length}>
                  {busy ? "Saving…" : `Save ${fees.rows.length} fee${fees.rows.length === 1 ? "" : "s"}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {toast}

      <style>{`
        .py-tot { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
        .py-tot__c { display: grid; gap: 3px; padding: 14px 16px; border-radius: 14px; background: #f5f3ff; border: 1px solid #e3dfff; min-width: 0; }
        .py-tot__c small { font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #6257a1; }
        .py-tot__c b { font-size: 24px; line-height: 1.15; color: #1d2340; }
        .py-tot__c span { font-size: 12px; color: var(--ad-muted); }
        .py-tot__c.is-paid { background: #eaf7ef; border-color: #c9ebd5; }
        .py-tot__c.is-paid small { color: #1f7a45; }
        .py-tot__c.is-left { background: #fff4e6; border-color: #fbdcb3; }
        .py-tot__c.is-left small { color: #b45309; }
        .py-tot__bar { grid-column: 1 / -1; height: 8px; border-radius: 6px; background: #eceaf7; overflow: hidden; }
        .py-tot__bar i { display: block; height: 100%; background: #2fbf6b; border-radius: 6px; }
        @media (max-width: 700px) { .py-tot { grid-template-columns: 1fr; } .py-tot__c b { font-size: 20px; } }
        .py-note { margin-top: 23px; }
        .py-check { padding: 0; border: 0; background: none; font-size: 12px; color: inherit; }
        .py-check:hover { text-decoration: underline; }
        .py-bar { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
        .py-search { width: 270px; flex-shrink: 0; height: 43px; }
        .py-filters { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
        .py-filters::-webkit-scrollbar { display: none; }
        .py-filters .ga-tab { flex-shrink: 0; }
        .py-filters .ga-tab:not(.is-on) { color: #67718a; }
        .py-t { margin-top: 26px; }
        .py-t td { height: 70px; padding-top: 10px; padding-bottom: 10px; }
        .py-ck { width: 40px; }
        .py-ck input, .py-all input { width: 15px; height: 15px; margin: 0; accent-color: #5f6577; }
        .py-act { height: 40px; padding: 0 15px; font-size: 13px; }
        .py-open td { background: #fafbff; white-space: normal; }
        .py-det { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; padding: 6px 2px; font-size: 13px; line-height: 1.5; }
        .py-col { padding: 10px 12px; border-radius: 12px; border: 1px solid var(--ad-line); background: #fff; }
        .py-ct { font-weight: 800; color: var(--ad-ink); margin-bottom: 4px; }
        .py-mute { color: var(--ad-muted); font-size: 12.5px; }
        .py-btns { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .py-mini { height: 30px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 12.5px; font-weight: 800; color: #6657e9; cursor: pointer; white-space: nowrap; }
        .py-mini.is-pri { background: var(--ad-primary); border-color: var(--ad-primary); color: #fff; }
        .py-mini:disabled { opacity: .55; cursor: default; }
        .py-out { padding: 6px 0; border-bottom: 1px dashed var(--ad-line); }
        .py-out:last-of-type { border-bottom: 0; }
        @media (max-width: 1100px) { .py-det { grid-template-columns: 1fr; } }
        .py-acts { display: inline-flex; flex-wrap: nowrap; gap: 6px; white-space: nowrap; }
        .py-t td:last-child { white-space: nowrap; }
        .py-more { width: 40px; padding: 0; font-size: 18px; line-height: 1; }
        .py-name { padding: 0; border: 0; background: none; text-align: left; font: inherit; color: inherit; cursor: pointer; }
        .py-name:hover b { text-decoration: underline; }
        .py-sub { margin-top: 3px; font-size: 11.5px; color: var(--ad-red); }
        .py-fm { width: min(720px, calc(100vw - 32px)); max-height: calc(100vh - 40px); overflow-y: auto; padding: 24px; }
        .py-fm__t { margin-top: 10px; font-size: 13px; line-height: 1.5; color: var(--ad-muted); }
        .py-fm .c2-tw { margin-top: 12px; }
        .py-fm__err { margin-top: 12px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
        .py-fm__act { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
        .py-foot { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 18px; }
        .py-all { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ad-ink); cursor: pointer; }
        .py-all input { accent-color: var(--ad-primary); }
        .py-sum { font-size: 12px; font-weight: 700; }
        .py-pay { height: 42px; margin-right: 18px; }
        @media (max-width: 1023px) {
          .py-bar { flex-direction: column; align-items: stretch; }
          .py-search { width: 100%; }
        }
        @media (max-width: 640px) {
          .py-filters { margin: 0 -16px; padding: 0 16px; }
          .py-pay { width: 100%; margin-right: 0; }
        }
      `}</style>
    </AdminShell>
  );
}
