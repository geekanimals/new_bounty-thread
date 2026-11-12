import { VIDEOS } from "@/components/brands/data";

// Har video ka review page build ke time ban jaata hai
export function generateStaticParams() {
  return VIDEOS.map((v) => ({ id: v.id }));
}

export default function VideoLayout({ children }) {
  return children;
}
