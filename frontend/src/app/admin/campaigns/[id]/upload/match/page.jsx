"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Note } from "@/components/admin/campaign2/kit";
import { UploadCard, MsgOff, loadUpload, saveUpload } from "@/components/admin/campaign2/upload";

/* Geek OS field → sheet ka column (auto match) */
const FIELDS = [
  ["Name", "Name"],
  ["Instagram", "Instagram"],
  ["WhatsApp", "WhatsApp"],
  ["Email", "Email"],
  ["City", "City"],
  ["Followers", ""],
  ["Status", "Status"],
  ["Address", ""],
  ["State", ""],
  ["Pin code", ""],
  ["Courier", ""],
  ["Tracking", ""],
  ["Video link", ""],
  ["Post link", ""],
  ["Coupon code", ""],
  ["Fee (₹)", "Fee"],
  ["Advance %", ""],
  ["Pay days", ""],
  ["Terms", ""],
  ["UPI ID", "UPI"],
  ["Account no", ""],
  ["IFSC", ""],
  ["Account holder", ""],
];
const HEADINGS = ["Name", "Instagram", "WhatsApp", "Email", "City", "Status", "Fee", "UPI", "Address", "Courier", "Notes"];

export default function BulkUploadMatch() {
  const { id } = useParams();
  const router = useRouter();
  const base = `/admin/campaigns/${id}/upload`;
  const [up, setUp] = useState(null);
  const [map, setMap] = useState(() => Object.fromEntries(FIELDS));

  // Sheet load nahi hua (seedha link khola) → sample sheet
  useEffect(() => {
    const u = loadUpload(id) || { source: "Mysore creators.xlsx" };
    setUp(u);
  }, [id]);

  const src = up?.source || "Mysore creators.xlsx";
  const go = () => {
    saveUpload(id, { ...(up || {}), source: src, map });
    router.push(`${base}/check`);
  };

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <UploadCard step={2}>
        <Note tone="green" icon="✅">
          <b>4 rows loaded</b>from {src} — check the preview below · ✎{" "}
          <Link href={`${base}/help`}>
            <u>Change sheet / columns · guide</u>
          </Link>
        </Note>
        <MsgOff />

        <p className="um-h">
          <b>Match the columns</b> <span>— picked automatically from your sheet’s headings</span>
        </p>
        <Note tone="amber" icon="💰">
          <b>Paid campaign:</b>add Fee, Advance %, Pay days, Terms and UPI / Account no + IFSC + Account holder columns to set each creator’s payment as they are uploaded. Their contract carries their own fee — nobody else sees it.
        </Note>

        <div className="um-grid">
          {FIELDS.map(([f]) => (
            <label key={f} className="um-f">
              <span>{f}</span>
              <select value={map[f]} onChange={(e) => setMap((m) => ({ ...m, [f]: e.target.value }))} className={map[f] ? "is-set" : ""}>
                <option value="">—</option>
                {HEADINGS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="um-act">
          <button type="button" className="ad-btn ad-btn--primary" onClick={go}>
            Use these columns →
          </button>
          <Link href={base} className="c2-tbtn">
            Change sheet
          </Link>
        </div>
      </UploadCard>

      <style>{`
        .up-card .c2-note + .c2-note { margin-top: 14px; }
        .um-h { margin: 18px 0 12px; font-size: 12px; color: var(--ad-muted); }
        .um-h b { font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        .um-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 9px 12px; margin-top: 16px; }
        .um-f { display: flex; align-items: center; gap: 0; min-width: 0; }
        .um-f span { flex-shrink: 0; font-size: 10px; letter-spacing: .6px; text-transform: uppercase; color: var(--ad-muted); white-space: nowrap; }
        .um-f select {
          width: auto; field-sizing: content; min-width: 50px; max-width: 100%; height: 38px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--ad-line-2);
          background: #fff; font-size: 10px; color: #293652; outline: none; cursor: pointer; appearance: none;
        }
        .um-f select.is-set { min-width: 68px; }
        .um-f select:focus { border-color: var(--ad-primary); }
        .um-act { display: flex; align-items: center; gap: 16px; margin-top: 16px; }
        .um-act .ad-btn { height: 41px; }
        @media (max-width: 1180px) { .um-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .um-grid { grid-template-columns: 1fr 1fr; }
          .um-f { flex-direction: column; align-items: stretch; gap: 4px; }
          .um-f select { width: 100%; }
        }
      `}</style>
    </AdminShell>
  );
}
