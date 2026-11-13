"use client";

/**
 * Creator ke payments — purane payments.js jaisa: my_campaign_flows (har paid campaign ka payment) ·
 * save_payment_details (UPI / bank) · payment-proofs bucket (Geek team ka screenshot).
 */
import { useRpc } from "@/lib/supabase";
import { DOOR, sb, api } from "./core";

/** Har participation ka flow { [participation_id]: { paid, needs_product, payment… } } — { data, loading, error, reload } */
export const useCampaignFlows = ({ skip = false } = {}) => useRpc(DOOR, "api.my_campaign_flows", {}, { skip });

/**
 * Payment details save (api.save_payment_details).
 * method "upi" → upi chahiye; "bank" → accountNo + ifsc. → { data, error }
 */
export const savePaymentDetails = ({ participation, method, name, accountNo, ifsc, upi }) =>
  api("save_payment_details", {
    p_participation: participation,
    p_method: method,
    p_account_name: name,
    p_account_no: method === "bank" ? accountNo : null,
    p_ifsc: method === "bank" ? ifsc : null,
    p_upi: method === "upi" ? upi : null,
  });

/** Payment screenshot ke 10 min wale links (dekhna + download) → { url, dl, pdf } | null */
export async function paymentProofLinks(path) {
  const bucket = sb().storage.from("payment-proofs");
  const [a, d] = await Promise.all([bucket.createSignedUrl(path, 600), bucket.createSignedUrl(path, 600, { download: true })]);
  if (a.error || !a.data) return null;
  return { url: a.data.signedUrl, dl: (d && d.data && d.data.signedUrl) || a.data.signedUrl, pdf: /\.pdf$/i.test(path) };
}
