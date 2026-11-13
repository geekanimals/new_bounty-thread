"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { TargetFields, UploadedCreators, CU_FIELDS, cuRow, cuLoad, cuSave } from "@/components/admin/creator/UploadParts";
import { rpc, errText } from "@/lib/supabase";

/* Creator upload — step 2: sheet aa gayi, columns milao, preview, add (Figma 072). creator_upload_v2 — purane app jaisa */
export default function CreatorUploadMatch() {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [camp, setCamp] = useState("");
  const [sheet, setSheet] = useState(null);
  const [invite, setInvite] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const s = cuLoad();
    if (!s || !s.sheet) return router.replace("/admin/creator-upload");
    setBrand(s.brand || "");
    setCamp(s.camp || "");
    setSheet(s.sheet);
    setInvite(s.send !== false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const map = (sheet && sheet.map) || {};
  const R = sheet ? sheet.rows.map((r) => cuRow(map, r)) : [];
  const has = (x) => x.phone || x.email || x.handle;
  const ok = R.filter(has).length;
  const setCol = (k, v) => {
    const m = { ...map };
    if (v === "") delete m[k];
    else m[k] = +v;
    const next = { ...sheet, map: m };
    setSheet(next);
    cuSave({ brand, camp, sheet: next, send: invite });
  };

  const add = async () => {
    const rows = R.filter(has);
    if (!rows.length) return;
    setBusy(true);
    setErr("");
    const r = await rpc("admin", "api.creator_upload_v2", { p_rows: rows, p_send: invite, p_brand: brand || null, p_campaign: camp || null });
    setBusy(false);
    if (r.error) return setErr(errText(r.error));
    cuSave({ brand: "", camp: "", result: r.data || {} });
    router.push("/admin/creator-upload/done");
  };
  const clear = () => {
    cuSave({ brand, camp });
    router.push("/admin/creator-upload");
  };
  const notSel = !!camp;
  const show = (k, v) => (k === "handle" ? String(v).replace(/^https?:\/\/(www\.)?instagram\.com\//i, "@").replace(/\/$/, "") : v) || "—";

  if (!sheet) return <AdminShell><p className="cu2-wait">Loading sheet…</p></AdminShell>;

  return (
    <AdminShell>
      <PageHead title="Creator upload" sub="Add creators who aren’t on Geek OS yet and invite them to the live campaigns." />
      <section className="ga-card cu2-card">
        <div className="cu2-top">
          <h2 className="ga-h2">📥 Creator upload</h2>
          {notSel && <span className="ga-badge ga-badge--violet">Not selected for campaign</span>}
        </div>
        <div className="cu2-fields">
          <TargetFields brand={brand} camp={camp} onBrand={setBrand} onCamp={setCamp} />
        </div>

        <p className="cu2-ok">
          <span>✅</span>
          <span>
            <b>{sheet.rows.length} rows</b>from {sheet.src} · <b>{ok}</b>with WhatsApp / email / Instagram
            {sheet.rows.length - ok ? " ·" : ""}
          </span>
          {sheet.rows.length - ok > 0 && <span className="ga-badge ga-badge--orange">{sheet.rows.length - ok} without contact — skipped</span>}
        </p>

        <p className="cu2-h">
          <b>Match the columns</b> — picked automatically, change any that look wrong
        </p>
        <div className="cu2-map">
          {CU_FIELDS.map(([k, l]) => (
            <label key={k} className={`cu2-m ${["handle", "phone", "followers"].includes(k) ? "cu2-m--stack" : ""}`}>
              <span>{l}</span>
              <select value={map[k] ?? ""} onChange={(e) => setCol(k, e.target.value)}>
                <option value="">—</option>
                {sheet.head.map((h, i) => (
                  <option key={i} value={i}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="cu2-table">
          <table className="ga-table">
            <thead>
              <tr>
                <th>#</th>
                {CU_FIELDS.map(([k, l]) => (
                  <th key={k}>{map[k] == null ? <s>{l}</s> : l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {R.slice(0, 200).map((x, i) => (
                <tr key={i} className={has(x) ? "" : "is-skip"}>
                  <td>{i + 1}</td>
                  {CU_FIELDS.map(([k]) => (
                    <td key={k}>{show(k, x[k])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cu2-foot">
          <label className="cu2-chk">
            <input type="checkbox" checked={invite} onChange={(e) => setInvite(e.target.checked)} />
            Send the {notSel ? "“not selected — explore more campaigns”" : "“explore live campaigns”"} invite now (WhatsApp + email)
          </label>
          <button type="button" className="ga-btn ga-btn--primary cu2-add" onClick={add} disabled={busy || !ok}>
            {busy ? "Adding…" : `Add ${ok} creator${ok === 1 ? "" : "s"}`}
          </button>
          <button type="button" className="cu2-clear" onClick={clear}>
            Clear
          </button>
        </div>
        {err && <p className="cu2-err">{err}</p>}
      </section>
      <UploadedCreators brand={brand} />

      <style>{`
        .cu2-wait { padding: 40px 0; color: var(--ad-muted); }
        .cu2-err { margin-top: 12px; padding: 9px 12px; border-radius: 10px; background: var(--ad-red-bg); color: var(--ad-red); font-size: 12.5px; font-weight: 700; }
        .cu2-card { padding: 25px 22px 21px; }
        .cu2-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .cu2-fields { margin-top: 15px; }
        .cu2-fields .cut-l b { font-size: 14px; }
        .cu2-ok { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; margin-top: 15px; padding: 13px 15px; border-radius: 12px; background: #e6f7ef; border: 1px solid #bfe8d4; font-size: 12px; color: #168560; }
        .cu2-ok b { font-weight: 700; margin-right: 2px; }
        .cu2-h { margin-top: 18px; font-size: 12px; color: var(--ad-muted); }
        .cu2-h b { font-size: 14px; font-weight: 700; color: var(--ad-ink); margin-right: 2px; }
        .cu2-map { display: grid; grid-template-columns: repeat(8, auto); justify-content: space-between; align-items: start; gap: 10px; margin-top: 8px; }
        .cu2-m { display: flex; align-items: center; gap: 2px; }
        .cu2-m--stack { flex-direction: column; align-items: flex-start; gap: 1px; }
        .cu2-m span { font-size: 10px; text-transform: uppercase; letter-spacing: .3px; color: var(--ad-muted); }
        .cu2-m select { height: 38px; min-width: 60px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 10px; color: var(--ad-text); appearance: none; outline: none; cursor: pointer; }
        .cu2-m--stack select { min-width: 86px; }
        .cu2-m select:focus { border-color: var(--ad-primary); }
        .cu2-table { margin-top: 24px; overflow-x: auto; }
        .cu2-table .ga-table th { background: transparent; padding: 12px 11px; }
        .cu2-table .ga-table td { height: 48px; padding: 10px 11px; }
        .cu2-table tr.is-skip td { color: #9aa1b3; }
        .cu2-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 14px; margin-top: 0; }
        .cu2-chk { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ad-ink); cursor: pointer; }
        .cu2-chk input { width: 13px; height: 13px; accent-color: var(--ad-primary); }
        .cu2-add { height: 41px; }
        .cu2-clear { border: 0; background: none; padding: 0 8px; font-size: 14px; font-weight: 800; color: #6657e9; }
        @media (max-width: 1023px) { .cu2-map { grid-template-columns: repeat(4, minmax(0, 1fr)); } .cu2-m, .cu2-m--stack { flex-direction: column; align-items: stretch; } .cu2-m select { width: 100%; } }
        @media (max-width: 640px) {
          .cu2-card { padding: 18px 16px; }
          .cu2-map { grid-template-columns: 1fr 1fr; }
          .cu2-add { flex: 1; }
        }
      `}</style>
    </AdminShell>
  );
}
