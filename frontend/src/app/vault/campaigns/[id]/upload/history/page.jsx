"use client";

import { useParams } from "next/navigation";
import UploadStart from "@/components/admin/campaign2/UploadStart";

// Bulk upload · step 1 (history)
export default function BulkUploadHistory() {
  const { id } = useParams();
  return <UploadStart id={id} mode="history" />;
}
