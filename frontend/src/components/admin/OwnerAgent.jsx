"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { rpc } from "@/lib/supabase";

/**
 * Owner Agent (✨ AI assistant panel ka andar wala hissa) — bilkul purane app ka "builtInAnswer" (non-creator):
 *  koi bahar ka AI nahi, koi API key nahi — campaign ke kaam ke short how-to jawab, Hinglish poocho to Hinglish mein.
 *  Upar ki 3 lines asli numbers se: api.nav_counts (decide / review) + api.ops_auto_messages (auto ON/OFF).
 *
 * AdminShell mein lagana: Owner Agent panel ke andar `.as-agent__msgs` div + `.as-agent__ask` form ki jagah
 *   <OwnerAgent name={first} />
 * (CSS classes wahi hain jo AdminShell mein already hain.)
 */

const norm = (s) => " " + String(s || "").toLowerCase().replace(/[^\p{L}\p{N}@#\s]/gu, " ").replace(/\s+/g, " ").trim() + " ";
function isHinglish(q) {
  if (/[ऀ-ॿ]/.test(q)) return true;
  return / (kya|kab|kaise|kaisa|kitna|kitne|hai|hain|mera|mere|mujhe|muje|karna|karu|karun|bhai|nahi|kaha|kahan|aayega|ayega|milega|milenge|milta|paise|paisa|chahiye|bata|batao|samjhao|abhi|kyu|kyun|hoga|hogi|kar|karo|bhejna|bheju|dikhana|bolna|kaun|kitni) /.test(norm(q));
}

/* purane builtInAnswer ke rules — wahi text; href = naye panel mein wo page */
function answer(text) {
  const hi = isHinglish(text);
  const T = (h, e) => (hi ? h : e);
  const q = text.toLowerCase();
  if (/delete|hata|remove/.test(q))
    return {
      a: T("Campaign kholo → **🗑 Request delete** dabao aur wajah likho. Super Admin approve karega tab campaign delete hoga.", "Open the campaign → tap **🗑 Request delete** and add a reason. It's deleted once the Super Admin approves."),
      href: "/admin/settings/delete-requests",
    };
  if (/bulk|sheet|upload|excel|csv/.test(q))
    return {
      a: T(
        "Campaign kholo → **📥 Bulk upload creators**. Wahan sheet ka template aur guide hai — naam, WhatsApp, email, Instagram aur har creator ka **Status** (Invited · Approved · Contract signed · Address confirmed · Courier sent · Courier received), address aur courier bharo.",
        "Open the campaign → **📥 Bulk upload creators**. The sheet template and guide are there — name, WhatsApp, email, Instagram and each creator's **Status** (Invited · Approved · Contract signed · Address confirmed · Courier sent · Courier received), plus address and courier."
      ),
      href: "/admin/campaigns",
    };
  if (/invite|creator dh|find|discover|search/.test(q))
    return { a: T("**Discover** mein category / followers se creators dhoondo, ya campaign mein **🎯 Invite creators** dabao.", "Use **Discover** to find creators by category / followers, or tap **🎯 Invite creators** in a campaign."), href: "/admin/discovery" };
  if (/new campaign|campaign bana|create campaign|naya campaign/.test(q))
    return { a: T("**Campaigns → New campaign** — brand, product, deliverables, brief aur contract terms bharo. Phir creators jodo.", "**Campaigns → New campaign** — fill brand, product, deliverables, brief and contract terms, then add creators."), href: "/admin/campaigns/new" };
  if (/whatsapp|message|template|notification/.test(q))
    return {
      a: T(
        "Har step ka update creators ko WhatsApp + email + app pe apne aap jaata hai. Delivery status Super Admin → **WhatsApp & email** mein dikhta hai.",
        "Every step's update reaches creators on WhatsApp + email + the app automatically. Delivery status is in Super Admin → **WhatsApp & email**."
      ),
      href: "/admin/messaging",
    };
  return {
    a: T(
      "Main campaigns mein madad karta hoon: naya campaign, creators jodna (bulk upload / invite), process aur delete request. Kya karna hai, likho.",
      "I help with campaigns: creating one, adding creators (bulk upload / invite), the process and delete requests. Tell me what you need."
    ),
  };
}
/* **bold** → <b> (baaki text jaisa hai) */
const rich = (t) => String(t).split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : p));

const CHIPS = ["How do I start a new campaign?", "How do I bulk upload creators?", "Is every WhatsApp update reaching creators?"];

export default function OwnerAgent({ name = "" }) {
  const [chat, setChat] = useState([]);
  const [ask, setAsk] = useState("");
  const [facts, setFacts] = useState(null);
  const end = useRef(null);

  useEffect(() => {
    let alive = true;
    Promise.all([rpc("admin", "api.nav_counts"), rpc("admin", "api.ops_auto_messages")]).then(([n, a]) => {
      if (!alive) return;
      const c = n.data || {};
      setFacts({ applicants: Number(c.applicants) || 0, reviews: Number(c.reviews) || 0, autoOff: a.data && a.data.auto_on === false });
    });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (chat.length) end.current?.scrollIntoView({ block: "nearest" });
  }, [chat]);

  const send = (text) => {
    const t = (text ?? ask).trim();
    if (!t) return;
    const r = answer(t);
    setChat((c) => [...c, { me: true, text: t }, { me: false, text: r.a, href: r.href }]);
    setAsk("");
  };

  return (
    <>
      <div className="as-agent__msgs">
        <p className="as-agent__bot">
          Hi {name || "there"} — ask me anything about growing on Geek OS, or what to do next.
          {facts && facts.applicants > 0 && (
            <>
              <br />• {facts.applicants} creator{facts.applicants > 1 ? "s are" : " is"} waiting for a decision
            </>
          )}
          {facts && facts.reviews > 0 && (
            <>
              <br />• {facts.reviews} video{facts.reviews > 1 ? "s need" : " needs"} review
            </>
          )}
          {facts && facts.autoOff && (
            <>
              <br />• WhatsApp auto messages are off
            </>
          )}
        </p>
        <div className="as-agent__chips">
          {CHIPS.map((c) => (
            <button key={c} type="button" onClick={() => send(c)}>
              {c}
            </button>
          ))}
        </div>
        {chat.map((m, i) => (
          <p key={i} className={m.me ? "as-agent__me" : "as-agent__bot"}>
            {m.me ? m.text : rich(m.text)}
            {m.href && (
              <>
                {" "}
                <Link href={m.href}>Open →</Link>
              </>
            )}
          </p>
        ))}
        <span ref={end} />
      </div>
      <form
        className="as-agent__ask"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input className="ad-input" value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Ask the Owner Agent..." aria-label="Ask the Owner Agent" />
        <button type="submit" className="ad-btn ad-btn--primary" disabled={!ask.trim()}>
          Send
        </button>
      </form>
    </>
  );
}
