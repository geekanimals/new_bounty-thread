"use client";

import { useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import DiscoveryTabs from "@/components/brands/DiscoveryTabs";
import { BrAvatar, useToast } from "@/components/brands/BrandStates";
import { useBrand, brandView, canAct, getDiscoverBrief, briefToFilters, searchAll, pickCreator, short as fmt, igUrl } from "@/services/brand";
import { Sparkle, Check, Star, Plus, ChevronDown, Refresh } from "@/components/ui/Icons";

// purane CS_CATS / CS_CITIES ka chhota hissa — text mein se filters pakadne ke liye
const CATS = ["Lifestyle", "Fashion", "Beauty", "Food", "Travel", "Fitness", "Health", "Tech", "Comedy", "Parenting", "Gaming", "Finance", "Education", "Music", "Dance", "Art", "Photography", "Sports", "Pets", "Home decor", "Auto"];
const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Bangalore", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Chennai", "Kolkata", "Lucknow", "Chandigarh", "Indore", "Surat", "Goa"];
const kNum = (v, u) => Number(v) * (/m/i.test(u || "") ? 1e6 : /l/i.test(u || "") ? 1e5 : /k/i.test(u || "") ? 1e3 : 1);

// Text se filters + tags (purane dxBrief form + csSmartApply ka chhota roop — koi AI nahi)
const parseText = (t) => {
  const s = String(t || "").toLowerCase();
  const f = {};
  const tags = [];
  const age = t.match(/(\d{2})\s*[–-]\s*(\d{2})/);
  if (/women|female|girls|moms?\b/.test(s)) {
    f.gender = "female";
    f.gender_soft = "yes";
    tags.push(age ? `Women ${age[1]}–${age[2]}` : "Women");
  } else if (/\bmen\b|male|boys|dads?\b/.test(s)) {
    f.gender = "male";
    f.gender_soft = "yes";
    tags.push(age ? `Men ${age[1]}–${age[2]}` : "Men");
  }
  if (age) {
    f.min_age = age[1];
    f.max_age = age[2];
  }
  const city = CITIES.find((c) => s.includes(c.toLowerCase()));
  if (city) {
    f.location = city === "Bangalore" ? "Bengaluru" : city;
    tags.push(f.location);
  }
  const cats = CATS.filter((c) => s.includes(c.toLowerCase()) || (c === "Beauty" && /makeup|skincare|bridal/.test(s)) || (c === "Pets" && /\bdogs?\b|\bcats?\b|\bpets?\b/.test(s)));
  if (cats.length) {
    f.categories = cats.slice(0, 3);
    tags.push(f.categories.join(" · "));
  }
  const fr = t.match(/(\d+(?:\.\d+)?)\s*([kml])?\s*[–-]\s*(\d+(?:\.\d+)?)\s*([kml])\s*followers/i);
  if (fr) {
    f.min_followers = kNum(fr[1], fr[2] || fr[4]);
    f.max_followers = kNum(fr[3], fr[4]);
    tags.push(`${fmt(f.min_followers)}–${fmt(f.max_followers)} followers`);
  }
  const er = t.match(/(\d(?:\.\d)?)\s*%\s*(?:\+|plus)?\s*eng/i);
  if (er) {
    f.min_engagement = er[1];
    tags.push(`${er[1]}%+ engagement`);
  }
  return { f, tags };
};

// creator kitna fit hai — jitni maangi cheezein match hui (score ring + reasons)
const fit = (c, f) => {
  const checks = [];
  if (f.location) checks.push([String(c.city || "").toLowerCase().includes(String(f.location).toLowerCase()), `Based in ${c.city || f.location}`]);
  if ((f.categories || []).length) {
    const hit = (c.categories || []).find((x) => f.categories.some((k) => String(x).toLowerCase() === String(k).toLowerCase()));
    checks.push([!!hit, hit ? `${hit} creator` : "Category"]);
  }
  if (f.min_followers || f.max_followers)
    checks.push([(!f.min_followers || c.followers >= f.min_followers) && (!f.max_followers || c.followers <= f.max_followers), `${fmt(c.followers)} followers`]);
  if (f.min_engagement) checks.push([Number(c.engagement) >= Number(f.min_engagement), `${Math.round(Number(c.engagement) * 10) / 10}% engagement`]);
  const ok = checks.filter((x) => x[0]);
  const eng = Math.min(1, (Number(c.engagement) || 0) / 6);
  const score = Math.round(checks.length ? 55 + 35 * (ok.length / checks.length) + 10 * eng : 50 + 45 * eng);
  const reasons = ok.map((x) => x[1]);
  if (!reasons.length && c.engagement != null) reasons.push(`${Math.round(Number(c.engagement) * 10) / 10}% engagement`);
  if (c.kind === "platform") reasons.push("On Geek OS");
  return { score: Math.min(99, score), reasons: reasons.slice(0, 3) };
};

/* Score ka gol ring */
function Ring({ score }) {
  const r = 19;
  const c = 2 * Math.PI * r;
  const tone = score >= 85 ? "#16a34a" : "#6d4aff";
  return (
    <span className="dc-ring">
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r={r} fill="none" stroke="#eceef5" strokeWidth="4.5" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <b>{score}</b>
    </span>
  );
}

/**
 * /brands/discovery/campaign — purana "🎯 Creators for a campaign" (dxBrief):
 *  "Use a saved request" → aapke campaigns ka api.brand_discover_brief (ideal creator) text + filters mein;
 *  Find matches → api.creator_search (wahi filters), fit score; Shortlist → api.brand_discover_pick (campaign ke saath).
 */
export default function DiscoveryForCampaign() {
  const b = useBrand();
  const v = brandView(b);
  const act = canAct(b);
  const [toast, say] = useToast();
  const camps = v.campaigns.filter((c) => !/completed|cancel/i.test(c.status || ""));
  const [text, setText] = useState("");
  const [camp, setCamp] = useState(null); // { id, name, product, filters }
  const [ci, setCi] = useState(0);
  const [state, setState] = useState("idle"); // idle | loading | done
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");
  const [stars, setStars] = useState([]);
  const [short, setShort] = useState([]);
  const [busy, setBusy] = useState("");
  const [shown, setShown] = useState(5);
  const parsed = parseText(text);
  const tags = [...(camp ? [camp.name] : []), ...parsed.tags];

  // "Use a saved request" — agla campaign ka brief (purana f.camp.onchange → fill)
  const useSaved = async () => {
    if (!camps.length) return say("No active campaign yet — describe your idea instead.");
    const c = camps[ci % camps.length];
    setCi(ci + 1);
    const r = await getDiscoverBrief(c.campaign_id);
    if (r.error) return say(r.error.message);
    const d = r.data || {};
    const f = briefToFilters(d);
    const ip = d.ideal || {};
    setCamp({ id: c.campaign_id, name: c.name, product: d.product || c.product || "", filters: f });
    setText(
      [
        d.product ? `Promoting ${d.product}.` : "",
        f.categories.length ? `${f.categories.join(", ")} creators` : "",
        f.location ? `in ${f.location}` : "",
        f.gender ? `(${f.gender === "female" ? "women" : "men"}${f.min_age ? ` ${f.min_age}–${f.max_age || ""}` : ""})` : "",
        f.min_followers || f.max_followers ? `${fmt(f.min_followers || 0)}–${f.max_followers ? fmt(f.max_followers) : "any"} followers` : "",
        f.min_engagement ? `${f.min_engagement}% engagement` : "",
        ip.pet === "yes" ? `Must have a ${ip.pet_type || "pet"}.` : "",
      ]
        .filter(Boolean)
        .join(" ")
    );
    say(`Loaded the brief for ${c.name}`);
  };

  const filters = () => ({ ...(camp ? camp.filters : {}), ...parsed.f, sort: "engagement_desc" });
  const find = async () => {
    if (!text.trim() && !camp) return;
    setState("loading");
    setErr("");
    setShown(5);
    const f = filters();
    const r = await searchAll(f, 1);
    if (r.error) {
      setErr(r.error.message || String(r.error));
      return setState("idle");
    }
    const ranked = r.data.rows.map((c) => ({ ...c, ...fit(c, f) })).sort((a, c) => c.score - a.score);
    setRows(ranked);
    setTotal(r.data.total);
    setState("done");
  };
  // Shortlist (purana brandPick → brand_discover_pick, campaign ke saath)
  const pick = async (c, quiet = false) => {
    if (!act) return say("View-only login — ask your team's admin to shortlist creators.");
    if (short.includes(c.handle)) return true;
    setBusy(c.handle);
    const r = await pickCreator(c, { campaignId: camp ? camp.id : null, note: camp && camp.product ? "For: " + camp.product : "" });
    setBusy("");
    if (r.error) {
      say(r.error.message);
      return false;
    }
    setShort((s) => [...s, c.handle]);
    setStars((s) => [...s, c.handle]);
    if (!quiet) say(`@${c.handle} shortlisted — the Geek team will take it from here`);
    return true;
  };
  const pickTop = async () => {
    let n = 0;
    for (const c of rows.slice(0, 10)) if (await pick(c, true)) n++;
    say(`${n} creator${n === 1 ? "" : "s"} shortlisted`);
  };

  return (
    <BrandShell>
      <title>Creators for a campaign — Geek OS Brand</title>
      <DiscoveryTabs />

      <section className="br-card dc-brief">
        <div className="dc-brief__head">
          <span className="dc-brief__ic">
            <Sparkle size={15} />
          </span>
          <div>
            <h2>Describe your campaign</h2>
            <p>We read it and rank creators by how well they fit — not just by followers.</p>
          </div>
        </div>
        <textarea
          className="br-input dc-text"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Who should talk about it, where, what content and roughly what budget…"
        />
        <div className="dc-brief__foot">
          <div className="dc-tags">
            {tags.map((t) => (
              <span key={t} className="br-badge br-badge--violet">
                {t}
              </span>
            ))}
            {!tags.length && <span className="dc-hint">Mention audience, city, niche and budget for better matches</span>}
          </div>
          <div className="dc-brief__btns">
            <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={useSaved}>
              Use a saved request
            </button>
            <button type="button" className="br-btn br-btn--primary br-btn--sm" onClick={find} disabled={(!text.trim() && !camp) || state === "loading"}>
              {state === "loading" ? <Refresh size={13} /> : <Sparkle size={13} />}
              {state === "loading" ? "Finding…" : "Find matches"}
            </button>
          </div>
        </div>
      </section>

      {state === "loading" && (
        <div className="dc-loading">
          {[0, 1, 2].map((i) => (
            <div key={i} className="dc-skel" />
          ))}
        </div>
      )}

      {err && <p className="dc-err">{err}</p>}

      {state === "done" && (
        <>
          <div className="dc-reshead">
            <h2>
              {fmt(total)} match{total === 1 ? "" : "es"}
              {camp ? ` for ${camp.name}` : ""}
            </h2>
            {act && rows.length > 0 && (
              <button type="button" className="br-btn br-btn--soft br-btn--sm" onClick={pickTop} disabled={!!busy}>
                {rows.slice(0, 10).every((m) => short.includes(m.handle)) ? "Top 10 shortlisted" : "Shortlist top 10"}
              </button>
            )}
          </div>
          {!rows.length && <p className="dc-err">No creators match yet — try fewer details (e.g. just a city and a category).</p>}

          <ul className="dc-list">
            {rows.slice(0, shown).map((c) => {
              const sl = short.includes(c.handle);
              const st = stars.includes(c.handle);
              const name = c.name || c.display_name || c.handle;
              return (
                <li key={(c.kind || "") + c.handle} className="br-card dc-row">
                  <Ring score={c.score} />
                  <BrAvatar name={name} src={c.profile_picture_url} cls="br-av--lg" />
                  <div className="dc-row__body">
                    <p className="dc-row__name">
                      <a href={igUrl(c.handle)} target="_blank" rel="noreferrer">
                        {name}
                      </a>
                      <small>
                        @{c.handle}
                        {c.followers != null ? ` · ${fmt(c.followers)}` : ""}
                        {c.city ? ` · ${c.city}` : ""}
                      </small>
                    </p>
                    <p className="dc-row__why">
                      {c.reasons.map((r) => (
                        <span key={r}>
                          <Check size={12} /> {r}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className="dc-row__end">
                    <strong>{c.engagement != null ? `${Math.round(Number(c.engagement) * 10) / 10}%` : "—"}</strong>
                    <button type="button" className={`dc-star ${st ? "is-on" : ""}`} aria-label="Save creator" title="Shortlisted creators also go to Saved creators" onClick={() => pick(c)} disabled={busy === c.handle}>
                      <Star size={14} />
                    </button>
                    {act && (
                      <button type="button" className={`br-btn br-btn--sm ${sl ? "br-btn--dark" : "br-btn--primary"} dc-sl`} onClick={() => pick(c)} disabled={busy === c.handle}>
                        {sl ? <Check size={13} /> : <Plus size={13} />}
                        {sl ? "Shortlisted" : "Shortlist"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="br-more">
            {shown < rows.length ? (
              <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 5)}>
                Load more <ChevronDown size={14} />
              </button>
            ) : (
              <Link href="/brands/discovery/shortlist" className="br-btn br-btn--ghost">
                {short.length ? `Open shortlist (${short.length})` : "Open my shortlist"}
              </Link>
            )}
          </div>
        </>
      )}

      {toast}

      <style>{`
        .dc-err { margin: 14px 0 0; font-size: 13px; color: var(--br-muted); }
        .dc-brief { padding: 20px; background: linear-gradient(180deg, #fff 0%, #faf8ff 100%); }
        .dc-brief__head { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 14px; }
        .dc-brief__ic { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; background: linear-gradient(135deg,#7c5cff,#c084fc); color: #fff; display: grid; place-items: center; }
        .dc-brief__head h2 { margin: 0; font-size: 16px; font-weight: 800; }
        .dc-brief__head p { margin: 2px 0 0; font-size: 12.5px; color: var(--br-muted); }
        .dc-text { min-height: 74px; font-size: 14px; }
        .dc-brief__foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
        .dc-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .dc-hint { font-size: 12px; color: var(--br-faint); }
        .dc-brief__btns { display: flex; gap: 8px; }
        .dc-brief__btns .br-btn--primary svg { flex-shrink: 0; }

        .dc-loading { display: grid; gap: 12px; margin-top: 22px; }
        .dc-skel { height: 76px; border-radius: 16px; background: linear-gradient(90deg, #eceef5 0%, #f6f6fb 50%, #eceef5 100%); background-size: 200% 100%; animation: dcSk 1s linear infinite; }
        @keyframes dcSk { from { background-position: 200% 0; } to { background-position: -200% 0; } }

        .dc-reshead { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 24px 0 12px; }
        .dc-reshead h2 { margin: 0; font-size: 16px; font-weight: 800; }
        .dc-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
        .dc-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; }
        .dc-ring { position: relative; width: 48px; height: 48px; flex-shrink: 0; display: grid; place-items: center; }
        .dc-ring svg { position: absolute; inset: 0; }
        .dc-ring b { position: relative; font-size: 14px; font-weight: 800; }
        .dc-row__body { flex: 1; min-width: 0; }
        .dc-row__name { margin: 0; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .dc-row__name a { font-size: 14.5px; font-weight: 800; }
        .dc-row__name a:hover { color: var(--br-primary); }
        .dc-row__name small { font-size: 12px; color: var(--br-muted); }
        .dc-row__why { margin: 5px 0 0; display: flex; flex-wrap: wrap; gap: 4px 14px; }
        .dc-row__why span { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--br-text); }
        .dc-row__why svg { color: var(--br-green); }
        .dc-row__end { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .dc-row__end strong { font-size: 14px; font-weight: 800; margin-right: 4px; }
        .dc-star { width: 32px; height: 32px; border-radius: 9px; border: 1px solid var(--br-border); background: #fff; display: grid; place-items: center; color: var(--br-faint); }
        .dc-star.is-on { background: var(--br-orange-bg); border-color: #ffd9a8; color: var(--br-orange); }
        .dc-star.is-on svg { fill: currentColor; }
        .dc-sl { min-width: 116px; }

        @media (max-width: 900px) {
          .dc-row { flex-wrap: wrap; }
          .dc-row__body { flex-basis: calc(100% - 130px); }
          .dc-row__end { width: 100%; padding-left: 62px; }
          .dc-row__end strong { margin-right: auto; }
        }
        @media (max-width: 640px) {
          .dc-brief { padding: 16px; }
          .dc-brief__btns { width: 100%; }
          .dc-brief__btns .br-btn { flex: 1; }
          .dc-row { padding: 14px; gap: 12px; }
          .dc-row .br-av { display: none; }
          .dc-row__body { flex-basis: calc(100% - 64px); }
          .dc-row__end { padding-left: 0; }
          .dc-reshead { flex-wrap: wrap; }
        }
      `}</style>
    </BrandShell>
  );
}
