"use client";

import { useParams } from "next/navigation";
import UploadStart from "@/components/admin/campaign2/UploadStart";

// Bulk upload · step 1 (upload)
export default function BulkUploadUpload() {
  const { id } = useParams();
  return <UploadStart id={id} mode="upload" />;
}
