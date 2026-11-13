"use client";

import { useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import { BrLoading, BrError, BrAvatar } from "@/components/brands/BrandStates";
import { useBrand, canAct, useFavorites, setFavorite, pickCreator, creatorHref, short as fmt, fdate } from "@/services/brand";
import { Compass, Plus, Search, Star, Check, ChevronDown, Close } from "@/components/ui/Icons";

/**
 * /brands/saved — purana paintSaved: api.brand_favorites (⭐ saved creators), "Remove ⭐" → api.brand_favorite_set p_on:false.
 * Lists = jin campaigns mein creator tha (backend mein custom lists nahi — "New list" coming soon).
 * Shortlist → Discovery wala api.brand_discover_pick (Geek team ko jaata hai).
 */
export default function SavedCreators() {
  const b = useBrand();
  const act = canAct(b);
  const fav = useFavorites();
  const [active, setActive] = useState("all");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [q, setQ] = useState("");
  const [short, setShort] = useState([]);
  const [busy, setBusy] = useState("");
  const [shown, setShown] = useState(8);
  const [toast, setToast] = useState("");

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };

  const all = fav.list.map((f) => {
    const c = f.creator || {};
    return { ...f, c, key: f.favorite_id || f.participation_id || f.invite_id || c.username, name: c.name || c.username || "Creator", camps: String(f.campaigns || "").split(", ").filter(Boolean) };
  });
  const lists = [{ key: "all", label: "All saved", count: all.length }];
  all.forEach((f) =>
    f.camps.forEach((k) => {
      const l = lists.find((x) => x.key === k);
      if (l) l.count++;
      else lists.push({ key: k, label: k, count: 1 });
    })
  );
  const list = all
    .filter((f) => active === "all" || f.camps.includes(active))
    .filter((f) => {
      const s = q.trim().toLowerCase();
      return !s || f.name.toLowerCase().includes(s) || String(f.c.username || "").toLowerCase().includes(s) || String(f.c.city || "").toLowerCase().includes(s);
    });

  const addList = (e) => {
    e.preventDefault();
    setNewName("");
    setAdding(false);
    flash("Your own lists — coming soon. Saved creators are grouped by campaign for now.");
  };
  // ⭐ hatao (purana data-bpxunstar)
  const unsave = async (f) => {
    setBusy(f.key);
    const r = await setFavorite(f.participation_id, f.invite_id, false);
    setBusy("");
    if (r.error) return flash(r.error.message);
    flash(`${f.name} removed from saved`);
    fav.reload();
  };
  // Shortlist (purana brandPick → brand_discover_pick)
  const shortlist = async (f) => {
    if (!act) return flash("View-only login — ask your team's admin to shortlist creators.");
    if (short.includes(f.key)) return;
    setBusy(f.key);
    const r = await pickCreator({ handle: f.c.username, name: f.c.name, followers: f.c.followers, engagement: f.c.engagement, city: f.c.city, profile_picture_url: f.c.profile_picture_url });
    setBusy("");
    if (r.error) return flash(r.error.message);
    setShort([...short, f.key]);
    flash(`@${f.c.username} shortlisted — the Geek team will take it from here`);
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
              <em>{l.count}</em>
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

      {fav.loading && !fav.list.length ? (
        <BrLoading cards={4} />
      ) : fav.error && !fav.list.length ? (
        <BrError error={fav.error} onRetry={fav.reload} />
      ) : list.length === 0 ? (
        <div className="br-card sv-empty">
          <p>
            {q
              ? `No saved creators match “${q}”.`
              : "No saved creators yet. Open any creator in a campaign and tap Save — they show up here so you can ask for them again."}
          </p>
          <Link href="/brands/discovery" className="br-btn br-btn--primary br-btn--sm">
            Open Discovery
          </Link>
        </div>
      ) : (
        <div className="sv-grid">
          {list.slice(0, shown).map((f) => {
            const c = f.c;
            const on = short.includes(f.key);
            const href = creatorHref(f.participation_id, f.invite_id);
            return (
              <article key={f.key} className="br-card sv-card">
                <div className="sv-card__top">
                  <BrAvatar name={f.name} src={c.profile_picture_url} cls="br-av--lg" />
                  <button type="button" className="sv-star" aria-label="Remove from saved" title="Remove from saved" onClick={() => unsave(f)} disabled={busy === f.key}>
                    <Star size={14} />
                  </button>
                </div>
                <h2>{f.name}</h2>
                <p className="sv-handle">
                  {c.username ? `@${c.username}` : ""}
                  {c.city ? ` · ${c.city}` : ""}
                </p>
                <div className="sv-nums">
                  <span>
                    <strong>{c.followers != null ? fmt(c.followers) : "—"}</strong>
                    <small>followers</small>
                  </span>
                  <span>
                    <strong>{c.engagement != null ? `${Math.round(Number(c.engagement) * 10) / 10}%` : "—"}</strong>
                    <small>eng.</small>
                  </span>
                  <span>
                    <strong>{c.avg_reach != null ? fmt(c.avg_reach) : "—"}</strong>
                    <small>reach</small>
                  </span>
                </div>
                <div className="sv-tags">
                  {(c.categories || []).slice(0, 2).map((t) => (
                    <span key={t} className="br-badge br-badge--violet">
                      {t}
                    </span>
                  ))}
                  {f.camps.length > 0 && <span className="br-badge br-badge--green">Worked with you</span>}
                  <span className="br-badge br-badge--plain">Saved {fdate(f.added_at)}</span>
                </div>
                <div className="sv-actions">
                  {href ? (
                    <Link href={href} className="br-btn br-btn--ghost br-btn--sm">
                      Profile
                    </Link>
                  ) : (
                    <a href={`https://instagram.com/${c.username || ""}`} target="_blank" rel="noreferrer" className="br-btn br-btn--ghost br-btn--sm">
                      Profile
                    </a>
                  )}
                  {act && (
                    <button type="button" className={`br-btn br-btn--sm ${on ? "sv-shorted" : "br-btn--soft"}`} onClick={() => shortlist(f)} disabled={busy === f.key}>
                      {on ? <Check size={13} /> : <Plus size={13} />} {on ? "Shortlisted" : "Shortlist"}
                    </button>
                  )}
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
