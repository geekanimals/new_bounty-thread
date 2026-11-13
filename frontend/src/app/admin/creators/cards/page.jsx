"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import { useCreatorsList, creatorCounts, rowOf, matchQ, CARD_FILTERS, CARD_SORTS, filterOptions, csv, CSV_COLS, errText } from "@/components/admin/creator/live";

/* Figma: 12 filters, sab "Any" se shuru — rules purane app ke (live.jsx) */
const PER = 24;

// snapshot = drawer ke peeche wala view (same live data, bina extra refresh)
export default function AdminCreatorCards({ snapshot = false }) {
  const { all, loading, error, reload } = useCreatorsList();
  const N = creatorCounts(all);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("Newest first");
  const [f, setF] = useState({});
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState("");

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2200);
  };

  const list = useMemo(() => {
    const t = q.trim();
    return all
      .filter((c) => matchQ(c, t))
      .filter((c) => CARD_FILTERS.every(([k, , test]) => !f[k] || f[k] === "Any" || test(c, f[k])))
      .sort(CARD_SORTS[sort] || CARD_SORTS["Newest first"]);
  }, [all, q, sort, f]);
  const active = q || Object.values(f).some((v) => v && v !== "Any");
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const pg = Math.min(page, pages - 1);
  const shown = list.slice(pg * PER, pg * PER + PER).map(rowOf);

  return (
    <AdminShell>
      <PageHead title="Creators" sub="Every creator on Geek OS — Instagram, profile, campaigns and contact in one place.">
        <button type="button" className="ga-btn cc2-csv" onClick={() => (csv(list, CSV_COLS, "creators.csv"), flash(`CSV downloaded — ${list.length} creators`))}>
          ⬇️ CSV
        </button>
        <Link href="/admin/creator-upload" className="ga-btn ga-btn--primary">
          ⇧ Add / import
        </Link>
      </PageHead>

      <Stats
        items={[
          { value: N.total, label: "Creators", note: "Live · refreshes every 30s" },
          { value: N.ig, label: "Instagram connected" },
          { value: N.complete, label: "Profile complete" },
          { value: N.incomplete, label: "Profile incomplete" },
          { value: N.barter, label: "Open to barter" },
        ]}
      />
      <div className="cc2-more">
        {[
          [String(N.rate), "Reel rate added"],
          [String(N.applied), "Applied to campaigns"],
          [String(N.approved), "Approved in campaigns"],
          [String(N.multi), "2+ Instagram accounts"],
        ].map(([n, l]) => (
          <div key={l} className="cc2-stat">
            <strong>{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>

      <section className="ga-card cc2-card">
        <div className="cc2-top">
          <div>
            <h2 className="ga-h2">Creator directory</h2>
            <p className="cc2-sub">{loading && !all.length ? "Loading creators…" : `${list.length} of ${N.total} creators match`}</p>
          </div>
          <div className="cc2-view">
            <span className="ga-tab is-on">▦ Cards</span>
            <Link href="/admin/creators" className="ga-tab">
              ☰ List
            </Link>
          </div>
        </div>

        <div className="cc2-row">
          <input className="ga-input cc2-search" placeholder="Name, @handle, phone, email, city, category…" value={q} onChange={(e) => (setQ(e.target.value), setPage(0))} aria-label="Search creators" />
          <select className="ga-input cc2-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            {Object.keys(CARD_SORTS).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        <div className="cc2-filters">
          {CARD_FILTERS.map(([label, opts]) => (
            <label key={label} className="cc2-f">
              <span>{label}</span>
              <select value={f[label] || "Any"} onChange={(e) => (setF({ ...f, [label]: e.target.value }), setPage(0))}>
                {(opts || filterOptions(all, label)).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="cc2-grid">
          {shown.map((c) => (
            <Link key={c.id} href={`/admin/creators/${c.id}/profile`} className="cc2-c">
              <div className="cc2-c__top">
                {c.pic ? <img className="ga-av cc2-pic" src={c.pic} alt="" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.visibility = "hidden")} /> : <span className="ga-av">{c.name[0]}</span>}
                <span className="cc2-c__who">
                  <strong>{c.name}</strong>
                  <small>{c.handle}</small>
                </span>
                <span className={`ga-badge ${c.complete ? "ga-badge--green" : "ga-badge--orange"}`}>{c.score}</span>
              </div>
              <p className="cc2-c__meta">
                {c.wa ? "🟢 WhatsApp ON" : "⚪ WhatsApp OFF"} · 📸 {c.igCount ? `${c.igCount} Instagram ${c.igCount > 1 ? "accounts" : "account"}` : "No Instagram"}
              </p>
              <div className="cc2-c__nums">
                {[
                  [c.followers, "Followers"],
                  [c.eng, "Eng."],
                  [c.reel, "Per Reel"],
                  [c.applied, "Applied"],
                ].map(([n, l]) => (
                  <span key={l}>
                    <b>{n}</b>
                    <small>{l}</small>
                  </span>
                ))}
              </div>
              <p className="cc2-c__city">📍 {c.city}</p>
            </Link>
          ))}
          {!loading && !error && !list.length && <p className="cc2-empty">{all.length ? "No creators match these filters." : "No creators yet."}</p>}
          {error && (
            <p className="cc2-empty">
              {errText(error)}{" "}
              <button type="button" className="cc2-retry" onClick={() => reload()}>
                Retry
              </button>
            </p>
          )}
        </div>
        {pages > 1 && (
          <div className="cc2-pager">
            <button type="button" className="ga-btn ga-btn--ghost ga-btn--sm" disabled={!pg} onClick={() => setPage(pg - 1)}>
              ← Prev
            </button>
            <span>
              Page {pg + 1} of {pages} · {list.length} creators
            </span>
            <button type="button" className="ga-btn ga-btn--ghost ga-btn--sm" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>
              Next →
            </button>
          </div>
        )}
      </section>

      {toast && <div className="ga-toast">✓ {toast}</div>}

      <style>{`
        .cc2-pic { object-fit: cover; }
        .cc2-retry { border: 0; background: none; font-weight: 800; color: #6657e9; }
        .cc2-pager { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 20px; font-size: 12.5px; color: var(--ad-muted); }
        .cc2-csv { background: transparent; color: #6657e9; padding: 0 8px; }
        .cc2-more { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; margin: -10px 0 23px; }
        .cc2-stat { display: flex; flex-direction: column; min-height: 105px; padding: 24px 19px 16px; border-radius: 18px; background: #fff; border: 1px solid var(--ad-line); }
        .cc2-stat strong { font-family: var(--ad-head); font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1.15; }
        .cc2-stat span { margin-top: 12px; font-size: 12px; color: var(--ad-muted); }
        .cc2-card { padding: 26px 22px 44px; }
        .cc2-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .cc2-sub { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .cc2-view { display: flex; gap: 8px; }
        .cc2-view .ga-tab:not(.is-on) { color: #67718a; }
        .cc2-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
        .cc2-search { width: 270px; height: 44px; }
        .cc2-sort { width: 198px; height: 44px; color: var(--ad-text); appearance: none; cursor: pointer; }
        .cc2-filters { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 9px 12px; margin-top: 16px; }
        .cc2-f { display: flex; align-items: center; gap: 2px; }
        .cc2-f span { font-size: 10px; letter-spacing: .3px; text-transform: uppercase; color: var(--ad-muted); white-space: nowrap; }
        .cc2-f select { width: 60px; height: 38px; padding: 0 6px 0 12px; border-radius: 10px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 10px; color: var(--ad-text); outline: none; appearance: none; cursor: pointer; }
        .cc2-f select:focus { border-color: var(--ad-primary); }
        .cc2-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 15px; }
        .cc2-c { display: flex; flex-direction: column; padding: 20px 19px 20px; border-radius: 16px; border: 1px solid var(--ad-line); background: #fff; transition: border-color .15s, box-shadow .15s; }
        .cc2-c:hover { border-color: #cfd2ee; box-shadow: 0 12px 26px -20px rgba(30,37,73,.5); }
        .cc2-c__top { display: flex; align-items: center; gap: 12px; }
        .cc2-c__top .ga-av { width: 34px; height: 34px; font-size: 14px; }
        .cc2-c__who { flex: 1; min-width: 0; }
        .cc2-c__who strong { display: block; font-size: 14px; font-weight: 700; }
        .cc2-c__who small { display: block; margin-top: 1px; font-size: 12px; color: var(--ad-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cc2-c__meta { margin-top: 12px; font-size: 12px; line-height: 1.35; color: var(--ad-muted); }
        .cc2-c__nums { display: grid; grid-template-columns: repeat(4, auto); justify-content: space-between; margin-top: 14px; text-align: center; }
        .cc2-c__nums b { display: block; font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        .cc2-c__nums small { display: block; margin-top: 2px; font-size: 12px; color: var(--ad-muted); }
        .cc2-c__city { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .cc2-empty { grid-column: 1 / -1; padding: 30px 0; text-align: center; color: var(--ad-muted); }

        @media (max-width: 1180px) {
          .cc2-filters { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .cc2-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .cc2-f { justify-content: space-between; }
          .cc2-f select { width: 110px; }
        }
        @media (max-width: 640px) {
          .cc2-more { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .cc2-stat { min-height: 0; padding: 16px 14px; }
          .cc2-stat strong { font-size: 24px; }
          .cc2-card { padding: 18px 16px 20px; }
          .cc2-top { flex-direction: column; }
          .cc2-search, .cc2-sort { width: 100%; }
          .cc2-filters { grid-template-columns: 1fr 1fr; }
          .cc2-f { flex-direction: column; align-items: stretch; gap: 4px; }
          .cc2-f select { width: 100%; }
          .cc2-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </AdminShell>
  );
}
