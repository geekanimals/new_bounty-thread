"use client";

/**
 * Campaign creators — Supabase se (purane app ka "campaign page": barter_tracker + campaign_people).
 * Har creator ki row, uski next step, kiski baari (turn) aur action button — purane bpNext / ucStepMsg jaisa.
 */
import { useState } from "react";
import { uploadMedia } from "@/lib/media";
import Link from "next/link";
import { rpc, invoke, errText, sbFor } from "@/lib/supabase";
import { BP_FAIL, effIndex, stepLabel, inviteStepRank, INVITE_STEPS, fmtNum, fmtDate, maskPhone, initials, FLOW_TOTAL, flowNoOfStage, FLOW_NO_OF_INVITE, flowName } from "@/components/admin/campaign/live";
import IgImg from "@/lib/igFresh";
import { readInsightsOcr, OCR_KEYS } from "@/lib/insightsOcr";

/* Figma ke 12 steps (row ki progress bar: "Step 9/12 · Courier delivered") */
export const JOURNEY_STEPS = ["Invited", "Registered", "Instagram connected", "Applied", "Approved", "Contract signed", "Address confirmed", "Courier sent", "In transit", "Courier delivered", "Video brief sent", "Video submitted", "Done"];

/* participation stage → Figma step (0–12) */
function partStep(x) {
  const s = x.stage;
  if (s === "product_sent") return x.shipment?.status === "delivered" ? 9 : x.shipment?.status === "shipped" ? 8 : 7;
  return (
    {
      invited: 0, shortlisted: 0, applied: 3, eligible: 3, sent_to_brand: 3, brand_confirmed: 4, accepted: 4, contract_sent: 4, contract_signed: 5,
      address_confirmed: 6, product_delivered: 9, content_created: 10, content_submitted: 11, changes_requested: 11, content_approved: 11, published: 12, completed: 12,
    }[s] ?? 3
  );
}
/* invite (bulk sheet) status → Figma step */
const INV_STEP = { registered: 3, screened: 3, sent_to_brand: 3, approved: 4, contract_sent: 4, contract_signed: 5, address_confirmed: 6, courier_sent: 7, courier_delivered: 9, video_brief_sent: 10, video_submitted: 11, client_approved: 11, posted: 12 };
const invLabel = (st) => (INVITE_STEPS.find((x) => x[0] === st) || INVITE_STEPS[0])[1];

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Purana bpNext(x) — { turn: you|creator|brand|done|off, title, text, acts: [[key, label, primary]] }
 * kind = campaign_type (paid campaign mein ship ka step nahi), progress = campaign_deliverable_progress
 */
export function nextAction(x, kind = "barter", progress = {}) {
  const ship = x.shipment || {};
  const g = progress[x.participation_id] || {};
  const overdue = x.due_on && x.due_on < todayISO();
  const noShip = kind === "paid" || kind === "visit";
  const chat = ["bpchat", "💬 Message on WhatsApp"];
  if (BP_FAIL.includes(x.stage)) return { turn: "off", title: `Out of the campaign — ${String(x.stage).replace(/_/g, " ")}`, text: x.reason || "", acts: [] };
  if (x.blocked_at) return { turn: "you", tone: "bad", title: "Blocked — no video after delivery", text: `Call ${x.phone || "them"}, note what they said and unblock with a new date.`, acts: [["bpunblock", "✅ Called — unblock", 1], ["bpcall", "📝 Note a call"], chat] };
  switch (x.stage) {
    case "invited":
    case "shortlisted":
      return { turn: "creator", title: "Invited — waiting for them to accept", text: "They got the invite on WhatsApp + email.", acts: [chat] };
    case "applied":
      // ek hi kadam: fit hai → seedha brand ki list par (pehle "Screened" alag button tha jo kuch dikhata nahi tha)
      return { turn: "you", title: "Screen this creator", text: "Fits the brief? Send them to the brand.", acts: [["bpscreen", "📋 Send to brand", 1], ["bpreject", "Not a fit"]] };
    case "eligible":
      return { turn: "you", title: "Send them to the brand", text: "They cleared screening.", acts: [["bpsend", "📋 Send to brand", 1]] };
    case "sent_to_brand":
      return { turn: "brand", title: "Waiting for the brand", text: "The brand approves in their Approvals page.", acts: [["bpbrand", "✅ Approve for brand", 1], ["bpbrandno", "Brand said no"]] };
    case "brand_confirmed":
    case "accepted":
      return ["paid", "barter_paid", "visit"].includes(kind)
        ? { turn: "you", title: "Set their fee — the contract goes out with it", text: "Open 💰 Payments, set this creator's fee & terms; the contract is sent automatically.", acts: [["bppay", "💰 Set fee", 1]] }
        : { turn: "you", title: "Send the contract", text: "Usually goes out on its own — send it now if it hasn't.", acts: [["bpcontract", "📜 Contract sent", 1]] };
    case "contract_sent":
      return { turn: "creator", title: "Stuck: contract not signed", text: "They need to open the app and sign.", acts: [chat, ["bpcontract", "🔁 Resend contract"]] };
    case "contract_signed":
      return noShip
        ? { turn: "creator", title: "Video brief going out", text: "Nothing to ship on a paid campaign — the brief goes out on its own.", acts: [chat] }
        : { turn: "creator", title: "Stuck: delivery address", text: "They need to confirm where to ship.", acts: [chat] };
    case "address_confirmed":
      return { turn: "you", title: "Ship the product", text: "Book the courier and add the tracking.", acts: [["bpship", "🚚 Courier sent", 1]] };
    case "product_sent":
      if (ship.status === "delivered") return { turn: "creator", title: "Making the video", text: x.due_on ? `Due ${fmtDate(x.due_on)}.` : "", acts: [chat, ["bppost", "🔗 Add post / story"]] };
      if (ship.status === "shipped") return { turn: "you", title: "In transit — mark delivered when it arrives", text: ship.shipped_at ? `Sent ${fmtDate(ship.shipped_at)}.` : "", acts: [["bpdeliv", "📦 Courier delivered", 1], ["bpship", "✎ Edit courier"]] };
      return { turn: "you", title: "Add the courier & tracking", text: "", acts: [["bpship", "🚚 Courier sent", 1]] };
    case "content_created":
      return { turn: "creator", tone: overdue ? "bad" : "", title: overdue ? "Stuck: video overdue" : "Making the video", text: x.due_on ? `${overdue ? "Was due" : "Due"} ${fmtDate(x.due_on)} · ${x.reminders_sent || 0} reminder${x.reminders_sent == 1 ? "" : "s"} sent` : "", acts: [chat, ["bppost", "🔗 Add post / story"]] };
    case "changes_requested":
      return { turn: "creator", title: "Fixing the video", text: "Waiting for the new cut.", acts: [chat] };
    case "content_submitted":
      return { turn: "you", title: "Review the video", text: "Approve it or ask for changes.", acts: [["bpapprove", "✅ Client approved", 1], ["bpchanges", "✏️ Ask for changes"]], video: x.submission && x.submission.url };
    case "content_approved":
      return { turn: "creator", title: "Stuck: not posted yet", text: "Approved — waiting for them to post.", acts: [chat, ["bppost", "🔗 Add post / story", 1]] };
    case "published":
      return g.all_done
        ? { turn: "you", title: "Every post is up", text: "Mark the campaign complete for them.", acts: [["bpdone", "🏁 Done", 1]] }
        : { turn: "creator", title: "Posting", text: g.left ? `Still to post: ${g.left}.` : "", acts: [["bppost", "🔗 Add post / story", 1], chat] };
    case "completed":
      return { turn: "done", title: "Done ✓", text: "", acts: [] };
    default:
      return { turn: "you", title: stepLabel(x.stage), text: "", acts: [] };
  }
}

/* Purana ucStepMsg — creator ki baari ho to "Remind / Resend" (team_send_step) */
export function stepMsg(x, nx, kind) {
  if (nx.turn !== "creator" && !x.blocked_at) return null;
  const ship = x.shipment || {};
  const overdue = x.due_on && x.due_on < todayISO();
  if (x.blocked_at) return ["video_blocked", "🔁 Resend: blocked notice"];
  switch (x.stage) {
    case "invited":
    case "shortlisted":
      return ["invited", "↻ Resend invite"];
    case "contract_sent":
      return ["contract_sent", "🔁 Resend contract"];
    case "contract_signed":
      return kind === "paid" || kind === "visit" ? null : ["confirm_address", "🔔 Remind: confirm address"];
    case "product_sent":
      return ship.status === "delivered" ? (overdue ? ["video_warning", "▶ Remind: video overdue"] : ["video_due", "▶ Remind"]) : ["product_shipped", "🔁 Resend: product shipped"];
    case "content_created":
      return overdue ? ["video_warning", "▶ Remind: video overdue"] : ["video_due", "▶ Remind"];
    case "changes_requested":
      return ["changes_requested", "🔔 Remind: send the new cut"];
    case "content_approved":
    case "published":
      return ["content_approved", "🔔 Remind: post it"];
  }
  return null;
}

const TURN_TXT = { you: "⚡ Our turn", creator: "⏳ Creator’s turn", brand: "🏢 Brand’s turn", done: "✓ Done", off: "Out" };
const waTxt = (w) => (w ? ` · 💬 ${fmtDate(w.at)} · ${w.status === "read" ? "read ✓✓" : w.status === "delivered" ? "delivered ✓✓" : w.status === "failed" ? "failed ✗" : "sent ✓"}` : "");
const ageDays = (t) => (t ? Math.max(0, Math.round((Date.now() - new Date(t).getTime()) / 86400000)) : null);
const firstAct = (nx) => nx.acts.filter((a) => a[0] !== "bpchat")[0];

/**
 * barter_tracker + campaign_people → ek list (Figma row shape)
 * row.id = "p-<participation>" ya "i-<invite>" (URL mein yahi jata hai)
 */
export function buildRows({ tracker, people, progress, kind }) {
  // har creator ki taarikhen: kab invite gaya, kab join / apply kiya, aakhri step kab badla
  const invById = {};
  (people?.invites || []).forEach((i) => i.invite_id && (invById[i.invite_id] = i));
  const pp = {};
  (people?.participants || []).forEach((p) => (pp[p.participation_id] = p));
  const parts = (tracker?.creators?.length ? tracker.creators : people?.participants || []).map((t) => {
    const p = pp[t.participation_id] || {};
    const x = { ...p, ...t, phone: t.phone || p.phone, last_wa: p.last_wa || t.last_wa, ig_connected: p.ig_connected ?? true, from_bulk: p.from_bulk, needs: p.needs };
    const cr = x.creator || {};
    const nx = nextAction(x, kind, progress || {});
    const sm = stepMsg(x, nx, kind);
    const fa = firstAct(nx);
    const act = sm ? { key: "step", msg: sm[0], label: sm[1] } : fa ? { key: fa[0], label: fa[1] } : null;
    const step = partStep(x);
    const days = ageDays(x.last_move || x.updated_at);
    return {
      id: "p-" + x.participation_id,
      kind: "p",
      pid: x.participation_id,
      x,
      nx,
      name: cr.name || (cr.username ? "@" + cr.username : "Creator"),
      handle: cr.username ? "@" + cr.username : x.applied_profile ? "@" + x.applied_profile : "",
      pic: cr.profile_picture_url || null,
      tags: [[x.from_bulk ? "via upload" : "applied on Geek", "violet"], [x.ig_connected === false ? "On Geek · connect Instagram" : "On Geek", "orange"]],
      phone: maskPhone(x.phone),
      followersN: Number(cr.followers) || 0,
      followers: cr.followers != null ? fmtNum(cr.followers) : "—",
      city: cr.city || "—",
      step,
      // display: 13 steps, wahi naam jo har jagah hain (FLOW_STEPS)
      no: BP_FAIL.includes(x.stage) ? 0 : flowNoOfStage(x.stage, x.shipment?.status),
      stepNote: BP_FAIL.includes(x.stage) ? stepLabel(x.stage) : x.stage === "changes_requested" ? "Video submitted · changes asked" : flowName(flowNoOfStage(x.stage, x.shipment?.status)),
      turnWho: nx.turn,
      turn: `${TURN_TXT[nx.turn] || TURN_TXT.you} · ${nx.title}${nx.text ? " · " + nx.text : ""}${days != null && nx.turn !== "done" ? ` · ${days} day${days === 1 ? "" : "s"}` : ""}${waTxt(x.last_wa)}`,
      action: act ? act.label : "",
      act,
      next: nx.title,
      ig: x.ig_connected !== false,
      registered: true,
      posted: ["published", "completed"].includes(x.stage),
      approved: !["applied", "eligible", "sent_to_brand", "invited", "shortlisted"].includes(x.stage) && !BP_FAIL.includes(x.stage),
      applied: ["applied", "eligible", "sent_to_brand"].includes(x.stage),
      failed: BP_FAIL.includes(x.stage),
      sortStep: effIndex(x),
      dates: {
        invited: (invById[x.invite_id] || {}).created_at || null,
        reinvited: (invById[x.invite_id] || {}).invites_sent > 1 ? (invById[x.invite_id] || {}).last_invited_at || null : null,
        joined: x.applied_at || null,
        moved: x.last_move || x.updated_at || null,
      },
    };
  });
  // jo invite wala creator join kar chuka (participant ban gaya) use dobara "Invited" mein mat gino —
  // dono list alag RPC se aati hain, ek purani (cache) ho to wahi banda do jagah dikh jata tha
  const d10 = (v) => String(v || "").replace(/\D/g, "").slice(-10);
  const hd = (v) => String(v || "").trim().replace(/^@/, "").toLowerCase();
  const joinedPh = new Set(parts.map((r) => d10(r.x.phone)).filter((v) => v.length === 10));
  const joinedHd = new Set(parts.flatMap((r) => [hd(r.x.applied_profile), hd(r.x.creator?.username)]).filter(Boolean));
  const joinedMem = new Set(parts.map((r) => r.x.member_id || r.x.owner_member_id).filter(Boolean));
  const invList = (people?.invites || []).filter((i) => !((i.member_id && joinedMem.has(i.member_id)) || joinedPh.has(d10(i.phone)) || (hd(i.handle) && joinedHd.has(hd(i.handle)))));
  const invs = invList.map((i) => {
    const st = i.status === "invited" ? "registered" : i.status || "registered";
    const miss = i.needs || [];
    const reg = !!i.registered;
    // bulk creators ko Instagram zaroori nahi — sirf jab server (needs) kuch maange tabhi atka hua maano
    const waitIg = miss.some((m) => /instagram/i.test(m));
    const step = !reg ? 0 : miss.length ? (waitIg ? 1 : 2) : INV_STEP[st] ?? 3;
    const posted = st === "posted";
    const nx = posted ? { turn: "done", title: "Done ✓" } : !reg ? { turn: "creator", title: "Not registered" } : miss.length ? { turn: "creator", title: waitIg ? "Instagram not connected" : "Profile not complete" } : { turn: "creator", title: "Joining the campaign…" };
    const days = ageDays(i.created_at);
    const act = !reg ? { key: "resend", label: "↻ Resend invite" } : waitIg && i.phone ? { key: "connectig", label: "📸 Connect Instagram" } : posted ? null : { key: "resend", label: "↻ Resend invite" };
    return {
      id: "i-" + i.invite_id,
      kind: "i",
      iid: i.invite_id,
      i,
      nx,
      name: i.name || (i.handle ? "@" + i.handle : i.phone || i.email || "Creator"),
      handle: i.handle ? "@" + i.handle : "",
      pic: i.pic || null, // registered creator ki saved Instagram photo (campaign_people.invites.pic)
      tags: [[`via ${i.source && i.source !== "upload" ? i.source : "upload"} · ${fmtDate(i.created_at)}`, "violet"], [reg ? (waitIg ? "On Geek · connect Instagram" : "On Geek") : "Not yet on Geek", reg ? "orange" : ""]],
      phone: maskPhone(i.phone),
      followersN: Number(i.followers) || 0,
      followers: i.followers != null ? fmtNum(i.followers) : "—",
      city: i.city || "—",
      step,
      sheet: INV_STEP[st] ?? 3, // sheet ka status — upar ke boxes isi se ginte hain (purane app jaisa)
      no: !reg || miss.length ? 0 : FLOW_NO_OF_INVITE[st] || 1,
      stepNote: !reg ? `Invited — not registered yet · sheet: ${invLabel(st)}` : miss.length ? `${waitIg ? "Registered — Instagram not connected" : "Registered — profile not complete"} · sheet: ${invLabel(st)}` : invLabel(st),
      turnWho: nx.turn,
      turn: `${TURN_TXT[nx.turn]} · ${nx.title}${days != null && !posted ? ` · ${days} day${days === 1 ? "" : "s"}` : ""}${waTxt(i.last_wa)}${i.last_wa ? " · automatic" : ""}`,
      action: act ? act.label : "",
      act,
      next: !reg ? "Register on Geek OS from the invite link" : nx.title,
      ig: !!i.ig_connected,
      registered: reg,
      posted,
      approved: inviteStepRank(st) >= 3,
      applied: inviteStepRank(st) < 3,
      failed: false,
      sortStep: INV_STEP[st] ?? 0,
      dates: { invited: i.created_at || null, reinvited: i.invites_sent > 1 ? i.last_invited_at || null : null, joined: null, moved: null },
    };
  });
  return [...parts, ...invs];
}

/* WhatsApp templates (purana ccLoadTpls / ccTplRoles) */
const CC_IG_TPL =
  "Hi *{{1}}*,\n\nThank you for filling the form for the campaign *{{2}}*. This is an update on your application: you are selected.\n\nNext, please open the app and connect your Instagram account to continue. Once that is done, we will update your campaign status.\n\n{{3}}";
const CC_INVITE_TPL = { name: "geek_campaign_access", status: "approved", keys: ["invited"], body: "Hi *{{1}}*, Congratulations! Your profile has been approved for the campaign *{{2}}* with *{{3}}*. Please register on the app and continue the whole process there: {{4}}" };
export function tplRoles(body) {
  const nums = [...new Set((String(body || "").match(/\{\{(\d)\}\}/g) || []).map((x) => +x.replace(/\D/g, "")))].sort((a, b) => a - b);
  const last = nums[nums.length - 1];
  return nums.map((n) => {
    if (n === 1) return "name";
    const i = body.indexOf("{{" + n + "}}");
    const before = body.slice(Math.max(0, i - 48), i);
    const after = body.slice(i + 5 + String(n).length - 1, i + 20);
    if (/Reason:\s*\*?$/i.test(before)) return null;
    if (/code[^:\n]{0,30}:\s*\*?$/i.test(before)) return "code";
    if (/(here|link|continue|below):\s*\*?$/i.test(before) || (n === last && /\n\s*$/.test(before))) return "link";
    if (/campaign\s+\*?$/i.test(before)) return "campaign";
    if (/with\s+\*?$/i.test(before) || /^\*?\s+has\b/i.test(after)) return "brand";
    return n === last ? "link" : "campaign";
  });
}
let _tpls = null;
export async function loadTemplates() {
  if (_tpls) return _tpls;
  const { data } = await rpc("admin", "api.wa_template_choices");
  const L = (data || []).filter((x) => !tplRoles(x.body).includes(null));
  if (!L.find((x) => x.name === CC_INVITE_TPL.name)) L.unshift(CC_INVITE_TPL);
  if (!L.find((x) => x.name === "geek_selected_connect_instagram")) L.unshift({ name: "geek_selected_connect_instagram", status: "submitted", keys: ["manual_ig_connect"], body: CC_IG_TPL });
  return (_tpls = L);
}

/** Ek / kai creators ko unke ABHI ke step ka naya Utility WhatsApp (api.snapto_send_current_step) */
export async function sendStepWa(campaignId, invites, parts, who, say, reload) {
  const { data: d, error } = await rpc("admin", "api.snapto_send_current_step", { p_campaign: campaignId, p_invites: invites || [], p_parts: parts || [] });
  if (error) say(errText(error));
  else if (d && d.queued) say(`✓ ${who} will get the WhatsApp in a few minutes`);
  else say(`Not sent — ${((d && d.skipped) || [])[0]?.why || "no WhatsApp message for this step"}`);
  if (reload) reload();
}

/**
 * WhatsApp to selected (purana ccWaSend, template + typed message):
 *  campaign_messaging check → campaign_wa_targets → har number par wa-send.
 *  keys = ["i:<invite>", "p:<participation>"]
 */
export async function sendWhatsApp({ campaignId, keys, template, text, confirmFn = (m) => window.confirm(m) }) {
  const ms = await rpc("admin", "api.campaign_messaging", { p_campaign: campaignId });
  const sw = ms.data || {};
  if (!ms.error && !(sw.wa_on && sw.global_wa_on !== false)) return { ok: 0, bad: [], msg: "WhatsApp is OFF for this campaign — turn it on in Overview first, then send." };
  const { data: t, error } = await rpc("admin", "api.campaign_wa_targets", { p_campaign: campaignId, p_invites: keys.filter((k) => k[0] === "i").map((k) => k.slice(2)), p_parts: keys.filter((k) => k[0] === "p").map((k) => k.slice(2)) });
  if (error) return { ok: 0, bad: [], msg: "Couldn't load the numbers: " + errText(error) };
  const tpls = template ? await loadTemplates() : [];
  const one = template ? tpls.find((x) => x.name === template) : null;
  if (template && !one) return { ok: 0, bad: [], msg: "That template isn't available." };
  const base = (t && t.app_url) || "https://bounty.geekcreativeagency.com";
  const camp = (t && t.campaign) || "the campaign";
  const brand = (t && t.brand) || "the brand";
  const seen = new Set();
  const all = (t && t.targets) || [];
  const list = all.filter((x) => x.phone && !x.opted_out && !seen.has(x.phone) && seen.add(x.phone));
  const noPh = all.filter((x) => !x.phone).length;
  const out = all.filter((x) => x.phone && x.opted_out).length;
  const skip = [noPh ? `${noPh} have no WhatsApp number` : "", out ? `${out} said STOP` : ""].filter(Boolean).join(" · ");
  if (!list.length) return { ok: 0, bad: [], msg: `Nobody to send to${skip ? " — " + skip : ""}` };
  if (one && one.status && one.status !== "approved" && !confirmFn(`“${one.name}” is not approved by Meta yet. WhatsApp may refuse it. Try anyway?`)) return { cancelled: true };
  if (!confirmFn(`Send ${one ? "this template" : "your message"} on WhatsApp to ${list.length} creator${list.length > 1 ? "s" : ""}?${skip ? `\n\nLeft out: ${skip}.` : ""}`)) return { cancelled: true };
  let ok = 0;
  const bad = [];
  for (const x of list) {
    const link = base + (x.route || "/app.html");
    const body = one
      ? { to_phone: x.phone, subject: camp, template: one.name, lang: "en", check_campaign: campaignId, variables: tplRoles(one.body).map((r) => (r === "name" ? x.name : r === "campaign" ? camp : r === "brand" ? brand : r === "code" ? x.code || "" : r === "link" ? link : "")) }
      : { to_phone: x.phone, subject: camp, text, to_name: x.name || "", link, no_template: true, check_campaign: campaignId };
    const r = await invoke("admin", "wa-send", body);
    if (r.error) {
      bad.push(`${x.who || x.name || x.phone}: ${r.error.message}`);
      if (/turned off/i.test(r.error.message)) break;
    } else ok++;
  }
  return { ok, bad, msg: `${bad.length ? "⚠️" : "🟢"} WhatsApp sent to ${ok} creator${ok !== 1 ? "s" : ""}${bad.length ? ` · ${bad.length} NOT sent — ${bad[0]}` : ""}${skip ? ` · left out: ${skip}` : ""}` };
}

/* reason list (rejection_reasons) — decline / brand passed */
let _reasons = null;
export async function rejectionReasons() {
  if (_reasons) return _reasons;
  const { data } = await rpc("admin", "api.rejection_reasons");
  _reasons = Array.isArray(data) && data.length ? data.filter((r) => r.code !== "backed_out") : [{ code: "other", label: "Other" }];
  return _reasons;
}

/* ---------- ✗ Reject — purane openReasonModal jaisa: reason chips + creator ko jaane wala message ----------
 * Brief se match nahi (api.campaign_brief_match) → mismatch wale reasons pehle se chune + message khud likha hua.
 * Team bas dekhe aur "Reject & send" dabaye. Creator ko: email + app (🔔 alerts) — "You were not selected… Reason: …"
 */
const BRIEF_CODES = /^(low_followers|high_followers|low_engagement|location_mismatch|gender_mismatch|age_mismatch|category_mismatch|language_mismatch|pet_mismatch|marital_mismatch|barter_not_open)$/;
const KEY_CODE = { engagement: "low_engagement", location: "location_mismatch", gender: "gender_mismatch", age: "age_mismatch", category: "category_mismatch", pet: "pet_mismatch", marital: "marital_mismatch", barter: "barter_not_open" };
const lc1 = (t) => String(t || "").charAt(0).toLowerCase() + String(t || "").slice(1);
/** brief_match → { codes, text } — creator ke liye seedha message */
export function autoReject(m) {
  const bad = ((m && m.criteria) || []).filter((x) => !x.ok);
  if (!bad.length) return { codes: [], text: "" };
  const codes = [
    ...new Set(
      bad
        .map((x) => (x.key === "followers" ? (/^up to/i.test(x.need || "") ? "high_followers" : "low_followers") : KEY_CODE[x.key]))
        .filter(Boolean)
    ),
  ];
  const text = "This campaign needs " + bad.map((x) => `${lc1(x.need)} (${lc1(String(x.have || "").replace(/^Yours?:\s*/i, "yours: "))})`).join("; ");
  return { codes, text };
}
export async function rejectAsk(ask, { title, match, count = 1, campaign, okLabel } = {}) {
  const reasons = await rejectionReasons();
  const auto = count === 1 ? autoReject(match) : { codes: [], text: "" };
  const labelsText = (codes) =>
    codes
      .map((c) => (reasons.find((r) => r.code === c) || {}).label)
      .filter((l) => l && !/^other$/i.test(l))
      .join(", ");
  const first = auto.text || labelsText(auto.codes);
  const v = await ask({
    title: title || "Reject — why don't they fit the brief?",
    text: auto.text ? "Picked from what doesn’t match the brief — check it and send. Edit the message if you like." : count > 1 ? `The same reason and message go to all ${count} creators.` : "Pick a reason — a ready message is written for you.",
    ok: okLabel || (count > 1 ? `Reject ${count} & send` : "Reject & send"),
    danger: true,
    fields: [
      { k: "codes", label: "Reason", chips: reasons.map((r) => ({ ...r, group: BRIEF_CODES.test(r.code) ? "Doesn’t match the brief" : "Other reasons" })), value: auto.codes, required: true },
      { k: "note", label: "Message to the creator", area: true, required: true, value: first, placeholder: "e.g. The brand needs creators based in Jaipur for this campaign." },
    ],
    // reason badlo → message bhi (jab tak team ne khud nahi likha)
    derive: (k, v, prev) => {
      if (k !== "codes") return null;
      const wasAuto = !String(prev.note || "").trim() || prev.note === prev._auto || prev.note === first;
      const nx = auto.text && v.codes.every((c) => auto.codes.includes(c)) && v.codes.length === auto.codes.length ? auto.text : labelsText(v.codes);
      return wasAuto ? { note: nx, _auto: nx } : null;
    },
    preview: (v) => (
      <>
        <b>Creator gets this · email + in the app (🔔)</b>
        Thank you for applying to {campaign || "this campaign"}. You were not selected for this campaign. Reason: {String(v.note || "…").replace(/\.?\s*$/, "")}. Your profile stays active — new campaigns open every week.
      </>
    ),
  });
  if (!v) return null;
  const note = String(v.note || "").trim();
  return { code: (v.codes || [])[0] || "other", codes: v.codes || [], note: /[.!?]$/.test(note) ? note : note + "." };
}

/**
 * Popup jo kuch fields maangta hai aur promise lautata hai (reason, courier, post link…)
 *   const [askEl, ask] = useAsk();  const v = await ask({ title, fields: [{ k, label, type, options, required }] })
 */
export function useAsk() {
  const [st, setSt] = useState(null);
  const ask = (cfg) =>
    new Promise((resolve) => {
      const v = {};
      (cfg.fields || []).forEach((f) => (v[f.k] = f.value ?? ""));
      setSt({ ...cfg, v, err: "", resolve });
    });
  const close = (val) => {
    st?.resolve(val);
    setSt(null);
  };
  const setV = (k, val) =>
    setSt((s) => {
      let v = { ...s.v, [k]: val };
      if (s.derive) v = { ...v, ...(s.derive(k, v, s.v) || {}) };
      return { ...s, v };
    });
  const el = st ? (
    <div className="ga-overlay" onClick={() => close(null)}>
      <form
        className="ga-modal jk"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          const miss = (st.fields || []).find((f) => f.required && (Array.isArray(st.v[f.k]) ? !st.v[f.k].length : !String(st.v[f.k] || "").trim()));
          if (miss) return setSt({ ...st, err: `${miss.label} is required.` });
          close(st.v);
        }}
      >
        <h2 className="ga-h2">{st.title}</h2>
        {st.text && <p className="jk-t">{st.text}</p>}
        {(st.fields || []).map((f) => (
          <div key={f.k} className="jk-f">
            <label className="ga-label" htmlFor={`jk-${f.k}`}>
              {f.label}
            </label>
            {f.chips ? (
              <div className="jk-chips">
                {[...new Set(f.chips.map((c) => c.group || ""))].map((g) => (
                  <div key={g || "x"}>
                    {g && <p className="jk-grp">{g}</p>}
                    <div className="jk-cw">
                      {f.chips
                        .filter((c) => (c.group || "") === g)
                        .map((c) => {
                          const on = (st.v[f.k] || []).includes(c.code);
                          return (
                            <button key={c.code} type="button" className={`jk-chip ${on ? "is-on" : ""}`} onClick={() => setV(f.k, on ? st.v[f.k].filter((x) => x !== c.code) : [...(st.v[f.k] || []), c.code])}>
                              {on ? "✓ " : ""}
                              {c.label}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            ) : f.file ? (
              <>
                <input
                  id={`jk-${f.k}`}
                  className="ga-input"
                  type="file"
                  accept={f.accept || "image/*"}
                  onChange={async (e) => {
                    const file = e.target.files && e.target.files[0];
                    setV(f.k, file || "");
                    if (file && f.onFile) {
                      setV("_note", "⏳ Reading the numbers…");
                      const note = await f.onFile(file, setV);
                      setV("_note", note || "");
                    }
                  }}
                />
                {st.v._note && <p className="jk-t">{st.v._note}</p>}
              </>
            ) : f.options ? (
              <select id={`jk-${f.k}`} className="ga-input" value={st.v[f.k]} onChange={(e) => setV(f.k, e.target.value)}>
                <option value="">Pick…</option>
                {f.options.map((o) => (
                  <option key={o[0]} value={o[0]}>
                    {o[1]}
                  </option>
                ))}
              </select>
            ) : f.area ? (
              <textarea id={`jk-${f.k}`} className="ga-input" rows={3} placeholder={f.placeholder} value={st.v[f.k]} onChange={(e) => setV(f.k, e.target.value)} />
            ) : (
              <input id={`jk-${f.k}`} className="ga-input" type={f.type || "text"} placeholder={f.placeholder} value={st.v[f.k]} onChange={(e) => setV(f.k, e.target.value)} />
            )}
          </div>
        ))}
        {st.preview && <div className="jk-prev">{st.preview(st.v)}</div>}
        {st.err && <p className="jk-err">{st.err}</p>}
        <div className="jk-act">
          <button type="button" className="ga-btn ga-btn--ghost" onClick={() => close(null)}>
            Cancel
          </button>
          <button type="submit" className={`ga-btn ${st.danger ? "ga-btn--danger" : "ga-btn--primary"}`}>
            {st.ok || "Save"}
          </button>
        </div>
        <style>{`
          .jk { padding: 22px; }
          .jk-t { margin-top: 8px; font-size: 13px; line-height: 1.5; color: var(--ad-muted); }
          .jk-f { margin-top: 14px; }
          .jk-err { margin-top: 10px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
          .jk-act { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
          .jk-grp { margin: 8px 0 5px; font-size: 11px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: #9aa2b4; }
          .jk-cw { display: flex; flex-wrap: wrap; gap: 6px; }
          .jk-chip { padding: 6px 11px; border-radius: 999px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 12.5px; color: var(--ad-text); cursor: pointer; }
          .jk-chip.is-on { border-color: #d6453d; background: #fdecec; color: #b42335; font-weight: 700; }
          .jk-prev { margin-top: 14px; padding: 11px 12px; border-radius: 12px; background: var(--ad-soft-2); font-size: 12.5px; line-height: 1.5; color: var(--ad-text); }
          .jk-prev b { display: block; margin-bottom: 4px; font-size: 11px; letter-spacing: .6px; text-transform: uppercase; color: #9aa2b4; }
          .jk .ga-modal, .jk { max-height: 90vh; overflow-y: auto; }
        `}</style>
      </form>
    </div>
  ) : null;
  return [el, ask];
}

/** 📷 Insights screenshot → numbers (purana shotReader — edge function post-shot-read) */
export const SHOT_KEYS = OCR_KEYS;
/** Insights screenshot → numbers into the form. Free OCR in the browser first (no key needed);
 *  the server reader (post-shot-read) only as a backup when OCR found nothing and that reader is switched on. */
export async function readInsightsShot(file, kind, setV) {
  if (file.size > 8 * 1024 * 1024) return "That screenshot is over 8 MB — crop it first.";
  let why = "";
  try {
    const { metrics } = await readInsightsOcr(file, String(kind || "reel").toLowerCase().includes("stor") ? "story" : "reel");
    const ks = Object.keys(metrics);
    ks.forEach((k) => setV(k, String(metrics[k])));
    if (ks.length) return `✓ Read ${ks.length} number${ks.length > 1 ? "s" : ""} off the screenshot — check them below, then save.`;
  } catch (e) {
    why = e.message || "";
  }
  const b64 = await new Promise((r) => {
    const fr = new FileReader();
    fr.onload = () => r(String(fr.result || ""));
    fr.onerror = () => r("");
    fr.readAsDataURL(file);
  });
  const { data, error } = await invoke("admin", "post-shot-read", { image: b64, media_type: kind || "reel" });
  if (data && data.off) return `No numbers found on this screenshot — is it the insights screen? Type them below.${why ? " (" + why + ")" : ""}`;
  if (error || !data || data.error) return "Couldn't read it — type the numbers below. " + ((data && data.error) || "");
  const m = data.metrics || {};
  Object.entries(m).forEach(([k, v]) => SHOT_KEYS.includes(k) && setV(k, String(v)));
  const n = Object.keys(m).length;
  return n ? `✓ Read ${n} number${n > 1 ? "s" : ""} — check them below.${data.note ? " " + data.note : ""}` : data.note || "No numbers found — type them below.";
}
/** Screenshot proof upload — purana uploadProof (campaign-files/<org>/proof/…) */
export async function uploadInsightsProof(file) {
  const sb = sbFor("admin");
  const { data: u } = await sb.auth.getUser();
  const uid = u && u.user && u.user.id;
  const { data: me } = uid ? await sb.from("members").select("org_id").eq("id", uid).maybeSingle() : { data: null };
  if (!me || !me.org_id) throw new Error("Your account has no workspace for uploads — type the numbers instead.");
  const ext = (String(file.type).split("/")[1] || "png").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "png";
  const path = `${me.org_id}/proof/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  // compress → R2 (purana campaign-files bucket sirf fallback)
  try {
    const up = await uploadMedia("admin", "campaign-files", file, { scope: "proof", fallback: { bucket: "campaign-files", path } });
    return up.url;
  } catch (e) {
    throw new Error("Couldn't upload the screenshot: " + e.message);
  }
}

/**
 * Ek row ka action chalao — purane wireBpActions / ucWire / invite buttons jaisa (same RPC + args).
 * ctx = { campaignId, ask, say, reload, router }
 */
export async function runAction(key, row, ctx) {
  const { ask, say, reload, campaignId } = ctx;
  const P = row.pid;
  const who = row.handle || row.name;
  const call = async (fn, args, ok) => {
    const { error } = await rpc("admin", fn, args);
    if (error) {
      say(errText(error));
      return false;
    }
    say(ok || "Done ✓");
    // naya data aane tak button "Saving…" rahe — warna row purani dikhti hai aur lagta hai kuch hua hi nahi
    if (reload) await reload();
    return true;
  };
  const reasonPick = async (title) => {
    const reasons = await rejectionReasons();
    return ask({ title, ok: "Send", fields: [{ k: "code", label: "Reason", options: reasons.map((r) => [r.code, r.label]), required: true }, { k: "note", label: "Message to the creator", area: true, required: true, placeholder: "e.g. The brand needs creators based in Jaipur" }] });
  };
  switch (key) {
    case "step": {
      // app + email purane jaise (team_send_step); WhatsApp ab naye Utility template se — current step ka drip
      if (!window.confirm(`Send “${row.act.label.replace(/^\S+\s*/, "")}” to ${who} now? (WhatsApp + app + email)`)) return;
      await rpc("admin", "api.team_send_step", { p_participation: P, p_key: row.act.msg });
      return sendStepWa(campaignId, [], [P], who, say, reload);
    }
    case "resend":
      return call("api.bulk_resend_invite", { p_invite: row.iid }, `↻ Invite re-sent to ${who}`);
    case "connectig": {
      // purana geek_selected_connect_instagram nahi — naya invite / current step message (Snapto drip)
      if (!window.confirm(`Send ${who} a WhatsApp to finish joining the campaign?`)) return;
      return sendStepWa(campaignId, [row.iid], [], who, say, reload);
    }
    case "bpscreen": {
      // screened + brand ki list — ek click mein. Profile adhoora ho to brand ko nahi bhej sakte (server bhi rokta hai) — saaf bata do
      const ms = matchState(ctx.match);
      if (ms && ms.k === "missing") {
        say(`Can't send ${who} yet — their profile is missing: ${(ms.miss || ms.bad).map((b) => b.need).join(", ")}. They see "Add your…" buttons on the campaign; send them once it's filled.`);
        return false;
      }
      if (ms && ms.k === "no" && !window.confirm(`${who} doesn't match: ${ms.bad.map((b) => b.need).join(", ")}. Send to the brand anyway?`)) return false;
      const { error: e1 } = await rpc("admin", "api.screen_participation", { p_participation: P, p_eligible: true, p_reason: null });
      if (e1) {
        say(errText(e1));
        return false;
      }
      return call("api.advance_participation", { p_participation: P, p_to: "sent_to_brand", p_reason: "screened and added to the brand's list" }, `📋 ${who} screened and sent to the brand`);
    }
    case "bpreject": {
      const v = await rejectAsk(ask, { title: `Reject ${who} — why don't they fit the brief?`, match: ctx.match, campaign: ctx.campaignName });
      if (!v) return;
      return call("api.screen_participation", { p_participation: P, p_eligible: false, p_reason: v.note || v.code }, `${who} marked not a fit`);
    }
    case "bpsend":
      return call("api.advance_participation", { p_participation: P, p_to: "sent_to_brand", p_reason: "added to the brand's list" }, `📋 ${who} added to the brand's list`);
    case "bpbrand": {
      // brand khud Approvals mein approve karta hai — admin yahan se sirf "brand ki taraf se" (brand ko record dikhta hai)
      const v = await ask({
        title: `Approve ${who} on the brand's behalf?`,
        text: "Normally the brand approves this in their Approvals page. Use this only when the brand told you yes (WhatsApp, call, email). The brand will see “Approved by Geek on your behalf”.",
        ok: "Approve for the brand",
        fields: [{ k: "note", label: "How did the brand say yes? (optional)" }],
      });
      if (!v) return;
      const note = String(v.note || "").trim();
      return call("api.brand_decide_participation", { p_participation: P, p_confirm: true, p_reason: `Approved by Geek on the brand's behalf${note ? " · " + note : ""}` }, `✅ ${who} approved on the brand's behalf`);
    }
    case "bpbrandno": {
      const v = await rejectAsk(ask, { title: `The brand passed on ${who} — record it on the brand's behalf and tell the creator why`, match: ctx.match, campaign: ctx.campaignName });
      if (!v) return;
      return call("api.brand_decide_participation", { p_participation: P, p_confirm: false, p_reason: v.note }, "Brand passed — creator told");
    }
    case "bpcontract":
      return call("api.bp_send_contract", { p_participation: P }, `📜 Contract sent to ${who}`);
    case "bpdeliv":
      return call("api.bp_mark_delivered", { p_participation: P }, `📦 Marked delivered — video brief sent to ${who}`);
    case "bpapprove": {
      const v = await ask({
        title: `Approve ${who}’s video on the brand's behalf?`,
        text: "The brand normally watches and approves videos in their Approvals page. Use this only when the brand told you it's OK. The brand will see “Approved by Geek on your behalf”.",
        ok: "Approve for the brand",
        fields: [{ k: "note", label: "How did the brand say OK? (optional)" }],
      });
      if (!v) return;
      const note = String(v.note || "").trim();
      return call("api.bp_review_video", { p_participation: P, p_approve: true, p_reason: `Approved by Geek on the brand's behalf${note ? " · " + note : ""}` }, `✅ ${who}’s video approved on the brand's behalf`);
    }
    case "bpchanges": {
      const v = await ask({ title: "Ask for changes", ok: "Send", fields: [{ k: "reason", label: "What should they change?", area: true, required: true }] });
      if (!v) return;
      return call("api.bp_review_video", { p_participation: P, p_approve: false, p_reason: v.reason.trim() }, "✏️ Changes asked");
    }
    case "bpdone":
      return call("api.bp_mark_done", { p_participation: P }, `🏁 ${who} marked complete`);
    case "bpship": {
      const s = row.x?.shipment || {};
      const v = await ask({
        title: "Courier & tracking",
        ok: "Save — creator gets the tracking",
        fields: [
          { k: "product", label: "Product (optional)", value: s.product || "" },
          { k: "courier", label: "Courier", value: s.courier || "", required: true, placeholder: "e.g. Delhivery" },
          { k: "tracking", label: "Tracking number", value: s.tracking_ref || "" },
          { k: "url", label: "Tracking link (optional)", type: "url", value: s.tracking_url || "" },
        ],
      });
      if (!v) return;
      return call("api.bp_record_courier", { p_participation: P, p_payload: { product: v.product.trim() || null, courier: v.courier.trim(), tracking_ref: v.tracking.trim() || null, tracking_url: v.url.trim() || null } }, "🚚 Courier saved — creator can track it");
    }
    case "bppost": {
      const v = await ask({ title: "Add post / story", ok: "Save", fields: [{ k: "kind", label: "Type", options: [["reel", "Reel"], ["post", "Post"], ["story", "Story"], ["carousel", "Carousel"]], value: "reel", required: true }, { k: "link", label: "Instagram link", type: "url", required: true, placeholder: "https://www.instagram.com/reel/…" }] });
      if (!v) return;
      if (!/instagram\.com\/([^/?#]+\/)?(reel|reels|p|tv|stories)\//i.test(v.link)) return say("Paste an Instagram post link (instagram.com/reel/…, /p/… or /stories/…).");
      return call("api.bp_add_post_link", { p_participation: P, p_payload: { permalink: v.link.trim(), media_type: v.kind, screenshot_url: null, metrics: {} } }, "Post added ✓ — fetching its numbers from Instagram…");
    }
    case "bpunblock": {
      const v = await ask({ title: "Called — unblock", ok: "Unblock", fields: [{ k: "reason", label: "What did they say?", area: true, required: true }, { k: "days", label: "New deadline (days)", type: "number", value: "3", required: true }] });
      if (!v) return;
      return call("api.bp_unblock_after_call", { p_participation: P, p_reason: v.reason.trim(), p_days: +v.days }, "✅ Unblocked");
    }
    case "bpcall": {
      const v = await ask({ title: "Note a call", ok: "Save", fields: [{ k: "note", label: "What happened on the call?", required: true, placeholder: "e.g. no answer, will call back" }] });
      if (!v) return;
      return call("api.bp_log_call", { p_participation: P, p_note: v.note.trim() }, "📝 Call noted");
    }
    case "bprelink": {
      // purana openBpRelink — creator se naya video link maango (app + WhatsApp + email)
      const why = [
        ["private", "The link doesn't open — it's private. Set Google Drive sharing to “Anyone with the link → Viewer”."],
        ["wrong", "The link opens a different / wrong file."],
        ["broken", "The video won't play or is cut off — please re-upload."],
        ["other", "Something else…"],
      ];
      const v = await ask({ title: "Request a new video link", text: "The creator is asked for a fresh link on the app, WhatsApp and email. You can do this as many times as you need.", ok: "Send request", fields: [{ k: "why", label: "What's wrong with the link?", options: why, value: "private", required: true }, { k: "note", label: "Note (optional)", placeholder: "Add details for the creator" }] });
      if (!v) return;
      const base = v.why === "other" ? "" : (why.find((w) => w[0] === v.why) || [, ""])[1];
      const reason = [base, v.note.trim()].filter(Boolean).join(" — ");
      if (!reason) return say("Add a note for the creator.");
      return call("api.bp_request_relink", { p_participation: P, p_reason: reason }, "🔗 New link requested");
    }
    case "bpmetrics": {
      // purana openBpMetrics — post ke numbers haath se (Instagram se na aaye to)
      const posts = row.x?.posts || [];
      if (!posts.length) return runAction("bppost", row, ctx);
      const NUMS = [["views", "Views / plays"], ["reach", "Reach"], ["likes", "Likes"], ["comments", "Comments"], ["shares", "Shares"], ["saves", "Saves"]];
      const fields = [];
      if (posts.length > 1) fields.push({ k: "post", label: "Post", options: posts.map((q) => [q.post_id, `${q.media_type || "post"} · ${fmtDate(q.posted_at)}`]), value: posts[posts.length - 1].post_id, required: true });
      const kindOf = () => (posts[posts.length - 1] || {}).media_type || "reel";
      fields.push({ k: "shot", label: "📷 Insights screenshot (optional) — we read the numbers off it", file: true, onFile: (f, setV) => readInsightsShot(f, kindOf(), setV) });
      NUMS.forEach(([k, l]) => fields.push({ k, label: l, placeholder: "e.g. 12,400 or 12.4k" }));
      const v = await ask({ title: "Add the numbers", text: "Instagram insights load on their own when the creator's account allows it. If not, add their insights screenshot — we read the numbers — or type them.", ok: "Save numbers", fields });
      if (!v) return;
      const pl = {};
      NUMS.forEach(([k]) => {
        const m = String(v[k] || "").replace(/[,\s]/g, "").toLowerCase().match(/^([0-9]+(?:\.[0-9]+)?)(k|m|l)?$/);
        if (m) pl[k] = Math.round(Number(m[1]) * (m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : m[2] === "l" ? 1e5 : 1));
      });
      if (!Object.keys(pl).length) return say("Add at least one number.");
      pl.post_id = v.post || posts[posts.length - 1].post_id;
      if (v.shot && typeof v.shot === "object") {
        try {
          pl.screenshot_url = await uploadInsightsProof(v.shot);
        } catch (e) {
          return say(e.message || String(e));
        }
      }
      return call("api.bp_record_metrics", { p_participation: P, p_payload: pl }, "Numbers saved ✓");
    }
    case "bpreassign": {
      // purana openBpReassign — product kisi aur matching creator ko
      const { data } = await rpc("admin", "api.campaign_matches", { p_campaign: campaignId, p_limit: 40 });
      const list = (Array.isArray(data) ? data : data?.creators || data?.matches || []).filter((c) => c.member_id && c.member_id !== row.x?.member_id);
      if (!list.length) return say("No one else matches this brief yet — invite more creators first.");
      const v = await ask({ title: "Send the product to someone else", ok: "Send to them", fields: [{ k: "member", label: "Next creator", options: list.map((c) => [c.member_id, `@${c.username || c.name || "creator"} · ${fmtNum(c.followers || 0)} followers`]), required: true }, { k: "reason", label: "Why", required: true, placeholder: "Creator went silent / product returned" }] });
      if (!v) return;
      return call("api.reassign_product", { p_participation: P, p_to_member: v.member, p_reason: v.reason.trim() }, "↪ Product moved to the next creator");
    }
    case "bpblack": {
      const v = await ask({ title: `Blocklist ${who}?`, text: "They stay on the list until you lift it. Per the contract they must re-ship the product at their own cost — use “Send product to someone else” to pick who.", ok: "⛔ Blocklist", danger: true, fields: [{ k: "reason", label: "Why?", area: true, required: true }] });
      if (!v) return;
      return call("api.blacklist_creator", { p_participation: P, p_reason: v.reason.trim() }, "⛔ Blocklisted");
    }
    case "bppay":
      if (ctx.router) ctx.router.push(`/vault/campaigns/${campaignId}/payments`);
      return;
    case "bpremove": {
      if (!window.confirm(`Delete ${who} from this campaign? Their contract, courier, video, posts and every message about this campaign go too. This can't be undone.`)) return;
      return row.kind === "p"
        ? call("api.admin_remove_from_campaign", { p_participation: P, p_invite: null }, `${who} deleted from the campaign ✓`)
        : call("api.admin_remove_from_campaign", { p_participation: null, p_invite: row.iid }, `${who} deleted ✓`);
    }
    default:
      return;
  }
}

/**
 * Ek creator ki row (Figma 033/034): avatar, naam, tags, WhatsApp/followers/city, step bar, kiski baari, action button.
 * href diya ho to naam row ko open karta hai.
 */
// row ke links (purane uc-wa / uc-mail / ig-h jaisa)
const rawPhone = (c) => String(c.x?.phone || c.i?.phone || "").replace(/\D/g, "") || "";
const emailOf = (c) => c.x?.email || c.x?.creator?.email || c.i?.email || "";
const igOf = (c) => String(c.handle || "").replace(/^@/, "").trim();

/* ---------- brief match (live api.campaign_brief_match → intel.ci_eligibility) ----------
 * Har applicant ko campaign ki ABHI wali eligibility se check karta hai — brief badla to sab dobara check.
 */
const MISSING_RE = /not in your profile yet|not connected|no city|not yet|not set|not enough recent|no categories/i;
const CRIT_NAME = { gender: "Gender", age: "Birthday", followers: "Instagram", instagram: "Instagram", engagement: "More posts", location: "City", category: "Categories", pet: "Pets", marital: "Marital status", barter: "Barter terms" };
export function matchState(m) {
  if (!m || !Array.isArray(m.criteria) || !m.criteria.length) return null;
  const bad = m.criteria.filter((x) => !x.ok);
  if (!bad.length) return { k: "ok", label: "✓ Matches brief", tone: "green", bad };
  // Apply game: jab tak kuch bhi MISSING hai creator "on hold" hai (steps bhar raha hai) — chahe kuch match na kare.
  // Admin ko chhupa mismatch bhi dikhe ("won't match"), creator ko "not eligible" sirf sab bharne ke baad.
  const miss = bad.filter((x) => MISSING_RE.test(x.have || ""));
  const no = bad.length - miss.length;
  // seedhe naam — admin ko ek nazar mein dikhe kya bacha hai / kya match nahi
  const missNames = [...new Set(miss.map((x) => CRIT_NAME[x.key] || x.need))];
  const noNames = [...new Set(bad.filter((x) => !MISSING_RE.test(x.have || "")).map((x) => CRIT_NAME[x.key] || x.need))];
  if (miss.length) return { k: "missing", label: `⏳ On hold · needs ${missNames.join(", ")}${no ? ` · ✗ ${no} won’t match` : ""}`, tone: "orange", bad, miss, no, missNames, noNames };
  return { k: "no", label: `✗ Not a match · ${noNames.join(", ")}`, tone: "red", bad, miss: [], no: bad.length, missNames: [], noNames };
}
export function MatchDetails({ m }) {
  const s = matchState(m);
  if (!s) return null;
  return (
    <div className="bm-box">
      <p className="bm-h">
        {s.k === "ok" ? "Matches every criterion of the current brief." : s.k === "missing" ? "On hold — the creator is still filling these (marked ?). They are only told “not eligible” once everything is filled; any ✗ below already won’t match." : `Doesn’t match ${s.bad.length} criteri${s.bad.length > 1 ? "a" : "on"} of the current brief.`}
        <small> Checked live against the brief as it is now — editing eligibility re-checks everyone.</small>
      </p>
      <ul>
        {m.criteria.map((x) => (
          <li key={x.key} className={x.ok ? "is-ok" : MISSING_RE.test(x.have || "") ? "is-miss" : "is-no"}>
            <span>{x.ok ? "✓" : MISSING_RE.test(x.have || "") ? "?" : "✗"}</span>
            <b>{x.need}</b>
            <i>{String(x.have || "").replace(/^Your /, "Their ").replace(/^You /, "They ").replace(/your profile/g, "their profile")}</i>
          </li>
        ))}
      </ul>
      <style>{`
        .bm-box { margin-top: 10px; padding: 11px 12px; border-radius: 12px; background: var(--ad-soft-2); font-size: 12.5px; }
        .bm-h { color: var(--ad-ink); font-weight: 700; }
        .bm-h small { display: block; margin-top: 2px; font-weight: 500; color: var(--ad-muted); }
        .bm-box ul { margin: 8px 0 0; padding: 0; list-style: none; display: grid; gap: 5px; }
        .bm-box li { display: grid; grid-template-columns: 18px minmax(120px, 1fr) 1.2fr; gap: 8px; align-items: baseline; }
        .bm-box li span { font-weight: 800; }
        .bm-box li.is-ok span { color: #0b9b6c; } .bm-box li.is-no span { color: #d6453d; } .bm-box li.is-miss span { color: #c27a00; }
        .bm-box li b { font-weight: 600; color: var(--ad-ink); }
        .bm-box li i { font-style: normal; color: var(--ad-muted); }
        .bm-box li.is-no i { color: #c0392b; }
      `}</style>
    </div>
  );
}

/* Creators list ki column headings — CreatorRow ke grid jaise hi */
export function CreatorHead({ withCheck = true }) {
  return (
    <div className={`jr jr--head ${withCheck ? "" : "jr--nocheck"}`} aria-hidden="true">
      {withCheck && <span />}
      <span />
      <span>Creator</span>
      <span>Contact</span>
      <span>Step</span>
      <span>Messages</span>
      <span className="jr-head-act">Action</span>
      <style>{JR_CSS}</style>
    </div>
  );
}

// poora number (admin ke liye — brand side par yeh row hai hi nahi): +91 84476 62572
function fullPhone(c) {
  const r = rawPhone(c);
  if (!r) return c.phone;
  const cc = r.length > 10 ? r.slice(0, r.length - 10) : "";
  const n = r.slice(-10);
  return `${cc ? "+" + cc + " " : ""}${n.slice(0, 5)} ${n.slice(5)}`;
}
function CopyBtn({ text, what }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`jr-copy ${done ? "is-done" : ""}`}
      title={done ? "Copied" : `Copy ${what}`}
      aria-label={`Copy ${what}`}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(String(text || ""));
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
    >
      {done ? "✓" : "⧉"}
    </button>
  );
}

/* campaign ke andar har creator ki taarikhen: contract, parcel kab gaya / pahuncha, video kab aaya, kab post hua */
function journeyDates(c) {
  // har row mein wahi 7 khaane, wahi jagah — jo step abhi nahi hua wo khaali (sab rows ek line mein)
  const x = (c.kind === "p" && c.x) || {};
  const st = x.steps || {};
  const con = x.contract || {};
  const ship = x.shipment || {};
  const sub = x.submission || null;
  const rev = x.review || null;
  const posts = Array.isArray(x.posts) ? x.posts : [];
  const today = new Date().toISOString().slice(0, 10);
  const posted = posts.map((p) => p.posted_at).filter(Boolean).sort()[0] || st.published || st.completed || null;
  const vid = (sub && sub.submitted_at) || st.content_submitted || null;
  const due = x.due_on && !vid && !posted && !["published", "completed"].includes(x.stage) ? x.due_on : null;
  return [
    { k: "sign", icon: "📜", label: "Signed", at: con.signed_at || st.contract_signed || null },
    { k: "addr", icon: "📍", label: "Address", at: x.address_confirmed_at || st.address_confirmed || null },
    { k: "ship", icon: "🚚", label: "Parcel sent", at: ship.shipped_at || st.product_sent || null },
    { k: "deliv", icon: "📦", label: "Delivered", at: ship.delivered_at || null },
    vid
      ? { k: "vid", icon: "🎬", label: sub && sub.rounds > 1 ? `Video ·${sub.rounds}` : "Video", at: vid }
      : due
        ? { k: "vid", icon: "⏳", label: due < today ? "Overdue" : "Video due", at: due, tone: due < today ? "bad" : "" }
        : { k: "vid", icon: "🎬", label: "Video", at: null },
    { k: "ok", icon: "✅", label: "Client OK", at: (rev && rev.decision === "approved" && rev.at) || st.content_approved || null },
    { k: "post", icon: "📲", label: posts.length > 1 ? `Posted ×${posts.length}` : "Posted", at: posted, tone: posted ? "ok" : "" },
  ];
}

export function CreatorRow({ c, href, checked, onCheck, onAction, onReject, onChat, open, busy, stats, match, unread = 0, rating = null }) {
  const [showMatch, setShowMatch] = useState(false);
  const ms = matchState(match);
  const no = c.no ?? 0;
  const atBrand = (c.kind === "p" ? c.x?.stage : c.i?.status) === "sent_to_brand";
  const ig = igOf(c);
  const last = stats && stats.last && stats.last.at ? stats.last : null;
  return (
    <div className={`jr ${open ? "is-open" : ""} ${onCheck ? "" : "jr--nocheck"}`}>
      {onCheck && <input type="checkbox" className="jr-check" checked={!!checked} onChange={onCheck} aria-label={`Select ${c.name}`} />}
      {href ? (
        <Link href={href} className="jr-avlink" aria-label={`Open ${c.name}'s full details`} title="Open full details">
          <IgImg className="jr-av jr-av--img" handle={/^@/.test(c.name) ? c.name : c.handle} src={c.pic} fallback={<span className="jr-av">{initials(c.name.replace(/^@/, ""))[0]}</span>} />
        </Link>
      ) : (
        <IgImg className="jr-av jr-av--img" handle={/^@/.test(c.name) ? c.name : c.handle} src={c.pic} fallback={<span className="jr-av">{initials(c.name.replace(/^@/, ""))[0]}</span>} />
      )}

      {/* 1 · Creator */}
      <div className="jr-col jr-who">
        {href ? (
          <Link href={href} className="jr-name">
            {c.name}
          </Link>
        ) : (
          <b className="jr-name">{c.name}</b>
        )}
        <span className="jr-sub">
          {c.handle && c.handle !== c.name ? `${c.handle} · ` : ""}👥 {c.followers} · 📍 {c.city}
        </span>
        <span className="jr-tags">
          {c.tags.map(([t, tn]) => (
            <span key={t} className={`ga-badge ga-badge--${tn}`}>
              {t}
            </span>
          ))}
          {rating && rating.count > 0 && (
            <span className="ga-badge jr-rate" title={`Average rating from ${rating.count} rating${rating.count > 1 ? "s" : ""} (Geek team + brands, all campaigns)`}>
              ⭐ {rating.avg} <small>({rating.count})</small>
            </span>
          )}
          {ms && (
            <button type="button" className={`ga-badge ga-badge--${ms.tone} jr-match`} onClick={() => setShowMatch((v) => !v)} title="See how they match the brief">
              {ms.label}
            </button>
          )}
        </span>
        {c.dates && (c.dates.invited || c.dates.joined) && (
          <span className="jr-dates">
            {c.dates.invited && <span title={`Invited ${new Date(c.dates.invited).toLocaleString("en-IN")}`}>📩 Invited {fmtDate(c.dates.invited)}</span>}
            {c.dates.reinvited && <span title="Invite sent again">↻ Re-sent {fmtDate(c.dates.reinvited)}</span>}
            {c.dates.joined && <span title={`Joined / applied ${new Date(c.dates.joined).toLocaleString("en-IN")}`}>✅ Joined {fmtDate(c.dates.joined)}</span>}
            {c.dates.moved && c.kind === "p" && <span title="Last step change">🔄 Step {fmtDate(c.dates.moved)}</span>}
          </span>
        )}
      </div>

      {/* 2 · Contact */}
      <div className="jr-col jr-contact">
        {c.phone ? (
          <span className="jr-cpy">
            {rawPhone(c) ? (
              <a className="jr-lnk" href={`https://wa.me/${rawPhone(c)}`} target="_blank" rel="noopener noreferrer" title="Open their WhatsApp">
                🟢 {fullPhone(c)}
              </a>
            ) : (
              <span>🟢 {fullPhone(c)}</span>
            )}
            <CopyBtn text={rawPhone(c) ? "+" + rawPhone(c) : fullPhone(c)} what="number" />
          </span>
        ) : (
          <span className="jr-dim">No WhatsApp</span>
        )}
        {emailOf(c) ? (
          <span className="jr-cpy">
            <a className="jr-lnk jr-ell" href={`mailto:${emailOf(c)}`} title={emailOf(c)}>
              ✉️ {emailOf(c)}
            </a>
            <CopyBtn text={emailOf(c)} what="email" />
          </span>
        ) : (
          <span className="jr-dim">No email</span>
        )}
        {ig ? (
          <a className="jr-lnk" href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" title={`Open @${ig} on Instagram`}>
            📸 @{ig} ↗
          </a>
        ) : (
          <span className="jr-dim">No Instagram</span>
        )}
        {c.payTo !== undefined &&
          (c.payTo && c.payTo.upi ? (
            <span className="jr-cpy" title="Creator's UPI — for paying them">
              <span className="jr-ell">💳 {c.payTo.upi}</span>
              <CopyBtn text={c.payTo.upi} what="UPI ID" />
            </span>
          ) : c.payTo && c.payTo.bank ? (
            <span className="jr-ell" title="Creator's bank account (full details on Payments)">🏦 {c.payTo.bank}</span>
          ) : (
            <span className="jr-dim">No UPI yet</span>
          ))}
      </div>

      {/* 3 · Step (13 steps, same names everywhere) */}
      <div className="jr-col jr-stepcol">
        <span className="jr-stepname">
          {no ? <b>Step {no}/{FLOW_TOTAL}</b> : <b>—</b>} · {c.stepNote}
        </span>
        <span className="jr-dots" aria-hidden="true">
          {Array.from({ length: FLOW_TOTAL }, (_, i) => (
            <i key={i} className={i < no ? "on" : ""} />
          ))}
        </span>
        <span className="jr-turn" title={c.turn}>
          {c.turn}
        </span>
      </div>

      {/* 4 · Messages */}
      <div className="jr-col jr-msgs">
        {stats ? (
          <>
            <span>
              🟢 {stats.wa || 0} · ✉️ {stats.em || 0} · 🔔 {stats.rem || 0}
            </span>
            {last ? (
              <span className="jr-dim" title="Last message">
                🕒 {new Date(last.at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} · {last.channel === "email" ? "email" : "WhatsApp"}
                {last.status ? ` · ${last.status === "read" ? "read ✓✓" : last.status === "delivered" ? "delivered ✓✓" : last.status === "failed" ? "not delivered ✗" : last.status}` : ""}
                {last.by ? ` · ${last.by === "team" ? "by the team" : last.by === "creator" ? "from the creator" : "automatic"}` : ""}
              </span>
            ) : (
              <span className="jr-dim">No message yet</span>
            )}
          </>
        ) : (
          <span className="jr-dim">—</span>
        )}
      </div>

      {/* 5 · Action (fixed width, always on the right) */}
      <div className="jr-act">
        {/* brand ke paas hai → pehle saaf dikhe "Sent to brand", approve sirf chhota sa option (brand ki taraf se) */}
        {atBrand && (
          <span className="jr-state" title="The brand approves in their Approvals page">
            📤 Sent to brand <small>· waiting for the brand</small>
          </span>
        )}
        {c.act && (
          <button type="button" className={`ga-btn ${atBrand ? "ga-btn--ghost jr-btn--soft" : "ga-btn--primary"} jr-btn`} onClick={onAction} disabled={busy} title={atBrand ? "Approve on the brand's behalf (asks for a note first)" : undefined}>
            {busy ? "Saving…" : c.action}
          </button>
        )}
        <span className="jr-act2">
          {ms && (
            <button type="button" className={`ga-btn ga-btn--ghost jr-mini ${showMatch ? "is-on" : ""}`} onClick={() => setShowMatch((v) => !v)} title="Check every criterion before you approve">
              🔍 Match
            </button>
          )}
          {onReject && (
            <button type="button" className="ga-btn ga-btn--ghost jr-mini jr-rej" onClick={onReject} disabled={busy} title="Reject — they stay in the campaign under Rejected">
              ✗ Reject
            </button>
          )}
          <button type="button" className={`jr-chat ${unread > 0 ? "has-new" : ""}`} onClick={onChat} aria-label={unread > 0 ? `Chat with ${c.name} — ${unread} new repl${unread === 1 ? "y" : "ies"}` : `Chat with ${c.name}`} title={unread > 0 ? `${unread} new repl${unread === 1 ? "y" : "ies"} — open the chat` : "Chat"}>
            💬
            {unread > 0 && <span className="jr-badge">{unread > 9 ? "9+" : unread}</span>}
          </button>
          {href ? (
            <Link href={href} className="jr-more" aria-label={`Open ${c.name}`}>
              Open ›
            </Link>
          ) : null}
        </span>
      </div>

      {/* campaign ki taarikhen — poori row ki chaudai mein ek patli timeline (creator column lamba na ho) */}
      <div className="jr-jdates" aria-label="Campaign dates">
        {journeyDates(c).map((d) => (
          <span key={d.k} className={`jr-jd ${d.at ? "" : "is-empty"} ${d.tone ? `is-${d.tone}` : ""}`} title={d.at ? `${d.label} ${new Date(d.at).toLocaleString("en-IN")}` : `${d.label} — not yet`}>
            <span className="jr-jd__l">
              {d.icon} {d.label}
            </span>
            <b className="jr-jd__d">{d.at ? fmtDate(d.at) : "—"}</b>
          </span>
        ))}
      </div>
      {ms && showMatch && (
        <div className="jr-matchrow">
          <MatchDetails m={match} />
        </div>
      )}
      <style>{JR_CSS}</style>
    </div>
  );
}

const JR_CSS = `
  .jr-rate { background: #fff6dc; color: #8a5d14; font-weight: 700; }
  .jr-rate small { font-weight: 600; opacity: .75; }
  .jr { display: grid; grid-template-columns: 18px 40px minmax(170px, 1.25fr) minmax(170px, 1.05fr) minmax(210px, 1.35fr) minmax(150px, .95fr) 236px; column-gap: 14px; row-gap: 8px; align-items: center; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--ad-line); background: #fff; transition: border-color .15s; }
  .jr.jr--nocheck { grid-template-columns: 40px minmax(170px, 1.25fr) minmax(170px, 1.05fr) minmax(210px, 1.35fr) minmax(150px, .95fr) 236px; }
  .jr:hover { border-color: #cfd2ee; }
  .jr--head { padding: 4px 14px; border: 0; background: transparent; font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--ad-muted); }
  .jr--head:hover { border-color: transparent; }
  .jr-head-act { text-align: right; }
  .jr-check { accent-color: var(--ad-primary); }
  .jr-av { width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; background: var(--ad-soft); font-size: 19px; color: var(--ad-ink); }
  .jr-av--img { object-fit: cover; }
  .jr-col { min-width: 0; display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--ad-ink); }
  .jr-name { font-size: 14px; font-weight: 700; color: var(--ad-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  a.jr-name:hover { color: var(--ad-primary); }
  .jr-sub { color: #8791a7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .jr-tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .jr-dates { display: flex; flex-wrap: wrap; gap: 4px 8px; margin-top: 6px; font-size: 11.5px; color: var(--ad-muted); }
  .jr-dates span { white-space: nowrap; }
  .jr > .jr-jdates { grid-column: 3 / -1; }
  .jr.jr--nocheck > .jr-jdates { grid-column: 2 / -1; }
  .jr-jdates { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; margin-top: -2px; padding-top: 8px; border-top: 1px dashed #e7e9f2; }
  .jr-jd { display: flex; flex-direction: column; gap: 1px; min-width: 0; padding: 5px 8px; border-radius: 8px; background: #f3f4fa; }
  .jr-jd__l { font-size: 10px; font-weight: 700; color: #6b7391; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .jr-jd__d { font-size: 11.5px; font-weight: 800; color: #1d2440; white-space: nowrap; }
  .jr-jd.is-empty { background: transparent; border: 1px dashed #e3e6f0; }
  .jr-jd.is-empty .jr-jd__l { color: #b3b9cc; }
  .jr-jd.is-empty .jr-jd__d { color: #c9cedd; font-weight: 600; }
  .jr-jd.is-ok { background: #e7f8ef; } .jr-jd.is-ok .jr-jd__l, .jr-jd.is-ok .jr-jd__d { color: #0b7a52; }
  .jr-jd.is-bad { background: #fdecea; } .jr-jd.is-bad .jr-jd__l, .jr-jd.is-bad .jr-jd__d { color: #b42318; }
  .jr-tags .ga-badge { height: 20px; padding: 0 8px; font-size: 10.5px; }
  .jr-match { border: 0; cursor: pointer; font: inherit; font-size: 10.5px; font-weight: 700; }
  /* lamba "On hold · needs …" badge apne column mein hi wrap ho — email column par na chadhe */
  .jr-tags .jr-match { height: auto; min-height: 20px; max-width: 100%; padding: 3px 8px; line-height: 1.35; white-space: normal; text-align: left; overflow-wrap: anywhere; }
  .jr-lnk { color: inherit; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .jr-lnk:hover { color: var(--ad-primary); text-decoration: underline; }
  .jr-dim { color: #9aa3b8; }
  .jr-stepname { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .jr-dots { display: grid; grid-template-columns: repeat(13, 1fr); gap: 3px; max-width: 220px; }
  .jr-dots i { height: 5px; border-radius: 3px; background: #eceef6; }
  .jr-dots i.on { background: var(--ad-primary); }
  .jr-turn { color: #8791a7; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .jr-msgs span { overflow: hidden; text-overflow: ellipsis; }
  .jr-act { display: flex; flex-direction: column; align-items: stretch; gap: 6px; }
  .jr-btn { height: 38px; padding: 0 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .jr-act2 { display: flex; justify-content: flex-end; gap: 6px; }
  .jr-mini { height: 32px; padding: 0 10px; font-size: 12px; }
  .jr-avlink { display: inline-flex; border-radius: 50%; }
  .jr-avlink:hover { box-shadow: 0 0 0 2px var(--ad-primary); }
  .jr-cpy { display: inline-flex; align-items: center; gap: 4px; min-width: 0; }
  .jr-copy { flex-shrink: 0; width: 22px; height: 22px; display: grid; place-items: center; border-radius: 6px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 12px; line-height: 1; color: var(--ad-muted); cursor: pointer; }
  .jr-copy:hover { border-color: var(--ad-primary); color: var(--ad-primary); }
  .jr-copy.is-done { border-color: #22a06b; color: #22a06b; }
  .jr-state { height: 38px; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 0 12px; border-radius: 10px; background: #eeebff; color: #4b3fc4; font-size: 13.5px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .jr-state small { font-size: 11.5px; font-weight: 600; color: #6d63d6; }
  .jr-btn--soft { height: 32px; font-size: 12.5px; border-color: var(--ad-line-2); color: var(--ad-primary-ink); }
  .jr-mini.is-on { border-color: var(--ad-primary); color: var(--ad-primary); }
  .jr-rej { color: #d6453d; }
  .jr-rej:hover { border-color: #d6453d; }
  .jr-chat { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 9px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 15px; color: var(--ad-primary-ink); }
  .jr-chat:hover { border-color: var(--ad-primary); }
  .jr-chat { position: relative; }
  .jr-chat.has-new { border-color: #e5484d; }
  .jr-badge { position: absolute; top: -7px; right: -7px; min-width: 18px; height: 18px; padding: 0 5px; display: grid; place-items: center; border-radius: 999px; background: #e5484d; color: #fff; font-size: 10.5px; font-weight: 800; line-height: 1; box-shadow: 0 0 0 2px #fff; }
  .jr-more { display: inline-flex; align-items: center; height: 32px; padding: 0 11px; border-radius: 9px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 12.5px; font-weight: 800; color: #6657e9; white-space: nowrap; }
  .jr-more:hover { border-color: var(--ad-primary); background: var(--ad-soft-2); }
  .jr-matchrow { grid-column: 1 / -1; }
  @media (max-width: 1279px) {
    .jr, .jr.jr--nocheck { grid-template-columns: 18px 40px minmax(0, 1fr) minmax(0, 1fr); }
    .jr.jr--nocheck { grid-template-columns: 40px minmax(0, 1fr) minmax(0, 1fr); }
    .jr-stepcol, .jr-msgs { grid-column: span 1; }
    .jr > .jr-stepcol { grid-column: 3 / span 1; }
    .jr > .jr-msgs { grid-column: 4 / span 1; }
    .jr.jr--nocheck > .jr-stepcol { grid-column: 2 / span 1; }
    .jr.jr--nocheck > .jr-msgs { grid-column: 3 / span 1; }
    .jr-act { grid-column: 1 / -1; flex-direction: row; justify-content: flex-end; }
    .jr--head { display: none; }
  }
  @media (max-width: 640px) {
    .jr, .jr.jr--nocheck { grid-template-columns: 18px 36px minmax(0, 1fr); padding: 12px; }
    .jr.jr--nocheck { grid-template-columns: 36px minmax(0, 1fr); }
    .jr > .jr-col, .jr > .jr-stepcol, .jr > .jr-msgs { grid-column: 1 / -1; }
    .jr > .jr-who { grid-column: auto; }
    .jr-act { flex-direction: column; }
    .jr-av { width: 32px; height: 32px; font-size: 15px; }
    .jr > .jr-jdates, .jr.jr--nocheck > .jr-jdates { grid-column: 1 / -1; }
    .jr-jdates { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
  }
`;
