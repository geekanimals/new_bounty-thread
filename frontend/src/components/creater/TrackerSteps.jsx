"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RumiTip } from "@/components/creater/OnboardShell";
import { useSession, useMyCampaigns, useCovers, coverOf, typeKey, compLine, delivLine, fdate, stepOf, noShip, noteOf, DECLINED, errText } from "@/services/creator";
import { STEPS, TYPE_LABEL, getSidekick } from "@/components/creater/data";
import { ArrowLeft, Check, WhatsApp, FileText, Gift, Film, Calendar } from "@/components/ui/Icons";

/* Har step ka apna page (Back button ek step peeche) — step key → route.
   id = participation_id (har "meri campaign" ka apna id). */
export const stepPath = (id, key, revision = false) => {
  const base = `/creater/my-campaigns/${id}`;
  if (key === "applied" || key === "selected") return base;
  if (key === "draft" && revision) return `${base}/revision`;
  return `${base}/${key}`;
};

/** participation row ka abhi wala page (changes_requested → revision) */
export const currentPath = (m) => stepPath(m.participation_id, stepOf(m), m.stage === "changes_requested");

/**
 * Campaign + uska data (har tracker page isse shuru hota hai) — Supabase: api.get_my_campaigns.
 * → { loading, error, reload, id, m (participation row), c (summary), isPaid, ship, steps, base, afterSign, step }
 */
export function useTracker() {
  const { id } = useParams();
  const covers = useCovers();
  const { loading, list, error, reload } = useMyCampaigns();
  // purane links campaign_id bhi bhejte the — dono se dhoondo
  const m = list.find((x) => String(x.participation_id) === String(id)) || list.find((x) => String(x.campaign_id) === String(id)) || null;
  const base = `/creater/my-campaigns/${m ? m.participation_id : id}`;
  if (!m) return { loading, error, reload, id, m: null, base };
  const ship = !noShip(m);
  // Paid aur Barter + Paid dono mein payment hota hai (hybrid = product bhi + payment bhi)
  const isPaid = !!(m._flow && m._flow.paid) || ["paid", "barter_paid"].includes(m.campaign_type) || ["cash", "hybrid"].includes(m.comp_type);
  // Paid / product-free campaign mein address + package nahi hota (purane noShip)
  const steps = STEPS.filter((x) => ship || (x.key !== "address" && x.key !== "package")).map((x) =>
    x.key === "paid" && !isPaid ? { ...x, label: "Done" } : x
  );
  const t = (m.contract && m.contract.content_days) || (m.terms && m.terms.content_days);
  const c = {
    id: m.campaign_id,
    title: m.campaign || "Campaign",
    brand: m.brand || "",
    type: typeKey(m),
    img: coverOf(m, covers),
    rewardKit: compLine(m),
    deliver: delivLine(m),
    deadline: m.deadline ? `Due ${fdate(m.deadline)}` : t ? `${t} days after ${ship ? "delivery" : "the brief"}` : "Shown in your agreement",
  };
  const afterSign = ship ? `${base}/address` : `${base}/draft`;
  return { loading, error, reload, id: m.participation_id, m, c, isPaid, ship, steps, base, afterSign, step: stepOf(m) };
}

/** data aane tak / nahi mila to (har step page pehle yahi check karta hai) */
export function TrackerWait({ t }) {
  return (
    <>
      <Link href="/creater/my-campaigns" className="bx-back">
        <ArrowLeft size={13} /> My campaigns
      </Link>
      <div className="bx-card ts-wait">
        {t.loading ? (
          <p>Loading your campaign…</p>
        ) : t.error ? (
          <p>
            Couldn&apos;t load: {errText(t.error)}{" "}
            <button type="button" onClick={() => t.reload()}>
              Retry
            </button>
          </p>
        ) : (
          <p>
            This campaign isn&apos;t on your account any more. <Link href="/creater/my-campaigns">Back to My campaigns</Link>
          </p>
        )}
      </div>
      <style>{`
        .ts-wait { max-width: 640px; margin: 10px auto; padding: 22px; text-align: center; font-size: 14px; color: #3e4b52; }
        .ts-wait p { margin: 0; }
        .ts-wait button { border: 0; background: none; padding: 0; font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; }
        .ts-wait a { font-weight: 700; text-decoration: underline; }
      `}</style>
    </>
  );
}

/**
 * Jis step ka page khula hai wo abhi ka step nahi (pehle ho chuka / abhi aaya nahi) →
 * "You're at: X" + abhi wale step ka button. (Back ek step peeche hi jaata hai — auto redirect nahi.)
 */
export function StepMismatch({ t }) {
  const label = (t.steps.find((x) => x.key === t.step) || {}).label || "Overview";
  const declined = DECLINED.includes(t.m.stage);
  return (
    <>
      <span className="ts-ic">👉</span>
      <h2>{declined ? "Not selected this time" : `You’re at: ${label}`}</h2>
      <p>{noteOf(t.m)}</p>
      <Link href={declined ? t.base : currentPath(t.m)} className="bx-btn bx-btn--dark bx-btn--lg">
        {declined ? "See details →" : `Continue: ${label} →`}
      </Link>
    </>
  );
}

/**
 * Tracker ka common frame: "← Campaign overview" (ya My campaigns), stepper,
 * beech mein us step ka card (children), side mein campaign summary + help + Rumi.
 * `t` = useTracker() ka result (page ek hi baar load kare).
 */
export default function TrackerFrame({ t, step, overview = false, children }) {
  const { c, steps, base } = t;
  const [s] = useSession();
  const sk = getSidekick(s.sidekick);
  // abhi ka step — pehle wale sab ✓ (campaign complete ho to sab ✓)
  const nowIdx = t.m.stage === "completed" ? steps.length : steps.findIndex((x) => x.key === (step || t.step));

  return (
    <>
      {overview ? (
        <Link href="/creater/my-campaigns" className="bx-back">
          <ArrowLeft size={13} /> My campaigns
        </Link>
      ) : (
        <Link href={base} className="bx-back">
          <ArrowLeft size={13} /> Campaign overview
        </Link>
      )}

      <div className="ts">
        <div className="ts-main">
          <ol className="ts-stepper" data-scroll>
            {steps.map((st, i) => (
              <li key={st.key} className={i < nowIdx ? "is-done" : i === nowIdx ? "is-now" : ""}>
                <span>{i < nowIdx ? <Check size={11} /> : i + 1}</span>
                <small>{st.label}</small>
              </li>
            ))}
          </ol>
          <section className="bx-card ts-action">{children}</section>
        </div>

        <aside className="ts-side">
          <div className="bx-card ts-sum">
            <img src={c.img} alt="" />
            <div className="ts-sum__body">
              <p className="ts-sum__brand">
                {c.brand} · {TYPE_LABEL[c.type]}
              </p>
              <h1>{c.title}</h1>
              <p>
                <Gift size={13} /> {c.rewardKit}
              </p>
              <p>
                <Film size={13} /> {c.deliver}
              </p>
              <p>
                <Calendar size={13} /> {c.deadline}
              </p>
              <Link href={`${base}#brief`} className="ts-link">
                <FileText size={13} /> Read the brief
              </Link>
            </div>
          </div>
          <Link href="/creater/messages/whatsapp" className="bx-card ts-help">
            <WhatsApp size={18} />
            <span>
              <strong>Questions?</strong>
              <small>Message the Geek team on WhatsApp</small>
            </span>
          </Link>
          <RumiTip name={sk.name} img={sk.img} text="Do the one step on the left — I’ll remind you before any deadline." />
        </aside>
      </div>

      <style>{`
        .ts { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 22px; align-items: start; }
        .ts-stepper { list-style: none; display: flex; margin: 0 0 16px; padding: 14px 16px; border-radius: 16px; background: rgba(251,241,220,.8); border: 1px solid var(--bx-line); overflow-x: auto; scrollbar-width: none; }
        .ts-stepper::-webkit-scrollbar { display: none; }
        .ts-stepper li { position: relative; flex: 1; min-width: 64px; display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; }
        .ts-stepper li::before { content: ""; position: absolute; top: 13px; left: -50%; right: 50%; height: 2px; background: #e2d3b0; }
        .ts-stepper li:first-child::before { display: none; }
        .ts-stepper li.is-done::before, .ts-stepper li.is-now::before { background: var(--bx-teal); }
        .ts-stepper span { position: relative; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: #fffaf0; border: 2px solid #e2d3b0; font-size: 12px; font-weight: 700; color: var(--bx-muted); }
        .ts-stepper li.is-done span { background: var(--bx-teal); border-color: var(--bx-teal); color: #fff; }
        .ts-stepper li.is-now span { border-color: var(--bx-green); background: var(--bx-green); color: var(--bx-cream); box-shadow: 0 0 0 4px rgba(46,156,148,.2); }
        .ts-stepper small { font-size: 11px; font-weight: 600; color: var(--bx-muted); }
        .ts-stepper li.is-now small { color: var(--bx-ink); font-weight: 800; }

        .ts-action { padding: 26px; }
        .ts-action h2 { margin: 10px 0 6px; font-family: var(--bx-serif); font-size: 20px; font-weight: 600; line-height: 1.25; color: #14231a; }
        .ts-action .bx-btn, .ts-help .bx-btn { font-family: var(--bx-jak); }
        .ts-action > p { margin: 0 0 16px; font-size: 14px; color: #3e4b52; line-height: 1.5; }
        .ts-ic { width: 46px; height: 46px; border-radius: 14px; background: #fffaf0; border: 1px solid var(--bx-line); display: grid; place-items: center; font-size: 20px; color: var(--bx-ink); }
        .ts-ic--gold { background: #fbe7b5; }
        .ts-ic--green { background: var(--bx-ok-bg); color: var(--bx-ok); font-weight: 800; }
        .ts-ic--red { background: #f8dcd2; color: var(--bx-red); font-weight: 800; }
        .ts-err { margin: 10px 0 0; font-size: 13px; font-weight: 600; color: var(--bx-red); }
        .ts-note { margin: 0 0 14px; padding: 10px 12px; border-radius: 12px; background: #fffaf0; border: 1px solid var(--bx-line); font-size: 13px; line-height: 1.5; }
        .ts-demo { display: inline-block; border: 1px dashed var(--bx-gold); border-radius: 999px; background: #fffaf0; padding: 8px 14px; font-size: 12.5px; font-weight: 700; color: var(--bx-rust); }
        .ts-demos { display: flex; gap: 8px; flex-wrap: wrap; }
        .ts-mt { margin-top: 14px; }
        .ts-link { display: inline-flex; align-items: center; gap: 5px; margin-top: 10px; font-family: var(--bx-jak); font-size: 13px; font-weight: 700; color: #2e9c94; }

        .ts-side { display: grid; gap: 14px; position: sticky; top: 90px; }
        .ts-sum { overflow: hidden; }
        .ts-sum img { width: 100%; height: 140px; object-fit: cover; }
        .ts-sum__body { padding: 14px 16px 16px; }
        .ts-sum__brand { margin: 0; font-family: var(--bx-jak); font-size: 10.5px; font-weight: 800; letter-spacing: 1.1px; text-transform: uppercase; color: #7a6a4a; }
        .ts-sum h1 { margin: 4px 0 8px; font-family: var(--bx-serif); font-size: 19px; font-weight: 600; line-height: 1.25; color: #14231a; }
        .ts-sum__body > p { display: flex; align-items: center; gap: 7px; margin: 0 0 5px; font-size: 12.5px; }
        .ts-sum__body > p svg { color: var(--bx-rust); flex-shrink: 0; }
        .ts-help { display: flex; align-items: center; gap: 12px; padding: 14px 16px; color: #1c8f4e; }
        .ts-help strong { display: block; font-size: 14px; color: var(--bx-ink); }
        .ts-help small { font-size: 12px; color: var(--bx-text); }
        .ts-help:hover { border-color: var(--bx-gold); }

        @media (max-width: 1023px) {
          .ts { grid-template-columns: minmax(0, 1fr); }
          .ts-side { position: static; }
        }
        @media (max-width: 767px) {
          .ts-stepper { margin: 0 -16px 14px; border-radius: 0; border-left: 0; border-right: 0; }
          .ts-action { padding: 18px; }
          .ts-action h2 { font-size: 20px; }
          .ts-action .bx-btn { width: 100%; }
        }
      `}</style>
    </>
  );
}
