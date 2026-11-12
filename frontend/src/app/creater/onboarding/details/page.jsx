"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OnboardShell from "@/components/creater/OnboardShell";
import { readSession, writeSession } from "@/components/creater/session";

/** /creater/onboarding/details — Setup 4 (Instagram nahi): handle, naam, city, followers */
export default function SetupDetails() {
  const router = useRouter();
  const [f, setF] = useState({ handle: "", name: "", city: "", followers: "" });
  const [errs, setErrs] = useState({});

  useEffect(() => {
    const s = readSession();
    setF({ handle: s.handle || "", name: s.name || "", city: s.city || "", followers: s.followers || "" });
  }, []);

  const set = (k, v) => {
    setF({ ...f, [k]: v });
    setErrs({ ...errs, [k]: "" });
  };

  const finish = (e) => {
    e.preventDefault();
    const h = f.handle.trim().replace(/^@?/, "@");
    const n = {};
    if (!/^@[a-zA-Z0-9._]{2,30}$/.test(h)) n.handle = "Enter your Instagram handle, like @yourhandle.";
    if (f.name.trim().length < 2) n.name = "Enter your name.";
    if (f.city.trim().length < 2) n.city = "Enter your city.";
    if (!/^\d{2,9}$/.test(f.followers.replace(/,/g, ""))) n.followers = "Enter followers as a number, e.g. 12000.";
    setErrs(n);
    if (Object.keys(n).length) return;
    writeSession({ handle: h, name: f.name.trim(), city: f.city.trim(), followers: f.followers.replace(/,/g, ""), ig: false, setupDone: true });
    router.push("/creater/home");
  };

  const skip = () => {
    writeSession({ setupDone: true });
    router.push("/creater/home");
  };

  const field = (k, label, ph, extra = {}) => (
    <div className="dt-field">
      <label className="dt-label" htmlFor={`dt-${k}`}>
        {label}
      </label>
      <input id={`dt-${k}`} className={`bx-input dt-input ${errs[k] ? "is-err" : ""}`} placeholder={ph} value={f[k]} onChange={(e) => set(k, e.target.value)} {...extra} />
      {errs[k] && <p className="bx-err">{errs[k]}</p>}
    </div>
  );

  return (
    <OnboardShell tone="light" eyebrow="Last step" avatar="C">
      <title>Tell us about you — Bounty</title>
      <form className="dt" onSubmit={finish} noValidate>
        <h2 className="dt-h">Tell us about you.</h2>
        <p className="dt-sub">No Instagram connected? No problem — enter your details manually.</p>
        {field("handle", "Instagram handle", "@yourhandle", { autoCapitalize: "none" })}
        {field("name", "Full name", "Your name", { autoComplete: "name" })}
        {field("city", "City", "e.g. Bengaluru")}
        {field("followers", "Followers (approx.)", "e.g. 12,000", { inputMode: "numeric" })}
        <p className="dt-note">
          Shown to brands as “self-reported” until you connect Instagram. Some campaigns need a verified account.
        </p>
        <button type="submit" className="bx-btn bx-btn--dark bx-btn--lg bx-btn--block dt-cta">
          Finish →
        </button>
        <Link href="/creater/onboarding/meta" className="dt-link">
          Connect Instagram instead
        </Link>
        <button type="button" className="dt-skip" onClick={skip}>
          Skip for now
        </button>
      </form>

      <style>{`
        /* Figma 042/058 — Setup 4 */
        .dt { text-align: center; color: #0e2a33; }
        .dt-h { margin-top: -11px; font-family: var(--bx-jak); font-size: 40px; font-weight: 800; line-height: 44px; letter-spacing: -1px; color: #0e2a33; }
        .dt-sub { margin: 8px 0 0; font-size: 15px; font-weight: 500; line-height: 21px; color: #3e4b52; }
        .dt-field { margin-top: 18px; text-align: left; }
        .dt-field + .dt-field { margin-top: 18px; }
        .dt-label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 800; line-height: 15px; letter-spacing: .7px; text-transform: uppercase; color: #0e2a33; }
        .dt-input { height: 48px !important; padding: 0 15px !important; border-radius: 14px !important; border: 1px solid #d3cbb8 !important; background: #fff !important; font-family: var(--bx-sans) !important; font-size: 15px !important; font-weight: 500; color: #0e2a33; }
        .dt-input::placeholder { color: #9aa3a8; }
        .dt-input.is-err { border-color: #e0392f !important; }
        .dt-note { min-height: 56px; display: flex; align-items: center; margin: 14px 0 0; padding: 9px 16px; border-radius: 14px; background: rgba(205,239,248,.85); text-align: left; font-size: 13.5px; font-weight: 500; line-height: 18.2px; color: #0e2a33; }
        .dt-cta { height: 58px !important; margin-top: 0; border-radius: 16px !important; background: #0e2a33 !important; color: #fff !important; font-family: var(--bx-jak); font-size: 21px !important; font-weight: 800 !important; letter-spacing: -0.1px; box-shadow: 0 10px 20px -12px rgba(14,42,51,.7); }
        .dt-link { display: inline-block; margin-top: 18px; font-size: 15px; font-weight: 700; color: #0f8fbf; text-decoration: underline; text-underline-offset: 3px; }
        .dt-skip { display: block; margin: 23px auto 0; border: 0; background: none; padding: 0; font-family: var(--bx-jak); font-size: 13px; font-weight: 500; color: #5b6770; }
        .dt-skip:hover { text-decoration: underline; }
        @media (max-width: 767px) { .dt-h { font-size: 36px; line-height: 39.6px; letter-spacing: -0.89px; } .dt-input { font-size: 16px !important; } }
      `}</style>
    </OnboardShell>
  );
}
