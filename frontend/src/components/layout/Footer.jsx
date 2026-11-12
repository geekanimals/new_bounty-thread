import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { Instagram, Chat, Send } from "@/components/ui/Icons";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Who it's for", href: "/#who" },
      { label: "Watch demo", href: "/#demo" },
      { label: "Mass Barter", href: "/#barter" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Sign in", href: "/creater" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Shipping & Delivery", href: "/shipping-delivery" },
      { label: "Refund & Cancellation", href: "/refund-cancellation" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Data Deletion", href: "/data-deletion" },
    ],
  },
];

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Chat, label: "WhatsApp", href: "#" },
  { icon: Send, label: "Email", href: "mailto:givebacktogurugram@gmail.com" },
];

export default function Footer() {
  return (
    <footer className="ft">
      <div className="ft-wrap">
        <div className="ft-top">
          <div className="ft-brand">
            <Logo />
            <p className="ft-about">
              The operating system for influencer marketing — for creators, brands and agencies.
            </p>
            <div className="ft-socials">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a key={label} href={href} aria-label={label} className="ft-social">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <div className="ft-cols">
            {COLUMNS.map((col) => (
              <div key={col.title} className="ft-col">
                <h4 className="ft-col__title">{col.title}</h4>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="ft-word" aria-hidden="true">
          Geek.
        </div>

        <div className="ft-bottom">
          <span>© 2026 Geek Online Ventures Pvt Ltd. All rights reserved.</span>
          <span>Made in India</span>
        </div>
      </div>

      <style>{`
        .ft {
          background: #f4f5e6;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
          overflow: hidden;
        }
        .ft-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 72px 32px 32px;
        }
        .ft-top {
          display: flex;
          justify-content: space-between;
          gap: 48px;
        }
        .ft-brand { max-width: 360px; }
        .ft-about {
          margin: 22px 0 22px;
          font-size: 15px;
          line-height: 1.6;
          color: #6b6d5c;
        }
        .ft-socials { display: flex; gap: 10px; }
        .ft-social {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid #e3e5d0;
          background: #f9faea;
          color: #23251a;
          display: grid;
          place-items: center;
          transition: background .2s, color .2s;
        }
        .ft-social:hover { background: #3f4130; color: #fff; }

        .ft-cols {
          display: grid;
          grid-template-columns: repeat(3, minmax(140px, auto));
          gap: 32px 40px;
        }
        .ft-col__title {
          margin: 0 0 16px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .ft-col ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 12px;
        }
        .ft-col a {
          color: #3a3c2c;
          font-size: 14px;
          text-decoration: none;
          transition: color .2s;
        }
        .ft-col a:hover { color: #7e8462; }

        .ft-word {
          font-family: var(--font-serif), Georgia, serif;
          font-style: italic;
          font-size: clamp(110px, 19vw, 260px);
          line-height: 0.9;
          color: #e3e6cc;
          margin: 28px 0 24px;
          letter-spacing: -0.02em;
          user-select: none;
        }

        .ft-bottom {
          border-top: 1px solid #e3e5d0;
          padding-top: 22px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 12.5px;
          color: #6b6d5c;
        }

        @media (max-width: 900px) {
          .ft-top { flex-direction: column; }
        }
        @media (max-width: 640px) {
          .ft-wrap { padding: 56px 20px 28px; }
          .ft-cols { grid-template-columns: 1fr 1fr; }
          .ft-bottom { flex-direction: column; }
        }
      `}</style>
    </footer>
  );
}
