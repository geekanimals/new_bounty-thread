"use client";

import { useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import DiscoveryTabs from "@/components/brands/DiscoveryTabs";
import { MATCHES, getCreator } from "@/components/brands/data";
import { Sparkle, Check, Star, Plus, ChevronDown, Refresh } from "@/components/ui/Icons";

const SAVED_REQUEST =
  "Wedding-guest makeup looks for women 25–34 in metros. 1 Reel + 2 Stories. Budget around ₹6L for 30 creators. Warm, natural style — no heavy filters.";

// Text se chhote tags nikaalna (dummy "AI" parsing)
const parseTags = (t) => {
  const s = t.toLowerCase();
  const tags = [];
  const age = t.match(/(\d{2})\s*[–-]\s*(\d{2})/);
  if (/women/.test(s)) tags.push(age ? `Women ${age[1]}–${age[2]}` : "Women");
  else if (/\bmen\b/.test(s)) tags.push(age ? `Men ${age[1]}–${age[2]}` : "Men");
  if (/metro/.test(s)) tags.push("Metros");
  else if (/tier\s*2/.test(s)) tags.push("Tier 2");
  const niche = ["makeup", "bridal", "skincare", "fashion", "grooming"].filter((n) => s.includes(n) || (n === "bridal" && s.includes("wedding")));
  if (niche.length) tags.push(niche.map((n) => n[0].toUpperCase() + n.slice(1)).join(" · "));
  const budget = t.match(/₹\s?(\d+(?:\.\d+)?)\s?L/i);
  const count = t.match(/(\d+)\s+creators/i);
  if (budget && count) tags.push(`~₹${Math.round((parseFloat(budget[1]) * 100) / parseInt(count[1], 10))}K / creator`);
  return tags;
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

/** /brands/discovery/campaign — campaign likho, Geek best-fit creators rank karta hai */
export default function DiscoveryForCampaign() {
  const [text, setText] = useState(SAVED_REQUEST);
  const [state, setState] = useState("done"); // idle | loading | done
  const [stars, setStars] = useState(["aisha-khan"]);
  const [short, setShort] = useState([]);
  const [shown, setShown] = useState(5);
  const tags = parseTags(text);

  const find = () => {
    if (!text.trim()) return;
    setState("loading");
    setShown(5);
    setTimeout(() => setState("done"), 900);
  };
  const toggle = (arr, id) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

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
            <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={() => setText(SAVED_REQUEST)}>
              Use a saved request
            </button>
            <button type="button" className="br-btn br-btn--primary br-btn--sm" onClick={find} disabled={!text.trim() || state === "loading"}>
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

      {state === "done" && (
        <>
          <div className="dc-reshead">
            <h2>38 strong matches</h2>
            <button
              type="button"
              className="br-btn br-btn--soft br-btn--sm"
              onClick={() => setShort(Array.from(new Set([...short, ...MATCHES.slice(0, 10).map((m) => m.id)])))}
            >
              {MATCHES.every((m) => short.includes(m.id)) ? "Top 10 shortlisted" : "Shortlist top 10"}
            </button>
          </div>

          <ul className="dc-list">
            {MATCHES.slice(0, shown).map((m) => {
              const c = getCreator(m.id);
              const sl = short.includes(m.id);
              const st = stars.includes(m.id);
              return (
                <li key={m.id} className="br-card dc-row">
                  <Ring score={m.score} />
                  <span className="br-av br-av--lg" style={{ background: c.av }}>
                    {c.initials}
                  </span>
                  <div className="dc-row__body">
                    <p className="dc-row__name">
                      <Link href={`/brands/creators/${c.id}`}>{c.name}</Link>
                      <small>
                        {c.handle} · {c.followers} · {c.city}
                      </small>
                    </p>
                    <p className="dc-row__why">
                      {m.reasons.map((r) => (
                        <span key={r}>
                          <Check size={12} /> {r}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className="dc-row__end">
                    <strong>{c.fee}</strong>
                    <button type="button" className={`dc-star ${st ? "is-on" : ""}`} aria-label="Save creator" onClick={() => setStars(toggle(stars, m.id))}>
                      <Star size={14} />
                    </button>
                    <button type="button" className={`br-btn br-btn--sm ${sl ? "br-btn--dark" : "br-btn--primary"} dc-sl`} onClick={() => setShort(toggle(short, m.id))}>
                      {sl ? <Check size={13} /> : <Plus size={13} />}
                      {sl ? "Shortlisted" : "Shortlist"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="br-more">
            {shown < MATCHES.length ? (
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

      <style>{`
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
