"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import DiscoveryHead from "@/components/admin/discovery/DiscoveryHead";
import { rpc, invoke, useRpc, errText, sbFor } from "@/lib/supabase";
import { kNum, cap1 } from "@/components/admin/creator/live";
import { CS_SMART } from "@/components/admin/discovery/smart";

/* Discovery → Creator search — purane mountCreatorSearch jaisa:
 *  ✨ Describe who you need (English / Hinglish) · search · categories · location / followers / engagement / gender / source / sort
 *  ⚙️ More filters (state, language, content type, skill, age, last active, max engagement, flags)
 *  pool status · ↻ Fetch from Instagram · + Add creators · per creator: 🎯 Invite · 👤 Details · 🔄 Live stats · 💬 DM · Load more */
const CATS = ["Lifestyle", "Fashion", "Beauty", "Food", "Travel", "Fitness", "Health", "Tech", "Comedy", "Entertainment", "Parenting", "Gaming", "Finance", "Business", "Education", "Music", "Dance", "Art", "Photography", "Sports", "Pets", "Home decor", "Auto", "Spirituality"];
const CITIES = ["Delhi NCR", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Indore", "Surat", "Kochi", "Goa", "Bhopal", "Nagpur", "Patna", "Dehradun", "Guwahati"];
const TIERS = [["", "Any size"], ["nano", "Nano · 1K–10K", 1000, 10000], ["micro", "Micro · 10K–50K", 10000, 50000], ["mid", "Mid · 50K–200K", 50000, 200000], ["macro", "Macro · 200K–1M", 200000, 1000000], ["mega", "Mega · 1M+", 1000000, null], ["custom", "Custom range…"]];
const FLAGS = [["barter", "🎁 Takes barter"], ["pet", "🐾 Pet parent"], ["whatsapp", "✅ WhatsApp verified"], ["brands_worked", "🤝 Worked with brands"], ["travel", "✈️ Ready to travel"], ["campaigns_done", "🏆 Done campaigns with us"]];
const FORMATS = ["reels", "stories", "posts", "carousel", "ugc", "youtube", "shorts", "live", "photography", "video editing"];
const SORTS = [["followers_desc", "Followers: high → low"], ["followers_asc", "Followers: low → high"], ["engagement_desc", "Engagement: high → low"], ["engagement_asc", "Engagement: low → high"], ["active", "Recently active"], ["campaigns", "Most campaigns done"], ["recent", "Recently found"]];
const EXAMPLES = ["Female fashion creators in Mumbai, 50k+", "Jaipur mai male creators jinke paas dog ho", "Food bloggers in Bengaluru under 20k followers", "Fitness creators 18-25 age, 3% engagement", "Moms in Delhi who speak Hindi", "Cat parents in Pune"];
const NEW = { q: "", categories: [], location: "", tier: "", min: "", max: "", min_engagement: "", gender: "", source: "all", sort: "followers_desc", state: "", language: "", content_format: "", skill: "", min_age: "", max_age: "", active_days: "", max_engagement: "", flags: [], words: [], gender_soft: "", smart: "", chips: [] };

export default function DiscoverySearch() {
  const [S, setS] = useState(NEW);
  const [more, setMore] = useState(false);
  const [res, setRes] = useState({ rows: [], total: 0, loading: true, error: null, pageP: 1, pageE: 1 });
  const [toast, setToast] = useState("");
  const [inv, setInv] = useState(null); // { c, camps, cid, note, busy, err }
  const [imp, setImp] = useState(null); // { text, busy }
  const [busy, setBusy] = useState("");
  const { data: opts } = useRpc("admin", "api.creator_search_options", {});
  const pool = useRpc("admin", "api.discovery_pool_status", {});
  const say = (t) => {
    setToast(t);
    clearTimeout(say.t);
    say.t = setTimeout(() => setToast(""), 3200);
  };
  const set = (k, v) => setS((s) => ({ ...s, [k]: v }));

  const filtersOf = (s) => {
    const t = TIERS.find((x) => x[0] === s.tier);
    const f = { q: s.q, categories: s.categories, location: s.location, sort: s.sort, gender: s.gender, min_engagement: s.min_engagement, state: s.state, language: s.language, content_format: s.content_format, skill: s.skill, min_age: s.min_age, max_age: s.max_age, active_days: s.active_days, max_engagement: s.max_engagement };
    if (s.tier === "custom") {
      f.min_followers = s.min;
      f.max_followers = s.max;
    } else if (t && t[2] != null) {
      f.min_followers = t[2];
      if (t[3] != null) f.max_followers = t[3];
    }
    (s.flags || []).forEach((x) => (f[x] = "yes"));
    if ((s.words || []).length) f.words = s.words;
    if (s.gender && s.gender_soft) f.gender_soft = "yes";
    Object.keys(f).forEach((k) => (f[k] === "" || f[k] == null || (Array.isArray(f[k]) && !f[k].length)) && delete f[k]);
    return f;
  };
  const run = async (s = S, append = null) => {
    const f = filtersOf(s);
    const both = s.source === "all";
    const pP = append === "p" ? res.pageP + 1 : append ? res.pageP : 1;
    const pE = append === "e" ? res.pageE + 1 : append ? res.pageE : 1;
    if (!append) setRes((r) => ({ ...r, loading: true, error: null }));
    const ask = (source, page, size) => rpc("admin", "api.creator_search", { p_filters: { ...f, source }, p_page: page, p_size: size, p_campaign: null });
    const [P, X] = await Promise.all([
      s.source !== "external" && append !== "e" ? ask("platform", pP, both ? 12 : 24) : Promise.resolve({ data: null }),
      s.source !== "platform" && append !== "p" ? ask("external", pE, 24) : Promise.resolve({ data: null }),
    ]);
    const error = P.error || X.error;
    if (error) return setRes((r) => ({ ...r, loading: false, error }));
    const pr = ((P.data && P.data.rows) || []).map((r) => ({ ...r, onGeek: true }));
    const er = (X.data && X.data.rows) || [];
    setRes((r) => ({
      rows: append ? [...r.rows, ...pr, ...er] : [...pr, ...er],
      total: append ? r.total : ((P.data && P.data.total) || 0) + ((X.data && X.data.total) || 0),
      totalP: append ? r.totalP : (P.data && P.data.total) || 0,
      totalE: append ? r.totalE : (X.data && X.data.total) || 0,
      loading: false,
      error: null,
      pageP: pP,
      pageE: pE,
    }));
  };
  useEffect(() => {
    run(NEW);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const smart = (text) => {
    const p = CS_SMART(text);
    const n = { ...NEW, source: S.source, sort: S.sort, smart: text, chips: p.chips, location: p.location, gender: p.gender, gender_soft: p.gender ? "yes" : "", categories: p.categories.filter((c) => CATS.includes(c)), words: p.words, min_engagement: p.min_engagement, min_age: p.min_age, max_age: p.max_age, language: p.language };
    if (p.min || p.max) Object.assign(n, { tier: "custom", min: p.min, max: p.max });
    if (p.min_age || p.max_age || p.language) setMore(true);
    setS(n);
    run(n);
  };
  const dropChip = (k) => {
    const n = { ...S, chips: S.chips.filter((c) => c[0] !== k) };
    if (k === "location") n.location = "";
    if (k === "gender") Object.assign(n, { gender: "", gender_soft: "" });
    if (k === "followers") Object.assign(n, { tier: "", min: "", max: "" });
    if (k === "min_engagement") n.min_engagement = "";
    if (k === "age") Object.assign(n, { min_age: "", max_age: "" });
    if (k === "language") n.language = "";
    if (k === "categories") n.categories = [];
    if (k === "pet" || k === "extra") n.words = [];
    setS(n);
    run(n);
  };

  const fetchIg = async () => {
    setBusy("fetch");
    let tagged = 0;
    try {
      const r = await invoke("admin", "ig-discover", { action: "tagged" });
      tagged = (r.data && r.data.saved) || 0;
    } catch {
      /* ignore */
    }
    const { data } = await rpc("admin", "api.refresh_external_pool", {});
    setBusy("");
    say(`Found ${(data || 0) + tagged} creator(s) from tags and mentions on Instagram.`);
    run();
    pool.reload(true);
  };
  const live = async (c) => {
    setBusy("live:" + c.handle);
    const r = await invoke("admin", "ig-discover", { action: "lookup", username: c.handle });
    setBusy("");
    if (r.error || !r.data || r.data.error || !r.data.profile) return say((r.data && r.data.error) || errText(r.error) || "Couldn't reach Instagram.");
    const P = r.data.profile;
    setRes((x) => ({ ...x, rows: x.rows.map((y) => (y.handle === c.handle ? { ...y, followers: P.followers ?? y.followers, name: P.name || y.name, bio: P.bio || y.bio } : y)) }));
    say(`@${c.handle} — ${kNum(P.followers || 0)} followers · updated from Instagram`);
  };
  const openInvite = async (c) => {
    const { data, error } = await sbFor("admin").from("campaigns").select("id,name,status").order("created_at", { ascending: false }).limit(50);
    if (error) return say(errText(error));
    const camps = (data || []).filter((x) => ["Sourcing", "Live", "In Production", "Approval"].includes(x.status));
    if (!camps.length) return say("Create a campaign first — then you can invite creators to it.");
    setInv({ c, camps, cid: camps[0].id, note: "", busy: false, err: "" });
  };
  const sendInvite = async () => {
    setInv((v) => ({ ...v, busy: true, err: "" }));
    const args = { p_campaign: inv.cid, p_note: inv.note.trim() || null };
    const { data, error } = inv.c.member_id ? await rpc("admin", "api.invite_creator", { ...args, p_member: inv.c.member_id }) : await rpc("admin", "api.invite_external", { ...args, p_handle: inv.c.handle });
    if (error) return setInv((v) => ({ ...v, busy: false, err: errText(error) }));
    say(inv.c.member_id || (data && data.on_platform) ? "Invite sent — they'll see it in the app, on WhatsApp and by email." : "Invite saved. Open the campaign's Find matching creators → Off-platform invites to send them the Instagram DM.");
    setInv(null);
  };
  const doImport = async () => {
    const rows = imp.text
      .split(/[\n,]+/)
      .map((x) => x.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/[/?#].*$/, "").replace(/^@/, ""))
      .filter((x) => /^[A-Za-z0-9._]{2,30}$/.test(x))
      .map((handle) => ({ handle }));
    if (!rows.length) return say("Paste Instagram handles or profile links — one per line.");
    setImp((v) => ({ ...v, busy: true }));
    const { data, error } = await rpc("admin", "api.import_creators", { p_rows: rows });
    setImp(null);
    say(error ? errText(error) : `✓ ${(data && data.added) || 0} added to your creator search${data && data.skipped ? ` · ${data.skipped} already there` : ""}`);
    run();
    pool.reload(true);
  };

  const p = pool.data || {};
  const langs = (opts && opts.languages) || [];
  const skills = (opts && opts.skills) || [];
  const states = (opts && opts.states) || [];
  const profN = ["state", "language", "content_format", "skill", "min_age", "max_age", "active_days", "max_engagement"].filter((k) => S[k]).length + (S.flags || []).length;
  const rows = res.rows;
  const moreP = S.source !== "external" && res.totalP > res.pageP * (S.source === "all" ? 12 : 24);
  const moreE = S.source !== "platform" && res.totalE > res.pageE * 24;

  return (
    <AdminShell>
      <DiscoveryHead />
      <section className="ga-card ds-card">
        <div className="ds-smart">
          <p>
            ✨ <b>Describe who you need</b> <span className="ds-mute">— in your own words, English or Hinglish</span>
          </p>
          <form
            className="ds-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (S.smart.trim()) smart(S.smart);
            }}
          >
            <input className="ga-input ds-smartin" value={S.smart} onChange={(e) => set("smart", e.target.value)} placeholder="e.g. male creators in Jaipur who have dogs, 10k–50k followers" aria-label="Describe who you need" />
            <button type="submit" className="ga-btn ga-btn--primary ds-go">
              ✨ Find creators
            </button>
          </form>
          <div className="ds-chips">
            {EXAMPLES.map((x) => (
              <button key={x} type="button" className="ds-chip" onClick={() => smart(x)}>
                {x}
              </button>
            ))}
          </div>
          {S.chips.length > 0 && (
            <div className="ds-got">
              <span className="ds-mute">Searching for:</span>
              {S.chips.map((c) => (
                <span key={c[0]} className="ds-gotc">
                  {c[1]}{" "}
                  <button type="button" onClick={() => dropChip(c[0])} aria-label="Remove">
                    ✕
                  </button>
                </span>
              ))}
              {S.gender && S.gender_soft && <span className="ds-mute">Gender is known only for Geek OS creators — Instagram creators are shown too.</span>}
            </div>
          )}
        </div>

        <form
          className="ds-row"
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          <input className="ga-input ds-q" value={S.q} onChange={(e) => set("q", e.target.value)} placeholder="🔎 Search @username, name, a word from their posts, or #hashtag" aria-label="Search" />
          <button type="submit" className="ga-btn ga-btn--primary ds-go">
            Search
          </button>
        </form>
        <div className="ds-chips">
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              className={`ds-chip ${S.categories.includes(c) ? "is-on" : ""}`}
              onClick={() => {
                const n = { ...S, categories: S.categories.includes(c) ? S.categories.filter((x) => x !== c) : [...S.categories, c] };
                setS(n);
                run(n);
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="ds-filters">
          <label>
            Location
            <input className="ga-input" list="ds-cities" value={S.location} onChange={(e) => set("location", e.target.value)} placeholder="Any city" />
            <datalist id="ds-cities">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label>
            Followers
            <select className="ga-input" value={S.tier} onChange={(e) => set("tier", e.target.value)}>
              {TIERS.map((t) => (
                <option key={t[0]} value={t[0]}>
                  {t[1]}
                </option>
              ))}
            </select>
          </label>
          {S.tier === "custom" && (
            <>
              <label>
                Min
                <input className="ga-input" type="number" min={0} value={S.min} onChange={(e) => set("min", e.target.value)} placeholder="5000" />
              </label>
              <label>
                Max
                <input className="ga-input" type="number" min={0} value={S.max} onChange={(e) => set("max", e.target.value)} placeholder="200000" />
              </label>
            </>
          )}
          <label>
            Engagement
            <select className="ga-input" value={S.min_engagement} onChange={(e) => set("min_engagement", e.target.value)}>
              {[["", "Any"], ["1", "1%+"], ["2", "2%+"], ["3", "3%+"], ["5", "5%+"], ["8", "8%+"]].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Gender
            <select className="ga-input" value={S.gender} onChange={(e) => set("gender", e.target.value)}>
              {[["", "Any"], ["female", "Female"], ["male", "Male"], ["other", "Other"]].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Creators
            <select className="ga-input" value={S.source} onChange={(e) => set("source", e.target.value)}>
              {[["all", "Everyone"], ["platform", "On Geek OS"], ["external", "Not on Geek OS yet"]].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort
            <select className="ga-input" value={S.sort} onChange={(e) => set("sort", e.target.value)}>
              {SORTS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="ga-btn ga-btn--primary ds-go" onClick={() => run()}>
            Apply
          </button>
          <button
            type="button"
            className="ga-btn ga-btn--ghost ds-go"
            onClick={() => {
              setS(NEW);
              run(NEW);
            }}
          >
            Clear
          </button>
        </div>
        <button type="button" className={`ds-morebtn ${more ? "is-on" : ""}`} onClick={() => setMore(!more)}>
          ⚙️ More filters {profN ? <b>{profN}</b> : null} {more ? "▴" : "▾"}
        </button>
        <span className="ds-mute"> Profile filters — work on Geek OS creators (Instagram-only creators have no profile)</span>
        {more && (
          <div className="ds-more">
            <div className="ds-filters">
              <label>
                State
                <input className="ga-input" list="ds-states" value={S.state} onChange={(e) => set("state", e.target.value)} placeholder="Any state" />
                <datalist id="ds-states">
                  {states.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <label>
                Language
                <select className="ga-input" value={S.language} onChange={(e) => set("language", e.target.value)}>
                  <option value="">Any</option>
                  {[...new Set([...(S.language ? [S.language] : []), ...langs])].map((l) => (
                    <option key={l} value={l}>
                      {cap1(l)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Content type
                <select className="ga-input" value={S.content_format} onChange={(e) => set("content_format", e.target.value)}>
                  <option value="">Any</option>
                  {FORMATS.map((l) => (
                    <option key={l} value={l}>
                      {cap1(l)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Skill
                <select className="ga-input" value={S.skill} onChange={(e) => set("skill", e.target.value)}>
                  <option value="">Any</option>
                  {skills.map((l) => (
                    <option key={l} value={l}>
                      {cap1(l)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Age
                <span className="ds-pair">
                  <input className="ga-input" type="number" min={13} max={99} placeholder="18" value={S.min_age} onChange={(e) => set("min_age", e.target.value)} />–
                  <input className="ga-input" type="number" min={13} max={99} placeholder="45" value={S.max_age} onChange={(e) => set("max_age", e.target.value)} />
                </span>
              </label>
              <label>
                Last active
                <select className="ga-input" value={S.active_days} onChange={(e) => set("active_days", e.target.value)}>
                  {[["", "Any time"], ["1", "Today"], ["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"]].map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Max engagement
                <select className="ga-input" value={S.max_engagement} onChange={(e) => set("max_engagement", e.target.value)}>
                  {[["", "Any"], ["3", "Up to 3%"], ["5", "Up to 5%"], ["10", "Up to 10%"], ["20", "Up to 20%"]].map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="ds-chips">
              {FLAGS.map(([k, l]) => (
                <button key={k} type="button" className={`ds-chip ${(S.flags || []).includes(k) ? "is-on" : ""}`} onClick={() => set("flags", (S.flags || []).includes(k) ? S.flags.filter((x) => x !== k) : [...(S.flags || []), k])}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="ds-bar">
          <span className="ds-count">{res.loading ? "Searching…" : `${(res.total || 0).toLocaleString("en-IN")} creators found`}</span>
          <span className="ds-pool">
            👥 {kNum(p.on_platform || 0)} on Geek OS · 📸 {kNum(p.pool || 0)} found on Instagram ({kNum(p.with_stats || 0)} with numbers)
            {p.needs_permission ? " · ⚠️ Instagram stats lookup needs Meta approval (business discovery)" : p.last_run_at ? ` · 🔄 auto-filling numbers, last run ${new Date(p.last_run_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
          </span>
          <span className="ds-acts">
            <button type="button" className="ga-btn ga-btn--ghost ds-b" disabled={busy === "fetch"} onClick={fetchIg}>
              {busy === "fetch" ? "Fetching…" : "↻ Fetch from Instagram"}
            </button>
            <button type="button" className="ga-btn ga-btn--primary ds-b" onClick={() => setImp({ text: "", busy: false })}>
              + Add creators
            </button>
          </span>
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
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={(c.member_id || c.handle || "") + i}>
                  <td>
                    {c.member_id ? (
                      <Link href={`/vault/creators/${c.member_id}/profile`} className="ds-name">
                        {c.name || "@" + c.handle}
                      </Link>
                    ) : (
                      <a href={`https://instagram.com/${encodeURIComponent(c.handle || "")}`} target="_blank" rel="noopener noreferrer" className="ds-name">
                        {c.name || "@" + c.handle}
                      </a>
                    )}
                    <span className="ds-handle">
                      {c.handle ? "@" + c.handle : ""}
                      {c.onGeek ? " · On Geek OS" : " · Instagram"}
                    </span>
                  </td>
                  <td>{kNum(c.followers)}</td>
                  <td>{c.city || "—"}</td>
                  <td>{(c.categories || []).slice(0, 2).map(cap1).join(", ") || "—"}</td>
                  <td>{c.engagement != null ? c.engagement + "%" : "—"}</td>
                  <td>
                    <span className="ds-cacts">
                      <button type="button" className="ga-btn ga-btn--primary ds-b" onClick={() => openInvite(c)}>
                        🎯 Invite
                      </button>
                      {c.member_id ? (
                        <Link href={`/vault/creators/${c.member_id}/profile`} className="ga-btn ga-btn--ghost ds-b">
                          👤 Details
                        </Link>
                      ) : (
                        <>
                          <button type="button" className="ga-btn ga-btn--ghost ds-b" disabled={busy === "live:" + c.handle} onClick={() => live(c)}>
                            {busy === "live:" + c.handle ? "Fetching…" : "🔄 Live stats"}
                          </button>
                          <a className="ga-btn ga-btn--ghost ds-b" href={`https://ig.me/m/${encodeURIComponent(c.handle || "")}`} target="_blank" rel="noopener noreferrer">
                            💬 DM
                          </a>
                        </>
                      )}
                    </span>
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
          {!res.loading && !res.error && !rows.length && <p className="ds-empty">No creators match — try fewer filters.</p>}
          {(moreP || moreE) && (
            <div className="ds-moreload">
              {moreP && (
                <button type="button" className="ga-btn ga-btn--ghost ds-b" onClick={() => run(S, "p")}>
                  Load more Geek OS creators
                </button>
              )}
              {moreE && (
                <button type="button" className="ga-btn ga-btn--ghost ds-b" onClick={() => run(S, "e")}>
                  Load more Instagram creators
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {inv && (
        <div className="ga-overlay" onClick={() => setInv(null)}>
          <div className="ga-modal ds-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Invite">
            <h2 className="ga-h2">Invite @{inv.c.handle || inv.c.name}</h2>
            <label className="ga-label">Campaign</label>
            <select className="ga-input" value={inv.cid} onChange={(e) => setInv({ ...inv, cid: e.target.value })}>
              {inv.camps.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <label className="ga-label">Note (optional)</label>
            <input className="ga-input" maxLength={140} value={inv.note} onChange={(e) => setInv({ ...inv, note: e.target.value })} placeholder="Why you'd love them on this" />
            {inv.err && <p className="ds-err">{inv.err}</p>}
            <div className="ds-mact">
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setInv(null)}>
                Cancel
              </button>
              <button type="button" className="ga-btn ga-btn--primary" disabled={inv.busy} onClick={sendInvite}>
                {inv.busy ? "Sending…" : "Send invite"}
              </button>
            </div>
          </div>
        </div>
      )}
      {imp && (
        <div className="ga-overlay" onClick={() => setImp(null)}>
          <div className="ga-modal ds-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Add creators">
            <h2 className="ga-h2">+ Add creators to your search</h2>
            <p className="ds-mute">Paste Instagram handles or profile links — one per line. Their numbers fill in from Instagram.</p>
            <textarea className="ga-input ds-ta" rows={8} value={imp.text} onChange={(e) => setImp({ ...imp, text: e.target.value })} placeholder={"@asha.creates\nhttps://instagram.com/rohan.eats"} />
            <div className="ds-mact">
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setImp(null)}>
                Cancel
              </button>
              <button type="button" className="ga-btn ga-btn--primary" disabled={imp.busy} onClick={doImport}>
                {imp.busy ? "Adding…" : "Add to search"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="ga-toast">{toast}</div>}

      <style>{`
        .ds-card { padding: 25px 22px 30px; }
        .ds-mute { font-size: 12px; color: var(--ad-muted); }
        .ds-smart { padding: 14px 16px; border-radius: 14px; background: #f5f3ff; border: 1px solid #e3dfff; margin-bottom: 16px; font-size: 13.5px; }
        .ds-smartin { flex: 1; min-width: 260px; height: 44px; }
        .ds-got { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 10px; }
        .ds-gotc { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; background: #fff; border: 1px solid #d9d4ff; font-size: 12px; font-weight: 700; color: #4b3fb5; }
        .ds-gotc button { border: 0; background: none; cursor: pointer; color: var(--ad-muted); }
        .ds-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
        .ds-q { flex: 1; min-width: 260px; height: 44px; }
        .ds-go { height: 42px; padding: 0 16px; }
        .ds-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .ds-chip { height: 28px; padding: 0 11px; border: 0; border-radius: 14px; background: var(--ad-soft); color: #6a7390; font-size: 12px; font-weight: 700; cursor: pointer; }
        .ds-chip.is-on { background: var(--ad-lilac); color: #6857ec; }
        .ds-filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; margin-top: 14px; }
        .ds-filters label { display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; font-weight: 700; color: var(--ad-muted); }
        .ds-filters .ga-input { height: 40px; min-width: 130px; padding: 0 10px; }
        .ds-pair { display: flex; align-items: center; gap: 6px; }
        .ds-pair .ga-input { min-width: 0; width: 70px; }
        .ds-morebtn { margin-top: 12px; border: 0; background: none; font-size: 13px; font-weight: 800; color: #6657e9; cursor: pointer; }
        .ds-morebtn b { display: inline-grid; place-items: center; min-width: 18px; height: 18px; border-radius: 999px; background: #6657e9; color: #fff; font-size: 11px; }
        .ds-more { margin-top: 6px; padding: 12px 14px; border-radius: 12px; border: 1px dashed var(--ad-line-2); }
        .ds-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 18px; }
        .ds-count { font-size: 13px; font-weight: 800; color: var(--ad-ink); }
        .ds-pool { font-size: 12px; color: var(--ad-muted); }
        .ds-acts { display: flex; gap: 8px; margin-left: auto; }
        .ds-b { height: 34px; padding: 0 12px; font-size: 12.5px; white-space: nowrap; }
        .ds-table { margin-top: 14px; overflow-x: auto; }
        .ds-table .ga-table th { background: transparent; padding: 12px 11px; }
        .ds-table .ga-table td { padding: 12px 11px; }
        .ds-name { display: block; font-weight: 800; }
        .ds-handle { display: block; margin-top: 4px; font-size: 11px; color: #9aa1b3; }
        .ds-cacts { display: flex; gap: 6px; flex-wrap: nowrap; }
        .ds-empty { padding: 26px 0; text-align: center; color: var(--ad-muted); }
        .ds-retry { border: 0; background: none; font-weight: 800; color: #6657e9; }
        .ds-moreload { display: flex; gap: 8px; justify-content: center; margin-top: 14px; }
        .ds-modal { padding: 22px; max-width: 520px; display: flex; flex-direction: column; gap: 8px; }
        .ds-ta { height: auto; min-height: 140px; padding: 10px 12px; }
        .ds-err { color: var(--ad-red); font-size: 12.5px; font-weight: 700; }
        .ds-mact { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
      `}</style>
    </AdminShell>
  );
}
