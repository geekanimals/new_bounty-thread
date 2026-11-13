"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Note } from "@/components/admin/campaign2/kit";
import { UploadCard, MsgOff, loadUpload, saveUpload, fieldsFor, GRID_ORDER, restatus, useUploadKind } from "@/components/admin/campaign2/upload";

/*
 * Bulk upload · step 2 — Geek OS field → sheet ka column (purane bkMap / auto match jaisa).
 * Sheet pichle step se sessionStorage mein aata hai; koi sheet nahi → wapas step 1.
 */
export default function BulkUploadMatch() {
  const { id } = useParams();
  const router = useRouter();
  const base = `/admin/campaigns/${id}/upload`;
  const kind = useUploadKind(id);
  const [up, setUp] = useState(null);
  const [none, setNone] = useState(false);

  useEffect(() => {
    const u = loadUpload(id);
    if (u && u.rows) setUp(u);
    else setNone(true);
  }, [id]);

  const fields = fieldsFor(kind);
  const grid = GRID_ORDER.map((k) => fields.find((f) => f[0] === k)).filter(Boolean);
  const setCol = (k, v) =>
    setUp((u) => {
      const map = { ...u.map };
      if (v === "") delete map[k];
      else {
        // ek column sirf ek field ko
        Object.keys(map).forEach((x) => map[x] === +v && delete map[x]);
        map[k] = +v;
      }
      const nu = { ...u, map };
      return k === "status" ? restatus(nu, kind) : nu;
    });
  const go = () => {
    const u = up.map.status != null ? restatus(up, kind) : up;
    saveUpload(id, { ...u, preview: null });
    router.push(`${base}/check`);
  };
  const n = up ? up.rows.length : 0;
  const hasContact = up && ["phone", "email", "handle"].some((k) => up.map[k] != null);

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <UploadCard id={id} step={2}>
        {none ? (
          <Note tone="amber" icon="📄">
            <b>No sheet loaded yet</b>— <Link href={base}><u>choose a file or paste a Google Sheet link</u></Link> first.
          </Note>
        ) : !up ? (
          <div className="c2-skel" style={{ height: 120 }} />
        ) : (
          <>
            <Note tone="green" icon="✅">
              <b>
                {n} row{n !== 1 ? "s" : ""} loaded
              </b>
              from {up.src} — check the preview below · ✎{" "}
              <Link href={`${base}/help`}>
                <u>Change sheet / columns · guide</u>
              </Link>
            </Note>
            <MsgOff id={id} />

            <p className="um-h">
              <b>Match the columns</b> <span>— picked automatically from your sheet’s headings</span>
            </p>
            {kind !== "barter" && (
              <Note tone="amber" icon="💰">
                <b>{kind === "paid" ? "Paid campaign:" : "Barter + Paid campaign:"}</b>add Fee, Advance %, Pay days, Terms and UPI / Account no + IFSC + Account holder columns to set each creator’s payment as they are uploaded. Their contract carries their own fee — nobody else sees it.
              </Note>
            )}
            {!hasContact && (
              <Note tone="red" icon="⚠️">
                <b>Pick at least one of WhatsApp, Email or Instagram</b>— without one nobody can be invited.
              </Note>
            )}

            <div className="um-grid">
              {grid.map(([k, label]) => {
                const v = up.map[k] != null ? String(up.map[k]) : "";
                return (
                  <label key={k} className="um-f">
                    <span>{label}</span>
                    <select value={v} onChange={(e) => setCol(k, e.target.value)} className={v ? "is-set" : ""}>
                      <option value="">—</option>
                      {up.head.map((h, i) => (
                        <option key={i} value={i}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>

            <div className="um-act">
              <button type="button" className="ga-btn ga-btn--primary" onClick={go} disabled={!hasContact}>
                Use these columns →
              </button>
              <Link href={base} className="c2-tbtn">
                Change sheet
              </Link>
            </div>
          </>
        )}
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
        .um-act .ga-btn { height: 41px; }
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
