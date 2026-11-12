"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardShell, { RumiTip } from "@/components/creater/OnboardShell";
import { writeSession, readSession } from "@/components/creater/session";
import { getSidekick } from "@/components/creater/data";

const STEPS = ["Connecting your Instagram…", "Gathering your creator details…", "Building your media kit…", "Matching campaigns for you…"];

/** /creater/onboarding/connecting — Instagram connect ke baad media kit ban raha hai (loader) */
export default function ConnectingLoader() {
  const router = useRouter();
  const [done, setDone] = useState(0); // kitne steps poore
  const [sk, setSk] = useState(getSidekick("rumi"));
  const went = useRef(false);

  const finish = () => {
    if (went.current) return;
    went.current = true;
    writeSession({ ig: true });
    router.push("/creater/media-kit");
  };

  useEffect(() => {
    setSk(getSidekick(readSession().sidekick));
    const t = setInterval(() => setDone((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (done >= STEPS.length + 1) finish();
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.min(100, Math.round((done / STEPS.length) * 100));

  return (
    <OnboardShell tone="dark">
      <title>Building your media kit — Bounty</title>
      <div className="cn">
        <p className="cn-ok">Instagram connected ✓</p>
        <div className="cn-glow">
          <img src={sk.img} alt="" />
        </div>
        {/* Bada sidekick hi bolta hai — alag se doosra nahi */}
        <RumiTip inline mobileDark className="cn-rumi" name={sk.name} img={sk.img} text="Hang tight — I'm planting your media kit. 🌱" />
        <h2 className="cn-h">Building your media kit…</h2>
        <ul className="cn-steps" aria-live="polite">
          {STEPS.map((s, i) => (
            <li key={s} className={i < done ? "is-done" : i === done ? "is-now" : ""}>
              <i>{i < done ? "✓" : ""}</i>
              {s}
            </li>
          ))}
        </ul>
        <div className="cn-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <button type="button" className="bx-btn bx-btn--outline-light bx-btn--lg bx-btn--block" onClick={finish}>
          Continue while we finish
        </button>
      </div>

      <style>{`
        /* Figma 015/022 — loader */
        .cn { text-align: center; color: #fbf3e2; }
        .cn-ok { margin: -12px 0 14px; font-family: var(--bx-sans); font-size: 13px; font-weight: 500; color: #fbf3e2; }
        .cn-glow { display: grid; place-items: center; height: 200px; margin: 0 20px; border-radius: 28px; background: radial-gradient(circle at 50% 45%, rgba(246,217,139,.32), rgba(15,46,34,.15) 62%), rgba(10,34,25,.35); }
        .cn-glow img { width: 150px; animation: cnBob 2.4s ease-in-out infinite; filter: drop-shadow(0 12px 16px rgba(0,0,0,.45)); }
        @keyframes cnBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .cn-h { max-width: 330px; margin: 34px auto 16px; font-family: var(--bx-serif); font-size: 34px; font-weight: 600; line-height: 37.4px; letter-spacing: -0.3px; color: #fbf3e2; }
        .cn-steps { list-style: none; margin: 0; padding: 8px 18px; border-radius: 14px; border: 1px solid rgba(232,176,74,.35); background: rgba(10,34,25,.6); text-align: left; }
        .cn-steps li { display: flex; align-items: center; gap: 14px; height: 36px; font-family: var(--bx-sans); font-size: 15px; font-weight: 400; color: rgba(251,243,226,.95); }
        .cn-steps li i { width: 18px; height: 18px; flex-shrink: 0; border-radius: 50%; border: 2px solid rgba(251,243,226,.45); display: grid; place-items: center; font-style: normal; font-size: 10px; font-weight: 800; color: #0f2e22; }
        .cn-steps li.is-now { font-weight: 700; color: #fbf3e2; }
        .cn-steps li.is-now i { border-color: #e8b04a; animation: cnPulse 1s ease-in-out infinite; }
        .cn-steps li.is-done i { background: #3ddc84; border-color: #3ddc84; }
        @keyframes cnPulse { 50% { box-shadow: 0 0 0 4px rgba(232,176,74,.25); } }
        .cn-bar { height: 6px; margin: 14px 0 22px; border-radius: 6px; background: rgba(255,255,255,.12); overflow: hidden; }
        .cn-bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #e8b04a, #f6d98b); transition: width .6s ease; }
        .cn .bx-btn--outline-light { height: 48px; border-radius: 24px; border: 1.5px solid rgba(251,243,226,.8); background: rgba(10,34,25,.4); font-family: var(--bx-jak); font-size: 15px; font-weight: 700; letter-spacing: -0.1px; }
        .cn-rumi { margin: 4px 0 12px; }
        .cn-rumi p { flex: 1; }
      `}</style>
    </OnboardShell>
  );
}
