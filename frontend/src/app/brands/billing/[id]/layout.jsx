import { BILLS } from "@/components/brands/data";

// Har bill ka page build ke time ban jaata hai (page.jsx client hai, isliye params yahan se)
export function generateStaticParams() {
  return BILLS.map((b) => ({ id: b.id }));
}

export default function BillLayout({ children }) {
  return children;
}
