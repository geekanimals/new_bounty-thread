"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creator/BountyShell";
import { useCreator, saveSection, getMyPets, addPet, deletePet, PET_TYPES } from "@/services/creator";

// Screen ke words ↔ database values (purane profile.js jaisa)
const GENDER = { Male: "male", Female: "female", "Non-binary": "non_binary", "Prefer not to say": "prefer_not_to_say" };
const MARRIED = { Unmarried: "single", Married: "married", "Prefer not to say": "prefer_not_to_say" };
const back = (map, v) => Object.keys(map).find((k) => map[k] === v) || "";
import { Check } from "@/components/ui/Icons";

/** /creator/profile/about — personal details (private, brands ko nahi dikhte) */
export default function AboutYou() {
  const c = useCreator();
  const [f, setF] = useState({ first: "", last: "", gender: "", dob: "", married: "", anniv: "", pets: "" });
  // purane profile jaisa: har pet ka naam, type, birthday (api.get_my_pets / add_pet / delete_pet)
  const [pets, setPets] = useState([]);
  const [np, setNp] = useState({ name: "", type: "", dob: "" });
  const [busy, setBusy] = useState("");
  const loadPets = async () => {
    const r = await getMyPets();
    const d = r && r.data;
    setPets(Array.isArray(d) ? d : (d && (d.pets || d.items)) || []);
  };
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
      anniv: p.marriage_anniversary || "",
      pets: p.has_pet === false ? "No" : p.has_pet ? "Yes" : "",
    });
    loadPets();
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
    if (k === "anniv") return { marriage_anniversary: v || null };
    if (k === "pets") return v === "No" ? { has_pet: false, pet_name: null, pet_type: null } : v === "Yes" ? { has_pet: true } : { has_pet: null };
    return {};
  };
  const flashT = useRef(null);
  const flash = (t) => {
    setToast(t);
    clearTimeout(flashT.current);
    flashT.current = setTimeout(() => setToast(""), 1600);
  };
  const save = async (k, v) => {
    if (k === "dob" && v && today && v > today) return flash("Birthday can't be in the future");
    if (k === "anniv" && v && today && v > today) return flash("Anniversary can't be in the future");
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
      <Link href="/creator/profile" className="pf-back">
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
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
          {f.married === "Married" && (
            <div>
              <label className="pf-label" htmlFor="ab-anniv">
                Marriage anniversary * <small>Private</small>
              </label>
              <input id="ab-anniv" type="date" className="pf-input" value={f.anniv} onChange={set("anniv")} max={today || undefined} />
            </div>
          )}
        </div>
        {f.pets === "Yes" && (
          <div className="ab-pets">
            <p className="ab-pets__t">
              <b>Your pets</b> — add every one
            </p>
            {pets.length ? (
              pets.map((x) => (
                <div key={x.pet_id || x.name} className="ab-pet">
                  <span>
                    🐾 <b>{x.name}</b>{" "}
                    <small>
                      · {(PET_TYPES.find((t) => t[0] === x.pet_type) || [0, x.pet_type || "Pet"])[1]}
                      {x.age_months != null ? ` · ${Math.floor(x.age_months / 12) ? `${Math.floor(x.age_months / 12)} yr ` : ""}${x.age_months % 12 ? `${x.age_months % 12} mo` : ""}` : ""}
                    </small>
                  </span>
                  <button
                    type="button"
                    className="ab-rm"
                    disabled={busy === x.pet_id}
                    onClick={async () => {
                      setBusy(x.pet_id);
                      try {
                        await deletePet(x.pet_id);
                        await loadPets();
                        flash("Removed");
                      } catch (e) {
                        flash("Couldn't remove: " + (e.message || e));
                      }
                      setBusy("");
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="pf-hint">No pets added yet.</p>
            )}
            <div className="ab-add">
              <input className="pf-input" placeholder="Pet name" maxLength={60} value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} aria-label="Pet name" />
              <select className="pf-input" value={np.type} onChange={(e) => setNp({ ...np, type: e.target.value })} aria-label="Pet type">
                <option value="">Type…</option>
                {PET_TYPES.map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
              <label className="ab-dob">
                <span>Birthday</span>
                <input className="pf-input" type="date" max={today || undefined} value={np.dob} onChange={(e) => setNp({ ...np, dob: e.target.value })} />
              </label>
              <button
                type="button"
                className="ab-addbtn"
                disabled={busy === "add"}
                onClick={async () => {
                  if (!np.name.trim() || !np.type) return flash("Add the pet's name and type");
                  setBusy("add");
                  try {
                    await addPet(np.name.trim(), np.type, np.dob || null);
                    setNp({ name: "", type: "", dob: "" });
                    await loadPets();
                    flash("Pet added");
                  } catch (e) {
                    flash("Couldn't add: " + (e.message || e));
                  }
                  setBusy("");
                }}
              >
                + Add pet
              </button>
            </div>
          </div>
        )}
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
        .ab-pets { margin-top: 16px; padding: 14px; border-radius: 14px; border: 1px solid #e0cfa6; background: #fffbf1; }
        .ab-pets__t { margin-bottom: 10px; font-size: 13px; color: #6b5a3a; }
        .ab-pet { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; background: #fff; margin-bottom: 6px; font-size: 14px; }
        .ab-pet small { color: #8a7a5c; }
        .ab-rm { border: 1px solid #e0cfa6; border-radius: 999px; background: #fff; padding: 4px 12px; font-size: 12px; font-weight: 700; color: #6b5a3a; cursor: pointer; }
        .ab-add { display: grid; grid-template-columns: 1.3fr 1fr 1fr auto; gap: 8px; align-items: end; margin-top: 10px; }
        .ab-dob { display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: #6b5a3a; }
        .ab-addbtn { height: 44px; padding: 0 16px; border: 0; border-radius: 999px; background: #1d1a14; color: #fff; font-weight: 800; cursor: pointer; }
        .ab-addbtn:disabled, .ab-rm:disabled { opacity: .6; }
        @media (max-width: 640px) { .ab-add { grid-template-columns: 1fr 1fr; } }
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
