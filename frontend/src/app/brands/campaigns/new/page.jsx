"use client";

import { useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import { Check, LinkIcon, Play, ImageIcon, Grid, Upload, Send, Rupee, Close } from "@/components/ui/Icons";

const GOALS = ["Awareness", "Sales", "Product launch", "App installs", "Store footfall"];
const NICHES = ["Beauty", "Makeup", "Bridal", "Skincare", "Fashion", "Lifestyle", "Men's grooming"];
const SIZES = [
  { key: "10K–50K", avg: 6000 },
  { key: "50K–200K", avg: 13500 },
  { key: "200K–1M", avg: 40000 },
  { key: "1M+", avg: 150000 },
];
const CITIES = ["Metros", "Tier 2", "All India"];
const NEXT = [
  { title: "You send the request", text: "Takes 3 minutes" },
  { title: "Geek plans it", text: "Creator shortlist + quote within 24 hours" },
  { title: "You approve creators", text: "In Approvals — one tap each" },
  { title: "Videos, then live", text: "You OK every video before it posts" },
];

// "600000" -> "6,00,000" (Indian format)
const inr = (n) => Number(n || 0).toLocaleString("en-IN");

/** /brands/campaigns/new — naya campaign request Geek ko bhejna */
export default function NewCampaignRequest() {
  const [f, setF] = useState({
    name: "Wedding Season Looks",
    product: "Nykaa Bridal Glow range",
    link: "nykaa.com/bridal-glow",
    goal: "Sales",
    niches: ["Makeup", "Bridal"],
    size: "50K–200K",
    city: "Metros",
    reels: 1,
    stories: 2,
    posts: 0,
    budget: "600000",
    from: "2026-11-15",
    to: "2026-12-15",
    brief: "Show a full bridal-guest look in under 60 sec using 3 products from the range.\nNatural light, warm tones. Mention the 25% wedding offer.",
  });
  const [files, setFiles] = useState([]);
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState("");

  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const toggleNiche = (n) => set("niches", f.niches.includes(n) ? f.niches.filter((x) => x !== n) : [...f.niches, n]);
  const step = (k, d) => set(k, Math.max(0, Math.min(5, f[k] + d)));

  // Budget se kitne creators — har content piece ka andaza
  const perCreator = SIZES.find((s) => s.key === f.size).avg * Math.max(1, f.reels + f.stories * 0.25 + f.posts * 0.6);
  const suggested = Math.max(1, Math.round(Number(f.budget || 0) / perCreator));
  const content = [f.reels && `${f.reels} Reel${f.reels > 1 ? "s" : ""}`, f.stories && `${f.stories} Stor${f.stories > 1 ? "ies" : "y"}`, f.posts && `${f.posts} Post${f.posts > 1 ? "s" : ""}`]
    .filter(Boolean)
    .join(" + ");
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—");

  const errName = !f.name.trim();
  const errBudget = Number(f.budget) < 50000;
  const errContent = !content;

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };
  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (errName || errBudget || errContent) return;
    setSent(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <BrandShell crumbs={[{ label: "Campaigns", href: "/brands/campaigns" }, { label: "New request" }]}>
      <title>New campaign request — Geek OS Brand</title>

      {sent ? (
        <section className="br-card nr-done">
          <span className="nr-done__ic">
            <Check size={22} />
          </span>
          <h1>Request sent to Geek</h1>
          <p>
            <strong>{f.name}</strong> is with the Geek team. You’ll get a plan, a creator shortlist and a quote within 24 hours — on
            WhatsApp, email and in Approvals.
          </p>
          <div className="nr-done__btns">
            <Link href="/brands/approvals/requests" className="br-btn br-btn--primary">
              See it in Campaign requests
            </Link>
            <Link href="/brands/campaigns" className="br-btn br-btn--ghost">
              Back to Campaigns
            </Link>
          </div>
        </section>
      ) : (
        <>
          <p className="br-eyebrow">New campaign request</p>
          <h1 className="br-h1">Tell us about the campaign</h1>
          <p className="br-sub">Geek turns this into a plan, a creator shortlist and a quote.</p>

          <form className="nr" onSubmit={submit} noValidate>
            <div className="nr-main">
              {/* 1 — basics */}
              <section className="br-card nr-sec">
                <div className="nr-sec__head">
                  <span className="nr-num">1</span>
                  <div>
                    <h2>The basics</h2>
                    <p>What is this campaign about?</p>
                  </div>
                </div>
                <label className="br-label" htmlFor="nr-name">
                  Campaign name
                </label>
                <input id="nr-name" className={`br-input ${tried && errName ? "is-err" : ""}`} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Wedding Season Looks" />
                {tried && errName && <p className="nr-err">Give the campaign a name.</p>}
                <div className="nr-two">
                  <div>
                    <label className="br-label">Product or collection</label>
                    <input className="br-input" value={f.product} onChange={(e) => set("product", e.target.value)} />
                  </div>
                  <div>
                    <label className="br-label">Website / product link</label>
                    <span className="nr-icon-input">
                      <LinkIcon size={14} />
                      <input className="br-input" value={f.link} onChange={(e) => set("link", e.target.value)} />
                    </span>
                  </div>
                </div>
                <label className="br-label nr-gap">Main goal</label>
                <div className="nr-chips">
                  {GOALS.map((g) => (
                    <button key={g} type="button" className={`br-chip ${f.goal === g ? "is-on" : ""}`} onClick={() => set("goal", g)}>
                      {g}
                    </button>
                  ))}
                </div>
              </section>

              {/* 2 — creators */}
              <section className="br-card nr-sec">
                <div className="nr-sec__head">
                  <span className="nr-num">2</span>
                  <div>
                    <h2>Creators</h2>
                    <p>Who should talk about it?</p>
                  </div>
                </div>
                <label className="br-label">Niche</label>
                <div className="nr-chips">
                  {NICHES.map((n) => (
                    <button key={n} type="button" className={`br-chip ${f.niches.includes(n) ? "is-on" : ""}`} onClick={() => toggleNiche(n)}>
                      {n}
                    </button>
                  ))}
                </div>
                <div className="nr-two nr-gap">
                  <div>
                    <label className="br-label">Follower size</label>
                    <div className="br-seg">
                      {SIZES.map((s) => (
                        <button key={s.key} type="button" className={f.size === s.key ? "is-on" : ""} onClick={() => set("size", s.key)}>
                          {s.key}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="br-label">Audience city</label>
                    <div className="nr-chips">
                      {CITIES.map((c) => (
                        <button key={c} type="button" className={`br-chip ${f.city === c ? "is-on" : ""}`} onClick={() => set("city", c)}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* 3 — content & budget */}
              <section className="br-card nr-sec">
                <div className="nr-sec__head">
                  <span className="nr-num">3</span>
                  <div>
                    <h2>Content &amp; budget</h2>
                    <p>What you want made, and how much to spend</p>
                  </div>
                </div>
                <label className="br-label">Deliverables per creator</label>
                <div className="nr-steps">
                  {[
                    { k: "reels", label: "Reels", icon: Play },
                    { k: "stories", label: "Stories", icon: ImageIcon },
                    { k: "posts", label: "Posts", icon: Grid },
                  ].map(({ k, label, icon: Icon }) => (
                    <div key={k} className="nr-step">
                      <Icon size={14} />
                      <span>{label}</span>
                      <span className="nr-step__ctl">
                        <button type="button" aria-label={`Less ${label}`} onClick={() => step(k, -1)}>
                          −
                        </button>
                        <strong>{f[k]}</strong>
                        <button type="button" aria-label={`More ${label}`} onClick={() => step(k, 1)}>
                          +
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
                {tried && errContent && <p className="nr-err">Pick at least one Reel, Story or Post.</p>}
                <div className="nr-two nr-gap">
                  <div>
                    <label className="br-label">Total budget</label>
                    <span className="nr-icon-input">
                      <Rupee size={14} />
                      <input
                        className={`br-input ${tried && errBudget ? "is-err" : ""}`}
                        inputMode="numeric"
                        value={inr(f.budget)}
                        onChange={(e) => set("budget", e.target.value.replace(/\D/g, "").slice(0, 9))}
                      />
                    </span>
                    {tried && errBudget ? (
                      <p className="nr-err">Minimum budget is ₹50,000.</p>
                    ) : (
                      <p className="nr-hint">Geek suggests ~{suggested} creators for this budget</p>
                    )}
                  </div>
                  <div>
                    <label className="br-label">Dates</label>
                    <div className="nr-dates">
                      <span className="nr-icon-input nr-date">
                        <input className="br-input" type="date" aria-label="Start date" value={f.from} onChange={(e) => set("from", e.target.value)} />
                      </span>
                      <span className="nr-icon-input nr-date">
                        <input className="br-input" type="date" aria-label="End date" value={f.to} min={f.from} onChange={(e) => set("to", e.target.value)} />
                      </span>
                    </div>
                  </div>
                </div>
                <label className="br-label nr-gap">Brief for creators</label>
                <textarea className="br-input" rows={4} value={f.brief} onChange={(e) => set("brief", e.target.value)} />
                <label className="nr-upload">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles([...files, ...Array.from(e.target.files || []).map((x) => x.name)])}
                  />
                  <span className="nr-upload__ic">
                    <Upload size={15} />
                  </span>
                  <span>
                    <strong>Add reference videos, mood board or product photos</strong>
                    <small>Images, PDF or video links</small>
                  </span>
                </label>
                {files.length > 0 && (
                  <ul className="nr-files">
                    {files.map((n, i) => (
                      <li key={n + i}>
                        {n}
                        <button type="button" aria-label="Remove file" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                          <Close size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="nr-foot">
                <button type="button" className="br-btn br-btn--ghost" onClick={() => flash("Draft saved — finish it any time from Campaigns")}>
                  Save draft
                </button>
                <button type="submit" className="br-btn br-btn--primary">
                  <Send size={14} /> Send request to Geek
                </button>
              </div>
            </div>

            {/* Right: live summary */}
            <aside className="nr-side">
              <div className="nr-sum">
                <p className="nr-sum__eye">Your request</p>
                <h3>{f.name.trim() || "Untitled campaign"}</h3>
                <dl>
                  <div>
                    <dt>Goal</dt>
                    <dd>{f.goal}</dd>
                  </div>
                  <div>
                    <dt>Creators</dt>
                    <dd>
                      ~{suggested} · {f.size}
                    </dd>
                  </div>
                  <div>
                    <dt>Niche</dt>
                    <dd>{f.niches.join(", ") || "—"}</dd>
                  </div>
                  <div>
                    <dt>Content</dt>
                    <dd>{content ? `${content} each` : "—"}</dd>
                  </div>
                  <div>
                    <dt>Budget</dt>
                    <dd>₹{inr(f.budget)}</dd>
                  </div>
                  <div>
                    <dt>Dates</dt>
                    <dd>
                      {fmtDate(f.from)} – {fmtDate(f.to)}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="br-card nr-next">
                <h3>What happens next</h3>
                <ol>
                  {NEXT.map((n, i) => (
                    <li key={n.title} className={i === 0 ? "is-now" : ""}>
                      <span />
                      <div>
                        <strong>{n.title}</strong>
                        <small>{n.text}</small>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </form>
        </>
      )}

      {toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .nr { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; align-items: start; margin-top: 22px; }
        .nr-main { display: grid; gap: 16px; min-width: 0; }
        .nr-sec { padding: 22px; }
        .nr-sec__head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
        .nr-num { width: 26px; height: 26px; border-radius: 50%; background: var(--br-ink); color: #fff; display: grid; place-items: center; font-size: 12.5px; font-weight: 800; flex-shrink: 0; }
        .nr-sec__head h2 { margin: 0; font-size: 16px; font-weight: 800; }
        .nr-sec__head p { margin: 2px 0 0; font-size: 12px; color: var(--br-muted); }
        .nr-two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
        .nr-two > div { min-width: 0; }
        .nr .nr-gap { margin-top: 16px; }
        .nr .nr-date .br-input { padding-left: 12px; }
        .nr-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .nr-icon-input { position: relative; display: block; }
        .nr-icon-input svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--br-faint); pointer-events: none; }
        .nr-icon-input .br-input { padding-left: 36px; }
        .br-input.is-err { border-color: var(--br-red); }
        .nr-err { margin: 6px 0 0; font-size: 12px; color: var(--br-red); }
        .nr-hint { margin: 6px 0 0; font-size: 11.5px; color: var(--br-faint); }
        .nr-dates { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .nr-dates .br-input { padding-right: 6px; font-size: 13px; }

        .nr-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .nr-step { display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 10px 0 14px; border: 1px solid var(--br-border-2); border-radius: 11px; font-size: 13.5px; font-weight: 700; }
        .nr-step > svg { color: var(--br-muted); }
        .nr-step__ctl { margin-left: auto; display: flex; align-items: center; gap: 4px; padding: 3px; border-radius: 8px; background: #f4f5fa; }
        .nr-step__ctl button { width: 24px; height: 24px; border: 0; border-radius: 6px; background: none; color: var(--br-primary); font-size: 16px; font-weight: 700; line-height: 1; }
        .nr-step__ctl button:hover { background: #fff; }
        .nr-step__ctl strong { min-width: 16px; text-align: center; font-size: 13.5px; }

        .nr-upload {
          display: flex; align-items: center; gap: 14px; margin-top: 16px; padding: 16px;
          border: 1.5px dashed var(--br-border-2); border-radius: 13px; background: #fafafd; cursor: pointer;
        }
        .nr-upload:hover { border-color: var(--br-primary); }
        .nr-upload input { display: none; }
        .nr-upload__ic { width: 36px; height: 36px; border-radius: 10px; background: var(--br-lilac); color: var(--br-primary); display: grid; place-items: center; flex-shrink: 0; }
        .nr-upload strong { display: block; font-size: 13.5px; font-weight: 700; }
        .nr-upload small { display: block; font-size: 12px; color: var(--br-muted); }
        .nr-files { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
        .nr-files li { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 6px 0 10px; border-radius: 8px; background: #f1f2f7; font-size: 12px; font-weight: 600; max-width: 100%; }
        .nr-files button { border: 0; background: none; color: var(--br-muted); display: grid; place-items: center; padding: 2px; }

        .nr-foot { display: flex; justify-content: space-between; gap: 10px; }

        .nr-side { position: sticky; top: 96px; display: grid; gap: 14px; }
        .nr-sum { padding: 20px; border-radius: 18px; color: #fff; background: var(--br-hero); }
        .nr-sum__eye { margin: 0 0 6px; font-size: 10.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #ff8fb1; }
        .nr-sum h3 { margin: 0 0 14px; font-size: 19px; font-weight: 800; letter-spacing: -0.01em; word-break: break-word; }
        .nr-sum dl { margin: 0; display: grid; gap: 9px; }
        .nr-sum dl div { display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; }
        .nr-sum dt { color: #b9b4d8; }
        .nr-sum dd { margin: 0; font-weight: 700; text-align: right; }
        .nr-next { padding: 20px; }
        .nr-next h3 { margin: 0 0 14px; font-size: 14.5px; font-weight: 800; }
        .nr-next ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
        .nr-next li { display: flex; gap: 12px; }
        .nr-next li > span { width: 18px; height: 18px; margin-top: 2px; border-radius: 50%; background: #eceef5; flex-shrink: 0; position: relative; }
        .nr-next li > span::after { content: ""; position: absolute; inset: 6px; border-radius: 50%; background: var(--br-faint); }
        .nr-next li.is-now > span { background: var(--br-primary); }
        .nr-next li.is-now > span::after { background: #fff; }
        .nr-next strong { display: block; font-size: 13px; font-weight: 700; }
        .nr-next li:not(.is-now) strong { color: var(--br-text); }
        .nr-next small { display: block; font-size: 11.5px; color: var(--br-muted); }

        .nr-done { max-width: 620px; margin: 40px auto; padding: 36px 30px; text-align: center; }
        .nr-done__ic { width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 50%; background: var(--br-green); color: #fff; display: grid; place-items: center; }
        .nr-done h1 { margin: 0 0 8px; font-size: 23px; font-weight: 800; }
        .nr-done p { margin: 0 auto 22px; max-width: 460px; font-size: 14px; line-height: 1.6; color: var(--br-muted); }
        .nr-done__btns { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }

        @media (max-width: 1100px) {
          .nr { grid-template-columns: 1fr; }
          .nr-side { position: static; grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 760px) {
          .nr-side { grid-template-columns: 1fr; }
          .nr-two { grid-template-columns: 1fr; }
          .nr-steps { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .nr-sec { padding: 18px; }
          .nr-foot { flex-direction: column-reverse; }
          .nr-foot .br-btn { width: 100%; }
          .nr-done { margin: 10px 0; padding: 28px 20px; }
          .nr-done__btns .br-btn { width: 100%; }
        }
      `}</style>
    </BrandShell>
  );
}
