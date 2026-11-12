import Link from "next/link";
import { Heart, Eye, ShieldCheck, User, ArrowRight } from "@/components/ui/Icons";

/* ================= Page ================= */

export const metadata = {
  title: "About Us — Geek Influencer OS",
  description: "Geek Online Ventures Pvt Ltd — the company behind Geek Creative Agency and Geek Influencer OS.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title={
          <>
            The team behind <em>Geek.</em>
          </>
        }
        sub="Geek Online Ventures Pvt Ltd — the company behind Geek Creative Agency and Geek Influencer OS."
      />
      <OurStory />
      <Values />
      <Team />
      <WorkWithUs />
    </>
  );
}

/* ================= Is page ke sections (code + CSS yahin) ================= */

// Legal / company pages ke beech switch karne wale tabs
const PAGE_TABS = [
  { key: "terms", label: "Terms & Conditions", href: "/terms" },
  { key: "privacy", label: "Privacy Policy", href: "/privacy" },
  { key: "refund", label: "Refund & Cancellation", href: "/refund-cancellation" },
  { key: "shipping", label: "Shipping & Delivery", href: "/shipping-delivery" },
  { key: "contact", label: "Contact Us", href: "/contact" },
  { key: "data", label: "Data Deletion", href: "/data-deletion" },
];

/**
 * Inner pages ka top hero (Terms, Privacy, About, Contact...).
 * - eyebrow: chhota label ("Legal")
 * - title: JSX, italic olive word ke liye <em> use karo
 * - sub: neeche ki line
 * - active: tabs mein kaunsa active hai (na do to tabs nahi dikhenge)
 */
function PageHero({ eyebrow, title, sub, active }) {
  return (
    <section className="ph">
      <div className="ph-wrap">
        <p className="ph-eyebrow">{eyebrow}</p>
        <h1 className="ph-title">{title}</h1>
        {sub && <p className="ph-sub">{sub}</p>}

        {active && (
          <nav className="ph-tabs" aria-label="Policies">
            {PAGE_TABS.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className={`ph-tab ${active === t.key ? "is-active" : ""}`}
                aria-current={active === t.key ? "page" : undefined}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <style>{`
        .ph {
          position: relative;
          overflow: hidden;
          background: #fcfdef;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
          border-bottom: 1px solid #e6e8d4;
        }
        .ph::before {
          content: "";
          position: absolute;
          top: -40%;
          right: -12%;
          width: 62%;
          height: 180%;
          background: radial-gradient(closest-side, rgba(196, 199, 160, 0.55), rgba(252, 253, 239, 0));
          pointer-events: none;
        }
        .ph-wrap {
          position: relative;
          max-width: 1400px;
          margin: 0 auto;
          padding: 76px 32px 64px;
        }
        .ph-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 18px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #5d5f4d;
        }
        .ph-eyebrow::before {
          content: "";
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #3f4130;
        }
        .ph-title {
          margin: 0;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(44px, 6vw, 84px);
          line-height: 1.02;
          letter-spacing: -0.015em;
        }
        .ph-title em { font-style: italic; color: #7e8462; }
        .ph-sub {
          margin: 18px 0 0;
          font-size: 15px;
          line-height: 1.55;
          color: #6b6d5c;
        }
        .ph-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 26px;
        }
        .ph-tab {
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid #e3e5d0;
          background: #eff0de;
          color: #3a3c2c;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
          transition: background .2s, color .2s;
        }
        .ph-tab:hover { background: #e6e8d0; }
        .ph-tab.is-active {
          background: #3f4130;
          border-color: #3f4130;
          color: #fff;
        }

        @media (max-width: 640px) {
          .ph-wrap { padding: 48px 20px 40px; }
          .ph-sub { font-size: 14px; }
          .ph-tabs {
            flex-wrap: nowrap;
            overflow-x: auto;
            margin-right: -20px;
            padding-right: 20px;
            scrollbar-width: none;
          }
          .ph-tabs::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </section>
  );
}

// About page — "Our story" + numbers
// Numbers abhi "—" hain (design mein bhi placeholder) — asli numbers aane par value bhar dena.
const STATS = [
  { value: "", label: "brands served" },
  { value: "", label: "creators on Geek" },
  { value: "", label: "campaigns run" },
  { value: "", label: "cities" },
];

function OurStory() {
  return (
    <section className="os">
      <div className="os-wrap">
        <div className="os-grid">
          <div>
            <p className="os-label">Our story</p>
            <h2 className="os-title">
              Built for creators who <em>chase dreams.</em>
            </h2>
          </div>
          <div className="os-copy">
            <p>
              Geek Creative Agency runs influencer campaigns for brands across India. Running them on spreadsheets and
              WhatsApp groups was slow for everyone — so we built Geek Influencer OS: one place where brands approve
              creators and videos, creators sign, ship, post and get paid, and our team runs every step.
            </p>
            <p className="os-todo">[Add your founding story here — when Geek started, who started it, and why.]</p>
          </div>
        </div>

        <ul className="os-stats">
          {STATS.map((s) => (
            <li key={s.label} className="os-stat">
              {s.value ? <span className="os-stat__value">{s.value}</span> : <span className="os-stat__dash" />}
              <span className="os-stat__label">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .os {
          background: #fcfdef;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .os-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 64px 32px 0;
        }
        .os-grid {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 48px;
          align-items: start;
        }
        .os-label {
          margin: 0 0 16px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .os-title {
          margin: 0;
          max-width: 440px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(36px, 4vw, 54px);
          line-height: 1.06;
        }
        .os-title em { font-style: italic; color: #7e8462; }
        .os-copy { padding-top: 4px; }
        .os-copy p {
          margin: 0 0 14px;
          max-width: 640px;
          font-size: 16px;
          line-height: 1.7;
          color: #4d4f3e;
        }
        .os-copy .os-todo { font-size: 14.5px; color: #9a6a12; }

        .os-stats {
          list-style: none;
          margin: 36px 0 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .os-stat {
          background: #fff;
          border: 1px solid #e6e8d4;
          border-radius: 18px;
          padding: 36px 24px 22px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .os-stat__dash {
          display: block;
          width: 30px;
          height: 2px;
          margin: 14px 0 6px;
          background: #7e8462;
        }
        .os-stat__value {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 40px;
          line-height: 1;
          color: #3f4130;
        }
        .os-stat__label { font-size: 13px; color: #6b6d5c; }

        @media (max-width: 1024px) {
          .os-grid { grid-template-columns: 1fr; gap: 24px; }
          .os-stats { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .os-wrap { padding: 48px 20px 0; }
          .os-copy p { font-size: 15px; }
          .os-stats { gap: 10px; }
          .os-stat { padding: 26px 18px 18px; }
        }
      `}</style>
    </section>
  );
}

const VALUES = [
  { icon: Heart, title: "Creators first", text: "Free to join, clear contracts and payouts on time." },
  { icon: Eye, title: "Brands see everything", text: "Every creator and video is approved before it goes live." },
  { icon: ShieldCheck, title: "Honest numbers", text: "Real, checked Instagram data — no fake reach." },
];

function Values() {
  return (
    <section className="vl">
      <div className="vl-wrap">
        <p className="vl-label">What we believe</p>
        <div className="vl-grid">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <article key={title} className="vl-card">
              <span className="vl-icon">
                <Icon size={17} />
              </span>
              <h3 className="vl-title">{title}</h3>
              <p className="vl-text">{text}</p>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .vl {
          background: #fcfdef;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .vl-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 56px 32px 0;
        }
        .vl-label {
          margin: 0 0 22px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .vl-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .vl-card {
          background: #fff;
          border: 1px solid #e6e8d4;
          border-radius: 22px;
          padding: 24px 26px 28px;
          transition: transform .25s, box-shadow .25s;
        }
        .vl-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 40px -26px rgba(48, 50, 30, 0.35);
        }
        .vl-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #e0e2c8;
          background: #eef0dc;
          color: #5d5f4d;
          display: grid;
          place-items: center;
        }
        .vl-title {
          margin: 20px 0 12px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(26px, 2.4vw, 32px);
          line-height: 1.1;
        }
        .vl-text {
          margin: 0;
          max-width: 300px;
          font-size: 14px;
          line-height: 1.6;
          color: #5d5f4d;
        }

        @media (max-width: 900px) {
          .vl-grid { grid-template-columns: 1fr; }
          .vl-text { max-width: none; }
        }
        @media (max-width: 640px) {
          .vl-wrap { padding: 44px 20px 0; }
          .vl-card { padding: 22px 20px 24px; }
        }
      `}</style>
    </section>
  );
}

// Team members — photo / naam / role aane par yahan bhar dena.
// photo: "/team/name.jpg" (public folder mein rakho)
const TEAM = [
  { name: "Name", role: "Role", photo: "" },
  { name: "Name", role: "Role", photo: "" },
  { name: "Name", role: "Role", photo: "" },
  { name: "Name", role: "Role", photo: "" },
];

function Team() {
  return (
    <section className="tm">
      <div className="tm-wrap">
        <p className="tm-label">The team</p>
        <ul className="tm-grid">
          {TEAM.map((m, i) => (
            <li key={i} className="tm-card">
              <div className={`tm-photo tm-photo--${(i % 4) + 1}`}>
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo} alt={m.name} />
                ) : (
                  <span className="tm-ph">
                    <User />
                    Photo
                  </span>
                )}
              </div>
              <p className="tm-name">{m.name}</p>
              <p className="tm-role">{m.role}</p>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .tm {
          background: #fcfdef;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .tm-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 56px 32px 0;
        }
        .tm-label {
          margin: 0 0 22px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .tm-grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .tm-photo {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: 20px;
          border: 1px solid #e3e5d0;
          overflow: hidden;
          display: grid;
          place-items: center;
        }
        .tm-photo img { width: 100%; height: 100%; object-fit: cover; }
        .tm-photo--1 { background: linear-gradient(150deg, #eff0de 0%, #cfd2ae 100%); }
        .tm-photo--2 { background: linear-gradient(150deg, #e6e8d2 0%, #b8bb98 100%); }
        .tm-photo--3 { background: linear-gradient(150deg, #dcdec0 0%, #a3a786 100%); }
        .tm-photo--4 { background: linear-gradient(150deg, #f1f2e2 0%, #b9bc99 100%); }
        .tm-ph {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(80, 83, 60, 0.55);
        }
        .tm-name {
          margin: 16px 0 6px;
          font-size: 15px;
          font-weight: 600;
        }
        .tm-role {
          margin: 0;
          font-size: 13px;
          color: #77796a;
        }

        @media (max-width: 1024px) {
          .tm-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .tm-wrap { padding: 44px 20px 0; }
          .tm-grid { gap: 12px; }
          .tm-photo { border-radius: 16px; }
        }
      `}</style>
    </section>
  );
}

function WorkWithUs() {
  return (
    <section className="ww">
      <div className="ww-wrap">
        <div className="ww-card">
          <div>
            <h2 className="ww-title">Work with us.</h2>
            <p className="ww-text">
              Brands, creators and agencies — write to{" "}
              <a href="mailto:givebacktogurugram@gmail.com">givebacktogurugram@gmail.com</a>
            </p>
          </div>
          <Link href="/contact" className="ww-btn">
            Contact us
            <span className="ww-btn__icon">
              <ArrowRight size={13} />
            </span>
          </Link>
        </div>
      </div>

      <style>{`
        .ww {
          background: #fcfdef;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .ww-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 32px 104px;
        }
        .ww-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          background: #fff;
          border: 1px solid #e6e8d4;
          border-radius: 26px;
          padding: 30px 34px;
        }
        .ww-title {
          margin: 0 0 8px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(32px, 3.4vw, 46px);
          line-height: 1.05;
        }
        .ww-text {
          margin: 0;
          font-size: 14px;
          color: #6b6d5c;
        }
        .ww-text a { color: inherit; word-break: break-all; }
        .ww-text a:hover { color: #3f4130; }
        .ww-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          height: 46px;
          padding: 0 8px 0 20px;
          border-radius: 999px;
          background: #3f4130;
          color: #fff;
          font-size: 14.5px;
          font-weight: 500;
          text-decoration: none;
          transition: background .2s;
        }
        .ww-btn:hover { background: #2f3124; }
        .ww-btn__icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #fcfdef;
          color: #3f4130;
          display: grid;
          place-items: center;
        }

        @media (max-width: 640px) {
          .ww-wrap { padding: 32px 20px 72px; }
          .ww-card {
            flex-direction: column;
            align-items: flex-start;
            padding: 24px 20px;
            border-radius: 20px;
          }
          .ww-btn { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </section>
  );
}
