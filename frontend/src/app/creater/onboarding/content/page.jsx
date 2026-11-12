"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardShell, { RumiTip } from "@/components/creater/OnboardShell";
import { readSession, writeSession } from "@/components/creater/session";
import { CATEGORIES, FORMATS, LANGUAGES, getSidekick } from "@/components/creater/data";
import { Check } from "@/components/ui/Icons";

const MAX = 3;

/** /creater/onboarding/content — Setup 1: categories, format, language */
export default function SetupContent() {
  const router = useRouter();
  const [cats, setCats] = useState(["lifestyle"]);
  const [custom, setCustom] = useState([]); // apni categories (sirf text)
  const [formats, setFormats] = useState(["Reels"]);
  const [langs, setLangs] = useState(["Hindi", "Hinglish"]);
  const [extraLangs, setExtraLangs] = useState([]);
  const [addCat, setAddCat] = useState(null); // null = band, string = input value
  const [addLang, setAddLang] = useState(null);
  const [warn, setWarn] = useState("");
  const [sk, setSk] = useState(getSidekick("rumi"));

  useEffect(() => {
    const s = readSession();
    setCats(s.categories || []);
    setFormats(s.formats || []);
    setLangs(s.languages || []);
    setSk(getSidekick(s.sidekick));
    const known = CATEGORIES.map((c) => c.id);
    setCustom((s.categories || []).filter((c) => !known.includes(c)));
    setExtraLangs((s.languages || []).filter((l) => !LANGUAGES.includes(l)));
  }, []);

  const toggleCat = (id) => {
    if (cats.includes(id)) return setCats(cats.filter((c) => c !== id));
    if (cats.length >= MAX) {
      setWarn(`Pick up to ${MAX} — unselect one first.`);
      setTimeout(() => setWarn(""), 2200);
      return;
    }
    setCats([...cats, id]);
  };
  const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const saveCat = () => {
    const v = (addCat || "").trim();
    if (v && !custom.includes(v)) {
      setCustom([...custom, v]);
      if (cats.length < MAX) setCats([...cats, v]);
    }
    setAddCat(null);
  };
  const saveLang = () => {
    const v = (addLang || "").trim();
    if (v && !LANGUAGES.includes(v) && !extraLangs.includes(v)) {
      setExtraLangs([...extraLangs, v]);
      setLangs([...langs, v]);
    }
    setAddLang(null);
  };

  const next = (save) => {
    if (save) writeSession({ categories: cats, formats, languages: langs });
    router.push("/creater/onboarding/brands");
  };

  return (
    <OnboardShell tone="light" step={5} stepText="05 / 06" avatar>
      <title>What you create — Bounty</title>
      <div className="sc">
        <h2 className="sc-h">
          What&apos;s your kind
          <br />
          of <mark>content?</mark>
        </h2>
        <p className="sc-sub">Pick up to 3 categories. We&apos;ll find briefs that fit your world.</p>

        <div className="sc-grid">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={`sc-tile ${cats.includes(c.id) ? "is-on" : ""}`} onClick={() => toggleCat(c.id)} aria-pressed={cats.includes(c.id)}>
              <img src={c.img} alt="" />
              <span>{c.label}</span>
              {cats.includes(c.id) && (
                <i>
                  <Check size={11} />
                </i>
              )}
            </button>
          ))}
          {custom.map((c) => (
            <button key={c} type="button" className={`sc-tile sc-tile--txt ${cats.includes(c) ? "is-on" : ""}`} onClick={() => toggleCat(c)} aria-pressed={cats.includes(c)}>
              <span>{c}</span>
              {cats.includes(c) && (
                <i>
                  <Check size={11} />
                </i>
              )}
            </button>
          ))}
        </div>
        {warn && <p className="sc-warn">{warn}</p>}

        {addCat === null ? (
          <button type="button" className="sc-add" onClick={() => setAddCat("")}>
            + Add your own category
          </button>
        ) : (
          <div className="sc-inline">
            <input className="bx-input" autoFocus placeholder="e.g. Cars, Finance" value={addCat} onChange={(e) => setAddCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), saveCat())} />
            <button type="button" className="bx-btn bx-btn--dark" onClick={saveCat}>
              Add
            </button>
          </div>
        )}

        <p className="sc-label">How do you create?</p>
        <div className="sc-chips">
          {FORMATS.map((f) => (
            <button key={f} type="button" className={`bx-chip ${formats.includes(f) ? "is-on" : ""}`} onClick={() => toggle(formats, setFormats, f)} aria-pressed={formats.includes(f)}>
              {f}
            </button>
          ))}
        </div>

        <p className="sc-label">Your content language</p>
        <div className="sc-chips">
          {[...LANGUAGES, ...extraLangs].map((l) => (
            <button key={l} type="button" className={`bx-chip ${langs.includes(l) ? "is-on" : ""}`} onClick={() => toggle(langs, setLangs, l)} aria-pressed={langs.includes(l)}>
              {l}
            </button>
          ))}
        </div>
        {addLang === null ? (
          <button type="button" className="sc-addlink" onClick={() => setAddLang("")}>
            + Add another language
          </button>
        ) : (
          <div className="sc-inline">
            <input className="bx-input" autoFocus placeholder="Language" value={addLang} onChange={(e) => setAddLang(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), saveLang())} />
            <button type="button" className="bx-btn bx-btn--dark" onClick={saveLang}>
              Add
            </button>
          </div>
        )}

        <RumiTip mobileDark className="sc-rumi" name={sk.name} img={sk.img} text="Pick what you post most — I'll match briefs to it." />
        <button type="button" className="bx-btn bx-btn--dark bx-btn--lg bx-btn--block sc-cta" onClick={() => next(true)} disabled={!cats.length}>
          Build my creator profile →
        </button>
        <p className="sc-skip">
          You can change these anytime ·{" "}
          <button type="button" onClick={() => next(false)}>
            Skip
          </button>
        </p>
      </div>

      <style>{`
        /* Figma 017/024 — Setup 1 */
        .sc { text-align: center; color: #0e2a33; }
        .sc-h { font-family: var(--bx-jak); font-size: 40px; font-weight: 800; line-height: 44px; letter-spacing: -1px; color: #0e2a33; }
        .sc-h mark { display: inline-block; padding: 0 10px; line-height: 51px; border-radius: 6px; background: #e07a3f; color: #fff; }
        .sc-sub { margin: 11px 0 0; font-size: 15px; font-weight: 500; line-height: 21px; color: #3e4b52; }
        .sc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; width: calc(100% - 1px); margin: 14px 0 0 -11px; }
        .sc-tile { position: relative; height: 96px; padding: 0; border: 3px solid transparent; border-radius: 12px; overflow: hidden; background: #ddd; box-shadow: 0 6px 12px -8px rgba(0,0,0,.4); }
        .sc-tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .sc-tile span { position: absolute; left: 7px; bottom: 6px; font-size: 12.5px; font-weight: 800; letter-spacing: .3px; text-transform: uppercase; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,.7); }
        .sc-tile::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 45%, rgba(0,0,0,.5)); }
        .sc-tile span, .sc-tile i { z-index: 1; }
        .sc-tile i { position: absolute; top: 6px; right: 6px; width: 20px; height: 20px; border-radius: 50%; background: #14b4e2; color: #fff; display: grid; place-items: center; }
        .sc-tile.is-on { border-color: #32a8cf; }
        .sc-tile--txt { background: #fffdf6; border-color: #d3cbb8; }
        .sc-tile--txt::after { display: none; }
        .sc-tile--txt span { position: static; display: grid; place-items: center; height: 100%; padding: 0 6px; color: #0e2a33; text-shadow: none; }
        .sc-warn { margin: 8px 0 0; font-size: 12.5px; font-weight: 600; color: #b8401f; }
        .sc-add { align-self: center; height: 38px; margin: 10px auto 0; padding: 0 30px; border-radius: 19px; border: 1.5px solid #0e2a33; background: none; font-family: var(--bx-jak); font-size: 14px; font-weight: 500; letter-spacing: -0.1px; color: #0e2a33; }
        .sc-inline { display: flex; gap: 8px; margin-top: 10px; }
        .sc-label { margin: 16px 0 8px; font-size: 12px; font-weight: 800; line-height: 15px; letter-spacing: .7px; text-transform: uppercase; color: #0e2a33; }
        .sc-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
        .sc-chips .bx-chip { height: 35px; padding: 0 16px; border-radius: 17.3px; border: 1px solid #d3cbb8; background: #fff; font-family: var(--bx-jak); font-size: 13px; font-weight: 500; color: #0e2a33; }
        .sc-chips .bx-chip.is-on { height: 37px; padding: 0 28px; border: 1.5px solid #14b4e2; background: #dff4fb; box-shadow: none; font-weight: 700; }
        .sc-addlink { margin: 10px auto 0; border: 0; background: none; padding: 0; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; color: #0e2a33; }
        .sc-rumi { justify-content: flex-start; margin-top: 30px; }
        .sc-rumi p { flex: 1; }
        .sc-cta { height: 58px !important; margin-top: 0; border-radius: 16px !important; background: #0e2a33 !important; color: #fff !important; font-family: var(--bx-jak); font-size: 21px !important; font-weight: 800 !important; letter-spacing: -0.1px; box-shadow: 0 10px 20px -12px rgba(14,42,51,.7); }
        .sc-skip { margin: 19px 0 0; font-size: 13px; font-weight: 500; color: #5b6770; }
        .sc-skip button { border: 0; background: none; padding: 0; font: inherit; color: inherit; }
        .sc-skip button:hover { text-decoration: underline; }
        @media (max-width: 767px) {
          .sc-h { font-size: 36px; line-height: 39.6px; letter-spacing: -0.89px; }
          .sc-h mark { line-height: 46px; }
          .sc-grid { width: 100%; margin: 14px 0 0; }
          .sc-tile { height: 74px; }
          .sc-chips .bx-chip { padding: 0 13px; }
          .sc-chips .bx-chip.is-on { padding: 0 20px; }
        }
      `}</style>
    </OnboardShell>
  );
}
