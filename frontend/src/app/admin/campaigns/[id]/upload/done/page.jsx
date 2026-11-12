"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Panel, MiniStats, TextBtn, useToast, downloadFile } from "@/components/admin/campaign2/kit";
import { UploadCard, SAMPLE_ROWS, loadUpload } from "@/components/admin/campaign2/upload";

const DEFAULT = {
  source: "Mysore creators.xlsx",
  uploaded: SAMPLE_ROWS.slice(0, 2).map((r) => ({ name: r.name, ig: r.ig, status: r.status })),
  skipped: 2,
};

export default function BulkUploadDone() {
  const { id } = useParams();
  const [toast, show] = useToast();
  const [up, setUp] = useState(DEFAULT);

  useEffect(() => {
    const u = loadUpload(id);
    if (u?.uploaded) setUp({ ...DEFAULT, ...u });
  }, [id]);

  const n = up.uploaded.length;
  const steps = up.uploaded.reduce((m, r) => {
    const k = r.status.replace(/^\d+\.\s*/, "");
    m[k] = (m[k] || 0) + 1;
    return m;
  }, {});

  const skipped = () => {
    downloadFile("skipped-rows.csv", [["Name", "Instagram", "Status", "Why"], ...SAMPLE_ROWS.slice(2).map((r) => [r.name, r.ig, r.status, r.what])]);
    show(`${up.skipped} skipped rows downloaded — fix and upload again`);
  };

  return (
    <AdminShell>
      <WorkspaceHead id={id} />

      <p className="ud-ok">
        ✓ <b>{n} creators uploaded</b>· {n} invited on WhatsApp + email
        {Object.entries(steps)
          .map(([k, c]) => ` · ${c} on ${k}`)
          .join("")}
        {up.skipped ? ` · ${up.skipped} skipped — fix and upload again` : ""}
      </p>

      <UploadCard step={5}>
        <MiniStats
          items={[
            { value: n, label: "Uploaded", note: `From ${up.source}` },
            { value: n, label: "Invited", note: "New — joining after sign-up" },
            { value: 0, label: "Moved to their step", note: "Already on Geek OS" },
            { value: up.skipped, label: "Skipped", note: "Need Courier / Video link" },
          ]}
        />
        <div className="ud-act">
          {up.skipped > 0 && <TextBtn onClick={skipped}>⬇️ Download skipped rows</TextBtn>}
          <Link href={`/admin/campaigns/${id}/upload`} className="ad-btn ad-btn--ghost">
            Upload another sheet
          </Link>
        </div>
      </UploadCard>

      <Panel title={`Creators · ${22 + n}`} sub="Everyone you upload shows here with their step.">
        <div className="c2-tw">
          <table className="c2-t ud-t">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Step</th>
                <th>Joined via</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {up.uploaded.map((r) => {
                const k = r.status.replace(/^\d+\.\s*/, "");
                return (
                  <tr key={r.name}>
                    <td>
                      <b>{r.name}</b>· {r.ig}
                    </td>
                    <td>
                      <span className={`ad-badge ad-badge--${/Address|Courier/.test(k) ? "orange" : "violet"}`}>Sheet: {k} · joins after sign-up</span>
                    </td>
                    <td>
                      <span className="ad-badge">via upload · 12 Nov</span>
                    </td>
                    <td>✉️ Invite sent</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      {toast}

      <style>{`
        .ud-ok { margin: 0 0 17px; padding: 12px 15px; border-radius: 12px; border: 1px solid #b9e6d0; background: #e8f8f0; font-size: 12px; line-height: 1.4; color: #168560; }
        .ud-ok b { margin-left: 6px; font-weight: 700; }
        .ud-act { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 22px; }
        .ud-act .c2-tbtn { margin-left: 8px; }
        .ud-act .ad-btn { height: 41px; }
        .ud-t td { height: 57px; padding-top: 8px; padding-bottom: 8px; }
        .ud-t .ad-badge { height: 25px; }
      `}</style>
    </AdminShell>
  );
}
