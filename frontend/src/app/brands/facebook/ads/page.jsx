"use client";

import { useState } from "react";
import BrandShell, { ToneIcon } from "@/components/brands/BrandShell";
import FacebookTabs from "@/components/brands/FacebookTabs";
import { FB_ADS } from "@/components/brands/data";
import { AlertTriangle, Pause, Play, ChevronDown, Check } from "@/components/ui/Icons";

/** /brands/facebook/ads — Meta ads ko pause / resume karna */
export default function FacebookAds() {
  const [rows, setRows] = useState(FB_ADS.rows);
  const [shown, setShown] = useState(4);
  const [toast, setToast] = useState("");

  const flip = (id) => {
    const row = rows.find((r) => r.id === id);
    const on = !row.on;
    setRows((rs) =>
      rs.map((r) =>
        r.id === id ? { ...r, on, ends: on ? "Active · resumed just now" : "Paused by you · just now" } : r
      )
    );
    setToast(`${row.name} ${on ? "resumed" : "paused"} on Meta Ads`);
    setTimeout(() => setToast(""), 2400);
  };

  return (
    <BrandShell>
      <title>Facebook ads — Geek OS Brand</title>
      <FacebookTabs />

      <div className="fa-stats">
        {FB_ADS.stats.map((st, i) => (
          <div key={st.label} className={`br-stat ${st.dark ? "br-stat--dark" : ""}`}>
            <p className="br-stat__label">
              <ToneIcon icon={st.icon} tone={st.dark ? "dark" : ["violet", "blue", "green"][i - 1]} size={30} />
              {st.label}
            </p>
            <p className="br-stat__value">{st.value}</p>
            {st.note && <p className="br-stat__note">{st.note}</p>}
          </div>
        ))}
      </div>

      <p className="fa-warn">
        <AlertTriangle size={15} />
        Pause and Resume change the campaign on Meta Ads right away. Budgets and new ads are edited in Meta Ads Manager.
      </p>

      <div className="br-table-wrap">
        <table className="br-table fa-table">
          <thead>
            <tr>
              <th>Ad campaign</th>
              <th>On</th>
              <th>Budget / day</th>
              <th>Spent</th>
              <th>Results</th>
              <th>Cost each</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, shown).map((r) => (
              <tr key={r.id} className={r.on ? "" : "is-off"}>
                <td>
                  <strong className="fa-name">{r.name}</strong>
                  <small className={`fa-st ${r.on ? "is-on" : ""}`}>{r.ends}</small>
                </td>
                <td>
                  <button
                    type="button"
                    className={`br-toggle ${r.on ? "is-on" : ""}`}
                    role="switch"
                    aria-checked={r.on}
                    aria-label={`${r.name} on or off`}
                    onClick={() => flip(r.id)}
                  />
                </td>
                <td>
                  <b>{r.budget}</b>
                </td>
                <td>{r.spent}</td>
                <td>
                  <b>{r.results}</b>
                </td>
                <td>{r.each}</td>
                <td>
                  {r.on ? (
                    <button type="button" className="br-btn br-btn--ghost br-btn--sm fa-btn" onClick={() => flip(r.id)}>
                      <Pause size={12} /> Pause
                    </button>
                  ) : (
                    <button type="button" className="br-btn br-btn--primary br-btn--sm fa-btn" onClick={() => flip(r.id)}>
                      <Play size={12} /> Resume
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="br-more fa-more">
          {shown < rows.length ? (
            <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 4)}>
              Load more <ChevronDown size={14} />
            </button>
          ) : (
            <span>That’s all your ad campaigns this month</span>
          )}
        </div>
      </div>

      {toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .fa-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        .fa-warn {
          display: flex; align-items: flex-start; gap: 10px; margin: 18px 0; padding: 12px 16px; border-radius: 12px;
          background: var(--br-orange-bg); color: #b45f05; font-size: 13px; line-height: 1.5;
        }
        .fa-warn svg { flex-shrink: 0; margin-top: 1px; }
        .fa-table td b { font-weight: 800; }
        .fa-name { display: block; font-size: 13px; font-weight: 700; }
        .fa-st { display: block; margin-top: 2px; font-size: 11.5px; color: var(--br-muted); }
        .fa-st.is-on { color: var(--br-green); }
        .fa-table tr.is-off td { background: #fafafd; }
        .fa-btn { min-width: 92px; }
        .fa-more { padding: 6px 0 16px; }
        .fa-more span { font-size: 12.5px; color: var(--br-faint); }

        @media (max-width: 1100px) {
          .fa-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .fa-stats { gap: 10px; }
          .fa-warn { font-size: 12.5px; }
        }
      `}</style>
    </BrandShell>
  );
}
