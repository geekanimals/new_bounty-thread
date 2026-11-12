// Bounty creator side ka DUMMY data — backend banne par yahan API se aayega.
const I = (n) => `/creater/${n}`;

/* ---------- Logged-in creator ---------- */
export const CREATOR = {
  first: "Shivam",
  name: "Shivam Rathore",
  handle: "@shivam.rathore8907",
  user: "shivam.rathore8907",
  city: "Jaipur",
  bio: "Lifestyle & travel stories from Jaipur 🌿 Hindi · Hinglish",
  avatar: I("avatar.jpg"),
  phone: "+91 89360 96607",
  phoneMasked: "+91 89••• ••607",
  email: "",
  profilePct: 44,
  followers: "12.4K",
  following: "412",
  posts: 86,
  eng: "4.8%",
  reach: "6.2K",
  likes: "540",
  synced: "Synced with Instagram 10s ago · auto-refreshes every 60s",
};

/* ---------- Sidekicks ---------- */
export const SIDEKICKS = [
  { id: "pip", name: "Pip", trait: "Dreamer", img: I("pip.png"), bg: "#e3f1fb" },
  { id: "mochi", name: "Mochi", trait: "Spark", img: I("mochi.png"), bg: "#fde7d6" },
  { id: "sprout", name: "Sprout", trait: "Grower", img: I("sprout.png"), bg: "#e5f3d9" },
  { id: "pebble", name: "Pebble", trait: "Calm", img: I("pebble.png"), bg: "#ebe7f6" },
  { id: "rumi", name: "Rumi", trait: "Explorer", img: I("rumi.png"), bg: "#fde5d8" },
  { id: "dot", name: "Dot", trait: "Helper", img: I("dot.png"), bg: "#e4ecf8" },
];
export const getSidekick = (id) => SIDEKICKS.find((s) => s.id === id) || SIDEKICKS[4];

/* ---------- Setup choices ---------- */
export const CATEGORIES = [
  { id: "food", label: "Food", img: I("cat-food.jpg") },
  { id: "beauty", label: "Beauty", img: I("cat-beauty.jpg") },
  { id: "fashion", label: "Fashion", img: I("cat-fashion.jpg") },
  { id: "fitness", label: "Fitness", img: I("cat-fitness.jpg") },
  { id: "pets", label: "Pets", img: I("cat-pets.jpg") },
  { id: "travel", label: "Travel", img: I("cat-travel.jpg") },
  { id: "lifestyle", label: "Lifestyle", img: I("cat-lifestyle.jpg") },
  { id: "tech", label: "Tech", img: I("cat-tech.jpg") },
  { id: "gaming", label: "Gaming", img: I("cat-gaming.jpg") },
  { id: "parenting", label: "Parenting", img: I("cat-parenting.jpg") },
  { id: "home", label: "Home & Decor", img: I("cat-home.jpg") },
  { id: "education", label: "Education", img: I("cat-education.jpg") },
];
export const FORMATS = ["Reels", "Stories", "Carousels", "UGC videos"];
export const LANGUAGES = ["Hindi", "Hinglish", "English", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Odia", "Assamese", "Urdu"];

export const DREAM_BRANDS = [
  { id: "nike", name: "Nike", cat: "Sports", img: I("brand-nike.jpg") },
  { id: "nykaa", name: "Nykaa", cat: "Beauty", img: I("brand-nykaa.jpg") },
  { id: "boat", name: "boAt", cat: "Audio", img: I("brand-boat.jpg") },
  { id: "beardo", name: "Beardo", cat: "Grooming", img: I("brand-beardo.jpg") },
  { id: "snuggles", name: "Snuggles", cat: "Pets", img: I("brand-snuggles.jpg") },
  { id: "circle", name: "Circle", cat: "Lifestyle", img: I("brand-circle.jpg") },
];

export const COLLAB_TYPES = [
  { id: "barter", label: "Barter", note: "Products or experiences in return for content", icon: "🎁" },
  { id: "paid", label: "Paid", note: "A cash fee for your creative work", icon: "₹" },
  { id: "hybrid", label: "Hybrid", note: "A mix of product and payment", icon: "🎁+₹" },
  { id: "discuss", label: "Open to discuss", note: "", icon: "💬" },
];

export const SKILLS = ["Modelling", "Live / Video Creator", "Video Editor", "Photographer", "Draw / Paint / Doodle", "Performance Arts", "Content Writer", "Singer", "Dancer", "Anchor / Host", "Voice-over", "Comedy"];
export const RESOURCES = ["Studio / Dslr Setup", "Camera", "Car", "Bike", "Digital Makeup", "Shooting Space", "Caregiver", "Tripod", "Phone", "Speaker", "Mike", "Lights"];

/* ---------- Campaigns ---------- */
export const CAMPAIGNS = [
  {
    id: "home-spa",
    title: "Home Spa",
    brand: "Yes Madam",
    type: "hybrid",
    reward: "₹1,971 + product",
    rewardKit: "₹1,971 + product kit",
    rewardNote: "Payment + product",
    worth: "₹1,971",
    deliver: "1 Reel + 1 Story",
    who: "At least 100,000 Instagram followers • Based in pune • Category: mega or macros only",
    short: "pune • mega or macros only",
    city: "pune",
    till: "",
    img: I("camp-homespa.jpg"),
    eligible: false,
    why: "Needs 100K+ followers — you have 12.4K.",
    deadline: "7 days after delivery",
    usage: "1 month",
    collab: "Required",
    excl: "None",
  },
  {
    id: "mysore-pizzeria",
    title: "Mysore Pizzeria Launch",
    brand: "Olio Pizza",
    type: "hybrid",
    reward: "product",
    rewardKit: "Product + ₹1,500",
    rewardNote: "Meal for 2 + payment",
    worth: "₹1,500",
    deliver: "1 Reel + 1 Story + 1 District review",
    who: "At least 10,000 Instagram followers • Based in mysore, bangalore • Category: travel",
    short: "mysore • travel",
    city: "mysore, bangalore",
    till: "20 Nov 2026",
    img: I("cat-travel.jpg"),
    eligible: false,
    why: "For creators based in Mysore or Bangalore.",
    deadline: "5 days after visit",
    usage: "2 months",
    collab: "Required",
    excl: "None",
  },
  {
    id: "wedding-season",
    title: "Wedding Season Invitation",
    brand: "The Wedding Company",
    type: "barter",
    reward: "Products worth ₹2,000",
    rewardKit: "Products worth ₹2,000",
    rewardNote: "Wedding hamper",
    worth: "₹2,000",
    deliver: "1 Reel + 1 Story",
    who: "At least 1,000 Instagram followers • Based in delhi • Mass Barter",
    short: "delhi • Mass Barter",
    city: "delhi, delhi NCR",
    till: "11 Dec 2026",
    img: I("cat-home.jpg"),
    eligible: false,
    why: "For creators based in Delhi NCR.",
    deadline: "7 days after delivery",
    usage: "1 month",
    collab: "Required",
    excl: "None",
  },
  {
    id: "snuggles-barter",
    title: "Snuggles Barter",
    brand: "Snuggles",
    type: "barter",
    reward: "Products worth ₹2,000",
    rewardKit: "Products worth ₹2,000",
    rewardNote: "Pet treats & toys",
    worth: "₹2,000",
    deliver: "1 Reel + 1 Story",
    who: "At least 1,000 Instagram followers • Based in jaipur, hyderabad • Pets",
    short: "jaipur • Pets",
    city: "jaipur, hyderabad",
    till: "19 Nov 2026",
    img: I("cat-pets.jpg"),
    eligible: true,
    deadline: "7 days after delivery",
    usage: "1 month",
    collab: "Required",
    excl: "None",
  },
  {
    id: "beardo-detan",
    title: "Beardo Barter Campaign - Detan Express Kit",
    brand: "Beardo",
    type: "barter",
    reward: "Products worth ₹1,073",
    rewardKit: "Products worth ₹1,073",
    rewardNote: "De-Tan express kit",
    worth: "₹1,073",
    deliver: "1 Reel",
    who: "At least 1,000 Instagram followers • Mass Barter",
    short: "Mass Barter",
    city: "All India",
    till: "15 Nov 2026",
    img: I("camp-beardo.jpg"),
    eligible: true,
    deadline: "5 days after delivery",
    usage: "1 month",
    collab: "Required",
    excl: "None",
  },
  {
    id: "vaaree-diwali",
    title: "Vaaree Biggest Diwali Sale",
    brand: "Vaaree",
    type: "barter",
    reward: "Products worth ₹2,000",
    rewardKit: "Products worth ₹2,000",
    rewardNote: "Home decor products",
    worth: "₹2,000",
    deliver: "1 Reel + 1 Story",
    who: "At least 10,000 Instagram followers • Based in delhi • Mass Barter",
    short: "delhi • Mass Barter",
    city: "delhi, delhi NCR",
    till: "16 Nov 2026",
    img: I("camp-homespa.jpg"),
    eligible: false,
    why: "For creators based in Delhi NCR.",
    deadline: "7 days after delivery",
    usage: "1 month",
    collab: "Required",
    excl: "None",
  },
  {
    id: "nykaa-glow",
    title: "Nykaa Festive Glow Reel",
    brand: "Nykaa",
    type: "paid",
    reward: "₹6,000 fee",
    rewardKit: "₹6,000",
    rewardNote: "Paid within 7 days of posting",
    worth: "₹6,000",
    deliver: "1 Reel + 2 Stories",
    who: "At least 10,000 Instagram followers • All India • Lifestyle, Beauty",
    short: "All India • Lifestyle",
    city: "All India",
    till: "22 Nov 2026",
    img: I("cat-beauty.jpg"),
    eligible: true,
    deadline: "5 days after selection",
    usage: "3 months",
    collab: "Required",
    excl: "7 days (beauty)",
  },
  {
    id: "boat-beats",
    title: "boAt Festive Beats",
    brand: "boAt",
    type: "paid",
    reward: "₹8,000 fee",
    rewardKit: "₹8,000",
    rewardNote: "Paid within 7 days of posting",
    worth: "₹8,000",
    deliver: "1 Reel",
    who: "At least 10,000 Instagram followers • All India • Tech, Lifestyle",
    short: "All India • Tech",
    city: "All India",
    till: "28 Nov 2026",
    img: I("cat-tech.jpg"),
    eligible: true,
    deadline: "7 days after delivery",
    usage: "2 months",
    collab: "Optional",
    excl: "None",
  },
];
export const getCampaign = (id) => CAMPAIGNS.find((c) => c.id === id);

export const TYPE_LABEL = { barter: "Barter", paid: "Paid", hybrid: "Hybrid" };
export const TYPE_ICON = { barter: "🎁 Barter", paid: "💰 Paid", hybrid: "🎁 Barter + 💰 Paid" };

export const BRIEF = {
  deliverables: ["1 Reel (30–60 sec) + 1 Story with link sticker", "Tag the brand and use the collab post"],
  steps: ["Post within 7 days of receiving the product", "Submit your draft — the brand approves it before you post", "Ad rights: 1 month (brand can boost your Reel)", "Add the brand as an Instagram collaborator"],
  terms: ["Paid: your fee is written into your own agreement", "Disclose the collaboration (Paid partnership / #ad) as per ASCI"],
  journey: ["Apply", "Get selected", "Receive kit", "Create", "Your analytics"],
};

/* ---------- My campaigns (after Apply) ---------- */
export const STEPS = [
  { key: "applied", label: "Applied" },
  { key: "selected", label: "Selected" },
  { key: "agreement", label: "Agreement" },
  { key: "address", label: "Address" },
  { key: "package", label: "Package" },
  { key: "draft", label: "Draft" },
  { key: "post", label: "Post" },
  { key: "verified", label: "Verified" },
  { key: "paid", label: "Paid" },
];

export const MY_CAMPAIGNS = [
  { id: "nykaa-glow", stage: "agreement", group: "running", note: "Selected by Nykaa — review & sign your agreement", date: "Selected today" },
  { id: "snuggles-barter", stage: "package", group: "running", note: "Package shipped — Delhivery #DL8824113", date: "Shipped 9 Nov" },
  { id: "beardo-detan", stage: "draft", group: "running", note: "Revision requested — show the face wash in the first 3 sec", date: "Draft sent 8 Nov", revision: true },
  { id: "boat-beats", stage: "applied", group: "waiting", note: "Applied — brand is reviewing creators", date: "Applied 10 Nov" },
  { id: "home-spa", stage: "applied", group: "not", note: "Not eligible — needs 100K+ followers", date: "Applied 2 Nov", notSelected: true },
  { id: "vaaree-diwali", stage: "paid", group: "done", note: "Post verified 🎉 · products worth ₹2,000", date: "Completed 30 Oct" },
];
export const getMyCampaign = (id) => MY_CAMPAIGNS.find((m) => m.id === id);

/* ---------- Payments ---------- */
export const EARNINGS = { total: "₹14,500", paid: "₹8,500", pending: "₹6,000", products: 4 };
export const PAYOUTS = [
  { id: "p1", title: "Nykaa Festive Glow Reel", note: "Releases 7 days after your post is verified", amount: "₹6,000", status: "pending", date: "Expected 2 Dec" },
  { id: "p2", title: "Vaaree Biggest Diwali Sale", note: "Products worth ₹2,000 · delivered", amount: "Products", status: "product", date: "30 Oct" },
  { id: "p3", title: "Mamaearth Monsoon Reel", note: "UPI · shivam@okhdfc", amount: "₹5,000", status: "paid", date: "18 Oct" },
  { id: "p4", title: "Lenskart Weekend Story", note: "UPI · shivam@okhdfc", amount: "₹3,500", status: "paid", date: "2 Oct" },
  { id: "p5", title: "Bombay Shaving Kit", note: "Products worth ₹1,200 · delivered", amount: "Products", status: "product", date: "21 Sep" },
];

/* ---------- Alerts / notifications ---------- */
export const ALERTS = [
  { id: 1, kind: "action", icon: "✍️", title: "Nykaa selected you!", text: "Review & sign your agreement to start", time: "10 min", href: "/creater/my-campaigns/nykaa-glow", unread: true },
  { id: 2, kind: "action", icon: "🔁", title: "Beardo asked for a small change", text: "Show the face wash in the first 3 sec", time: "1 h", href: "/creater/my-campaigns/beardo-detan", unread: true },
  { id: 3, kind: "update", icon: "📦", title: "Your Snuggles package is on the way", text: "Delhivery #DL8824113 · arriving 13 Nov", time: "Yesterday", href: "/creater/my-campaigns/snuggles-barter", unread: true },
  { id: 4, kind: "update", icon: "✨", title: "2 new campaigns match you", text: "Nykaa Festive Glow Reel, boAt Festive Beats", time: "Yesterday", href: "/creater/discover" },
  { id: 5, kind: "update", icon: "💸", title: "₹5,000 sent to your UPI", text: "Mamaearth Monsoon Reel", time: "18 Oct", href: "/creater/payments" },
  { id: 6, kind: "update", icon: "🎉", title: "Post verified — Vaaree", text: "Thanks for posting on time!", time: "30 Oct", href: "/creater/my-campaigns/vaaree-diwali" },
];

/* ---------- Messages ---------- */
export const IG_THREADS = [
  { id: "t1", name: "Nykaa", handle: "@mynykaa", last: "Loved your reel idea! Can you share the draft by Friday?", time: "2 h", unread: true, msgs: [
    { me: false, text: "Hi Shivam! Loved your reel idea 💖", time: "11:02" },
    { me: true, text: "Thank you! I'll shoot it in natural light at my place.", time: "11:10" },
    { me: false, text: "Perfect. Can you share the draft by Friday?", time: "11:12" },
  ] },
  { id: "t2", name: "Riya Kapoor", handle: "@riya.travels", last: "Bro which camera do you use?", time: "Yesterday", msgs: [
    { me: false, text: "Bro which camera do you use? Your Jaipur reel was 🔥", time: "18:40" },
  ] },
  { id: "t3", name: "Snuggles", handle: "@snuggles.pets", last: "Your package is out for delivery 🐶", time: "Mon", msgs: [
    { me: false, text: "Your package is out for delivery 🐶", time: "09:15" },
  ] },
];

export const WA_CHATS = [
  { id: "w1", name: "Geek team", number: "+91 98100 11223", last: "Your Nykaa agreement is ready to sign ✍️", time: "10:42", msgs: [
    { me: false, text: "Hi Shivam 👋 Nykaa picked you for the Festive Glow Reel!", time: "10:40" },
    { me: false, text: "Your agreement is ready to sign ✍️", time: "10:42" },
  ] },
  { id: "w2", name: "Ankit (Geek)", number: "+91 98100 44556", last: "Sure, take one more day 👍", time: "Yesterday", msgs: [
    { me: true, text: "Can I get one more day for the Beardo draft?", time: "17:02" },
    { me: false, text: "Sure, take one more day 👍", time: "17:05" },
  ] },
];

/* ---------- Analytics ---------- */
export const ANALYTICS = {
  stats: [
    { label: "Followers", value: "12.4K", note: "+640 in 30 days" },
    { label: "Reach", value: "48.2K", note: "last 30 days" },
    { label: "Engagement", value: "4.8%", note: "avg across posts" },
    { label: "Profile visits", value: "3.1K", note: "+18% vs last month" },
  ],
  growth: [32, 36, 35, 40, 44, 43, 48, 52, 55, 54, 60, 66, 70, 74],
  campaigns: [
    { title: "Vaaree Biggest Diwali Sale", views: "18.4K", likes: "1.2K", saves: "210", status: "Verified" },
    { title: "Mamaearth Monsoon Reel", views: "22.1K", likes: "1.6K", saves: "340", status: "Paid" },
    { title: "Lenskart Weekend Story", views: "6.8K", likes: "—", saves: "—", status: "Paid" },
  ],
  topPosts: [
    { img: I("kit-2.jpg"), views: "9.2K", likes: "820" },
    { img: I("kit-3.jpg"), views: "7.4K", likes: "610" },
    { img: I("kit-1.jpg"), views: "5.1K", likes: "430" },
  ],
  audience: [
    { label: "Men", value: 58 },
    { label: "Women", value: 42 },
    { label: "Age 18–24", value: 46 },
    { label: "Age 25–34", value: 38 },
    { label: "Jaipur", value: 34 },
  ],
};

export const KIT_POSTS = [
  { img: I("kit-2.jpg"), likes: 820, comments: 41 },
  { img: I("kit-3.jpg"), likes: 610, comments: 28 },
  { img: I("kit-1.jpg"), likes: 430, comments: 19 },
];

/* Command bar (⌘K) */
export const COMMANDS = [
  { label: "Home", href: "/creater/home", icon: "home" },
  { label: "Discover", href: "/creater/discover", icon: "compass" },
  { label: "My campaigns", href: "/creater/my-campaigns", icon: "target" },
  { label: "Payments", href: "/creater/payments", icon: "wallet" },
  { label: "Media kit", href: "/creater/media-kit", icon: "layers" },
  { label: "Analytics", href: "/creater/analytics", icon: "chart" },
  { label: "Inbox", href: "/creater/messages", icon: "chat" },
  { label: "Instagram DMs", href: "/creater/messages/instagram", icon: "insta" },
  { label: "Profile", href: "/creater/profile", icon: "user" },
  { label: "Dream brands", href: "/creater/profile/dream-brands", icon: "heart" },
  { label: "Settings", href: "/creater/settings", icon: "settings" },
];
