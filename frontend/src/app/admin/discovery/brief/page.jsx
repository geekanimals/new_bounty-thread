"use client";

import { useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import DiscoveryHead from "@/components/admin/discovery/DiscoveryHead";
import { CREATORS } from "@/components/admin/data";

const WHY = {
  "aarav-shah": "Lifestyle · Bengaluru · posts weekly",
  "nisha-rao": "Beauty · Mumbai · strong saves",
  "ritika-sen": "Fashion · Hindi + English",
  "kabir-mehta": "Food · Delhi · high comments",
  "ananya-iyer": "Travel · Chennai · steady reach",
  "rohan-das": "Fitness · Pune · Hindi speaker",
  "aisha-khan": "Beauty · Mumbai · 6.4% engagement",
  "meera-iyer": "Lifestyle · Bengaluru · 842K views",
  "pooja-nair": "Home · Kochi · cat parent",
};
const IDEAS = ["Female fashion creators in Mumbai, 50k+", "Moms in Delhi who speak Hindi", "Cat parents in Pune"];
const BASE = [92, 88, 81, 76];

/* "Fit" score — brief ke shabd creator ke category/city/why se milao */
function rank(brief) {
  const words = brief.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  return CREATORS.map((c) => {
    const hay = `${c.category} ${c.city} ${WHY[c.id]}`.toLowerCase();
    const hits = words.filter((w) => hay.includes(w.replace(/s$/, ""))).length;
    return { c, fit: Math.min(97, 60 + hits * 12 + (c.complete ? 6 : 0) + (c.ig ? 4 : 0)) };
  })
    .sort((a, b) => b.fit - a.fit)
    .slice(0, 4);
}

/* Discovery → Match to a brief (Figma 053) */
export default function DiscoveryBrief() {
  const [brief, setBrief] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [invited, setInvited] = useState([]);

  const find = (text) => {
    const t = (text ?? brief).trim();
    if (!t) return;
    setBrief(t);
    setBusy(true);
    setTimeout(() => {
      setRes(rank(t));
      setBusy(false);
    }, 450);
  };

  const rows = res || CREATORS.slice(0, 4).map((c, i) => ({ c, fit: BASE[i] }));

  return (
    <AdminShell>
      <DiscoveryHead />
      <section className="db-card ad-card">
        <h2 className="ad-h2">Match creators to a brief</h2>
        <p className="db-sub">Describe who you need — we rank creators by fit.</p>
        <form
          className="db-row"
          onSubmit={(e) => {
            e.preventDefault();
            find();
          }}
        >
          <input className="ad-input db-q" placeholder="Female fashion creators in Mumbai, 50k+" value={brief} onChange={(e) => setBrief(e.target.value)} aria-label="Describe who you need" />
          <button type="submit" className="ad-btn ad-btn--primary db-go" disabled={busy}>
            {busy ? "Finding…" : "✨ Find creators"}
          </button>
        </form>
        <div className="db-ideas">
          {IDEAS.map((t) => (
            <button key={t} type="button" onClick={() => find(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="db-table">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Why they fit</th>
                <th>Followers</th>
                <th>Fit</th>
                <th aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, fit }) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/creators/${c.id}/profile`} className="db-name">
                      {c.name}
                    </Link>
                    <span className="db-handle">{c.handle}</span>
                  </td>
                  <td>{WHY[c.id]}</td>
                  <td>{c.followers}</td>
                  <td>
                    <span className={`ad-badge ${fit >= 75 ? "ad-badge--green" : "ad-badge--orange"}`}>{fit}%</span>
                  </td>
                  <td>
                    {invited.includes(c.id) ? (
                      <span className="db-done">✓ Invited</span>
                    ) : (
                      <button type="button" className="db-link" onClick={() => setInvited([...invited, c.id])}>
                        Invite →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .db-card { padding: 25px 22px 30px; }
        .db-sub { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .db-row { display: flex; gap: 10px; margin-top: 17px; }
        .db-q { width: 270px; height: 44px; }
        .db-go { height: 42px; margin-top: 1px; }
        .db-ideas { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .db-ideas button { height: 26px; padding: 0 10px; border: 0; border-radius: 13.3px; background: var(--ad-soft); color: #7a8398; font-size: 11px; font-weight: 700; }
        .db-ideas button:hover { background: var(--ad-lilac); color: #6857ec; }
        .db-table { margin-top: 20px; overflow-x: auto; }
        .db-table .ad-table th { background: transparent; padding: 12px 11px; }
        .db-table .ad-table td { height: 67.5px; padding: 14px 11px; }
        .db-table .ad-table th:nth-child(2) { width: 40%; }
        .db-table .ad-table th:nth-child(3) { width: 16%; }
        .db-name { display: block; font-weight: 800; }
        .db-name:hover { color: var(--ad-primary); }
        .db-handle { display: block; margin-top: 4px; font-size: 11px; font-weight: 500; color: #9aa1b3; }
        .db-link { border: 0; background: none; padding: 0; font-size: 13px; font-weight: 800; color: #6151ea; }
        .db-done { font-size: 13px; font-weight: 800; color: var(--ad-green); }
        @media (max-width: 640px) {
          .db-card { padding: 18px 16px 20px; }
          .db-row { flex-direction: column; }
          .db-q { width: 100%; }
          .db-table .ad-table th:nth-child(2), .db-table .ad-table td:nth-child(2), .db-table .ad-table th:nth-child(3), .db-table .ad-table td:nth-child(3) { display: none; }
        }
      `}</style>
    </AdminShell>
  );
}
