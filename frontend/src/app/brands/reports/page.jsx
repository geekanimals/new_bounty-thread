"use client";

import { useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import { CAMPAIGNS, YEAR_SUMMARY } from "@/components/brands/data";
import { BarChart, Download, Check, ChevronDown } from "@/components/ui/Icons";

const FIRST = 5;

/** /brands/reports — har campaign ki ready report: PDF + Excel */
export default function BrandReports() {
  const [shown, setShown] = useState(FIRST);
  const [toast, setToast] = useState("");
  const list = CAMPAIGNS.filter((c) => c.status !== "review");
  // Dummy: purane saal ki 2 aur reports "Load more" ke liye
  const older = [
    { id: "holi-colour-pop", title: "Holi Colour Pop", status: "completed", dates: "Mar 2026", views: "980K", sales: "₹2.4L", reportEng: "5.6%", gradient: "linear-gradient(120deg,#22c55e 0%,#a3e635 100%)" },
    { id: "valentine-red-edit", title: "Valentine Red Edit", status: "completed", dates: "Feb 2026", views: "760K", sales: "₹1.9L", reportEng: "6.1%", gradient: "linear-gradient(120deg,#be123c 0%,#fb7185 100%)" },
  ];
  const all = [...list, ...older];

  const download = (what, title) => {
    setToast(`${what} — ${title} is downloading…`);
    setTimeout(() => setToast(""), 2400);
  };

  return (
    <BrandShell>
      <title>Reports — Geek OS Brand</title>

      <p className="br-eyebrow">Insights</p>
      <h1 className="br-h1">Reports</h1>
      <p className="br-sub">Download a ready report for any campaign — PDF for your team, Excel for the numbers.</p>

      <section className="rp-year">
        <span className="rp-year__ic">
          <BarChart size={18} />
        </span>
        <div className="rp-year__txt">
          <strong>2026 so far — all campaigns</strong>
          <small>{YEAR_SUMMARY}</small>
        </div>
        <button type="button" className="rp-year__btn" onClick={() => download("Yearly PDF", "2026")}>
          <Download size={14} /> Yearly PDF
        </button>
      </section>

      <div className="rp-grid">
        {all.slice(0, shown).map((c) => {
          const live = c.status === "live";
          return (
            <article key={c.id} className="br-card rp-card">
              <div className="rp-cover" style={{ background: c.gradient }}>
                <small>Campaign report</small>
                <strong>{c.title}</strong>
              </div>
              <div className="rp-body">
                <div className="rp-meta">
                  <span>{live ? (c.ended ? c.ended : "Live · updated hourly") : c.dates}</span>
                  <span className={`br-badge br-badge--${live ? "blue" : "green"}`}>{live ? "Live" : "Final"}</span>
                </div>
                <div className="rp-nums">
                  <p>
                    <strong>{c.views}</strong>
                    <small>views</small>
                  </p>
                  <p>
                    <strong>{c.sales}</strong>
                    <small>sales</small>
                  </p>
                  <p>
                    <strong>{c.reportEng}</strong>
                    <small>eng.</small>
                  </p>
                </div>
                <div className="rp-actions">
                  <button type="button" className="br-btn br-btn--primary br-btn--sm" onClick={() => download("PDF", c.title)}>
                    <Download size={13} /> PDF
                  </button>
                  <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={() => download("Excel", c.title)}>
                    <Download size={13} /> Excel
                  </button>
                  {CAMPAIGNS.some((x) => x.id === c.id) ? (
                    <Link href={`/brands/campaigns/${c.id}/analytics`} className="br-link rp-preview">
                      Preview
                    </Link>
                  ) : (
                    <span className="rp-preview rp-preview--off">Archived</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {shown < all.length && (
        <div className="br-more">
          <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(all.length)}>
            Load more <ChevronDown size={14} />
          </button>
        </div>
      )}

      {toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .rp-year {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          margin: 22px 0 18px; padding: 18px 20px; border-radius: 18px;
          background: var(--br-hero); color: #fff;
        }
        .rp-year__ic { width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,.12); display: grid; place-items: center; flex-shrink: 0; }
        .rp-year__txt { flex: 1; min-width: 220px; }
        .rp-year__txt strong { display: block; font-size: 16px; font-weight: 800; }
        .rp-year__txt small { display: block; margin-top: 3px; font-size: 12.5px; color: rgba(255,255,255,.75); }
        .rp-year__btn {
          display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px;
          border: 0; border-radius: 10px; background: #fff; color: var(--br-ink); font-size: 13px; font-weight: 700;
        }

        .rp-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .rp-card { overflow: hidden; }
        .rp-cover { position: relative; height: 140px; padding: 18px; display: flex; flex-direction: column; justify-content: flex-end; color: #fff; }
        .rp-cover::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.18)); }
        .rp-cover small, .rp-cover strong { position: relative; z-index: 1; }
        .rp-cover small { font-size: 10.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; opacity: .9; }
        .rp-cover strong { margin-top: 4px; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
        .rp-body { padding: 16px; }
        .rp-meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12px; color: var(--br-muted); }
        .rp-nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0 14px; padding: 12px 14px; border-radius: 12px; background: #f4f5fa; }
        .rp-nums p { margin: 0; }
        .rp-nums p:nth-child(2) { text-align: center; }
        .rp-nums p:last-child { text-align: right; }
        .rp-nums strong { display: block; font-size: 16px; font-weight: 800; }
        .rp-nums small { display: block; font-size: 11px; color: var(--br-faint); }
        .rp-actions { display: flex; align-items: center; gap: 8px; }
        .rp-preview { margin-left: auto; }
        .rp-preview--off { font-size: 12.5px; font-weight: 600; color: var(--br-faint); }

        @media (max-width: 1100px) { .rp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .rp-grid { grid-template-columns: 1fr; }
          .rp-year { padding: 16px; }
          .rp-year__btn { width: 100%; justify-content: center; }
          .rp-cover { height: 120px; }
        }
      `}</style>
    </BrandShell>
  );
}
