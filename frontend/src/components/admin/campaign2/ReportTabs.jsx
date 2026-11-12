"use client";

import { SubTabs } from "@/components/admin/campaign2/kit";

/* Report ke 3 sub tabs — Campaign report / List for the brand / Creator traits */
export default function ReportTabs({ id, active }) {
  return (
    <SubTabs
      active={active}
      items={[
        { k: "report", label: "📈 Campaign report", href: `/admin/campaigns/${id}/report` },
        { k: "list", label: "📋 List for the brand", href: `/admin/campaigns/${id}/list` },
        { k: "traits", label: "🧩 Creator traits", href: `/admin/campaigns/${id}/traits` },
      ]}
    />
  );
}
