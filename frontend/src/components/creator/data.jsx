/**
 * Creator panel ka STATIC UI content — sidekicks, categories, languages, dream brands ki list, skills, tracker steps, ⌘K commands.
 * Ye Supabase se nahi aata (purane app mein bhi code mein hi tha). Asli data: services/creator.
 */
const I = (n) => `/creator/${n}`;

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

/* ---------- Skills & resources (Figma ki exact lists) ---------- */
export const SKILLS = ["Modelling", "Live / Video Creator", "Video Editor", "Photographer", "Draw / Paint / Doodle", "Performance Arts", "Content Writer", "Singer", "Dancer", "Comedy / Acting", "Illustrator", "MC / Host", "Research", "DJ / Music", "Graphic Designer / UI UX", "Sustainability", "Performing Artist", "Ethical Hacking", "Coder / Developer", "Caregiver", "Digital Marketing", "Storytelling", "Meme"];
export const RESOURCES = ["Studio", "Camera", "Car", "Bike", "Meeting or Shooting Space", "Tripod", "Speaker", "Mike", "Lights"];

/* ---------- Campaigns ---------- */
export const TYPE_LABEL = { barter: "Barter", paid: "Paid", hybrid: "Hybrid" };
export const TYPE_ICON = { barter: "🎁 Barter", paid: "💰 Paid", hybrid: "🎁 Barter + 💰 Paid" };

/* Apply karne ke baad ka safar (campaign brief ki journey line) */
export const APPLY_JOURNEY = ["Apply", "Get selected", "Receive kit", "Create", "Your analytics"];

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

/* Command bar (⌘K) */
export const COMMANDS = [
  { label: "Home", href: "/creator/home", icon: "home" },
  { label: "Discover", href: "/creator/discover", icon: "compass" },
  { label: "My campaigns", href: "/creator/my-campaigns", icon: "target" },
  { label: "Payments", href: "/creator/payments", icon: "wallet" },
  { label: "Media kit", href: "/creator/media-kit", icon: "layers" },
  { label: "Analytics", href: "/creator/analytics", icon: "chart" },
  { label: "Inbox", href: "/creator/messages", icon: "chat" },
  { label: "Instagram DMs", href: "/creator/messages/instagram", icon: "insta" },
  { label: "Profile", href: "/creator/profile", icon: "user" },
  { label: "Dream brands", href: "/creator/profile/dream-brands", icon: "heart" },
  { label: "Settings", href: "/creator/settings", icon: "settings" },
];
