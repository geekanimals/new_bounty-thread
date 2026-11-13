"use client";

import { Panel, Note, splitCsv, loadScript, readSheetFile, MAMMOTH_SRC } from "@/components/admin/campaign2/kit";
import { useRpc } from "@/lib/supabase";
import { useCampaign, campKind } from "@/components/admin/campaign/live";

/*
 * 📄 Bulk upload — purane app ka BULK CREATOR UPLOAD (app.js) yahan:
 * columns ka auto match (BK_FIELDS), Status ke steps (BK_STATUSES, campaign type ke hisaab se),
 * har row ko kya chahiye (BK_REQ), sheet padhna (Excel / CSV / Word / Google Sheet / paste).
 * Steps ke beech data sessionStorage mein (har step apna route).
 */

// [key, label, heading regex] — purane BK_FIELDS jaisa (order zaroori hai: pehle wala column le leta hai)
export const BK_FIELDS = [
  ["name", "Name", /^(full ?name|name|creator( name)?|influencer( name)?)$/i],
  ["fee", "Fee (₹)", /^(?!.*(advance|%|day|term|note|mode|method|status|upi|account|ifsc|bank|follower|product)).*(fee|amount|commercials?|price|rate|charges?|budget|deal value|payment)/i],
  ["advance_pct", "Advance %", /advance/i],
  ["pay_days", "Pay days", /^(?!.*(content|video|post ?due)).*(pay(ment)? ?(days|after|due)|days? (to|for|till) pay)/i],
  ["pay_terms", "Terms", /(pay(ment)? ?terms|^terms$|payment ?note)/i],
  ["upi", "UPI ID", /(upi|vpa)/i],
  ["account_no", "Account no", /^(?!.*(name|holder|type|insta)).*(a\/c ?(no|number)|account ?(no|number|num)|bank ?(account|a\/c))/i],
  ["ifsc", "IFSC", /ifsc/i],
  ["account_name", "Account holder", /(account ?holder|holder ?name|account ?name|beneficiary|bene ?name|name (as )?(in|on|per) bank)/i],
  ["post_link", "Post link", /^(?!.*(track|awb|courier|video|drive)).*((post|reel|story|stories|content|live) ?(link|url)s?|permalink)/i],
  ["video_link", "Video link", /^(?!.*(track|awb|courier)).*((video|drive|cut|edit) ?(link|url)s?)/i],
  ["handle", "Instagram", /^(?!.*(track|awb|courier|post|reel|stor|video|drive|permalink|a\/c|account ?(no|num|holder|name)|bank|upi|ifsc|holder)).*(insta|^ig\b|handle|username|profile|account|link|url)/i],
  ["phone", "WhatsApp", /^(?!.*(track|awb|courier|pin|zip|postal|follower|a\/c|account|bank|upi|ifsc)).*(whats ?app|phone|mobile|contact( no| number)?|number|cell|wa\b)/i],
  ["email", "Email", /(e-?mail|mail id)/i],
  ["city", "City", /(city|location|place|town)/i],
  ["followers", "Followers", /(follower|followers|reach|fans)/i],
  ["status", "Status", /^(?!.*(mail|address|track)).*(status|stage|phase|step|approv|selected|confirm|final|shortlist|tick|✓)/i],
  ["address", "Address", /^(?!.*(e-?mail|mail id)).*(address|addr\b)/i],
  ["state", "State", /^(state|province)\b/i],
  ["pincode", "PIN code", /(pin ?code|^pin\b|zip|postal|post ?code)/i],
  ["courier", "Courier", /(courier|carrier|delivery partner|shipping partner)/i],
  ["tracking", "Tracking", /(track|awb|consignment|docket|waybill)/i],
  ["coupon", "Coupon code", /^(?!.*(barter|track|awb|pin|zip|postal)).*(coupon|promo ?code|discount ?code|voucher|creator ?code|^code$)/i],
];
// Figma ke match grid ka order
export const GRID_ORDER = ["name", "handle", "phone", "email", "city", "followers", "status", "address", "state", "pincode", "courier", "tracking", "video_link", "post_link", "coupon", "fee", "advance_pct", "pay_days", "pay_terms", "upi", "account_no", "ifsc", "account_name"];
const PAY_KEYS = ["fee", "advance_pct", "pay_days", "pay_terms", "upi", "account_no", "ifsc", "account_name"];
const SHIP_COLS = ["address", "state", "pincode", "courier", "tracking"];
export const fieldsFor = (kind) => BK_FIELDS.filter(([f]) => !(kind === "barter" && PAY_KEYS.includes(f)) && !(kind === "paid" && SHIP_COLS.includes(f)));

// [key, label, what happens, message] — purane BK_STATUSES
const BASE_ST = [
  ["registered", "Applied", "Added, waiting for screening", "no message", ""],
  ["screened", "Screened", "Checked against the brand’s criteria", "no message", ""],
  ["sent_to_brand", "Sent to brand", "On the brand’s final list", "no message", ""],
  ["approved", "Approved", "Brand said yes → the contract goes out", "Invite (geek_campaign_access)", ""],
  ["contract_sent", "Contract sent", "Creator signs in the app", "Sign your contract", ""],
  ["contract_signed", "Contract signed", "Next: the creator confirms the address", "Confirm your address", ""],
  ["address_confirmed", "Address confirmed", "Reads the video brief · you add courier", "no message", "Address, City, State, PIN"],
  ["courier_sent", "Courier sent", "Creator can track it", "Product shipped", "Courier, Tracking"],
  ["courier_delivered", "Courier delivered", "Video deadline starts", "Video brief", "Courier, Tracking"],
  ["video_brief_sent", "Video brief sent", "Creator shoots", "Video brief", "Courier, Tracking"],
  ["video_submitted", "Video submitted", "Waiting for client approval", "no message", "Video link"],
  ["client_approved", "Client approved", "Creator can post", "Video approved — post it", "Video link"],
  ["posted", "Posted / Done", "Post is live · insights start", "Campaign complete", "Post link"],
];
const SHIP_ST = ["address_confirmed", "courier_sent", "courier_delivered"];
export function statusesFor(kind) {
  const fee = "Fee (or set it later on 💰 Payments)";
  if (kind === "paid")
    return BASE_ST.filter((s) => !SHIP_ST.includes(s[0])).map((s) =>
      s[0] === "approved"
        ? [s[0], s[1], "Brand said yes → the contract goes out as soon as their fee is set", s[3], fee]
        : s[0] === "contract_signed"
          ? [s[0], s[1], "Signed → the video brief goes out at once · they add bank / UPI", "Video brief + add payment details", ""]
          : s[0] === "video_brief_sent"
            ? [s[0], s[1], "The video deadline starts today", "Video brief", ""]
            : s
    );
  if (kind === "barter_paid") return BASE_ST.map((s) => (s[0] === "approved" ? [s[0], s[1], "Brand said yes → the contract goes out as soon as their fee is set", s[3], fee] : s[0] === "contract_signed" ? [s[0], s[1], "Next: the creator confirms the address and adds bank / UPI", s[3], ""] : s));
  return BASE_ST;
}
export const stRank = (k) => Math.max(0, BASE_ST.findIndex((x) => x[0] === k)) + 1;
export const stLabel = (k) => (BASE_ST.find((x) => x[0] === k) || BASE_ST[0])[1];
export const stMsg = (k) => (BASE_ST.find((x) => x[0] === k) || BASE_ST[0])[3];
export const KIND_LABEL = { barter: "🎁 Barter campaign", barter_paid: "🎁💰 Barter + Paid campaign", paid: "💰 Paid campaign" };
export const bkKindOf = (c) => {
  const k = c ? campKind(c) : "barter";
  return ["paid", "barter_paid"].includes(k) ? k : "barter";
};
// paid campaign mein address / courier steps nahi
export const dispStatus = (kind, k) => (kind === "paid" ? (k === "address_confirmed" ? "contract_signed" : ["courier_sent", "courier_delivered", "courier_received"].includes(k) ? "video_brief_sent" : k) : k);
export const serverStatus = (kind, k) => (kind === "paid" && k === "video_brief_sent" ? "contract_signed" : k);

// database jaisa hi Status padhna (intel.ci_bulk_status); null = samajh nahi aaya
export function parseStatus(v) {
  const t = String(v == null ? "" : v)
    .trim()
    .toLowerCase()
    .replace(/^\d+\s*[.)-]?\s*/, "")
    .replace(/\s+/g, " ");
  const M = {
    registered: ["", "registered", "register", "applied", "invited", "invite", "new", "pending", "-", "—"],
    screened: ["screened", "eligible", "shortlisted"],
    sent_to_brand: ["sent to brand", "sent to the brand", "with brand"],
    approved: ["approved", "brand confirmed", "brand approved", "selected", "confirmed", "yes", "y", "ok", "final", "✓", "✔"],
    contract_sent: ["contract sent", "contract"],
    contract_signed: ["contract signed", "signed"],
    address_confirmed: ["address confirmed", "address", "address done"],
    courier_sent: ["courier sent", "shipped", "dispatched", "in transit", "product sent"],
    courier_delivered: ["courier delivered", "courier received", "delivered", "received", "product received", "product delivered"],
    video_brief_sent: ["video brief sent", "brief sent", "video brief"],
    video_submitted: ["video submitted", "submitted", "video sent"],
    client_approved: ["client approved", "video approved", "content approved"],
    posted: ["posted", "live", "published", "reel posted", "done", "completed", "complete", "posted / done", "posted/done", "posted done"],
  };
  for (const k in M) if (M[k].includes(t)) return k;
  return null;
}
export const FROM_STAGE = {
  applied: "registered",
  eligible: "screened",
  shortlisted: "screened",
  sent_to_brand: "sent_to_brand",
  invited: "approved",
  accepted: "approved",
  brand_confirmed: "approved",
  contract_sent: "contract_sent",
  contract_signed: "contract_signed",
  address_confirmed: "address_confirmed",
  product_sent: "courier_sent",
  content_created: "video_brief_sent",
  content_submitted: "video_submitted",
  changes_requested: "video_brief_sent",
  content_approved: "client_approved",
  published: "posted",
  completed: "posted",
};

/* ---------- sheet padhna ---------- */
// bina columns wali list (Word / pasted notes): har line se phone, email, Instagram, naam
export function fromLines(lines) {
  const out = [["Name", "Instagram", "WhatsApp", "Email"]];
  lines.forEach((l) => {
    l = String(l || "").trim();
    if (!l) return;
    const email = (l.match(/[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}/i) || [""])[0];
    const ig = (l.match(/instagram\.com\/([A-Za-z0-9._]+)/i) || [])[1] || (l.replace(email, "").match(/(^|\s)@([A-Za-z0-9._]{2,30})/) || [])[2] || "";
    const phone = (l.replace(email, "").match(/(\+?\d[\d\s-]{8,}\d)/) || [""])[0];
    if (!email && !ig && !phone) return;
    const name = l
      .replace(email, "")
      .replace(/(https?:\/\/)?\S*instagram\.com\/\S*/gi, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/@[A-Za-z0-9._]+/g, "")
      .replace(phone, "")
      .replace(/^\s*(\d+[.)]|[-*•▪●])\s*/, "")
      .replace(/[|,;:–—-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    out.push([name, ig, phone, email]);
  });
  return out;
}
export async function readUploadFile(file) {
  const name = (file.name || "").toLowerCase();
  if (/\.docx$/.test(name)) {
    await loadScript(MAMMOTH_SRC);
    const res = await window.mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const doc = new DOMParser().parseFromString(res.value, "text/html");
    const table = [...doc.querySelectorAll("table")].sort((a, b) => b.rows.length - a.rows.length)[0];
    if (table && table.rows.length > 1) return [...table.rows].map((tr) => [...tr.cells].map((td) => td.textContent.trim())).filter((r) => r.some(Boolean));
    return fromLines([...doc.querySelectorAll("p,li")].map((p) => p.textContent));
  }
  if (/\.doc$/.test(name)) throw new Error("Old .doc files can't be read — in Word choose File → Save As → .docx (or copy the table and paste it below).");
  if (/\.(xlsx|xls|xlsm|ods)$/.test(name)) return readSheetFile(file);
  const text = await file.text();
  const rows = splitCsv(text);
  return rows.length && rows[0].length > 1 ? rows : fromLines(text.split("\n"));
}
export const readPasted = (t) => {
  const r = splitCsv(t);
  return r.length && r[0].length > 1 ? r : fromLines(String(t).split("\n"));
};
export async function readSheetLink(url) {
  const sid = (url.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/) || [])[1];
  if (!sid) {
    if (/docs\.google\.com\/document/.test(url)) throw new Error("That's a Google Doc — open it, choose File → Download → Microsoft Word (.docx) and upload the file here.");
    throw new Error("Paste the link of a Google Sheet (docs.google.com/spreadsheets/…).");
  }
  const gid = (url.match(/[#&?]gid=(\d+)/) || [])[1] || "0";
  const r = await fetch(`https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&gid=${gid}`).catch(() => null);
  const text = r && r.ok ? await r.text() : "";
  if (!text || /^\s*</.test(text)) throw new Error("Couldn't open the sheet. In Google Sheets tap Share → General access → “Anyone with the link” (Viewer), then try again — or download it as .xlsx / .csv and upload.");
  return splitCsv(text);
}

/* ---------- rows → state (purane bkSetRows) ---------- */
const looksLikeHeader = (row) => row.some((c) => BK_FIELDS.some(([, , re]) => re.test(String(c || "")))) && !row.some((c) => /@.+\./.test(c) || /\d{8,}/.test(String(c).replace(/\D/g, "")));
export function autoMap(head, kind) {
  const map = {},
    used = new Set();
  fieldsFor(kind).forEach(([k, , re]) => {
    const i = head.findIndex((h, ix) => !used.has(ix) && re.test(String(h || "")));
    if (i >= 0) {
      map[k] = i;
      used.add(i);
    }
  });
  return map;
}
export function buildUpload(rows, src, kind) {
  if (!rows || !rows.length) throw new Error("No rows found in that file.");
  let head = rows[0],
    body = rows.slice(1);
  if (!looksLikeHeader(head)) {
    head = head.map((_, i) => `Column ${i + 1}`);
    body = rows;
  }
  const width = Math.max(...rows.map((r) => r.length));
  head = Array.from({ length: width }, (_, i) => head[i] || `Column ${i + 1}`);
  const map = autoMap(head, kind);
  // naam wale columns nahi → values se andaza
  if (map.phone == null || map.email == null || map.handle == null) {
    for (let i = 0; i < width; i++) {
      if (Object.values(map).includes(i)) continue;
      const v = body.slice(0, 20).map((r) => String(r[i] || ""));
      const third = Math.max(1, v.length / 3);
      if (map.email == null && v.filter((x) => /@.+\./.test(x)).length >= third) map.email = i;
      else if (map.phone == null && v.filter((x) => x.replace(/\D/g, "").length >= 10 && !/[a-z]/i.test(x)).length >= third) map.phone = i;
      else if (map.post_link == null && v.filter((x) => /instagram\.com\/(reel|reels|p|tv|stories)\//i.test(x)).length >= third) map.post_link = i;
      else if (map.handle == null && v.filter((x) => /instagram\.com|^@/.test(x)).length >= third) map.handle = i;
    }
  }
  const blank = (r) => !r || !r.some((c) => String(c == null ? "" : c).trim());
  const off = body === rows ? 1 : 2;
  const list = body
    .map((cells, line) => ({ cells, line }))
    .filter((x) => !blank(x.cells))
    .map((x) => ({ ...x, status: map.status != null ? dispStatus(kind, parseStatus(x.cells[map.status]) || "registered") : "registered" }));
  return { src, head, map, off, rows: list };
}
export function restatus(up, kind) {
  return { ...up, rows: up.rows.map((r) => ({ ...r, status: up.map.status != null ? dispStatus(kind, parseStatus(r.cells[up.map.status]) || "registered") : "registered", picked: false })) };
}
const fixLink = (v) =>
  String(v || "")
    .split(/[\s,;|]+/)
    .filter(Boolean)
    .map((x) => (/^https?:\/\//i.test(x) ? x : /^(www\.|m\.)?(instagram\.com|instagr\.am|drive\.google\.com|docs\.google\.com|youtu|[a-z0-9-]+\.[a-z]{2,}\/)/i.test(x) ? "https://" + x : x))
    .join(" ");
// purane bkRowData — database ko jaane wali row
export function rowData(up, r, kind) {
  const g0 = (k) => (up.map[k] != null ? String(r.cells[up.map[k]] || "").trim() : "");
  const g = (k) => (["post_link", "video_link", "handle"].includes(k) ? fixLink(g0(k)) : g0(k));
  const st = r.status || "registered";
  return {
    name: g("name"), handle: g("handle"), phone: g("phone"), email: g("email"), city: g("city"), followers: g("followers"),
    status: serverStatus(kind, st), approved: stRank(st) >= 4,
    address: g("address"), state: g("state"), pincode: g("pincode"), courier: g("courier"), tracking: g("tracking"),
    post_link: g("post_link"), video_link: g("video_link"), coupon: g0("coupon").toUpperCase().replace(/\s+/g, ""),
    fee: g("fee"), advance_pct: g("advance_pct"), pay_days: g("pay_days"), pay_terms: g("pay_terms"), upi: g("upi"), account_no: g("account_no"), ifsc: g("ifsc"), account_name: g("account_name"),
  };
}
export const sheetLine = (up, i) => (up.rows[i]?.line ?? i) + (up.off || 2);

/* ---------- row ko kya chahiye (purane BK_REQ / bkRowNeeds) ---------- */
const REQ = [
  ["address_confirmed", "Address confirmed", [["address", "Address"], ["city", "City"], ["state", "State"], ["pincode", "PIN code"]], true],
  ["courier_sent", "Courier sent", [["courier", "Courier"], ["tracking", "Tracking ID"]], true],
  ["video_submitted", "Video submitted", [["video_link", "Video link"]], false],
  ["posted", "Posted / Done", [["post_link", "Post link (Instagram)"]], false],
];
const hasPin = (v) => /(^|\D)\d{6}(?!\d)/.test(String(v || "").replace(/(\d)\s+(?=\d)/g, "$1"));
function hasField(k, d) {
  if (k === "pincode") return hasPin(d.pincode) || hasPin(d.address);
  if (k === "video_link") return /^https?:\/\/\S+\.\S+/i.test(d.video_link || "");
  if (k === "post_link") return /instagram\.com\/(reel|reels|p|tv|stories)\//i.test(d.post_link || "");
  return !!String(d[k] || "").trim();
}
function siteRank(ex) {
  if (!ex) return 0;
  const a = ex.stage && FROM_STAGE[ex.stage],
    b = ex.invite_status === "courier_received" ? "courier_delivered" : ex.invite_status;
  return Math.max(a ? stRank(a) : 0, b && BASE_ST.some((x) => x[0] === b) ? stRank(b) : 0);
}
export function rowNeeds(up, r, d, ex, kind) {
  const rank = stRank(serverStatus(kind, r.status || "registered")),
    sr = siteRank(ex),
    out = [];
  REQ.forEach(([from, label, cols, ship]) => {
    if (ship && kind === "paid") return;
    const fr = stRank(from);
    if (rank < fr || sr >= fr) return;
    const miss = cols
      .filter(([k]) => {
        if (hasField(k, d)) return false;
        if (ex) {
          if (k === "video_link") return !ex.video;
          if (k === "post_link") return !ex.posts;
          if (ex[k]) return false;
        }
        return true;
      })
      .map(([k, l]) => (up.map[k] == null ? `${l} (no “${l}” column)` : l));
    if (miss.length) out.push({ step: label, cols: miss });
  });
  return out;
}
// row upload kyun NAHI hogi (null = jayegi)
export function rowBlock(up, r, p, ex, kind) {
  if (p && p.no_contact) return "No WhatsApp, email or Instagram";
  const raw = up.map.status != null ? String(r.cells[up.map.status] || "").trim() : "";
  if (raw && !parseStatus(raw) && !r.picked) return `Status “${raw.slice(0, 30)}” isn't a step we know — pick the step`;
  const nd = rowNeeds(up, r, rowData(up, r, kind), ex, kind),
    me = stLabel(r.status || "registered");
  if (nd.length) return `“${me}” needs ` + nd.map((x) => (x.step === me ? x.cols.join(", ") : `${x.cols.join(", ")} (from the earlier “${x.step}” step)`)).join(" · ");
  return null;
}

/* ---------- steps ke beech (sessionStorage) ---------- */
const KEY = (id) => `geek_upload_${id}`;
export function loadUpload(id) {
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY(id)) || "null");
  } catch {
    return null;
  }
}
export function saveUpload(id, data) {
  try {
    window.sessionStorage.setItem(KEY(id), JSON.stringify(data));
  } catch {
    /* bahut bada sheet — memory mein hi rahega */
  }
}

/* ---------- campaign type hook ---------- */
export function useUploadKind(id) {
  const { c } = useCampaign(id);
  return bkKindOf(c);
}

const STEPS = ["Upload sheet", "Match columns", "Check & fix", "Done"];

/* Card: "📄 Bulk upload creators" + campaign type badge + 4 step stepper */
export function UploadCard({ id, step, children }) {
  const kind = useUploadKind(id);
  return (
    <Panel className="up-card" title="📄 Bulk upload creators" sub="Upload, download & Google Sheet — everyone you upload lands on the step you write." actions={<span className="ad-badge ad-badge--violet up-type">{KIND_LABEL[kind]}</span>}>
      <ol className="up-steps">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const st = n < step || step > 4 ? "done" : n === step ? "on" : "";
          return (
            <li key={s} className={`up-step ${st ? `is-${st}` : ""}`}>
              <i>{st === "done" ? "✓" : n}</i>
              {s}
            </li>
          );
        })}
      </ol>
      {children}
      <style>{`
        .up-card .c2-panel__head { margin-bottom: 18px; }
        .up-card .c2-panel__act { padding-top: 9px; }
        .up-type { height: 26px; }
        .up-steps { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 25px; padding: 0; list-style: none; }
        .up-step { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; color: #9299aa; }
        .up-step i { width: 29px; height: 29px; border-radius: 50%; display: grid; place-items: center; font-style: normal; background: var(--ad-soft); color: #778199; }
        .up-step.is-on { color: #5a4bf2; }
        .up-step.is-on i { background: var(--ad-primary); color: #fff; }
        .up-step.is-done i { background: #e2f7ef; color: #0b9b6c; }
      `}</style>
    </Panel>
  );
}

/* WhatsApp / email OFF wali laal patti — asli switches (api.messaging_status) se */
export function MsgOff({ id }) {
  const { data } = useRpc("admin", "api.messaging_status", { p_campaign: id || null }, { skip: !id || id === "sample" });
  if (!data) return null;
  const wa = data.wa_global !== false && data.wa_campaign !== false;
  const em = data.email_global !== false && data.email_campaign !== false;
  if (wa && em) return null;
  const where = (g) => (g === false ? "OFF in Settings" : "OFF for this campaign");
  const parts = [!wa && `WhatsApp is ${where(data.wa_global)}`, !em && `email is ${where(data.email_global)}`].filter(Boolean).join(" · ");
  return (
    <Note tone="red" icon="⏸">
      <b>{parts.replace(/^./, (c) => c.toUpperCase())}</b>— uploading still adds the creators and moves them to their step, but no message goes out while it’s OFF (those messages are skipped, not sent later — use Resend after turning it ON).
    </Note>
  );
}
