"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import { useSession } from "@/components/creater/session";
import { CREATOR } from "@/components/creater/data";
import { Check } from "@/components/ui/Icons";

/** /creater/profile/about — personal details (private, brands ko nahi dikhte) */
export default function AboutYou() {
  const [s, update] = useSession();
  const [f, setF] = useState({ first: CREATOR.first.toLowerCase(), last: "Rathore", gender: "", dob: "", married: "", pets: "No" });
  const [today, setToday] = useState("");
  const [toast, setToast] = useState("");

  // Session mein pehle se saved ho to wahi bharo; aaj ki date browser mein (prerender par Date nahi)
  useEffect(() => {
    if (s.about) setF((x) => ({ ...x, ...s.about }));
  }, [s.about]);
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);

  // Figma mein Save button nahi — har badlav turant save (auto-save)
  const set = (k) => (e) => {
    const next = { ...f, [k]: e.target.value };
    setF(next);
    update({ about: next });
    setToast("Saved");
    clearTimeout(window.__abT);
    window.__abT = setTimeout(() => setToast(""), 1400);
  };

  return (
    <BountyShell>
      <title>About you — Bounty</title>
      <Link href="/creater/profile" className="pf-back">
        ← My profile
      </Link>

      <form className="pf-card" onSubmit={(e) => e.preventDefault()} noValidate>
        <h1 className="pf-h">Personal details</h1>
        <div className="pf-grid">
          <div>
            <label className="pf-label" htmlFor="ab-first">First name</label>
            <input id="ab-first" className="pf-input" value={f.first} onChange={set("first")} />
          </div>
          <div>
            <label className="pf-label" htmlFor="ab-last">Last name</label>
            <input id="ab-last" className="pf-input" value={f.last} onChange={set("last")} />
          </div>
          <div>
            <label className="pf-label" htmlFor="ab-gender">
              Gender * <small>Private</small>
            </label>
            <select id="ab-gender" className="pf-input" value={f.gender} onChange={set("gender")}>
              <option value="">Select…</option>
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
              <option>Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className="pf-label" htmlFor="ab-dob">
              Birthday * <small>Private</small>
            </label>
            <input id="ab-dob" type="date" className="pf-input" value={f.dob} onChange={set("dob")} max={today || undefined} />
            <p className="pf-hint">Age is calculated from DOB, never stored</p>
          </div>
          <div>
            <label className="pf-label" htmlFor="ab-married">
              Married / unmarried * <small>Private</small>
            </label>
            <select id="ab-married" className="pf-input" value={f.married} onChange={set("married")}>
              <option value="">Select…</option>
              <option>Unmarried</option>
              <option>Married</option>
              <option>Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className="pf-label" htmlFor="ab-pets">
              Do you have pets? * <small>Private</small>
            </label>
            <select id="ab-pets" className="pf-input" value={f.pets} onChange={set("pets")}>
              <option>No</option>
              <option>Dog</option>
              <option>Cat</option>
              <option>Other pet</option>
            </select>
          </div>
        </div>
        <p className="pf-note">
          * Required. “Prefer not to say” is a valid answer. Private — used only to personalise campaigns (birthday / anniversary gifting, pet brands), never shown to brands.
        </p>
      </form>

      {toast && (
        <div className="bx-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        /* Figma: DM Sans form card — header line, safed inputs, "Private" chip */
        .pf-back { display: inline-block; margin: 4px 0 26px; font-size: 14px; font-weight: 700; color: var(--bx-ink); }
        .pf-back:hover { color: var(--bx-red); }
        .pf-card { padding: 20px 20px 18px; border-radius: 16px; background: rgba(251,241,220,.82); border: 1px solid var(--bx-line); box-shadow: 0 10px 24px -20px rgba(60,40,10,.45); }
        .pf-h { margin: 0 0 12px; padding-bottom: 14px; font-family: var(--bx-sans); font-size: 15px; font-weight: 700; letter-spacing: -0.1px; border-bottom: 1px solid var(--bx-line); }
        .pf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
        .pf-label { display: flex; align-items: center; gap: 8px; margin: 0 0 7px; font-size: 12.5px; font-weight: 600; color: #6b5a3a; }
        .pf-label small { padding: 1px 6px; border-radius: 5px; background: #ebe2cd; font-size: 10px; font-weight: 600; color: #7a8290; }
        .pf-input { width: 100%; height: 38px; padding: 0 10px; border-radius: 10px; border: 1px solid #d9c9a3; background: #fffdf8; outline: none; font-size: 14px; font-weight: 500; color: var(--bx-ink); }
        .pf-input:focus { border-color: var(--bx-gold); box-shadow: 0 0 0 3px rgba(232,176,74,.2); }
        select.pf-input { appearance: none; }
        .pf-hint { margin: 6px 0 0; font-size: 12px; color: #6b5a3a; }
        .pf-note { margin: 14px 0 0; font-size: 12px; line-height: 1.5; color: #6b5a3a; }
        @media (max-width: 767px) {
          .pf-back { margin-bottom: 20px; }
          .pf-card { padding: 16px; }
          .pf-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </BountyShell>
  );
}
