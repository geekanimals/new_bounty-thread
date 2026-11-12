"use client";

import AdminShell from "@/components/admin/AdminShell";
import Inbox, { InboxHead } from "@/components/admin/msg/Inbox";

/** /admin/inbox — WhatsApp chats (Figma 078) */
export default function AdminInbox() {
  return (
    <AdminShell>
      <InboxHead />
      <Inbox />
    </AdminShell>
  );
}
