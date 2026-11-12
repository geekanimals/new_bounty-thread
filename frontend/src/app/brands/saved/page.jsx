"use client";

import { useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import { CREATORS, SAVED_LISTS } from "@/components/brands/data";
import { Compass, Plus, Search, Star, Check, ChevronDown, Close } from "@/components/ui/Icons";

/** /brands/saved — star kiye hue creators, lists mein */
export default function SavedCreators() {
  const [lists, setLists] = useState(SAVED_LISTS);
  const [active, setActive] = useState("all");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [q, setQ] = useState("");
  const [unsaved, setUnsaved] = useState([]);
  const [short, setShort] = useState([]);
  const [shown, setShown] = useState(8);
  const [toast, setToast] = useState("");

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2200);
  };

  const all = CREATORS.filter((c) => !unsaved.includes(c.id));
  const list = all
    .filter((c) => active === "all" || c.saved.includes(active))
    .filter((c) => {
      const s = q.trim().toLowerCase();
      return !s || c.name.toLowerCase().includes(s) || c.handle.includes(s) || c.city.toLowerCase().includes(s);
    });

  const addList = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (!lists.some((l) => l.key.toLowerCase() === name.toLowerCase())) setLists([...lists, { key: name, label: name, count: 0 }]);
    setActive(name);
    setNewName("");
    setAdding(false);
    flash(`List “${name}” created`);
  };

  return (
    <BrandShell>
      <title>Saved creators — Geek OS Brand</title>

      <div className="br-head">
        <div>
          <h1 className="br-h1">Saved creators</h1>
          <p className="br-sub">Creators you starred anywhere — keep them in lists and add them to your next campaign request.</p>
        </div>
        <Link href="/brands/discovery" className="br-btn br-btn--ghost">
          <Compass size={15} /> Find more creators
        </Link>
      </div>

      <div className="sv-bar">
        <div className="sv-lists" data-scroll>
          {lists.map((l) => (
            <button
              key={l.key}
              type="button"
              className={`sv-pill ${active === l.key ? "is-on" : ""}`}
              onClick={() => {
                setActive(l.key);
                setShown(8);
              }}
            >
              {l.label}
              <em>{l.key === "all" ? l.count - unsaved.length : l.count}</em>
            </button>
          ))}
          {adding ? (
            <form className="sv-new" onSubmit={addList}>
              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="List name" maxLength={24} />
              <button type="submit" aria-label="Create list">
                <Check size={13} />
              </button>
              <button type="button" aria-label="Cancel" onClick={() => setAdding(false)}>
                <Close size={12} />
              </button>
            </form>
          ) : (
            <button type="button" className="sv-pill" onClick={() => setAdding(true)}>
              <Plus size={13} /> New list
            </button>
          )}
        </div>
        <label className="sv-search">
          <Search size={14} />
          <input type="search" placeholder="Search saved" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      {list.length === 0 ? (
        <div className="br-card sv-empty">
          <p>{q ? `No saved creators match “${q}”.` : "No creators in this list yet — star creators in Discovery to add them."}</p>
          <Link href="/brands/discovery" className="br-btn br-btn--primary br-btn--sm">
            Open Discovery
          </Link>
        </div>
      ) : (
        <div className="sv-grid">
          {list.slice(0, shown).map((c) => {
            const on = short.includes(c.id);
            return (
              <article key={c.id} className="br-card sv-card">
                <div className="sv-card__top">
                  <span className="br-av br-av--lg" style={{ background: c.av }}>
                    {c.initials}
                  </span>
                  <button
                    type="button"
                    className="sv-star"
                    aria-label="Remove from saved"
                    title="Remove from saved"
                    onClick={() => {
                      setUnsaved([...unsaved, c.id]);
                      flash(`${c.name} removed from saved`);
                    }}
                  >
                    <Star size={14} />
                  </button>
                </div>
                <h2>{c.name}</h2>
                <p className="sv-handle">
                  {c.handle} · {c.city}
                </p>
                <div className="sv-nums">
                  <span>
                    <strong>{c.followers}</strong>
                    <small>followers</small>
                  </span>
                  <span>
                    <strong>{c.eng}</strong>
                    <small>eng.</small>
                  </span>
                  <span>
                    <strong>{c.fee}</strong>
                    <small>fee</small>
                  </span>
                </div>
                <div className="sv-tags">
                  {(c.saved.length ? c.saved : [c.niche[0]]).map((t) => (
                    <span key={t} className="br-badge br-badge--violet">
                      {t}
                    </span>
                  ))}
                  {c.workedWithYou && <span className="br-badge br-badge--green">Worked with you</span>}
                </div>
                <div className="sv-actions">
                  <Link href={`/brands/creators/${c.id}`} className="br-btn br-btn--ghost br-btn--sm">
                    Profile
                  </Link>
                  <button
                    type="button"
                    className={`br-btn br-btn--sm ${on ? "sv-shorted" : "br-btn--soft"}`}
                    onClick={() => {
                      setShort(on ? short.filter((x) => x !== c.id) : [...short, c.id]);
                      if (!on) flash(`${c.name} added to your shortlist`);
                    }}
                  >
                    {on ? <Check size={13} /> : <Plus size={13} />} {on ? "Shortlisted" : "Shortlist"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {list.length > shown && (
        <div className="br-more">
          <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 8)}>
            Load more <ChevronDown size={14} />
          </button>
        </div>
      )}

      {short.length > 0 && (
        <p className="sv-shortbar">
          {short.length} in your shortlist ·{" "}
          <Link href="/brands/discovery/shortlist" className="br-link">
            Open My shortlist
          </Link>
        </p>
      )}

      {toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .sv-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
        .sv-lists { display: flex; align-items: center; gap: 8px; min-width: 0; overflow-x: auto; scrollbar-width: none; padding: 2px; }
        .sv-lists::-webkit-scrollbar { display: none; }
        .sv-pill {
          flex-shrink: 0; display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 14px;
          border-radius: 999px; border: 1px solid var(--br-border-2); background: #fff;
          font-size: 13px; font-weight: 600; color: var(--br-ink); white-space: nowrap;
        }
        .sv-pill em { font-style: normal; font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 999px; background: #eceef5; color: var(--br-muted); }
        .sv-pill.is-on { background: var(--br-ink); border-color: var(--br-ink); color: #fff; }
        .sv-pill.is-on em { background: rgba(255,255,255,.18); color: #fff; }
        .sv-new { flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; height: 34px; padding: 0 4px 0 12px; border-radius: 999px; border: 1px solid var(--br-primary); background: #fff; }
        .sv-new input { width: 110px; border: 0; outline: none; font-size: 13px; background: none; }
        .sv-new button { width: 26px; height: 26px; border: 0; border-radius: 50%; background: var(--br-lilac); color: var(--br-primary); display: grid; place-items: center; }
        .sv-new button + button { background: #f1f2f7; color: var(--br-muted); }
        .sv-search {
          flex-shrink: 0; display: flex; align-items: center; gap: 8px; width: 220px; height: 38px; padding: 0 12px;
          border: 1px solid var(--br-border); border-radius: 10px; background: #fff; color: var(--br-faint);
        }
        .sv-search input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font-size: 13px; }

        .sv-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
        .sv-card { padding: 16px; display: flex; flex-direction: column; }
        .sv-card__top { display: flex; justify-content: space-between; align-items: flex-start; }
        .sv-star { width: 30px; height: 30px; border: 0; border-radius: 9px; background: var(--br-orange-bg); color: var(--br-orange); display: grid; place-items: center; }
        .sv-star svg { fill: currentColor; }
        .sv-star:hover { background: var(--br-red-bg); color: var(--br-red); }
        .sv-card h2 { margin: 12px 0 0; font-size: 15px; font-weight: 800; }
        .sv-handle { margin: 2px 0 12px; font-size: 12px; color: var(--br-muted); }
        .sv-nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 10px 12px; border-radius: 11px; background: #f4f5fa; }
        .sv-nums strong { display: block; font-size: 14.5px; font-weight: 800; }
        .sv-nums small { display: block; font-size: 10.5px; color: var(--br-faint); }
        .sv-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 14px; }
        .sv-actions { display: flex; justify-content: space-between; gap: 8px; margin-top: auto; }
        .sv-actions .br-btn { flex: 1; }
        .sv-shorted { background: var(--br-green-bg); color: var(--br-green); }
        .sv-empty { padding: 30px; text-align: center; }
        .sv-empty p { margin: 0 0 12px; color: var(--br-muted); font-size: 13.5px; }
        .sv-shortbar { margin: 18px 0 0; text-align: center; font-size: 13px; color: var(--br-muted); }

        @media (max-width: 1280px) { .sv-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 1023px) {
          .sv-bar { flex-direction: column; align-items: stretch; }
          .sv-search { width: 100%; }
          .sv-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 560px) { .sv-grid { grid-template-columns: 1fr; } }
      `}</style>
    </BrandShell>
  );
}
