"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import BrandShell from "@/components/brands/BrandShell";
import { getCreator } from "@/components/brands/data";
import { ArrowLeft, Check, Bookmark, Instagram, Play, Eye, ShieldCheck } from "@/components/ui/Icons";

const POST_G = [
  "linear-gradient(160deg,#ff8fb1,#ffc8da)",
  "linear-gradient(160deg,#b84dff,#e8a5ff)",
  "linear-gradient(160deg,#ffb15c,#ffe0b3)",
  "linear-gradient(160deg,#5b8cff,#a9c1ff)",
  "linear-gradient(160deg,#21c38a,#9aedc9)",
  "linear-gradient(160deg,#e5484d,#ff9a9e)",
];

/** /brands/creators/[id] — creator ka profile (campaign ke andar se khulta hai) */
export default function CreatorProfile() {
  const { id } = useParams();
  const cr = getCreator(id);
  const [saved, setSaved] = useState(Boolean(cr?.starred));
  const [approved, setApproved] = useState(false);
  const [toast, setToast] = useState("");
  if (!cr) notFound();

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };
  const stats = [
    { v: cr.followers, l: "followers" },
    { v: cr.eng, l: "engagement" },
    { v: cr.avgViews, l: "avg reel views" },
    { v: cr.saves, l: "avg saves" },
    { v: cr.fee, l: "fee per reel" },
  ];
  const audience = [
    { l: "Women", v: cr.womenNum, c: "#e8336d" },
    { l: "Age 18–30", v: cr.age, c: "#8b5cf6" },
    { l: "Metro cities", v: cr.metro, c: "#16a34a" },
  ];

  return (
    <BrandShell crumbs={[{ label: "Campaigns", href: "/brands/campaigns" }, { label: "Festive Glow Edit", href: "/brands/campaigns/festive-glow-edit" }, { label: cr.name }]}>
      <title>{`${cr.name} — Geek OS Brand`}</title>

      <Link href="/brands/campaigns/festive-glow-edit" className="br-back">
        <span>
          <ArrowLeft size={13} />
        </span>
        Back to Campaign · Creators
      </Link>

      <article className="br-card cp">
        <div className="cp-cover" style={{ background: `linear-gradient(110deg, #ff8fb1 0%, #c084fc 55%, #7c5cff 100%)` }} />
        <div className="cp-body">
          <div className="cp-top">
            <span className="cp-av" style={{ background: cr.av }}>
              {cr.initials}
            </span>
            <div className="cp-name">
              <h1>
                {cr.name}
                <span className="cp-tick" title="Verified by Geek">
                  <Check size={11} />
                </span>
              </h1>
              <p>
                {cr.handle} · {cr.city} · {cr.category}
              </p>
            </div>
            <button
              type="button"
              className={`br-btn br-btn--sm cp-save ${saved ? "is-on" : "br-btn--ghost"}`}
              aria-pressed={saved}
              onClick={() => {
                setSaved(!saved);
                flash(saved ? "Removed from Saved creators" : "Saved to your creators");
              }}
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
              <p className="cp-why">
                <ShieldCheck size={14} /> {cr.why}
              </p>
            </div>
            <div>
              <p className="cp-label">Recent posts</p>
              <div className="cp-posts">
                {cr.posts.map((v, i) => (
                  <a key={i} href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="br-thumb" style={{ background: POST_G[i] }}>
                    <span className="br-thumb__play">
                      <Play size={11} />
                    </span>
                    <span className="br-thumb__views">
                      <Eye size={11} /> {v}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <p className="cp-label">Worked with</p>
          <div className="cp-worked">
            {cr.worked.length ? (
              cr.worked.map((w) => (
                <span key={w} className={w.startsWith("Nykaa") ? "br-badge br-badge--green" : "br-tag"}>
                  {w}
                </span>
              ))
            ) : (
              <span className="cp-none">No brand collabs yet</span>
            )}
          </div>

          <div className="cp-foot">
            <a href={`https://www.instagram.com/${cr.handle.replace("@", "")}`} target="_blank" rel="noreferrer" className="br-btn br-btn--ghost">
              <Instagram size={15} /> Open Instagram
            </a>
            <div className="cp-foot__right">
              {approved ? (
                <span className="cp-approved">
                  <Check size={14} /> Approved for Festive Glow Edit
                </span>
              ) : (
                <>
                  <Link href={`/brands/approvals/decline/${cr.id}`} className="br-btn br-btn--ghost">
                    Decline
                  </Link>
                  <button
                    type="button"
                    className="br-btn br-btn--primary"
                    onClick={() => {
                      setApproved(true);
                      flash(`${cr.name} approved — Geek will send the brief`);
                    }}
                  >
                    <Check size={14} /> Approve for campaign
                  </button>
                </>
              )}
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
