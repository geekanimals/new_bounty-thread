import { SHIPMENTS } from "@/components/admin/queue/queueData";

/* /admin/logistics/<shipment> — fulfilment record drawer */
export function generateStaticParams() {
  return SHIPMENTS.map((s) => ({ id: s.id }));
}

export default function ShipmentLayout({ children }) {
  return children;
}
