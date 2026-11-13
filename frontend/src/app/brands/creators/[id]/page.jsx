"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BrandShell from "@/components/brands/BrandShell";
import { BrLoading, BrError, BrAvatar } from "@/components/brands/BrandStates";
import { useBrand, canAct, reloadPortal, parseCreatorId, useCreatorCard, setFavorite, approveCreator, short as fmt, igUrl } from "@/services/brand";
import { ArrowLeft, Check, Bookmark, Instagram, Play, Eye, ShieldCheck } from "@/components/ui/Icons";

const POST_G = [
  "linear-gradient(160deg,#ff8fb1,#ffc8da)",
  "linear-gradient(160deg,#b84dff,#e8a5ff)",
  "linear-gradient(160deg,#ffb15c,#ffe0b3)",
  "linear-gradient(160deg,#5b8cff,#a9c1ff)",
  "linear-gradient(160deg,#21c38a,#9aedc9)",
  "linear-gradient(160deg,#e5484d,#ff9a9e)",
];
const GENDER = { f: "Women", female: "Women", m: "Men", male: "Men", u: "Others" };
const pct = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));

/**
 * /brands/creators/[id] — purana openCard (creator profile card):
 *  api.brand_creator_card { p_participation | p_invite } → creator, audience, recent posts, averages, past work with this brand.
 *  Save ⭐ → api.brand_favorite_set. Approve (sirf jab creator approval mein ho) → api.org_decide_applicant; Decline → /brands/approvals/decline/[id].
 */
export default function CreatorProfile() {
  const { id } = useParams();
  const { pid, inv } = parseCreatorId(id);
  const b = useBrand();
  const card = useCreatorCard(pid, inv);
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(false);
  const [toast, setToast] = useState("");

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };

  const d = card.data;
  if (card.loading && !d) {
    return (
      <BrandShell crumbs={[{ label: "Campaigns", href: "/brands/campaigns" }, { label: "Creator" }]}>
        <BrLoading rows={6} />
      </BrandShell>
    );
  }
  if (!d) {
    return (
      <BrandShell crumbs={[{ label: "Campaigns", href: "/brands/campaigns" }, { label: "Creator" }]}>
        <BrError error={card.error || "Creator not found."} onRetry={card.reload} />
      </BrandShell>
    );
  }

  const cr = d.creator || {};
  const name = cr.name || cr.username || "Creator";
  const saved = !!d.saved;
  const waiting = pid ? ((b.portal && b.portal.to_approve) || []).find((x) => x.participation_id === pid) : null;
  const camp = waiting ? waiting.campaign : ((d.for_brand || [])[0] || {}).campaign;
  const act = canAct(b);
  const stats = [
    { v: cr.followers != null ? fmt(cr.followers) : "—", l: "followers" },
    { v: cr.engagement != null ? `${Math.round(Number(cr.engagement) * 10) / 10}%` : "—", l: "engagement" },
    { v: d.avg_views != null ? fmt(d.avg_views) : cr.avg_reach != null ? fmt(cr.avg_reach) : "—", l: d.avg_views != null ? "avg reel views" : "avg reach" },
    { v: d.avg_likes != null ? fmt(d.avg_likes) : "—", l: "avg likes" },
    { v: d.campaigns_done != null ? String(d.campaigns_done) : d.avg_comments != null ? fmt(d.avg_comments) : "—", l: d.campaigns_done != null ? "Geek campaigns" : "avg comments" },
  ];
  const A = d.audience || {};
  const top = (k) => ((A[k] || [])[0] ? A[k][0] : null);
  const g = top("gender");
  const ag = top("age");
  const ct = top("city");
  const audience = [
    g && { l: GENDER[String(g.key).toLowerCase()] || g.key, v: pct(g.pct), c: "#e8336d" },
    ag && { l: `Age ${ag.key}`, v: pct(ag.pct), c: "#8b5cf6" },
    ct && { l: String(ct.key).split(",")[0], v: pct(ct.pct), c: "#16a34a" },
  ].filter(Boolean);

  // ⭐ Save / hatao (purana bpxCardStar → brand_favorite_set)
  const toggleSave = async () => {
    setBusy(true);
    const r = await setFavorite(pid, inv, !saved);
    setBusy(false);
    if (r.error) return flash(r.error.message);
    card.setSaved(!saved);
    flash(saved ? "Removed from Saved creators" : "Saved to your creators");
  };
  // Approve (purana data-bpxok → org_decide_applicant)
  const approve = async () => {
    setBusy(true);
    const r = await approveCreator(pid);
    setBusy(false);
    if (r.error) return flash(r.error.message);
    setApproved(true);
    flash("Creator approved — the Geek team takes it from here");
    reloadPortal();
  };

  return (
    <BrandShell crumbs={[{ label: waiting ? "Approvals" : "Campaigns", href: waiting ? "/brands/approvals" : "/brands/campaigns" }, ...(camp ? [{ label: camp }] : []), { label: name }]}>
      <title>{`${name} — Geek OS Brand`}</title>

      <Link href={waiting ? "/brands/approvals" : "/brands/campaigns"} className="br-back">
        <span>
          <ArrowLeft size={13} />
        </span>
        {waiting ? "Back to Approvals" : "Back to Campaigns"}
      </Link>

      <article className="br-card cp">
        <div className="cp-cover" style={{ background: `linear-gradient(110deg, #ff8fb1 0%, #c084fc 55%, #7c5cff 100%)` }} />
        <div className="cp-body">
          <div className="cp-top">
            <BrAvatar name={name} src={cr.profile_picture_url} cls="cp-av" />
            <div className="cp-name">
              <h1>
                {name}
                {d.campaigns_done > 0 && (
                  <span className="cp-tick" title="Has done Geek campaigns">
                    <Check size={11} />
                  </span>
                )}
              </h1>
              <p>{[cr.username ? `@${cr.username}` : "", cr.city, (cr.categories || []).join(", ")].filter(Boolean).join(" · ")}</p>
            </div>
            <button
              type="button"
              className={`br-btn br-btn--sm cp-save ${saved ? "is-on" : "br-btn--ghost"}`}
              aria-pressed={saved}
              onClick={toggleSave}
              disabled={busy}
            >
              <Bookmark size={13} /> {saved ? "Saved" : "Save"}
            </button>
          </div>

          <div className="cp-stats">
            {stats.map((s) => (
              <span key={s.l}>
                <strong>{s.v}</strong>
                <small>{s.l}</small>
              </span>
            ))}
          </div>

          <div className="cp-grid">
            <div>
              <p className="cp-label">Audience</p>
              {!audience.length && <p className="cp-none">Audience numbers show once Instagram shares them for this creator.</p>}
              <ul className="cp-aud">
                {audience.map((a) => (
                  <li key={a.l}>
                    <span className="cp-aud__row">
                      <span>{a.l}</span>
                      <strong>{a.v}%</strong>
                    </span>
                    <span className="cp-aud__bar">
                      <i style={{ width: `${a.v}%`, background: a.c }} />
                    </span>
                  </li>
                ))}
              </ul>
              {cr.bio && (
                <p className="cp-why">
                  <ShieldCheck size={14} /> {cr.bio}
                </p>
              )}
            </div>
            <div>
              <p className="cp-label">Recent posts</p>
              <div className="cp-posts">
                {(d.recent || []).slice(0, 6).map((p, i) => (
                  <a key={i} href={p.permalink || igUrl(cr.username)} target="_blank" rel="noreferrer" className="br-thumb" style={{ background: POST_G[i % POST_G.length] }}>
                    {p.img && <img src={p.img} alt="" loading="lazy" referrerPolicy="no-referrer" className="cp-post__img" onError={(e) => (e.currentTarget.style.display = "none")} />}
                    <span className="br-thumb__play">
                      <Play size={11} />
                    </span>
                    <span className="br-thumb__views">
                      <Eye size={11} /> {p.likes != null ? `${fmt(p.likes)} likes` : p.comments != null ? `${fmt(p.comments)} comments` : "Post"}
                    </span>
                  </a>
                ))}
                {!(d.recent || []).length && <p className="cp-none">No recent posts to show.</p>}
              </div>
            </div>
          </div>

          <p className="cp-label">Worked with</p>
          <div className="cp-worked">
            {(d.for_brand || []).length ? (
              d.for_brand.map((w, i) => (
                <span key={i} className="br-badge br-badge--green">
                  {w.campaign} · {w.status}
                  {(w.posts || []).length ? ` · ${w.posts.length} post${w.posts.length === 1 ? "" : "s"}` : ""}
                </span>
              ))
            ) : (
              <span className="cp-none">Not on your campaigns before</span>
            )}
          </div>

          <div className="cp-foot">
            <a href={igUrl(cr.username)} target="_blank" rel="noreferrer" className="br-btn br-btn--ghost">
              <Instagram size={15} /> Open Instagram
            </a>
            <div className="cp-foot__right">
              {approved ? (
                <span className="cp-approved">
                  <Check size={14} /> Approved for {camp}
                </span>
              ) : waiting && act ? (
                <>
                  <Link href={`/brands/approvals/decline/${pid}`} className="br-btn br-btn--ghost">
                    Decline
                  </Link>
                  <button type="button" className="br-btn br-btn--primary" onClick={approve} disabled={busy}>
                    <Check size={14} /> Approve for campaign
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </article>

      {toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .cp { overflow: hidden; border-radius: 20px; }
        .cp-cover { height: 110px; }
        .cp-body { padding: 0 24px 24px; }
        .cp-top { display: flex; align-items: flex-end; gap: 16px; margin-top: -36px; }
        .cp-av {
          width: 84px; height: 84px; flex-shrink: 0; border-radius: 50%; border: 4px solid #fff;
          display: grid; place-items: center; color: #fff; font-size: 26px; font-weight: 700;
          box-shadow: 0 8px 20px -10px rgba(18,16,42,.4);
        }
        .cp-name { flex: 1; min-width: 0; padding-bottom: 4px; }
        .cp-name h1 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
        .cp-tick { width: 18px; height: 18px; border-radius: 50%; background: var(--br-blue); color: #fff; display: grid; place-items: center; }
        .cp-name p { margin: 3px 0 0; font-size: 13px; color: var(--br-muted); }
        .cp-save { margin-bottom: 6px; }
        .cp-post__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .cp-save.is-on { background: var(--br-lilac); color: var(--br-primary); border-color: transparent; }

        .cp-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 20px 0 22px; padding: 14px 18px; border-radius: 14px; background: #f4f5fa; }
        .cp-stats span:last-child { text-align: right; }
        .cp-stats strong { display: block; font-size: 16px; font-weight: 800; }
        .cp-stats small { display: block; font-size: 11.5px; color: var(--br-muted); }

        .cp-grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 28px; }
        .cp-label { margin: 0 0 10px; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--br-faint); }
        .cp-aud { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; max-width: 520px; }
        .cp-aud__row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
        .cp-aud__row strong { font-weight: 800; }
        .cp-aud__bar { display: block; height: 7px; border-radius: 999px; background: #eceef5; overflow: hidden; }
        .cp-aud__bar i { display: block; height: 100%; border-radius: inherit; }
        .cp-why { display: flex; align-items: flex-start; gap: 8px; max-width: 520px; margin: 18px 0 0; padding: 12px 14px; border-radius: 12px; background: var(--br-lilac); color: var(--br-text); font-size: 12.5px; line-height: 1.5; }
        .cp-why svg { color: var(--br-primary); flex-shrink: 0; margin-top: 1px; }
        .cp-posts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .cp-posts .br-thumb { border-radius: 11px; }
        .cp-worked { display: flex; flex-wrap: wrap; gap: 8px; margin: -2px 0 0; }
        .cp-worked .br-badge { height: 24px; }
        .cp-none { font-size: 12.5px; color: var(--br-muted); }
        .cp-body > .cp-label { margin-top: 22px; }

        .cp-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--br-border); }
        .cp-foot__right { display: flex; gap: 10px; flex-wrap: wrap; }
        .cp-approved { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 14px; border-radius: 10px; background: var(--br-green-bg); color: var(--br-green); font-size: 13.5px; font-weight: 700; }

        @media (max-width: 1023px) { .cp-grid { grid-template-columns: 1fr; } .cp-posts { max-width: 420px; } }
        @media (max-width: 640px) {
          .cp-body { padding: 0 18px 20px; }
          .cp-top { flex-wrap: wrap; align-items: flex-start; }
          .cp-av { width: 72px; height: 72px; font-size: 22px; }
          .cp-name { flex-basis: 100%; }
          .cp-save { order: 1; margin: 0 0 4px auto; align-self: flex-end; }
          .cp-name { order: 2; }
          .cp-stats { grid-template-columns: repeat(2, 1fr); row-gap: 12px; }
          .cp-stats span:last-child { text-align: left; }
          .cp-foot, .cp-foot__right { flex-direction: column; align-items: stretch; }
          .cp-foot .br-btn { width: 100%; }
          .cp-approved { justify-content: center; }
        }
      `}</style>
    </BrandShell>
  );
}
