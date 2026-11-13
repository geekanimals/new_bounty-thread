"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Logo from "@/components/creator/Logo";
import GuestNav from "@/components/creator/GuestNav";
import { RumiTip } from "@/components/creator/OnboardShell";
import { TYPE_LABEL } from "@/components/creator/data";
import { useOpenCampaigns, useCovers, coverOf, typeKey, kindOf, compLine, compSub, delivLine, whoList, fdate, rememberApply, safeLink } from "@/services/creator";
import { Gift, Film, Users, Calendar, ShieldCheck, Sparkle, Lock, ChevronDown } from "@/components/ui/Icons";

const JOURNEY = [
  { icon: "✎", label: "Apply" },
  { icon: "✓", label: "Get selected" },
  { icon: "📦", label: "Receive kit" },
  { icon: "🎬", label: "Create" },
  { icon: "📊", label: "Your analytics" },
];

/**
 * /creator/explore/[id] — guest campaign brief (public.explore_campaigns).
 * Apply → WhatsApp verify (login); login ke baad yahi campaign khulta hai (purana localStorage "geek_apply").
 */
export default function GuestBrief() {
  const { id } = useParams();
  const router = useRouter();
  const covers = useCovers();
  const { loading, list } = useOpenCampaigns({ publicList: true });
  const x = useMemo(() => list.find((r) => String(r.campaign_id) === String(id)), [list, id]);
  const apply = (e) => {
    e.preventDefault();
    rememberApply(id);
    router.push("/creator/login");
  };

  if (loading || !x)
    return (
      <div className="gb">
        <main className="gb-main">
          <Link href="/creator/explore" className="bx-back">
            ← Back to campaigns
          </Link>
          <p style={{ textAlign: "center", margin: "40px 0", fontSize: 14 }}>{loading ? "Loading brief…" : "This campaign isn't open any more."}</p>
        </main>
      </div>
    );

  const k = kindOf(x);
  const noProd = k === "paid";
  const t = x.terms || {};
  const b = x.video_brief || {};
  const who = whoList(x);
  const tags = [].concat(x.hashtags || [], (x.mentions || []).map((m) => (String(m).charAt(0) === "@" ? m : "@" + m)));
  const c = {
    title: x.name || "Campaign",
    brand: x.brand || "",
    img: coverOf(x, covers),
    type: typeKey(x),
    rewardKit: compLine(x),
    rewardNote: compSub(x),
    deliver: delivLine(x),
    who: who.length ? who.join(" • ") : "Open to every creator",
    deadline: t.content_days ? `${t.content_days} days after ${noProd ? "the brief" : "delivery"}` : x.ends_on ? `Till ${fdate(x.ends_on)}` : "Shown in your agreement",
    usage: t.ad_rights_months ? `${t.ad_rights_months} month${t.ad_rights_months > 1 ? "s" : ""}` : "None",
    collab: t.collab_rights ? "Required" : "Not required",
    excl: t.exclusivity || "None",
    city: (x.cities || []).join(", "),
  };
  const line = (label, v) =>
    v ? (
      <>
        <h3>{label}</h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{v}</p>
      </>
    ) : null;

  return (
    <div className="gb">
      <title>{`${c.title} — Bounty`}</title>

      <header className="gb-head">
        <Link href="/creator/explore" aria-label="Bounty">
          <Logo tone="dark" size={20} />
        </Link>
        <nav className="gb-nav">
          <Link href="/creator/explore" className="is-on">
            Discover
          </Link>
          <Link href="/creator">How it works</Link>
        </nav>
        <Link href="/creator/login" className="bx-btn bx-btn--dark gb-sign">
          <span className="gb-sign__full">Sign in with WhatsApp</span>
          <span className="gb-sign__short">Sign in</span>
        </Link>
      </header>

      <main className="gb-main">
        <div className="gb-wrap">
          {/* Left: campaign card */}
          <section className="gb-left">
            <Link href="/creator/explore" className="bx-back gb-back">
              ← Back to campaigns
            </Link>
            <div className="gb-img">
              <img src={c.img} alt="" />
              <span>{TYPE_LABEL[c.type]}</span>
            </div>
            <h1 className="gb-title">{c.title}</h1>
            <p className="gb-brand">{c.brand}</p>

            <div className="gb-boxes">
              <div className="gb-box">
                <Gift size={16} />
                <span>
                  <strong>{c.rewardKit}</strong>
                  <small>{c.rewardNote}</small>
                </span>
              </div>
              <div className="gb-box">
                <Film size={16} />
                <span>
                  <strong>{c.deliver}</strong>
                  <small>Submit draft for approval</small>
                </span>
              </div>
              <div className="gb-box gb-box--wide">
                <Users size={15} />
                <span>
                  <b>Who can apply:</b> {c.who}
                </span>
              </div>
              <div className="gb-box">
                <Calendar size={15} />
                <span>
                  <b>Deadline:</b>
                  <small>{c.deadline}</small>
                </span>
              </div>
              <div className="gb-box">
                <ShieldCheck size={15} />
                <span>
                  <b>Usage rights:</b>
                  <small>{c.usage}</small>
                </span>
              </div>
              <div className="gb-box">
                <Sparkle size={15} />
                <span>
                  <b>Collab post:</b>
                  <small>{c.collab}</small>
                </span>
              </div>
              <div className="gb-box">
                <Lock size={15} />
                <span>
                  <b>Exclusivity:</b>
                  <small>{c.excl}</small>
                </span>
              </div>
            </div>

            <ol className="gb-journey">
              {JOURNEY.map((j) => (
                <li key={j.label}>
                  <span>{j.icon}</span>
                  {j.label}
                </li>
              ))}
            </ol>
          </section>

          {/* Right: apply + brief */}
          <section className="gb-right">
            <div className="gb-apply">
              <a href="/creator/login" className="gb-apply__btn" onClick={apply}>
                Verify WhatsApp to apply →
              </a>
              <p>You review and accept terms if selected.</p>
            </div>

            <details className="gb-brief" open>
              <summary>
                📄 Read full creative brief <ChevronDown size={14} />
              </summary>
              <div className="gb-brief__body">
                {line("Brief", x.brief)}
                {line("What to shoot", b.what_to_shoot)}
                {line("Key messages", b.key_messages)}
                {line("Do's", b.dos)}
                {line("Don'ts", b.donts)}
                {line("Caption to use", b.caption)}
                {tags.length > 0 && line("Hashtags & mentions", tags.join(" "))}
                <h3>Deliverables</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>{x.deliverables_text || c.deliver}</p>
                {x.product_link && (
                  <p>
                    <a href={safeLink(x.product_link)} target="_blank" rel="noopener noreferrer">
                      View product ↗
                    </a>
                  </p>
                )}
                {c.city && line("Cities", c.city)}
                {(x.languages || []).length > 0 && line("Languages", x.languages.join(", "))}
                {line("Posting note", b.posting_note)}
                <h4>ⓘ Terms &amp; disclosure</h4>
                <ul>
                  {t.content_days && (
                    <li>
                      Post within <b>{t.content_days} days</b> of {noProd ? "getting the video brief" : "receiving the product"}
                    </li>
                  )}
                  <li>
                    Submit your video in the app first — post <b>only after the brand approves it</b>
                  </li>
                  {t.ad_rights_months && (
                    <li>
                      Ad rights: the brand may use your content for <b>{c.usage}</b>
                    </li>
                  )}
                  {t.collab_rights && (
                    <li>
                      Add the brand as an Instagram <b>collaborator</b> on the post
                    </li>
                  )}
                  {k && k !== "barter" && (
                    <li>
                      <b>Paid:</b> your fee is written into your own agreement
                    </li>
                  )}
                  <li>Disclose the collaboration (Paid partnership / #ad) as per ASCI</li>
                </ul>
              </div>
            </details>

            <RumiTip className="gb-rumi" text="The deadline starts after delivery — read the brief first." />
          </section>
        </div>
      </main>

      <GuestNav active="campaigns" />

      <style>{`
        .gb { min-height: 100vh; }
        .gb-head {
          position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 20px;
          height: 62px; padding: 0 32px; background: rgba(246,235,211,.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--bx-line);
        }
        .gb-nav { flex: 1; display: flex; justify-content: center; gap: 36px; }
        .gb-nav a { font-size: 14px; font-weight: 500; }
        .gb-nav a:hover, .gb-nav .is-on { color: var(--bx-red); }
        .gb-sign__short { display: none; }
        .gb-head .gb-sign { font-family: var(--bx-jak); font-size: 14px; font-weight: 700; }
        .gb-nav a { font-family: var(--bx-sans); }
        .gb-back { font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: #14231a; }
        .gb-main { max-width: 1100px; margin: 0 auto; padding: 22px 32px 60px; }
        .gb-wrap { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 22px; padding: 18px; border-radius: 22px; background: rgba(246,232,201,.75); border: 1px solid var(--bx-line); }
        .gb-img { position: relative; height: 210px; border-radius: 6px; overflow: hidden; }
        .gb-img img { width: 100%; height: 100%; object-fit: cover; }
        .gb-img span { position: absolute; left: 0; bottom: 14px; padding: 3px 10px; background: rgba(20,35,26,.9); border: 1px solid rgba(246,217,139,.6); color: var(--bx-gold-2); font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
        .gb-title { margin-top: 16px; font-family: var(--bx-serif); font-size: 30px; font-weight: 600; line-height: 34.5px; text-align: center; color: #14231a; }
        .gb-brand { margin: 2px 0 14px; font-family: var(--bx-serif); font-size: 15px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; text-align: center; color: #14231a; }
        .gb-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .gb-box { display: flex; gap: 10px; align-items: flex-start; padding: 11px 12px; border-radius: 12px; background: #f4e3c0; border: 1px solid var(--bx-line); font-family: var(--bx-sans); font-size: 12px; line-height: 15.6px; color: #4a4436; }
        .gb-box svg { flex-shrink: 0; margin-top: 2px; color: var(--bx-rust); }
        .gb-box strong { display: block; font-family: var(--bx-serif); font-size: 15px; font-weight: 600; line-height: 18px; color: #14231a; }
        .gb-box small { display: block; margin-top: 1px; font-size: 12px; font-weight: 400; color: #4a4436; }
        .gb-box b { font-size: 13px; font-weight: 700; color: #14231a; }
        .gb-box--wide { grid-column: 1 / -1; }
        .gb-journey { list-style: none; display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin: 16px 0 0; padding: 0; }
        .gb-journey li { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; font-family: var(--bx-sans); font-size: 11.5px; font-weight: 500; line-height: 15px; color: #14231a; }
        .gb-journey span { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--bx-line); background: #fffaf0; display: grid; place-items: center; font-size: 14px; }

        .gb-right { display: flex; flex-direction: column; gap: 12px; }
        .gb-apply { margin-top: 30px; padding: 16px; border-radius: 16px; background: #3b2e22; text-align: center; }
        .gb-apply__btn { display: flex; align-items: center; justify-content: center; height: 56px; border-radius: 999px; background: var(--bx-sky); color: #0b2530; font-family: var(--bx-jak); font-size: 19px; font-weight: 800; letter-spacing: -0.1px; box-shadow: 0 10px 24px -12px rgba(34,184,230,.9); }
        .gb-apply__btn:hover { filter: brightness(1.06); }
        .gb-apply p { margin: 10px 0 0; font-family: var(--bx-sans); font-size: 12px; font-weight: 500; color: #fbf3e2; }
        .gb-brief { border-radius: 14px; background: #f6e8c9; border: 1px solid var(--bx-line); }
        .gb-brief summary { display: flex; align-items: center; gap: 8px; padding: 13px 14px; font-family: var(--bx-serif); font-size: 16px; font-weight: 600; color: #14231a; cursor: pointer; list-style: none; }
        .gb-brief summary::-webkit-details-marker { display: none; }
        .gb-brief summary svg:last-child { margin-left: auto; transition: transform .2s; }
        .gb-brief[open] summary svg:last-child { transform: rotate(180deg); }
        .gb-brief__body { padding: 0 16px 14px; }
        .gb-brief h3 { margin: 8px 0 2px; font-family: var(--bx-sans); font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #8a6b32; }
        .gb-brief p { margin: 0; font-family: var(--bx-sans); font-size: 13.5px; line-height: 19.6px; color: #14231a; }
        .gb-brief h4 { margin: 12px 0 4px; font-family: var(--bx-sans); font-size: 13px; font-weight: 500; color: #14231a; }
        .gb-brief b { font-weight: 700; }
        .gb-brief ul { margin: 0; padding-left: 17px; font-family: var(--bx-sans); font-size: 13px; line-height: 19.5px; color: #14231a; }
        .gb-rumi { justify-content: center; }

        @media (max-width: 900px) { .gb-wrap { grid-template-columns: minmax(0, 1fr); } .gb-apply { margin-top: 0; } }
        @media (max-width: 767px) {
          .gb-head { position: fixed; left: 0; right: 0; padding: 0 16px; justify-content: space-between; }
          .gb-nav { display: none; }
          .gb-head > a:first-child { position: absolute; left: 50%; transform: translateX(-50%); }
          .gb-sign { margin-left: auto; }
          .gb-sign__full { display: none; }
          .gb-sign__short { display: inline; }
          .gb-main { padding: 62px 0 100px; }
          .gb-wrap { padding: 0 16px 16px; border-radius: 0; border: 0; background: none; }
          .gb-img { height: 170px; }
          .gb-left .bx-back { margin: 18px 0 10px; }
        }
      `}</style>
    </div>
  );
}
