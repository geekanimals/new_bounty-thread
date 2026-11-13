/**
 * Brand portal ke pure helpers — numbers / dates, campaign labels, stages, avatars, bill (invoice) print.
 * Koi Supabase call nahi. Purane brand-portal.js ke n / short / date / TYPE / STATUS / STEPS / count / total
 * aur window.BrandBilling (words / html / print) ka naya roop.
 */

/** Number en-IN mein (purana n) — khali ho to "—" */
export const n = (v) => (v == null || v === "" || isNaN(Number(v)) ? "—" : Number(v).toLocaleString("en-IN"));

/** Chhota number — 12.4K / 3.2 L / 1.1 Cr (purana short) */
export const short = (v) => {
  v = Number(v) || 0;
  const t = (x) => x.toFixed(1).replace(/\.0$/, "");
  return v >= 1e7 ? t(v / 1e7) + " Cr" : v >= 1e5 ? t(v / 1e5) + " L" : v >= 1e3 ? t(v / 1e3) + "K" : String(Math.round(v));
};

/** ₹ amount (purana BrandBilling.inr) — paisa ke saath ya bina */
export const inr = (v, paise = false) =>
  "₹" + (Number(v) || 0).toLocaleString("en-IN", paise ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 });

/** Date "12 Mar 2026" (purana fmtDate) — sirf diye gaye value se, Date.now() nahi */
export const fdate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return String(d);
  }
};
/** Date + time (purana fmtDateTime) */
export const fdatetime = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });
  } catch {
    return String(d);
  }
};
/** "5m" / "3h" / "2d" — `now` effect mein set karke do (render mein Date.now() mana hai) */
export const ago = (d, now) => {
  if (!d || !now) return "";
  const s = Math.max(0, (now - new Date(d).getTime()) / 1000);
  return s < 60 ? "now" : s < 3600 ? Math.floor(s / 60) + "m" : s < 86400 ? Math.floor(s / 3600) + "h" : s < 86400 * 7 ? Math.floor(s / 86400) + "d" : fdate(d);
};

/** Naam se 2 letter (avatar) */
export const initials = (name) =>
  String(name || "?")
    .replace(/[@_.]/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const GRADS = [
  "linear-gradient(135deg,#ff8fb1,#ffc3d6)",
  "linear-gradient(135deg,#ffa94d,#ffd29a)",
  "linear-gradient(135deg,#5b8cff,#9db8ff)",
  "linear-gradient(135deg,#b84dff,#e39bff)",
  "linear-gradient(135deg,#34d399,#a7f3d0)",
  "linear-gradient(135deg,#f472b6,#fbcfe8)",
  "linear-gradient(135deg,#6d4aff,#a855f7)",
];
/** Naam se hamesha wahi gradient (avatar / thumb ka rang) */
export const gradFor = (seed) => {
  let h = 0;
  for (const ch of String(seed || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADS[h % GRADS.length];
};

/** Instagram profile link */
export const igUrl = (handle) => "https://instagram.com/" + encodeURIComponent(String(handle || "").replace(/^@/, ""));

/** Duplicate hatao (purana uniq) */
export const uniq = (a) => a.filter((x, i) => x && a.indexOf(x) === i);

/* ---------- Campaign labels (purane TYPE / STATUS / STEPS) ---------- */
export const TYPE = { paid: "Paid", barter: "Barter", barter_paid: "Barter + Paid" };
export const STATUS_LABEL = {
  creator_discovery: "Live · taking creators",
  in_execution: "Live · in progress",
  completed: "Completed",
  draft: "Draft",
  paused: "Paused",
  closed: "Closed",
};
export const STEPS = [
  ["to_approve", "To approve"],
  ["approved", "Approved"],
  ["shipped", "Shipped / making"],
  ["video_review", "Video review"],
  ["posting", "Posting"],
  ["posted", "Posted"],
];
/** Live campaign? (purana /discovery|execution/) */
export const isLive = (c) => /discovery|execution/.test((c && c.status) || "");
/** Ek step mein kitne creators (purana count — shipped = shipped + making) */
export const stepCount = (c, k) => {
  const x = (c && c.counts) || {};
  return k === "shipped" ? (x.shipped || 0) + (x.making || 0) : x[k] || 0;
};
/** Campaign ke kul creators (not_selected chhod ke — purana total) */
export const totalCreators = (c) => {
  const x = (c && c.counts) || {};
  return Object.keys(x).reduce((a, k) => (k === "not_selected" ? a : a + (x[k] || 0)), 0);
};
/** Saare campaigns mein ek step ka jod (purana sum) */
export const sumStep = (C, k) => (C || []).reduce((a, c) => a + stepCount(c, k), 0);

/* ---------- Notification ka route (purana "/app.html?door=brand&go=billing") → naya /brands/… ---------- */
const GO = {
  dashboard: "/brands/dashboard",
  approvals: "/brands/approvals",
  campaigns: "/brands/campaigns",
  creators: "/brands/saved",
  reports: "/brands/reports",
  billing: "/brands/billing",
  discover: "/brands/discovery",
  facebook: "/brands/facebook",
  settings: "/brands/settings",
};
export const routeFor = (r) => {
  const m = String(r || "").match(/[?&#]go=([a-z_]+)/) || String(r || "").match(/^#?([a-z_]+)$/);
  return (m && GO[m[1]]) || "/brands/notifications";
};
/** Notification ka icon + rang (kind / title se) */
export const notifLook = (x) => {
  const t = ((x && x.title) || "") + " " + ((x && x.kind) || "");
  if (/bill|payment|invoice|₹|paid/i.test(t)) return { icon: "receipt", tone: "orange" };
  if (/video|reel/i.test(t)) return { icon: "play", tone: "blue" };
  if (/post|live|views/i.test(t)) return { icon: "trend", tone: "green" };
  if (/creator|approv|applied/i.test(t)) return { icon: "users", tone: "violet" };
  if (/campaign|request/i.test(t)) return { icon: "megaphone", tone: "pink" };
  return { icon: "check", tone: "violet" };
};

/* ---------- Bill / receipt (purana window.BrandBilling) ---------- */
/** Rupees in words, Indian style — lakh / crore (purana BrandBilling.words) */
export function words(num) {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x) => (x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : ""));
  const three = (x) => (x >= 100 ? a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " : "") : "") + (x % 100 ? two(x % 100) : "");
  let r = Math.floor(num);
  const p = Math.round((num - r) * 100);
  const out = [];
  const cr = Math.floor(r / 1e7);
  r %= 1e7;
  const lk = Math.floor(r / 1e5);
  r %= 1e5;
  const th = Math.floor(r / 1000);
  r %= 1000;
  if (cr) out.push(three(cr) + " Crore");
  if (lk) out.push(two(lk) + " Lakh");
  if (th) out.push(two(th) + " Thousand");
  if (r) out.push(three(r));
  return "Rupees " + (out.join(" ") || "Zero") + (p ? " and " + two(p) + " Paise" : "") + " Only";
}

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Bill ka poora HTML page — wahi jo purana BrandBilling.html banata tha (Save as PDF / Print) */
export function invoiceHtml(i) {
  const s = i.seller || {},
    by = i.buyer || {},
    paid = i.status === "paid",
    cancelled = i.status === "cancelled";
  const m = (v) => inr(v, true);
  const rows = (i.items || [])
    .map((x, k) => {
      const amt = (Number(x.qty) || 0) * (Number(x.rate) || 0);
      return `<tr><td>${k + 1}</td><td>${esc(x.description)}</td><td>${esc(s.sac_code || "")}</td><td class="r">${esc(x.qty)}</td><td class="r">${m(x.rate)}</td><td class="r">${m(amt)}</td></tr>`;
    })
    .join("");
  return (
    `<!doctype html><html><head><meta charset="utf-8"><title>${esc(i.invoice_no)} — ${paid ? "Receipt" : "Invoice"}</title><style>` +
    "body{font:13px/1.45 Inter,Arial,sans-serif;color:#111;margin:0;padding:32px;background:#fff}.wrap{max-width:820px;margin:0 auto;position:relative}" +
    ".top{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #111;padding-bottom:14px}.top h1{margin:0;font-size:22px;letter-spacing:.04em}" +
    ".m{color:#555}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}.box{border:1px solid #ddd;border-radius:8px;padding:10px 12px}.box b.t{display:block;font-size:11px;letter-spacing:.06em;color:#777;margin-bottom:4px}" +
    "table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border-bottom:1px solid #e5e5e5;padding:7px 6px;text-align:left;vertical-align:top}th{background:#f4f4f6;font-size:12px}.r{text-align:right}" +
    ".tot{margin-left:auto;width:320px;margin-top:10px}.tot div{display:flex;justify-content:space-between;padding:4px 0}.tot .g{border-top:2px solid #111;font-weight:800;font-size:15px;margin-top:4px;padding-top:6px}" +
    `.stamp{position:absolute;top:330px;right:30px;transform:rotate(-12deg);border:3px solid ${paid ? "#12b76a" : "#999"};color:${paid ? "#12b76a" : "#999"};font-weight:900;font-size:26px;padding:4px 14px;border-radius:8px;opacity:.85}` +
    ".foot{margin-top:28px;color:#777;font-size:11px;border-top:1px solid #eee;padding-top:10px}@media print{.np{display:none}body{padding:0}}</style></head><body><div class=\"wrap\">" +
    '<div class="np" style="margin-bottom:16px"><button onclick="print()" style="padding:9px 16px;font-weight:700;border-radius:8px;border:0;background:#5b5bf0;color:#fff;cursor:pointer">Save as PDF / Print</button></div>' +
    (paid ? '<div class="stamp">PAID</div>' : cancelled ? '<div class="stamp">CANCELLED</div>' : "") +
    `<div class="top"><div><h1>${paid ? "PAYMENT RECEIPT" : "INVOICE"}</h1><div class="m">${esc(i.invoice_no)}</div></div>` +
    `<div style="text-align:right"><b>${esc(s.legal_name || "Geek")}</b>${s.trade_name ? `<div class="m">${esc(s.trade_name)}</div>` : ""}${s.address ? `<div class="m" style="white-space:pre-line">${esc(s.address)}</div>` : ""}` +
    `${s.gstin ? `<div>GSTIN: <b>${esc(s.gstin)}</b></div>` : ""}${s.pan ? `<div class="m">PAN: ${esc(s.pan)}</div>` : ""}${s.email || s.phone ? `<div class="m">${esc([s.email, s.phone].filter(Boolean).join(" · "))}</div>` : ""}</div></div>` +
    `<div class="grid"><div class="box"><b class="t">BILL TO</b><b>${esc(by.name || i.brand || "")}</b>${by.address ? `<div class="m" style="white-space:pre-line">${esc(by.address)}</div>` : ""}${by.gstin ? `<div>GSTIN: ${esc(by.gstin)}</div>` : ""}</div>` +
    `<div class="box"><b class="t">DETAILS</b><div>Date: <b>${fdate(i.issued_on)}</b></div>${i.due_on ? `<div>Due: <b>${fdate(i.due_on)}</b></div>` : ""}${i.campaign ? `<div>Campaign: <b>${esc(i.campaign)}</b></div>` : ""}<div>For: ${esc(i.title)}</div></div></div>` +
    `<table><thead><tr><th>#</th><th>Description</th><th>SAC</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>` +
    `<div class="tot"><div><span>Subtotal</span><span>${m(i.subtotal)}</span></div><div><span>GST @ ${esc(Number(i.gst_pct))}%</span><span>${m(i.gst_amount)}</span></div>` +
    `<div class="g"><span>Total</span><span>${m(i.total)}</span></div></div>` +
    `<div class="m" style="margin-top:6px"><b>Amount in words:</b> ${esc(words(Number(i.total) || 0))}</div>` +
    (paid
      ? `<div class="box" style="margin-top:14px;border-color:#12b76a"><b class="t">PAYMENT RECEIVED</b>${m(i.paid_amount || i.total)} on ${fdate(i.paid_at)} · ${i.paid_via === "razorpay" ? "Online (Razorpay)" : "Bank transfer / UPI / cheque"}${i.paid_ref ? " · Ref " + esc(i.paid_ref) : ""}${i.paid_note ? `<div class="m">${esc(i.paid_note)}</div>` : ""}</div>`
      : !cancelled
        ? `<div class="box" style="margin-top:14px"><b class="t">HOW TO PAY</b>Pay online from your Geek OS dashboard → Billing → <b>Pay now</b> (Razorpay: UPI, cards, net banking).${s.bank_note ? `<div style="white-space:pre-line;margin-top:4px">${esc(s.bank_note)}</div>` : ""}</div>`
        : "") +
    (i.notes ? `<div class="m" style="margin-top:12px;white-space:pre-line"><b>Notes:</b> ${esc(i.notes)}</div>` : "") +
    `<div class="foot">This is a computer-generated ${paid ? "receipt" : "invoice"} and needs no signature. · Geek OS</div></div></body></html>`
  );
}

/** Bill nayi window mein khol ke print (purana BrandBilling.print) → false = pop-up block hua */
export function printInvoice(i) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(invoiceHtml(i));
  w.document.close();
  setTimeout(() => {
    try {
      w.focus();
      w.print();
    } catch {
      /* ignore */
    }
  }, 500);
  return true;
}
