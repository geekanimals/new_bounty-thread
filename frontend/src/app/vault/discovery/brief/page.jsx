"use client";

import { useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import DiscoveryHead from "@/components/admin/discovery/DiscoveryHead";
import InviteModal from "@/components/admin/discovery/InviteModal";
import { smartParse } from "@/components/admin/discovery/smart";
import { rpc, errText } from "@/lib/supabase";
import { kNum, cap1 } from "@/components/admin/creator/live";

const IDEAS = ["Female fashion creators in Mumbai, 50k+", "Moms in Delhi who speak Hindi", "Cat parents in Pune"];
const CATS = ["Lifestyle", "Fashion", "Beauty", "Food", "Travel", "Fitness", "Health", "Tech", "Comedy", "Entertainment", "Parenting", "Gaming", "Finance", "Business", "Education", "Music", "Dance", "Art", "Photography", "Sports", "Pets", "Home decor", "Auto", "Spirituality"];

/* Brief ki line → creator_search ke filters (purane csSmartApply + run jaisa) */
function filtersOf(p) {
  const f = { categories: p.categories.filter((c) => CATS.includes(c)), location: p.location, gender: p.gender, min_engagement: p.min_engagement, min_age: p.min_age, max_age: p.max_age, language: p.language, sort: "followers_desc" };
  if (p.min) f.min_followers = p.min;
  if (p.max) f.max_followers = p.max;
  if (p.words.length) f.words = p.words;
  if (p.gender) f.gender_soft = "yes";
  Object.keys(f).forEach((k) => (f[k] === "" || f[k] == null || (Array.isArray(f[k]) && !f[k].length)) && delete f[k]);
  return f;
}
/* "Why they fit" + Fit % = brief ki kitni shartein is creator par sach hain (asli data se) */
function fitOf(c, p) {
  const checks = [];
  if (p.location) checks.push([`📍 ${c.city || "city not known"}`, String(c.city || "").toLowerCase().includes(p.location.toLowerCase()) || String(c.state || "").toLowerCase().includes(p.location.toLowerCase())]);
  if (p.categories.length) checks.push([(c.categories || []).slice(0, 2).map(cap1).join(", ") || "no category", (c.categories || []).some((x) => p.categories.map((y) => y.toLowerCase()).includes(String(x).toLowerCase()))]);
  if (p.min || p.max) checks.push([`${kNum(c.followers)} followers`, (!p.min || (c.followers || 0) >= +p.min) && (!p.max || (c.followers || 0) <= +p.max)]);
  if (p.min_engagement) checks.push([`${c.engagement ?? "—"}% engagement`, (c.engagement || 0) >= +p.min_engagement]);
  if (p.language) checks.push([cap1(p.language), (c.languages || []).some((x) => String(x).toLowerCase() === p.language)]);
  const met = checks.filter((x) => x[1]).length;
  const why = checks.length ? checks.map((x) => x[0]).join(" · ") : [c.city, (c.categories || [])[0] && cap1(c.categories[0])].filter(Boolean).join(" · ") || "—";
  return { why, fit: checks.length ? Math.round((100 * met) / checks.length) : null };
}

/* Discovery → Match to a brief (Figma 053) — "Describe who you need" (purane app jaisa: line → filters → creator_search) */
export default function DiscoveryBrief() {
  const [brief, setBrief] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [invited, setInvited] = useState([]);
  const [inv, setInv] = useState(null);
  const [toast, setToast] = useState("");

  const find = async (text) => {
    const t = (text ?? brief).trim();
    if (!t) return;
    setBrief(t);
    setBusy(true);
    setErr(null);
    const p = smartParse(t);
    const filters = filtersOf(p);
    const ask = (source, size) => rpc("admin", "api.creator_search", { p_filters: { ...filters, source }, p_page: 1, p_size: size, p_campaign: null });
    const [P, X] = await Promise.all([ask("platform", 12), ask("external", 12)]);
    setBusy(false);
    if (P.error || X.error) return setErr(P.error || X.error);
    const list = [...((P.data && P.data.rows) || []), ...((X.data && X.data.rows) || [])].map((c) => ({ c, ...fitOf(c, p) }));
    list.sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0) || (b.c.followers || 0) - (a.c.followers || 0));
    setRes({ list, chips: p.chips });
  };

  const rows = res ? res.list : [];

  return (
    <AdminShell>
      <DiscoveryHead />
      <section className="db-card ga-card">
        <h2 className="ga-h2">Match creators to a brief</h2>
        <p className="db-sub">Describe who you need — we rank creators by fit.</p>
        <form
          className="db-row"
          onSubmit={(e) => {
            e.preventDefault();
            find();
          }}
        >
          <input className="ga-input db-q" placeholder="Female fashion creators in Mumbai, 50k+" value={brief} onChange={(e) => setBrief(e.target.value)} aria-label="Describe who you need" />
          <button type="submit" className="ga-btn ga-btn--primary db-go" disabled={busy}>
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
          <table className="ga-table">
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
              {rows.map(({ c, fit, why }, i) => {
                const key = c.member_id || c.handle || String(i);
                return (
                  <tr key={key + i}>
                    <td>
                      {c.member_id ? (
                        <Link href={`/vault/creators/${c.member_id}/profile`} className="db-name">
                          {c.name || "@" + c.handle}
                        </Link>
                      ) : (
                        <a href={`https://instagram.com/${encodeURIComponent(c.handle || "")}`} target="_blank" rel="noopener noreferrer" className="db-name">
                          {c.name || "@" + c.handle}
                        </a>
                      )}
                      <span className="db-handle">
                        {c.handle ? "@" + c.handle : ""}
                        {c.member_id ? "" : " · Instagram"}
                      </span>
                    </td>
                    <td>{why}</td>
                    <td>{kNum(c.followers)}</td>
                    <td>{fit == null ? "—" : <span className={`ga-badge ${fit >= 75 ? "ga-badge--green" : "ga-badge--orange"}`}>{fit}%</span>}</td>
                    <td>
                      {invited.includes(key) ? (
                        <span className="db-done">✓ Invited</span>
                      ) : (
                        <button type="button" className="db-link" onClick={() => setInv({ key, handle: c.handle, member_id: c.member_id, name: c.name })}>
                          Invite →
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {res && !!res.chips.length && <p className="db-chips">Searching for: {res.chips.map((c) => c[1]).join(" · ")}</p>}
          {err && <p className="db-empty">{errText(err)}</p>}
          {!res && !err && <p className="db-empty">Describe the creators you need — e.g. male creators in Jaipur with dogs.</p>}
          {res && !rows.length && !err && <p className="db-empty">No creator matches this brief — try fewer conditions.</p>}
        </div>
      </section>

      {inv && (
        <InviteModal
          who={inv}
          onClose={() => setInv(null)}
          onDone={(m) => {
            setInvited((l) => [...l, inv.key]);
            setInv(null);
            setToast(m);
            setTimeout(() => setToast(""), 3200);
          }}
        />
      )}
      {toast && <div className="ga-toast">✓ {toast}</div>}

      <style>{`
        .db-empty, .db-chips { margin-top: 14px; font-size: 12.5px; color: var(--ad-muted); }
        .db-card { padding: 25px 22px 30px; }
        .db-sub { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .db-row { display: flex; gap: 10px; margin-top: 17px; }
        .db-q { width: 270px; height: 44px; }
        .db-go { height: 42px; margin-top: 1px; }
        .db-ideas { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .db-ideas button { height: 26px; padding: 0 10px; border: 0; border-radius: 13.3px; background: var(--ad-soft); color: #7a8398; font-size: 11px; font-weight: 700; }
        .db-ideas button:hover { background: var(--ad-lilac); color: #6857ec; }
        .db-table { margin-top: 20px; overflow-x: auto; }
        .db-table .ga-table th { background: transparent; padding: 12px 11px; }
        .db-table .ga-table td { height: 67.5px; padding: 14px 11px; }
        .db-table .ga-table th:nth-child(2) { width: 40%; }
        .db-table .ga-table th:nth-child(3) { width: 16%; }
        .db-name { display: block; font-weight: 800; }
        .db-name:hover { color: var(--ad-primary); }
        .db-handle { display: block; margin-top: 4px; font-size: 11px; font-weight: 500; color: #9aa1b3; }
        .db-link { border: 0; background: none; padding: 0; font-size: 13px; font-weight: 800; color: #6151ea; }
        .db-done { font-size: 13px; font-weight: 800; color: var(--ad-green); }
        @media (max-width: 640px) {
          .db-card { padding: 18px 16px 20px; }
          .db-row { flex-direction: column; }
          .db-q { width: 100%; }
          .db-table .ga-table th:nth-child(2), .db-table .ga-table td:nth-child(2), .db-table .ga-table th:nth-child(3), .db-table .ga-table td:nth-child(3) { display: none; }
        }
      `}</style>
    </AdminShell>
  );
}
