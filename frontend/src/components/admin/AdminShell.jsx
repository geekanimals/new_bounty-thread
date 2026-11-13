"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext } from "react";
import { adminCheck, adminSignOut } from "@/lib/adminAuth";
import { useRpc, storageKeyFor, useBeforePaint } from "@/lib/supabase";
import { matchQ } from "@/components/admin/creator/live";
import OwnerAgent from "@/components/admin/OwnerAgent";

/* Login kiye admin ki info — kisi bhi page mein: const me = useAdmin(); me.name */
/* is browser tab mein admin ka login (naam/email) — page badalne / reload par turant dikhe */
let ME = null;
const ME_KEY = "geek_admin_me";
function meSave(m) {
  ME = m;
  try {
    if (m) localStorage.setItem(ME_KEY, JSON.stringify(m));
    else localStorage.removeItem(ME_KEY);
  } catch {
    /* ignore */
  }
}
/* reload par: Supabase ka admin session browser mein hai + pichla naam yaad hai → shell turant (check peeche chalta hai) */
function meRead() {
  try {
    if (!localStorage.getItem(storageKeyFor("admin"))) return null;
    return JSON.parse(localStorage.getItem(ME_KEY) || "null");
  } catch {
    return null;
  }
}
const AdminCtx = createContext({ name: "", email: "" });
export const useAdmin = () => useContext(AdminCtx);

/* Figma sidebar — wahi glyph icons */
export const NAV = [
  {
    group: "Operate",
    items: [
      { label: "Overview", href: "/vault/overview", icon: "▦" },
      { label: "Action queue", href: "/vault/action-queue", icon: "⚡", count: "approvals" },
      { label: "Campaigns", href: "/vault/campaigns", icon: "◈", count: "process" },
      { label: "Applications", href: "/vault/applications", icon: "✓", count: "applicants" },
      { label: "Logistics", href: "/vault/logistics", icon: "▣", count: "logistics" },
    ],
  },
  {
    group: "Network",
    items: [
      { label: "Creators", href: "/vault/creators", icon: "♙" },
      { label: "Discovery", href: "/vault/discovery", icon: "◎" },
      { label: "Brands & agencies", href: "/vault/brands", icon: "▤" },
      { label: "Creator upload", href: "/vault/creator-upload", icon: "⇧" },
    ],
  },
  {
    group: "Communicate",
    items: [
      { label: "Unified inbox", href: "/vault/inbox", icon: "☏" },
      { label: "Messaging & bot", href: "/vault/messaging", icon: "✉" },
    ],
  },
  {
    group: "Insights & platform",
    items: [
      { label: "Reports", href: "/vault/reports", icon: "▥" },
      { label: "Activity & audit", href: "/vault/activity", icon: "◷" },
      { label: "All users", href: "/vault/users", icon: "♧" },
      { label: "Settings", href: "/vault/settings", icon: "⚙" },
    ],
  },
];
const ALL = NAV.flatMap((g) => g.items);

/**
 * Super Admin ka frame — sidebar + top bar + popups (⌘K search, Owner Agent, profile menu).
 *  - Desktop (1024px+): Figma jaisa poora sidebar (246px)
 *  - Tablet (768–1023px): chhota sidebar, sirf icons
 *  - Mobile (<768px): top bar fixed + ☰ se menu (poora nav)
 */
export default function AdminShell({ children, wide = false }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [panel, setPanel] = useState(null); // search | agent | profile | menu
  const [q, setQ] = useState("");
  const [qi, setQi] = useState(0);
  const [emailOn, setEmailOn] = useState(true);
  const profRef = useRef(null);
  const qRef = useRef(null);

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  // Login check — bina login ke koi admin page nahi khulega, seedha /vault (login) par
  // (Supabase session + is_platform_admin — purane app jaisa)
  // ME: pichle page ka login check yaad — har page badalne par khali screen flash nahi (check peeche chalta rehta hai)
  const [me, setMe] = useState(() => ME);
  useBeforePaint(() => {
    if (!ME) {
      const m = meRead();
      if (m) setMe((ME = m));
    }
  }, []);
  useEffect(() => {
    let alive = true;
    adminCheck()
      .then((r) => {
        if (!alive) return;
        if (r.ok) {
          const m = { name: r.name, email: r.email };
          meSave(m);
          setMe(m);
        }
        else {
          meSave(null);
          router.replace("/vault");
        }
      })
      .catch(() => {
        meSave(null);
        if (alive) router.replace("/vault");
      });
    const expired = (e) => {
      if (e.detail?.door !== "admin") return;
      meSave(null);
      router.replace("/vault");
    };
    window.addEventListener("geek-session-expired", expired);
    return () => {
      alive = false;
      window.removeEventListener("geek-session-expired", expired);
    };
  }, [router]);
  const authed = !!me;
  // Sidebar ke number (purane app ka nav_counts, har 30 sec)
  const { data: counts } = useRpc("admin", "api.nav_counts", {}, { skip: !authed, refreshMs: 30000 });
  const badge = (it) => {
    const n = Number(counts?.[it.count]) || 0;
    return it.count && n ? (n > 99 ? "99+" : n) : null;
  };
  const first = (me?.name || "").split(" ")[0] || "there";

  useEffect(() => setPanel(null), [pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPanel("search");
      }
      if (e.key === "Escape") setPanel(null);
    };
    const onDown = (e) => {
      if (panel === "profile" && profRef.current && !profRef.current.contains(e.target)) setPanel(null);
    };
    const onAgent = () => setPanel("agent");
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("geek-agent", onAgent);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("geek-agent", onAgent);
    };
  }, [panel]);

  useEffect(() => {
    if (panel === "search") {
      setQ("");
      setQi(0);
      setTimeout(() => qRef.current?.focus(), 20);
    }
    document.body.style.overflow = panel === "search" || panel === "agent" || panel === "menu" ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [panel]);

  // ⌘K: pages + creators (naam / @handle / phone / email / city / category…) + campaigns + brands — sab Supabase se
  const searchOn = panel === "search" && authed;
  const sCr = useRpc("admin", "admin_creators", {}, { skip: !searchOn });
  const sCp = useRpc("admin", "admin_campaigns", { p_status: null }, { skip: !searchOn });
  const sBr = useRpc("admin", "api.brand_list", { p_q: null }, { skip: !searchOn });
  const results = useMemo(() => {
    const t = q.trim();
    const lc = t.toLowerCase();
    const pages = ALL.filter((i) => i.label.toLowerCase().includes(lc));
    if (t.length < 2) return pages;
    const has = (arr) => arr.filter(Boolean).join(" ").toLowerCase().includes(lc);
    const cr = (Array.isArray(sCr.data) ? sCr.data : [])
      .filter((c) => matchQ(c, t))
      .slice(0, 8)
      .map((c) => ({ href: `/vault/creators/${c.member_id}/profile`, icon: "👤", label: c.name || (c.ig_username ? "@" + c.ig_username : "Creator"), sub: [c.ig_username && "@" + c.ig_username, c.city, (c.categories || [])[0]].filter(Boolean).join(" · "), kind: "Creator" }));
    const cp = (Array.isArray(sCp.data) ? sCp.data : [])
      .filter((c) => has([c.name, c.brand, c.org_name]))
      .slice(0, 6)
      .map((c) => ({ href: `/vault/campaigns/${c.id}/overview`, icon: "📣", label: c.name || "Campaign", sub: [c.brand || c.org_name, c.status].filter(Boolean).join(" · "), kind: "Campaign" }));
    const br = (Array.isArray(sBr.data) ? sBr.data : [])
      .filter((b) => has([b.name, b.category, b.website, b.instagram]))
      .slice(0, 5)
      .map((b) => ({ href: `/vault/brands/${b.brand_id || b.id}/overview`, icon: "🏢", label: b.name || "Brand", sub: b.category || "", kind: "Brand" }));
    return [...pages, ...cr, ...cp, ...br];
  }, [q, sCr.data, sCp.data, sBr.data]);
  const searching = searchOn && q.trim().length >= 2 && (sCr.loading || sCp.loading || sBr.loading);


  const signOut = async () => {
    meSave(null);
    await adminSignOut();
    router.replace("/vault");
  };

  if (!authed) return <div className="as-wait" aria-busy="true" />;

  return (
    <AdminCtx.Provider value={me}>
    <div className="as">
      {/* ---------- Sidebar ---------- */}
      <aside className="as-side" aria-label="Super Admin menu">
        <Link href="/vault/overview" className="as-logo">
          <span className="as-logo__mark">geek</span>
          <span className="as-logo__txt">
            <strong>Geek OS</strong>
            <small>Operations cloud</small>
          </span>
        </Link>
        <nav className="as-nav">
          {NAV.map((g) => (
            <div key={g.group} className="as-nav__group">
              <p className="as-nav__label">{g.group}</p>
              {g.items.map((it) => (
                <Link key={it.href} href={it.href} title={it.label} className={`as-nav__item ${isActive(it.href) ? "is-active" : ""}`}>
                  <span className="as-nav__ic">{it.icon}</span>
                  <span className="as-nav__txt">{it.label}</span>
                  {badge(it) && <em>{badge(it)}</em>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="as-side__foot">
          <Link href="/vault/settings/super-admins" className="as-me" title="Super Admin">
            <span className="as-me__av">{(me.name || "A")[0].toUpperCase()}</span>
            <span className="as-me__txt">
              <strong>Super Admin</strong>
              <small>Geek Creative Agency</small>
            </span>
          </Link>
          <p className="as-proto">
            <i /> <b>Live</b>· Connected to Supabase
          </p>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="as-main">
        <header className="as-top">
          <button type="button" className="as-burger" onClick={() => setPanel(panel === "menu" ? null : "menu")} aria-label="Open menu" aria-expanded={panel === "menu"}>
            {panel === "menu" ? "✕" : "☰"}
          </button>
          <Link href="/vault/overview" className="as-mlogo" aria-label="Geek OS">
            <span className="as-logo__mark">geek</span>
            <strong>Geek OS</strong>
          </Link>
          <button type="button" className="as-search" onClick={() => setPanel("search")}>
            <span>⌕ Search creators, campaigns, brands or commands…</span>
            <kbd>⌘K</kbd>
          </button>
          <div className="as-top__right">
            <span className="as-status">● All systems live</span>
            <button type="button" className="as-icon as-icon--search" onClick={() => setPanel("search")} aria-label="Search">
              ⌕
            </button>
            <button type="button" className="as-icon" onClick={() => setPanel("agent")} aria-label="AI Assistant" title="AI Assistant">
              ♧
            </button>
            <Link href="/vault/settings" className="as-icon" aria-label="Settings" title="Settings">
              ⚙
            </Link>
            <div className="as-prof" ref={profRef}>
              <button type="button" className="as-avatar" onClick={() => setPanel(panel === "profile" ? null : "profile")} aria-label="Profile menu" aria-expanded={panel === "profile"}>
                {(me.name || "A")[0].toUpperCase()}
              </button>
              {panel === "profile" && (
                <div className="as-pmenu" role="menu">
                  <div className="as-pmenu__me">
                    <span className="as-me__av">{(me.name || "A")[0].toUpperCase()}</span>
                    <span>
                      <strong>{me.name}</strong>
                      <small>Super Admin · Geek Creative Agency</small>
                    </span>
                  </div>
                  <Link href="/vault/overview" className="as-pmenu__link" role="menuitem">
                    🏠 Dashboard
                  </Link>
                  <Link href="/vault/settings/super-admins" className="as-pmenu__link" role="menuitem">
                    🛡️ Super Admin
                  </Link>
                  <p className="as-pmenu__label">🔔 Campaign updates</p>
                  <div className="as-pmenu__row">
                    <span>WhatsApp</span>
                    <Link href="/vault/inbox/new">Link WhatsApp</Link>
                  </div>
                  <div className="as-pmenu__row">
                    <span>Email</span>
                    <button type="button" className={`as-on ${emailOn ? "is-on" : ""}`} onClick={() => setEmailOn(!emailOn)}>
                      {emailOn ? "On" : "Off"}
                    </button>
                  </div>
                  <Link href="/vault/settings/data-browser" className="as-pmenu__link" role="menuitem">
                    🍪 Cookie settings
                  </Link>
                  <button type="button" className="as-pmenu__link" role="menuitem" onClick={signOut}>
                    ↪️ Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`as-content ${wide ? "as-content--wide" : ""}`}>{children}</main>
      </div>

      {panel === "profile" && <div className="as-pdim" aria-hidden="true" onMouseDown={() => setPanel(null)} />}

      {/* ---------- Mobile menu (☰) ---------- */}
      {panel === "menu" && (
        <div className="as-drawer" role="dialog" aria-label="Menu">
          <button type="button" className="as-drawer__search" onClick={() => setPanel("search")}>
            ⌕ Search creators, campaigns, brands…
          </button>
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="as-nav__label">{g.group}</p>
              <div className="as-drawer__grid">
                {g.items.map((it) => (
                  <Link key={it.href} href={it.href} className={isActive(it.href) ? "is-active" : ""}>
                    <span>{it.icon}</span>
                    {it.label}
                    {badge(it) && <em>{badge(it)}</em>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="as-drawer__foot">
            <button type="button" className="ga-btn ga-btn--soft" onClick={() => setPanel("agent")}>
              ✨ Owner Agent
            </button>
            <button type="button" className="ga-btn ga-btn--ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* ---------- ⌘K search ---------- */}
      {panel === "search" && (
        <div className="ga-overlay as-searchwrap" onClick={() => setPanel(null)}>
          <div className="as-cmd" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search">
            <input
              ref={qRef}
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setQi(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setQi((i) => Math.min(i + 1, results.length - 1));
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setQi((i) => Math.max(i - 1, 0));
                }
                if (e.key === "Enter" && results[qi]) (router.push(results[qi].href), setPanel(null));
              }}
              placeholder="Search creators (name, @handle, phone…), campaigns, brands or pages"
              aria-label="Search"
            />
            <ul>
              {results.map((r, i) => (
                <li key={r.href}>
                  <Link href={r.href} className={i === qi ? "is-on" : ""} onMouseEnter={() => setQi(i)} onClick={() => setPanel(null)}>
                    <span>{r.icon}</span> <b className="as-cmd__lbl">{r.label}</b>
                    {r.sub && <small className="as-cmd__sub">{r.sub}</small>}
                    {r.kind && <em className="as-cmd__kind">{r.kind}</em>}
                  </Link>
                </li>
              ))}
              {searching && <li className="as-cmd__none">Searching creators, campaigns and brands…</li>}
              {!results.length && !searching && <li className="as-cmd__none">Nothing matches “{q}”</li>}
            </ul>
          </div>
        </div>
      )}

      {/* ---------- Owner Agent ---------- */}
      {panel === "agent" && (
        <div className="as-agentwrap" onClick={() => setPanel(null)}>
          <aside className="as-agent" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Owner Agent">
            <button type="button" className="as-agent__x" onClick={() => setPanel(null)} aria-label="Close">
              ✕
            </button>
            <p className="as-agent__eye">✨ AI assistant</p>
            <h2>Owner Agent</h2>
            <p className="as-agent__sub">Growth &amp; revenue copilot</p>
            <OwnerAgent name={first} />
          </aside>
        </div>
      )}

      <style>{`
        .as { min-height: 100vh; }

        /* ---------- Sidebar (Figma 246px) ---------- */
        .as-side {
          position: fixed; left: 0; top: 0; bottom: 0; z-index: 40; width: 246px;
          display: flex; flex-direction: column; padding: 24px 14px 20px 14px;
          background: #fff; border-right: 1px solid var(--ad-line); overflow-y: auto; scrollbar-width: thin;
        }
        .as-logo { display: flex; align-items: center; gap: 12px; padding-left: 12px; }
        .as-logo__mark {
          width: 40px; height: 40px; flex-shrink: 0; border-radius: 11px; border: 1.5px solid var(--ad-cyan);
          display: grid; place-items: center; font-size: 13px; font-weight: 800; letter-spacing: -1px; color: var(--ad-cyan);
        }
        .as-logo__txt strong { display: block; font-size: 21px; font-weight: 800; letter-spacing: -0.7px; line-height: 1.1; color: var(--ad-ink); }
        .as-logo__txt small { display: block; margin-top: 3px; font-size: 9px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8a94ab; }
        .as-nav { margin-top: 36px; }
        .as-nav__label { margin: 22px 0 8px 13px; font-size: 10px; font-weight: 800; letter-spacing: 1.8px; text-transform: uppercase; color: var(--ad-label); }
        .as-nav__group:first-child .as-nav__label { margin-top: 10px; }
        .as-nav__item {
          display: flex; align-items: center; gap: 12px; height: 44px; margin-bottom: 1.5px; padding: 0 14px 0 16px; border-radius: 11px;
          font-size: 14px; font-weight: 700; color: var(--ad-muted-2); transition: background .15s, color .15s;
        }
        .as-nav__item:hover { background: var(--ad-soft-2); color: var(--ad-ink); }
        .as-nav__item.is-active { background: var(--ad-lilac); color: var(--ad-primary-2); }
        .as-nav__ic { width: 18px; text-align: center; font-size: 17px; line-height: 1; }
        .as-nav__txt { flex: 1; min-width: 0; }
        .as-nav__item em {
          display: grid; place-items: center; min-width: 28px; height: 20px; padding: 0 6px; border-radius: 8px;
          background: #f0efff; color: #6859e9; font-style: normal; font-size: 11px; font-weight: 700;
        }
        .as-nav__item.is-active em { background: var(--ad-primary); color: #fff; }
        .as-side__foot { margin-top: auto; padding-top: 24px; }
        .as-me { display: flex; align-items: center; gap: 10px; padding: 11px 12px; border-radius: 13px; border: 1px solid var(--ad-line); background: var(--ad-soft-2); }
        .as-me__av { width: 34px; height: 34px; flex-shrink: 0; border-radius: 10px; display: grid; place-items: center; background: var(--ad-lilac); color: var(--ad-primary); font-size: 14px; font-weight: 800; }
        .as-me__txt strong { display: block; font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        .as-me__txt small { display: block; font-size: 12px; color: var(--ad-muted); }
        .as-proto { margin-top: 12px; padding: 0 4px; font-size: 12px; line-height: 1.35; color: var(--ad-muted); }
        .as-proto i { display: inline-block; width: 8px; height: 8px; margin-right: 2px; border-radius: 50%; background: #6b7280; }
        .as-proto b { font-weight: 400; color: #0aa873; }

        /* ---------- Top bar (Figma 76px) ---------- */
        .as-main { margin-left: 246px; min-height: 100vh; display: flex; flex-direction: column; }
        .as-top {
          position: sticky; top: 0; z-index: 42; display: flex; align-items: center; gap: 14px;
          height: 76px; padding: 0 36px; background: #fff; border-bottom: 1px solid var(--ad-line);
        }
                .as-search {
          display: flex; align-items: center; gap: 10px; width: min(420px, 100%); height: 44px; padding: 0 16px;
          border-radius: 13px; border: 1px solid var(--ad-line); background: var(--ad-soft-2); color: var(--ad-muted); font-size: 14px; text-align: left;
        }
        .as-search span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .as-search kbd { font-family: inherit; font-size: 11px; color: var(--ad-muted); }
        .as-top__right { margin-left: auto; display: flex; align-items: center; gap: 16px; }
        .as-status { display: inline-flex; align-items: center; height: 26px; padding: 0 10px; border-radius: 13.3px; background: var(--ad-green-bg); color: var(--ad-green); font-size: 11px; font-weight: 700; white-space: nowrap; }
        .as-icon { width: 36px; height: 36px; border-radius: 10px; border: 0; background: var(--ad-soft); color: #65718c; display: grid; place-items: center; font-size: 14px; }
        .as-burger, .as-mlogo, .as-icon--search { display: none; }
        .as-icon:hover { background: var(--ad-lilac); color: var(--ad-primary); }
        .as-prof { position: relative; }
        .as-avatar { width: 34px; height: 34px; border-radius: 10px; border: 0; background: var(--ad-lilac); color: var(--ad-primary); font-size: 14px; font-weight: 800; }
        .as-pmenu {
          position: absolute; right: -12px; top: calc(100% + 14px); z-index: 50; width: 260px; padding: 14px 16px;
          border-radius: 18px; background: #fff; border: 1px solid var(--ad-line); box-shadow: 0 24px 60px -24px rgba(20,33,59,.45); animation: adPop .15s ease;
        }
        .as-pdim { position: fixed; inset: 0; z-index: 41; background: rgba(20,33,59,.28); animation: adFade .15s ease; }
        .as-pmenu__me { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .as-pmenu__me strong { display: block; font-size: 14px; font-weight: 700; }
        .as-pmenu__me small { display: block; font-size: 11px; color: var(--ad-muted); white-space: nowrap; }
        .as-pmenu__link { display: flex; align-items: center; gap: 4px; width: 100%; padding: 11px 6px; border: 0; border-radius: 10px; background: none; text-align: left; font-size: 14px; font-weight: 800; color: var(--ad-primary); }
        .as-pmenu__link:hover { background: var(--ad-soft-2); }
        .as-pmenu__label { margin: 6px 0 6px; font-size: 10px; font-weight: 500; letter-spacing: .6px; text-transform: uppercase; color: var(--ad-muted); }
        .as-pmenu__row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; font-size: 12.5px; color: var(--ad-ink); }
        .as-pmenu__row a { font-weight: 700; color: var(--ad-primary); }
        .as-on { height: 24px; padding: 0 10px; border: 0; border-radius: 12px; background: var(--ad-soft); color: var(--ad-muted); font-size: 11px; font-weight: 700; }
        .as-on.is-on { background: var(--ad-green-bg); color: var(--ad-green); }

        .as-content { width: 100%; max-width: 1400px; padding: 32px 36px 56px; flex: 1; }
        .as-content--wide { max-width: none; }

        /* ⌘K */
        .ga-overlay.as-searchwrap { place-items: start center; padding: 117px 20px 20px; background: rgba(20,33,59,.28); }
        .as-cmd { width: min(600px, 100%); padding: 18px; border-radius: 22px; background: #fff; box-shadow: 0 30px 80px -30px rgba(20,33,59,.5); animation: adPop .15s ease; }
        .as-cmd input { width: 100%; height: 50px; padding: 0 14px; border: 0; border-bottom: 1px solid var(--ad-line); outline: none; font-size: 17px; color: var(--ad-ink); }
        .as-cmd input::placeholder { color: #8b92aa; }
        .as-cmd ul { list-style: none; margin: 8px 0 0; padding: 0; max-height: min(672px, calc(100vh - 240px)); overflow-y: auto; }
        .as-cmd li a { display: flex; align-items: center; gap: 4px; height: 44.6px; padding: 0 14px; border-radius: 10px; font-size: 14px; color: var(--ad-ink); }
        .as-cmd li a span { width: 18px; text-align: center; }
        .as-cmd li a.is-on { background: var(--ad-soft-2); }
        .as-cmd__lbl { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .as-cmd__sub { flex: 1; min-width: 0; margin-left: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--ad-muted); }
        .as-cmd__kind { margin-left: auto; flex-shrink: 0; padding: 2px 8px; border-radius: 20px; background: var(--ad-soft); font-style: normal; font-size: 11px; font-weight: 700; color: var(--ad-muted-2); }
        .as-cmd__none { padding: 16px 14px; font-size: 13px; color: var(--ad-muted); }

        /* Owner Agent (right panel) */
        .as-agentwrap { position: fixed; inset: 0; z-index: 90; background: rgba(20,33,59,.28); animation: adFade .15s ease; }
        .as-agent {
          position: absolute; right: 0; top: 0; bottom: 0; width: min(620px, 100%); padding: 30px 30px 24px; overflow-y: auto;
          background: #fff; box-shadow: -20px 0 60px -30px rgba(20,33,59,.5); animation: asIn .2s ease; display: flex; flex-direction: column;
        }
        @keyframes asIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
        .as-agent__x { position: absolute; right: 30px; top: 30px; width: 36px; height: 36px; border: 0; border-radius: 10px; background: var(--ad-soft); color: var(--ad-muted-2); font-size: 14px; }
        .as-agent__eye { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8b92aa; }
        .as-agent h2 { margin-top: 18px; font-family: var(--ad-head); font-size: 26px; font-weight: 800; letter-spacing: -0.9px; }
        .as-agent__sub { margin-top: 18px; font-size: 12.5px; color: var(--ad-muted); }
        .as-agent__msgs { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
        .as-agent__bot { align-self: flex-start; max-width: 476px; padding: 12px 12px; border-radius: 13px; background: var(--ad-lilac); font-size: 13px; line-height: 1.32; color: var(--ad-ink); }
        .as-agent__bot a { font-weight: 800; color: var(--ad-primary); }
        .as-agent__me { align-self: flex-end; max-width: 420px; padding: 10px 12px; border-radius: 13px; background: var(--ad-primary); color: #fff; font-size: 13px; }
        .as-agent__chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .as-agent__chips button { height: 26px; padding: 0 10px; border: 0; border-radius: 13px; background: var(--ad-soft); color: var(--ad-muted-2); font-size: 11px; font-weight: 700; }
        .as-agent__ask { display: flex; gap: 8px; margin-top: 156px; padding-bottom: 18px; border-bottom: 1px solid var(--ad-line); }
        .as-agent__ask .ga-input { max-width: 173px; height: 42px; }

        /* Drawer (mobile) */
        .as-drawer {
          position: fixed; left: 0; right: 0; top: 60px; bottom: 0; z-index: 35; overflow-y: auto; padding: 14px 16px 24px;
          background: #fff; border-top: 1px solid var(--ad-line); animation: asDown .18s ease;
        }
        @keyframes asDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        .as-drawer__search { width: 100%; height: 44px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--ad-line); background: var(--ad-soft-2); color: var(--ad-muted); text-align: left; font-size: 14px; }
        .as-drawer .as-nav__label { margin: 18px 0 8px 2px; }
        .as-drawer__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .as-drawer__grid a { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 12px; border-radius: 11px; background: var(--ad-soft-2); font-size: 13.5px; font-weight: 700; color: var(--ad-muted-2); }
        .as-drawer__grid a span { width: 18px; text-align: center; font-size: 15px; }
        .as-drawer__grid a em { margin-left: auto; font-style: normal; font-size: 10.5px; font-weight: 700; padding: 1px 6px; border-radius: 7px; background: #f0efff; color: #6859e9; }
        .as-drawer__grid a.is-active { background: var(--ad-lilac); color: var(--ad-primary-2); }
        .as-drawer__foot { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 18px; }

        /* ---------- Tablet: sirf icons ---------- */
        @media (max-width: 1180px) { .as-status { display: none; } }
        @media (max-width: 1023px) {
          .as-side { width: 76px; padding: 18px 10px; align-items: center; }
          .as-logo { padding: 0; }
          .as-logo__txt, .as-nav__label, .as-nav__txt, .as-me__txt, .as-proto { display: none; }
          .as-nav { width: 100%; }
          .as-nav__group { padding-top: 8px; margin-top: 8px; border-top: 1px solid var(--ad-line); }
          .as-nav__item { position: relative; justify-content: center; padding: 0; }
          .as-nav__item em { position: absolute; top: 2px; right: 2px; min-width: 18px; height: 16px; font-size: 9.5px; padding: 0 4px; }
          .as-me { justify-content: center; padding: 8px; }
          .as-main { margin-left: 76px; }
          .as-top { padding: 0 24px; }
          .as-content { padding: 26px 24px 48px; }
        }

        /* ---------- Mobile: top bar fixed + ☰ menu ---------- */
        @media (max-width: 767px) {
          .as-side { display: none; }
          .as-main { margin-left: 0; }
          .as-top { position: fixed; left: 0; right: 0; height: 60px; padding: 0 12px; gap: 8px; }
          .as-burger { display: grid; place-items: center; width: 38px; height: 38px; border: 0; border-radius: 10px; background: var(--ad-soft); font-size: 17px; color: var(--ad-ink); }
          .as-mlogo { display: inline-flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 800; letter-spacing: -0.5px; }
          .as-mlogo .as-logo__mark { width: 32px; height: 32px; font-size: 11px; border-radius: 9px; }
          .as-search { display: none; }
          .as-icon--search { display: grid; }
          .as-top__right { gap: 6px; }
          .as-icon { width: 34px; height: 34px; }
          .as-pmenu { position: fixed; left: 12px; right: 12px; top: 66px; width: auto; }
          .as-content { padding: 80px 16px 40px; }
          .ga-overlay.as-searchwrap { padding: 70px 12px 0; place-items: start stretch; }
          .as-agent { padding: 22px 18px 20px; }
          .as-agent__x { right: 18px; top: 18px; }
          .as-agent__ask { margin-top: 24px; }
          .as-agent__ask .ga-input { max-width: none; flex: 1; }
        }
      `}</style>
    </div>
    </AdminCtx.Provider>
  );
}
