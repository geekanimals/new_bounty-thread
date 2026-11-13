"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordReset, takeRecoverySession } from "@/services/brand";
import { Send, ArrowLeft, ArrowRight, Mail, Lock } from "@/components/ui/Icons";

/**
 * /brands/forgot-password — reset link email par (Supabase Auth resetPasswordForEmail).
 * Purane brand door mein reset nahi tha ("Ask your Geek account manager") — ye naya hai, sirf Supabase Auth ka apna email.
 * Email ka link yahin wapas aata hai (#type=recovery) → session → Settings mein naya password.
 */
export default function BrandForgot() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  // reset link se wapas aaye?
  useEffect(() => {
    takeRecoverySession().then((m) => {
      if (m === "") router.replace("/brands/settings?reset=1");
      else if (m) setErr(m);
    });
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr("Enter the work email you sign in with.");
    setErr("");
    setBusy(true);
    const r = await sendPasswordReset(email);
    setBusy(false);
    if (r.error) return setErr(r.error.message || String(r.error));
    setSent(true);
  };

  return (
    <div className="bf">
      <title>Reset password — Geek OS Brand</title>

      <aside className="bf-art">
        <Link href="/brands" className="bf-logo">
          <span className="bf-logo__mark">g</span>
          <strong>Geek OS</strong>
          <span className="bf-logo__tag">for Brands</span>
        </Link>
        <div className="bf-art__mid">
          <span className="bf-lock">
            <Lock size={22} />
          </span>
          <h1>Locked out? It happens.</h1>
          <p>We’ll email you a secure link to set a new password. Your campaigns and approvals stay exactly where they are.</p>
        </div>
        <p className="bf-art__foot">Need help? Your Geek account manager replies in under 2 hours.</p>
      </aside>

      <main className="bf-main">
        <div className="bf-box">
          <Link href="/brands" className="br-back">
            <span>
              <ArrowLeft size={13} />
            </span>
            Back to sign in
          </Link>

          {sent ? (
            <div className="bf-done">
              <span className="bf-done__ic">
                <Mail size={22} />
              </span>
              <h2>Check your inbox</h2>
              <p>
                We sent a reset link to <strong>{email}</strong>. It works for 30 minutes — check spam if you don’t see it.
              </p>
              <Link href="/brands" className="bf-submit">
                Back to sign in <ArrowRight size={15} />
              </Link>
              <button type="button" className="bf-again" onClick={() => setSent(false)}>
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h2>Reset your password</h2>
              <p className="bf-sub">Enter your work email and we’ll send you a reset link.</p>
              <label className="br-label" htmlFor="bf-email">
                Work email
              </label>
              <div className="bf-field">
                <Send size={14} />
                <input id="bf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@brand.com" autoComplete="email" />
              </div>
              {err && <p className="bf-err">{err}</p>}
              <button type="submit" className="bf-submit" disabled={busy}>
                {busy ? "Sending…" : "Send reset link"} <ArrowRight size={15} />
              </button>
            </form>
          )}
        </div>
      </main>

      <style>{`
        .bf { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 44%) minmax(0, 1fr); background: #fff; }
        .bf-art {
          display: flex; flex-direction: column; padding: 40px 44px; color: #fff;
          background:
            radial-gradient(70% 55% at 100% 0%, rgba(176,40,110,.55) 0%, rgba(176,40,110,0) 70%),
            radial-gradient(60% 45% at 10% 100%, rgba(109,74,255,.45) 0%, rgba(109,74,255,0) 70%),
            linear-gradient(160deg, #2a0f2e 0%, #3b1236 50%, #24123a 100%);
        }
        .bf-logo { display: inline-flex; align-items: center; gap: 10px; }
        .bf-logo__mark { width: 34px; height: 34px; border-radius: 10px; background: var(--br-grad); display: grid; place-items: center; font-weight: 800; font-size: 18px; }
        .bf-logo strong { font-size: 18px; font-weight: 800; }
        .bf-logo__tag { padding: 3px 9px; border-radius: 999px; border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.08); font-size: 11px; font-weight: 600; }
        .bf-art__mid { margin: auto 0; padding: 40px 0; }
        .bf-lock { width: 52px; height: 52px; border-radius: 15px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); display: grid; place-items: center; margin-bottom: 20px; }
        .bf-art h1 { margin: 0 0 14px; font-size: clamp(30px, 3vw, 42px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
        .bf-art__mid p { margin: 0; max-width: 400px; font-size: 14.5px; line-height: 1.6; color: rgba(255,255,255,.78); }
        .bf-art__foot { margin: 0; font-size: 12px; color: rgba(255,255,255,.55); }

        .bf-main { display: grid; place-items: center; padding: 40px 32px; }
        .bf-box { width: 100%; max-width: 380px; }
        .bf-box h2 { margin: 6px 0 6px; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
        .bf-sub { margin: 0 0 22px; font-size: 13.5px; color: var(--br-muted); }
        .bf-field {
          display: flex; align-items: center; gap: 10px; height: 46px; padding: 0 14px; margin-bottom: 16px;
          border: 1px solid var(--br-border-2); border-radius: 11px; color: var(--br-faint);
        }
        .bf-field:focus-within { border-color: var(--br-primary); box-shadow: 0 0 0 3px rgba(109,74,255,.15); }
        .bf-field input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font-size: 14px; color: var(--br-ink); }
        .bf-err { margin: -6px 0 12px; font-size: 12.5px; color: var(--br-red); }
        .bf-submit {
          width: 100%; height: 46px; display: flex; align-items: center; justify-content: center; gap: 8px;
          border: 0; border-radius: 11px; background: linear-gradient(90deg, #12102a, #2b2470); color: #fff;
          font-size: 14px; font-weight: 700;
        }
        .bf-done { text-align: center; }
        .bf-done__ic { width: 56px; height: 56px; margin: 6px auto 14px; border-radius: 50%; background: var(--br-green-bg); color: var(--br-green); display: grid; place-items: center; }
        .bf-done p { margin: 0 0 20px; font-size: 13.5px; line-height: 1.6; color: var(--br-muted); word-break: break-word; }
        .bf-done strong { color: var(--br-ink); }
        .bf-again { margin-top: 12px; border: 0; background: none; color: var(--br-primary); font-size: 13px; font-weight: 600; }

        @media (max-width: 900px) {
          .bf { grid-template-columns: 1fr; }
          .bf-art { padding: 22px 20px 24px; }
          .bf-art__mid { padding: 20px 0 0; margin: 0; }
          .bf-lock, .bf-art__foot { display: none; }
          .bf-art h1 { font-size: 26px; margin-bottom: 6px; }
          .bf-art__mid p { font-size: 13.5px; }
          .bf-main { padding: 28px 20px 40px; place-items: start center; }
        }
      `}</style>
    </div>
  );
}
