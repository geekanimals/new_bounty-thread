import { Plus_Jakarta_Sans } from "next/font/google";

// Brand panel ka font (Figma: Plus Jakarta Sans)
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Brand workspace — Geek OS",
  description: "Geek OS for brands — approve creators, review videos and track every campaign live.",
};

/**
 * /brands ke saare pages yahan se wrap hote hain.
 * Yahan sirf brand panel ke colours (CSS variables) aur chhote common classes hain
 * (button, card, badge, input) — har page ka baaki CSS uski apni page.jsx mein hai.
 */
export default function BrandsLayout({ children }) {
  return (
    <div className={`br ${jakarta.variable}`}>
      {children}

      <style>{`
        .br {
          --br-bg: #f4f5fa;
          --br-card: #ffffff;
          --br-border: #e8e9f1;
          --br-border-2: #dfe0ea;
          --br-ink: #12102a;
          --br-text: #3b3d55;
          --br-muted: #6b6e85;
          --br-faint: #9a9cb0;
          --br-primary: #6d4aff;
          --br-primary-dark: #5a37f0;
          --br-grad: linear-gradient(135deg, #6d4aff 0%, #a855f7 100%);
          --br-lilac: #f1edff;
          --br-lilac-2: #e7e0ff;
          --br-side: #0d0b1e;
          --br-side-2: #1a1735;
          --br-green: #16a34a;
          --br-green-bg: #e8f8ee;
          --br-wa: #22c55e;
          --br-orange: #e07b06;
          --br-orange-bg: #fff3e2;
          --br-red: #e5484d;
          --br-red-bg: #fdecec;
          --br-blue: #2563eb;
          --br-blue-bg: #eaf2ff;
          --br-pink: #e8336d;
          --br-pink-bg: #fde8ef;
          --br-fb: #1877f2;
          --br-hero: linear-gradient(120deg, #120d2c 0%, #2a1240 55%, #5b1a4a 100%);
          --br-radius: 16px;
          min-height: 100vh;
          background: var(--br-bg);
          color: var(--br-ink);
          font-family: var(--font-jakarta), "Plus Jakarta Sans", system-ui, sans-serif;
          font-size: 14px;
          -webkit-font-smoothing: antialiased;
        }
        :where(.br) *, :where(.br) *::before, :where(.br) *::after { box-sizing: border-box; }
        :where(.br) a { color: inherit; text-decoration: none; }
        :where(.br) button { font: inherit; cursor: pointer; }
        :where(.br) input, :where(.br) textarea, :where(.br) select { font: inherit; color: inherit; }

        /* ---------- Buttons ---------- */
        .br-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 40px;
          padding: 0 16px;
          border-radius: 10px;
          border: 1px solid transparent;
          font-size: 13.5px;
          font-weight: 600;
          white-space: nowrap;
          transition: background .2s, transform .15s, box-shadow .2s, border-color .2s;
        }
        .br-btn:active { transform: translateY(1px); }
        .br-btn--primary {
          background: linear-gradient(135deg, #5f3dfa 0%, #7c5cff 100%);
          color: #fff;
          box-shadow: 0 8px 20px -10px rgba(95, 61, 250, .8);
        }
        .br-btn--primary:hover { background: linear-gradient(135deg, #5232ef 0%, #6d4aff 100%); }
        .br-btn--ghost {
          background: #fff;
          border-color: var(--br-border-2);
          color: var(--br-ink);
        }
        .br-btn--ghost:hover { background: #f7f7fb; }
        .br-btn--dark { background: var(--br-ink); color: #fff; }
        .br-btn--dark:hover { background: #000; }
        .br-btn--wa { background: var(--br-wa); color: #fff; }
        .br-btn--wa:hover { background: #16a34a; }
        .br-btn--sm { height: 32px; padding: 0 12px; font-size: 12.5px; border-radius: 8px; }
        .br-btn--block { width: 100%; }

        /* ---------- Card ---------- */
        .br-card {
          background: var(--br-card);
          border: 1px solid var(--br-border);
          border-radius: var(--br-radius);
        }

        /* ---------- Badges ---------- */
        .br-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 22px;
          padding: 0 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        .br-badge::before {
          content: "";
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }
        .br-badge--plain::before { display: none; }
        .br-badge--barter, .br-badge--orange { background: var(--br-orange-bg); color: var(--br-orange); }
        .br-badge--paid, .br-badge--green { background: var(--br-green-bg); color: var(--br-green); }
        .br-badge--violet { background: var(--br-lilac); color: var(--br-primary); }
        .br-badge--blue { background: var(--br-blue-bg); color: var(--br-blue); }
        .br-badge--red { background: var(--br-red-bg); color: var(--br-red); }
        .br-badge--grey { background: #eef0f5; color: var(--br-muted); }

        /* ---------- Forms ---------- */
        .br-label {
          display: block;
          margin: 0 0 7px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--br-text);
        }
        .br-input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border: 1px solid var(--br-border-2);
          border-radius: 10px;
          background: #fff;
          font-size: 14px;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        textarea.br-input { height: auto; padding: 12px 14px; line-height: 1.55; resize: vertical; }
        .br-input:focus {
          border-color: var(--br-primary);
          box-shadow: 0 0 0 3px rgba(109, 74, 255, .15);
        }
        .br-input::placeholder { color: var(--br-faint); }

        /* ---------- Back link ---------- */
        .br-back {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          font-size: 13px;
          font-weight: 600;
          color: var(--br-text);
        }
        .br-back span {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          border: 1px solid var(--br-border);
          background: #fff;
          display: grid;
          place-items: center;
        }
        .br-back:hover { color: var(--br-primary); }

        /* ---------- Page heading ---------- */
        .br-h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .br-sub {
          margin: 6px 0 0;
          font-size: 13.5px;
          color: var(--br-muted);
        }

        /* ---------- Load more ---------- */
        .br-more {
          display: flex;
          justify-content: center;
          margin-top: 18px;
        }


        /* ---------- Brand panel ke common pieces ---------- */
        .br-btn--pink { background: var(--br-pink); color: #fff; }
        .br-btn--danger { background: var(--br-red); color: #fff; }
        .br-btn--danger:hover { background: #d63b40; }
        .br-btn--soft { background: var(--br-lilac); color: var(--br-primary); }
        .br-btn--soft:hover { background: var(--br-lilac-2); }
        .br-btn:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }

        /* Eyebrow (chhota upar wala label: TODAY, SOCIAL…) */
        .br-eyebrow {
          margin: 0 0 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--br-primary);
        }
        /* Page heading row: title left, action right */
        .br-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        /* Underline tabs (Approvals, Discovery, Facebook, Campaign) */
        .br-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--br-border);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .br-tabs::-webkit-scrollbar { display: none; }
        .br-tabs a, .br-tabs button {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 11px 12px;
          margin-bottom: -1px;
          border: 0;
          border-bottom: 2px solid transparent;
          background: none;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--br-muted);
          white-space: nowrap;
        }
        .br-tabs a:hover, .br-tabs button:hover { color: var(--br-ink); }
        .br-tabs .is-active { color: var(--br-ink); font-weight: 700; border-bottom-color: var(--br-primary); }
        .br-tabs em {
          font-style: normal;
          min-width: 20px;
          height: 18px;
          padding: 0 6px;
          border-radius: 999px;
          background: #eceef5;
          color: var(--br-muted);
          font-size: 10.5px;
          font-weight: 700;
          display: inline-grid;
          place-items: center;
        }
        .br-tabs .is-active em { background: var(--br-primary); color: #fff; }

        /* Segmented pills (All 6 · Live 3 …) */
        .br-seg {
          display: inline-flex;
          gap: 2px;
          padding: 3px;
          border-radius: 11px;
          background: #eceef5;
          max-width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .br-seg::-webkit-scrollbar { display: none; }
        .br-seg button {
          flex-shrink: 0;
          height: 30px;
          padding: 0 12px;
          border: 0;
          border-radius: 8px;
          background: none;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--br-muted);
          white-space: nowrap;
        }
        .br-seg button.is-on { background: #fff; color: var(--br-ink); font-weight: 700; box-shadow: 0 1px 4px rgba(18,16,42,.08); }

        /* Chips (niche, filters) */
        .br-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid var(--br-border-2);
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          color: var(--br-ink);
          white-space: nowrap;
        }
        .br-chip.is-on { background: var(--br-ink); border-color: var(--br-ink); color: #fff; font-weight: 600; }
        .br-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 24px;
          padding: 0 10px;
          border-radius: 999px;
          background: #f1f2f7;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--br-text);
          white-space: nowrap;
        }
        .br-tag::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: currentColor; opacity: .55; }

        /* Avatar (initials on gradient) */
        .br-av {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
        }
        .br-av--sm { width: 28px; height: 28px; font-size: 10px; }
        .br-av--lg { width: 48px; height: 48px; font-size: 15px; }

        /* Stat cards (pehla card dark) */
        .br-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
        .br-stat {
          padding: 18px;
          border-radius: var(--br-radius);
          background: #fff;
          border: 1px solid var(--br-border);
          min-width: 0;
        }
        .br-stat--dark { background: linear-gradient(140deg, #14112e 0%, #2c2470 100%); border-color: transparent; color: #fff; }
        .br-stat__label { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; color: var(--br-text); }
        .br-stat--dark .br-stat__label { color: #fff; }
        .br-stat__icon {
          width: 30px; height: 30px; border-radius: 9px;
          display: grid; place-items: center;
          background: var(--br-lilac); color: var(--br-primary);
        }
        .br-stat--dark .br-stat__icon { background: rgba(255,255,255,.12); color: #d9d2ff; }
        .br-stat__value { margin: 14px 0 4px; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
        .br-stat__note { margin: 0; font-size: 12px; color: var(--br-faint); }
        .br-stat--dark .br-stat__note { color: #b9b4e0; }

        /* Card heading row */
        .br-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
        .br-card__title { margin: 0; font-size: 16px; font-weight: 800; letter-spacing: -0.01em; }
        .br-card__sub { margin: 3px 0 0; font-size: 12.5px; color: var(--br-muted); }
        .br-link { font-size: 13px; font-weight: 700; color: var(--br-primary); display: inline-flex; align-items: center; gap: 4px; }

        /* Table — mobile par side scroll */
        .br-table-wrap { overflow-x: auto; border: 1px solid var(--br-border); border-radius: var(--br-radius); background: #fff; }
        .br-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .br-table th {
          padding: 12px 14px;
          text-align: left;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--br-faint);
          background: #fafafd;
          border-bottom: 1px solid var(--br-border);
          white-space: nowrap;
        }
        .br-table td { padding: 11px 14px; border-bottom: 1px solid var(--br-border); vertical-align: middle; white-space: nowrap; }
        .br-table tr:last-child td { border-bottom: 0; }
        .br-who { display: flex; align-items: center; gap: 10px; }
        .br-who strong { display: block; font-size: 13px; font-weight: 700; }
        .br-who small { display: block; font-size: 11.5px; color: var(--br-muted); }

        /* Toggle switch */
        .br-toggle {
          position: relative;
          width: 36px;
          height: 20px;
          flex-shrink: 0;
          border: 0;
          border-radius: 999px;
          background: #d7d9e4;
          transition: background .2s;
          padding: 0;
        }
        .br-toggle::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,.2);
          transition: transform .2s;
        }
        .br-toggle.is-on { background: var(--br-green); }
        .br-toggle.is-on::after { transform: translateX(16px); }

        /* Progress bar */
        .br-bar { height: 6px; border-radius: 999px; background: #eceef5; overflow: hidden; }
        .br-bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #6d4aff, #a855f7); }

        /* Toast (chhota message neeche) */
        .br-toast {
          position: fixed;
          left: 50%;
          bottom: 24px;
          z-index: 80;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 16px;
          border-radius: 12px;
          background: var(--br-ink);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 16px 40px -16px rgba(18,16,42,.6);
          animation: brToast .2s ease;
          max-width: calc(100vw - 40px);
        }
        @keyframes brToast { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }

        /* Post thumbnail (gradient tile) */
        .br-thumb { display: block; position: relative; border-radius: 14px; overflow: hidden; aspect-ratio: 4 / 5; }
        .br-thumb__rank { position: absolute; top: 10px; left: 10px; padding: 2px 8px; border-radius: 999px; background: #fff; font-size: 11px; font-weight: 800; }
        .br-thumb__play { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,.28); color: #fff; display: grid; place-items: center; }
        .br-thumb__views { position: absolute; left: 10px; bottom: 10px; display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; background: rgba(0,0,0,.35); color: #fff; font-size: 11.5px; font-weight: 700; }

        @media (max-width: 640px) {
          .br-h1 { font-size: 22px; }
          .br-stat { padding: 15px; }
          .br-stat__value { font-size: 24px; }
          .br-head { align-items: flex-start; margin-bottom: 18px; }
        }
      `}</style>
    </div>
  );
}
