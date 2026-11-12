"use client";

import { useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import { RumiTip } from "@/components/creater/OnboardShell";
import { useSession } from "@/components/creater/session";
import { MY_CAMPAIGNS, STEPS, TYPE_LABEL, getCampaign, getSidekick } from "@/components/creater/data";
import { ArrowRight } from "@/components/ui/Icons";
import { stepPath } from "@/components/creater/TrackerSteps";

const JOURNEY_FILTERS = ["All", "Action needed", "In progress", "Completed", "Applied", "Not selected"];
const FILTERS = [
  { key: "running", label: "🟢 Running now" },
  { key: "waiting", label: "⏳ Applied / waiting" },
  { key: "done", label: "🏁 Completed" },
  { key: "not", label: "Not selected" },
  { key: "all", label: "All time" },
];

// Har stage par creator ko kya karna hai (button ka text)
const NEXT = {
  applied: "View status",
  selected: "Accept offer",
  agreement: "Sign agreement",
  address: "Confirm address",
  package: "Track package",
  draft: "Submit draft",
  post: "Add post link",
  verified: "See payment",
  paid: "View summary",
};

/** /creater/my-campaigns — jin campaigns par apply kiya: running, waiting, completed */
export default function MyCampaigns() {
  const [s] = useSession();
  const locked = !s.ig;
  const sk = getSidekick(s.sidekick);
  const [f, setF] = useState("all");
  const mine = locked ? [] : MY_CAMPAIGNS;
  const count = (k) => (k === "all" ? mine.length : mine.filter((m) => m.group === k).length);
  const list = f === "all" ? mine : mine.filter((m) => m.group === f);

  return (
    <BountyShell>
      <title>My campaigns — Bounty</title>

      {mine.length === 0 ? (
        <>
          {/* Naya creator (Figma: 10 · My campaigns — empty) */}
          <p className="mc-eye">Your creator journey</p>
          <h1 className="mc-h1">My campaigns</h1>
          <p className="mc-lede">Every collaboration, all in one place.</p>
          <div className="mc-filters" data-scroll>
            {JOURNEY_FILTERS.map((x, i) => (
              <button key={x} type="button" className={`mc-pill ${i === 0 ? "is-on" : ""}`}>
                {x} <em>00</em>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <section className="mc-head">
            <h1>My campaigns</h1>
            <p>Everything you applied to — what&apos;s running now, what&apos;s waiting, and your full campaign history.</p>
          </section>

          <div className="mc-filters" data-scroll>
            {FILTERS.map((x) => (
              <button key={x.key} type="button" className={`mc-pill ${f === x.key ? "is-on" : ""}`} onClick={() => setF(x.key)}>
                {x.label} <em>{count(x.key)}</em>
              </button>
            ))}
          </div>
        </>
      )}

      {list.length === 0 ? (
        <div className="mc-empty">
          {mine.length === 0 ? (
            <p>
              No campaigns yet. Open <Link href="/creater/discover">Campaigns</Link>, apply to one — it shows up here with every next step.
            </p>
          ) : (
            <p>Nothing here right now. Open <Link href="/creater/discover">Campaigns</Link> to find your next one.</p>
          )}
        </div>
      ) : (
        <ul className="mc-list">
          {list.map((m) => {
            const c = getCampaign(m.id);
            const idx = STEPS.findIndex((x) => x.key === m.stage);
            const pill = m.notSelected ? ["Not selected", "red"] : m.group === "done" ? ["Completed", "green"] : m.revision ? ["Revision requested", "red"] : [STEPS[idx].label, "teal"];
            return (
              <li key={m.id} className="bx-card mc-item">
                <Link href={`/creater/my-campaigns/${m.id}`} className="mc-img">
                  <img src={c.img} alt="" />
                  <span>{TYPE_LABEL[c.type]}</span>
                </Link>
                <div className="mc-body">
                  <div className="mc-top">
                    <p className="mc-brand">{c.brand}</p>
                    <span className={`bx-tag bx-tag--${pill[1]}`}>{pill[0]}</span>
                  </div>
                  <h2>
                    <Link href={`/creater/my-campaigns/${m.id}`}>{c.title}</Link>
                  </h2>
                  <p className={`mc-note ${m.revision || m.notSelected ? "is-red" : ""}`}>{m.note}</p>
                  {!m.notSelected && (
                    <div className="mc-steps" aria-label={`Step ${idx + 1} of ${STEPS.length}`}>
                      {STEPS.map((st, i) => (
                        <span key={st.key} className={i <= idx ? "is-on" : ""} title={st.label}>
                          <i />
                          <small>{st.label}</small>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mc-foot">
                    <small>
                      {m.date} · {c.reward}
                    </small>
                    <Link href={m.group === "running" ? stepPath(m.id, m.stage, m.revision) : `/creater/my-campaigns/${m.id}`} className={`bx-btn bx-btn--sm ${m.group === "running" ? "bx-btn--dark" : "bx-btn--ghost"}`}>
                      {m.notSelected ? "See why" : NEXT[m.stage]} <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RumiTip className="mc-rumi" name={sk.name} img={sk.img} text="Running campaigns show the one thing you need to do next — do it before the deadline." />

      <style>{`
        .mc-eye { margin: 14px 0 0; text-align: center; font-size: 11.5px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #b8452f; }
        .mc-h1 { margin: 0; text-align: center; font-family: var(--bx-serif); font-size: 34px; font-weight: 600; letter-spacing: -0.3px; line-height: 1.25; color: #14231a; }
        .mc-lede { margin: 2px 0 0; text-align: center; font-family: var(--bx-serif); font-style: italic; font-size: 14.5px; color: #4a4436; }
        .mc-head { margin-top: 2px; padding: 18px 16px 16px; border-radius: 14px; background: #fbf1dc; border: 1px solid #e6d5ae; }
        .mc-head h1 { font-family: var(--bx-serif); font-size: 15px; font-weight: 600; color: #14231a; }
        .mc-head p { margin: 6px 0 0; font-size: 13px; color: #7a6a4a; }
        .mc-filters { display: flex; justify-content: center; gap: 6px; margin: 22px 0 20px; overflow-x: auto; scrollbar-width: none; }
        .mc-filters::-webkit-scrollbar { display: none; }
        .mc-pill { flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px; border-radius: 999px; border: 1px solid #e2d3b0; background: #fffaf0; font-size: 12px; font-weight: 600; color: #14231a; white-space: nowrap; }
        .mc-pill em { font-style: normal; font-weight: 700; color: #b8452f; }
        .mc-pill.is-on { background: #123524; border-color: #123524; color: #fbf3e2; }
        .mc-pill.is-on em { color: #e8c46a; }
        .mc-empty { max-width: 680px; margin: 0 auto; padding: 14px 16px; border-radius: 14px; background: #fbf1dc; border: 1px solid #e6d5ae; text-align: left; font-size: 13px; line-height: 1.35; color: #7a6a4a; }
        .mc-empty p { margin: 0; }
        .mc-empty a { font-weight: 700; color: #7a6a4a; }
        .mc-list { list-style: none; margin: 0 auto; padding: 0; max-width: 980px; display: grid; gap: 14px; }
        .mc-item { display: flex; overflow: hidden; }
        .mc-img { position: relative; width: 200px; flex-shrink: 0; }
        .mc-img img { width: 100%; height: 100%; object-fit: cover; min-height: 170px; }
        .mc-img span { position: absolute; left: 10px; top: 10px; padding: 3px 9px; border-radius: 999px; background: rgba(20,35,26,.85); color: var(--bx-gold-2); font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .mc-body { flex: 1; min-width: 0; padding: 14px 18px; }
        .mc-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .mc-brand { margin: 0; font-family: var(--bx-jak); font-size: 10.5px; font-weight: 800; letter-spacing: 1.1px; text-transform: uppercase; color: #7a6a4a; }
        .mc-body h2 { margin: 3px 0 2px; font-family: var(--bx-serif); font-size: 19px; font-weight: 600; line-height: 1.2; }
        .mc-body h2 a:hover { color: var(--bx-red); }
        .mc-note { margin: 0; font-size: 13px; color: var(--bx-text); }
        .mc-note.is-red { color: var(--bx-red); font-weight: 600; }
        .mc-steps { display: flex; gap: 4px; margin: 12px 0 4px; }
        .mc-steps span { flex: 1; min-width: 0; }
        .mc-steps i { display: block; height: 5px; border-radius: 4px; background: #e6d8b8; }
        .mc-steps span.is-on i { background: var(--bx-teal); }
        .mc-steps small { display: block; margin-top: 4px; font-size: 10px; color: var(--bx-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mc-steps span.is-on small { color: var(--bx-ink); font-weight: 600; }
        .mc-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
        .mc-foot small { font-size: 12px; color: var(--bx-muted); }
        .mc-rumi { justify-content: center; margin-top: 22px; }

        @media (max-width: 767px) {
          .mc-filters { justify-content: flex-start; margin: 22px -16px 22px; padding: 0 16px; }
          .mc-pill { font-size: 11.5px; }
          .mc-item { flex-direction: column; }
          .mc-img { width: 100%; height: 130px; }
          .mc-img img { min-height: 0; }
          .mc-body { padding: 12px 14px 14px; }
          .mc-steps small { display: none; }
          .mc-foot .bx-btn { width: 100%; }
        }
      `}</style>
    </BountyShell>
  );
}
