"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import { useSession, errText, reloadProfile, loadCreator, getNotifyPrefs, startWaLink, verifyWaLink, startEmailOtp, verifyEmailOtp } from "@/services/creator";
import { Check } from "@/components/ui/Icons";

/** 6 dabbe wala code input (WhatsApp + email dono mein) */
function CodeBoxes({ code, setCode, boxes, label = "Digit" }) {
  const typeDigit = (i, v) => {
    const raw = v.replace(/\D/g, "");
    const next = [...code];
    if (raw.length > 1) {
      // paste kiya — saare dabbe bhar do
      raw.slice(0, 6).split("").forEach((d, k) => (next[k] = d));
      setCode(next);
      boxes.current[Math.min(raw.length, 6) - 1]?.focus();
      return;
    }
    next[i] = raw;
    setCode(next);
    if (raw && i < 5) boxes.current[i + 1]?.focus();
  };
  return (
    <div className="ct-boxes">
      {code.map((d, i) => (
        <input
          key={i}
          ref={(el) => (boxes.current[i] = el)}
          inputMode="numeric"
          maxLength={6}
          value={d}
          aria-label={`${label} ${i + 1}`}
          onChange={(e) => typeDigit(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d && i > 0) boxes.current[i - 1]?.focus();
          }}
        />
      ))}
    </div>
  );
}

const EMPTY6 = ["", "", "", "", "", ""];

/**
 * WhatsApp link (purane whatsapp.js ka "link" mode): wa-otp-start → 6 digit code → wa-otp-verify { link: true }
 * Server number ko ISI account se jodta hai (naya login nahi banta). Linked hai ya nahi → my_notify_prefs.whatsapp_linked
 */
function WhatsAppLink({ phone }) {
  const [linked, setLinked] = useState(null); // null = pata kar rahe
  const [num, setNum] = useState("");
  const [step, setStep] = useState("view"); // view | enter | code
  const [code, setCode] = useState(EMPTY6);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const boxes = useRef([]);
  const sentTo = useRef("");

  const check = async () => {
    const r = await getNotifyPrefs();
    setLinked(!!(r.data && r.data.whatsapp_linked));
  };
  useEffect(() => {
    check();
  }, []);

  const digits = num.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  const start = async () => {
    if (!/^[6-9]\d{9}$/.test(digits)) return setErr("Enter your 10-digit WhatsApp number.");
    setErr("");
    setBusy(true);
    sentTo.current = "+91" + digits;
    const r = await startWaLink(sentTo.current);
    setBusy(false);
    if (r.error) return setErr("Couldn't send: " + errText(r.error));
    setCode(EMPTY6);
    setStep("code");
    setTimeout(() => boxes.current[0]?.focus(), 30);
  };
  const verify = async () => {
    const c = code.join("");
    if (c.length < 6) return setErr("Enter the 6-digit code.");
    setErr("");
    setBusy(true);
    const r = await verifyWaLink(sentTo.current, c);
    setBusy(false);
    if (r.error) return setErr("Couldn't verify: " + errText(r.error));
    await loadCreator({ force: true }); // lock (join needs) bhi khul jaye
    await check();
    setStep("view");
  };

  const shown = phone || (sentTo.current && linked ? sentTo.current : "");
  return (
    <div>
      <label className="pf-label" htmlFor="ct-wa">
        WhatsApp number <small>Private</small>
      </label>
      {step === "view" ? (
        <>
          <div className="ct-row">
            <input id="ct-wa" className="pf-input" value={shown} placeholder={linked === false ? "Not linked yet" : ""} readOnly aria-readonly="true" />
            {linked ? (
              <span className="bx-tag bx-tag--green ct-ver">✓ Verified</span>
            ) : linked === false ? (
              <button type="button" className="pf-btn" onClick={() => { setNum((phone || "").replace(/\D/g, "").slice(-10)); setStep("enter"); }}>
                Link WhatsApp
              </button>
            ) : null}
          </div>
          <p className="pf-hint">{linked ? "Campaign alerts come to this WhatsApp." : linked === false ? "Link WhatsApp to get campaign alerts and unlock applying." : "Checking…"}</p>
          {linked && (
            <button type="button" className="ct-change" onClick={() => { setNum(""); setStep("enter"); }}>
              Change number
            </button>
          )}
        </>
      ) : (
        <>
          <div className="ct-row">
            <input
              id="ct-wa"
              className="pf-input"
              inputMode="tel"
              placeholder="98123 45678"
              value={num}
              disabled={step === "code"}
              onChange={(e) => setNum(e.target.value)}
            />
            <button type="button" className="pf-btn" onClick={start} disabled={step === "code" || busy}>
              {busy && step !== "code" ? "Sending…" : "Send code"}
            </button>
          </div>
          <p className="pf-hint">We'll send a 6-digit code to your WhatsApp.</p>
          {step === "code" && (
            <div className="ct-code">
              <p>
                Code sent to <b>{sentTo.current}</b> on WhatsApp
              </p>
              <CodeBoxes code={code} setCode={setCode} boxes={boxes} />
              <div className="ct-code__btns">
                <button type="button" className="pf-btn" onClick={verify} disabled={busy}>
                  {busy ? "Checking…" : "Verify & link"}
                </button>
                <button type="button" className="ct-change" onClick={start} disabled={busy}>
                  Resend
                </button>
                <button type="button" className="ct-change" onClick={() => { setStep("view"); setErr(""); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {err && <p className="bx-err">{err}</p>}
    </div>
  );
}

/** /creater/profile/contact — WhatsApp (link / verified) + backup email (6-digit code se verify) */
export default function Contact() {
  const [s] = useSession();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("enter"); // enter | code | done
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [err, setErr] = useState("");
  const boxes = useRef([]);

  useEffect(() => {
    if (s.backupEmail) {
      setEmail(s.backupEmail);
      setStep("done");
    }
  }, [s.backupEmail]);

  const okEmail = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());

  // email-otp edge function (purane profile.js jaisa): start → code → verify (server tabhi save karta hai)
  const sendCode = async () => {
    if (!okEmail) {
      setErr("Enter a valid email, like you@gmail.com");
      return;
    }
    if (s.backupEmail && email.trim().toLowerCase() === s.backupEmail.toLowerCase()) {
      setErr("This email is already verified.");
      return;
    }
    setErr("");
    setBusy(true);
    const r = await startEmailOtp(email.trim().toLowerCase());
    setBusy(false);
    if (r.error) return setErr(r.error.message);
    setCode(["", "", "", "", "", ""]);
    setStep("code");
    setTimeout(() => boxes.current[0]?.focus(), 30);
  };

  const verify = async () => {
    if (code.join("").length < 6) {
      setErr("Enter all 6 digits.");
      return;
    }
    setErr("");
    setBusy(true);
    const r = await verifyEmailOtp(code.join(""));
    setBusy(false);
    if (r.error) return setErr(r.error.message);
    await reloadProfile();
    setStep("done");
  };

  return (
    <BountyShell>
      <title>Contact — Bounty</title>
      <Link href="/creater/profile" className="pf-back">
        ← My profile
      </Link>

      <section className="pf-card ct">
        <h1 className="pf-h">Contact</h1>
        <div className="ct-grid">
          <WhatsAppLink phone={s.phone} />

          <div>
            <label className="pf-label" htmlFor="ct-mail">
              Backup email (account recovery) * <small>Private</small>
            </label>
            {step === "done" ? (
              <>
                <div className="ct-row">
                  <input className="pf-input" value={email} readOnly />
                  <span className="bx-tag bx-tag--green ct-ver">✓ Verified</span>
                </div>
                <button type="button" className="ct-change" onClick={() => setStep("enter")}>
                  Change email
                </button>
              </>
            ) : (
              <>
                <div className="ct-row">
                  <input
                    id="ct-mail"
                    type="email"
                    className="pf-input"
                    placeholder="you@gmail.com"
                    value={email}
                    disabled={step === "code"}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="button" className="pf-btn" onClick={sendCode} disabled={step === "code" || busy}>
                    {busy && step !== "code" ? "Sending…" : "Verify"}
                  </button>
                </div>
                <p className="pf-hint">We'll email you a 6-digit code to confirm.</p>
              </>
            )}

            {step === "code" && (
              <div className="ct-code">
                <p>
                  Code sent to <b>{email}</b>
                </p>
                <CodeBoxes code={code} setCode={setCode} boxes={boxes} />
                <div className="ct-code__btns">
                  <button type="button" className="pf-btn" onClick={verify} disabled={busy}>
                    {busy ? "Checking…" : "Confirm code"}
                  </button>
                  <button type="button" className="ct-change" onClick={() => setStep("enter")}>
                    Change email
                  </button>
                </div>
              </div>
            )}
            {err && <p className="bx-err">{err}</p>}
          </div>
        </div>
        <p className="ct-note">Campaign updates reach you on both WhatsApp and email, and in your dashboard alerts. Never shown to brands.</p>
      </section>

      <style>{`
        /* Figma: DM Sans form card — header line, safed inputs, "Private" chip */
        .pf-back { display: inline-block; margin: 4px 0 26px; font-size: 14px; font-weight: 700; color: var(--bx-ink); }
        .pf-back:hover { color: var(--bx-red); }
        .pf-card { padding: 20px 20px 18px; border-radius: 16px; background: rgba(251,241,220,.82); border: 1px solid var(--bx-line); box-shadow: 0 10px 24px -20px rgba(60,40,10,.45); }
        .pf-h { margin: 0 0 12px; padding-bottom: 14px; font-family: var(--bx-sans); font-size: 15px; font-weight: 700; letter-spacing: -0.1px; border-bottom: 1px solid var(--bx-line); }
        .pf-label { display: flex; align-items: center; gap: 8px; margin: 0 0 7px; font-size: 12.5px; font-weight: 600; color: #6b5a3a; }
        .pf-label small { padding: 1px 6px; border-radius: 5px; background: #ebe2cd; font-size: 10px; font-weight: 600; color: #7a8290; }
        .pf-input { width: 100%; height: 38px; padding: 0 10px; border-radius: 10px; border: 1px solid #d9c9a3; background: #fffdf8; outline: none; font-size: 14px; font-weight: 500; color: var(--bx-ink); }
        .pf-input::placeholder { color: #757575; }
        .pf-input:focus { border-color: var(--bx-gold); box-shadow: 0 0 0 3px rgba(232,176,74,.2); }
        select.pf-input { appearance: none; }
        textarea.pf-input { height: auto; padding: 9px 10px; }
        .pf-hint { margin: 6px 0 0; font-size: 12px; color: #6b5a3a; }
        .pf-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 38px; padding: 0 16px; border: 0; border-radius: 999px; background: var(--bx-green); color: var(--bx-cream); font-family: var(--bx-jak); font-size: 14px; font-weight: 700; white-space: nowrap; }
        .pf-btn:disabled { opacity: .5; cursor: not-allowed; }
        @media (max-width: 767px) {
          .pf-back { margin-bottom: 20px; }
          .pf-card { padding: 16px; }
        }
        .ct-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; align-items: start; }
        .ct-row { display: flex; align-items: center; gap: 8px; }
        .ct-row .pf-input { flex: 1; min-width: 0; }
        .ct-row .pf-input[readonly] { background: #fffdf8; }
        .ct-ver { height: 28px; flex-shrink: 0; padding: 0 10px; font-size: 12.5px; font-weight: 700; color: #1f9d5a; }
        .ct-ver::before { display: none; }
        .ct-change { margin-top: 6px; padding: 0; border: 0; background: none; font-size: 12.5px; font-weight: 700; color: var(--bx-teal); text-decoration: underline; }
        .ct-code { margin-top: 12px; padding: 14px; border-radius: 12px; background: #fffaf0; border: 1px dashed var(--bx-line); }
        .ct-code p { margin: 0 0 10px; font-size: 12.5px; color: var(--bx-text); overflow-wrap: anywhere; }
        .ct-boxes { display: flex; gap: 8px; }
        .ct-boxes input { width: 44px; height: 48px; border-radius: 10px; border: 1px solid var(--bx-line); background: #fffdf6; text-align: center; font-size: 18px; font-weight: 700; outline: none; min-width: 0; }
        .ct-boxes input:focus { border-color: var(--bx-gold); box-shadow: 0 0 0 3px rgba(232,176,74,.2); }
        .ct-code__btns { display: flex; align-items: center; gap: 14px; margin-top: 12px; }
        .ct-code__btns .ct-change { margin: 0; }
        .ct-note { margin: 14px 0 0; font-size: 12px; line-height: 1.5; color: #6b5a3a; }
        @media (max-width: 760px) {
          .ct-grid { grid-template-columns: 1fr; }
          .ct-boxes { gap: 6px; }
          .ct-boxes input { flex: 1; width: auto; }
        }
      `}</style>
    </BountyShell>
  );
}
