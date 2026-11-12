"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";

/* New campaign ke 5 steps — har step apna route */
export const STEPS = [
  { k: "basics", label: "Basics" },
  { k: "deliverables", label: "Deliverables" },
  { k: "terms", label: "Terms & creative" },
  { k: "eligibility", label: "Eligibility & tracking" },
  { k: "review", label: "Review" },
];

const KEY = "geek_admin_new_campaign";
export const DEFAULT_DRAFT = {
  type: "Barter",
  name: "",
  brand: "",
  objective: "Awareness",
  target: "20",
  status: "Draft",
  deadline: "7",
  reels: "1",
  stories: "1",
  posts: "0",
  carousels: "0",
  reward: "",
  value: "",
  due: "7",
  rights: "1",
  brief: "",
  dos: "",
  donts: "",
  message: "",
  hashtags: "",
  mentions: "",
  locations: "",
  minF: "",
  maxF: "",
  igReq: "Verified Instagram connection",
  tracking: true,
  url: "",
  code: "",
};

/** Draft state — steps ke beech sessionStorage mein bachta hai */
export function useDraft() {
  const [d, setD] = useState(DEFAULT_DRAFT);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const s = window.sessionStorage.getItem(KEY);
      if (s) setD({ ...DEFAULT_DRAFT, ...JSON.parse(s) });
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);
  const set = (k, v) =>
    setD((p) => {
      const n = { ...p, [k]: v };
      try {
        window.sessionStorage.setItem(KEY, JSON.stringify(n));
      } catch {
        /* ignore */
      }
      return n;
    });
  const clear = () => {
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setD(DEFAULT_DRAFT);
  };
  return { d, set, clear, ready };
}

/** Text / number / select field — Figma: label 12/800, box 41px */
export function Field({ label, k, d, set, placeholder, type = "text", options, area, full }) {
  const id = `nc-${k}`;
  return (
    <div className={`nc-field ${full ? "nc-field--full" : ""}`}>
      <label className="nc-label" htmlFor={id}>
        {label}
      </label>
      {options ? (
        <select id={id} className="ad-input nc-input" value={d[k]} onChange={(e) => set(k, e.target.value)}>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : area ? (
        <textarea id={id} className="ad-input nc-input nc-area" value={d[k]} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} />
      ) : (
        <input id={id} className="ad-input nc-input" type={type} min={type === "number" ? 0 : undefined} value={d[k]} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} />
      )}
    </div>
  );
}

/**
 * Wizard ka frame: "Create a campaign" heading + Close, stepper, card, footer (Back/Cancel · Save draft · Continue).
 * step = index (0-4). canNext = false ho to Continue par error dikhega.
 */
export default function Wizard({ step, children, onNext, nextLabel = "Continue →", error }) {
  const router = useRouter();
  const [toast, setToast] = useState("");
  const prev = STEPS[step - 1];
  const next = STEPS[step + 1];

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const go = () => {
    if (onNext && onNext() === false) return;
    if (next) router.push(`/admin/campaigns/new/${next.k}`);
  };

  return (
    <AdminShell>
      <PageHead title="Create a campaign" sub="A guided, reviewable process that replaces the long scrolling modal.">
        <Link href="/admin/campaigns" className="ad-btn ad-btn--ghost nc-close">
          ✕ Close
        </Link>
      </PageHead>

      <section className="ad-card nc">
        <ol className="nc-steps" data-scroll>
          {STEPS.map((s, i) => (
            <li key={s.k} className={i === step ? "is-on" : i < step ? "is-done" : ""}>
              {i < step ? (
                <Link href={`/admin/campaigns/new/${s.k}`}>
                  <span className="nc-dot">✓</span>
                  <span className="nc-steplabel">{s.label}</span>
                </Link>
              ) : (
                <span className="nc-steplink">
                  <span className="nc-dot">{i + 1}</span>
                  <span className="nc-steplabel">{s.label}</span>
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="nc-body">{children}</div>
        {error && <p className="nc-err">{error}</p>}

        <div className="nc-foot">
          {prev ? (
            <Link href={`/admin/campaigns/new/${prev.k}`} className="ad-btn ad-btn--ghost nc-back">
              ← Back
            </Link>
          ) : (
            <Link href="/admin/campaigns" className="ad-btn ad-btn--ghost nc-back">
              Cancel
            </Link>
          )}
          <div className="nc-foot__r">
            <button type="button" className="nc-save" onClick={() => setToast("✓ Draft saved on this device")}>
              Save draft
            </button>
            <button type="button" className="ad-btn ad-btn--primary nc-next" onClick={go}>
              {nextLabel}
            </button>
          </div>
        </div>
      </section>

      {toast && <div className="ad-toast">{toast}</div>}

      <style>{`
        .nc-close { height: 41px !important; padding: 0 14px !important; color: var(--ad-primary-ink); }
        .nc { max-width: 1049px; margin: 0 auto; padding: 22px 22px 22px; }
        .nc-steps { list-style: none; margin: 0 0 22px; padding: 0; display: flex; align-items: center; gap: 8px; overflow-x: auto; scrollbar-width: none; }
        .nc-steps::-webkit-scrollbar { display: none; }
        .nc-steps li { flex-shrink: 0; }
        .nc-steps a, .nc-steplink { display: inline-flex; align-items: center; gap: 8px; }
        .nc-dot { width: 29px; height: 29px; border-radius: 50%; display: grid; place-items: center; background: #eceef5; color: #778199; font-size: 12px; font-weight: 800; }
        .nc-steplabel { font-size: 12px; font-weight: 800; color: #9299aa; white-space: nowrap; }
        .nc-steps li.is-on .nc-dot { background: #5a4bf2; color: #fff; }
        .nc-steps li.is-on .nc-steplabel { color: #5a4bf2; }
        .nc-steps li.is-done .nc-dot { background: var(--ad-green-bg); color: var(--ad-green); }
        .nc-steps li.is-done a:hover .nc-steplabel { color: var(--ad-primary); }

        .nc-body { display: flex; flex-direction: column; }
        .nc-sec { margin: 14px 0 12px; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8793a9; }
        .nc-sec:first-child { margin-top: 2px; }
        .nc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
        .nc-field { margin-bottom: 14px; min-width: 0; }
        .nc-field--full { grid-column: 1 / -1; }
        .nc-label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 800; color: #60708c; }
        .nc-input { height: 41px; padding: 0 12px; border-color: #dfe2ee; font-size: 12px; font-weight: 800; color: #1d2943; }
        .nc-input::placeholder { color: #757575; font-weight: 800; }
        select.nc-input { appearance: none; background: #fff; padding-right: 12px; height: 41px; }
        .nc-area { height: 90px; min-height: 90px; padding: 11px 12px; resize: none; }
        .nc-note { display: flex; gap: 10px; margin: 4px 0 4px; padding: 12px 16px; border-radius: 12px; font-size: 12px; line-height: 1.33; }
        .nc-note--warn { background: #fff7e8; border: 1px solid #f6dfb4; color: #986016; }
        .nc-note--red { background: #ffeef0; border: 1px solid #f7cdd4; color: #b64455; }
        .nc-note b { font-weight: 700; }
        .nc-err { margin-top: 12px; padding: 9px 12px; border-radius: 10px; background: var(--ad-red-bg); color: var(--ad-red); font-size: 12.5px; font-weight: 700; }

        .nc-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--ad-line); }
        .nc-back { height: 41px; padding: 0 15px; color: var(--ad-primary-ink); }
        .nc-foot__r { display: flex; align-items: center; gap: 12px; }
        .nc-save { border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; padding: 0; }
        .nc-save:hover { color: var(--ad-primary-2); }
        .nc-next { height: 41px; padding: 0 16px; box-shadow: none; }

        @media (max-width: 767px) {
          .nc-grid { grid-template-columns: 1fr; }
          .nc-steps .nc-steplabel { display: none; }
          .nc-steps li.is-on .nc-steplabel { display: inline; }
        }
        @media (max-width: 640px) {
          .nc { padding: 16px 14px 18px; }
          .nc-foot { flex-wrap: wrap; }
          .nc-foot__r { flex: 1; justify-content: flex-end; }
        }
      `}</style>
    </AdminShell>
  );
}
