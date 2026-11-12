import { CREATORS } from "@/components/admin/data";

/* Activity + All users ke log (Figma ke naam) */
export const ACT_PEOPLE = [
  { id: "nisha-rao", name: "Nisha Rao", role: "Creator", last: "2 min ago", ago: 2, sessions: 42, time: "1h 12m", mins: 72, pages: 214, cookies: "All", meta: "42 sessions · 12 days · Mumbai · iPhone", timeline: ["4:57 pm · Opened Campaigns", "4:53 pm · Applied to Home Spa", "4:40 pm · Connected Instagram", "4:38 pm · Signed in with WhatsApp"] },
  { id: "kabir-mehta", name: "Kabir Mehta", role: "Creator", last: "14 min ago", ago: 14, sessions: 18, time: "38m", mins: 38, pages: 96, cookies: "Essential", meta: "18 sessions · 9 days · Delhi · Android", timeline: ["4:45 pm · Connected Instagram", "4:41 pm · Signed in with WhatsApp"] },
  { id: "pixel-bloom-media", name: "Pixel Bloom Media", role: "Agency", last: "1 h ago", ago: 60, sessions: 6, time: "22m", mins: 22, pages: 41, cookies: "All", meta: "6 sessions · 1 day · Pune · Chrome on Mac", timeline: ["3:58 pm · Opened Brand CRM", "3:51 pm · Created a workspace", "3:49 pm · Signed up with email"] },
  { id: "ananya-iyer", name: "Ananya Iyer", role: "Creator", last: "1 h ago", ago: 61, sessions: 11, time: "19m", mins: 19, pages: 57, cookies: "No choice", meta: "11 sessions · 6 days · Chennai · iPhone", timeline: ["3:56 pm · Signed in with WhatsApp"] },
  { id: "rohan-das", name: "Rohan Das", role: "Creator", last: "3 h ago", ago: 180, sessions: 9, time: "14m", mins: 14, pages: 33, cookies: "Essential", meta: "9 sessions · 5 days · Pune · Android", timeline: ["1:20 pm · Updated profile", "1:12 pm · Signed in with WhatsApp"] },
];

export const personById = (id) => {
  const p = ACT_PEOPLE.find((x) => x.id === id);
  if (p) return p;
  const c = CREATORS.find((x) => x.id === id);
  if (c) return { id: c.id, name: c.name, role: "Creator", sessions: 4, time: "9m", meta: `4 sessions · 3 days · ${c.city}`, timeline: ["Signed in with WhatsApp"] };
  return ACT_PEOPLE[0];
};

export const ACTIVITY_IDS = [...new Set([...ACT_PEOPLE.map((p) => p.id), ...CREATORS.map((c) => c.id), "beardo"])];
