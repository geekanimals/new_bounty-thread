import { Fraunces, DM_Sans, Plus_Jakarta_Sans, Cinzel } from "next/font/google";

// Bounty creator ke fonts (Figma: Fraunces headings, DM Sans text, Jakarta onboarding, Cinzel logo)
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["400", "600", "700"], style: ["normal", "italic"] });
const dmSans = DM_Sans({ variable: "--font-dm", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["500", "700", "800"] });
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["700"] });

export const metadata = {
  title: "Bounty — Creator universe",
  description: "Bounty by Geek Creative Agency — discover brand collaborations, build your media kit and get paid.",
};

/**
 * /creator ke saare pages yahan se wrap hote hain (sirf creator side ka Bounty look).
 * Yahan sirf colours (CSS variables) aur chhote common classes hain — har page ka
 * baaki CSS uski apni page.jsx mein hai.
 */
export default function CreatorLayout({ children }) {
  return (
    <div className={`bx ${fraunces.variable} ${dmSans.variable} ${jakarta.variable} ${cinzel.variable}`}>
      {children}

      <style>{`
        .bx {
          --bx-ink: #14231a;
          --bx-text: #3e4b52;
          --bx-muted: #7a6a4a;
          --bx-faint: #a3967a;
          --bx-green: #123524;
          --bx-green-2: #163b2a;
          --bx-side: #0f2e22;
          --bx-deep: #0a2219;
          --bx-cream: #fbf3e2;
          --bx-paper: #f6ebd3;
          --bx-card: #fbf1dc;
          --bx-card-2: #f3e6c8;
          --bx-line: #e2d3b0;
          --bx-gold: #e8b04a;
          --bx-gold-2: #f6d98b;
          --bx-orange: #e8743a;
          --bx-rust: #c0702a;
          --bx-red: #b8401f;
          --bx-red-2: #e0392f;
          --bx-teal: #2e9c94;
          --bx-sky: #22b8e6;
          --bx-ok: #2f8f5b;
          --bx-ok-bg: #dff0dc;
          --bx-radius: 16px;
          --bx-serif: var(--font-fraunces), "Fraunces", Georgia, serif;
          --bx-sans: var(--font-dm), "DM Sans", system-ui, sans-serif;
          --bx-jak: var(--font-jakarta), "Plus Jakarta Sans", system-ui, sans-serif;
          --bx-logo: var(--font-cinzel), "Cinzel", Georgia, serif;
          min-height: 100vh;
          position: relative;
          isolation: isolate;
          background: var(--bx-paper);
          color: var(--bx-ink);
          font-family: var(--bx-sans);
          font-size: 14px;
          -webkit-font-smoothing: antialiased;
        }
        /* Parchment: Figma jaisa har screen par "cover + center" (scroll par apni jagah) */
        .bx::before { content: ""; position: fixed; inset: 0; z-index: -1; background: url("/creator/parchment.jpg") center / cover no-repeat, var(--bx-paper); pointer-events: none; }
        :where(.bx *), :where(.bx *)::before, :where(.bx *)::after { box-sizing: border-box; }
        :where(.bx a) { color: inherit; text-decoration: none; }
        :where(.bx button) { font: inherit; cursor: pointer; color: inherit; }
        :where(.bx input, .bx textarea, .bx select) { font: inherit; color: inherit; }
        :where(.bx img) { display: block; max-width: 100%; }
        :where(.bx h1, .bx h2, .bx h3) { margin: 0; }

        /* ---------- Buttons ---------- */
        :where(.bx-btn) {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          height: 40px; padding: 0 18px; border-radius: 999px; border: 1px solid transparent;
          font-family: var(--bx-jak); font-size: 14px; font-weight: 700; white-space: nowrap;
          transition: transform .15s, filter .2s, background .2s, border-color .2s;
        }
        :where(.bx-btn):active { transform: translateY(1px); }
        :where(.bx-btn):disabled { opacity: .5; cursor: not-allowed; }
        :where(.bx-btn--dark) { background: var(--bx-green); color: var(--bx-cream); }
        :where(.bx-btn--dark):hover { filter: brightness(1.15); }
        :where(.bx-btn--cream) { background: var(--bx-cream); color: var(--bx-ink); box-shadow: 0 6px 18px -10px rgba(0,0,0,.5); }
        :where(.bx-btn--cream):hover { filter: brightness(1.04); }
        :where(.bx-btn--ghost) { background: #fffaf0; border-color: var(--bx-line); color: var(--bx-ink); }
        :where(.bx-btn--ghost):hover { border-color: var(--bx-gold); }
        :where(.bx-btn--outline-light) { background: rgba(255,255,255,.06); border-color: rgba(246,217,139,.45); color: var(--bx-cream); }
        :where(.bx-btn--outline-light):hover { background: rgba(255,255,255,.12); }
        :where(.bx-btn--sky) { background: var(--bx-sky); color: #062a35; }
        :where(.bx-btn--danger) { background: var(--bx-red); color: #fff; }
        :where(.bx-btn--sm) { height: 32px; padding: 0 14px; font-size: 12px; }
        :where(.bx-btn--lg) { height: 50px; padding: 0 24px; font-size: 15px; }
        :where(.bx-btn--block) { width: 100%; }

        /* ---------- Cards / text ---------- */
        :where(.bx-card) {
          background: var(--bx-card);
          border: 1px solid var(--bx-line);
          border-radius: var(--bx-radius);
          box-shadow: 0 10px 24px -20px rgba(60,40,10,.45);
        }
        :where(.bx-card--dark) {
          background: linear-gradient(160deg, #163b2a 0%, #0f2e22 100%);
          border-color: rgba(232,176,74,.55);
          color: var(--bx-cream);
        }
        :where(.bx-eyebrow) { margin: 6px 0 2px; font-size: 11.5px; line-height: 15px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #b8452f; text-align: center; }
        :where(.bx-title) { font-family: var(--bx-serif); font-size: 32px; font-weight: 600; letter-spacing: -0.3px; line-height: 35.8px; text-align: center; color: #14231a; }
        :where(.bx-lede) { margin: 6px 0 0; font-family: var(--bx-serif); font-style: italic; font-size: 14.5px; line-height: 19.6px; color: #4a4436; text-align: center; }
        :where(.bx-section-label) {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin: 26px 0 14px; font-family: var(--bx-serif); font-size: 12px; line-height: 15px; font-weight: 600; letter-spacing: 1.7px; text-transform: uppercase; color: #14231a;
        }
        :where(.bx-section-label)::before, :where(.bx-section-label)::after { content: "—"; color: inherit; }
        :where(.bx-h2) { font-family: var(--bx-serif); font-size: 17px; font-weight: 600; }
        :where(.bx-sub) { margin: 3px 0 0; font-size: 12.5px; color: var(--bx-text); }

        /* ---------- Chips / pills / badges ---------- */
        :where(.bx-pill) {
          display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 16px;
          border-radius: 999px; border: 1px solid var(--bx-line); background: #fffaf0;
          font-size: 13px; font-weight: 600; color: var(--bx-ink); white-space: nowrap;
        }
        :where(.bx-pill.is-on) { background: var(--bx-green); border-color: var(--bx-green); color: var(--bx-cream); }
        :where(.bx-pill) em { font-style: normal; font-size: 11px; font-weight: 700; color: var(--bx-red); }
        :where(.bx-pill.is-on) em { color: var(--bx-gold-2); }
        :where(.bx-chip) {
          display: inline-flex; align-items: center; height: 32px; padding: 0 14px; border-radius: 999px;
          border: 1px solid var(--bx-line); background: #fffaf0; font-size: 13px; font-weight: 500; white-space: nowrap;
        }
        :where(.bx-chip.is-on) { background: #d6f1f6; border-color: var(--bx-sky); box-shadow: 0 0 0 2px rgba(34,184,230,.2); font-weight: 600; }
        :where(.bx-tag) {
          display: inline-flex; align-items: center; gap: 4px; height: 22px; padding: 0 8px; border-radius: 999px;
          background: #f6dfb8; color: #8a4a12; font-size: 11.5px; font-weight: 700; white-space: nowrap;
        }
        :where(.bx-tag--green) { background: var(--bx-ok-bg); color: var(--bx-ok); }
        :where(.bx-tag--red) { background: #f8dcd2; color: var(--bx-red); }
        :where(.bx-tag--teal) { background: #d3eeec; color: #1f6f69; }
        :where(.bx-tag--dark) { background: rgba(20,35,26,.85); color: var(--bx-gold-2); }
        :where(.bx-tag--grey) { background: #ece4d2; color: var(--bx-muted); }

        /* ---------- Form ---------- */
        :where(.bx-label) { display: block; margin: 0 0 6px; font-size: 12.5px; font-weight: 600; color: var(--bx-ink); }
        :where(.bx-label) small { margin-left: 6px; padding: 1px 6px; border-radius: 6px; background: #ece4d2; font-size: 10.5px; font-weight: 600; color: var(--bx-muted); }
        :where(.bx-input) {
          width: 100%; height: 44px; padding: 0 14px; border-radius: 12px;
          border: 1px solid var(--bx-line); background: #fffdf6; outline: none; font-size: 14px;
          transition: border-color .2s, box-shadow .2s;
        }
        :where(.bx-input):focus { border-color: var(--bx-gold); box-shadow: 0 0 0 3px rgba(232,176,74,.2); }
        textarea.bx-input { height: auto; min-height: 90px; padding: 12px 14px; resize: vertical; line-height: 1.5; }
        select.bx-input { appearance: none; background-image: linear-gradient(45deg, transparent 50%, #7a6a4a 50%), linear-gradient(135deg, #7a6a4a 50%, transparent 50%); background-position: calc(100% - 18px) 19px, calc(100% - 13px) 19px; background-size: 5px 5px; background-repeat: no-repeat; padding-right: 34px; }
        :where(.bx-hint) { margin: 6px 0 0; font-size: 11.5px; color: var(--bx-muted); }
        :where(.bx-err) { margin: 6px 0 0; font-size: 12px; color: var(--bx-red-2); }

        /* Toggle */
        :where(.bx-toggle) { position: relative; width: 42px; height: 24px; flex-shrink: 0; border: 0; padding: 0; border-radius: 999px; background: #d8ccb0; transition: background .2s; }
        :where(.bx-toggle)::after { content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.25); transition: transform .2s; }
        :where(.bx-toggle.is-on) { background: var(--bx-teal); }
        :where(.bx-toggle.is-on)::after { transform: translateX(18px); }

        /* Back link */
        :where(.bx-back) { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 14px; font-size: 13.5px; font-weight: 700; color: var(--bx-ink); }
        :where(.bx-back):hover { color: var(--bx-red); }

        /* Progress bar */
        :where(.bx-bar) { height: 8px; border-radius: 999px; background: #e9dcc0; overflow: hidden; }
        :where(.bx-bar) i { display: block; height: 100%; border-radius: inherit; background: var(--bx-teal); }

        /* Toast */
        :where(.bx-toast) {
          position: fixed; left: 50%; bottom: 28px; z-index: 120; transform: translateX(-50%);
          display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 999px;
          background: var(--bx-green); color: var(--bx-cream); font-size: 13px; font-weight: 600;
          box-shadow: 0 16px 40px -14px rgba(0,0,0,.55); max-width: calc(100vw - 40px);
          animation: bxToast .2s ease;
        }
        @keyframes bxToast { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }

        /* Popup (modal) */
        :where(.bx-overlay) { position: fixed; inset: 0; z-index: 100; background: rgba(10,20,14,.55); backdrop-filter: blur(2px); display: grid; place-items: center; padding: 20px; animation: bxFade .18s ease; }
        @keyframes bxFade { from { opacity: 0; } to { opacity: 1; } }
        :where(.bx-modal) { width: min(520px, 100%); max-height: calc(100vh - 40px); overflow-y: auto; border-radius: 20px; background: var(--bx-card); border: 1px solid var(--bx-line); box-shadow: 0 30px 80px -30px rgba(0,0,0,.6); animation: bxPop .2s ease; }
        @keyframes bxPop { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }
        :where(.bx-modal__head) { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--bx-line); }
        :where(.bx-modal__head) h2 { font-family: var(--bx-serif); font-size: 18px; font-weight: 600; }
        :where(.bx-modal__x) { width: 32px; height: 32px; border: 0; border-radius: 50%; background: rgba(0,0,0,.05); display: grid; place-items: center; }
        :where(.bx-modal__body) { padding: 18px 20px 20px; }

        @media (max-width: 767px) {
          :where(.bx-overlay) { align-items: end; padding: 0; }
          :where(.bx-modal) { width: 100%; max-height: 88vh; border-radius: 22px 22px 0 0; animation: bxUp .22s ease; }
          @keyframes bxUp { from { transform: translateY(30px); opacity: 0; } to { transform: none; opacity: 1; } }
        }

        /* ---------- Sidekicks hamesha halke se hilte rahein (har jagah) ---------- */
        @keyframes bxFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(-3deg); }
          50% { transform: translateY(-7px) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(3deg); }
        }
        @keyframes bxHop {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          40% { transform: translateY(-8px) scale(.97, 1.03); }
          55% { transform: translateY(0) scale(1.04, .96); }
          70% { transform: translateY(-2px) scale(1, 1); }
        }
        :where(.bx img[src*="/creator/pip.png"]) { animation: bxFloat 3.6s ease-in-out infinite; }
        :where(.bx img[src*="/creator/rumi.png"]) { animation: bxHop 2.8s ease-in-out infinite; }
        :where(.bx img[src*="/creator/mochi.png"]) { animation: bxHop 2.4s ease-in-out .3s infinite; }
        :where(.bx img[src*="/creator/sprout.png"]) { animation: bxFloat 3.2s ease-in-out .6s infinite; }
        :where(.bx img[src*="/creator/dot.png"]) { animation: bxFloat 2.9s ease-in-out .2s infinite; }
        :where(.bx img[src*="/creator/pebble.png"]) { animation: bxFloat 4.2s ease-in-out .9s infinite; }
        :where(.bx img[src*="/creator/pip.png"], .bx img[src*="/creator/rumi.png"], .bx img[src*="/creator/mochi.png"], .bx img[src*="/creator/sprout.png"], .bx img[src*="/creator/dot.png"], .bx img[src*="/creator/pebble.png"]) {
          transform-origin: 50% 90%; will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .bx img[src*="/creator/pip.png"], .bx img[src*="/creator/rumi.png"], .bx img[src*="/creator/mochi.png"],
          .bx img[src*="/creator/sprout.png"], .bx img[src*="/creator/dot.png"], .bx img[src*="/creator/pebble.png"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
