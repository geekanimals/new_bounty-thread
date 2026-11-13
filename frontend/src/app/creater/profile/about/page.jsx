"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import { useCreator, saveSection } from "@/services/creator";

// Screen ke words ↔ database values (purane profile.js jaisa)
const GENDER = { Male: "male", Female: "female", "Non-binary": "non_binary", "Prefer not to say": "prefer_not_to_say" };
const MARRIED = { Unmarried: "single", Married: "married", "Prefer not to say": "prefer_not_to_say" };
const PET = { Dog: "dog", Cat: "cat", "Other pet": "other" };
const back = (map, v) => Object.keys(map).find((k) => map[k] === v) || "";
import { Check } from "@/components/ui/Icons";

/** /creater/profile/about — personal details (private, brands ko nahi dikhte) */
export default function AboutYou() {
  const c = useCreator();
  const [f, setF] = useState({ first: "", last: "", gender: "", dob: "", married: "", pets: "" });
  const loaded = useRef(false);
  const [today, setToday] = useState("");
  const [toast, setToast] = useState("");

  // Session mein pehle se saved ho to wahi bharo; aaj ki date browser mein (prerender par Date nahi)
  useEffect(() => {
    if (loaded.current || !c.ready || !c.profile) return;
    loaded.current = true;
    const p = c.profile.personal || {};
    setF({
      first: p.first_name || "",
      last: p.last_name || "",
      gender: back(GENDER, p.gender),
      dob: p.date_of_birth || "",
      married: back(MARRIED, p.marital_status),
      pets: p.has_pet === false ? "No" : p.has_pet ? back(PET, p.pet_type) || "Other pet" : "",
    });
  }, [c]);
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);

  // Figma mein Save button nahi — har badlav turant save (auto-save)
  // har field ka patch (api.save_profile_section "personal")
  const patchOf = (k, v) => {
    if (k === "first") return { first_name: v.trim() || null };
    if (k === "last") return { last_name: v.trim() || null };
    if (k === "gender") return { gender: GENDER[v] || null };
    if (k === "dob") return { date_of_birth: v || null };
    if (k === "married") return { marital_status: MARRIED[v] || null, ...(v !== "Married" ? { marriage_anniversary: null } : {}) };
    if (k === "pets") return v === "No" ? { has_pet: false, pet_name: null, pet_type: null } : v ? { has_pet: true, pet_type: PET[v] } : { has_pet: null };
    return {};
  };
  const flash = (t) => {
    setToast(t);
    clearTimeout(window.__abT);
    window.__abT = setTimeout(() => setToast(""), 1600);
  };
  const save = async (k, v) => {
    if (k === "dob" && v && today && v > today) return flash("Birthday can't be in the future");
    try {
      await saveSection("personal", patchOf(k, v));
      flash("Saved");
    } catch (e) {
      flash("Couldn't save: " + (e.message || e));
    }
  };
  const set = (k) => (e) => {
    const v = e.target.value;
    setF({ ...f, [k]: v });
    // naam type ho raha hai — rukne par save; baaki turant
    clearTimeout(window.__abSave);
    if (k === "first" || k === "last") window.__abSave = setTimeout(() => save(k, v), 700);
    else save(k, v);
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
              <option value="">Select…</option>
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
