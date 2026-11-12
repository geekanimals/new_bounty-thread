"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { TargetFields, UploadedCreators, NO_CAMP, cuLoad, cuSave } from "@/components/admin/creator/UploadParts";

const COLS = ["Name", "Instagram", "WhatsApp", "Email", "City", "State", "Followers", "Category"];
const OPTS = ["Name", "Instagram", "WhatsApp", "Email", "City", "State", "Followers", "Niche", "— Skip —"];
const AUTO = { Name: "Name", Instagram: "Instagram", WhatsApp: "WhatsApp", Email: "Email", City: "City", State: "State", Followers: "Followers", Category: "Niche" };
const ROWS = [
  ["Asha Rao", "@asha.creates", "+91 98765 43210", "asha@example.com", "Mumbai", "Maharashtra", "18,200", "Food"],
  ["Meera Shah", "@meera.styles", "+91 90000 11111", "—", "Pune", "Maharashtra", "12,700", "Fashion"],
  ["Kabir Sen", "@kabir.cooks", "+91 98300 12345", "kabir@example.com", "Kolkata", "West Bengal", "9,400", "Food"],
  ["Rohit Jain", "—", "—", "—", "Jaipur", "Rajasthan", "—", "Travel"],
];

/* Creator upload — step 2: sheet aa gayi, columns milao, preview (Figma 072) */
export default function CreatorUploadMatch() {
  const router = useRouter();
  const [brand, setBrand] = useState("Olio Pizza");
  const [camp, setCamp] = useState("Mysore Pizzeria Launch");
  const [file, setFile] = useState("Mysore creators.xlsx");
  const [map, setMap] = useState(AUTO);
  const [invite, setInvite] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = cuLoad();
    if (s?.brand) {
      setBrand(s.brand);
      setCamp(s.camp);
      if (s.file) setFile(s.file);
    }
  }, []);

  const add = () => {
    setBusy(true);
    cuSave({ brand, camp, file, added: 18, invited: invite ? 18 : 0 });
    setTimeout(() => router.push("/admin/creator-upload/done"), 500);
  };
  const clear = () => {
    cuSave({ brand, camp });
    router.push("/admin/creator-upload");
  };
  const notSel = camp !== NO_CAMP;

  return (
    <AdminShell>
      <PageHead title="Creator upload" sub="Add creators who aren’t on Geek OS yet and invite them to the live campaigns." />
      <section className="ad-card cu2-card">
        <div className="cu2-top">
          <h2 className="ad-h2">📥 Creator upload</h2>
          {notSel && <span className="ad-badge ad-badge--violet">Not selected for: {camp}</span>}
        </div>
        <div className="cu2-fields">
          <TargetFields brand={brand} camp={camp} onBrand={setBrand} onCamp={setCamp} />
        </div>

        <p className="cu2-ok">
          <span>✅</span>
          <span>
            <b>26 rows</b>from {file} · <b>24</b>with WhatsApp / email / Instagram ·
          </span>
          <span className="ad-badge ad-badge--orange">2 without contact — skipped</span>
        </p>

        <p className="cu2-h">
          <b>Match the columns</b> — picked automatically, change any that look wrong
        </p>
        <div className="cu2-map">
          {COLS.map((c) => (
            <label key={c} className={`cu2-m ${["Instagram", "WhatsApp", "Followers"].includes(c) ? "cu2-m--stack" : ""}`}>
              <span>{c}</span>
              <select value={map[c]} onChange={(e) => setMap({ ...map, [c]: e.target.value })}>
                {OPTS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="cu2-table">
          <table className="ad-table">
            <thead>
              <tr>
                <th>#</th>
                {COLS.map((c) => (
                  <th key={c}>{map[c] === "— Skip —" ? <s>{c}</s> : c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={i} className={r[1] === "—" && r[2] === "—" && r[3] === "—" ? "is-skip" : ""}>
                  <td>{i + 1}</td>
                  {r.map((v, j) => (
                    <td key={j}>{map[COLS[j]] === "— Skip —" ? "—" : v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cu2-foot">
          <label className="cu2-chk">
            <input type="checkbox" checked={invite} onChange={(e) => setInvite(e.target.checked)} />
            Send the “not selected — explore more campaigns” invite now (WhatsApp + email)
          </label>
          <button type="button" className="ad-btn ad-btn--primary cu2-add" onClick={add} disabled={busy}>
            {busy ? "Adding…" : "Add 24 creators"}
          </button>
          <button type="button" className="cu2-clear" onClick={clear}>
            Clear
          </button>
        </div>
      </section>
      <UploadedCreators />

      <style>{`
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
        .cu2-table .ad-table th { background: transparent; padding: 12px 11px; }
        .cu2-table .ad-table td { height: 48px; padding: 10px 11px; }
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
