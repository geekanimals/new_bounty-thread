"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import CreatorCards from "@/app/vault/creators/cards/page";
import { useCreatorProfile, profileView, useMsgPause, agoTxt, uaShort } from "@/components/admin/creator/live";
import { rpc, useRpc, errText } from "@/lib/supabase";
import IgImg from "@/lib/igFresh";

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
 * Har tab apna route: /vault/creators/[id]/<tab>. Band karo → wapas cards.
 * Data: admin_creator_profile (purane app ka Creator 360) — id = member id.
 */
const CreatorCtx = createContext(null);

/**
 * Tab page ke andar: drawer (layout) se creator ka data leta hai — `{(p) => …}` children.
 * Drawer ab layout mein ek hi baar bana rehta hai, isliye tab badalne par flash / "Loading creator…" nahi aata.
 */
export default function CreatorDrawer({ children }) {
  const p = useContext(CreatorCtx);
  if (!p) return null;
  return typeof children === "function" ? children(p) : children;
}

/** /vault/creators/[id]/layout — drawer frame, tab route badalne par bhi mounted rehta hai */
export function CreatorDrawerFrame({ children }) {
  const { id } = useParams();
  const seg = (usePathname() || "").split("/")[4] || "profile";
  const tab = CP_TABS.some((t) => t.k === seg) ? seg : "profile";
  return <DrawerFrame id={id} tab={tab}>{children}</DrawerFrame>;
}

function DrawerFrame({ id, tab, children }) {
  const router = useRouter();
  const { data, error, loading, reload } = useCreatorProfile(id);
  const p = profileView(id, data);
  // "Active 7h ago · iPhone · Essential cookies" (creator_activity)
  const { data: act } = useRpc("admin", "api.creator_activity", { p_member: id, p_days: 30 }, { skip: !id });
  const pause = useMsgPause();
  const paused = pause.pausedFor({ member: id });
  const [ask, setAsk] = useState(false);
  const [confirmTxt, setConfirmTxt] = useState("");
  const [busy, setBusy] = useState(false);
  const [delErr, setDelErr] = useState("");
  const [toast, setToast] = useState("");
  const close = () => router.push("/vault/creators/cards");

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
    setTimeout(() => setToast(""), 2600);
  };

  const activeLine = act
    ? [
        act.last_seen ? `Active ${agoTxt(act.last_seen)}` : "No activity yet",
        act.last_device ? uaShort(act.last_device) : "",
        act.consent === "all" ? "All cookies" : act.consent === "essential" ? "Essential cookies" : "Cookies not chosen",
      ]
        .filter(Boolean)
        .join(" · ")
    : "…";

  // ⏸ / ▶ — WhatsApp + email ek saath (admin_msg_pause)
  const togglePause = async () => {
    const on = !paused;
    if (!window.confirm(on ? "Pause all messages to this creator? WhatsApp and email both stop (login codes still go)." : "Resume messages to this creator?")) return;
    const r = await pause.toggle({ member: id });
    if (r.error) return flash("Couldn't change it: " + errText(r.error));
    flash(on ? `⏸ Messages paused for ${(r.data && r.data.name) || p.name}` : `▶ Messages resumed for ${(r.data && r.data.name) || p.name}`);
  };

  // 🗑 Poora user delete (admin_delete_user, "DELETE" type karke) — purane app jaisa
  const doDelete = async () => {
    setBusy(true);
    setDelErr("");
    const r = await rpc("admin", "admin_delete_user", { p_member: id, p_confirm: confirmTxt.trim() });
    setBusy(false);
    if (r.error) return setDelErr(errText(r.error));
    setAsk(false);
    router.push("/vault/creators/cards");
  };

  if (error || (loading && !data)) {
    return (
      <>
        <CreatorCards snapshot />
        <div className="cdw-wrap" onClick={close}>
          <aside className="cdw" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Creator profile">
            <button type="button" className="cdw-x" onClick={close} aria-label="Close">
              ✕
            </button>
            {error ? (
              <p className="cdw-state">
                {errText(error)}{" "}
                <button type="button" className="cdw-txt" onClick={() => reload()}>
                  Retry
                </button>
              </p>
            ) : (
              <p className="cdw-state">Loading creator…</p>
            )}
          </aside>
        </div>
        <style>{DRAWER_CSS + `.cdw-state { padding: 40px 0; font-size: 14px; color: var(--ad-muted); }`}</style>
      </>
    );
  }

  return (
    <>
      <CreatorCards snapshot />
      <div className="cdw-wrap" onClick={close}>
        <aside className="cdw" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${p.name} profile`}>
          <button type="button" className="cdw-x" onClick={close} aria-label="Close">
            ✕
          </button>
          <div className="cdw-head">
            <IgImg className="cdw-av cdw-av--img" handle={p.igUser} src={p.pic} fallback={<span className="cdw-av">{p.name[0]}</span>} />
            <div className="cdw-who">
              <p className="cdw-eye">Creator profile</p>
              <h2>{p.name}</h2>
              <p className="cdw-sub">
                {p.handle ? `${p.handle} · ${p.followers} followers · ` : ""}joined {p.joined} · Profile {p.score}
              </p>
            </div>
          </div>

          <div className="cdw-acts">
            {p.whatsapp ? (
              <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="cdw-wa">
                💬 WhatsApp
              </a>
            ) : (
              <span className="cdw-wa is-off">💬 No WhatsApp</span>
            )}
            {p.email && (
              <a href={`mailto:${p.email}`} className="cdw-txt">
                ✉️ Email
              </a>
            )}
            <button type="button" className="cdw-txt" onClick={togglePause}>
              {paused ? "▶️ Resume messages" : "⏸️ Pause messages"}
            </button>
            <Link href={`/vault/creators/${id}/activity`} className="cdw-live">
              {act?.last_seen ? "🟢" : "⚪"} {activeLine}
            </Link>
            <button type="button" className="cdw-txt" onClick={() => (setConfirmTxt(""), setDelErr(""), setAsk(true))}>
              🗑️ Delete user
            </button>
          </div>

          <nav className="cdw-tabs" data-scroll>
            {CP_TABS.map((t) => (
              <Link key={t.k} href={`/vault/creators/${id}/${t.k}`} className={`ga-tab ${tab === t.k ? "is-on" : ""}`}>
                {t.label}
              </Link>
            ))}
          </nav>

          <div className="cdw-body">
            <CreatorCtx.Provider value={p}>{children}</CreatorCtx.Provider>
          </div>
          <p className="cdw-priv">🔒 Private data — this view is recorded in the audit log.</p>
        </aside>
      </div>

      {ask && (
        <div className="ga-overlay" style={{ zIndex: 130 }} onClick={() => setAsk(false)}>
          <div className="ga-modal cdw-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Delete user">
            <h3 className="ga-h2">Delete {p.name}?</h3>
            <p>
              This removes for good: their login, creator profile (personal details, contact, addresses, pets, rates), Instagram and WhatsApp link, every campaign they were on, alerts
              and activity. Campaigns they created move to you; a record stays in the Audit log. They can sign up again fresh.
            </p>
            <label className="ga-label cdw-lbl" htmlFor="cdwDel">
              Type <b>DELETE</b> to confirm
            </label>
            <input id="cdwDel" className="ga-input" autoComplete="off" placeholder="DELETE" value={confirmTxt} onChange={(e) => setConfirmTxt(e.target.value)} />
            {delErr && <p className="cdw-err">{delErr}</p>}
            <div>
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setAsk(false)}>
                Cancel
              </button>
              <button type="button" className="ga-btn ga-btn--danger" disabled={busy || confirmTxt.trim() !== "DELETE"} onClick={doDelete}>
                {busy ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="ga-toast" style={{ zIndex: 140 }}>✓ {toast}</div>}

      <style>{DRAWER_CSS}</style>
    </>
  );
}

const DRAWER_CSS = `
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
        .cdw-tabs .ga-tab { flex-shrink: 0; height: 36px; }
        .cdw-tabs .ga-tab:not(.is-on) { color: #67718a; }
        .cdw-body { margin-top: 34px; }
        .cdw-priv { margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--ad-line); font-size: 12px; color: var(--ad-muted); }
        .cdw-modal { padding: 24px; }
        .cdw-modal p { margin-top: 10px; font-size: 13.5px; line-height: 1.5; color: var(--ad-muted); }
        .cdw-modal div { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        .cdw-lbl { margin-top: 14px; }
        .cdw-err { color: var(--ad-red) !important; font-weight: 700; }
        .cdw-av--img { object-fit: cover; }
        .cdw-wa.is-off { color: var(--ad-muted); }

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
      `;
