"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import ApprovalTabs from "@/components/brands/ApprovalTabs";
import { BrLoading, BrEmpty, BrError, useToast } from "@/components/brands/BrandStates";
import { useApprovals, useBrand, brandName, B_REQ, bDate, bHero } from "@/services/brand";
import { Check, Chat, Send, Calendar, Target, Sparkle, Building, Plus } from "@/components/ui/Icons";

/**
 * /brands/approvals/requests — brand ke bheje campaign requests aur Geek team ka jawab
 * (purana paintCampaignList "requests": name, status RS, admin_note). Plan / quote / chat ka backend purane app mein nahi tha → "Coming soon".
 */
export default function CampaignRequests() {
  const a = useApprovals();
  const b = useBrand();
  const me = (b.portal && b.portal.me) || {};
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState("");
  const chatRef = useRef(null);
  const [toast, say] = useToast();

  const openAsk = () => {
    setAsking(true);
    setTimeout(() => chatRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };
  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    say("Coming soon — questions here. For now, message your Geek account manager on WhatsApp.");
  };

  return (
    <BrandShell>
      <title>Campaign requests — Geek OS Brand</title>
      <ApprovalTabs />

      {a.loading ? (
        <BrLoading rows={4} />
      ) : a.error ? (
        <BrError error={a.error} onRetry={a.reload} />
      ) : !a.requests.length ? (
        <BrEmpty title="No campaign requests yet" text="Tell the Geek team about your next campaign — they turn it into a plan and a creator shortlist.">
          {a.can && (
            <Link href="/brands/campaigns/new" className="br-btn br-btn--primary br-btn--sm">
              <Plus size={14} /> Request a campaign
            </Link>
          )}
        </BrEmpty>
      ) : (
        <div className="rq-grid">
          <div className="rq-list">
            {a.requests.map((r) => {
              const ok = r.status === "converted";
              const open = r.status === "new" || r.status === "in_review";
              return (
                <article key={r.request_id} className="br-card rq-card">
                  <div className="rq-cover" style={{ background: bHero(r.request_id) }}>
                    <span className={`rq-status ${ok ? "is-ok" : r.status === "declined" ? "is-no" : ""}`}>
                      {ok ? <Check size={12} /> : <Sparkle size={12} />}
                      {B_REQ[r.status] || r.status}
                    </span>
                    <h2>{r.name}</h2>
                    <p>
                      {brandName(b)}
                      {me.name ? ` · requested by ${me.name}` : ""}
                    </p>
                  </div>

                  <div className="rq-body">
                    <h3 className="rq-h">Your request</h3>
                    <div className="rq-sum">
                      <div>
                        <span>
                          <Target size={14} />
                        </span>
                        <small>Status</small>
                        <strong>{B_REQ[r.status] || r.status}</strong>
                      </div>
                      <div>
                        <span>
                          <Calendar size={14} />
                        </span>
                        <small>Sent on</small>
                        <strong>{bDate(r.created_at)}</strong>
                      </div>
                      <div>
                        <span>
                          <Building size={14} />
                        </span>
                        <small>Brand</small>
                        <strong>{brandName(b)}</strong>
                      </div>
                    </div>

                    <h3 className="rq-h">Geek’s reply</h3>
                    <p className="rq-note">
                      {r.admin_note ||
                        (ok
                          ? "Your campaign is set up — you’ll find it in Campaigns."
                          : r.status === "declined"
                            ? "The Geek team couldn’t take this one up."
                            : "The Geek team has your request — you’ll get a plan and a creator shortlist here, on WhatsApp and by email.")}
                    </p>

                    {ok ? (
                      <div className="rq-done">
                        <span>
                          <Check size={16} />
                        </span>
                        <div>
                          <strong>Campaign set up</strong>
                          <small>Geek’s creator picks show up in Approvals as they join.</small>
                        </div>
                        <Link href="/brands/campaigns" className="br-btn br-btn--ghost br-btn--sm">
                          Open campaigns
                        </Link>
                      </div>
                    ) : open ? (
                      <div className="rq-actions">
                        <button type="button" className="br-btn br-btn--ghost" onClick={openAsk}>
                          <Chat size={14} /> Ask Geek a question
                        </button>
                        <button type="button" className="br-btn br-btn--primary" onClick={() => say("Coming soon — approving the plan & quote here. The Geek team confirms with you directly for now.")}>
                          <Check size={14} /> Approve plan &amp; quote
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="rq-side">
            <div className="br-card rq-am">
              <span className="br-av" style={{ background: "linear-gradient(135deg,#8b5cf6,#c084fc)" }}>
                G
              </span>
              <span>
                <strong>Geek team</strong>
                <small>Your Geek account manager · replies on WhatsApp and email</small>
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
                <p>Hi! Ask anything about your request — dates, creators, budget.</p>
              </div>
              {asking ? (
                <form className="rq-form" onSubmit={send}>
                  <textarea className="br-input" rows={3} value={text} autoFocus onChange={(e) => setText(e.target.value)} placeholder="e.g. Can we add 5 more creators from Jaipur?" />
                  <button type="submit" className="br-btn br-btn--primary br-btn--sm" disabled={!text.trim()}>
                    <Send size={13} /> Send
                  </button>
                </form>
              ) : (
                <button type="button" className="br-btn br-btn--soft br-btn--block" onClick={openAsk}>
                  Ask a question
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {toast}

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
              .rq-list { display: grid; gap: 18px; min-width: 0; }
        .rq-status.is-no { color: var(--br-muted); }
        .rq-note { margin: 0; font-size: 13.5px; line-height: 1.6; color: var(--br-text); white-space: pre-wrap; }
`}</style>
    </BrandShell>
  );
}
