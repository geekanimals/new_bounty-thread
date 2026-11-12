"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import BountyShell, { ConnectInstagramSheet } from "@/components/creater/BountyShell";
import { RumiTip } from "@/components/creater/OnboardShell";
import { useSession } from "@/components/creater/session";
import { getCampaign, getMyCampaign, TYPE_LABEL, BRIEF, getSidekick } from "@/components/creater/data";
import { ArrowLeft, Gift, Film, Users, Calendar, ShieldCheck, Megaphone, Lock, FileText, ChevronDown } from "@/components/ui/Icons";

const JOURNEY_ICONS = ["✎", "✓", "📦", "🎬", "📊"];

/** /creater/discover/[id] — campaign ka brief + Apply (locked ho to Instagram connect sheet) */
export default function CampaignBrief() {
  const { id } = useParams();
  const c = getCampaign(id);
  const [s] = useSession();
  const mine = getMyCampaign(id);
  const [applied, setApplied] = useState(Boolean(mine && !mine.notSelected));
  const [why, setWhy] = useState(false);
  const [briefOpen, setBriefOpen] = useState(true);
  const [sheet, setSheet] = useState(false);
  if (!c) notFound();

  const locked = !s.ig;
  const sk = getSidekick(s.sidekick);

  return (
    <BountyShell>
      <title>{`${c.title} — Bounty`}</title>

      <div className="cb">
        {/* ---------- Left: details ---------- */}
        <section className="cb-left">
          <Link href="/creater/discover" className="cb-back">
            <ArrowLeft size={13} /> Back to campaigns
          </Link>
          <div className="cb-img">
            <img src={c.img} alt="" />
            <span className="cb-type">{TYPE_LABEL[c.type]}</span>
          </div>
          <h1 className="cb-title">{c.title}</h1>
          <p className="cb-brand">{c.brand}</p>

          <div className="cb-grid">
            <div className="cb-box">
              <Gift size={16} />
              <span>
                <strong>{c.rewardKit}</strong>
                <small>{c.rewardNote}</small>
              </span>
            </div>
            <div className="cb-box">
              <Film size={16} />
              <span>
                <strong>{c.deliver}</strong>
                <small>Submit draft for approval</small>
              </span>
            </div>
            <div className="cb-box cb-box--wide">
              <Users size={15} />
              <span>
                <b>Who can apply:</b> {c.who}
              </span>
            </div>
            <div className="cb-box">
              <Calendar size={15} />
              <span>
                <b>Deadline:</b>
                <small>{c.deadline}</small>
              </span>
            </div>
            <div className="cb-box">
              <ShieldCheck size={15} />
              <span>
                <b>Usage rights:</b>
                <small>{c.usage}</small>
              </span>
            </div>
            <div className="cb-box">
              <Megaphone size={15} />
              <span>
                <b>Collab post:</b>
                <small>{c.collab}</small>
              </span>
            </div>
            <div className="cb-box">
              <Lock size={15} />
              <span>
                <b>Exclusivity:</b>
                <small>{c.excl}</small>
              </span>
            </div>
          </div>

          <ol className="cb-journey">
            {BRIEF.journey.map((j, i) => (
              <li key={j}>
                <span>{JOURNEY_ICONS[i]}</span>
                {j}
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Right: apply + brief ---------- */}
        <section className="cb-right">
          <div className="cb-cta">
            {locked ? (
              <>
                <button type="button" className="bx-btn bx-btn--sky bx-btn--lg bx-btn--block" onClick={() => setSheet(true)}>
                  Apply to campaign →
                </button>
                <p>We’ll ask for Instagram only when you apply.</p>
              </>
            ) : applied ? (
              <>
                <div className="cb-done">✓ Applied</div>
                <p>
                  The brand is reviewing creators. <Link href={`/creater/my-campaigns/${c.id}`}>Track it in My campaigns →</Link>
                </p>
              </>
            ) : c.eligible ? (
              <>
                <button type="button" className="bx-btn bx-btn--sky bx-btn--lg bx-btn--block" onClick={() => setApplied(true)}>
                  Apply to campaign →
                </button>
                <p>You review and accept terms if selected.</p>
              </>
            ) : (
              <>
                <button type="button" className="bx-btn bx-btn--cream bx-btn--lg bx-btn--block" onClick={() => setWhy(!why)} aria-expanded={why}>
                  Not eligible — see why
                </button>
                {why ? (
                  <p className="cb-why">
                    ✗ {c.why}
                    <br />
                    <Link href="/creater/discover">Find campaigns that fit you →</Link>
                  </p>
                ) : (
                  <p>You review and accept terms if selected.</p>
                )}
              </>
            )}
          </div>

          <div className="bx-card cb-brief">
            <button type="button" className="cb-brief__head" onClick={() => setBriefOpen(!briefOpen)} aria-expanded={briefOpen}>
              <FileText size={15} /> Read full creative brief
              <ChevronDown size={15} />
            </button>
            {briefOpen && (
              <div className="cb-brief__body">
                <p className="cb-k">Deliverables</p>
                <p className="cb-v">{c.deliver}</p>
                <p className="cb-terms">ⓘ Terms &amp; disclosure</p>
                <ul>
                  <li>
                    Post within <b>7 days</b> of receiving the product
                  </li>
                  <li>
                    Submit your video in the app first — post <b>only after the brand approves it</b>
                  </li>
                  <li>
                    Ad rights: the brand may use your content for <b>{c.usage}</b>
                  </li>
                  <li>
                    Add the brand as an Instagram <b>collaborator</b> on the post
                  </li>
                  {c.type !== "barter" && (
                    <li>
                      <b>Paid:</b> your fee is written into your own agreement
                    </li>
                  )}
                  <li>Disclose the collaboration (Paid partnership / #ad) as per ASCI</li>
                </ul>
                <p className="cb-k">Cities</p>
                <p className="cb-v">{c.city}</p>
              </div>
            )}
          </div>

          <RumiTip className="cb-rumi" name={sk.name} img={sk.img} text="The deadline starts after delivery — read the brief first." />
        </section>
      </div>

      <ConnectInstagramSheet open={sheet} onClose={() => setSheet(false)} />

      <style>{`
        .cb { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 22px; align-items: start; }
        .cb-left { padding: 0; }
        .cb-back { display: inline-flex; align-items: center; gap: 6px; margin: 10px 0 10px; font-size: 14px; font-weight: 700; color: #14231a; }
        .cb-back:hover { color: #b8401f; }
        .cb-img { position: relative; height: 185px; border-radius: 4px; overflow: hidden; }
        .cb-img img { width: 100%; height: 100%; object-fit: cover; }
        .cb-type { position: absolute; left: 0; bottom: 12px; padding: 4px 10px; border-radius: 0 999px 999px 0; background: rgba(20,35,26,.9); border: 1px solid #3fd9e8; border-left: 0; color: #3fd9e8; font-family: var(--bx-jak); font-size: 10px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase; }
        .cb-title { margin-top: 18px; text-align: center; font-family: var(--bx-serif); font-size: 30px; font-weight: 600; line-height: 1.2; color: #14231a; }
        .cb-brand { margin: 2px 0 18px; text-align: center; font-family: var(--bx-serif); font-size: 15px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; color: #3e4b52; }
        .cb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .cb-box { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; background: #f3e4c3; border: 1px solid #e2d0a8; font-size: 12px; line-height: 1.4; color: #4a4436; }
        .cb-box svg { flex-shrink: 0; margin-top: 2px; color: #c0702a; }
        .cb-box strong { display: block; font-family: var(--bx-serif); font-size: 15px; font-weight: 600; line-height: 1.2; color: #14231a; }
        .cb-box small { display: block; font-size: 12px; color: #4a4436; }
        .cb-box b { font-size: 13px; font-weight: 700; color: #14231a; }
        .cb-box--wide { grid-column: 1 / -1; }
        .cb-journey { list-style: none; margin: 20px 0 0; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; text-align: center; font-size: 11.5px; font-weight: 500; color: #14231a; }
        .cb-journey span { display: grid; place-items: center; width: 36px; height: 36px; margin: 0 auto 5px; border-radius: 50%; border: 1px solid var(--bx-line); background: #fffaf0; font-size: 14px; }

        .cb-right { display: grid; gap: 14px; position: sticky; top: 90px; }
        .cb-cta { margin-top: 74px; padding: 14px 14px 12px; border-radius: 14px; background: #3d2f22; color: var(--bx-cream); text-align: center; }
        .cb-cta .bx-btn { height: 56px; font-family: var(--bx-jak); font-size: 19px; font-weight: 800; letter-spacing: -0.1px; color: #0b2530; }
        .cb-cta p { margin: 12px 0 0; font-size: 12px; font-weight: 500; color: #fbf3e2; line-height: 1.5; }
        .cb-cta a { color: var(--bx-gold-2); font-weight: 700; text-decoration: underline; }
        .cb-why { color: #ffd3c4 !important; }
        .cb-done { height: 50px; border-radius: 999px; background: var(--bx-ok-bg); color: var(--bx-ok); display: grid; place-items: center; font-size: 16px; font-weight: 800; }

        .cb-brief { padding: 2px 14px 14px; border-radius: 12px; background: #f6e8c9; border: 1px solid #e2d3b0; box-shadow: none; }
        .cb-brief__head { display: flex; align-items: center; gap: 8px; width: 100%; padding: 12px 0; border: 0; background: none; font-family: var(--bx-serif); font-size: 16px; font-weight: 600; text-align: left; color: #14231a; }
        .cb-brief__head svg:last-child { margin-left: auto; transition: transform .2s; }
        .cb-brief__head[aria-expanded="true"] svg:last-child { transform: rotate(180deg); }
        .cb-brief__body { padding-bottom: 4px; }
        .cb-v { margin: 0; font-size: 13.5px; color: #14231a; }
        .cb-terms { margin: 12px 0 6px; font-size: 13px; font-weight: 500; color: #14231a; }
        .cb-brief li { margin-bottom: 4px; }
        .cb-brief li b { font-weight: 700; }
        .cb-k { margin: 10px 0 4px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #8a6b32; }
        .cb-brief ul { margin: 0; padding-left: 17px; font-size: 13px; line-height: 1.5; color: #14231a; }
        .cb-brief__more { display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; border: 0; background: none; padding: 0; font-size: 12.5px; font-weight: 700; color: var(--bx-teal); }
        .cb-rumi { justify-content: center; }

        @media (max-width: 1023px) {
          .cb { grid-template-columns: minmax(0, 1fr); }
          .cb-right { position: static; }
          .cb-cta { margin-top: 0; }
        }
        @media (max-width: 767px) {
          .cb-cta { margin-top: 0; }
          .cb-cta .bx-btn { font-size: 16px; }
          .cb-back { font-family: var(--bx-jak); font-size: 13px; margin-top: 4px; }
          .cb-img { height: 200px; margin: 0 -16px; border-radius: 0; }
          .cb-title { font-size: 26px; }
          .cb-journey { font-size: 10.5px; font-weight: 600; }
          .cb-title { font-size: 26px; }
          .cb-journey span { width: 32px; height: 32px; }
        }
      `}</style>
    </BountyShell>
  );
}
