/**
 * Creator ke pure helpers — koi Supabase call nahi, koi React nahi. Sirf data → text / shape.
 * Purane app ke bounty-creator.js / bounty-pages.js / operations.js / bounty-welcome.js ke helpers ka naya ghar.
 * Sections: stages · numbers & dates · campaign labels & cards · cover photo · alerts · terms & rates · profile %
 */

/* =====================================================================
 * Stages (purane bounty-creator.js JOURNEY / STAGE_TXT / AI_ACTION_ORDER)
 * ===================================================================== */
export const PEND = ["applied", "eligible", "sent_to_brand", "shortlisted", "invited"];
export const DONE = ["completed"];
export const DECL = ["ineligible", "brand_declined", "dropped", "rejected"];
export const DECLINED = ["ineligible", "brand_declined", "rejected", "dropped"];

/** "Next step" ki line (bounty-creator.js STAGE_TXT) */
export const STAGE_TXT = {
  changes_requested: "Changes requested — upload a revised draft", content_created: "Shoot & submit your draft", contract_sent: "Review & sign your agreement",
  contract_signed: "Confirm your delivery address", content_approved: "Draft approved — post it & share the link", product_sent: "Package on the way — confirm when it arrives",
  invited: "You're invited — accept or decline", content_submitted: "Draft sent — waiting for review", address_confirmed: "Address confirmed — product ships soon",
  published: "Post live — waiting for verification", brand_confirmed: "Brand confirmed you", accepted: "Confirmed — next step coming", sent_to_brand: "With the brand for review",
  shortlisted: "Shortlisted", eligible: "Eligible — waiting for the brand", applied: "Applied — waiting for the brand", completed: "Completed",
};
export const STAGE_SHORT = {
  changes_requested: "Changes requested", content_created: "Draft due", contract_sent: "Sign agreement", contract_signed: "Confirm address",
  content_approved: "Approved — post it", product_sent: "Kit on the way", invited: "Invited", content_submitted: "Draft in review", address_confirmed: "Awaiting product",
  published: "Post live", brand_confirmed: "Confirmed", accepted: "Confirmed", sent_to_brand: "With the brand", shortlisted: "Shortlisted", eligible: "In review", applied: "Applied", completed: "Completed",
};
// jo creator ke haath mein nahi (wait) — "Action needed" se bahar
const WAIT_ST = ["applied", "eligible", "sent_to_brand", "shortlisted", "content_submitted", "published", "address_confirmed", "accepted", "brand_confirmed"];
// "what to do first" order (purane AI_ACTION_ORDER jaisa)
const ACTION_ORDER = ["changes_requested", "contract_sent", "invited", "contract_signed", "content_approved", "content_created", "product_sent"];

/** Campaign mein product nahi bhejna (my_campaign_flows.needs_product === false) */
export const noShip = (c) => !!(c && c._flow && c._flow.needs_product === false);

const fmtKind = (f) => {
  f = String(f || "").toLowerCase();
  return f === "reel" ? "reel" : f === "story" ? "story" : f === "static_post" || f === "carousel" || f === "post" ? "feed" : null;
};
const FMT_LABEL = { reel: "Reel", story: "Story", feed: "Post" };
/** deliverables vs posts: { items, left: ["Story", …] } */
export function postProgress(c) {
  const need = {};
  const done = {};
  (c.deliverables || []).forEach((d) => {
    const k = fmtKind(d.format);
    if (k) need[k] = (need[k] || 0) + Math.max(1, d.quantity || 1);
  });
  (c.posts || []).forEach((p) => {
    const k = fmtKind(p.media_type);
    if (k) done[k] = (done[k] || 0) + 1;
  });
  const keys = Object.keys(need);
  return {
    items: keys.map((k) => ({ key: k, label: FMT_LABEL[k], need: need[k], done: Math.min(done[k] || 0, need[k]) })),
    left: keys.filter((k) => (done[k] || 0) < need[k]).map((k) => FMT_LABEL[k]),
  };
}

/** participation stage → naye step key (applied … paid). Stage string ya poora campaign row dono chalega. */
export function stepOf(c) {
  if (typeof c === "string") c = { stage: c };
  const s = c.stage;
  if (["invited", "shortlisted", "applied", "eligible", "sent_to_brand"].includes(s)) return "applied";
  if (["brand_confirmed", "accepted"].includes(s)) return "selected";
  if (s === "contract_sent") return "agreement";
  if (s === "contract_signed") return noShip(c) ? "draft" : "address";
  if (["address_confirmed", "product_sent", "product_delivered"].includes(s)) return noShip(c) ? "draft" : "package";
  if (["content_created", "changes_requested", "content_submitted"].includes(s)) return "draft";
  if (s === "content_approved") return "post";
  if (s === "published") return postProgress(c).left.length ? "post" : "verified";
  if (s === "completed") return "paid";
  return "applied";
}

export const isRunning = (c) => !PEND.includes(c.stage) && !DONE.includes(c.stage) && !DECL.includes(c.stage);
export const isLive = (c) => !DONE.includes(c.stage) && !DECL.includes(c.stage);
/** creator ki baari wale (Action needed), sabse zaroori pehle */
export function needsMe(list) {
  const o = (s) => ACTION_ORDER.indexOf(s) + 1 || 99;
  return list.filter((x) => isLive(x) && !WAIT_ST.includes(x.stage)).sort((a, b) => o(a.stage) - o(b.stage));
}

/** list filter group: running | waiting | done | not  (purane Active / Upcoming / Done / Declined) */
export function groupOf(c) {
  if (["shortlisted", "invited", "applied", "eligible", "sent_to_brand"].includes(c.stage)) return "waiting";
  if (c.stage === "completed") return "done";
  if (DECLINED.includes(c.stage)) return "not";
  return "running";
}

/** creator ko abhi kuch karna hai? (purane "Action needed" — sign / confirm / submit / post / accept / received) */
export function needsAction(c) {
  if (c.blocked_at) return true;
  const s = c.stage;
  if (s === "invited") return true;
  if (s === "contract_sent") return true;
  if (s === "contract_signed" && !noShip(c)) return true;
  if (s === "product_sent" && !(c.shipment && c.shipment.status === "delivered")) return true;
  if (["content_created", "changes_requested", "content_approved"].includes(s)) return true;
  if (s === "published" && postProgress(c).left.length) return true;
  const p = c._flow && c._flow.paid && c._flow.payment;
  if (p && ["pending", "failed", "needs_update"].includes(p.details_status)) return true;
  return false;
}

/** card ki ek line: abhi kya ho raha hai (purane nextStepHtml ka title) */
export function noteOf(c) {
  const sh = c.shipment || {};
  const rv = c.review || {};
  if (c.blocked_at) return "Your account is blocked — submit your video now";
  switch (c.stage) {
    case "invited":
      return c.needs_approval ? `${c.brand || "A brand"} wants you on this campaign` : "You're invited — accept or pass";
    case "applied":
    case "eligible":
    case "shortlisted":
      return "Application received — Geek is checking your profile";
    case "sent_to_brand":
      return "With the brand — you're on the final list";
    case "brand_confirmed":
    case "accepted":
      return "You're selected! Your contract is being prepared";
    case "contract_sent":
      return "Sign your contract";
    case "contract_signed":
      return noShip(c) ? "Contract signed ✓ — your video brief is on its way" : "Confirm your delivery address";
    case "address_confirmed":
      return "Your product is being packed";
    case "product_sent":
      return sh.status === "delivered" ? "Delivered — your video brief is ready" : `Your product is on the way${sh.courier ? " — " + sh.courier : ""}${sh.tracking_ref ? " #" + sh.tracking_ref : ""}`;
    case "content_created":
      return `Shoot your video${c.deadline ? " — submit by " + fdate(c.deadline) : ""}`;
    case "changes_requested":
      return /^New video link needed/.test(rv.reason || "") ? "We need a new video link" : `The brand asked for changes${rv.reason ? " — “" + rv.reason + "”" : ""}`;
    case "content_submitted":
      return "Your video is with the brand — don't post yet";
    case "content_approved":
      return "Approved — let's post!";
    case "published": {
      const left = postProgress(c).left;
      return left.length ? `Next: post your ${left.join(" + ")}` : "You're live! Numbers are coming in";
    }
    case "completed":
      return "Campaign complete 🎉";
    default:
      if (DECLINED.includes(c.stage)) return `Not selected this time${c.reason_label ? " — " + c.reason_label : ""}`;
      return "";
  }
}

/** campaign ka sabse naya / important date (card ke neeche) */
export function dateOf(c) {
  if (c.stage === "completed") return c.updated_at ? "Completed " + fdate(c.updated_at) : "Completed";
  if (c.deadline && !DECLINED.includes(c.stage)) return "Due " + fdate(c.deadline);
  return c.applied_at ? "Applied " + fdate(c.applied_at) : "";
}

/* =====================================================================
 * Numbers & dates
 * ===================================================================== */
export const fmtNum = (n) => (n == null || n === "" ? "—" : Number(n).toLocaleString("en-IN"));
/** 1.2K / 3.4L / 1Cr (Indian short) */
export function fmtK(n) {
  if (n == null || n === "") return "—";
  const v = Number(n);
  if (v >= 1e7) return (v / 1e7).toFixed(1).replace(/\.0$/, "") + "Cr";
  if (v >= 1e5) return (v / 1e5).toFixed(1).replace(/\.0$/, "") + "L";
  if (v >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.round(v));
}
/** followers: 1.2K / 3.4M (purane fmtFollowers) */
export const fmtFollowers = (v) => {
  v = Number(v) || 0;
  return v >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : v >= 1e3 ? (v / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(v);
};
export const inr = (n) => (n == null || n === "" ? "—" : "₹" + Math.round(+n).toLocaleString("en-IN"));
export const money = (v) => "₹" + Number(v).toLocaleString("en-IN");
/** "5 Mar" */
export function fmtDate(d) {
  if (!d) return "";
  const t = new Date(d);
  return isNaN(t) ? "" : t.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
/** "5 Mar 2026" (date-only string ko local din maano) */
export function fdate(d) {
  if (!d) return "";
  try {
    const x = String(d).length <= 10 ? new Date(d + "T00:00:00") : new Date(d);
    return x.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return String(d);
  }
}
/** "05 Mar, 14:30" */
export function fdt(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(d);
  }
}
/** posts ka engagement % (likes + comments) / posts / followers — purane media kit jaisa */
export function engagement(acct) {
  const m = Array.isArray(acct?.recent_media) ? acct.recent_media : [];
  if (!acct?.followers_count || !m.length) return null;
  return (100 * m.reduce((x, p) => x + (Number(p.like_count) || 0) + (Number(p.comments_count) || 0), 0)) / m.length / acct.followers_count;
}

/* =====================================================================
 * Campaign labels & cards (purane B2 helpers / compLine)
 * ===================================================================== */
// campaign_type: paid | barter | barter_paid  (purane comp_type: cash | barter | hybrid)
const COMP_TO_KIND = { cash: "paid", hybrid: "barter_paid", barter: "barter" };
export const kindOf = (c) => (c && (c.campaign_type || COMP_TO_KIND[c.comp_type])) || "";
const kindOrBarter = (c) => kindOf(c) || "barter";
// naye design ke type keys: paid | barter | hybrid
export const typeKey = (c) => ({ paid: "paid", barter: "barter", barter_paid: "hybrid" }[kindOf(c)] || "barter");
export const isCeleb = (c) => c && c.barter_subtype === "celebrity_story";

/** reward line — purane compLine jaisa */
export function compLine(c) {
  const k = kindOrBarter(c);
  if (k === "paid") return c.product_value ? money(c.product_value) : "Paid";
  if (k === "barter_paid") return (c.product_value ? money(c.product_value) + " + " : "") + (c.product || "product");
  return c.product_value ? "Products worth " + money(c.product_value) : c.product || "Product";
}
export const compSub = (c) => ({ paid: "Payment", barter_paid: "Payment + product" }[kindOf(c)] || "Product");
export const delivLine = (c) => (c.deliverables_text ? String(c.deliverables_text).split(/\n|;/)[0].slice(0, 40) : c.platforms ? String(c.platforms).split(",")[0] : "1 Reel");

/** "Who can apply" lines: guest = who_can_apply (text), login = eligibility.criteria[].need */
export function whoList(c) {
  if (Array.isArray(c.who_can_apply)) return c.who_can_apply.filter(Boolean);
  const cr = (c.eligibility && c.eligibility.criteria) || [];
  return cr.map((x) => x.need).filter(Boolean);
}
const whoLine = (c) => {
  const w = (c.who_can_apply || []).filter(Boolean);
  const city = (c.cities || []).slice(0, 1).join("");
  return [w[0] || city || "", c.category || ""].filter(Boolean).join(" • ");
};

/** Home ke chhote card ka shape (list_open_campaigns row → CampaignCard) */
export function homeCard(c, covers) {
  const el = c.eligibility || {};
  const cities = (c.cities || []).join(", ");
  return {
    id: c.campaign_id,
    title: c.name || c.campaign || "Campaign",
    brand: c.brand || "",
    type: typeKey(c),
    reward: compLine(c),
    deliver: delivLine(c),
    who: whoLine(c) || "Open to all creators",
    short: whoLine(c) || "Open to all",
    city: cities,
    worth: c.product_value ? money(c.product_value) : "",
    till: c.ends_on ? fmtDate(c.ends_on) : "",
    img: coverOf(c, covers),
    eligible: el.eligible === true,
    elig: el.eligible === true ? 0 : el.eligible === false ? 2 : 1,
  };
}

/** Discover / Explore card ka shape (list_open_campaigns / explore_campaigns row → CampaignCard) */
export function campaignCard(x, covers = {}) {
  const who = whoList(x);
  const el = x.eligibility || {};
  const city = (x.cities || []).slice(0, 2).join(", ");
  return {
    id: String(x.campaign_id),
    title: x.name || x.campaign || "Campaign",
    brand: x.brand || "",
    type: typeKey(x),
    reward: compLine(x),
    deliver: delivLine(x),
    // category pehle se "Category: …" mein ho to dobara mat jodo
    who: [who.length ? who.join(" • ") : "Open to every creator", who.some((w) => /category/i.test(w)) ? "" : x.category].filter(Boolean).join(" • "),
    short: [who[0] || city, x.category].filter(Boolean).join(" • ") || "Open to every creator",
    city: city || "All India",
    till: x.ends_on ? fdate(x.ends_on) : "",
    worth: x.product_value ? money(x.product_value) : "",
    img: coverOf(x, covers),
    eligible: el.eligible === true,
    checked: el.eligible === true || el.eligible === false,
    myStage: x.my_stage || null,
    closed: !!x.applications_closed,
  };
}

/** profile ke naam se tulna (contract signature) — purane normName */
export const normName = (x) =>
  String(x || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** {code} brief mein = mera code (purane codeFill) */
export function codeFill(c, v) {
  if (!v) return v;
  const code = (c && c._trk && c._trk.code) || "";
  return String(v).replace(/\{\s*code\s*\}/gi, code || "[your code — coming soon]");
}

/** sirf http(s) link — warna "#" (javascript: wagera block) */
export const safeLink = (u) => {
  u = String(u || "");
  return /^https?:\/\//i.test(u) ? u : "#";
};

/* =====================================================================
 * Cover photo (purane camPhoto): Super Admin ki cover → purani ph_ photo → brand → category
 * ===================================================================== */
// Purane app ki apni photos (/assets/bounty/rd/ph_*.jpg) naye app mein /creator/*.jpg hain.
const OLD_PH = { ph_beauty: "cat-beauty", ph_fashion: "cat-fashion", ph_food: "cat-food", ph_fitness: "cat-fitness", ph_pets: "cat-pets", ph_travel: "cat-travel",
  ph_circle: "brand-circle", ph_vaaree: "cat-home", ph_beardo: "camp-beardo" };
const PH = [[/beauty|make ?up|skin|cosmetic/i, "cat-beauty"], [/fashion|apparel|cloth|wear|style/i, "cat-fashion"], [/food|cook|restaurant|snack|drink|bever|chai|tea|coffee/i, "cat-food"],
  [/fit|gym|sport|health|yoga/i, "cat-fitness"], [/pet|dog|cat/i, "cat-pets"], [/travel|trip|hotel|stay/i, "cat-travel"], [/tech|gadget|audio|phone|electr|camera/i, "cat-tech"],
  [/home|decor|interior|lifestyle|living/i, "cat-home"], [/groom|\bmen\b|fragrance|perfume|beard|shav/i, "camp-beardo"]];
const BR = { beardo: "camp-beardo", vaaree: "cat-home", snuggles: "brand-snuggles", circle: "brand-circle", nykaa: "brand-nykaa", boat: "brand-boat", typsy: "cat-food", zomato: "cat-food", myntra: "cat-fashion", mcaffeine: "cat-beauty" };
/** campaign ki photo URL. covers = campaign_covers ka map { campaign_id: url } */
export function coverOf(c, covers) {
  const id = c && (c.campaign_id || c.id);
  const u = (id && covers && covers[id]) || c?.cover_url;
  if (u) {
    if (/^https?:\/\//.test(u)) return u;
    const m = /\/(ph_[a-z]+)\.jpg$/.exec(u);
    if (m && OLD_PH[m[1]]) return `/creator/${OLD_PH[m[1]]}.jpg`;
  }
  const b = String(c?.brand || "").toLowerCase().replace(/[^a-z]/g, "");
  if (BR[b]) return `/creator/${BR[b]}.jpg`;
  const s = [c?.category, c?.product, c?.name, c?.brand].join(" ");
  const hit = PH.find(([rx]) => rx.test(s));
  return `/creator/${hit ? hit[1] : "cat-lifestyle"}.jpg`;
}

/* =====================================================================
 * Alerts (notifications) — Inbox page aur top bar ki 🔔 dono
 * ===================================================================== */
// notification ka action_route (purane page naam) → naya route
export const ROUTE = {
  mycampaigns: "/creator/my-campaigns", campaigns: "/creator/my-campaigns", approvals: "/creator/my-campaigns", campaignops: "/creator/my-campaigns", growth: "/creator/my-campaigns",
  opencampaigns: "/creator/discover", marketplace: "/creator/discover", barter: "/creator/discover", mediakit: "/creator/media-kit", profile: "/creator/profile", onboarding: "/creator/profile",
  alerts: "/creator/messages", messages: "/creator/messages", dashboard: "/creator/home", payments: "/creator/payments", bxpayments: "/creator/payments", instagram: "/creator/analytics", reports: "/creator/analytics",
};
export const hrefOf = (n) => {
  let r = String(n.action_route || "").replace(/^\/?app\.html\?go=/, "").replace(/^#/, "");
  if (!r) return "";
  if (r.startsWith("admin:")) r = "mycampaigns";
  // campaign wali alert seedha us campaign par
  if (["mycampaigns", "campaigns", "approvals", "campaignops"].includes(r) && n.participation_id) return `/creator/my-campaigns/${n.participation_id}`;
  return ROUTE[r] || (r.startsWith("/") ? r : "/creator/home");
};
export const isAct = (n) => n.kind === "action_required" && !n.acted;
export const isMsg = (n) => n.kind === "message" || /^geek( team)?\b/i.test(n.title || "");
const ICONS = [[/sign|agreement|contract/i, "✍️"], [/change|revis/i, "🔁"], [/package|ship|deliver|courier/i, "📦"], [/paid|payment|₹|upi/i, "💸"], [/campaign|match/i, "✨"], [/instagram/i, "📸"]];
export const iconOf = (n) => (isMsg(n) ? "💬" : (ICONS.find(([rx]) => rx.test(`${n.title} ${n.body}`)) || [0, "🔔"])[1]);
/** purane ibWhen jaisa: aaj = time, kal = Yesterday, hafte mein = din, warna date. now = effect mein liya time (render mein Date nahi) */
export function when(d, now) {
  const t = new Date(d);
  if (isNaN(t) || !now) return "";
  const n0 = new Date(now);
  const day = 864e5;
  const start = new Date(n0.getFullYear(), n0.getMonth(), n0.getDate()).getTime();
  if (t.getTime() >= start) return t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (t.getTime() >= start - day) return "Yesterday";
  if (t.getTime() >= start - 6 * day) return t.toLocaleDateString("en-IN", { weekday: "short" });
  return t.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* =====================================================================
 * Terms & rates (purane bounty-welcome termsOf / termsPatch)
 * ===================================================================== */
const TERMK = { barter: "Barter", paid: "Paid", hybrid: "Hybrid", discuss: "Open to discuss" };
/** commercial_preference → ["barter","paid","hybrid","discuss"] */
export function termsOf(cp) {
  cp = cp || {};
  const was = new Set();
  const m = /^open to:\s*(.+)$/i.exec(String(cp.notes || "").trim());
  if (m) {
    m[1]
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .forEach((x) => Object.keys(TERMK).forEach((k) => TERMK[k].toLowerCase() === x && was.add(k)));
    return [...was];
  }
  if (cp.accepts_barter === true && cp.product_only === true) was.add("barter");
  else if (cp.accepts_barter === true) was.add("hybrid");
  else if (cp.accepts_barter === false) was.add("paid");
  if (/open to discuss/i.test(cp.notes || "")) was.add("discuss");
  return [...was];
}
/** ["barter", …] → commercial_preference patch */
export function termsPatch(on) {
  if (!on.length) return {};
  return {
    accepts_barter: on.includes("barter") || on.includes("hybrid"),
    product_only: on.includes("barter") && !on.includes("paid") && !on.includes("hybrid"),
    notes: "Open to: " + ["barter", "paid", "hybrid", "discuss"].filter((k) => on.includes(k)).map((k) => TERMK[k]).join(", "),
  };
}
/** Rate card: { "IG Reel": 1500, "IG Story": …, "IG Static Post": … } */
export function ratesOf(profile) {
  const items = (profile && profile.rate_cards && profile.rate_cards[0] && profile.rate_cards[0].items) || [];
  const out = {};
  items.forEach((i) => (out[i.deliverable_type] = Math.round(Number(i.amount))));
  return out;
}

/* =====================================================================
 * Profile % (purane creatorProfileGate — server checklist + setup ke 7 sawaal)
 * ===================================================================== */
const hidden = (it) => ["reel_rate", "barter"].includes(it.key) || ["rate", "barter"].includes(it.section);
/** setup ke extra items: [key, label, section, done] */
function setupItems(mp, igOk, md = {}) {
  const pro = mp.professional || {};
  const per = mp.personal || {};
  const cp = mp.commercial_preference || {};
  return [
    ["s_name", "Your name", "personal", !!(pro.display_name || per.first_name)],
    ["s_city", "Your city", "professional", !!(pro.city_coarse || md.city)],
    ["s_cats", "Content categories", "professional", (pro.categories || []).length > 0],
    ["s_langs", "Content languages", "professional", (pro.languages || []).length > 0],
    ["s_formats", "Content formats", "professional", (pro.content_formats || []).length > 0],
    ["s_ig", "Instagram account", "pages", !!igOk || !!pro.ig_handle_self || !!md.ig_handle],
    ["s_terms", "Your terms", "terms", cp.accepts_barter != null || cp.product_only != null || cp.min_product_value != null],
  ];
}

/** Creator store ka req (get_profile_requirements + setup items, manual details bhi ginti mein) */
export function buildReq(rq, mp, igOk, meta) {
  if (!rq) return null;
  const its = (rq.items || [])
    .filter((it) => !hidden(it))
    .map((it) => (/^favourite brands/i.test(it.label || "") ? { ...it, label: String(it.label).replace(/^favourite brands/i, "Dream brands") } : it));
  if (mp) {
    const have = new Set(its.map((it) => it.key));
    setupItems(mp, igOk, (meta && meta.bx_manual) || {}).forEach(([key, label, section, done]) => {
      if (!have.has(key)) its.push({ key, label, section, done });
    });
  }
  const done = its.filter((it) => it.done).length;
  return { ...rq, items: its, total: its.length, done, complete: done === its.length, missing: its.filter((it) => !it.done).map((it) => it.label), pct: Math.round((100 * done) / Math.max(its.length, 1)) };
}

/** Home / top bar ka % (manual details ke bina — purane dashboard jaisa) */
export function profileProgress(req, prof, igOk) {
  if (!req) return null;
  const its = (req.items || []).filter((it) => !hidden(it));
  if (prof) {
    const have = new Set(its.map((it) => it.key));
    setupItems(prof, igOk).forEach(([key, label, , done]) => {
      if (!have.has(key)) its.push({ key, label, done });
    });
  }
  const total = its.length || 1;
  const done = its.filter((x) => x.done).length;
  return { pct: Math.round((100 * done) / total), done, total, complete: done >= total, missing: its.filter((x) => !x.done).map((x) => x.label) };
}

/* =====================================================================
 * Address (purane address-form.js STATES / ALIAS / canonState)
 * ===================================================================== */
export const INDIA_STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand",
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
const STATE_ALIAS = { orissa: "Odisha", pondicherry: "Puducherry", uttaranchal: "Uttarakhand", "nct of delhi": "Delhi", "new delhi": "Delhi",
  "national capital territory of delhi": "Delhi", "jammu & kashmir": "Jammu and Kashmir", "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu", "andaman & nicobar islands": "Andaman and Nicobar Islands" };
/** India Post / maps ka state naam → list wala naam ("" agar na mile) */
export function canonState(s) {
  s = String(s || "").trim();
  if (!s) return "";
  const k = s.toLowerCase().replace(/\s+/g, " ");
  if (STATE_ALIAS[k]) return STATE_ALIAS[k];
  return INDIA_STATES.find((x) => x.toLowerCase() === k.replace(/&/g, "and")) || "";
}
/** Koi bhi phone → aakhri 10 digit */
export const phone10 = (v) => String(v || "").replace(/\D/g, "").slice(-10);
