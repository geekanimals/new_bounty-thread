"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { useToast, downloadFile } from "@/components/admin/campaign2/kit";
import { UploadCard, MsgOff, SAMPLE_ROWS, saveUpload } from "@/components/admin/campaign2/upload";

const HISTORY = [
  ["12 Nov, 6:10 pm", "Mysore creators.xlsx", 4, 2, 2, "Mayank"],
  ["11 Nov, 4:10 pm", "Google Sheet · Olio list", 12, 12, 0, "Shivam"],
];

const GUIDE = [
  ["1 Applied", "Added, waiting for screening", "—", "—"],
  ["2 Screened", "Checked against the brand’s criteria", "—", "—"],
  ["3 Sent to brand", "On the brand’s final list", "—", "—"],
  ["4 Approved", "Contract goes out once their fee is set", "Fee", "✉️ Invite"],
  ["5 Contract sent", "Creator signs in the app", "—", "✉️ Sign your contract"],
  ["6 Contract signed", "Confirms address + adds bank / UPI", "—", "✉️ Confirm address"],
  ["7 Address confirmed", "Reads the video brief · you add courier", "Address, City, State, PIN", "—"],
  ["8 Courier sent", "Creator can track it", "Courier, Tracking", "✉️ Product shipped"],
  ["9 Courier delivered", "Video deadline starts", "Courier, Tracking", "✉️ Delivered"],
  ["10 Video brief sent", "Creator shoots", "Courier", "—"],
  ["11 Video submitted", "Waiting for client approval", "Video link", "—"],
  ["12 Client approved", "Creator can post", "Video link", "✉️ Go live"],
  ["13 Posted", "Post is live · insights start", "Post link", "✉️ Thank you"],
];

/**
 * Bulk upload step 1 — 3 roop (har ek apna route):
 *  mode="upload"  → /upload
 *  mode="help"    → /upload/help (guide drawer khula)
 *  mode="history" → /upload/history (upload history khuli)
 */
export default function UploadStart({ id, mode = "upload" }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [toast, show] = useToast();
  const [which, setWhich] = useState("All creators (22)");
  const [gsheet, setGsheet] = useState("");
  const [link, setLink] = useState("");
  const [paste, setPaste] = useState("");
  const base = `/admin/campaigns/${id}/upload`;

  const start = (source) => {
    saveUpload(id, { source, rows: SAMPLE_ROWS });
    router.push(`${base}/match`);
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/\.(xlsx|xls|csv|docx?|txt)$/i.test(f.name)) return show("Use an Excel, CSV or Word file");
    start(f.name);
  };

  const download = (kind) => {
    downloadFile(`campaign-sheet.${kind === "Excel" ? "csv" : "csv"}`, [["Name", "Instagram", "WhatsApp", "Email", "City", "Status"], ...SAMPLE_ROWS.map((r) => [r.name, r.ig, r.wa, r.email, r.city, r.status])]);
    show(`${which} downloaded as ${kind}`);
  };

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <UploadCard step={1}>
        <div className="us-sheet">
          <p className="us-sheet__t">
            <b>📄 Campaign sheet</b> <span>— every creator in the same columns as the bulk upload: download it, edit it, upload it again · or link a Google Sheet that keeps itself up to date</span>
          </p>
          <div className="us-row">
            <span className="us-lab">⬇️ Download</span>
            <div className="us-ctl">
              <select className="ad-input us-sel" value={which} onChange={(e) => setWhich(e.target.value)} aria-label="Which creators">
                <option>All creators (22)</option>
                <option>Approved (8)</option>
                <option>Not posted yet (14)</option>
              </select>
              <button type="button" className="ad-btn ad-btn--primary us-b" onClick={() => download("Excel")}>
                ⬇️ Excel
              </button>
              <button type="button" className="ad-btn ad-btn--ghost us-b" onClick={() => download("CSV")}>
                ⬇️ CSV
              </button>
              <span className="us-or">or</span>
              <button type="button" className="c2-tbtn" onClick={() => show("Tick creators in the Creators tab first")}>
                ⬇️ Only the ticked (0)
              </button>
            </div>
          </div>
          <div className="us-row">
            <span className="us-lab">
              🔗 Google{" "}
              <br />
              Sheet
            </span>
            <form
              className="us-ctl"
              onSubmit={(e) => {
                e.preventDefault();
                if (!/docs\.google\.com\/spreadsheets/.test(gsheet)) return show("Paste a docs.google.com/spreadsheets link");
                show("Google Sheet linked — it syncs every 15 minutes");
              }}
            >
              <input className="ad-input us-link" value={gsheet} onChange={(e) => setGsheet(e.target.value)} placeholder="Paste your Google Sheet link (https://docs.google.com/spreadsheets/…)" aria-label="Google Sheet link" />
              <button type="submit" className="ad-btn ad-btn--primary us-b">
                Link it
              </button>
            </form>
          </div>
        </div>

        {mode !== "history" && (
          <>
            <MsgOff />
            <p className="us-desc">
              Google Sheet link, Excel / CSV, or a Word file (table or a simple list). Give every creator a <b>Status</b>— the exact step they are on. They get <b>one message for that step</b>: Approved → the invite; a later step → only that step’s message. Creators already on Geek OS go on that step now; new ones register, connect Instagram and complete their profile (pre-filled from your sheet) and then land on their step.
            </p>
          </>
        )}

        <Link href={mode === "help" ? base : `${base}/help`} className="us-fold">
          ▸ 📘 How to set up your sheet — 🎁💰 Barter + Paid campaign template
        </Link>
        {mode === "history" ? (
          <div className="us-fold us-fold--open">
            <Link href={base} className="us-fold__t">
              ▾ 🗂 Upload history — every upload, when, how many creators and who
            </Link>
            <div className="c2-tw">
              <table className="c2-t us-t">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Source</th>
                    <th>Rows</th>
                    <th>Uploaded</th>
                    <th>Skipped</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {HISTORY.map((h) => (
                    <tr key={h[0]}>
                      {h.map((v, i) => (
                        <td key={i}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Link href={`${base}/history`} className="us-fold">
            ▸ 🗂 Upload history — every upload, when, how many creators and who
          </Link>
        )}

        <div className="us-act">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.doc,.docx,.txt" hidden onChange={onFile} />
          <button type="button" className="ad-btn ad-btn--primary" onClick={() => fileRef.current?.click()}>
            📄 Choose file
          </button>
          <input className="ad-input us-paste" value={link} onChange={(e) => setLink(e.target.value)} placeholder="or paste a Google Sheet link" aria-label="Google Sheet link" />
          <button type="button" className="ad-btn ad-btn--ghost" onClick={() => (link.trim() ? start("Google Sheet") : show("Paste a Google Sheet link first"))}>
            Load sheet
          </button>
          <Link href={`/admin/campaigns/${id}/find`} className="ad-btn ad-btn--ghost">
            🎯 Pick from Geek OS instead
          </Link>
        </div>
        <details className="us-rows">
          <summary>…or paste rows (copy cells from Sheets / Excel / Word)</summary>
          <textarea className="ad-input" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Name\tInstagram\tWhatsApp\tStatus\nAsha Rao\t@asha.creates\t+91 98765 43210\tApproved"} rows={5} />
          <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => (paste.trim() ? start("pasted rows") : show("Paste some rows first"))}>
            Use these rows
          </button>
        </details>
      </UploadCard>

      {mode === "help" && (
        <div className="us-wrap" onClick={() => router.push(base)}>
          <aside className="us-guide" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="How to set up your sheet">
            <Link href={base} className="us-x" aria-label="Close">
              ✕
            </Link>
            <p className="us-eye">Bulk upload · Guide</p>
            <h2>📘 How to set up your sheet</h2>
            <p className="us-gsub">🎁💰 Barter + Paid campaign template · one creator per row · keep the first row as column names</p>
            <h3>📝 Step by step</h3>
            <p className="us-gtxt">
              1. Download the template (Excel or CSV) or copy it into a new Google Sheet. 2. One creator per row. 3. Every row needs WhatsApp, Email or Instagram — best is WhatsApp + email. 4. Status = the step the creator is on (blank = Applied). 5. Some steps need one more column — a row without it is put one step back until you add it.
            </p>
            <hr />
            <h3>🏷 Statuses — write exactly this in the Status column</h3>
            <div className="us-gtw">
              <table className="c2-t us-gt">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>What happens</th>
                    <th>Row also needs</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {GUIDE.map((g) => (
                    <tr key={g[0]}>
                      {g.map((v, i) => (
                        <td key={i}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </aside>
        </div>
      )}
      {toast}

      <style>{`
        .us-sheet { padding: 22px 20px 34px; border: 1px solid var(--ad-line); border-radius: 14px; }
        .us-sheet__t { font-size: 12px; line-height: 1.4; color: var(--ad-muted); }
        .us-sheet__t b { font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        .us-row { display: flex; align-items: center; gap: 16px; margin-top: 6px; }
        .us-row + .us-row { margin-top: 15px; }
        .us-lab { width: 83px; flex-shrink: 0; font-size: 12px; font-weight: 700; line-height: 1.33; color: var(--ad-ink); }
        .us-ctl { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
        .us-sel { width: 160px; height: 43px; padding: 0 12px; -webkit-appearance: none; appearance: none; font-size: 14px; color: #293652; cursor: pointer; }
        .us-b { height: 43px; padding: 0 15px; }
        .us-or { font-size: 12px; color: var(--ad-muted); margin: 0 4px; }
        .us-link { width: 270px; height: 43px; }
        .us-desc { margin-top: 18px; font-size: 12px; line-height: 1.55; color: var(--ad-muted); }
        .us-desc b { font-weight: 700; }
        .us-card .c2-note, .up-card .c2-note { margin-top: 15px; }
        .us-fold { display: block; margin-top: 14px; padding: 14px 15px; border: 1px solid var(--ad-line); border-radius: 14px; font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        a.us-fold:hover { border-color: #cfd2ee; background: var(--ad-soft-2); }
        .us-fold--open { padding-bottom: 10px; }
        .us-fold__t { display: block; }
        .us-t { margin-top: 13px; font-weight: 400; }
        .us-t td { height: 48px; padding-top: 6px; padding-bottom: 6px; }
        .us-act { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
        .us-act .ad-btn { height: 42px; }
        .us-paste { width: 270px; height: 42px; }
        .us-rows { margin-top: 16px; font-size: 12px; color: var(--ad-muted); }
        .us-rows summary { cursor: pointer; list-style: none; }
        .us-rows summary::before { content: "▸ "; }
        .us-rows[open] summary::before { content: "▾ "; }
        .us-rows textarea { margin: 10px 0; font-family: ui-monospace, monospace; font-size: 12px; }

        .us-wrap { position: fixed; inset: 0; z-index: 90; background: rgba(20,33,59,.28); animation: adFade .15s ease; }
        .us-guide { position: absolute; right: 0; top: 0; bottom: 0; width: min(750px, 100%); padding: 30px 30px 30px 20px; overflow-y: auto; background: #fff; box-shadow: -20px 0 60px -30px rgba(20,33,59,.5); animation: usIn .2s ease; }
        @keyframes usIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
        .us-x { position: absolute; right: 30px; top: 30px; width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: var(--ad-soft); color: var(--ad-muted-2); font-size: 14px; }
        .us-eye { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8b92aa; }
        .us-guide h2 { margin-top: 18px; font-family: var(--ad-head); font-size: 25px; font-weight: 800; letter-spacing: -0.9px; color: var(--ad-ink); }
        .us-gsub { margin-top: 20px; font-size: 12px; color: var(--ad-muted); }
        .us-guide h3 { margin: 18px 0 0; font-size: 13px; font-weight: 700; color: var(--ad-ink); }
        .us-gtxt { margin-top: 13px; font-size: 12px; line-height: 1.55; color: var(--ad-muted); }
        .us-guide hr { margin: 20px 0 0; border: 0; border-top: 1px solid var(--ad-line); }
        .us-gtw { overflow-x: auto; margin-top: 16px; }
        .us-gt td { height: 48px; padding-top: 6px; padding-bottom: 6px; }

        @media (max-width: 640px) {
          .us-sheet { padding: 16px 14px; }
          .us-row { flex-direction: column; align-items: flex-start; gap: 8px; }
          .us-lab br { display: none; }
          .us-lab { width: auto; }
          .us-sel, .us-link, .us-paste { width: 100%; }
          .us-ctl { width: 100%; }
          .us-act .ad-btn { flex: 1 1 auto; }
          .us-guide { padding: 22px 18px; }
          .us-x { right: 18px; top: 18px; }
          .us-guide h2 { font-size: 21px; padding-right: 40px; }
        }
      `}</style>
    </AdminShell>
  );
}
