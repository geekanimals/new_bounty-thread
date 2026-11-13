"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { useToast, downloadFile, downloadXlsx, TableState, when } from "@/components/admin/campaign2/kit";
import { useRpc, rpc, errText } from "@/lib/supabase";
import { UploadCard, MsgOff, saveUpload, buildUpload, readUploadFile, readPasted, readSheetLink, statusesFor, useUploadKind, KIND_LABEL } from "@/components/admin/campaign2/upload";

// 📄 Campaign sheet ke columns — purane SH_COLS jaisa (bulk upload wale hi columns, wapas upload ho sake)
const SH_COLS = [["Name", "name"], ["Instagram", "instagram"], ["WhatsApp", "whatsapp"], ["Email", "email"], ["City", "city"], ["Status", "status"], ["Address", "address"], ["State", "state"], ["PIN code", "pincode"], ["Courier", "courier"], ["Tracking", "tracking"], ["Video link", "video_link"], ["Post link", "post_link"]];
const SHIP = ["Address", "State", "PIN code", "Courier", "Tracking"];

/**
 * Bulk upload step 1 — 3 roop (har ek apna route):
 *  mode="upload"  → /upload
 *  mode="help"    → /upload/help (guide drawer khula)
 *  mode="history" → /upload/history (upload history khuli)
 * Data: api.campaign_sheet_rows + api.campaign_sheet_link_get (download / Google Sheet), api.campaign_upload_history (history).
 * Sheet padhna browser mein (Excel / CSV / Word / Google Sheet / paste) → sessionStorage → /match.
 */
export default function UploadStart({ id, mode = "upload" }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [toast, show] = useToast();
  const kind = useUploadKind(id);
  const skip = !id || id === "sample";
  const sheet = useRpc("admin", "api.campaign_sheet_rows", { p_campaign: id }, { skip });
  const link = useRpc("admin", "api.campaign_sheet_link_get", { p_campaign: id }, { skip });
  const hist = useRpc("admin", "api.campaign_upload_history", { p_campaign: id }, { skip: skip || mode !== "history" });
  const [step, setStep] = useState("");
  const [gsheet, setGsheet] = useState(null); // null = jo link saved hai wahi dikhao
  const [sheetUrl, setSheetUrl] = useState("");
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState("");
  const base = `/admin/campaigns/${id}/upload`;
  const steps = statusesFor(kind);
  const guide = steps.map((s, i) => [`${i + 1} ${s[1]}`, s[2], s[4] || "—", s[3] === "no message" ? "—" : `✉️ ${s[3]}`]);

  const rows = (sheet.data && sheet.data.rows) || [];
  const cnt = (k) => rows.filter((r) => (k === "" ? true : k === "out" ? /^Out/.test(r.status || "") : r.status_key === k && !/^Out/.test(r.status || ""))).length;
  const opts = [["", "All creators"], ...steps.map((s) => [s[0], s[1]]), ["out", "Out of the campaign"]];
  const saved = link.data || null;
  const gval = gsheet == null ? (saved && saved.sheet_url) || "" : gsheet;

  // sheet → match step
  const start = (src, aoa) => {
    try {
      const up = buildUpload(aoa, src, kind);
      if (!up.rows.length) return show("That sheet has no creator rows.");
      saveUpload(id, up);
      router.push(`${base}/match`);
    } catch (e) {
      show(errText(e));
    }
  };
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy("file");
    try {
      start(f.name, await readUploadFile(f));
    } catch (er) {
      show(errText(er));
    }
    setBusy("");
  };
  const loadLink = async () => {
    const u = sheetUrl.trim();
    if (!u) return show("Paste a Google Sheet link first");
    setBusy("link");
    try {
      start("Google Sheet", await readSheetLink(u));
    } catch (er) {
      show(errText(er));
    }
    setBusy("");
  };

  // ⬇ campaign sheet (purane shDownload jaisa)
  const download = async (fmt) => {
    const list = rows.filter((r) => (step === "" ? true : step === "out" ? /^Out/.test(r.status || "") : r.status_key === step && !/^Out/.test(r.status || "")));
    if (!list.length) return show("No creators to download for that choice.");
    const cols = SH_COLS.filter(([h]) => !(kind === "paid" && SHIP.includes(h)));
    const aoa = [cols.map((c) => c[0]), ...list.map((r) => cols.map(([, k]) => (k === "instagram" && r[k] ? "@" + String(r[k]).replace(/^@/, "") : r[k] == null ? "" : String(r[k]))))];
    const lab = step ? (opts.find((o) => o[0] === step) || [])[1] || step : "";
    const nm = `${String(sheet.data.campaign || "campaign").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 40) || "campaign"}-creators${lab ? "-" + lab.replace(/[^\w]+/g, "-").toLowerCase() : ""}`;
    try {
      if (fmt === "csv") downloadFile(nm + ".csv", aoa);
      else await downloadXlsx(nm + ".xlsx", aoa, "Creators");
      show(`⬇ ${list.length} creator${list.length !== 1 ? "s" : ""} downloaded — same columns as the bulk upload, so you can upload it again`);
    } catch (e) {
      show(errText(e));
    }
  };
  const linkSheet = async (e) => {
    e.preventDefault();
    const u = gval.trim();
    if (u && !/^https:\/\/docs\.google\.com\/spreadsheets\//i.test(u)) return show("Paste the Google Sheet link (https://docs.google.com/spreadsheets/…)");
    setBusy("gs");
    const { error } = await rpc("admin", "api.campaign_sheet_link", { p_campaign: id, p_sheet_url: u || null, p_new_token: false });
    setBusy("");
    if (error) return show(errText(error));
    show("🔗 Sheet linked — the sheet’s Apps Script keeps it up to date");
    setGsheet(null);
    link.reload(true);
  };
  const ups = (hist.data && hist.data.uploads) || [];

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <UploadCard id={id} step={1}>
        <div className="us-sheet">
          <p className="us-sheet__t">
            <b>📄 Campaign sheet</b> <span>— every creator in the same columns as the bulk upload: download it, edit it, upload it again · or link a Google Sheet that keeps itself up to date</span>
          </p>
          <div className="us-row">
            <span className="us-lab">⬇️ Download</span>
            <div className="us-ctl">
              <select className="ga-input us-sel" value={step} onChange={(e) => setStep(e.target.value)} aria-label="Which creators">
                {opts.map(([k, l]) => {
                  const n = sheet.data ? cnt(k) : null;
                  if (k && n === 0) return null;
                  return (
                    <option key={k} value={k}>
                      {l}
                      {n != null ? ` (${n})` : ""}
                    </option>
                  );
                })}
              </select>
              <button type="button" className="ga-btn ga-btn--primary us-b" onClick={() => download("xlsx")} disabled={!sheet.data}>
                ⬇️ Excel
              </button>
              <button type="button" className="ga-btn ga-btn--ghost us-b" onClick={() => download("csv")} disabled={!sheet.data}>
                ⬇️ CSV
              </button>
              <span className="us-or">or</span>
              <button type="button" className="c2-tbtn" onClick={() => show("Tick creators in the Creators tab and download from there")} title="Tick creators in the Creators tab first">
                ⬇️ Only the ticked (0)
              </button>
            </div>
          </div>
          {sheet.error && <p className="us-err">{errText(sheet.error)}</p>}
          <div className="us-row">
            <span className="us-lab">
              🔗 Google{" "}
              <br />
              Sheet
            </span>
            <form className="us-ctl" onSubmit={linkSheet}>
              <input className="ga-input us-link" value={gval} onChange={(e) => setGsheet(e.target.value)} placeholder="Paste your Google Sheet link (https://docs.google.com/spreadsheets/…)" aria-label="Google Sheet link" />
              <button type="submit" className="ga-btn ga-btn--primary us-b" disabled={busy === "gs"}>
                {busy === "gs" ? "Saving…" : saved ? "Save" : "Link it"}
              </button>
            </form>
          </div>
          {saved && saved.sheet_url && <p className="us-sync">{saved.last_pull_at ? `✅ Last updated ${when(saved.last_pull_at)} · ${saved.pulls || 0} update${(saved.pulls || 0) !== 1 ? "s" : ""}` : "⏳ Not updated yet — add the Geek OS script in the sheet once"}</p>}
        </div>

        {mode !== "history" && (
          <>
            <MsgOff id={id} />
            <p className="us-desc">
              Google Sheet link, Excel / CSV, or a Word file (table or a simple list). Give every creator a <b>Status</b>— the exact step they are on. They get <b>one message for that step</b>: Approved → the invite; a later step → only that step’s message. Creators already on Geek OS go on that step now; new ones register, connect Instagram and complete their profile (pre-filled from your sheet) and then land on their step.
            </p>
          </>
        )}

        <Link href={mode === "help" ? base : `${base}/help`} className="us-fold">
          ▸ 📘 How to set up your sheet — {KIND_LABEL[kind]} template
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
                  <TableState cols={6} loading={hist.loading && !hist.data} error={!hist.data && hist.error} onRetry={hist.reload} empty={hist.data && !ups.length && "No bulk upload on this campaign yet."} />
                  {ups.map((u, i) => {
                    const nu = (u.not_uploaded || []).length || u.skipped || 0;
                    const ok = (u.new_count || 0) + (u.updated_count || 0);
                    return (
                      <tr key={u.batch_id || i}>
                        <td>{when(u.at)}</td>
                        <td title={u.note || ""}>{u.source || u.file || "Bulk upload"}</td>
                        <td>{ok + nu}</td>
                        <td>{ok}</td>
                        <td title={(u.not_uploaded || []).slice(0, 10).map((x) => `Row ${x.row}: ${x.reason}`).join("\n")}>{nu}</td>
                        <td>{u.who || "—"}</td>
                      </tr>
                    );
                  })}
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
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.xlsm,.ods,.csv,.tsv,.doc,.docx,.txt" hidden onChange={onFile} />
          <button type="button" className="ga-btn ga-btn--primary" onClick={() => fileRef.current?.click()} disabled={busy === "file"}>
            {busy === "file" ? "Reading…" : "📄 Choose file"}
          </button>
          <input className="ga-input us-paste" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="or paste a Google Sheet link" aria-label="Google Sheet link to upload" />
          <button type="button" className="ga-btn ga-btn--ghost" onClick={loadLink} disabled={busy === "link"}>
            {busy === "link" ? "Loading…" : "Load sheet"}
          </button>
          <Link href={`/admin/campaigns/${id}/find`} className="ga-btn ga-btn--ghost">
            🎯 Pick from Geek OS instead
          </Link>
        </div>
        <details className="us-rows">
          <summary>…or paste rows (copy cells from Sheets / Excel / Word)</summary>
          <textarea className="ga-input" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Name\tInstagram\tWhatsApp\tStatus\nAsha Rao\t@asha.creates\t+91 98765 43210\tApproved"} rows={5} />
          <button type="button" className="ga-btn ga-btn--ghost ga-btn--sm" onClick={() => (paste.trim() ? start("pasted rows", readPasted(paste)) : show("Paste some rows first"))}>
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
            <p className="us-gsub">{KIND_LABEL[kind]} template · one creator per row · keep the first row as column names</p>
            <h3>📝 Step by step</h3>
            <p className="us-gtxt">
              1. Download the campaign sheet (Excel or CSV) or copy it into a new Google Sheet. 2. One creator per row. 3. Every row needs WhatsApp, Email or Instagram — best is WhatsApp + email. 4. Status = the step the creator is on (blank = Applied). 5. Some steps need one more column — a row without it can’t go on that step until you add it.
              {kind !== "barter" ? " 6. Fee, Advance %, Pay days, UPI / Account no + IFSC columns set each creator’s payment as they land." : ""}
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
                  {guide.map((g) => (
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
        .us-act .ga-btn { height: 42px; }
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
          .us-act .ga-btn { flex: 1 1 auto; }
          .us-guide { padding: 22px 18px; }
          .us-x { right: 18px; top: 18px; }
          .us-guide h2 { font-size: 21px; padding-right: 40px; }
        }
        .us-err { margin-top: 10px; font-size: 12px; color: #d4493f; }
        .us-sync { margin-top: 12px; font-size: 12px; color: var(--ad-muted); }
      `}</style>
    </AdminShell>
  );
}
