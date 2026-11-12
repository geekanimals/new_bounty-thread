"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CreatorCards from "@/app/admin/creators/cards/page";
import { profileById } from "@/components/admin/creator/profiles";

export const CP_TABS = [
  { k: "profile", label: "👤 Profile" },
  { k: "instagram", label: "📸 Instagram" },
  { k: "campaigns", label: "📣 Campaigns" },
  { k: "intelligence", label: "🧠 Intelligence" },
  { k: "activity", label: "📈 Activity" },
  { k: "media-kit", label: "🪪 Media kit" },
];

/**
 * Creator profile — Figma mein right side drawer (820px) jo Creators (cards) page ke upar khulta hai.
 * Har tab apna route: /admin/creators/[id]/<tab>. Band karo → wapas cards.
 */
export default function CreatorDrawer({ id, tab, children }) {
  const router = useRouter();
  const p = profileById(id);
  const [paused, setPaused] = useState(false);
  const [ask, setAsk] = useState(false);
  const [toast, setToast] = useState("");
  const close = () => router.push("/admin/creators/cards");

  useEffect(() => {
    const k = (e) => e.key === "Escape" && !ask && close();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask]);

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2200);
  };

  return (
    <>
      <CreatorCards snapshot />
      <div className="cdw-wrap" onClick={close}>
        <aside className="cdw" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${p.name} profile`}>
          <button type="button" className="cdw-x" onClick={close} aria-label="Close">
            ✕
          </button>
          <div className="cdw-head">
            <span className="cdw-av">{p.name[0]}</span>
            <div className="cdw-who">
              <p className="cdw-eye">Creator profile</p>
              <h2>{p.name}</h2>
              <p className="cdw-sub">
                {p.handle} · {p.followers} followers · joined {p.joined} · Profile {p.score}
              </p>
            </div>
          </div>

          <div className="cdw-acts">
            <Link href="/admin/inbox" className="cdw-wa">
              💬 WhatsApp
            </Link>
            <button
              type="button"
              className="cdw-txt"
              onClick={() => {
                setPaused(!paused);
                flash(paused ? "Messages resumed" : "Messages paused for this creator");
              }}
            >
              {paused ? "▶️ Resume messages" : "⏸️ Pause messages"}
            </button>
            <span className="cdw-live">🟢 {p.active}</span>
            <button type="button" className="cdw-txt" onClick={() => setAsk(true)}>
              🗑️ Delete user
            </button>
          </div>

          <nav className="cdw-tabs" data-scroll>
            {CP_TABS.map((t) => (
              <Link key={t.k} href={`/admin/creators/${p.id}/${t.k}`} className={`ad-tab ${tab === t.k ? "is-on" : ""}`}>
                {t.label}
              </Link>
            ))}
          </nav>

          <div className="cdw-body">{typeof children === "function" ? children(p) : children}</div>
          <p className="cdw-priv">🔒 Private data — this view is recorded in the audit log.</p>
        </aside>
      </div>

      {ask && (
        <div className="ad-overlay" style={{ zIndex: 130 }} onClick={() => setAsk(false)}>
          <div className="ad-modal cdw-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Delete user">
            <h3 className="ad-h2">Delete {p.name}?</h3>
            <p>The account moves to Settings › Delete requests for 30 days, then it is removed for good.</p>
            <div>
              <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setAsk(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="ad-btn ad-btn--danger"
                onClick={() => {
                  setAsk(false);
                  flash(`${p.name} sent to delete requests`);
                }}
              >
                Delete user
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="ad-toast" style={{ zIndex: 140 }}>✓ {toast}</div>}

      <style>{`
        .cdw-wrap { position: fixed; inset: 0; z-index: 95; background: rgba(20,33,59,.42); animation: adFade .15s ease; }
        .cdw {
          position: absolute; right: 0; top: 0; bottom: 0; width: min(820px, 100%); overflow-y: auto; padding: 30px 30px 40px;
          background: #fff; box-shadow: -20px 0 60px -30px rgba(20,33,59,.5); animation: cdwIn .2s ease;
        }
        @keyframes cdwIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
        .cdw-x { position: absolute; right: 30px; top: 30px; width: 36px; height: 36px; border: 0; border-radius: 10px; background: var(--ad-soft-2); color: var(--ad-muted-2); font-size: 14px; }
        .cdw-x:hover { background: var(--ad-lilac); color: var(--ad-primary); }
        .cdw-head { display: flex; align-items: flex-start; gap: 14px; padding-right: 50px; }
        .cdw-av { width: 56px; height: 56px; flex-shrink: 0; margin-top: 8px; border-radius: 14px; display: grid; place-items: center; background: var(--ad-lilac); color: var(--ad-primary); font-size: 22px; font-weight: 800; }
        .cdw-eye { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8b92aa; }
        .cdw-who h2 { margin-top: 5px; font-family: var(--ad-head); font-size: 25px; font-weight: 800; letter-spacing: -0.9px; line-height: 1.25; }
        .cdw-sub { margin-top: 6px; font-size: 12px; color: var(--ad-muted); }
        .cdw-acts { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-top: 12px; }
        .cdw-wa { display: inline-flex; align-items: center; height: 40px; padding: 0 15px; border-radius: 11px; border: 1px solid var(--ad-line-2); font-size: 14px; font-weight: 800; color: var(--ad-primary-ink); }
        .cdw-wa:hover { border-color: var(--ad-primary); }
        .cdw-txt { border: 0; background: none; padding: 0; font-size: 14px; font-weight: 800; color: #6657e9; }
        .cdw-live { display: inline-flex; align-items: center; height: 40px; padding: 0 10px; margin-left: -6px; border-radius: 20px; background: var(--ad-green-bg); color: var(--ad-green); font-size: 11px; font-weight: 700; }
        .cdw-tabs { display: flex; gap: 7px; margin-top: 12px; overflow-x: auto; scrollbar-width: none; }
        .cdw-tabs::-webkit-scrollbar { display: none; }
        .cdw-tabs .ad-tab { flex-shrink: 0; height: 36px; }
        .cdw-tabs .ad-tab:not(.is-on) { color: #67718a; }
        .cdw-body { margin-top: 34px; }
        .cdw-priv { margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--ad-line); font-size: 12px; color: var(--ad-muted); }
        .cdw-modal { padding: 24px; }
        .cdw-modal p { margin-top: 10px; font-size: 13.5px; line-height: 1.5; color: var(--ad-muted); }
        .cdw-modal div { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }

        @media (max-width: 640px) {
          .cdw { padding: 20px 16px 30px; }
          .cdw-x { right: 16px; top: 18px; }
          .cdw-av { width: 46px; height: 46px; font-size: 19px; margin-top: 4px; }
          .cdw-who h2 { font-size: 21px; }
          .cdw-acts { gap: 8px 12px; }
          .cdw-live { margin-left: 0; height: 30px; }
          .cdw-tabs { margin: 12px -16px 0; padding: 0 16px; }
          .cdw-body { margin-top: 22px; }
        }
      `}</style>
    </>
  );
}
