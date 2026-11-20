"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { rpc, safeUrl, fmtNum } from "@/lib/supabasePublic";
import Logo from "@/components/creator/Logo";
import MoreGrid from "@/components/creator/MoreGrid";
import Link from "next/link";

/* Bio + captions se account ki category (live app ke p.html wala hi logic) */
const IG_CAT_WORDS = {
  Food: ["food", "foodie", "recipe", "recipes", "chef", "cook", "cooking", "baking", "restaurant", "cafe", "eats", "dessert", "biryani", "momos", "streetfood", "foodblogger", "homecook"],
  Travel: ["travel", "traveller", "traveler", "wanderlust", "trip", "explore", "backpack", "mountains", "beach", "roadtrip", "travelblogger", "trek", "hiking"],
  Fashion: ["fashion", "style", "outfit", "ootd", "streetwear", "stylist", "wardrobe", "designer", "lookbook"],
  Beauty: ["beauty", "makeup", "skincare", "mua", "cosmetic", "hair", "nails", "glow", "skin"],
  Fitness: ["fitness", "gym", "workout", "yoga", "athlete", "bodybuilding", "trainer", "running", "fit", "calisthenics"],
  Health: ["health", "wellness", "nutrition", "diet", "doctor", "mentalhealth", "ayurveda"],
  Tech: ["tech", "gadget", "gadgets", "smartphone", "coding", "developer", "unboxing", "review", "ai", "laptop"],
  Comedy: ["comedy", "comedian", "funny", "memes", "meme", "standup", "skits", "humour", "humor"],
  Entertainment: ["actor", "actress", "entertainment", "film", "movies", "bollywood", "reels", "creator", "influencer"],
  Parenting: ["mom", "mommy", "mother", "dad", "parenting", "baby", "kids", "momblogger", "parent"],
  Gaming: ["gaming", "gamer", "esports", "bgmi", "pubg", "valorant", "stream", "twitch", "playstation"],
  Finance: ["finance", "investing", "stocks", "money", "trading", "crypto", "personalfinance", "ca"],
  Business: ["business", "entrepreneur", "startup", "founder", "marketing", "brand", "ceo"],
  Education: ["education", "teacher", "learn", "study", "tutor", "exam", "upsc", "career"],
  Music: ["music", "singer", "musician", "rapper", "guitar", "producer", "dj", "song"],
  Dance: ["dance", "dancer", "choreographer", "kathak", "bharatanatyam", "hiphop"],
  Art: ["art", "artist", "illustrator", "painting", "sketch", "drawing", "digitalart", "craft", "diy"],
  Photography: ["photography", "photographer", "photo", "camera", "shotby", "portrait", "canon", "nikon"],
  Sports: ["sports", "cricket", "football", "athlete", "badminton", "tennis", "cyclist", "marathon"],
  Pets: ["pet", "pets", "dog", "dogs", "cat", "cats", "puppy", "petlover", "doglover"],
  "Home decor": ["decor", "homedecor", "interior", "interiors", "home", "plants", "furniture"],
  Auto: ["car", "cars", "bike", "bikes", "auto", "automobile", "rider", "motorcycle", "supercar"],
  Lifestyle: ["lifestyle", "life", "vlog", "vlogger", "daily", "blogger", "everyday"],
};
function igCategories(a) {
  const text = (String(a?.biography || "") + " " + (Array.isArray(a?.recent_media) ? a.recent_media.slice(0, 12).map((m) => m?.caption || "").join(" ") : "")).toLowerCase();
  const words = new Set(text.replace(/[#@]/g, " ").split(/[^a-z0-9]+/).filter(Boolean));
  const score = Object.entries(IG_CAT_WORDS)
    .map(([cat, ws]) => [cat, ws.reduce((n, w) => n + (words.has(w) ? 1 : 0), 0)])
    .filter((x) => x[1] > 0)
    .sort((x, y) => y[1] - x[1]);
  const out = score.filter((x) => x[0] !== "Lifestyle" && x[0] !== "Entertainment").slice(0, 3).map((x) => x[0]);
  if (!out.length && score.length) out.push(score[0][0]);
  return out;
}
const typeLabel = (t) => {
  t = String(t || "").toUpperCase();
  return t === "MEDIA_CREATOR" || t === "CREATOR" ? "Creator account" : t === "BUSINESS" ? "Business account" : t ? t.replace(/_/g, " ").toLowerCase() : "";
};
function editsOf(a) {
  const E = a?.edits && typeof a.edits === "object" && !Array.isArray(a.edits) ? { ...a.edits } : {};
  if (E.bio && String(E.for_user || "") !== String(a.username || "").toLowerCase()) delete E.bio;
  return E;
}

/* Audience: gender_age { "F · 18-24": n }, country { "IN": n }, city { "Mumbai, Maharashtra": n } */
const AGES = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const pct = (v, t) => (t ? Math.round((1000 * v) / t) / 10 : 0);
const fmtPct = (p) => (p >= 10 || p === 0 ? Math.round(p) : p.toFixed(1)) + "%";
const regionName = (c) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(String(c).toUpperCase()) || c;
  } catch {
    return c;
  }
};
function audienceOf(aud) {
  aud = aud && typeof aud === "object" ? aud : {};
  const cells = {};
  const byG = { F: 0, M: 0, U: 0 };
  Object.entries(aud.gender_age || {}).forEach(([k, v]) => {
    v = Number(v) || 0;
    if (!v) return;
    const m = /^\s*([A-Za-z])[^0-9]*(.*)$/.exec(String(k)) || [];
    let g = String(m[1] || "").toUpperCase();
    const a = String(m[2] || "").trim() || "?";
    if (!byG.hasOwnProperty(g)) g = "U";
    cells[a] = cells[a] || { F: 0, M: 0, U: 0 };
    cells[a][g] += v;
    byG[g] += v;
  });
  const ages = AGES.filter((a) => cells[a]).concat(Object.keys(cells).filter((a) => !AGES.includes(a)));
  const total = byG.F + byG.M + byG.U;
  const top = (o, k) => {
    const t = Object.values(o || {}).reduce((s, v) => s + (Number(v) || 0), 0);
    return Object.entries(o || {})
      .sort((x, y) => y[1] - x[1])
      .slice(0, k)
      .map(([n, v]) => ({ n, p: pct(Number(v), t) }));
  };
  return { cells, byG, ages, total, countries: top(aud.country, 5), cities: top(aud.city, 5) };
}

/**
 * /kit/<username> — creator ka public media kit (brands ko share hota hai). Live app ka p.html.
 * Data: public_profile RPC (bina login).
 */
export default function PublicKit() {
  const { username = "" } = useParams();
  const [st, setSt] = useState({ phase: "load" });
  const [work, setWork] = useState([]);
  const u = decodeURIComponent(username).replace(/^@/, "").trim();

  useEffect(() => {
    if (!u) return setSt({ phase: "fail", msg: "This media kit link is incomplete." });
    rpc("public_campaign_work", { p_username: u }).then((w) => setWork(Array.isArray(w) ? w : [])).catch(() => {});
    rpc("public_profile", { p_username: u })
      .then((rows) => {
        const a = Array.isArray(rows) ? rows[0] : null;
        if (!a) return setSt({ phase: "fail", msg: `Media kit not found for “${u}”.` });
        document.title = `${a.name || a.username} — Media Kit`;
        setSt({ phase: "ok", a });
      })
      .catch(() => setSt({ phase: "fail", msg: "Couldn’t load this media kit." }));
  }, [u]);

  // ?embed=1 — app ke andar frame mein (bina header/footer). Render ke baad padhte hain (hydration safe).
  const [embed, setEmbed] = useState(false);
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setEmbed(q.get("embed") === "1");
    setPrinting(q.get("print") === "1");
  }, []);

  // ?print=1 → poora kit rangeen PDF ki tarah (browser ka "Save as PDF") — creator app ka "Download PDF" yahi kholta hai
  useEffect(() => {
    if (st.phase !== "ok") return;
    if (new URLSearchParams(window.location.search).get("print") !== "1") return;
    const imgs = [...document.querySelectorAll(".pk img")];
    const ready = Promise.all(imgs.map((im) => (im.complete ? 1 : new Promise((ok) => ((im.onload = ok), (im.onerror = ok), setTimeout(ok, 4000))))));
    let done = false;
    ready.then(() => {
      if (!done) setTimeout(() => window.print(), 300);
    });
    return () => {
      done = true;
    };
  }, [st.phase]);
  const [copied, setCopied] = useState(false);
  const shareKit = async () => {
    const url = window.location.origin + window.location.pathname;
    try {
      if (navigator.share) return await navigator.share({ title: document.title, url });
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  let body = null;
  if (st.phase === "ok") {
    const a = st.a;
    const E = editsOf(a);
    const media = Array.isArray(a.recent_media) ? a.recent_media : [];
    const n = media.length;
    const sum = (k) => media.reduce((s, m) => s + (Number(m[k]) || 0), 0);
    const avgLikes = n ? Math.round(sum("like_count") / n) : 0;
    const avgComments = n ? Math.round(sum("comments_count") / n) : 0;
    const eng = a.followers_count && n ? (((avgLikes + avgComments) / a.followers_count) * 100).toFixed(2) + "%" : "—";
    const cats = igCategories(a);
    const bio = E.bio || a.biography || "";
    const tops = [...media].sort((x, y) => (Number(y.like_count) || 0) + (Number(y.comments_count) || 0) - ((Number(x.like_count) || 0) + (Number(x.comments_count) || 0)));
    const mentions = Array.isArray(a.mentions) ? a.mentions : [];
    // PDF mein pehle jaisa: top 3, baaki 9/12 — screen par ek line + Load more
    const cut = (l, k) => (printing ? l.slice(0, k) : l);
    const portfolio = Array.isArray(E.portfolio) ? E.portfolio : [];
    const aud = audienceOf(a.audience);
    const maxCell = Math.max(0, ...aud.ages.flatMap((x) => [aud.cells[x].F, aud.cells[x].M, aud.cells[x].U]));

    const Post = ({ m, by }) => {
      const img = m.media_type === "VIDEO" ? m.thumbnail_url || m.media_url : m.media_url;
      const badge = m.media_type === "VIDEO" ? "▶" : m.media_type === "CAROUSEL_ALBUM" ? "❏" : "";
      return (
        <a href={safeUrl(m.permalink)} target="_blank" rel="noopener noreferrer" className="pk-post">
          {img ? <img src={safeUrl(img)} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.display = "none")} /> : null}
          <span className="pk-noimg">View on Instagram</span>
          {badge && <span className="pk-badge">{badge}</span>}
          {by && m.username && <span className="pk-by">@{m.username}</span>}
          {(m.like_count != null || m.comments_count != null) && (
            <span className="pk-meta">
              ♥ {fmtNum(m.like_count)} · 💬 {fmtNum(m.comments_count)}
            </span>
          )}
        </a>
      );
    };

    body = (
      <>
        <section className="pk-hero">
          <div className="pk-cover" aria-hidden="true" />
          {a.profile_picture_url ? (
            <img className="pk-av" src={safeUrl(a.profile_picture_url)} alt="" referrerPolicy="no-referrer" />
          ) : (
            <div className="pk-av pk-av--ph">{(a.name || a.username || "?").slice(0, 2).toUpperCase()}</div>
          )}
          <div className="pk-id">
            <h1>
              {a.name || a.username} {a.account_type && <span className="pk-type">{typeLabel(a.account_type)}</span>}
            </h1>
            <a className="pk-handle" href={`https://instagram.com/${a.username}`} target="_blank" rel="noopener noreferrer">
              @{a.username}
            </a>
            {cats.length > 0 && (
              <div className="pk-cats">
                {cats.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            )}
            {E.headline && <p className="pk-headline">{E.headline}</p>}
            {bio && <p className="pk-bio">{bio}</p>}
            {a.website && (
              <a className="pk-web" href={safeUrl(a.website)} target="_blank" rel="noopener noreferrer">
                🔗 {a.website}
              </a>
            )}
          </div>
        </section>

        <div className="pk-tiles">
          {[
            [fmtNum(a.followers_count), "Followers"],
            [eng, "Avg. engagement"],
            [a.avg_reach ? fmtNum(a.avg_reach) : "—", "Avg. reach / post"],
            [fmtNum(avgLikes), "Avg. likes"],
            [fmtNum(a.media_count), "Total posts"],
          ].map(([v, l], i) => (
            <div key={l} className={`pk-tile ${i === 0 ? "pk-tile--hero" : ""}`}>
              <b>{v}</b>
              <span>{l}</span>
            </div>
          ))}
        </div>

        {aud.total > 0 && (
          <section className="pk-card">
            <h2>Audience</h2>
            <div className="pk-split">
              {["F", "M", "U"]
                .filter((g) => aud.byG[g] > 0)
                .map((g) => (
                  <span key={g} className={`pk-seg pk-seg--${g}`} style={{ flex: aud.byG[g] }} />
                ))}
            </div>
            <div className="pk-keys">
              {[
                ["F", "Women"],
                ["M", "Men"],
                ["U", "Other"],
              ]
                .filter(([g]) => aud.byG[g] > 0)
                .map(([g, l]) => (
                  <span key={g}>
                    <i className={`pk-dot pk-seg--${g}`} /> {l} <b>{fmtPct(pct(aud.byG[g], aud.total))}</b>
                  </span>
                ))}
            </div>
            <div className="pk-chart" role="img" aria-label="Followers by age and gender">
              {aud.ages.map((age) => {
                const c = aud.cells[age];
                return (
                  <div key={age} className="pk-col">
                    <span className="pk-val">{fmtPct(pct(c.F + c.M + c.U, aud.total))}</span>
                    <div className="pk-bars">
                      {["F", "M"].concat(aud.byG.U ? ["U"] : []).map((g) => (
                        <span key={g} className={`pk-vbar pk-seg--${g}`} style={{ height: `${maxCell ? Math.max(c[g] ? 3 : 0, Math.round((100 * c[g]) / maxCell)) : 0}%` }} />
                      ))}
                    </div>
                    <span className="pk-age">{age}</span>
                  </div>
                );
              })}
            </div>
            {(aud.countries.length > 0 || aud.cities.length > 0) && (
              <div className="pk-geo">
                {[
                  ["Top countries", aud.countries.map((x) => ({ ...x, n: regionName(x.n) }))],
                  ["Top cities", aud.cities],
                ]
                  .filter(([, l]) => l.length)
                  .map(([t, l]) => (
                    <div key={t}>
                      <h3>{t}</h3>
                      {l.map((x) => (
                        <div key={x.n} className="pk-row">
                          <span className="pk-row__l">{x.n}</span>
                          <span className="pk-track">
                            <i style={{ width: `${x.p}%` }} />
                          </span>
                          <span className="pk-row__v">{fmtPct(x.p)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {tops.length > 0 && (
          <section className="pk-card">
            <h2>Top performing posts</h2>
            <MoreGrid className="pk-grid" min={180} all={printing} items={cut(tops, 3)} render={(m, i) => <Post key={i} m={m} />} />
          </section>
        )}
        {(portfolio.length > 0 || work.length > 0) && (
          <section className="pk-card">
            <h2>Work portfolio</h2>
            {work.length > 0 && (
              <div className="pk-wkwrap">
                <MoreGrid min={140} all={printing} items={cut(work, 12)} render={(p, i) => (
                  <a key={i} href={safeUrl(p.permalink)} target="_blank" rel="noopener noreferrer" className="pk-workc">
                    <span className="pk-workc__m">
                      <i>{String(p.brand || "?").slice(0, 2).toUpperCase()}</i>
                    {p.thumb && <img src={p.thumb} alt="" referrerPolicy="no-referrer" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                      {(p.views || p.likes || p.comments) ? (
                        <em>{p.views ? `▶ ${fmtNum(p.views)}` : ""}{p.likes ? ` ♥ ${fmtNum(p.likes)}` : ""}{p.comments ? ` 💬 ${fmtNum(p.comments)}` : ""}</em>
                      ) : null}
                    </span>
                    <b>{p.brand || "Brand"}</b>
                    <small>{p.campaign || "Campaign"} · {p.media_type === "story" ? "Story" : p.media_type === "post" ? "Post" : "Reel"}</small>
                  </a>
                )} />
              </div>
            )}
            <div className="pk-port">
              {portfolio.map((p, i) => (
                <div key={i} className="pk-brand">
                  <span className="pk-brand__ic">{String(p.brand || "?").slice(0, 2).toUpperCase()}</span>
                  <div>
                    <b>{p.brand}</b>
                    {p.note && <small>{p.note}</small>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        <section className="pk-card">
          <h2>Mentions</h2>
          {mentions.length ? (
            <MoreGrid className="pk-grid" min={180} all={printing} items={cut(mentions, 9)} render={(m, i) => <Post key={i} m={m} by />} />
          ) : (
            <p className="pk-none">No brand or creator has tagged @{a.username} yet.</p>
          )}
        </section>
        {media.length > 0 && (
          <section className="pk-card">
            <h2>Content showcase</h2>
            <MoreGrid className="pk-grid" min={180} all={printing} items={cut(media, 9)} render={(m, i) => <Post key={i} m={m} />} />
          </section>
        )}
      </>
    );
  }

  return (
    <main className={`pk ${embed ? "pk--embed" : ""}`}>
      <div className="pk-wrap">
        {!embed && (
          <header className="pk-top">
            <Link href="/creator/media-kit" className="pk-logo" aria-label="Bounty — open your media kit">
              <Logo tone="dark" size={24} />
              <span className="pk-logo__t">Media kit</span>
            </Link>
            {st.phase === "ok" && (
              <div className="pk-actions">
                <button type="button" className="pk-act" onClick={shareKit}>
                  {copied ? "✓ Link copied" : "Share"}
                </button>
                <button type="button" className="pk-act pk-act--pri" onClick={() => window.print()}>
                  ⬇ Download PDF
                </button>
              </div>
            )}
          </header>
        )}
        {st.phase === "load" && <p className="pk-msg">Loading media kit…</p>}
        {st.phase === "fail" && <p className="pk-msg">{st.msg}</p>}
        {body}
        {!embed && (
          <footer className="pk-foot">
            <Link href="/creator/media-kit" aria-label="Bounty — open your media kit">
              <Logo tone="dark" size={17} />
            </Link>
            <span>by Geek Creative Agency</span>
          </footer>
        )}
      </div>
      <style>{`
        .pk { --pk-ink: #14231a; --pk-text: #3e4b52; --pk-muted: #6b5a3a; --pk-card: #fbf1dc; --pk-line: #e2d3b0; --pk-green: #123524; --pk-gold: #e8b04a;
          --bx-logo: var(--font-cinzel), "Cinzel", Georgia, serif; --bx-sans: var(--font-dm), "DM Sans", system-ui, sans-serif;
          min-height: 100vh; position: relative; isolation: isolate; background: #f6ebd3; color: var(--pk-ink); font-family: var(--font-dm), "DM Sans", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .pk::before { content: ""; position: fixed; inset: 0; z-index: -1; background: url("/creator/parchment.jpg") center / cover no-repeat, #f6ebd3; pointer-events: none; }
        .pk * { box-sizing: border-box; }
        .pk--embed { background: transparent; min-height: 0; }
        .pk--embed::before { display: none; }
        .pk-wrap { max-width: 980px; margin: 0 auto; padding: 0 20px 40px; }
        .pk--embed .pk-wrap { max-width: none; padding: 8px; }
        .pk-top { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 -20px 18px; padding: 12px 20px; background: rgba(251,243,226,.92); backdrop-filter: saturate(160%) blur(10px); border-bottom: 1px solid var(--pk-line); }
        .pk-logo { display: inline-flex; align-items: center; gap: 10px; color: var(--pk-ink); text-decoration: none; }
        .pk-logo .pk-logo__t { padding-left: 10px; border-left: 1px solid var(--pk-line); font-size: 13px; font-weight: 600; color: var(--pk-muted); }
        .pk-actions { display: flex; gap: 8px; }
        .pk-act { height: 38px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--pk-line); background: #fffaf0; color: var(--pk-ink); font-size: 13.5px; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .pk-act:hover { background: #fff; }
        .pk-act--pri { border-color: var(--pk-green); background: var(--pk-green); color: #fbf3e2; }
        .pk-act--pri:hover { background: #1a4a33; }
        .pk-msg { padding: 80px 0; text-align: center; color: var(--pk-muted); }

        /* hero — creator media kit jaisa: hara-sunehra cover, photo upar */
        .pk-hero { position: relative; display: flex; gap: 18px; align-items: flex-start; padding: 0 24px 22px; border-radius: 16px; background: var(--pk-card); border: 1px solid var(--pk-line); box-shadow: 0 10px 24px -20px rgba(60,40,10,.45); overflow: hidden; flex-wrap: wrap; }
        .pk-cover { position: absolute; inset: 0 0 auto 0; height: 120px; background: linear-gradient(170deg, #0f3a28 0%, #1d5a3e 38%, #8d8a46 66%, #d9a94a 100%); }
        .pk-av { position: relative; z-index: 1; width: 112px; height: 112px; flex-shrink: 0; margin-top: 64px; border-radius: 50%; object-fit: cover; border: 4px solid #fbf1dc; background: #fbf1dc; box-shadow: 0 10px 20px -10px rgba(0,0,0,.5); }
        .pk-av--ph { display: grid; place-items: center; background: #e6e2c8; color: var(--pk-green); font-size: 36px; font-weight: 800; }
        .pk-id { position: relative; z-index: 1; flex: 1; min-width: 220px; padding-top: 134px; }
        .pk-id h1 { margin: 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 24px; line-height: 31px; font-weight: 800; letter-spacing: -.2px; color: var(--pk-ink); }
        .pk-type { display: inline-flex; align-items: center; height: 20px; padding: 0 9px; border-radius: 999px; background: #e6e2c8; font-size: 11px; font-weight: 600; letter-spacing: 0; color: #103b2a; }
        .pk-handle { display: inline-block; margin-top: 1px; color: var(--pk-muted); font-size: 16px; font-weight: 500; text-decoration: none; }
        .pk-handle:hover { color: var(--pk-green); }
        .pk-cats { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .pk-cats span { padding: 4px 10px; border-radius: 999px; background: #fffaf0; border: 1px solid var(--pk-line); font-size: 12px; font-weight: 600; color: var(--pk-ink); }
        .pk-headline { margin: 10px 0 0; font-size: 15px; font-weight: 700; color: var(--pk-ink); }
        .pk-bio { margin: 8px 0 0; max-width: 620px; font-size: 14px; line-height: 21px; white-space: pre-line; color: var(--pk-ink); }
        .pk-web { display: inline-block; margin-top: 10px; color: #2e9c94; font-size: 13.5px; font-weight: 700; word-break: break-all; text-decoration: none; }

        /* stats */
        .pk-tiles { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 13px; margin-top: 16px; }
        .pk-tile { padding: 18px 16px 15px; border-radius: 14px; background: var(--pk-card); border: 1px solid var(--pk-line); box-shadow: 0 10px 24px -20px rgba(60,40,10,.45); }
        .pk-tile b { display: block; font-size: 24px; line-height: 31px; font-weight: 800; letter-spacing: -.5px; color: var(--pk-ink); }
        .pk-tile span { display: block; margin-top: 2px; font-size: 12px; line-height: 16px; color: var(--pk-muted); }
        .pk-tile--hero { background: linear-gradient(135deg, #1a4a33, #123524); border-color: #123524; }
        .pk-tile--hero b, .pk-tile--hero span { color: #fff; }

        /* cards */
        .pk-card { margin-top: 14px; padding: 18px 18px 20px; border-radius: 16px; background: var(--pk-card); border: 1px solid var(--pk-line); box-shadow: 0 10px 24px -20px rgba(60,40,10,.45); }
        .pk-card h2 { margin: 0 0 14px; font-family: var(--font-fraunces), "Fraunces", Georgia, serif; font-size: 17px; font-weight: 600; color: var(--pk-ink); }
        .pk-split { display: flex; height: 12px; border-radius: 999px; overflow: hidden; gap: 2px; }
        .pk-seg--F { background: #c0702a; } .pk-seg--M { background: #1d5a3e; } .pk-seg--U { background: #c9b98f; }
        .pk-keys { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 10px; font-size: 13px; color: var(--pk-ink); }
        .pk-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 2px; }
        .pk-chart { display: flex; gap: 10px; align-items: flex-end; height: 180px; margin-top: 18px; padding-top: 6px; border-bottom: 1px solid var(--pk-line); }
        .pk-col { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; align-items: center; }
        .pk-val { font-size: 11.5px; font-weight: 700; color: var(--pk-ink); }
        .pk-bars { flex: 1; width: 100%; display: flex; gap: 3px; align-items: flex-end; justify-content: center; margin: 6px 0; }
        .pk-vbar { width: 30%; max-width: 18px; border-radius: 5px 5px 0 0; }
        .pk-age { padding-bottom: 6px; font-size: 11.5px; color: var(--pk-muted); }
        .pk-geo { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; }
        .pk-geo h3 { margin: 0 0 10px; font-size: 13.5px; font-weight: 700; color: var(--pk-ink); }
        .pk-row { display: grid; grid-template-columns: minmax(0, 1.4fr) 1fr 48px; gap: 10px; align-items: center; margin-bottom: 9px; font-size: 13px; }
        .pk-row__l { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pk-track { height: 8px; border-radius: 999px; background: #eadcb8; overflow: hidden; }
        .pk-track i { display: block; height: 100%; background: linear-gradient(90deg, #123524, #2e7a52); border-radius: inherit; }
        .pk-row__v { text-align: right; font-weight: 700; }

        /* posts */
        .pk-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .pk-post { position: relative; display: block; aspect-ratio: 4 / 5; border-radius: 12px; overflow: hidden; background: #eadcb8; }
        .pk-post img { position: relative; z-index: 1; width: 100%; height: 100%; object-fit: cover; transition: transform .25s; }
        .pk-post:hover img { transform: scale(1.03); }
        .pk-noimg { position: absolute; inset: 0; display: grid; place-items: center; font-size: 12px; font-weight: 600; color: var(--pk-muted); }
        .pk-badge { position: absolute; z-index: 2; top: 8px; right: 8px; color: #fff; font-size: 14px; text-shadow: 0 1px 4px rgba(0,0,0,.5); }
        .pk-none { margin: 0; font-size: 13px; color: var(--pk-muted); }
        .pk-by { position: absolute; z-index: 2; top: 8px; left: 8px; max-width: calc(100% - 40px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 3px 8px; border-radius: 999px; background: rgba(251,241,220,.92); color: #14231a; font-size: 11px; font-weight: 700; }
        .pk-meta { position: absolute; z-index: 2; left: 8px; bottom: 8px; padding: 3px 8px; border-radius: 999px; background: rgba(0,0,0,.45); color: #fff; font-size: 11px; font-weight: 600; }
        .pk-wkwrap { margin-bottom: 12px; }
        .pk-workc { display: grid; gap: 3px; color: inherit; text-decoration: none; min-width: 0; break-inside: avoid; }
        .pk-workc__m { position: relative; display: grid; place-items: center; aspect-ratio: 4 / 5; border-radius: 12px; overflow: hidden; background: #eadcb8; }
        .pk-workc__m img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .pk-workc__m i { font-style: normal; font-weight: 800; font-size: 20px; color: #8a6b32; }
        .pk-workc__m em { position: absolute; left: 6px; right: 6px; bottom: 6px; padding: 4px 7px; border-radius: 8px; background: rgba(0,0,0,.55); color: #fff; font-style: normal; font-size: 11px; font-weight: 700; }
        .pk-workc b { font-size: 13px; }
        .pk-workc small { font-size: 11.5px; opacity: .75; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pk-port { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .pk-brand { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 12px; background: #fffaf0; border: 1px solid var(--pk-line); }
        .pk-brand__ic { width: 38px; height: 38px; flex-shrink: 0; border-radius: 10px; display: grid; place-items: center; background: linear-gradient(135deg, #1a4a33, #123524); color: #fbf3e2; font-size: 13px; font-weight: 800; }
        .pk-brand b { display: block; font-size: 14px; }
        .pk-brand small { display: block; font-size: 12px; color: var(--pk-text); }
        .pk-foot { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 30px; text-align: center; }
        .pk-foot a { color: var(--pk-ink); text-decoration: none; }
        .pk-foot > span { font-size: 12px; font-weight: 500; letter-spacing: .4px; color: var(--pk-muted); }

        @media (max-width: 860px) {
          .pk-tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .pk-tile--hero { grid-column: span 3; }
        }
        @media (max-width: 600px) {
          .pk-wrap { padding: 0 12px 32px; }
          .pk-top { margin: 0 -12px 12px; padding: 10px 12px; }
          .pk-logo .pk-logo__t { display: none; }
          .pk-act { height: 34px; padding: 0 12px; font-size: 12.5px; }
          .pk-hero { flex-direction: column; align-items: center; text-align: center; padding: 0 16px 20px; }
          .pk-av { margin-top: 56px; width: 104px; height: 104px; }
          .pk-id { padding-top: 0; }
          .pk-id h1 { justify-content: center; font-size: 22px; }
          .pk-cats { justify-content: center; }
          .pk-bio { margin-left: auto; margin-right: auto; }
          .pk-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
          .pk-tile--hero { grid-column: 1 / -1; }
          .pk-tile b { font-size: 21px; }
          .pk-card { padding: 16px 14px; }
          .pk-geo { grid-template-columns: 1fr; }
          .pk-chart { gap: 4px; height: 150px; }
          .pk-grid { gap: 6px; }
        }

        /* PDF (Download PDF / ?print=1) — poore rang, har section ek saath */
        @media print {
          @page { size: A4; margin: 10mm; }
          .pk, .pk * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .pk { background: #f6ebd3 !important; } .pk::before { position: absolute; }
          .pk-top { position: static; margin: 0 0 10px; border: 0; background: transparent; backdrop-filter: none; }
          .pk-actions { display: none !important; }
          .pk-wrap { max-width: none; padding: 0; }
          .pk-hero, .pk-card, .pk-tile { box-shadow: none !important; border: 1px solid #e2d3b0; }
          .pk-hero, .pk-card, .pk-tiles, .pk-post { break-inside: avoid; page-break-inside: avoid; }
          .pk-post img { transform: none !important; }
          .pk-foot { margin-top: 12px; }
        }
      `}</style>
    </main>
  );
}
