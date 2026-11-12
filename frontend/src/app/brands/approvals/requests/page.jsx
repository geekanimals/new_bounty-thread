"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import ApprovalTabs from "@/components/brands/ApprovalTabs";
import { getCampaign, ACCOUNT_MANAGER, USER } from "@/components/brands/data";
import { Check, Chat, Send, Calendar, Users, Target, Film, Wallet, Sparkle, FileText } from "@/components/ui/Icons";

// Geek ka bheja hua plan + quote (dummy)
const SUMMARY = [
  { icon: Target, label: "Goal", value: "Sales" },
  { icon: Users, label: "Creators", value: "~30 · 50K–200K followers" },
  { icon: Film, label: "Content", value: "1 Reel + 2 Stories each" },
  { icon: Wallet, label: "Budget", value: "₹6,00,000" },
  { icon: Calendar, label: "Dates", value: "15 Nov – 15 Dec 2026" },
];
const QUOTE = [
  { item: "Creator fees — 30 creators (Reels + Stories)", amount: "₹4,20,000" },
  { item: "Campaign management (Geek)", amount: "₹60,000" },
  { item: "Content rights — 90 days", amount: "₹28,474" },
];
const PLAN = [
  "Week 1 — Geek shortlists 40 bridal & makeup creators, you approve ~30",
  "Week 2 — products ship, creators send videos for your OK",
  "Weeks 3–4 — posts go live in waves around the wedding dates",
  "Live numbers in Campaigns; final report on 18 Dec",
];
const START_THREAD = [
  { me: false, text: "Hi Priya! Plan and quote for Wedding Season Looks are ready. Happy to tweak anything before we start.", time: "Yesterday, 6:40 pm" },
];

/** /brands/approvals/requests — campaign request ka Geek plan + quote approve karo */
export default function CampaignRequests() {
  const c = getCampaign("wedding-season-looks");
  const [approved, setApproved] = useState(false);
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState("");
  const [thread, setThread] = useState(START_THREAD);
  const chatRef = useRef(null);

  // Mobile par chat neeche hai — button dabane par wahan scroll
  const openAsk = () => {
    setAsking(true);
    setTimeout(() => chatRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const send = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const now = new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    setThread((m) => [...m, { me: true, text: t, time: `Today, ${now}` }]);
    setText("");
    setTimeout(() => {
      setThread((m) => [...m, { me: false, text: "Got it — I’ll update the plan and reply here within 2 hours.", time: `Today, ${now}` }]);
    }, 900);
  };

  return (
    <BrandShell>
      <title>Campaign requests — Geek OS Brand</title>
      <ApprovalTabs />

      <div className="rq-grid">
        <article className="br-card rq-card">
          <div className="rq-cover" style={{ background: c.hero }}>
            <span className={`rq-status ${approved ? "is-ok" : ""}`}>
              {approved ? <Check size={12} /> : <Sparkle size={12} />}
              {approved ? "Plan approved — Geek is starting" : "Geek replied — plan & quote ready"}
            </span>
            <h2>{c.title}</h2>
            <p>
              {c.product} · requested by {USER.name}
            </p>
          </div>

          <div className="rq-body">
            <h3 className="rq-h">Your request</h3>
            <div className="rq-sum">
              {SUMMARY.map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <span>
                    <Icon size={14} />
                  </span>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <h3 className="rq-h">Geek’s plan</h3>
            <ol className="rq-plan">
              {PLAN.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>

            <h3 className="rq-h">Quote</h3>
            <div className="rq-quote">
              {QUOTE.map((q) => (
                <p key={q.item}>
                  <span>{q.item}</span>
                  <strong>{q.amount}</strong>
                </p>
              ))}
              <p className="rq-quote__sub">
                <span>Subtotal</span>
                <strong>₹5,08,474</strong>
              </p>
              <p className="rq-quote__sub">
                <span>GST 18%</span>
                <strong>₹91,526</strong>
              </p>
              <p className="rq-quote__total">
                <span>Total</span>
                <strong>₹6,00,000</strong>
              </p>
              <small>Billed in 3 milestones — 40% at start, 40% when half the posts are live, 20% at the report.</small>
            </div>

            {approved ? (
              <div className="rq-done">
                <span>
                  <Check size={16} />
                </span>
                <div>
                  <strong>Plan & quote approved</strong>
                  <small>Geek is shortlisting creators — they’ll show up in Approvals within 48 hours. First bill comes after you approve creators.</small>
                </div>
                <Link href={`/brands/campaigns/${c.id}`} className="br-btn br-btn--ghost br-btn--sm">
                  Open campaign
                </Link>
              </div>
            ) : (
              <div className="rq-actions">
                <button type="button" className="br-btn br-btn--ghost" onClick={openAsk}>
                  <Chat size={14} /> Ask Geek a question
                </button>
                <button type="button" className="br-btn br-btn--primary" onClick={() => setApproved(true)}>
                  <Check size={14} /> Approve plan &amp; quote
                </button>
              </div>
            )}
          </div>
        </article>

        <aside className="rq-side">
          <div className="br-card rq-am">
            <span className="br-av" style={{ background: ACCOUNT_MANAGER.av }}>
              {ACCOUNT_MANAGER.initials}
            </span>
            <span>
              <strong>{ACCOUNT_MANAGER.name}</strong>
              <small>Your Geek account manager · {ACCOUNT_MANAGER.note.toLowerCase()}</small>
            </span>
          </div>

          <div className="br-card rq-chat" ref={chatRef}>
            <div className="br-card__head">
              <div>
                <h3 className="br-card__title">Questions</h3>
                <p className="br-card__sub">Replies here and on WhatsApp</p>
              </div>
            </div>
            <div className="rq-thread">
              {thread.map((m, i) => (
                <p key={i} className={m.me ? "is-me" : ""}>
                  {m.text}
                  <small>{m.time}</small>
                </p>
              ))}
            </div>
            {(asking || thread.length > 1) && (
              <form className="rq-form" onSubmit={send}>
                <textarea
                  className="br-input"
                  rows={3}
                  value={text}
                  autoFocus={asking}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. Can we add 5 more creators from Jaipur?"
                />
                <button type="submit" className="br-btn br-btn--primary br-btn--sm" disabled={!text.trim()}>
                  <Send size={13} /> Send
                </button>
              </form>
            )}
            {!asking && thread.length === 1 && (
              <button type="button" className="br-btn br-btn--soft br-btn--block" onClick={openAsk}>
                Ask a question
              </button>
            )}
          </div>

          <div className="br-card rq-files">
            <h3 className="br-card__title">Attached by Geek</h3>
            <p>
              <FileText size={14} /> Wedding Season plan.pdf <small>1.8 MB</small>
            </p>
            <p>
              <FileText size={14} /> Quote GEEK-Q-0217.pdf <small>220 KB</small>
            </p>
          </div>
        </aside>
      </div>

      <style>{`
        .rq-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 18px; align-items: start; }
        .rq-card { overflow: hidden; }
        .rq-cover { padding: 24px; color: #fff; }
        .rq-status { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 11px; border-radius: 999px; background: rgba(255,255,255,.92); color: var(--br-orange); font-size: 11.5px; font-weight: 700; }
        .rq-status.is-ok { color: var(--br-green); }
        .rq-cover h2 { margin: 12px 0 4px; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
        .rq-cover p { margin: 0; font-size: 13px; color: rgba(255,255,255,.85); }
        .rq-body { padding: 22px 24px 24px; }
        .rq-h { margin: 0 0 10px; font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--br-faint); }
        .rq-h:not(:first-child) { margin-top: 22px; }
        .rq-sum { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); gap: 10px; }
        .rq-sum div { padding: 12px; border-radius: 12px; background: #f6f6fa; }
        .rq-sum span { width: 26px; height: 26px; border-radius: 8px; background: #fff; color: var(--br-primary); display: grid; place-items: center; margin-bottom: 8px; }
        .rq-sum small { display: block; font-size: 11.5px; color: var(--br-muted); }
        .rq-sum strong { display: block; font-size: 13.5px; font-weight: 700; }
        .rq-plan { margin: 0; padding-left: 20px; display: grid; gap: 7px; font-size: 13.5px; line-height: 1.5; color: var(--br-text); }
        .rq-quote { border: 1px solid var(--br-border); border-radius: 14px; padding: 6px 16px 14px; }
        .rq-quote p { display: flex; justify-content: space-between; gap: 14px; margin: 0; padding: 10px 0; border-bottom: 1px solid var(--br-border); font-size: 13.5px; }
        .rq-quote p strong { white-space: nowrap; }
        .rq-quote__sub { color: var(--br-muted); }
        .rq-quote__total { font-size: 15px !important; border-bottom: 0 !important; }
        .rq-quote__total strong { font-size: 18px; font-weight: 800; }
        .rq-quote small { display: block; font-size: 12px; color: var(--br-muted); line-height: 1.5; }
        .rq-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
        .rq-done { display: flex; align-items: center; gap: 12px; margin-top: 20px; padding: 14px; border-radius: 14px; background: var(--br-green-bg); flex-wrap: wrap; }
        .rq-done > span { width: 34px; height: 34px; border-radius: 50%; background: var(--br-green); color: #fff; display: grid; place-items: center; flex-shrink: 0; }
        .rq-done div { flex: 1; min-width: 200px; }
        .rq-done strong { display: block; font-size: 14px; }
        .rq-done small { display: block; font-size: 12.5px; color: var(--br-text); line-height: 1.5; }

        .rq-side { display: grid; gap: 14px; }
        .rq-am { display: flex; align-items: center; gap: 12px; padding: 16px; }
        .rq-am strong { display: block; font-size: 14px; }
        .rq-am small { display: block; font-size: 12px; color: var(--br-muted); }
        .rq-chat { padding: 18px; }
        .rq-chat .br-card__head { margin-bottom: 12px; }
        .rq-thread { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; max-height: 320px; overflow-y: auto; }
        .rq-thread p { margin: 0; max-width: 88%; padding: 10px 12px 6px; border-radius: 12px; background: #f1f2f7; font-size: 13px; line-height: 1.5; align-self: flex-start; }
        .rq-thread p.is-me { align-self: flex-end; background: linear-gradient(135deg, #6d4aff, #8b5cf6); color: #fff; }
        .rq-thread small { display: block; margin-top: 3px; font-size: 10.5px; opacity: .7; text-align: right; }
        .rq-form { display: grid; gap: 8px; }
        .rq-form .br-btn { justify-self: end; }
        .rq-files { padding: 18px; }
        .rq-files .br-card__title { margin-bottom: 8px; }
        .rq-files p { display: flex; align-items: center; gap: 8px; margin: 0; padding: 10px 0; border-top: 1px solid var(--br-border); font-size: 13px; font-weight: 600; }
        .rq-files p small { margin-left: auto; font-weight: 500; color: var(--br-faint); }

        @media (max-width: 1100px) { .rq-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .rq-cover { padding: 20px; }
          .rq-cover h2 { font-size: 22px; }
          .rq-body { padding: 18px; }
          .rq-sum { grid-template-columns: 1fr 1fr; }
          .rq-actions .br-btn { flex: 1; }
        }
      `}</style>
    </BrandShell>
  );
}
