"use client";

/**
 * 💳 Billing — purana paintBilling:
 *  - list: api.brand_invoices { p_brand:null } → { invoices, due, paid, online, can_pay }
 *  - Razorpay se wapsi (?rzpbill=<invoice_id>): brand-billing { action:"check", invoice_id }
 *  - Razorpay link wale khule bill: background mein brand-billing { action:"check" } (ek baar)
 *  - Pay now: brand-billing { action:"pay", invoice_id } → { url } (Razorpay) ya { paid }
 *  - Bill / receipt download: helpers.printInvoice (purana BrandBilling.print)
 */
import { useCallback, useEffect, useState } from "react";
import { api, fn } from "./core";

/** Bills laao (purana api("brand_invoices", { p_brand })) → { data, error } */
export const getInvoices = () => api("brand_invoices", { p_brand: null });

/** Razorpay se wapas aaye? URL se ?rzpbill nikaalo aur URL saaf karo (effect mein hi bulao) */
export function takeRzpReturn() {
  try {
    const q = new URLSearchParams(window.location.search);
    const id = q.get("rzpbill");
    if (!id) return null;
    q.delete("rzpbill");
    const rest = q.toString();
    window.history.replaceState(window.history.state, "", window.location.pathname + (rest ? "?" + rest : ""));
    return id;
  } catch {
    return null;
  }
}

/** Ek bill ka payment Razorpay se poochho (purana check with invoice_id) */
export const checkInvoice = (invoiceId) => fn("brand-billing", { action: "check", invoice_id: invoiceId });
/** Saare bhejé gaye Razorpay links chupchaap check (purana background check) */
export const checkAllInvoices = () => fn("brand-billing", { action: "check" });
/** Pay now (purana data-bpxpay) → { data:{ url } | { paid:true }, error } */
export const payInvoice = (invoiceId) => fn("brand-billing", { action: "pay", invoice_id: invoiceId });

let _bgChecked = false; // purana BP.billChecked — ek session mein ek hi baar

/**
 * React: { data, list, loading, error, reload, returned }
 *  returned = Razorpay se wapsi wala bill { invoice_id, paid } (toast ke liye), warna null
 */
export function useInvoices() {
  const [st, setSt] = useState({ data: null, loading: true, error: null, returned: null });
  const load = useCallback(async (quiet = false, back = null) => {
    if (!quiet) setSt((s) => ({ ...s, loading: true }));
    if (back) await checkInvoice(back);
    const r = await getInvoices();
    const d = r.data || null;
    const L = (d && d.invoices) || [];
    const bi = back ? L.find((i) => i.invoice_id === back) : null;
    if (!r.error) _open = L.filter((i) => i.status === "requested").length;
    setSt((s) => ({ data: r.error ? s.data : d, loading: false, error: r.error ? r.error.message || String(r.error) : null, returned: bi ? { invoice_id: back, paid: bi.status === "paid" } : s.returned }));
    if (!r.error && !_bgChecked && L.some((i) => i.status === "requested" && i.rzp_link_id)) {
      _bgChecked = true;
      checkAllInvoices().then((x) => {
        if (x && x.data && (x.data.checked || []).some((c) => c.status === "paid")) load(true);
      });
    }
    return r;
  }, []);
  useEffect(() => {
    load(false, takeRzpReturn());
  }, [load]);
  const d = st.data;
  return { ...st, list: (d && d.invoices) || [], reload: () => load(true) };
}

let _open = null; // khule bills ki ginti (sidebar badge) — session mein ek baar
/** React: kitne bill "To pay" hain (sidebar ka Billing badge) → number | 0 */
export function useOpenBillsCount() {
  const [k, setK] = useState(typeof _open === "number" ? _open : 0);
  useEffect(() => {
    let alive = true;
    if (typeof _open === "number") {
      setK(_open);
      return;
    }
    getInvoices().then((r) => {
      _open = r.error ? 0 : ((r.data && r.data.invoices) || []).filter((i) => i.status === "requested").length;
      if (alive) setK(_open);
    });
    return () => {
      alive = false;
    };
  }, []);
  return k;
}
/** Bill pay / list badalne ke baad badge dobara gino */
export const resetOpenBills = () => {
  _open = null;
};
