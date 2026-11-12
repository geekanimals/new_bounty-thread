import { CAMPAIGNS } from "@/components/creater/data";

// Har campaign brief build ke time ban jaata hai (page.jsx client hai, params yahan se)
export function generateStaticParams() {
  return CAMPAIGNS.map((c) => ({ id: c.id }));
}

export default function BriefLayout({ children }) {
  return children;
}
