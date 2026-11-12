"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import { useSession } from "@/components/creater/session";
import { Check } from "@/components/ui/Icons";

// Figma ki exact lists
const SKILLS = ["Modelling", "Live / Video Creator", "Video Editor", "Photographer", "Draw / Paint / Doodle", "Performance Arts", "Content Writer", "Singer", "Dancer", "Comedy / Acting", "Illustrator", "MC / Host", "Research", "DJ / Music", "Graphic Designer / UI UX", "Sustainability", "Performing Artist", "Ethical Hacking", "Coder / Developer", "Caregiver", "Digital Marketing", "Storytelling", "Meme"];
const RESOURCES = ["Studio", "Camera", "Car", "Bike", "Meeting or Shooting Space", "Tripod", "Speaker", "Mike", "Lights"];

/**
 * /creater/profile/skills — Skills + Resources (Figma: do dropdown, kholne par chips + "Other").
 * Har badlav turant save hota hai (Figma mein Save button nahi).
 */
export default function Skills() {
  const [s, update] = useSession();
  const [skills, setSkills] = useState([]);
  const [res, setRes] = useState([]);
  const [extraS, setExtraS] = useState([]);
  const [extraR, setExtraR] = useState([]);
  const [open, setOpen] = useState(null); // "skills" | "res"
  const [other, setOther] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const sk = s.skills || [];
    const rs = s.resources || [];
    setSkills(sk);
    setRes(rs);
    setExtraS(sk.filter((x) => !SKILLS.includes(x)));
    setExtraR(rs.filter((x) => !RESOURCES.includes(x)));
  }, [s.skills, s.resources]);

  const persist = (sk, rs) => {
    update({ skills: sk, resources: rs });
    setToast("Saved");
    clearTimeout(window.__skT);
    window.__skT = setTimeout(() => setToast(""), 1400);
  };
  const flip = (kind, v) => {
    if (kind === "skills") {
      const next = skills.includes(v) ? skills.filter((x) => x !== v) : [...skills, v];
      setSkills(next);
      persist(next, res);
    } else {
      const next = res.includes(v) ? res.filter((x) => x !== v) : [...res, v];
      setRes(next);
      persist(skills, next);
    }
  };

  // "Other" box se naya chip (jo dropdown khula hai usi mein)
  const add = (e) => {
    e.preventDefault();
    const t = other.trim();
    if (!t || !open) return;
    if (open === "skills") {
      if (![...SKILLS, ...extraS].includes(t)) setExtraS([...extraS, t]);
      if (!skills.includes(t)) {
        const next = [...skills, t];
        setSkills(next);
        persist(next, res);
      }
    } else {
      if (![...RESOURCES, ...extraR].includes(t)) setExtraR([...extraR, t]);
      if (!res.includes(t)) {
        const next = [...res, t];
        setRes(next);
        persist(skills, next);
      }
    }
    setOther("");
  };

  const field = (kind, label, hint, placeholder, list, sel) => (
    <div className="sk-field">
      <p className="sk-label">
        {label} * <span>{hint}</span>
      </p>
      <button
        type="button"
        className={`sk-select ${open === kind ? "is-open" : ""}`}
        aria-expanded={open === kind}
        onClick={() => {
          setOpen(open === kind ? null : kind);
          setOther("");
        }}
      >
        <span className={sel.length ? "" : "is-ph"}>{sel.length ? sel.join(", ") : placeholder}</span>
        <i>▾</i>
      </button>
      {open === kind && (
        <div className="sk-menu">
          <div className="sk-chips">
            {list.map((x) => (
              <button key={x} type="button" className={`sk-chip ${sel.includes(x) ? "is-on" : ""}`} onClick={() => flip(kind, x)} aria-pressed={sel.includes(x)}>
                {sel.includes(x) && "✓ "}
                {x}
              </button>
            ))}
          </div>
          <form className="sk-other" onSubmit={add}>
            <input className="pf-input" placeholder="Other — type and press Add" value={other} onChange={(e) => setOther(e.target.value)} aria-label={`Other ${label}`} />
            <button type="submit" className="sk-add">
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <BountyShell>
      <title>Skills & resources — Bounty</title>
      <Link href="/creater/profile" className="pf-back">
        ← My profile
      </Link>

      <section className="pf-card sk">
        <div className="sk-head">
          <h1>Skills &amp; resources</h1>
          <span>At least 1 of each</span>
        </div>
        {field("skills", "Skills", "select all that apply", "Select your skills", [...SKILLS, ...extraS], skills)}
        {field("res", "Resources / equipment", "what you can use for shoots", "Select your resources", [...RESOURCES, ...extraR], res)}
      </section>

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
        .pf-label { display: flex; align-items: center; gap: 8px; margin: 0 0 7px; font-size: 12.5px; font-weight: 600; color: #6b5a3a; }
        .pf-label small { padding: 1px 6px; border-radius: 5px; background: #ebe2cd; font-size: 10px; font-weight: 600; color: #7a8290; }
        .pf-input { width: 100%; height: 38px; padding: 0 10px; border-radius: 10px; border: 1px solid #d9c9a3; background: #fffdf8; outline: none; font-size: 14px; font-weight: 500; color: var(--bx-ink); }
        .pf-input::placeholder { color: #757575; }
        .pf-input:focus { border-color: var(--bx-gold); box-shadow: 0 0 0 3px rgba(232,176,74,.2); }
        select.pf-input { appearance: none; }
        textarea.pf-input { height: auto; padding: 9px 10px; }
        .pf-hint { margin: 6px 0 0; font-size: 12px; color: #6b5a3a; }
        .pf-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 38px; padding: 0 16px; border: 0; border-radius: 999px; background: var(--bx-green); color: var(--bx-cream); font-family: var(--bx-jak); font-size: 14px; font-weight: 700; white-space: nowrap; }
        .pf-btn:disabled { opacity: .5; cursor: not-allowed; }
        @media (max-width: 767px) {
          .pf-back { margin-bottom: 20px; }
          .pf-card { padding: 16px; }
        }
        .sk-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin: 0 -20px; padding: 0 20px 14px; border-bottom: 1px solid var(--bx-line); }
        .sk-head h1 { font-family: var(--bx-sans); font-size: 15px; font-weight: 700; letter-spacing: -0.1px; }
        .sk-head span { font-size: 12px; color: #6b5a3a; }
        .sk-field { margin-top: 14px; }
        .sk-label { margin: 0 0 8px; font-size: 12.5px; font-weight: 600; color: #6b5a3a; }
        .sk-label span { margin-left: 4px; font-size: 13px; font-weight: 600; color: #7a6a4a; }
        .sk-select { display: flex; align-items: center; gap: 10px; width: 100%; height: 44px; padding: 0 12px; border-radius: 10px; border: 1px solid #d9c9a3; background: #fbf1dc; text-align: left; font-size: 13px; color: var(--bx-ink); }
        .sk-select span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sk-select span.is-ph { color: #7a6a4a; }
        .sk-select i { font-style: normal; font-size: 13px; transition: transform .2s; }
        .sk-select.is-open { border-color: var(--bx-gold); }
        .sk-select.is-open i { transform: rotate(180deg); }
        .sk-menu { margin-top: 8px; padding: 12px; border-radius: 12px; border: 1px solid #e3d4b2; background: rgba(255,250,240,.7); animation: skIn .15s ease; }
        @keyframes skIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        .sk-chips { display: flex; flex-wrap: wrap; gap: 6px 8px; }
        .sk-chip { height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid #ddcca6; background: #fbf1dc; font-size: 13px; font-weight: 400; color: var(--bx-ink); }
        .sk-chip.is-on { background: #d4f0f6; border-color: #2bb3d9; font-weight: 600; }
        .sk-other { display: flex; gap: 8px; margin-top: 12px; }
        .sk-other .pf-input { flex: 1; min-width: 0; height: 40px; border-radius: 12px; padding: 0 12px; }
        .sk-add { height: 40px; padding: 0 18px; border-radius: 999px; border: 1px solid #d9c9a3; background: #fffdf8; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: var(--bx-ink); box-shadow: 0 2px 6px -3px rgba(0,0,0,.25); }
        @media (max-width: 767px) {
          .sk-head { margin: 0 -16px; padding: 0 16px 14px; }
          .sk-label span { display: block; margin: 4px 0 0; }
          .sk-field:first-of-type .sk-label span { display: inline; margin-left: 4px; }
          .sk-chip { height: 30px; padding: 0 10px; font-size: 12.5px; }
        }
      `}</style>
    </BountyShell>
  );
}
