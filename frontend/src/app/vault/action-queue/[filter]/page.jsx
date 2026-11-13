"use client";

import { useParams } from "next/navigation";
import ActionQueueView from "@/components/admin/queue/ActionQueueView";

/* /vault/action-queue/applications | content | contracts | logistics | campaigns | signups (Figma 009–017) */
export default function ActionQueueFilterPage() {
  const { filter } = useParams();
  return <ActionQueueView filter={filter || "all"} />;
}
