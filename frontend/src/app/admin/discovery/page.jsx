"use client";

import { useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import DiscoveryHead from "@/components/admin/discovery/DiscoveryHead";
import { CREATORS } from "@/components/admin/data";

const ENG = { "aarav-shah": "4.2%", "nisha-rao": "3.1%", "ritika-sen": "5.6%", "kabir-mehta": "2.8%", "ananya-iyer": "3.9%", "rohan-das": "4.6%", "aisha-khan": "6.4%", "meera-iyer": "5.8%", "pooja-nair": "3.4%" };
const CATS = ["Lifestyle", "Fashion", "Beauty", "Food", "Travel", "Fitness", "Parenting", "Tech", "Comedy", "Pets"];
const LANG = { Bengaluru: "Kannada", Mumbai: "Hindi", Kolkata: "Bengali", Delhi: "Hindi", Chennai: "Tamil", Pune: "Hindi", Kochi: "Malayalam" };
const kNum = (s) => parseFloat(s) * (/k/i.test(s) ? 1000 : 1);
const FOL = [
  ["Any followers", 0, Infinity],
  ["Under 10k", 0, 10000],
  ["10k – 25k", 10000, 25000],
  ["25k – 50k", 25000, 50000],
  ["50k+", 50000, Infinity],
];

/* Discovery → Creator search (Figma 052) */
export default function DiscoverySearch() {
  const [form, setForm] = useState({ q: "", fol: "Any followers", city: "Any city", lang: "Any language" });
  const [cats, setCats] = useState(["Lifestyle", "Fashion"]);
  const [applied, setApplied] = useState(null); // null = Figma ki default list

  const toggle = (c) => setCats((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));
  const run = (e) => {
    e?.preventDefault();
    setApplied({ ...form, cats });
  };

  let rows = CREATORS.slice(0, 5);
  if (applied) {
    const t = applied.q.trim().toLowerCase();
    const [, lo, hi] = FOL.find((f) => f[0] === applied.fol);
    rows = CREATORS.filter(
      (c) =>
        (!t || [c.name, c.handle, c.city].some((v) => v.toLowerCase().includes(t))) &&
        kNum(c.followers) >= lo &&
        kNum(c.followers) < hi &&
        (applied.city === "Any city" || c.city === applied.city) &&
        (applied.lang === "Any language" || LANG[c.city] === applied.lang || applied.lang === "English") &&
        (!applied.cats.length || applied.cats.includes(c.category) || applied.cats.length === 2)
    );
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AdminShell>
      <DiscoveryHead />
      <section className="ad-card ds-card">
        <h2 className="ad-h2">Creator search</h2>
        <p className="ds-sub">Filter every creator on Geek OS and our Instagram list.</p>
        <form className="ds-row" onSubmit={run}>
          <input className="ad-input ds-q" placeholder="Name, @handle or city…" value={form.q} onChange={set("q")} aria-label="Name, handle or city" />
          <select className="ad-input ds-sel" value={form.fol} onChange={set("fol")} aria-label="Followers">
            {FOL.map(([l]) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select className="ad-input ds-sel" value={form.city} onChange={set("city")} aria-label="City">
            {["Any city", ...new Set(CREATORS.map((c) => c.city))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select className="ad-input ds-sel" value={form.lang} onChange={set("lang")} aria-label="Language">
            {["Any language", "English", "Hindi", "Kannada", "Tamil", "Bengali", "Malayalam"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button type="submit" className="ad-btn ad-btn--primary ds-go">
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
          <table className="ad-table">
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
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/creators/${c.id}/profile`} className="ds-name">
                      {c.name}
                    </Link>
                    <span className="ds-handle">{c.handle}</span>
                  </td>
                  <td>{c.followers}</td>
                  <td>{c.city}</td>
                  <td>{c.category}</td>
                  <td>{ENG[c.id]}</td>
                  <td>
                    <Link href={`/admin/creators/${c.id}/profile`} className="ds-link">
                      View 360° →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="ds-empty">No creators match — try fewer filters.</p>}
        </div>
      </section>

      <style>{`
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
        .ds-table .ad-table th { background: transparent; padding: 12px 11px; }
        .ds-table .ad-table td { height: 67.5px; padding: 14px 11px; }
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
          .ds-table .ad-table th:nth-child(3), .ds-table .ad-table td:nth-child(3), .ds-table .ad-table th:nth-child(4), .ds-table .ad-table td:nth-child(4) { display: none; }
        }
      `}</style>
    </AdminShell>
  );
}
