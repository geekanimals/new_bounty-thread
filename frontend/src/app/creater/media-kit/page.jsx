"use client";

import { useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import { RumiTip } from "@/components/creater/OnboardShell";
import { useSession } from "@/components/creater/session";
import { CREATOR, ANALYTICS, KIT_POSTS, getSidekick } from "@/components/creater/data";
import { Share, Edit, Copy, WhatsApp, Download, Close, Check, Heart, Chat, Instagram, ArrowRight } from "@/components/ui/Icons";

// Dummy: portfolio + mentions (Instagram se aayenge)
const PORTFOLIO = [
  { brand: "Vaaree", note: "Diwali Sale · Reel · 18.4K views" },
  { brand: "Mamaearth", note: "Monsoon Reel · 22.1K views" },
  { brand: "Lenskart", note: "Weekend Story · 6.8K views" },
];
const MENTIONS = [
  { who: "@vaaree", text: "tagged you in a Story · 30 Oct" },
  { who: "@jaipurdiaries", text: "mentioned you in a post · 21 Oct" },
];

/** /creater/media-kit — Instagram se auto-bana media kit (share, edit, PDF) */
export default function MediaKit() {
  const [s] = useSession();
  const sk = getSidekick(s.sidekick);
  const [popup, setPopup] = useState(null); // share | edit
  const [toast, setToast] = useState("");
  const [name, setName] = useState(CREATOR.user);
  const [bio, setBio] = useState(CREATOR.bio);
  const [draftName, setDraftName] = useState(name);
  const [draftBio, setDraftBio] = useState(bio);
  const [show, setShow] = useState({ audience: true, portfolio: true, mentions: true, showcase: true });
  const [draftShow, setDraftShow] = useState(show);

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };
  const kitUrl = `https://bounty.geekcreativeagency.com/kit/${CREATOR.user}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(kitUrl);
    } catch {
      /* clipboard na mile to bhi chalega */
    }
    flash("Link copied");
  };

  /* ---------- Locked: Instagram connect nahi ---------- */
  if (!s.ig) {
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
          <Link href="/creater/onboarding/meta" className="mk-connect">
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

  const stats = [
    { v: CREATOR.followers, l: "Followers" },
    { v: CREATOR.eng, l: "Avg. engagement" },
    { v: CREATOR.reach, l: "Avg. reach / post" },
    { v: CREATOR.likes, l: "Avg. likes" },
    { v: CREATOR.posts, l: "Total posts" },
  ];

  return (
    <BountyShell>
      <title>Media kit — Bounty</title>

      {!s.setupDone && (
        <section className="mk-ready">
          <span>
            <strong>Your media kit is ready 🎉</strong>
            <small>Next, tell brands what you create — it takes a minute.</small>
          </span>
          <Link href="/creater/onboarding/content" className="bx-btn bx-btn--cream bx-btn--sm">
            Continue setup <ArrowRight size={12} />
          </Link>
        </section>
      )}

      <h1 className="bx-title">My Media Kit</h1>
      <p className="bx-lede">Your reach, audience and best work — auto-built from Instagram and shareable with brands.</p>

      <div className="mk-bar">
        <div className="bx-card mk-of">
          <img src={CREATOR.avatar} alt="" />
          <span>
            <small>Media kit of</small>
            <strong>{CREATOR.handle}</strong>
          </span>
          <Link href="/creater/profile/instagram" className="mk-add">
            + Add account
          </Link>
        </div>
        <p className="mk-sync">{CREATOR.synced}</p>
      </div>

      <section className="bx-card mk-hero">
        <div className="mk-cover" />
        <div className="mk-id">
          <img src={CREATOR.avatar} alt="" className="mk-av" />
          <div className="mk-id__txt">
            <h2>
              {name} <span className="mk-acct">Creator Account</span>
            </h2>
            <p className="mk-handle">{CREATOR.handle}</p>
            <p className="mk-bio">{bio}</p>
          </div>
          <div className="mk-id__btns">
            <button type="button" className="mk-sharebtn" onClick={() => setPopup("share")}>
              Share kit
            </button>
            <button
              type="button"
              className="mk-editbtn"
              onClick={() => {
                setDraftName(name);
                setDraftBio(bio);
                setDraftShow(show);
                setPopup("edit");
              }}
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
          <div className="mk-aud">
            {ANALYTICS.audience.map((a) => (
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
          Top performing posts <small>best of {KIT_POSTS.length} posts · likes + comments</small>
        </h3>
        <div className="mk-posts" data-scroll>
          {[...KIT_POSTS].sort((a, b) => b.likes - a.likes).map((p, i) => (
            <figure key={p.img}>
              <img src={p.img} alt="" />
              <figcaption>
                #{i + 1} · <Heart size={11} /> {p.likes} · <Chat size={11} /> {p.comments}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {show.portfolio && (
        <section className="bx-card mk-sec">
          <h3>
            Work portfolio
            <button type="button" className="mk-edit" onClick={() => setPopup("edit")}>
              ✎ Edit
            </button>
          </h3>
          <ul className="mk-port">
            {PORTFOLIO.map((p) => (
              <li key={p.brand}>
                <strong>{p.brand}</strong>
                <small>{p.note}</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      {show.mentions && (
        <section className="bx-card mk-sec">
          <h3>Mentions</h3>
          <ul className="mk-ment">
            {MENTIONS.map((m) => (
              <li key={m.who}>
                <b>{m.who}</b> {m.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {show.showcase && (
        <section className="bx-card mk-sec">
          <h3>
            Content showcase <small className="mk-right">{KIT_POSTS.length} posts</small>
          </h3>
          <div className="mk-show" data-scroll>
            {KIT_POSTS.map((p) => (
              <figure key={p.img}>
                <img src={p.img} alt="" />
                <figcaption>
                  <Heart size={11} /> {p.likes} <Chat size={11} /> {p.comments}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="bx-card mk-work">
        <span>
          <strong>Work with {name}</strong>
          <small>Barters, paid campaigns &amp; brand collaborations — managed end-to-end in Geek Influencer OS.</small>
        </span>
        <button type="button" className="bx-btn bx-btn--dark" onClick={() => flash("Media kit link added to your Instagram bio 🎉")}>
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
                <button type="button" className="bx-btn bx-btn--ghost" onClick={() => flash("Media kit PDF is downloading…")}>
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
            onSubmit={(ev) => {
              ev.preventDefault();
              setName(draftName.trim() || CREATOR.user);
              setBio(draftBio);
              setShow(draftShow);
              setPopup(null);
              flash("Media kit saved");
            }}
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
              <button type="submit" className="bx-btn bx-btn--dark bx-btn--block mk-gap">
                <Check size={14} /> Save
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
        .mk-ready { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; padding: 14px 18px; border-radius: 16px; background: linear-gradient(120deg, #123524, #1d4a35); color: var(--bx-cream); border: 1px solid rgba(232,176,74,.6); }
        .mk-ready span { flex: 1; min-width: 200px; }
        .mk-ready strong { display: block; font-family: var(--bx-serif); font-size: 17px; font-weight: 600; }
        .mk-ready small { font-size: 12.5px; color: #d9cdb2; }
        .mk-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 18px 0 14px; }
        .mk-of { display: flex; align-items: center; gap: 10px; height: 54px; padding: 0 6px 0 7px; border-radius: 999px; }
        .mk-of img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; }
        .mk-of small { display: block; font-size: 11px; line-height: 12.7px; letter-spacing: .4px; text-transform: uppercase; color: #6b5a3a; }
        .mk-of strong { display: block; font-size: 14px; line-height: 16.1px; font-weight: 700; color: #14231a; }
        .mk-add { display: inline-flex; align-items: center; height: 40px; padding: 0 18px; margin-left: 6px; border-radius: 999px; border: 1px solid #c9b38a; background: #fffaef; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: #14231a; }
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
