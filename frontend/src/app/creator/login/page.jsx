"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OnboardShell from "@/components/creator/OnboardShell";
import { sendOtp, invitePreview } from "@/services/creator";

/** /creator/login — WhatsApp number (step 1). Code bhejne par → /creator/verify */
export default function creatorLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [alerts, setAlerts] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState(null); // campaign invite (?cinv=) — kis brand ne bulaya

  // Verify se "Change number" par wapas aaye to number bhara rahe
  useEffect(() => {
    try {
      const p = JSON.parse(window.sessionStorage.getItem("bounty_login") || "{}");
      if (p.phone) setPhone(p.phone);
      if (p.alerts) setAlerts(true);
    } catch {
      /* ignore */
    }
    invitePreview().then((d) => d && setInvite(d)).catch(() => {});
  }, []);

  // WhatsApp par OTP bhejo (wa-otp-start) → code wala step
  const sendCode = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setErr("Enter a valid 10-digit WhatsApp number.");
      return;
    }
    setBusy(true);
    try {
      await sendOtp(phone);
      window.sessionStorage.setItem("bounty_login", JSON.stringify({ phone, alerts, at: Date.now() }));
      router.push("/creator/verify");
    } catch (ex) {
      setErr("Couldn't send the code: " + (ex.message || ex));
      setBusy(false);
    }
  };

  return (
    <>
      <title>Sign in — Bounty</title>
      <OnboardShell tone="dark" step={1} gate="guest">
        <form className="si" onSubmit={sendCode}>
          <h2 className="si-h">
            Hey, creator. 👋
            <br />
            Let&apos;s get you in.
          </h2>
          <p className="si-sub">Enter your WhatsApp number to discover collaborations made for you.</p>
          {invite && (
            <p className="si-note si-invite">
              <span aria-hidden="true">🎯</span>
              <span>
                {invite.first_name ? `Hi ${invite.first_name} — ` : ""}
                <b>{invite.brand || "A brand"}</b> invited you to <b>{invite.campaign || "a campaign"}</b>
                {invite.product ? ` (you get: ${invite.product})` : ""}. Continue with WhatsApp
                {invite.phone_hint ? ` using your number ending ${String(invite.phone_hint).replace(/•/g, "")}` : ""} — it opens right after sign-up.
              </span>
            </p>
          )}
          <label className="si-label" htmlFor="si-phone">
            WhatsApp number
          </label>
          <div className={`si-phone ${err ? "is-err" : ""}`}>
            <span className="si-phone__cc">
              <span aria-hidden="true">🇮🇳</span> +91
            </span>
            <input
              id="si-phone"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="Your 10-digit number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                setErr("");
              }}
            />
          </div>
          {err && <p className="si-err">{err}</p>}
          <p className="si-note">
            <span aria-hidden="true">🔒</span>
          <span>Only for sign-in and important campaign updates. No spam.</span>
          </p>
          <button type="submit" className="bx-btn bx-btn--cream bx-btn--lg bx-btn--block si-cta" disabled={busy}>
            {busy ? "Sending code…" : "Send verification code →"}
          </button>
          <Link href="/creator/explore" className="si-link si-link--c">
            I&apos;ll explore first
          </Link>
          <label className="si-check">
            <input type="checkbox" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} />
            <span>Send me matching campaign alerts on WhatsApp (optional).</span>
          </label>
        </form>
      </OnboardShell>

      <style>{`
        /* Figma: right panel ka type scale (Plus Jakarta Sans) */
        .si { display: flex; flex-direction: column; text-align: center; }
        .si-h { font-family: var(--bx-jak); font-size: 40px; font-weight: 800; line-height: 44px; letter-spacing: -1px; color: #fbf3e2; }
        .si-sub { margin: 9px 0 0; font-size: 15px; font-weight: 500; line-height: 21px; color: rgba(251,243,226,.95); }
        .si-label { margin: 20px 0 10px; font-size: 12px; font-weight: 800; line-height: 15px; letter-spacing: .7px; text-transform: uppercase; color: #f6d98b; }
        .si-phone { display: flex; align-items: center; height: 56px; padding-left: 17px; border-radius: 16px; border: 1px solid #e8b04a; background: rgba(8,30,21,.72); box-shadow: 0 10px 24px -14px rgba(0,0,0,.6); }
        .si-phone.is-err { border-color: #ff8b6b; }
        .si-phone__cc { display: inline-flex; align-items: center; gap: 12px; height: 28px; padding-right: 12px; border-right: 2px solid rgba(232,176,74,.45); font-size: 18px; font-weight: 700; color: #fbf3e2; }
        .si-phone__cc span { font-size: 20px; line-height: 1; }
        .si-phone input { flex: 1; min-width: 0; height: 100%; padding: 0 16px 0 28px; border: 0; outline: none; background: none; color: #fbf3e2; font-size: 16px; font-weight: 500; letter-spacing: .02em; }
        .si-phone input::placeholder { color: rgba(251,243,226,.95); letter-spacing: 0; }
        .si-err { margin: 6px 0 0; text-align: left; font-size: 12.5px; font-weight: 600; color: #ffb39e; }
        .si-note { display: flex; align-items: flex-start; gap: 9px; margin: 14px 0 0; padding: 10px 16px 11px 17px; border-radius: 14px; border: 1px solid rgba(232,176,74,.3); background: rgba(8,30,21,.6); text-align: left; font-size: 13.5px; font-weight: 500; line-height: 18.2px; color: rgba(251,243,226,.95); }
        .si-note > span:first-child { flex-shrink: 0; font-size: 12px; }
        .si-cta { height: 56px !important; margin-top: 34px; border-radius: 28px !important; background: #f6ebd3 !important; color: #14231a !important; font-family: var(--bx-jak); font-size: 18px !important; font-weight: 800 !important; letter-spacing: -0.1px; box-shadow: 0 10px 22px -10px rgba(0,0,0,.55) !important; }
        .si-link { margin: 18px auto 0; border: 0; background: none; padding: 0; font-size: 15px; font-weight: 700; line-height: 19px; text-decoration: underline; text-underline-offset: 3px; color: #fbf3e2; }
        .si-check { display: flex; align-items: flex-start; gap: 12px; margin-top: 26px; text-align: left; font-size: 14px; font-weight: 500; line-height: 18.9px; color: rgba(251,243,226,.95); cursor: pointer; }
        .si-check input { appearance: none; -webkit-appearance: none; width: 22px; height: 22px; margin: 0; flex-shrink: 0; border-radius: 5px; border: 1.5px solid rgba(251,243,226,.75); background: none; display: grid; place-items: center; cursor: pointer; }
        .si-check input:checked { background: #e8b04a; border-color: #e8b04a; }
        .si-check input:checked::after { content: "✓"; color: #14231a; font-size: 14px; font-weight: 800; line-height: 1; }
        /* OTP */
        .si-invite { margin: 0 0 14px; }
        .si-h--one { margin-top: 0; }
        .si-num { display: flex; align-items: center; justify-content: center; gap: 11px; flex-wrap: wrap; margin: 20px 0 0; font-size: 15px; font-weight: 500; line-height: 19px; color: rgba(251,243,226,.95); }
        .si-num a, .si-num button { border: 0; background: none; padding: 0; color: #f6d98b; font-weight: 700; }
        .si-otp { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 34px; }
        .si-otp input { width: 100%; height: 64px; border-radius: 12px; border: 1px solid rgba(232,176,74,.5); background: rgba(8,30,21,.72); color: #fbf3e2; text-align: center; font-size: 24px; font-weight: 800; outline: none; }
        .si-otp input:focus { border: 2px solid #e8b04a; }
        .si-exp { margin: 21px 0 0; font-size: 14px; font-weight: 500; color: rgba(251,243,226,.95); }
        .si-cta--otp { height: 54px !important; border-radius: 14px !important; }
        .si-resend { margin: 32px 0 0; font-size: 15px; font-weight: 500; color: rgba(251,243,226,.95); }
        .si-resend button { border: 0; background: none; padding: 0; color: #f6d98b; font-weight: 700; text-decoration: underline; }
        .si-note--otp { margin-top: 14px; }

        @media (max-width: 767px) {
          .si-h { font-size: 36px; line-height: 39.6px; letter-spacing: -0.89px; }
          .si-otp { gap: 7px; }
          .si-otp input { height: 64px; }
        }
      `}</style>
    </>
  );
}
