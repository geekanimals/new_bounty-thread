"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { useCampaign, useToast } from "@/components/admin/campaign/live";
import { CreatorRow, CreatorHead, buildRows, runAction, useAsk, sendWhatsApp, rejectAsk, matchState, autoReject } from "@/components/admin/campaign/journey";
import { downloadFile, loadScript, XLSX_SRC, sheetPhone } from "@/components/admin/campaign2/kit";
import { downloadSheetRows, tickedKey } from "@/components/admin/campaign2/UploadStart";
import WaPanel from "@/components/admin/campaign/WaPanel";

/* Journey boxes — tap karo to list filter hoti hai (count asli rows se) */
const BOXES = [
  { t: "all", l: "Total", s: "everyone · rejected not counted", f: (c) => !c.failed },
  { t: "reach", l: "Invited", s: "not registered", f: (c) => !c.failed && (!c.registered) },
  { t: "reach", l: "Registered", s: "on Geek OS", f: (c) => !c.failed && (c.registered) },
  { t: "reach", l: "No Instagram", s: "signed up, not linked", f: (c) => !c.failed && (c.registered && !c.ig) },
  { t: "reach", l: "Instagram", s: "media kit connected", f: (c) => !c.failed && (c.ig) },
  { t: "screen", l: "Applied", s: "screening", f: (c) => !c.failed && (c.applied && c.registered && !c.failed && c.x?.stage !== "sent_to_brand") },
  { t: "screen", l: "Sent to brand", s: "waiting for the brand", f: (c) => !c.failed && (c.x?.stage === "sent_to_brand") },
  { t: "bad", l: "Rejected", s: "not a fit / brand passed", f: (c) => c.failed },
  { t: "screen", l: "Approved", s: "brand said yes", f: (c) => !c.failed && (c.approved) },
  { t: "ship", l: "Contract signed", f: (c) => !c.failed && ((c.sheet ?? c.step) >= 5) },
  { t: "ship", l: "Address confirmed", s: "brief sent", f: (c) => !c.failed && ((c.sheet ?? c.step) >= 6) },
  { t: "ship", l: "Courier sent", f: (c) => !c.failed && ((c.sheet ?? c.step) >= 7) },
  { t: "ship", l: "Courier delivered", f: (c) => !c.failed && ((c.sheet ?? c.step) >= 9) },
  { t: "content", l: "Video submitted", f: (c) => !c.failed && ((c.sheet ?? c.step) >= 11) },
  { t: "content", l: "No video yet", s: "got product", f: (c) => !c.failed && ((c.sheet ?? c.step) >= 9 && (c.sheet ?? c.step) < 11) },
  { t: "content", l: "Client approved", f: (c) => !c.failed && ((c.sheet ?? c.step) >= 11 && (c.kind === "i" ? ["client_approved", "posted"].includes(c.i?.status) : ["content_approved", "published", "completed"].includes(c.x?.stage))) },
  { t: "good", l: "Posted", s: "every post up", f: (c) => !c.failed && (c.posted) },
];
/* Har campaign type ke apne boxes: Paid mein courier nahi · Physical visit mein Visit booked → Visited */
const SHIP_L = ["Address confirmed", "Courier sent", "Courier delivered"];
function boxesFor(kind, V) {
  if (kind !== "paid" && kind !== "visit") return BOXES;
  const vOf = (c) => (V && ((c.pid && V.p[c.pid]) || (c.iid && V.i[c.iid]))) || null;
  const out = [];
  BOXES.forEach((b) => {
    if (SHIP_L.includes(b.l)) {
      if (kind === "visit" && b.l === "Address confirmed") {
        out.push({ t: "ship", l: "Visit booked", s: "date + slot set", f: (c) => !c.failed && !!(vOf(c) && vOf(c).visit_on) });
        out.push({ t: "ship", l: "Visited", s: "came to the place", f: (c) => !c.failed && !!(vOf(c) && vOf(c).visited_at) });
        out.push({ t: "bad", l: "Missed visit", s: "needs a new date", f: (c) => !c.failed && !!(vOf(c) && vOf(c).missed_at) });
      }
      return;
    }
    if (b.l === "No video yet")
      out.push(kind === "visit" ? { ...b, s: "visited, no video", f: (c) => !c.failed && !!(vOf(c) && vOf(c).visited_at) && (c.sheet ?? c.step) < 11 } : { ...b, s: "brief sent" });
    else out.push(b);
  });
  return out;
}

/* Figma: Campaign workspace — Creators (journey + rows) — barter_tracker + campaign_people */
export default function WorkspaceCreators() {
  const { id } = useParams();
  const router = useRouter();
  const c = { id };
  const { c: camp } = useCampaign(id);
  const on = !!id && id !== "sample";
  const bt = useRpc("admin", "api.barter_tracker", { p_campaign: id }, { skip: !on, refreshMs: 300000 });
  const people = useRpc("admin", "api.campaign_people", { p_campaign: id }, { skip: !on, refreshMs: 300000 });
  const prog = useRpc("admin", "api.campaign_deliverable_progress", { p_campaign: id }, { skip: !on });
  // har creator ke WhatsApp / email / reminder ginti + aakhri message (purana ucStatsLoad)
  const mstats = useRpc("admin", "api.campaign_msg_stats", { p_campaign: id }, { skip: !on });
  // naye creator replies (Snapto webhook → wa_messages) — har minute taaza; chat kholte hi sab ke liye "read"
  const unread = useRpc("admin", "api.campaign_unread", { p_campaign: id }, { skip: !on, refreshMs: 60000 });
  const bmatch = useRpc("admin", "api.campaign_brief_match", { p_campaign: id }, { skip: !on, refreshMs: 300000 });
  // sheet upload / profile / contact — email, city, followers jo tracker mein nahi aate
  const extras = useRpc("admin", "api.campaign_creator_extras", { p_campaign: id }, { skip: !on, refreshMs: 300000 });
  const kind = camp?.campaign_type || "barter";
  // Physical visit: har creator ki booking (date + slot) aur visited / missed
  const visits = useRpc("admin", "api.visit_list", { p_campaign: id }, { skip: !on || kind !== "visit" });
  const V = useMemo(() => {
    const m = { i: {}, p: {} };
    (Array.isArray(visits.data) ? visits.data : []).forEach((v) => {
      if (v.invite_id) m.i[v.invite_id] = v;
      if (v.participation_id) m.p[v.participation_id] = v;
    });
    return m;
  }, [visits.data]);
  const BX = useMemo(() => boxesFor(kind, V), [kind, V]);
  // Payment wale campaign (Paid / Barter + Paid / paid visit) — har creator ka UPI (ya bank) contact mein, copy ke saath
  const payCamp = kind === "paid" || kind === "barter_paid" || (kind === "visit" && ((camp?.contract_terms || {}).visit || {}).mode !== "experience");
  const pays = useRpc("admin", "api.campaign_payments", { p_campaign: id }, { skip: !on || !payCamp, refreshMs: 300000 });
  const staged = useRpc("admin", "api.payment_stage_list", { p_campaign: id }, { skip: !on || !payCamp, refreshMs: 300000 });
  const PAY = useMemo(() => {
    const m = { p: {}, h: {}, ph: {} };
    const pick = (upi, last4, ifsc) => (upi ? { upi } : last4 ? { bank: `A/c ••${last4}${ifsc ? " · " + ifsc : ""}` } : null);
    (Array.isArray(staged.data) ? staged.data : []).forEach((r) => {
      const v = pick(r.upi, r.account_last4, r.ifsc);
      if (!v) return;
      if (r.handle) m.h[String(r.handle).replace(/^@/, "").toLowerCase()] = v;
      const d = String(r.phone || "").replace(/\D/g, "").slice(-10);
      if (d.length === 10) m.ph[d] = v;
    });
    (Array.isArray(pays.data) ? pays.data : []).forEach((r) => {
      const p = r.payment || {};
      const v = p.method === "upi" ? pick(p.upi_id) : p.method === "bank" ? pick(null, p.account_last4, p.ifsc) : null;
      if (v && r.participation_id) m.p[r.participation_id] = v;
    });
    return m;
  }, [pays.data, staged.data]);
  const [box, setBox] = useState(0);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("Sort: furthest step");
  const [who, setWho] = useState("Everyone");
  const [size, setSize] = useState("Any size");
  const [posted, setPosted] = useState("Posted or not");
  const [fit, setFit] = useState("Brief match: all");
  // taarikh se filter: kis taarikh par (invite / join / step) + kab
  const [dBy, setDBy] = useState("Date: invited");
  const [dWhen, setDWhen] = useState("Any time");
  const [dFrom, setDFrom] = useState("");
  const [dTo, setDTo] = useState("");
  const [sel, setSel] = useState([]);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useToast(3200);
  const [askEl, ask] = useAsk();

  // button tab tak "Saving…" jab tak list ka naya data (step) aa na jaaye; baaki numbers peeche se
  const reload = () => {
    prog.reload(true);
    mstats.reload(true);
    extras.reload(true);
    unread.reload(true);
    return Promise.all([bt.reload(true), people.reload(true)]);
  };
  const all = useMemo(() => {
    const ex = extras.data || {};
    return buildRows({ tracker: bt.data, people: people.data, progress: prog.data || {}, kind: camp?.campaign_type || "barter" }).map((r) => {
      const e = r.pid && ex[r.pid];
      if (!e) return r;
      const fol = r.followersN || Number(e.followers) || 0;
      return {
        ...r,
        x: { ...r.x, email: r.x?.email || e.email, phone: r.x?.phone || e.phone },
        city: r.city && r.city !== "—" ? r.city : e.city || "—",
        followersN: fol,
        followers: r.followersN ? r.followers : e.followers != null ? Number(e.followers).toLocaleString("en-IN") + (e.followers_from === "sheet" ? " (sheet)" : "") : r.followers,
        handle: r.handle || (e.handle ? "@" + String(e.handle).replace(/^@/, "") : ""),
      };
    }).map((r) => {
      if (!payCamp) return r;
      const h = String(r.handle || "").replace(/^@/, "").toLowerCase();
      const d = String(r.phone || r.x?.phone || r.i?.phone || "").replace(/\D/g, "").slice(-10);
      return { ...r, payTo: (r.pid && PAY.p[r.pid]) || (h && PAY.h[h]) || (d.length === 10 && PAY.ph[d]) || null };
    });
  }, [bt.data, people.data, prog.data, camp, extras.data, payCamp, PAY]);
  const U = useMemo(() => unread.data || {}, [unread.data]);
  const counts = BX.map((b) => all.filter((c) => b.f(c, U)).length);

  const rows = useMemo(() => {
    let r = all.filter((c) => (BX[box] || BX[0]).f(c, U)).filter((x) => `${x.name} ${x.handle} ${x.phone} ${x.city} ${x.x?.phone || x.i?.phone || ""}`.toLowerCase().includes(q.trim().toLowerCase()));
    if (who === "Creator’s turn") r = r.filter((x) => x.turnWho === "creator");
    if (who === "Our turn") r = r.filter((x) => x.turnWho === "you");
    if (who === "On Geek OS") r = r.filter((x) => x.registered);
    if (who === "Not yet on Geek") r = r.filter((x) => !x.registered);
    if (size === "Nano · under 10K" || size === "Under 10k") r = r.filter((x) => x.followersN < 10000);
    if (size === "Micro · 10K–50K" || size === "10k – 50k") r = r.filter((x) => x.followersN >= 10000 && x.followersN < 50000);
    if (size === "Mid · 50K–200K") r = r.filter((x) => x.followersN >= 50000 && x.followersN < 200000);
    if (size === "Macro · 200K+") r = r.filter((x) => x.followersN >= 200000);
    if (posted === "Posted") r = r.filter((x) => x.posted);
    if (posted === "Not posted") r = r.filter((x) => !x.posted);
    // screening: brief se match (api.campaign_brief_match — abhi ki eligibility se, live)
    if (fit !== "Brief match: all") {
      const k = { "✓ Matches the brief": "ok", "✗ Doesn’t match": "no", "? Info missing in profile": "missing" }[fit];
      r = r.filter((x) => {
        const ms = x.pid ? matchState((bmatch.data || {})[x.pid]) : null;
        return fit === "Not checked (not on Geek OS / past screening)" ? !ms : ms && ms.k === k;
      });
    }
    if (dWhen !== "Any time") {
      const key = { "Date: invited": "invited", "Date: joined": "joined", "Date: last step": "moved" }[dBy] || "invited";
      const day = 864e5;
      const today0 = new Date(new Date().toDateString()).getTime();
      const [lo, hi] =
        dWhen === "Today" ? [today0, today0 + day]
        : dWhen === "Yesterday" ? [today0 - day, today0]
        : dWhen === "Last 7 days" ? [today0 - 6 * day, today0 + day]
        : dWhen === "Last 30 days" ? [today0 - 29 * day, today0 + day]
        : [dFrom ? new Date(dFrom + "T00:00:00").getTime() : -Infinity, dTo ? new Date(dTo + "T00:00:00").getTime() + day : Infinity];
      r = r.filter((x) => {
        const v = x.dates && x.dates[key] ? new Date(x.dates[key]).getTime() : NaN;
        return !isNaN(v) && v >= lo && v < hi;
      });
    }
    r = [...r];
    const tOf = (x, k) => (x.dates && x.dates[k] ? new Date(x.dates[k]).getTime() : 0);
    if (sort === "Newest invited") r.sort((a, b) => tOf(b, "invited") - tOf(a, "invited"));
    if (sort === "Oldest invited") r.sort((a, b) => (tOf(a, "invited") || Infinity) - (tOf(b, "invited") || Infinity));
    if (sort === "Newest joined") r.sort((a, b) => tOf(b, "joined") - tOf(a, "joined"));
    if (sort === "Latest step change") r.sort((a, b) => tOf(b, "moved") - tOf(a, "moved"));
    const views = (x) => (x.x?.posts || []).reduce((t, p) => t + (+(p.stats?.views || p.stats?.plays || p.stats?.reach) || 0), 0);
    if (sort === "Sort: furthest step") r.sort((a, b) => b.step - a.step || b.sortStep - a.sortStep);
    if (sort === "Sort: earliest step") r.sort((a, b) => a.step - b.step || a.sortStep - b.sortStep);
    if (sort === "Sort: name" || sort === "Name A → Z") r.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "Sort: followers" || sort === "Followers: high → low") r.sort((a, b) => b.followersN - a.followersN);
    if (sort === "Followers: low → high") r.sort((a, b) => a.followersN - b.followersN);
    if (sort === "Most views") r.sort((a, b) => views(b) - views(a));
    return r;
  }, [all, box, q, sort, who, size, posted, fit, bmatch.data, U, BX, dBy, dWhen, dFrom, dTo]);

  // ek jagah filters: kya koi filter laga hai + sab saaf karo
  const sentIdx = BX.findIndex((b) => b.l === "Sent to brand");
  const fActive = !!q.trim() || box !== 0 || who !== "Everyone" || size !== "Any size" || posted !== "Posted or not" || fit !== "Brief match: all" || dWhen !== "Any time";
  const clearFilters = () => {
    setQ("");
    setBox(0);
    setWho("Everyone");
    setSize("Any size");
    setPosted("Posted or not");
    setFit("Brief match: all");
    setDWhen("Any time");
    setDFrom("");
    setDTo("");
  };
  // screening chips: kitne match / nahi / info missing (Applied wale)
  const fitN = useMemo(() => {
    const m = { ok: 0, no: 0, missing: 0 };
    all.forEach((x) => {
      const ms = x.pid && x.applied && !x.failed && x.x?.stage !== "sent_to_brand" ? matchState((bmatch.data || {})[x.pid]) : null;
      if (ms) m[ms.k]++;
    });
    return m;
  }, [all, bmatch.data]);

  // ⬇ list jaisi filter hai waisi hi — Excel / CSV
  const sheetRows = () => {
    const head = ["Name", "Instagram", "WhatsApp", "Email", "City", "Followers", "Step", "Brief match", "What doesn't match / missing", "Next"];
    return [
      head,
      ...rows.map((x) => {
        const m = x.pid ? (bmatch.data || {})[x.pid] : null;
        const ms = matchState(m);
        return [x.name, x.handle, sheetPhone(x.x?.phone || x.i?.phone || ""), x.x?.email || x.x?.creator?.email || x.i?.email || "", x.city === "—" ? "" : x.city, x.followersN || "", `${x.no ? `${x.no}/13 · ` : ""}${x.stepNote || ""}`, ms ? ms.label.replace(/^\S+\s/, "") : "Not checked", ms && ms.k !== "ok" ? autoReject(m).text.replace(/^This campaign needs /, "") : "", x.next || ""];
      }),
    ];
  };
  const fname = (ext) => `${(camp?.name || "campaign").replace(/[^\w]+/g, "-")}-${(BX[box] || BX[0]).l.toLowerCase().replace(/\s+/g, "-")}${fit !== "Brief match: all" ? "-" + fit.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() : ""}.${ext}`;
  const dlCsv = () => (rows.length ? (downloadFile(fname("csv"), sheetRows()), setToast(`⬇ ${rows.length} creators — CSV`)) : setToast("Nothing in this view"));
  const dlXlsx = async () => {
    if (!rows.length) return setToast("Nothing in this view");
    setBusy("xlsx");
    try {
      await loadScript(XLSX_SRC);
      const X = window.XLSX;
      const ws = X.utils.aoa_to_sheet(sheetRows());
      ws["!cols"] = [22, 20, 16, 24, 14, 10, 22, 16, 50, 26].map((w) => ({ wch: w }));
      const wb = X.utils.book_new();
      X.utils.book_append_sheet(wb, ws, "Creators");
      X.writeFile(wb, fname("xlsx"));
      setToast(`⬇ ${rows.length} creators — Excel`);
    } catch (e) {
      setToast(e.message);
    }
    setBusy("");
  };

  // 📤 Send to brand — super admin jinhe chune wahi brand ko dikhte hain (applied → meets brief → brand's list)
  const sendable = sel.map((rid) => all.find((x) => x.id === rid)).filter((x) => x && x.kind === "p" && ["applied", "eligible"].includes(x.x?.stage));
  const sendToBrand = async () => {
    if (!sendable.length) return setToast("Tick creators who are on Applied first.");
    const notFit = sendable.filter((x) => (matchState((bmatch.data || {})[x.pid]) || {}).k === "no").length;
    const v = await ask({
      title: `Send ${sendable.length} creator${sendable.length > 1 ? "s" : ""} to the brand?`,
      text: `They move to the brand's list — the brand sees only the creators you send (plus how many applied in total) and can approve only these.${notFit ? ` ⚠️ ${notFit} of them don't match the brief.` : ""}`,
      ok: `📤 Send ${sendable.length} to the brand`,
      fields: [],
    });
    if (!v) return;
    setBusy("brand");
    let ok = 0;
    const bad = [];
    for (const x of sendable) {
      if (x.x.stage === "applied") {
        const a = await rpc("admin", "api.screen_participation", { p_participation: x.pid, p_eligible: true, p_reason: null });
        if (a.error) {
          bad.push(`${x.handle || x.name}: ${errText(a.error)}`);
          continue;
        }
      }
      const b = await rpc("admin", "api.advance_participation", { p_participation: x.pid, p_to: "sent_to_brand", p_reason: "added to the brand's list" });
      if (b.error) bad.push(`${x.handle || x.name}: ${errText(b.error)}`);
      else ok++;
    }
    setBusy("");
    setToast(`📤 ${ok} sent to the brand${bad.length ? ` · ${bad.length} not sent — ${bad[0]}` : ""}`);
    setSel([]);
    reload();
    bmatch.reload(true);
  };

  const allIds = rows.map((r) => r.id);
  const allOn = allIds.length > 0 && allIds.every((x) => sel.includes(x));
  const toggle = (cid) => setSel((s) => (s.includes(cid) ? s.filter((x) => x !== cid) : [...s, cid]));
  const keyOf = (rid) => (rid[0] === "p" ? "p:" : "i:") + rid.slice(2);
  const ctx = { campaignId: id, ask, say: setToast, reload, router };

  // tick kiye creators Bulk sheet ke "Only the ticked" ke liye bhi yaad rahein
  useEffect(() => {
    try {
      sessionStorage.setItem(tickedKey(id), JSON.stringify(sel));
    } catch {}
  }, [sel, id]);

  // ⚡ jinka kaam hamari taraf baaki hai (purana "N need you — do it now")
  const needN = all.filter((x) => x.turnWho === "you" && !x.failed).length;

  // got the product, never posted, and the campaign is over or their video is overdue (purana ccNoPost)
  const today = new Date().toISOString().slice(0, 10);
  const ended = (camp?.end_date && camp.end_date < today) || ["completed", "ended", "closed"].includes(String(camp?.status || "").toLowerCase());
  const noPost = all.filter(
    (r) =>
      r.kind === "p" &&
      !r.x.blacklisted &&
      !(r.x.posts || []).length &&
      (["content_created", "changes_requested", "content_submitted", "content_approved"].includes(r.x.stage) || (r.x.stage === "product_sent" && r.x.shipment?.status === "delivered")) &&
      (ended || (r.x.due_on && r.x.due_on < today))
  );
  const blockNoPost = async () => {
    const names = noPost.map((r) => r.handle || r.name).join(", ");
    const v = await ask({
      title: `⛔ Blocklist ${noPost.length} creator${noPost.length > 1 ? "s" : ""} who didn't post?`,
      text: `${names}. They got the product but never posted. They stay blocked until you lift it, and per the contract must re-ship the product.`,
      ok: "⛔ Blocklist them",
      danger: true,
      fields: [{ k: "reason", label: "Reason", value: "Received the product, did not post — campaign over", required: true }],
    });
    if (!v) return;
    setBusy("block");
    let ok = 0;
    const bad = [];
    for (const r of noPost) {
      const { error } = await rpc("admin", "api.blacklist_creator", { p_participation: r.pid, p_reason: v.reason.trim() });
      if (error) bad.push(`${r.handle || r.name}: ${errText(error)}`);
      else ok++;
    }
    setBusy("");
    setToast(`⛔ ${ok} creator(s) blocklisted${bad.length ? ` · ${bad.length} failed — ${bad[0]}` : ""}`);
    reload();
  };
  const dlSelected = async () => {
    setBusy("dl");
    try {
      const n = await downloadSheetRows(id, sel, camp?.campaign_type || "barter");
      setToast(n ? `⬇ ${n} creator${n !== 1 ? "s" : ""} downloaded — same columns as the bulk upload, edit and upload it again` : "None of the selected creators could be exported.");
    } catch (e) {
      setToast(errText(e));
    }
    setBusy("");
  };

  // ✗ Reject — Applied / eligible: "not a fit" (reason creator ko jaata hai) · brand ki list par: "brand passed"
  const reject = async (x) => {
    setBusy(x.id);
    await runAction(x.x.stage === "sent_to_brand" ? "bpbrandno" : "bpreject", x, { ...ctx, match: (bmatch.data || {})[x.pid], campaignName: camp?.name });
    setBusy("");
  };
  const act = async (x) => {
    if (!x.act) return;
    setBusy(x.id);
    try {
      await runAction(x.act.key, x, { ...ctx, match: (bmatch.data || {})[x.pid], campaignName: camp?.name });
    } catch (e) {
      setToast(e?.message || String(e));
    } finally {
      setBusy("");
    }
  };

  /* 💬 WhatsApp to selected — har creator ko uske ABHI ke step ka naya Utility message (Snapto drip, api.snapto_send_current_step).
     Purane geek_* templates yahan se nahi jaate. Apna likha message (24 ghante wali window) waisa hi. */
  // 💬 WhatsApp to selected — purane ccWaPanel jaisa panel (step preview + 24h window), WaPanel.jsx
  const [waOpen, setWaOpen] = useState(false);
  const waSelected = () => setWaOpen((o) => !o);

  const declinable = sel.map((rid) => all.find((x) => x.id === rid)).filter((x) => x && x.kind === "p" && ["applied", "eligible"].includes(x.x.stage));
  const declineSel = async () => {
    if (!declinable.length) return setToast("Tick creators who are on Applied first.");
    const v = await rejectAsk(ask, { title: `Reject ${declinable.length} creator${declinable.length > 1 ? "s" : ""} — why don't they fit the brief?`, count: declinable.length, campaign: camp?.name });
    if (!v) return;
    setBusy("decl");
    let ok = 0;
    const bad = [];
    for (const x of declinable) {
      const { error } = await rpc("admin", "api.screen_participation", { p_participation: x.pid, p_eligible: false, p_reason: v.note || v.code });
      if (error) bad.push(`${x.handle || x.name}: ${errText(error)}`);
      else ok++;
    }
    setBusy("");
    setToast(`✓ ${ok} declined — the message went to each of them${bad.length ? ` · ${bad.length} couldn't be declined (${bad[0]})` : ""}`);
    setSel([]);
    reload();
  };

  /* ↻ Resend invite to not-registered (bulk_resend_invite har invite par) */
  const notReg = all.filter((x) => x.kind === "i" && !x.registered);
  const resendAll = async () => {
    if (!notReg.length) return setToast("Everyone has registered — nobody to re-invite.");
    if (!window.confirm(`Resend the invite to ${notReg.length} creator${notReg.length > 1 ? "s" : ""} who haven’t registered yet?`)) return;
    setBusy("re");
    let ok = 0;
    let last = null;
    for (const x of notReg) {
      const { error } = await rpc("admin", "api.bulk_resend_invite", { p_invite: x.iid });
      if (error) last = error;
      else ok++;
    }
    setBusy("");
    setToast(last ? `${ok} re-sent · ${errText(last)}` : `↻ Invite re-sent to ${ok} not-registered creator${ok > 1 ? "s" : ""}`);
    reload();
  };

  const loading = bt.loading || people.loading;
  const err = bt.error || people.error;
  // load fail hua aur dikhane ko kuch nahi → 0 nahi, "–" (galat lagta hai ki creators gayab ho gaye)
  const n = (i) => (loading ? "…" : err && !all.length ? "–" : counts[i]);

  return (
    <AdminShell>
      <WorkspaceHead id={id} campaign={camp} />

      <section className="ga-card wcr-card">
        <div className="wcr-head">
          <div>
            <h2 className="ga-h2">Creator journey</h2>
            <p className="wcr-sub">Every creator by the step they are on — tap a box to filter.</p>
            {/* ek list load nahi hui (DB slow) to ginti adhoori hoti hai — chupchaap galat number mat dikhao */}
            {err && all.length > 0 && (
              <p className="wcr-warn">
                ⚠ Part of the list did not load (the database was slow), so these counts may be short.{" "}
                <button type="button" className="wcr-txt" onClick={reload}>
                  Retry
                </button>
              </p>
            )}
          </div>
          <div className="wcr-head__act">
            <Link href={`/vault/campaigns/${c.id}/upload`} className="wcr-link">
              📄 Bulk sheet
            </Link>
            <Link href={`/vault/campaigns/${c.id}/find`} className="ga-btn ga-btn--primary wcr-find">
              🎯 Find matching creators
            </Link>
          </div>
        </div>
        <div className="wcr-boxes">
          {BX.map((b, i) => (
            <button key={b.l} type="button" className={`wcr-box wcr-box--${b.t || "all"} ${box === i ? "is-on" : ""} ${counts[i] ? "" : "is-zero"}`} onClick={() => setBox(i)} aria-pressed={box === i} title={b.s ? `${b.l} — ${b.s}` : b.l}>
              <span className="wcr-box__l">
                <i aria-hidden="true" />
                {b.l}
              </span>
              <strong>{n(i)}</strong>
            </button>
          ))}
        </div>
      </section>

      {kind === "visit" && (
        <p className="wcr-visitlink">
          📍 Dates, slots and Visited / Missed are on <Link href={`/vault/campaigns/${id}/fulfilment`}>Fulfilment › Visits</Link>
        </p>
      )}

      <section className="ga-card wcr-card wcr-list">
        <h2 className="ga-h2">Creators · {box === 0 ? n(0) : `${n(box)} ${(BX[box] || BX[0]).l.toLowerCase()}`}</h2>
        <p className="wcr-sub">Tap a creator to open every step, chat and action.</p>

        {/* Saare filter, sort aur screening ek hi jagah */}
        <div className="wcr-fpanel">
          <div className="wcr-filters">
            <input className="ga-input wcr-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, @handle, phone, city…" aria-label="Search creators" />
            {[
              [sort, setSort, ["Sort: furthest step", "Sort: earliest step", "Newest invited", "Oldest invited", "Newest joined", "Latest step change", "Followers: high → low", "Followers: low → high", "Name A → Z", "Most views"], "Sort"],
              [who, setWho, ["Everyone", "Our turn", "Creator’s turn", "On Geek OS", "Not yet on Geek"], "Who"],
              [size, setSize, ["Any size", "Nano · under 10K", "Micro · 10K–50K", "Mid · 50K–200K", "Macro · 200K+"], "Follower size"],
              [posted, setPosted, ["Posted or not", "Posted", "Not posted"], "Posted"],
              [fit, setFit, ["Brief match: all", "✓ Matches the brief", "✗ Doesn’t match", "? Info missing in profile", "Not checked (not on Geek OS / past screening)"], "Brief match"],
              [dBy, setDBy, ["Date: invited", "Date: joined", "Date: last step"], "Which date"],
              [dWhen, setDWhen, ["Any time", "Today", "Yesterday", "Last 7 days", "Last 30 days", "Pick dates…"], "When"],
            ].map(([v, set, opts, label]) => (
              <select key={label} className="ga-input wcr-sel" value={v} onChange={(e) => set(e.target.value)} aria-label={label}>
                {opts.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ))}
            {dWhen === "Pick dates…" && (
              <span className="wcr-dates">
                <input type="date" className="ga-input" value={dFrom} onChange={(e) => setDFrom(e.target.value)} aria-label="From date" />
                <span>to</span>
                <input type="date" className="ga-input" value={dTo} onChange={(e) => setDTo(e.target.value)} aria-label="To date" />
              </span>
            )}
            {fActive && (
              <button type="button" className="wcr-txt wcr-clear" onClick={clearFilters}>
                ✕ Clear filters
              </button>
            )}
          </div>
          <div className="wcr-screen">
            <span className="wcr-screen__l">Screening:</span>
            {[
              ["✓ Matches the brief", fitN.ok, "ok"],
              ["✗ Doesn’t match", fitN.no, "no"],
              ["? Info missing in profile", fitN.missing, "missing"],
            ].map(([l, c, k]) => (
              <button
                key={k}
                type="button"
                className={`wcr-fit wcr-fit--${k} ${fit === l ? "is-on" : ""}`}
                onClick={() => {
                  setFit(fit === l ? "Brief match: all" : l);
                  if (fit !== l) setBox(BX.findIndex((b) => b.l === "Applied"));
                }}
              >
                {l} · {c}
              </button>
            ))}
            {sentIdx >= 0 && (
              <button type="button" className={`wcr-fit wcr-fit--sent ${box === sentIdx ? "is-on" : ""}`} onClick={() => setBox(box === sentIdx ? 0 : sentIdx)}>
                📤 Sent to brand · {counts[sentIdx]}
              </button>
            )}
            {needN > 0 && (
              <button type="button" className={`wcr-need ${who === "Our turn" ? "is-on" : ""}`} onClick={() => setWho(who === "Our turn" ? "Everyone" : "Our turn")}>
                {who === "Our turn" ? "✕ Show everyone" : `⚡ ${needN} need${needN > 1 ? "" : "s"} you — do it now`}
              </button>
            )}
            <button type="button" className="wcr-fit" onClick={() => (setBox(3), setSel(all.filter((x) => !x.failed && x.registered && !x.ig).map((x) => x.id)))}>
              📸 Pick everyone without Instagram
            </button>
            <span className="wcr-screen__sp" />
            <span className="wcr-count">Showing {rows.length}</span>
          </div>
        </div>

        <div className="wcr-bulk">
          <label className="wcr-all">
            <input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? [] : allIds)} />
            <span className="wcr-allbox" aria-hidden="true" />
            Select all ({rows.length})
          </label>
          <button type="button" className="ga-btn ga-btn--ghost wcr-wa" disabled={busy === "wa"} onClick={waSelected} title="Tick creators — or open it and pick who replied in the last 24 hours">
            {busy === "wa" ? "Sending…" : `💬 WhatsApp to selected (${sel.length})`}
          </button>
          <button type="button" className="ga-btn ga-btn--primary wcr-brand" disabled={!sendable.length || busy === "brand"} onClick={sendToBrand} title="Only the creators you send here are shown to the brand">
            {busy === "brand" ? "Sending…" : `📤 Send to brand (${sendable.length})`}
          </button>
          <button type="button" className="wcr-txt" disabled={!declinable.length || busy === "decl"} onClick={declineSel}>
            ✖ Decline selected ({declinable.length})
          </button>
          <button type="button" className="wcr-txt" disabled={!notReg.length || busy === "re"} onClick={resendAll}>
            {busy === "re" ? "Sending…" : `↻ Resend invite to not-registered (${notReg.length})`}
          </button>
          {sel.length > 0 && (
            <>
              <button type="button" className="wcr-txt" disabled={busy === "dl"} onClick={dlSelected} title="Same columns as the bulk upload — edit and upload it again">
                {busy === "dl" ? "Downloading…" : `⬇ Download selected (${sel.length})`}
              </button>
              <button type="button" className="wcr-txt" onClick={() => setSel([])}>
                Clear
              </button>
            </>
          )}
          <span className="wcr-screen__sp" />
          {noPost.length > 0 && (
            <button type="button" className="wcr-block" disabled={busy === "block"} onClick={blockNoPost} title="Got the product but never posted">
              {busy === "block" ? "Blocking…" : `⛔ Blocklist who didn't post (${noPost.length})`}
            </button>
          )}
          <button type="button" className="wcr-txt" disabled={busy === "xlsx"} onClick={dlXlsx} title="Exactly the list below, as it is filtered">
            {busy === "xlsx" ? "Preparing…" : `⬇ Excel (${rows.length})`}
          </button>
          <button type="button" className="wcr-txt" onClick={dlCsv} title="Exactly the list below, as it is filtered">
            ⬇ CSV ({rows.length})
          </button>
          <Link href={`/vault/campaigns/${c.id}/upload`} className="wcr-txt" title="Paste a Google Sheet link — new creators are added, the ones already here are skipped">
            📄 Add from a sheet link
          </Link>
        </div>
        {waOpen && (
          <WaPanel
            campaignId={id}
            keys={sel.map(keyOf)}
            visible={rows.map((r) => keyOf(r.id))}
            setSel={setSel}
            onClose={() => setWaOpen(false)}
            say={setToast}
            onDone={(sent) => {
              if (sent) {
                setSel([]);
                setWaOpen(false);
              }
              reload();
            }}
          />
        )}

        <div className="wcr-rows">
          {rows.length > 0 && <CreatorHead />}
          {rows.map((x) => (
            <CreatorRow
              key={x.id}
              c={x}
              href={`/vault/campaigns/${c.id}/creators/${x.id}`}
              checked={sel.includes(x.id)}
              onCheck={() => toggle(x.id)}
              onAction={() => act(x)}
              onReject={x.kind === "p" && ["applied", "eligible", "sent_to_brand"].includes(x.x?.stage) ? () => reject(x) : null}
              busy={busy === x.id}
              onChat={() => router.push(`/vault/campaigns/${c.id}/creators/${x.id}`)}
              stats={(mstats.data || {})[keyOf(x.id)]}
              unread={(U[keyOf(x.id)] || {}).n || 0}
              match={x.pid ? (bmatch.data || {})[x.pid] : null}
            />
          ))}
          {!rows.length && (
            <p className="wcr-empty">
              {err && !all.length ? (
                <>
                  Couldn’t load the creators (the database was slow) — {errText(err)}{" "}
                  <button type="button" className="wcr-txt" onClick={reload}>
                    Retry
                  </button>
                </>
              ) : loading ? (
                "Loading creators…"
              ) : all.length ? (
                "No creators on this step right now."
              ) : (
                "No creators in this campaign yet — add them from Bulk sheet or Find matching creators."
              )}
            </p>
          )}
        </div>
      </section>
      {askEl}
      {toast && <div className="ga-toast">{toast}</div>}

      <style>{`
        .wcr-dates { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .wcr-dates input { width: auto; min-width: 140px; }
        .wcr-dates span { font-size: 12.5px; color: var(--ad-muted); }
        /* Figma: select par arrow nahi */
        select.ga-input { appearance: none; -webkit-appearance: none; }
        .wcr-card { padding: 22px 22px 22px; }
        .wcr-list { margin-top: 20px; padding-bottom: 30px; }
        .wcr-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .wcr-screen { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-top: 12px; padding: 10px 12px; border-radius: 12px; background: var(--ad-soft-2); }
        .wcr-screen__l { font-size: 12px; font-weight: 700; color: var(--ad-muted); }
        .wcr-screen__sp { flex: 1; }
        .wcr-fit { height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 12.5px; font-weight: 700; cursor: pointer; }
        .wcr-fit--ok { color: #0b9b6c; } .wcr-fit--no { color: #d6453d; } .wcr-fit--missing { color: #b46b00; }
        .wcr-fit.is-on { border-color: currentColor; box-shadow: 0 0 0 2px rgba(103,87,245,.12); background: #fff; }
        .wcr-brand { height: 38px; padding: 0 14px; font-size: 13px; }
        .wcr-chips:empty { display: none; }
        .wcr-need { height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid #f3c27a; background: #fff6e6; font-size: 13px; font-weight: 800; color: #a15c00; cursor: pointer; }
        .wcr-need.is-on { background: var(--ad-primary); border-color: var(--ad-primary); color: #fff; }
        .wcr-block { height: 36px; padding: 0 14px; border-radius: 10px; border: 0; background: #dc2626; font-size: 13px; font-weight: 800; color: #fff; cursor: pointer; }
        .wcr-block:disabled { opacity: .6; }
        .wcr-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .wcr-sub { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }
        .wcr-head__act { display: flex; align-items: center; gap: 16px; padding-top: 2px; }
        .wcr-link { font-size: 14px; font-weight: 800; color: #6657e9; }
        .wcr-find { height: 41px; padding: 0 16px; }
        .wcr-boxes { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 8px; margin-top: 18px; }
        .wcr-visitlink { margin: 14px 0 0; padding: 10px 14px; border-radius: 12px; background: #f5f3ff; border: 1px solid #e3dfff; font-size: 13.5px; color: #4b4380; }
        .wcr-visitlink a { font-weight: 700; color: #5b45e0; }
        .wcr-box { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 11px 13px 10px; border-radius: 12px; border: 1px solid var(--ad-line); background: linear-gradient(180deg, #fff 0%, #fbfbff 100%); text-align: left; box-shadow: 0 1px 2px rgba(20, 22, 60, 0.04); transition: border-color .15s, box-shadow .15s, transform .15s; }
        .wcr-box:hover { border-color: #c9c4f7; box-shadow: 0 6px 16px -10px rgba(103, 87, 245, 0.45); transform: translateY(-1px); }
        .wcr-box__l { display: flex; align-items: center; gap: 6px; max-width: 100%; font-size: 11.5px; font-weight: 700; color: var(--ad-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wcr-box__l i { flex-shrink: 0; width: 7px; height: 7px; border-radius: 50%; background: #a3a8c3; }
        .wcr-box--reach .wcr-box__l i { background: #5b8def; }
        .wcr-box--screen .wcr-box__l i { background: #7c6cf2; }
        .wcr-box--ship .wcr-box__l i { background: #f59e0b; }
        .wcr-box--content .wcr-box__l i { background: #14b8a6; }
        .wcr-box--good .wcr-box__l i { background: #22a06b; }
        .wcr-box--bad .wcr-box__l i { background: #e5484d; }
        .wcr-box strong { font-family: var(--ad-head); font-size: 21px; font-weight: 800; letter-spacing: -0.6px; line-height: 1; color: var(--ad-ink); }
        .wcr-box.is-zero strong { color: #c3c6d6; }
        .wcr-box.is-zero .wcr-box__l { color: #a6aabd; }
        .wcr-box.is-on { background: var(--ad-grad); border-color: transparent; box-shadow: 0 12px 24px -14px rgba(103, 87, 245, 0.9); }
        .wcr-box.is-on strong, .wcr-box.is-on .wcr-box__l { color: #fff; }
        .wcr-box.is-on .wcr-box__l i { background: #fff; }

        .wcr-fpanel { margin-top: 20px; padding: 14px; border-radius: 14px; border: 1px solid var(--ad-line); background: #fbfbff; }
        .wcr-fpanel .wcr-screen { margin-top: 12px; padding: 0; background: none; }
        .wcr-filters { display: flex; gap: 9px; flex-wrap: wrap; align-items: center; }
        .wcr-clear { font-size: 13px; }
        .wcr-count { font-size: 12.5px; font-weight: 700; color: var(--ad-muted); }
        .wcr-fit--sent { color: #6657e9; }
        .wcr-fpanel .wcr-need { height: 32px; font-size: 12.5px; }
        .wcr-search { width: 270px; height: 43px; }
        .wcr-search::placeholder { color: #757575; }
        .wcr-sel { width: auto; height: 43px; padding: 0 30px 0 12px; font-size: 14px; color: #293652; appearance: none; background: #fff; }
        .wcr-bulk { display: flex; align-items: center; gap: 12px 20px; flex-wrap: wrap; margin-top: 16px; }
        .wcr-all { position: relative; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ad-ink); cursor: pointer; }
        .wcr-all input { position: absolute; opacity: 0; }
        .wcr-allbox { width: 18px; height: 18px; margin-right: 4px; flex-shrink: 0; display: inline-grid; place-items: center; border-radius: 5px; border: 2px solid #4b4f5c; background: #fff; }
        .wcr-all input:checked + .wcr-allbox { background: var(--ad-primary); border-color: var(--ad-primary); }
        .wcr-all input:checked + .wcr-allbox::after { content: "✓"; font-size: 12px; font-weight: 800; line-height: 1; color: #fff; }
        .wcr-all input:focus-visible + .wcr-allbox { box-shadow: 0 0 0 3px rgba(103,87,245,.25); }
        .wcr-wa { height: 41px; margin-left: -8px; padding: 0 15px; }
        .wcr-wa:disabled { opacity: 1; cursor: default; }
        .wcr-txt { padding: 0; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; }
        .wcr-txt:hover:not(:disabled) { color: var(--ad-primary-2); }
        .wcr-txt:disabled { cursor: default; }
        .wcr-pick { margin: 20px 0 0 8px; }
        .wcr-rows { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
        .wcr-warn { margin: 8px 0 0; padding: 7px 10px; border-radius: 9px; background: #fff7e6; color: #b45309; font-size: 12.5px; }
        .wcr-empty { padding: 24px; text-align: center; font-size: 13px; color: var(--ad-muted); }

        @media (max-width: 1023px) { .wcr-boxes { grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); } }
        @media (max-width: 640px) {
          .wcr-card { padding: 18px 16px; }
          .wcr-head__act { width: 100%; justify-content: space-between; }
          .wcr-boxes { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
          .wcr-box { padding: 10px 11px 9px; }
          .wcr-box strong { font-size: 19px; }
          .wcr-search { width: 100%; }
          .wcr-sel { flex: 1 1 45%; }
          .wcr-wa { margin-left: 0; width: 100%; }
        }
      `}</style>
    </AdminShell>
  );
}

