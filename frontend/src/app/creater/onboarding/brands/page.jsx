"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardShell, { RumiTip } from "@/components/creater/OnboardShell";
import { useCreator, reloadProfile, addDreamBrand, removeDreamBrand } from "@/services/creator";
import { DREAM_BRANDS, getSidekick } from "@/components/creater/data";
import { Heart } from "@/components/ui/Icons";

const MAX = 5;

/** /creater/onboarding/brands — Setup 2: dream brands (max 5) */
export default function SetupBrands() {
  const router = useRouter();
  const [picked, setPicked] = useState([]);
  const [custom, setCustom] = useState([]);
  const [add, setAdd] = useState(null);
  const [warn, setWarn] = useState("");
  const [busy, setBusy] = useState(false);
  const c = useCreator();
  const sk = getSidekick(c.prefs?.kid);
  const loaded = useRef(false);
  const nameOf = (id) => (DREAM_BRANDS.find((b) => b.id === id) || {}).name || id;

  // Saved dream brands (naam se) → tiles
  useEffect(() => {
    if (loaded.current || !c.ready || !c.loggedIn) return;
    loaded.current = true;
    const have = (c.profile?.dream_brands || []).map((d) => d.submitted_brand_name).filter(Boolean);
    const ids = have.map((n) => (DREAM_BRANDS.find((b) => b.name.toLowerCase() === n.toLowerCase()) || {}).id || n);
    setPicked(ids);
    setCustom(ids.filter((x) => !DREAM_BRANDS.some((b) => b.id === x)));
  }, [c]);

  const toggle = (id) => {
    if (picked.includes(id)) return setPicked(picked.filter((x) => x !== id));
    if (picked.length >= MAX) {
      setWarn("That's 5 — remove one to add another.");
      setTimeout(() => setWarn(""), 2200);
      return;
    }
    setPicked([...picked, id]);
  };

  const saveAdd = () => {
    const v = (add || "").trim();
    if (v && !custom.includes(v)) {
      setCustom([...custom, v]);
      if (picked.length < MAX) setPicked([...picked, v]);
    }
    setAdd(null);
  };

  // Purane onbStep(2) jaisa: hataye gaye → delete_dream_brand, naye → upsert_dream_brand (rank ke saath)
  const next = async (save) => {
    if (save) {
      setBusy(true);
      try {
        const want = picked.map(nameOf);
        const old = c.profile?.dream_brands || [];
        for (const x of old) {
          if (x.submitted_brand_name && !want.some((w) => w.toLowerCase() === x.submitted_brand_name.toLowerCase()))
            await removeDreamBrand(x.aspiration_id, { corr: "ui-onboard", reload: false });
        }
        let rank = 1;
        for (const b of want) {
          if (!old.some((x) => (x.submitted_brand_name || "").toLowerCase() === b.toLowerCase()))
            await addDreamBrand(b, rank, { corr: "ui-onboard", reload: false });
          rank++;
        }
        reloadProfile();
      } catch (e) {
        setWarn("Couldn't save: " + (e.message || e));
        setBusy(false);
        return;
      }
    }
    router.push("/creater/onboarding/terms");
  };

  return (
    <OnboardShell tone="light" step={5} eyebrow="Your dreams • 05/06" avatar gate="member">
      <title>Dream brands — Bounty</title>
      <div className="db">
        <h2 className="db-h">
          Who&apos;s on your
          <br />
          dream list?
        </h2>
        <p className="db-sub">Save up to 5 brands you&apos;d love to work with.</p>
        <div className="db-top">
          <p className="db-note">Dream big. We&apos;ll help you spot the right opportunities.</p>
          <p className="db-nice">
            <span>{picked.length ? "Nice picks!" : "Tap a heart!"}</span>
          </p>
        </div>

        <div className="db-grid">
          {DREAM_BRANDS.map((b) => {
            const on = picked.includes(b.id);
            return (
              <button key={b.id} type="button" className={`db-tile ${on ? "is-on" : ""}`} onClick={() => toggle(b.id)} aria-pressed={on} aria-label={`${b.name} — ${b.cat}`}>
                <img src={b.img} alt="" />
                <i className="db-heart">
                  <Heart size={13} />
                </i>
              </button>
            );
          })}
          {custom.map((b) => {
            const on = picked.includes(b);
            return (
              <button key={b} type="button" className={`db-tile db-tile--txt ${on ? "is-on" : ""}`} onClick={() => toggle(b)} aria-pressed={on}>
                <strong>{b}</strong>
                <i className="db-heart">
                  <Heart size={13} />
                </i>
              </button>
            );
          })}
        </div>

        <p className="db-count">
          {picked.length} of {MAX} dream brands saved
        </p>
        <p className="db-dots" aria-hidden="true">
          {Array.from({ length: MAX }).map((_, i) => (
            <i key={i} className={i < picked.length ? "is-on" : ""} />
          ))}
        </p>
        {warn && <p className="db-warn">{warn}</p>}

        {add === null ? (
          <button type="button" className="db-add" onClick={() => setAdd("")}>
            + Add another brand
          </button>
        ) : (
          <div className="db-inline">
            <input className="bx-input" autoFocus placeholder="Brand name" value={add} onChange={(e) => setAdd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), saveAdd())} />
            <button type="button" className="bx-btn bx-btn--dark" onClick={saveAdd}>
              Add
            </button>
          </div>
        )}
        <p className="db-private">Your list is private. It&apos;s a wishlist, not a promise of selection.</p>

        <RumiTip mobileDark className="db-rumi" name={sk.name} img={sk.img} text="I'll ping you when a dream brand opens a campaign." />
        <button type="button" className="bx-btn bx-btn--dark bx-btn--lg bx-btn--block db-cta" onClick={() => next(true)} disabled={busy}>
          {busy ? "Saving…" : "Save my dream board →"}
        </button>
        <button type="button" className="db-skip" onClick={() => next(false)}>
          Skip for now
        </button>
      </div>

      <style>{`
        /* Figma 018/025 — Setup 2 dream brands */
        .db { text-align: center; color: #0e2a33; }
        .db-h { margin-top: -15px; font-family: var(--bx-serif); font-size: 34px; font-weight: 600; line-height: 37.4px; letter-spacing: -0.3px; color: #183447; }
        .db-sub { margin: 9px 0 0; font-size: 15px; font-weight: 500; line-height: 21px; color: #3e4b52; }
        .db-top { display: flex; align-items: center; gap: 6px; margin: 10px -1px 9px; }
        .db-note { flex: 0 1 244px; min-width: 0; min-height: 50px; display: grid; place-items: center; margin: 0; padding: 4px 12px; background: #d9eef4; transform: rotate(-1deg); box-shadow: 0 2px 4px rgba(0,0,0,.12); font-family: var(--bx-serif); font-style: italic; font-size: 11.5px; line-height: 15px; color: #14231a; }
        .db-nice { display: flex; align-items: center; gap: 1px; margin: 0 0 0 auto; }
        .db-nice span { height: 30px; padding: 0 9px; border-radius: 12px; background: #fff; border: 1px solid #d8c9a3; display: grid; place-items: center; font-family: var(--bx-serif); font-size: 13px; font-weight: 600; color: #b8452f; white-space: nowrap; }
        .db-nice img { width: 60px; height: 47px; object-fit: contain; }
        .db-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 6px; }
        .db-tile { position: relative; height: 108px; padding: 3px; border: 0; border-radius: 14px; background: #fff; box-shadow: 0 6px 14px -10px rgba(0,0,0,.45); }
        .db-tile img { width: 100%; height: 100%; border-radius: 11px; object-fit: cover; }
        /* Figma: sirf heart (off = outline, on = bhara cyan) */
        /* Like button: safed gol badge (image ke andar wala heart dhak deta hai) */
        .db-heart {
          position: absolute; top: 3px; right: 3px; width: 32px; height: 32px; border-radius: 50%;
          background: #fff; color: #0e2a33; display: grid; place-items: center;
          box-shadow: 0 2px 8px -2px rgba(0,0,0,.35); transition: transform .15s, background .2s, color .2s;
        }
        .db-heart svg { width: 16px; height: 16px; }
        .db-tile:hover .db-heart { transform: scale(1.08); }
        .db-tile.is-on .db-heart { background: #14b4e2; color: #fff; }
        .db-tile.is-on .db-heart svg { fill: currentColor; animation: dbPop .3s ease; }
        @keyframes dbPop { 0% { transform: scale(.6); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
        .db-tile.is-on { box-shadow: 0 0 0 2px #14b4e2, 0 6px 14px -10px rgba(0,0,0,.45); }
        .db-tile:focus { outline: none; }
        .db-tile:focus-visible { outline: 2px solid #0e2a33; outline-offset: 2px; }
        .db-tile--txt { display: grid; place-items: center; background: #fffdf6; }
        .db-tile--txt strong { font-family: var(--bx-serif); font-size: 22px; font-weight: 700; color: #14231a; }
        .db-count { margin: 14px 0 0; font-size: 15px; font-weight: 500; line-height: 19px; color: #0e2a33; }
        .db-dots { display: flex; justify-content: center; gap: 6px; margin: 8px 0 0; }
        .db-dots i { width: 9px; height: 9px; border-radius: 50%; background: #d9cfb8; }
        .db-dots i.is-on { background: #14b4e2; }
        .db-warn { margin: 8px 0 0; font-size: 12.5px; font-weight: 600; color: #b8401f; }
        .db-add { height: 40px; margin: 16px auto 0; padding: 0 30px; border-radius: 20px; border: 1.5px solid #0e2a33; background: none; font-family: var(--bx-jak); font-size: 15px; font-weight: 500; letter-spacing: -0.1px; color: #0e2a33; }
        .db-inline { display: flex; gap: 8px; margin-top: 12px; }
        .db-private { margin: 9px 0 0; font-family: var(--bx-serif); font-style: italic; font-size: 12.5px; line-height: 17.5px; color: #4a4436; }
        .db-rumi { margin-top: 18px; }
        .db-rumi p { flex: 1; }
        .db-cta { height: 56px !important; margin-top: 0; border-radius: 16px !important; background: #0e2a33 !important; color: #fff !important; font-family: var(--bx-jak); font-size: 18px !important; font-weight: 800 !important; letter-spacing: -0.1px; box-shadow: 0 10px 20px -12px rgba(14,42,51,.7); }
        .db-skip { margin: 18px auto 0; border: 0; background: none; padding: 0; font-family: var(--bx-jak); font-size: 13px; font-weight: 500; color: #5b6770; }
        .db-skip:hover { text-decoration: underline; }
        @media (max-width: 767px) {
          .db-h { margin-top: -10px; }
          .db-note { flex-basis: 56%; }
          .db-tile { height: 96px; }
        }
      `}</style>
    </OnboardShell>
  );
}
