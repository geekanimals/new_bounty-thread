"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import DiscoveryTabs from "@/components/brands/DiscoveryTabs";
import { BrAvatar, useToast } from "@/components/brands/BrandStates";
import { useBrand, canAct, searchAll, lookupHandle, asHandle, pickCreator, finishFacebookSearch, short as fmt, igUrl, ss } from "@/services/brand";
import { Search, Star, Plus, Check, ArrowUpDown, Pin, ChevronDown, Filter } from "@/components/ui/Icons";

// purane CS_CATS mein se (creator_search categories)
const NICHES = ["Beauty", "Fashion", "Lifestyle", "Food", "Fitness", "Pets"];
const ENG = [1, 2, 3, 5];
const CITIES = ["Any city", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Chennai", "Kolkata"];
const SORTS = [
  { key: "engagement_desc", label: "Best engagement" },
  { key: "followers_desc", label: "Most followers" },
  { key: "fee", label: "Lowest fee" },
];

// "50K" / "1.2M" → number
const num = (s) => {
  const n = parseFloat(String(s).replace(/[^\d.]/g, "")) || 0;
  return /M/i.test(s) ? n * 1e6 : /K/i.test(s) ? n * 1000 : /L/i.test(s) ? n * 1e5 : n;
};
const EMPTY = { niches: [], fMin: "", fMax: "", eng: 0, city: "Any city", aud: "Any", feeMin: "", feeMax: "" };
// Figma filters → purane creator_search p_filters
const toFilters = (f, q, sort, preset) => ({
  ...(preset || {}),
  q: q.trim(),
  categories: f.niches.length ? f.niches : (preset && preset.categories) || [],
  location: f.city !== "Any city" ? f.city : (preset && preset.location) || "",
  min_followers: f.fMin ? num(f.fMin) : (preset && preset.min_followers) || "",
  max_followers: f.fMax ? num(f.fMax) : (preset && preset.max_followers) || "",
  min_engagement: f.eng || (preset && preset.min_engagement) || "",
  sort: sort === "fee" ? "followers_desc" : sort,
});

/**
 * /brands/discovery — purana Discovery "🔎 Find creators" (mountCreatorSearch, brand mode):
 *  api.creator_search (Geek OS creators + Instagram pool), @handle → ig-discover lookup, ⭐ Shortlist → api.brand_discover_pick.
 *  "Creators for a campaign" tab yahan filters + campaign bhejta hai (sessionStorage geek_dx_preset).
 */
export default function DiscoveryFind() {
  const b = useBrand();
  const act = canAct(b);
  const [toast, say] = useToast();
  const [draft, setDraft] = useState(EMPTY); // filter card mein jo abhi chuna hai
  const [applied, setApplied] = useState(EMPTY); // "Show creators" dabane ke baad
  const [q, setQ] = useState("");
  const [qRun, setQRun] = useState(""); // search box ka text (Enter par)
  const [sort, setSort] = useState("engagement_desc");
  const [preset, setPreset] = useState(null); // campaign brief se aaye filters { filters, campaignId, campaignName, product }
  const [res, setRes] = useState({ rows: [], total: 0, loading: true, error: null, page: 1 });
  const [stars, setStars] = useState([]);
  const [short, setShort] = useState([]);
  const [busy, setBusy] = useState("");
  const [look, setLook] = useState({ h: "", busy: false, msg: "" });
  const [openF, setOpenF] = useState(false); // mobile par filters khule / band
  const looked = useRef("");

  // campaign tab se preset + Facebook (Instagram search) connect ki wapsi
  useEffect(() => {
    try {
      const p = JSON.parse(ss.get("geek_dx_preset") || "null");
      if (p) setPreset(p);
    } catch {
      /* ignore */
    }
    finishFacebookSearch().then((r) => r && say(r.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = useCallback(
    async (page = 1) => {
      setRes((r) => ({ ...r, loading: true, error: null }));
      const f = toFilters(applied, qRun, sort, preset && preset.filters);
      const r = await searchAll(f, page);
      setRes((old) =>
        r.error
          ? { ...old, loading: false, error: r.error.message || String(r.error) }
          : { rows: page === 1 ? r.data.rows : [...old.rows, ...r.data.rows], total: r.data.total, loading: false, error: null, page }
      );
      // @handle / instagram link / username jaisa word → Instagram par seedha lookup (purana S._looked)
      const h = asHandle(qRun);
      if (page === 1 && h && !r.error && !r.data.rows.some((x) => String(x.handle).toLowerCase() === h)) setLook({ h, busy: false, msg: "" });
      else setLook({ h: "", busy: false, msg: "" });
    },
    [applied, qRun, sort, preset]
  );
  useEffect(() => {
    run(1);
  }, [run]);

  const doLookup = useCallback(
    async (h) => {
      setLook({ h, busy: true, msg: "" });
      const r = await lookupHandle(h);
      if (r.error) return setLook({ h, busy: false, msg: r.error.message || "Couldn't look it up." });
      say(`@${h} — ${fmt(((r.data || {}).profile || {}).followers || 0)} followers · added to search`);
      run(1);
    },
    [run, say]
  );
  useEffect(() => {
    if (look.h && !look.busy && !look.msg && looked.current !== look.h) {
      looked.current = look.h;
      doLookup(look.h);
    }
  }, [look, doLookup]);

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const toggle = (arr, id) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  const results = res.rows;
  const shown = results.length;

  // ⭐ Shortlist (purana brandPick → api.brand_discover_pick; Saved creators mein bhi jaata hai)
  const shortlist = async (c) => {
    if (!act) return say("View-only login — ask your team's admin to shortlist creators.");
    if (short.includes(c.handle)) return;
    setBusy(c.handle);
    const r = await pickCreator(c, { campaignId: preset ? preset.campaignId : null, note: preset && preset.product ? "For: " + preset.product : "" });
    setBusy("");
    if (r.error) return say(r.error.message);
    setShort((s) => [...s, c.handle]);
    setStars((s) => [...s, c.handle]);
    say(`@${c.handle} shortlisted — the Geek team will take it from here`);
  };

  return (
    <BrandShell>
      <title>Discovery — Geek OS Brand</title>
      <DiscoveryTabs />

      {preset && (
        <p className="df-preset">
          Finding creators for <b>{preset.campaignName || "your campaign idea"}</b> — Shortlist adds them{preset.campaignId ? " to this campaign" : ""}.{" "}
          <button
            type="button"
            onClick={() => {
              ss.del("geek_dx_preset");
              setPreset(null);
            }}
          >
            Not for this campaign
          </button>
        </p>
      )}

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
                <button key={a} type="button" className={draft.aud === a ? "is-on" : ""} onClick={() => (a === "Any" ? set("aud", a) : say("Audience filter — coming soon"))}>
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
                if (draft.feeMin || draft.feeMax) say("Fee filter — coming soon");
                setApplied(draft);
                setOpenF(false);
              }}
            >
              Show creators
            </button>
          </div>
        </aside>

        {/* ---------- Results ---------- */}
        <section className="df-res">
          <label className="df-search">
            <Search size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setQRun(q)}
              onBlur={() => q !== qRun && setQRun(q)}
              placeholder="Name, @handle or a word — e.g. makeup"
            />
            <span>{res.loading ? "Searching…" : `${fmt(res.total)} found`}</span>
          </label>

          <div className="df-sort">
            <span>Sorted by</span>
            {SORTS.map((s) => (
              <button key={s.key} type="button" className={`br-chip ${sort === s.key ? "is-on" : ""}`} onClick={() => (s.key === "fee" ? say("Sort by fee — coming soon") : setSort(s.key))}>
                {sort === s.key && <ArrowUpDown size={13} />}
                {s.label}
              </button>
            ))}
          </div>

          {look.h && (
            <p className="df-look">
              {look.busy ? `Looking up @${look.h} on Instagram…` : look.msg ? `@${look.h}: ${look.msg}` : `Not in the list yet — @${look.h}`}
              {!look.busy && look.msg && (
                <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={() => doLookup(look.h)}>
                  Try again
                </button>
              )}
            </p>
          )}
          {res.error && <p className="df-look df-look--err">{res.error}</p>}
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
                {results.map((c) => {
                  const starred = stars.includes(c.handle);
                  const sl = short.includes(c.handle);
                  const name = c.name || c.display_name || c.handle;
                  const eng = c.engagement != null ? Math.round(Number(c.engagement) * 10) / 10 : null;
                  return (
                    <tr key={(c.kind || "") + c.handle}>
                      <td>
                        <a href={igUrl(c.handle)} target="_blank" rel="noreferrer" className="br-who">
                          <BrAvatar name={name} src={c.profile_picture_url} />
                          <span>
                            <strong>{name}</strong>
                            <small>
                              @{c.handle}
                              {c.city ? ` · ${c.city}` : ""}
                              {c.kind === "platform" ? " · On Geek OS" : ""}
                            </small>
                          </span>
                        </a>
                      </td>
                      <td>
                        <b>{c.followers != null ? fmt(c.followers) : "—"}</b>
                      </td>
                      <td className={eng >= 6 ? "df-good" : ""}>{eng != null ? `${eng}%` : "—"}</td>
                      <td>{c.avg_views != null ? fmt(c.avg_views) : c.avg_reach != null ? fmt(c.avg_reach) : "—"}</td>
                      <td>—</td>
                      <td>
                        <b>—</b>
                      </td>
                      <td>
                        <div className="df-acts">
                          <button
                            type="button"
                            className={`df-star ${starred ? "is-on" : ""}`}
                            aria-label={starred ? "Shortlisted" : "Save creator"}
                            title="Shortlisted creators also go to Saved creators"
                            onClick={() => shortlist(c)}
                            disabled={busy === c.handle}
                          >
                            <Star size={14} />
                          </button>
                          {act && (
                            <button type="button" className={`df-sl ${sl ? "is-on" : ""}`} onClick={() => shortlist(c)} disabled={busy === c.handle}>
                              {sl ? <Check size={13} /> : <Plus size={13} />}
                              {sl ? "Shortlisted" : "Shortlist"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={7} className="df-empty">
                      {res.loading ? "Searching…" : "No creators match these filters — try clearing a few."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {results.length > 0 && (
              <div className="br-more df-more">
                {shown < res.total ? (
                  <button type="button" className="br-btn br-btn--ghost" onClick={() => run(res.page + 1)} disabled={res.loading}>
                    {res.loading ? "Loading…" : "Load more"} <ChevronDown size={14} />
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

      {toast}

      <style>{`
        .df-preset { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0 0 14px; padding: 12px 14px; border-radius: 12px; background: var(--br-lilac); font-size: 13px; }
        .df-preset button { border: 0; background: none; padding: 0; color: var(--br-primary); font-weight: 700; font-size: 13px; }
        .df-look { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 0 0 12px; padding: 10px 14px; border-radius: 12px; background: #fff; border: 1px solid var(--br-border); font-size: 13px; }
        .df-look--err { color: var(--br-red); }
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
