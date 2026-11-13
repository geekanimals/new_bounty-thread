import { FILTERS } from "@/components/admin/queue/queueData";

/* /admin/action-queue/<filter>/<item> — item ids database se aate hain, isliye sirf sample pehle se banta hai */
export function generateStaticParams() {
  return FILTERS.map((f) => ({ filter: f.k, id: "sample" }));
}

export default function ItemLayout({ children }) {
  return children;
}
