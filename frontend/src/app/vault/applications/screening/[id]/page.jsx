"use client";

import { useParams } from "next/navigation";
import ScreeningView from "@/components/admin/queue/ScreeningView";

/* Screening item ka "Decision workspace" drawer apne route par (Figma 005) */
export default function ScreeningItemPage() {
  const { id } = useParams();
  return <ScreeningView openId={id} />;
}
