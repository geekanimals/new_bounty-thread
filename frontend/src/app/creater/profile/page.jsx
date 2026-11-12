"use client";

import { useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import { RumiTip } from "@/components/creater/OnboardShell";
import { useSession } from "@/components/creater/session";
import { CREATOR, CATEGORIES, DREAM_BRANDS, COLLAB_TYPES, getSidekick } from "@/components/creater/data";
import { ChevronRight } from "@/components/ui/Icons";

/** /creater/profile — Profile hub: photo, % complete aur saare sections ki list */
export default function ProfileHub() {
  const [s, update] = useSession();
  const locked = !s.ig;
  const sk = getSidekick(s.sidekick);
  const useSk = !!s.useSidekickPic;
  const [tip, setTip] = useState(true);

  const cats = CATEGORIES.filter((c) => s.categories.includes(c.id)).map((c) => c.label);
  const what = [...cats, ...s.languages].slice(0, 5).join(", ") || "Pick your categories";
  const dream = DREAM_BRANDS.filter((b) => s.dreamBrands.includes(b.id)).map((b) => b.name);
  const terms = COLLAB_TYPES.filter((t) => s.collab.includes(t.id)).map((t) => t.label);
  const termsTxt = [terms.join(", "), s.rates?.reel ? `Reel ₹${Number(s.rates.reel).toLocaleString("en-IN")}` : ""].filter(Boolean).join(" · ") || "Set your rates";

  const left = [
    { icon: "👤", title: "About you", sub: locked ? "Name, gender, birthday, married, pets" : CREATOR.first.toLowerCase(), href: "/creater/profile/about" },
    { icon: "📞", title: "Contact", sub: "WhatsApp, backup email", href: "/creater/profile/contact" },
    { icon: "📍", title: "Delivery address", sub: "Where brands send your kit", href: "/creater/profile/address" },
    { icon: "🎬", title: "What you create", sub: what, href: "/creater/profile/content" },
  ];
  const right = [
    { icon: "🛠️", title: "Skills & resources", sub: "What you're good at and the gear you have", href: "/creater/profile/skills" },
    { icon: "💙", title: "Dream brands", sub: "Brands you'd love to work with", href: "/creater/profile/dream-brands" },
    { icon: "🤝", title: "Your terms & rate card", sub: locked ? "Barter, paid, hybrid · Reel, Story, Post rates" : termsTxt, href: "/creater/profile/terms" },
    { icon: "📸", title: "Instagram & privacy", sub: locked ? "Connect Instagram · what brands see" : `${CREATOR.handle} · what brands see`, href: "/creater/profile/instagram" },
  ];

  const row = (r) => (
    <Link key={r.title} href={r.href} className={`ph-row bx-card ${r.hot ? "is-hot" : ""}`}>
      <span className="ph-row__ic">{r.icon}</span>
      <span className="ph-row__txt">
        <strong>{r.title}</strong>
        <small>{r.sub}</small>
      </span>
      <ChevronRight size={15} />
    </Link>
  );

  return (
    <BountyShell>
      <title>Profile — Bounty</title>

      <div className="ph">
        <div className="ph-col">
          <div className="ph-me">
            <span className="ph-av">
              {useSk ? (
                <img src={sk.img} alt={sk.name} className="ph-av__sk" style={{ background: sk.bg }} />
              ) : locked ? (
                <span className="ph-av__c">C</span>
              ) : (
                <img src={CREATOR.avatar} alt={CREATOR.name} />
              )}
            </span>
            <h1>{locked ? "Creator" : CREATOR.user}</h1>
            {!locked && (
              <p>
                {CREATOR.handle} · {CREATOR.city.toLowerCase()}
              </p>
            )}
          </div>

          <div className="ph-toggle bx-card">
            <span>Use {sk.name} as my profile picture</span>
            <button
              type="button"
              className={`bx-toggle ${useSk ? "is-on" : ""}`}
              aria-pressed={useSk}
              aria-label={`Use ${sk.name} as my profile picture`}
              onClick={() => update({ useSidekickPic: !useSk })}
            />
          </div>

          <Link href="/creater/profile/finish" className="ph-pct bx-card">
            <strong>Profile {locked ? 19 : CREATOR.profilePct}% complete</strong>
            <span className="bx-bar">
              <i style={{ width: `${locked ? 19 : CREATOR.profilePct}%` }} />
            </span>
            <small>{locked ? 13 : 9} things left — tap to finish</small>
          </Link>

          {left.map(row)}
        </div>

        <div className="ph-col">
          {right.map(row)}
          {tip && <RumiTip className="ph-rumi" name={sk.name} img={sk.img} text="Add your city — nearby campaigns show up first." onClose={() => setTip(false)} />}
        </div>
      </div>

      <style>{`
        .ph { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0 71px; max-width: 934px; margin: 4px auto 0; }
        .ph-col { display: flex; flex-direction: column; gap: 12px; }
        .ph-me { text-align: center; padding: 6px 0 4px; }
        .ph-av { display: inline-block; width: 100px; height: 100px; padding: 3px; border-radius: 50%; border: 3px solid var(--bx-rust); background: #fffaf0; }
        .ph-av img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .ph-av img.ph-av__sk { object-fit: contain; padding: 8px; }
        .ph-av__c { display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%; background: var(--bx-gold); font-family: var(--bx-serif); font-size: 46px; font-weight: 600; color: #1e2a1e; }
        .ph-me h1 { margin-top: 10px; font-family: var(--bx-serif); font-size: 24px; font-weight: 600; }
        .ph-me p { margin: 4px 0 0; font-size: 14px; color: var(--bx-text); }
        .ph-toggle { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; font-size: 13.5px; font-weight: 700; }
        .ph-pct { display: block; padding: 16px; }
        .ph-pct strong { display: block; margin-bottom: 10px; font-family: var(--bx-serif); font-size: 17px; font-weight: 600; }
        .ph-pct .bx-bar { display: block; }
        .ph-pct small { display: block; margin-top: 8px; font-family: var(--bx-serif); font-style: italic; font-size: 12.5px; color: var(--bx-muted); }
        .ph-pct:hover, .ph-row:hover { border-color: var(--bx-gold); }
        .ph-row { display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 9px 16px; color: var(--bx-ink); transition: border-color .2s, transform .15s; }
        .ph-row:hover { transform: translateX(2px); }
        .ph-row.is-hot { background: #fff4dc; border-color: var(--bx-gold); }
        .ph-row__ic { width: 28px; font-size: 20px; text-align: center; flex-shrink: 0; }
        .ph-row__txt { flex: 1; min-width: 0; }
        .ph-row__txt strong { display: block; font-family: var(--bx-serif); font-size: 17px; font-weight: 600; }
        .ph-row__txt small { display: block; font-size: 12px; color: var(--bx-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ph-rumi { justify-content: center; margin-top: 6px; }
        .ph-rumi p { max-width: 200px; }
        .ph-rumi button { display: none; }
        @media (max-width: 860px) {
          .ph { grid-template-columns: minmax(0, 1fr); gap: 12px; }
        }
        @media (max-width: 767px) {
          .ph-me { padding-top: 0; }
          /* Mobile: Rumi tip neeche nav ke upar, band karne wala × (Figma) */
          .ph-rumi { position: fixed; left: 16px; right: 16px; bottom: 86px; z-index: 34; margin: 0; }
          .ph-rumi img { display: none; }
          .ph-rumi p { flex: 1; max-width: none; padding-right: 34px; }
          .ph-rumi button { display: grid; position: absolute; right: 12px; top: 50%; transform: translateY(-50%); }
        }
      `}</style>
    </BountyShell>
  );
}
