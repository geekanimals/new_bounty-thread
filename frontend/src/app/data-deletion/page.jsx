import Link from "next/link";
import { Info } from "@/components/ui/Icons";

/* ================= Page ================= */

export const metadata = {
  title: "Delete your data — Geek Influencer OS",
  description: "Three ways to remove your Instagram data or delete your Geek Influencer OS account.",
};

export default function DataDeletionPage() {
  return (
    <>
      <PageHero
        eyebrow="Your data"
        title={
          <>
            Delete your <em>data.</em>
          </>
        }
        sub="Last updated 13 September 2026 · three ways, pick the one that fits"
        active="data"
      />
      <DeleteOptions />
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

const OPTIONS = [
  {
    tag: "Option 1",
    title: "Disconnect Instagram",
    text: "Keep your account, remove the Instagram data we hold.",
    steps: ["Sign in and open Settings → Integrations.", "Click Disconnect next to Instagram / Meta."],
    note: "We delete your token and cached profile, media and insights. You can also revoke in Instagram → Settings → Apps and websites.",
    featured: true,
  },
  {
    tag: "Option 2",
    title: "Delete your account",
    text: "Remove everything — profile, media kit, content and Instagram data.",
    steps: ["Sign in and open Settings.", "Choose Delete account and confirm."],
    note: "Billing and tax records we must keep by law are retained for the legal period only.",
  },
  {
    tag: "Option 3",
    title: "Email us",
    text: "Can’t sign in? We’ll do it for you.",
    steps: [
      <>
        Email <a href="mailto:givebacktogurugram@gmail.com?subject=Delete%20my%20data">givebacktogurugram@gmail.com</a>{" "}
        from your account email.
      </>,
      "Subject: “Delete my data”, with your Instagram username.",
    ],
    note: "We confirm by email when it’s done.",
  },
];

function DeleteOptions() {
  return (
    <section className="dd">
      <div className="dd-wrap">
        <div className="dd-grid">
          {OPTIONS.map((o) => (
            <article key={o.tag} className={`dd-card ${o.featured ? "dd-card--featured" : ""}`}>
              <span className="dd-tag">{o.tag}</span>
              <h2 className="dd-title">{o.title}</h2>
              <p className="dd-text">{o.text}</p>
              <ol className="dd-steps">
                {o.steps.map((s, i) => (
                  <li key={i}>
                    <span className="dd-step__no">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <p className="dd-note">{o.note}</p>
            </article>
          ))}
        </div>

        <p className="dd-info">
          <Info /> This page is our data-deletion instructions for Meta’s Platform Terms.
        </p>
      </div>

      <style>{`
        .dd {
          background: #fcfdef;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .dd-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 60px 32px 104px;
        }
        .dd-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          align-items: start;
        }
        .dd-card {
          background: #fff;
          border: 1px solid #e6e8d4;
          border-radius: 24px;
          padding: 28px 28px 24px;
        }
        .dd-card--featured {
          background: #f4f5e6;
          border-color: #c9cba8;
        }
        .dd-tag {
          display: inline-block;
          padding: 5px 11px;
          border-radius: 999px;
          background: #eff0de;
          color: #3a3c2c;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .dd-card--featured .dd-tag { background: #3f4130; color: #fff; }
        .dd-title {
          margin: 18px 0 12px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(28px, 2.6vw, 36px);
          line-height: 1.1;
        }
        .dd-text {
          margin: 0 0 18px;
          max-width: 300px;
          font-size: 14px;
          line-height: 1.55;
          color: #6b6d5c;
        }
        .dd-steps {
          list-style: none;
          margin: 0;
          padding: 0 0 18px;
          display: grid;
          gap: 12px;
          border-bottom: 1px solid #e6e8d4;
        }
        .dd-steps li {
          display: flex;
          gap: 12px;
          font-size: 14px;
          line-height: 1.5;
          color: #23251a;
        }
        .dd-steps a { color: inherit; text-decoration: underline; text-underline-offset: 3px; word-break: break-all; }
        .dd-step__no {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #eef0dc;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 700;
          color: #3f4130;
        }
        .dd-note {
          margin: 16px 0 0;
          font-size: 13px;
          line-height: 1.55;
          color: #8a8c78;
        }

        .dd-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0 0;
          padding: 18px 20px;
          border: 1px solid #e6e8d4;
          border-radius: 16px;
          background: #fff;
          font-size: 14px;
          color: #4d4f3e;
        }
        .dd-info svg { flex-shrink: 0; color: #5d5f4d; }

        @media (max-width: 1024px) {
          .dd-wrap { padding: 48px 32px 88px; }
          .dd-grid { grid-template-columns: 1fr; max-width: 620px; }
          .dd-text { max-width: none; }
        }
        @media (max-width: 640px) {
          .dd-wrap { padding: 32px 20px 72px; }
          .dd-card { padding: 22px 20px 20px; border-radius: 20px; }
          .dd-info { align-items: flex-start; font-size: 13.5px; }
        }
      `}</style>
    </section>
  );
}
