"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Refresh } from "@/components/ui/Icons";

/* ================= Page ================= */

export default function UnsubscribeDonePage() {
  return (
    <>
      <title>Done — Geek Influencer OS</title>
      <meta name="robots" content="noindex" />
      <StatusShell>
        <DoneCard />
      </StatusShell>
    </>
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

const APP_URL = "https://www.bountythreads.geekcreativeagency.com/app.html";

function DoneCard() {
  const [undone, setUndone] = useState(false);

  return (
    <>
      <span className="dn-icon">
        <Check size={18} />
      </span>
      <h1 className="dn-title">{undone ? "You’re back in" : "Done"}</h1>
      <p className="dn-text">
        {undone
          ? "WhatsApp campaign updates are on again. You can stop them any time."
          : "No more WhatsApp campaign updates. You can turn them back on any time."}
      </p>

      {/* Backend banne par Undo yahan API call karega */}
      {!undone && (
        <button type="button" className="dn-undo" onClick={() => setUndone(true)}>
          <Refresh /> Undo — keep sending me updates
        </button>
      )}

      <a href={APP_URL} className="dn-link">
        Open the app <ArrowRight size={13} />
      </a>

      <style>{`
        .dn-icon {
          width: 50px;
          height: 50px;
          margin: 0 auto 18px;
          border-radius: 50%;
          background: #3f4130;
          color: #fff;
          display: grid;
          place-items: center;
        }
        .dn-title {
          margin: 0 0 14px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(32px, 4vw, 40px);
          line-height: 1.1;
        }
        .dn-text {
          margin: 0 auto 22px;
          max-width: 340px;
          font-size: 14px;
          line-height: 1.6;
          color: #6b6d5c;
        }
        .dn-undo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 20px;
          border-radius: 999px;
          border: 1px solid #e3e5d0;
          background: #fff;
          color: #23251a;
          font: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background .2s;
        }
        .dn-undo:hover { background: #f4f5e6; }
        .dn-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 18px;
          font-size: 13.5px;
          font-weight: 600;
          color: #6f7556;
          text-decoration: none;
        }
        .dn-link:hover { color: #3f4130; }
        @media (max-width: 640px) {
          .dn-undo { width: 100%; justify-content: center; }
        }
      `}</style>
    </>
  );
}
