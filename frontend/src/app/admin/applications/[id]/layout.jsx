import { APPLICATIONS } from "@/components/admin/queue/queueData";

/* /admin/applications/<creator> — review drawer */
export function generateStaticParams() {
  return APPLICATIONS.map((a) => ({ id: a.id }));
}

export default function ApplicationLayout({ children }) {
  return children;
}
