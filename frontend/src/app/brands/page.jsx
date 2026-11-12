"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Facebook, Send, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, TrendUp, Building } from "@/components/ui/Icons";

const FACES = [
  { i: "MI", g: "linear-gradient(135deg,#ff8fb1,#ffc3d6)" },
  { i: "TS", g: "linear-gradient(135deg,#ffa94d,#ffd29a)" },
  { i: "RK", g: "linear-gradient(135deg,#5b8cff,#9db8ff)" },
  { i: "AK", g: "linear-gradient(135deg,#b84dff,#e39bff)" },
];

/** /brands — brand login (email + password ya Facebook) */
export default function BrandSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("priya.menon@nykaa.com");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr("Enter your work email.");
    if (!pass.trim()) return setErr("Enter your password.");
    setErr("");
    setBusy(true);
    setTimeout(() => router.push("/brands/dashboard"), 500);
  };

  return (
    <div className="bl">
      <title>Brand sign in — Geek OS</title>

      {/* Left: dark panel */}
      <aside className="bl-art">
        <Link href="/brands" className="bl-logo">
          <span className="bl-logo__mark">g</span>
          <strong>Geek OS</strong>
          <span className="bl-logo__tag">for Brands</span>
        </Link>

        <div className="bl-art__mid">
          <h1>
            Your creator{" "}
            <br />
            campaigns, live.
          </h1>
          <p>Approve creators, watch every video before it goes out, and see each post’s views and sales — the moment they happen.</p>
          <div className="bl-cards">
            <div className="bl-card">
              <small>Approvals waiting</small>
              <span className="bl-faces">
                {FACES.map((f) => (
                  <i key={f.i} style={{ background: f.g }}>
                    {f.i}
                  </i>
                ))}
              </span>
              <strong>7 creators · 2 videos</strong>
            </div>
            <div className="bl-card">
              <small>Views this week</small>
              <b>2.84M</b>
              <em>
                <TrendUp size={12} /> +31% vs last week
              </em>
            </div>
          </div>
        </div>

        <p className="bl-art__foot">Trusted by beauty, fashion &amp; D2C brands across India</p>
      </aside>

      {/* Right: form */}
      <main className="bl-main">
        <form className="bl-form" onSubmit={submit} noValidate>
          <span className="bl-pill">
            <span>
              <Building size={11} />
            </span>
            Brand login
          </span>
          <h2>Welcome back</h2>
          <p className="bl-sub">Sign in to see your campaigns, approvals and results.</p>

          <button type="button" className="bl-fb" onClick={() => router.push("/brands/dashboard")}>
            <Facebook size={15} /> Continue with Facebook
          </button>

          <p className="bl-or">
            <span>or with email</span>
          </p>

          <label className="br-label" htmlFor="bl-email">
            Work email
          </label>
          <div className="bl-field">
            <Send size={14} />
            <input id="bl-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@brand.com" />
          </div>

          <div className="bl-row">
            <label className="br-label" htmlFor="bl-pass">
              Password
            </label>
            <Link href="/brands/forgot-password" className="bl-forgot">
              Forgot password?
            </Link>
          </div>
          <div className="bl-field">
            <Lock size={14} />
            <input
              id="bl-pass"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Your password"
            />
            <button type="button" className="bl-eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {err && <p className="bl-err">{err}</p>}

          <button type="submit" className="bl-submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"} <ArrowRight size={15} />
          </button>

          <p className="bl-note">
            <ShieldCheck size={14} />
            <span>
              Brand accounts are created by Geek Creative Agency.
              <br />
              New here? Ask your account manager for an invite.
            </span>
          </p>
        </form>
      </main>

      <style>{`
        .bl { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 44%) minmax(0, 1fr); background: #fff; }
        .bl-art {
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; padding: 40px 44px;
          color: #fff;
          background:
            radial-gradient(70% 55% at 100% 0%, rgba(176,40,110,.55) 0%, rgba(176,40,110,0) 70%),
            radial-gradient(60% 45% at 10% 100%, rgba(109,74,255,.45) 0%, rgba(109,74,255,0) 70%),
            linear-gradient(160deg, #2a0f2e 0%, #3b1236 50%, #24123a 100%);
        }
        .bl-logo { display: inline-flex; align-items: center; gap: 10px; }
        .bl-logo__mark { width: 34px; height: 34px; border-radius: 10px; background: var(--br-grad); display: grid; place-items: center; font-weight: 800; font-size: 18px; }
        .bl-logo strong { font-size: 18px; font-weight: 800; }
        .bl-logo__tag { padding: 3px 9px; border-radius: 999px; border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.08); font-size: 11px; font-weight: 600; }
        .bl-art__mid { margin: auto 0; padding: 40px 0; }
        .bl-art h1 { margin: 0 0 16px; font-size: clamp(34px, 3.4vw, 48px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.08; }
        .bl-art__mid > p { margin: 0 0 26px; max-width: 400px; font-size: 14.5px; line-height: 1.6; color: rgba(255,255,255,.78); }
        .bl-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 420px; }
        .bl-card { padding: 14px; border-radius: 14px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(6px); }
        .bl-card small { display: block; margin-bottom: 8px; font-size: 11.5px; color: rgba(255,255,255,.75); }
        .bl-card strong { display: block; font-size: 14px; font-weight: 700; }
        .bl-card b { display: block; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
        .bl-card em { display: inline-flex; align-items: center; gap: 4px; font-style: normal; font-size: 11.5px; font-weight: 700; color: #4ade80; }
        .bl-faces { display: flex; margin-bottom: 8px; }
        .bl-faces i { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #3b1236; margin-left: -6px; display: grid; place-items: center; font-style: normal; font-size: 9px; font-weight: 700; }
        .bl-faces i:first-child { margin-left: 0; }
        .bl-art__foot { margin: 0; font-size: 12px; color: rgba(255,255,255,.55); }

        .bl-main { display: grid; place-items: center; padding: 40px 32px; }
        .bl-form { width: 100%; max-width: 380px; }
        .bl-pill { display: inline-flex; align-items: center; gap: 8px; height: 30px; padding: 0 12px 0 4px; border-radius: 999px; background: var(--br-pink-bg); color: var(--br-pink); font-size: 12px; font-weight: 700; }
        .bl-pill span { width: 22px; height: 22px; border-radius: 50%; background: var(--br-pink); color: #fff; display: grid; place-items: center; }
        .bl-form h2 { margin: 16px 0 6px; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
        .bl-sub { margin: 0 0 22px; font-size: 13.5px; color: var(--br-muted); }
        .bl-fb {
          width: 100%; height: 44px; display: flex; align-items: center; justify-content: center; gap: 8px;
          border: 0; border-radius: 10px; background: var(--br-fb); color: #fff; font-size: 14px; font-weight: 700;
        }
        .bl-fb:hover { background: #0f68dc; }
        .bl-or { position: relative; margin: 20px 0 16px; text-align: center; font-size: 11.5px; color: var(--br-faint); }
        .bl-or::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: var(--br-border); }
        .bl-or span { position: relative; padding: 0 10px; background: #fff; }
        .bl-field {
          display: flex; align-items: center; gap: 10px; height: 46px; padding: 0 12px 0 14px; margin-bottom: 16px;
          border: 1px solid var(--br-border-2); border-radius: 11px; color: var(--br-faint); transition: border-color .2s, box-shadow .2s;
        }
        .bl-field:focus-within { border-color: var(--br-primary); box-shadow: 0 0 0 3px rgba(109,74,255,.15); }
        .bl-field input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font-size: 14px; color: var(--br-ink); }
        .bl-eye { border: 0; background: none; color: var(--br-muted); padding: 4px; display: grid; }
        .bl-row { display: flex; justify-content: space-between; align-items: baseline; }
        .bl-forgot { font-size: 12.5px; font-weight: 600; color: var(--br-primary); }
        .bl-err { margin: -6px 0 12px; font-size: 12.5px; color: var(--br-red); }
        .bl-submit {
          width: 100%; height: 46px; display: flex; align-items: center; justify-content: center; gap: 8px;
          border: 0; border-radius: 11px; background: linear-gradient(90deg, #12102a, #2b2470); color: #fff;
          font-size: 14px; font-weight: 700;
        }
        .bl-submit:disabled { opacity: .7; }
        .bl-note { display: flex; gap: 10px; margin: 18px 0 0; padding: 12px 14px; border-radius: 11px; background: #f4f5fa; font-size: 12px; line-height: 1.5; color: var(--br-muted); }
        .bl-note svg { flex-shrink: 0; margin-top: 2px; }

        @media (max-width: 900px) {
          .bl { grid-template-columns: 1fr; }
          .bl-art { padding: 22px 20px 24px; }
          .bl-art__mid { padding: 22px 0 0; margin: 0; }
          .bl-art h1 { font-size: 28px; margin-bottom: 8px; }
          .bl-art h1 br { display: none; }
          .bl-art__mid > p { margin-bottom: 0; font-size: 13.5px; }
          .bl-cards, .bl-art__foot { display: none; }
          .bl-main { padding: 28px 20px 40px; place-items: start center; }
        }
      `}</style>
    </div>
  );
}
