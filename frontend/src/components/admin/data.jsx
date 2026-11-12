/* Super Admin — dummy data (Figma ke naam/number). Backend jud ne par yahi shape aayega. */

export const CAMPAIGNS = [
  { id: "circle-diwali-paid", name: "Circle Diwali Declutter · Paid", brand: "Circle", type: "Paid", status: "Live", applied: 25, approved: 1, done: "0/1", ends: "07 Nov", risk: "Needs screening" },
  { id: "circle-diwali-barter", name: "Circle Diwali Declutter · Barter", brand: "Circle", type: "Barter", status: "Live", applied: 80, approved: 80, done: "4/80", ends: "07 Nov", risk: "Content deadlines" },
  { id: "snuggles-barter", name: "Snuggles Barter", brand: "Snuggles", type: "Barter", status: "Live", applied: 6, approved: 0, done: "0/6", ends: "19 Nov", risk: "6 awaiting screening" },
  { id: "beardo-festive", name: "Beardo Festive Essential Kit", brand: "Beardo", type: "Barter + Paid", status: "Shortlist", applied: 5, approved: 5, done: "0/5", ends: "08 Nov", risk: "Contract review" },
  { id: "beardo-detan", name: "Beardo Detan Express Kit", brand: "Beardo", type: "Barter", status: "Live", applied: 88, approved: 65, done: "10/88", ends: "15 Nov", risk: "Video reviews" },
  { id: "vaaree-diwali", name: "Vaaree Biggest Diwali Sale", brand: "Vaaree", type: "Barter", status: "Live", applied: 27, approved: 20, done: "8/27", ends: "16 Nov", risk: "On track" },
  { id: "pujo-olio", name: "Pujo with Olio", brand: "Olio Pizza", type: "Barter", status: "Completed", applied: 80, approved: 75, done: "42/80", ends: "31 Oct", risk: "Report ready" },
  { id: "mysore-pizzeria", name: "Mysore Pizzeria Launch", brand: "Olio Pizza", type: "Barter + Paid", status: "Live", applied: 12, approved: 8, done: "2/12", ends: "22 Nov", risk: "Bulk upload", hidden: true },
  { id: "wedding-bells", name: "Wedding bells", brand: "The Wedding Company", type: "Barter", status: "Draft", applied: 0, approved: 0, done: "0/12", ends: "—", risk: "Brief incomplete" },
];
/* hidden: list mein nahi dikhta (Figma list mein 8 hi hain), sirf workspace / bulk upload ke liye */
export const LISTED = CAMPAIGNS.filter((c) => !c.hidden);
export const campaignById = (id) => CAMPAIGNS.find((c) => c.id === id) || CAMPAIGNS[4];

export const CREATORS = [
  { id: "aarav-shah", name: "Aarav Shah", handle: "@aaravcreates", followers: "12.4k", city: "Bengaluru", category: "Lifestyle", ig: true, complete: true },
  { id: "nisha-rao", name: "Nisha Rao", handle: "@nishastories", followers: "28.1k", city: "Mumbai", category: "Beauty", ig: true, complete: true },
  { id: "ritika-sen", name: "Ritika Sen", handle: "@ritika.daily", followers: "9.8k", city: "Kolkata", category: "Fashion", ig: false, complete: false },
  { id: "kabir-mehta", name: "Kabir Mehta", handle: "@kabirfoodtrail", followers: "41.2k", city: "Delhi", category: "Food", ig: true, complete: true },
  { id: "ananya-iyer", name: "Ananya Iyer", handle: "@ananya.travels", followers: "17.6k", city: "Chennai", category: "Travel", ig: true, complete: true },
  { id: "rohan-das", name: "Rohan Das", handle: "@rohanfitlife", followers: "22.3k", city: "Pune", category: "Fitness", ig: true, complete: false },
  { id: "aisha-khan", name: "Aisha Khan", handle: "@aisha.styles", followers: "24.1k", city: "Mumbai", category: "Beauty", ig: true, complete: true },
  { id: "meera-iyer", name: "Meera Iyer", handle: "@meera.makes", followers: "62.4k", city: "Bengaluru", category: "Lifestyle", ig: true, complete: true },
  { id: "pooja-nair", name: "Pooja Nair", handle: "@poojanair", followers: "15.2k", city: "Kochi", category: "Home", ig: true, complete: true },
];
export const creatorById = (id) => CREATORS.find((c) => c.id === id) || CREATORS[1];

export const BRANDS = [
  { id: "beardo", name: "Beardo", campaigns: 2, live: "1 live", creators: 111, posts: 10, login: true },
  { id: "circle", name: "Circle", campaigns: 2, live: "0 live", creators: 115, posts: 5, login: true },
  { id: "snuggles", name: "Snuggles", campaigns: 1, live: "1 live", creators: 6, posts: 0, login: false },
  { id: "vaaree", name: "Vaaree", campaigns: 1, live: "1 live", creators: 27, posts: 0, login: false },
  { id: "olio-pizza", name: "Olio Pizza", campaigns: 2, live: "1 live", creators: 80, posts: 42, login: true },
  { id: "the-wedding-company", name: "The Wedding Company", campaigns: 1, live: "1 live", creators: 1, posts: 0, login: false },
  { id: "yes-madam", name: "Yes Madam", campaigns: 1, live: "1 live", creators: 0, posts: 0, login: false },
];
export const brandById = (id) => BRANDS.find((b) => b.id === id) || BRANDS[0];

/** naam se initials — "Nisha Rao" → "NR" */
export const initials = (n = "") =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** status → badge colour */
export const tone = (s = "") => {
  const t = s.toLowerCase();
  if (/(live|connected|approved|delivered|paid|done|active|on|healthy|sent|complete(d)?$)/.test(t)) return "green";
  if (/(draft|pending|incomplete|transit|medium|waiting|high|review)/.test(t)) return "orange";
  if (/(critical|failed|rejected|overdue|blocked|opted)/.test(t)) return "red";
  if (/(shortlist|instagram|complete)/.test(t)) return "violet";
  return "";
};
