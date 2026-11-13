"use client";

import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Panel, SubTabs, Note, MiniStats, TextBtn, TableState, useToast, downloadFile, readSheetFile, inr, when } from "@/components/admin/campaign2/kit";
import { useRpc, rpc, errText } from "@/lib/supabase";
import PayModal, { who, readyOuts, statusOf } from "@/components/admin/campaign2/PayModal";

/*
 * 💰 Payments — purane app ka payments.js (Super Admin only).
 * Data: api.campaign_payments · Actions: payment_set_terms, payment_verify, payment_request_details, payment_hold,
 * payout_pay, payout_mark_paid, payout_queue (Razorpay), payout_export (bulk file), payout_import_results, payments_ping.
 */

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
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(() => new Set()); // payout ids
  const [modal, setModal] = useState(null); // { row, kind }
  const [busy, setBusy] = useState(false);
  const impRef = useRef(null);

  const rows = useMemo(() => (data && data.rows) || [], [data]);
  const prov = (data && data.provider) || {};
  const allOuts = rows.flatMap((r) => (r.payment || {}).payouts || []);
  const sum = (st) => allOuts.filter((o) => st.includes(o.status)).reduce((a, o) => a + (+o.amount || 0), 0);
  const agreed = rows.reduce((a, r) => a + (+(r.payment || {}).amount || 0), 0);
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
          { k: "shipping", label: "📦 Shipping", href: `/admin/campaigns/${id}/fulfilment` },
          { k: "payments", label: "💰 Payments", href: `/admin/campaigns/${id}/payments` },
        ]}
      />

      <Panel
        className="py"
        title="💰 Payments — every creator A–Z"
        sub="Fees are visible only to Super Admins — never to brands, agencies or other creators."
        actions={
          <>
            <TextBtn href={`/admin/campaigns/${id}/upload`}>📥 Upload fees (sheet)</TextBtn>
            <TextBtn onClick={csv}>⬇️ CSV</TextBtn>
            <TextBtn onClick={() => impRef.current?.click()}>⬆ Import RazorpayX report</TextBtn>
            <input ref={impRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={importReport} />
          </>
        }
      >
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
                  <tr key={r.participation_id}>
                    <td className="py-ck">{ready.length > 0 && <input type="checkbox" checked={ready.every((o) => sel.has(o.payout_id))} onChange={() => toggleRow(r)} aria-label={`Select ${who(r)}`} />}</td>
                    <td>
                      <b>{nm || who(r)}</b>
                      {nm && who(r).startsWith("@") ? ` · ${who(r)}` : ""}
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
                      <button type="button" className="ga-btn ga-btn--ghost py-act" onClick={() => act(r)}>
                        {ACTION[st]}
                      </button>
                    </td>
                  </tr>
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

      {modal && <PayModal modal={modal} days={data?.due_days} connected={!!prov.connected} onClose={() => setModal(null)} onDone={(m) => (setModal(null), after(m))} />}
      {toast}

      <style>{`
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
