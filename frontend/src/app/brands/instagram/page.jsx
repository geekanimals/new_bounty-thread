"use client";

import { useEffect, useState } from "react";
import BrandShell, { ToneIcon } from "@/components/brands/BrandShell";
import { BrLoading, BrEmpty, BrError, useToast } from "@/components/brands/BrandStates";
import { useBrandInstagram, igRefresh, igConnect, bShort, bNum, bAgo, bInitials, bGrad } from "@/services/brand";
import { Refresh, Users, Clock, Check, Instagram } from "@/components/ui/Icons";

const RANGES = ["7", "28", "90"];

/**
 * /brands/instagram — brand ka apna Instagram business account (purana fbCard: brand_portal.facebook.pages[].instagram;
 * Refresh = brand-fb-login refresh). Range / growth / best time / best posts ka data purane app mein nahi tha → "Coming soon".
 */
export default function BrandInstagram() {
  const ig = useBrandInstagram();
  const [pick, setPick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const [toast, say] = useToast();
  useEffect(() => setNow(Date.now()), []);
  const acc = ig.accounts[pick] || ig.accounts[0];

  const refresh = async () => {
    setBusy(true);
    const r = await igRefresh();
    setBusy(false);
    say(r && r.error ? r.error.message : "Updated ✓");
  };
  const connect = async () => {
    const r = await igConnect();
    if (r && r.error) say(r.error.message);
  };

  const stats = acc
    ? [
        { label: "Followers", value: bShort(acc.followers), note: `@${acc.username}`, icon: "users", dark: true },
        { label: "Posts", value: bNum(acc.posts), note: "on the account", icon: "instagram" },
        { label: "Page reach", value: bShort(acc.page_reach_28d), note: `last 28 days · ${acc.page || "Facebook Page"}`, icon: "eye" },
        { label: "Page engagement", value: bShort(acc.page_engaged_28d), note: "last 28 days", icon: "heart" },
      ]
    : [];

  return (
    <BrandShell>
      <title>Instagram — Geek OS Brand</title>

      <p className="br-eyebrow">Social</p>
      <h1 className="br-h1">Instagram</h1>
      <p className="br-sub">Your own Instagram business account — how it grows while campaigns run.</p>

      {ig.loading ? (
        <BrLoading rows={4} />
      ) : ig.error ? (
        <BrError error={ig.error} />
      ) : !ig.linked ? (
        <BrEmpty title="Connect your Facebook business" text="Your Instagram business account comes through the Facebook Page it’s linked to. Connect Facebook to see it here.">
          {ig.can && (
            <button type="button" className="br-btn br-btn--primary br-btn--sm" onClick={connect}>
              Connect Facebook
            </button>
          )}
        </BrEmpty>
      ) : !acc ? (
        <BrEmpty title="No Instagram account found" text="None of your Facebook Pages has an Instagram business account linked. Link one in Instagram settings, then tap Refresh.">
          <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={refresh} disabled={busy}>
            {busy ? "Refreshing…" : "Refresh"}
          </button>
        </BrEmpty>
      ) : (
        <>
          {/* Account row */}
          <section className="br-card ig-acc">
            <span className="ig-acc__ring">
              <span style={{ background: acc.picture ? `center / cover no-repeat url("${acc.picture}")` : bGrad(acc.username) }}>{acc.picture ? "" : bInitials(acc.username).slice(0, 1)}</span>
            </span>
            <div className="ig-acc__txt">
              <strong>
                @{acc.username} <Check size={13} />
              </strong>
              <small>
                Business account · connected through Facebook · updated {bAgo(ig.refreshedAt, now)}
                {ig.accounts.length > 1 && (
                  <>
                    {" · "}
                    <select className="ig-pick" aria-label="Instagram account" value={pick} onChange={(e) => setPick(Number(e.target.value))}>
                      {ig.accounts.map((x, i) => (
                        <option key={x.username + i} value={i}>
                          @{x.username}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </small>
            </div>
            <div className="ig-acc__right">
              <div className="br-seg">
                {RANGES.map((r) => (
                  <button key={r} type="button" className={r === "28" ? "is-on" : ""} onClick={() => r !== "28" && say(`Coming soon — ${r}-day Instagram insights.`)}>
                    {r} days
                  </button>
                ))}
              </div>
              <button type="button" className="br-btn br-btn--ghost br-btn--sm ig-refresh" onClick={refresh} disabled={busy}>
                <span className={busy ? "ig-spin" : ""}>
                  <Refresh size={13} />
                </span>
                {busy ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </section>

          {/* Stats */}
          <div className="ig-stats">
            {stats.map((s, i) => (
              <div key={s.label} className={`br-stat ${s.dark ? "br-stat--dark" : ""}`}>
                <p className="br-stat__label">
                  <ToneIcon icon={s.icon} tone={s.dark ? "dark" : ["blue", "orange", "green"][i - 1]} size={30} />
                  {s.label}
                </p>
                <p className="br-stat__value">{s.value}</p>
                <p className="br-stat__note">{s.note}</p>
              </div>
            ))}
          </div>

          <div className="ig-grid">
            <section className="br-card ig-card">
              <div className="br-card__head">
                <div className="ig-titlerow">
                  <span className="ig-ic">
                    <Users size={16} />
                  </span>
                  <div>
                    <h2 className="br-card__title">Followers</h2>
                    <p className="br-card__sub">{bNum(acc.followers)} today</p>
                  </div>
                </div>
              </div>
              <p className="ig-none">Coming soon — daily follower growth. Today’s count updates every time you tap Refresh.</p>
            </section>

            <section className="br-card ig-card">
              <h2 className="br-card__title">Best time to post</h2>
              <p className="br-card__sub">When your followers are online</p>
              <p className="ig-none">
                <Clock size={14} /> Coming soon — needs Instagram audience insights.
              </p>
            </section>
          </div>

          <section className="br-card ig-card ig-posts">
            <div className="br-card__head">
              <div>
                <h2 className="br-card__title">Your best posts</h2>
                <p className="br-card__sub">From your Instagram</p>
              </div>
              <a href={`https://instagram.com/${acc.username}`} target="_blank" rel="noopener noreferrer" className="br-btn br-btn--ghost br-btn--sm">
                <Instagram size={13} /> Open Instagram
              </a>
            </div>
            <p className="ig-none">Coming soon — your top posts by reach, saves and shares.</p>
          </section>
        </>
      )}

      {toast}

      <style>{`
        .ig-acc { display: flex; align-items: center; gap: 14px; margin: 22px 0 16px; padding: 16px 18px; flex-wrap: wrap; }
        .ig-acc__ring { padding: 3px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #e8336d, #8b5cf6); flex-shrink: 0; }
        .ig-acc__ring span { width: 46px; height: 46px; border-radius: 50%; border: 2px solid #fff; display: grid; place-items: center; color: #fff; font-weight: 800; font-size: 16px; }
        .ig-acc__txt { flex: 1; min-width: 200px; }
        .ig-acc__txt strong { display: inline-flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 800; }
        .ig-acc__txt strong svg { color: var(--br-blue); }
        .ig-acc__txt small { display: block; font-size: 12.5px; color: var(--br-muted); }
        .ig-acc__right { display: flex; align-items: center; gap: 10px; }
        .ig-refresh { min-width: 110px; }
        .ig-refresh > span { display: inline-grid; }
        .ig-spin { animation: igSpin .8s linear infinite; }
        @keyframes igSpin { to { transform: rotate(360deg); } }

        .ig-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        .ig-grid { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr); gap: 18px; margin-top: 18px; }
        .ig-card { padding: 22px; }
        .ig-titlerow { display: flex; align-items: center; gap: 12px; }
        .ig-ic { width: 36px; height: 36px; border-radius: 10px; background: var(--br-lilac); color: var(--br-primary); display: grid; place-items: center; }
        .ig-chart { display: flex; align-items: flex-end; gap: 8px; height: 200px; padding-top: 10px; }
        .ig-chart span { flex: 1; min-width: 0; border-radius: 7px 7px 4px 4px; background: #eef0f5; transition: height .3s; }
        .ig-chart span.is-recent { background: #ffd2e0; }
        .ig-chart span.is-last { background: linear-gradient(180deg, #f59e0b, #e8336d); }

        .ig-heat { margin-top: 14px; display: grid; gap: 4px; }
        .ig-heat__row { display: grid; grid-template-columns: 34px repeat(8, minmax(0, 1fr)); gap: 4px; align-items: center; }
        .ig-heat__row i { height: 16px; border-radius: 4px; }
        .ig-heat__day { font-size: 11px; color: var(--br-muted); }
        .ig-heat__hours span:not(.ig-heat__day) { text-align: center; font-size: 10px; color: var(--br-faint); }
        .ig-best { display: flex; align-items: center; gap: 8px; margin: 14px 0 0; padding: 10px 12px; border-radius: 10px; background: var(--br-pink-bg); color: var(--br-pink); font-size: 13px; font-weight: 700; }

        .ig-posts { margin-top: 18px; }
        .ig-tiles { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; }
        .ig-tile strong { display: block; margin-top: 8px; font-size: 13px; font-weight: 700; }
        .ig-tile .br-thumb { aspect-ratio: 5 / 6; transition: transform .2s; }
        .ig-tile:hover .br-thumb { transform: translateY(-2px); }

        @media (max-width: 1200px) {
          .ig-tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 1100px) {
          .ig-grid { grid-template-columns: minmax(0, 1fr); }
          .ig-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .ig-acc { padding: 14px; }
          .ig-acc__right { width: 100%; }
          .ig-acc__right .br-seg { flex: 1; }
          .ig-acc__right .br-seg button { flex: 1; }
          .ig-stats { gap: 10px; }
          .ig-card { padding: 18px; }
          .ig-card .br-card__head { flex-wrap: wrap; }
          .ig-chart { height: 150px; gap: 4px; }
          .ig-tiles { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 4px; }
          .ig-tile { flex: 0 0 42%; scroll-snap-align: start; }
        }
              .ig-none { display: flex; align-items: center; gap: 7px; margin: 10px 0 0; font-size: 13px; line-height: 1.55; color: var(--br-muted); }
        .ig-pick { border: 0; background: transparent; font: inherit; color: var(--br-primary); font-weight: 700; }
`}</style>
    </BrandShell>
  );
}
