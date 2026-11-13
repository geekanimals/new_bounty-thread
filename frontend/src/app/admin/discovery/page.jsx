"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import DiscoveryHead from "@/components/admin/discovery/DiscoveryHead";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { kNum, cap1 } from "@/components/admin/creator/live";

/* Figma ke chips — purane app ke CS_CATS se */
const CATS = ["Lifestyle", "Fashion", "Beauty", "Food", "Travel", "Fitness", "Parenting", "Tech", "Comedy", "Pets"];
const CITIES = ["Delhi NCR", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Indore", "Surat", "Kochi", "Goa"];
const FOL = [
  ["Any followers", null, null],
  ["Under 10k", null, 10000],
  ["10k – 25k", 10000, 25000],
  ["25k – 50k", 25000, 50000],
  ["50k+", 50000, null],
];

/* Discovery → Creator search (Figma 052). api.creator_search — Geek OS creators + Instagram list (purane app jaisa) */
export default function DiscoverySearch() {
  const [form, setForm] = useState({ q: "", fol: "Any followers", city: "Any city", lang: "Any language" });
  const [cats, setCats] = useState([]);
  const [res, setRes] = useState({ rows: [], total: 0, loading: true, error: null });
  const { data: opts } = useRpc("admin", "api.creator_search_options", {});

  const toggle = (c) => setCats((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));
  const run = async (e, f = form, cs = cats) => {
    e?.preventDefault();
    const [, lo, hi] = FOL.find((x) => x[0] === f.fol) || FOL[0];
    const filters = { q: f.q.trim(), categories: cs, location: f.city === "Any city" ? "" : f.city, sort: "followers_desc", language: f.lang === "Any language" ? "" : f.lang.toLowerCase() };
    if (lo != null) filters.min_followers = lo;
    if (hi != null) filters.max_followers = hi;
    Object.keys(filters).forEach((k) => (filters[k] === "" || filters[k] == null) && delete filters[k]);
    setRes((r) => ({ ...r, loading: true, error: null }));
    // dono list ek saath: Geek OS (platform) + Instagram (external) — purane "Everyone" jaisa
    const ask = (source, size) => rpc("admin", "api.creator_search", { p_filters: { ...filters, source }, p_page: 1, p_size: size, p_campaign: null });
    const [P, X] = await Promise.all([ask("platform", 12), ask("external", 24)]);
    const error = P.error || X.error;
    if (error) return setRes({ rows: [], total: 0, loading: false, error });
    const rows = [...((P.data && P.data.rows) || []).map((r) => ({ ...r, onGeek: true })), ...((X.data && X.data.rows) || [])];
    setRes({ rows, total: ((P.data && P.data.total) || 0) + ((X.data && X.data.total) || 0), loading: false, error: null });
  };
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = res.rows;
  const langs = ["Any language", ...((opts && opts.languages) || [])];

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AdminShell>
      <DiscoveryHead />
      <section className="ga-card ds-card">
        <h2 className="ga-h2">Creator search</h2>
        <p className="ds-sub">Filter every creator on Geek OS and our Instagram list.</p>
        <form className="ds-row" onSubmit={run}>
          <input className="ga-input ds-q" placeholder="Name, @handle or city…" value={form.q} onChange={set("q")} aria-label="Name, handle or city" />
          <select className="ga-input ds-sel" value={form.fol} onChange={set("fol")} aria-label="Followers">
            {FOL.map(([l]) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select className="ga-input ds-sel" value={form.city} onChange={set("city")} aria-label="City">
            {["Any city", ...CITIES].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select className="ga-input ds-sel" value={form.lang} onChange={set("lang")} aria-label="Language">
            {langs.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button type="submit" className="ga-btn ga-btn--primary ds-go">
            Search
          </button>
        </form>
        <div className="ds-chips">
          {CATS.map((c) => (
            <button key={c} type="button" className={`ds-chip ${cats.includes(c) ? "is-on" : ""}`} onClick={() => toggle(c)} aria-pressed={cats.includes(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="ds-table">
          <table className="ga-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Followers</th>
                <th>City</th>
                <th>Category</th>
                <th>Engagement</th>
                <th aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={(c.member_id || c.handle || "") + i}>
                  <td>
                    {c.member_id ? (
                      <Link href={`/admin/creators/${c.member_id}/profile`} className="ds-name">
                        {c.name || "@" + c.handle}
                      </Link>
                    ) : (
                      <a href={`https://instagram.com/${encodeURIComponent(c.handle || "")}`} target="_blank" rel="noopener noreferrer" className="ds-name">
                        {c.name || "@" + c.handle}
                      </a>
                    )}
                    <span className="ds-handle">{c.handle ? "@" + c.handle : ""}{c.onGeek ? "" : " · Instagram"}</span>
                  </td>
                  <td>{kNum(c.followers)}</td>
                  <td>{c.city || "—"}</td>
                  <td>{(c.categories || []).slice(0, 2).map(cap1).join(", ") || "—"}</td>
                  <td>{c.engagement != null ? c.engagement + "%" : "—"}</td>
                  <td>
                    {c.member_id ? (
                      <Link href={`/admin/creators/${c.member_id}/profile`} className="ds-link">
                        View 360° →
                      </Link>
                    ) : (
                      <a href={`https://instagram.com/${encodeURIComponent(c.handle || "")}`} target="_blank" rel="noopener noreferrer" className="ds-link">
                        Open ↗
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {res.error && (
            <p className="ds-empty">
              {errText(res.error)}{" "}
              <button type="button" className="ds-retry" onClick={() => run()}>
                Retry
              </button>
            </p>
          )}
          {res.loading && !rows.length && <p className="ds-empty">Searching…</p>}
          {!res.loading && !res.error && !rows.length && <p className="ds-empty">No creators match — try fewer filters.</p>}
          {!!rows.length && <p className="ds-count">{res.total.toLocaleString("en-IN")} creators found</p>}
        </div>
      </section>

      <style>{`
        .ds-retry { border: 0; background: none; font-weight: 800; color: #6657e9; }
        .ds-count { margin-top: 12px; font-size: 12px; color: var(--ad-muted); }
        .ds-card { padding: 25px 22px 30px; }
        .ds-sub { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .ds-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 17px; }
        .ds-q { width: 270px; height: 44px; }
        .ds-sel { width: auto; min-width: 106px; height: 44px; padding-right: 26px; color: var(--ad-text); appearance: none; cursor: pointer; }
        .ds-go { height: 42px; margin-top: 1px; padding: 0 16px; }
        .ds-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .ds-chip { height: 26px; padding: 0 10px; border: 0; border-radius: 13.3px; background: var(--ad-soft); color: #7a8398; font-size: 11px; font-weight: 700; }
        .ds-chip.is-on { background: var(--ad-lilac); color: #6857ec; }
        .ds-table { margin-top: 20px; overflow-x: auto; }
        .ds-table .ga-table th { background: transparent; padding: 12px 11px; }
        .ds-table .ga-table td { height: 67.5px; padding: 14px 11px; }
        .ds-name { display: block; font-weight: 800; }
        .ds-name:hover { color: var(--ad-primary); }
        .ds-handle { display: block; margin-top: 4px; font-size: 11px; font-weight: 500; color: #9aa1b3; }
        .ds-link { font-weight: 800; color: #6151ea; }
        .ds-empty { padding: 26px 0; text-align: center; color: var(--ad-muted); }
        @media (max-width: 640px) {
          .ds-card { padding: 18px 16px 20px; }
          .ds-q { width: 100%; }
          .ds-sel { flex: 1 1 40%; min-width: 0; }
          .ds-go { flex: 1 1 40%; }
          .ds-table .ga-table th:nth-child(3), .ds-table .ga-table td:nth-child(3), .ds-table .ga-table th:nth-child(4), .ds-table .ga-table td:nth-child(4) { display: none; }
        }
      `}</style>
    </AdminShell>
  );
}
