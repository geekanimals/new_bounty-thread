"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Sparkle } from "@/components/ui/Icons";

/* ================= Page ================= */

const TOC = [
  { id: "pay", label: "1. What you pay for" },
  { id: "cancel", label: "2. Cancelling a campaign" },
  { id: "due", label: "3. When a refund is due from our side" },
  { id: "paid", label: "4. How and when refunds are paid" },
  { id: "creators", label: "5. Creators" },
  { id: "request", label: "6. How to request" },
];

const IN_SHORT = [
  "Cancel before work starts and you get everything back.",
  "A creator who doesn’t deliver and can’t be replaced is refunded or adjusted on your next bill.",
  "Approved refunds are processed in 5–7 working days, to the original payment method.",
];

export default function RefundPage() {
  return (
    <>
      <title>Refund &amp; Cancellation — Geek Influencer OS</title>
      <meta name="description" content="How cancellations and refunds work on Geek Influencer OS." />
      <PageHero
        eyebrow="Legal"
        title={
          <>
            Refund &amp; <em>Cancellation</em>
          </>
        }
        sub="Last updated 28 October 2026 · Geek Online Ventures Pvt Ltd · Geek Influencer OS"
        active="refund"
      />

      <LegalBody toc={TOC} inShort={IN_SHORT}>
        <LegalSection id="pay" title="1. What you pay for">
          <p>
            Campaign management, creator fees paid on your behalf, content and related charges — as agreed in the quote and
            shown on each bill.
          </p>
        </LegalSection>

        <LegalSection id="cancel" title="2. Cancelling a campaign">
          <CancelStages />
        </LegalSection>

        <LegalSection id="due" title="3. When a refund is due from our side">
          <Bullets
            items={[
              "A creator doesn’t deliver and can’t be replaced with a similar profile.",
              "You were charged twice, or more than the bill amount.",
              "Money was debited but the payment failed — usually reversed automatically in 5–7 working days.",
            ]}
          />
        </LegalSection>

        <LegalSection id="paid" title="4. How and when refunds are paid">
          <Bullets
            items={[
              "To the original method through Razorpay, or by bank transfer if you paid that way.",
              "Processed within 5–7 working days; your bank may take another 5–10.",
              "GST is adjusted with a credit note.",
            ]}
          />
        </LegalSection>

        <LegalSection id="creators" title="5. Creators">
          <p>Creators never pay to join campaigns. Fees for paid campaigns are paid by Geek as described in the Terms.</p>
        </LegalSection>

        <LegalSection id="request" title="6. How to request">
          <p>
            Email <a href="mailto:givebacktogurugram@gmail.com">givebacktogurugram@gmail.com</a> with your brand name, bill
            number and payment reference. We reply within 48 hours.
          </p>
        </LegalSection>
      </LegalBody>
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

/* ---------- Chhote building blocks — legal pages inhi se bante hain ---------- */

function LegalSection({ id, title, children }) {
  return (
    <section id={id} className="lg-section">
      <h2 className="lg-h2">{title}</h2>
      {children}
    </section>
  );
}

function Bullets({ items }) {
  return (
    <ul className="lg-bullets">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

function Subhead({ children }) {
  return <p className="lg-subhead">{children}</p>;
}

/* ---------- Main body: left "On this page" + right content ---------- */

/**
 * toc     : [{ id, label }] — left side list
 * inShort : string[] — top summary box
 * children: <LegalSection /> blocks
 */
function LegalBody({ toc, inShort, children }) {
  const [active, setActive] = useState(toc[0]?.id);

  // Scroll karte waqt jo section screen par hai wo TOC mein highlight ho
  useEffect(() => {
    const els = toc.map((t) => document.getElementById(t.id)).filter(Boolean);
    if (!els.length || !("IntersectionObserver" in window)) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-130px 0px -55% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [toc]);

  return (
    <div className="lg">
      <div className="lg-wrap">
        <aside className="lg-aside">
          <div className="lg-toc">
            <p className="lg-toc__title">On this page</p>
            <ul>
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className={active === t.id ? "is-active" : ""} onClick={() => setActive(t.id)}>
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="lg-help">
              <p className="lg-help__title">Questions?</p>
              <a href="mailto:givebacktogurugram@gmail.com">givebacktogurugram@gmail.com</a>
              <span>Mon–Sat · 10 am – 7 pm IST</span>
            </div>
          </div>
        </aside>

        <article className="lg-content">
          {inShort?.length > 0 && (
            <div className="lg-short">
              <p className="lg-short__title">
                <Sparkle /> In short
              </p>
              <ul>
                {inShort.map((t) => (
                  <li key={t}>
                    <Check size={14} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {children}

          <CompanyCard />
        </article>
      </div>

      <style>{`
        .lg {
          background: #fcfdef;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .lg-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 60px 32px 104px;
          display: grid;
          grid-template-columns: 288px minmax(0, 1fr);
          gap: 64px;
          align-items: start;
        }

        /* TOC */
        .lg-aside { position: sticky; top: 132px; }
        .lg-toc {
          background: #fff;
          border: 1px solid #ecedde;
          border-radius: 20px;
          padding: 20px 14px 14px;
        }
        .lg-toc__title {
          margin: 0 0 12px 10px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .lg-toc ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 2px;
        }
        .lg-toc a {
          position: relative;
          display: block;
          padding: 9px 12px 9px 16px;
          border-radius: 9px;
          font-size: 13.5px;
          line-height: 1.35;
          color: #6b6d5c;
          text-decoration: none;
          transition: background .2s, color .2s;
        }
        .lg-toc a:hover { color: #23251a; }
        .lg-toc a.is-active {
          background: #eef0dc;
          color: #23251a;
          font-weight: 600;
        }
        .lg-toc a.is-active::before {
          content: "";
          position: absolute;
          left: 7px;
          top: 9px;
          bottom: 9px;
          width: 2.5px;
          border-radius: 2px;
          background: #3f4130;
        }
        .lg-help {
          margin-top: 14px;
          padding: 14px 16px;
          border-radius: 12px;
          background: #f4f5e6;
          border: 1px solid #d9dbc2;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .lg-help__title {
          margin: 0 0 2px;
          font-size: 13px;
          font-weight: 600;
          color: #5d5f4d;
        }
        .lg-help a {
          font-size: 12.5px;
          color: #23251a;
          text-decoration: none;
          word-break: break-all;
        }
        .lg-help a:hover { text-decoration: underline; }
        .lg-help span { font-size: 11.5px; color: #9a9c88; }

        /* Content */
        .lg-content { max-width: 900px; min-width: 0; }
        .lg-short {
          background: #f4f5e6;
          border: 1px solid #d6d8bd;
          border-radius: 20px;
          padding: 22px 26px 20px;
          margin-bottom: 44px;
        }
        .lg-short__title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #5d5f4d;
        }
        .lg-short ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 9px;
        }
        .lg-short li {
          display: flex;
          gap: 14px;
          font-size: 14.5px;
          line-height: 1.5;
          color: #23251a;
        }
        .lg-short li svg { color: #7e8462; flex-shrink: 0; margin-top: 3px; }

        .lg-section { scroll-margin-top: 130px; }
        .lg-section + .lg-section { margin-top: 40px; }
        .lg-h2 {
          margin: 0 0 14px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(28px, 2.8vw, 38px);
          line-height: 1.15;
          letter-spacing: -0.005em;
        }
        .lg-content p {
          margin: 0 0 12px;
          font-size: 15px;
          line-height: 1.7;
          color: #4d4f3e;
        }
        .lg-section p > a {
          color: #3f4130;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 3px;
          word-break: break-word;
        }
        .lg-content .lg-subhead {
          margin: 16px 0 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .lg-content .lg-subhead:first-of-type { margin-top: 0; }
        .lg-bullets {
          list-style: none;
          margin: 0 0 12px;
          padding: 0;
          display: grid;
          gap: 8px;
        }
        .lg-bullets li {
          position: relative;
          padding-left: 22px;
          font-size: 15px;
          line-height: 1.65;
          color: #4d4f3e;
        }
        .lg-bullets li::before {
          content: "";
          position: absolute;
          left: 4px;
          top: 10px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #3f4130;
        }

        /* ---------- Responsive ---------- */
        @media (max-width: 1024px) {
          .lg-wrap {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 48px 32px 88px;
          }
          .lg-aside { position: static; }
          .lg-toc ul { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .lg-wrap { padding: 32px 20px 72px; }
          .lg-toc ul { grid-template-columns: 1fr; }
          .lg-help { display: none; }
          .lg-short { padding: 18px 18px 16px; margin-bottom: 36px; }
          .lg-short li { font-size: 14px; gap: 10px; }
          .lg-content p,
          .lg-bullets li { font-size: 14.5px; }
        }
      `}</style>
    </div>
  );
}

// Legal pages ke end mein company details wala card
function CompanyCard() {
  return (
    <div className="cc">
      <span className="cc-mark">g</span>
      <div>
        <p className="cc-name">Geek Online Ventures Pvt Ltd</p>
        <p className="cc-meta">
          <a href="mailto:givebacktogurugram@gmail.com">givebacktogurugram@gmail.com</a> · Monday to Saturday, 10:00 am –
          7:00 pm IST
        </p>
      </div>

      <style>{`
        .cc {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 40px;
          padding: 18px 20px;
          border: 1px solid #e6e8d4;
          border-radius: 18px;
          background: #fff;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .cc-mark {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 10px;
          background: #3f4130;
          color: #f4f5e6;
          display: grid;
          place-items: center;
          font-family: var(--font-serif), Georgia, serif;
          font-style: italic;
          font-size: 26px;
          padding-bottom: 5px;
        }
        .cc-name {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 600;
          color: #23251a;
        }
        .cc-meta {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #77796a;
        }
        .cc-meta a { color: inherit; text-decoration: none; }
        .cc-meta a:hover { color: #3f4130; text-decoration: underline; }
      `}</style>
    </div>
  );
}

// Refund page — "Cancelling a campaign" ke 3 stage cards
const STAGES = [
  { no: 1, title: "Before work starts", text: "Full refund of what you paid.", tone: "dark" },
  { no: 2, title: "After work has started", text: "Paid amount minus work done and costs already committed.", tone: "amber" },
  { no: 3, title: "After delivery", text: "Not refundable once content is approved and posted.", tone: "rose" },
];

function CancelStages() {
  return (
    <div className="cs">
      {STAGES.map((s) => (
        <div key={s.no} className="cs-card">
          <p className="cs-head">
            <span className={`cs-no cs-no--${s.tone}`}>{s.no}</span>
            {s.title}
          </p>
          <p className="cs-text">{s.text}</p>
        </div>
      ))}

      <style>{`
        .cs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin: 4px 0 8px;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .cs-card {
          background: #fff;
          border: 1px solid #e6e8d4;
          border-radius: 16px;
          padding: 18px 18px 16px;
        }
        .cs-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 10px !important;
          font-size: 14.5px !important;
          font-weight: 600;
          color: #23251a !important;
        }
        .cs-no {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
        }
        .cs-no--dark { background: #3f4130; }
        .cs-no--amber { background: #e2bd70; }
        .cs-no--rose { background: #e8aaa0; }
        .cs-text {
          margin: 0 !important;
          font-size: 13.5px !important;
          line-height: 1.55 !important;
          color: #5d5f4d !important;
        }

        @media (max-width: 780px) {
          .cs { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
