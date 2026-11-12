import Link from "next/link";
import { Check } from "@/components/ui/Icons";

const PLANS = [
  {
    name: "Creator",
    price: "₹0",
    per: "/mo",
    tagline: "Chase your dream, free forever.",
    features: ["AI dream plan & daily tasks", "Growth score tracking", "Accept barters & deals", "Creator profile & portfolio"],
    cta: "Start free",
    href: "#early-access",
  },
  {
    name: "Agency",
    price: "₹9,999",
    per: "/mo",
    tagline: "Everything to run campaigns for real.",
    features: [
      "Real accounts, org & role security",
      "Unlimited campaigns & creators",
      "Mass Barter Engine + IRM",
      "Auto EMV / ROI reports",
      "10 team seats",
    ],
    cta: "Start Agency",
    href: "#early-access",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    tagline: "Multi-agency, celebrity & integrations.",
    features: [
      "Super Admin multi-agency",
      "Celebrity Story Engine",
      "Official social integrations",
      "AI agent mesh & automations",
      "Unlimited seats",
    ],
    cta: "Talk to us",
    href: "#early-access",
  },
];

export default function Pricing() {
  return (
    <section className="pr" id="pricing">
      <div className="pr-wrap">
        <div className="pr-head">
          <p className="pr-eyebrow">Pricing</p>
          <h2 className="pr-title">
            Free for creators. <em>Powerful</em> for teams.
          </h2>
          <p className="pr-sub">Creators start free forever. Brands and agencies upgrade when campaigns flow.</p>
        </div>

        <div className="pr-grid">
          {PLANS.map((p) => (
            <article key={p.name} className={`pr-card ${p.featured ? "pr-card--featured" : ""}`}>
              <div className="pr-card__top">
                <h3 className="pr-name">{p.name}</h3>
                {p.featured && <span className="pr-badge">Most popular</span>}
              </div>
              <p className="pr-price">
                <span className="pr-amount">{p.price}</span>
                {p.per && <span className="pr-per">{p.per}</span>}
              </p>
              <p className="pr-tagline">{p.tagline}</p>

              <ul className="pr-features">
                {p.features.map((f) => (
                  <li key={f}>
                    <Check size={13} /> {f}
                  </li>
                ))}
              </ul>

              <Link href={p.href} className="pr-btn">
                {p.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .pr {
          background: #f4f5e6;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .pr-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 104px 32px 112px;
        }
        .pr-head { text-align: center; margin-bottom: 48px; }
        .pr-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 14px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .pr-eyebrow::before {
          content: "";
          width: 20px;
          height: 1px;
          background: currentColor;
        }
        .pr-title {
          margin: 0 0 14px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(32px, 3.6vw, 50px);
          line-height: 1.1;
          letter-spacing: -0.01em;
        }
        .pr-title em { font-style: italic; color: #7e8462; }
        .pr-sub {
          margin: 0;
          font-size: 15px;
          color: #6b6d5c;
        }

        .pr-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          align-items: stretch;
        }
        .pr-card {
          background: #fff;
          border: 1px solid #e6e8d4;
          border-radius: 22px;
          padding: 32px 30px 30px;
          display: flex;
          flex-direction: column;
        }
        .pr-card--featured {
          background: #3f4130;
          border-color: #3f4130;
          color: #fcfdef;
          box-shadow: 0 30px 60px -30px rgba(48, 50, 30, 0.55);
        }
        .pr-card__top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 26px;
        }
        .pr-name {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
        }
        .pr-badge {
          font-size: 10.5px;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 999px;
          background: #5c5e4b;
          color: #fff;
        }
        .pr-price {
          margin: 22px 0 10px;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .pr-amount {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 56px;
          font-weight: 500;
          line-height: 1;
        }
        .pr-per {
          font-size: 13px;
          color: #8a8c78;
        }
        .pr-card--featured .pr-per { color: #c9cca8; }
        .pr-tagline {
          margin: 0;
          padding-bottom: 22px;
          border-bottom: 1px solid #ebecdc;
          font-size: 14px;
          color: #6b6d5c;
        }
        .pr-card--featured .pr-tagline {
          color: #d3d5c0;
          border-bottom-color: #55574a;
        }
        .pr-features {
          list-style: none;
          margin: 22px 0 32px;
          padding: 0;
          display: grid;
          gap: 12px;
          font-size: 14px;
        }
        .pr-features li {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pr-features svg { color: #7e8462; flex-shrink: 0; }
        .pr-card--featured .pr-features svg { color: #c9cca8; }

        .pr-btn {
          margin-top: auto;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          border: 1px solid #3f4130;
          color: #23251a;
          font-size: 14.5px;
          font-weight: 500;
          text-decoration: none;
          transition: background .2s, color .2s;
        }
        .pr-btn:hover { background: #3f4130; color: #fff; }
        .pr-card--featured .pr-btn {
          background: #fcfdef;
          border-color: #fcfdef;
          color: #23251a;
        }
        .pr-card--featured .pr-btn:hover { background: #fff; color: #23251a; }

        @media (max-width: 1024px) {
          .pr-wrap { padding: 80px 32px 88px; }
          .pr-grid { grid-template-columns: 1fr; max-width: 520px; margin: 0 auto; }
        }
        @media (max-width: 640px) {
          .pr-wrap { padding: 64px 20px 72px; }
          .pr-card { padding: 26px 22px 24px; }
          .pr-amount { font-size: 48px; }
        }
      `}</style>
    </section>
  );
}
