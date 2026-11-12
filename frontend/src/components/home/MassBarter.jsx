import Link from "next/link";
import { ArrowRight, Check } from "@/components/ui/Icons";

const STAGES = [
  { no: "01", label: "Upload products", state: "done" },
  { no: "02", label: "Creators apply", state: "done" },
  { no: "03", label: "Ship to creators", state: "done" },
  { no: "04", label: "Approve videos", state: "done" },
  { no: "05", label: "Posts go live", state: "live" },
  { no: "06", label: "ROI report", state: "next" },
];

export default function MassBarter() {
  return (
    <section className="mb" id="barter">
      <div className="mb-wrap">
        <div className="mb-panel">
          <div className="mb-copy">
            <p className="mb-eyebrow">The wedge · Our moat</p>
            <h2 className="mb-title">
              The <em>Mass Barter</em> Engine.
            </h2>
            <p className="mb-text">
              Nobody has productized barter at scale. Run the whole lifecycle live — from product upload to ROI —
              with reminders that chase creators so you don&apos;t have to.
            </p>
            <Link href="#early-access" className="mb-btn">
              Open the Barter Engine <ArrowRight size={15} />
            </Link>
          </div>

          <ol className="mb-steps">
            {STAGES.map((s) => (
              <li key={s.no} className={`mb-step mb-step--${s.state}`}>
                <span className="mb-step__no">{s.no}</span>
                <span className="mb-step__label">{s.label}</span>
                <span className="mb-step__state">
                  {s.state === "done" && <Check size={14} />}
                  {s.state === "live" && (
                    <>
                      <span className="mb-live-dot" /> Live now
                    </>
                  )}
                  {s.state === "next" && "next"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <style>{`
        .mb {
          background: #fcfdef;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .mb-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 32px 104px;
        }
        .mb-panel {
          background: #3f4130;
          color: #f4f5e6;
          border-radius: 28px;
          padding: 72px 64px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        .mb-eyebrow {
          margin: 0 0 18px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #c9cca8;
        }
        .mb-title {
          margin: 0 0 22px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(40px, 4.6vw, 64px);
          line-height: 1.02;
          letter-spacing: -0.01em;
          color: #fcfdef;
        }
        .mb-title em { font-style: italic; color: #d4d7b3; }
        .mb-text {
          margin: 0 0 28px;
          max-width: 440px;
          font-size: 15px;
          line-height: 1.6;
          color: #d3d5c0;
        }
        .mb-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          height: 44px;
          padding: 0 20px;
          border-radius: 10px;
          background: #fcfdef;
          color: #23251a;
          font-size: 14.5px;
          font-weight: 500;
          text-decoration: none;
          transition: transform .2s;
        }
        .mb-btn:hover { transform: translateY(-1px); }

        .mb-steps {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 10px;
          width: 100%;
          max-width: 470px;
          justify-self: end;
        }
        .mb-step {
          display: grid;
          grid-template-columns: 34px 1fr auto;
          align-items: center;
          gap: 4px;
          padding: 13px 16px;
          border-radius: 12px;
          background: #4d4f3d;
          border: 1px solid #5c5e4b;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
        }
        .mb-step__no {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 17px;
          color: #c9cca8;
        }
        .mb-step__state {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          color: #e7e9d6;
        }
        .mb-step--next .mb-step__state { color: #9b9e85; }
        .mb-step--live {
          background: #fcfdef;
          border-color: #fcfdef;
          color: #23251a;
        }
        .mb-step--live .mb-step__no { color: #6f7556; }
        .mb-step--live .mb-step__state { color: #5d5f4d; }
        .mb-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6f7556;
          animation: mbPulse 1.6s ease-in-out infinite;
        }
        @keyframes mbPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .3; }
        }

        @media (max-width: 1024px) {
          .mb-wrap { padding: 32px 32px 88px; }
          .mb-panel {
            grid-template-columns: 1fr;
            padding: 56px 40px;
          }
          .mb-steps { justify-self: stretch; max-width: none; }
        }
        @media (max-width: 640px) {
          .mb-wrap { padding: 24px 20px 72px; }
          .mb-panel { padding: 40px 20px; border-radius: 22px; gap: 36px; }
          .mb-step { padding: 12px 14px; font-size: 13.5px; }
        }
      `}</style>
    </section>
  );
}
