"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import { useBrand, brandView, uniq, stepCount, totalCreators, isLive, STATUS_LABEL, fdate } from "@/services/brand";
import { Sparkle, Send, ArrowRight, Megaphone, CheckSquare, BarChart, Rupee } from "@/components/ui/Icons";

// Purane brand portal mein AI nahi tha — ye jawab brand ke LIVE numbers (api.brand_portal) se banaye jaate hain, koi AI call nahi.
function answer(q, v) {
  const s = q.toLowerCase();
  const C = v.campaigns;
  const live = C.filter(isLive);
  if (s.includes("cheap") || s.includes("cost") || s.includes("views per")) {
    return {
      text: "Cost per view needs each creator's fee, which isn't in your portal yet — coming soon. Meanwhile, campaign analytics show views and likes for every creator.",
      link: { href: "/brands/campaigns", label: "Open campaigns" },
    };
  }
  const c = C.find((x) => s.includes(String(x.name || "").toLowerCase())) || (s.includes("summar") ? C[0] : null);
  if (c) {
    const t = totalCreators(c);
    return {
      text: `${c.name} — ${STATUS_LABEL[c.status] || c.status || ""}. ${t} creator${t === 1 ? "" : "s"}: ${stepCount(c, "to_approve")} to approve, ${stepCount(c, "approved")} approved, ${stepCount(c, "shipped")} making videos, ${stepCount(c, "video_review")} video${stepCount(c, "video_review") === 1 ? "" : "s"} to review, ${stepCount(c, "posted")} posted (${Number(c.posts) || 0} posts live)${c.ends_on ? `. Runs till ${fdate(c.ends_on)}` : ""}.`,
      link: { href: `/brands/campaigns/${c.campaign_id}`, label: "Open campaign" },
    };
  }
  if (s.includes("approve") || s.includes("first") || s.includes("waiting")) {
    const nV = v.videos.length;
    const nA = v.toApprove.length;
    if (!nA && !nV) return { text: "Nothing is waiting for you right now — you're all caught up.", link: { href: "/brands/approvals", label: "Open approvals" } };
    return {
      text: `${nV ? `Start with the ${nV} video${nV === 1 ? "" : "s"} to review (${uniq(v.videos.map((x) => (x.creator && (x.creator.name || x.creator.username)) || "")).join(", ")}) — nothing posts without your OK. ` : ""}${nA ? `Then ${nA} creator${nA === 1 ? "" : "s"} to approve for ${uniq(v.toApprove.map((x) => x.campaign)).join(", ")}.` : ""}`,
      link: { href: nV ? "/brands/approvals/videos" : "/brands/approvals", label: nV ? "Review videos" : "Review creators" },
    };
  }
  if (s.includes("week") || s.includes("doing") || s.includes("campaign")) {
    return {
      text: live.length
        ? `${live.length} campaign${live.length === 1 ? " is" : "s are"} live: ${live.map((x) => `${x.name} (${Number(x.posts) || 0} posts, ${stepCount(x, "posted")}/${totalCreators(x)} creators posted)`).join(", ")}.`
        : `No campaign is live right now — ${C.length} in total.`,
      link: { href: "/brands/campaigns", label: "See all campaigns" },
    };
  }
  return {
    text: "I can answer from your live numbers: how your campaigns are doing, what's waiting for your approval, or a summary of any campaign — type its name.",
  };
}

/** /brands/assistant — campaigns ke baare mein poocho; jawab live portal numbers se (AI backend abhi nahi) */
export default function BrandAssistant() {
  const b = useBrand();
  const v = brandView(b);
  const SUGGESTIONS = [
    { q: "Which creator gave the cheapest views?", icon: Rupee },
    { q: v.campaigns[0] ? `Summarise ${v.campaigns[0].name}` : "Summarise my campaign", icon: Megaphone },
    { q: "What should I approve first?", icon: CheckSquare },
    { q: "How are my campaigns doing this week?", icon: BarChart },
  ];
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
      setMsgs((m) => [...m, { me: false, ...answer(t, v) }]);
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
                <h2>Hi {v.user.first}, what do you want to know?</h2>
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
