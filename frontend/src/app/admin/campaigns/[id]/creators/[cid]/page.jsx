"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { rpc, invoke, useRpc, errText } from "@/lib/supabase";
import { useCampaign, useToast, INVITE_STEPS, inviteStepRank } from "@/components/admin/campaign/live";
import { CreatorRow, buildRows, runAction, useAsk } from "@/components/admin/campaign/journey";

const tm = (t) => {
  try {
    return new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
  } catch {
    return "";
  }
};
/* participation stage → team_set_step ka status (BK_STATUSES key) — select mein abhi ka step dikhane ke liye */
const STAGE_TO_ST = { applied: "registered", eligible: "screened", sent_to_brand: "sent_to_brand", brand_confirmed: "approved", accepted: "approved", contract_sent: "contract_sent", contract_signed: "contract_signed", address_confirmed: "address_confirmed", product_sent: "courier_sent", product_delivered: "courier_delivered", content_created: "video_brief_sent", content_submitted: "video_submitted", changes_requested: "video_submitted", content_approved: "client_approved", published: "posted", completed: "posted" };

/* Figma: Campaign workspace — creator opened (chat + details + actions) — campaign_creator_hub / invite_messages */
export default function WorkspaceCreator() {
  const { id, cid = "" } = useParams();
  const router = useRouter();
  const c = { id };
  const isP = cid.startsWith("p-");
  const rid = cid.slice(2);
  const on = !!id && id !== "sample" && !!rid && rid !== "mple";
  const { c: camp } = useCampaign(id);
  const bt = useRpc("admin", "api.barter_tracker", { p_campaign: id }, { skip: !on || !isP });
  const people = useRpc("admin", "api.campaign_people", { p_campaign: id }, { skip: !on });
  const hub = useRpc("admin", isP ? "api.campaign_creator_hub" : "api.invite_messages", isP ? { p_participation: rid } : { p_invite: rid }, { skip: !on });
  const pauses = useRpc("admin", "api.admin_msg_pauses", {}, { skip: !on });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useToast(3200);
  const [askEl, askFn] = useAsk();
  const [ask, setAsk] = useState(false);
  const endRef = useRef(null);

  const reload = () => {
    bt.reload(true);
    people.reload(true);
    hub.reload(true);
  };
  const rows = useMemo(() => buildRows({ tracker: bt.data, people: people.data, progress: {}, kind: camp?.campaign_type || "barter" }), [bt.data, people.data, camp]);
  const total = rows.filter((r) => !r.failed).length;
  const x = rows.find((r) => r.id === cid);
  const h = hub.data || {};
  const phone = h.phone || (x && (x.x?.phone || x.i?.phone)) || "";
  const msgs = (Array.isArray(h.messages) ? h.messages : []).filter((m) => m.channel === "whatsapp" || !m.channel).slice().sort((a, b) => String(a.at).localeCompare(String(b.at)));
  const video = x ? (x.kind === "p" ? x.x?.submission?.url : x.i?.video_url) : null;
  const memberId = x ? (x.kind === "p" ? x.x?.member_id : x.i?.member_id) : null;
  const curSt = x ? (x.kind === "p" ? STAGE_TO_ST[x.x.stage] || "registered" : x.i.status === "invited" ? "registered" : x.i.status || "registered") : "registered";

  useEffect(() => {
    const box = endRef.current?.parentElement;
    if (box) box.scrollTop = box.scrollHeight;
  }, [msgs.length]);

  /* chat send — wa-send (purane hub / invite chat jaisa) */
  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return setToast("Type a message first.");
    if (!phone) return setToast("No WhatsApp number for this creator.");
    setSending(true);
    const { data: r, error } = await invoke("admin", "wa-send", { to_phone: phone, text: t, subject: h.campaign || camp?.name || null });
    setSending(false);
    if (error) return setToast(errText(error));
    setText("");
    setToast(r && r.via_template ? "Sent as a WhatsApp update ✓ (they hadn't replied in 24 h)" : "WhatsApp message sent ✓");
    hub.reload(true);
  };

  /* Move to — team_set_step (participation) / invite_set_step (sheet invite); step ki zaroori cheezein pucho */
  const move = async (st) => {
    if (!x || st === curSt) return;
    const lbl = (INVITE_STEPS.find((s) => s[0] === st) || [st, st])[1];
    const r = inviteStepRank(st);
    const fields = [];
    const ship = camp?.campaign_type !== "paid";
    if (ship && r >= 7 && r <= 9) fields.push({ k: "courier", label: "Courier", required: true, value: x.x?.shipment?.courier || x.i?.courier || "" }, { k: "tracking", label: "Tracking number or link", required: true, value: x.x?.shipment?.tracking_ref || x.i?.tracking || "" });
    if (r >= 10 && r <= 11) fields.push({ k: "video", label: "Video link", type: "url", required: true, value: video || "" });
    if (r >= 12) fields.push({ k: "posts", label: "Instagram post links (one per line)", area: true, required: true });
    fields.push({ k: "notify", label: "Message the creator about this step?", options: [["yes", "Yes — send the step message"], ["no", "No — just move them"]], value: "yes", required: true });
    const v = await askFn({ title: `Put ${x.name} on “${lbl}”`, ok: "Move", fields });
    if (!v) return;
    if (v.video && !/^https?:\/\//i.test(v.video)) return setToast("The video link must start with https://");
    const posts = String(v.posts || "").split(/\s+/).filter(Boolean);
    if (posts.some((p) => !/instagram\.com\/(reel|reels|p|tv|stories)\//i.test(p))) return setToast("Paste Instagram post links (instagram.com/reel/…, /p/… or /stories/…).");
    const payload = { notify: v.notify === "yes" };
    if (v.video) payload.video_url = v.video.trim();
    if (posts.length) payload.post_urls = posts;
    if (v.courier) payload.courier = v.courier.trim();
    if (v.tracking) {
      if (/^https?:\/\//i.test(v.tracking)) payload.tracking_url = v.tracking.trim();
      payload.tracking = v.tracking.trim();
    }
    setBusy("move");
    const { error } = x.kind === "p" ? await rpc("admin", "api.team_set_step", { p_participation: x.pid, p_status: st, p_payload: payload }) : await rpc("admin", "api.invite_set_step", { p_invite: x.iid, p_status: st, p_payload: payload });
    setBusy("");
    if (error) return setToast(errText(error));
    setToast(`✓ Moved to ${lbl}`);
    reload();
  };

  /* ➕ post / story — participation: bp_add_post_link, invite: invite_add_post */
  const addPost = async () => {
    if (!x) return;
    if (x.kind === "p") return runAction("bppost", x, { campaignId: id, ask: askFn, say: setToast, reload });
    const v = await askFn({ title: "Add post / story", ok: "Save", fields: [{ k: "link", label: "Instagram link", type: "url", required: true, placeholder: "https://www.instagram.com/reel/…" }] });
    if (!v) return;
    if (!/instagram\.com\/([^/?#]+\/)?(reel|reels|p|tv|stories)\//i.test(v.link)) return setToast("Paste an Instagram post link.");
    const { error } = await rpc("admin", "api.invite_add_post", { p_invite: x.iid, p_payload: { permalink: v.link.trim() } });
    if (error) return setToast(errText(error));
    setToast("Post added ✓");
    reload();
  };

  /* 🔗 Links / courier */
  const links = async () => {
    if (!x) return;
    if (x.kind === "p") return runAction("bpship", x, { campaignId: id, ask: askFn, say: setToast, reload });
    const i = x.i;
    const v = await askFn({ title: "Links / courier", ok: "Save", fields: [{ k: "courier", label: "Courier", value: i.courier || "" }, { k: "tracking", label: "Tracking number or link", value: i.tracking || "" }, { k: "video", label: "Video link", type: "url", value: i.video_url || "" }] });
    if (!v) return;
    const payload = { notify: false };
    if (v.courier.trim()) payload.courier = v.courier.trim();
    if (v.tracking.trim()) {
      payload.tracking = v.tracking.trim();
      if (/^https?:\/\//i.test(v.tracking)) payload.tracking_url = v.tracking.trim();
    }
    if (v.video.trim()) payload.video_url = v.video.trim();
    const { error } = await rpc("admin", "api.invite_set_step", { p_invite: i.invite_id, p_status: curSt, p_payload: payload });
    if (error) return setToast(errText(error));
    setToast("Saved ✓");
    reload();
  };

  /* ⏸ Pause messages — admin_msg_pause (WhatsApp + email ek switch) */
  const pz = pauses.data || {};
  const digits = (v) => String(v || "").replace(/\D/g, "").slice(-10);
  const paused = !!x && ((memberId && (pz.rows || []).some((r) => r.member === memberId)) || (x.kind === "p" ? (pz.participations || []).includes(x.pid) : (pz.invites || []).includes(x.iid)) || (phone && (pz.rows || []).some((r) => digits(r.phone) === digits(phone))));
  const togglePause = async () => {
    if (!x) return;
    const pause = !paused;
    if (!window.confirm(pause ? "Pause all messages to this creator? WhatsApp and email both stop — campaign updates, reminders, payment messages, the team chat and the bot. Login / OTP codes still go." : "Resume messages to this creator?")) return;
    const o = { member: memberId || null, phone: phone || null, email: x.i?.email || null, name: x.name, ...(x.kind === "p" ? { part: x.pid } : { invite: x.iid }), on: pause };
    setBusy("pause");
    const { data, error } = await rpc("admin", "api.admin_msg_pause", { p: o });
    setBusy("");
    if (error) return setToast("Couldn't change it: " + errText(error));
    setToast(pause ? `⏸ Messages paused for ${(data && data.name) || x.name}${data && data.stopped_now ? ` · ${data.stopped_now} waiting message${data.stopped_now > 1 ? "s" : ""} stopped` : ""}` : `▶ Messages resumed for ${(data && data.name) || x.name}`);
    pauses.reload(true);
  };

  /* 🗑 Delete — admin_remove_from_campaign */
  const remove = async () => {
    setBusy("del");
    const { error } = x.kind === "p" ? await rpc("admin", "api.admin_remove_from_campaign", { p_participation: x.pid, p_invite: null }) : await rpc("admin", "api.admin_remove_from_campaign", { p_participation: null, p_invite: x.iid });
    setBusy("");
    if (error) return setToast(errText(error));
    setAsk(false);
    router.push(`/admin/campaigns/${id}/creators`);
  };

  const loading = people.loading || (isP && bt.loading);
  if (!x)
    return (
      <AdminShell>
        <WorkspaceHead id={id} campaign={camp} />
        <section className="ad-card wcc">
          <div className="wcc-top">
            <Link href={`/admin/campaigns/${id}/creators`} className="wcc-back wcc-back--on" aria-label="Back to all creators">
              ←
            </Link>
            <h2 className="ad-h2">{loading ? "Loading creator…" : people.error ? errText(people.error) : "This creator isn’t on this campaign any more — the list is up to date."}</h2>
          </div>
        </section>
        <style>{`.wcc { padding: 22px; } .wcc-top { display: flex; gap: 10px; align-items: center; } .wcc-back--on { font-size: 18px; font-weight: 800; color: var(--ad-primary); }`}</style>
      </AdminShell>
    );

  return (
    <AdminShell>
      <WorkspaceHead id={id} campaign={camp} />

      <section className="ad-card wcc">
        <div className="wcc-top">
          <Link href={`/admin/campaigns/${c.id}/creators`} className="wcc-back" aria-label="Back to all creators">
            ←
          </Link>
          <h2 className="ad-h2">Creators · {total}</h2>
        </div>
        <CreatorRow
          c={x}
          open
          busy={busy === "act"}
          onAction={async () => {
            setBusy("act");
            await runAction(x.act.key, x, { campaignId: id, ask: askFn, say: setToast, reload, router });
            setBusy("");
          }}
          onChat={() => document.getElementById("wcc-msg")?.focus()}
        />

        <div className="wcc-grid">
          {/* WhatsApp chat */}
          <div className="wcc-chat">
            <div className="wcc-chat__head">
              <b>
                {x.name} · {x.phone || "no WhatsApp"}
              </b>
              <a href={phone ? `https://wa.me/${String(phone).replace(/\D/g, "")}` : "https://wa.me/"} target="_blank" rel="noreferrer" className="wcc-open">
                Open in WhatsApp ↗
              </a>
            </div>
            <div className="wcc-msgs">
              {hub.loading && <p className="wcc-note">Loading messages…</p>}
              {hub.error && <p className="wcc-note">Messages: {errText(hub.error)}</p>}
              {!hub.loading && !hub.error && !msgs.length && <p className="wcc-note">No WhatsApp messages yet.</p>}
              {msgs.map((m, i) => (
                <div key={i} className={`wcc-msg ${m.dir === "out" ? "is-me" : ""}`}>
                  <p>{m.text || (m.key ? `📨 ${m.key.replace(/_/g, " ")}` : "")}</p>
                  <small>
                    {tm(m.at)}
                    {m.dir === "out" && (m.status === "read" ? " ✓✓" : m.status === "delivered" ? " ✓✓" : m.status === "failed" ? " ✗" : " ✓")}
                    {m.auto ? " · automatic" : ""}
                  </small>
                </div>
              ))}
              <span ref={endRef} />
            </div>
            <form className="wcc-send" onSubmit={send}>
              <input id="wcc-msg" className="ad-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message — goes as a WhatsApp update" aria-label="Message" />
              <button type="submit" className="ad-btn ad-btn--primary" aria-label="Send" disabled={!text.trim() || sending}>
                ➤
              </button>
            </form>
            {h.session_open === false && <p className="wcc-note">They haven’t replied in 24 h — your message goes inside the approved “campaign update” template.</p>}
          </div>

          <div className="wcc-side">
            <div className="wcc-box">
              <h3 className="ad-h2">Details</h3>
              <div className="wcc-details">
                <div>
                  <p>WhatsApp</p>
                  <b>{x.phone ? `${x.phone} · ${paused ? "PAUSED" : "ON"}` : "—"}</b>
                </div>
                <div>
                  <p>City</p>
                  <b>{x.city}</b>
                </div>
                <div>
                  <p>Video</p>
                  <b>
                    {video ? (
                      <a href={video} target="_blank" rel="noopener noreferrer">
                        open ↗
                      </a>
                    ) : (
                      "—"
                    )}
                  </b>
                </div>
                <div>
                  <p>Next</p>
                  <b>{x.next}</b>
                </div>
              </div>
            </div>

            <div className="wcc-box">
              <h3 className="ad-h2">Actions</h3>
              <label className="wcc-move">
                <span>Move to</span>
                <select className="ad-input" value={curSt} disabled={busy === "move"} onChange={(e) => move(e.target.value)}>
                  {INVITE_STEPS.filter(([k]) => camp?.campaign_type !== "paid" || !["address_confirmed", "courier_sent", "courier_delivered"].includes(k)).map(([k, l], i) => (
                    <option key={k} value={k}>
                      {i + 1}. {l}
                    </option>
                  ))}
                </select>
              </label>
              <div className="wcc-btns">
                <button type="button" className="wcc-btn" onClick={addPost}>
                  ➕ Add post / story + numbers
                </button>
                {memberId ? (
                  <Link href={`/admin/creators/${memberId}/instagram`} className="wcc-btn">
                    📊 Instagram analytics
                  </Link>
                ) : (
                  <button type="button" className="wcc-btn" onClick={() => setToast("Not on Geek OS yet — Instagram analytics show once they register and connect.")}>
                    📊 Instagram analytics
                  </button>
                )}
                <button type="button" className="wcc-btn" onClick={links}>
                  🔗 Links / courier
                </button>
              </div>
              <div className="wcc-links">
                <button type="button" disabled={busy === "pause"} onClick={togglePause}>
                  {paused ? "▶ Resume messages" : "⏸ Pause messages"}
                </button>
                <button type="button" onClick={() => setAsk(true)}>
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {ask && (
        <div className="ad-overlay" onClick={() => setAsk(false)}>
          <div className="ad-modal wcc-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Remove creator">
            <h2 className="ad-h2">Delete {x.name} from this campaign?</h2>
            <p>Their contract, courier, video, posts and every message about this campaign go too. This can’t be undone.</p>
            <div className="wcc-modal__act">
              <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setAsk(false)}>
                Cancel
              </button>
              <button type="button" className="ad-btn ad-btn--danger" disabled={busy === "del"} onClick={remove}>
                {busy === "del" ? "Deleting…" : "🗑 Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {askEl}
      {toast && <div className="ad-toast">{toast}</div>}

      <style>{`
        /* Figma: select par arrow nahi */
        select.ad-input { appearance: none; -webkit-appearance: none; }
        .wcc { padding: 22px 22px 40px; }
        .wcc-top { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .wcc-back { display: none; }
        .wcc-grid { display: grid; grid-template-columns: minmax(0, 625fr) minmax(0, 432fr); gap: 18px; margin-top: 13px; align-items: start; }

        .wcc-chat { overflow: hidden; border-radius: 16px; border: 1px solid var(--ad-line); background: #fff; }
        .wcc-chat__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 65px; padding: 0 16px; background: #0d5c4a; }
        .wcc-chat__head b { font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wcc-open { flex-shrink: 0; height: 41px; display: inline-flex; align-items: center; padding: 0 15px; border-radius: 10px; background: #fff; font-size: 14px; font-weight: 800; color: var(--ad-primary-ink); }
        .wcc-msgs { display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto; padding: 13px 14px 14px; background: #f3f0e8; }
        .wcc-msg { align-self: flex-start; width: min(447px, 88%); padding: 10px 12px 8px; border-radius: 9px; background: #fff; box-shadow: 0 1px 1px rgba(0,0,0,.06); }
        .wcc-msg p { white-space: pre-line; font-size: 13px; line-height: 1.33; color: var(--ad-ink); }
        .wcc-msg small { display: block; margin-top: 4px; text-align: right; font-size: 12px; color: var(--ad-muted); }
        .wcc-msg.is-me { align-self: flex-end; width: auto; max-width: 88%; background: #d9fdd3; }
        .wcc-msg.is-me small { margin-top: 0; }
        .wcc-send { display: flex; gap: 8px; padding: 11px 14px 0; }
        .wcc-send .ad-input { width: 173px; height: 42px; flex: 0 1 173px; }
        .wcc-send .ad-input::placeholder { color: #757575; }
        .wcc-send .ad-btn { width: 43px; height: 42px; padding: 0; font-size: 14px; }
        .wcc-note { padding: 10px 14px 12px; font-size: 12px; color: var(--ad-muted); }

        .wcc-side { display: flex; flex-direction: column; gap: 18px; }
        .wcc-box { padding: 22px 22px 26px; border-radius: 16px; border: 1px solid var(--ad-line); }
        .wcc-details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
        .wcc-details div { min-height: 78px; padding: 20px 19px 16px; border-radius: 14px; border: 1px solid var(--ad-line); }
        .wcc-details div:nth-child(n+3) { min-height: 115px; }
        .wcc-details p { font-size: 11px; letter-spacing: .8px; text-transform: uppercase; color: var(--ad-muted); }
        .wcc-details b { display: block; margin-top: 6px; font-size: 14px; font-weight: 700; line-height: 1.33; color: var(--ad-ink); }
        .wcc-details a:hover { color: var(--ad-primary); }
        .wcc-move { display: flex; align-items: center; gap: 10px; margin-top: 20px; font-size: 12px; color: var(--ad-muted); }
        .wcc-move select { width: 220px; height: 45px; padding: 0 12px; font-size: 14px; color: #293652; }
        .wcc-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px; }
        .wcc-btn { display: inline-flex; align-items: center; height: 41px; padding: 0 15px; border-radius: 10px; border: 1px solid var(--ad-line-2); font-size: 14px; font-weight: 800; color: var(--ad-primary-ink); }
        .wcc-btn:hover { border-color: var(--ad-primary); }
        .wcc-links { display: flex; gap: 18px; margin: 16px 0 0 8px; }
        .wcc-links button { padding: 0; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; }
        .wcc-links button:last-child:hover { color: var(--ad-red); }
        .wcc-modal { padding: 24px; }
        .wcc-modal p { margin-top: 10px; font-size: 13px; color: var(--ad-muted); }
        .wcc-modal__act { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }

        @media (max-width: 1180px) { .wcc-grid { grid-template-columns: 1fr; } .wcc-send .ad-input { flex: 1; width: auto; } }
        @media (max-width: 640px) {
          .wcc { padding: 16px 14px 24px; }
          .wcc-back { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 9px; background: var(--ad-soft); font-weight: 800; }
          .wcc-chat__head { height: auto; padding: 12px; flex-wrap: wrap; }
          .wcc-open { height: 36px; }
          .wcc-box { padding: 18px 14px; }
          .wcc-details div, .wcc-details div:nth-child(n+3) { min-height: 0; padding: 14px; }
          .wcc-move { flex-wrap: wrap; }
          .wcc-move select { width: 100%; }
          .wcc-btn { flex: 1 1 100%; justify-content: center; }
        }
      `}</style>
    </AdminShell>
  );
}
