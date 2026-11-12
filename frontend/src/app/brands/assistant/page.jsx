"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import { USER, CAMPAIGNS, getCampaign, CREATORS } from "@/components/brands/data";
import { Sparkle, Send, ArrowRight, Megaphone, CheckSquare, BarChart, Rupee } from "@/components/ui/Icons";

const SUGGESTIONS = [
  { q: "Which creator gave the cheapest views?", icon: Rupee },
  { q: "Summarise Festive Glow Edit", icon: Megaphone },
  { q: "What should I approve first?", icon: CheckSquare },
  { q: "How are my campaigns doing this week?", icon: BarChart },
];

// Dummy jawab — backend banne par yahan AI se jawab aayega
function answer(q) {
  const s = q.toLowerCase();
  if (s.includes("cheap") || s.includes("cost") || s.includes("views per")) {
    return {
      text: "Pooja Nair gives the cheapest views right now — about ₹383 per 1K views (₹31K fee, 81K avg reel views). Meera Iyer is close at ₹396 and has already done 2.1M views for Nykaa.",
      link: { href: "/brands/discovery/compare", label: "Compare them side by side" },
    };
  }
  if (s.includes("festive") || s.includes("summar")) {
    const c = getCampaign("festive-glow-edit");
    return {
      text: `${c.title} is live with ${c.postsLive}/${c.postsPlanned} posts up. ${c.views} views (18% ahead of the 1.37M goal), ${c.eng} engagement and ${c.sales} in tracked sales. Meera Iyer’s reel leads with 842K views. 2 videos still need your OK.`,
      link: { href: "/brands/campaigns/festive-glow-edit/analytics", label: "Open analytics" },
    };
  }
  if (s.includes("approve") || s.includes("first")) {
    return {
      text: "Start with the 2 videos due today (Meera Iyer and Tanvi Shah) — nothing posts without your OK. Then the 7 creators for Festive Glow Edit: Aisha Khan and Meera Iyer are the strongest fit for your buyers.",
      link: { href: "/brands/approvals/videos", label: "Review videos" },
    };
  }
  if (s.includes("week") || s.includes("doing") || s.includes("campaign")) {
    const live = CAMPAIGNS.filter((c) => c.status === "live");
    return {
      text: `${live.length} campaigns are live: ${live.map((c) => `${c.title} (${c.views} views)`).join(", ")}. Total views are up 31% this week and link clicks hit 14.2K. Wedding Season Looks is with Geek — plan and quote are ready for you.`,
      link: { href: "/brands/campaigns", label: "See all campaigns" },
    };
  }
  const match = CREATORS.find((c) => s.includes(c.name.split(" ")[0].toLowerCase()));
  if (match) {
    return {
      text: `${match.name} (${match.handle}) — ${match.followers} followers, ${match.eng} engagement, ${match.women} women audience, fee ${match.feeFull} for 1 Reel + 2 Stories. ${match.why}`,
      link: { href: `/brands/creators/${match.id}`, label: `Open ${match.name.split(" ")[0]}’s profile` },
    };
  }
  return {
    text: "I can answer questions about your campaigns, creators, approvals, sales and bills. Try asking which creator drove the most sales, or what’s waiting for you today.",
  };
}

/** /brands/assistant — campaigns ke baare mein kuch bhi poocho */
export default function BrandAssistant() {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, typing]);

  const ask = (q) => {
    const t = q.trim();
    if (!t || typing) return;
    setMsgs((m) => [...m, { me: true, text: t }]);
    setText("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { me: false, ...answer(t) }]);
      setTyping(false);
    }, 700);
  };

  return (
    <BrandShell crumbs={[{ label: "AI Assistant" }]}>
      <title>AI Assistant — Geek OS Brand</title>

      <div className="as">
        <div className="as-head">
          <span className="as-head__ic">
            <Sparkle size={18} />
          </span>
          <div>
            <h1 className="br-h1">AI Assistant</h1>
            <p className="br-sub">Ask about your campaigns, creators, sales and bills — answers come from your live numbers.</p>
          </div>
          {msgs.length > 0 && (
            <button type="button" className="br-btn br-btn--ghost br-btn--sm as-new" onClick={() => setMsgs([])}>
              New chat
            </button>
          )}
        </div>

        <section className="br-card as-chat">
          <div className="as-thread">
            {msgs.length === 0 ? (
              <div className="as-empty">
                <span className="as-empty__ic">
                  <Sparkle size={22} />
                </span>
                <h2>Hi {USER.first}, what do you want to know?</h2>
                <p>Pick a question or type your own.</p>
                <div className="as-sugg">
                  {SUGGESTIONS.map(({ q, icon: Icon }) => (
                    <button key={q} type="button" onClick={() => ask(q)}>
                      <Icon size={14} />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              msgs.map((m, i) => (
                <div key={i} className={`as-msg ${m.me ? "is-me" : ""}`}>
                  {!m.me && (
                    <span className="as-bot">
                      <Sparkle size={12} />
                    </span>
                  )}
                  <div className="as-bubble">
                    <p>{m.text}</p>
                    {m.link && (
                      <Link href={m.link.href} className="as-link">
                        {m.link.label} <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
            {typing && (
              <div className="as-msg">
                <span className="as-bot">
                  <Sparkle size={12} />
                </span>
                <div className="as-bubble as-typing">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}
            <span ref={endRef} />
          </div>

          {msgs.length > 0 && (
            <div className="as-chips" data-scroll>
              {SUGGESTIONS.map(({ q }) => (
                <button key={q} type="button" onClick={() => ask(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            className="as-input"
            onSubmit={(e) => {
              e.preventDefault();
              ask(text);
            }}
          >
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask anything — e.g. which creator drove the most sales?" />
            <button type="submit" className="br-btn br-btn--primary" disabled={!text.trim() || typing} aria-label="Send">
              <Send size={14} />
              <span>Send</span>
            </button>
          </form>
        </section>
      </div>

      <style>{`
        .as { max-width: 920px; }
        .as-head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
        .as-head__ic { width: 44px; height: 44px; flex-shrink: 0; border-radius: 13px; background: linear-gradient(135deg, #7c5cff, #e8336d); color: #fff; display: grid; place-items: center; }
        .as-head > div { flex: 1; min-width: 0; }
        .as-chat { display: flex; flex-direction: column; min-height: 520px; overflow: hidden; }
        .as-thread { flex: 1; display: flex; flex-direction: column; gap: 14px; padding: 22px; max-height: 60vh; overflow-y: auto; }
        .as-empty { margin: auto; text-align: center; padding: 20px 0; }
        .as-empty__ic { width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 16px; background: var(--br-lilac); color: var(--br-primary); display: grid; place-items: center; }
        .as-empty h2 { margin: 0 0 4px; font-size: 19px; font-weight: 800; }
        .as-empty p { margin: 0 0 18px; font-size: 13px; color: var(--br-muted); }
        .as-sugg { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-width: 620px; margin: 0 auto; }
        .as-sugg button {
          display: flex; align-items: center; gap: 10px; padding: 13px 14px; text-align: left;
          border: 1px solid var(--br-border); border-radius: 13px; background: #fff;
          font-size: 13px; font-weight: 600; color: var(--br-ink);
        }
        .as-sugg button svg { flex-shrink: 0; color: var(--br-primary); }
        .as-sugg button:hover { border-color: var(--br-primary); background: #fcfbff; }

        .as-msg { display: flex; align-items: flex-start; gap: 10px; }
        .as-msg.is-me { justify-content: flex-end; }
        .as-bot { width: 28px; height: 28px; flex-shrink: 0; border-radius: 9px; background: linear-gradient(135deg, #7c5cff, #e8336d); color: #fff; display: grid; place-items: center; }
        .as-bubble { max-width: min(600px, 85%); padding: 12px 14px; border-radius: 14px; background: #f3f4f8; }
        .as-bubble p { margin: 0; font-size: 13.5px; line-height: 1.6; }
        .as-msg.is-me .as-bubble { background: linear-gradient(135deg, #6d4aff, #8b5cf6); color: #fff; }
        .as-link { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 12.5px; font-weight: 700; color: var(--br-primary); }
        .as-typing { display: flex; gap: 4px; padding: 14px 16px; }
        .as-typing i { width: 6px; height: 6px; border-radius: 50%; background: var(--br-faint); animation: asDot 1s infinite; }
        .as-typing i:nth-child(2) { animation-delay: .15s; }
        .as-typing i:nth-child(3) { animation-delay: .3s; }
        @keyframes asDot { 0%, 80%, 100% { opacity: .3; } 40% { opacity: 1; } }

        .as-chips { display: flex; gap: 8px; padding: 0 22px 12px; overflow-x: auto; scrollbar-width: none; }
        .as-chips::-webkit-scrollbar { display: none; }
        .as-chips button { flex-shrink: 0; height: 30px; padding: 0 12px; border: 1px solid var(--br-border); border-radius: 999px; background: #fff; font-size: 12px; font-weight: 600; color: var(--br-text); white-space: nowrap; }
        .as-chips button:hover { border-color: var(--br-primary); color: var(--br-primary); }
        .as-input { display: flex; gap: 10px; padding: 14px 16px; border-top: 1px solid var(--br-border); background: #fafafd; }
        .as-input input { flex: 1; min-width: 0; height: 44px; padding: 0 14px; border: 1px solid var(--br-border-2); border-radius: 11px; background: #fff; outline: none; font-size: 13.5px; }
        .as-input input:focus { border-color: var(--br-primary); }
        .as-input .br-btn { height: 44px; }

        @media (max-width: 640px) {
          .as-head { align-items: flex-start; flex-wrap: wrap; }
          .as-new { margin-left: 58px; }
          .as-chat { min-height: 460px; }
          .as-thread { padding: 16px; }
          .as-sugg { grid-template-columns: 1fr; }
          .as-chips { padding: 0 16px 12px; }
          .as-input { padding: 12px; }
          .as-input .br-btn span { display: none; }
          .as-input .br-btn { width: 44px; padding: 0; }
        }
      `}</style>
    </BrandShell>
  );
}
