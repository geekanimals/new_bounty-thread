"use client";

import { useParams } from "next/navigation";
import ActionQueueView from "@/components/admin/queue/ActionQueueView";

/* Review drawer apne route par (Figma 008/011/013/015) — band karo to wapas tab par */
export default function ActionQueueItemPage() {
  const { filter, id } = useParams();
  return <ActionQueueView filter={filter || "all"} openId={id} />;
}
