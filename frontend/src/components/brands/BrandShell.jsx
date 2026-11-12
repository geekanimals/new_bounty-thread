"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid,
  CheckSquare,
  Megaphone,
  Bookmark,
  Compass,
  Instagram,
  Facebook,
  BarChart,
  Receipt,
  Settings,
  Sparkle,
  Search,
  Bell,
  LogOut,
  Menu,
  Close,
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
  Users,
  Play,
  TrendUp,
  Chat,
  Eye,
  Heart,
  LinkIcon,
  Wallet,
  Package,
  User,
} from "@/components/ui/Icons";
import { BRAND, USER, WORKSPACES, NOTIFICATIONS } from "@/components/brands/data";

const NAV = [
  {
    group: "Today",
    items: [
      { label: "Dashboard", href: "/brands/dashboard", icon: Grid, also: ["/brands/notifications", "/brands/assistant"] },
      { label: "Approvals", href: "/brands/approvals", icon: CheckSquare, badge: 7, tone: "red" },
    ],
  },
  {
    group: "Campaigns",
    items: [
      { label: "Campaigns", href: "/brands/campaigns", icon: Megaphone, also: ["/brands/creators"] },
      { label: "Saved creators", href: "/brands/saved", icon: Bookmark },
    ],
  },
  {
    group: "Social",
    items: [
      { label: "Discovery", href: "/brands/discovery", icon: Compass },
      { label: "Instagram", href: "/brands/instagram", icon: Instagram },
      { label: "Facebook", href: "/brands/facebook", icon: Facebook },
    ],
  },
  {
    group: "Insights",
    items: [
      { label: "Reports", href: "/brands/reports", icon: BarChart },
      { label: "Billing", href: "/brands/billing", icon: Receipt, badge: 1, tone: "orange" },
    ],
  },
];
const ALL_NAV = NAV.flatMap((g) => g.items);

/* Rang-birangi chhota icon box — alerts / notifications / activity mein */
const TONE_ICONS = {
  users: Users,
  play: Play,
  trend: TrendUp,
  chat: Chat,
  receipt: Receipt,
  megaphone: Megaphone,
  instagram: Instagram,
  check: Check,
  eye: Eye,
  heart: Heart,
  link: LinkIcon,
  wallet: Wallet,
  package: Package,
  user: User,
};
export function ToneIcon({ icon, tone = "violet", size = 34 }) {
  const Icon = TONE_ICONS[icon] || Check;
  return (
    <span className={`br-tone br-tone--${tone}`} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.45)} />
      <style>{`
        .br-tone { flex-shrink: 0; border-radius: 10px; display: grid; place-items: center; }
        .br-tone--green { background: var(--br-green-bg); color: var(--br-green); }
        .br-tone--orange { background: var(--br-orange-bg); color: var(--br-orange); }
        .br-tone--violet { background: var(--br-lilac); color: var(--br-primary); }
        .br-tone--blue { background: var(--br-blue-bg); color: var(--br-blue); }
        .br-tone--red { background: var(--br-red-bg); color: var(--br-red); }
        .br-tone--pink { background: var(--br-pink-bg); color: var(--br-pink); }
        .br-tone--dark { background: rgba(255,255,255,.12); color: #e4defc; }
      `}</style>
    </span>
  );
}

/**
 * Brand panel ka frame — har logged-in brand page isko use karta hai.
 *  - Desktop (1024px+): left sidebar hamesha dikhta hai (poori height, fixed)
 *  - Tablet (768–1023px): chhota sidebar, sirf icons
 *  - Mobile (<768px): menu upar — top bar + links ki row + upar se khulne wala panel
 * `crumbs` diya ho to top bar mein search ki jagah breadcrumb dikhta hai (Figma jaisa).
 */
export default function BrandShell({ children, crumbs }) {
  const pathname = usePathname() || "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const [ws, setWs] = useState(WORKSPACES[0]);
  const [read, setRead] = useState(false);
  const notifRef = useRef(null);
  const wsRef = useRef(null);
  const activeRef = useRef(null);

  const isActive = (item) =>
    pathname === item.href || pathname.startsWith(item.href + "/") || (item.also || []).some((p) => pathname.startsWith(p));

  useEffect(() => {
    const onDown = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (wsRef.current && !wsRef.current.contains(e.target)) setWsOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setMenuOpen(false);
        setWsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
    setWsOpen(false);
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  const latest = NOTIFICATIONS.slice(0, 5);
  const unread = read ? 0 : NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className="bs">
      {/* ---------- Sidebar ---------- */}
      <aside className="bs-side" aria-label="Brand menu">
        <Link href="/brands/dashboard" className="bs-logo" title="Geek OS">
          <span className="bs-logo__mark">g</span>
          <strong className="bs-logo__text">Geek OS</strong>
          <span className="bs-logo__tag">Brand</span>
        </Link>

        <div className="bs-ws" ref={wsRef}>
          <button type="button" className="bs-ws__btn" onClick={() => setWsOpen(!wsOpen)} aria-expanded={wsOpen} title={ws.name}>
            <span className="bs-ws__logo" style={{ background: ws.gradient }}>
              {ws.letter}
            </span>
            <span className="bs-ws__name">
              <strong>{ws.name}</strong>
              <small>{ws.note}</small>
            </span>
            <ChevronDown size={14} />
          </button>
          {wsOpen && (
            <div className="bs-ws__menu">
              <p>Switch workspace</p>
              {WORKSPACES.map((w) => (
                <button
                  type="button"
                  key={w.name}
                  onClick={() => {
                    setWs(w);
                    setWsOpen(false);
                  }}
                >
                  <span className="bs-ws__logo" style={{ background: w.gradient }}>
                    {w.letter}
                  </span>
                  {w.name}
                  {w.name === ws.name && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link href="/brands/campaigns/new" className="bs-request" title="Request a campaign">
          <Plus size={15} />
          <span>Request a campaign</span>
        </Link>

        <nav className="bs-nav">
          {NAV.map((g) => (
            <div key={g.group} className="bs-nav__group">
              <p className="bs-nav__label">{g.group}</p>
              {g.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} title={item.label} className={`bs-nav__item ${isActive(item) ? "is-active" : ""}`}>
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {item.badge && <em className={`is-${item.tone}`}>{item.badge}</em>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="bs-side__bottom">
          <Link href="/brands/assistant" className={`bs-ai ${pathname.startsWith("/brands/assistant") ? "is-active" : ""}`} title="AI Assistant">
            <span className="bs-ai__icon">
              <Sparkle size={14} />
            </span>
            <span className="bs-ai__text">
              <strong>AI Assistant</strong>
              <small>Ask about your campaigns</small>
            </span>
          </Link>
          <Link href="/brands/settings" title="Settings" className={`bs-nav__item ${pathname.startsWith("/brands/settings") ? "is-active" : ""}`}>
            <Settings size={16} />
            <span>Settings</span>
          </Link>
          <div className="bs-user">
            <span className="bs-avatar" style={{ background: USER.gradient }}>
              {USER.initials}
            </span>
            <span className="bs-user__name">
              <strong>{USER.name}</strong>
              <small>{USER.role}</small>
            </span>
            <Link href="/brands" className="bs-user__out" aria-label="Sign out" title="Sign out">
              <LogOut />
            </Link>
          </div>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="bs-main">
        <div className="bs-topwrap">
          <header className="bs-top">
            <Link href="/brands/dashboard" className="bs-mlogo" aria-label="Geek OS">
              <span className="bs-logo__mark">g</span>
              <strong>Geek OS</strong>
            </Link>

            {crumbs ? (
              <nav className="bs-crumbs" aria-label="Breadcrumb">
                {crumbs.map((c, i) => (
                  <span key={c.label}>
                    {i > 0 && <ChevronRight size={12} />}
                    {c.href ? <Link href={c.href}>{c.label}</Link> : <strong>{c.label}</strong>}
                  </span>
                ))}
              </nav>
            ) : (
              <label className="bs-search">
                <Search size={15} />
                <input type="search" placeholder="Search campaigns, creators, posts…" />
                <kbd>⌘K</kbd>
              </label>
            )}

            <div className="bs-top__right">
              {crumbs && (
                <button type="button" className="bs-icon-btn bs-search-btn" aria-label="Search">
                  <Search size={15} />
                </button>
              )}
              <Link href="/brands/campaigns" className="bs-live">
                {BRAND.liveCount} campaigns live
              </Link>

              <div className="bs-notif" ref={notifRef}>
                <button
                  type="button"
                  className={`bs-icon-btn ${notifOpen ? "is-on" : ""}`}
                  aria-label="Notifications"
                  aria-expanded={notifOpen}
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setMenuOpen(false);
                  }}
                >
                  <Bell size={16} />
                  {unread > 0 && <i className="bs-dot" />}
                </button>
                {notifOpen && (
                  <div className="bs-panel" role="dialog" aria-label="Notifications">
                    <div className="bs-panel__head">
                      <div>
                        <p className="bs-panel__title">Notifications</p>
                        <p className="bs-panel__sub">{unread} new · also on WhatsApp &amp; email</p>
                      </div>
                      <button type="button" className="bs-panel__mark" onClick={() => setRead(true)}>
                        Mark all read
                      </button>
                    </div>
                    <ul className="bs-panel__list">
                      {latest.map((n) => (
                        <li key={n.id} className={!read && n.unread ? "is-unread" : ""}>
                          <Link href={n.href || "/brands/notifications"}>
                            <ToneIcon icon={n.icon} tone={n.tone} size={32} />
                            <span className="bs-panel__body">
                              <strong>{n.title}</strong>
                              <small>{n.text}</small>
                            </span>
                            <span className="bs-panel__time">{n.time}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link href="/brands/notifications" className="bs-panel__all">
                      See all notifications <ChevronRight size={12} />
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/brands/settings" className="bs-avatar bs-avatar--top" style={{ background: USER.gradient }} aria-label="Settings">
                {USER.initials}
              </Link>

              <button
                type="button"
                className={`bs-icon-btn bs-menu-btn ${menuOpen ? "is-on" : ""}`}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setNotifOpen(false);
                }}
              >
                {menuOpen ? <Close size={17} /> : <Menu size={17} />}
              </button>
            </div>
          </header>

          {/* Mobile: links ki row */}
          <nav className="bs-mnav" aria-label="Brand menu">
            {ALL_NAV.map((item) => {
              const Icon = item.icon;
              const on = isActive(item);
              return (
                <Link key={item.href} href={item.href} ref={on ? activeRef : null} className={on ? "is-active" : ""}>
                  <Icon size={14} />
                  {item.label}
                  {item.badge && <em>{item.badge}</em>}
                </Link>
              );
            })}
          </nav>

          {/* Mobile: upar se khulne wala panel */}
          {menuOpen && (
            <div className="bs-mpanel">
              <div className="bs-mpanel__top">
                <span className="bs-ws__logo" style={{ background: ws.gradient }}>
                  {ws.letter}
                </span>
                <span className="bs-mpanel__ws">
                  <strong>{ws.name}</strong>
                  <small>{ws.note}</small>
                </span>
                <Link href="/brands/campaigns/new" className="br-btn br-btn--primary br-btn--sm">
                  <Plus size={13} /> Request
                </Link>
              </div>
              <label className="bs-msearch">
                <Search size={14} />
                <input type="search" placeholder="Search campaigns, creators, posts…" />
              </label>
              {NAV.map((g) => (
                <div key={g.group}>
                  <p className="bs-mpanel__label">{g.group}</p>
                  <div className="bs-mpanel__grid">
                    {g.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.href} href={item.href} className={isActive(item) ? "is-active" : ""}>
                          <Icon size={15} />
                          {item.label}
                          {item.badge && <em>{item.badge}</em>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="bs-mpanel__row">
                <Link href="/brands/assistant" className="bs-mpanel__ai">
                  <Sparkle size={14} /> AI Assistant
                </Link>
                <Link href="/brands/settings" className="bs-mpanel__set">
                  <Settings size={14} /> Settings
                </Link>
              </div>
              <div className="bs-user bs-user--light">
                <span className="bs-avatar" style={{ background: USER.gradient }}>
                  {USER.initials}
                </span>
                <span className="bs-user__name">
                  <strong>{USER.name}</strong>
                  <small>{USER.role}</small>
                </span>
                <Link href="/brands" className="bs-user__out">
                  <LogOut /> Sign out
                </Link>
              </div>
            </div>
          )}
        </div>
        {menuOpen && <div className="bs-overlay" onClick={() => setMenuOpen(false)} />}

        <main className="bs-content">{children}</main>
      </div>

      <style>{`
        .bs { min-height: 100vh; }

        /* ---------- Sidebar ---------- */
        .bs-side {
          position: fixed; left: 0; top: 0; bottom: 0; z-index: 40;
          width: 268px;
          display: flex; flex-direction: column;
          background: var(--br-side); color: #c9c8db;
          padding: 18px 16px 14px;
          overflow-y: auto; scrollbar-width: thin; scrollbar-color: #2a2747 transparent;
        }
        .bs-logo { display: flex; align-items: center; gap: 10px; padding: 2px 4px; }
        .bs-logo__mark {
          width: 34px; height: 34px; flex-shrink: 0; border-radius: 10px;
          background: var(--br-grad); color: #fff;
          display: grid; place-items: center; font-weight: 800; font-size: 18px;
        }
        .bs-logo__text { color: #fff; font-size: 17px; font-weight: 800; letter-spacing: -0.01em; }
        .bs-logo__tag {
          padding: 2px 8px; border-radius: 6px;
          background: rgba(232,51,109,.18); color: #ff8fb1;
          font-size: 10.5px; font-weight: 700;
        }

        .bs-ws { position: relative; margin-top: 18px; }
        .bs-ws__btn {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.03);
          color: #9c9ab5; text-align: left;
        }
        .bs-ws__btn:hover { background: rgba(255,255,255,.06); }
        .bs-ws__logo {
          width: 30px; height: 30px; flex-shrink: 0; border-radius: 8px;
          display: grid; place-items: center; color: #fff; font-size: 13px; font-weight: 800;
        }
        .bs-ws__name { flex: 1; min-width: 0; }
        .bs-ws__name strong { display: block; color: #fff; font-size: 13.5px; font-weight: 700; }
        .bs-ws__name small { display: block; font-size: 11px; color: #8d8ba6; }
        .bs-ws__menu {
          position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 5;
          padding: 8px; border-radius: 12px;
          background: #1c1938; border: 1px solid rgba(255,255,255,.08);
          box-shadow: 0 20px 40px -20px rgba(0,0,0,.6);
        }
        .bs-ws__menu p { margin: 4px 8px 6px; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #6f6d88; }
        .bs-ws__menu button {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 7px 8px; border: 0; border-radius: 9px; background: none;
          color: #fff; font-size: 13px; font-weight: 600; text-align: left;
        }
        .bs-ws__menu button:hover { background: rgba(255,255,255,.06); }
        .bs-ws__menu button svg { margin-left: auto; color: #a99bff; }
        .bs-ws__menu .bs-ws__logo { width: 24px; height: 24px; font-size: 11px; border-radius: 7px; }

        .bs-request {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          height: 42px; margin-top: 12px; border-radius: 11px;
          background: linear-gradient(135deg, #5f3dfa 0%, #7c5cff 100%); color: #fff;
          font-size: 13.5px; font-weight: 700;
          box-shadow: 0 10px 24px -12px rgba(124,92,255,.9);
        }
        .bs-request:hover { filter: brightness(1.08); }

        .bs-nav { margin-top: 8px; }
        .bs-nav__label {
          margin: 16px 10px 6px;
          font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #6f6d88;
        }
        .bs-nav__group { display: grid; gap: 2px; }
        .bs-nav__item {
          display: flex; align-items: center; gap: 11px;
          height: 38px; padding: 0 12px; border-radius: 10px;
          font-size: 13.5px; font-weight: 500; color: #bdbbd1;
          transition: background .2s, color .2s;
        }
        .bs-nav__item:hover { background: rgba(255,255,255,.05); color: #fff; }
        .bs-nav__item.is-active {
          background: linear-gradient(90deg, rgba(109,74,255,.35), rgba(109,74,255,.12));
          color: #fff; font-weight: 600;
          box-shadow: inset 0 0 0 1px rgba(139,108,255,.35);
        }
        .bs-nav__item em {
          margin-left: auto; min-width: 20px; height: 18px; padding: 0 6px; border-radius: 999px;
          font-style: normal; font-size: 10.5px; font-weight: 700; color: #fff;
          display: grid; place-items: center; background: var(--br-primary);
        }
        .bs-nav__item em.is-red { background: var(--br-red); }
        .bs-nav__item em.is-orange { background: #e08a06; }

        .bs-side__bottom { margin-top: auto; padding-top: 18px; display: grid; gap: 6px; }
        .bs-ai {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 12px;
          background: linear-gradient(120deg, rgba(109,74,255,.28), rgba(232,51,109,.18));
          border: 1px solid rgba(139,108,255,.35);
        }
        .bs-ai:hover, .bs-ai.is-active { border-color: rgba(176,156,255,.7); }
        .bs-ai__icon {
          width: 30px; height: 30px; flex-shrink: 0; border-radius: 9px;
          background: linear-gradient(135deg, #7c5cff, #e8336d); color: #fff;
          display: grid; place-items: center;
        }
        .bs-ai__text strong { display: block; color: #fff; font-size: 13px; font-weight: 700; }
        .bs-ai__text small { display: block; color: #a9a7c4; font-size: 11px; }
        .bs-user { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 12px; background: var(--br-side-2); }
        .bs-avatar {
          width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%;
          color: #fff; display: grid; place-items: center; font-size: 11.5px; font-weight: 700;
        }
        .bs-user__name { flex: 1; min-width: 0; }
        .bs-user__name strong { display: block; color: #fff; font-size: 12.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bs-user__name small { display: block; color: #8d8ba6; font-size: 11px; }
        .bs-user__out { display: inline-flex; align-items: center; gap: 6px; color: #8d8ba6; padding: 4px; font-size: 12px; font-weight: 600; }
        .bs-user__out:hover { color: #fff; }

        /* ---------- Main + top bar ---------- */
        .bs-main { margin-left: 268px; min-width: 0; min-height: 100vh; display: flex; flex-direction: column; }
        .bs-topwrap { position: sticky; top: 0; z-index: 30; }
        .bs-top {
          display: flex; align-items: center; gap: 14px;
          height: 72px; padding: 0 32px;
          background: rgba(255,255,255,.94); backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--br-border);
        }
        .bs-mlogo { display: none; align-items: center; gap: 8px; font-size: 15px; font-weight: 800; }
        .bs-mlogo .bs-logo__mark { width: 30px; height: 30px; font-size: 16px; border-radius: 9px; }
        .bs-search {
          display: flex; align-items: center; gap: 9px;
          width: min(420px, 100%); height: 40px; padding: 0 10px 0 14px;
          border: 1px solid var(--br-border); border-radius: 11px; background: #fff; color: var(--br-faint);
        }
        .bs-search input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font-size: 13px; }
        .bs-search kbd { font-family: inherit; font-size: 10.5px; font-weight: 700; padding: 3px 6px; border-radius: 6px; background: #f1f2f7; color: var(--br-muted); }
        .bs-crumbs { display: flex; align-items: center; gap: 4px; min-width: 0; font-size: 13px; color: var(--br-muted); white-space: nowrap; overflow: hidden; }
        .bs-crumbs span { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
        .bs-crumbs a:hover { color: var(--br-primary); }
        .bs-crumbs strong { color: var(--br-ink); font-weight: 700; overflow: hidden; text-overflow: ellipsis; }
        .bs-top__right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
        .bs-live {
          display: inline-flex; align-items: center; gap: 7px;
          height: 32px; padding: 0 12px; border-radius: 999px;
          background: var(--br-green-bg); color: var(--br-green);
          font-size: 12px; font-weight: 700; white-space: nowrap;
        }
        .bs-live::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--br-wa); }
        .bs-icon-btn {
          position: relative; width: 38px; height: 38px;
          border-radius: 11px; border: 1px solid var(--br-border); background: #fff; color: var(--br-ink);
          display: grid; place-items: center;
        }
        .bs-icon-btn.is-on { border-color: var(--br-primary); color: var(--br-primary); }
        .bs-menu-btn { display: none; }
        .bs-dot { position: absolute; top: 8px; right: 9px; width: 7px; height: 7px; border-radius: 50%; background: var(--br-red); border: 1.5px solid #fff; }
        .bs-avatar--top { width: 38px; height: 38px; font-size: 12.5px; }

        .bs-notif { position: relative; }
        .bs-panel {
          position: absolute; right: 0; top: calc(100% + 10px);
          width: min(380px, calc(100vw - 32px));
          background: #fff; border: 1px solid var(--br-border); border-radius: 18px;
          box-shadow: 0 24px 60px -20px rgba(18,16,42,.35);
          padding: 16px; animation: bsIn .18s ease;
        }
        @keyframes bsIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .bs-panel__head { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
        .bs-panel__title { margin: 0; font-size: 15px; font-weight: 800; }
        .bs-panel__sub { margin: 3px 0 0; font-size: 11.5px; color: var(--br-muted); }
        .bs-panel__mark { border: 0; background: none; color: var(--br-primary); font-size: 12px; font-weight: 700; padding: 0; align-self: flex-start; }
        .bs-panel__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
        .bs-panel__list a { display: flex; align-items: center; gap: 12px; padding: 9px 10px; border-radius: 12px; }
        .bs-panel__list a:hover { background: #f7f7fb; }
        .bs-panel__list li.is-unread a { background: var(--br-lilac); }
        .bs-panel__body { flex: 1; min-width: 0; }
        .bs-panel__body strong { display: block; font-size: 13px; font-weight: 700; }
        .bs-panel__body small { display: block; font-size: 11.5px; color: var(--br-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bs-panel__time { font-size: 11px; color: var(--br-faint); white-space: nowrap; }
        .bs-panel__all {
          display: flex; align-items: center; justify-content: center; gap: 4px;
          margin-top: 10px; height: 38px; border-radius: 10px; background: #f4f5fa;
          font-size: 12.5px; font-weight: 700; color: var(--br-primary);
        }

        .bs-mnav, .bs-mpanel, .bs-overlay { display: none; }
        .bs-content { width: 100%; max-width: 1400px; padding: 28px 32px 56px; }

        /* ---------- Tablet: sirf icons ---------- */
        @media (max-width: 1180px) { .bs-live { display: none; } }
        @media (max-width: 1023px) {
          .bs-side { width: 78px; padding: 16px 11px 12px; align-items: center; }
          .bs-logo { padding: 0; }
          .bs-logo__text, .bs-logo__tag, .bs-ws__name, .bs-ws__btn > svg, .bs-request span,
          .bs-nav__label, .bs-nav__item span, .bs-ai__text, .bs-user__name, .bs-user__out { display: none; }
          .bs-ws { width: 100%; }
          .bs-ws__btn { justify-content: center; padding: 6px; }
          .bs-ws__menu { width: 200px; right: auto; }
          .bs-request { width: 44px; height: 40px; margin-left: auto; margin-right: auto; }
          .bs-nav { width: 100%; }
          .bs-nav__group { padding-top: 10px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,.06); }
          .bs-nav__item { position: relative; justify-content: center; padding: 0; height: 42px; }
          .bs-nav__item em { position: absolute; top: 4px; right: 6px; margin: 0; min-width: 16px; height: 16px; padding: 0 4px; font-size: 9.5px; }
          .bs-side__bottom { width: 100%; justify-items: center; }
          .bs-ai { padding: 6px; justify-content: center; }
          .bs-side__bottom .bs-nav__item { width: 100%; }
          .bs-user { padding: 6px; background: none; }
          .bs-main { margin-left: 78px; }
        }

        /* ---------- Mobile: menu upar ---------- */
        @media (max-width: 767px) {
          .bs-side { display: none; }
          .bs-main { margin-left: 0; }
          .bs-top { height: 60px; padding: 0 20px; gap: 10px; }
          .bs-mlogo { display: inline-flex; }
          .bs-search, .bs-crumbs, .bs-search-btn { display: none; }
          .bs-top__right { gap: 8px; }
          .bs-menu-btn { display: grid; }

          .bs-mnav {
            display: flex; gap: 6px; padding: 8px 20px;
            background: var(--br-side); overflow-x: auto; scrollbar-width: none;
          }
          .bs-mnav::-webkit-scrollbar { display: none; }
          .bs-mnav a {
            flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px;
            height: 32px; padding: 0 12px; border-radius: 999px;
            font-size: 12.5px; font-weight: 600; color: #c9c8db; white-space: nowrap;
          }
          .bs-mnav a.is-active { background: var(--br-primary); color: #fff; }
          .bs-mnav a em {
            font-style: normal; font-size: 10px; font-weight: 700;
            min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px;
            background: var(--br-red); color: #fff; display: grid; place-items: center;
          }

          .bs-mpanel {
            display: block; position: absolute; left: 0; right: 0; top: 100%; z-index: 2;
            max-height: calc(100vh - 110px); overflow-y: auto;
            padding: 16px 20px 18px; background: #fff;
            border-bottom: 1px solid var(--br-border);
            box-shadow: 0 24px 40px -24px rgba(18,16,42,.45);
            animation: bsDown .22s ease;
          }
          @keyframes bsDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
          .bs-mpanel__top { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
          .bs-mpanel__ws { flex: 1; min-width: 0; }
          .bs-mpanel__ws strong { display: block; font-size: 14px; font-weight: 800; }
          .bs-mpanel__ws small { display: block; font-size: 11.5px; color: var(--br-muted); }
          .bs-msearch {
            display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; margin-bottom: 4px;
            border: 1px solid var(--br-border); border-radius: 10px; color: var(--br-faint);
          }
          .bs-msearch input { flex: 1; min-width: 0; border: 0; outline: none; font-size: 13.5px; background: none; }
          .bs-mpanel__label { margin: 12px 0 6px; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--br-faint); }
          .bs-mpanel__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
          .bs-mpanel__grid a {
            display: flex; align-items: center; gap: 9px; height: 42px; padding: 0 12px;
            border-radius: 10px; background: #f4f5fa; font-size: 13px; font-weight: 600;
          }
          .bs-mpanel__grid a.is-active { background: var(--br-lilac); color: var(--br-primary); }
          .bs-mpanel__grid em {
            margin-left: auto; font-style: normal; font-size: 10px; font-weight: 700; color: #fff;
            min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: var(--br-red);
            display: grid; place-items: center;
          }
          .bs-mpanel__row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 12px 0; }
          .bs-mpanel__ai, .bs-mpanel__set {
            display: inline-flex; align-items: center; justify-content: center; gap: 8px;
            height: 40px; border-radius: 10px; font-size: 13px; font-weight: 700;
          }
          .bs-mpanel__ai { background: linear-gradient(135deg, #2a2160, #4a1d4f); color: #fff; }
          .bs-mpanel__set { background: #f4f5fa; }
          .bs-user--light { background: #f4f5fa; }
          .bs-user--light .bs-user__name strong { color: var(--br-ink); }
          .bs-user--light .bs-user__name small { color: var(--br-muted); }
          .bs-user--light .bs-user__out { color: var(--br-red); }

          .bs-overlay { display: block; position: fixed; inset: 0; z-index: 25; background: rgba(10,8,25,.35); }
          .bs-content { padding: 20px 20px 48px; }
        }
      `}</style>
    </div>
  );
}
