"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Note, useToast } from "@/components/admin/campaign2/kit";
import { UploadCard, MsgOff, SAMPLE_ROWS, STATUSES, loadUpload, saveUpload } from "@/components/admin/campaign2/upload";

/* Status ke hisaab se row valid hai? (Figma rules) */
const needs = (r) => {
  const n = parseInt(r.status, 10);
  if (n === 8 || n === 9) return "“Courier sent” needs Courier, Tracking ID";
  if (n === 11 || n === 12) return "needs Video link";
  if (n === 13) return "needs Post link";
  return "";
};
const toneOf = (s) => (/Approved|Applied|Screened|Sent|Contract|submitted|approved|Posted|brief/.test(s) && !/Address|Courier/.test(s) ? "violet" : "orange");

export default function BulkUploadCheck() {
  const { id } = useParams();
  const router = useRouter();
  const base = `/admin/campaigns/${id}/upload`;
  const [toast, show] = useToast();
  const [src, setSrc] = useState("Mysore creators.xlsx");
  const [rows, setRows] = useState(SAMPLE_ROWS);
  const [msg, setMsg] = useState("");
  const [all, setAll] = useState("");

  useEffect(() => {
    const u = loadUpload(id);
    if (u?.source) setSrc(u.source);
  }, [id]);

  const setStatus = (i, s) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, status: s } : r)));
  const setEveryone = (s) => {
    setAll(s);
    if (s) setRows((rs) => rs.map((r) => ({ ...r, status: s })));
  };

  const bad = rows.map(needs);
  const okRows = rows.filter((_, i) => !bad[i]);
  const badRows = rows.filter((_, i) => bad[i]);
  const counts = okRows.reduce((m, r) => {
    const k = r.status.replace(/^\d+\.\s*/, "").toLowerCase();
    m[k] = (m[k] || 0) + 1;
    return m;
  }, {});

  const upload = () => {
    if (!okRows.length) return show("Fix at least one row to upload");
    saveUpload(id, { source: src, uploaded: okRows.map((r) => ({ name: r.name, ig: r.ig, status: r.status })), skipped: badRows.length, msg });
    router.push(`${base}/done`);
  };

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <UploadCard step={3}>
        <Note tone="green" icon="✅">
          <b>{rows.length} rows loaded</b>from {src} · ✎{" "}
          <Link href={`${base}/help`}>
            <u>Change sheet / columns · guide</u>
          </Link>
        </Note>
        <MsgOff />
        {badRows.length > 0 && (
          <Note tone="red" icon="⛔">
            <b>
              {badRows.length} row{badRows.length > 1 ? "s" : ""} won’t be uploaded
            </b>
            — fix them in the sheet and load it again (or change the step in the row):{" "}
            {rows
              .map((r, i) => (bad[i] ? `Row ${i + 2} · ${r.name} — “${r.status.replace(/^\d+\.\s*/, "")}” ${bad[i].replace(/^“[^”]+” /, "")}` : null))
              .filter(Boolean)
              .join(" · ")}
            .
          </Note>
        )}

        <div className="uc-all">
          <span>Set everyone to</span>
          <select className="ad-input" value={all} onChange={(e) => setEveryone(e.target.value)} aria-label="Set everyone to">
            <option value="">— choose —</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span>— or change each row below</span>
        </div>
        <p className="uc-info">ℹ️ Each row only needs the columns of its own Status — Address confirmed: Address, City, State, PIN · Courier sent / delivered: Courier + Tracking · Video submitted / Client approved: Video link · Posted / Done: Post link.</p>

        <div className="c2-tw">
          <table className="c2-t uc-t">
            <thead>
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>Instagram</th>
                <th>WhatsApp</th>
                <th>Email</th>
                <th>City</th>
                <th>Address · Courier</th>
                <th>
                  💰 Fee · Pay
                  <br />
                  to
                </th>
                <th>What happens</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.name} className={bad[i] ? "is-bad" : ""}>
                  <td>
                    <label className={`uc-st uc-st--${toneOf(r.status)}`}>
                      <span>{r.status} ·</span>
                      <select value={r.status} onChange={(e) => setStatus(i, e.target.value)} aria-label={`Status for ${r.name}`}>
                        {STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </td>
                  <td className="uc-w">
                    <b>{r.name}</b>
                  </td>
                  <td>{r.ig}</td>
                  <td className="uc-w">{r.wa}</td>
                  <td>{r.email}</td>
                  <td>{r.city}</td>
                  <td className="uc-w uc-addr">{r.addr}</td>
                  <td className="uc-w uc-fee">{r.fee}</td>
                  <td className="uc-w uc-what">
                    {bad[i] ? (
                      <span className="uc-pill uc-pill--bad">⛔ Not uploaded — {bad[i]}</span>
                    ) : (
                      <>
                        <span className="uc-pill">{r.what?.startsWith("New") ? r.what : `New — joins on ${r.status.replace(/^\d+\.\s*/, "")} after sign-up`}</span>
                        <small>{r.sends || "✉️ sends: Invite on WhatsApp + email"}</small>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <label className="uc-msg">
          <span>Message to the creators (optional — goes with the invite)</span>
          <input className="ad-input" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. Diwali drop — we loved your recent reels!" />
        </label>

        <div className="uc-act">
          <button type="button" className="ad-btn ad-btn--primary" onClick={upload}>
            Upload &amp; invite {okRows.length} creator{okRows.length === 1 ? "" : "s"}
          </button>
          {badRows.length > 0 && <b className="uc-bad">{badRows.length} not uploaded (fix above)</b>}
          <span className="uc-sum">
            {Object.entries(counts)
              .map(([k, n]) => ` · ${n} ${k}`)
              .join("")}
          </span>
          <Link href={base} className="c2-tbtn">
            Clear
          </Link>
        </div>
      </UploadCard>
      {toast}

      <style>{`
        .up-card .c2-note + .c2-note { margin-top: 17px; }
        .uc-all { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 16px; font-size: 12px; color: var(--ad-muted); }
        .uc-all select { width: 179px; height: 45px; padding: 0 12px; font-size: 14px; color: #293652; cursor: pointer; -webkit-appearance: none; appearance: none; }
        .uc-info { margin-top: 15px; font-size: 12px; line-height: 1.35; color: var(--ad-muted); }
        .uc-t { margin-top: 16px; }
        .uc-t th { vertical-align: bottom; line-height: 1.3; }
        .uc-t td { padding-top: 12px; padding-bottom: 12px; height: 72px; }
        .uc-t tr:first-child td { height: 119px; }
        .uc-t tr.is-bad td { background: #fdf1f2; }
        .uc-w { white-space: normal !important; min-width: 60px; line-height: 1.33; }
        .uc-t td.uc-w:nth-child(2) { width: 50px; }
        .uc-addr { min-width: 120px; max-width: 130px; }
        .uc-fee { min-width: 86px; max-width: 92px; }
        .uc-what { min-width: 190px; max-width: 210px; }
        .uc-st { position: relative; display: inline-flex; align-items: center; max-width: 94px; padding: 7px 11px; border-radius: 14px; font-size: 11px; font-weight: 700; line-height: 1.3; white-space: normal; cursor: pointer; }
        .uc-st--violet { background: var(--ad-lilac); color: #6857ec; }
        .uc-st--orange { background: var(--ad-orange-bg); color: var(--ad-orange); }
        .uc-st select { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; }
        .uc-pill { display: inline-block; padding: 6px 10px; border-radius: 14px; background: var(--ad-soft); color: #7a8398; font-size: 11px; font-weight: 700; line-height: 1.3; }
        .uc-pill--bad { background: var(--ad-red-bg); color: var(--ad-red); }
        .uc-what small { display: block; margin-top: 2px; font-size: 12px; line-height: 1.33; color: var(--ad-muted); }
        .uc-msg { display: flex; align-items: center; gap: 0; flex-wrap: wrap; margin-top: 16px; font-size: 12px; color: var(--ad-muted); }
        .uc-msg .ad-input { width: 173px; height: 42px; }
        .uc-act { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
        .uc-act .ad-btn { height: 41px; }
        .uc-bad { font-size: 12px; font-weight: 700; color: #d6453d; }
        .uc-sum { font-size: 12px; color: var(--ad-muted); margin-right: 6px; }
        @media (max-width: 640px) {
          .uc-all select, .uc-msg .ad-input { width: 100%; }
          .uc-msg { gap: 6px; }
          .uc-act .ad-btn { width: 100%; }
        }
      `}</style>
    </AdminShell>
  );
}
