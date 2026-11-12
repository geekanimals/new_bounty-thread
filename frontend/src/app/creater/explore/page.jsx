"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/creater/Logo";
import GuestNav from "@/components/creater/GuestNav";
import CampaignCard from "@/components/creater/CampaignCard";
import { VideoModal, RumiTip } from "@/components/creater/OnboardShell";
import { CAMPAIGNS } from "@/components/creater/data";
import { ChevronDown } from "@/components/ui/Icons";

const FILTERS = [
  { key: "all", label: "For you" },
  { key: "paid", label: "Paid" },
  { key: "barter", label: "Barter" },
  { key: "hybrid", label: "Paid + Barter" },
];
const FIRST = 6;

/** /creater/explore — bina login ke campaigns dekho (guest) */
export default function GuestExplore() {
  const [filter, setFilter] = useState("all");
  const [shown, setShown] = useState(FIRST);
  const [video, setVideo] = useState(false);
  const [tip, setTip] = useState(true);

  const list = CAMPAIGNS.filter((c) => filter === "all" || c.type === filter);

  return (
    <div className="gx">
      <title>Explore campaigns — Bounty</title>

      <header className="gx-head">
        <Link href="/creater/explore" aria-label="Bounty">
          <Logo tone="dark" size={20} />
        </Link>
        <nav className="gx-nav">
          <Link href="/creater/explore" className="is-on">
            Discover
          </Link>
          <button type="button" onClick={() => setVideo(true)}>
            How it works
          </button>
        </nav>
        <Link href="/creater/login" className="bx-btn bx-btn--dark gx-sign">
          <span className="gx-sign__full">Sign in with WhatsApp</span>
          <span className="gx-sign__short">Sign in</span>
        </Link>
      </header>

      <main className="gx-main">
        <p className="gx-banner">You&apos;re exploring as a guest — apply with WhatsApp in 30 sec. No Instagram needed to look around.</p>
        <h1 className="bx-title gx-title">Made for your world.</h1>
        <p className="gx-sub">Campaigns that match your style</p>

        <div className="gx-filters" data-scroll>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`bx-pill ${filter === f.key ? "is-on" : ""}`}
              onClick={() => {
                setFilter(f.key);
                setShown(FIRST);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="gx-empty">No campaigns in this filter right now — check back soon.</p>
        ) : (
          <div className="gx-grid">
            {list.slice(0, shown).map((c) => (
              <CampaignCard key={c.id} c={c} href={`/creater/explore/${c.id}`} guest />
            ))}
          </div>
        )}

        {shown < list.length && (
          <div className="gx-more">
            <button type="button" className="bx-btn bx-btn--ghost" onClick={() => setShown(list.length)}>
              Load more <ChevronDown size={14} />
            </button>
          </div>
        )}

        {tip && <RumiTip className="gx-rumi" text="Look around freely — sign in only when you want to apply." onClose={() => setTip(false)} />}
      </main>

      <VideoModal open={video} onClose={() => setVideo(false)} onFind={() => (window.location.href = "/creater/login")} />

      <GuestNav active="home" />

      <style>{`
        .gx { min-height: 100vh; }
        .gx-head {
          position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 20px;
          height: 62px; padding: 0 32px; background: rgba(246,235,211,.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--bx-line);
        }
        .gx-nav { flex: 1; display: flex; justify-content: center; gap: 36px; }
        .gx-nav a, .gx-nav button { border: 0; background: none; padding: 0; font-size: 14px; font-weight: 500; color: var(--bx-ink); }
        .gx-nav a:hover, .gx-nav button:hover, .gx-nav .is-on { color: var(--bx-red); }
        .gx-sign__short { display: none; }
        .gx-main { max-width: 1100px; margin: 0 auto; padding: 18px 32px 60px; }
        .gx-banner { max-width: 600px; margin: 0 auto 26px; padding: 9px 18px; border-radius: 12px; background: #fffaf0; border: 1px solid var(--bx-line); text-align: center; font-family: var(--bx-sans); font-size: 13px; font-weight: 500; line-height: 17px; color: #14231a; }
        /* Figma: Fraunces 44 / DM Sans pills */
        .gx-title { font-size: 44px; line-height: 49.3px; letter-spacing: -0.4px; color: #14231a; }
        .gx-head .gx-sign { font-family: var(--bx-jak); font-size: 14px; font-weight: 700; }
        .gx-nav a, .gx-nav button { font-family: var(--bx-sans); font-weight: 500 !important; }
        .gx-filters .bx-pill { font-family: var(--bx-sans); font-size: 13.5px; font-weight: 600; }
        .gx-sub { margin: 8px 0 18px; text-align: center; font-family: var(--bx-sans); font-size: 14px; font-weight: 400; color: #3e4b52; }
        .gx-filters { display: flex; justify-content: center; gap: 8px; margin-bottom: 22px; overflow-x: auto; scrollbar-width: none; }
        .gx-filters::-webkit-scrollbar { display: none; }
        .gx-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
        .gx-empty { text-align: center; padding: 30px; font-size: 14px; color: var(--bx-text); }
        .gx-more { display: flex; justify-content: center; margin-top: 20px; }
        .gx-rumi { justify-content: center; margin-top: 24px; }

        @media (max-width: 1023px) { .gx-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .gx-nav { gap: 22px; } }
        @media (max-width: 767px) {
          .gx-head { position: fixed; left: 0; right: 0; padding: 0 16px; justify-content: space-between; }
          .gx-nav { display: none; }
          .gx-head > a:first-child { position: absolute; left: 50%; transform: translateX(-50%); }
          .gx-sign { margin-left: auto; }
          .gx-title { font-size: 32px; line-height: 36px; }
          .gx-sign__full { display: none; }
          .gx-sign__short { display: inline; }
          .gx-main { padding: 76px 16px 100px; }
          .gx-filters { justify-content: flex-start; }
          .gx-grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
          .gx-rumi { position: fixed; left: 16px; right: 16px; bottom: 86px; z-index: 34; margin: 0; }
          .gx-rumi img { display: none; }
          .gx-rumi p { flex: 1; }
          .gx-rumi button { position: absolute; right: 12px; }
        }
      `}</style>
    </div>
  );
}
