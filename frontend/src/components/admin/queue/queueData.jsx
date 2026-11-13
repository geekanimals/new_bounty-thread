/* Action queue / Logistics ke fixed labels (data ab Supabase se aata hai — dekho queue/live.jsx). */

export const FILTERS = [
  { k: "all", label: "All" },
  { k: "applications", label: "Applications" },
  { k: "content", label: "Content" },
  { k: "contracts", label: "Contracts" },
  { k: "logistics", label: "Logistics" },
  { k: "campaigns", label: "Campaigns" },
  { k: "signups", label: "Account signups" },
];
export const FILTER_LABEL = Object.fromEntries(FILTERS.map((f) => [f.k, f.label]));

export const CHECKLIST = ["Verified creator/campaign association", "Eligibility and conflict checks", "Contract, disclosure and deliverables", "Prior communication and audit history"];

/* Logistics (Figma 049/050) — status = shipments_board ka status (+ address nahi) */
export const SHIP_STEPS = ["Creator approved", "Address verified", "Courier assigned", "In transit", "Delivery confirmed"];
export const SHIP_STATUS = { pending: "To send", shipped: "In transit", delivered: "Received", failed: "Failed" };
export const SHIP_STATUSES = ["To send", "In transit", "No address", "Received"];
