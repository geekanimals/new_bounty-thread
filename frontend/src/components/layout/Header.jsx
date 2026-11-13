"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import {
  ArrowRight,
  ChevronDown,
  Search,
  Globe,
  Star,
  Building,
  Users,
  Heart,
  PlaySquare,
  Menu,
  Close,
} from "@/components/ui/Icons";

// Nav ke dropdown menus ka data
const MENUS = {
  product: {
    label: "Product",
    items: [
      { icon: Star, title: "Creator media kit", text: "Profile, portfolio & growth score", href: "/#who" },
      { icon: Building, title: "Campaigns", text: "Briefs, approvals & live results", href: "/#how" },
      { icon: Users, title: "Mass Barter Engine", text: "Barter at scale, start to ROI", href: "/#barter" },
      { icon: Heart, title: "IRM", text: "Every relationship, kept warm", href: "/#who" },
    ],
  },
  who: {
    label: "Who it's for",
    items: [
      { icon: Star, title: "For creators", text: "Media kit, AI dream plan, barter & paid deals", href: "/#who" },
      { icon: Building, title: "For brands", text: "Approvals, live results, links & sales", href: "/#who" },
      { icon: Users, title: "For agencies", text: "Run campaigns end to end, payouts, billing", href: "/#who" },
      { icon: Heart, title: "For celebrity managers", text: "IRM — every relationship, warm", href: "/#who" },
    ],
  },
  resources: {
    label: "Resources",
    items: [
      { icon: PlaySquare, title: "Watch demo", text: "The whole OS in 90 seconds", href: "/#demo" },
      { icon: Star, title: "FAQs", text: "What creators and brands ask most", href: "/#faq" },
      { icon: Users, title: "Help centre", text: "Guides and answers", href: "/#faq" },
      { icon: Heart, title: "Contact us", text: "Talk to the Geek team", href: "/#early-access" },
    ],
  },
};

export default function Header() {
  const [openMenu, setOpenMenu] = useState(null); // desktop dropdown
  const [mobileOpen, setMobileOpen] = useState(false); // mobile drawer
  const [mobileGroup, setMobileGroup] = useState(null); // mobile accordion

  // Mobile drawer khula ho to page scroll band
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Escape dabane par sab band
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeAll = () => {
    setOpenMenu(null);
    setMobileOpen(false);
  };

  return (
    <header className="hd">
      {/* ---------- Top announcement bar ---------- */}
      <div className="hd-top">
        <div className="hd-wrap hd-top__inner">
          <p className="hd-top__msg">
            <span className="hd-top__badge">New</span>
            <span className="hd-top__text">Creators join free, forever — set up your media kit in 2 minutes</span>
            <Link href="/#early-access" className="hd-top__cta">
              Start free <ArrowRight size={13} />
            </Link>
          </p>
          <nav className="hd-top__links" aria-label="Quick links">
            <Link href="/#who">For brands</Link>
            <Link href="/#who">For agencies</Link>
            <Link href="/#faq">Help centre</Link>
            <button type="button" className="hd-top__lang">
              <Globe size={13} /> English (IN) <ChevronDown size={12} />
            </button>
          </nav>
        </div>
      </div>

      {/* ---------- Main nav ---------- */}
      <div className="hd-main">
        <div className="hd-wrap hd-main__inner">
          <Logo />

          <nav className="hd-nav" aria-label="Main" onMouseLeave={() => setOpenMenu(null)}>
            {["product", "who"].map((key) => (
              <div key={key} className="hd-nav__item" onMouseEnter={() => setOpenMenu(key)}>
                <button
                  type="button"
                  className={`hd-nav__link ${openMenu === key ? "is-active" : ""}`}
                  aria-expanded={openMenu === key}
                  onClick={() => setOpenMenu(openMenu === key ? null : key)}
                >
                  {MENUS[key].label} <ChevronDown />
                </button>
              </div>
            ))}
            <Link href="/#barter" className="hd-nav__link" onMouseEnter={() => setOpenMenu(null)}>
              Mass Barter
            </Link>
            <Link href="/#pricing" className="hd-nav__link" onMouseEnter={() => setOpenMenu(null)}>
              Pricing
            </Link>
            <div className="hd-nav__item" onMouseEnter={() => setOpenMenu("resources")}>
              <button
                type="button"
                className={`hd-nav__link ${openMenu === "resources" ? "is-active" : ""}`}
                aria-expanded={openMenu === "resources"}
                onClick={() => setOpenMenu(openMenu === "resources" ? null : "resources")}
              >
                Resources <ChevronDown />
              </button>
            </div>

            {/* Mega dropdown panel */}
            {openMenu && (
              <div className="hd-drop" role="menu">
                <div className="hd-drop__grid">
                  {MENUS[openMenu].items.map(({ icon: Icon, title, text, href }) => (
                    <Link key={title} href={href} className="hd-drop__card" onClick={closeAll}>
                      <span className="hd-drop__icon">
                        <Icon />
                      </span>
                      <span>
                        <span className="hd-drop__title">{title}</span>
                        <span className="hd-drop__text">{text}</span>
                      </span>
                    </Link>
                  ))}
                </div>
                <Link href="/#demo" className="hd-drop__foot" onClick={closeAll}>
                  <span>
                    <PlaySquare size={15} /> New here? Watch the 90-second demo
                  </span>
                  <span className="hd-drop__all">See all features →</span>
                </Link>
              </div>
            )}
          </nav>

          <div className="hd-actions">
            <button type="button" className="hd-search" aria-label="Search">
              <Search />
            </button>
            <Link href="/creator" className="hd-signin">
              Sign in
            </Link>
            <Link href="/#demo" className="hd-btn hd-btn--ghost">
              Book a demo
            </Link>
            <Link href="/#early-access" className="hd-btn hd-btn--dark">
              Join free <ArrowRight size={15} />
            </Link>
          </div>

          <button
            type="button"
            className="hd-burger"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <Close /> : <Menu />}
          </button>
        </div>
      </div>

      {/* ---------- Mobile drawer ---------- */}
      <div className={`hd-mobile ${mobileOpen ? "is-open" : ""}`}>
        <div className="hd-mobile__body">
          {Object.entries(MENUS).map(([key, menu]) => (
            <div key={key} className="hd-mobile__group">
              <button
                type="button"
                className="hd-mobile__head"
                aria-expanded={mobileGroup === key}
                onClick={() => setMobileGroup(mobileGroup === key ? null : key)}
              >
                {menu.label}
                <span className={`hd-mobile__chev ${mobileGroup === key ? "is-up" : ""}`}>
                  <ChevronDown size={16} />
                </span>
              </button>
              {mobileGroup === key && (
                <div className="hd-mobile__list">
                  {menu.items.map(({ title, text, href }) => (
                    <Link key={title} href={href} onClick={closeAll}>
                      <strong>{title}</strong>
                      <span>{text}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link href="/#barter" className="hd-mobile__link" onClick={closeAll}>
            Mass Barter
          </Link>
          <Link href="/#pricing" className="hd-mobile__link" onClick={closeAll}>
            Pricing
          </Link>
          <Link href="/creator" className="hd-mobile__link" onClick={closeAll}>
            Sign in
          </Link>

          <div className="hd-mobile__cta">
            <Link href="/#demo" className="hd-btn hd-btn--ghost" onClick={closeAll}>
              Book a demo
            </Link>
            <Link href="/#early-access" className="hd-btn hd-btn--dark" onClick={closeAll}>
              Join free <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .hd {
          position: sticky;
          top: 0;
          z-index: 50;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .hd-wrap {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 32px;
        }
        .hd a { text-decoration: none; }
        .hd button { font: inherit; cursor: pointer; }

        /* Top bar */
        .hd-top {
          background: #3f4130;
          color: #e9ead8;
          font-size: 12.5px;
        }
        .hd-top__inner {
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .hd-top__msg {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .hd-top__badge {
          background: #5a5c48;
          color: #fff;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 5px;
          flex-shrink: 0;
        }
        .hd-top__text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #d9dbc6;
        }
        .hd-top__cta {
          color: #fff;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }
        .hd-top__links {
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .hd-top__links a { color: #d9dbc6; transition: color .2s; }
        .hd-top__links a:hover { color: #fff; }
        .hd-top__lang {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 0;
          color: #fff;
          font-size: 12.5px;
          padding: 0;
        }

        /* Main bar */
        .hd-main {
          background: rgba(252, 253, 239, 0.94);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid #e6e8d4;
        }
        .hd-main__inner {
          height: 74px;
          display: flex;
          align-items: center;
          gap: 40px;
        }
        .hd-nav {
          position: relative;
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          height: 100%;
        }
        .hd-nav__item { height: 100%; display: flex; align-items: center; }
        .hd-nav__link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 0;
          padding: 8px 12px;
          border-radius: 8px;
          color: #23251a;
          font-size: 14.5px;
          font-weight: 500;
          transition: background .2s;
        }
        .hd-nav__link:hover,
        .hd-nav__link.is-active { background: #eef0dc; }

        .hd-drop {
          position: absolute;
          top: calc(100% - 6px);
          left: -20px;
          width: min(960px, calc(100vw - 64px));
          background: #fff;
          border: 1px solid #e6e8d4;
          border-radius: 18px;
          box-shadow: 0 24px 60px -24px rgba(48, 50, 30, 0.28);
          padding: 14px;
          animation: hdDrop .18s ease;
        }
        @keyframes hdDrop {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hd-drop__grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .hd-drop__card {
          display: flex;
          gap: 12px;
          padding: 14px;
          border-radius: 12px;
          background: #fcfdef;
          color: #23251a;
          transition: background .2s;
        }
        .hd-drop__card:hover { background: #f1f3e0; }
        .hd-drop__icon {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border-radius: 9px;
          background: #eef0dc;
          display: grid;
          place-items: center;
          color: #3f4130;
        }
        .hd-drop__title {
          display: block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .hd-drop__text {
          display: block;
          font-size: 12.5px;
          line-height: 1.45;
          color: #6b6d5c;
        }
        .hd-drop__foot {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-radius: 12px;
          background: #f1f3e0;
          color: #23251a;
          font-size: 13px;
        }
        .hd-drop__foot > span:first-child {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .hd-drop__all { color: #6f7556; font-weight: 600; }

        .hd-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hd-search {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid #e3e5d0;
          background: #fff;
          color: #23251a;
          display: grid;
          place-items: center;
        }
        .hd-signin {
          color: #23251a;
          font-size: 14.5px;
          font-weight: 500;
          padding: 0 6px;
        }
        .hd-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 40px;
          padding: 0 18px;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 500;
          white-space: nowrap;
          transition: transform .2s, background .2s;
        }
        .hd-btn:hover { transform: translateY(-1px); }
        .hd-btn--ghost {
          border: 1px solid #3f4130;
          color: #23251a;
          background: transparent;
        }
        .hd-btn--dark {
          background: #3f4130;
          color: #fff;
          border: 1px solid #3f4130;
        }
        .hd-btn--dark:hover { background: #2f3124; }

        .hd-burger {
          display: none;
          margin-left: auto;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 1px solid #e3e5d0;
          background: #fff;
          color: #23251a;
          place-items: center;
        }

        /* Mobile drawer */
        .hd-mobile {
          display: none;
        }

        /* ---------- Responsive ---------- */
        @media (max-width: 1180px) {
          .hd-main__inner { gap: 24px; }
          .hd-nav__link { padding: 8px 8px; font-size: 14px; }
          .hd-search { display: none; }
        }
        @media (max-width: 1024px) {
          .hd-nav,
          .hd-actions { display: none; }
          .hd-burger { display: grid; }
          .hd-top__links { display: none; }

          .hd-mobile {
            display: block;
            position: fixed;
            left: 0;
            right: 0;
            top: 110px;
            bottom: 0;
            background: #fcfdef;
            transform: translateX(100%);
            transition: transform .3s ease;
            overflow-y: auto;
          }
          .hd-mobile.is-open { transform: translateX(0); }
          .hd-mobile__body {
            padding: 12px 24px 40px;
            display: flex;
            flex-direction: column;
          }
          .hd-mobile__group,
          .hd-mobile__link {
            border-bottom: 1px solid #e6e8d4;
          }
          .hd-mobile__head,
          .hd-mobile__link {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 0;
            background: none;
            border: 0;
            color: #23251a;
            font-family: var(--font-serif), Georgia, serif;
            font-size: 24px;
            text-align: left;
          }
          .hd-mobile__chev { transition: transform .2s; display: inline-flex; }
          .hd-mobile__chev.is-up { transform: rotate(180deg); }
          .hd-mobile__list {
            display: grid;
            gap: 8px;
            padding-bottom: 16px;
          }
          .hd-mobile__list a {
            display: flex;
            flex-direction: column;
            gap: 3px;
            padding: 12px 14px;
            border-radius: 12px;
            background: #f1f3e0;
            color: #23251a;
          }
          .hd-mobile__list strong { font-size: 14.5px; font-weight: 600; }
          .hd-mobile__list span { font-size: 13px; color: #6b6d5c; }
          .hd-mobile__cta {
            display: grid;
            gap: 10px;
            margin-top: 28px;
          }
          .hd-mobile__cta .hd-btn { height: 48px; font-size: 15px; }
        }
        @media (max-width: 640px) {
          .hd-wrap { padding: 0 20px; }
          .hd-top__text { display: none; }
          .hd-top__inner { justify-content: center; }
          .hd-main__inner { height: 64px; }
          .hd-mobile { top: 100px; }
          .hd-mobile__body { padding: 8px 20px 40px; }
        }
      `}</style>
    </header>
  );
}
