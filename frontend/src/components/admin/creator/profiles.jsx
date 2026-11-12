/* Creators section ki dummy data — cards view + creator profile drawer */
import { CREATORS } from "@/components/admin/data";

export const CARDS = [
  { id: "asma-fathima", name: "Asma Fathima", handle: "@asmaandfathima", score: "9/10", followers: "1.6K", eng: "6.13%", reel: "₹1K", applied: "0/0", city: "Bengaluru", profile: "Complete", barter: true, joined: 3 },
  { id: "archi-ranka", name: "Archi Ranka", handle: "@ranka_archi19", score: "2/9", followers: "4.3K", eng: "1.42%", reel: "₹2K", applied: "0/0", city: "Pune", profile: "Incomplete", barter: true, joined: 2 },
  { id: "ankush-johal", name: "Ankush Johal", handle: "@ankush_johal", score: "0/9", followers: "516", eng: "33.2%", reel: "—", applied: "0/0", city: "—", profile: "Incomplete", barter: false, joined: 1 },
  { id: "nimisha-c", name: "Nimisha C.", handle: "@nimisha_cath", score: "0/9", followers: "8.6K", eng: "1.39%", reel: "—", applied: "0/0", city: "—", profile: "Incomplete", barter: false, joined: 0 },
];

/* Figma wala poora profile (Asma Fathima) — baaki creators isi shape mein bante hain */
const ASMA = {
  id: "asma-fathima",
  name: "Asma Fathima",
  handle: "@asmaandfathima",
  followers: "1.6K",
  joined: "11 Nov 2026",
  score: "9/10",
  active: "Active 7h ago · iPhone · Essential cookies",
  missing: "Backup email (account recovery)",
  personal: [
    ["Name", "Asma Fathima"],
    ["Gender", "Female"],
    ["Birthday", "29 Feb 1996 · 30 yrs"],
    ["Marital status", "Unmarried"],
    ["Pets", "🐾 Cutlet (cat) · 🐾 Momo (cat)"],
  ],
  contact: [
    ["WhatsApp", "+91 99527•••76 · ON · verified"],
    ["Backup email", "—"],
    ["Home address", "Byrathi Cross, Bengaluru 560077"],
  ],
  professional: [
    ["Niche", "Food, Travel, Lifestyle"],
    ["Languages", "Hindi, English, Tamil"],
    ["Content formats", "Reel, Story, UGC"],
    ["Open to barter", "Yes · ₹1K per Reel"],
  ],
  ig: { followers: "1.6K", following: "3.3K", posts: "60", eng: "6.13%", type: "media creator", connected: "11 Nov", synced: "18h ago", bio: "To know where to travel (in a budget), what to eat… Travel | Food | Life", likes: [30, 51, 109, 148, 213, 35] },
  campaigns: [
    { name: "Home Spa · Yes Madam", applied: "10 Nov", step: "Applied", result: "Waiting", tone: "orange" },
    { name: "Mysore Pizzeria Launch", applied: "11 Nov", step: "Approved", result: "Contract sent", tone: "violet" },
  ],
  intel: [
    ["Category fit", "Food, Travel, Lifestyle"],
    ["Content formats", "Reel, Story, UGC"],
    ["Barter readiness", "Yes"],
    ["Rate indication", "Not shared"],
    ["Performance", "Insufficient data"],
    ["Audience geography", "Insufficient data"],
    ["Reliability", "Insufficient data"],
    ["Brand experience", "Not shared"],
  ],
  activity: {
    stats: [
      ["7h ago", "Last active"],
      ["2", "Active days (30d)"],
      ["3", "Visits"],
      ["0 min", "Time spent"],
    ],
    rows: [
      ["12 Nov, 10:24 am", "Opened the app"],
      ["11 Nov, 11:28 pm", "Instagram connected"],
      ["11 Nov, 11:28 pm", "Cookie choice: essential"],
      ["11 Nov, 11:27 pm", "Login"],
    ],
  },
  kit: { reach: "1.4K", audience: "F 62% · M 38%" },
};

/** id se profile — Figma wale 4 card creators + data.jsx ke creators */
export function profileById(id) {
  if (!id || id === ASMA.id) return ASMA;
  const card = CARDS.find((c) => c.id === id);
  const c = card || CREATORS.find((x) => x.id === id);
  if (!c) return ASMA;
  const city = c.city && c.city !== "—" ? c.city : "—";
  const cat = c.category || "Lifestyle";
  return {
    ...ASMA,
    id: c.id,
    name: c.name,
    handle: c.handle,
    followers: c.followers,
    score: card ? card.score : c.complete ? "9/10" : "5/9",
    personal: [["Name", c.name], ["Gender", "—"], ["Birthday", "—"], ["Marital status", "—"]],
    contact: [["WhatsApp", "+91 98•••••12 · ON · verified"], ["Backup email", "—"], ["Home address", city]],
    professional: [["Niche", cat], ["Languages", "Hindi, English"], ["Content formats", "Reel, Story"], ["Open to barter", card?.barter ? "Yes" : "Not shared"]],
    ig: { ...ASMA.ig, followers: c.followers, eng: card ? card.eng : "4.2%", bio: `${cat} creator from ${city}` },
    intel: ASMA.intel.map(([k, v]) => (k === "Category fit" ? [k, cat] : [k, v])),
  };
}

export const ALL_CREATOR_IDS = [...new Set([...CARDS.map((c) => c.id), ...CREATORS.map((c) => c.id)])];
