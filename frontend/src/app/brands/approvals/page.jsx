"use client";

import { useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import ApprovalTabs from "@/components/brands/ApprovalTabs";
import { APPROVAL_CREATORS, getCreator } from "@/components/brands/data";
import { Check, Megaphone, ArrowUpDown, Sparkle, ChevronDown, MoreH, Close } from "@/components/ui/Icons";

const SORTS = ["Best match", "Lowest fee", "Most followers"];
const FIRST = 6;
const toNum = (s) => {
  const n = parseFloat(String(s).replace(/[^\d.]/g, "")) || 0;
  return /K/i.test(s) ? n * 1000 : /M/i.test(s) ? n * 1e6 : n;
};

/** /brands/approvals — Geek ke chune creators ko approve / decline karo */
export default function ApprovalsPage() {
  const [selected, setSelected] = useState(APPROVAL_CREATORS.slice(0, 3));
  const [status, setStatus] = useState({}); // id -> "approved" | "declined"
  const [sort, setSort] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [toast, setToast] = useState("");

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };

  let list = APPROVAL_CREATORS.map(getCreator);
  if (sort === 1) list = [...list].sort((a, b) => toNum(a.fee) - toNum(b.fee));
  if (sort === 2) list = [...list].sort((a, b) => toNum(b.followers) - toNum(a.followers));
  const shown = showAll ? list : list.slice(0, FIRST);

  const pending = APPROVAL_CREATORS.filter((id) => !status[id]);
  const sel = selected.filter((id) => !status[id]);
  const allOn = pending.length > 0 && sel.length === pending.length;

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const setMany = (ids, val) => {
    setStatus((s) => {
      const n = { ...s };
      ids.forEach((id) => (n[id] = val));
      return n;
    });
    setSelected([]);
  };

  return (
    <BrandShell>
      <title>Approvals — Geek OS Brand</title>
      <ApprovalTabs />

      {/* Selection bar */}
      <div className="br-card ap-bar">
        <div className="ap-bar__left">
          <button
            type="button"
            className={`ap-check ${sel.length ? "is-on" : ""}`}
            aria-label={allOn ? "Clear selection" : "Select all"}
            onClick={() => setSelected(allOn ? [] : pending)}
          >
            {sel.length > 0 && <Check size={12} />}
          </button>
          <strong>{sel.length} selected</strong>
          <span className="ap-bar__dot">·</span>
          <button type="button" className="ap-bar__all" onClick={() => setSelected(pending)} disabled={!pending.length}>
            Select all {pending.length}
          </button>
        </div>
        <div className="ap-bar__right">
          <span className="ap-pill">
            <Megaphone size={13} /> Festive Glow Edit
          </span>
          <button type="button" className="ap-pill" onClick={() => setSort((sort + 1) % SORTS.length)}>
            <ArrowUpDown size={13} /> Sort: {SORTS[sort]}
          </button>
          <button
            type="button"
            className="br-btn br-btn--ghost br-btn--sm"
            disabled={!sel.length}
            onClick={() => {
              setMany(sel, "declined");
              flash(`${sel.length} declined — Geek will suggest better matches in 24h`);
            }}
          >
            Decline {sel.length || ""}
          </button>
          <button
            type="button"
            className="br-btn br-btn--primary br-btn--sm"
            disabled={!sel.length}
            onClick={() => {
              setMany(sel, "approved");
              flash(`${sel.length} creator${sel.length > 1 ? "s" : ""} approved for Festive Glow Edit`);
            }}
          >
            <Check size={13} /> Approve {sel.length || ""}
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="ap-grid">
        {shown.map((c) => {
          const st = status[c.id];
          const on = selected.includes(c.id) && !st;
          return (
            <article key={c.id} className={`br-card ap-card ${on ? "is-sel" : ""} ${st ? `is-${st}` : ""}`}>
              <div className="ap-card__top">
                <button type="button" className={`ap-check ${on ? "is-on" : ""}`} aria-label={`Select ${c.name}`} disabled={!!st} onClick={() => toggle(c.id)}>
                  {on && <Check size={12} />}
                </button>
                <span className="br-av br-av--lg" style={{ background: c.av }}>
                  {c.initials}
                </span>
                <span className="ap-card__name">
                  <strong>
                    {c.name}
                    <span className="ap-verified">
                      <Check size={9} />
                    </span>
                  </strong>
                  <small>
                    {c.handle} · {c.city}
                  </small>
                </span>
                {st ? (
                  <span className={`br-badge br-badge--${st === "approved" ? "green" : "grey"}`}>{st === "approved" ? "Approved" : "Declined"}</span>
                ) : (
                  <Link href={`/brands/creators/${c.id}`} className="ap-more" aria-label={`More about ${c.name}`}>
                    <MoreH size={16} />
                  </Link>
                )}
              </div>

              <div className="ap-stats">
                <span>
                  <strong>{c.followers}</strong>
                  <small>followers</small>
                </span>
                <span>
                  <strong>{c.eng}</strong>
                  <small>engagement</small>
                </span>
                <span>
                  <strong>{c.avgViews}</strong>
                  <small>avg views</small>
                </span>
              </div>

              <div className="ap-tags">
                {c.niche.map((t) => (
                  <span key={t} className="br-tag">
                    {t}
                  </span>
                ))}
              </div>

              <div className="ap-why">
                <p>
                  <Sparkle size={12} /> Why Geek picked them
                </p>
                <span>{c.why}</span>
              </div>

              <div className="ap-fee">
                <small>Their fee</small>
                <strong>{c.feeFull} · 1 Reel + 2 Stories</strong>
              </div>

              <div className="ap-actions">
                {st ? (
                  <>
                    <span className="ap-done">
                      {st === "approved" ? <Check size={13} /> : <Close size={13} />}
                      {st === "approved" ? "Geek will brief them today" : "Geek will suggest a replacement"}
                    </span>
                    <button type="button" className="ap-undo" onClick={() => setStatus((s) => ({ ...s, [c.id]: undefined }))}>
                      Undo
                    </button>
                  </>
                ) : (
                  <>
                    <Link href={`/brands/approvals/decline/${c.id}`} className="br-btn br-btn--ghost br-btn--sm">
                      Decline
                    </Link>
                    <Link href={`/brands/creators/${c.id}`} className="br-btn br-btn--soft br-btn--sm">
                      View profile
                    </Link>
                    <button
                      type="button"
                      className="br-btn br-btn--primary br-btn--sm ap-approve"
                      onClick={() => {
                        setMany([c.id], "approved");
                        setSelected((s) => s.filter((x) => x !== c.id));
                        flash(`${c.name} approved for Festive Glow Edit`);
                      }}
                    >
                      <Check size={13} /> Approve
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!showAll && list.length > FIRST && (
        <div className="br-more">
          <button type="button" className="br-btn br-btn--ghost" onClick={() => setShowAll(true)}>
            Load more <ChevronDown size={13} />
          </button>
        </div>
      )}

      {toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .ap-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 12px 14px; margin-bottom: 16px; }
        .ap-bar__left { display: flex; align-items: center; gap: 10px; font-size: 13.5px; }
        .ap-bar__dot { color: var(--br-faint); }
        .ap-bar__all { border: 0; background: none; padding: 0; color: var(--br-primary); font-size: 13px; font-weight: 600; }
        .ap-bar__all:disabled { color: var(--br-faint); }
        .ap-bar__right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .ap-pill {
          display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px;
          border: 1px solid var(--br-border-2); border-radius: 9px; background: #fff;
          font-size: 12.5px; font-weight: 600; color: var(--br-ink); white-space: nowrap;
        }
        .ap-check {
          width: 20px; height: 20px; flex-shrink: 0; padding: 0;
          border: 1.5px solid var(--br-border-2); border-radius: 6px; background: #fff; color: #fff;
          display: grid; place-items: center;
        }
        .ap-check.is-on { background: var(--br-primary); border-color: var(--br-primary); }
        .ap-check:disabled { opacity: .4; cursor: default; }

        .ap-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .ap-card { display: flex; flex-direction: column; padding: 18px; transition: border-color .2s, box-shadow .2s; }
        .ap-card.is-sel { border-color: var(--br-primary); box-shadow: 0 0 0 1px var(--br-primary); }
        .ap-card.is-approved { border-color: #bfe9cf; }
        .ap-card.is-declined { opacity: .7; }
        .ap-card__top { display: flex; align-items: center; gap: 10px; }
        .ap-card__name { flex: 1; min-width: 0; }
        .ap-card__name strong { display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 800; }
        .ap-card__name small { display: block; font-size: 12px; color: var(--br-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ap-verified { width: 15px; height: 15px; border-radius: 50%; background: var(--br-blue); color: #fff; display: grid; place-items: center; }
        .ap-more { color: var(--br-faint); padding: 4px; }
        .ap-more:hover { color: var(--br-ink); }
        .ap-stats { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 14px; padding: 12px 14px; border-radius: 12px; background: #f6f6fa; }
        .ap-stats span:nth-child(2) { text-align: center; }
        .ap-stats span:nth-child(3) { text-align: right; }
        .ap-stats strong { display: block; font-size: 15px; font-weight: 800; }
        .ap-stats small { display: block; font-size: 11px; color: var(--br-muted); }
        .ap-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
        .ap-why { margin: 12px 0 0; padding: 12px 14px; border-radius: 12px; background: var(--br-lilac); }
        .ap-why p { display: flex; align-items: center; gap: 6px; margin: 0 0 4px; font-size: 12px; font-weight: 700; color: var(--br-primary); }
        .ap-why span { font-size: 12.5px; line-height: 1.5; color: var(--br-text); }
        .ap-fee { margin-top: auto; padding-top: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--br-border); }
        .ap-fee small { display: block; font-size: 11px; color: var(--br-muted); }
        .ap-fee strong { font-size: 13.5px; font-weight: 800; }
        .ap-actions { display: flex; align-items: center; gap: 8px; padding-top: 14px; }
        .ap-approve { margin-left: auto; }
        .ap-done { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--br-green); }
        .ap-card.is-declined .ap-done { color: var(--br-muted); }
        .ap-undo { margin-left: auto; border: 0; background: none; color: var(--br-primary); font-size: 12.5px; font-weight: 700; }

        @media (max-width: 1180px) { .ap-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .ap-grid { grid-template-columns: 1fr; }
          .ap-bar__right { width: 100%; }
          .ap-bar__right .br-btn { flex: 1; }
          .ap-pill { flex: 1; justify-content: center; }
          .ap-card { padding: 16px; }
        }
      `}</style>
    </BrandShell>
  );
}
