"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import { useCreatorsList, creatorCounts, rowOf, matchQ, csv, CSV_COLS, errText, CARD_FILTERS, CARD_SORTS, filterOptions, agoTxt } from "@/components/admin/creator/live";

const PER = 24;

/* Creators (list) — admin_creators + admin_ig_accounts + admin_creator_facts (purane app jaisa, har 30 sec) */
export default function AdminCreators() {
  const { all, loading, error, reload } = useCreatorsList();
  const N = creatorCounts(all);
  const [q, setQ] = useState("");
  const [ig, setIg] = useState("All");
  const [cat, setCat] = useState("All categories");
  const [sort, setSort] = useState("Newest first");
  const [f, setF] = useState({});
  const [more, setMore] = useState(false);
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
        if (v.sort && CARD_SORTS[v.sort]) setSort(v.sort);
        if (v.f && typeof v.f === "object") setF(v.f);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2200);
  };

  // purana "Save view" (ig / cat) bhi chalta rahe — ab woh filters ka hissa hai
  const fx = useMemo(() => {
    const o = { ...f };
    if (ig !== "All" && !o.Instagram) o.Instagram = ig;
    if (cat !== "All categories" && !o.Category) o.Category = cat;
    return o;
  }, [f, ig, cat]);
  const onN = Object.values(fx).filter((v) => v && v !== "Any").length;
  const list = useMemo(() => {
    const t = q.trim();
    return all
      .filter((c) => matchQ(c, t))
      .filter((c) => CARD_FILTERS.every(([k, , test]) => !fx[k] || fx[k] === "Any" || test(c, fx[k])))
      .sort(CARD_SORTS[sort] || CARD_SORTS["Newest first"]);
  }, [all, q, fx, sort]);
  const setFilter = (k, v) => {
    if (k === "Instagram") setIg("All");
    if (k === "Category") setCat("All categories");
    setF((o) => ({ ...o, [k]: v }));
    setPage(0);
  };
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
          <select className="ga-input cl-sel" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            {Object.keys(CARD_SORTS).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <button type="button" className={`cl-save ${more ? "is-on" : ""}`} onClick={() => setMore(!more)}>
            ⚙️ Filters{onN ? ` (${onN})` : ""} {more ? "▴" : "▾"}
          </button>
          <button
            type="button"
            className="cl-save"
            onClick={() => {
              try {
                localStorage.setItem("geek_acr_view_list", JSON.stringify({ q, ig: "All", cat: "All categories", sort, f: fx }));
              } catch {
                /* ignore */
              }
              flash("View saved");
            }}
          >
            Save view
          </button>
        </div>

        {(more || onN > 0) && (
          <div className="cl-fx">
            {more &&
              CARD_FILTERS.map(([label, opts]) => (
                <label key={label} className={`cl-f ${fx[label] && fx[label] !== "Any" ? "is-on" : ""}`}>
                  <span>{label}</span>
                  <select value={fx[label] || "Any"} onChange={(e) => setFilter(label, e.target.value)}>
                    {(opts || filterOptions(all, label)).map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ))}
            <p className="cl-fxfoot">
              <b>{list.length.toLocaleString("en-IN")}</b> of {all.length.toLocaleString("en-IN")} creators match
              {onN > 0 && (
                <button
                  type="button"
                  className="cl-save"
                  onClick={() => {
                    setF({});
                    setIg("All");
                    setCat("All categories");
                    setPage(0);
                  }}
                >
                  ✕ Clear {onN} filter{onN > 1 ? "s" : ""}
                </button>
              )}
            </p>
          </div>
        )}

        <div className="cl-table">
          <table className="ga-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Followers</th>
                <th>Engagement</th>
                <th>Per reel</th>
                <th>Applied / ✓</th>
                <th>City</th>
                <th>Category</th>
                <th>Instagram</th>
                <th>Profile</th>
                <th>Active</th>
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
                    <span className="cl-handle">
                      {c.handle}
                      {c.igCount > 1 ? ` · ${c.igCount} accounts` : ""}
                    </span>
                    <Contact c={c.raw} />
                  </td>
                  <td>
                    <b>{c.followers}</b>
                  </td>
                  <td>{c.eng}</td>
                  <td>{c.reel}</td>
                  <td>{c.applied}</td>
                  <td>{c.city}</td>
                  <td>{c.category}</td>
                  <td>
                    <span className={`ga-badge ${c.ig ? "ga-badge--green" : ""}`}>{c.ig ? "Connected" : "Not connected"}</span>
                  </td>
                  <td>
                    <span className={`ga-badge ${c.complete ? "ga-badge--violet" : "ga-badge--orange"}`}>{c.complete ? "Complete" : c.score}</span>
                  </td>
                  <td className="cl-handle">{agoTxt(c.raw.last_seen)}</td>
                  <td>
                    <Link href={`/vault/creators/${c.id}/profile`} className="cl-link">
                      View 360° →
                    </Link>
                  </td>
                </tr>
              ))}
              {!shown.length && (
                <tr>
                  <td colSpan={11} className="cl-empty">
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
        .cl-save.is-on { text-decoration: underline; }
        .cl-fx { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; padding: 14px; border-radius: 14px; border: 1px dashed var(--ad-line-2, #dfe3ee); }
        .cl-f { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 700; color: var(--ad-muted); }
        .cl-f select { height: 36px; min-width: 130px; padding: 0 8px; border-radius: 10px; border: 1px solid var(--ad-line); background: #fff; font-size: 12.5px; color: var(--ad-text); }
        .cl-f.is-on select { border-color: #6657e9; color: #4b3fb5; font-weight: 700; }
        .cl-fxfoot { flex-basis: 100%; display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: var(--ad-muted); }
        .cl-ct { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; font-size: 11px; }
        .cl-ct a { color: #5b6478; }
        .cl-ct a:hover { color: #6657e9; }
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

/* WhatsApp + email har creator par (purane app jaisa) — tap = open, profile nahi */
function Contact({ c }) {
  if (!c) return null;
  const wa = c.whatsapp || c.phone || "";
  const em = c.email && !/@creators\.bountythreads\.app$/i.test(c.email) ? c.email : "";
  if (!wa && !em) return null;
  return (
    <span className="cl-ct">
      {wa && (
        <a href={`https://wa.me/${String(wa).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
          📱 {wa}
        </a>
      )}
      {em && <a href={`mailto:${em}`}>✉️ {em}</a>}
    </span>
  );
}
