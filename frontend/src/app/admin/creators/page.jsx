"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import { CREATORS } from "@/components/admin/data";

const PER = 6;
const CATS = ["All categories", ...Array.from(new Set(CREATORS.map((c) => c.category)))];

export default function AdminCreators() {
  const [q, setQ] = useState("");
  const [ig, setIg] = useState("All");
  const [cat, setCat] = useState("All categories");
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState("");

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2200);
  };

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return CREATORS.filter(
      (c) =>
        (!t || [c.name, c.handle, c.city, c.category].some((v) => v.toLowerCase().includes(t))) &&
        (ig === "All" || (ig === "Connected" ? c.ig : !c.ig)) &&
        (cat === "All categories" || c.category === cat)
    );
  }, [q, ig, cat]);
  const pages = Math.max(1, Math.ceil(rows.length / PER));
  const p = Math.min(page, pages - 1);
  const shown = rows.slice(p * PER, p * PER + PER);
  const filtered = q || ig !== "All" || cat !== "All categories";
  const total = filtered ? rows.length : 298;

  return (
    <AdminShell>
      <PageHead title="Creators" sub="A trusted creator directory: verified Instagram signals, fit and campaign history.">
        <button type="button" className="ad-btn cl-csv" onClick={() => flash("CSV export started — 298 creators")}>
          ⬇️ CSV
        </button>
        <Link href="/admin/creator-upload" className="ad-btn ad-btn--primary">
          ⇧ Add / import
        </Link>
      </PageHead>

      <Stats
        items={[
          { value: 298, label: "Total registered", note: "Live · refreshes every 30s" },
          { value: 169, label: "Instagram linked", note: "57% of accounts" },
          { value: 35, label: "Profiles complete", note: "Optional details" },
          { value: 228, label: "Applied", note: "At least one campaign" },
          { value: 151, label: "Approved", note: "Across campaigns" },
        ]}
      />

      <section className="ad-card cl-card">
        <div className="cl-top">
          <h2 className="ad-h2">Creator directory</h2>
          <div className="cl-view">
            <span className="ad-tab is-on">☰ List</span>
            <Link href="/admin/creators/cards" className="ad-tab">
              ▦ Cards
            </Link>
          </div>
        </div>

        <div className="cl-filters">
          <input
            className="ad-input cl-search"
            placeholder="Search name, handle, niche or city…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            aria-label="Search creators"
          />
          <select className="ad-input cl-sel" value={ig} onChange={(e) => (setIg(e.target.value), setPage(0))} aria-label="Instagram">
            {["All", "Connected", "Not connected"].map((o) => (
              <option key={o} value={o}>
                Instagram: {o}
              </option>
            ))}
          </select>
          <select className="ad-input cl-sel" value={cat} onChange={(e) => (setCat(e.target.value), setPage(0))} aria-label="Category">
            {CATS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <button type="button" className="cl-save" onClick={() => flash("View saved")}>
            Save view
          </button>
        </div>

        <div className="cl-table">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Followers</th>
                <th>City</th>
                <th>Category</th>
                <th>Instagram</th>
                <th>Profile</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/creators/${c.id}/profile`} className="cl-name">
                      {c.name}
                    </Link>
                    <span className="cl-handle">{c.handle}</span>
                  </td>
                  <td>{c.followers}</td>
                  <td>{c.city}</td>
                  <td>{c.category}</td>
                  <td>
                    <span className={`ad-badge ${c.ig ? "ad-badge--green" : ""}`}>{c.ig ? "Connected" : "Not connected"}</span>
                  </td>
                  <td>
                    <span className={`ad-badge ${c.complete ? "ad-badge--violet" : "ad-badge--orange"}`}>{c.complete ? "Complete" : "Incomplete"}</span>
                  </td>
                  <td>
                    <Link href={`/admin/creators/${c.id}/profile`} className="cl-link">
                      View 360° →
                    </Link>
                  </td>
                </tr>
              ))}
              {!shown.length && (
                <tr>
                  <td colSpan={7} className="cl-empty">
                    No creators match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: table ki jagah cards */}
        <div className="cl-mob">
          {shown.map((c) => (
            <Link key={c.id} href={`/admin/creators/${c.id}/profile`} className="cl-m">
              <div className="cl-m__top">
                <span>
                  <strong>{c.name}</strong>
                  <small>
                    {c.handle} · {c.followers}
                  </small>
                </span>
                <em>View 360° →</em>
              </div>
              <p>
                {c.city} · {c.category}
              </p>
              <div className="cl-m__b">
                <span className={`ad-badge ${c.ig ? "ad-badge--green" : ""}`}>{c.ig ? "Connected" : "Not connected"}</span>
                <span className={`ad-badge ${c.complete ? "ad-badge--violet" : "ad-badge--orange"}`}>{c.complete ? "Complete" : "Incomplete"}</span>
              </div>
            </Link>
          ))}
          {!shown.length && <p className="cl-empty">No creators match these filters.</p>}
        </div>

        <div className="cl-foot">
          <p>
            Showing {shown.length ? p * PER + 1 : 0}–{p * PER + shown.length} of {total}
          </p>
          <div>
            <button type="button" onClick={() => setPage(Math.max(0, p - 1))} disabled={p === 0}>
              ← Prev
            </button>
            <button type="button" onClick={() => setPage(Math.min(pages - 1, p + 1))} disabled={p >= pages - 1}>
              Next →
            </button>
          </div>
        </div>
      </section>

      {toast && <div className="ad-toast">✓ {toast}</div>}

      <style>{`
        .cl-csv { background: transparent; color: #6657e9; padding: 0 8px; }
        .cl-card { padding: 22px 22px 26px; }
        .cl-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .cl-view { display: flex; gap: 8px; }
        .cl-view .ad-tab:not(.is-on) { color: #67718a; }
        .cl-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 34px; }
        .cl-search { width: 270px; height: 44px; }
        .cl-sel { width: auto; field-sizing: content; min-width: 0; height: 44px; padding: 0 12px; color: var(--ad-text); appearance: none; cursor: pointer; }
        .cl-save { border: 0; background: none; padding: 0 8px; font-size: 14px; font-weight: 800; color: #6657e9; }
        .cl-table { margin-top: 22px; overflow-x: auto; }
        .cl-table .ad-table th { background: transparent; padding: 12px 11px; }
        .cl-table .ad-table td { padding: 14px 11px; height: 67.5px; }
        .cl-name { display: block; font-weight: 800; color: var(--ad-ink); }
        .cl-name:hover { color: var(--ad-primary); }
        .cl-handle { display: block; margin-top: 4px; font-size: 11px; font-weight: 500; color: #9aa1b3; }
        .cl-link { font-weight: 800; color: #6151ea; }
        .cl-empty { padding: 26px 11px; text-align: center; color: var(--ad-muted); }
        .cl-mob { display: none; }
        .cl-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 20px; }
        .cl-foot p { font-size: 12px; color: var(--ad-muted); }
        .cl-foot div { display: flex; gap: 14px; margin-right: 10px; }
        .cl-foot button { border: 0; background: none; padding: 4px; font-size: 14px; font-weight: 800; color: #6657e9; }
        .cl-foot button:disabled { cursor: default; }

        @media (max-width: 640px) {
          .cl-card { padding: 18px 16px 20px; }
          .cl-filters { margin-top: 18px; }
          .cl-search { width: 100%; }
          .cl-sel { flex: 1 1 calc(50% - 5px); min-width: 0; padding-right: 12px; }
          .cl-save { padding: 4px 0; }
          .cl-table { display: none; }
          .cl-mob { display: grid; gap: 10px; margin-top: 16px; }
          .cl-m { display: block; padding: 14px; border-radius: 14px; border: 1px solid var(--ad-line); }
          .cl-m__top { display: flex; justify-content: space-between; gap: 10px; }
          .cl-m__top strong { display: block; font-size: 14px; font-weight: 800; }
          .cl-m__top small { display: block; margin-top: 3px; font-size: 11.5px; color: #9aa1b3; }
          .cl-m__top em { font-style: normal; font-size: 12.5px; font-weight: 800; color: #6151ea; white-space: nowrap; }
          .cl-m p { margin-top: 8px; font-size: 12.5px; color: var(--ad-muted); }
          .cl-m__b { display: flex; gap: 6px; margin-top: 10px; }
          .cl-foot div { margin-right: 0; }
        }
      `}</style>
    </AdminShell>
  );
}
