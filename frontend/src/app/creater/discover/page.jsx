"use client";

import { useState } from "react";
import BountyShell from "@/components/creater/BountyShell";
import CampaignCard from "@/components/creater/CampaignCard";
import { RumiTip } from "@/components/creater/OnboardShell";
import Link from "next/link";
import { useSession } from "@/components/creater/session";
import { CAMPAIGNS, MY_CAMPAIGNS, getSidekick } from "@/components/creater/data";
import { ChevronDown } from "@/components/ui/Icons";

const FILTERS = [
  { key: "for", label: "For you" },
  { key: "paid", label: "Paid" },
  { key: "barter", label: "Barter" },
  { key: "both", label: "Paid + Barter" },
];
const FIRST = 6;

/** /creater/discover — "Made for your world": saari campaigns, filter ke saath */
export default function Discover() {
  const [s] = useSession();
  const locked = !s.ig;
  const sk = getSidekick(s.sidekick);
  const [f, setF] = useState("for");
  const [shown, setShown] = useState(FIRST);
  const applied = new Set(MY_CAMPAIGNS.filter((m) => !m.notSelected).map((m) => m.id));

  // Filter: For you = sab, Paid, Barter, Paid + Barter = hybrid
  const list = CAMPAIGNS.filter((c) =>
    f === "paid" ? c.type === "paid" : f === "barter" ? c.type === "barter" : f === "both" ? c.type === "hybrid" : true
  );

  return (
    <BountyShell tone="forest">
      <title>Discover — Bounty</title>

      <h1 className="dc-title">Made for your world.</h1>
      <p className="dc-sub">Campaigns that match your style</p>

      <div className="dc-filters" data-scroll>
        {FILTERS.map((x) => (
          <button
            key={x.key}
            type="button"
            className={`dc-pill ${f === x.key ? "is-on" : ""}`}
            onClick={() => {
              setF(x.key);
              setShown(FIRST);
            }}
          >
            {x.label}
          </button>
        ))}
      </div>

      {locked && (
        <div className="dc-lock">
          <span aria-hidden="true">📸</span>
          <p>Instagram not connected — explore everything. We&apos;ll ask only when you apply.</p>
          <Link href="/creater/onboarding/meta">Connect</Link>
        </div>
      )}

      {list.length === 0 ? (
        <p className="dc-empty">No campaigns in this filter right now — check back soon.</p>
      ) : (
        <div className="dc-grid">
          {list.slice(0, shown).map((c) => (
            <CampaignCard
              key={c.id}
              c={c}
              href={`/creater/discover/${c.id}`}
              locked={locked}
              applied={!locked && applied.has(c.id)}
              mobile={locked || f !== "for" ? "dark" : "compact"}
            />
          ))}
        </div>
      )}

      {shown < list.length && (
        <div className="dc-more">
          <button type="button" className="bx-btn bx-btn--ghost" onClick={() => setShown(list.length)}>
            Load more <ChevronDown size={14} />
          </button>
        </div>
      )}

      <RumiTip
        className="dc-rumi"
        name={sk.name}
        img={sk.img}
        text={locked ? "Explore freely — I'll ask for Instagram only when you apply." : "A high match isn't always eligible — check the reasons in each brief."}
      />

      <style>{`
        /* Desktop (Figma: 2 · Discover campaigns) */
        .dc-title { margin: 12px 0 0; text-align: center; font-family: var(--bx-serif); font-size: 34px; font-weight: 600; letter-spacing: -0.3px; line-height: 1.2; color: #14231a; }
        .dc-sub { margin: 4px 0 0; text-align: center; font-size: 14px; color: #3e4b52; }
        .dc-filters { display: flex; justify-content: center; gap: 8px; margin: 22px 0 22px; overflow-x: auto; scrollbar-width: none; }
        .dc-filters::-webkit-scrollbar { display: none; }
        .dc-pill { flex-shrink: 0; height: 38px; padding: 0 18px; border-radius: 999px; border: 1px solid #e2d3b0; background: #fffaf0; font-size: 15px; font-weight: 500; color: #14231a; }
        .dc-pill.is-on { background: #123524; border-color: #123524; color: #fbf3e2; }
        .dc-lock { display: flex; align-items: center; gap: 10px; width: fit-content; max-width: 100%; margin: -6px auto 22px; padding: 8px 8px 8px 14px; border-radius: 14px; background: rgba(20,35,26,.86); border: 1px solid rgba(232,176,74,.5); }
        .dc-lock span { font-size: 16px; }
        .dc-lock p { margin: 0; font-size: 11.5px; font-weight: 500; color: #fbf3e2; line-height: 1.35; }
        .dc-lock a { flex-shrink: 0; display: inline-flex; align-items: center; height: 30px; padding: 0 14px; border-radius: 999px; border: 1.5px solid #3fd9e8; font-family: var(--bx-jak); font-size: 12px; font-weight: 700; color: #fbf3e2; }
        .dc-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; }
        .dc-empty { margin: 30px auto; text-align: center; font-size: 14px; color: #3e4b52; }
        .dc-more { display: flex; justify-content: center; margin-top: 22px; }
        .dc-rumi { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 24px; }
        .dc-rumi img { width: 56px; height: 56px; object-fit: contain; }
        .dc-rumi p { margin: 0; max-width: 250px; padding: 10px 14px; border-radius: 16px; background: #fffdf6; border: 1px solid #e2d3b0; font-family: var(--bx-serif); font-style: italic; font-size: 13.5px; line-height: 1.4; color: #14231a; box-shadow: 0 8px 20px -14px rgba(0,0,0,.45); }
        .dc-rumi b { font-style: normal; font-weight: 700; color: #b8452f; }

        @media (max-width: 1100px) { .dc-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        /* Mobile (Figma: dark jungle) */
        @media (max-width: 767px) {
          .dc-title { margin-top: 12px; font-size: 34px; color: #fbf3e2; }
          .dc-sub { color: #d9cdb2; }
          .dc-filters { justify-content: flex-start; margin: 18px -16px 18px; padding: 0 16px; }
          .dc-pill { height: 38px; padding: 0 18px; font-size: 14px; background: transparent; border: 1.5px solid rgba(246,217,139,.6); color: #fbf3e2; }
          .dc-pill.is-on { background: rgba(34,184,230,.14); border-color: #2bc0e4; color: #fbf3e2; }
          .dc-lock { margin: 0 0 16px; width: 100%; }
          .dc-empty { color: #fbf3e2; }
          .dc-grid { grid-template-columns: minmax(0, 1fr); gap: 14px; }
          .dc-rumi p { font-size: 12.5px; }
        }
      `}</style>
    </BountyShell>
  );
}
