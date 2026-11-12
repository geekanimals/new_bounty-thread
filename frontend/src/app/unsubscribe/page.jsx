import Link from "next/link";
import { Bell } from "@/components/ui/Icons";

/* ================= Page ================= */

export const metadata = {
  title: "Stop campaign updates? — Geek Influencer OS",
  robots: { index: false },
};

export default function UnsubscribePage() {
  return (
    <StatusShell>
      <span className="us-icon">
        <Bell />
      </span>
      <h1 className="us-title">Stop campaign updates?</h1>
      <p className="us-text">
        You’ll stop getting campaign invites and updates on WhatsApp. Messages about a campaign you already joined —
        contracts, shipping, payouts — still come.
      </p>

      {/* Backend banne par yahan API call + token lagega */}
      <Link href="/unsubscribe/done" className="us-btn">
        Yes, stop WhatsApp updates
      </Link>
      <Link href="/" className="us-link">
        Keep sending me updates
      </Link>

      <style>{`
        .us-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 18px;
          border-radius: 50%;
          background: #eef0dc;
          color: #23251a;
          display: grid;
          place-items: center;
        }
        .us-title {
          margin: 0 0 14px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(30px, 4vw, 38px);
          line-height: 1.1;
        }
        .us-text {
          margin: 0 auto 22px;
          max-width: 360px;
          font-size: 14px;
          line-height: 1.6;
          color: #6b6d5c;
        }
        .us-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 48px;
          border-radius: 999px;
          background: #3f4130;
          color: #fff;
          font-size: 14.5px;
          font-weight: 600;
          text-decoration: none;
          transition: background .2s;
        }
        .us-btn:hover { background: #2f3124; }
        .us-link {
          display: inline-block;
          margin-top: 16px;
          font-size: 13.5px;
          font-weight: 500;
          color: #3a3c2c;
          text-decoration: none;
        }
        .us-link:hover { text-decoration: underline; }
      `}</style>
    </StatusShell>
  );
}

/* ================= Is page ke sections (code + CSS yahin) ================= */

/**
 * Bina header/footer wala full-screen page (unsubscribe screens).
 * Upar-left chhota logo, beech mein ek card.
 */
function StatusShell({ children }) {
  return (
    <div className="ss">
      <div className="ss-top">
        <Link href="/" className="ss-logo" aria-label="Geek home">
          <span className="ss-logo__mark">g</span>
          <span className="ss-logo__name">Geek</span>
        </Link>
      </div>

      <main className="ss-main">
        <div className="ss-card">{children}</div>
      </main>

      <style>{`
        .ss {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: #fcfdef;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
          overflow: hidden;
        }
        .ss::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 900px;
          height: 700px;
          transform: translate(-50%, -50%);
          background: radial-gradient(closest-side, rgba(196, 199, 160, 0.6), rgba(252, 253, 239, 0));
          pointer-events: none;
        }
        .ss-top {
          position: relative;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 28px 32px 0;
        }
        .ss-logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #23251a;
          text-decoration: none;
        }
        .ss-logo__mark {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: #3f4130;
          color: #f4f5e6;
          display: grid;
          place-items: center;
          font-family: var(--font-serif), Georgia, serif;
          font-style: italic;
          font-size: 17px;
          padding-bottom: 3px;
        }
        .ss-logo__name {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 20px;
        }
        .ss-main {
          position: relative;
          flex: 1;
          display: grid;
          place-items: center;
          padding: 40px 32px 80px;
        }
        .ss-card {
          width: 100%;
          max-width: 460px;
          background: #fff;
          border: 1px solid #ecedde;
          border-radius: 26px;
          padding: 34px 36px 30px;
          text-align: center;
          box-shadow: 0 30px 70px -40px rgba(48, 50, 30, 0.35);
        }

        @media (max-width: 640px) {
          .ss-top { padding: 22px 20px 0; }
          .ss-main { padding: 32px 20px 64px; }
          .ss-card { padding: 28px 22px 24px; border-radius: 22px; }
        }
      `}</style>
    </div>
  );
}
