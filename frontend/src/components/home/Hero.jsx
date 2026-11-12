import Link from "next/link";
import { ArrowRight, Check, PlaySquare } from "@/components/ui/Icons";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-wrap">
        {/* ---------- Left: copy ---------- */}
        <div className="hero-copy">
          <span className="hero-pill">
            <span className="hero-pill__badge">New</span>
            One AI platform · Creators · Brands · Agencies · IRM
          </span>

          <h1 className="hero-title">
            Where creators <em>chase dreams</em>, brands find their people.
          </h1>

          <p className="hero-sub">
            Geek Influencer OS is the operating system for influencer marketing — creators build careers,
            brands launch campaigns and watch results live, and agencies run it all end to end.
          </p>

          <div className="hero-ctas">
            <Link href="#early-access" className="hero-btn hero-btn--dark">
              Start free <ArrowRight size={15} />
            </Link>
            <Link href="#demo" className="hero-btn hero-btn--ghost">
              <PlaySquare size={15} /> Watch 90-sec demo
            </Link>
          </div>

          <ul className="hero-ticks">
            {["Free for creators", "No card needed", "Built in India"].map((t) => (
              <li key={t}>
                <Check size={13} /> {t}
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- Right: visual ---------- */}
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-card hero-card--main">
            <span className="hero-card__label">Featured creator</span>
          </div>
          <div className="hero-card hero-card--small" />

          <div className="hero-float hero-float--selected">
            <span className="hero-float__check">
              <Check size={15} />
            </span>
            <span>
              <strong>You were selected!</strong>
              <small>Nykaa · Diwali Glow Edit</small>
            </span>
          </div>

          <div className="hero-float hero-float--pay">
            <small>Payment received</small>
            <strong className="hero-float__amount">₹6,500</strong>
            <small>Monsoon Edit · Mamaearth</small>
          </div>

          <div className="hero-float hero-float--apps">
            <div className="hero-float__row">
              <small>Applications</small>
              <b>18 / 25</b>
            </div>
            <div className="hero-float__bar">
              <span />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero {
          background: #fcfdef;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
          border-bottom: 1px solid #e6e8d4;
          overflow: hidden;
        }
        .hero-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 72px 32px 96px;
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          align-items: center;
          gap: 48px;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 5px 14px 5px 5px;
          border: 1px solid #e3e5d0;
          border-radius: 999px;
          background: #fff;
          font-size: 12.5px;
          color: #4d4f3e;
        }
        .hero-pill__badge {
          background: #3f4130;
          color: #fff;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 999px;
        }

        .hero-title {
          margin: 28px 0 22px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(44px, 6.2vw, 90px);
          line-height: 0.98;
          letter-spacing: -0.015em;
          max-width: 620px;
        }
        .hero-title em {
          font-style: italic;
          color: #7e8462;
        }

        .hero-sub {
          margin: 0;
          max-width: 520px;
          font-size: 16.5px;
          line-height: 1.6;
          color: #5d5f4d;
        }

        .hero-ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }
        .hero-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 44px;
          padding: 0 20px;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 500;
          text-decoration: none;
          transition: transform .2s, background .2s;
        }
        .hero-btn:hover { transform: translateY(-1px); }
        .hero-btn--dark { background: #3f4130; color: #fff; }
        .hero-btn--dark:hover { background: #2f3124; }
        .hero-btn--ghost { border: 1px solid #3f4130; color: #23251a; }

        .hero-ticks {
          list-style: none;
          margin: 26px 0 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 10px 22px;
          font-size: 13px;
          color: #6b6d5c;
        }
        .hero-ticks li {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }
        .hero-ticks svg { color: #7e8462; }

        /* Visual */
        .hero-visual {
          position: relative;
          height: 560px;
          max-width: 560px;
          width: 100%;
          justify-self: end;
        }
        .hero-card { position: absolute; border-radius: 24px; }
        .hero-card--main {
          top: 40px;
          right: 60px;
          width: 66%;
          height: 82%;
          background: linear-gradient(150deg, #c9cca4 0%, #a3a77f 45%, #7a7e5a 100%);
        }
        .hero-card__label {
          position: absolute;
          left: 22px;
          bottom: 20px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.75);
        }
        .hero-card--small {
          left: 0;
          bottom: 24px;
          width: 34%;
          height: 44%;
          border: 5px solid #fff;
          background: linear-gradient(150deg, #eef0d9 0%, #c9cca8 60%, #a8ac87 100%);
          box-shadow: 0 20px 40px -20px rgba(48, 50, 30, 0.35);
        }

        .hero-float {
          position: absolute;
          background: #fff;
          border: 1px solid #ecede0;
          border-radius: 14px;
          box-shadow: 0 18px 40px -18px rgba(48, 50, 30, 0.3);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: heroFloat 6s ease-in-out infinite;
        }
        .hero-float small { font-size: 11.5px; color: #77796a; }
        .hero-float strong { font-size: 13.5px; font-weight: 600; }

        .hero-float--selected {
          top: 0;
          right: 0;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          min-width: 240px;
        }
        .hero-float--selected > span:last-child {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .hero-float__check {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #3f4130;
          color: #fff;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .hero-float--pay {
          top: 52%;
          right: 0;
          min-width: 180px;
          animation-delay: -2s;
        }
        .hero-float__amount {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 34px !important;
          font-weight: 500 !important;
          line-height: 1.1;
        }

        .hero-float--apps {
          bottom: 52px;
          left: 33%;
          min-width: 200px;
          animation-delay: -4s;
        }
        .hero-float__row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .hero-float__row b { font-size: 12px; font-weight: 600; }
        .hero-float__bar {
          margin-top: 6px;
          height: 5px;
          border-radius: 99px;
          background: #eef0dc;
          overflow: hidden;
        }
        .hero-float__bar span {
          display: block;
          width: 72%;
          height: 100%;
          background: #6f7556;
          border-radius: 99px;
        }

        @keyframes heroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-float { animation: none; }
        }

        /* ---------- Responsive ---------- */
        @media (max-width: 1024px) {
          .hero-wrap {
            grid-template-columns: 1fr;
            padding: 56px 32px 72px;
          }
          .hero-visual {
            justify-self: center;
            height: 500px;
          }
        }
        @media (max-width: 640px) {
          .hero-wrap { padding: 40px 20px 56px; gap: 40px; }
          .hero-pill { font-size: 11.5px; }
          .hero-sub { font-size: 15.5px; }
          .hero-ctas .hero-btn { flex: 1 1 100%; height: 48px; }
          .hero-visual { height: 400px; }
          .hero-card--main { right: 20px; width: 72%; top: 34px; }
          .hero-float--selected { min-width: 0; right: 0; left: auto; padding: 10px 12px; }
          .hero-float--pay { min-width: 0; padding: 10px 12px; }
          .hero-float__amount { font-size: 26px !important; }
          .hero-float--apps { min-width: 170px; left: 26%; bottom: 36px; }
          .hero-card--small { width: 38%; height: 40%; }
        }
      `}</style>
    </section>
  );
}
