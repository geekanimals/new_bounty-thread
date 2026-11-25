"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { useToast, downloadFile, downloadXlsx, TableState, when, sheetPhone } from "@/components/admin/campaign2/kit";
import { useRpc, rpc, errText } from "@/lib/supabase";
import UploadHistory from "@/components/admin/campaign2/UploadHistory";
import { UploadCard, MsgOff, saveUpload, buildUpload, readUploadFile, readPasted, readSheetLink, statusesFor, isSpecial, useUploadKind, KIND_LABEL } from "@/components/admin/campaign2/upload";

// 📄 Campaign sheet ke columns — purane SH_COLS jaisa (bulk upload wale hi columns, wapas upload ho sake)
const SH_COLS = [["Name", "name"], ["Instagram", "instagram"], ["WhatsApp", "whatsapp"], ["Email", "email"], ["City", "city"], ["Followers", "followers"], ["Status", "status"], ["Address", "address"], ["State", "state"], ["PIN code", "pincode"], ["Courier", "courier"], ["Tracking", "tracking"], ["Video link", "video_link"], ["Post link", "post_link"]];
const SHIP = ["Address", "State", "PIN code", "Courier", "Tracking"];
// Paid / Barter + Paid: payment ke columns bhi (bulk upload inhe padhta hai — fee, advance, bank / UPI). Barter mein nahi.
// Khaali template (purane "⬇ Excel template / CSV template / Copy for Google Sheets" jaisa) — columns + example rows
const TPL_COLS = [
  ["Name", "Creator's name — their profile is made with it", "Asha Rao", "optional"],
  ["Instagram", "@handle, handle or profile link", "@asha.creates", "one of these 3"],
  ["WhatsApp", "10-digit number (India) or +country code — every update goes here", "9876543210", "one of these 3"],
  ["Email", "Their email", "asha@example.com", "one of these 3"],
  ["City", "City", "Mumbai", "optional"],
  ["Status", "The exact step name (see Statuses). Blank = Applied. Backout / Delivery issue for creators already on the campaign", "Address confirmed", "optional"],
  ["Visit date", "For Visit booked — the day they come (2026-12-05 or 05/12/2026)", "05/12/2026", "for Visit booked", "visit"],
  ["Slot", "Visit time / slot", "4 pm", "optional", "visit"],
  ["Reason", "For Rejected / Changes requested / Backout / Delivery issue (optional for Video overdue) — why, what to change, or what went wrong (broken / damaged, wrong product or size, courier lost, not delivered)", "Courier lost at the hub", "for Rejected / Changes requested / Backout / Delivery issue"],
  ["Address", "Delivery address — for Address confirmed / Courier sent / Courier delivered", "Flat 4B, Lake View, Koregaon Park", "for those 3", "ship"],
  ["State", "State of the address", "Maharashtra", "for those 3", "ship"],
  ["PIN code", "6-digit PIN", "411001", "for those 3", "ship"],
  ["Courier", "Courier name — for Courier sent / delivered", "DTDC", "for those 2", "ship"],
  ["Tracking", "Tracking ID or link", "D12345678", "for those 2", "ship"],
  ["Delivered on", "For Courier delivered — the day it arrived (blank = today)", "22/11/2026", "optional", "ship"],
  ["Video link", "Drive / video link — for Video submitted / Client approved", "https://drive.google.com/…", "for those 2"],
  ["Post link", "Link of every post — for Posted / Done", "https://www.instagram.com/reel/…", "for Posted"],
  ["Fee (₹)", "This creator's total fee — goes into their contract only", "15000", "optional", "pay"],
  ["Advance %", "Paid once they sign", "50", "optional", "pay"],
  ["Pay days", "The rest — days after every post is live", "7", "optional", "pay"],
  ["Terms", "Anything else agreed", "includes 1 story repost", "optional", "pay"],
  ["UPI ID", "Where to pay (creator's own)", "asha@okhdfcbank", "optional", "pay"],
  ["Account no", "Bank account number", "50100123456789", "optional", "pay"],
  ["IFSC", "Bank IFSC code", "HDFC0001234", "with Account no", "pay"],
  ["Account holder", "Name on the bank account / UPI (must be the creator's)", "Asha Rao", "with UPI / Account no", "pay"],
  ["Paid amount", "For Advance paid / Fully paid — what you already paid (blank = the advance due / everything left)", "7500", "optional", "pay"],
  ["UTR", "For Advance paid / Fully paid — UTR / transaction reference of the payment you made", "UTR123456789", "for Advance / Fully paid", "pay"],
  ["Paid on", "Date you paid", "24/11/2026", "optional", "pay"],
];
const TPL_EX = [
  { Name: "Asha Rao", Instagram: "@asha.creates", WhatsApp: "9876543210", Email: "asha@example.com", City: "Mumbai", Status: "Approved", "Fee (₹)": "15000", "Advance %": "50", "Pay days": "7", Terms: "includes 1 story repost", "UPI ID": "asha@okhdfcbank", "Account holder": "Asha Rao" },
  { Name: "Rohan Mehta", Instagram: "rohan.eats", WhatsApp: "98111 22233", Email: "rohan@example.com", City: "Delhi" },
  { Name: "Meera Shah", Instagram: "meera.styles", WhatsApp: "9000011111", City: "Pune", Status: "Address confirmed", Address: "Flat 4B, Lake View, Koregaon Park", State: "Maharashtra", "PIN code": "411001", "Fee (₹)": "8000", "Advance %": "0", "Pay days": "5", "Account no": "50100123456789", IFSC: "HDFC0001234", "Account holder": "Meera Shah" },
  { Name: "Kabir Sen", Instagram: "@kabir.cooks", WhatsApp: "9830012345", Email: "kabir@example.com", City: "Kolkata", Status: "Courier sent", Address: "12 Park St", State: "West Bengal", "PIN code": "700016", Courier: "DTDC", Tracking: "D12345678" },
  { Name: "Nisha Jain", Instagram: "nisha.home", WhatsApp: "9123456780", City: "Jaipur", Status: "Video submitted", "Video link": "https://drive.google.com/file/d/example" },
  { Name: "Ishaan Mehra", Instagram: "@ishaan.fit", WhatsApp: "9899012345", City: "Gurugram", Status: "Courier delivered", Address: "B-12, DLF Phase 2", State: "Haryana", "PIN code": "122002", Courier: "Delhivery", Tracking: "DL445566", "Delivered on": "22/11/2026", ship: true },
  { Name: "Riya Kapoor", Instagram: "@riya.reviews", WhatsApp: "9871203456", City: "Noida", Status: "Rejected", Reason: "Followers below the brand’s minimum" },
  { Name: "Dev Patel", Instagram: "dev.unboxes", WhatsApp: "9824012345", City: "Ahmedabad", Status: "Changes requested", Reason: "Show the product name clearly in the first 3 seconds" },
  { Name: "Sana Khan", Instagram: "@sana.eats", WhatsApp: "9930012345", City: "Mumbai", Status: "Visit booked", "Visit date": "05/12/2026", Slot: "4 pm", only: ["visit"] },
  { Name: "Arjun Rao", Instagram: "arjun.travels", WhatsApp: "9845012345", City: "Bengaluru", Status: "Visited", only: ["visit"] },
  { Name: "Tara Bose", Instagram: "@tara.dines", WhatsApp: "9831098765", City: "Kolkata", Status: "Missed visit", only: ["visit"] },
  { Name: "Vikram Singh", Instagram: "@vikram.tech", WhatsApp: "9811198765", City: "Delhi", Status: "Advance paid", "Fee (₹)": "10000", "Paid amount": "5000", UTR: "UTR998877665", "Paid on": "20/11/2026", only: ["paid", "barter_paid", "visit"] },
  { Name: "Neha Gupta", Instagram: "neha.makeup", WhatsApp: "9876501234", City: "Indore", Status: "Fully paid", UTR: "UTR112233445", "Paid on": "24/11/2026", only: ["paid", "barter_paid", "visit"] },
  { Name: "Aman Verma", Instagram: "@aman.vlogs", WhatsApp: "9812345670", City: "Lucknow", Status: "Video overdue", Reason: "Parcel delivered 3 days ago, no video yet" },
  { Name: "Karan Gill", Instagram: "@karan.fits", WhatsApp: "9988776655", City: "Chandigarh", Status: "Backout", Reason: "No time to shoot this month" },
  { Name: "Priya Nair", Instagram: "priya.glow", WhatsApp: "9445566778", City: "Kochi", Status: "Delivery issue", Reason: "Wrong product delivered — got the 100 ml bottle", ship: true },
];
// physical visit bhi paid jaisa — product nahi, to address / courier columns nahi
/* brief ke criteria → required columns (City ke baad) — jo criteria campaign mein nahi, uska column nahi */
const CRIT_TPL = [
  ["gender", "Gender", "Female / Male — the brief needs it", ["Female", "Male", "Female"]],
  ["age", "Age", "Age in years (or date of birth 14/02/1998) — the brief has an age range", ["27", "31", "24"]],
  ["marital", "Marital status", "Single / Married — the brief needs it", ["Married", "Single", "Married"]],
  ["categories", "Categories", "What they make content on, comma-separated", ["Lifestyle, Food", "Fitness", "Beauty, Fashion"]],
  ["pet", "Pet name", "Every pet’s name — more than one pet: Bruno, Kitty", ["Bruno, Kitty", "Simba", "Coco"]],
  ["pet", "Pet type", "Dog / Cat / Bird … — same order as the names", ["Dog, Cat", "Dog", "Cat"]],
  ["pet", "Pet breed", "Breed of each pet — same order", ["Labrador, Persian", "Golden Retriever", "Indie"]],
  ["pet", "Pet age", "Age of each pet (3, 6 months …) — same order", ["3, 1", "2", "8 months"]],
];
const critTpl = (crit) => CRIT_TPL.filter(([c]) => crit && crit[c]);
const tplCols0 = (kind) => TPL_COLS.filter((c) => !(c[4] === "pay" && kind === "barter") && !(c[4] === "ship" && (kind === "paid" || kind === "visit")) && !(c[4] === "visit" && kind !== "visit"));
const tplCols = (kind, crit) => {
  const base = tplCols0(kind);
  const at = base.findIndex((c) => c[0] === "City") + 1;
  const extra = critTpl(crit).map(([c, l, what, ex]) => [l, what, ex[0], `required — brief: ${c === "pet" ? (crit.pet === "any" ? "has a pet" : crit.pet) : c === "categories" ? "categories" : crit[c]}`, "crit"]);
  return [...base.slice(0, at), ...extra, ...base.slice(at)];
};
const tplRows = (kind, crit) => {
  const cols = tplCols(kind, crit);
  const cv = Object.fromEntries(critTpl(crit).map(([, l, , ex]) => [l, ex]));
  // paid / visit: product nahi → Delivery issue ki example row nahi
  return [cols.map((c) => c[0]), ...TPL_EX.filter((r) => !((r.ship || ["Courier sent"].includes(r.Status)) && (kind === "paid" || kind === "visit")) && !(r.only && !r.only.includes(kind))).map((r, ri) => cols.map((c) => (cv[c[0]] ? (ri < 6 ? cv[c[0]][ri % cv[c[0]].length] : "") : (kind === "paid" || kind === "visit") && ["Address confirmed", "Courier sent", "Courier delivered"].includes(r.Status) && c[0] === "Status" ? "Contract signed" : r[c[0]] || "")))];
};

const PAY_COLS = [["Fee (₹)", "fee"], ["Advance %", "advance_pct"], ["Pay days", "pay_days"], ["Terms", "pay_terms"], ["UPI ID", "upi"], ["Account no", "account_no"], ["IFSC", "ifsc"], ["Account holder", "account_name"]];

/**
 * Bulk upload step 1 — 3 roop (har ek apna route):
 *  mode="upload"  → /upload
 *  mode="help"    → /upload/help (guide drawer khula)
 *  mode="history" → /upload/history (upload history khuli)
 * Data: api.campaign_sheet_rows + api.campaign_sheet_link_get (download / Google Sheet), api.campaign_upload_history (history).
 * Sheet padhna browser mein (Excel / CSV / Word / Google Sheet / paste) → sessionStorage → /match.
 */
/** Chune hue creators ki sheet (bulk upload jaise columns) — Creators tab ka "Download selected" aur yahan ka "Only the ticked" */
export const tickedKey = (id) => `ga_ticked_${id}`;
export function readTicked(id) {
  try {
    return JSON.parse(sessionStorage.getItem(tickedKey(id)) || "[]");
  } catch {
    return [];
  }
}
/* 🚪 / ⚠ — khule backout / return aur delivery issue (campaign sheet download mein do info columns) */
const BO_TXT = { requested: "Backout asked — waiting for decision", approved: "Return pending — product to come back", shipped: "Return on the way" };
async function flagInfo(id, kind) {
  const prod = !(kind === "paid" || kind === "visit");
  const [b, d, o, x] = await Promise.all([rpc("admin", "api.campaign_backouts", { p_campaign: id }), prod ? rpc("admin", "api.campaign_delivery_issues", { p_campaign: id }) : Promise.resolve({}), rpc("admin", "api.campaign_video_overdue", { p_campaign: id }), rpc("admin", "api.campaign_creator_extras", { p_campaign: id })]);
  const m = {};
  const put = (r, k, v) => [r.participation_id && "p:" + r.participation_id, r.invite_id && "i:" + r.invite_id].filter(Boolean).forEach((key) => (m[key] = { ...(m[key] || {}), [k]: v }));
  ((b.data && b.data.rows) || []).forEach((r) => {
    const t = r.kind === "withdraw" && r.status === "approved" ? "" : BO_TXT[r.status];
    if (t) put(r, "bo", `${t}${r.return_by && r.status === "approved" ? ` · by ${r.return_by}` : ""} · ${r.reason_note || r.reason_label}`);
  });
  ((d.data && d.data.rows) || []).filter((r) => r.status !== "resolved").forEach((r) => put(r, "di", `${r.status === "exchange_sent" ? "Exchange on the way · " : ""}${r.label}${r.note ? " — " + r.note : ""}`));
  (Array.isArray(o.data) ? o.data : []).forEach((r) => put(r, "vo", `Marked overdue${r.note ? " — " + r.note : ""}`));
  // brief ke columns (sirf jo criteria campaign mein hai) + Delivered on — wahi naam jo template mein, wapas upload ho sake
  const xd = x.data || {};
  const crit = xd.criteria || {};
  const xr = xd.rows || {};
  const pets = (e, k) => ((e && e.pets) || []).map((p) => (p && p[k]) || "").join(", ");
  const dd = (v) => (v ? new Date(v).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" }) : "");
  const XC = [
    ...(prod ? [["Delivered on", (e) => dd(e && e.delivered_at)]] : []),
    ...(crit.gender ? [["Gender", (e) => (e && e.gender) || ""]] : []),
    ...(crit.age ? [["Age", (e) => (e && (e.age || e.dob)) || ""]] : []),
    ...(crit.marital ? [["Marital status", (e) => (e && e.marital) || ""]] : []),
    ...(crit.categories ? [["Categories", (e) => ((e && e.categories) || []).join(", ")]] : []),
    ...(crit.pet ? [["Pet name", (e) => pets(e, "name")], ["Pet type", (e) => pets(e, "type")], ["Pet breed", (e) => pets(e, "breed")], ["Pet age", (e) => pets(e, "age")]] : []),
  ];
  const head = [...XC.map((c) => c[0]), ...(prod ? ["Backout / return", "Delivery issue"] : ["Backout"]), "Video overdue"];
  return { head, cells: (key) => [...XC.map(([, fn]) => String(fn(xr[key]) ?? "")), ...(prod ? [(m[key] || {}).bo || "", (m[key] || {}).di || ""] : [(m[key] || {}).bo || ""]), (m[key] || {}).vo || ""] };
}

export async function downloadSheetRows(id, keys, kind, fmt = "xlsx", data = null) {
  let d = data;
  if (!d) {
    const r = await rpc("admin", "api.campaign_sheet_rows", { p_campaign: id });
    if (r.error) throw r.error;
    d = r.data;
  }
  const want = new Set((keys || []).map((k) => String(k).replace(/^([pi])-/, "$1:")));
  const list = ((d && d.rows) || []).filter((r) => want.has(r.key));
  if (!list.length) return 0;
  const cols = [...SH_COLS.filter(([h]) => !((kind === "paid" || kind === "visit") && SHIP.includes(h))), ...(kind === "barter" ? [] : PAY_COLS)];
  const fi = await flagInfo(id, kind).catch(() => null);
  const aoa = [[...cols.map((c) => c[0]), ...(fi ? fi.head : [])], ...list.map((r) => [...cols.map(([, k]) => (k === "instagram" && r[k] ? "@" + String(r[k]).replace(/^@/, "") : k === "whatsapp" ? sheetPhone(r[k]) : r[k] == null ? "" : String(r[k]))), ...(fi ? fi.cells(r.key) : [])])];
  const nm = `${String((d && d.campaign) || "campaign").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 40) || "campaign"}-selected`;
  if (fmt === "csv") downloadFile(nm + ".csv", aoa);
  else await downloadXlsx(nm + ".xlsx", aoa, "Creators");
  return list.length;
}

export default function UploadStart({ id, mode = "upload" }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [toast, show] = useToast();
  const kind = useUploadKind(id);
  const skip = !id || id === "sample";
  const sheet = useRpc("admin", "api.campaign_sheet_rows", { p_campaign: id }, { skip });
  // brief ke criteria (gender / age / pets …) → template ke required columns + har creator ke saved details
  const extras = useRpc("admin", "api.campaign_creator_extras", { p_campaign: id }, { skip });
  const crit = (extras.data && extras.data.criteria) || null;
  const [tickN] = useState(() => (typeof window === "undefined" ? 0 : readTicked(id).length));
  const link = useRpc("admin", "api.campaign_sheet_link_get", { p_campaign: id }, { skip });
  const hist = useRpc("admin", "api.campaign_upload_history", { p_campaign: id }, { skip: skip || mode !== "history" });
  const [step, setStep] = useState("");
  const [gsheet, setGsheet] = useState(null); // null = jo link saved hai wahi dikhao
  const [sheetUrl, setSheetUrl] = useState("");
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState("");
  const base = `/vault/campaigns/${id}/upload`;
  const steps = statusesFor(kind);
  const guide = steps.map((s, i) => [isSpecial(s[0]) ? `★ ${s[1]}` : `${i + 1} ${s[1]}`, s[2], s[4] || "—", s[3] === "no message" ? "—" : `✉️ ${s[3]}`]);

  const rows = (sheet.data && sheet.data.rows) || [];
  const cnt = (k) => rows.filter((r) => (k === "" ? true : k === "out" ? /^Out/.test(r.status || "") : r.status_key === k && !/^Out/.test(r.status || ""))).length;
  const opts = [["", "All creators"], ...steps.filter((s) => !isSpecial(s[0])).map((s) => [s[0], s[1]]), ["out", "Out of the campaign"]];
  const saved = link.data || null;
  const gval = gsheet == null ? (saved && saved.sheet_url) || "" : gsheet;

  // sheet → match step
  const start = (src, aoa) => {
    try {
      const up = buildUpload(aoa, src, kind);
      up.crit = crit; // check step: brief ke required columns
      if (!up.rows.length) return show("That sheet has no creator rows.");
      saveUpload(id, up);
      router.push(`${base}/match`);
    } catch (e) {
      show(errText(e));
    }
  };
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy("file");
    try {
      start(f.name, await readUploadFile(f));
    } catch (er) {
      show(errText(er));
    }
    setBusy("");
  };
  const loadLink = async () => {
    const u = sheetUrl.trim();
    if (!u) return show("Paste a Google Sheet link first");
    setBusy("link");
    try {
      start("Google Sheet", await readSheetLink(u));
    } catch (er) {
      show(errText(er));
    }
    setBusy("");
  };

  // ⬇ campaign sheet (purane shDownload jaisa)
  const download = async (fmt) => {
    const list = rows.filter((r) => (step === "" ? true : step === "out" ? /^Out/.test(r.status || "") : r.status_key === step && !/^Out/.test(r.status || "")));
    if (!list.length) return show("No creators to download for that choice.");
    const cols = [...SH_COLS.filter(([h]) => !((kind === "paid" || kind === "visit") && SHIP.includes(h))), ...(kind === "barter" ? [] : PAY_COLS)];
    const fi = await flagInfo(id, kind).catch(() => null);
    const aoa = [[...cols.map((c) => c[0]), ...(fi ? fi.head : [])], ...list.map((r) => [...cols.map(([, k]) => (k === "instagram" && r[k] ? "@" + String(r[k]).replace(/^@/, "") : k === "whatsapp" ? sheetPhone(r[k]) : r[k] == null ? "" : String(r[k]))), ...(fi ? fi.cells(r.key) : [])])];
    const lab = step ? (opts.find((o) => o[0] === step) || [])[1] || step : "";
    const nm = `${String(sheet.data.campaign || "campaign").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 40) || "campaign"}-creators${lab ? "-" + lab.replace(/[^\w]+/g, "-").toLowerCase() : ""}`;
    try {
      if (fmt === "csv") downloadFile(nm + ".csv", aoa);
      else await downloadXlsx(nm + ".xlsx", aoa, "Creators");
      show(`⬇ ${list.length} creator${list.length !== 1 ? "s" : ""} downloaded — same columns as the bulk upload, so you can upload it again`);
    } catch (e) {
      show(errText(e));
    }
  };
  const tplName = `bulk-template-${kind}`;
  const tplDownload = async (fmt) => {
    try {
      if (fmt === "csv") downloadFile(tplName + ".csv", tplRows(kind, crit));
      else await downloadXlsx(tplName + ".xlsx", tplRows(kind, crit), "Creators");
      show(`⬇ ${KIND_LABEL[kind]} template downloaded — ${tplRows(kind, crit).length - 1} example rows, replace them with your creators`);
    } catch (er) {
      show(errText(er));
    }
  };
  const tplCopy = async () => {
    const tsv = tplRows(kind, crit)
      .map((r) => r.join("\t"))
      .join("\n");
    try {
      await navigator.clipboard.writeText(tsv);
      show("📋 Copied — open a new Google Sheet, click cell A1 and paste");
    } catch {
      show("Couldn't copy — download the Excel template instead");
    }
  };
  const linkSheet = async (e) => {
    e.preventDefault();
    const u = gval.trim();
    if (u && !/^https:\/\/docs\.google\.com\/spreadsheets\//i.test(u)) return show("Paste the Google Sheet link (https://docs.google.com/spreadsheets/…)");
    setBusy("gs");
    const { error } = await rpc("admin", "api.campaign_sheet_link", { p_campaign: id, p_sheet_url: u || null, p_new_token: false });
    setBusy("");
    if (error) return show(errText(error));
    show("🔗 Sheet linked — the sheet’s Apps Script keeps it up to date");
    setGsheet(null);
    link.reload(true);
  };
  const ups = (hist.data && hist.data.uploads) || [];

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <UploadCard id={id} step={1}>
        <div className="us-sheet">
          <p className="us-sheet__t">
            <b>📄 Campaign sheet</b> <span>— every creator in the same columns as the bulk upload: download it, edit it, upload it again · or link a Google Sheet that keeps itself up to date</span>
          </p>
          <div className="us-row">
            <span className="us-lab">⬇️ Download</span>
            <div className="us-ctl">
              <select className="ga-input us-sel" value={step} onChange={(e) => setStep(e.target.value)} aria-label="Which creators">
                {opts.map(([k, l]) => {
                  const n = sheet.data ? cnt(k) : null;
                  if (k && n === 0) return null;
                  return (
                    <option key={k} value={k}>
                      {l}
                      {n != null ? ` (${n})` : ""}
                    </option>
                  );
                })}
              </select>
              <button type="button" className="ga-btn ga-btn--primary us-b" onClick={() => download("xlsx")} disabled={!sheet.data}>
                ⬇️ Excel
              </button>
              <button type="button" className="ga-btn ga-btn--ghost us-b" onClick={() => download("csv")} disabled={!sheet.data}>
                ⬇️ CSV
              </button>
              <span className="us-or">or</span>
              <button
                type="button"
                className="c2-tbtn"
                disabled={!sheet.data}
                title="Creators you ticked in the Creators tab"
                onClick={async () => {
                  const keys = readTicked(id);
                  if (!keys.length) return show("Tick creators in the Creators tab first — then come back here, or use “Download selected” there.");
                  try {
                    const n = await downloadSheetRows(id, keys, kind, "xlsx", sheet.data);
                    show(n ? `⬇ ${n} ticked creator${n !== 1 ? "s" : ""} downloaded` : "None of the ticked creators are in this sheet any more.");
                  } catch (e) {
                    show(errText(e));
                  }
                }}
              >
                ⬇️ Only the ticked ({tickN})
              </button>
            </div>
          </div>
          {sheet.error && <p className="us-err">{errText(sheet.error)}</p>}
          <div className="us-row">
            <span className="us-lab">
              🔗 Google{" "}
              <br />
              Sheet
            </span>
            <form className="us-ctl" onSubmit={linkSheet}>
              <input className="ga-input us-link" value={gval} onChange={(e) => setGsheet(e.target.value)} placeholder="Paste your Google Sheet link (https://docs.google.com/spreadsheets/…)" aria-label="Google Sheet link" />
              <button type="submit" className="ga-btn ga-btn--primary us-b" disabled={busy === "gs"}>
                {busy === "gs" ? "Saving…" : saved ? "Save" : "Link it"}
              </button>
            </form>
          </div>
          <div className="us-row">
            <span className="us-lab">🧾 Template</span>
            <div className="us-ctl">
              <button type="button" className="ga-btn ga-btn--ghost us-b" onClick={() => tplDownload("xlsx")}>
                ⬇️ Excel template
              </button>
              <button type="button" className="ga-btn ga-btn--ghost us-b" onClick={() => tplDownload("csv")}>
                ⬇️ CSV template
              </button>
              <button type="button" className="c2-tbtn" onClick={tplCopy}>
                📋 Copy for Google Sheets
              </button>
            </div>
          </div>
          {saved && saved.sheet_url && <p className="us-sync">{saved.last_pull_at ? `✅ Last updated ${when(saved.last_pull_at)} · ${saved.pulls || 0} update${(saved.pulls || 0) !== 1 ? "s" : ""}` : "⏳ Not updated yet — add the Geek OS script in the sheet once"}</p>}
        </div>

        {mode !== "history" && (
          <>
            <MsgOff id={id} />
            <p className="us-desc">
              Google Sheet link, Excel / CSV, or a Word file (table or a simple list). Give every creator a <b>Status</b>— the exact step they are on. They get <b>one message for that step</b>: Approved → the invite; a later step → only that step’s message. Creators already on Geek OS go on that step now; new ones register from the WhatsApp invite (Instagram is optional for bulk creators) and land right on their step. Every message goes once, on WhatsApp through the new Utility templates.
            </p>
          </>
        )}

        <Link href={mode === "help" ? base : `${base}/help`} className="us-fold">
          ▸ 📘 How to set up your sheet — {KIND_LABEL[kind]} template
        </Link>
        {mode === "history" ? (
          <div className="us-fold us-fold--open">
            <Link href={base} className="us-fold__t">
              ▾ 🗂 Upload history — every upload, when, how many creators and who
            </Link>
            <div className="c2-tw">
              <table className="c2-t us-t">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Source</th>
                    <th>Rows</th>
                    <th>Uploaded</th>
                    <th>Skipped</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  <TableState cols={6} loading={hist.loading && !hist.data} error={!hist.data && hist.error} onRetry={hist.reload} empty={hist.data && !ups.length && "No bulk upload on this campaign yet."} />
                  {ups.map((u, i) => {
                    const nu = (u.not_uploaded || []).length || u.skipped || 0;
                    const ok = (u.new_count || 0) + (u.updated_count || 0);
                    return (
                      <tr key={u.batch_id || i}>
                        <td>{when(u.at)}</td>
                        <td title={u.note || ""}>{u.source || u.file || "Bulk upload"}</td>
                        <td>{ok + nu}</td>
                        <td>{ok}</td>
                        <td title={(u.not_uploaded || []).slice(0, 10).map((x) => `Row ${x.row}: ${x.reason}`).join("\n")}>{nu}</td>
                        <td>{u.who || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {ups.length > 0 && (
              <UploadHistory
                id={id}
                kind={kind}
                ups={ups}
                show={show}
                onDownload={async (keys) => {
                  try {
                    const k = await downloadSheetRows(id, keys, kind, "xlsx", sheet.data);
                    show(k ? `⬇ ${k} creator${k !== 1 ? "s" : ""} downloaded — bulk-upload columns` : "None of these creators are in the sheet any more.");
                  } catch (e) {
                    show(errText(e));
                  }
                }}
              />
            )}
          </div>
        ) : (
          <Link href={`${base}/history`} className="us-fold">
            ▸ 🗂 Upload history — every upload, when, how many creators and who
          </Link>
        )}

        <div className="us-act">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.xlsm,.ods,.csv,.tsv,.doc,.docx,.txt" hidden onChange={onFile} />
          <button type="button" className="ga-btn ga-btn--primary" onClick={() => fileRef.current?.click()} disabled={busy === "file"}>
            {busy === "file" ? "Reading…" : "📄 Choose file"}
          </button>
          <input className="ga-input us-paste" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="or paste a Google Sheet link" aria-label="Google Sheet link to upload" />
          <button type="button" className="ga-btn ga-btn--ghost" onClick={loadLink} disabled={busy === "link"}>
            {busy === "link" ? "Loading…" : "Load sheet"}
          </button>
          <Link href={`/vault/campaigns/${id}/find`} className="ga-btn ga-btn--ghost">
            🎯 Pick from Geek OS instead
          </Link>
        </div>
        <details className="us-rows">
          <summary>…or paste rows (copy cells from Sheets / Excel / Word)</summary>
          <textarea className="ga-input" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Name\tInstagram\tWhatsApp\tStatus\nAsha Rao\t@asha.creates\t+91 98765 43210\tApproved"} rows={5} />
          <button type="button" className="ga-btn ga-btn--ghost ga-btn--sm" onClick={() => (paste.trim() ? start("pasted rows", readPasted(paste)) : show("Paste some rows first"))}>
            Use these rows
          </button>
        </details>
      </UploadCard>

      {mode === "help" && (
        <div className="us-wrap" onClick={() => router.push(base)}>
          <aside className="us-guide" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="How to set up your sheet">
            <Link href={base} className="us-x" aria-label="Close">
              ✕
            </Link>
            <p className="us-eye">Bulk upload · Guide</p>
            <h2>📘 How to set up your sheet</h2>
            <p className="us-gsub">{KIND_LABEL[kind]} template · one creator per row · keep the first row as column names</p>
            <h3>📝 Step by step</h3>
            <p className="us-gtxt">
              1. Download the {KIND_LABEL[kind]} template below (Excel or CSV) — it has exactly the columns this campaign type needs — or copy it into a new Google Sheet. 2. One creator per row. 3. Every row needs WhatsApp, Email or Instagram — best is WhatsApp + email. 4. Status = the step the creator is on (blank = Applied). 5. Some steps need one more column — a row without it is flagged, and one “Upload all anyway” button sends every such row without a message. 6. For creators already on the campaign the ★ statuses work too: {kind === "visit" ? "Visit booked (with Visit date), Visited, Missed visit, " : ""}Video overdue, Changes requested (Reason = what to change), {kind === "barter" ? "" : "Advance paid / Fully paid (UTR — only recorded, no money is sent), "}Rejected (Reason), Backout{kind === "paid" || kind === "visit" ? "" : ", Delivery issue"} (Reason). The template’s example rows show each one. 7. The brief’s criteria get their own required columns (only the ones this campaign asks for{crit ? `: ${[crit.gender && "Gender", crit.age && "Age", crit.marital && "Marital status", crit.categories && "Categories", crit.pet && "Pet name / type / breed / age"].filter(Boolean).join(", ") || "none"}` : ""}) {crit && crit.pet ? " — more than one pet goes comma-separated in the same cell (Bruno, Kitty)" : ""} — everything is saved on the creator’s account.{kind === "paid" || kind === "visit" ? "" : " 8. Delivered on = the day the parcel arrived (blank = today)."}
              {kind !== "barter" ? " 6. Fee, Advance %, Pay days, UPI / Account no + IFSC columns set each creator’s payment as they land." : ""}
            </p>
            <div className="us-gbtns">
              <button type="button" className="ga-btn ga-btn--primary us-b" onClick={() => tplDownload("xlsx")}>
                ⬇️ Excel template (.xlsx)
              </button>
              <button type="button" className="ga-btn ga-btn--ghost us-b" onClick={() => tplDownload("csv")}>
                ⬇️ CSV template
              </button>
              <button type="button" className="ga-btn ga-btn--ghost us-b" onClick={tplCopy}>
                📋 Copy for Google Sheets
              </button>
            </div>
            <hr />
            <h3>🏷 Statuses — write exactly this in the Status column</h3>
            <div className="us-gtw">
              <table className="c2-t us-gt">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>What happens</th>
                    <th>Row also needs</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {guide.map((g) => (
                    <tr key={g[0]}>
                      {g.map((v, i) => (
                        <td key={i}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <hr />
            <h3>🧾 Columns — what to put in each one</h3>
            <p className="us-gtxt">Column names don&apos;t have to match exactly — we match them and you can fix them in the next step.</p>
            <div className="us-gtw">
              <table className="c2-t us-gt">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>What to put</th>
                    <th>Example</th>
                    <th>Needed</th>
                  </tr>
                </thead>
                <tbody>
                  {tplCols(kind, crit).map((c) => (
                    <tr key={c[0]}>
                      <td>
                        <b>{c[0]}</b>
                      </td>
                      <td>{c[1]}</td>
                      <td>{c[2]}</td>
                      <td>{c[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <hr />
            <h3>👀 Example — how your sheet should look</h3>
            <div className="us-gtw">
              <table className="c2-t us-gt us-ex">
                <thead>
                  <tr>
                    {tplRows(kind, crit)[0].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tplRows(kind, crit)
                    .slice(1)
                    .map((r, i) => (
                      <tr key={i}>
                        {r.map((v, j) => (
                          <td key={j}>{v || "—"}</td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </aside>
        </div>
      )}
      {toast}

      <style>{`

        .us-gbtns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .us-ex { width: max-content; min-width: 100%; }
        .us-ex td, .us-ex th { white-space: nowrap !important; }
        .us-sheet { padding: 22px 20px 34px; border: 1px solid var(--ad-line); border-radius: 14px; }
        .us-sheet__t { font-size: 12px; line-height: 1.4; color: var(--ad-muted); }
        .us-sheet__t b { font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        .us-row { display: flex; align-items: center; gap: 16px; margin-top: 6px; }
        .us-row + .us-row { margin-top: 15px; }
        .us-lab { width: 96px; flex-shrink: 0; font-size: 12px; font-weight: 700; line-height: 1.33; color: var(--ad-ink); }
        .us-ctl { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
        .us-sel { width: 160px; height: 43px; padding: 0 12px; -webkit-appearance: none; appearance: none; font-size: 14px; color: #293652; cursor: pointer; }
        .us-b { height: 43px; padding: 0 15px; }
        .us-or { font-size: 12px; color: var(--ad-muted); margin: 0 4px; }
        .us-link { width: 270px; height: 43px; }
        .us-desc { margin-top: 18px; font-size: 12px; line-height: 1.55; color: var(--ad-muted); }
        .us-desc b { font-weight: 700; }
        .us-card .c2-note, .up-card .c2-note { margin-top: 15px; }
        .us-fold { display: block; margin-top: 14px; padding: 14px 15px; border: 1px solid var(--ad-line); border-radius: 14px; font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        a.us-fold:hover { border-color: #cfd2ee; background: var(--ad-soft-2); }
        .us-fold--open { padding-bottom: 10px; }
        .us-fold__t { display: block; }
        .us-t { margin-top: 13px; font-weight: 400; }
        .us-t td { height: 48px; padding-top: 6px; padding-bottom: 6px; }
        .us-act { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
        .us-act .ga-btn { height: 42px; }
        .us-paste { width: 270px; height: 42px; }
        .us-rows { margin-top: 16px; font-size: 12px; color: var(--ad-muted); }
        .us-rows summary { cursor: pointer; list-style: none; }
        .us-rows summary::before { content: "▸ "; }
        .us-rows[open] summary::before { content: "▾ "; }
        .us-rows textarea { margin: 10px 0; font-family: ui-monospace, monospace; font-size: 12px; }

        .us-wrap { position: fixed; inset: 0; z-index: 90; background: rgba(20,33,59,.28); animation: adFade .15s ease; }
        .us-guide { position: absolute; right: 0; top: 0; bottom: 0; width: min(750px, 100%); padding: 30px 30px 30px 20px; overflow-y: auto; background: #fff; box-shadow: -20px 0 60px -30px rgba(20,33,59,.5); animation: usIn .2s ease; }
        @keyframes usIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
        .us-x { position: absolute; right: 30px; top: 30px; width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: var(--ad-soft); color: var(--ad-muted-2); font-size: 14px; }
        .us-eye { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8b92aa; }
        .us-guide h2 { margin-top: 18px; font-family: var(--ad-head); font-size: 25px; font-weight: 800; letter-spacing: -0.9px; color: var(--ad-ink); }
        .us-gsub { margin-top: 20px; font-size: 12px; color: var(--ad-muted); }
        .us-guide h3 { margin: 18px 0 0; font-size: 13px; font-weight: 700; color: var(--ad-ink); }
        .us-gtxt { margin-top: 13px; font-size: 12px; line-height: 1.55; color: var(--ad-muted); }
        .us-guide hr { margin: 20px 0 0; border: 0; border-top: 1px solid var(--ad-line); }
        .us-gtw { overflow-x: auto; margin-top: 16px; }
        .us-gt { table-layout: auto; }
        .us-gt td { height: 48px; padding-top: 8px; padding-bottom: 8px; white-space: normal; overflow: visible; text-overflow: clip; max-width: none; line-height: 1.4; vertical-align: top; }
        .us-gt td:first-child { white-space: nowrap; }

        @media (max-width: 640px) {
          .us-sheet { padding: 16px 14px; }
          .us-row { flex-direction: column; align-items: flex-start; gap: 8px; }
          .us-lab br { display: none; }
          .us-lab { width: auto; }
          .us-sel, .us-link, .us-paste { width: 100%; }
          .us-ctl { width: 100%; }
          .us-act .ga-btn { flex: 1 1 auto; }
          .us-guide { padding: 22px 18px; }
          .us-x { right: 18px; top: 18px; }
          .us-guide h2 { font-size: 21px; padding-right: 40px; }
        }
        .us-err { margin-top: 10px; font-size: 12px; color: #d4493f; }
        .us-sync { margin-top: 12px; font-size: 12px; color: var(--ad-muted); }
      `}</style>
    </AdminShell>
  );
}
