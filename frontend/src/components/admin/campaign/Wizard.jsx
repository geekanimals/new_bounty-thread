"use client";

import { useEffect, useState } from "react";
import { uploadMedia } from "@/lib/media";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { sbFor, rpc, errText } from "@/lib/supabase";
import { parseDeliverablesText, deliverablesText, splitTags, legacyTypeFor } from "@/components/admin/campaign/live";

/* New campaign ke 5 steps — har step apna route */
export const STEPS = [
  { k: "basics", label: "Basics" },
  { k: "deliverables", label: "Deliverables" },
  { k: "terms", label: "Terms & creative" },
  { k: "eligibility", label: "Eligibility & tracking" },
  { k: "review", label: "Review" },
];

const KEY = "geek_admin_new_campaign";
export const TYPE_KEYS = { Barter: "barter", Paid: "paid", "Barter + Paid": "barter_paid" };
const TYPE_LABELS = { barter: "Barter", paid: "Paid", barter_paid: "Barter + Paid" };
export const DEFAULT_DRAFT = {
  editId: "",
  brandId: "",
  subtype: "normal_barter",
  type: "Barter",
  name: "",
  brand: "",
  objective: "Awareness",
  target: "20",
  status: "Draft",
  deadline: "7",
  reels: "1",
  stories: "1",
  posts: "0",
  carousels: "0",
  reward: "",
  value: "",
  due: "7",
  rights: "1",
  brief: "",
  dos: "",
  donts: "",
  message: "",
  hashtags: "",
  mentions: "",
  locations: "",
  minF: "",
  maxF: "",
  igReq: "verified", // ideal_profile.instagram — verified / handle / none (intel.ci_eligibility check karta hai)
  tracking: true,
  url: "",
  code: "",
  // purane campaign form ke fields (openCampaignModal) — sab backend mein save hote hain
  // link & coupon tracking (purana tk_*): mode none / common / per_creator
  tkMode: "none",
  tkPrefix: "",
  tkDisc: "",
  tkUtm: true,
  tkSay: false,
  tkShop: false,
  startDate: "",
  endDate: "",
  budget: "",
  payDue: "7",
  other: "",
  productLink: "",
  cover: "",
  waImage: "",
  waPhotoOn: false,
  files: [],
  // eligibility (ideal_profile) — intel.ci_eligibility apply par yahi check karta hai, campaign_matches matching mein
  gender: "",
  cats: "",
  minEng: "",
  ageMin: "",
  ageMax: "",
  pet: "",
  petType: "",
  marital: "",
  barterOpen: "",
  audNotes: "",
};

/* public.campaigns row → draft (Edit brief: ?edit=<id>) — purane openCampaignModal ke same fields */
function draftFromRow(c) {
  const ct = c.contract_terms && typeof c.contract_terms === "object" ? c.contract_terms : {};
  const vb = c.video_brief && typeof c.video_brief === "object" ? c.video_brief : {};
  const ip = c.ideal_profile && typeof c.ideal_profile === "object" ? c.ideal_profile : {};
  const tk = c.tracking && typeof c.tracking === "object" ? c.tracking : {};
  const dv = parseDeliverablesText(c.deliverables || ct.deliverables || "");
  const tg = splitTags(c.hashtags);
  const left = c.end_date ? Math.max(0, Math.round((new Date(c.end_date) - new Date(new Date().toISOString().slice(0, 10))) / 86400000)) : "";
  return {
    ...DEFAULT_DRAFT,
    editId: c.id,
    brandId: c.brand_id || "",
    subtype: c.barter_subtype || "normal_barter",
    type: TYPE_LABELS[c.campaign_type] || "Barter",
    name: c.name || "",
    brand: c.brand || "",
    objective: c.objective || "Awareness",
    target: String(c.creators ?? ""),
    status: c.status === "Shortlist completed" ? "Shortlist" : ["Draft", "Live"].includes(c.status) ? c.status : "Live",
    deadline: String(left),
    reels: String(dv.counts.reel || 0),
    stories: String(dv.counts.story || 0),
    posts: String(dv.counts.post || 0),
    carousels: String(dv.counts.carousel || 0),
    googleReviews: String(dv.counts.google_review || 0),
    districtReviews: String(dv.counts.district_review || 0),
    other: dv.other.join(" + "),
    reward: ct.product || "",
    value: c.product_value != null ? String(c.product_value) : ct.product_value != null ? String(ct.product_value) : "",
    due: String(ct.content_days ?? 7),
    rights: String(ct.ad_rights_months ?? 1),
    brief: vb.what_to_shoot || c.brief || "",
    dos: vb.dos || "",
    donts: vb.donts || "",
    message: vb.key_messages || "",
    hashtags: tg.tags.join(" "),
    mentions: tg.ments.join(" "),
    locations: (ip.locations || []).join(", "),
    minF: ip.min_followers != null ? String(ip.min_followers) : "",
    maxF: ip.max_followers != null ? String(ip.max_followers) : "",
    tracking: !!tk.enabled,
    url: tk.dest_url || c.product_link || "",
    code: tk.common_code || "",
    tkMode: tk.mode || (tk.common_code ? "common" : "none"),
    tkPrefix: tk.prefix || "",
    tkDisc: tk.discount || "",
    tkUtm: tk.utm !== false,
    tkSay: !!tk.say_code,
    tkShop: !!tk.shopify_code,
    startDate: c.start_date || "",
    endDate: c.end_date || "",
    budget: c.budget != null ? String(c.budget) : "",
    payDue: String(ct.pay_due_days ?? 7),
    productLink: c.product_link || "",
    cover: c.cover_url || "",
    waImage: c.wa_invite_image || "",
    waPhotoOn: !!c.wa_invite_photo_on,
    files: Array.isArray(c.attachments) ? c.attachments : [],
    igReq: ip.instagram || "verified",
    gender: ip.gender || "",
    cats: (ip.categories || []).join(", "),
    minEng: ip.min_engagement != null ? String(ip.min_engagement) : "",
    ageMin: ip.age_min != null ? String(ip.age_min) : "",
    ageMax: ip.age_max != null ? String(ip.age_max) : "",
    pet: ip.pet || "",
    petType: ip.pet_type || "",
    marital: ip.marital || "",
    barterOpen: ip.barter || "",
    audNotes: ip.audience_notes || "",
    _row: c,
  };
}

/** Brand ka campaign request (brand portal) → wizard draft — purane openCampaignModal({ prefill, requestId }) jaisa.
 *  Draft sessionStorage mein; save hone par request "converted" (admin_campaign_request_converted). */
export function startDraftFromRequest(q, brand) {
  const f = q.form || {};
  const row = {
    ...f,
    name: f.name || q.name || "",
    brand: brand.name || f.brand || "",
    brand_id: brand.brand_id || f.brand_id || null,
    campaign_type: f.campaign_type || q.campaign_type || "barter",
    brief: f.brief || q.brief || "",
    start_date: f.start_date || q.starts_on || null,
    end_date: f.end_date || q.ends_on || null,
    creators: f.creators || q.creators_needed || null,
    deliverables: f.deliverables || q.deliverables || "",
    status: "Draft",
  };
  const dr = draftFromRow(row);
  const n = { ...dr, editId: "", _row: null, _prefill: { contract_terms: f.contract_terms || {}, video_brief: f.video_brief || {}, tracking: f.tracking || {}, ideal_profile: f.ideal_profile || {} }, requestId: q.request_id, status: "Draft" };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(n));
  } catch {
    /* ignore */
  }
  return n;
}

/** Draft state — steps ke beech sessionStorage mein bachta hai. ?edit=<id> ho to us campaign se bharta hai */
export function useDraft() {
  const [d, setD] = useState(DEFAULT_DRAFT);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const edit = new URLSearchParams(window.location.search).get("edit");
    let saved = null;
    try {
      const s = window.sessionStorage.getItem(KEY);
      if (s) saved = { ...DEFAULT_DRAFT, ...JSON.parse(s) };
    } catch {
      /* ignore */
    }
    if (edit && (!saved || saved.editId !== edit)) {
      sbFor("admin")
        .from("campaigns")
        .select("*")
        .eq("id", edit)
        .maybeSingle()
        .then(({ data }) => {
          if (!alive) return;
          const n = data ? draftFromRow(data) : saved || DEFAULT_DRAFT;
          setD(n);
          try {
            window.sessionStorage.setItem(KEY, JSON.stringify(n));
          } catch {
            /* ignore */
          }
          setReady(true);
        });
    } else {
      if (!edit && saved && saved.editId) saved = null; // naya campaign — purane edit ka draft nahi
      if (saved) setD(saved);
      setReady(true);
    }
    return () => {
      alive = false;
    };
  }, []);
  const set = (k, v) =>
    setD((p) => {
      const n = { ...p, [k]: v };
      try {
        window.sessionStorage.setItem(KEY, JSON.stringify(n));
      } catch {
        /* ignore */
      }
      return n;
    });
  const clear = () => {
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setD(DEFAULT_DRAFT);
  };
  return { d, set, clear, ready };
}

/**
 * Campaign save — purane openCampaignModal ka submit: public.campaigns insert / update (same columns).
 * Lautata hai { id } ya throw karta hai.
 */
export async function saveCampaign(d, { draft = false } = {}) {
  const sb = sbFor("admin");
  const t = TYPE_KEYS[d.type] || "barter";
  const st = t === "paid" ? null : d.subtype || "normal_barter";
  const num = (v) => (String(v ?? "").trim() === "" || isNaN(Number(v)) ? null : Number(v));
  if (!String(d.name).trim()) throw new Error("Add a campaign name.");
  if (!String(d.brand).trim()) throw new Error("Pick the brand (or type a new brand's name).");
  const counts = { reel: num(d.reels) || 0, story: num(d.stories) || 0, post: num(d.posts) || 0, carousel: num(d.carousels) || 0, google_review: num(d.googleReviews) || 0, district_review: num(d.districtReviews) || 0 };
  const delivText = deliverablesText(counts, d.other ? [d.other] : []);
  const tags = splitTags(`${d.hashtags || ""} ${d.mentions || ""}`);
  const ideal = {};
  if (num(d.minF) != null) ideal.min_followers = num(d.minF);
  if (num(d.maxF) != null) ideal.max_followers = num(d.maxF);
  if (ideal.min_followers != null && ideal.max_followers != null && ideal.max_followers < ideal.min_followers) throw new Error("Max followers must be more than min followers.");
  const locs = String(d.locations || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (locs.some((x) => /^any$/i.test(x))) ideal.locations = ["Any"];
  else if (locs.length) ideal.locations = locs;
  const csvL = (v) => String(v || "").split(",").map((x) => x.trim()).filter(Boolean);
  const NUMCHK = [
    ["minEng", "Avg engagement", 0, 100],
    ["ageMin", "Creator age from", 13, 90],
    ["ageMax", "Creator age to", 13, 90],
  ];
  for (const [k, l, lo, hi] of NUMCHK) {
    const v = num(d[k]);
    if (String(d[k] ?? "").trim() !== "" && (v == null || v < lo || v > hi)) throw new Error(`${l} must be a number between ${lo} and ${hi}.`);
  }
  if (num(d.ageMin) != null && num(d.ageMax) != null && num(d.ageMax) < num(d.ageMin)) throw new Error("Creator age to must be more than age from.");
  // purane form jaisa: khali / "Any" = koi rule nahi (us key ko hata do)
  const isAny = (v) => /^(any|anyone|all|everyone|-|no limit)$/i.test(String(v || "").trim());
  const EL = {
    gender: d.gender || null,
    categories: csvL(d.cats).some(isAny) ? null : csvL(d.cats).length ? csvL(d.cats) : null,
    min_engagement: num(d.minEng),
    age_min: num(d.ageMin),
    age_max: num(d.ageMax),
    pet: d.pet || null,
    pet_type: String(d.petType || "").trim() && !isAny(d.petType) ? String(d.petType).trim().slice(0, 40) : null,
    marital: d.marital || null,
    barter: d.barterOpen || null,
    audience_notes: String(d.audNotes || "").trim().slice(0, 500) || null,
    // purane draft mein label ho sakta hai — key mein badlo
    instagram: (() => {
      const v = String(d.igReq || "").toLowerCase();
      const k = v.startsWith("verified") ? "verified" : v.startsWith("any") || v === "handle" ? "handle" : v.startsWith("no") || v === "none" ? null : v || null;
      return k;
    })(),
  };
  const prev0 = (d._row && d._row.ideal_profile) || (d._prefill && d._prefill.ideal_profile) || {};
  const prev = { ...prev0 };
  Object.entries(EL).forEach(([k, v]) => {
    if (v == null) delete prev[k];
    else ideal[k] = v;
  });
  const dest = String(d.url || "").trim();
  if (d.tracking && dest && !/^https?:\/\//i.test(dest)) throw new Error("The shop link must start with https://");
  const code = String(d.code || "").toUpperCase().replace(/\s+/g, "");
  const tkMode = ["none", "common", "per_creator"].includes(d.tkMode) ? d.tkMode : code ? "common" : "none";
  const tkPre = String(d.tkPrefix || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  if (d.tracking && tkMode === "common" && !/^[A-Z0-9_-]{2,30}$/.test(code)) throw new Error("Type the coupon code for every creator (2–30 letters / numbers, no spaces).");
  const status = draft && !d.editId ? "Draft" : d.status === "Shortlist" ? "Shortlist completed" : d.status;
  let end = d._row ? d._row.end_date : null;
  if (num(d.deadline) != null && !d._row?.end_date) end = new Date(Date.now() + num(d.deadline) * 86400000).toISOString().slice(0, 10);
  if (d.endDate) end = d.endDate; // End date (purane form jaisa) — deadline sirf tab jab date na di ho
  const start = d.startDate || (d._row && d._row.start_date) || null;
  if (start && end && end < start) throw new Error("End date must be after the start date.");
  const plink = String(d.productLink || "").trim();
  if (plink && !/^https?:\/\//i.test(plink)) throw new Error("The product link must start with https://");
  const cover = String(d.cover || "").trim();
  if (cover && !/^https:\/\//i.test(cover)) throw new Error("The campaign photo link must start with https://");
  const waImage = String(d.waImage || "").trim();
  if (d.waPhotoOn && !waImage) throw new Error("WhatsApp invite with photo is ticked — upload the photo (JPG / PNG) or untick it.");
  if (waImage && !/^https:\/\/\S+\.(jpe?g|png)(\?\S*)?$/i.test(waImage)) throw new Error("The WhatsApp invite photo must be a JPG or PNG link (https://…jpg / .png).");
  const row = {
    name: String(d.name).trim(),
    brand: String(d.brand).trim(),
    brand_id: d.brandId || null,
    campaign_type: t,
    barter_subtype: st,
    type: legacyTypeFor(t, st),
    objective: d.objective,
    status,
    budget: t === "barter" ? null : num(d.budget),
    product_link: t === "paid" ? null : plink || dest || (d._row && d._row.product_link) || null,
    start_date: start,
    cover_url: cover || null,
    wa_invite_image: waImage || null,
    wa_invite_photo_on: !!(d.waPhotoOn && waImage),
    attachments: Array.isArray(d.files) ? d.files : [],
    product_value: t === "paid" ? null : num(d.value),
    platforms: "Instagram",
    hashtags: [...tags.tags, ...tags.ments].join(" ") || null,
    deliverables: delivText,
    brief: String(d.brief || "").trim() || null,
    end_date: end || null,
    creators: num(d.target) != null && num(d.target) >= 0 ? num(d.target) : 0,
    ideal_profile: { ...prev, ...ideal, ...(locs.length ? {} : { locations: prev.locations }) },
    contract_terms: {
      ...((d._row && d._row.contract_terms) || (d._prefill && d._prefill.contract_terms) || {}),
      product: t === "paid" ? null : String(d.reward || "").trim() || null,
      product_value: t === "paid" ? null : num(d.value),
      deliverables: delivText,
      ad_rights_months: Math.min(24, Math.max(0, parseInt(d.rights) || 0)),
      content_days: Math.min(60, Math.max(1, parseInt(d.due) || 7)),
      pay_due_days: t === "barter" ? null : Math.min(90, Math.max(1, parseInt(d.payDue) || 7)),
    },
    video_brief: {
      ...((d._row && d._row.video_brief) || (d._prefill && d._prefill.video_brief) || {}),
      what_to_shoot: String(d.brief || "").trim() || null,
      key_messages: String(d.message || "").trim() || null,
      dos: String(d.dos || "").trim() || null,
      donts: String(d.donts || "").trim() || null,
    },
    tracking: {
      ...((d._row && d._row.tracking) || (d._prefill && d._prefill.tracking) || {}),
      enabled: !!d.tracking,
      dest_url: dest || null,
      discount: String(d.tkDisc || "").trim().slice(0, 80) || null,
      mode: tkMode,
      common_code: tkMode === "common" ? code : null,
      prefix: tkMode === "per_creator" ? tkPre || null : null,
      auto_codes: tkMode === "per_creator" && !!tkPre,
      utm: d.tkUtm !== false,
      shopify_code: tkMode !== "none" && !!d.tkShop,
      say_code: !!d.tracking && tkMode !== "none" && !!d.tkSay,
    },
  };
  if (!d._row) {
    // naya campaign — admin ka workspace (purana: Auth.profile.org / org_id)
    const { data: u } = await sb.auth.getUser();
    const uid = u && u.user && u.user.id;
    if (uid) {
      const { data: me } = await sb.from("members").select("org_id,org_name").eq("id", uid).maybeSingle();
      if (me) {
        row.org_id = me.org_id;
        row.org_name = me.org_name;
      }
    }
  }
  const save = (r) => (d.editId ? sb.from("campaigns").update(r).eq("id", d.editId) : sb.from("campaigns").insert(r));
  let { error } = await save(row);
  // purana app: database purana ho to naye columns chhod ke dobara (cover_url / brand_id / tracking / terms)
  if (error && /wa_invite_photo_on/i.test(error.message || "")) ({ error } = await save((delete row.wa_invite_photo_on, row)));
  if (error && /wa_invite_image/i.test(error.message || "")) ({ error } = await save((delete row.wa_invite_image, row)));
  if (error && /cover_url/i.test(error.message || "")) ({ error } = await save((delete row.cover_url, row)));
  if (error && /brand_id/i.test(error.message || "")) ({ error } = await save((delete row.brand_id, row)));
  if (error && /tracking/i.test(error.message || "")) ({ error } = await save((delete row.tracking, row)));
  if (error && /contract_terms|video_brief/i.test(error.message || "")) ({ error } = await save((delete row.contract_terms, delete row.video_brief, row)));
  if (error) throw new Error(errText(error));
  if (d.editId) return { id: d.editId };
  // brand ke request se bana — request "converted" (purana admin_campaign_request_converted)
  if (d.requestId) await rpc("admin", "api.admin_campaign_request_converted", { p_request: d.requestId, p_campaign_name: row.name });
  const { data: fresh } = await sb.from("campaigns").select("id,name").eq("name", row.name).order("created_at", { ascending: false }).limit(1);
  const made = Array.isArray(fresh) ? fresh[0] : fresh;
  return { id: made && made.id };
}

/** Campaign photo / attachment upload — purane form jaisa (storage bucket campaign-files, <org>/…) */
export async function uploadCampaignFile(file, kind = "file") {
  const sb = sbFor("admin");
  const { data: u } = await sb.auth.getUser();
  const uid = u && u.user && u.user.id;
  const { data: me } = uid ? await sb.from("members").select("org_id").eq("id", uid).maybeSingle() : { data: null };
  const org = me && me.org_id;
  if (!org) throw new Error("Your workspace isn't set up yet — can't upload files.");
  // photos are compressed before upload — only other files need the size limit
  if (!/^image\//.test(file.type || "") && file.size > 20 * 1024 * 1024) throw new Error(`${file.name} is over 20 MB.`);
  const rnd = Math.random().toString(36).slice(2, 8);
  let path;
  if (kind === "wa") {
    path = `${org}/wa/${Date.now()}-${rnd}.jpg`;
  } else if (kind === "cover") {
    const ext = (String(file.type).split("/")[1] || "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "jpg";
    path = `${org}/cover/${Date.now()}-${rnd}.${ext}`;
  } else {
    path = `${org}/${Date.now()}-${rnd}-${file.name.replace(/[^\w.\-]+/g, "_").slice(-80)}`;
  }
  let up;
  try {
    up = await uploadMedia("admin", "campaign-files", file, { scope: kind === "cover" ? "cover" : kind === "wa" ? "wa" : "files", jpeg: kind === "wa", fallback: { bucket: "campaign-files", path } });
  } catch (e) {
    throw new Error(`Couldn't upload ${file.name}: ${e.message}`);
  }
  return { name: file.name, url: up.url, type: up.type || file.type || "", size: up.size, path: up.path, ...(up.key ? { r2: true } : {}) };
}

/** Brief se eligibility padho — purane eligFromBrief jaisa (sirf khali boxes bharta hai) */
const ELIG_CITIES = ["Delhi", "New Delhi", "Delhi NCR", "Mumbai", "Navi Mumbai", "Thane", "Bengaluru", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Indore", "Gurugram", "Gurgaon", "Noida", "Ghaziabad", "Kochi", "Goa", "Surat", "Bhopal", "Nagpur", "Patna", "Kanpur", "Ludhiana", "Coimbatore", "Visakhapatnam", "Vadodara", "Dehradun", "Guwahati", "Bhubaneswar", "Ranchi", "Raipur", "Mysuru", "Mysore", "Udaipur", "Jodhpur", "Amritsar", "Varanasi", "Agra", "Nashik", "Mangaluru", "Mangalore", "Thiruvananthapuram", "Madurai", "Vijayawada", "Rajkot", "Srinagar", "Jammu", "Shimla", "Siliguri", "Aurangabad", "Kota", "Ajmer", "Meerut", "Allahabad", "Prayagraj"];
export function eligFromBrief(text) {
  const t = String(text || "");
  const lo = t.toLowerCase();
  const out = {};
  const kn = (n, u) => {
    n = parseFloat(String(n).replace(/,/g, ""));
    u = String(u || "").toLowerCase();
    return Math.round(n * (u === "k" ? 1e3 : u === "l" || u.startsWith("lakh") || u.startsWith("lac") ? 1e5 : u === "m" ? 1e6 : 1));
  };
  let m = lo.match(/(\d[\d,.]*)\s*(k|l|lakh|lac|m)?\s*(?:-|–|to)\s*(\d[\d,.]*)\s*(k|l|lakh|lac|m)?\s*\+?\s*followers?/);
  if (m) {
    out.min_followers = kn(m[1], m[2] || m[4]);
    out.max_followers = kn(m[3], m[4]);
  } else if ((m = lo.match(/(?:under|below|up to|upto|less than|max(?:imum)?)\s*(\d[\d,.]*)\s*(k|l|lakh|lac|m)?\s*followers?/))) out.max_followers = kn(m[1], m[2]);
  else if ((m = lo.match(/(\d[\d,.]*)\s*(k|l|lakh|lac|m)?\s*\+?\s*(?:or more\s*)?followers?/))) out.min_followers = kn(m[1], m[2]);
  if ((m = lo.match(/(?:age[d]?\s*(?:group)?\s*:?\s*)?(\d{2})\s*(?:-|–|to)\s*(\d{2})\s*(?:yrs?|years?|y\/o)?/)) && (/age|yrs?|years?|y\/o/.test(m[0]) || /age/.test(lo))) {
    const a = +m[1];
    const b = +m[2];
    if (a >= 13 && b <= 90 && a < b) {
      out.age_min = a;
      out.age_max = b;
    }
  }
  const fem = /\b(female|women|woman|girls?|ladies|moms?|mothers?|mommy|she\/her)\b/.test(lo);
  const mal = /\b(male|men|man|boys?|dads?|fathers?|he\/him)\b/.test(lo);
  if (fem && !mal) out.gender = "female";
  else if (mal && !fem) out.gender = "male";
  if (/\b(unmarried|single)\b/.test(lo)) out.marital = "single";
  else if (/\b(married|couples?|newly ?weds?)\b/.test(lo)) out.marital = "married";
  if ((m = lo.match(/\b(dog|cat|pet)\s*(?:parents?|owners?|lovers?|moms?|dads?)\b/))) {
    out.pet = "yes";
    if (m[1] !== "pet") out.pet_type = m[1];
  }
  const seg = [];
  const re = /(?:based (?:in|out of)|located in|creators? (?:in|from)|influencers? (?:in|from)|from|cit(?:y|ies)\s*:|locations?\s*:)\s*([^.\n;]{2,80})/gi;
  let r;
  while ((r = re.exec(t))) seg.push(r[1]);
  const cities = [];
  seg.forEach((x) =>
    ELIG_CITIES.forEach((c) => {
      if (new RegExp("\\b" + c.replace(/ /g, "\\s+") + "\\b", "i").test(x) && !cities.includes(c)) cities.push(c);
    })
  );
  if (cities.length) out.locations = cities.filter((c) => !(c === "Delhi" && (cities.includes("Delhi NCR") || cities.includes("New Delhi"))));
  return out;
}

/** Brand CRM list (purana loadBrandCache → api.brand_list) */
export function useBrands() {
  const [list, setList] = useState([]);
  useEffect(() => {
    rpc("admin", "api.brand_list", { p_q: null }).then((r) => setList(Array.isArray(r.data) ? r.data : []));
  }, []);
  return list;
}

/** Text / number / select field — Figma: label 12/800, box 41px */
export function Field({ label, k, d, set, placeholder, type = "text", options, area, full }) {
  const id = `nc-${k}`;
  return (
    <div className={`nc-field ${full ? "nc-field--full" : ""}`}>
      <label className="nc-label" htmlFor={id}>
        {label}
      </label>
      {options ? (
        <select id={id} className="ga-input nc-input" value={d[k]} onChange={(e) => set(k, e.target.value)}>
          {options.map((o) =>
            Array.isArray(o) ? (
              <option key={o[0]} value={o[0]}>
                {o[1]}
              </option>
            ) : (
              <option key={o}>{o}</option>
            )
          )}
        </select>
      ) : area ? (
        <textarea id={id} className="ga-input nc-input nc-area" value={d[k]} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} />
      ) : (
        <input id={id} className="ga-input nc-input" type={type} min={type === "number" ? 0 : undefined} value={d[k]} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} />
      )}
    </div>
  );
}

/**
 * Wizard ka frame: "Create a campaign" heading + Close, stepper, card, footer (Back/Cancel · Save draft · Continue).
 * step = index (0-4). canNext = false ho to Continue par error dikhega.
 */
export default function Wizard({ step, children, onNext, nextLabel = "Continue →", error, draft }) {
  const router = useRouter();
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [fromReview, setFromReview] = useState(false);
  /* Save draft — database mein save (naya = Draft status), phir usi campaign par edit chalu */
  const saveDraft = async () => {
    if (!draft) return setToast("✓ Draft saved on this device");
    setSaving(true);
    try {
      const r = await saveCampaign(draft.d, { draft: true });
      if (r.id && !draft.d.editId) {
        draft.set("editId", r.id);
        router.replace(`/vault/campaigns/new/${STEPS[step].k}?edit=${r.id}`);
      }
      setToast("✓ Draft saved");
    } catch (e) {
      setToast(e.message || "Couldn't save.");
    }
    setSaving(false);
  };
  const prev = STEPS[step - 1];
  const next = STEPS[step + 1];

  // Review ke "Needs detail" / summary line se aaye (?focus=<field>) → wahi field dikhao, chamkao aur cursor rakho
  useEffect(() => {
    let f = "";
    try {
      f = new URLSearchParams(window.location.search).get("focus") || "";
    } catch {
      /* ignore */
    }
    if (!f) return undefined;
    const t = setTimeout(() => {
      setFromReview(true);
      const el = document.getElementById(`nc-${f}`) || document.getElementById(f);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("nc-flash");
      if (typeof el.focus === "function" && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) el.focus({ preventScroll: true });
      setTimeout(() => el.classList.remove("nc-flash"), 2200);
    }, 350);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const q = draft && draft.d.editId ? `?edit=${draft.d.editId}` : "";
  const go = async () => {
    if (onNext && (await onNext()) === false) return;
    if (next) router.push(`/vault/campaigns/new/${next.k}${q}`);
  };

  return (
    <AdminShell>
      <PageHead title={draft && draft.d.editId ? "Edit campaign" : "Create a campaign"} sub="A guided, reviewable process that replaces the long scrolling modal.">
        <Link href="/vault/campaigns" className="ga-btn ga-btn--ghost nc-close">
          ✕ Close
        </Link>
      </PageHead>

      <section className="ga-card nc">
        <ol className="nc-steps" data-scroll>
          {STEPS.map((s, i) => (
            <li key={s.k} className={i === step ? "is-on" : i < step ? "is-done" : ""}>
              {i < step ? (
                <Link href={`/vault/campaigns/new/${s.k}${q}`}>
                  <span className="nc-dot">✓</span>
                  <span className="nc-steplabel">{s.label}</span>
                </Link>
              ) : (
                <span className="nc-steplink">
                  <span className="nc-dot">{i + 1}</span>
                  <span className="nc-steplabel">{s.label}</span>
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="nc-body">{children}</div>
        {error && <p className="nc-err">{error}</p>}

        <div className="nc-foot">
          {prev ? (
            <Link href={`/vault/campaigns/new/${prev.k}${q}`} className="ga-btn ga-btn--ghost nc-back">
              ← Back
            </Link>
          ) : (
            <Link href="/vault/campaigns" className="ga-btn ga-btn--ghost nc-back">
              Cancel
            </Link>
          )}
          <div className="nc-foot__r">
            {fromReview && step < STEPS.length - 1 && (
              <Link href={`/vault/campaigns/new/review${q}`} className="nc-save">
                ✓ Back to review
              </Link>
            )}
            <button type="button" className="nc-save" disabled={saving} onClick={saveDraft}>
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button type="button" className="ga-btn ga-btn--primary nc-next" onClick={go}>
              {nextLabel}
            </button>
          </div>
        </div>
      </section>

      {toast && <div className="ga-toast">{toast}</div>}

      <style>{`
        .nc-flash { outline: 3px solid #f59e0b !important; outline-offset: 3px; border-radius: 10px; transition: outline-color .3s; }
        .nc-close { height: 41px !important; padding: 0 14px !important; color: var(--ad-primary-ink); }
        .nc { max-width: 1049px; margin: 0 auto; padding: 22px 22px 22px; }
        .nc-steps { list-style: none; margin: 0 0 22px; padding: 0; display: flex; align-items: center; gap: 8px; overflow-x: auto; scrollbar-width: none; }
        .nc-steps::-webkit-scrollbar { display: none; }
        .nc-steps li { flex-shrink: 0; }
        .nc-steps a, .nc-steplink { display: inline-flex; align-items: center; gap: 8px; }
        .nc-dot { width: 29px; height: 29px; border-radius: 50%; display: grid; place-items: center; background: #eceef5; color: #778199; font-size: 12px; font-weight: 800; }
        .nc-steplabel { font-size: 12px; font-weight: 800; color: #9299aa; white-space: nowrap; }
        .nc-steps li.is-on .nc-dot { background: #5a4bf2; color: #fff; }
        .nc-steps li.is-on .nc-steplabel { color: #5a4bf2; }
        .nc-steps li.is-done .nc-dot { background: var(--ad-green-bg); color: var(--ad-green); }
        .nc-steps li.is-done a:hover .nc-steplabel { color: var(--ad-primary); }

        .nc-body { display: flex; flex-direction: column; }
        .nc-sec { margin: 14px 0 12px; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8793a9; }
        .nc-sec:first-child { margin-top: 2px; }
        .nc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
        .nc-field { margin-bottom: 14px; min-width: 0; }
        .nc-field--full { grid-column: 1 / -1; }
        .nc-label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 800; color: #60708c; }
        .nc-input { height: 41px; padding: 0 12px; border-color: #dfe2ee; font-size: 12px; font-weight: 800; color: #1d2943; }
        .nc-input::placeholder { color: #757575; font-weight: 800; }
        select.nc-input { appearance: none; background: #fff; padding-right: 12px; height: 41px; }
        .nc-area { height: 90px; min-height: 90px; padding: 11px 12px; resize: none; }
        .nc-note { display: flex; gap: 10px; margin: 4px 0 4px; padding: 12px 16px; border-radius: 12px; font-size: 12px; line-height: 1.33; }
        .nc-note--warn { background: #fff7e8; border: 1px solid #f6dfb4; color: #986016; }
        .nc-note--red { background: #ffeef0; border: 1px solid #f7cdd4; color: #b64455; }
        .nc-note b { font-weight: 700; }
        .nc-err { margin-top: 12px; padding: 9px 12px; border-radius: 10px; background: var(--ad-red-bg); color: var(--ad-red); font-size: 12.5px; font-weight: 700; }

        .nc-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--ad-line); }
        .nc-back { height: 41px; padding: 0 15px; color: var(--ad-primary-ink); }
        .nc-foot__r { display: flex; align-items: center; gap: 12px; }
        .nc-save { border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; padding: 0; }
        .nc-save:hover { color: var(--ad-primary-2); }
        .nc-next { height: 41px; padding: 0 16px; box-shadow: none; }

        @media (max-width: 767px) {
          .nc-grid { grid-template-columns: 1fr; }
          .nc-steps .nc-steplabel { display: none; }
          .nc-steps li.is-on .nc-steplabel { display: inline; }
        }
        @media (max-width: 640px) {
          .nc { padding: 16px 14px 18px; }
          .nc-foot { flex-wrap: wrap; }
          .nc-foot__r { flex: 1; justify-content: flex-end; }
        }
      `}</style>
    </AdminShell>
  );
}
