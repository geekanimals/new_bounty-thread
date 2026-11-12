"use client";

import { useParams } from "next/navigation";
import ApplicationsView from "@/components/admin/queue/ApplicationsView";

/* Creator review drawer apne route par (Figma 005) — band karo to list par wapas */
export default function ApplicationReviewPage() {
  const { id } = useParams();
  return <ApplicationsView openId={id} />;
}
