"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandShell from "@/components/brands/BrandShell";
import { BrLoading, BrError } from "@/components/brands/BrandStates";
import {
  useBrand,
  brandView,
  reloadPortal,
  changePassword,
  verifyPassword,
  useTeam,
  addTeammate,
  setTeammateRole,
  removeTeammate,
  teammateLoginText,
  startFacebookLink,
  finishFacebookLink,
  unlinkFacebook,
  initials,
  gradFor,
  fdate,
  fdatetime,
} from "@/services/brand";
import { Lock, Send, LinkIcon, Facebook, Users, Plus, Check, Eye, EyeOff } from "@/components/ui/Icons";

// Figma ke role naam ↔ purane brand roles (owner / approver / viewer)
const ROLES = [
  { key: "owner", role: "Admin", note: "Everything, incl. billing & team" },
  { key: "approver", role: "Approver", note: "Approve creators & videos" },
  { key: "viewer", role: "View only", note: "See campaigns and reports" },
];
const roleOf = (k) => ROLES.find((r) => r.key === k) || ROLES[0];

/**
 * /brands/settings — purana paintSettings + paintTeam:
 *  - login: email (brand_portal.me), password badlo (auth.updateUser, 8+ chars, dono match)
 *  - Facebook business: link (brand-fb-login url → link), unlink (confirm) — wapsi ?state=fbbrand:link:… yahin poori hoti hai
 *  - team: api.brand_team; admin (owner) add / role / remove → brand-login team_add / team_role / team_remove
 */
export default function BrandSettings() {
  const router = useRouter();
  const b = useBrand();
  const v = brandView(b);
  const team = useTeam();
  const [pwOpen, setPwOpen] = useState(false);
  const [reset, setReset] = useState(false); // reset email ke link se aaye — current password nahi chahiye
  const [pw, setPw] = useState({ now: "", next: "", again: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwErr, setPwErr] = useState("");
  const [fbBusy, setFbBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("approver");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteErr, setInviteErr] = useState("");
  const [creds, setCreds] = useState(null); // naye teammate ka login — password sirf abhi dikhta hai
  const [toast, setToast] = useState("");

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2800);
  };

  // Facebook link ki wapsi (purana fbReturn) + reset link se aaye (?reset=1)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("reset")) {
      setReset(true);
      setPwOpen(true);
      flash("Set your new password");
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
    finishFacebookLink().then((r) => {
      if (!r) return;
      flash(r.message);
      reloadPortal();
      if (r.ok && r.after === "facebook") router.replace("/brands/facebook");
    });
  }, [router]);

  const pwOk = (reset || pw.now.length > 0) && pw.next.length >= 8 && pw.next === pw.again;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const site = (v.user.email.split("@")[1] || "brand.com").toLowerCase();
  const t = team.data;
  const members = (t && t.members) || [];
  const owner = t ? t.my_role === "owner" : false;
  const full = t ? members.length >= (t.max || 5) : false;
  const fb = v.facebook;

  // Password badlo (purana bpxPw → auth.updateUser)
  const savePw = async (e) => {
    e.preventDefault();
    if (!pwOk || pwBusy) return;
    setPwErr("");
    setPwBusy(true);
    if (!reset) {
      const c = await verifyPassword(pw.now);
      if (c.error) {
        setPwBusy(false);
        return setPwErr(c.error.message);
      }
    }
    const r = await changePassword(pw.next);
    setPwBusy(false);
    if (r.error) return setPwErr(r.error.message || String(r.error));
    setPwOpen(false);
    setReset(false);
    setPwDone(true);
    setPw({ now: "", next: "", again: "" });
    flash("Password changed ✓");
  };

  // Teammate add (purana bpxTeamF → brand-login team_add)
  const invite = async (e) => {
    e.preventDefault();
    if (!emailOk || inviteBusy) return;
    const clean = email.trim().toLowerCase();
    if (members.some((m) => (m.email || "").toLowerCase() === clean)) return flash("Already in your team");
    setInviteErr("");
    setInviteBusy(true);
    const r = await addTeammate({ email: clean, name: "", role });
    setInviteBusy(false);
    if (r.error) return setInviteErr(r.error.message || String(r.error));
    setEmail("");
    setCreds(r.data);
    team.reload();
    flash("Login ready — share it with your teammate");
  };
  const changeRole = async (m, k) => {
    const r = await setTeammateRole(m.member_id, k);
    flash(r.error ? r.error.message : `${m.name || m.email} is now ${roleOf(k).role}`);
    team.reload();
  };
  const remove = async (m) => {
    if (!window.confirm("Remove this login? They can't sign in any more.")) return;
    const r = await removeTeammate(m.member_id);
    flash(r.error ? r.error.message : `${m.name || m.email} removed`);
    team.reload();
  };
  const linkFb = async () => {
    setFbBusy(true);
    const r = await startFacebookLink("settings");
    if (r.error) {
      setFbBusy(false);
      flash(r.error.message);
    }
  };
  const unlinkFb = async () => {
    if (!window.confirm("Unlink Facebook? You can still sign in with email & password.")) return;
    setFbBusy(true);
    const r = await unlinkFacebook();
    setFbBusy(false);
    if (r.error) return flash(r.error.message);
    await reloadPortal();
    flash("Facebook business unlinked");
  };
  const copyCreds = () => {
    try {
      navigator.clipboard.writeText(teammateLoginText(creds, v.name));
      flash("Copied ✓");
    } catch {
      /* ignore */
    }
  };

  return (
    <BrandShell>
      <title>Settings — Geek OS Brand</title>

      <p className="br-eyebrow">Account</p>
      <h1 className="br-h1">Settings</h1>
      <p className="br-sub">Your login, the Facebook business link and who on your team can do what.</p>

      {/* Login */}
      <section className="br-card st-card">
        <div className="st-title">
          <span className="st-ic">
            <Lock size={16} />
          </span>
          <div>
            <h2 className="br-card__title">Your login</h2>
            <p className="br-card__sub">How you sign in to Geek OS</p>
          </div>
        </div>
        <div className="st-login">
          <div>
            <label className="br-label">Email</label>
            <div className="st-fake">
              <Send size={13} /> {v.user.email || "—"}
            </div>
            <p className="st-hint">Ask Geek to change the login email</p>
          </div>
          <div>
            <label className="br-label">Password</label>
            <div className="st-pwrow">
              <div className="st-fake st-fake--muted">{pwDone ? "Changed just now" : "••••••••"}</div>
              <button
                type="button"
                className="br-btn br-btn--ghost"
                onClick={() => {
                  setPwOpen(!pwOpen);
                  setPwErr("");
                }}
              >
                {pwOpen ? "Cancel" : "Change password"}
              </button>
            </div>
          </div>
        </div>

        {pwOpen && (
          <form className="st-pwform" onSubmit={savePw}>
            {[
              ["now", "Current password"],
              ["next", "New password (8+ characters)"],
              ["again", "Type the new password again"],
            ]
              .filter(([k]) => !(reset && k === "now"))
              .map(([k, label]) => (
              <div key={k}>
                <label className="br-label">{label}</label>
                <input
                  className="br-input"
                  type={showPw ? "text" : "password"}
                  autoComplete={k === "now" ? "current-password" : "new-password"}
                  value={pw[k]}
                  onChange={(e) => setPw({ ...pw, [k]: e.target.value })}
                />
              </div>
            ))}
            <div className="st-pwform__foot">
              <button type="button" className="st-show" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />} {showPw ? "Hide" : "Show"} passwords
              </button>
              {pw.again && pw.next !== pw.again && <span className="st-err">Passwords don’t match.</span>}
              {pwErr && <span className="st-err">{pwErr}</span>}
              <button type="submit" className="br-btn br-btn--primary" disabled={!pwOk || pwBusy}>
                {pwBusy ? "Saving…" : "Save password"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Facebook business */}
      <section className="br-card st-card">
        <div className="st-title">
          <span className="st-ic">
            <LinkIcon size={16} />
          </span>
          <div>
            <h2 className="br-card__title">Facebook business</h2>
            <p className="br-card__sub">Lets Geek OS read your Page, Instagram business account and ads</p>
          </div>
        </div>
        <div className="st-fb">
          <span className="st-fb__ic">
            <Facebook size={17} />
          </span>
          <div className="st-fb__txt">
            {fb ? (
              <>
                <strong>Connected as {fb.fb_name || v.user.name}</strong>
                <small>
                  {[
                    (fb.pages || []).map((p) => p.name).join(", ") || "No Pages shared",
                    ...(fb.pages || []).filter((p) => p.instagram).map((p) => "@" + p.instagram.username),
                    (fb.ad_accounts || []).length ? `${fb.ad_accounts.length} ad account${fb.ad_accounts.length === 1 ? "" : "s"}` : "",
                    fb.refreshed_at ? `updated ${fdatetime(fb.refreshed_at)}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </>
            ) : (
              <>
                <strong>Not connected</strong>
                <small>Link your Facebook (Business Manager) once — then sign in with one tap and manage your Pages and ads. Nothing is posted unless you post it.</small>
              </>
            )}
          </div>
          {fb ? (
            <>
              <span className="br-badge br-badge--green">Connected</span>
              <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={unlinkFb} disabled={fbBusy}>
                Unlink
              </button>
            </>
          ) : (
            <button type="button" className="br-btn br-btn--sm st-fbbtn" onClick={linkFb} disabled={fbBusy}>
              <Facebook size={13} /> {fbBusy ? "Opening Facebook…" : "Connect Facebook"}
            </button>
          )}
        </div>
      </section>

      {/* Team */}
      <section className="br-card st-card">
        <div className="st-title">
          <span className="st-ic">
            <Users size={16} />
          </span>
          <div>
            <h2 className="br-card__title">Team</h2>
            <p className="br-card__sub">People from {v.name} who can use this workspace</p>
          </div>
        </div>

        {team.loading && !t ? (
          <BrLoading rows={3} />
        ) : team.error && !t ? (
          <BrError error={team.error} onRetry={team.reload} />
        ) : (
          <>
            <ul className="st-team">
              {members.map((m) => {
                const you = m.member_id === t.me;
                const r = roleOf(m.role);
                return (
                  <li key={m.member_id}>
                    <div className="br-who st-team__who">
                      <span className="br-av" style={{ background: gradFor(m.name || m.email) }}>
                        {initials(m.name || m.email)}
                      </span>
                      <span>
                        <strong>
                          {m.name || (m.email || "").split("@")[0]}
                          {you ? " (you)" : ""}
                          {!m.last_sign_in ? <em className="st-inv">Never signed in</em> : null}
                        </strong>
                        <small>
                          {m.email}
                          {m.last_sign_in ? ` · last sign-in ${fdate(m.last_sign_in)}` : ""}
                        </small>
                      </span>
                    </div>
                    <select className="st-role" value={r.key} disabled={you || !owner} onChange={(e) => changeRole(m, e.target.value)} aria-label={`Role for ${m.name || m.email}`}>
                      {ROLES.map((x) => (
                        <option key={x.key} value={x.key}>
                          {x.role}
                        </option>
                      ))}
                    </select>
                    <span className="st-team__note">{r.note}</span>
                    {you || !owner ? (
                      <span className="st-team__rm" />
                    ) : (
                      <button type="button" className="st-team__rm" onClick={() => remove(m)}>
                        Remove
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {owner && !full && (
              <form className="st-invite" onSubmit={invite}>
                <label className="st-invite__mail">
                  <Send size={13} />
                  <input type="email" placeholder={`name@${site}`} value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <select className="st-role" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role for new member">
                  {[ROLES[1], ROLES[2], ROLES[0]].map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.role}
                    </option>
                  ))}
                </select>
                <button type="submit" className="br-btn br-btn--primary" disabled={!emailOk || inviteBusy}>
                  <Plus size={14} /> {inviteBusy ? "Adding…" : "Invite"}
                </button>
              </form>
            )}
            {email && !emailOk && <p className="st-err st-err--block">Enter a valid work email.</p>}
            {inviteErr && <p className="st-err st-err--block">{inviteErr}</p>}
            {t && (
              <p className="st-hint st-teamhint">
                {members.length} of {t.max || 5} logins ·{" "}
                {!owner ? "Only your team's admin can add or remove logins." : full ? "Remove a login to add someone new." : "The new login's password is shown once — share it with them."}
              </p>
            )}
            {creds && (
              <div className="st-creds">
                <strong>
                  <Check size={14} /> Login ready — the password is shown only now
                </strong>
                <span>
                  Email <b>{creds.email}</b>
                </span>
                <span>
                  Password <code>{creds.password}</code>
                </span>
                <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={copyCreds}>
                  Copy login
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .st-card { margin-top: 18px; padding: 22px; }
        .st-card:first-of-type { margin-top: 22px; }
        .st-title { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .st-ic { width: 36px; height: 36px; border-radius: 10px; background: var(--br-lilac); color: var(--br-primary); display: grid; place-items: center; flex-shrink: 0; }

        .st-login { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .st-fake {
          display: flex; align-items: center; gap: 9px; height: 44px; padding: 0 14px;
          border: 1px solid var(--br-border-2); border-radius: 10px; background: #fff; font-size: 13.5px;
          overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
        }
        .st-fake svg { color: var(--br-faint); flex-shrink: 0; }
        .st-fake--muted { flex: 1; min-width: 0; background: #f4f5fa; border-color: transparent; color: var(--br-muted); }
        .st-hint { margin: 6px 0 0; font-size: 11.5px; color: var(--br-faint); }
        .st-pwrow { display: flex; gap: 10px; }
        .st-pwrow .br-btn { height: 44px; }

        .st-pwform { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--br-border); }
        .st-pwform__foot { grid-column: 1 / -1; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .st-pwform__foot .br-btn { margin-left: auto; }
        .st-show { display: inline-flex; align-items: center; gap: 6px; border: 0; background: none; padding: 0; font-size: 12.5px; font-weight: 600; color: var(--br-muted); }
        .st-err { font-size: 12px; color: var(--br-red); }
        .st-err--block { display: block; margin: 8px 0 0; }

        .st-fb { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 14px 16px; border-radius: 12px; background: #f4f5fa; }
        .st-fb__ic { width: 38px; height: 38px; border-radius: 10px; background: var(--br-fb); color: #fff; display: grid; place-items: center; flex-shrink: 0; }
        .st-fb__txt { flex: 1; min-width: 200px; }
        .st-fb__txt strong { display: block; font-size: 14px; font-weight: 700; }
        .st-fb__txt small { display: block; font-size: 12px; color: var(--br-muted); }
        .st-fbbtn { background: var(--br-fb); color: #fff; }

        .st-team { list-style: none; margin: 0; padding: 0; border: 1px solid var(--br-border); border-radius: 14px; }
        .st-team li { display: grid; grid-template-columns: minmax(0, 1.3fr) 140px minmax(0, 1fr) 70px; align-items: center; gap: 14px; padding: 12px 14px; }
        .st-team li + li { border-top: 1px solid var(--br-border); }
        .st-team__who > span:last-child { min-width: 0; }
        .st-team__who strong, .st-team__who small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .st-inv { margin-left: 8px; font-style: normal; font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 999px; background: var(--br-orange-bg); color: var(--br-orange); }
        .st-role {
          height: 36px; padding: 0 10px; border: 1px solid var(--br-border-2); border-radius: 9px;
          background: #fff; font-size: 13px; font-weight: 600; outline: none; max-width: 100%;
        }
        .st-role:disabled { background: #f4f5fa; color: var(--br-ink); opacity: 1; }
        .st-team__note { font-size: 12.5px; color: var(--br-muted); }
        .st-team__rm { justify-self: end; border: 0; background: none; padding: 0; font-size: 12.5px; font-weight: 600; color: var(--br-red); }

        .st-invite { display: flex; gap: 10px; margin-top: 14px; }
        .st-teamhint { margin-top: 10px; }
        .st-creds { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; margin-top: 12px; padding: 12px 14px; border-radius: 12px; background: var(--br-green-bg); font-size: 13px; }
        .st-creds strong { flex-basis: 100%; display: inline-flex; align-items: center; gap: 6px; color: var(--br-green); font-size: 13px; }
        .st-creds code { padding: 2px 8px; border-radius: 6px; background: #fff; font-size: 13px; }
        .st-invite__mail {
          flex: 1; min-width: 0; display: flex; align-items: center; gap: 9px; height: 44px; padding: 0 14px;
          border: 1px solid var(--br-border-2); border-radius: 10px; color: var(--br-faint);
        }
        .st-invite__mail input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font-size: 13.5px; color: var(--br-ink); }
        .st-invite .st-role, .st-invite .br-btn { height: 44px; }

        @media (max-width: 900px) {
          .st-team li { grid-template-columns: minmax(0, 1fr) 130px; }
          .st-team__note { grid-column: 1 / 2; margin-top: -6px; }
          .st-team__rm { grid-column: 2; grid-row: 2; }
        }
        @media (max-width: 640px) {
          .st-card { padding: 18px; }
          .st-login, .st-pwform { grid-template-columns: 1fr; }
          .st-pwform__foot .br-btn { width: 100%; }
          .st-invite { flex-wrap: wrap; }
          .st-invite__mail { flex-basis: 100%; }
          .st-invite .st-role, .st-invite .br-btn { flex: 1; }
        }
      `}</style>
    </BrandShell>
  );
}
