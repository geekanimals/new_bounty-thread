"use client";

import { useParams } from "next/navigation";
import LogisticsView from "@/components/admin/queue/LogisticsView";

/* Shipment details drawer apne route par (Figma 050) */
export default function ShipmentPage() {
  const { id } = useParams();
  return <LogisticsView openId={id} />;
}
