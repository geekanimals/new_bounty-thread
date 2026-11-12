"use client";

import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import Inbox, { InboxHead } from "@/components/admin/msg/Inbox";

/** /admin/inbox/chat/[id] — ek chat khula (mobile par sirf chat) */
export default function AdminChat() {
  const { id } = useParams();
  return (
    <AdminShell>
      <InboxHead />
      <Inbox chatId={id} />
    </AdminShell>
  );
}
