"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardShell from "@/components/creater/OnboardShell";
import { startInstagramConnect } from "@/services/creator";

/**
 * /creater/onboarding/meta — "Connect Instagram": seedha Instagram (Meta) ki official login window par.
 * Purane app jaisa — beech mein koi Geek page nahi, password kabhi Bounty par nahi.
 * Wapsi: <site>/app.html?code&state → /legacy → /creater → /creater/onboarding/connecting
 * ?next=apply → connect ke baad Discover par wapas (apply poora karne)
 */
export default function MetaConnect() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const started = useRef(false);

  const go = async () => {
    setErr("");
    try {
      const next = /next(=|%3D)apply/.test(window.location.search) ? "discover" : "";
      await startInstagramConnect({ after: next });
    } catch (e) {
      setErr("Couldn't open Instagram: " + (e.message || e));
    }
  };
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t = setTimeout(go, 600); // "Opening…" ek pal dikhe
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = () => (window.history.length > 1 ? router.back() : router.push("/creater/onboarding/instagram"));

  return (
    <OnboardShell tone="light" step={4} onBack={cancel}>
      <title>Connect Instagram — Bounty</title>
      <div className="mt">
        <span className="mt-ig" aria-hidden="true" />
        <h2 className="mt-h">Connect Instagram</h2>
        {!err ? (
          <div className="mt-open" role="status">
            <span className="mt-spin" />
            <p>Opening Meta&apos;s secure window…</p>
            <small>Sign in happens on Meta — Bounty never sees your password.</small>
          </div>
        ) : (
          <>
            <p className="mt-sub">{err}</p>
            <button type="button" className="bx-btn bx-btn--dark bx-btn--lg bx-btn--block mt-cta" onClick={go}>
              Try again
            </button>
          </>
        )}
        <button type="button" className="mt-cancel" onClick={cancel}>
          Cancel
        </button>
      </div>

      <style>{`
        .mt { text-align: center; }
        .mt-ig { display: block; width: 56px; height: 56px; margin: 0 auto 12px; border-radius: 16px; background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285aeb 90%); position: relative; box-shadow: 0 12px 24px -12px rgba(214,36,159,.7); }
        .mt-ig::after { content: ""; position: absolute; inset: 14px; border: 3px solid #fff; border-radius: 50%; }
        .mt-h { font-family: var(--bx-jak); font-size: 40px; font-weight: 800; line-height: 44px; letter-spacing: -1px; color: #0e2a33; }
        @media (max-width: 767px) { .mt-h { font-size: 36px; line-height: 39.6px; letter-spacing: -0.89px; } }
        .mt-sub { margin: 9px 0 18px; font-size: 15px; font-weight: 500; line-height: 21px; color: #3e4b52; }
        .mt-open { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 30px 0; }
        .mt-open p { margin: 6px 0 0; font-size: 15px; font-weight: 700; }
        .mt-open small { font-size: 12.5px; color: var(--bx-muted); }
        .mt-spin { width: 36px; height: 36px; border-radius: 50%; border: 3px solid #e6d8b8; border-top-color: #12242a; animation: mtSpin .8s linear infinite; }
        @keyframes mtSpin { to { transform: rotate(360deg); } }
        .mt-accs { display: grid; gap: 10px; }
        .mt-acc { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; border: 2px solid var(--bx-line); background: #fffdf6; text-align: left; }
        .mt-acc.is-on { border-color: #2bb3d9; background: #eef8fb; }
        .mt-acc img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
        .mt-acc span { flex: 1; min-width: 0; }
        .mt-acc strong { display: block; font-size: 15px; font-weight: 700; color: #0e2a33; overflow: hidden; text-overflow: ellipsis; }
        .mt-acc small { display: block; font-size: 12px; color: var(--bx-muted); }
        .mt-acc i { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--bx-line); display: grid; place-items: center; color: #fff; }
        .mt-acc.is-on i { background: #2bb3d9; border-color: #2bb3d9; }
        .mt-perms { list-style: none; margin: 0; padding: 4px 14px; border-radius: 14px; background: #fffdf6; border: 1px solid var(--bx-line); text-align: left; }
        .mt-perms li { display: flex; gap: 12px; padding: 11px 0; }
        .mt-perms li + li { border-top: 1px solid var(--bx-line); }
        .mt-perms span { width: 24px; height: 24px; flex-shrink: 0; border-radius: 50%; background: var(--bx-ok-bg); color: var(--bx-ok); display: grid; place-items: center; }
        .mt-perms strong { display: block; font-size: 15px; font-weight: 700; color: #0e2a33; }
        .mt-perms small { display: block; font-size: 12.5px; color: var(--bx-text); line-height: 1.4; }
        .mt-safe { display: flex; align-items: center; justify-content: center; gap: 7px; margin: 12px 0 0; font-size: 12px; color: var(--bx-muted); }
        .mt-cta { height: 58px !important; margin-top: 18px; border-radius: 16px !important; background: #0e2a33 !important; color: #fff !important; font-family: var(--bx-jak); font-size: 18px !important; font-weight: 800 !important; letter-spacing: -0.1px; }
        .mt-cancel { margin-top: 18px; border: 0; background: none; padding: 0; font-family: var(--bx-jak); font-size: 16px; font-weight: 700; color: #0e2a33; }
      `}</style>
    </OnboardShell>
  );
}
