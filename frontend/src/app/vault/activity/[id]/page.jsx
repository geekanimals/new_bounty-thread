"use client";

import { useParams } from "next/navigation";
import ActivityPage from "../page";

/* /vault/activity/[id] — Activity page + us person ki timeline (right panel) */
export default function ActivityPerson() {
  const { id } = useParams();
  return <ActivityPage person={id} />;
}
