"use client";

import { useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creator/BountyShell";
import { useCreator, addDreamBrand, removeDreamBrand } from "@/services/creator";
import { DREAM_BRANDS } from "@/components/creator/data";
import { Check, Close } from "@/components/ui/Icons";

const MAX = 10;

/**
 * /creator/profile/dream-brands — Figma: simple list (10 tak), naam likho → "+ Add".
 * Session: dreamBrands (ids) + customBrands ({id, name}). Har badlav turant save.
 */
export default function DreamBrands() {
  const c = useCreator();
  // Asli list: get_my_profile.dream_brands (naam + aspiration_id)
  const list = (c.profile?.dream_brands || []).filter((d) => d.submitted_brand_name);
  const picked = list.map((d) => d.aspiration_id);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const row = (id) => list.find((d) => d.aspiration_id === id) || {};
  const label = (id) => row(id).submitted_brand_name || "";
  const img = (id) => DREAM_BRANDS.find((b) => b.name.toLowerCase() === label(id).toLowerCase())?.img;
  const flash = (t) => {
    setToast(t);
    clearTimeout(window.__dbT);
    window.__dbT = setTimeout(() => setToast(""), 1600);
  };
  // upsert_dream_brand (rank = list ke end mein) — purane profile.js jaisa
  const add = async (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n || busy) return;
    if (picked.length >= MAX) {
      setMsg(`You can add up to ${MAX} — remove one first.`);
      return;
    }
    if (list.some((d) => d.submitted_brand_name.toLowerCase() === n.toLowerCase())) {
      setMsg(`${n} is already on your list.`);
      return;
    }
    const known = DREAM_BRANDS.find((b) => b.name.toLowerCase() === n.toLowerCase());
    setBusy(true);
    try {
      await addDreamBrand(known ? known.name : n, list.length + 1);
      setName("");
      setMsg("");
      flash("Saved");
    } catch (ex) {
      setMsg("Couldn't save: " + (ex.message || ex));
    }
    setBusy(false);
  };
  const remove = async (id) => {
    try {
      await removeDreamBrand(id);
      flash("Removed");
    } catch (ex) {
      setMsg("Couldn't remove: " + (ex.message || ex));
    }
  };

  return (
    <BountyShell>
      <title>Dream brands — Bounty</title>
      <Link href="/creator/profile" className="pf-back">
        ← My profile
      </Link>

      <section className="pf-card dbx">
        <div className="dbx-head">
          <h1>Dream brands</h1>
          <span>At least 1</span>
        </div>

        {picked.length === 0 ? (
          <p className="dbx-empty">No dream brands yet — add the brands you love (up to {MAX}).</p>
        ) : (
          <ul className="dbx-list">
            {picked.map((id, i) => (
              <li key={`${id}-${i}`}>
                {img(id) ? <img src={img(id)} alt="" /> : <span className="dbx-dot">{label(id).slice(0, 1)}</span>}
                {label(id)}
                <button type="button" onClick={() => remove(id)} aria-label={`Remove ${label(id)}`}>
                  <Close size={11} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form className="dbx-add" onSubmit={add}>
          <input className="pf-input" placeholder="Brand name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Brand name" />
          <button type="submit" className="pf-btn dbx-btn" disabled={busy}>
            + Add
          </button>
        </form>
        {msg && <p className="bx-err">{msg}</p>}
        <p className="dbx-note">Dream brands are your wish list — private to you, not campaign history.</p>
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
        .dbx-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin: 0 -20px; padding: 0 20px 14px; border-bottom: 1px solid var(--bx-line); }
        .dbx-head h1 { font-family: var(--bx-sans); font-size: 15px; font-weight: 700; letter-spacing: -0.1px; }
        .dbx-head span { font-size: 12px; color: #6b5a3a; }
        .dbx-empty { margin: 16px 0 12px; font-size: 13px; color: #7a6a4a; }
        .dbx-list { list-style: none; margin: 14px 0 12px; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        .dbx-list li { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 6px 0 4px; border-radius: 999px; border: 1px solid #d9c9a3; background: #fffdf8; font-size: 13.5px; font-weight: 600; color: var(--bx-ink); }
        .dbx-list img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
        .dbx-dot { width: 28px; height: 28px; border-radius: 50%; background: #f3e4c3; display: grid; place-items: center; font-family: var(--bx-serif); font-weight: 700; }
        .dbx-list button { width: 22px; height: 22px; border: 0; border-radius: 50%; background: #efe4cc; display: grid; place-items: center; color: var(--bx-muted); }
        .dbx-add { display: flex; gap: 8px; }
        .dbx-add .pf-input { flex: 1; min-width: 0; height: 40px; border-radius: 12px; padding: 0 12px; }
        .dbx-btn { height: 40px; padding: 0 16px; }
        .dbx-note { margin: 12px 0 0; font-size: 12px; color: #6b5a3a; }
        @media (max-width: 767px) {
          .dbx-head { margin: 0 -16px; padding: 0 16px 14px; }
        }
      `}</style>
    </BountyShell>
  );
}
