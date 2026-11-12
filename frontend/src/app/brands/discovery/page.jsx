"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import DiscoveryTabs from "@/components/brands/DiscoveryTabs";
import { CREATORS } from "@/components/brands/data";
import { Search, Star, Plus, Check, ArrowUpDown, Pin, ChevronDown, Filter } from "@/components/ui/Icons";

const NICHES = ["Beauty", "Makeup", "Skincare", "Fashion", "Men", "Bridal"];
const ENG = [2, 4, 6, 8];
const CITIES = ["Any city", "Mumbai, Delhi +2", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Ahmedabad", "Jaipur"];
const CITY_SETS = { "Mumbai, Delhi +2": ["Mumbai", "Delhi", "Bengaluru", "Ahmedabad"] };
const SORTS = [
  { key: "eng", label: "Best engagement" },
  { key: "followers", label: "Most followers" },
  { key: "fee", label: "Lowest fee" },
];

// "284K" / "₹9.5K" jaise text ko number mein badalna
const num = (s) => {
  const n = parseFloat(String(s).replace(/[^\d.]/g, "")) || 0;
  return /M/i.test(s) ? n * 1e6 : /K/i.test(s) ? n * 1000 : n;
};

const START = {
  niches: ["Beauty", "Makeup"],
  fMin: "50K",
  fMax: "500K",
  eng: 4,
  city: "Mumbai, Delhi +2",
  aud: "Women",
  feeMin: "₹5K",
  feeMax: "₹40K",
};
const EMPTY = { niches: [], fMin: "", fMax: "", eng: 0, city: "Any city", aud: "Any", feeMin: "", feeMax: "" };

/** /brands/discovery — filters se creators dhoondo */
export default function DiscoveryFind() {
  const [draft, setDraft] = useState(START); // filter card mein jo abhi chuna hai
  const [applied, setApplied] = useState(EMPTY); // "Show N creators" dabane ke baad
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("eng");
  const [stars, setStars] = useState(() => CREATORS.filter((c) => c.starred).map((c) => c.id));
  const [short, setShort] = useState([]);
  const [shown, setShown] = useState(9);
  const [openF, setOpenF] = useState(false); // mobile par filters khule / band

  const filterList = (f) =>
    CREATORS.filter((c) => {
      if (f.niches.length && !f.niches.some((n) => c.niche.includes(n) || c.category.toLowerCase().includes(n.toLowerCase()))) return false;
      if (f.fMin && num(c.followers) < num(f.fMin)) return false;
      if (f.fMax && num(c.followers) > num(f.fMax)) return false;
      if (f.eng && parseFloat(c.eng) < f.eng) return false;
      if (f.city !== "Any city") {
        const set = CITY_SETS[f.city] || [f.city];
        if (!set.includes(c.city)) return false;
      }
      if (f.aud === "Women" && c.womenNum < 50) return false;
      if (f.aud === "Men" && c.womenNum > 50) return false;
      if (f.feeMin && num(c.fee) < num(f.feeMin)) return false;
      if (f.feeMax && num(c.fee) > num(f.feeMax)) return false;
      return true;
    });

  const draftCount = filterList(draft).length;
  // dummy list chhoti hai — "found" number ko 40K database jaisa dikhane ke liye scale
  const foundFor = (n) => (n === 0 ? 0 : n * 23 + 7);

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !["creators", "in", "for", "the", "and"].includes(w));
    let list = filterList(applied).filter((c) => {
      if (!words.length) return true;
      const hay = `${c.name} ${c.handle} ${c.city} ${c.category} ${c.niche.join(" ")}`.toLowerCase();
      return words.some((w) => hay.includes(w));
    });
    if (!list.length) list = filterList(applied);
    return [...list].sort((a, b) =>
      sort === "eng" ? parseFloat(b.eng) - parseFloat(a.eng) : sort === "followers" ? num(b.followers) - num(a.followers) : num(a.fee) - num(b.fee)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, q, sort]);

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const toggle = (arr, id) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  return (
    <BrandShell>
      <title>Discovery — Geek OS Brand</title>
      <DiscoveryTabs />

      <div className="df">
        {/* ---------- Filters ---------- */}
        <aside className={`br-card df-filters ${openF ? "is-open" : ""}`}>
          <button type="button" className="df-ftoggle" onClick={() => setOpenF(!openF)} aria-expanded={openF}>
            <Filter size={14} /> Filters
            <ChevronDown size={14} />
          </button>
          <div className="df-fhead">
            <h2>Filters</h2>
            <button type="button" onClick={() => setDraft(EMPTY)}>
              Clear
            </button>
          </div>

          <div className="df-fbody">
            <p className="df-lbl">Niche</p>
            <div className="df-chips">
              {NICHES.map((n) => (
                <button key={n} type="button" className={`br-chip ${draft.niches.includes(n) ? "is-on" : ""}`} onClick={() => set("niches", toggle(draft.niches, n))}>
                  {n}
                </button>
              ))}
            </div>

            <p className="df-lbl">Followers</p>
            <div className="df-two">
              <input className="br-input" placeholder="Min" value={draft.fMin} onChange={(e) => set("fMin", e.target.value)} />
              <input className="br-input" placeholder="Max" value={draft.fMax} onChange={(e) => set("fMax", e.target.value)} />
            </div>

            <p className="df-lbl">Engagement at least</p>
            <div className="br-seg">
              {ENG.map((e) => (
                <button key={e} type="button" className={draft.eng === e ? "is-on" : ""} onClick={() => set("eng", draft.eng === e ? 0 : e)}>
                  {e}%
                </button>
              ))}
            </div>

            <p className="df-lbl">Creator city</p>
            <label className="df-select">
              <Pin size={14} />
              <select value={draft.city} onChange={(e) => set("city", e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={13} />
            </label>

            <p className="df-lbl">Audience mostly</p>
            <div className="br-seg">
              {["Any", "Women", "Men"].map((a) => (
                <button key={a} type="button" className={draft.aud === a ? "is-on" : ""} onClick={() => set("aud", a)}>
                  {a}
                </button>
              ))}
            </div>

            <p className="df-lbl">Fee per reel</p>
            <div className="df-two">
              <input className="br-input" placeholder="Min" value={draft.feeMin} onChange={(e) => set("feeMin", e.target.value)} />
              <input className="br-input" placeholder="Max" value={draft.feeMax} onChange={(e) => set("feeMax", e.target.value)} />
            </div>

            <button
              type="button"
              className="br-btn br-btn--primary br-btn--block df-show"
              onClick={() => {
                setApplied(draft);
                setShown(9);
                setOpenF(false);
              }}
            >
              Show {foundFor(draftCount)} creators
            </button>
          </div>
        </aside>

        {/* ---------- Results ---------- */}
        <section className="df-res">
          <label className="df-search">
            <Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try: makeup creators in Mumbai" />
            <span>{foundFor(results.length)} found</span>
          </label>

          <div className="df-sort">
            <span>Sorted by</span>
            {SORTS.map((s) => (
              <button key={s.key} type="button" className={`br-chip ${sort === s.key ? "is-on" : ""}`} onClick={() => setSort(s.key)}>
                {sort === s.key && <ArrowUpDown size={13} />}
                {s.label}
              </button>
            ))}
          </div>

          <div className="br-table-wrap">
            <table className="br-table df-table">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Followers</th>
                  <th>Eng.</th>
                  <th>Avg views</th>
                  <th>Women</th>
                  <th>Fee</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {results.slice(0, shown).map((c) => {
                  const starred = stars.includes(c.id);
                  const sl = short.includes(c.id);
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/brands/creators/${c.id}`} className="br-who">
                          <span className="br-av" style={{ background: c.av }}>
                            {c.initials}
                          </span>
                          <span>
                            <strong>{c.name}</strong>
                            <small>
                              {c.handle} · {c.city}
                            </small>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <b>{c.followers}</b>
                      </td>
                      <td className={parseFloat(c.eng) >= 6 ? "df-good" : ""}>{c.eng}</td>
                      <td>{c.avgViews}</td>
                      <td>{c.women}</td>
                      <td>
                        <b>{c.fee}</b>
                      </td>
                      <td>
                        <div className="df-acts">
                          <button
                            type="button"
                            className={`df-star ${starred ? "is-on" : ""}`}
                            aria-label={starred ? "Remove from saved" : "Save creator"}
                            onClick={() => setStars(toggle(stars, c.id))}
                          >
                            <Star size={14} />
                          </button>
                          <button type="button" className={`df-sl ${sl ? "is-on" : ""}`} onClick={() => setShort(toggle(short, c.id))}>
                            {sl ? <Check size={13} /> : <Plus size={13} />}
                            {sl ? "Shortlisted" : "Shortlist"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={7} className="df-empty">
                      No creators match these filters — try clearing a few.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {results.length > 0 && (
              <div className="br-more df-more">
                {shown < results.length ? (
                  <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 6)}>
                    Load more <ChevronDown size={14} />
                  </button>
                ) : (
                  <span className="df-end">That’s everyone for these filters</span>
                )}
              </div>
            )}
          </div>

          {short.length > 0 && (
            <div className="df-bar">
              <span>
                <b>{short.length}</b> added to your shortlist
              </span>
              <Link href="/brands/discovery/shortlist" className="br-btn br-btn--primary br-btn--sm">
                Open shortlist
              </Link>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .df { display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 18px; align-items: start; }
        .df-filters { padding: 18px 16px; position: sticky; top: 92px; }
        .df-ftoggle { display: none; }
        .df-fhead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .df-fhead h2 { margin: 0; font-size: 16px; font-weight: 800; }
        .df-fhead button { border: 0; background: none; padding: 0; color: var(--br-primary); font-size: 12.5px; font-weight: 700; }
        .df-lbl { margin: 16px 0 8px; font-size: 12px; font-weight: 700; color: var(--br-text); }
        .df-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .df-chips .br-chip { height: 32px; padding: 0 12px; font-size: 12.5px; }
        .df-two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .df-two .br-input { height: 38px; font-size: 13px; padding: 0 12px; }
        .df-filters .br-seg { display: flex; }
        .df-filters .br-seg button { flex: 1; }
        .df-select {
          display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px;
          border: 1px solid var(--br-border-2); border-radius: 10px; color: var(--br-muted); background: #fff;
        }
        .df-select select { flex: 1; min-width: 0; border: 0; outline: none; background: none; font-size: 13px; color: var(--br-ink); appearance: none; cursor: pointer; }
        .df-show { margin-top: 20px; height: 42px; }

        .df-search {
          display: flex; align-items: center; gap: 10px; height: 50px; padding: 0 16px;
          border: 1.5px solid var(--br-primary); border-radius: 14px; background: #fff; color: var(--br-primary);
          box-shadow: 0 0 0 4px rgba(109,74,255,.08);
        }
        .df-search input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font-size: 14.5px; color: var(--br-ink); }
        .df-search span { font-size: 12.5px; font-weight: 600; color: var(--br-muted); white-space: nowrap; }
        .df-sort { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 14px 0; }
        .df-sort > span { font-size: 12.5px; color: var(--br-muted); margin-right: 2px; }
        .df-sort .br-chip { height: 32px; font-size: 12.5px; }

        .df-table td b { font-weight: 800; }
        .df-good { color: var(--br-green); font-weight: 600; }
        .df-acts { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
        .df-star {
          width: 32px; height: 32px; border-radius: 9px; border: 1px solid var(--br-border); background: #fff;
          display: grid; place-items: center; color: var(--br-faint);
        }
        .df-star.is-on { background: var(--br-orange-bg); border-color: #ffd9a8; color: var(--br-orange); }
        .df-star.is-on svg { fill: currentColor; }
        .df-sl {
          display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; min-width: 112px; justify-content: center;
          border: 0; border-radius: 9px; background: var(--br-lilac); color: var(--br-primary); font-size: 12.5px; font-weight: 700;
        }
        .df-sl.is-on { background: var(--br-primary); color: #fff; }
        .df-empty { text-align: center; color: var(--br-muted); padding: 30px 14px !important; white-space: normal !important; }
        .df-more { padding: 6px 0 16px; }
        .df-end { font-size: 12.5px; color: var(--br-faint); }
        .df-bar {
          position: sticky; bottom: 16px; margin-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px;
          padding: 10px 12px 10px 16px; border-radius: 14px; background: var(--br-ink); color: #fff; font-size: 13px;
          box-shadow: 0 16px 40px -16px rgba(18,16,42,.6);
        }

        @media (max-width: 1100px) {
          .df { grid-template-columns: minmax(0, 1fr); }
          .df-filters { position: static; padding: 0; }
          .df-ftoggle {
            display: flex; align-items: center; gap: 8px; width: 100%; height: 48px; padding: 0 16px;
            border: 0; background: none; font-size: 14px; font-weight: 700; color: var(--br-ink);
          }
          .df-ftoggle svg:last-child { margin-left: auto; transition: transform .2s; }
          .df-filters.is-open .df-ftoggle svg:last-child { transform: rotate(180deg); }
          .df-fhead { display: none; }
          .df-fbody { display: none; padding: 0 16px 16px; border-top: 1px solid var(--br-border); }
          .df-filters.is-open .df-fbody { display: block; }
          .df-filters.is-open .df-fhead { display: flex; padding: 12px 16px 0; }
        }
        @media (max-width: 640px) {
          .df-search { height: 46px; padding: 0 12px; }
          .df-search input { font-size: 14px; }
        }
      `}</style>
    </BrandShell>
  );
}
