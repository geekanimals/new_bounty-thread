"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import { useCreatorsList, creatorCounts, rowOf, matchQ, csv, CSV_COLS, cap1, errText } from "@/components/admin/creator/live";

const PER = 24;

/* Creators (list) — admin_creators + admin_ig_accounts + admin_creator_facts (purane app jaisa, har 30 sec) */
export default function AdminCreators() {
  const { all, loading, error, reload } = useCreatorsList();
  const N = creatorCounts(all);
  const [q, setQ] = useState("");
  const [ig, setIg] = useState("All");
  const [cat, setCat] = useState("All categories");
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState("");

  // "Save view" se rakha filter wapas
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("geek_acr_view_list") || "null");
      if (v) {
        setQ(v.q || "");
        setIg(v.ig || "All");
        setCat(v.cat || "All categories");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2200);
  };

  const cats = useMemo(() => ["All categories", ...[...new Set(all.flatMap((c) => (c.categories || []).map((x) => cap1(String(x).toLowerCase()))))].sort()], [all]);
  const list = useMemo(() => {
    const t = q.trim();
    return all.filter(
      (c) =>
        matchQ(c, t) &&
        (ig === "All" || (ig === "Connected" ? !!c.ig_username : !c.ig_username)) &&
        (cat === "All categories" || (c.categories || []).some((x) => String(x).toLowerCase() === cat.toLowerCase()))
    );
  }, [all, q, ig, cat]);
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const p = Math.min(page, pages - 1);
  const shown = list.slice(p * PER, p * PER + PER).map(rowOf);
  const total = list.length;
  const pct = (n) => (N.total ? `${Math.round((100 * n) / N.total)}% of accounts` : "—");

  return (
    <AdminShell>
      <PageHead title="Creators" sub="A trusted creator directory: verified Instagram signals, fit and campaign history.">
        <button type="button" className="ga-btn cl-csv" onClick={() => (csv(list, CSV_COLS, "creators.csv"), flash(`CSV downloaded — ${list.length} creators`))}>
          ⬇️ CSV
        </button>
        <Link href="/vault/creator-upload" className="ga-btn ga-btn--primary">
          ⇧ Add / import
        </Link>
      </PageHead>

      <Stats
        items={[
          { value: N.total, label: "Total registered", note: "Live · refreshes every 30s" },
          { value: N.ig, label: "Instagram linked", note: pct(N.ig) },
          { value: N.complete, label: "Profiles complete", note: "Optional details" },
          { value: N.applied, label: "Applied", note: "At least one campaign" },
          { value: N.approved, label: "Approved", note: "Across campaigns" },
        ]}
      />

      <section className="ga-card cl-card">
        <div className="cl-top">
          <h2 className="ga-h2">Creator directory</h2>
          <div className="cl-view">
            <span className="ga-tab is-on">☰ List</span>
            <Link href="/vault/creators/cards" className="ga-tab">
              ▦ Cards
            </Link>
          </div>
        </div>

        <div className="cl-filters">
          <input
            className="ga-input cl-search"
            placeholder="Search name, @handle, phone, email, city, category…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            aria-label="Search creators"
          />
          <select className="ga-input cl-sel" value={ig} onChange={(e) => (setIg(e.target.value), setPage(0))} aria-label="Instagram">
            {["All", "Connected", "Not connected"].map((o) => (
              <option key={o} value={o}>
                Instagram: {o}
              </option>
            ))}
          </select>
          <select className="ga-input cl-sel" value={cat} onChange={(e) => (setCat(e.target.value), setPage(0))} aria-label="Category">
            {cats.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <button
            type="button"
            className="cl-save"
            onClick={() => {
              try {
                localStorage.setItem("geek_acr_view_list", JSON.stringify({ q, ig, cat }));
              } catch {
                /* ignore */
              }
              flash("View saved");
            }}
          >
            Save view
          </button>
        </div>

        <div className="cl-table">
          <table className="ga-table">
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
                    <Link href={`/vault/creators/${c.id}/profile`} className="cl-name">
                      {c.name}
                    </Link>
                    <span className="cl-handle">{c.handle}</span>
                  </td>
                  <td>
                    <b>{c.followers}</b>
                  </td>
                  <td>{c.city}</td>
                  <td>{c.category}</td>
                  <td>
                    <span className={`ga-badge ${c.ig ? "ga-badge--green" : ""}`}>{c.ig ? "Connected" : "Not connected"}</span>
                  </td>
                  <td>
                    <span className={`ga-badge ${c.complete ? "ga-badge--violet" : "ga-badge--orange"}`}>{c.complete ? "Complete" : "Incomplete"}</span>
                  </td>
                  <td>
                    <Link href={`/vault/creators/${c.id}/profile`} className="cl-link">
                      View 360° →
                    </Link>
                  </td>
                </tr>
              ))}
              {!shown.length && (
                <tr>
                  <td colSpan={7} className="cl-empty">
                    {error ? (
                      <>
                        {errText(error)}{" "}
                        <button type="button" className="cl-retry" onClick={() => reload()}>
                          Retry
                        </button>
                      </>
                    ) : loading ? (
                      "Loading creators…"
                    ) : all.length ? (
                      "No creators match these filters."
                    ) : (
                      "No creators yet."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: table ki jagah cards */}
        <div className="cl-mob">
          {shown.map((c) => (
            <Link key={c.id} href={`/vault/creators/${c.id}/profile`} className="cl-m">
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
                <span className={`ga-badge ${c.ig ? "ga-badge--green" : ""}`}>{c.ig ? "Connected" : "Not connected"}</span>
                <span className={`ga-badge ${c.complete ? "ga-badge--violet" : "ga-badge--orange"}`}>{c.complete ? "Complete" : "Incomplete"}</span>
              </div>
            </Link>
          ))}
          {!shown.length && <p className="cl-empty">{error ? errText(error) : loading ? "Loading creators…" : all.length ? "No creators match these filters." : "No creators yet."}</p>}
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

      {toast && <div className="ga-toast">✓ {toast}</div>}

      <style>{`
        .cl-retry { border: 0; background: none; font-weight: 800; color: #6657e9; }
        .cl-csv { background: transparent; color: #6657e9; padding: 0 8px; }
        .cl-card { padding: 22px 22px 26px; }
        .cl-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .cl-view { display: flex; gap: 8px; }
        .cl-view .ga-tab:not(.is-on) { color: #67718a; }
        .cl-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 34px; }
        .cl-search { width: 270px; height: 44px; }
        .cl-sel { width: auto; field-sizing: content; min-width: 0; height: 44px; padding: 0 12px; color: var(--ad-text); appearance: none; cursor: pointer; }
        .cl-save { border: 0; background: none; padding: 0 8px; font-size: 14px; font-weight: 800; color: #6657e9; }
        .cl-table { margin-top: 22px; overflow-x: auto; }
        .cl-table .ga-table th { background: transparent; padding: 12px 11px; }
        .cl-table .ga-table td { padding: 14px 11px; height: 67.5px; }
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
