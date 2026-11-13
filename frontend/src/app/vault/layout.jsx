import { DM_Sans, Manrope } from "next/font/google";

// Super Admin ke fonts (Figma: DM Sans text, Manrope headings/numbers)
const dmSans = DM_Sans({ variable: "--font-ad-dm", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const manrope = Manrope({ variable: "--font-ad-man", subsets: ["latin"], weight: ["600", "700", "800"] });

export const metadata = {
  title: "Geek OS — Super Admin",
  description: "Geek OS operations cloud — campaigns, creators, brands, messaging and settings in one place.",
};

/**
 * /vault ke saare pages yahan se wrap hote hain.
 * Yahan sirf colours (CSS variables) aur chhote common classes hain —
 * har page ka baaki CSS uski apni page.jsx mein inline hai.
 * Class prefix "ga-" hai, "ad-" NAHI — ad-blocker extensions "ad-btn", "ad-card", "ad-label" jaisi classes chhupa dete hain.
 */
export default function AdminLayout({ children }) {
  return (
    <div className={`ad ${dmSans.variable} ${manrope.variable}`}>
      {children}

      <style>{`
        .ad {
          --ad-bg: #f5f6fb;
          --ad-card: #ffffff;
          --ad-line: #e7eaf3;
          --ad-line-2: #dddff0;
          --ad-ink: #14213b;
          --ad-text: #293652;
          --ad-muted: #74809a;
          --ad-muted-2: #68748d;
          --ad-faint: #9aa3b6;
          --ad-label: #9ca4b6;
          --ad-primary: #6757f5;
          --ad-primary-2: #5143d2;
          --ad-primary-ink: #5145bb;
          --ad-lilac: #f0edff;
          --ad-lilac-2: #e3dfff;
          --ad-soft: #f1f2f8;
          --ad-soft-2: #f8f9fd;
          --ad-grad: linear-gradient(135deg, #6757f5 0%, #8c6bf7 100%);
          --ad-green: #008957;
          --ad-green-bg: #e2f7ef;
          --ad-orange: #b36c17;
          --ad-orange-bg: #fff0dd;
          --ad-red: #cb4055;
          --ad-red-bg: #ffe8eb;
          --ad-cyan: #06b6d4;
          --ad-blue: #2f6fe4;
          --ad-blue-bg: #e8f0ff;
          --ad-radius: 16px;
          --ad-sans: var(--font-ad-dm), "DM Sans", system-ui, sans-serif;
          --ad-head: var(--font-ad-man), "Manrope", var(--font-ad-dm), "DM Sans", system-ui, sans-serif;
          min-height: 100vh;
          background: var(--ad-bg);
          color: var(--ad-ink);
          font-family: var(--ad-sans);
          font-size: 14px;
          -webkit-font-smoothing: antialiased;
        }
        :where(.ad *), :where(.ad *)::before, :where(.ad *)::after { box-sizing: border-box; }
        :where(.ad a) { color: inherit; text-decoration: none; }
        :where(.ad button) { font: inherit; color: inherit; cursor: pointer; }
        :where(.ad input, .ad textarea, .ad select) { font: inherit; color: inherit; }
        :where(.ad h1, .ad h2, .ad h3, .ad p) { margin: 0; }
        :where(.ad img) { display: block; max-width: 100%; }

        /* ---------- Page heading (Figma: eyebrow 11/800 + Manrope 31/800 + 14 muted) ---------- */
        :where(.ga-eyebrow) { margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8b92aa; }
        :where(.ga-h1) { font-family: var(--ad-head); font-size: 31px; font-weight: 800; letter-spacing: -1.2px; line-height: 1.2; color: var(--ad-ink); }
        :where(.ga-sub) { margin-top: 6px; font-size: 14px; line-height: 1.5; color: var(--ad-muted); }
        :where(.ga-head) { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
        :where(.ga-h2) { font-family: var(--ad-head); font-size: 17px; font-weight: 800; letter-spacing: -0.4px; color: var(--ad-ink); }
        :where(.ga-h2-sub) { margin-top: 4px; font-size: 12px; color: var(--ad-muted); }

        /* ---------- Buttons ---------- */
        :where(.ga-btn) {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          height: 40px; padding: 0 16px; border-radius: 11px; border: 1px solid transparent;
          font-size: 14px; font-weight: 800; white-space: nowrap; transition: filter .15s, background .15s, border-color .15s;
        }
        :where(.ga-btn):disabled { opacity: .5; cursor: not-allowed; }
        :where(.ga-btn--primary) { background: var(--ad-grad); color: #fff; box-shadow: 0 8px 20px -10px rgba(103,87,245,.8); }
        :where(.ga-btn--primary):hover { filter: brightness(1.06); }
        :where(.ga-btn--ghost) { background: #fff; border-color: var(--ad-line-2); color: var(--ad-primary-ink); }
        :where(.ga-btn--ghost):hover { border-color: var(--ad-primary); }
        :where(.ga-btn--soft) { background: var(--ad-lilac); color: var(--ad-primary-2); }
        :where(.ga-btn--danger) { background: var(--ad-red); color: #fff; }
        :where(.ga-btn--green) { background: var(--ad-green); color: #fff; }
        :where(.ga-btn--sm) { height: 32px; padding: 0 12px; font-size: 12.5px; border-radius: 9px; }

        /* ---------- Cards ---------- */
        :where(.ga-card) { background: var(--ad-card); border: 1px solid var(--ad-line); border-radius: 18px; box-shadow: 0 8px 24px rgba(30,37,73,.02); }
        :where(.ga-card--pad) { padding: 22px; }

        /* ---------- Pills / chips / badges ---------- */
        :where(.ga-tabs) { display: flex; gap: 8px; flex-wrap: wrap; }
        :where(.ga-tab) {
          display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: 10px; border: 0;
          background: var(--ad-soft); color: var(--ad-muted-2); font-size: 14px; font-weight: 700; white-space: nowrap;
        }
        :where(.ga-tab.is-on) { background: var(--ad-primary); color: #fff; }
        :where(.ga-badge) {
          display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 13.3px;
          font-size: 11px; font-weight: 700; white-space: nowrap; background: var(--ad-soft); color: #7a8398;
        }
        :where(.ga-badge--violet) { background: var(--ad-lilac); color: #6859e9; }
        :where(.ga-badge--green) { background: var(--ad-green-bg); color: var(--ad-green); }
        :where(.ga-badge--orange) { background: var(--ad-orange-bg); color: var(--ad-orange); }
        :where(.ga-badge--red) { background: var(--ad-red-bg); color: var(--ad-red); }
        :where(.ga-badge--blue) { background: var(--ad-blue-bg); color: var(--ad-blue); }
        :where(.ga-count) { display: inline-grid; place-items: center; min-width: 22px; height: 20px; padding: 0 6px; border-radius: 8px; background: var(--ad-soft); font-size: 11px; font-weight: 700; color: #7a8398; }

        /* ---------- Forms ---------- */
        :where(.ga-label) { display: block; margin: 0 0 6px; font-size: 12px; font-weight: 700; color: var(--ad-text); }
        :where(.ga-input) {
          width: 100%; height: 42px; padding: 0 14px; border-radius: 11px; border: 1px solid var(--ad-line-2);
          background: #fff; outline: none; font-size: 14px; color: var(--ad-ink); transition: border-color .15s, box-shadow .15s;
        }
        :where(textarea.ga-input) { height: auto; min-height: 90px; padding: 11px 14px; line-height: 1.5; resize: vertical; }
        :where(.ga-input):focus { border-color: var(--ad-primary); box-shadow: 0 0 0 3px rgba(103,87,245,.14); }
        :where(.ga-input)::placeholder { color: var(--ad-faint); }
        :where(.ga-hint) { margin-top: 6px; font-size: 11.5px; color: var(--ad-muted); }

        /* Toggle */
        :where(.ga-toggle) { position: relative; width: 40px; height: 22px; flex-shrink: 0; border: 0; padding: 0; border-radius: 999px; background: #d6d9e6; transition: background .2s; }
        :where(.ga-toggle)::after { content: ""; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.2); transition: transform .2s; }
        :where(.ga-toggle.is-on) { background: var(--ad-primary); }
        :where(.ga-toggle.is-on)::after { transform: translateX(18px); }

        /* Table (mobile par side scroll) */
        :where(.ga-table-wrap) { overflow-x: auto; border: 1px solid var(--ad-line); border-radius: 16px; background: #fff; }
        :where(.ga-table) { width: 100%; border-collapse: collapse; font-size: 13px; }
        :where(.ga-table th) { padding: 12px 14px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #9aa2b4; background: var(--ad-soft-2); border-bottom: 1px solid var(--ad-line); white-space: nowrap; }
        :where(.ga-table td) { padding: 12px 14px; border-bottom: 1px solid var(--ad-line); vertical-align: middle; color: var(--ad-ink); white-space: nowrap; }
        :where(.ga-table tr:last-child td) { border-bottom: 0; }

        /* Avatar (initials) */
        :where(.ga-av) { flex-shrink: 0; width: 36px; height: 36px; border-radius: 11px; display: grid; place-items: center; background: var(--ad-lilac); color: var(--ad-primary); font-size: 13px; font-weight: 800; }

        /* Progress bar */
        :where(.ga-bar) { height: 8px; border-radius: 999px; background: var(--ad-soft); overflow: hidden; }
        :where(.ga-bar) i { display: block; height: 100%; border-radius: inherit; background: var(--ad-grad); }

        /* Toast */
        .ga-toast {
          position: fixed; left: 50%; bottom: 26px; z-index: 120; transform: translateX(-50%);
          display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 12px;
          background: var(--ad-ink); color: #fff; font-size: 13px; font-weight: 700; box-shadow: 0 16px 40px -14px rgba(20,33,59,.6);
          max-width: calc(100vw - 40px); animation: adToast .2s ease;
        }
        @keyframes adToast { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }

        /* Popup (modal) */
        .ga-overlay { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 20px; background: rgba(20,33,59,.35); animation: adFade .15s ease; }
        @keyframes adFade { from { opacity: 0; } to { opacity: 1; } }
        .ga-modal { width: min(560px, 100%); max-height: calc(100vh - 40px); overflow-y: auto; border-radius: 22px; background: #fff; box-shadow: 0 30px 80px -30px rgba(20,33,59,.5); animation: adPop .18s ease; }
        @keyframes adPop { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }

        @media (max-width: 640px) {
          :where(.ga-h1) { font-size: 25px; letter-spacing: -0.8px; }
          .ga-overlay { place-items: end center; padding: 0; }
          .ga-modal { width: 100%; max-height: 90vh; border-radius: 22px 22px 0 0; }
        }
      `}</style>
    </div>
  );
}
