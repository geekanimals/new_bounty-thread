import { QUEUE } from "@/components/admin/queue/queueData";

/* /admin/action-queue/<filter>/<item> — review drawer */
export function generateStaticParams() {
  return QUEUE.flatMap((q) => [
    { filter: q.f, id: q.id },
    ...(q.kind ? [] : [{ filter: "all", id: q.id }]),
  ]);
}

export default function ItemLayout({ children }) {
  return children;
}
