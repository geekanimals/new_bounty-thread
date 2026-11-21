"use client";

import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { rpc, invoke, useRpc, errText } from "@/lib/supabase";
import { useCampaign, useToast, INVITE_STEPS, inviteStepRank } from "@/components/admin/campaign/live";
import { CreatorRow, buildRows, runAction, useAsk } from "@/components/admin/campaign/journey";
import PartPanel from "@/components/admin/campaign/PartPanel";
import { DRIPS, fillParts } from "@/components/admin/msg/snaptoDrips";

// drip ruk gaya to kyon — creator ne kaam kar diya (delivery page jaisa)
const DRIP_DONE = { join: "joined the campaign", profile: "completed the profile", instagram: "connected Instagram", contract: "signed the contract", address: "confirmed the address", video: "uploaded the video", post: "added the post link" };
const firstName = (v) => String(v || "").trim().replace(/^@/, "").split(/\s+/)[0] || "there";

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
// chat mein din ka divider (purane app jaisa "12 Oct 2026")
const dayOf = (at) => {
  if (!at) return "";
  const d = new Date(at);
  return isNaN(d) ? "" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function WorkspaceCreator() {
  const { id, cid = "" } = useParams();
  const router = useRouter();
  // chat sirf tab khula jab 💬 dabake aaye (?chat=1) ya yahan "Open chat" dabaya — warna saaf summary
  const sp = useSearchParams();
  const [chatOpen, setChatOpen] = useState(sp?.get("chat") === "1");
  const c = { id };
  const isP = cid.startsWith("p-");
  const rid = cid.slice(2);
  const on = !!id && id !== "sample" && !!rid && rid !== "mple";
  const { c: camp } = useCampaign(id);
  const bt = useRpc("admin", "api.barter_tracker", { p_campaign: id }, { skip: !on || !isP });
  const people = useRpc("admin", "api.campaign_people", { p_campaign: id }, { skip: !on });
  const hub = useRpc("admin", isP ? "api.campaign_creator_hub" : "api.invite_messages", isP ? { p_participation: rid } : { p_invite: rid }, { skip: !on, refreshMs: 30000 });
  // Snapto WhatsApp drips (jo asal mein jaate hain) — hub mein nahi aate
  const drips = useRpc("admin", "api.creator_drip_log", isP ? { p_participation: rid, p_invite: null } : { p_participation: null, p_invite: rid }, { skip: !on, refreshMs: 60000 });
  const pauses = useRpc("admin", "api.admin_msg_pauses", {}, { skip: !on });
  const bmatch = useRpc("admin", "api.campaign_brief_match", { p_campaign: id }, { skip: !on || !isP });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  // 24 h window ke liye "abhi ka time" — har minute taaza
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useToast(3200);
  const [askEl, askFn] = useAsk();
  const [ask, setAsk] = useState(false);
  const endRef = useRef(null);

  const reload = () => {
    hub.reload(true);
    drips.reload(true);
    return Promise.all([bt.reload(true), people.reload(true)]);
  };
  const rows = useMemo(() => buildRows({ tracker: bt.data, people: people.data, progress: {}, kind: camp?.campaign_type || "barter" }), [bt.data, people.data, camp]);
  const total = rows.filter((r) => !r.failed).length;
  const x = rows.find((r) => r.id === cid);
  const h = hub.data || {};
  const phone = h.phone || (x && (x.x?.phone || x.i?.phone)) || "";
  // Snapto se poori chat (dono taraf + template ka pura text) — edge function snapto-chat (sirf Super Admin)
  const [snap, setSnap] = useState({ list: null, err: "" });
  useEffect(() => {
    if (!on || !phone) return;
    let alive = true;
    const load = () =>
      invoke("admin", "snapto-chat", { phone }).then(({ data, error }) => {
        if (!alive) return;
        if (error || !data || !Array.isArray(data.messages)) setSnap((s) => ({ list: s.list, err: errText(error) || (data && data.error) || "Couldn't load the Snapto chat" }));
        else setSnap({ list: data.messages, err: "" });
      });
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [on, phone]);
  // Ek timeline: Snapto WhatsApp drips + team / creator WhatsApp + email. Jo kabhi gaya hi nahi (skipped / held —
  // purana WhatsApp template band hai, ya channel OFF) woh nahi dikhta.
  const msgs = useMemo(() => {
    // sirf WhatsApp (email yahan nahi) — jo kabhi gaya hi nahi (skipped / held) woh bhi nahi
    const own = (Array.isArray(h.messages) ? h.messages : [])
      .filter((m) => (m.channel || "whatsapp") === "whatsapp" && !["skipped", "held"].includes(m.status))
      .map((m) => ({ ...m, channel: m.channel || "whatsapp" }));
    const vals = (a = {}) => ({
      name: firstName(a.creator_name || (x && x.name)),
      campaign: a.campaign_name || camp?.name || "your campaign",
      courier: a.courier || a.courier_name,
      tracking: a.tracking_id || a.tracking,
      address: a.delivery_address || a.address,
      due: a.due_date || a.due || a.video_due,
      ig: a.ig || a.instagram,
    });
    const dr = (Array.isArray(drips.data) ? drips.data : [])
      .filter((d) => d.status !== "skipped" && (d.kind === "start" || d.kind === "done"))
      .map((d) => {
        if (d.kind === "done") return { at: d.at, sys: true, text: `WhatsApp reminders stopped — they ${DRIP_DONE[d.drip] || "finished this step"}` };
        const D = DRIPS[d.drip] || {};
        const first = (D.msgs || [])[0];
        const more = (D.msgs || []).slice(1);
        return {
          at: d.at,
          dir: "out",
          channel: "whatsapp",
          drip: true,
          title: D.name || `WhatsApp drip ${d.drip}`,
          parts: first ? fillParts(first.text, vals(d.attrs || {})) : null,
          follow: more.length ? `+ ${more.length} reminder${more.length > 1 ? "s" : ""} (after ${more.map((m) => m.after).join(", ")}) until they ${D.stops || "finish the step"}` : "",
          status: d.status,
          error: d.error,
          auto: true,
        };
      });
    // Snapto chat mil gayi → WhatsApp wahi se (poori, dono taraf); drip "stopped" notes rehte hain
    if (Array.isArray(snap.list)) {
      const wa = snap.list.map((m) => ({
        at: m.at,
        dir: m.dir,
        channel: "whatsapp",
        text: m.text,
        header: m.header,
        footer: m.footer,
        buttons: m.buttons,
        tpl: m.template,
        status: m.status,
        error: m.error,
        auto: m.dir === "out" && (m.kind === "template" || m.bot),
        snap: true,
      }));
      return [...wa, ...dr.filter((d) => d.sys)].sort((a, b) => String(a.at).localeCompare(String(b.at)));
    }
    return [...own, ...dr].sort((a, b) => String(a.at).localeCompare(String(b.at)));
  }, [h.messages, drips.data, x, camp, snap.list]);
  // WhatsApp ka 24 ghante wala window — sirf tab type karke bhej sakte hain jab creator ne pichhle 24 h mein msg kiya ho
  const lastIn = msgs.filter((m) => m.dir === "in" && m.at).reduce((a, m) => (String(m.at) > String(a || "") ? m.at : a), null);
  const winMs = lastIn ? new Date(lastIn).getTime() + 24 * 3600 * 1000 - now : -1;
  const canSend = !!phone && (h.session_open === true || winMs > 0);
  const winLeft = winMs > 0 ? (winMs >= 3600000 ? `${Math.floor(winMs / 3600000)} h` : `${Math.max(1, Math.floor(winMs / 60000))} min`) : "";
  const lastOut = msgs.filter((m) => !m.sys && m.at).slice(-1)[0];
  const rowStats = useMemo(
    () => ({
      wa: msgs.filter((m) => !m.sys && m.channel === "whatsapp" && m.dir === "out").length,
      em: msgs.filter((m) => m.channel === "email").length,
      rem: msgs.filter((m) => m.drip).length,
      last: lastOut ? { at: lastOut.at, channel: lastOut.channel, status: lastOut.drip ? "sent" : lastOut.status, by: lastOut.dir === "in" ? "creator" : lastOut.auto ? "auto" : "team" } : null,
    }),
    [msgs, lastOut],
  );
  // chat khula = creator ke replies sab ke liye "read" (list ka 🔴 badge hat jaata hai); naya reply aaye to phir se
  useEffect(() => {
    if (!on || !phone) return;
    rpc("admin", "api.mark_chat_seen", { p_campaign: id, p_phone: phone });
  }, [on, id, phone, lastIn]);
  const msgCount = { wa: msgs.filter((m) => !m.sys && m.channel === "whatsapp" && m.dir === "out").length, em: msgs.filter((m) => m.channel === "email").length, in: msgs.filter((m) => m.dir === "in").length };

  // ✕ / Esc — wapas creators list par (filters wahi rehte hain jab history se lautte hain)
  const close = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(`/vault/campaigns/${id}/creators`);
  };
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (document.querySelector(".ga-overlay")) return; // pehle khula popup band ho
      close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const video = x ? (x.kind === "p" ? x.x?.submission?.url : x.i?.video_url) : null;
  const memberId = x ? (x.kind === "p" ? x.x?.member_id : x.i?.member_id) : null;
  const curSt = x ? (x.kind === "p" ? STAGE_TO_ST[x.x.stage] || "registered" : x.i.status === "invited" ? "registered" : x.i.status || "registered") : "registered";

  useEffect(() => {
    const box = endRef.current?.parentElement;
    if (box) box.scrollTop = box.scrollHeight;
  }, [msgs.length, chatOpen]);

  // ✉️ Email (purane creator hub ka team_send_email) — sirf campaign mein jude creators
  const sendEmail = async () => {
    const v = await askFn({
      title: `Email ${x.name}`,
      text: "Goes to the creator's email from the Geek team, about this campaign. It's also saved in their history.",
      ok: "Send email",
      fields: [
        { k: "subject", label: "Subject", value: `About ${camp?.name || "your campaign"}`, required: true },
        { k: "body", label: "Message", area: true, required: true },
      ],
    });
    if (!v) return;
    const { error } = await rpc("admin", "api.team_send_email", { p_participation: x.pid, p_subject: v.subject.trim(), p_body: v.body.trim() });
    setToast(error ? errText(error) : "✉️ Email sent ✓");
    if (!error) hub.reload(true);
  };
  // 📊 sheet waale creator ka public Instagram (purana openPublicAnalytics — api.creator_public_stats)
  const [pub, setPub] = useState(null);
  const openPublic = async () => {
    const h = String(x?.i?.handle || x?.handle || "").replace(/^@/, "").toLowerCase();
    if (!h) return setToast("No Instagram username for this creator.");
    setPub({ handle: h, loading: true });
    const { data, error } = await rpc("admin", "api.creator_public_stats", { p_handle: h });
    setPub({ handle: h, data: data || null, error: error ? errText(error) : null });
  };

  /* chat send — wa-send (purane hub / invite chat jaisa) */
  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return setToast("Type a message first.");
    if (!phone) return setToast("No WhatsApp number for this creator.");
    if (!canSend) return setToast("They haven’t messaged in the last 24 hours — WhatsApp doesn’t allow a typed message now.");
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
    router.push(`/vault/campaigns/${id}/creators`);
  };

  const loading = people.loading || (isP && bt.loading);
  if (!x)
    return (
      <AdminShell>
        <WorkspaceHead id={id} campaign={camp} />
        <section className="ga-card wcc">
          <div className="wcc-top">
            <h2 className="ga-h2">{loading ? "Loading creator…" : people.error ? errText(people.error) : "This creator isn’t on this campaign any more — the list is up to date."}</h2>
            <button type="button" className="wcc-close" onClick={close} aria-label="Close" title="Close (Esc)">
              ✕
            </button>
          </div>
        </section>
        <style>{`.wcc { padding: 22px; } .wcc-top { display: flex; gap: 10px; align-items: center; justify-content: space-between; } .wcc-close { flex-shrink: 0; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 10px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 16px; font-weight: 800; color: var(--ad-ink, #1d1f27); cursor: pointer; } .wcc-close:hover { border-color: var(--ad-primary); color: var(--ad-primary); }`}</style>
      </AdminShell>
    );

  return (
    <AdminShell>
      <WorkspaceHead id={id} campaign={camp} />

      <section className="ga-card wcc">
        <div className="wcc-top">
          <h2 className="ga-h2">Creators · {total}</h2>
          <button type="button" className="wcc-close" onClick={close} aria-label="Close and go back to the creators list" title="Close (Esc)">
            ✕
          </button>
        </div>
        <CreatorRow
          c={x}
          open
          stats={rowStats}
          busy={busy === "act"}
          onAction={async () => {
            setBusy("act");
            try {
              await runAction(x.act.key, x, { campaignId: id, ask: askFn, say: setToast, reload, router, match: (bmatch.data || {})[rid], campaignName: camp?.name });
            } catch (e) {
              setToast(e?.message || String(e));
            } finally {
              setBusy("");
            }
          }}
          onChat={() => {
            setChatOpen(true);
            setTimeout(() => {
              document.getElementById("wcc-chatbox")?.scrollIntoView({ behavior: "smooth", block: "start" });
              document.getElementById("wcc-msg")?.focus();
            }, 60);
          }}
          match={isP ? (bmatch.data || {})[rid] : null}
          onReject={
            isP && ["applied", "eligible", "sent_to_brand"].includes(x.x?.stage)
              ? async () => {
                  setBusy("act");
                  try {
                    await runAction(x.x.stage === "sent_to_brand" ? "bpbrandno" : "bpreject", x, { campaignId: id, ask: askFn, say: setToast, reload, router, match: (bmatch.data || {})[rid], campaignName: camp?.name });
                  } catch (e) {
                    setToast(e?.message || String(e));
                  } finally {
                    setBusy("");
                  }
                }
              : null
          }
        />

        <div className={`wcc-grid ${chatOpen ? "" : "wcc-grid--closed"}`}>
          {/* WhatsApp chat — band ho to chhota card, khula ho to poori chat */}
          {!chatOpen && (() => {
            const last = [...msgs].reverse().find((m) => !m.sys);
            return (
              <div className="wcc-chatcard">
                <div className="wcc-chatcard__top">
                  <span className="wcc-chatcard__ic" aria-hidden="true">💬</span>
                  <div>
                    <b>WhatsApp chat</b>
                    <small>
                      {msgCount.wa} sent · {msgCount.in} repl{msgCount.in === 1 ? "y" : "ies"}
                      {canSend ? " · 🟢 can reply now" : ""}
                    </small>
                  </div>
                </div>
                {last ? (
                  <p className={`wcc-chatcard__last ${last.dir === "in" ? "is-in" : ""}`}>
                    <em>{last.dir === "in" ? "They said" : "Last sent"} · {tm(last.at)}</em>
                    {String(last.text || (last.tpl ? last.tpl.replace(/_/g, " ") : last.title || "") || "").slice(0, 140)}
                  </p>
                ) : (
                  <p className="wcc-chatcard__last">No messages yet.</p>
                )}
                <div className="wcc-chatcard__acts">
                  <button type="button" className="ga-btn ga-btn--primary" onClick={() => setChatOpen(true)}>
                    💬 Open chat
                  </button>
                  <a href={phone ? `https://wa.me/${String(phone).replace(/\D/g, "")}` : "https://wa.me/"} target="_blank" rel="noreferrer" className="ga-btn">
                    WhatsApp ↗
                  </a>
                </div>
              </div>
            );
          })()}
          {chatOpen && (
          <div className="wcc-chat" id="wcc-chatbox">
            <div className="wcc-chat__head">
              <b>
                {x.name} · {x.phone || "no WhatsApp"}
              </b>
              <span className="wcc-chat__hacts">
                <a href={phone ? `https://wa.me/${String(phone).replace(/\D/g, "")}` : "https://wa.me/"} target="_blank" rel="noreferrer" className="wcc-open">
                  Open in WhatsApp ↗
                </a>
                <button type="button" className="wcc-hide" onClick={() => setChatOpen(false)} aria-label="Hide chat" title="Hide chat">
                  ✕
                </button>
              </span>
            </div>
            <div className="wcc-sum">
              🟢 {msgCount.wa} WhatsApp sent · 💬 {msgCount.in} repl{msgCount.in === 1 ? "y" : "ies"}
              <span>Snapto WhatsApp shows “sent to Snapto” — delivered / read is in Snapto → Reports.</span>
            </div>
            <div className="wcc-msgs">
              {(hub.loading || drips.loading) && !msgs.length && <p className="wcc-note">Loading messages…</p>}
              {hub.error && <p className="wcc-note">Messages: {errText(hub.error)}</p>}
              {drips.error && <p className="wcc-note">WhatsApp drips: {errText(drips.error)}</p>}
              {snap.err && !snap.list && <p className="wcc-note">Showing saved messages only — Snapto chat: {snap.err}</p>}
              {!hub.loading && !drips.loading && !hub.error && !msgs.length && <p className="wcc-note">No messages yet.</p>}
              {msgs.map((m, i) => (
                <Fragment key={i}>
                  {dayOf(m.at) !== dayOf(msgs[i - 1]?.at) && <p className="wcc-day">{dayOf(m.at)}</p>}
                  {m.sys ? (
                    <p className="wcc-sys">
                      ⏹ {m.text} · {tm(m.at)}
                    </p>
                  ) : (
                    <div className={`wcc-msg ${m.dir === "out" ? "is-me" : ""} ${m.channel === "email" ? "is-mail" : ""} ${m.status === "failed" ? "is-bad" : ""}`}>
                      <b className="wcc-msg__k">
                        {m.channel === "email" ? "✉️ Email" : m.dir === "in" ? "💬 Creator replied" : m.drip ? `🟢 WhatsApp · ${m.title}` : m.tpl ? `🟢 WhatsApp · ${m.tpl.replace(/_/g, " ")}` : m.key ? `🟢 WhatsApp · ${m.key.replace(/_/g, " ")}` : "🟢 WhatsApp"}
                        {m.dir === "out" ? (m.auto ? " · automatic" : " · by the team") : ""}
                      </b>
                      {m.parts ? (
                        <p>
                          {m.parts.map((pt, j) => (pt.v ? <mark key={j}>{pt.t}</mark> : <Fragment key={j}>{pt.t}</Fragment>))}
                        </p>
                      ) : (
                        <>
                          {m.header && <p className="wcc-hd">{m.header}</p>}
                          {m.text && <p>{m.text}</p>}
                          {m.footer && <p className="wcc-ft">{m.footer}</p>}
                        </>
                      )}
                      {Array.isArray(m.buttons) && m.buttons.length > 0 && (
                        <span className="wcc-btns">
                          {m.buttons.map((bt, j) => (
                            <span key={j}>{bt}</span>
                          ))}
                        </span>
                      )}
                      {m.follow && <p className="wcc-follow">↻ {m.follow}</p>}
                      <small>
                        {tm(m.at)}
                        {m.dir === "out" &&
                          (m.status === "failed"
                            ? ` · ✗ not sent${m.error ? " — " + String(m.error).slice(0, 90) : ""}`
                            : m.status === "queued"
                              ? " · ⏳ waiting to send"
                              : m.drip || m.snap
                                ? " · ✓ sent"
                                : m.status === "read"
                                  ? " · ✓✓ read"
                                  : m.status === "delivered"
                                    ? " · ✓✓ delivered"
                                    : " · ✓ sent")}
                      </small>
                    </div>
                  )}
                </Fragment>
              ))}
              <span ref={endRef} />
            </div>
            {canSend ? (
              <>
                <form className="wcc-send" onSubmit={send}>
                  <input id="wcc-msg" className="ga-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a WhatsApp message…" aria-label="Message" />
                  <button type="submit" className="ga-btn ga-btn--primary" aria-label="Send" disabled={!text.trim() || sending}>
                    {sending ? "…" : "➤"}
                  </button>
                </form>
                <p className="wcc-note">✓ They messaged in the last 24 h — you can reply here{winLeft ? ` (window open for ${winLeft} more)` : ""}.</p>
              </>
            ) : (
              <p className="wcc-closed">
                🔒 Typing a message is only possible within 24 hours of the creator’s last WhatsApp message.
                {lastIn ? ` Their last message was on ${new Date(lastIn).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}.` : " They haven’t messaged yet."}{" "}
                Their step messages keep going automatically.
              </p>
            )}
          </div>
          )}

          <div className="wcc-side">
            <div className="wcc-box">
              <h3 className="ga-h2">Details</h3>
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
              <h3 className="ga-h2">Actions</h3>
              <label className="wcc-move">
                <span>Move to</span>
                <select className="ga-input" value={curSt} disabled={busy === "move"} onChange={(e) => move(e.target.value)}>
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
                  <Link href={`/vault/creators/${memberId}/instagram`} className="wcc-btn">
                    📊 Instagram analytics
                  </Link>
                ) : (
                  <button type="button" className="wcc-btn" onClick={openPublic}>
                    📊 Instagram analytics
                  </button>
                )}
                <button type="button" className="wcc-btn" onClick={links}>
                  🔗 Links / courier
                </button>
                {x.kind === "p" && (
                  <button type="button" className="wcc-btn" onClick={sendEmail}>
                    ✉️ Email them
                  </button>
                )}
                {memberId && (
                  <>
                    <Link href={`/vault/creators/${memberId}/profile`} className="wcc-btn">
                      👤 Full profile &amp; history
                    </Link>
                    <Link href={`/vault/creators/${memberId}/media-kit`} className="wcc-btn">
                      🪪 Media Kit
                    </Link>
                  </>
                )}
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
        {x.kind === "p" && (
          <div className="wcc-box wcc-pp">
            <PartPanel
              row={x}
              busy={busy.startsWith("pp:") ? busy.slice(3) : ""}
              ship={camp?.campaign_type !== "paid"}
              onAct={async (k) => {
                setBusy("pp:" + k);
                await runAction(k, x, { campaignId: id, ask: askFn, say: setToast, reload, router, match: (bmatch.data || {})[rid], campaignName: camp?.name });
                setBusy("");
              }}
            />
          </div>
        )}
      </section>

      {pub && (
        <div className="ga-overlay" onClick={() => setPub(null)}>
          <div className="ga-modal wcc-modal wcc-pub" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Instagram analytics">
            <h2 className="ga-h2">📊 Instagram analytics · @{pub.handle}</h2>
            {pub.loading ? (
              <p>Loading…</p>
            ) : pub.error ? (
              <p>{pub.error}</p>
            ) : !(pub.data && pub.data.profile) ? (
              <p>No public numbers for @{pub.handle} yet — they fill in once Instagram shares them, or when the creator connects Instagram.</p>
            ) : (
              (() => {
                const P = pub.data.profile;
                const f = +P.followers || 0;
                const er = P.engagement != null ? Number(P.engagement) : f && P.avg_likes != null ? Math.round((10000 * ((+P.avg_likes || 0) + (+P.avg_comments || 0))) / f) / 100 : null;
                const posts = pub.data.posts || [];
                return (
                  <>
                    <div className="wcc-pubstats">
                      <div>
                        <b>{f ? f.toLocaleString("en-IN") : "—"}</b>followers
                      </div>
                      <div>
                        <b>{P.media_count != null ? P.media_count : "—"}</b>posts
                      </div>
                      <div>
                        <b>{P.avg_likes != null ? Math.round(P.avg_likes).toLocaleString("en-IN") : "—"}</b>avg likes
                      </div>
                      <div>
                        <b>{P.avg_comments != null ? Math.round(P.avg_comments).toLocaleString("en-IN") : "—"}</b>avg comments
                      </div>
                      <div>
                        <b>{er != null ? `${er}%` : "—"}</b>engagement
                      </div>
                    </div>
                    {P.bio && <p className="wcc-pubbio">{P.bio}</p>}
                    {posts.length > 0 && (
                      <table className="c2-t">
                        <thead>
                          <tr>
                            <th>Post</th>
                            <th>Views</th>
                            <th>Likes</th>
                            <th>Comments</th>
                          </tr>
                        </thead>
                        <tbody>
                          {posts.slice(0, 20).map((q, i) => (
                            <tr key={i}>
                              <td>
                                {/^https?:\/\//.test(q.permalink || q.url || "") ? (
                                  <a href={q.permalink || q.url} target="_blank" rel="noopener noreferrer">
                                    {q.media_type || "post"} ↗
                                  </a>
                                ) : (
                                  q.media_type || "post"
                                )}
                              </td>
                              <td>{q.views != null ? Number(q.views).toLocaleString("en-IN") : "—"}</td>
                              <td>{q.likes != null ? Number(q.likes).toLocaleString("en-IN") : "—"}</td>
                              <td>{q.comments != null ? Number(q.comments).toLocaleString("en-IN") : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {P.fetched_at && <p className="wcc-pubbio">From their public profile · {new Date(P.fetched_at).toLocaleDateString("en-IN")}</p>}
                  </>
                );
              })()
            )}
            <div className="wcc-modal__act">
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setPub(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {ask && (
        <div className="ga-overlay" onClick={() => setAsk(false)}>
          <div className="ga-modal wcc-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Remove creator">
            <h2 className="ga-h2">Delete {x.name} from this campaign?</h2>
            <p>Their contract, courier, video, posts and every message about this campaign go too. This can’t be undone.</p>
            <div className="wcc-modal__act">
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setAsk(false)}>
                Cancel
              </button>
              <button type="button" className="ga-btn ga-btn--danger" disabled={busy === "del"} onClick={remove}>
                {busy === "del" ? "Deleting…" : "🗑 Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {askEl}
      {toast && <div className="ga-toast">{toast}</div>}

      <style>{`
        /* Figma: select par arrow nahi */
        select.ga-input { appearance: none; -webkit-appearance: none; }
        .wcc { padding: 22px 22px 40px; }
        .wcc-top { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .wcc-grid--closed { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
        .wcc-grid--closed .wcc-side { order: -1; }
        .wcc-chatcard { display: flex; flex-direction: column; gap: 14px; padding: 18px; border-radius: 16px; border: 1px solid #dbe9e3; background: linear-gradient(180deg, #f3fbf7 0%, #ffffff 70%); }
        .wcc-chatcard__top { display: flex; align-items: center; gap: 12px; }
        .wcc-chatcard__ic { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; background: #0d5c4a; font-size: 19px; }
        .wcc-chatcard__top b { display: block; font-size: 15px; font-weight: 800; color: var(--ad-ink); }
        .wcc-chatcard__top small { display: block; margin-top: 2px; font-size: 12.5px; font-weight: 600; color: var(--ad-muted); }
        .wcc-chatcard__last { margin: 0; padding: 12px 14px; border-radius: 12px; background: #fff; border: 1px solid var(--ad-line); font-size: 13.5px; line-height: 1.5; color: var(--ad-ink); }
        .wcc-chatcard__last.is-in { border-color: #bfe6d3; background: #f0fbf5; }
        .wcc-chatcard__last em { display: block; margin-bottom: 3px; font-style: normal; font-size: 11.5px; font-weight: 700; color: var(--ad-muted); }
        .wcc-chatcard__acts { display: flex; flex-wrap: wrap; gap: 8px; }
        .wcc-chat__hacts { display: inline-flex; align-items: center; gap: 8px; }
        .wcc-hide { width: 34px; height: 34px; border: 0; border-radius: 10px; background: rgba(255,255,255,.16); color: #fff; font-size: 15px; cursor: pointer; }
        .wcc-hide:hover { background: rgba(255,255,255,.28); }
        .wcc-grid { display: grid; grid-template-columns: minmax(0, 625fr) minmax(0, 432fr); gap: 18px; margin-top: 13px; align-items: start; }

        .wcc-chat { overflow: hidden; border-radius: 16px; border: 1px solid var(--ad-line); background: #fff; }
        .wcc-chat__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 65px; padding: 0 16px; background: #0d5c4a; }
        .wcc-chat__head b { font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wcc-open { flex-shrink: 0; height: 41px; display: inline-flex; align-items: center; padding: 0 15px; border-radius: 10px; background: #fff; font-size: 14px; font-weight: 800; color: var(--ad-primary-ink); }
        .wcc-msgs { display: flex; flex-direction: column; gap: 10px; height: min(62vh, 600px); min-height: 320px; overflow-y: auto; padding: 13px 14px 14px; background: #f3f0e8; }
        .wcc-day { align-self: center; margin: 10px auto 2px; padding: 3px 10px; border-radius: 999px; background: rgba(127,127,127,.14); font-size: 11px; color: var(--ga-muted, #8a8f9c); }
        .wcc-pp { margin-top: 18px; }
        .wcc-pub { max-width: 720px; }
        .wcc-pubstats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; margin: 12px 0; }
        .wcc-pubstats div { display: flex; flex-direction: column; padding: 10px; border-radius: 10px; border: 1px solid var(--ad-line); font-size: 11.5px; color: var(--ad-muted); }
        .wcc-pubstats b { font-size: 17px; color: var(--ad-ink); }
        .wcc-pubbio { font-size: 12.5px; color: var(--ad-muted); margin: 6px 0; white-space: pre-wrap; }
        .wcc-msg { align-self: flex-start; width: min(447px, 88%); padding: 10px 12px 8px; border-radius: 9px; background: #fff; box-shadow: 0 1px 1px rgba(0,0,0,.06); }
        .wcc-msg p { white-space: pre-line; font-size: 13px; line-height: 1.33; color: var(--ad-ink); }
        .wcc-msg small { display: block; margin-top: 4px; text-align: right; font-size: 12px; color: var(--ad-muted); }
        .wcc-msg.is-me { align-self: flex-end; width: auto; max-width: 88%; background: #d9fdd3; }
        .wcc-msg.is-mail { background: #eef0ff; }
        .wcc-msg.is-bad { background: #fde8e8; }
        .wcc-msg__k { display: block; margin-bottom: 4px; font-size: 11.5px; font-weight: 800; color: #3b4a43; }
        .wcc-msg p { white-space: pre-wrap; word-break: break-word; }
        .wcc-hd { font-weight: 700; margin-bottom: 4px; }
        .wcc-ft { margin-top: 6px; font-size: 11.5px !important; color: var(--ad-muted) !important; }
        .wcc-btns { display: grid; gap: 4px; margin-top: 8px; }
        .wcc-btns span { display: block; padding: 6px 8px; border-radius: 8px; background: rgba(255,255,255,.75); border: 1px solid rgba(0,0,0,.06); text-align: center; font-size: 12.5px; font-weight: 700; color: #0b7a62; }
        .wcc-msg mark { background: rgba(13, 92, 74, 0.12); color: inherit; border-radius: 3px; padding: 0 2px; }
        .wcc-follow { margin-top: 5px; font-size: 12px; color: #5b6b63; }
        .wcc-sys { align-self: center; max-width: 92%; padding: 4px 11px; border-radius: 999px; background: rgba(102, 87, 233, 0.1); font-size: 11.5px; font-weight: 700; color: #4b3fc4; text-align: center; }
        .wcc-sum { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; padding: 9px 16px; border-bottom: 1px solid var(--ad-line); background: #fff; font-size: 13px; font-weight: 800; }
        .wcc-sum span { font-size: 11.5px; font-weight: 600; color: var(--ga-muted, #8a8f9c); }
        .wcc-top { justify-content: space-between; }
        .wcc-close { flex-shrink: 0; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 10px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 16px; font-weight: 800; color: var(--ad-ink, #1d1f27); cursor: pointer; }
        .wcc-close:hover { border-color: var(--ad-primary); color: var(--ad-primary); }
        .wcc-msg.is-me small { margin-top: 0; }
        .wcc-send { display: flex; gap: 8px; padding: 11px 14px 0; border-top: 1px solid var(--ad-line); }
        .wcc-send .ga-input { width: auto; min-width: 0; height: 42px; flex: 1 1 auto; }
        .wcc-closed { margin: 0; padding: 12px 16px 14px; border-top: 1px solid var(--ad-line); background: #fafaf7; font-size: 12.5px; line-height: 1.5; color: var(--ad-muted); }
        .wcc-send .ga-input::placeholder { color: #757575; }
        .wcc-send .ga-btn { width: 43px; height: 42px; padding: 0; font-size: 14px; }
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

        @media (max-width: 1180px) { .wcc-grid { grid-template-columns: 1fr; } .wcc-send .ga-input { flex: 1; width: auto; } }
        @media (max-width: 640px) {
          .wcc { padding: 16px 14px 24px; }
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
