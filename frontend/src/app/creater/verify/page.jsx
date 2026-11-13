"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OnboardShell from "@/components/creater/OnboardShell";
import { sendOtp, verifyOtp, afterLoginRoute } from "@/services/creator";

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** /creater/verify — WhatsApp OTP (step 2). Back → /creater/login */
export default function CreaterVerify() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [alerts, setAlerts] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [expires, setExpires] = useState(600);
  const [resend, setResend] = useState(30);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const boxes = useRef([]);

  // Number login page se aata hai; na ho to wapas login
  useEffect(() => {
    let p = {};
    try {
      p = JSON.parse(window.sessionStorage.getItem("bounty_login") || "{}");
    } catch {
      /* ignore */
    }
    if (!p.phone) {
      router.replace("/creater/login");
      return;
    }
    setPhone(p.phone);
    setAlerts(!!p.alerts);
    setTimeout(() => boxes.current[0]?.focus(), 50);
  }, [router]);

  // OTP timers
  useEffect(() => {
    const t = setInterval(() => {
      setExpires((s) => Math.max(0, s - 1));
      setResend((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const setDigit = (i, v) => {
    const d = v.replace(/\D/g, "");
    if (d.length > 1) {
      // paste — saare boxes bhar do
      const arr = d.slice(0, 6).split("");
      const next = [...otp];
      arr.forEach((x, k) => {
        if (i + k < 6) next[i + k] = x;
      });
      setOtp(next);
      boxes.current[Math.min(5, i + arr.length)]?.focus();
      return;
    }
    const next = [...otp];
    next[i] = d;
    setOtp(next);
    if (d && i < 5) boxes.current[i + 1]?.focus();
  };

  const onKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) boxes.current[i + 1]?.focus();
  };

  const code = otp.join("");
  // wa-otp-verify → session → purane bootOS jaisa agla step (Instagram / setup / app)
  const verify = async (e) => {
    e?.preventDefault?.();
    if (code.length < 6 || expires === 0 || busy) return;
    setBusy(true);
    setErr("");
    try {
      const c = await verifyOtp(phone, code, { alerts });
      try {
        window.sessionStorage.removeItem("bounty_login");
      } catch {
        /* ignore */
      }
      // OTP history mein na rahe — Back se seedha number wala page
      router.replace(afterLoginRoute(c));
    } catch (ex) {
      setErr("Couldn't verify: " + (ex.message || ex));
      setBusy(false);
    }
  };
  // 6 digit bharte hi verify (purane app jaisa)
  useEffect(() => {
    if (code.length === 6) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);
  const resendCode = async () => {
    setResend(30);
    setExpires(600);
    setOtp(["", "", "", "", "", ""]);
    setErr("");
    boxes.current[0]?.focus();
    try {
      await sendOtp(phone);
    } catch (ex) {
      setErr("Couldn't send the code: " + (ex.message || ex));
    }
  };

  const masked = phone ? `+91${phone.slice(0, 2)}•••• ••${phone.slice(-3)}` : "";

  return (
    <>
      <title>Verify — Bounty</title>
      <OnboardShell tone="dark" step={2} back="/creater/login" gate="guest">
        <form className="si" onSubmit={verify}>
          <h2 className="si-h">One last step.</h2>
          <p className="si-sub">Enter the 6-digit code sent to your WhatsApp number.</p>
          <p className="si-num">
            {masked}
            <Link href="/creater/login">Change number</Link>
          </p>
          <div className="si-otp">
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => (boxes.current[i] = el)}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={6}
                value={d}
                aria-label={`Digit ${i + 1}`}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                onFocus={(e) => e.target.select()}
              />
            ))}
          </div>
          <p className="si-exp">{expires > 0 ? `Code expires in ${fmt(expires)}` : "Code expired — tap Resend."}</p>
          {err && <p className="si-err">{err}</p>}
          <button type="submit" className="bx-btn bx-btn--cream bx-btn--lg bx-btn--block si-cta si-cta--otp" disabled={code.length < 6 || expires === 0 || busy}>
            {busy ? "Signing in…" : <>Verify &amp; continue →</>}
          </button>
          <p className="si-resend">
            Didn&apos;t receive a code?{" "}
            {resend > 0 ? (
              <span>Resend in {resend}s</span>
            ) : (
              <button type="button" onClick={resendCode}>
                Resend code
              </button>
            )}
          </p>
          <p className="si-note">
            <span aria-hidden="true">🔒</span>
          <span>We&apos;ll only use WhatsApp for secure sign-in and important campaign updates.</span>
          </p>
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
