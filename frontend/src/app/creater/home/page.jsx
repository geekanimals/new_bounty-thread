"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import CampaignCard from "@/components/creater/CampaignCard";
import { useSession, useMyIg, isLive, needsMe, stepOf, STAGE_TXT, STAGE_SHORT, profileProgress, homeCard, coverOf, useMyCampaignRows, useOpenCampaigns, useMyProfile, useProfileRequirements, useCovers } from "@/services/creator";
import { RumiTip } from "@/components/creater/OnboardShell";
import { STEPS, DREAM_BRANDS, TYPE_LABEL, getSidekick } from "@/components/creater/data";
import { ArrowRight } from "@/components/ui/Icons";

/* stage → card par chhoti line (Figma "note") */
const stageNote = (m) => STAGE_TXT[m.stage] || String(m.stage || "").replace(/_/g, " ");

/**
 * /creater/home — "Your next move" (Figma: 1 · Home — desktop + mobile)
 * Data purane Bounty home jaisa: get_my_campaigns · list_open_campaigns · get_my_profile · get_profile_requirements · campaign_covers
 * + Instagram (social_accounts). Locked = Instagram abhi connect nahi.
 */
export default function CreatorHome() {
  const [s] = useSession(); // sirf sidekick (Pip/Rumi…) ke liye
  const sk = getSidekick(s.sidekick);
  const ig = useMyIg();
  const mine = useMyCampaignRows();
  const open = useOpenCampaigns();
  const prof = useMyProfile();
  const req = useProfileRequirements();
  const covers = useCovers();
  const locked = !ig.loading && !ig.acct;

  // Greeting browser ke time se (prerender par Date nahi)
  const [greet, setGreet] = useState("Hello");
  useEffect(() => {
    const h = new Date().getHours();
    setGreet(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  const p = prof.data || {};
  // naam: profile → Instagram ka naam → Instagram username ("creator" sirf tab jab kuch na ho)
  const firstName = String((p.personal || {}).first_name || (p.professional || {}).display_name || ig.acct?.name || ig.acct?.username || "").split(" ")[0];
  // campaigns sirf us Instagram account ki jo khula hai (purane app jaisa)
  const handle = String(ig.acct?.username || "").toLowerCase();
  const myList = (Array.isArray(mine.data) ? mine.data : []).filter((c) => !c.applied_profile || !handle || String(c.applied_profile).toLowerCase().replace(/^@/, "") === handle);
  const running = myList.filter(isLive);
  const yours = needsMe(myList);
  const progress = profileProgress(req.data, prof.data, !!ig.acct);
  const openList = open.list;
  const fresh = openList.filter((x) => !x.my_stage && !x.applications_closed).map((x) => homeCard(x, covers)).sort((a, b) => a.elig - b.elig);
  const picks = fresh.slice(0, 3);
  const first = picks[0];
  const firstOk = !locked && first?.eligible;
  const dreams = Array.isArray(p.dream_brands) ? p.dream_brands.slice(0, 5) : [];
  // dream brand ki photo (naam match ho to apni photo, warna naam)
  const dreamImg = (x) => DREAM_BRANDS.find((b) => b.name.toLowerCase().replace(/[^a-z]/g, "") === String(x.submitted_brand_name || "").toLowerCase().replace(/[^a-z]/g, ""))?.img;

  // "Next step" card — purane buildHome jaisa ek hi kaam jo abhi zaroori hai
  let act;
  if (locked) act = { tag: "Action needed", red: true, t: "Connect Instagram to apply", s: "Explore freely — brands check real reach when you apply.", b: "Connect Instagram", href: "/creater/onboarding/meta" };
  else if (yours[0]) act = { tag: "Action needed", red: true, t: `${yours[0].brand ? yours[0].brand + " · " : ""}${STAGE_SHORT[yours[0].stage] || yours[0].campaign || "Campaign"}`, s: stageNote(yours[0]), b: "Open brief", href: `/creater/my-campaigns/${yours[0].participation_id || yours[0].campaign_id}` };
  else if (progress && !progress.complete) act = { tag: "Next step", t: `Your profile is ${progress.pct}% complete`, s: "Brands pick complete profiles first", b: "Finish profile", href: "/creater/profile/finish" };
  else act = { tag: "Next step", t: "Find your next campaign", s: `${fresh.length} campaigns open for you`, b: "Explore campaigns", href: "/creater/discover" };
  const loading = mine.loading || ig.loading;

  // Chal rahi campaigns ki list (desktop card + mobile box dono mein)
  const runningList = (
    <ul className="hm-list">
      {running.slice(0, 4).map((m) => {
        const idx = STEPS.findIndex((x) => x.key === stepOf(m.stage));
        return (
          <li key={m.participation_id || m.campaign_id}>
            <Link href={`/creater/my-campaigns/${m.participation_id || m.campaign_id}`}>
              <img
                src={coverOf({ campaign_id: m.campaign_id, brand: m.brand, name: m.campaign, product: m.product, category: m.category }, covers)}
                alt=""
                onError={(e) => (e.currentTarget.src = coverOf({ brand: m.brand, name: m.campaign, product: m.product, category: m.category }))}
              />
              <span className="hm-list__txt">
                <strong>{m.campaign || "Campaign"}</strong>
                <small className={m.stage === "changes_requested" ? "is-red" : ""}>{stageNote(m)}</small>
                <span className="hm-steps" aria-label={`Step ${idx + 1} of ${STEPS.length}`}>
                  {STEPS.map((st, i) => (
                    <i key={st.key} className={i <= idx ? "is-on" : ""} />
                  ))}
                </span>
              </span>
              <ArrowRight size={14} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
  const emptyRun = <p className="hm-empty">{loading ? "Loading your campaigns…" : mine.error ? "Couldn't load your campaigns — please refresh the page." : "No active campaigns yet — apply to one below."}</p>;

  return (
    <BountyShell tone="forest">
      <title>Home — Bounty</title>

      <p className="hm-hi">
        {greet}, {firstName ? firstName.toLowerCase() : "creator"}.
      </p>
      <h1 className="hm-title">Your next move.</h1>

      <div className="hm-top">
        {/* Next step */}
        <section className="hm-next">
          <span className={`hm-badge ${act.red ? "hm-badge--red" : ""}`}>{act.tag}</span>
          <h2>{act.t}</h2>
          <p>⏳ {act.s}</p>
          <Link href={act.href} className="hm-cream">
            {act.b} →
          </Link>
        </section>

        {/* Active campaigns — desktop card */}
        <section className="hm-active">
          <div className="hm-active__head">
            <h2>Active campaigns · {running.length} in progress</h2>
            {running.length > 0 && (
              <Link href="/creater/my-campaigns" className="hm-link">
                All <ArrowRight size={12} />
              </Link>
            )}
          </div>
          {running.length === 0 ? emptyRun : runningList}
        </section>
      </div>

      {/* Mobile: Active campaigns (label + box) */}
      <div className="hm-m">
        <p className="hm-label">— Active campaigns —</p>
        <p className="hm-count">{running.length} in progress</p>
        <div className="hm-mbox">{running.length === 0 ? emptyRun : runningList}</div>
      </div>

      {picks.length > 0 && (
        <>
          <p className="hm-label hm-label--world">— Made for your world —</p>

          {/* Desktop: 3 cards */}
          <div className="hm-grid">
            {picks.map((c) => (
              <CampaignCard key={c.id} c={c} href={`/creater/discover/${c.id}`} locked={locked} />
            ))}
          </div>

          {/* Mobile: ek dark campaign card (purane jaisa: eligible / potential / not yet) */}
          <article className="hm-mcamp">
            <img src={first.img} alt="" />
            <div className="hm-mcamp__body">
              <p className="hm-mcamp__eye">Campaign</p>
              <h3>{first.title}</h3>
              <p className="hm-mcamp__type">
                🎁 {TYPE_LABEL[first.type]} · {first.type === "paid" ? "Fee" : "Product"}
              </p>
              <span className={`hm-mcamp__pill ${firstOk ? "is-ok" : ""}`}>{["✓ You match", "Potential match", "✗ Not eligible yet"][locked ? 1 : first.elig]}</span>
              <div className="hm-mcamp__foot">
                <p>{["You can apply now", "Not guaranteed eligible", "Finish your profile to qualify"][locked ? 1 : first.elig]}</p>
                <Link href={`/creater/discover/${first.id}`} className="hm-mcamp__btn">
                  Explore
                </Link>
              </div>
            </div>
          </article>
        </>
      )}

      {/* Mobile: dream brand board */}
      <div className="hm-m">
        <p className="hm-label">— Your dream brand board —</p>
        <div className="hm-mbox hm-dream">
          {dreams.length ? (
            <div className="hm-dream__row">
              {dreams.slice(0, 3).map((b, i) =>
                dreamImg(b) ? <img key={i} src={dreamImg(b)} alt={b.submitted_brand_name} /> : <span key={i} className="hm-dream__name">{b.submitted_brand_name}</span>
              )}
            </div>
          ) : (
            <p>Pick up to 5 brands you&apos;d love to work with — private to you.</p>
          )}
          <Link href="/creater/profile/dream-brands" className="hm-dream__link">
            {dreams.length ? "Edit board →" : "Add dream brands →"}
          </Link>
        </div>
      </div>

      <div className="hm-bottom">
        <section className="hm-kit">
          <h2>Your media kit</h2>
          <p>Your Instagram numbers, ready to send to brands.</p>
          <Link href="/creater/media-kit" className="hm-cream hm-kit__btn">
            View media kit
          </Link>
        </section>
        <RumiTip className="hm-rumi" name={sk.name} img={sk.img} text="Keep your media kit updated for better brand matches!" />
      </div>

      <p className="hm-quote">
        Get discovered by brands you love.
        <br />
        Build the creator career you want.
      </p>

      <style>{`
        /* ---------- Desktop (Figma 1440) ---------- */
        .hm-hi { margin: 2px 0 0; text-align: center; font-size: 14px; color: #3e4b52; }
        .hm-title { margin: 2px 0 0; text-align: center; font-family: var(--bx-serif); font-size: 40px; font-weight: 600; letter-spacing: -0.4px; line-height: 1.2; color: #14231a; }
        .hm-top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 22px; margin-top: 26px; }
        .hm-next { padding: 24px 22px 22px; border-radius: 16px; background: #123524; border: 1px solid rgba(232,176,74,.55); color: #fbf3e2; box-shadow: 0 16px 30px -22px rgba(0,0,0,.6); }
        .hm-badge { display: inline-block; padding: 3px 9px; border-radius: 999px; background: #2e9c94; color: #fff; font-family: var(--bx-jak); font-size: 11px; font-weight: 700; line-height: 1.3; }
        .hm-badge--red { background: #e0392f; }
        .hm-next h2 { margin: 12px 0 6px; font-family: var(--bx-serif); font-size: 20px; font-weight: 600; color: #fbf3e2; }
        .hm-next p { margin: 0 0 18px; font-size: 14px; color: #d9cdb2; }
        .hm-cream { display: inline-flex; align-items: center; height: 38px; padding: 0 18px; border-radius: 999px; background: #fbf3e2; color: #14231a; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; box-shadow: 0 6px 16px -10px rgba(0,0,0,.5); }
        .hm-active { padding: 22px 20px; border-radius: 16px; background: #fbf1dc; border: 1px solid #e6d5ae; }
        .hm-active__head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .hm-active h2 { font-family: var(--bx-serif); font-size: 17px; font-weight: 600; color: #14231a; }
        .hm-link { display: inline-flex; align-items: center; gap: 4px; font-family: var(--bx-jak); font-size: 12.5px; font-weight: 700; color: #2e9c94; white-space: nowrap; }
        .hm-empty { margin: 14px 0 0; font-size: 14.5px; color: #3e4b52; }
        .hm-list { list-style: none; margin: 8px 0 0; padding: 0; }
        .hm-list a { display: flex; align-items: center; gap: 12px; padding: 8px 0; color: #7a6a4a; }
        .hm-list li + li a { border-top: 1px dashed #e2d3b0; }
        .hm-list img { width: 42px; height: 42px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
        .hm-list__txt { flex: 1; min-width: 0; color: #14231a; }
        .hm-list__txt strong { display: block; font-size: 14px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hm-list__txt small { display: block; font-size: 12.5px; color: #3e4b52; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hm-list__txt small.is-red { color: #b8401f; font-weight: 600; }
        .hm-steps { display: flex; gap: 3px; margin-top: 5px; }
        .hm-steps i { flex: 1; max-width: 24px; height: 4px; border-radius: 3px; background: #e6d8b8; }
        .hm-steps i.is-on { background: #2e9c94; }

        .hm-label { margin: 0; text-align: center; font-family: var(--bx-serif); font-size: 12px; font-weight: 600; letter-spacing: 1.7px; text-transform: uppercase; color: #14231a; }
        .hm-label--world { margin: 34px 0 22px; }
        .hm-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; }

        .hm-bottom { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 22px; align-items: center; margin-top: 26px; }
        .hm-kit { padding: 18px 16px; border-radius: 16px; background: #fbf1dc; border: 1px solid #e6d5ae; }
        .hm-kit h2 { font-family: var(--bx-serif); font-size: 17px; font-weight: 600; color: #14231a; }
        .hm-kit p { margin: 12px 0 0; font-size: 14px; color: #14231a; }
        .hm-kit__btn { margin-top: 12px; height: 34px; font-size: 13px; }
        .hm-rumi { display: flex; align-items: center; gap: 10px; }
        .hm-rumi img { width: 56px; height: 56px; object-fit: contain; flex-shrink: 0; }
        .hm-rumi p { margin: 0; padding: 10px 14px; max-width: 240px; border-radius: 16px; background: #fffdf6; border: 1px solid #e2d3b0; font-family: var(--bx-serif); font-style: italic; font-size: 13.5px; line-height: 1.4; color: #14231a; box-shadow: 0 8px 20px -14px rgba(0,0,0,.45); }
        .hm-rumi b { font-style: normal; font-weight: 700; color: #b8452f; }

        /* Mobile-only pieces */
        .hm-m, .hm-mcamp, .hm-quote { display: none; }

        @media (max-width: 1100px) { .hm-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 900px) { .hm-top, .hm-bottom { grid-template-columns: minmax(0, 1fr); } }

        /* ---------- Mobile (Figma 390, dark jungle) ---------- */
        @media (max-width: 767px) {
          .hm-hi { margin: 4px 0 0; color: #d9cdb2; }
          .hm-title { font-size: 34px; letter-spacing: -0.3px; color: #fbf3e2; }
          .hm-top { display: block; margin-top: 18px; }
          .hm-next { padding: 16px 18px 18px; background: rgba(10,34,25,.55); border: 1.5px solid #e8b04a; }
          .hm-next h2 { margin-top: 10px; }
          .hm-next p { margin-bottom: 14px; }
          .hm-active, .hm-grid, .hm-label--world + .hm-grid { display: none; }
          .hm-m { display: block; margin-top: 20px; }
          .hm-label { color: #f6d98b; }
          .hm-count { margin: 3px 0 10px; text-align: center; font-size: 13px; color: #d9cdb2; }
          .hm-mbox { padding: 12px 14px; border-radius: 14px; background: rgba(10,34,25,.6); border: 1px solid rgba(232,176,74,.45); color: #d9cdb2; }
          .hm-mbox .hm-empty { margin: 0; font-size: 14.5px; color: #d9cdb2; }
          .hm-mbox .hm-list { margin: 0; }
          .hm-mbox .hm-list__txt { color: #fbf3e2; }
          .hm-mbox .hm-list__txt small { color: #d9cdb2; }
          .hm-mbox .hm-list li + li a { border-top-color: rgba(232,176,74,.3); }
          .hm-label--world { margin: 22px 0 10px; }

          .hm-mcamp { display: flex; overflow: hidden; border-radius: 16px; background: rgba(10,34,25,.72); border: 1px solid rgba(232,176,74,.45); }
          .hm-mcamp > img { width: 120px; flex-shrink: 0; object-fit: cover; }
          .hm-mcamp__body { flex: 1; min-width: 0; padding: 12px 12px 12px 15px; }
          .hm-mcamp__eye { margin: 0; font-family: var(--bx-jak); font-size: 11px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; color: #e8b04a; }
          .hm-mcamp h3 { margin: 2px 0 4px; font-family: var(--bx-serif); font-size: 17px; font-weight: 600; color: #fbf3e2; }
          .hm-mcamp__type { margin: 0 0 8px; font-size: 13px; color: #d9cdb2; }
          .hm-mcamp__pill { display: inline-block; padding: 3px 10px; border-radius: 999px; border: 1px solid #c55a49; background: rgba(184,64,31,.18); font-family: var(--bx-jak); font-size: 11px; font-weight: 700; color: #f3a08f; }
          .hm-mcamp__pill.is-ok { border-color: #3fae7a; background: rgba(47,143,91,.2); color: #9be3bd; }
          .hm-mcamp__foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; }
          .hm-mcamp__foot p { margin: 0; max-width: 120px; font-family: var(--bx-serif); font-style: italic; font-size: 11.5px; line-height: 1.25; color: #d9cdb2; }
          .hm-mcamp__btn { display: inline-flex; align-items: center; height: 32px; padding: 0 13px; border-radius: 999px; border: 1.5px solid #3fd9e8; color: #fbf3e2; font-family: var(--bx-jak); font-size: 12px; font-weight: 700; }

          .hm-dream { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 15px; }
          .hm-dream__name { display: inline-grid; place-items: center; min-width: 44px; height: 44px; padding: 0 8px; border-radius: 12px; background: rgba(251,243,226,.14); color: #fbf3e2; font-size: 11px; font-weight: 700; }
          .hm-dream p { margin: 0; max-width: 180px; font-size: 14px; line-height: 1.32; color: #fbf3e2; }
          .hm-dream__row { display: flex; gap: 6px; }
          .hm-dream__row img { width: 52px; height: 34px; border-radius: 7px; object-fit: cover; }
          .hm-dream__link { flex-shrink: 0; font-family: var(--bx-jak); font-size: 13px; font-weight: 700; color: #3fd9e8; }

          .hm-bottom { display: block; margin-top: 18px; }
          .hm-kit { padding: 14px 16px 16px; background: rgba(10,34,25,.72); border: 1px solid rgba(232,176,74,.45); }
          .hm-kit h2 { color: #fbf3e2; }
          .hm-kit p { margin: 10px 0 0; font-size: 14px; color: #fbf3e2; }
          .hm-kit__btn { display: inline-flex; height: 32px; margin-top: 12px; padding: 0 14px; font-size: 12px; }
          .hm-rumi { display: none; }
          .hm-quote { display: block; margin: 22px 0 6px; text-align: center; font-family: var(--bx-serif); font-style: italic; font-size: 19px; line-height: 1.37; color: #f6d98b; }
        }
      `}</style>
    </BountyShell>
  );
}
