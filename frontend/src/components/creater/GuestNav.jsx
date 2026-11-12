"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRumiTip } from "@/components/creater/rumiBus";
import Link from "next/link";
import { Home, Megaphone, BarChart, User } from "@/components/ui/Icons";

/**
 * Guest (bina login) pages ka mobile footer — app jaisa hi fixed bottom nav.
 * Guest ke liye Analytics / Profile / Rumi → sign in.
 */
export default function GuestNav({ active = "home" }) {
  // Mobile par page ki baat isi footer wale Rumi se (page par alag Rumi nahi)
  const tip = useRumiTip();
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  useEffect(() => setHidden(false), [pathname]);
  return (
    <>
      {/* Desktop: sidekick right-bottom kone mein, page ki baat wahi bolta hai */}
      <Link href="/creater/login" className="gn-float" aria-label="Rumi — sign in">
        <img src="/creater/rumi.png" alt="" />
        <span>Rumi</span>
      </Link>
      {tip && !hidden && (
        <div className="gn-tip gn-tip--desk" role="status">
          <p>
            <b>{tip.name}:</b> {tip.text}
          </p>
          <button type="button" onClick={() => setHidden(true)} aria-label="Close tip">
            ×
          </button>
        </div>
      )}
    <nav className="gn" aria-label="Main">
      {tip && !hidden && (
        <div className="gn-tip" role="status">
          <p>
            <b>{tip.name}:</b> {tip.text}
          </p>
          <button type="button" onClick={() => setHidden(true)} aria-label="Close tip">
            ×
          </button>
        </div>
      )}
      <Link href="/creater/explore" className={active === "home" ? "is-active" : ""}>
        <span>
          <Home size={18} />
        </span>
        Home
      </Link>
      <Link href="/creater/explore" className={active === "campaigns" ? "is-active" : ""}>
        <span>
          <Megaphone size={18} />
        </span>
        Campaigns
      </Link>
      <Link href="/creater/login" className="gn-rumi">
        <img src="/creater/rumi.png" alt="" />
        Rumi
      </Link>
      <Link href="/creater/login">
        <span>
          <BarChart size={18} />
        </span>
        Analytics
      </Link>
      <Link href="/creater/login">
        <span>
          <User size={18} />
        </span>
        Profile
      </Link>
      <style>{`
        .rt-page { display: none !important; }
        .gn-float { position: fixed; right: 26px; bottom: 22px; z-index: 46; display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .gn-float img { width: 92px; height: 92px; object-fit: contain; filter: drop-shadow(0 10px 14px rgba(40,25,5,.45)); }
        .gn-float span { padding: 3px 10px; border-radius: 999px; background: #123524; border: 1px solid rgba(232,176,74,.7); color: #fbf3e2; font-family: var(--bx-serif); font-size: 12.5px; font-weight: 600; }
        .gn-tip--desk {
          position: fixed; right: 132px; bottom: 74px; z-index: 45; display: flex; align-items: flex-start; gap: 8px; max-width: 300px;
          padding: 11px 12px 11px 16px; border-radius: 16px; background: #fff8e6; border: 1.5px solid #e8b04a; box-shadow: 0 14px 30px -16px rgba(0,0,0,.6);
        }
        .gn-tip--desk::before { content: ""; position: absolute; right: -8px; bottom: 18px; width: 13px; height: 13px; background: #fff8e6; border-right: 1.5px solid #e8b04a; border-top: 1.5px solid #e8b04a; transform: rotate(45deg); }
        .gn-tip--desk p { flex: 1; margin: 0; font-family: var(--bx-serif); font-style: italic; font-size: 13.5px; line-height: 18.2px; color: #14231a; }
        .gn-tip--desk b { margin-right: 3px; font-style: normal; font-weight: 700; color: #b8452f; }
        .gn-tip--desk button { border: 0; background: none; color: #8a7a5a; padding: 0 2px; font-size: 20px; line-height: 18px; }
        @media (max-width: 767px) { .gn-float, .gn-tip--desk { display: none !important; } }
        .gn { display: none; }
        @media (max-width: 767px) {
          .rt-page { display: none !important; }
          .gn-tip {
            position: fixed; left: 46px; right: 46px; bottom: 92px; z-index: 36; display: flex; align-items: center; gap: 10px;
            padding: 12px 14px 12px 16px; border-radius: 14px; background: #fff8e6; border: 1.5px solid #e8b04a;
            box-shadow: 0 14px 30px -16px rgba(0,0,0,.6); animation: bxPop .2s ease;
          }
          .gn-tip::before { content: ""; position: absolute; left: 50%; bottom: -8px; margin-left: -6px; width: 13px; height: 13px; background: #fff8e6; border-right: 1.5px solid #e8b04a; border-bottom: 1.5px solid #e8b04a; transform: rotate(45deg); }
          .gn-tip p { flex: 1; margin: 0; font-family: var(--bx-serif); font-style: italic; font-size: 13.5px; line-height: 18.2px; color: #14231a; }
          .gn-tip b { margin-right: 3px; font-style: normal; font-weight: 700; color: #b8452f; }
          .gn-tip button { align-self: flex-start; border: 0; background: none; color: #8a7a5a; padding: 0 2px; font-size: 20px; line-height: 20px; }
          .gn {
            position: fixed; left: 0; right: 0; bottom: 0; z-index: 35; display: grid; grid-template-columns: repeat(5, 1fr); align-items: end;
            height: 72px; padding: 0 6px calc(6px + env(safe-area-inset-bottom)); background: #0f2e22; border-top: 1px solid rgba(232,176,74,.35);
          }
          .gn a { display: flex; flex-direction: column; align-items: center; gap: 4px; padding-bottom: 6px; font-size: 11.5px; font-weight: 600; color: #d9cdb2; }
          .gn a span { width: 42px; height: 32px; border-radius: 10px; display: grid; place-items: center; border: 1px solid transparent; }
          .gn a.is-active { color: var(--bx-cream); }
          .gn a.is-active span { border-color: rgba(232,176,74,.8); background: rgba(232,176,74,.14); }
          .gn-rumi { color: var(--bx-cream) !important; }
          .gn-rumi img { width: 62px; height: 62px; margin-top: -30px; padding: 4px; border-radius: 50%; object-fit: contain; background: radial-gradient(circle, #1d4a35, #0f2e22); border: 2px solid var(--bx-gold); }
        }
      `}</style>
    </nav>
    </>
  );
}
