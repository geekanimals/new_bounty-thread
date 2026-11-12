"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "@/components/ui/Icons";

const KEY = "geek_cookie_choice"; // "essential" | "all"

// Pehli visit par neeche-left cookie card. Choice browser mein save hoti hai.
export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let saved = null;
    try {
      saved = window.localStorage.getItem(KEY);
    } catch {
      saved = null;
    }
    if (!saved) {
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const choose = (value) => {
    try {
      window.localStorage.setItem(KEY, value);
    } catch {
      /* storage band ho to bhi banner band karo */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="ck" role="dialog" aria-live="polite" aria-label="Cookie preferences">
      <p className="ck-title">
        <span className="ck-icon">
          <ShieldCheck size={14} />
        </span>
        Cookies &amp; activity on Geek Influencer OS
      </p>

      <ul className="ck-list">
        <li>
          <span className="ck-tag ck-tag--on">Essential · always on</span>
          Keeps you signed in, plus a security log of sign-ins.
        </li>
        <li>
          <span className="ck-tag">Analytics · your choice</span>
          Which pages you use, so we can improve the app.
        </li>
      </ul>

      <div className="ck-foot">
        <p className="ck-note">
          We never sell your data · <Link href="/privacy">Privacy Policy</Link>
        </p>
        <div className="ck-actions">
          <button type="button" className="ck-btn ck-btn--ghost" onClick={() => choose("essential")}>
            Essential only
          </button>
          <button type="button" className="ck-btn ck-btn--dark" onClick={() => choose("all")}>
            All cookies
          </button>
        </div>
      </div>

      <style>{`
        .ck {
          position: fixed;
          left: 24px;
          bottom: 24px;
          z-index: 60;
          width: min(560px, calc(100vw - 48px));
          background: #fff;
          border: 1px solid #e6e8d4;
          border-radius: 20px;
          padding: 18px 20px;
          box-shadow: 0 30px 70px -30px rgba(40, 42, 25, 0.45);
          font-family: var(--font-sans), system-ui, sans-serif;
          color: #23251a;
          animation: ckIn .35s ease;
        }
        @keyframes ckIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ck-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 14px;
          font-size: 15px;
          font-weight: 600;
        }
        .ck-icon {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          border-radius: 8px;
          background: #eef0dc;
          color: #5d5f4d;
          display: grid;
          place-items: center;
        }
        .ck-list {
          list-style: none;
          margin: 0 0 16px;
          padding: 0;
          display: grid;
          gap: 8px;
        }
        .ck-list li {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px 10px;
          font-size: 13px;
          color: #5d5f4d;
        }
        .ck-tag {
          padding: 4px 9px;
          border-radius: 6px;
          background: #f4f5e6;
          color: #6f7556;
          font-size: 11.5px;
          font-weight: 600;
          white-space: nowrap;
        }
        .ck-tag--on { background: #eef0dc; color: #3a3c2c; }
        .ck-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .ck-note {
          margin: 0;
          font-size: 12px;
          color: #8a8c78;
        }
        .ck-note a { color: inherit; }
        .ck-note a:hover { color: #3f4130; }
        .ck-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .ck-btn {
          height: 40px;
          padding: 0 18px;
          border-radius: 999px;
          font: inherit;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background .2s;
        }
        .ck-btn--ghost {
          border: 1px solid #e3e5d0;
          background: #fff;
          color: #23251a;
        }
        .ck-btn--ghost:hover { background: #f4f5e6; }
        .ck-btn--dark {
          border: 1px solid #3f4130;
          background: #3f4130;
          color: #fff;
        }
        .ck-btn--dark:hover { background: #2f3124; }

        @media (max-width: 640px) {
          .ck {
            left: 12px;
            right: 12px;
            bottom: 12px;
            width: auto;
            padding: 16px;
          }
          .ck-foot { flex-direction: column; align-items: stretch; }
          .ck-actions { display: grid; grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
