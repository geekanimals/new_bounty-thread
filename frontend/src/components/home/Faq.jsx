"use client";

import { useState } from "react";
import { Plus, Send } from "@/components/ui/Icons";

const FAQS = [
  {
    q: "Is Geek free for creators?",
    a: "Yes. Creators join free, forever — build your media kit, follow your AI dream plan and accept barter and paid deals without paying anything.",
  },
  {
    q: "When do creators get paid?",
    a: "For paid campaigns, after the agreed posts are live, approved and kept up as per the contract — within the timeline in the contract (for example 7 days after going live). Money goes to your verified bank account or UPI.",
  },
  {
    q: "What is a barter campaign?",
    a: "The brand ships you its product, you create and post the agreed content, and you keep the product. Geek tracks every step — application, shipping, video approval and the live post.",
  },
  {
    q: "How much does it cost a brand?",
    a: "It depends on the campaign — the number of creators, barter or paid, and the reporting you need. Share your brief and we’ll send a clear plan and quote.",
  },
  {
    q: "How do brands pay?",
    a: "Brands pay securely online before the campaign goes live. Creator payouts are then released from the platform once the posts are approved and live.",
  },
  {
    q: "Does anything post without the brand’s OK?",
    a: "Never. Brands approve every creator and every video before anything goes live.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState(1); // design mein 2nd question khula hai

  return (
    <section className="fq" id="faq">
      <div className="fq-wrap">
        <div className="fq-intro">
          <p className="fq-eyebrow">Questions</p>
          <h2 className="fq-title">
            Good to <em>know.</em>
          </h2>
          <p className="fq-sub">The things creators and brands ask us most. Anything else — write to us.</p>
          <a href="mailto:givebacktogurugram@gmail.com" className="fq-mail">
            <Send size={14} /> givebacktogurugram@gmail.com
          </a>
        </div>

        <div className="fq-list">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className={`fq-item ${isOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="fq-q"
                  aria-expanded={isOpen}
                  aria-controls={`fq-a-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{item.q}</span>
                  <span className="fq-icon">
                    <Plus />
                  </span>
                </button>
                <div id={`fq-a-${i}`} className="fq-a" role="region">
                  <div className="fq-a__inner">
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .fq {
          background: #fcfdef;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .fq-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 104px 32px 112px;
          display: grid;
          grid-template-columns: 0.6fr 1fr;
          gap: 56px;
          align-items: start;
        }
        .fq-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 18px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .fq-eyebrow::before {
          content: "";
          width: 20px;
          height: 1px;
          background: currentColor;
        }
        .fq-title {
          margin: 0 0 18px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(40px, 4.6vw, 64px);
          line-height: 1.02;
        }
        .fq-title em { font-style: italic; color: #7e8462; }
        .fq-sub {
          margin: 0 0 26px;
          max-width: 300px;
          font-size: 14.5px;
          line-height: 1.6;
          color: #6b6d5c;
        }
        .fq-mail {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 11px 18px;
          border: 1px solid #3f4130;
          border-radius: 10px;
          color: #23251a;
          font-size: 13.5px;
          font-weight: 500;
          text-decoration: none;
          word-break: break-all;
          transition: background .2s, color .2s;
        }
        .fq-mail:hover { background: #3f4130; color: #fff; }

        .fq-item { border-bottom: 1px solid #e3e5d0; }
        .fq-q {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 22px 0;
          background: none;
          border: 0;
          cursor: pointer;
          text-align: left;
          color: #23251a;
          font-family: var(--font-serif), Georgia, serif;
          font-size: clamp(21px, 2vw, 27px);
          line-height: 1.2;
        }
        .fq-icon {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          border-radius: 50%;
          border: 1px solid #dfe1cc;
          background: #fff;
          color: #23251a;
          display: grid;
          place-items: center;
          transition: transform .25s, background .25s, color .25s, border-color .25s;
        }
        .fq-item.is-open .fq-icon {
          transform: rotate(45deg);
          background: #3f4130;
          border-color: #3f4130;
          color: #fff;
        }
        .fq-a {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows .3s ease;
        }
        .fq-item.is-open .fq-a { grid-template-rows: 1fr; }
        .fq-a__inner { overflow: hidden; }
        .fq-a p {
          margin: 0;
          padding: 0 48px 24px 0;
          max-width: 600px;
          font-size: 14.5px;
          line-height: 1.65;
          color: #6b6d5c;
        }

        @media (max-width: 1024px) {
          .fq-wrap {
            grid-template-columns: 1fr;
            gap: 36px;
            padding: 80px 32px 88px;
          }
          .fq-sub { max-width: 460px; }
        }
        @media (max-width: 640px) {
          .fq-wrap { padding: 64px 20px 72px; }
          .fq-q { padding: 18px 0; }
          .fq-a p { padding-right: 0; }
        }
      `}</style>
    </section>
  );
}
