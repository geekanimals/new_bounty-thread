import { CREATORS } from "@/components/brands/data";

// Har creator ka profile page build ke time ban jaata hai
export function generateStaticParams() {
  return CREATORS.map((c) => ({ id: c.id }));
}

export default function CreatorLayout({ children }) {
  return children;
}
