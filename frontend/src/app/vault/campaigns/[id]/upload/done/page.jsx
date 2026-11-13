"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Panel, MiniStats, TextBtn, Note, TableState, useToast, downloadFile, when } from "@/components/admin/campaign2/kit";
import { useRpc } from "@/lib/supabase";
import { UploadCard, loadUpload, stLabel, stRank, dispStatus, useUploadKind } from "@/components/admin/campaign2/upload";

/*
 * Bulk upload · done — bulk_import_creators ka nateeja (sessionStorage se) + neeche
 * api.bulk_invites(p_campaign) — sheet se aaye sab creators, unka step aur message (purane bkListHtml jaisa).
 */
const msgOf = (x) => {
  const w = x.wa || {},
    m = x.mail || {};
  if (w.status === "failed" || m.status === "failed") return `⚠️ ${w.status === "failed" ? "WhatsApp" : "Email"} failed${(w.error || m.error) ? ` — ${String(w.error || m.error).slice(0, 60)}` : ""}`;
  if (x.claimed_at) return "✅ Joined";
  if (x.invites_sent) return `✉️ Invite sent${x.invites_sent > 1 ? ` ×${x.invites_sent}` : ""}`;
  if (w.status === "skipped" || m.status === "skipped") return "⏸ Not sent (messages OFF)";
  return "—";
};

export default function BulkUploadDone() {
  const { id } = useParams();
  const kind = useUploadKind(id);
  const [toast, show] = useToast();
  const [up, setUp] = useState(null);
  const list = useRpc("admin", "api.bulk_invites", { p_campaign: id }, { skip: !id || id === "sample" });

  useEffect(() => {
    const u = loadUpload(id);
    if (u && u.done) setUp(u);
  }, [id]);

  const d = (up && up.result) || {};
  const n = up ? up.uploaded.length : 0;
  const skipped = (up && up.skipped) || [];
  const steps = up
    ? up.uploaded.reduce((m, r) => {
        const k = stLabel(r.status);
        m[k] = (m[k] || 0) + 1;
        return m;
      }, {})
    : {};
  const inv = Array.isArray(list.data) ? list.data : [];

  const dlSkipped = () => {
    downloadFile("not-uploaded-rows.csv", [["Row", "Name", "Instagram", "WhatsApp", "Email", "Status", "Why"], ...skipped.map((x) => [x.row, x.name, x.handle, x.phone, x.email, stLabel(x.status), x.reason])]);
    show(`${skipped.length} rows downloaded — fix and upload again`);
  };

  return (
    <AdminShell>
      <WorkspaceHead id={id} />

      {up ? (
        <p className="ud-ok">
          ✓ <b>{d.added || 0} put on their step now</b>· {d.invited || 0} invited on WhatsApp/email
          {Object.entries(steps)
            .map(([k, c]) => ` · ${c} on ${k}`)
            .join("")}
          {d.waiting_profile ? ` · ${d.waiting_profile} on Geek OS, finishing their profile` : ""}
          {d.skipped ? ` · ${d.skipped} skipped (no contact)` : ""}
          {d.duplicates ? ` · ${d.duplicates} duplicate${d.duplicates > 1 ? "s" : ""} skipped` : ""}
          {skipped.length ? ` · ${skipped.length} not uploaded — fix and upload again` : ""}
        </p>
      ) : null}

      <UploadCard id={id} step={5}>
        {up ? (
          <>
            <MiniStats
              items={[
                { value: n, label: "Uploaded", note: `From ${up.src}` },
                { value: d.invited || 0, label: "Invited", note: "New — joining after sign-up" },
                { value: d.added || 0, label: "Moved to their step", note: "Already on Geek OS" },
                { value: skipped.length, label: "Skipped", note: skipped.length ? "Who and why is in Upload history" : "Nothing skipped" },
              ]}
            />
            {(up.notes || []).map((t) => (
              <div key={t} className="ud-note">
                <Note tone="amber" icon="ℹ️">
                  {t}
                </Note>
              </div>
            ))}
          </>
        ) : (
          <Note tone="amber" icon="📄">
            <b>No upload in this tab yet</b>— the creators already uploaded to this campaign are listed below.
          </Note>
        )}
        <div className="ud-act">
          {skipped.length > 0 && <TextBtn onClick={dlSkipped}>⬇️ Download skipped rows</TextBtn>}
          <Link href={`/vault/campaigns/${id}/upload`} className="ga-btn ga-btn--ghost">
            Upload another sheet
          </Link>
        </div>
      </UploadCard>

      <Panel title={`Creators · ${list.data ? inv.length : "…"}`} sub="Everyone you upload shows here with their step.">
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
              <TableState cols={4} loading={list.loading && !list.data} error={!list.data && list.error} onRetry={list.reload} empty={list.data && !inv.length && "Nobody uploaded to this campaign yet."} />
              {inv.map((x) => {
                const live = x.participation_id && x.stage;
                const st = dispStatus(kind, x.status || x.sheet_status || "registered");
                const nm = x.name || (x.ig && x.ig.name) || "—";
                return (
                  <tr key={x.invite_id}>
                    <td>
                      <b>{nm}</b>
                      {x.handle ? `· @${String(x.handle).replace(/^@/, "")}` : ""}
                    </td>
                    <td>
                      {live ? (
                        <span className="ga-badge ga-badge--green">{String(x.stage).replace(/_/g, " ")}</span>
                      ) : (
                        <span className={`ga-badge ga-badge--${stRank(st) >= 7 && stRank(st) <= 9 ? "orange" : "violet"}`}>Sheet: {stLabel(st)} · joins after sign-up</span>
                      )}
                    </td>
                    <td>
                      <span className="ga-badge">via upload · {when(x.created_at)}</span>
                    </td>
                    <td>{msgOf(x)}</td>
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
        .ud-note { margin-top: 14px; }
        .ud-act { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 22px; }
        .ud-act .c2-tbtn { margin-left: 8px; }
        .ud-act .ga-btn { height: 41px; }
        .ud-t td { height: 57px; padding-top: 8px; padding-bottom: 8px; }
        .ud-t .ga-badge { height: 25px; }
      `}</style>
    </AdminShell>
  );
}
