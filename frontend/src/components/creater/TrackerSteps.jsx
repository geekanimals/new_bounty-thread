"use client";

import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { RumiTip } from "@/components/creater/OnboardShell";
import { useSession } from "@/components/creater/session";
import { STEPS, TYPE_LABEL, getCampaign, getMyCampaign, getSidekick } from "@/components/creater/data";
import { ArrowLeft, Check, WhatsApp, FileText, Gift, Film, Calendar } from "@/components/ui/Icons";

/* Har step ka apna page (Back button ek step peeche) — step key → route */
export const stepPath = (id, key, revision = false) => {
  const base = `/creater/my-campaigns/${id}`;
  if (key === "applied" || key === "selected") return base;
  if (key === "draft" && revision) return `${base}/revision`;
  return `${base}/${key}`;
};

/** Campaign + uska data (har tracker page isse shuru hota hai) */
export function useTracker() {
  const { id } = useParams();
  const m = getMyCampaign(id);
  const c = getCampaign(id);
  if (!m || !c) notFound();
  const isPaid = c.type === "paid";
  // Paid campaign mein address + package nahi hota
  const steps = STEPS.filter((x) => !(isPaid && (x.key === "address" || x.key === "package")));
  const base = `/creater/my-campaigns/${id}`;
  // Address/package ke baad wala step (agreement sign karne par kahan jaana hai)
  const afterSign = isPaid ? `${base}/draft` : `${base}/address`;
  return { id, m, c, isPaid, steps, base, afterSign };
}

/**
 * Tracker ka common frame: "← Campaign overview" (ya My campaigns), stepper,
 * beech mein us step ka card (children), side mein campaign summary + help + Rumi.
 */
export default function TrackerFrame({ step, overview = false, children }) {
  const { c, steps, base } = useTracker();
  const [s] = useSession();
  const sk = getSidekick(s.sidekick);
  const idx = steps.findIndex((x) => x.key === step);

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
              <li key={st.key} className={i < idx ? "is-done" : i === idx ? "is-now" : ""}>
                <span>{i < idx ? <Check size={11} /> : i + 1}</span>
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
              <Link href={`/creater/discover/${c.id}`} className="ts-link">
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
