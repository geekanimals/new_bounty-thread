"use client";

/**
 * Sidekick (Rumi) ka dimaag — bina bahar ke AI ke. Har jawab creator ke APNE asli data se:
 *   profile + checklist (creator store), meri campaigns (api.get_my_campaigns + flows), open campaigns
 *   (api.list_open_campaigns, eligibility ke saath). Campaign ke andar ke sawal (brief, deadline, courier,
 *   contract, review note…) backend "ai-chat" function se — wo brief / contract padh ke jawab deta hai.
 *
 * askSidekick(text, ctx) → { text, links:[{label,href}], cards:[campaign card], suggest:[string] }
 * Apply chat se: card par "Apply" → confirm → applyTo() (wahi RPC jo Discover page use karta hai).
 * Hinglish mein pucho to Hinglish mein jawab.
 */
import { api, apiCreator, fn } from "./core";
import { getCreator } from "./auth";
import { applyTo, myApplyProfiles } from "./campaigns";
import {
  needsAction, noteOf, stepOf, groupOf, compLine, delivLine, kindOf, fdate, money, isLive, profileProgress, DECLINED,
} from "./helpers";

const SUPPORT = "mayank@geekcreativeagency.com";

/* ---------- Language ---------- */
const HI_WORDS = /\b(kya|kaise|kab|kaha|kahan|kyu|kyun|mera|meri|mere|mujhe|muje|karna|karo|kar|hai|hain|nahi|nhi|bhai|batao|btao|chahiye|kitna|kitne|paisa|paise|kaun|konsa|kon|wala|wali|abhi|hoga|milega|bhejo|dikhao|samjhao|aur|ya|ki|ka|ke)\b/i;
export const isHi = (q) => /[ऀ-ॿ]/.test(String(q || "")) || HI_WORDS.test(String(q || ""));
const T = (hi, en, h) => (h ? hi : en);

/* ---------- Data (ek chat ke liye 60 sec cache) ---------- */
let cache = { t: 0, mine: null, open: null };
export function forgetSidekickData() {
  cache = { t: 0, mine: null, open: null };
}
async function loadMine() {
  if (cache.mine && Date.now() - cache.t < 60000) return cache.mine;
  const r = await apiCreator("get_my_campaigns");
  const fl = await apiCreator("my_campaign_flows");
  const flows = (!fl.error && fl.data) || {};
  cache.mine = ((!r.error && r.data) || []).map((c) => ({ ...c, _flow: flows[c.participation_id] || null }));
  cache.t = Date.now();
  return cache.mine;
}
async function loadOpen() {
  if (cache.open && Date.now() - cache.t < 60000) return cache.open;
  const c = getCreator();
  const r = c.locked ? { data: [] } : await api("list_open_campaigns");
  cache.open = (!r.error && r.data) || [];
  cache.t = Date.now();
  return cache.open;
}

/* ---------- Helpers ---------- */
const norm = (s) => String(s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
const has = (q, words) => words.some((w) => (w instanceof RegExp ? w.test(q.trim()) : q.includes(w)));
const stepHref = (m) => {
  const base = `/creator/my-campaigns/${m.participation_id}`;
  const s = stepOf(m);
  return s === "applied" || s === "selected" ? base : `${base}/${s}`;
};
const nameOf = (m) => m.campaign || m.name || "Campaign";
const titleOf = (m) => `${m.brand ? m.brand + " · " : ""}${nameOf(m)}`;
/** Sawal mein kisi campaign / brand / product ka naam hai? */
function findByName(q, list, key = (x) => [x.campaign, x.name, x.brand, x.product]) {
  const nq = norm(q);
  let best = null;
  let score = 0;
  for (const x of list) {
    for (const n of key(x)) {
      const nn = norm(n);
      if (nn.length < 3) continue;
      if (nq.includes(nn) && nn.length > score) {
        best = x;
        score = nn.length;
      } else {
        const w = nn.split(" ").filter((p) => p.length > 3 && nq.includes(p));
        if (w.length && w.join(" ").length > score) {
          best = x;
          score = w.join(" ").length;
        }
      }
    }
  }
  return best;
}
/** open campaign → chat card */
export function chatCard(x) {
  const el = x.eligibility || {};
  return {
    id: String(x.campaign_id),
    title: x.name || x.campaign || "Campaign",
    brand: x.brand || "",
    reward: compLine(x),
    deliver: delivLine(x),
    till: x.ends_on ? fdate(x.ends_on) : "",
    eligible: el.eligible === true,
    notEligible: el.eligible === false,
    why: el.eligible === false ? ((el.criteria || []).filter((c) => c.ok === false).map((c) => c.need).filter(Boolean)[0] || "") : "",
    myStage: x.my_stage || null,
    closed: !!x.applications_closed,
    kind: kindOf(x),
  };
}
const canApply = (x) => !x.my_stage && !x.applications_closed;

/* ---------- Intents ---------- */
const I = {
  hello: [/^(hi|hii+|hello|hey|hlo|helo|namaste|yo|good (morning|evening|afternoon))\b/],
  thanks: [/\b(thanks|thank you|thx|ty|shukriya|dhanyavad|great|awesome|nice|ok thanks)\b/],
  who: [/\b(who are you|what are you|your name|tum kaun|aap kaun|kya kar sakte|what can you do|help me|madad)\b/],
  todo: ["attention", "pending", "to do", "todo", "next step", "what next", "next move", "need to do", "action", "kya karna", "aage kya", "baki", "baaki", "kaam"],
  find: ["find", "campaigns for me", "new campaign", "open campaign", "available", "match", "suggest", "recommend", "discover", "koi campaign", "campaign dikhao", "campaign batao", "naye campaign", "latest campaign"],
  apply: [/\bapply\b/, "apply karo", "apply kar", "join campaign", "participate"],
  status: ["status", "my campaign", "meri campaign", "mere campaign", "update", "selected", "select hua", "shortlist", "result", "kab tak", "approved"],
  profile: ["profile", "complete my", "finish", "percent", "%", "checklist"],
  mediakit: ["media kit", "mediakit", "improve", "portfolio", "showcase"],
  instagram: ["instagram", "insta", " ig ", "reconnect", "connect"],
  whatsapp: ["whatsapp", "whats app", "otp", "number change", "phone number"],
  pay: ["pay", "payment", "money", "paisa", "paise", "upi", "bank", "fee", "earning", "invoice", "kab milega"],
  barter: ["barter", "product", "free product", "gift"],
  paidq: ["paid campaign", "cash"],
  how: ["how does", "how it works", "how bounty", "kaise kaam", "bounty kya", "what is bounty", "process", "steps"],
  eligible: ["eligible", "eligibility", "not eligible", "why can't", "why cant", "kyu nahi", "criteria", "who can apply"],
  brief: ["brief", "script", "hashtag", "caption", "shoot", "filter", "music", "song", "voiceover", "content idea", "guideline"],
  deadline: ["deadline", "due", "last date", "kitne din", "time limit", "late", "blocked", "block"],
  shipping: ["ship", "courier", "tracking", "deliver", "parcel", "dispatch", "kab aayega", "product kab"],
  address: ["address", "pincode", "pin code"],
  contract: ["contract", "agreement", "sign"],
  video: ["video", "draft", "upload", "reel", "drive link", "submit"],
  post: ["post link", "posted", "post kar", "live", "insights", "screenshot"],
  withdraw: ["cancel", "withdraw", "leave campaign", "not interested", "quit", "back out", "nahi karna"],
  stop: ["stop messages", "stop whatsapp", "unsubscribe", "too many messages", "spam"],
  support: ["support", "contact", "email", "human", "team", "complaint", "problem", "issue", "help desk", "baat karni"],
  account: ["delete account", "delete my", "logout", "log out", "sign out", "download my data"],
};
const detect = (q) => Object.keys(I).filter((k) => has(q, I[k]));

/* ---------- Answers ---------- */
async function answerTodo(h) {
  const c = getCreator();
  const links = [];
  const lines = [];
  if (c.locked) {
    const wa = (c.joinNeeds || []).some((n) => /whatsapp/i.test(n));
    lines.push(wa
      ? T("Pehle **WhatsApp link karo** — campaign updates wahin aate hain aur apply khul jata hai.", "First, **link your WhatsApp** — campaign updates come there and it unlocks applying.", h)
      : T("Pehle **Instagram connect karo** — brands apply karte waqt asli reach dekhte hain.", "First, **connect Instagram** — brands check your real reach when you apply.", h));
    links.push(wa ? { label: "Link WhatsApp", href: "/creator/profile/contact" } : { label: "Connect Instagram", href: "/creator/onboarding/meta" });
  }
  const mine = await loadMine();
  const act = mine.filter((m) => needsAction(m));
  act.slice(0, 4).forEach((m) => {
    lines.push(`• **${titleOf(m)}** — ${noteOf(m)}`);
    links.push({ label: nameOf(m), href: stepHref(m) });
  });
  if (!act.length && !c.locked) {
    const waiting = mine.filter((m) => groupOf(m) === "waiting").length;
    const running = mine.filter((m) => groupOf(m) === "running").length;
    lines.push(T(
      `Abhi aapki taraf se koi kaam baaki nahi hai ✅${running ? ` ${running} campaign chal rahe hain — agla update WhatsApp pe aayega.` : ""}${waiting ? ` ${waiting} application brand ke paas hai.` : ""}`,
      `Nothing is waiting on you right now ✅${running ? ` ${running} campaign${running > 1 ? "s are" : " is"} running — the next update comes on WhatsApp.` : ""}${waiting ? ` ${waiting} application${waiting > 1 ? "s are" : " is"} with the brand.` : ""}`, h));
  }
  const prog = profileProgress(c.req ? { items: c.req.items } : null, c.profile, c.hasIg);
  if (prog && !prog.complete) {
    lines.push(T(`Profile ${prog.pct}% complete hai — baaki: ${prog.missing.slice(0, 3).join(", ")}.`, `Your profile is ${prog.pct}% complete — still missing: ${prog.missing.slice(0, 3).join(", ")}.`, h));
    links.push({ label: T("Profile poora karo", "Finish profile", h), href: "/creator/profile/finish" });
  }
  return { text: lines.join("\n"), links };
}

async function answerFind(q, h, { limit = 3 } = {}) {
  const c = getCreator();
  if (c.locked) return answerLocked(h);
  const open = await loadOpen();
  const fresh = open.filter(canApply);
  const elig = fresh.filter((x) => (x.eligibility || {}).eligible === true);
  const unknown = fresh.filter((x) => (x.eligibility || {}).eligible == null);
  let pick = [...elig, ...unknown];
  // "paid" / "barter" / city / category filter
  if (/\bpaid|cash|paisa|paise\b/.test(q)) pick = pick.filter((x) => ["paid", "barter_paid"].includes(kindOf(x)));
  if (/\bbarter|product\b/.test(q)) pick = pick.filter((x) => ["barter", "barter_paid"].includes(kindOf(x)));
  const named = findByName(q, open, (x) => [x.category, ...(x.cities || []), x.brand, x.name]);
  if (named) {
    const nn = norm(named.category);
    const byCat = pick.filter((x) => norm(x.category) === nn || (x.cities || []).some((ct) => norm(q).includes(norm(ct))) || x.campaign_id === named.campaign_id);
    if (byCat.length) pick = byCat;
  }
  if (!pick.length) {
    const applied = open.filter((x) => x.my_stage).length;
    return {
      text: fresh.length
        ? T("Abhi ke open campaigns aapke profile se match nahi ho rahe. Profile (city, category, followers) poora rakho — naye campaign aate hi WhatsApp pe batayenge.", "None of the open campaigns match your profile right now. Keep your profile (city, category, followers) complete — we'll tell you on WhatsApp when new ones open.", h)
        : T(`Abhi koi naya campaign open nahi hai${applied ? ` (aap ${applied} mein pehle se ho)` : ""}. Naya aate hi WhatsApp pe update milega.`, `There are no new campaigns open right now${applied ? ` (you're already in ${applied})` : ""}. You'll get a WhatsApp update when one opens.`, h),
      links: [{ label: "Discover", href: "/creator/discover" }],
    };
  }
  return {
    text: T(`Ye ${Math.min(limit, pick.length)} campaign aapke liye sahi lagte hain — **Apply** dabao, main yahin se apply kar dunga:`, `These ${Math.min(limit, pick.length)} campaign${pick.length > 1 ? "s look" : " looks"} right for you — tap **Apply** and I'll apply for you right here:`, h),
    cards: pick.slice(0, limit).map(chatCard),
    links: pick.length > limit ? [{ label: T(`Saare ${pick.length} dekho`, `See all ${pick.length}`, h), href: "/creator/discover" }] : [],
  };
}

async function answerApply(q, h) {
  const c = getCreator();
  if (c.locked) return answerLocked(h);
  const open = await loadOpen();
  const x = findByName(q, open);
  if (!x) return answerFind(q, h);
  const card = chatCard(x);
  if (x.my_stage) {
    const mine = await loadMine();
    const m = mine.find((y) => String(y.campaign_id) === String(x.campaign_id));
    return { text: T(`Aap **${card.title}** mein pehle se ho — ${m ? noteOf(m) : "status My campaigns mein hai"}.`, `You're already in **${card.title}** — ${m ? noteOf(m) : "see the status in My campaigns"}.`, h), links: m ? [{ label: T("Kholo", "Open", h), href: stepHref(m) }] : [] };
  }
  if (x.applications_closed) return { text: T(`**${card.title}** ke applications band ho gaye hain.`, `Applications for **${card.title}** are closed.`, h), links: [{ label: "Discover", href: "/creator/discover" }] };
  if (card.notEligible)
    return { text: T(`**${card.title}** ke liye abhi aap eligible nahi ho${card.why ? " — " + card.why : ""}. Profile aur Instagram updated rakho, eligibility apne aap badal jati hai.`, `You're not eligible for **${card.title}** yet${card.why ? " — " + card.why : ""}. Keep your profile and Instagram updated; eligibility updates by itself.`, h), cards: [card], suggest: [T("Mere liye campaign dhundo", "Find campaigns for me", h)] };
  return { text: T(`**${card.title}** — ye raha. Neeche **Apply** dabao:`, `Here's **${card.title}**. Tap **Apply** below:`, h), cards: [card] };
}

function answerLocked(h) {
  const c = getCreator();
  const wa = (c.joinNeeds || []).some((n) => /whatsapp/i.test(n));
  return wa
    ? { text: T("Apply karne ke liye pehle WhatsApp link karna hoga — 1 minute lagta hai.", "To apply, link your WhatsApp first — it takes a minute.", h), links: [{ label: "Link WhatsApp", href: "/creator/profile/contact" }] }
    : { text: T("Apply karne ke liye pehle Instagram connect karo — brands aapki asli reach dekhte hain. Data safe rehta hai, hum kabhi post nahi karte.", "To apply, connect Instagram first — brands look at your real reach. Your data stays safe and we never post for you.", h), links: [{ label: "Connect Instagram", href: "/creator/onboarding/meta" }] };
}

async function answerStatus(q, h) {
  const mine = await loadMine();
  if (!mine.length) return { text: T("Abhi aap kisi campaign mein nahi ho. Chalo ek dhundte hain?", "You're not in any campaign yet. Shall we find one?", h), suggest: [T("Mere liye campaign dhundo", "Find campaigns for me", h)] };
  const one = findByName(q, mine);
  const list = one ? [one] : mine.filter(isLive).slice(0, 5);
  if (!list.length) {
    const done = mine.filter((m) => m.stage === "completed").length;
    return { text: T(`Abhi koi campaign chal nahi raha. ${done} campaign complete ho chuke hain 🎉`, `No campaign is running right now. ${done} campaign${done === 1 ? " is" : "s are"} completed 🎉`, h), links: [{ label: "My campaigns", href: "/creator/my-campaigns" }] };
  }
  return {
    text: list.map((m) => `• **${titleOf(m)}** — ${DECLINED.includes(m.stage) ? T("is baar select nahi hua", "not selected this time", h) : noteOf(m)}`).join("\n"),
    links: list.slice(0, 3).map((m) => ({ label: nameOf(m), href: stepHref(m) })),
  };
}

function answerProfile(h) {
  const c = getCreator();
  const prog = profileProgress(c.req ? { items: c.req.items } : null, c.profile, c.hasIg);
  if (!prog) return { text: T("Profile kholo — wahan har step dikh jayega.", "Open your profile — every step is listed there.", h), links: [{ label: "Profile", href: "/creator/profile" }] };
  if (prog.complete) return { text: T("Aapka profile 100% complete hai ✅ Brands complete profile ko pehle chunte hain.", "Your profile is 100% complete ✅ Brands pick complete profiles first.", h), links: [{ label: "Media kit", href: "/creator/media-kit" }] };
  return {
    text: T(`Profile **${prog.pct}%** complete hai. Baaki hai:\n${prog.missing.slice(0, 5).map((x) => "• " + x).join("\n")}\nComplete profile wale creators pehle select hote hain.`,
      `Your profile is **${prog.pct}%** complete. Still to do:\n${prog.missing.slice(0, 5).map((x) => "• " + x).join("\n")}\nCreators with complete profiles get picked first.`, h),
    links: [{ label: T("Abhi poora karo", "Finish now", h), href: "/creator/profile/finish" }],
  };
}

function answerInstagram(h) {
  const c = getCreator();
  const ig = (c.igAccounts || [])[0];
  if (ig && ig.username)
    return { text: T(`Instagram **@${ig.username}** connected hai ✅ Followers aur posts apne aap sync hote hain. Kuch galat dikhe to reconnect kar lo.`, `Instagram **@${ig.username}** is connected ✅ Followers and posts sync on their own. If something looks off, reconnect.`, h), links: [{ label: "Media kit", href: "/creator/media-kit" }, { label: T("Reconnect", "Reconnect", h), href: "/creator/onboarding/meta" }] };
  return { text: T("Instagram abhi connect nahi hai. Connect karne se aapka media kit apne aap banta hai aur brands asli reach dekhte hain. Professional (Creator/Business) account chahiye. Hum kabhi aapki taraf se post nahi karte.", "Instagram isn't connected yet. Connecting builds your media kit automatically and lets brands see your real reach. You need a Professional (Creator/Business) account. We never post on your behalf.", h), links: [{ label: "Connect Instagram", href: "/creator/onboarding/meta" }] };
}

async function answerPay(h) {
  const mine = await loadMine();
  const paid = mine.filter((m) => m._flow && m._flow.paid);
  const lines = [];
  paid.slice(0, 4).forEach((m) => {
    const p = m._flow.payment || {};
    const st = p.status === "paid" ? T("paid ✅", "paid ✅", h) : ["pending", "failed", "needs_update"].includes(p.details_status) ? T("UPI/bank details chahiye", "needs your UPI/bank details", h) : T("pending — post verify hone ke baad", "pending — released after your post is verified", h);
    lines.push(`• **${titleOf(m)}**${p.amount ? " · " + money(p.amount) : ""} — ${st}`);
  });
  return {
    text: (lines.length ? lines.join("\n") + "\n" : T("Abhi koi paid campaign nahi hai. ", "You have no paid campaign yet. ", h)) +
      T("Payment post verify hone ke baad aata hai. Agreement sign hote hi Payments mein UPI ya bank details daal do. Barter campaign mein product hi reward hota hai.", "Payment is released after your post is verified. Add your UPI or bank details in Payments once the agreement is signed. In barter campaigns the product is the reward.", h),
    links: [{ label: "Payments", href: "/creator/payments" }],
  };
}

/** Ek campaign ke andar ka sawal → backend (brief, contract, deadline, tracking padh ke) */
async function answerFromBackend(q, history) {
  const msgs = [...(history || []).slice(-6).map((m) => ({ role: m.me ? "user" : "assistant", content: m.text })), { role: "user", content: q }];
  const r = await fn("ai-chat", { messages: msgs, context: { role: "creator" } });
  if (r.error || !r.data || !r.data.reply) return null;
  return { text: String(r.data.reply), suggest: (r.data.suggestions || []).slice(0, 3) };
}

const FAQ = {
  how: (h) => ({
    text: T("Bounty aise kaam karta hai:\n1. **Discover** mein campaign dekho aur apply karo\n2. Brand select kare to agreement sign karo\n3. Barter mein address confirm karo — product ghar aata hai\n4. Brief padh ke video banao aur upload karo\n5. Approve hote hi Instagram pe post karo aur link daalo\n6. Post verify → campaign complete (paid mein payment)",
      "Here's how Bounty works:\n1. Browse campaigns in **Discover** and apply\n2. If the brand picks you, sign the agreement\n3. For barter, confirm your address — the product comes home\n4. Read the brief, shoot your video and upload it\n5. Once approved, post on Instagram and add the link\n6. Post verified → campaign complete (paid ones get paid)", h),
    links: [{ label: "Discover", href: "/creator/discover" }],
  }),
  barter: (h) => ({ text: T("**Barter** = brand ka product free milta hai, badle mein video/post. **Barter + Paid** = product bhi aur payment bhi. **Paid** = sirf payment. Har campaign card pe reward likha hota hai.", "**Barter** = you get the brand's product free in return for a video/post. **Barter + Paid** = product plus payment. **Paid** = payment only. Every campaign card shows its reward.", h), links: [{ label: "Discover", href: "/creator/discover" }] }),
  eligible: (h) => ({ text: T("Har campaign ki apni shartein hoti hain — followers, city, category, gender ya age. Campaign kholo → **Who can apply** mein dikhega kaunsi shart poori nahi hui. Profile aur Instagram updated rakho, eligibility apne aap badal jati hai.", "Each campaign has its own rules — followers, city, category, gender or age. Open the campaign → **Who can apply** shows which rule you don't meet. Keep your profile and Instagram updated; eligibility updates by itself.", h), links: [{ label: T("Profile check karo", "Check profile", h), href: "/creator/profile" }] }),
  deadline: (h) => ({ text: T("Video ki deadline product **delivery ke baad** shuru hoti hai (paid mein brief milne ke baad) — din agreement mein likhe hote hain. Time pe video na aaye to account block ho sakta hai aur fee nahi milti. Zyada time chahiye to deadline se pehle team ko batao.", "The video deadline starts **after delivery** (after the brief for paid campaigns) — the number of days is in your agreement. If the video isn't in on time, your account can be blocked and no fee is paid. Need more time? Tell the team before the deadline.", h), links: [{ label: "My campaigns", href: "/creator/my-campaigns" }] }),
  withdraw: (h) => ({ text: T("Campaign chhodna hai to campaign kholo aur team ko message karo. Agreement sign ya product milne ke baad chhodne par product wapas karna pad sakta hai — pehle team se baat kar lo.", "To leave a campaign, open it and message the team. After signing the agreement or receiving the product, you may need to return the product — talk to the team first.", h), links: [{ label: "Inbox", href: "/creator/messages" }] }),
  stop: (h) => ({ text: T("WhatsApp messages band karne ke liye kisi bhi message pe **STOP** reply karo. Ek campaign ke reminder band karne ho to us message ka **Not interested** dabao. Settings mein bhi updates on/off kar sakte ho.", "To stop WhatsApp messages, reply **STOP** to any message. To stop reminders for one campaign, tap **Not interested** on that message. You can also turn updates on/off in Settings.", h), links: [{ label: "Settings", href: "/creator/settings" }] }),
  whatsapp: (h) => ({ text: T("Login WhatsApp OTP se hota hai. Number badalna ho to Profile → Contact mein naya number OTP se link karo.", "You sign in with a WhatsApp OTP. To change your number, link the new one in Profile → Contact with an OTP.", h), links: [{ label: "Contact details", href: "/creator/profile/contact" }] }),
  support: (h) => ({ text: T(`Team se baat karni hai? Inbox mein message karo ya email karo: **${SUPPORT}**. Campaign wale WhatsApp message pe reply bhi team tak pahunchta hai.`, `Need the team? Message us in your Inbox or email **${SUPPORT}**. Replies to campaign WhatsApp messages also reach the team.`, h), links: [{ label: "Inbox", href: "/creator/messages" }] }),
  account: (h) => ({ text: T("Logout, data download aur account delete — sab **Settings** mein hai.", "Log out, download your data and delete your account — all in **Settings**.", h), links: [{ label: "Settings", href: "/creator/settings" }] }),
  mediakit: (h) => ({ text: T("Media kit behtar karne ke liye: 1–2 best posts pin karo, bio aur city daalo, rate card bharo. Brands saaf media kit wale creators ko zyada kholte hain.", "To improve your media kit: pin your 1–2 best posts, add a bio and city, and fill your rate card. Brands open clear media kits far more often.", h), links: [{ label: "Media kit", href: "/creator/media-kit" }] }),
};

const MENU = (h) => [T("Mujhe kya karna hai?", "What needs my attention?", h), T("Mere liye campaign dhundo", "Find campaigns for me", h), T("Meri campaigns ka status", "My campaign status", h), T("Profile kaise poora karu?", "How do I finish my profile?", h)];

/**
 * Main: sawal → jawab. history = pichhle chat messages ({me, text}).
 */
export async function askSidekick(text, { history = [] } = {}) {
  const raw = String(text || "").trim();
  const q = " " + raw.toLowerCase() + " ";
  const h = isHi(raw);
  const c = getCreator();
  const first = (c.profile && c.profile.personal && c.profile.personal.first_name) || "";
  const it = detect(q);
  try {
    if (!raw) return { text: "", suggest: MENU(h) };
    if (it.includes("hello") && raw.split(/\s+/).length <= 3)
      return { text: T(`Hey ${first || "dost"}! 👋 Main aapka sidekick hoon — campaign dhundna, apply karna, status, brief, payment, profile — kuch bhi pucho.`, `Hey ${first || "there"}! 👋 I'm your sidekick — finding and applying to campaigns, status, briefs, payments, your profile — ask me anything.`, h), suggest: MENU(h) };
    if (it.includes("thanks") && raw.split(/\s+/).length <= 4) return { text: T("Koi baat nahi! 🌿 Aur kuch?", "Anytime! 🌿 Anything else?", h), suggest: MENU(h) };
    if (it.includes("who")) return { text: T("Main aapka Bounty sidekick hoon. Main aapke asli campaigns aur profile dekh ke batata hoon: kya karna baaki hai, kaunse campaign aapke liye sahi hain (yahin se apply bhi), har campaign ka status, brief, deadline, courier, payment aur profile kaise poora karna hai.", "I'm your Bounty sidekick. I look at your real campaigns and profile and tell you what's left to do, which campaigns fit you (and apply right here), each campaign's status, brief, deadline, courier, payment and how to finish your profile.", h), suggest: MENU(h) };

    if (it.includes("apply") && !it.includes("eligible")) return await answerApply(q, h);
    if (it.includes("find")) return await answerFind(q, h);
    if (it.includes("todo")) return await answerTodo(h);
    if (it.includes("stop")) return FAQ.stop(h);
    if (it.includes("account")) return FAQ.account(h);
    if (it.includes("how") && !findByName(q, await loadMine())) return FAQ.how(h);

    // kisi meri campaign ka naam hai, ya campaign ke andar ka sawal → backend jo brief / contract padhta hai
    const mine = await loadMine();
    const named = findByName(q, mine);
    const inCampaign = ["brief", "deadline", "shipping", "address", "contract", "video", "post"].some((k) => it.includes(k));
    if (named && it.includes("status") && !inCampaign) return await answerStatus(q, h);
    if ((named || inCampaign) && mine.length) {
      const b = await answerFromBackend(raw, history);
      if (b) {
        const m = named || mine.find((x) => needsAction(x)) || mine.find(isLive);
        return { ...b, links: m ? [{ label: nameOf(m), href: stepHref(m) }] : [] };
      }
    }
    if (it.includes("status")) return await answerStatus(q, h);
    if (it.includes("pay") && !it.includes("barter")) return await answerPay(h);
    if (it.includes("eligible")) return FAQ.eligible(h);
    if (it.includes("barter") || it.includes("paidq")) return FAQ.barter(h);
    if (it.includes("deadline")) return FAQ.deadline(h);
    if (it.includes("whatsapp")) return FAQ.whatsapp(h);
    if (it.includes("instagram")) return answerInstagram(h);
    if (it.includes("mediakit")) return FAQ.mediakit(h);
    if (it.includes("profile")) return answerProfile(h);
    if (it.includes("withdraw")) return FAQ.withdraw(h);
    if (it.includes("support")) return FAQ.support(h);
    if (it.includes("how")) return FAQ.how(h);
    if (inCampaign && !mine.length) return { text: T("Abhi aap kisi campaign mein nahi ho — pehle ek campaign mein apply karo, phir brief, deadline sab yahin bataunga.", "You're not in a campaign yet — apply to one first, then I'll explain the brief, deadline and everything here.", h), suggest: [T("Mere liye campaign dhundo", "Find campaigns for me", h)] };

    // naam kisi open campaign ka hai? → wahi card
    const openNamed = findByName(q, await loadOpen());
    if (openNamed) return await answerApply(q, h);

    return {
      text: T("Ye mujhe pakka nahi pata 🤔 Main campaigns, apply, status, brief, deadline, courier, payment, profile aur Instagram mein madad karta hoon. Team se baat karni ho to Inbox mein message karo.",
        "I'm not sure about that one 🤔 I can help with campaigns, applying, status, briefs, deadlines, courier, payments, your profile and Instagram. To reach the team, message us in your Inbox.", h),
      links: [{ label: "Inbox", href: "/creator/messages" }],
      suggest: MENU(h),
    };
  } catch {
    return { text: T("Abhi data load nahi ho paya — ek baar fir pucho.", "I couldn't load your data just now — please ask again.", h), suggest: MENU(h) };
  }
}

/** Chat se apply (card ka "Apply" → confirm ke baad). → { ok, text, href? } */
export async function sidekickApply(card, h = false) {
  let profile = null;
  try {
    const p = await myApplyProfiles();
    profile = (p[0] && p[0].handle) || null;
  } catch {
    profile = null;
  }
  const r = await applyTo(card.id, profile);
  forgetSidekickData();
  if (r.ok) return { ok: true, text: T(`Ho gaya! ✅ **${card.title}** mein apply kar diya. Team aapka profile dekhegi — update WhatsApp pe aayega.`, `Done! ✅ You've applied to **${card.title}**. The team will review your profile — you'll get the update on WhatsApp.`, h), href: "/creator/my-campaigns" };
  if (r.notEligible) {
    const why = ((r.notEligible.criteria || []).filter((c) => c.ok === false).map((c) => c.need).filter(Boolean)).slice(0, 2).join(", ");
    return { ok: false, text: T(`Is campaign ke liye abhi eligible nahi ho${why ? " — " + why : ""}.`, `You're not eligible for this one yet${why ? " — " + why : ""}.`, h), href: `/creator/discover/${card.id}` };
  }
  return { ok: false, text: T(`Apply nahi ho paya: ${r.error}. Campaign page se try karo.`, `Couldn't apply: ${r.error}. Try from the campaign page.`, h), href: `/creator/discover/${card.id}` };
}

/** Sheet ka "Next up" — asli: lock → connect; meri baari wala campaign; warna profile / discover */
export async function sidekickNext() {
  const c = getCreator();
  if (c.locked) {
    const wa = (c.joinNeeds || []).some((n) => /whatsapp/i.test(n));
    return wa
      ? { title: "Link WhatsApp", sub: "Campaign updates come there, and it unlocks applying.", label: "Link now", href: "/creator/profile/contact" }
      : { title: "Connect Instagram", sub: "Campaigns unlock once brands can see your real reach.", label: "Connect now", href: "/creator/onboarding/meta" };
  }
  const mine = await loadMine();
  const m = mine.filter((x) => needsAction(x))[0];
  if (m) return { title: titleOf(m), sub: noteOf(m), label: "Open campaign", href: stepHref(m) };
  const prog = profileProgress(c.req ? { items: c.req.items } : null, c.profile, c.hasIg);
  if (prog && !prog.complete) return { title: `Finish your profile · ${prog.pct}%`, sub: "Brands pick complete profiles first.", label: "Finish now", href: "/creator/profile/finish" };
  return { title: "Find your next campaign", sub: "New campaigns open every week.", label: "Discover", href: "/creator/discover" };
}
