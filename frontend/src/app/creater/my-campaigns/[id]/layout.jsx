import { MY_CAMPAIGNS } from "@/components/creater/data";

// Har applied campaign ka tracker page build ke time ban jaata hai
export function generateStaticParams() {
  return MY_CAMPAIGNS.map((m) => ({ id: m.id }));
}

export default function TrackerLayout({ children }) {
  return children;
}
