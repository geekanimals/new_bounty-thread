"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Panel, SubTabs, Note, MiniStats, TextBtn, useToast, downloadFile } from "@/components/admin/campaign2/kit";

const ROWS = [
  { id: 1, name: "Nisha Rao", handle: "@nishastories", fee: 2000, adv: "50%", paid: 1000, due: 1000, payout: "UPI ✓ verified", status: "Due now" },
  { id: 2, name: "Kabir Mehta", handle: "@kabirfoodtrail", fee: 2000, adv: "0%", paid: 0, due: 2000, payout: "Bank ✓ verified", status: "Due now" },
  { id: 3, name: "Ritika Sen", handle: "@ritika.daily", fee: 2000, adv: "50%", paid: 1000, due: 0, payout: "UPI · not verified", status: "Not verified" },
  { id: 4, name: "Rohan Das", handle: "@rohanfitlife", fee: null, adv: null, paid: null, due: null, payout: null, status: "Fee not set" },
];
const FILTERS = ["Everyone", "Fee not set", "No bank / UPI", "Not verified", "Due now", "Being paid", "Fully paid"];
const TONE = { "Due now": "violet", "Not verified": "orange", "Fee not set": "", "Being paid": "blue", "Fully paid": "green" };
const ACTION = { "Due now": "Record payment", "Not verified": "Verify", "Fee not set": "Set fee", "Being paid": "Mark paid", "Fully paid": "Receipt" };
const inr = (n) => (n == null ? "—" : `₹${n.toLocaleString("en-IN")}`);

export default function CampaignPayments() {
  const { id } = useParams();
  const [toast, show] = useToast();
  const [rows, setRows] = useState(ROWS);
  const [filter, setFilter] = useState("Everyone");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState([1, 2]);
  const [modal, setModal] = useState(null); // {row, kind}
  const [val, setVal] = useState("");

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (t && !`${r.name} ${r.handle} ${r.payout || ""}`.toLowerCase().includes(t)) return false;
      if (filter === "Everyone") return true;
      if (filter === "No bank / UPI") return !r.payout;
      return r.status === filter;
    });
  }, [rows, filter, q]);

  const ready = rows.filter((r) => r.status === "Due now");
  const sel = rows.filter((r) => picked.includes(r.id) && r.status === "Due now");
  const selTotal = sel.reduce((s, r) => s + (r.due || 0), 0);
  const allReady = ready.length > 0 && ready.every((r) => picked.includes(r.id));

  const toggle = (rid) => setPicked((p) => (p.includes(rid) ? p.filter((x) => x !== rid) : [...p, rid]));

  const act = (r) => {
    const kind = ACTION[r.status];
    if (kind === "Receipt") return show(`Receipt for ${r.name} downloaded`);
    setVal(kind === "Set fee" ? "2000" : "");
    setModal({ row: r, kind });
  };

  const save = () => {
    const r = modal.row;
    setRows((rs) =>
      rs.map((x) => {
        if (x.id !== r.id) return x;
        if (modal.kind === "Set fee") {
          const fee = Math.max(0, parseInt(val, 10) || 0);
          return { ...x, fee, adv: "0%", paid: 0, due: fee, payout: "UPI · not verified", status: "Not verified" };
        }
        if (modal.kind === "Verify") return { ...x, payout: x.payout.replace("· not verified", "✓ verified"), due: x.fee - x.paid, status: x.fee - x.paid > 0 ? "Due now" : "Fully paid" };
        if (modal.kind === "Mark paid" || modal.kind === "Record payment") return { ...x, paid: x.fee, due: 0, status: "Fully paid" };
        return x;
      })
    );
    show(modal.kind === "Set fee" ? `Fee set for ${r.name}` : modal.kind === "Verify" ? `${r.name}'s payout details verified` : `Payment recorded for ${r.name}${val ? ` · UTR ${val}` : ""}`);
    setModal(null);
  };

  const paySelected = () => {
    if (!sel.length) return show("Tick creators who are due to pay them");
    setRows((rs) => rs.map((x) => (picked.includes(x.id) && x.status === "Due now" ? { ...x, status: "Being paid" } : x)));
    show(`${sel.length} payment${sel.length > 1 ? "s" : ""} · ${inr(selTotal)} sent to Razorpay`);
    setPicked([]);
  };

  const csv = () => {
    downloadFile("payments.csv", [["Creator", "Handle", "Fee", "Advance", "Paid", "Due", "Payout", "Status"], ...rows.map((r) => [r.name, r.handle, r.fee ?? "", r.adv ?? "", r.paid ?? "", r.due ?? "", r.payout ?? "", r.status])]);
    show("Payments CSV downloaded");
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
            <TextBtn onClick={() => show("RazorpayX report imported · 0 new payouts")}>⬆ Import RazorpayX report</TextBtn>
          </>
        }
      >
        <MiniStats
          items={[
            { value: "₹36,000", label: "Agreed", note: "18 creators" },
            { value: "₹12,000", label: "Paid" },
            { value: "₹14,000", label: "Due", note: "ready to pay" },
            { value: "₹4,000", label: "Being paid" },
            { value: rows.filter((r) => r.status === "Fee not set").length + 1, label: "Fee not set" },
            { value: 3, label: "No details", note: "not verified" },
          ]}
        />

        <div className="py-note">
          <Note tone="amber" icon="⚪">
            <b>Razorpay not connected</b>— until then: verify details by hand, pay from your bank / UPI and record it with the UTR + screenshot, or use the RazorpayX bulk file.{" "}
            <button type="button" className="py-check" onClick={() => show("Razorpay is still not connected")}>
              ↻ Check Razorpay
            </button>
          </Note>
        </div>

        <div className="py-bar">
          <input className="ad-input py-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="@handle, name, UPI…" aria-label="Search creators" />
          <div className="py-filters" data-scroll>
            {FILTERS.map((f) => (
              <button key={f} type="button" className={`ad-tab ${filter === f ? "is-on" : ""}`} onClick={() => setFilter(f)}>
                {f}
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
              {list.map((r) => (
                <tr key={r.id}>
                  <td className="py-ck">
                    {r.status === "Due now" && <input type="checkbox" checked={picked.includes(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.name}`} />}
                  </td>
                  <td>
                    <b>{r.name}</b> · {r.handle}
                  </td>
                  <td>{inr(r.fee)}</td>
                  <td>{r.adv ?? "—"}</td>
                  <td>{inr(r.paid)}</td>
                  <td>{inr(r.due)}</td>
                  <td>{r.payout ?? "—"}</td>
                  <td>
                    <span className={`ad-badge ad-badge--${TONE[r.status]}`}>{r.status}</span>
                  </td>
                  <td>
                    <button type="button" className="ad-btn ad-btn--ghost py-act" onClick={() => act(r)}>
                      {ACTION[r.status]}
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length && (
                <tr>
                  <td colSpan={9} className="py-empty">
                    No creators in “{filter}”{q ? ` matching “${q}”` : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="py-foot">
          <label className="py-all">
            <input type="checkbox" checked={allReady} onChange={() => setPicked(allReady ? [] : ready.map((r) => r.id))} /> Select everything ready to pay
          </label>
          <b className="py-sum">
            {sel.length} payment{sel.length === 1 ? "" : "s"} · {inr(selTotal)}
          </b>
          <button type="button" className="ad-btn ad-btn--primary py-pay" onClick={paySelected}>
            ⚡ Pay selected via Razorpay
          </button>
          <TextBtn onClick={() => show("RazorpayX bulk file downloaded")}>⬇️ RazorpayX bulk file</TextBtn>
        </div>
      </Panel>

      {modal && (
        <div className="ad-overlay" onClick={() => setModal(null)}>
          <div className="ad-modal py-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={modal.kind}>
            <h3 className="ad-h2">
              {modal.kind} · {modal.row.name}
            </h3>
            {modal.kind === "Verify" ? (
              <p className="py-mtxt">
                Check {modal.row.name}&apos;s {modal.row.payout?.split(" ")[0]} details match their name, then mark them verified.
              </p>
            ) : (
              <>
                <label className="ad-label" htmlFor="py-val">
                  {modal.kind === "Set fee" ? "Fee (₹)" : "UTR / reference (optional)"}
                </label>
                <input id="py-val" className="ad-input" value={val} onChange={(e) => setVal(e.target.value)} inputMode={modal.kind === "Set fee" ? "numeric" : "text"} placeholder={modal.kind === "Set fee" ? "2000" : "e.g. 4312XXXX0921"} autoFocus />
                {modal.kind !== "Set fee" && <p className="ad-hint">Due {inr(modal.row.due)} — recorded as fully paid.</p>}
              </>
            )}
            <div className="py-mact">
              <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button type="button" className="ad-btn ad-btn--primary" onClick={save}>
                {modal.kind === "Verify" ? "Mark verified" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast}

      <style>{`
        .py-note { margin-top: 23px; }
        .py-check { padding: 0; border: 0; background: none; font-size: 12px; color: inherit; }
        .py-check:hover { text-decoration: underline; }
        .py-bar { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
        .py-search { width: 270px; flex-shrink: 0; height: 43px; }
        .py-filters { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
        .py-filters::-webkit-scrollbar { display: none; }
        .py-filters .ad-tab { flex-shrink: 0; }
        .py-filters .ad-tab:not(.is-on) { color: #67718a; }
        .py-t { margin-top: 26px; }
        .py-t td { height: 70px; padding-top: 10px; padding-bottom: 10px; }
        .py-ck { width: 40px; }
        .py-ck input, .py-all input { width: 15px; height: 15px; margin: 0; accent-color: #5f6577; }
        .py-act { height: 40px; padding: 0 15px; font-size: 13px; }
        .py-empty { text-align: center; color: var(--ad-muted); }
        .py-foot { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 18px; }
        .py-all { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ad-ink); cursor: pointer; }
        .py-all input { accent-color: var(--ad-primary); }
        .py-sum { font-size: 12px; font-weight: 700; }
        .py-pay { height: 42px; margin-right: 18px; }
        .py-modal { padding: 24px; }
        .py-modal .ad-label { margin-top: 16px; }
        .py-mtxt { margin-top: 12px; font-size: 13px; line-height: 1.5; color: var(--ad-muted); }
        .py-mact { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
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
