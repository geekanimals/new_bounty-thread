import { BRANDS } from "@/components/admin/data";

// Brand pages pehle se ban jaayein (Next cacheComponents)
export function generateStaticParams() {
  return BRANDS.map((b) => ({ id: b.id }));
}

export default function BrandLayout({ children }) {
  return children;
}
