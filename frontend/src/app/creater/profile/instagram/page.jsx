"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import { useSession } from "@/components/creater/session";
import { CREATOR } from "@/components/creater/data";
import { Check, Instagram } from "@/components/ui/Icons";

/** /creater/profile/instagram — verified Instagram, connected accounts, privacy */
export default function InstagramPrivacy() {
  const [s, update] = useSession();
  const locked = !s.ig;
  const [accounts, setAccounts] = useState([{ handle: CREATOR.handle, followers: CREATOR.followers, active: true, img: CREATOR.avatar }]);
  const [confirm, setConfirm] = useState(null);
  const [showExp, setShowExp] = useState(false);
  const [toast, setToast] = useState("");

  // Locked (Instagram nahi) to list khaali
  useEffect(() => {
    if (locked) setAccounts([]);
  }, [locked]);

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2200);
  };

  const disconnect = (h) => {
    const next = accounts.filter((a) => a.handle !== h);
    setAccounts(next);
    setConfirm(null);
    // Aakhri account hata diya to app locked mode mein
    if (!next.length) update({ ig: false });
    flash(`${h} disconnected`);
  };

  return (
    <BountyShell>
      <title>Instagram & privacy — Bounty</title>
      <Link href="/creater/profile" className="pf-back ig-back">
        ← My profile
      </Link>

      {locked ? (
        <section className="pf-card ig-lock">
          <span className="ig-lock__ic">📸</span>
          <h1>Connect Instagram</h1>
          <p>Your verified Instagram unlocks campaigns and builds your media kit. Official Meta connection — we never see your password.</p>
          <Link href="/creater/onboarding/meta" className="pf-btn ig-add">
            <Instagram size={15} /> Connect with Instagram
          </Link>
        </section>
      ) : (
        <section className="pf-card ig-ver">
          <div className="ig-ver__top">
            <span className="ig-tag">Verified Instagram</span>
            <strong>{CREATOR.handle}</strong>
            <span className="ig-dotsep">·</span>
            <a href={`https://www.instagram.com/${CREATOR.user}/`} target="_blank" rel="noreferrer" className="ig-open">
              Open
            </a>
          </div>
          <p className="ig-nums">
            <span>
              Followers: <b>{CREATOR.followers}</b>
            </span>
            <span>
              Following: <b>{CREATOR.following}</b>
            </span>
            <span>
              Posts: <b>{CREATOR.posts}</b>
            </span>
          </p>
          <p className="ig-note">
            Instagram identity is verified and read-only. Need a change?{" "}
            <button type="button" className="ig-ulink" onClick={() => flash("Request sent — Geek team will reach out on WhatsApp")}>
              Request correction / reconnect
            </button>
          </p>
        </section>
      )}

      <section className="pf-card ig-box">
        <div className="ig-box__head">
          <h2>Your Instagram accounts</h2>
          <span>Instagram only</span>
        </div>
        <p className="ig-desc">
          Run a food page, a brand page or a second account? Connect it with Instagram — exactly like your first one. Switch between them in the Media Kit and when posting; when you apply to a campaign you choose which account to apply with.
        </p>
        {accounts.length === 0 && <p className="ig-empty">No Instagram connected yet.</p>}
        <ul className="ig-list">
          {accounts.map((a) => (
            <li key={a.handle}>
              <img src={a.img} alt="" />
              <span className="ig-list__txt">
                <strong>
                  {a.handle} {a.active && <em>Active</em>}
                </strong>
                <small>{a.followers} followers</small>
              </span>
              {confirm === a.handle ? (
                <span className="ig-confirm">
                  Disconnect?
                  <button type="button" className="ig-btn ig-btn--red" onClick={() => disconnect(a.handle)}>
                    Yes
                  </button>
                  <button type="button" className="ig-btn" onClick={() => setConfirm(null)}>
                    No
                  </button>
                </span>
              ) : (
                <span className="ig-confirm">
                  <small>In use</small>
                  <button type="button" className="ig-btn" onClick={() => setConfirm(a.handle)}>
                    Disconnect
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
        <Link href="/creater/onboarding/meta" className="pf-btn ig-add">
          📸 + Connect {accounts.length ? "another" : "an"} Instagram
        </Link>
      </section>

      <section className="pf-card ig-box">
        <div className="ig-box__head">
          <h2>Visibility and privacy settings</h2>
        </div>
        <p className="ig-desc">Private always: WhatsApp, email, full DOB, marital status, anniversary, full address.</p>
        <label className="ig-check">
          <input
            type="checkbox"
            checked={showExp}
            onChange={(e) => {
              setShowExp(e.target.checked);
              flash(e.target.checked ? "Brands can see your verified experience" : "Verified experience hidden from brands");
            }}
          />
          Show my verified brand experience to brands
        </label>
        <p className="ig-small">Disabling data sharing may reduce Verified Data Coverage — it never lowers Performance, raises Fraud risk, or labels you unreliable.</p>
      </section>

      {toast && (
        <div className="bx-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

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
        .ig-back { margin-bottom: 16px; }
        .ig-ver, .ig-box, .ig-lock { margin-bottom: 8px; }
        .ig-ver { padding: 16px 18px; }
        .ig-box { padding: 18px 20px 18px; }
        .ig-box + .ig-box { margin-top: 16px; }
        .ig-ver__top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .ig-tag { padding: 3px 8px; border-radius: 999px; background: #f6d2df; color: #c13584; font-size: 10px; font-weight: 600; letter-spacing: .2px; text-transform: uppercase; }
        .ig-ver__top strong { font-size: 16px; font-weight: 700; overflow-wrap: anywhere; }
        .ig-dotsep { font-size: 16px; }
        .ig-open { font-size: 16px; font-weight: 400; color: #0000ee; text-decoration: underline; }
        .ig-nums { display: flex; gap: 16px; flex-wrap: wrap; margin: 8px 0 8px; font-size: 13px; }
        .ig-nums b { font-weight: 700; }
        .ig-note { margin: 0; font-size: 12px; color: #6b5a3a; }
        .ig-ulink { padding: 0; border: 0; background: none; font-size: 12px; color: #0000ee; text-decoration: underline; }
        .ig-box__head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin: 0 -20px; padding: 0 20px 12px; border-bottom: 1px solid var(--bx-line); }
        .ig-box h2 { font-family: var(--bx-sans); font-size: 15px; font-weight: 700; letter-spacing: -0.1px; }
        .ig-box__head span { font-size: 12px; color: #6b5a3a; }
        .ig-desc { margin: 14px 0 10px; font-size: 13px; color: #7a6a4a; line-height: 1.35; }
        .ig-box:last-of-type .ig-desc { font-size: 12px; color: #6b5a3a; }
        .ig-empty { margin: 0 0 10px; font-size: 13px; color: #7a6a4a; }
        .ig-list { list-style: none; margin: 0 0 8px; padding: 0; display: grid; gap: 8px; }
        .ig-list li { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: #efe5cf; flex-wrap: wrap; }
        .ig-list img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
        .ig-list__txt { flex: 1; min-width: 160px; }
        .ig-list__txt strong { display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 700; flex-wrap: wrap; }
        .ig-list__txt em { padding: 1px 7px; border-radius: 999px; background: #e1d9c8; font-style: normal; font-size: 10px; font-weight: 600; letter-spacing: .2px; text-transform: uppercase; color: #7a8290; }
        .ig-list__txt small { font-size: 13px; color: #7a6a4a; }
        .ig-confirm { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; }
        .ig-confirm small { font-size: 12px; font-weight: 400; color: #7a6a4a; }
        .ig-btn { height: 38px; padding: 0 18px; border-radius: 999px; border: 1px solid #c9b88f; background: #fffdf8; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: var(--bx-ink); }
        .ig-btn--red { border-color: var(--bx-red); background: var(--bx-red); color: #fff; }
        .ig-add { height: 38px; padding: 0 18px; }
        .ig-check { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
        .ig-check input { width: 14px; height: 14px; margin: 0; accent-color: var(--bx-green); }
        .ig-small { margin: 10px 0 0; font-size: 12px; color: #6b5a3a; }
        .ig-lock { text-align: center; padding: 28px 20px; }
        .ig-lock__ic { font-size: 34px; }
        .ig-lock h1 { margin: 8px 0 6px; font-family: var(--bx-sans); font-size: 18px; font-weight: 700; }
        .ig-lock p { max-width: 460px; margin: 0 auto 16px; font-size: 13px; color: #6b5a3a; }
        @media (max-width: 767px) {
          .ig-ver, .ig-box { padding: 16px; }
          .ig-box__head { margin: 0 -16px; padding: 0 16px 12px; }
          .ig-open { flex-basis: 100%; }
          .ig-confirm { width: 100%; }
        }
      `}</style>
    </BountyShell>
  );
}
