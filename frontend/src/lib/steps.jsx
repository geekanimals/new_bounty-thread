/**
 * Campaign ke 13 steps — ek hi naam har jagah (admin, brand, creator).
 * Brand portal ke labels DB (intel.ci_brand_stage) mein bhi yahi naam use karte hain.
 */
export const STEP_NAME = {
  applied: "Applied", invited: "Applied", shortlisted: "Applied", eligible: "Screened", sent_to_brand: "Sent to brand",
  brand_confirmed: "Approved", accepted: "Approved", contract_sent: "Contract sent", contract_signed: "Contract signed",
  address_confirmed: "Address confirmed", product_sent: "Courier sent", product_delivered: "Courier delivered",
  content_created: "Video brief sent", content_submitted: "Video submitted", changes_requested: "Video submitted · changes asked",
  content_approved: "Client approved", published: "Posted", completed: "Posted",
  ineligible: "Declined", brand_declined: "Declined by brand", dropped: "Dropped", rejected: "Rejected",
};
export const stepName = (s) => STEP_NAME[s] || String(s || "—").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
