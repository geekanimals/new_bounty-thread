"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSection, rememberApply } from "@/services/creator";
import { Instagram } from "@/components/ui/Icons";

/**
 * ApplySteps — "Apply first, complete later".
 * Creator ne apply kar diya, par profile mein kuch MISSING hai (gender / birthday / city / Instagram) →
 * application "on hold" dikhao + jo bacha hai uske chhote steps (wahin bharo, ek tap mein).
 * Followers sirf Instagram connect se verify — type kiya number nahi maana jaata.
 * Criteria kabhi pehle se nahi dikhte — sirf jo is creator ka bacha hai wahi.
 *
 * props: el = eligibility { eligible, criteria[] }, cid = campaign id, onChange = campaign dobara load karo
 */

// "have" text se pata chalta hai ki data hai hi nahi (SQL intel.ci_elig_missing jaisa)
export const isMissing = (c) => /not in your profile|not set in your profile|no city in|no categories in|not connected|not yet|not enough recent posts/i.test(String((c && c.have) || ""));
const IG_KEYS = ["followers", "engagement", "instagram"];
const GENDERS = [
  ["Female", "female"],
  ["Male", "male"],
  ["Non-binary", "non_binary"],
  ["Prefer not to say", "prefer_not_to_say"],
];

/** Har campaign ke "on hold" steps — Home banner bhi yahi use karta hai */
export function holdSteps(el) {
  const cr = (el && el.criteria) || [];
  const open = cr.filter((c) => !c.ok);
  const missing = open.filter(isMissing);
  const mismatch = open.filter((c) => !isMissing(c));
  const prof = missing.filter((c) => !IG_KEYS.includes(String(c.key)));
  const igNeed = missing.some((c) => ["followers", "instagram"].includes(String(c.key)) && /not connected|not yet/i.test(c.have || ""));
  const engWait = missing.some((c) => c.key === "engagement") && !igNeed;
  const steps = prof.length + (igNeed ? 1 : 0) + (engWait ? 1 : 0);
  // Game: jab tak kuch bhi bacha hai, mismatch chhupa rahe (bhara hua = "done" ginti mein) —
  // "not eligible" sirf tab jab sab bhar diya / Instagram connect ho gaya (final = true)
  const final = steps === 0 && mismatch.length > 0;
  return { total: cr.length, done: cr.length - missing.length, prof, igNeed, engWait, mismatch, steps, final };
}

/** 🔒 Instagram safe hai — sirf sach likha hai (password Instagram ke page par, post sirf creator ke tap se) */
export function TrustStrip({ light = false }) {
  return (
    <div className={`as-trust ${light ? "as-trust--light" : ""}`}>
      <p className="as-trust__h">🔒 Your Instagram is safe with us</p>
      <ul>
        <li>✓ You log in on Instagram&apos;s own page — we never see your password</li>
        <li>✓ We never post anything unless you tap Publish yourself</li>
        <li>✓ We only read followers, reach and posts — to show brands your real numbers</li>
        <li>✓ Your number is only for WhatsApp verification — never shared with brands</li>
        <li>✓ Disconnect anytime from Settings</li>
      </ul>
      <style>{`
        .as-trust { margin-top: 12px; padding: 12px 14px; border-radius: 14px; background: rgba(46,160,90,.14); border: 1px solid rgba(110,210,140,.35); text-align: left; }
        .as-trust--light { background: #eefaf1; border-color: #bfe6cb; }
        .as-trust__h { margin: 0 0 6px !important; font-size: 13px !important; font-weight: 800 !important; color: #b9f0c9 !important; }
        .as-trust--light .as-trust__h { color: #1d6b3a !important; }
        .as-trust ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; }
        .as-trust li { font-size: 12px; line-height: 1.45; color: #e3f5e8; }
        .as-trust--light li { color: #2a4a35; }
      `}</style>
    </div>
  );
}

function Row({ k, icon, title, sub, open, setOpen, children }) {
  return (
    <li className={`as-row ${open === k ? "is-open" : ""}`}>
      <button type="button" className="as-row__head" onClick={() => setOpen(open === k ? null : k)} aria-expanded={open === k}>
        <span className="as-ic">{icon}</span>
        <span className="as-row__t">
          <b>{title}</b>
          <small>{sub}</small>
        </span>
        <span className="as-go">{open === k ? "–" : "→"}</span>
      </button>
      {open === k && <div className="as-row__body">{children}</div>}
    </li>
  );
}

export default function ApplySteps({ el, cid, onChange }) {
  const router = useRouter();
  const h = holdSteps(el);
  const [open, setOpen] = useState(null); // kaunsa step khula hai
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [val, setVal] = useState({ dob: "", city: "", fol: "" });
  const [typed, setTyped] = useState(false); // followers type kiye → "verify karo" wala parda

  const pct = h.total ? Math.round((h.done / h.total) * 100) : 0;
  const back = `&back=${encodeURIComponent(`/creator/discover/${cid}`)}`;

  const save = async (key, section, patch) => {
    setBusy(key);
    setMsg("");
    try {
      await saveSection(section, patch, "ui-apply");
      setOpen(null);
      setMsg("Saved ✓");
      if (onChange) await onChange();
    } catch (e) {
      setMsg("Couldn't save: " + (e.message || e));
    }
    setBusy("");
  };
  const connect = () => {
    rememberApply(cid);
    try {
      window.sessionStorage.setItem(`bx_hold_${cid}`, "1");
    } catch {
      /* ignore */
    }
    router.push(`/creator/onboarding/meta?next=apply&c=${encodeURIComponent(cid)}`);
  };

  // sab bhar diya, phir bhi brief se match nahi → ab sach batao (pehle nahi)
  if (h.final)
    return (
      <div className="as as--no">
        <p className="as-h">😕 Oops! You&apos;re not eligible for this one</p>
        <p className="as-sub">Thanks for completing everything — this brand needs:</p>
        <ul className="as-list">
          {h.mismatch.map((c) => (
            <li key={c.key || c.need} className="as-row as-row--no">
              <span>
                <b>{c.need}</b>
                <small>{c.have}</small>
              </span>
            </li>
          ))}
        </ul>
        <Link href="/creator/discover" className="as-cta">
          Find campaigns that fit you →
        </Link>
        <style>{CSS}</style>
      </div>
    );

  return (
    <div className="as">
      <div className="as-top">
        <div className="as-ring" style={{ "--p": pct }} aria-label={`${pct}% complete`}>
          <span>{pct}%</span>
        </div>
        <div>
          <p className="as-h">⏳ Your application is on hold</p>
          <p className="as-sub">
            Complete {h.steps} quick step{h.steps === 1 ? "" : "s"} to send it to the brand.
          </p>
        </div>
      </div>

      <ul className="as-list">
        {h.prof.map((c) => {
          const k = String(c.key);
          if (k === "gender")
            return (
              <Row key={k} k={k} open={open} setOpen={setOpen} icon="👤" title="Add your gender" sub="Takes 2 seconds">
                <div className="as-chips">
                  {GENDERS.map(([l, v]) => (
                    <button key={v} type="button" className="as-chip" disabled={!!busy} onClick={() => save(k, "personal", { gender: v })}>
                      {l}
                    </button>
                  ))}
                </div>
                <p className="as-note">Private — only used to match you with campaigns.</p>
              </Row>
            );
          if (k === "age")
            return (
              <Row key={k} k={k} open={open} setOpen={setOpen} icon="🎂" title="Add your birthday" sub="Private — brands only see your age range">
                <div className="as-form">
                  <input type="date" className="as-in" value={val.dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setVal({ ...val, dob: e.target.value })} aria-label="Birthday" />
                  <button type="button" className="as-btn" disabled={!val.dob || !!busy} onClick={() => save(k, "personal", { date_of_birth: val.dob })}>
                    {busy === k ? "Saving…" : "Save"}
                  </button>
                </div>
              </Row>
            );
          if (k === "location" || k === "city")
            return (
              <Row key={k} k={k} open={open} setOpen={setOpen} icon="📍" title="Add your city" sub="So we can match local campaigns">
                <div className="as-form">
                  <input className="as-in" placeholder="e.g. Bangalore" value={val.city} onChange={(e) => setVal({ ...val, city: e.target.value })} aria-label="Your city" />
                  <button type="button" className="as-btn" disabled={!val.city.trim() || !!busy} onClick={() => save(k, "professional", { city_coarse: val.city.trim() })}>
                    {busy === k ? "Saving…" : "Save"}
                  </button>
                </div>
              </Row>
            );
          const link =
            k === "category"
              ? { t: "Pick your content categories", href: `/creator/profile/content?focus=yc-cats${back}`, i: "🎬" }
              : k === "pet"
                ? { t: "Tell us about your pets", href: `/creator/profile/about?x=1${back}`, i: "🐾" }
                : k === "marital"
                  ? { t: "Add your marital status", href: `/creator/profile/about?x=1${back}`, i: "💍" }
                  : k === "barter"
                    ? { t: "Set your barter preference", href: `/creator/profile?x=1${back}`, i: "🎁" }
                    : { t: "Complete your profile", href: `/creator/profile?x=1${back}`, i: "✏️" };
          return (
            <li key={k} className="as-row">
              <Link href={link.href} className="as-row__head">
                <span className="as-ic">{link.i}</span>
                <span className="as-row__t">
                  <b>{link.t}</b>
                  <small>Opens your profile — you come right back here</small>
                </span>
                <span className="as-go">→</span>
              </Link>
            </li>
          );
        })}

        {h.igNeed && (
          <Row k="ig" open={open} setOpen={setOpen} icon="📊" title="Verify your followers" sub="Brands only review verified creators">
            {!typed ? (
              <>
                <label className="as-lbl" htmlFor="as-fol">
                  How many Instagram followers do you have?
                </label>
                <div className="as-form">
                  <input id="as-fol" className="as-in" inputMode="numeric" placeholder="e.g. 12,500" value={val.fol} onChange={(e) => setVal({ ...val, fol: e.target.value.replace(/[^\d,.kKmM]/g, "") })} />
                  <button type="button" className="as-btn" disabled={!val.fol.trim()} onClick={() => setTyped(true)}>
                    Next
                  </button>
                </div>
                <button type="button" className="as-skip" onClick={connect}>
                  Skip — verify with Instagram now
                </button>
              </>
            ) : (
              <div className="as-verify">
                <p className="as-verify__h">🤔 How can a brand trust a typed number?</p>
                <p className="as-verify__t">
                  Anyone can type <b>{val.fol}</b>. Brands only accept followers verified straight from Instagram — connect once and it&apos;s done in 10 seconds. Your free media kit is built at the same time.
                </p>
              </div>
            )}
            <button type="button" className="as-ig" onClick={connect}>
              <Instagram size={17} /> Connect Instagram to verify
            </button>
            <TrustStrip />
          </Row>
        )}

        {h.engWait && (
          <li className="as-row">
            <div className="as-row__head as-row__head--static">
              <span className="as-ic">📈</span>
              <span className="as-row__t">
                <b>Post a few more times</b>
                <small>We need a few recent posts to measure your engagement — we re-check automatically.</small>
              </span>
            </div>
          </li>
        )}
      </ul>
      {msg && <p className="as-msg">{msg}</p>}
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
  .as { margin-top: 2px; text-align: left; color: #fbf3e2; }
  .as-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .as-ring { --p: 0; flex-shrink: 0; width: 58px; height: 58px; border-radius: 50%; display: grid; place-items: center;
    background: conic-gradient(var(--bx-sky, #22b8e6) calc(var(--p) * 1%), rgba(255,255,255,.14) 0); transition: background .6s; }
  .as-ring span { width: 46px; height: 46px; border-radius: 50%; background: #3d2f22; display: grid; place-items: center; font-size: 13px; font-weight: 800; color: #fff; }
  .as-h { margin: 0 !important; font-size: 15.5px !important; font-weight: 800 !important; color: #fff !important; line-height: 1.3 !important; }
  .as-sub { margin: 3px 0 0 !important; font-size: 12.5px !important; color: #f1dfc0 !important; }
  .as-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
  .as-row { border-radius: 14px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); overflow: hidden; animation: as-in .35s ease both; }
  .as-row.is-open { background: rgba(255,255,255,.11); border-color: rgba(34,184,230,.55); }
  .as-row--no { padding: 10px 12px; background: rgba(255,211,196,.12); }
  .as--no .as-sub { margin: 4px 0 10px !important; }
  .as-row--no b { display: block; font-size: 13px; color: #fbf3e2; }
  .as-row--no small { display: block; margin-top: 2px; font-size: 12px; color: #e9cdbd; }
  .as-row__head { width: 100%; display: flex; align-items: center; gap: 10px; padding: 11px 12px; border: 0; background: none; color: inherit; text-align: left; cursor: pointer; text-decoration: none !important; font: inherit; }
  .as-row__head--static { cursor: default; }
  .as-ic { flex-shrink: 0; width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,.1); display: grid; place-items: center; font-size: 17px; }
  .as-row__t { flex: 1; min-width: 0; }
  .as-row__t b { display: block; font-size: 14px; color: #fff; }
  .as-row__t small { display: block; margin-top: 1px; font-size: 11.5px; color: #e6d3b3; line-height: 1.4; }
  .as-go { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; background: var(--bx-sky, #22b8e6); color: #0b2530; display: grid; place-items: center; font-weight: 900; font-size: 14px; }
  .as-row__body { padding: 0 12px 12px; }
  .as-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .as-chip { padding: 9px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.08); color: #fff; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
  .as-chip:hover { background: var(--bx-sky, #22b8e6); color: #0b2530; border-color: transparent; }
  .as-chip:disabled { opacity: .5; }
  .as-note { margin: 8px 0 0 !important; font-size: 11.5px !important; color: #e6d3b3 !important; }
  .as-lbl { display: block; margin-bottom: 6px; font-size: 12.5px; font-weight: 700; color: #fbf3e2; }
  .as-form { display: flex; gap: 8px; }
  .as-in { flex: 1; min-width: 0; height: 42px; padding: 0 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,.25); background: #fffaf0; color: #1b2a20; font: inherit; font-size: 14px; }
  .as-btn { flex-shrink: 0; height: 42px; padding: 0 16px; border: 0; border-radius: 10px; background: var(--bx-sky, #22b8e6); color: #0b2530; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; }
  .as-btn:disabled { opacity: .5; cursor: not-allowed; }
  .as-skip { display: block; margin: 8px 0 0; padding: 0; border: 0; background: none; color: #f1dfc0; font: inherit; font-size: 12px; font-weight: 700; text-decoration: underline; cursor: pointer; }
  .as-verify { padding: 10px 12px; border-radius: 12px; background: rgba(255,200,80,.14); border: 1px solid rgba(255,200,80,.35); animation: as-in .3s ease both; }
  .as-verify__h { margin: 0 0 4px !important; font-size: 14px !important; font-weight: 800 !important; color: #ffe2a0 !important; }
  .as-verify__t { margin: 0 !important; font-size: 12.5px !important; color: #fbf3e2 !important; line-height: 1.5 !important; }
  .as-ig { width: 100%; height: 50px; margin-top: 10px; border: 0; border-radius: 999px; display: flex; align-items: center; justify-content: center; gap: 8px;
    background: linear-gradient(90deg, #f58529, #dd2a7b 50%, #8134af); color: #fff; font: inherit; font-size: 15.5px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 22px -12px rgba(221,42,123,.9); }
  .as-ig:hover { filter: brightness(1.07); }
  .as-cta { display: block; margin-top: 10px; text-align: center; color: var(--bx-gold-2, #f3c766) !important; font-weight: 800; font-size: 13.5px; }
  .as-msg { margin: 8px 0 0 !important; font-size: 12.5px !important; font-weight: 700; color: #b9f0c9 !important; text-align: center; }
  @keyframes as-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .as-row, .as-verify { animation: none; } }
`;
