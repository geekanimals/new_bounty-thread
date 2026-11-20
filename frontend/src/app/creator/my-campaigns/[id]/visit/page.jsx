"use client";

import Link from "next/link";
import BountyShell from "@/components/creator/BountyShell";
import TrackerFrame, { useTracker, TrackerWait, StepMismatch } from "@/components/creator/TrackerSteps";
import { safeLink } from "@/services/creator";

const COVER_TXT = { food: "Food / meal", stay: "Stay", entry: "Entry / experience", travel: "Travel", service: "Service / treatment" };
const fday = (d) => (d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }) : "");

/**
 * /creator/my-campaigns/[id]/visit — Physical visit: kahan jaana hai, kab (date + slot), kya covered hai.
 * Team "Visited" mark karti hai → video brief khulta hai, deadline shuru.
 */
export default function VisitStep() {
  const t = useTracker();
  if (!t.m)
    return (
      <BountyShell>
        <TrackerWait t={t} />
      </BountyShell>
    );
  const { c, m } = t;
  const onStep = t.step === "visit";
  const vz = (m._flow && m._flow.visit) || {};
  const bk = m._visit || {};
  const venues = vz.venues || [];
  const days = (m.contract && m.contract.content_days) || (m.terms && m.terms.content_days);

  const body = () => {
    if (!onStep) return <StepMismatch t={t} />;
    return (
      <>
        <span className="ts-ic">📍</span>
        <h2>{bk.missed_at ? "Your visit was missed — we'll set a new date" : bk.visit_on ? "Your visit is booked" : "We're booking your visit"}</h2>
        {bk.visit_on ? (
          <div className="vs-when">
            <b>{fday(bk.visit_on)}</b>
            {bk.slot && <span>{bk.slot}</span>}
          </div>
        ) : (
          <p>Our team will set your date and time soon — it shows here as soon as it&apos;s booked.</p>
        )}
        {venues.map((v, i) => (
          <div key={i} className="vs-place">
            <b>{v.name}</b>
            {(v.address || v.city) && <span>{[v.address, v.city].filter(Boolean).join(", ")}</span>}
            {v.map_url && (
              <a className="bx-btn bx-btn--ghost" href={safeLink(v.map_url)} target="_blank" rel="noopener noreferrer">
                🗺️ Open in Google Maps ↗
              </a>
            )}
          </div>
        ))}
        <ul className="vs-list">
          {(vz.covers || []).length > 0 && <li>Covered for you: {(vz.covers || []).map((k) => COVER_TXT[k] || k).join(", ")}{vz.plus_one ? " · plus one allowed" : ""}</li>}
          {vz.notes && <li>{vz.notes}</li>}
          <li>Shoot your content at the place. Your video brief opens once the team marks you <b>Visited</b>{days ? ` — post within ${days} days of your visit` : ""}.</li>
        </ul>
        {m.video_brief && (
          <Link href={`${t.base}#brief`} className="bx-btn bx-btn--ghost">
            📖 Read the brief before you go
          </Link>
        )}
      </>
    );
  };

  return (
    <BountyShell>
      <title>{`Your visit — ${c.title} — Bounty`}</title>
      <TrackerFrame t={t} step={onStep ? "visit" : undefined}>
        {body()}
      </TrackerFrame>
      <style>{`
        .vs-when { display: flex; flex-direction: column; gap: 2px; margin: 8px 0 12px; padding: 12px 14px; border-radius: 12px; background: #fbe7b5; }
        .vs-when b { font-family: var(--bx-serif); font-size: 18px; color: #14231a; }
        .vs-when span { font-size: 14px; font-weight: 700; color: #8a5d14; }
        .vs-place { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin: 10px 0; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--bx-line); background: #fff; }
        .vs-place b { font-size: 15px; color: #14231a; }
        .vs-place span { font-size: 13.5px; color: var(--bx-muted); }
        .vs-list { margin: 10px 0 14px; padding-left: 18px; font-size: 13.5px; line-height: 1.6; color: #14231a; }
      `}</style>
    </BountyShell>
  );
}
