"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BountyShell from "@/components/creater/BountyShell";
import { RumiTip } from "@/components/creater/OnboardShell";
import { useSession, useCreator, savePrefs, signOut as doSignOut, errText, getNotifyPrefs, setWaOptOut, setEmailUpdates, exportMyData, deleteAccount } from "@/services/creator";
import { SIDEKICKS, getSidekick } from "@/components/creater/data";
import { Check, LogOut } from "@/components/ui/Icons";

// Sidekick ka mood (Figma: "Playful · Match me · Auto scene")
const TONE = { rumi: "Playful", pip: "Dreamy", mochi: "Fiery", sprout: "Cheerful", pebble: "Calm", dot: "Helpful" };

/** +91 98••• ••321 (purane settings jaisa) */
const maskWa = (e) => {
  const d = String(e || "").replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `+91 ${d.slice(0, 2)}••• ••${d.slice(-3)}` : "";
};

/**
 * /creater/settings — purane loadSettings jaisa:
 *  my_notify_prefs · wa_set_opt_out · set_email_updates · tips (sidekick prefs) · social_accounts · download (get_my_profile + social_accounts + get_my_campaigns)
 *  · cookie popup (BountyShell) · creator_delete_me · sign out (sirf is browser mein)
 */
export default function Settings() {
  const router = useRouter();
  const [s, update] = useSession();
  const c = useCreator();
  const sk = getSidekick(s.sidekick);
  const [pick, setPick] = useState(false);
  const [np, setNp] = useState(null); // my_notify_prefs
  const [busyK, setBusyK] = useState("");
  const [dl, setDl] = useState(false);
  const [del, setDel] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState("");
  const [toast, setToast] = useState("");

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };
  const loadNp = async () => {
    const r = await getNotifyPrefs();
    if (r.error) flash(errText(r.error));
    setNp(r.data || {});
  };
  useEffect(() => {
    if (c.loggedIn) loadNp();
  }, [c.loggedIn]);

  const tipsOn = !(c.prefs?.vibe === "focused" || c.prefs?.tips === "asked");
  const notif = {
    wa: !!(np && np.whatsapp_linked && !np.whatsapp_off),
    email: !!(np && !np.email_off),
    tips: tipsOn,
  };
  const toggle = async (k) => {
    if (!np || busyK) return;
    if (k === "wa" && !np.whatsapp_linked) {
      router.push("/creater/profile/contact"); // pehle WhatsApp link karo
      return;
    }
    setBusyK(k);
    let r = { error: null };
    if (k === "wa") r = await setWaOptOut(notif.wa);
    if (k === "email") r = await setEmailUpdates(!notif.email);
    if (k === "tips") await savePrefs({ tips: tipsOn ? "asked" : "occasional" });
    if (r.error) flash(errText(r.error));
    if (k !== "tips") await loadNp();
    setBusyK("");
  };

  // Download my data — purane jaisa JSON file (browser mein hi banti hai)
  const download = async () => {
    if (dl) return;
    setDl(true);
    const out = await exportMyData(c);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
    a.download = "my-bounty-data.json";
    a.click();
    setDl(false);
  };

  const signOut = async () => {
    await doSignOut();
    router.replace("/creater");
  };
  const deleteMe = async () => {
    setDelBusy(true);
    setDelErr("");
    const r = await deleteAccount(confirm.trim());
    if (r.error) {
      setDelErr("Couldn't delete: " + errText(r.error));
      setDelBusy(false);
      return;
    }
    router.replace("/creater");
  };

  const accts = c.igAccounts || [];
  const waNum = maskWa(c.profile?.contact?.whatsapp_e164 || s.phone);

  return (
    <BountyShell>
      <title>Settings — Bounty</title>

      <p className="bx-eyebrow st-eye">My account</p>
      <h1 className="bx-title">Settings &amp; privacy</h1>
      <p className="bx-lede">You stay in control of your data.</p>

      <div className="st">
        <div className="st-col">
          {/* Sidekick */}
          <section className="bx-card st-sk">
            <div className="st-sk__row">
              <img src={sk.img} alt="" />
              <span>
                <strong>Sidekick: {sk.name}</strong>
                <small>{TONE[sk.id] || sk.trait} · Match me · Auto scene</small>
              </span>
              <button type="button" className="st-change" onClick={() => setPick(!pick)} aria-expanded={pick}>
                {pick ? "Done" : "Change"}
              </button>
            </div>
            {pick && (
              <div className="st-pick">
                {SIDEKICKS.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    className={x.id === s.sidekick ? "is-on" : ""}
                    style={{ background: x.bg }}
                    onClick={() => {
                      update({ sidekick: x.id });
                      flash(`${x.name} is your sidekick now`);
                    }}
                  >
                    <img src={x.img} alt="" />
                    <strong>{x.name}</strong>
                    <small>{x.trait}</small>
                  </button>
                ))}
              </div>
            )}
          </section>

          <p className="bx-section-label">Notifications</p>
          <section className="bx-card st-list">
            {[
              ["wa", np && !np.whatsapp_linked ? "WhatsApp campaign alerts (link WhatsApp first)" : "WhatsApp campaign alerts"],
              ["email", "Email updates"],
              ["tips", `Growth tips from ${sk.name}`],
            ].map(([k, l]) => (
              <div key={k} className="st-row">
                <span>{l}</span>
                <button
                  type="button"
                  className={`bx-toggle ${notif[k] ? "is-on" : ""}`}
                  onClick={() => toggle(k)}
                  disabled={!np || busyK === k}
                  aria-pressed={notif[k]}
                  aria-label={l}
                />
              </div>
            ))}
          </section>

          <p className="bx-section-label">Connected accounts</p>
          <section className="bx-card st-list st-list--acc">
            {accts.length ? (
              accts.map((a) => (
                <div key={a.id || a.username} className="st-row">
                  <span className="st-acc">
                    <i>📸</i> <b>@{a.username}</b>
                    <em className="st-ok">✓ Connected</em>
                  </span>
                  <Link href="/creater/profile/instagram" className="st-change">
                    Manage
                  </Link>
                </div>
              ))
            ) : (
              <div className="st-row">
                <span className="st-acc">
                  <i>📸</i> <b>No Instagram connected</b>
                </span>
                <Link href="/creater/onboarding/meta" className="bx-btn bx-btn--dark bx-btn--sm st-conn">
                  Connect
                </Link>
              </div>
            )}
            <div className="st-row">
              <span className="st-acc">
                <i>💬</i> <b>{waNum ? `WhatsApp ${waNum}` : "WhatsApp not linked"}</b>
              </span>
              {!(np && np.whatsapp_linked) && np && (
                <Link href="/creater/profile/contact" className="bx-btn bx-btn--dark bx-btn--sm st-conn">
                  Link
                </Link>
              )}
            </div>
          </section>
        </div>

        <div className="st-col">
          <p className="bx-section-label st-first">Your data</p>
          <button type="button" className="bx-card st-data" onClick={download} disabled={dl}>
            {dl ? (
              <strong>Preparing…</strong>
            ) : (
              <>
                <strong>⤓ Download my data</strong>
                <small>Profile, Instagram and campaigns as a file</small>
              </>
            )}
          </button>
          <button type="button" className="bx-card st-data" onClick={() => window.dispatchEvent(new Event("bounty-cookie"))}>
            <strong>🍪 Cookie settings</strong>
            <small>Essential only or allow analytics — change any time</small>
          </button>

          <section className="st-del">
            <strong>Delete my account</strong>
            <p>{del ? "This permanently deletes your login, profile, Instagram connection, campaign history and messages. It can’t be undone." : "Removes your profile and campaign history. Type DELETE to confirm."}</p>
            {!del ? (
              <button type="button" className="st-delbtn" onClick={() => setDel(true)}>
                Delete account
              </button>
            ) : (
              <div className="st-del__confirm">
                <input className="bx-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type DELETE" aria-label="Type DELETE to confirm" autoComplete="off" />
                <div>
                  <button
                    type="button"
                    className="bx-btn bx-btn--ghost bx-btn--sm"
                    onClick={() => {
                      setDel(false);
                      setConfirm("");
                      setDelErr("");
                    }}
                  >
                    Cancel
                  </button>
                  <button type="button" className="bx-btn bx-btn--danger bx-btn--sm" disabled={confirm.trim() !== "DELETE" || delBusy} onClick={deleteMe}>
                    {delBusy ? "Deleting…" : "Delete forever"}
                  </button>
                </div>
                {delErr && <p className="bx-err">{delErr}</p>}
              </div>
            )}
          </section>

          <RumiTip className="st-rumi" name={sk.name} img={sk.img} text="Alerts off? You’ll still see every update in Inbox." />

          <button type="button" className="st-out" onClick={signOut}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {toast && (
        <div className="bx-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .st-eye { text-align: center; }
        .st { position: relative; left: 11px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 46px; max-width: 966px; margin: 14px auto 0; align-items: start; }
        .st-col > .bx-section-label { margin: 24px 0 14px; }
        .st-first { margin-top: 0 !important; }
        .st-sk { padding: 12px 14px 12px 12px; border-radius: 16px; }
        .st-sk__row { display: flex; align-items: center; gap: 13px; }
        .st-sk__row img { width: 54px; height: 50px; object-fit: contain; }
        .st-sk__row span { flex: 1; min-width: 0; }
        .st-sk__row strong { display: block; font-family: var(--bx-serif); font-size: 17px; line-height: 21px; font-weight: 600; color: #0e2a33; }
        .st-sk__row small { display: block; margin-top: 4px; font-size: 12.5px; line-height: 16px; color: #3e4b52; }
        .st-change { display: inline-flex; align-items: center; height: 34px; padding: 0 16px; border-radius: 999px; border: 1px solid #c9b38a; background: #fffaef; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: #2a1e14; }
        .st-pick { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
        .st-pick button { display: flex; flex-direction: column; align-items: center; padding: 8px 6px; border: 2px solid transparent; border-radius: 12px; }
        .st-pick button.is-on { border-color: #2bc0e4; }
        .st-pick img { width: 48px; height: 48px; object-fit: contain; }
        .st-pick strong { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
        .st-pick small { font-size: 11px; color: var(--bx-text); }
        .st-list { padding: 8px 12px 8px 13px; border-radius: 16px; }
        .st-list + .bx-section-label { margin-top: 28px !important; }
        .st-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 51px; font-size: 14px; color: #14231a; }
        .st-row + .st-row { border-top: 1px solid var(--bx-line); }
        .st-row .bx-toggle { width: 44px; height: 20px; background: #c8bda3; }
        .st-row .bx-toggle::after { width: 16px; height: 16px; top: 2px; left: 2px; background: rgba(255,255,255,.85); box-shadow: none; }
        .st-row .bx-toggle.is-on { background: #2e9c94; }
        .st-row .bx-toggle.is-on::after { transform: translateX(24px); background: rgba(255,255,255,.18); }
        .st-acc { display: inline-flex; align-items: center; gap: 10px; min-width: 0; overflow-wrap: anywhere; }
        .st-acc i { font-style: normal; font-size: 14px; }
        .st-acc b { font-size: 14px; font-weight: 900; color: #0e2a33; }
        .st-ok { margin-left: 6px; padding: 2px 7px; border-radius: 999px; background: #dff0dc; font-style: normal; font-family: var(--bx-jak); font-size: 11px; font-weight: 700; color: #2f6b3d; white-space: nowrap; }
        .st-list--acc .st-row { min-height: 42px; }
        .st-conn { height: 30px; padding: 0 14px; font-family: var(--bx-sans, inherit); font-size: 14px; }
        .st-data { display: block; width: 100%; margin-bottom: 8px; padding: 13px 14px 12px; border-radius: 16px; text-align: left; }
        .st-data:hover { border-color: var(--bx-gold); }
        .st-data strong { display: flex; align-items: center; gap: 4px; font-size: 15px; line-height: 20px; font-weight: 700; color: #14231a; }
        .st-data small { display: block; margin-top: 1px; font-size: 12.5px; line-height: 16px; color: #3e4b52; }
        .st-del { margin-top: 12px; padding: 14px 14px 14px 15px; border-radius: 16px; background: #f7d6cb; border: 1px solid #e8ad9b; }
        .st-del strong { display: block; font-family: var(--bx-serif); font-size: 18px; line-height: 22px; font-weight: 600; color: #a8321f; }
        .st-del p { margin: 4px 0 13px; font-size: 12.5px; line-height: 16px; color: #5a3a30; }
        .st-delbtn { height: 36px; padding: 0 18px; border: 0; border-radius: 999px; background: #b8401f; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: #fff; }
        .st-del__confirm { display: grid; gap: 8px; }
        .st-del__confirm div { display: flex; gap: 8px; }
        .st-rumi { justify-content: center; margin-top: 18px; }
        .st-rumi img { width: 60px; height: 52px; }
        .st-rumi p { max-width: 230px; font-size: 13.5px !important; line-height: 18.2px; }
        .st-out { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 16px auto 0; border: 0; background: none; font-size: 13px; font-weight: 700; color: #b8401f; }
        @media (max-width: 767px) {
          .st { margin-top: 14px; }
          .st-col > .bx-section-label { margin: 22px 0 8px; }
          .st-col:last-child > .bx-section-label { margin-top: 30px !important; }
          .st-list--acc { padding-top: 5px; padding-bottom: 5px; }
          .st-list + .bx-section-label { margin-top: 22px !important; }
          .st-sk__row img { width: 50px; height: 46px; }
          .st-sk__row small { white-space: nowrap; }
          .st-change { height: 32px; padding: 0 14px; font-size: 13px; }
          .st-list { padding: 1px 12px 1px 16px; }
          .st-row { min-height: 44px; }
          .st-list--acc .st-row { min-height: 39px; }
          .st-row .bx-toggle { height: 24px; border-radius: 12px; }
          .st-row .bx-toggle::after { width: 20px; height: 20px; }
          .st-row .bx-toggle.is-on::after { transform: translateX(20px); }
          .st-data { padding: 11px 16px 10px; margin-bottom: 6px; }
          .st-del { margin-top: 14px; padding: 14px 16px 14px; }
          .st-rumi { display: none; }
        }
        @media (max-width: 900px) { .st { left: 0; grid-template-columns: minmax(0, 1fr); } .st-first { margin-top: 24px !important; } }
      `}</style>
    </BountyShell>
  );
}
