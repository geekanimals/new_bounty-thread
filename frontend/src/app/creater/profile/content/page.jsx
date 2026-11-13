"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import { CATEGORIES, LANGUAGES } from "@/components/creater/data";
import { useCreator, saveSection, displayName, setAvailability, setTravel, getAvailability, getTravel } from "@/services/creator";
import { Check } from "@/components/ui/Icons";

// Figma: "Professional" card ke content types (formats isi mein save hote hain)
const TYPES = ["Reels", "Stories", "Posts", "Carousels", "Lives", "UGC videos", "Unboxing", "Reviews", "Tutorials", "Vlogs"];
const AVAIL = [
  ["available", "🟢 Available"],
  ["limited", "🟡 Limited"],
  ["unavailable", "🔴 Unavailable"],
];

// Screen words ↔ database values (purane profile.js ke CONTENT_TYPES / travel / management)
const FMT_KEY = { Reels: "reel", Stories: "story", Posts: "post", Carousels: "carousel", Lives: "live", "UGC videos": "ugc", Unboxing: "unboxing", Reviews: "review", Tutorials: "tutorial", Vlogs: "vlog" };
const FMT_UI = Object.fromEntries(Object.entries(FMT_KEY).map(([k, v]) => [v, k]));
const TRAVEL = { "Only my city": "city_only", "Within my state": "state_only", "Anywhere in India": "domestic" };
const MANAGE = { "Self-managed": "self_managed", Agency: "agency_managed", "Talent manager": "celebrity_agent_managed" };
const ui = (map, v) => Object.keys(map).find((k) => map[k] === v) || "";

/** /creater/profile/content — categories (max 3), languages, formats + Professional (api.save_profile_section "professional") */
export default function YourContent() {
  const c = useCreator();
  const [cats, setCats] = useState([]);
  const [langs, setLangs] = useState([]);
  const [formats, setFormats] = useState([]);
  const [extraCats, setExtraCats] = useState([]);
  const [extraLangs, setExtraLangs] = useState([]);
  const [adding, setAdding] = useState(null); // "cat" | "lang"
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState("");
  const [city, setCity] = useState("");
  const [pro, setPro] = useState({ display: "", travel: "", manage: "" });
  const [avail, setAvail] = useState("");
  const [travelling, setTravelling] = useState(false);
  const [trav, setTrav] = useState({ city: "" });
  const [busy, setBusy] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !c.ready || !c.profile) return;
    loaded.current = true;
    const p = c.profile.professional || {};
    const ids = (p.categories || []).map((x) => (CATEGORIES.find((k) => k.label.toLowerCase() === String(x).toLowerCase()) || {}).id || x);
    setCats(ids);
    setExtraCats(ids.filter((x) => !CATEGORIES.some((k) => k.id === x)));
    setLangs(p.languages || []);
    setExtraLangs((p.languages || []).filter((l) => !LANGUAGES.includes(l)));
    setFormats((p.content_formats || []).map((f) => FMT_UI[f] || f));
    setCity(p.city_coarse || c.meta?.bx_manual?.city || "");
    setPro({ display: p.display_name || displayName(c), travel: ui(TRAVEL, p.travel_willingness), manage: ui(MANAGE, p.management_status) });
    setAvail(p.availability_status || "");
    // availability + travel (alag RPC — purane app jaisa)
    getAvailability().then(({ data }) => data?.status && setAvail(data.status));
    getTravel().then(({ data }) => {
      if (data && data.city) {
        setTravelling(true);
        setTrav({ city: data.city });
      }
    });
  }, [c]);

  const flash = (t) => {
    setToast(t);
    clearTimeout(window.__ycT);
    window.__ycT = setTimeout(() => setToast(""), 2200);
  };
  const toggleCat = (id) => {
    if (cats.includes(id)) return setCats(cats.filter((x) => x !== id));
    if (cats.length >= 3) {
      setMsg("Pick up to 3 — remove one first.");
      setTimeout(() => setMsg(""), 2200);
      return;
    }
    setCats([...cats, id]);
  };
  const flip = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const addOwn = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    if (adding === "cat") {
      if (!extraCats.includes(t)) setExtraCats([...extraCats, t]);
      if (cats.length < 3 && !cats.includes(t)) setCats([...cats, t]);
    } else {
      if (!extraLangs.includes(t) && !LANGUAGES.includes(t)) setExtraLangs([...extraLangs, t]);
      if (!langs.includes(t)) setLangs([...langs, t]);
    }
    setText("");
    setAdding(null);
  };
  const savePro = async (patch, ok = "Saved") => {
    try {
      await saveSection("professional", patch);
      flash(ok);
    } catch (e) {
      flash("Couldn't save: " + (e.message || e));
    }
  };
  const save = async () => {
    setBusy(true);
    await savePro(
      { categories: cats.map((id) => (CATEGORIES.find((k) => k.id === id) || {}).label || id), languages: langs, city_coarse: city.trim() || null },
      "Your content saved"
    );
    setBusy(false);
  };
  const allLangs = [...LANGUAGES, ...extraLangs];
  // Professional card — har badlav turant save (naam rukne par)
  const setP = (k) => (e) => {
    const v = e.target.value;
    setPro({ ...pro, [k]: v });
    clearTimeout(window.__ycSave);
    if (k === "display") window.__ycSave = setTimeout(() => savePro({ display_name: v.trim() || null }), 700);
    if (k === "travel") savePro({ travel_willingness: TRAVEL[v] || null });
    if (k === "manage") savePro({ management_status: MANAGE[v] || null });
  };
  const setFormat = (t) => {
    const next = formats.includes(t) ? formats.filter((x) => x !== t) : [...formats, t];
    setFormats(next);
    savePro({ content_formats: next.map((x) => FMT_KEY[x] || x.toLowerCase()) });
  };
  const pickAvail = async (k) => {
    setAvail(k);
    try {
      await setAvailability(k);
      flash("Availability saved");
    } catch (e) {
      flash("Couldn't save: " + (e.message || e));
    }
  };
  // ✈️ travelling: set_my_travel (city chahiye) — tick hatao to clear
  const saveTravel = async (on, tcity) => {
    try {
      await setTravel(on ? tcity.trim() : "");
      flash(on ? "Travel saved" : "Travel cleared");
    } catch (e) {
      flash("Couldn't save: " + (e.message || e));
    }
  };

  return (
    <BountyShell>
      <title>What you create — Bounty</title>
      <Link href="/creater/profile" className="pf-back">
        ← My profile
      </Link>

      <section className="pf-card yc">
        <h1 className="yc-h">Your content</h1>

        <p className="yc-label">
          Categories <small>pick up to 3</small>
        </p>
        <div className="yc-cats">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={`yc-cat ${cats.includes(c.id) ? "is-on" : ""}`} onClick={() => toggleCat(c.id)} aria-pressed={cats.includes(c.id)}>
              <img src={c.img} alt="" loading="lazy" />
              <span>{c.label}</span>
              {cats.includes(c.id) && <i aria-hidden="true" />}
            </button>
          ))}
          {extraCats.map((c) => (
            <button key={c} type="button" className={`yc-cat yc-cat--own ${cats.includes(c) ? "is-on" : ""}`} onClick={() => toggleCat(c)} aria-pressed={cats.includes(c)}>
              <span>{c}</span>
              {cats.includes(c) && <i aria-hidden="true" />}
            </button>
          ))}
        </div>
        {msg && <p className="bx-err">{msg}</p>}
        {adding === "cat" ? (
          <form className="yc-add" onSubmit={addOwn}>
            <input className="pf-input" autoFocus placeholder="Your category, e.g. Cars" value={text} onChange={(e) => setText(e.target.value)} />
            <button type="submit" className="pf-btn">Add</button>
            <button type="button" className="yc-cancel" onClick={() => setAdding(null)}>Cancel</button>
          </form>
        ) : (
          <button type="button" className="yc-link" onClick={() => { setAdding("cat"); setText(""); }}>
            + Add your own category
          </button>
        )}

        <p className="yc-label">Content languages</p>
        <div className="yc-chips">
          {allLangs.map((l) => (
            <button key={l} type="button" className={`yc-chip ${langs.includes(l) ? "is-on" : ""}`} onClick={() => flip(langs, setLangs, l)} aria-pressed={langs.includes(l)}>
              {l}
            </button>
          ))}
        </div>
        {adding === "lang" ? (
          <form className="yc-add" onSubmit={addOwn}>
            <input className="pf-input" autoFocus placeholder="Another language, e.g. Rajasthani" value={text} onChange={(e) => setText(e.target.value)} />
            <button type="submit" className="pf-btn">Add</button>
            <button type="button" className="yc-cancel" onClick={() => setAdding(null)}>Cancel</button>
          </form>
        ) : (
          <button type="button" className="yc-link" onClick={() => { setAdding("lang"); setText(""); }}>
            + Add another language
          </button>
        )}

        <label className="yc-label" htmlFor="yc-city">City</label>
        <input id="yc-city" className="pf-input yc-city" value={city} onChange={(e) => setCity(e.target.value)} />

        <button type="button" className="yc-save" onClick={save} disabled={!cats.length || busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        {!cats.length && <p className="pf-hint">Pick at least 1 category.</p>}
      </section>

      {/* Professional — Figma ka doosra card */}
      <section className="pf-card yc-pro">
        <h2 className="pf-h">Professional</h2>
        <div className="yc-grid">
          <div>
            <label className="pf-label" htmlFor="yc-display">Creator / display name</label>
            <input id="yc-display" className="pf-input" value={pro.display} onChange={setP("display")} />
            <p className="pf-hint">The name brands see on your Media Kit and in campaigns</p>
          </div>
          <div>
            <label className="pf-label" htmlFor="yc-travel">Travel willingness</label>
            <select id="yc-travel" className="pf-input" value={pro.travel} onChange={setP("travel")}>
              <option value="">—</option>
              <option>Only my city</option>
              <option>Within my state</option>
              <option>Anywhere in India</option>
            </select>
          </div>
          <div>
            <label className="pf-label" htmlFor="yc-manage">Management</label>
            <select id="yc-manage" className="pf-input" value={pro.manage} onChange={setP("manage")}>
              <option value="">—</option>
              <option>Self-managed</option>
              <option>Agency</option>
              <option>Talent manager</option>
            </select>
          </div>
        </div>

        <p className="pf-label yc-types">
          Content types <span>— what you make (pick all that apply)</span>
        </p>
        <div className="yc-pills">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`yc-pill ${formats.includes(t) ? "is-on" : ""}`}
              aria-pressed={formats.includes(t)}
              onClick={() => setFormat(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <p className="pf-label yc-types">Availability</p>
        <div className="yc-pills">
          {AVAIL.map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={`yc-pill yc-pill--b ${avail === k ? "is-on" : ""}`}
              aria-pressed={avail === k}
              onClick={() => pickAvail(k)}
            >
              {l}
            </button>
          ))}
        </div>

        <label className="yc-trav">
          <input
            type="checkbox"
            checked={travelling}
            onChange={(e) => {
              setTravelling(e.target.checked);
              if (!e.target.checked) saveTravel(false, "");
            }}
          />
          <span>
            <b>✈️ I&apos;m travelling right now</b> — brands planning a campaign there can find you
          </span>
        </label>
        {travelling && (
          <form
            className="yc-add yc-travcity"
            onSubmit={(e) => {
              e.preventDefault();
              if (trav.city.trim()) saveTravel(true, trav.city);
            }}
          >
            <input className="pf-input" placeholder="Which city are you in?" value={trav.city} onChange={(e) => setTrav({ city: e.target.value })} aria-label="Travel city" />
            <button type="submit" className="pf-btn">Save</button>
          </form>
        )}
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
        .yc { padding: 18px 20px 20px; }
        .yc-h { font-family: var(--bx-serif); font-size: 18px; font-weight: 600; }
        .yc-label { display: block; margin: 16px 0 10px; font-size: 14px; font-weight: 700; color: var(--bx-ink); }
        .yc-h + .yc-label { margin-top: 12px; }
        .yc-label small { margin-left: 6px; font-size: 12px; font-weight: 400; color: #3e4b52; }
        .yc-cats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .yc-cat { position: relative; height: 90px; padding: 0; border-radius: 10px; border: 2px solid rgba(255,255,255,.5); overflow: hidden; background: #e9dcc0; box-shadow: 0 4px 10px -6px rgba(0,0,0,.4); }
        .yc-cat img { width: 100%; height: 100%; object-fit: cover; }
        .yc-cat::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.55)); }
        .yc-cat span { position: absolute; left: 8px; right: 8px; bottom: 6px; z-index: 1; font-family: var(--bx-jak); font-size: 12px; font-weight: 800; letter-spacing: .2px; text-transform: uppercase; color: #fff; text-align: left; text-shadow: 0 1px 3px rgba(0,0,0,.5); }
        .yc-cat i { position: absolute; top: 6px; right: 6px; z-index: 1; width: 16px; height: 16px; border-radius: 50%; background: #2bb3d9; }
        .yc-cat.is-on { border-color: #2bb3d9; box-shadow: 0 0 0 2px rgba(43,179,217,.35); }
        .yc-cat--own { background: linear-gradient(135deg, #2c5a43, #163b2a); }
        .yc-cat--own::after { display: none; }
        .yc-link { display: inline-block; margin: 10px 0 0 6px; padding: 0; border: 0; background: none; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: #0e2a33; text-decoration: underline; text-underline-offset: 3px; }
        .yc-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .yc-chip { height: 33px; padding: 0 16px; border-radius: 999px; border: 1px solid #d9c9a3; background: #fffdf8; font-family: var(--bx-jak); font-size: 13px; font-weight: 500; color: #0e2a33; }
        .yc-chip.is-on { padding: 0 24px; background: #d4f0f6; border-color: #2bb3d9; font-weight: 700; box-shadow: 0 0 0 2px rgba(43,179,217,.18); }
        .yc-add { display: flex; gap: 8px; margin-top: 10px; max-width: 520px; }
        .yc-add .pf-input { flex: 1; min-width: 0; }
        .yc-cancel { height: 38px; padding: 0 14px; border-radius: 999px; border: 1px solid #d9c9a3; background: #fffdf8; font-weight: 700; }
        .yc-city { height: 40px; }
        .yc-save { display: block; width: 100%; height: 46px; margin-top: 14px; border: 0; border-radius: 14px; background: var(--bx-green); color: var(--bx-cream); font-family: var(--bx-jak); font-size: 16px; font-weight: 800; letter-spacing: -0.1px; box-shadow: 0 8px 18px -12px rgba(0,0,0,.6); }
        .yc-save:disabled { opacity: .5; cursor: not-allowed; }
        .yc-pro { margin-top: 26px; }
        .yc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 12px; }
        .yc-types { margin-top: 14px; }
        .yc-types span { font-size: 13px; font-weight: 600; color: #7a6a4a; }
        .yc-pills { display: flex; flex-wrap: wrap; gap: 6px; }
        .yc-pill { height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid #e0cfa6; background: #f3e4c3; font-size: 13px; font-weight: 600; color: var(--bx-ink); }
        .yc-pill--b { font-weight: 700; }
        .yc-pill.is-on { background: #e6cf9c; border-color: #b8924a; color: var(--bx-ink); box-shadow: inset 0 0 0 1px #b8924a; }
        .yc-trav { display: flex; align-items: flex-start; gap: 8px; margin-top: 14px; font-size: 13px; color: #7a6a4a; cursor: pointer; }
        .yc-trav input { width: 14px; height: 14px; margin: 2px 0 0; accent-color: var(--bx-green); }
        .yc-trav b { color: var(--bx-ink); font-weight: 700; }
        @media (max-width: 767px) {
          .yc { padding: 16px; }
          .yc-cats { gap: 6px; }
          .yc-cat { height: 90px; }
          .yc-grid { grid-template-columns: 1fr; }
          .yc-add { flex-wrap: wrap; }
          .yc-add .pf-input { flex-basis: 100%; }
        }
      `}</style>
    </BountyShell>
  );
}
