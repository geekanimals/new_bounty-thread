"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creator/BountyShell";
import { RumiTip } from "@/components/creator/OnboardShell";
import { useSession, errText, useMyIg, fmtK, fmtNum, fmtDate, engagement, useMyProfile, syncIgMedia, getCampaignWork, saveKitProfile, editsOf } from "@/services/creator";
import { getSidekick } from "@/components/creator/data";
import { Share, Edit, Copy, WhatsApp, Download, Close, Check, Heart, Chat, Instagram, ArrowRight } from "@/components/ui/Icons";

const SHOW0 = { audience: true, portfolio: true, mentions: true, showcase: true };
const AGES = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

/* audience (gender_age / city) → Figma ki bars: Men, Women, top 2 ages, top city */
function audienceRows(aud) {
  aud = aud && typeof aud === "object" ? aud : {};
  const g = { F: 0, M: 0 };
  const ages = {};
  let total = 0;
  Object.entries(aud.gender_age || {}).forEach(([k, v]) => {
    v = Number(v) || 0;
    const m = /^\s*([A-Za-z])[^0-9]*(.*)$/.exec(String(k)) || [];
    const gg = String(m[1] || "").toUpperCase();
    if (g[gg] != null) g[gg] += v;
    const a = String(m[2] || "").trim();
    if (a) ages[a] = (ages[a] || 0) + v;
    total += v;
  });
  if (!total) return [];
  const pct = (v, t) => Math.round((100 * v) / (t || 1));
  const rows = [];
  if (g.M) rows.push({ label: "Men", value: pct(g.M, total) });
  if (g.F) rows.push({ label: "Women", value: pct(g.F, total) });
  Object.entries(ages)
    .sort((x, y) => y[1] - x[1] || AGES.indexOf(x[0]) - AGES.indexOf(y[0]))
    .slice(0, 2)
    .forEach(([a, v]) => rows.push({ label: `Age ${a.replace("-", "–")}`, value: pct(v, total) }));
  const cities = Object.entries(aud.city || {}).sort((x, y) => y[1] - x[1]);
  const ct = cities.reduce((x, [, v]) => x + (Number(v) || 0), 0);
  if (cities[0]) rows.push({ label: String(cities[0][0]).split(",")[0], value: pct(cities[0][1], ct) });
  return rows;
}
const imgOf = (m) => (m.media_type === "VIDEO" ? m.thumbnail_url || m.media_url : m.media_url);

/**
 * /creator/media-kit — Instagram se auto-bana media kit (share, edit)
 * Data: social_accounts (purane mkFetchAcct) · har 60 sec instagram-media-sync (purane jaisa) · get_my_campaigns (campaign work)
 * Save: social_accounts.edits (purane "Make it yours" jaisa)
 */
export default function MediaKit() {
  const [s] = useSession();
  const sk = getSidekick(s.sidekick);
  const ig = useMyIg();
  const a = ig.acct;
  const [popup, setPopup] = useState(null); // share | edit
  const [toast, setToast] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [draftShow, setDraftShow] = useState(SHOW0);
  const [saving, setSaving] = useState(false);
  const [syncedAt, setSyncedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [work, setWork] = useState([]);
  const [origin, setOrigin] = useState("");

  const prof = useMyProfile();
  // setup (categories wagera) abhi nahi kiya → "Continue setup" (purane bxMaybeOnboard jaisa)
  const setupDone = ((prof.data?.professional || {}).categories || []).length > 0;
  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };
  const E = editsOf(a);
  const name = E.display_name || a?.name || a?.username || "";
  const bio = E.bio || a?.biography || "";
  const show = { ...SHOW0, ...(E.show || {}) };
  const user = String(a?.username || "").replace(/^@/, "");
  const kitUrl = `${origin}/kit/${encodeURIComponent(user)}`;

  // Instagram se taaza posts — khulte hi + har 60 sec (server khud throttle karta hai), purane refreshMediaKit jaisa
  const { reload } = ig;
  useEffect(() => {
    setOrigin(window.location.origin);
    if (!a) return;
    let alive = true;
    const sync = async (force) => {
      const { data } = await syncIgMedia(force);
      if (!alive) return;
      if (data && data.ok && !data.cached) setSyncedAt(Date.now());
      else if (data && data.cached) setSyncedAt((t) => t || Date.now() - (60000 - (data.next_in_ms || 0)));
      reload();
    };
    sync(false);
    const t = setInterval(() => document.visibilityState === "visible" && sync(false), 60000);
    const c = setInterval(() => setNow(Date.now()), 5000);
    return () => {
      alive = false;
      clearInterval(t);
      clearInterval(c);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!a]);

  // Work portfolio: Geek OS par kiye campaign posts (purane mkCampaignWork jaisa — sirf isi account ke)
  useEffect(() => {
    if (!a) return;
    getCampaignWork(user).then(setWork);
  }, [a, user]);

  const openEdit = () => {
    setDraftName(name);
    setDraftBio(bio);
    setDraftShow(show);
    setPopup("edit");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(kitUrl);
    } catch {
      /* clipboard na mile to bhi chalega */
    }
    flash("Link copied");
  };

  const save = async (ev) => {
    ev.preventDefault();
    if (!a) return;
    setSaving(true);
    const { error } = await saveKitProfile(a, { name: draftName, bio: draftBio, show: draftShow });
    setSaving(false);
    if (error) return flash(errText(error) || "Couldn't save.");
    setPopup(null);
    flash("✓ Saved — this is what brands see now.");
    ig.reload();
  };

  if (ig.loading) {
    return (
      <BountyShell>
        <title>Media kit — Bounty</title>
        <h1 className="bx-title">My Media Kit</h1>
        <p className="bx-lede">Loading your media kit…</p>
      </BountyShell>
    );
  }

  /* ---------- Locked: Instagram connect nahi ---------- */
  if (!a) {
    return (
      <BountyShell>
        <title>Media kit — Bounty</title>
        <p className="bx-eyebrow mk-eye">Your creator portfolio</p>
        <h1 className="bx-title">My media kit</h1>
        <p className="bx-lede">Your story, your work, your impact.</p>
        <section className="bx-card mk-two">
          <strong>🔒 Two quick connections and you’re in</strong>
          <p>Campaigns open as soon as both are connected. Your creator profile is optional.</p>
          <div>
            <span className="mk-chip">○ Instagram (media kit)</span>
            <span className="mk-chip mk-chip--ok">✓ WhatsApp</span>
          </div>
        </section>
        <section className="bx-card mk-build">
          <span className="mk-build__ic">📸</span>
          <h2>Build your media kit in seconds</h2>
          <p>Connect your Instagram Business or Creator account and we’ll auto-generate a professional media kit — followers, engagement, top posts — and let you publish right from here.</p>
          <Link href="/creator/onboarding/meta" className="mk-connect">
            Connect Instagram
          </Link>
          <small>We never see your password. Disconnect anytime.</small>
        </section>
        <style>{`
          .mk-eye { text-align: center; }
          .mk-two { margin: 22px 0 14px; padding: 18px 18px 18px 18px; border-radius: 16px; }
          .mk-two strong { display: block; font-size: 16px; line-height: 21px; font-weight: 700; color: #14231a; }
          .mk-two p { margin: 0 0 13px; font-size: 13px; line-height: 17px; color: #7a6a4a; }
          .mk-two div { display: flex; gap: 8px; flex-wrap: wrap; }
          .mk-chip { display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 999px; background: #ece2cc; font-size: 12.5px; font-weight: 600; color: #14231a; }
          .mk-chip--ok { background: #dcefd8; color: #0e9f5e; }
          .mk-build { margin: 0; padding: 46px 24px 38px; border-radius: 16px; text-align: center; }
          .mk-build__ic { display: block; font-size: 44px; line-height: 44px; }
          .mk-build h2 { margin: 13px 0 4px; font-family: var(--bx-serif); font-size: 24px; line-height: 30px; font-weight: 600; color: #14231a; }
          .mk-build p { max-width: 440px; margin: 0 auto 20px; font-size: 13px; line-height: 17px; color: #7a6a4a; }
          .mk-connect { display: inline-flex; align-items: center; height: 42px; padding: 0 22px; border-radius: 14px; background: #123524; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: #fbf3e2; }
          .mk-build small { display: block; margin-top: 18px; font-size: 12px; color: #7a6a4a; }
        `}</style>
      </BountyShell>
    );
  }

  const media = Array.isArray(a.recent_media) ? a.recent_media : [];
  const n = media.length;
  const avgLikes = n ? Math.round(media.reduce((x, m) => x + (Number(m.like_count) || 0), 0) / n) : 0;
  const eng = engagement(a);
  const stats = [
    { v: fmtK(a.followers_count || 0), l: "Followers" },
    { v: eng != null ? eng.toFixed(2) + "%" : "—", l: "Avg. engagement" },
    { v: a.avg_reach ? fmtK(a.avg_reach) : "—", l: "Avg. reach / post" },
    { v: fmtK(avgLikes), l: "Avg. likes" },
    { v: fmtNum(a.media_count || 0), l: "Total posts" },
  ];
  const audience = audienceRows(a.audience);
  const pins = (Array.isArray(E.pinned) ? E.pinned.map(String) : []).filter((id) => media.some((m) => String(m.id) === id));
  const top = [...media].sort((x, y) => (Number(y.like_count) || 0) + (Number(y.comments_count) || 0) - ((Number(x.like_count) || 0) + (Number(x.comments_count) || 0))).slice(0, 3);
  const showcase = [...pins.map((id) => media.find((m) => String(m.id) === id)), ...media.filter((m) => !pins.includes(String(m.id)))].slice(0, 9);
  const portfolio = [
    ...work.map((p) => ({ brand: p.brand || "Brand", note: `${p.campaign || "Campaign"} · ${p.media_type === "story" ? "Story" : "Reel"}${p.posted_at ? " · " + fmtDate(p.posted_at) : ""}`, url: p.permalink })),
    ...(Array.isArray(E.portfolio) ? E.portfolio : []).filter((p) => p && p.brand),
  ];
  const mentions = Array.isArray(a.mentions) ? a.mentions.slice(0, 6) : [];
  const syncTxt = syncedAt && now ? `Synced with Instagram ${Math.max(0, Math.round((now - syncedAt) / 1000))}s ago · auto-refreshes every 60s` : syncedAt ? "Synced with Instagram just now · auto-refreshes every 60s" : "Syncing with Instagram…";
  const avatar = a.profile_picture_url || sk.img;

  return (
    <BountyShell>
      <title>Media kit — Bounty</title>

      {prof.data && !setupDone && (
        <section className="mk-ready">
          <span>
            <strong>Your media kit is ready 🎉</strong>
            <small>Next: 2 quick steps so brands know what you create.</small>
          </span>
          <Link href="/creator/onboarding/content" className="bx-btn bx-btn--cream mk-ready__next">
            Next <ArrowRight size={14} />
          </Link>
        </section>
      )}

      <h1 className="bx-title">My Media Kit</h1>
      <p className="bx-lede">Your reach, audience and best work — auto-built from Instagram and shareable with brands.</p>

      <div className="mk-bar">
        <div className="bx-card mk-of">
          <img src={avatar} alt="" referrerPolicy="no-referrer" />
          <span>
            <small>Media kit of</small>
            <strong>@{user}</strong>
          </span>
          <Link href="/creator/profile/instagram" className="mk-add">
            + Add account
          </Link>
        </div>
        <p className="mk-sync">{syncTxt}</p>
      </div>

      <section className="bx-card mk-hero">
        <div className="mk-cover" />
        <div className="mk-id">
          <img src={avatar} alt="" className="mk-av" referrerPolicy="no-referrer" />
          <div className="mk-id__txt">
            <h2>
              {name} <span className="mk-acct">Creator Account</span>
            </h2>
            <p className="mk-handle">@{user}</p>
            <p className="mk-bio">{bio}</p>
          </div>
          <div className="mk-id__btns">
            <button type="button" className="mk-sharebtn" onClick={() => setPopup("share")}>
              Share kit
            </button>
            <button
              type="button"
              className="mk-editbtn"
              onClick={openEdit}
            >
              ✎ Edit
            </button>
          </div>
        </div>
      </section>

      <div className="mk-stats">
        {stats.map((x, i) => (
          <div key={x.l} className={`bx-card ${i === 0 ? "mk-stat--dark" : ""}`}>
            <strong>{x.v}</strong>
            <small>{x.l}</small>
          </div>
        ))}
      </div>

      {show.audience && (
        <section className="bx-card mk-sec">
          <h3>Audience</h3>
          {!audience.length && (
            <p className="mk-empty">Audience details (city, age, gender) appear once Instagram shares them — usually after you cross 100 followers.</p>
          )}
          <div className="mk-aud">
            {audience.map((a) => (
              <div key={a.label}>
                <span>
                  {a.label} <b>{a.value}%</b>
                </span>
                <div className="bx-bar">
                  <i style={{ width: `${a.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bx-card mk-sec">
        <h3>
          Top performing posts <small>best of {n} posts · likes + comments</small>
        </h3>
        <div className="mk-posts" data-scroll>
          {top.map((p, i) => (
            <a key={p.id || i} href={p.permalink || "#"} target="_blank" rel="noopener noreferrer">
              <figure>
                <img src={imgOf(p)} alt="" referrerPolicy="no-referrer" loading="lazy" />
                <figcaption>
                  #{i + 1} · <Heart size={11} /> {fmtNum(p.like_count || 0)} · <Chat size={11} /> {fmtNum(p.comments_count || 0)}
                </figcaption>
              </figure>
            </a>
          ))}
          {!top.length && <p className="mk-none">Your posts show up here once Instagram has synced.</p>}
        </div>
      </section>

      {show.portfolio && (
        <section className="bx-card mk-sec">
          <h3>
            Work portfolio
            <button type="button" className="mk-edit" onClick={openEdit}>
              ✎ Edit
            </button>
          </h3>
          {portfolio.length ? (
            <ul className="mk-port">
              {portfolio.map((p, i) => (
                <li key={i}>
                  <strong>{p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{p.brand}</a> : p.brand}</strong>
                  <small>{p.note || "Brand collaboration"}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mk-none">Campaigns you finish on Geek show up here automatically.</p>
          )}
        </section>
      )}

      {show.mentions && (
        <section className="bx-card mk-sec">
          <h3>Mentions</h3>
          {mentions.length ? (
            <ul className="mk-ment">
              {mentions.map((m, i) => (
                <li key={m.id || i}>
                  <b>@{m.username || "tagged"}</b>{" "}
                  <a href={m.permalink || "#"} target="_blank" rel="noopener noreferrer">
                    tagged you{m.timestamp ? ` · ${fmtDate(m.timestamp)}` : ""}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mk-none">No mentions yet — when accounts tag you, they show up here.</p>
          )}
        </section>
      )}

      {show.showcase && (
        <section className="bx-card mk-sec">
          <h3>
            Content showcase <small className="mk-right">{fmtNum(a.media_count || n)} posts</small>
          </h3>
          <div className="mk-show" data-scroll>
            {showcase.map((p, i) => (
              <a key={p.id || i} href={p.permalink || "#"} target="_blank" rel="noopener noreferrer">
                <figure>
                  <img src={imgOf(p)} alt="" referrerPolicy="no-referrer" loading="lazy" />
                  <figcaption>
                    <Heart size={11} /> {fmtNum(p.like_count || 0)} <Chat size={11} /> {fmtNum(p.comments_count || 0)}
                  </figcaption>
                </figure>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="bx-card mk-work">
        <span>
          <strong>Work with {name}</strong>
          <small>Barters, paid campaigns &amp; brand collaborations — managed end-to-end in Geek Influencer OS.</small>
        </span>
        <button type="button" className="bx-btn bx-btn--dark" onClick={() => flash("Publishing from here is coming soon")}>
          Publish to Instagram →
        </button>
      </section>

      <RumiTip className="mk-rumi" name={sk.name} img={sk.img} text="Brands open kits with a clear bio and 3+ showcase posts twice as often." />

      {/* ---------- Share popup ---------- */}
      {popup === "share" && (
        <div className="bx-overlay" onClick={() => setPopup(null)}>
          <div className="bx-modal" onClick={(ev) => ev.stopPropagation()} role="dialog" aria-label="Share your media kit">
            <div className="bx-modal__head">
              <h2>Share your media kit</h2>
              <button type="button" className="bx-modal__x" onClick={() => setPopup(null)} aria-label="Close">
                <Close size={14} />
              </button>
            </div>
            <div className="bx-modal__body">
              <label className="bx-label">Your kit link</label>
              <div className="mk-link">
                <input className="bx-input" value={kitUrl} readOnly onFocus={(ev) => ev.target.select()} />
                <button type="button" className="bx-btn bx-btn--dark" onClick={copy}>
                  <Copy size={13} /> Copy
                </button>
              </div>
              <div className="mk-share">
                <a className="bx-btn bx-btn--ghost" href={`https://wa.me/?text=${encodeURIComponent("My media kit: " + kitUrl)}`} target="_blank" rel="noreferrer">
                  <WhatsApp size={15} /> WhatsApp
                </a>
                <button type="button" className="bx-btn bx-btn--ghost" onClick={() => flash("PDF download is coming soon — share the link for now")}>
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Edit popup ---------- */}
      {popup === "edit" && (
        <div className="bx-overlay" onClick={() => setPopup(null)}>
          <form
            className="bx-modal"
            onClick={(ev) => ev.stopPropagation()}
            role="dialog"
            aria-label="Edit media kit"
            onSubmit={save}
          >
            <div className="bx-modal__head">
              <h2>Edit</h2>
              <button type="button" className="bx-modal__x" onClick={() => setPopup(null)} aria-label="Close">
                <Close size={14} />
              </button>
            </div>
            <div className="bx-modal__body">
              <label className="bx-label" htmlFor="mk-n">
                Display name
              </label>
              <input id="mk-n" className="bx-input" value={draftName} onChange={(ev) => setDraftName(ev.target.value)} />
              <label className="bx-label mk-gap" htmlFor="mk-b">
                Bio
              </label>
              <textarea id="mk-b" className="bx-input" maxLength={150} value={draftBio} onChange={(ev) => setDraftBio(ev.target.value)} />
              <p className="bx-hint">{draftBio.length}/150</p>
              <p className="bx-label mk-gap">Show on my kit</p>
              {[
                ["audience", "Audience"],
                ["portfolio", "Work portfolio"],
                ["mentions", "Mentions"],
                ["showcase", "Content showcase"],
              ].map(([k, l]) => (
                <div key={k} className="mk-tog">
                  <span>{l}</span>
                  <button type="button" className={`bx-toggle ${draftShow[k] ? "is-on" : ""}`} onClick={() => setDraftShow({ ...draftShow, [k]: !draftShow[k] })} aria-pressed={draftShow[k]} aria-label={l} />
                </div>
              ))}
              <button type="submit" className="bx-btn bx-btn--dark bx-btn--block mk-gap" disabled={saving}>
                <Check size={14} /> {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className="bx-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .mk-ready { position: sticky; top: 10px; z-index: 30; box-shadow: 0 10px 30px rgba(18,53,36,.25); display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; padding: 14px 18px; border-radius: 16px; background: linear-gradient(120deg, #123524, #1d4a35); color: var(--bx-cream); border: 1px solid rgba(232,176,74,.6); }
        .mk-ready span { flex: 1; min-width: 200px; }
        .mk-ready strong { display: block; font-family: var(--bx-serif); font-size: 17px; font-weight: 600; }
        .mk-ready small { font-size: 12.5px; color: #d9cdb2; }
        .mk-ready__next { padding: 12px 22px; font-size: 15px; font-weight: 600; }
        @media (max-width: 560px) { .mk-ready__next { width: 100%; justify-content: center; } }
        .mk-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 18px 0 14px; }
        .mk-of { display: flex; align-items: center; gap: 10px; height: 54px; padding: 0 6px 0 7px; border-radius: 999px; }
        .mk-of img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; }
        .mk-of small { display: block; font-size: 11px; line-height: 12.7px; letter-spacing: .4px; text-transform: uppercase; color: #6b5a3a; }
        .mk-of strong { display: block; font-size: 14px; line-height: 16.1px; font-weight: 700; color: #14231a; }
        .mk-add { display: inline-flex; align-items: center; height: 40px; padding: 0 18px; margin-left: 6px; border-radius: 999px; border: 1px solid #c9b38a; background: #fffaef; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: #14231a; }
        .mk-none { margin: 0; font-size: 13px; color: #7a6a4a; }
        .mk-posts a, .mk-show a { display: contents; color: inherit; }
        .mk-port a, .mk-ment a { color: inherit; }
        .mk-sync { margin: 0; font-size: 12px; color: #7a6a4a; }
        .mk-hero { overflow: hidden; border-radius: 16px; }
        .mk-cover { height: 120px; background: linear-gradient(170deg, #0f3a28 0%, #1d5a3e 38%, #8d8a46 66%, #d9a94a 100%); }
        .mk-id { display: flex; align-items: flex-start; gap: 17px; padding: 0 24px 22px 24px; flex-wrap: wrap; }
        .mk-av { margin-top: -56px; width: 112px; height: 112px; border-radius: 50%; border: 4px solid #fbf1dc; object-fit: cover; box-shadow: 0 10px 20px -10px rgba(0,0,0,.5); }
        .mk-id__txt { flex: 1; min-width: 220px; padding-top: 14px; }
        .mk-id__txt h2 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 24px; line-height: 31px; font-weight: 800; letter-spacing: -0.2px; color: #14231a; }
        .mk-acct { display: inline-flex; align-items: center; height: 20px; padding: 0 9px; border-radius: 999px; background: #e6e2c8; font-size: 11px; font-weight: 600; letter-spacing: 0; color: #103b2a; }
        .mk-handle { margin: 1px 0 0; font-size: 16px; line-height: 21px; font-weight: 500; color: #6b5a3a; }
        .mk-bio { margin: 8px 0 0; font-size: 14px; line-height: 21px; color: #14231a; }
        .mk-id__btns { display: flex; flex-direction: column; gap: 10px; padding-top: 14px; }
        .mk-sharebtn, .mk-editbtn { display: inline-flex; align-items: center; justify-content: center; min-width: 88px; border: 0; border-radius: 8px; }
        .mk-sharebtn { height: 32px; padding: 0 14px; background: #1b2a20; font-size: 13px; font-weight: 600; color: #fbf1dc; }
        .mk-editbtn { height: 26px; padding: 0 12px; background: #eee2c6; font-size: 12px; font-weight: 600; color: #3d4a3a; }
        .mk-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 13px; margin: 16px 0 16px; }
        .mk-stats .bx-card { padding: 18px 16px 15px; border-radius: 14px; }
        .mk-stats strong { display: block; font-size: 24px; line-height: 31px; font-weight: 800; letter-spacing: -0.5px; color: #14231a; }
        .mk-stats small { display: block; margin-top: 2px; font-size: 12px; line-height: 16px; color: #6b5a3a; }
        .mk-stats .mk-stat--dark { background: linear-gradient(135deg, #1a4a33, #123524); border-color: #123524; }
        .mk-stats .mk-stat--dark strong { color: #fff; }
        .mk-stats .mk-stat--dark small { color: rgba(255,255,255,.95); }
        .mk-sec { margin-bottom: 14px; padding: 18px 16px 20px 18px; border-radius: 16px; }
        .mk-sec h3 { display: flex; align-items: baseline; gap: 9px; margin-bottom: 14px; font-family: var(--bx-serif); font-size: 15px; line-height: 18px; font-weight: 600; color: #14231a; }
        .mk-sec h3 small { font-family: var(--bx-sans); font-size: 12px; font-weight: 400; color: #7a6a4a; }
        .mk-right { margin-left: auto; }
        .mk-edit { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 10px; border: 0; border-radius: 8px; background: #eee2c6; font-family: var(--bx-sans); font-size: 12px; font-weight: 600; color: #3d4a3a; }
        .mk-empty { margin: 0; font-size: 13px; color: var(--bx-muted); }
        .mk-aud { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px 22px; }
        .mk-aud span { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12.5px; }
        .mk-posts, .mk-show { display: flex; gap: 12px; overflow-x: auto; scrollbar-width: none; }
        .mk-posts::-webkit-scrollbar, .mk-show::-webkit-scrollbar { display: none; }
        .mk-posts figure, .mk-show figure { position: relative; flex: 0 0 170px; margin: 0; border-radius: 12px; overflow: hidden; }
        .mk-posts img, .mk-show img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; }
        .mk-posts figcaption, .mk-show figcaption { position: absolute; left: 8px; bottom: 8px; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px; background: rgba(0,0,0,.45); color: #fff; font-size: 11px; font-weight: 600; }
        .mk-port { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .mk-port li { padding: 10px 12px; border-radius: 12px; background: #fffaf0; border: 1px solid var(--bx-line); }
        .mk-port strong { display: block; font-size: 14px; }
        .mk-port small { font-size: 12px; color: var(--bx-text); }
        .mk-ment { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.7; }
        .mk-work { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 16px 18px; }
        .mk-work span { flex: 1; min-width: 220px; }
        .mk-work strong { display: block; font-family: var(--bx-serif); font-size: 15px; line-height: 18px; font-weight: 600; color: #14231a; }
        .mk-work small { display: block; margin-top: 2px; font-size: 13px; color: #7a6a4a; }
        .mk-rumi { justify-content: center; margin-top: 20px; }
        .mk-link { display: flex; gap: 8px; }
        .mk-link .bx-btn { height: 44px; }
        .mk-share { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
        .mk-share .bx-btn { color: var(--bx-ink); }
        .mk-gap { margin-top: 14px; }
        .mk-tog { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--bx-line); font-size: 13.5px; }

        @media (max-width: 1100px) { .mk-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 767px) {
          .mk-bar { display: block; margin: 20px 0 14px; }
          .mk-of { flex-wrap: wrap; height: auto; padding: 8px 10px 10px 8px; border-radius: 16px; }
          .mk-of > span { flex: 1; }
          .mk-add { margin-left: auto; height: 38px; }
          .mk-sync { margin-top: 4px; font-size: 12px; }
          .mk-id { flex-direction: column; align-items: center; gap: 12px; padding: 0 16px 20px; text-align: center; }
          .mk-av { width: 86px; height: 86px; margin-top: -46px; border-width: 3px; }
          .mk-id__txt { padding-top: 0; min-width: 0; }
          .mk-id__txt h2 { justify-content: center; gap: 8px; font-size: 20px; line-height: 26px; }
          .mk-handle { margin-top: 2px; }
          .mk-bio { margin-top: 8px; }
          .mk-id__btns { flex-direction: row; padding-top: 2px; }
          .mk-editbtn { height: 32px; }
          .mk-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .mk-posts figure, .mk-show figure { flex-basis: 140px; }
          .mk-work .bx-btn { width: 100%; }
          .mk-share { grid-template-columns: 1fr; }
        }
      `}</style>
    </BountyShell>
  );
}
