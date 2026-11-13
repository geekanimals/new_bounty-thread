"use client";

/**
 * Campaign creators — Supabase se (purane app ka "campaign page": barter_tracker + campaign_people).
 * Har creator ki row, uski next step, kiski baari (turn) aur action button — purane bpNext / ucStepMsg jaisa.
 */
import { useState } from "react";
import Link from "next/link";
import { rpc, invoke, errText } from "@/lib/supabase";
import { BP_FAIL, effIndex, stepLabel, inviteStepRank, INVITE_STEPS, fmtNum, fmtDate, maskPhone, initials } from "@/components/admin/campaign/live";

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
  const noShip = kind === "paid";
  const chat = ["bpchat", "💬 Message on WhatsApp"];
  if (BP_FAIL.includes(x.stage)) return { turn: "off", title: `Out of the campaign — ${String(x.stage).replace(/_/g, " ")}`, text: x.reason || "", acts: [] };
  if (x.blocked_at) return { turn: "you", tone: "bad", title: "Blocked — no video after delivery", text: `Call ${x.phone || "them"}, note what they said and unblock with a new date.`, acts: [["bpunblock", "✅ Called — unblock", 1], ["bpcall", "📝 Note a call"], chat] };
  switch (x.stage) {
    case "invited":
    case "shortlisted":
      return { turn: "creator", title: "Invited — waiting for them to accept", text: "They got the invite on WhatsApp + email.", acts: [chat] };
    case "applied":
      return { turn: "you", title: "Screen this creator", text: "Do they fit the brief?", acts: [["bpscreen", "✓ Meets the brief", 1], ["bpreject", "Not a fit"]] };
    case "eligible":
      return { turn: "you", title: "Add them to the brand's list", text: "They cleared screening.", acts: [["bpsend", "📋 Add to the brand's list", 1]] };
    case "sent_to_brand":
      return { turn: "brand", title: "Waiting for the brand", text: "Record what the brand said.", acts: [["bpbrand", "✅ Brand confirmed", 1], ["bpbrandno", "Brand passed"]] };
    case "brand_confirmed":
    case "accepted":
      return ["paid", "barter_paid"].includes(kind)
        ? { turn: "you", title: "Set their fee — the contract goes out with it", text: "Open 💰 Payments, set this creator's fee & terms; the contract is sent automatically.", acts: [["bppay", "💰 Set fee", 1]] }
        : { turn: "you", title: "Send the contract", text: "Usually goes out on its own — send it now if it hasn't.", acts: [["bpcontract", "📜 Send contract now", 1]] };
    case "contract_sent":
      return { turn: "creator", title: "Stuck: contract not signed", text: "They need to open the app and sign.", acts: [chat, ["bpcontract", "🔁 Resend contract"]] };
    case "contract_signed":
      return noShip
        ? { turn: "creator", title: "Video brief going out", text: "Nothing to ship on a paid campaign — the brief goes out on its own.", acts: [chat] }
        : { turn: "creator", title: "Stuck: delivery address", text: "They need to confirm where to ship.", acts: [chat] };
    case "address_confirmed":
      return { turn: "you", title: "Ship the product", text: "Book the courier and add the tracking.", acts: [["bpship", "🚚 Add courier & tracking", 1]] };
    case "product_sent":
      if (ship.status === "delivered") return { turn: "creator", title: "Making the video", text: x.due_on ? `Due ${fmtDate(x.due_on)}.` : "", acts: [chat, ["bppost", "🔗 Add post / story"]] };
      if (ship.status === "shipped") return { turn: "you", title: "In transit — mark delivered when it arrives", text: ship.shipped_at ? `Sent ${fmtDate(ship.shipped_at)}.` : "", acts: [["bpdeliv", "📦 Mark delivered", 1], ["bpship", "✎ Edit courier"]] };
      return { turn: "you", title: "Add the courier & tracking", text: "", acts: [["bpship", "🚚 Add courier & tracking", 1]] };
    case "content_created":
      return { turn: "creator", tone: overdue ? "bad" : "", title: overdue ? "Stuck: video overdue" : "Making the video", text: x.due_on ? `${overdue ? "Was due" : "Due"} ${fmtDate(x.due_on)} · ${x.reminders_sent || 0} reminder${x.reminders_sent == 1 ? "" : "s"} sent` : "", acts: [chat, ["bppost", "🔗 Add post / story"]] };
    case "changes_requested":
      return { turn: "creator", title: "Fixing the video", text: "Waiting for the new cut.", acts: [chat] };
    case "content_submitted":
      return { turn: "you", title: "Review the video", text: "Approve it or ask for changes.", acts: [["bpapprove", "✅ Approve video", 1], ["bpchanges", "✏️ Ask for changes"]], video: x.submission && x.submission.url };
    case "content_approved":
      return { turn: "creator", title: "Stuck: not posted yet", text: "Approved — waiting for them to post.", acts: [chat, ["bppost", "🔗 Add post / story", 1]] };
    case "published":
      return g.all_done
        ? { turn: "you", title: "Every post is up", text: "Mark the campaign complete for them.", acts: [["bpdone", "🏁 Mark complete", 1]] }
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
      return kind === "paid" ? null : ["confirm_address", "🔔 Remind: confirm address"];
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
      tags: [[x.from_bulk ? "via upload" : "applied", "violet"], [x.ig_connected === false ? "On Geek · connect Instagram" : "On Geek", "orange"]],
      phone: maskPhone(x.phone),
      followersN: Number(cr.followers) || 0,
      followers: cr.followers != null ? fmtNum(cr.followers) : "—",
      city: cr.city || "—",
      step,
      stepNote: BP_FAIL.includes(x.stage) ? stepLabel(x.stage) : JOURNEY_STEPS[step],
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
    };
  });
  const invs = (people?.invites || []).map((i) => {
    const st = i.status === "invited" ? "registered" : i.status || "registered";
    const miss = i.needs || [];
    const reg = !!i.registered;
    const step = !reg ? 0 : miss.length || !i.ig_connected ? (i.ig_connected ? 2 : 1) : INV_STEP[st] ?? 3;
    const posted = st === "posted";
    const nx = posted ? { turn: "done", title: "Done ✓" } : !reg ? { turn: "creator", title: "Not registered" } : miss.length || !i.ig_connected ? { turn: "creator", title: "Instagram not connected" } : { turn: "creator", title: "Joining the campaign…" };
    const days = ageDays(i.created_at);
    const act = !reg ? { key: "resend", label: "↻ Resend invite" } : (miss.length || !i.ig_connected) && i.phone ? { key: "connectig", label: "📸 Connect Instagram" } : posted ? null : { key: "resend", label: "↻ Resend invite" };
    return {
      id: "i-" + i.invite_id,
      kind: "i",
      iid: i.invite_id,
      i,
      nx,
      name: i.name || (i.handle ? "@" + i.handle : i.phone || i.email || "Creator"),
      handle: i.handle ? "@" + i.handle : "",
      pic: null,
      tags: [[`via ${i.source && i.source !== "upload" ? i.source : "upload"} · ${fmtDate(i.created_at)}`, "violet"], [reg ? (i.ig_connected ? "On Geek" : "On Geek · connect Instagram") : "Not yet on Geek", reg ? "orange" : ""]],
      phone: maskPhone(i.phone),
      followersN: Number(i.followers) || 0,
      followers: i.followers != null ? fmtNum(i.followers) : "—",
      city: i.city || "—",
      step,
      stepNote: !reg ? `Sheet: ${invLabel(st)} · joins once registered` : step <= 2 ? `${JOURNEY_STEPS[step]} · sheet: ${invLabel(st)}` : invLabel(st),
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
  const base = (t && t.app_url) || "https://www.bountythreads.geekcreativeagency.com";
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
  _reasons = Array.isArray(data) && data.length ? data : [{ code: "other", label: "Other" }];
  return _reasons;
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
  const setV = (k, val) => setSt((s) => ({ ...s, v: { ...s.v, [k]: val } }));
  const el = st ? (
    <div className="ad-overlay" onClick={() => close(null)}>
      <form
        className="ad-modal jk"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          const miss = (st.fields || []).find((f) => f.required && !String(st.v[f.k] || "").trim());
          if (miss) return setSt({ ...st, err: `${miss.label} is required.` });
          close(st.v);
        }}
      >
        <h2 className="ad-h2">{st.title}</h2>
        {st.text && <p className="jk-t">{st.text}</p>}
        {(st.fields || []).map((f) => (
          <div key={f.k} className="jk-f">
            <label className="ad-label" htmlFor={`jk-${f.k}`}>
              {f.label}
            </label>
            {f.options ? (
              <select id={`jk-${f.k}`} className="ad-input" value={st.v[f.k]} onChange={(e) => setV(f.k, e.target.value)}>
                <option value="">Pick…</option>
                {f.options.map((o) => (
                  <option key={o[0]} value={o[0]}>
                    {o[1]}
                  </option>
                ))}
              </select>
            ) : f.area ? (
              <textarea id={`jk-${f.k}`} className="ad-input" rows={3} placeholder={f.placeholder} value={st.v[f.k]} onChange={(e) => setV(f.k, e.target.value)} />
            ) : (
              <input id={`jk-${f.k}`} className="ad-input" type={f.type || "text"} placeholder={f.placeholder} value={st.v[f.k]} onChange={(e) => setV(f.k, e.target.value)} />
            )}
          </div>
        ))}
        {st.err && <p className="jk-err">{st.err}</p>}
        <div className="jk-act">
          <button type="button" className="ad-btn ad-btn--ghost" onClick={() => close(null)}>
            Cancel
          </button>
          <button type="submit" className={`ad-btn ${st.danger ? "ad-btn--danger" : "ad-btn--primary"}`}>
            {st.ok || "Save"}
          </button>
        </div>
        <style>{`
          .jk { padding: 22px; }
          .jk-t { margin-top: 8px; font-size: 13px; line-height: 1.5; color: var(--ad-muted); }
          .jk-f { margin-top: 14px; }
          .jk-err { margin-top: 10px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
          .jk-act { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        `}</style>
      </form>
    </div>
  ) : null;
  return [el, ask];
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
    if (reload) reload();
    return true;
  };
  const reasonPick = async (title) => {
    const reasons = await rejectionReasons();
    return ask({ title, ok: "Send", fields: [{ k: "code", label: "Reason", options: reasons.map((r) => [r.code, r.label]), required: true }, { k: "note", label: "Message to the creator", area: true, required: true, placeholder: "e.g. The brand needs creators based in Jaipur" }] });
  };
  switch (key) {
    case "step": {
      if (!window.confirm(`Send “${row.act.label.replace(/^\S+\s*/, "")}” to ${who} now? (WhatsApp + app + email)`)) return;
      return call("api.team_send_step", { p_participation: P, p_key: row.act.msg }, `✓ Sent to ${who}`);
    }
    case "resend":
      return call("api.bulk_resend_invite", { p_invite: row.iid }, `↻ Invite re-sent to ${who}`);
    case "connectig": {
      const r = await sendWhatsApp({ campaignId, keys: ["i:" + row.iid], template: "geek_selected_connect_instagram" });
      if (!r.cancelled) say(r.msg);
      if (reload) reload();
      return;
    }
    case "bpscreen":
      return call("api.screen_participation", { p_participation: P, p_eligible: true, p_reason: null }, `✓ ${who} meets the brief`);
    case "bpreject": {
      const v = await reasonPick("Why doesn't this creator fit the brief?");
      if (!v) return;
      return call("api.screen_participation", { p_participation: P, p_eligible: false, p_reason: v.note || v.code }, `${who} marked not a fit`);
    }
    case "bpsend":
      return call("api.advance_participation", { p_participation: P, p_to: "sent_to_brand", p_reason: "added to the brand's list" }, `📋 ${who} added to the brand's list`);
    case "bpbrand":
      return call("api.brand_decide_participation", { p_participation: P, p_confirm: true, p_reason: null }, `✅ Brand confirmed ${who}`);
    case "bpbrandno": {
      const v = await reasonPick("The brand passed — tell the creator why");
      if (!v) return;
      return call("api.brand_decide_participation", { p_participation: P, p_confirm: false, p_reason: v.note }, "Brand passed — creator told");
    }
    case "bpcontract":
      return call("api.bp_send_contract", { p_participation: P }, `📜 Contract sent to ${who}`);
    case "bpdeliv":
      return call("api.bp_mark_delivered", { p_participation: P }, `📦 Marked delivered — video brief sent to ${who}`);
    case "bpapprove":
      return call("api.bp_review_video", { p_participation: P, p_approve: true, p_reason: null }, `✅ ${who}’s video approved`);
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
    case "bppay":
      if (ctx.router) ctx.router.push(`/admin/campaigns/${campaignId}/payments`);
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
export function CreatorRow({ c, href, checked, onCheck, onAction, onChat, open, busy }) {
  const pct = Math.max(4, Math.round((c.step / 12) * 100));
  return (
    <div className={`jr ${open ? "is-open" : ""}`}>
      {onCheck && <input type="checkbox" className="jr-check" checked={!!checked} onChange={onCheck} aria-label={`Select ${c.name}`} />}
      {c.pic ? <img className="jr-av jr-av--img" src={c.pic} alt="" referrerPolicy="no-referrer" /> : <span className="jr-av">{initials(c.name.replace(/^@/, ""))[0]}</span>}
      <div className="jr-main">
        <p className="jr-top">
          {href ? (
            <Link href={href} className="jr-name">
              {c.name}
            </Link>
          ) : (
            <b className="jr-name">{c.name}</b>
          )}
          {c.handle && c.handle !== c.name && <span className="jr-handle">{c.handle}</span>}
          {c.tags.map(([t, tn]) => (
            <span key={t} className={`ad-badge ad-badge--${tn}`}>
              {t}
            </span>
          ))}
        </p>
        <p className="jr-meta">
          {c.phone ? (
            <>
              🟢 WhatsApp {c.phone} <span className="ad-badge ad-badge--green">ON</span> ·{" "}
            </>
          ) : (
            "No WhatsApp · "
          )}
          👥 {c.followers} followers · 📍 {c.city}
        </p>
        <div className="jr-step">
          <span className="ad-bar">
            <i style={{ width: c.step ? `${pct}%` : 0 }} />
          </span>
          <span>
            Step {c.step}/12 · {c.stepNote}
          </span>
        </div>
        <p className="jr-turn">{c.turn}</p>
      </div>
      <div className="jr-act">
        {c.act && (
          <button type="button" className="ad-btn ad-btn--primary jr-btn" onClick={onAction} disabled={busy}>
            {busy ? "…" : c.action}
          </button>
        )}
        <button type="button" className="jr-chat" onClick={onChat} aria-label={`Chat with ${c.name}`}>
          💬
        </button>
        {href ? (
          <Link href={href} className="jr-more" aria-label="Open creator">
            ▾
          </Link>
        ) : (
          <span className="jr-more">▾</span>
        )}
      </div>
      <style>{`
        .jr { display: flex; align-items: flex-start; gap: 14px; padding: 13px 14px 14px 13px; border-radius: 14px; border: 1px solid var(--ad-line); background: #fff; transition: border-color .15s; }
        .jr:hover { border-color: #cfd2ee; }
        .jr-check { margin-top: 12px; accent-color: var(--ad-primary); }
        .jr-av { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; background: var(--ad-soft); font-size: 19px; color: var(--ad-ink); }
        .jr-av--img { object-fit: cover; }
        .jr-main { flex: 1; min-width: 0; padding-top: 2px; }
        .jr-top { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
        .jr-name { font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        a.jr-name:hover { color: var(--ad-primary); }
        .jr-handle { margin-right: 2px; font-size: 12px; font-weight: 700; color: var(--ad-muted); }
        .jr-meta { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-top: 8px; font-size: 12px; color: #8791a7; }
        .jr-meta .ad-badge { height: 22px; padding: 0 9px; }
        .jr-step { display: flex; align-items: center; gap: 10px; margin-top: 8px; font-size: 12px; color: var(--ad-ink); }
        .jr-step .ad-bar { width: 160px; height: 6px; flex-shrink: 0; background: #eceef6; }
        .jr-turn { margin-top: 8px; font-size: 12px; line-height: 1.35; color: #8791a7; }
        .jr-act { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .jr-btn { height: 41px; padding: 0 15px; }
        .jr-chat { width: 46px; height: 39px; border-radius: 10px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 12px; color: var(--ad-primary-ink); }
        .jr-chat:hover { border-color: var(--ad-primary); }
        .jr-more { width: 26px; text-align: center; font-size: 12px; font-weight: 800; color: #6657e9; }
        @media (max-width: 1023px) {
          .jr { flex-wrap: wrap; }
          .jr-act { width: 100%; padding-left: 52px; }
          .jr-btn { flex: 1; }
        }
        @media (max-width: 640px) {
          .jr { gap: 10px; padding: 12px; }
          .jr-av { width: 32px; height: 32px; font-size: 15px; }
          .jr-act { padding-left: 0; }
          .jr-step { flex-direction: column; align-items: flex-start; gap: 6px; }
        }
      `}</style>
    </div>
  );
}
