"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandShell from "@/components/brands/BrandShell";
import ApprovalTabs from "@/components/brands/ApprovalTabs";
import { BrLoading, BrEmpty, BrError, useToast } from "@/components/brands/BrandStates";
import { useApprovals, approveCreator, approveMany, creatorHref, bWho, bShort, bDate } from "@/services/brand";
import { Check, Megaphone, ArrowUpDown, Sparkle, ChevronDown, MoreH } from "@/components/ui/Icons";

// purane brand portal mein fee nahi thi — sort applied date / followers / engagement se
const SORTS = ["Oldest first", "Most followers", "Best engagement"];
const FIRST = 6;

/**
 * /brands/approvals — campaigns mein aane wale creators ko approve / decline karo
 * (purana paintApprovals "to_approve" + wireActions data-bpxok + wireBulk). Decline → /brands/approvals/decline/[id] (wajah ke saath).
 */
export default function ApprovalsPage() {
  const router = useRouter();
  const a = useApprovals();
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(""); // participation id ya "bulk"
  const [sort, setSort] = useState(0);
  const [camp, setCamp] = useState(""); // campaign filter ("" = sab)
  const [showAll, setShowAll] = useState(false);
  const [toast, say] = useToast();

  const camps = [...new Map(a.toApprove.map((x) => [x.campaign_id, x.campaign])).entries()];
  let list = a.toApprove.filter((x) => !camp || x.campaign_id === camp);
  if (sort === 1) list = [...list].sort((p, q) => (Number(q.creator?.followers) || 0) - (Number(p.creator?.followers) || 0));
  if (sort === 2) list = [...list].sort((p, q) => (Number(q.creator?.engagement) || 0) - (Number(p.creator?.engagement) || 0));
  const shown = showAll ? list : list.slice(0, FIRST);

  const pending = list.map((x) => x.participation_id);
  const sel = selected.filter((id) => pending.includes(id));
  const allOn = pending.length > 0 && sel.length === pending.length;
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const campName = camp ? (camps.find(([id]) => id === camp) || [])[1] : camps.length === 1 ? camps[0][1] : "All campaigns";

  // ek creator approve (purana data-bpxok)
  const approveOne = async (x) => {
    setBusy(x.participation_id);
    const r = await approveCreator(x.participation_id);
    setBusy("");
    if (r.error) return say(r.error.message);
    say("✓ Creator approved — the Geek team takes it from here");
    setSelected((s) => s.filter((id) => id !== x.participation_id));
    a.reload();
  };
  // kai ek saath (purana wireBulk "c")
  const approveSel = async () => {
    if (!window.confirm(`Approve ${sel.length} creator${sel.length === 1 ? "" : "s"}? They move on to the next step.`)) return;
    setBusy("bulk");
    const r = await approveMany("c", sel);
    setBusy("");
    setSelected([]);
    say(`✓ ${r.ok} approved${r.bad.length ? ` · ${r.bad.length} couldn't be: ${r.bad[0]}` : ""}`);
    a.reload();
  };
  // decline wajah ke saath — pehla creator page par, baaki "more" mein (same wajah sab ko — app.js openReasonModal count)
  const declineSel = () => {
    const [first, ...more] = sel;
    router.push(`/brands/approvals/decline/${first}${more.length ? `?more=${more.join(",")}` : ""}`);
  };

  return (
    <BrandShell>
      <title>Approvals — Geek OS Brand</title>
      <ApprovalTabs />

      {a.loading ? (
        <BrLoading cards={3} />
      ) : a.error ? (
        <BrError error={a.error} onRetry={a.reload} />
      ) : !a.toApprove.length ? (
        <BrEmpty title="No creators waiting" text="When creators join your campaigns, they show up here for your OK. Nothing to approve right now." />
      ) : (
        <>
          {/* Selection bar */}
          <div className="br-card ap-bar">
            <div className="ap-bar__left">
              {a.can && (
                <button type="button" className={`ap-check ${sel.length ? "is-on" : ""}`} aria-label={allOn ? "Clear selection" : "Select all"} onClick={() => setSelected(allOn ? [] : pending)}>
                  {sel.length > 0 && <Check size={12} />}
                </button>
              )}
              <strong>{a.can ? `${sel.length} selected` : `${list.length} waiting`}</strong>
              {a.can && (
                <>
                  <span className="ap-bar__dot">·</span>
                  <button type="button" className="ap-bar__all" onClick={() => setSelected(pending)} disabled={!pending.length}>
                    Select all {pending.length}
                  </button>
                </>
              )}
            </div>
            <div className="ap-bar__right">
              <button
                type="button"
                className="ap-pill"
                disabled={camps.length < 2}
                onClick={() => {
                  // campaigns mein ghoomo: sab → pehla → doosra …
                  const ids = ["", ...camps.map(([id]) => id)];
                  setCamp(ids[(ids.indexOf(camp) + 1) % ids.length]);
                  setShowAll(false);
                }}
              >
                <Megaphone size={13} /> {campName}
              </button>
              <button type="button" className="ap-pill" onClick={() => setSort((sort + 1) % SORTS.length)}>
                <ArrowUpDown size={13} /> Sort: {SORTS[sort]}
              </button>
              {a.can && (
                <>
                  <button type="button" className="br-btn br-btn--ghost br-btn--sm" disabled={!sel.length || !!busy} onClick={declineSel}>
                    Decline {sel.length || ""}
                  </button>
                  <button type="button" className="br-btn br-btn--primary br-btn--sm" disabled={!sel.length || !!busy} onClick={approveSel}>
                    <Check size={13} /> {busy === "bulk" ? "Approving…" : `Approve ${sel.length || ""}`}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="ap-grid">
            {shown.map((x) => {
              const c = bWho(x.creator);
              const cr = x.creator || {};
              const on = selected.includes(x.participation_id);
              const href = creatorHref(x.participation_id);
              return (
                <article key={x.participation_id} className={`br-card ap-card ${on ? "is-sel" : ""}`}>
                  <div className="ap-card__top">
                    {a.can && (
                      <button type="button" className={`ap-check ${on ? "is-on" : ""}`} aria-label={`Select ${c.name}`} onClick={() => toggle(x.participation_id)}>
                        {on && <Check size={12} />}
                      </button>
                    )}
                    <span className="br-av br-av--lg ap-av" style={{ background: c.av }}>
                      {c.initials}
                      {c.pic && <img src={c.pic} alt="" referrerPolicy="no-referrer" onError={(e) => e.currentTarget.remove()} />}
                    </span>
                    <span className="ap-card__name">
                      <strong>{c.name}</strong>
                      <small>{[c.handle, c.city].filter(Boolean).join(" · ") || "Instagram creator"}</small>
                    </span>
                    <Link href={href} className="ap-more" aria-label={`More about ${c.name}`}>
                      <MoreH size={16} />
                    </Link>
                  </div>

                  <div className="ap-stats">
                    <span>
                      <strong>{c.followers}</strong>
                      <small>followers</small>
                    </span>
                    <span>
                      <strong>{cr.engagement != null ? `${cr.engagement}%` : "—"}</strong>
                      <small>engagement</small>
                    </span>
                    <span>
                      <strong>{bShort(cr.avg_reach)}</strong>
                      <small>avg reach</small>
                    </span>
                  </div>

                  {(cr.categories || []).length > 0 && (
                    <div className="ap-tags">
                      {cr.categories.slice(0, 4).map((t) => (
                        <span key={t} className="br-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="ap-why">
                    <p>
                      <Sparkle size={12} /> Wants to join
                    </p>
                    <span>
                      {x.campaign} · applied {bDate(x.applied_at, false)}
                    </span>
                  </div>

                  <div className="ap-fee">
                    <small>Campaign</small>
                    <strong>{x.campaign}</strong>
                  </div>

                  <div className="ap-actions">
                    {a.can ? (
                      <>
                        <Link href={`/brands/approvals/decline/${x.participation_id}`} className="br-btn br-btn--ghost br-btn--sm">
                          Decline
                        </Link>
                        <Link href={href} className="br-btn br-btn--soft br-btn--sm">
                          View profile
                        </Link>
                        <button type="button" className="br-btn br-btn--primary br-btn--sm ap-approve" disabled={!!busy} onClick={() => approveOne(x)}>
                          <Check size={13} /> {busy === x.participation_id ? "…" : "Approve"}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="ap-done ap-wait">Waiting for your team’s approver</span>
                        <Link href={href} className="br-btn br-btn--soft br-btn--sm ap-approve">
                          View profile
                        </Link>
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
        </>
      )}

      {toast}

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
              .ap-av { position: relative; overflow: hidden; }
        .ap-av img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
        .ap-wait { color: var(--br-muted); }
        .ap-pill:disabled { cursor: default; }
`}</style>
    </BrandShell>
  );
}
