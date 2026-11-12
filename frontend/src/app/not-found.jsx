import Link from "next/link";
import { ArrowRight, Megaphone, Send } from "@/components/ui/Icons";

/* ================= Page ================= */

export const metadata = {
  title: "Page not found — Geek Influencer OS",
};

// Galat URL par yahi page dikhega (header + footer layout se aate hain)
export default function NotFound() {
  return <NotFoundBlock />;
}

/* ================= Is page ke sections (code + CSS yahin) ================= */

const APP_URL = "https://www.bountythreads.geekcreativeagency.com/app.html";

function NotFoundBlock() {
  return (
    <section className="nf">
      <div className="nf-wrap">
        <p className="nf-code">404</p>
        <h1 className="nf-title">This page took a day off.</h1>
        <p className="nf-text">The link may be old or mistyped. Let’s get you back on track.</p>

        <div className="nf-actions">
          <Link href="/" className="nf-btn nf-btn--dark">
            Go home
            <span className="nf-btn__icon">
              <ArrowRight size={12} />
            </span>
          </Link>
          <a href={APP_URL} className="nf-btn nf-btn--ghost">
            <Megaphone /> Live campaigns
          </a>
          <Link href="/contact" className="nf-btn nf-btn--ghost">
            <Send size={14} /> Contact us
          </Link>
        </div>
      </div>

      <style>{`
        .nf {
          position: relative;
          overflow: hidden;
          background: #fcfdef;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .nf::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 45%;
          width: 900px;
          height: 600px;
          transform: translate(-50%, -50%);
          background: radial-gradient(closest-side, rgba(220, 222, 190, 0.45), rgba(252, 253, 239, 0));
          pointer-events: none;
        }
        .nf-wrap {
          position: relative;
          max-width: 1400px;
          margin: 0 auto;
          padding: 140px 32px 150px;
          text-align: center;
        }
        .nf-code {
          margin: 0;
          font-family: var(--font-serif), Georgia, serif;
          font-style: italic;
          font-size: clamp(110px, 16vw, 190px);
          line-height: 0.95;
          color: #7e8462;
        }
        .nf-title {
          margin: 6px 0 18px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(32px, 4.2vw, 56px);
          line-height: 1.1;
        }
        .nf-text {
          margin: 0 0 30px;
          font-size: 15px;
          color: #6b6d5c;
        }
        .nf-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .nf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          height: 44px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
          transition: background .2s;
        }
        .nf-btn--dark {
          padding: 0 8px 0 20px;
          background: #3f4130;
          color: #fff;
        }
        .nf-btn--dark:hover { background: #2f3124; }
        .nf-btn__icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #fcfdef;
          color: #3f4130;
          display: grid;
          place-items: center;
        }
        .nf-btn--ghost {
          padding: 0 20px;
          border: 1px solid #e3e5d0;
          background: #fff;
          color: #23251a;
        }
        .nf-btn--ghost:hover { background: #f4f5e6; }

        @media (max-width: 640px) {
          .nf-wrap { padding: 88px 20px 96px; }
          .nf-actions { flex-direction: column; }
          .nf-btn { width: 100%; }
          .nf-btn--dark { justify-content: space-between; }
        }
      `}</style>
    </section>
  );
}
