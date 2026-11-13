"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, FileText, ChevronRight, Check } from "@/components/ui/Icons";
import { campaignCsv, campaignPdf } from "@/services/brand";

/**
 * Campaign ke 5 pages (Creators, Analytics, Links & sales, Brief, Activity) ka
 * common upar wala hissa: rangeen hero + funnel + tabs.
 * c = bCampaignHead(api.brand_campaign) — Excel / PDF purane campCsv / campPdf jaise.
 */
export default function CampaignTop({ c }) {
  const pathname = usePathname() || "";
  const [toast, setToast] = useState("");
  const base = `/brands/campaigns/${c.id}`;

  const tabs = [
    { label: "Creators", href: base, count: c.status === "review" ? null : c.creators },
    { label: "Analytics", href: `${base}/analytics` },
    { label: "Links & sales", href: `${base}/links` },
    { label: "Brief", href: `${base}/brief` },
    { label: "Activity", href: `${base}/activity`, count: c.status === "review" ? null : c.activity },
  ];
  const funnel = [
    { n: c.funnel.invited, label: "Invited" },
    { n: c.funnel.applied, label: "Applied" },
    { n: c.funnel.approved, label: "Approved by you" },
    { n: c.funnel.videoOk, label: "Video OK" },
    { n: c.funnel.live, label: "Live", green: true },
  ];

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2600);
  };
  // purana campCsv / campPdf
  const download = async (what) => {
    if (!c.id) return;
    if (what === "Excel") flash(`Excel for ${c.title} is downloading…`);
    const r = what === "Excel" ? await campaignCsv(c.id) : await campaignPdf(c.id);
    if (r.error) flash(r.error.message || String(r.error));
  };

  return (
    <div className="ct">
      <section className="ct-hero" style={{ background: c.hero }}>
        <div className="ct-hero__text">
          <p className="ct-hero__meta">
            <span className={`ct-pill ct-pill--${c.status}`}>{c.statusLabel}</span>
            {c.dates}
            {c.status === "live" && c.daysLeft > 0 && ` · ${c.daysLeft} days left`}
          </p>
          <h1>{c.title}</h1>
          <p className="ct-hero__sub">
            {c.product} · {c.deliver} · {c.budget}
          </p>
        </div>
        {c.status !== "review" && (
        <div className="ct-hero__btns">
          <button type="button" className="ct-excel" onClick={() => download("Excel")}>
            <Download size={14} /> Excel
          </button>
          <button type="button" className="ct-pdf" onClick={() => download("PDF report")}>
            <FileText size={14} /> PDF report
          </button>
        </div>
        )}
      </section>

      {c.status !== "review" && (
      <div className="ct-funnel">
        {funnel.map((f, i) => (
          <div key={f.label} className="ct-funnel__step">
            <strong className={f.green ? "is-green" : ""}>{f.n}</strong>
            <span>{f.label}</span>
            {i < funnel.length - 1 && <ChevronRight size={14} />}
          </div>
        ))}
      </div>
      )}

      <nav className="br-tabs ct-tabs" style={c.status === "review" ? { marginTop: 18 } : undefined} aria-label="Campaign sections">
        {tabs.map((t) => {
          const on = t.href === base ? pathname === base : pathname.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={on ? "is-active" : ""}>
              {t.label}
              {t.count ? <em>{t.count}</em> : null}
            </Link>
          );
        })}
      </nav>

      {toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .ct-hero {
          display: flex; align-items: center; justify-content: space-between; gap: 20px;
          padding: 26px 28px; border-radius: 20px; color: #fff;
          position: relative; overflow: hidden;
        }
        .ct-hero::after {
          content: ""; position: absolute; right: -60px; top: -80px; width: 260px; height: 260px;
          border-radius: 50%; background: rgba(255,255,255,.08); pointer-events: none;
        }
        .ct-hero__text { position: relative; z-index: 1; min-width: 0; }
        .ct-hero__meta { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin: 0; font-size: 12.5px; font-weight: 500; color: rgba(255,255,255,.88); }
        .ct-pill {
          display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 10px;
          border-radius: 999px; background: rgba(255,255,255,.92); font-size: 11px; font-weight: 700;
        }
        .ct-pill::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .ct-pill--live { color: #16a34a; }
        .ct-pill--review { color: #e07b06; }
        .ct-pill--completed { color: #3b3d55; }
        .ct-hero h1 { margin: 8px 0 6px; font-size: 30px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
        .ct-hero__sub { margin: 0; font-size: 13px; color: rgba(255,255,255,.85); }
        .ct-hero__btns { position: relative; z-index: 1; display: flex; gap: 10px; flex-shrink: 0; }
        .ct-excel, .ct-pdf {
          display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px;
          border-radius: 10px; font-size: 13px; font-weight: 700;
        }
        .ct-excel { border: 1px solid rgba(255,255,255,.4); background: rgba(255,255,255,.16); color: #fff; }
        .ct-excel:hover { background: rgba(255,255,255,.26); }
        .ct-pdf { border: 0; background: #fff; color: var(--br-ink); }

        .ct-funnel {
          display: grid; grid-template-columns: repeat(5, 1fr);
          margin: 14px 0 18px; padding: 14px 18px;
          border-radius: 16px; background: #fff; border: 1px solid var(--br-border);
        }
        .ct-funnel__step { position: relative; display: flex; align-items: center; justify-content: center; gap: 8px; min-width: 0; }
        .ct-funnel__step strong { font-size: 21px; font-weight: 800; letter-spacing: -0.02em; }
        .ct-funnel__step strong.is-green { color: var(--br-green); }
        .ct-funnel__step span { font-size: 12.5px; color: var(--br-muted); white-space: nowrap; }
        .ct-funnel__step svg { position: absolute; right: -7px; color: var(--br-faint); }
        .ct-tabs { margin-bottom: 18px; }

        @media (max-width: 900px) {
          .ct-hero { flex-direction: column; align-items: flex-start; }
          .ct-funnel { grid-template-columns: repeat(3, 1fr); row-gap: 14px; }
          .ct-funnel__step svg { display: none; }
        }
        @media (max-width: 640px) {
          .ct-hero { padding: 20px; border-radius: 16px; }
          .ct-hero h1 { font-size: 23px; }
          .ct-hero__btns { width: 100%; }
          .ct-hero__btns button { flex: 1; justify-content: center; }
          .ct-funnel { grid-template-columns: repeat(2, 1fr); padding: 14px; }
          .ct-funnel__step { flex-direction: column; gap: 2px; }
          .ct-funnel__step strong { font-size: 19px; }
          .ct-funnel__step:last-child { grid-column: 1 / -1; padding-top: 12px; border-top: 1px solid var(--br-border); }
        }
      `}</style>
    </div>
  );
}
