"use client";

import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import ReportTabs from "@/components/admin/campaign2/ReportTabs";
import TraitsReport from "@/components/admin/campaign2/TraitsReport";

/* 🧩 Creator traits — is campaign ke creators (report shared component mein: TraitsReport) */
export default function CampaignTraits() {
  const { id } = useParams();
  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <ReportTabs id={id} active="traits" />
      <TraitsReport campaign={id} />
    </AdminShell>
  );
}
