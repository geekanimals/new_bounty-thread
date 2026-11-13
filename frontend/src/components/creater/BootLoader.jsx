"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/creater/Logo";
import { getSidekick } from "@/components/creater/data";
import { lastKid } from "@/services/creator";

/**
 * "Getting your world ready…" — login ke baad pehli screen se pehle wala loader (purane app ka b2-boot).
 * Jo sidekick creator ne chuna hai wahi dikhta hai, halka sa hilta-dulta (motion).
 * kid na mile to is browser ka aakhri chuna hua (bx_prefs_last) — purane jaisa.
 */
export default function BootLoader({ kid, text = "Getting your world ready…" }) {
  // "" = abhi pata nahi (pehla paint) — tab tak sidekick chhupa rehta hai, taaki galat wala flash na ho
  const [last, setLast] = useState("");
  useEffect(() => {
    if (kid) return;
    setLast(lastKid());
  }, [kid]);
  const known = kid || last;
  const sk = getSidekick(known || "pip");

  return (
    <div className="bl-boot" role="status" aria-live="polite">
      <div className="bl-boot__in">
        <Logo tone="light" size={30} />
        <a className="bl-boot__by" href="https://geekcreativeagency.com/" target="_blank" rel="noopener noreferrer">
          by geek
        </a>
        <div className="bl-boot__orb">
          {known && <img key={sk.id} src={sk.img} alt="" />}
        </div>
        <p className="bl-boot__t">{text}</p>
        <div className="bl-boot__bar" aria-hidden="true">
          <i />
        </div>
      </div>
      <style>{`
        .bl-boot {
          position: fixed; inset: 0; z-index: 5000; display: grid; place-items: center; overflow: hidden;
          background: url("/creater/forest-gate.jpg") center top / cover no-repeat, #0f2e22;
        }
        .bl-boot::before { content: ""; position: absolute; inset: 0; background: rgba(6,20,13,.35); }
        .bl-boot__in { position: relative; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 20px; text-align: center; }
        .bl-boot__by { margin-top: -2px; font-family: var(--bx-jak); font-size: 15px; font-weight: 700; color: #2ec5ea; text-decoration: none; }
        .bl-boot__orb {
          width: 190px; height: 190px; margin: 20px 0 8px; border-radius: 50%; display: grid; place-items: center;
          background: radial-gradient(circle, rgba(232,176,74,.24), rgba(18,53,36,.55) 70%);
          animation: blGlow 2.4s ease-in-out infinite;
        }
        .bl-boot__orb img { width: 150px; height: auto; filter: drop-shadow(0 10px 14px rgba(0,0,0,.35)); animation: blBob 2.4s ease-in-out infinite; transform-origin: 50% 90%; }
        .bl-boot__t { margin: 0; font-family: var(--bx-serif); font-style: italic; font-size: 17px; font-weight: 400; color: #f6d98b; }
        .bl-boot__bar { width: 200px; height: 6px; margin-top: 6px; border-radius: 3px; background: rgba(255,255,255,.15); overflow: hidden; }
        .bl-boot__bar i { display: block; width: 40%; height: 100%; border-radius: 3px; background: #e8b04a; animation: blSlide 1.2s ease-in-out infinite; }
        @keyframes blBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-6px) rotate(-3deg); }
          50% { transform: translateY(-10px) rotate(0deg) scale(1.03); }
          75% { transform: translateY(-6px) rotate(3deg); }
        }
        @keyframes blGlow { 50% { box-shadow: 0 0 46px 6px rgba(232,176,74,.18); } }
        @keyframes blSlide { 0% { transform: translateX(-110%); } 100% { transform: translateX(260%); } }
        /* Desktop par sidekick bada, mobile par chhota */
        @media (min-width: 1024px) {
          .bl-boot { background-position: center 62%; }
          .bl-boot .bl-word { font-size: 40px; }
          .bl-boot__by { font-size: 17px; }
          .bl-boot__orb { width: 270px; height: 270px; margin: 26px 0 10px; }
          .bl-boot__orb img { width: 215px; }
          .bl-boot__t { font-size: 20px; }
          .bl-boot__bar { width: 240px; }
        }
        @media (max-width: 767px) {
          .bl-boot__orb { width: 160px; height: 160px; margin: 16px 0 6px; }
          .bl-boot__orb img { width: 122px; }
          .bl-boot__t { font-size: 16px; }
          .bl-boot__bar { width: 180px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bl-boot__orb, .bl-boot__orb img, .bl-boot__bar i { animation: none; }
        }
      `}</style>
    </div>
  );
}
