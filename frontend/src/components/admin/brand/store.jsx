/* Brand CRM ka chhota local store (prototype) — browser mein yaad rehta hai. */
import { BRANDS } from "@/components/admin/data";

const read = (k, d) => {
  try {
    const v = window.localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch {
    return d;
  }
};
const write = (k, v) => {
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("geek-brands"));
};

/* Figma: pehle se 2 deleted brands */
export const DELETED_SEED = [
  { id: "test-brand-co", name: "Test Brand Co", on: "3 Nov 2026", by: "Mayank", kept: 0 },
  { id: "demo-foods", name: "Demo Foods", on: "28 Oct 2026", by: "Mayank", kept: 1 },
];

export const getDeleted = () => read("geek_admin_brands_deleted", DELETED_SEED);
export const setDeleted = (v) => write("geek_admin_brands_deleted", v);
export const getAdded = () => read("geek_admin_brands_added", []);
export const setAdded = (v) => write("geek_admin_brands_added", v);

/** CRM mein dikhne wale brands = seed + naye − deleted */
export const liveBrands = () => {
  const gone = new Set(getDeleted().map((d) => d.id));
  return [...BRANDS, ...getAdded()].filter((b) => !gone.has(b.id));
};

/* Har brand ki detail (Figma: Beardo) */
const DETAILS = {
  beardo: { status: "Active client", added: "22 Oct 2026", website: "beardo.in", category: "Men’s grooming", creators: 66, posted: 10, value: "₹1.1L" },
  circle: { status: "Active client", added: "18 Oct 2026", website: "circle.in", category: "Home & declutter", creators: 105, posted: 5, value: "₹64K" },
  snuggles: { status: "Active client", added: "4 Nov 2026", website: "snuggles.in", category: "Kids & baby", creators: 6, posted: 0, value: "₹18K" },
  vaaree: { status: "Active client", added: "29 Oct 2026", website: "vaaree.com", category: "Home décor", creators: 27, posted: 0, value: "₹81K" },
  "olio-pizza": { status: "Active client", added: "2 Oct 2026", website: "oliopizza.com", category: "Food & QSR", creators: 80, posted: 42, value: "₹56K" },
  "the-wedding-company": { status: "Lead", added: "6 Nov 2026", website: "theweddingcompany.com", category: "Weddings", creators: 1, posted: 0, value: "₹0" },
  "yes-madam": { status: "Active client", added: "9 Nov 2026", website: "yesmadam.com", category: "Beauty & wellness", creators: 0, posted: 0, value: "₹0" },
};

export const brandInfo = (id) => {
  const b = [...BRANDS, ...(typeof window === "undefined" ? [] : getAdded())].find((x) => x.id === id) || BRANDS[0];
  const d = DETAILS[b.id] || { status: "Lead", added: "Today", website: b.website || "—", category: b.category || "—", creators: 0, posted: 0, value: "₹0" };
  return { ...b, ...d };
};
