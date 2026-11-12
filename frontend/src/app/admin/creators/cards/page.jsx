"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import { CARDS } from "@/components/admin/creator/profiles";


/* Figma: 12 filters, sab "Any" se shuru */
const FILTERS = [
  ["Profile", ["Any", "Complete", "Incomplete"]],
  ["Instagram", ["Any", "Connected", "Not connected"]],
  ["Barter & rates", ["Any", "Open to barter", "Reel rate added"]],
  ["WhatsApp", ["Any", "ON", "OFF"]],
  ["Last active", ["Any", "Today", "This week", "This month"]],
  ["Joined", ["Any", "Today", "This week", "This month"]],
  ["Joined via", ["Any", "Website", "Bulk upload", "Referral"]],
  ["Campaigns", ["Any", "Applied", "Approved", "None"]],
  ["State", ["Any", "Karnataka", "Maharashtra", "Delhi", "Tamil Nadu"]],
  ["Language", ["Any", "English", "Hindi", "Kannada", "Tamil"]],
  ["Marital status", ["Any", "Single", "Married"]],
  ["Blocklist", ["Any", "Not blocked", "Blocked"]],
];

// snapshot = drawer ke peeche wala view (Figma 059–064 mein ye numbers hain)
export default function AdminCreatorCards({ snapshot = false }) {
  const N = snapshot ? { total: 304, ig: 174, done: 34, todo: 270, applied: 185, approved: 162 } : { total: 298, ig: 169, done: 35, todo: 263, applied: 183, approved: 151 };
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("Newest first");
  const [f, setF] = useState({});
  const [toast, setToast] = useState("");

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2200);
  };

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    let l = CARDS.filter((c) => !t || [c.name, c.handle, c.city].some((v) => v.toLowerCase().includes(t)));
    if (f.Profile && f.Profile !== "Any") l = l.filter((c) => c.profile === f.Profile);
    if (f["Barter & rates"] === "Open to barter") l = l.filter((c) => c.barter);
    if (f["Barter & rates"] === "Reel rate added") l = l.filter((c) => c.reel !== "—");
    if (sort === "Most followers") l = [...l].sort((a, b) => parseFloat(b.followers) * (/K/.test(b.followers) ? 1000 : 1) - parseFloat(a.followers) * (/K/.test(a.followers) ? 1000 : 1));
    if (sort === "Oldest first") l = [...l].sort((a, b) => a.joined - b.joined);
    return l;
  }, [q, sort, f]);
  const active = q || Object.values(f).some((v) => v && v !== "Any");

  return (
    <AdminShell>
      <PageHead title="Creators" sub="Every creator on Geek OS — Instagram, profile, campaigns and contact in one place.">
        <button type="button" className="ad-btn cc2-csv" onClick={() => flash("CSV export started — 298 creators")}>
          ⬇️ CSV
        </button>
        <Link href="/admin/creator-upload" className="ad-btn ad-btn--primary">
          ⇧ Add / import
        </Link>
      </PageHead>

      <Stats
        items={[
          { value: N.total, label: "Creators", note: "Live · refreshes every 30s" },
          { value: N.ig, label: "Instagram connected" },
          { value: N.done, label: "Profile complete" },
          { value: N.todo, label: "Profile incomplete" },
          { value: 5, label: "Open to barter" },
        ]}
      />
      <div className="cc2-more">
        {[
          ["5", "Reel rate added"],
          [String(N.applied), "Applied to campaigns"],
          [String(N.approved), "Approved in campaigns"],
          ["1", "2+ Instagram accounts"],
        ].map(([n, l]) => (
          <div key={l} className="cc2-stat">
            <strong>{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>

      <section className="ad-card cc2-card">
        <div className="cc2-top">
          <div>
            <h2 className="ad-h2">Creator directory</h2>
            <p className="cc2-sub">{active ? `${list.length} of ${N.total} creators match` : `${N.ig} of ${N.total} creators match`}</p>
          </div>
          <div className="cc2-view">
            <span className="ad-tab is-on">▦ Cards</span>
            <Link href="/admin/creators" className="ad-tab">
              ☰ List
            </Link>
          </div>
        </div>

        <div className="cc2-row">
          <input className="ad-input cc2-search" placeholder="Name, @handle, phone, city…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search creators" />
          <select className="ad-input cc2-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            {["Newest first", "Oldest first", "Most followers"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        <div className="cc2-filters">
          {FILTERS.map(([label, opts]) => (
            <label key={label} className="cc2-f">
              <span>{label}</span>
              <select value={f[label] || "Any"} onChange={(e) => setF({ ...f, [label]: e.target.value })}>
                {opts.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="cc2-grid">
          {list.map((c) => (
            <Link key={c.handle} href={`/admin/creators/${c.id}/profile`} className="cc2-c">
              <div className="cc2-c__top">
                <span className="ad-av">{c.name[0]}</span>
                <span className="cc2-c__who">
                  <strong>{c.name}</strong>
                  <small>{c.handle}</small>
                </span>
                <span className="ad-badge ad-badge--orange">{c.score}</span>
              </div>
              <p className="cc2-c__meta">🟢 WhatsApp ON · 📸 1 Instagram account</p>
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
          {!list.length && <p className="cc2-empty">No creators match these filters.</p>}
        </div>
      </section>

      {toast && <div className="ad-toast">✓ {toast}</div>}

      <style>{`
        .cc2-csv { background: transparent; color: #6657e9; padding: 0 8px; }
        .cc2-more { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; margin: -10px 0 23px; }
        .cc2-stat { display: flex; flex-direction: column; min-height: 105px; padding: 24px 19px 16px; border-radius: 18px; background: #fff; border: 1px solid var(--ad-line); }
        .cc2-stat strong { font-family: var(--ad-head); font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1.15; }
        .cc2-stat span { margin-top: 12px; font-size: 12px; color: var(--ad-muted); }
        .cc2-card { padding: 26px 22px 44px; }
        .cc2-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .cc2-sub { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .cc2-view { display: flex; gap: 8px; }
        .cc2-view .ad-tab:not(.is-on) { color: #67718a; }
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
        .cc2-c__top .ad-av { width: 34px; height: 34px; font-size: 14px; }
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
