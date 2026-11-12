import { APPROVAL_CREATORS } from "@/components/brands/data";

// Har creator ka decline page build ke time ban jaata hai
export function generateStaticParams() {
  return APPROVAL_CREATORS.map((id) => ({ id }));
}

export default function DeclineLayout({ children }) {
  return children;
}
