"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminSignIn, adminCheck } from "@/lib/adminAuth";

/**
 * /admin — Super Admin login (Figma mein login frame nahi tha, isliye admin theme mein banaya).
 * Admin ID (email) + password → Supabase Auth, phir database check karta hai ki ye Super Admin hai
 * (is_platform_admin) — bilkul purane app jaisa. Admin nahi hai to login nahi hoga.
 */
export default function AdminLogin() {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  // pehle check: login hai to form dikhana hi nahi (Back dabane par login page flash na ho)
  const [checking, setChecking] = useState(true);

  // Pehle se login hai to seedha overview
  useEffect(() => {
    adminCheck()
      .then((r) => (r.ok ? router.replace("/admin/overview") : setChecking(false)))
      .catch(() => setChecking(false));
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    const id = adminId.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(id)) return setErr("Enter your admin ID (email).");
    if (!pass) return setErr("Enter your password.");
    setErr("");
    setBusy(true);
    try {
      await adminSignIn(id, pass);
      // replace: login page history mein na rahe — Back dabane par wapas login par nahi aayega
      router.replace("/admin/overview");
    } catch (ex) {
      setErr(ex.message || "Something went wrong. Try again.");
      setBusy(false);
    }
  };

  if (checking) return <div className="al-wait" aria-busy="true" style={{ minHeight: "100vh", background: "var(--ad-bg)" }} />;

  return (
    <div className="al">
      <div className="al-art" aria-hidden="true">
        <div className="al-logo">
          <span className="al-mark">geek</span>
          <span>
            <strong>Geek OS</strong>
            <small>Operations cloud</small>
          </span>
        </div>
        <div className="al-art__body">
          <p className="al-eye">Super Admin</p>
          <h2>Every campaign, creator and brand — one control room.</h2>
          <ul>
            <li>⚡ Approvals, videos and signups in one queue</li>
            <li>◈ Every campaign from brief to report</li>
            <li>♙ Creators, brands and messaging together</li>
          </ul>
        </div>
        <p className="al-foot">© Geek Creative Agency</p>
      </div>

      <main className="al-main">
        <form className="al-card" onSubmit={submit} noValidate>
          <div className="al-logo al-logo--m">
            <span className="al-mark">geek</span>
            <strong>Geek OS</strong>
          </div>
          <p className="ga-eyebrow">Geek OS / Super Admin</p>
          <h1 className="ga-h1">Sign in</h1>
          <p className="ga-sub">Enter your admin ID and password to continue.</p>

          <label className="ga-label" htmlFor="al-id">
            Admin ID (email)
          </label>
          <input id="al-id" className="ga-input" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="you@geekcreativeagency.com" value={adminId} onChange={(e) => { setAdminId(e.target.value); setErr(""); }} />

          <label className="ga-label" htmlFor="al-pass">
            Password
          </label>
          <div className="al-pass">
            <input id="al-pass" className="ga-input" type={show ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={pass} onChange={(e) => { setPass(e.target.value); setErr(""); }} />
            <button type="button" onClick={() => setShow(!show)}>
              {show ? "Hide" : "Show"}
            </button>
          </div>

          {err && <p className="al-err">{err}</p>}

          <button type="submit" className="ga-btn ga-btn--primary al-btn" disabled={busy}>
            {busy ? "Signing in…" : "Sign in →"}
          </button>
          <p className="al-note">
            <i /> Secure sign-in · Super Admin only
          </p>
        </form>
      </main>

      <style>{`
        .al { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 520px) minmax(0, 1fr); }
        .al-art { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; padding: 36px 40px; background: var(--ad-grad); color: #fff; overflow: hidden; }
        .al-art::after { content: ""; position: absolute; right: -120px; bottom: -120px; width: 380px; height: 380px; border-radius: 50%; background: rgba(255,255,255,.08); }
        .al-logo { display: flex; align-items: center; gap: 12px; }
        .al-logo strong { display: block; font-size: 21px; font-weight: 800; letter-spacing: -0.7px; }
        .al-logo small { display: block; margin-top: 3px; font-size: 9px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; opacity: .75; }
        .al-mark { width: 40px; height: 40px; border-radius: 11px; border: 1.5px solid currentColor; display: grid; place-items: center; font-size: 13px; font-weight: 800; letter-spacing: -1px; }
        .al-art__body { margin: auto 0; position: relative; z-index: 1; }
        .al-eye { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #e4ddff; }
        .al-art h2 { margin-top: 12px; font-family: var(--ad-head); font-size: 34px; font-weight: 800; letter-spacing: -1.2px; line-height: 1.15; }
        .al-art ul { list-style: none; margin: 26px 0 0; padding: 0; display: grid; gap: 10px; }
        .al-art li { padding: 12px 14px; border-radius: 13px; background: rgba(255,255,255,.12); font-size: 14px; font-weight: 700; }
        .al-foot { font-size: 12px; color: #e4ddff; position: relative; z-index: 1; }

        .al-main { display: grid; place-items: center; padding: 40px 32px; }
        .al-card { width: min(420px, 100%); padding: 32px 30px; border-radius: 22px; background: #fff; border: 1px solid var(--ad-line); box-shadow: 0 24px 60px -36px rgba(20,33,59,.4); }
        .al-logo--m { display: none; color: var(--ad-ink); margin-bottom: 22px; }
        .al-logo--m .al-mark { color: var(--ad-cyan); }
        .al-card .ga-sub { margin: 8px 0 22px; }
        .al-card .ga-label { margin-top: 14px; }
        .al-pass { position: relative; }
        .al-pass .ga-input { padding-right: 64px; }
        .al-pass button { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); height: 28px; padding: 0 10px; border: 0; border-radius: 8px; background: var(--ad-soft); font-size: 12px; font-weight: 700; color: var(--ad-muted-2); }
        .al-err { margin-top: 12px; padding: 9px 12px; border-radius: 10px; background: var(--ad-red-bg); color: var(--ad-red); font-size: 12.5px; font-weight: 700; }
        .al-btn { width: 100%; height: 46px; margin-top: 20px; }
        .al-note { margin-top: 16px; text-align: center; font-size: 12px; color: var(--ad-muted); }
        .al-note i { display: inline-block; width: 8px; height: 8px; margin-right: 4px; border-radius: 50%; background: var(--ad-green); }

        @media (max-width: 900px) {
          .al { grid-template-columns: 1fr; }
          .al-art { display: none; }
          .al-logo--m { display: flex; }
          .al-main { padding: 28px 16px; }
        }
        @media (max-width: 480px) { .al-card { padding: 26px 20px; } }
      `}</style>
    </div>
  );
}
