"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/creater/Logo";
import { useSession, signOut as creatorSignOut, useCreatorGate, gateRoute, fmtFollowers, needsMe, profileProgress, STAGE_SHORT, hrefOf, iconOf, when, useMyCampaigns, useOpenCampaigns, groupOf, noteOf, engagement, useMyCampaignRows, useNotifications, markAllRead, setAvailability, getConsent, saveConsent } from "@/services/creator";
import { useRumiTip } from "@/components/creater/rumiBus";
import { getSidekick } from "@/components/creater/data";
import BootLoader from "@/components/creater/BootLoader";
import {
  Home, Megaphone, BarChart, User, Bell, Close, ArrowRight, Settings, LogOut,
  Compass, Layers, Chat, Instagram, ChevronRight, Send, FileText, Wallet, Heart,
} from "@/components/ui/Icons";

const NAV = [
  { group: "Today", items: [{ label: "Home", href: "/creater/home", icon: "🏠" }] },
  {
    group: "Campaigns",
    items: [
      { label: "Discover", href: "/creater/discover", icon: "🧭" },
      { label: "My campaigns", href: "/creater/my-campaigns", icon: "◈" },
      { label: "Payments", href: "/creater/payments", icon: "🪙" },
    ],
  },
  {
    group: "Create & grow",
    items: [
      { label: "Media kit", href: "/creater/media-kit", icon: "🗂" },
      { label: "Analytics", href: "/creater/analytics", icon: "📊" },
    ],
  },
  {
    group: "My account",
    items: [
      { label: "Profile", href: "/creater/profile", icon: "👤" },
      { label: "Messages", href: "/creater/messages", icon: "✉️", dot: true },
      { label: "Settings", href: "/creater/settings", icon: "⚙︎" },
    ],
  },
];

/* Figma jaisa "layers" icon (stack) */
const LayersIc = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4l9 4.5-9 4.5-9-4.5z" />
    <path d="M3 13l9 4.5 9-4.5" />
  </svg>
);
/* ⌘K command bar — Figma ka order */
const COMMANDS = [
  { label: "Home", href: "/creater/home", icon: Home },
  { label: "Media kit", href: "/creater/media-kit", icon: LayersIc },
  { label: "Profile", href: "/creater/profile", icon: User },
  { label: "Instagram", href: "/creater/messages/instagram", icon: Instagram },
  { label: "Inbox", href: "/creater/messages", icon: Chat },
  { label: "Discover", href: "/creater/discover", icon: Compass },
  { label: "My campaigns", href: "/creater/my-campaigns", icon: FileText },
  { label: "Payments", href: "/creater/payments", icon: Wallet },
  { label: "Analytics", href: "/creater/analytics", icon: BarChart },
  { label: "Dream brands", href: "/creater/profile/dream-brands", icon: Heart },
  { label: "Settings", href: "/creater/settings", icon: Settings },
];

/* Mobile menu (☰) — Figma jaisa */
const DRAWER = [
  { group: "Today", items: [{ label: "Home", href: "/creater/home", icon: "🏠" }, { label: "Inbox", href: "/creater/messages", icon: "✉️" }] },
  NAV[1],
  { group: "Create & grow", items: [...NAV[2].items, { label: "Dream brand board", href: "/creater/profile/dream-brands", icon: "💙" }] },
];

/* Ask Rumi ke jawab — sirf rasta batate hain (koi nakli campaign / amount nahi); asli data us page par */
const RUMI_ANSWERS = [
  { k: ["attention", "need", "pending", "todo"], a: "Anything waiting on you shows up under “Action needed” in My campaigns — sign, confirm your address, send your draft or post.", href: "/creater/my-campaigns" },
  { k: ["brief", "help"], a: "Open any campaign → “Read full creative brief”. Tip: the deadline starts after delivery, not after selection.", href: "/creater/discover" },
  { k: ["campaign", "find", "match"], a: "Discover shows every open campaign — the ones you're eligible for are marked, and paid ones fill fast!", href: "/creater/discover" },
  { k: ["media", "kit", "improve"], a: "Add 1–2 showcase posts and your city — brands open kits with a clear bio far more often.", href: "/creater/media-kit" },
  { k: ["pay", "money", "upi"], a: "Payments shows every fee, what's paid and what's pending — add your UPI or bank once your agreement is signed.", href: "/creater/payments" },
];
const answerFor = (q) => {
  const t = q.toLowerCase();
  return RUMI_ANSWERS.find((r) => r.k.some((k) => t.includes(k))) || { a: "I can help with campaigns, briefs, your media kit and payments — try one of the quick buttons above 🌿" };
};

/* ---------- Connect Instagram sheet (Apply se, locked mode) ---------- */
export function ConnectInstagramSheet({ open, onClose }) {
  const router = useRouter();
  const [ss] = useSession();
  const sk = getSidekick(ss.sidekick);
  if (!open) return null;
  return (
    <div className="bx-overlay" onClick={onClose}>
      <div className="bx-modal cis" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Connect Instagram to apply">
        <div className="bx-modal__head">
          <h2>Connect Instagram to apply</h2>
          <button type="button" className="bx-modal__x" onClick={onClose} aria-label="Close">
            <Close size={14} />
          </button>
        </div>
        <div className="bx-modal__body">
          <img src={sk.img} alt="" className="cis-img" />
          <p className="cis-txt">Brands check your real reach before selecting. Connect once — we build your media kit while you wait.</p>
          <ul className="cis-list">
            <li>✓ Official Meta connection — no password shared</li>
            <li>✓ Only your public numbers are shown to brands</li>
            <li>✓ Disconnect anytime from Settings</li>
          </ul>
          <button type="button" className="bx-btn bx-btn--dark bx-btn--lg bx-btn--block" onClick={() => router.push("/creater/onboarding/meta?next=apply")}>
            <Instagram size={16} /> Connect with Instagram
          </button>
          <button type="button" className="cis-later" onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
      <style>{`
        .cis-img { width: 96px; margin: 0 auto 8px; }
        .cis-txt { margin: 0 0 12px; text-align: center; font-size: 14px; color: var(--bx-text); line-height: 1.5; }
        .cis-list { list-style: none; margin: 0 0 16px; padding: 12px 14px; border-radius: 12px; background: #fffaf0; display: grid; gap: 6px; font-size: 13px; }
        .cis-later { display: block; margin: 12px auto 0; border: 0; background: none; font-size: 13px; font-weight: 700; text-decoration: underline; }
      `}</style>
    </div>
  );
}

const Mic = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0014 0M12 18v3" />
  </svg>
);
const Sun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

/**
 * Bounty creator app ka frame — login ke baad ke saare pages isme (Figma "④ Creator app").
 *  - Desktop (1024px+): left sidebar 260px (poori height) + upar search bar + avatar
 *  - Tablet (768–1023px): chhota sidebar, sirf icons
 *  - Mobile (<768px): header upar fixed + bottom nav neeche fixed, beech ka page scroll
 * tone="forest" → mobile par dark jungle background (Home, Discover jaisa Figma)
 */
export default function BountyShell({ children, tone = "paper" }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [session, update] = useSession();
  // Guard: login + Instagram step + ek baar profile setup (purana bootOS) — warna sahi step par
  const gateC = useCreatorGate("app", router, pathname);
  const [panel, setPanel] = useState(null); // notif | avatar | cmd | rumi | menu
  const [cmdQ, setCmdQ] = useState("");
  const [cmdI, setCmdI] = useState(0);
  const [read, setRead] = useState(false);
  const [tip, setTip] = useState(false); // generic tip (pehli baar)
  const [tipHidden, setTipHidden] = useState(false); // is page par × dabaya
  const pageTip = useRumiTip(); // page ki baat — yahi sidekick (footer / sidebar) bolega
  const [chat, setChat] = useState([]);
  const [ask, setAsk] = useState("");
  const [cookieOpen, setCookieOpen] = useState(false);
  const notifRef = useRef(null);
  const cmdInput = useRef(null);

  const sk = getSidekick(session.sidekick);
  // Locked mode = Instagram / WhatsApp connect baaki (purana __profileGate)
  const locked = session.locked || !session.ig;
  // "Your next move" — purane app jaisa: lock → Instagram; creator ki baari wala campaign → wahi; warna profile %
  const mine = useMyCampaignRows({ skip: !gateC.loggedIn || locked });
  const turn = locked ? null : needsMe(Array.isArray(mine.data) ? mine.data : [])[0];
  const prog = profileProgress(gateC.req ? { items: gateC.req.items } : null, gateC.profile, gateC.hasIg);
  const pct = prog ? prog.pct : session.profilePct;
  // Lock ki wajah: Instagram nahi → media kit; sirf WhatsApp baaki → contact par link (purana __profileGate)
  const needWaOnly = locked && session.ig && (session.joinNeeds || []).some((n) => /whatsapp/i.test(n));
  const nextMove = needWaOnly
    ? { title: "Unlock campaigns · Link WhatsApp", short: "Link WhatsApp", sub: "· unlock campaigns", href: "/creater/profile/contact" }
    : locked
    ? { title: "Unlock campaigns · Connect Instagram", short: "Connect Instagram", sub: "· unlock campaigns", href: "/creater/media-kit" }
    : turn
      ? (() => {
          const t = `${turn.brand ? turn.brand + " · " : ""}${STAGE_SHORT[turn.stage] || turn.campaign || "Campaign"}`;
          return { title: t, short: t, sub: "· action needed", href: `/creater/my-campaigns/${turn.participation_id || turn.campaign_id}` };
        })()
      : prog && prog.complete
        ? { title: "Find your next campaign", short: "Discover campaigns", sub: "· profile complete", href: "/creater/discover" }
        : { title: `Finish your profile · ${pct}% complete`, short: "Finish your profile", sub: `· ${pct}% complete`, href: "/creater/profile/finish" };

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  // Dashboard ka Instagram (active account) + availability (purane profile.js jaisa)
  const igRow = (gateC.igAccounts || [])[0] || null;
  const igSynced = igRow?.updated_at ? new Date(igRow.updated_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
  const igMedia = Array.isArray(igRow?.recent_media) ? igRow.recent_media : [];
  const igEngV = engagement(igRow);
  const igEng = igEngV == null ? "—" : igEngV.toFixed(1) + "%";
  const [avail, setAvailState] = useState(null);
  const setAvail = async (k) => {
    setAvailState(k);
    try {
      await setAvailability(k, { reload: false });
    } catch {
      setAvailState(null);
    }
  };

  // Bahar click / Escape par panel band; ⌘K se command bar
  useEffect(() => {
    const onDown = (e) => {
      if (panel === "notif" && notifRef.current && !notifRef.current.contains(e.target)) setPanel(null);
    };
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPanel("cmd");
      }
      if (e.key === "Escape") setPanel(null);
    };
    const onCookie = () => setCookieOpen(true);
    const onRumi = () => setPanel("rumi");
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("bounty-cookie", onCookie);
    window.addEventListener("bounty-rumi", onRumi);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("bounty-cookie", onCookie);
      window.removeEventListener("bounty-rumi", onRumi);
    };
  }, [panel]);

  useEffect(() => {
    setPanel(null);
    setTipHidden(false);
  }, [pathname]);

  // Pehli baar setup ke baad cookie popup + mobile tip
  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem("bounty_tip") === "1";
    } catch {
      seen = true;
    }
    if (!seen) setTip(true);
  }, [session.setupDone]);

  // Cookie choice: har account se ek baar (purana ensureConsent) — device par nahi to server (my_consent) se, warna popup
  useEffect(() => {
    if (!gateC.loggedIn || !session.setupDone || session.cookie) return;
    let off = false;
    (async () => {
      const v = await getConsent();
      if (off) return;
      if (v) update({ cookie: v });
      else setCookieOpen(true);
    })();
    return () => {
      off = true;
    };
  }, [gateC.loggedIn, session.setupDone, session.cookie]);

  useEffect(() => {
    if (panel === "cmd") {
      setCmdQ("");
      setCmdI(0);
      setTimeout(() => cmdInput.current?.focus(), 20);
    }
    document.body.style.overflow = panel === "menu" || panel === "cmd" ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [panel]);

  const cmds = useMemo(() => COMMANDS.filter((c) => c.label.toLowerCase().includes(cmdQ.toLowerCase())), [cmdQ]);
  // 🔔 alerts — purane bell jaisa: get_my_notifications har 20 sec
  const signedIn = !!gateC?.loggedIn;
  const notes = useNotifications({ skip: !signedIn, refreshMs: 20000 });
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), [notes.data]);
  const alertList = (Array.isArray(notes.data) ? notes.data : []).map((n) => ({
    id: n.notification_id,
    unread: !n.read,
    href: hrefOf(n) || "/creater/messages",
    icon: iconOf(n),
    title: n.title || "Update",
    text: n.body || "",
    time: when(n.created_at, now),
  }));
  const alerts = read ? alertList.map((a) => ({ ...a, unread: false })) : alertList;
  const unread = alerts.filter((a) => a.unread).length;
  const onMarkAll = async () => {
    setRead(true);
    await markAllRead();
    notes.reload();
  };

  // Avatar dashboard ke numbers (asli campaigns)
  const open = useOpenCampaigns({ skip: !signedIn || panel !== "avatar" });
  const myAll = useMyCampaigns({ skip: !signedIn || locked || panel !== "avatar", live: false });
  const dash = {
    open: open.list.length,
    paid: open.list.filter((c) => (c.campaign_type || c.comp_type) !== "barter").length,
    barter: open.list.filter((c) => !["paid", "cash"].includes(c.campaign_type || c.comp_type)).length,
    waiting: locked ? 0 : myAll.list.filter((m) => groupOf(m) === "waiting").length,
    running: locked ? 0 : myAll.list.filter((m) => groupOf(m) === "running").length,
    done: locked ? 0 : myAll.list.filter((m) => groupOf(m) === "done").length,
  };
  const runningList = locked ? [] : myAll.list.filter((m) => groupOf(m) === "running").map((m) => ({ id: m.participation_id, note: `${m.campaign || m.name || "Campaign"} — ${noteOf(m)}` }));

  const signOut = async () => {
    await creatorSignOut();
    router.replace("/creater/login");
  };
  const closeTip = () => {
    setTip(false);
    setTipHidden(true);
    try {
      window.sessionStorage.setItem("bounty_tip", "1");
    } catch {
      /* ignore */
    }
  };
  // Choice device par + server log (purana Tracker.consentChanged → log_activity kind "consent") — Super Admin har device par dekhta hai
  const setCookie = (v) => {
    update({ cookie: v });
    setCookieOpen(false);
    saveConsent(v);
  };
  const sendAsk = (q) => {
    const text = (q ?? ask).trim();
    if (!text) return;
    const ans = answerFor(text);
    setChat((c) => [...c, { me: true, text }, { me: false, text: ans.a, href: ans.href }]);
    setAsk("");
  };

  const navItem = (it) => (
    <Link key={it.href} href={it.href} className={`bs-nav__item ${isActive(it.href) ? "is-active" : ""}`} title={it.label}>
      <span className="bs-nav__ic">{it.icon}</span>
      <span className="bs-nav__txt">{it.label}</span>
      {it.dot && unread > 0 && <i className="bs-nav__dot" />}
    </Link>
  );

  const avatarImg = session.useSidekickPic ? (
    <img src={sk.img} alt="" style={{ background: sk.bg }} />
  ) : session.avatar ? (
    <img src={session.avatar} alt="" referrerPolicy="no-referrer" />
  ) : (
    <span className="bs-avatar__c">{(session.name || "C")[0].toUpperCase()}</span>
  );

  // Login / gate check chal raha hai ya doosre step par bhej rahe hain — page mat dikhao
  if (!gateC.ready || !gateC.loggedIn || gateRoute(gateC, "app", pathname)) {
    return (
      <BootLoader kid={gateC.loggedIn ? gateC.prefs?.kid : ""} />
    );
  }

  return (
    <div className={`bs bs--${tone}`}>
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="bs-side" aria-label="Creator menu">
        <div className="bs-side__top">
          <Link href="/creater/home" className="bs-logo" aria-label="Bounty home">
            <Logo size={19} />
          </Link>
          <Link href={nextMove.href} className="bs-next" title="Your next move">
            <span className="bs-next__ic">🎯</span>
            <span className="bs-next__txt">
              <strong>Your next move</strong>
              <small>{nextMove.title}</small>
            </span>
          </Link>
          <nav className="bs-nav">
            {NAV.map((g) => (
              <div key={g.group} className="bs-nav__group">
                <p className="bs-nav__label">{g.group}</p>
                {g.items.map(navItem)}
              </div>
            ))}
          </nav>
        </div>
        <div className="bs-side__bottom">
          <button type="button" className="bs-rumi bs-rumi--side" onClick={() => setPanel("rumi")} title={`Ask ${sk.name}`}>
            <img src={sk.img} alt="" />
            <span>
              <strong>Ask {sk.name}</strong>
              <small>Help with anything</small>
            </span>
          </button>
          <Link href="/creater/profile" className="bs-me" title={locked ? "My profile" : session.handle}>
            {locked ? <img src={sk.img} alt="" className="bs-me__sk" /> : avatarImg}
            <span>{locked ? "My profile" : session.handle || "My profile"}</span>
          </Link>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="bs-main">
        <header className="bs-top">
          <button type="button" className="bs-burger" onClick={() => setPanel("menu")} aria-label="Open menu">
            ☰
          </button>
          <Link href="/creater/home" className="bs-mlogo" aria-label="Bounty home">
            <Logo size={19.5} />
          </Link>
          <button type="button" className="bs-search" onClick={() => setPanel("cmd")}>
            <span aria-hidden="true">🔍</span> Search or run a command…
          </button>
          <div className="bs-top__right">
            <div className="bs-pop" ref={notifRef}>
              <button
                type="button"
                className={`bs-bell ${panel === "notif" ? "is-on" : ""}`}
                onClick={() => setPanel(panel === "notif" ? null : "notif")}
                aria-label="Notifications"
                aria-expanded={panel === "notif"}
              >
                <Bell size={16} />
                {unread > 0 && <i />}
              </button>
              {panel === "notif" && (
                <div className="bs-alerts" role="dialog" aria-label="Alerts">
                  <div className="bs-alerts__head">
                    <strong>Alerts</strong>
                    <button type="button" onClick={onMarkAll}>
                      Mark all read
                    </button>
                    <Link href="/creater/messages" className="bs-alerts__all">
                      View all alerts →
                    </Link>
                  </div>
                  {alerts.length === 0 ? (
                    <p className="bs-alerts__empty">No alerts yet. When something needs you, it&apos;ll show here.</p>
                  ) : (
                    <ul>
                      {alerts.slice(0, 5).map((a) => (
                        <li key={a.id} className={a.unread ? "is-unread" : ""}>
                          <Link href={a.href}>
                            <span className="bs-alerts__ic">{a.icon}</span>
                            <span className="bs-alerts__body">
                              <strong>{a.title}</strong>
                              <small>{a.text}</small>
                            </span>
                            <span className="bs-alerts__time">{a.time}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className={`bs-avatar ${panel === "avatar" ? "is-on" : ""}`}
              onClick={() => setPanel(panel === "avatar" ? null : "avatar")}
              aria-label="Your dashboard"
              aria-expanded={panel === "avatar"}
            >
              {avatarImg}
            </button>
          </div>
        </header>

        <main className="bs-content">{children}</main>

        {/* ---------- Avatar → dashboard panel (Figma "Avatar menu") ---------- */}
        {panel === "avatar" && (
          <div className="bs-dash" role="dialog" aria-label="Your dashboard">
            <div className="bs-dash__in">
              <div className="bs-dash__row">
                <section className="bs-dcard bs-dcard--of">
                  <div className="bs-dof">
                    {avatarImg}
                    <span className="bs-dof__txt">
                      <small>Dashboard of</small>
                      <strong>{session.handle || session.name || "Creator"}</strong>
                    </span>
                    <Link href="/creater/onboarding/meta" className="bs-dof__add">
                      + Add account
                    </Link>
                  </div>
                </section>
                <section className="bs-dcard">
                  <h3>Your availability</h3>
                  <p className="bs-dcard__sub">Brands see this before inviting you</p>
                  <div className="bs-avail">
                    {[
                      ["available", "🟢 Available"],
                      ["limited", "🟡 Limited"],
                      ["unavailable", "🔴 Unavailable"],
                    ].map(([k, l]) => (
                      <button key={k} type="button" className={(avail || session.available) === k ? "is-on" : ""} onClick={() => setAvail(k)}>
                        {l}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <section className="bs-dcard bs-dprof">
                <div className="bs-dprof__txt">
                  <h3>📝 Your profile is {session.profilePct}% complete</h3>
                  <p className="bs-dcard__sub">Optional — complete profiles get picked by brands first{session.req?.missing?.[0] ? ` · next: ${session.req.missing[0]}` : ""}</p>
                  <span className="bs-dprof__bar">
                    <i style={{ width: `${session.profilePct}%` }} />
                  </span>
                </div>
                <Link href="/creater/profile/finish" className="bs-dprof__btn">
                  Complete profile →
                </Link>
              </section>

              <p className="bs-dhead">
                <b>📸 Instagram</b> {igRow ? `@${igRow.username} · synced ${igSynced}` : "Not connected"}
              </p>
              <div className="bs-dtiles">
                {[
                  [igRow ? fmtFollowers(igRow.followers_count) : "—", "Followers"],
                  [igRow ? fmtFollowers(igRow.media_count) : "—", "Posts"],
                  [igRow?.avg_reach ? fmtFollowers(igRow.avg_reach) : "—", "Avg reach / post"],
                  [igEng, "Engagement"],
                  ["0", "Live stories"],
                ].map(([v, l]) => (
                  <div key={l} className="bs-dtile">
                    <strong>{v}</strong>
                    <small>{l}</small>
                  </div>
                ))}
              </div>

              <p className="bs-dhead">
                <b>📣 Campaigns</b>
              </p>
              <div className="bs-dtiles">
                {[
                  [dash.open, "Open for you", "/creater/discover"],
                  [dash.paid, "💰 Paid", "/creater/discover"],
                  [dash.barter, "🎁 Barter", "/creater/discover"],
                  [dash.waiting, "Applied / waiting", "/creater/my-campaigns"],
                  [dash.running, "Running now", "/creater/my-campaigns"],
                  [dash.done, "Completed", "/creater/my-campaigns"],
                ].map(([v, l, h]) => (
                  <Link key={l} href={h} className="bs-dtile">
                    <strong>{v}</strong>
                    <small>{l}</small>
                  </Link>
                ))}
              </div>

              <div className="bs-dash__row bs-dash__row--b">
                <section className="bs-dcard">
                  <h3 className="bs-dcard__serif">
                    🔔 Latest alerts <em>· also on WhatsApp &amp; email</em>
                  </h3>
                  {alerts.length === 0 ? (
                    <p className="bs-dcard__empty">No alerts yet.</p>
                  ) : (
                    <ul className="bs-dlist">
                      {alerts.slice(0, 3).map((a) => (
                        <li key={a.id}>
                          <Link href={a.href}>
                            {a.icon} {a.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                <section className="bs-dcard">
                  <h3 className="bs-dcard__serif">🟢 Running campaigns</h3>
                  {runningList.length === 0 ? (
                    <p className="bs-dcard__empty">Nothing running yet — apply from Campaigns.</p>
                  ) : (
                    <ul className="bs-dlist">
                      {runningList.map((m) => (
                        <li key={m.id}>
                          <Link href={`/creater/my-campaigns/${m.id}`}>{m.note}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <div className="bs-dlinks">
                <Link href="/creater/settings">
                  <Settings size={14} /> Settings &amp; privacy
                </Link>
                <button type="button" onClick={() => setCookieOpen(true)}>
                  🍪 Cookie settings
                </button>
                <button type="button" className="bs-dlinks__out" onClick={signOut}>
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop: sidekick screen ke right-bottom kone mein — wahi bolta hai, click par sheet */}
        {panel !== "rumi" && (
          <button type="button" className="bs-float" onClick={() => setPanel("rumi")} aria-label={`Ask ${sk.name}`} title={`Ask ${sk.name}`}>
            <img src={sk.img} alt="" />
            <span>Ask {sk.name}</span>
          </button>
        )}

        {/* Sidekick ki baat — mobile par footer wale Rumi se, desktop par sidebar wale Rumi se (page par alag Rumi nahi) */}
        {!tipHidden && (pageTip || tip) && (
          <div className={`bs-tip ${pathname.startsWith("/creater/messages") ? "bs-tip--msg" : ""}`} role="status">
            <p>
              {pageTip ? (
                <>
                  <b>{sk.name}:</b> {pageTip.text}
                </>
              ) : (
                <>
                  <b>Tip:</b>
                  {needWaOnly ? "link WhatsApp — campaign updates come there, and it unlocks applying." : locked ? "connect Instagram — brands check real reach when you apply." : "finish your profile — brands pick complete profiles first."}
                </>
              )}
            </p>
            <button type="button" onClick={closeTip} aria-label="Close tip">
              ×
            </button>
          </div>
        )}

        {/* ---------- Mobile bottom nav ---------- */}
        <nav className="bs-bnav" aria-label="Main">
          <Link href="/creater/home" className={isActive("/creater/home") ? "is-active" : ""}>
            <span>
              <Home size={18} />
            </span>
            Home
          </Link>
          <Link href="/creater/discover" className={isActive("/creater/discover") || isActive("/creater/my-campaigns") ? "is-active" : ""}>
            <span>
              <Megaphone size={18} />
            </span>
            Campaigns
          </Link>
          <button type="button" className={`bs-bnav__rumi ${panel === "rumi" ? "is-active" : ""}`} onClick={() => setPanel(panel === "rumi" ? null : "rumi")}>
            <img src={sk.img} alt="" />
            {sk.name}
          </button>
          <Link href="/creater/analytics" className={isActive("/creater/analytics") ? "is-active" : ""}>
            <span>
              <BarChart size={18} />
            </span>
            Analytics
          </Link>
          <Link href="/creater/profile" className={isActive("/creater/profile") || isActive("/creater/settings") ? "is-active" : ""}>
            <span>
              <User size={18} />
            </span>
            Profile
          </Link>
        </nav>
      </div>

      {/* ---------- Mobile menu drawer (☰) ---------- */}
      {panel === "menu" && (
        <div className="bs-drawer" role="dialog" aria-label="Menu">
          <div className="bs-drawer__head">
            <button type="button" onClick={() => setPanel(null)} aria-label="Close menu">
              ✕
            </button>
            <Logo size={19.5} />
            <span className="bs-drawer__av">{avatarImg}</span>
          </div>
          <button type="button" className="bs-drawer__search" onClick={() => setPanel("cmd")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            Search or run a command… <kbd>⌘K</kbd>
          </button>
          <Link href={nextMove.href} className="bs-drawer__next">
            <strong>
              <span>🎯</span> Your next move
            </strong>
            <small>
              <i /> {nextMove.short}
            </small>
            <em>{nextMove.sub}</em>
          </Link>
          {DRAWER.map((g) => (
            <div key={g.group} className="bs-drawer__group">
              <p>{g.group}</p>
              {g.items.map((it) => (
                <Link key={it.href} href={it.href} className={isActive(it.href) ? "is-active" : ""}>
                  <span>{it.icon}</span> {it.label}
                </Link>
              ))}
            </div>
          ))}
          <button type="button" className="bs-rumi bs-rumi--drawer" onClick={() => setPanel("rumi")}>
            <img src={sk.img} alt="" />
            <span>
              <strong>Ask {sk.name}</strong>
              <small>Help with anything</small>
            </span>
          </button>
          <button type="button" className="bs-drawer__out" onClick={signOut}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}

      {/* ---------- Command bar (⌘K) ---------- */}
      {panel === "cmd" && (
        <div className="bs-cmdwrap" onClick={() => setPanel(null)}>
          <div className="bs-cmd" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Command bar">
            <input
              ref={cmdInput}
              value={cmdQ}
              onChange={(e) => {
                setCmdQ(e.target.value);
                setCmdI(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setCmdI((i) => Math.min(i + 1, cmds.length - 1));
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setCmdI((i) => Math.max(i - 1, 0));
                }
                if (e.key === "Enter" && cmds[cmdI]) router.push(cmds[cmdI].href);
              }}
              placeholder="Jump to a module or run a command…"
              aria-label="Search"
            />
            <ul>
              {cmds.map((c, i) => {
                const Ic = c.icon;
                return (
                  <li key={c.href}>
                    <Link href={c.href} className={i === cmdI ? "is-on" : ""} onMouseEnter={() => setCmdI(i)}>
                      <Ic size={20} stroke={1.7} /> {c.label} <span>↵</span>
                    </Link>
                  </li>
                );
              })}
              {!cmds.length && <li className="bs-cmd__none">Nothing found for “{cmdQ}”</li>}
            </ul>
          </div>
        </div>
      )}

      {/* ---------- Sidekick sheet (Rumi) ---------- */}
      {panel === "rumi" && (
        <div className="bs-sheetwrap" onClick={() => setPanel(null)}>
          <aside className="bs-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${sk.name} · Your sidekick`}>
            <i className="bs-sheet__grab" />
            <div className="bs-sheet__head">
              <img src={sk.img} alt="" />
              <span>
                <strong>{sk.name} · Your sidekick</strong>
                <small>
                  <i /> Here to help
                </small>
              </span>
              <Link href="/creater/settings" className="bs-sheet__btn" aria-label="Sidekick settings">
                <Sun />
              </Link>
              <button type="button" className="bs-sheet__btn" onClick={() => setPanel(null)} aria-label="Close">
                <Close size={18} />
              </button>
            </div>
            <div className="bs-sheet__body">
              <p className="bs-sheet__hey">Hey {session.first || "there"}! What can we tackle today?</p>
              <div className="bs-sheet__quick">
                {[
                  [Bell, "What needs my attention?"],
                  [FileText, "Help with my brief"],
                  [Megaphone, "Find campaigns for me"],
                  [LayersIc, "Improve my media kit"],
                ].map(([Ic, q]) => (
                  <button key={q} type="button" onClick={() => sendAsk(q)}>
                    <Ic size={17} stroke={1.8} /> <span>{q}</span> <ChevronRight size={14} />
                  </button>
                ))}
              </div>
              <div className="bs-sheet__next">
                <small>✦ Next up</small>
                <strong>{locked ? "Connect Instagram" : "Sign the Nykaa agreement"}</strong>
                <p>{locked ? "Campaigns unlock once brands can see your real reach." : "Nykaa picked you — sign to lock your spot."}</p>
                <Link href={locked ? "/creater/onboarding/meta" : "/creater/my-campaigns/nykaa-glow/agreement"}>{locked ? "Connect now ›" : "Open campaign ›"}</Link>
              </div>
              {chat.length > 0 && (
                <div className="bs-chat">
                  {chat.map((m, i) => (
                    <p key={i} className={m.me ? "is-me" : ""}>
                      {m.text}
                      {m.href && (
                        <Link href={m.href}>
                          Open <ArrowRight size={11} />
                        </Link>
                      )}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <form
              className="bs-sheet__ask"
              onSubmit={(e) => {
                e.preventDefault();
                sendAsk();
              }}
            >
              <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder={`Ask ${sk.name} anything…`} aria-label={`Ask ${sk.name}`} />
              <span className="bs-sheet__mic" aria-hidden="true">
                <Mic />
              </span>
              <button type="submit" aria-label="Send" disabled={!ask.trim()}>
                <Send size={15} />
              </button>
            </form>
          </aside>
        </div>
      )}

      {/* ---------- Cookie popup ---------- */}
      {cookieOpen && (
        <div className="bs-cookie" role="dialog" aria-label="Cookie settings">
          <div className="bs-cookie__txt">
            <strong>Cookies &amp; activity on Geek Influencer OS</strong>
            <p>
              <b>Essential</b>(always on): keeps you signed in, and a security log of sign-ins and key actions (IP address, approximate city, device) to protect your account. <b>Analytics</b>(your choice): which pages you use and time spent, so our team can improve the app and support you — measured with our own activity log, <b>Google Analytics</b>and <b>Microsoft Clarity</b>heatmaps/replays (typed details, chats and payments are hidden; no ads, no selling). We never sell your data. See our{" "}
              <a href="/privacy">Privacy Policy</a>.
            </p>
          </div>
          <div className="bs-cookie__btns">
            <button type="button" className="bs-cookie__ess" onClick={() => setCookie("essential")}>
              Essential only
            </button>
            <button type="button" className="bs-cookie__all" onClick={() => setCookie("all")}>
              Accept all
            </button>
          </div>
        </div>
      )}

      <style>{`
        .bs { min-height: 100vh; }

        /* ---------- Sidebar (Figma: 260px, forest image) ---------- */
        .bs-side {
          position: fixed; left: 0; top: 0; bottom: 0; z-index: 40; width: 260px;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 18px 18px 16px; color: #fbf3e2; overflow-y: auto; scrollbar-width: none;
          background:
            linear-gradient(180deg, #0f2e22 0%, rgba(15,46,34,.9) 24%, rgba(15,46,34,.25) 42%, rgba(15,46,34,0) 58%, rgba(10,34,25,.55) 80%, #0c271c 100%),
            url("/creater/forest-gate.jpg") 58% 72% / auto 115% no-repeat, #0f2e22;
        }
        .bs-side::-webkit-scrollbar { display: none; }
        .bs-logo { display: inline-flex; padding: 9px 0 0; margin-left: -2px; }
        .bs-logo .bl-word { letter-spacing: 1.1px; }
        .bs-next {
          display: flex; gap: 8px; margin-top: 44px; padding: 11px 12px 11px 14px; border-radius: 14px;
          border: 1.5px solid rgba(232,176,74,.85); background: rgba(10,34,25,.45);
        }
        .bs-next:hover { background: rgba(10,34,25,.75); }
        .bs-next__ic { width: 18px; flex-shrink: 0; font-size: 17px; line-height: 18px; }
        .bs-next__txt strong { display: block; font-family: var(--bx-serif); font-size: 15px; font-weight: 600; line-height: 18px; color: #fbf3e2; }
        .bs-next__txt small { display: block; margin-top: 0; font-family: var(--bx-serif); font-style: italic; font-size: 12px; line-height: 14px; color: #d9cdb2; }
        .bs-nav { margin-top: 0; }
        .bs-nav__label { margin: 21px 10px 5px; font-size: 10.5px; line-height: 14px; font-weight: 700; letter-spacing: 1.3px; text-transform: uppercase; color: #f6d98b; }
        .bs-nav__group { display: grid; gap: 4px; }
        .bs-nav__group:first-child .bs-nav__label { margin-top: 19px; }
        .bs-nav__item {
          position: relative; display: flex; align-items: center; gap: 15px; height: 38px; padding: 0 14px;
          border-radius: 10px; border: 1px solid transparent; font-size: 14.5px; font-weight: 500; color: #fbf3e2;
        }
        .bs-nav__item:hover { background: rgba(255,255,255,.06); }
        .bs-nav__item.is-active { background: rgba(232,176,74,.16); border-color: rgba(232,176,74,.8); font-weight: 700; }
        .bs-nav__ic { width: 16px; text-align: center; font-size: 16px; line-height: 16px; color: #c9bc98; }
        .bs-nav__item.is-active .bs-nav__ic { color: #f0cf7a; }
        .bs-nav__dot { position: absolute; left: 26px; top: 9px; width: 7px; height: 7px; border-radius: 50%; background: var(--bx-red-2); }
        .bs-side__bottom { display: grid; gap: 8px; margin-top: 20px; }
        .bs-rumi {
          display: flex; align-items: center; gap: 9px; width: 100%; height: 64px; padding: 0 8px; border-radius: 14px;
          border: 1.5px solid rgba(232,176,74,.85); background: rgba(10,34,25,.75); color: #fbf3e2; text-align: left;
        }
        .bs-rumi:hover { background: rgba(10,34,25,.95); }
        .bs-rumi img { width: 52px; height: 52px; object-fit: contain; }
        .bs-rumi strong { display: block; font-family: var(--bx-serif); font-size: 16px; line-height: 20px; font-weight: 600; }
        .bs-rumi small { display: block; font-family: var(--bx-serif); font-style: italic; font-size: 12px; line-height: 15px; color: #d9cdb2; }
        .bs-me { display: flex; align-items: center; gap: 10px; height: 54px; padding: 0 11px; border-radius: 14px; border: 1px solid rgba(232,176,74,.45); background: rgba(10,34,25,.75); font-size: 13.5px; font-weight: 900; color: #fbf3e2; }
        .bs-me img, .bs-me .bs-avatar__c { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1.5px solid rgba(232,176,74,.8); }
        .bs-me span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bs-me .bs-me__sk { object-fit: contain; background: radial-gradient(circle, #fbe9c6, #e8c98c); padding: 2px; }

        /* ---------- Main + top bar ---------- */
        .bs-main { margin-left: 260px; min-height: 100vh; display: flex; flex-direction: column; }
        .bs-top {
          position: sticky; top: 0; z-index: 30; height: 66px;
          background: #f5e9cf; border-bottom: 1px solid #e3d2ac;
        }
        .bs-burger, .bs-mlogo { display: none; }
        .bs-search {
          position: absolute; top: 14px; left: calc(50% - 313px); display: flex; align-items: center; gap: 4px; width: 520px; height: 38px; padding: 0 14px;
          border-radius: 999px; border: 1px solid #d9c49a; background: #fffaef; color: #8a7a5a; font-size: 14px; font-weight: 400; text-align: left;
        }
        .bs-search span { font-size: 13px; }
        .bs-top__right { position: absolute; right: 26px; top: 11px; display: flex; align-items: center; gap: 12px; }
        .bs-pop { position: relative; }
        .bs-bell { position: relative; width: 38px; height: 38px; border-radius: 50%; border: 1px solid #d9c49a; background: #fffaef; display: grid; place-items: center; color: #14231a; }
        .bs-bell.is-on { border-color: var(--bx-gold); }
        .bs-bell i { position: absolute; top: 8px; right: 9px; width: 8px; height: 8px; border-radius: 50%; background: var(--bx-red-2); border: 1.5px solid #fffaef; }
        .bs-avatar { width: 44px; height: 44px; padding: 0; border-radius: 50%; border: 2px solid #c79a3c; background: #fffaf0; overflow: hidden; }
        .bs-avatar.is-on { box-shadow: 0 0 0 3px rgba(232,176,74,.35); }
        .bs-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .bs-avatar__c { display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%; background: var(--bx-gold); font-family: var(--bx-serif); font-weight: 700; font-size: 18px; color: var(--bx-ink); }

        /* Notifications */
        .bs-alerts {
          position: absolute; right: -12px; top: calc(100% + 17px); z-index: 50; width: 390px; padding: 18px 18px 20px;
          background: #fff4dd; border: 1px solid #e3cfa3; border-radius: 18px;
          box-shadow: 0 24px 50px -24px rgba(40,25,5,.55); animation: bxPop .18s ease;
        }
        .bs-alerts__head { display: flex; align-items: center; gap: 12px; }
        .bs-alerts__head strong { flex: 1; font-family: var(--bx-serif); font-size: 22px; line-height: 27px; font-weight: 600; color: #14231a; }
        .bs-alerts__head button { border: 0; background: none; padding: 0; font-size: 13px; font-weight: 700; color: #2a9d8f; }
        .bs-alerts__all { display: inline-flex; align-items: center; height: 30px; padding: 0 12px; border-radius: 999px; background: #f1e3c3; font-size: 12px; font-weight: 700; color: #14231a; }
        .bs-alerts__empty { margin: 30px 0 4px; text-align: center; font-family: var(--bx-serif); font-style: italic; font-size: 14px; line-height: 17px; color: #6f6250; }
        .bs-alerts ul { list-style: none; margin: 14px 0 0; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 4px; }
        .bs-alerts li a { display: flex; align-items: center; gap: 10px; padding: 9px; border-radius: 12px; }
        .bs-alerts li a:hover { background: #f3e6c8; }
        .bs-alerts li.is-unread a { background: #f6e6c2; }
        .bs-alerts__ic { width: 32px; height: 32px; flex-shrink: 0; border-radius: 10px; background: #fffaf0; display: grid; place-items: center; font-size: 15px; }
        .bs-alerts__body { flex: 1; min-width: 0; }
        .bs-alerts__body strong { display: block; font-size: 13px; font-weight: 700; }
        .bs-alerts__body small { display: block; font-size: 11.5px; color: var(--bx-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bs-alerts__time { font-size: 11px; color: var(--bx-muted); white-space: nowrap; }

        .bs-content { width: 100%; max-width: 1400px; padding: 28px 34px 56px 22px; flex: 1; }

        /* Avatar → dashboard panel */
        .bs-dash {
          position: fixed; left: 260px; right: 0; top: 66px; bottom: 0; z-index: 28; overflow-y: auto;
          background: url("/creater/parchment.jpg") center / cover fixed, var(--bx-paper); animation: bxFade .15s ease;
        }
        .bs-dash__in { max-width: 1400px; padding: 26px 34px 40px 22px; }
        .bs-dash__row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .bs-dcard { padding: 14px 16px; border-radius: 16px; background: rgba(28,58,40,.88); border: 1px solid rgba(232,176,74,.45); color: #fbf3e2; }
        .bs-dcard h3 { font-size: 16px; line-height: 21px; font-weight: 700; }
        .bs-dcard__serif { font-family: var(--bx-serif); font-size: 15px !important; font-weight: 600 !important; display: flex; justify-content: space-between; gap: 10px; }
        .bs-dcard__serif em { font-style: normal; font-family: var(--bx-serif); font-weight: 400; font-size: 12px; color: #7a6a4a; }
        .bs-dcard__sub { margin: 1px 0 0; font-size: 12px; line-height: 16px; color: #7a6a4a; }
        .bs-dcard__empty { margin: 20px 0 4px 6px; font-size: 13px; color: #7a6a4a; }
        .bs-dcard--of { display: flex; align-items: center; padding: 12px 14px; }
        .bs-dof { flex: 1; display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 6px 14px 6px 10px; border-radius: 999px; background: #fbf0db; }
        .bs-dof img, .bs-dof .bs-avatar__c { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
        .bs-dof__txt { flex: 1; min-width: 0; }
        .bs-dof__txt small { display: block; font-size: 11px; line-height: 12.7px; letter-spacing: .4px; text-transform: uppercase; color: #6b5a3a; }
        .bs-dof__txt strong { display: block; font-size: 14px; line-height: 16.1px; font-weight: 700; color: #14231a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bs-dof__add { flex-shrink: 0; display: inline-flex; align-items: center; height: 40px; padding: 0 18px; border-radius: 999px; border: 1px solid #c9b38a; background: #fffaef; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: #14231a; }
        .bs-avail { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .bs-avail button { height: 34px; padding: 0 13px; border-radius: 999px; border: 0; background: #f6ead2; font-size: 13px; font-weight: 700; color: #14231a; }
        .bs-avail button.is-on { box-shadow: 0 0 0 2px #e8b04a; }
        .bs-dprof { display: flex; align-items: center; gap: 16px; margin-top: 14px; padding: 18px; }
        .bs-dprof__txt { flex: 1; min-width: 0; }
        .bs-dprof__bar { display: block; height: 8px; margin-top: 12px; border-radius: 6px; background: rgba(255,255,255,.12); overflow: hidden; }
        .bs-dprof__bar i { display: block; height: 100%; border-radius: inherit; background: #2f9b5a; }
        .bs-dprof__btn { flex-shrink: 0; display: inline-flex; align-items: center; height: 38px; padding: 0 18px; border-radius: 999px; background: #123524; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: #fbf3e2; }
        .bs-dhead { margin: 18px 0 10px; font-family: var(--bx-serif); font-size: 13px; color: #8a7a5a; }
        .bs-dhead b { font-size: 15px; font-weight: 600; color: #14231a; margin-right: 2px; }
        .bs-dtiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 150px)); gap: 13px; }
        .bs-dtile { display: block; padding: 14px 15px 12px; border-radius: 14px; background: #fbf0db; border: 1px solid #e6d3ab; }
        .bs-dtile strong { display: block; font-family: var(--bx-serif); font-size: 26px; line-height: 32px; font-weight: 700; color: #14231a; }
        .bs-dtile small { display: block; margin-top: 4px; font-size: 12px; font-weight: 600; color: #7a6a4a; }
        .bs-dash__row--b { margin-top: 18px; grid-template-columns: 1.5fr 1fr; }
        .bs-dlist { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 8px; font-size: 13px; }
        .bs-dlist a { color: #e9dfc7; }
        .bs-dlist a:hover { color: #fff; text-decoration: underline; }
        .bs-dlinks { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
        .bs-dlinks a, .bs-dlinks button { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 999px; border: 1px solid #d9c49a; background: #fffaef; font-size: 13px; font-weight: 700; color: #14231a; }
        .bs-dlinks__out { color: var(--bx-red) !important; }

        .bs-bnav { display: none; }
        /* Page ke apne Rumi bubble chhupa — shell ka sidekick hi bolta hai */
        .bs .rt-page { display: none !important; }
        /* Desktop: sidebar wala Ask card hata — sidekick right corner mein */
        .bs-rumi--side { display: none !important; }
        .bs-float {
          position: fixed; right: 26px; bottom: 22px; z-index: 46; display: flex; flex-direction: column; align-items: center; gap: 2px;
          border: 0; background: none; padding: 0; cursor: pointer;
        }
        .bs-float img { width: 92px; height: 92px; object-fit: contain; filter: drop-shadow(0 10px 14px rgba(40,25,5,.45)); }
        .bs-float span {
          padding: 3px 10px; border-radius: 999px; background: #123524; border: 1px solid rgba(232,176,74,.7);
          color: #fbf3e2; font-family: var(--bx-serif); font-size: 12.5px; font-weight: 600; white-space: nowrap;
        }
        .bs-float:hover img { transform: scale(1.06); }
        /* Desktop: bubble right wale sidekick se nikalta hai */
        .bs-tip {
          position: fixed; right: 132px; bottom: 74px; z-index: 45; display: flex; align-items: flex-start; gap: 8px; max-width: 300px;
          padding: 11px 12px 11px 16px; border-radius: 16px; background: #fff8e6; border: 1.5px solid #e8b04a;
          box-shadow: 0 14px 30px -16px rgba(0,0,0,.6); animation: bxPop .2s ease;
        }
        .bs-tip::before { content: ""; position: absolute; right: -8px; bottom: 18px; width: 13px; height: 13px; background: #fff8e6; border-right: 1.5px solid #e8b04a; border-top: 1.5px solid #e8b04a; transform: rotate(45deg); }
        /* Messages par neeche send button hai — bubble upar header ke paas (sidekick bhi upar) */
        @media (min-width: 768px) {
          .bs-tip--msg { bottom: auto; top: 86px; right: 24px; }
          .bs-tip--msg::before { display: none; }
        }
        .bs-tip p { flex: 1; margin: 0; font-family: var(--bx-serif); font-style: italic; font-size: 13.5px; line-height: 18.2px; color: #14231a; }
        .bs-tip b { margin-right: 3px; font-style: normal; font-weight: 700; color: #b8452f; }
        .bs-tip button { border: 0; background: none; color: #8a7a5a; padding: 0 2px; font-family: var(--bx-jak); font-size: 20px; line-height: 18px; }

        /* Command bar */
        .bs-cmdwrap { position: fixed; inset: 0; z-index: 100; background: rgba(60,58,40,.38); backdrop-filter: blur(2px); animation: bxFade .15s ease; }
        .bs-cmd { position: absolute; left: calc(50% - 280px); top: 108px; width: 560px; border-radius: 16px; background: #fbf3e2; border: 1px solid #e8b04a; overflow: hidden; box-shadow: 0 30px 80px -30px rgba(0,0,0,.55); animation: bxPop .18s ease; }
        .bs-cmd input { width: 100%; height: 58px; padding: 0 20px; border: 0; border-bottom: 1px solid #e8d6b0; background: none; outline: none; font-size: 16px; color: #14231a; }
        .bs-cmd input::placeholder { color: #757575; }
        .bs-cmd ul { list-style: none; margin: 0; padding: 0; max-height: 362px; overflow-y: auto; }
        .bs-cmd li a { display: flex; align-items: center; gap: 13px; height: 52.5px; padding: 0 22px; font-size: 14px; font-weight: 600; color: #14231a; }
        .bs-cmd li a span { margin-left: auto; font-size: 11px; color: #6b5a3a; }
        .bs-cmd li a.is-on { background: #f6e6c4; }
        .bs-cmd__none { padding: 16px; text-align: center; font-size: 13px; color: var(--bx-muted); }

        /* Sidekick sheet (desktop: right panel) */
        .bs-sheetwrap { position: fixed; inset: 0; z-index: 90; }
        .bs-sheet {
          position: absolute; right: 0; top: 0; bottom: 0; width: 410px; display: flex; flex-direction: column;
          background: #143a29; color: #fbf3e2; box-shadow: -20px 0 40px -20px rgba(0,0,0,.4); animation: bsIn .22s ease;
        }
        @keyframes bsIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
        .bs-sheet__grab { display: none; }
        .bs-sheet__head { display: flex; align-items: center; gap: 10px; padding: 12px 18px 0 24px; }
        .bs-sheet__head img { width: 62px; height: 52px; object-fit: contain; padding-right: 10px; border-right: 1px solid rgba(232,176,74,.45); box-sizing: content-box; }
        .bs-sheet__head span { flex: 1; min-width: 0; }
        .bs-sheet__head strong { display: block; font-family: var(--bx-serif); font-size: 16px; line-height: 20px; font-weight: 600; }
        .bs-sheet__head small { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #d9cdb2; }
        .bs-sheet__head small i { width: 7px; height: 7px; border-radius: 50%; background: #3ddc84; }
        .bs-sheet__btn { width: 36px; height: 36px; border-radius: 50%; border: 0; background: none; display: grid; place-items: center; color: #fbf3e2; }
        .bs-sheet__btn:hover { background: rgba(255,255,255,.08); }
        .bs-sheet__body { flex: 1; overflow-y: auto; padding: 18px 15px 16px 25px; }
        .bs-sheet__hey { margin: 0 auto 13px; width: fit-content; padding: 9px 26px; border-radius: 999px; background: #f7e8c8; color: #2a1e14; font-family: var(--bx-serif); font-size: 14.5px; line-height: 18px; text-align: center; }
        .bs-sheet__quick { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
        .bs-sheet__quick button { display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 7px 12px 7px 14px; border: 1px solid #e3cfa3; border-radius: 12px; background: #f7e8c8; color: #2a1e14; font-size: 12.5px; line-height: 15.6px; font-weight: 700; text-align: left; }
        .bs-sheet__quick button span { flex: 1; }
        .bs-sheet__quick button svg:last-child { flex-shrink: 0; }
        .bs-sheet__next { margin-top: 13px; padding: 14px 15px 14px; border-radius: 16px; background: #f7e8c8; border: 1px solid #e3cfa3; color: #2a1e14; }
        .bs-sheet__next small { font-size: 11px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; color: #8a5e12; }
        .bs-sheet__next strong { display: block; margin-top: 4px; font-family: var(--bx-serif); font-size: 17px; line-height: 21px; font-weight: 600; }
        .bs-sheet__next p { margin: 2px 0 12px; font-size: 12.5px; color: #5a4a3a; }
        .bs-sheet__next a { display: inline-flex; align-items: center; height: 32px; padding: 0 18px; border-radius: 999px; background: #123524; color: #fbf3e2; font-size: 13px; font-weight: 700; }
        .bs-chat { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
        .bs-chat p { margin: 0; max-width: 88%; padding: 9px 12px; border-radius: 14px; background: rgba(255,255,255,.1); font-size: 13px; line-height: 1.45; }
        .bs-chat p.is-me { align-self: flex-end; background: var(--bx-gold); color: var(--bx-ink); font-weight: 600; }
        .bs-chat a { display: inline-flex; align-items: center; gap: 3px; margin-left: 6px; font-weight: 700; color: var(--bx-gold-2); text-decoration: underline; }
        .bs-sheet__ask { display: flex; align-items: center; gap: 8px; margin: 0 14px 14px 25px; height: 44px; padding: 0 5px 0 16px; border-radius: 999px; background: #f7e8c8; color: #2a1e14; }
        .bs-sheet__ask input { flex: 1; min-width: 0; height: 34px; border: 0; outline: none; background: none; font-family: var(--bx-serif); font-style: italic; font-size: 13.5px; color: #2a1e14; }
        .bs-sheet__ask input::placeholder { color: #6a5a4a; }
        .bs-sheet__mic { display: grid; place-items: center; color: #2a1e14; }
        .bs-sheet__ask button { width: 32px; height: 32px; border-radius: 50%; border: 0; background: #123524; color: #fbf3e2; display: grid; place-items: center; }
        .bs-sheet__ask button:disabled { opacity: .8; }

        /* Cookie (desktop: bottom bar) */
        .bs-cookie {
          position: fixed; left: 260px; right: 0; bottom: 0; z-index: 110; display: flex; align-items: center; gap: 40px;
          min-height: 140px; padding: 18px 34px 18px 22px; background: #fbf0dc; border-top: 1px solid #e3cfa3;
          box-shadow: 0 -16px 40px -24px rgba(0,0,0,.35); animation: bxFade .2s ease;
        }
        .bs-cookie__txt { flex: 1; max-width: 620px; }
        .bs-cookie__txt strong { display: block; font-size: 14px; line-height: 18px; font-weight: 700; color: #14231a; }
        .bs-cookie__txt p { margin: 2px 0 0; font-size: 13px; line-height: 17.5px; color: #6b5a3a; }
        .bs-cookie__txt b { font-size: 14px; font-weight: 700; }
        .bs-cookie__txt a { font-weight: 600; color: #103b2a; }
        .bs-cookie__btns { display: flex; gap: 11px; flex-shrink: 0; margin-left: auto; margin-right: 170px; }
        .bs-cookie__ess, .bs-cookie__all { height: 40px; padding: 0 16px; border-radius: 12px; font-size: 13px; font-weight: 700; }
        .bs-cookie__ess { border: 1px solid #e3cfa3; background: #fbf0dc; color: #14231a; }
        .bs-cookie__all { border: 0; background: #123524; color: #fff; }

        /* Drawer (mobile) */
        .bs-drawer {
          position: fixed; inset: 0; z-index: 95; overflow-y: auto; padding: 0 16px 24px; color: #fbf3e2;
          background: linear-gradient(180deg, rgba(10,34,25,.9) 0%, rgba(10,34,25,.55) 45%, rgba(10,34,25,.75) 75%, rgba(10,34,25,.95) 100%), url("/creater/forest-gate.jpg") center 60% / cover, #0f2e22;
          animation: bxFade .18s ease;
        }
        .bs-drawer__head { position: relative; display: flex; align-items: center; justify-content: center; height: 64px; }
        .bs-drawer__head button { position: absolute; left: 10px; border: 0; background: none; color: #fbf3e2; font-size: 22px; line-height: 29px; padding: 0; }
        .bs-drawer__av { position: absolute; right: -6px; width: 44px; height: 44px; border-radius: 50%; border: 2px solid #c79a3c; overflow: hidden; }
        .bs-drawer__av img { width: 100%; height: 100%; object-fit: cover; }
        .bs-drawer__search { display: flex; align-items: center; gap: 10px; width: 100%; height: 42px; margin-top: 10px; padding: 0 14px 0 18px; border-radius: 14px; border: 1px solid rgba(232,176,74,.6); background: rgba(10,34,25,.65); color: #d9cdb2; font-family: Inter, var(--bx-sans); font-size: 13px; font-weight: 500; }
        .bs-drawer__search kbd { margin-left: auto; font-family: var(--bx-sans); font-size: 10.5px; font-weight: 600; padding: 3px 6px; border-radius: 6px; background: rgba(255,255,255,.14); color: #d9cdb2; }
        .bs-drawer__next { display: block; margin-top: 14px; padding: 12px 18px 14px; border-radius: 16px; border: 1.5px solid rgba(232,176,74,.85); background: rgba(10,34,25,.6); }
        .bs-drawer__next strong { display: flex; align-items: center; gap: 8px; font-family: var(--bx-serif); font-size: 18px; line-height: 22px; font-weight: 600; }
        .bs-drawer__next small { display: flex; align-items: center; gap: 8px; margin-top: 6px; font-size: 13.5px; font-weight: 700; }
        .bs-drawer__next small i { width: 8px; height: 8px; border-radius: 50%; background: var(--bx-red-2); }
        .bs-drawer__next em { display: block; padding-left: 16px; font-style: normal; font-size: 13px; color: #d9cdb2; }
        .bs-drawer__group p { margin: 22px 10px 10px; font-size: 10.5px; font-weight: 700; letter-spacing: 1.3px; text-transform: uppercase; color: #f6d98b; }
        .bs-drawer__group a { display: flex; align-items: center; gap: 15px; height: 44px; margin-bottom: 4px; padding: 0 14px; border-radius: 12px; font-size: 14.5px; font-weight: 500; background: rgba(255,255,255,.04); }
        .bs-drawer__group a span { width: 16px; font-size: 16px; color: #c9bc98; }
        .bs-drawer__group a.is-active { background: rgba(255,255,255,.09); font-weight: 700; }
        .bs-rumi--drawer { margin-top: 22px; height: 64px; padding: 0 12px; }
        .bs-drawer__out { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 44px; margin-top: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,.18); background: none; color: #ffb4a0; font-weight: 700; }

        /* ---------- Tablet ---------- */
        @media (max-width: 1180px) { .bs-search { left: 22px; width: min(520px, calc(100% - 160px)); } }
        @media (max-width: 1023px) {
          .bs-side { width: 76px; padding: 14px 10px; align-items: center; }
          .bs-side__top, .bs-side__bottom { width: 100%; display: flex; flex-direction: column; align-items: center; }
          .bs-logo { transform: scale(.62); transform-origin: center; margin: -4px -30px; }
          .bs-next { justify-content: center; padding: 9px; margin-top: 14px; }
          .bs-next__txt, .bs-nav__label, .bs-nav__txt, .bs-rumi span, .bs-me span:last-child { display: none; }
          .bs-nav { width: 100%; }
          .bs-nav__group { padding-top: 8px; margin-top: 8px; border-top: 1px solid rgba(255,255,255,.08); }
          .bs-nav__item { justify-content: center; padding: 0; height: 42px; }
          .bs-nav__ic { font-size: 17px; width: auto; }
          .bs-nav__dot { left: auto; right: 14px; }
          .bs-rumi, .bs-me { justify-content: center; padding: 6px; height: auto; }
          .bs-main { margin-left: 76px; }
          .bs-dash, .bs-cookie { left: 76px; }
          .bs-content, .bs-dash__in { padding-left: 20px; padding-right: 20px; }
          .bs-search { left: 20px; }
          .bs-top__right { right: 20px; }
          .bs-cookie__btns { margin-right: 0; }
          .bs-cmd { left: calc(50% - 280px); }
        }

        /* ---------- Mobile: header + footer fixed ---------- */
        @media (max-width: 767px) {
          .bs-side { display: none; }
          .bs-main { margin-left: 0; }
          .bs--forest { background: linear-gradient(180deg, rgba(10,34,25,.35), rgba(10,34,25,.55)), url("/creater/forest-gate.jpg") center 30% / cover fixed, #0f2e22; }
          .bs-top {
            position: fixed; left: 0; right: 0; top: 0; height: 64px;
            background: linear-gradient(180deg, rgba(10,34,25,.15), rgba(10,34,25,.35)), url("/creater/forest-gate.jpg") 45% 44% / 120% auto, #0f2e22;
            border-bottom: 1px solid rgba(232,176,74,.25);
          }
          .bs-burger { display: grid; place-items: center; position: absolute; left: 14px; top: 13px; width: 38px; height: 38px; border: 0; background: none; color: #fbf3e2; font-size: 20px; }
          .bs-mlogo { display: inline-flex; position: absolute; left: 50%; top: 22px; transform: translateX(-50%); }
          .bs-mlogo .bl-word { letter-spacing: 1.2px; }
          .bs-search { display: none; }
          .bs-bell { width: 34px; height: 34px; border-color: rgba(232,176,74,.55); background: rgba(10,34,25,.45); color: #fbf3e2; }
          .bs-bell i { top: 6px; right: 7px; border-color: #10301f; }
          .bs-top__right { gap: 8px; }
          .bs-top__right { right: 10px; top: 10px; }
          .bs-content { padding: 78px 16px 104px; }
          .bs-alerts { position: fixed; left: 18px; right: 18px; top: 68px; width: auto; padding: 16px 18px 18px; }
          .bs-alerts__head { gap: 10px; }
          .bs-alerts__empty { margin-top: 24px; padding: 0 20px; }
          .bs-dash { left: 0; top: 64px; bottom: 78px; background: transparent; }
          .bs--paper .bs-dash { background: url("/creater/parchment.jpg") center / cover fixed, var(--bx-paper); }
          .bs--forest .bs-dash { background: linear-gradient(180deg, rgba(10,34,25,.45), rgba(10,34,25,.65)), url("/creater/forest-gate.jpg") center 30% / cover fixed, #0f2e22; }
          .bs-dash__in { padding: 16px 16px 30px; }
          .bs-dash__row { grid-template-columns: 1fr; }
          .bs-dcard--of { padding: 12px; }
          .bs-dof { flex-wrap: wrap; border-radius: 18px; padding: 10px 10px 10px 14px; row-gap: 6px; }
          .bs-dof__add { margin-left: auto; }
          .bs-dprof { flex-direction: column; align-items: flex-start; }
          .bs-dhead { color: #c9bc98; }
          .bs--forest .bs-dhead b { color: #f4e8ce; }
          .bs-dtiles { grid-template-columns: 1fr 1fr; gap: 13px; }
          .bs-dtile { padding: 14px 16px; }
          .bs-avail { gap: 6px; flex-wrap: nowrap; }
          .bs-avail button { padding: 0 11px; white-space: nowrap; }

          .bs-bnav {
            position: fixed; left: 0; right: 0; bottom: 0; z-index: 35; display: grid; grid-template-columns: repeat(5, 1fr); align-items: end;
            height: 78px; padding: 0 0 calc(15px + env(safe-area-inset-bottom)); background: #10301f; border-top: 1px solid rgba(232,176,74,.3);
          }
          .bs-bnav a, .bs-bnav button { display: flex; flex-direction: column; align-items: center; gap: 6px; border: 0; background: none; font-size: 13px; line-height: 17px; font-weight: 400; color: #f3e6c8; }
          .bs-bnav a span { width: 48px; height: 34px; border-radius: 10px; display: grid; place-items: center; border: 1.5px solid transparent; color: #f3e6c8; }
          .bs-bnav a.is-active span { border-color: rgba(232,176,74,.85); background: rgba(232,176,74,.12); }
          .bs-bnav__rumi img { width: 66px; height: 66px; margin-top: -40px; margin-bottom: -4px; padding: 3px; border-radius: 50%; object-fit: contain; background: radial-gradient(circle, #2c5c42 0%, #163d2b 75%); border: 3px solid #e8b04a; box-shadow: 0 0 0 2px #10301f, 0 6px 14px -4px rgba(0,0,0,.6); }
          .bs-bnav__rumi.is-active { color: #f6d98b !important; font-weight: 700 !important; }

          .bs-tip {
            position: fixed; left: 46px; right: 46px; bottom: 120px; z-index: 34; display: flex; align-items: center; gap: 10px;
            padding: 12px 14px 12px 16px; border-radius: 14px; background: #fff8e6; border: 1.5px solid #e8b04a;
            box-shadow: 0 14px 30px -16px rgba(0,0,0,.6); animation: bxPop .2s ease;
          }
          .bs-tip { max-width: none; align-items: center; }
          .bs-float { display: none; }
          .bs-tip::before { left: 50%; right: auto; bottom: -8px; margin-left: -6px; border: 0; border-right: 1.5px solid #e8b04a; border-bottom: 1.5px solid #e8b04a; }
          .bs-tip p { flex: 1; margin: 0; font-family: var(--bx-serif); font-style: italic; font-size: 13.5px; line-height: 18.2px; color: #14231a; }
          .bs-tip b { margin-right: 3px; font-style: normal; font-weight: 700; color: #b8452f; }
          .bs-tip button { align-self: flex-start; border: 0; background: none; color: #8a7a5a; padding: 0 2px; font-family: var(--bx-jak); font-size: 20px; line-height: 20px; }

          .bs-cmdwrap { background: rgba(10,25,18,.45); }
          .bs-cmd { left: 0; right: 0; top: 100px; width: auto; border-radius: 16px; }
          .bs-cmd li a { padding: 0 20px; }

          .bs-sheetwrap { bottom: 78px; }
          .bs-sheet {
            left: 16px; right: 16px; top: auto; bottom: 0; width: auto; max-height: calc(100vh - 160px);
            border-radius: 22px 22px 0 0; border: 1.5px solid rgba(232,176,74,.8); border-bottom: 0; animation: bsUp .22s ease;
          }
          @keyframes bsUp { from { transform: translateY(30px); opacity: 0; } to { transform: none; opacity: 1; } }
          .bs-sheet__grab { display: block; width: 46px; height: 4px; margin: 8px auto 0; border-radius: 4px; background: rgba(251,243,226,.5); }
          .bs-sheet__head { padding: 6px 10px 0 14px; align-items: flex-start; }
          .bs-sheet__head img { width: 58px; height: 50px; border-right: 0; padding-right: 0; }
          .bs-sheet__body { padding: 14px 12px 12px; }
          .bs-sheet__hey { font-size: 14px; padding: 9px 18px; }
          .bs-sheet__quick button { font-size: 12px; line-height: 15px; padding: 7px 10px 7px 12px; }
          .bs-sheet__ask { margin: 0 12px 14px; }
          .bs-sheet__ask input { font-size: 16px; }

          .bs-cookie {
            left: 0; bottom: 0; z-index: 110; flex-direction: column; align-items: stretch; gap: 12px;
            min-height: 0; padding: 16px 18px calc(22px + env(safe-area-inset-bottom)); border-radius: 0;
          }
          .bs-cookie__btns { margin: 0; gap: 10px; }
          .bs-cookie__btns > * { flex: 1; height: 40px; }
        }
      `}</style>
    </div>
  );
}
