import Link from "next/link";
import { Send, WhatsApp, ArrowRight, Building, Star, Wallet, ShieldCheck, Pin } from "@/components/ui/Icons";

/* ================= Page ================= */

export const metadata = {
  title: "Contact Us — Geek Influencer OS",
  description: "Brands, creators and agencies — get in touch with the Geek team.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Let’s <em>talk.</em>
          </>
        }
        sub="Brands, creators and agencies — we’d love to hear from you."
        active="contact"
      />

      <section className="ct">
        <div className="ct-wrap">
          <InboxCard />
          <HelpCards />
          <OfficeBox />
        </div>

        <style>{`
          .ct { background: #fcfdef; }
          .ct-wrap {
            max-width: 1400px;
            margin: 0 auto;
            padding: 60px 32px 104px;
          }
          @media (max-width: 1024px) {
            .ct-wrap { padding: 48px 32px 88px; }
          }
          @media (max-width: 640px) {
            .ct-wrap { padding: 32px 20px 72px; }
          }
        `}</style>
      </section>
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

const EMAIL = "givebacktogurugram@gmail.com";
// WhatsApp number aane par yahan lagao, jaise "https://wa.me/919999999999"
const WHATSAPP_URL = "#";

function InboxCard() {
  return (
    <div className="ib">
      <div className="ib-copy">
        <p className="ib-label">One inbox for everyone</p>
        <a href={`mailto:${EMAIL}`} className="ib-email">
          {EMAIL}
        </a>
        <p className="ib-meta">Monday to Saturday · 10:00 am – 7:00 pm IST · we reply within a working day</p>
      </div>

      <div className="ib-actions">
        <a href={`mailto:${EMAIL}`} className="ib-btn ib-btn--dark">
          Email us
          <span className="ib-btn__icon">
            <Send size={13} />
          </span>
        </a>
        <a href={WHATSAPP_URL} className="ib-btn ib-btn--ghost">
          <WhatsApp /> WhatsApp
        </a>
      </div>

      <style>{`
        .ib {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 28px;
          background: #fff;
          border: 1px solid #e6e8d4;
          border-radius: 26px;
          padding: 30px 34px;
          font-family: var(--font-sans), system-ui, sans-serif;
          color: #23251a;
        }
        .ib-copy { min-width: 0; }
        .ib-label {
          margin: 0 0 10px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .ib-email {
          display: block;
          font-family: var(--font-serif), Georgia, serif;
          font-size: clamp(26px, 3.9vw, 54px);
          line-height: 1.1;
          color: #23251a;
          text-decoration: none;
          overflow-wrap: anywhere;
        }
        .ib-email:hover { color: #6f7556; }
        .ib-meta {
          margin: 10px 0 0;
          font-size: 13.5px;
          color: #6b6d5c;
        }
        .ib-actions {
          display: flex;
          gap: 14px;
          flex-shrink: 0;
        }
        .ib-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          height: 46px;
          border-radius: 999px;
          font-size: 14.5px;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
          transition: background .2s, color .2s;
        }
        .ib-btn--dark {
          padding: 0 8px 0 20px;
          background: #3f4130;
          color: #fff;
        }
        .ib-btn--dark:hover { background: #2f3124; }
        .ib-btn__icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #fcfdef;
          color: #3f4130;
          display: grid;
          place-items: center;
        }
        .ib-btn--ghost {
          padding: 0 22px;
          border: 1px solid #e3e5d0;
          color: #23251a;
        }
        .ib-btn--ghost:hover { background: #f4f5e6; }

        @media (max-width: 1024px) {
          .ib { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 640px) {
          .ib { padding: 24px 20px; border-radius: 20px; gap: 22px; }
          .ib-email { font-size: clamp(19px, 5.6vw, 23px); }
          .ib-actions { width: 100%; flex-direction: column; gap: 10px; }
          .ib-btn { width: 100%; }
          .ib-btn--dark { justify-content: space-between; }
        }
      `}</style>
    </div>
  );
}

const APP_URL = "https://www.bountythreads.geekcreativeagency.com/app.html";

const CARDS = [
  {
    icon: Building,
    title: "Brands",
    text: "A new campaign, a quote, a bill or a payment — or use “Request a campaign” in your dashboard.",
    link: "Email the brand team",
    href: "mailto:givebacktogurugram@gmail.com?subject=Brand%20enquiry",
  },
  {
    icon: Star,
    title: "Creators",
    text: "Campaigns, contracts, shipments or payouts — tap “Questions? Ask us” on your campaign.",
    link: "Open the app",
    href: APP_URL,
  },
  {
    icon: Wallet,
    title: "Payments",
    text: "Add your bill number and payment reference so we can help fast.",
    link: "Refund policy",
    href: "/refund-cancellation",
  },
  {
    icon: ShieldCheck,
    title: "Grievances",
    text: "About the Platform or your data. Acknowledged in 48 hours, resolved in 30 days.",
    link: "Grievance Officer",
    href: "/privacy#grievance",
  },
];

function HelpCards() {
  return (
    <div className="hc">
      {CARDS.map(({ icon: Icon, title, text, link, href }) => {
        const isInternal = href.startsWith("/");
        const Tag = isInternal ? Link : "a";
        return (
          <article key={title} className="hc-card">
            <span className="hc-icon">
              <Icon size={17} />
            </span>
            <h2 className="hc-title">{title}</h2>
            <p className="hc-text">{text}</p>
            <Tag href={href} className="hc-link">
              {link} <ArrowRight size={13} />
            </Tag>
          </article>
        );
      })}

      <style>{`
        .hc {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          align-items: start;
          margin-top: 20px;
          font-family: var(--font-sans), system-ui, sans-serif;
          color: #23251a;
        }
        .hc-card {
          background: #fff;
          border: 1px solid #e6e8d4;
          border-radius: 20px;
          padding: 22px 24px 24px;
        }
        .hc-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #e0e2c8;
          background: #eef0dc;
          color: #5d5f4d;
          display: grid;
          place-items: center;
        }
        .hc-title {
          margin: 18px 0 10px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: 30px;
          line-height: 1.1;
        }
        .hc-text {
          margin: 0 0 16px;
          font-size: 14px;
          line-height: 1.6;
          color: #4d4f3e;
        }
        .hc-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          font-weight: 600;
          color: #6f7556;
          text-decoration: none;
        }
        .hc-link:hover { color: #3f4130; }
        .hc-link svg { transition: transform .2s; }
        .hc-link:hover svg { transform: translateX(3px); }

        @media (max-width: 1100px) {
          .hc { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .hc { grid-template-columns: 1fr; gap: 12px; }
          .hc-card { padding: 20px; }
          .hc-title { font-size: 27px; }
        }
      `}</style>
    </div>
  );
}

// Registered office — address aane par ADDRESS bhar do, "To add" badge apne aap hat jayega.
const ADDRESS = "";

function OfficeBox() {
  return (
    <div className="ob">
      <span className="ob-icon">
        <Pin size={17} />
      </span>
      <div className="ob-copy">
        <p className="ob-title">Geek Online Ventures Pvt Ltd · Registered office</p>
        <p className="ob-text">
          {ADDRESS ||
            "Address, PIN code and phone number go here — needed before going live (Razorpay & Meta check this)."}
        </p>
      </div>
      {!ADDRESS && <span className="ob-badge">To add</span>}

      <style>{`
        .ob {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 20px;
          padding: 18px 20px;
          border: 1.5px dashed #dadcc4;
          border-radius: 20px;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .ob-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 10px;
          background: #eef0dc;
          color: #5d5f4d;
          display: grid;
          place-items: center;
        }
        .ob-copy { flex: 1; min-width: 0; }
        .ob-title {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 600;
          color: #23251a;
        }
        .ob-text {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #6b6d5c;
        }
        .ob-badge {
          flex-shrink: 0;
          padding: 6px 12px;
          border-radius: 999px;
          background: #f5e6c8;
          color: #9a6a12;
          font-size: 12px;
          font-weight: 600;
        }
        @media (max-width: 640px) {
          .ob { flex-wrap: wrap; align-items: flex-start; }
          .ob-copy { flex-basis: calc(100% - 56px); }
          .ob-badge { margin-left: 56px; }
        }
      `}</style>
    </div>
  );
}
