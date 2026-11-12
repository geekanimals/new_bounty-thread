"use client";

import { useState } from "react";
import { ArrowRight, Check } from "@/components/ui/Icons";

const ROLES = ["Creator", "Brand", "Agency", "Celebrity manager"];

export default function EarlyAccess() {
  const [role, setRole] = useState("Creator");
  const [sent, setSent] = useState(false);

  // Abhi sirf frontend hai — backend banne par yahan API call lagani hai.
  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section className="ea" id="early-access">
      <div className="ea-wrap">
        <div className="ea-copy">
          <p className="ea-eyebrow">Join the first agencies &amp; creators</p>
          <h2 className="ea-title">
            Get <em>early access</em> to Geek Influencer OS.
          </h2>
        </div>

        <form className="ea-card" onSubmit={handleSubmit}>
          <div className="ea-roles" role="radiogroup" aria-label="I am a">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={role === r}
                className={`ea-role ${role === r ? "is-active" : ""}`}
                onClick={() => setRole(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <label className="ea-field">
            <span className="ea-sr">Your name</span>
            <input type="text" name="name" placeholder="Your name" required autoComplete="name" />
          </label>
          <label className="ea-field">
            <span className="ea-sr">Work email</span>
            <input type="email" name="email" placeholder="Work email" required autoComplete="email" />
          </label>
          <label className="ea-field">
            <span className="ea-sr">Instagram handle or website</span>
            <input type="text" name="handle" placeholder="Instagram handle or website" />
          </label>

          <button type="submit" className="ea-submit" disabled={sent}>
            {sent ? (
              <>
                <Check size={15} /> Request sent
              </>
            ) : (
              <>
                Request early access <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        .ea {
          background: #eef0dc;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .ea-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 88px 32px;
          display: grid;
          grid-template-columns: 1fr 440px;
          gap: 48px;
          align-items: center;
        }
        .ea-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 18px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .ea-eyebrow::before {
          content: "";
          width: 20px;
          height: 1px;
          background: currentColor;
        }
        .ea-title {
          margin: 0;
          max-width: 560px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(36px, 4.3vw, 60px);
          line-height: 1.05;
          letter-spacing: -0.01em;
        }
        .ea-title em { font-style: italic; color: #7e8462; }

        .ea-card {
          background: #fff;
          border: 1px solid #e3e5d0;
          border-radius: 22px;
          padding: 22px;
          display: grid;
          gap: 12px;
        }
        .ea-roles {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 2px;
        }
        .ea-role {
          border: 0;
          cursor: pointer;
          padding: 8px 13px;
          border-radius: 999px;
          background: #f4f5e6;
          color: #3a3c2c;
          font: inherit;
          font-size: 12.5px;
          font-weight: 500;
          transition: background .2s, color .2s;
        }
        .ea-role.is-active { background: #3f4130; color: #fff; }

        .ea-field { display: block; }
        .ea-sr {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }
        .ea-field input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid #e3e5d0;
          background: #fcfdef;
          color: #23251a;
          font: inherit;
          font-size: 14px;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .ea-field input::placeholder { color: #a5a88c; }
        .ea-field input:focus {
          border-color: #7e8462;
          box-shadow: 0 0 0 3px rgba(126, 132, 98, 0.18);
        }

        .ea-submit {
          height: 46px;
          border: 0;
          border-radius: 10px;
          background: #3f4130;
          color: #fff;
          font: inherit;
          font-size: 14.5px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background .2s;
        }
        .ea-submit:hover { background: #2f3124; }
        .ea-submit:disabled { cursor: default; background: #6f7556; }

        @media (max-width: 1024px) {
          .ea-wrap {
            grid-template-columns: 1fr;
            padding: 72px 32px;
          }
          .ea-card { max-width: 520px; }
        }
        @media (max-width: 640px) {
          .ea-wrap { padding: 56px 20px; gap: 32px; }
          .ea-card { padding: 18px; }
        }
      `}</style>
    </section>
  );
}
