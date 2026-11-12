/* Action queue, Applications aur Logistics ka dummy data (Figma ke text). */

export const FILTERS = [
  { k: "all", label: "All" },
  { k: "applications", label: "Applications" },
  { k: "content", label: "Content" },
  { k: "contracts", label: "Contracts" },
  { k: "logistics", label: "Logistics" },
  { k: "campaigns", label: "Campaigns" },
  { k: "signups", label: "Account signups" },
];
export const FILTER_LABEL = Object.fromEntries(FILTERS.map((f) => [f.k, f.label]));

/* kind: "review" = Review → drawer, "campaign" = Open brief / Approve & go live, "signup" = Decline / Approve */
export const QUEUE = [
  { id: "circle-diwali-screen", f: "applications", icon: "✍️", title: "Screen new creators for Circle Diwali", count: 25, campaign: "Circle Diwali Declutter · Paid", reason: "25 applicants waiting for a decision", pri: "High", tone: "orange", when: "2 days", cid: "circle-diwali-paid" },
  { id: "video-drafts", f: "content", icon: "▣", title: "Review submitted video drafts", count: 21, campaign: "Beardo Detan Express Kit", reason: "Creator submissions need approval", pri: "Critical", tone: "red", when: "Overdue", cid: "beardo-detan" },
  { id: "snuggles-screen", f: "applications", icon: "♙", title: "Screen applicants for Snuggles", count: 6, campaign: "Snuggles Barter", reason: "All six creators are awaiting review", pri: "High", tone: "orange", when: "17 days", cid: "snuggles-barter" },
  { id: "creator-agreement", f: "contracts", icon: "✒️", title: "Send approved creator agreement", count: 1, campaign: "Beardo Festive Essential Kit", reason: "Terms and deliverables ready to verify", pri: "Medium", tone: "violet", when: "Today", cid: "beardo-festive" },
  { id: "dispatch-kits", f: "logistics", icon: "▣", title: "Dispatch product kits", count: 10, campaign: "Beardo Detan Express Kit", reason: "10 shipments awaiting courier handoff", pri: "High", tone: "orange", when: "1 day", cid: "beardo-detan" },
  { id: "missing-address", f: "logistics", icon: "⌂", title: "Resolve missing delivery address", count: 1, campaign: "Snuggles Barter", reason: "One creator needs a verified shipping destination", pri: "Medium", tone: "violet", when: "Today", cid: "snuggles-barter" },
  { id: "circle-clips", f: "content", icon: "▶️", title: "Review Circle campaign submissions", count: 9, campaign: "Circle Diwali Declutter · Barter", reason: "Several clips ready for sign-off", pri: "High", tone: "orange", when: "3 days", cid: "circle-diwali-barter" },
  { id: "monsoon-menu", f: "campaigns", kind: "campaign", icon: "📣", title: "Approve campaign: Monsoon Menu Launch", count: 1, campaign: "Urban Roots Café · Barter", line: "Urban Roots Café · Barter · 15 creators · submitted by the brand", reason: "The brand submitted a new campaign brief for approval", pri: "High", tone: "orange", when: "Today", cid: "wedding-bells" },
  { id: "pixel-bloom", f: "signups", kind: "signup", icon: "🏢", title: "Pixel Bloom Media wants an agency account", count: 1, campaign: "Agency signup", line: "Agency · signed up today · priya@pixelbloom.in", reason: "A new agency is waiting for workspace access", pri: "Medium", tone: "violet", when: "Today" },
  { id: "urban-roots", f: "signups", kind: "signup", icon: "🏷️", title: "Urban Roots Café wants a brand account", count: 1, campaign: "Brand signup", line: "Brand · signed up today · hello@urbanroots.cafe", reason: "A new brand is waiting for workspace access", pri: "Medium", tone: "violet", when: "Today" },
];
/* "All" tab mein sirf review wale (Figma) */
export const queueFor = (f) => (f === "all" ? QUEUE.filter((q) => !q.kind) : QUEUE.filter((q) => q.f === f));
export const queueItem = (id) => QUEUE.find((q) => q.id === id);

export const CHECKLIST = ["Verified creator/campaign association", "Eligibility and conflict checks", "Contract, disclosure and deliverables", "Prior communication and audit history"];

/* Applications (Figma 006) */
export const APPLICATIONS = [
  { id: "aarav-shah", name: "Aarav Shah", handle: "@aaravcreates", campaign: "Beardo Detan Express Kit", cid: "beardo-detan", type: "Paid", followers: "12.4k", applied: "Today", fit: "Check" },
  { id: "nisha-rao", name: "Nisha Rao", handle: "@nishastories", campaign: "Circle Diwali Declutter", cid: "circle-diwali-barter", type: "Barter", followers: "28.1k", applied: "Today", fit: "Good fit" },
  { id: "ritika-sen", name: "Ritika Sen", handle: "@ritika.daily", campaign: "Vaaree Biggest Diwali Sale", cid: "vaaree-diwali", type: "Paid", followers: "9.8k", applied: "Yesterday", fit: "Good fit" },
  { id: "kabir-mehta", name: "Kabir Mehta", handle: "@kabirfoodtrail", campaign: "Snuggles Barter", cid: "snuggles-barter", type: "Barter", followers: "41.2k", applied: "2 days", fit: "Check" },
  { id: "ananya-iyer", name: "Ananya Iyer", handle: "@ananya.travels", campaign: "Pujo with Olio", cid: "pujo-olio", type: "Paid", followers: "17.6k", applied: "3 days", fit: "Good fit" },
  { id: "rohan-das", name: "Rohan Das", handle: "@rohanfitlife", campaign: "Beardo Detan Express Kit", cid: "beardo-detan", type: "Barter", followers: "22.3k", applied: "4 days", fit: "Good fit" },
];
export const applicationById = (id) => APPLICATIONS.find((a) => a.id === id);

/* Logistics (Figma 049) */
export const SHIP_STEPS = ["Creator approved", "Address verified", "Courier assigned", "In transit", "Delivery confirmed"];
export const SHIP_STATUSES = ["To send", "In transit", "No address", "Received"];
export const SHIPMENTS = [
  { id: "aarav-shah-detan", creator: "Aarav Shah", campaign: "Beardo Detan Express Kit", product: "Detan Express Kit", status: "To send", courier: "—", update: "Awaiting pickup" },
  { id: "nisha-rao-declutter", creator: "Nisha Rao", campaign: "Circle Diwali Declutter", product: "Declutter kit", status: "In transit", courier: "Courier assigned", update: "Today" },
  { id: "ritika-sen-prbox", creator: "Ritika Sen", campaign: "Snuggles Barter", product: "PR box", status: "No address", courier: "—", update: "Needs verification" },
  { id: "kabir-mehta-festive", creator: "Kabir Mehta", campaign: "Beardo Festive Essential Kit", product: "Festive kit", status: "Received", courier: "Delivered", update: "Yesterday" },
  { id: "meera-patel-home", creator: "Meera Patel", campaign: "Vaaree Biggest Diwali Sale", product: "Home set", status: "In transit", courier: "Tracking available", update: "Yesterday" },
];
export const shipmentById = (id) => SHIPMENTS.find((s) => s.id === id);
/* status → timeline mein kitne steps ho chuke */
export const STEP_DONE = { "No address": 1, "To send": 2, "In transit": 4, Received: 5 };

/* Applications → screening queue (Figma 005) */
export const SCREENING = ["circle-diwali-screen", "video-drafts", "snuggles-screen"];
