"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardShell, { RumiTip } from "@/components/creater/OnboardShell";
import { readSession, writeSession } from "@/components/creater/session";
import { COLLAB_TYPES, getSidekick } from "@/components/creater/data";

const PRODUCT_VALUES = ["Any", "₹500+", "₹1,000+", "₹2,000+", "₹5,000+"];

/** /creater/onboarding/terms — Setup 3: kaunsi collabs + rates + tick box */
export default function SetupTerms() {
  const router = useRouter();
  const [types, setTypes] = useState(["barter", "paid"]);
  const [rates, setRates] = useState({ reel: "1500", story: "", post: "", product: "Any" });
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const [sk, setSk] = useState(getSidekick("rumi"));

  useEffect(() => {
    const s = readSession();
    setTypes(s.collab || []);
    setRates({ reel: s.rates?.reel || "", story: s.rates?.story || "", post: s.rates?.post || "", product: s.rates?.product || "Any" });
    setSk(getSidekick(s.sidekick));
  }, []);

  const toggle = (id) => setTypes(types.includes(id) ? types.filter((t) => t !== id) : [...types, id]);
  const rate = (k, v) => setRates({ ...rates, [k]: v.replace(/\D/g, "").slice(0, 7) });

  // Instagram hai to seedha Home, nahi to aakhri step (details)
  const go = () => {
    if (readSession().ig) {
      writeSession({ setupDone: true });
      router.push("/creater/home");
    } else router.push("/creater/onboarding/details");
  };

  const submit = () => {
    if (!types.length) return setErr("Pick at least one kind of collaboration.");
    if (!agree) return setErr("Please tick the box to continue.");
    writeSession({ collab: types, rates });
    go();
  };

  return (
    <OnboardShell tone="dark" step={6} stepText="06/06" avatar>
      <title>Your terms — Bounty</title>
      <div className="tm">
        <h2 className="tm-h">Your work. Your terms.</h2>
        <p className="tm-sub">What kind of collaborations are you open to?</p>

        <div className="tm-types">
          {COLLAB_TYPES.map((t) => {
            const on = types.includes(t.id);
            return (
              <button key={t.id} type="button" className={`tm-type ${on ? "is-on" : ""}`} onClick={() => toggle(t.id)} aria-pressed={on}>
                <span className="tm-type__ic">{t.icon}</span>
                <span className="tm-type__txt">
                  <strong>{t.label}</strong>
                  {t.note && <small>{t.note}</small>}
                </span>
                <i />
              </button>
            );
          })}
        </div>

        <p className="tm-label">Your expectations</p>
        {[
          ["reel", "Reel rate (optional)"],
          ["story", "Story rate (optional)"],
          ["post", "Post rate (optional)"],
        ].map(([k, l]) => (
          <label key={k} className="tm-rate">
            <span>{l}</span>
            <em>
              <b>₹</b>
              <input inputMode="numeric" placeholder="—" value={rates[k]} onChange={(e) => rate(k, e.target.value)} aria-label={l} />
            </em>
            <i aria-hidden="true">→</i>
          </label>
        ))}
        <label className="tm-rate">
          <span>Product value you prefer (optional)</span>
          <em className="tm-rate__sel">
            <select value={rates.product} onChange={(e) => setRates({ ...rates, product: e.target.value })} aria-label="Product value you prefer">
              {PRODUCT_VALUES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </em>
          <i aria-hidden="true">→</i>
        </label>

        <label className={`tm-agree ${err && !agree ? "is-err" : ""}`}>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => {
              setAgree(e.target.checked);
              setErr("");
            }}
          />
          <span>You decide on each offer. Ad rights, exclusivity and deadlines are always shown before you accept.</span>
        </label>
        {err && <p className="tm-err">{err}</p>}

        <RumiTip mobileDark className="tm-rumi" name={sk.name} img={sk.img} text="Pick all that fit — you can still say no to any offer." />
        <button type="button" className="bx-btn bx-btn--cream bx-btn--lg bx-btn--block tm-cta" onClick={submit}>
          Find collaborations for me →
        </button>
        <button type="button" className="tm-skip" onClick={go}>
          Skip for now
        </button>
      </div>

      <style>{`
        /* Figma 019/026 — Setup 3 (dark) */
        .tm { text-align: center; color: #fbf3e2; }
        .tm-h { font-family: var(--bx-jak); font-size: 33px; font-weight: 800; line-height: 36.3px; letter-spacing: -1.2px; color: #fbf3e2; }
        .tm-sub { margin: 9px 0 0; font-size: 15px; font-weight: 500; line-height: 21px; color: #fbf3e2; }
        .tm-types { display: grid; gap: 10px; margin-top: 16px; }
        .tm-type { display: flex; align-items: center; gap: 16px; height: 72px; padding: 0 18px; border-radius: 14px; border: 1.5px solid rgba(251,243,226,.35); background: rgba(10,34,25,.75); color: #fbf3e2; text-align: left; }
        .tm-type.is-on { border: 2px solid #3fd9e8; }
        .tm-type__ic { flex-shrink: 0; width: 40px; padding-right: 10px; border-right: 1px solid rgba(251,243,226,.25); font-size: 20px; line-height: 30px; text-align: center; white-space: nowrap; letter-spacing: -0.5px; }
        .tm-type:nth-child(3) .tm-type__ic { font-size: 12px; }
        .tm-type__txt { flex: 1; }
        .tm-type__txt strong { display: block; font-size: 19px; font-weight: 800; line-height: 24px; }
        .tm-type__txt small { display: block; font-size: 12px; font-weight: 500; line-height: 15px; color: #d9cdb2; }
        .tm-type i { width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; border: 2px solid rgba(251,243,226,.7); }
        .tm-type.is-on i { border-color: #3fd9e8; background: #3fd9e8; }
        .tm-label { display: flex; align-items: center; gap: 10px; margin: 26px 0 14px; font-size: 15px; font-weight: 800; line-height: 19px; letter-spacing: 1.5px; text-transform: uppercase; color: #fbf3e2; }
        .tm-label::before { content: ""; width: 4px; height: 22px; border-radius: 2px; background: #e07a3f; }
        .tm-rate { display: flex; align-items: center; gap: 10px; height: 46px; margin-bottom: 10px; padding: 0 17px; border-radius: 12px; border: 1px solid rgba(251,243,226,.35); background: rgba(10,34,25,.6); font-size: 13.5px; font-weight: 500; text-align: left; color: #fbf3e2; cursor: text; }
        .tm-rate span { flex: 1; min-width: 0; }
        .tm-rate em { display: flex; align-items: center; gap: 3px; width: 85px; height: 19px; padding-left: 15px; border-left: 1px solid rgba(251,243,226,.3); font-style: normal; }
        .tm-rate b { font-size: 15px; font-weight: 700; }
        .tm-rate input { width: 100%; min-width: 0; border: 0; outline: none; background: none; color: #fbf3e2; font-size: 15px; font-weight: 700; }
        .tm-rate input::placeholder { color: #fbf3e2; }
        .tm-rate i { font-style: normal; font-size: 15px; font-weight: 700; }
        .tm-rate__sel { width: 71px !important; }
        .tm-rate select { width: 100%; border: 0; outline: none; background: none; color: #fbf3e2; font-size: 15px; font-weight: 700; padding: 0; appearance: none; cursor: pointer; }
        .tm-rate select option { color: #14231a; }
        .tm-agree { display: flex; align-items: flex-start; gap: 12px; margin: 16px -11px 0 -11px; padding: 13px 15px; border-radius: 14px; border: 1.5px solid rgba(251,243,226,.35); background: rgba(10,34,25,.6); font-size: 13.5px; font-weight: 500; line-height: 18.9px; text-align: left; color: #fbf3e2; cursor: pointer; }
        .tm-agree.is-err { border-color: #ff8b6b; }
        .tm-agree input { appearance: none; -webkit-appearance: none; width: 22px; height: 22px; margin: 0; flex-shrink: 0; border-radius: 6px; border: 2px solid rgba(251,243,226,.75); background: none; display: grid; place-items: center; cursor: pointer; }
        .tm-agree input:checked { background: #e8b04a; border-color: #e8b04a; }
        .tm-agree input:checked::after { content: "✓"; color: #14231a; font-size: 14px; font-weight: 800; line-height: 1; }
        .tm-err { margin: 8px 0 0; font-size: 12.5px; font-weight: 600; color: #ffb39e; }
        .tm-rumi { margin-top: 22px; }
        .tm-rumi p { flex: 1; }
        .tm-cta { height: 56px !important; margin-top: 0; border-radius: 28px !important; background: #f6ebd3 !important; color: #14231a !important; font-family: var(--bx-jak); font-size: 18px !important; font-weight: 800 !important; letter-spacing: -0.1px; }
        .tm-skip { margin: 18px auto 0; border: 0; background: none; padding: 0; font-family: var(--bx-jak); font-size: 15px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; color: #fbf3e2; }
        @media (max-width: 767px) {
          .tm-type { padding: 0 14px; gap: 12px; }
          .tm-agree { margin: 16px 0 0; }
        }
      `}</style>
    </OnboardShell>
  );
}
