"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { captureInvite, readIgReturn, useCreatorGate } from "@/services/creator";
import OnboardShell, { VideoModal } from "@/components/creator/OnboardShell";
import Logo from "@/components/creator/Logo";
import BootLoader from "@/components/creator/BootLoader";
import { SIDEKICKS } from "@/components/creator/data";

/**
 * /creator — Welcome screen (mobile). Desktop par seedha /creator/login
 * (wahan left side mein welcome already dikhta hai).
 * Har step alag route: /creator → /creator/login → /creator/verify (Back ek-ek step).
 */
export default function creatorWelcome() {
  const router = useRouter();
  const pathname = usePathname() || "/creator";
  const [video, setVideo] = useState(false);
  const [igBack, setIgBack] = useState(false);

  useEffect(() => {
    // Instagram se wapsi (/app.html → /legacy → /creator?code&state) → loader page usko poora karega
    const ig = readIgReturn();
    if (ig) {
      setIgBack(true);
      router.replace("/creator/onboarding/connecting" + window.location.search);
      return;
    }
    captureInvite(); // ?cinv= / ?apply= rakh lo — login ke baad campaign khulega
    if (window.matchMedia("(min-width: 768px)").matches) router.replace("/creator/login");
  }, [router]);

  // Login ho chuka hai to seedha app / agla step (purane app jaisa)
  const gc = useCreatorGate(igBack ? null : "guest", router, pathname);
  // Login ho chuka (Back se aaye) ya Instagram se wapsi → welcome mat dikhao, loader + aage
  if (igBack || !gc.ready || gc.loggedIn) return <BootLoader kid={gc.loggedIn ? gc.prefs?.kid : ""} />;

  return (
    <>
      <title>Welcome — Bounty</title>

      <section className="si-welcome">
        <div className="si-welcome__top">
          <Logo size={26} withTag />
          <h1>
            Your next dream
            <br />
            brand starts here.
          </h1>
          <p>
            Discover collaborations. Create your story.
            <br />
            Grow on your terms.
          </p>
        </div>
        {/* Sidekicks rock ledge par (Figma order) — background ke saath align */}
        <div className="si-welcome__kids">
          {["pip", "rumi", "mochi", "sprout", "dot", "pebble"].map((id) => {
            const k = SIDEKICKS.find((x) => x.id === id);
            return <img key={id} src={k.img} alt={k.name} />;
          })}
        </div>
        <div className="si-welcome__cta">
          <button type="button" className="si-welcome__go" onClick={() => router.push("/creator/login")}>
            Find my collaborations →
          </button>
          <button type="button" className="si-link" onClick={() => setVideo(true)}>
            See how it works
          </button>
          <p className="si-welcome__line">
            <i />
            <b />
            <i />
          </p>
          <p className="si-welcome__foot">Real brands • Clear briefs • Your choice</p>
          <p className="si-welcome__by">by Geek Creative Agency</p>
        </div>
      </section>

      {/* Desktop: redirect hone tak sirf frame */}
      <div className="si-desk">
        <OnboardShell tone="dark" step={1}>
          <span />
        </OnboardShell>
      </div>

      <VideoModal
        open={video}
        onClose={() => setVideo(false)}
        onFind={() => {
          setVideo(false);
          router.push("/creator/login");
        }}
      />

      <style>{`
        .si-welcome { display: none; }
        @media (max-width: 767px) {
          .si-desk { display: none; }
          /* Poori screen mein fit — scroll nahi (Figma 390×844) */
          .si-welcome {
            position: relative; display: block; height: 100vh; height: 100dvh; min-height: 560px; overflow: hidden;
            text-align: center; color: #fbf3e2; font-family: var(--bx-jak);
            background: url("/creator/forest-gate.jpg") center / cover, #0f2e22;
          }
          .si-welcome__top { padding: 37px 20px 0; }
          .si-welcome h1 { margin: 24px 0 0; font-family: var(--bx-serif); font-size: 40px; font-weight: 600; line-height: 44px; letter-spacing: -0.4px; color: #fbf3e2; }
          .si-welcome__top p { margin: 20px 0 0; font-size: 14.5px; font-weight: 500; line-height: 21px; color: #f4eedf; }
          /* ledge ki height = 50% + 19.5% of image height (cover) */
          .si-welcome__kids {
            position: absolute; left: 0; right: 0; height: 70px; top: calc(50% + 0.195 * max(100dvh, 177.6vw) - 100px);
            display: flex; justify-content: center; align-items: flex-end; gap: 1.2%; padding: 0 10px;
          }
          .si-welcome__kids img { width: 15.4%; max-width: 84px; filter: drop-shadow(0 6px 8px rgba(0,0,0,.45)); }
          /* Neeche thoda gap (Safari bar / home indicator se door) */
          .si-welcome__cta { position: absolute; left: 30px; right: 30px; bottom: calc(26px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; align-items: center; }
          .si-welcome__go {
            width: 100%; height: 57px; border: 0; border-radius: 28.7px; background: #f6ebd3; color: #14231a;
            font-family: var(--bx-jak); font-size: 17px; font-weight: 800; letter-spacing: -0.1px; box-shadow: 0 10px 22px -10px rgba(0,0,0,.6);
          }
          .si-link { margin: 20px 0 0; border: 0; background: none; padding: 0; font-family: var(--bx-jak); font-size: 15px; font-weight: 700; line-height: 19px; text-decoration: underline; text-underline-offset: 3px; color: #fbf3e2; }
          .si-welcome__line { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 21px 0 0; }
          .si-welcome__line i { width: 88px; height: 1px; background: rgba(232,176,74,.6); }
          .si-welcome__line b { width: 11px; height: 11px; background: #e8b04a; }
          .si-welcome__foot { margin: 9px 0 0; font-size: 13px; font-weight: 500; line-height: 17px; color: #f4eedf; }
          .si-welcome__by { margin: 22px 0 0; font-size: 11.5px; font-weight: 500; line-height: 15px; color: rgba(251,243,226,.95); }
        }
        /* Chhoti screens (SE / Safari bars): neeche ka hissa thoda compact */
        @media (max-width: 767px) and (max-height: 740px) {
          .si-welcome__top { padding-top: 26px; }
          .si-welcome h1 { margin-top: 16px; font-size: 36px; line-height: 40px; }
          .si-welcome__top p { margin-top: 14px; }
          .si-welcome__go { height: 52px; }
          .si-link { margin-top: 14px; }
          .si-welcome__line { margin-top: 12px; }
          .si-welcome__foot { margin-top: 6px; }
          .si-welcome__by { margin-top: 10px; }
          .si-welcome__cta { bottom: calc(18px + env(safe-area-inset-bottom)); }
        }
      `}</style>
    </>
  );
}
