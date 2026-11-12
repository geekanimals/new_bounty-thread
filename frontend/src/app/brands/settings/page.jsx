"use client";

import { useState } from "react";
import BrandShell from "@/components/brands/BrandShell";
import { USER, BRAND, TEAM, ROLES } from "@/components/brands/data";
import { Lock, Send, LinkIcon, Facebook, Users, Plus, Check, Eye, EyeOff } from "@/components/ui/Icons";

/** /brands/settings — login, Facebook business link aur team (kaun kya kar sakta hai) */
export default function BrandSettings() {
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ now: "", next: "", again: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const [fbOn, setFbOn] = useState(true);
  const [team, setTeam] = useState(TEAM);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Approver");
  const [toast, setToast] = useState("");

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };

  const pwOk = pw.now.length > 0 && pw.next.length >= 8 && pw.next === pw.again;
  const emailOk = /^[^\s@]+@nykaa\.com$/i.test(email.trim());
  const roleNote = (r) => ROLES.find((x) => x.role === r)?.note || "";

  const invite = (e) => {
    e.preventDefault();
    if (!emailOk) return;
    const clean = email.trim().toLowerCase();
    if (team.some((m) => m.email === clean)) {
      flash("Already in your team");
      return;
    }
    const name = clean
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    setTeam([...team, { name, initials, email: clean, role, note: roleNote(role), av: "linear-gradient(135deg,#f59e0b,#fbbf24)", invited: true }]);
    setEmail("");
    flash(`Invite sent to ${clean}`);
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
              <Send size={13} /> {USER.email}
            </div>
            <p className="st-hint">Ask Geek to change the login email</p>
          </div>
          <div>
            <label className="br-label">Password</label>
            <div className="st-pwrow">
              <div className="st-fake st-fake--muted">{pwDone ? "Changed just now" : "Last changed 3 months ago"}</div>
              <button type="button" className="br-btn br-btn--ghost" onClick={() => setPwOpen(!pwOpen)}>
                {pwOpen ? "Cancel" : "Change password"}
              </button>
            </div>
          </div>
        </div>

        {pwOpen && (
          <form
            className="st-pwform"
            onSubmit={(e) => {
              e.preventDefault();
              if (!pwOk) return;
              setPwOpen(false);
              setPwDone(true);
              setPw({ now: "", next: "", again: "" });
              flash("Password changed");
            }}
          >
            {[
              ["now", "Current password"],
              ["next", "New password (8+ characters)"],
              ["again", "Type the new password again"],
            ].map(([k, label]) => (
              <div key={k}>
                <label className="br-label">{label}</label>
                <input className="br-input" type={showPw ? "text" : "password"} value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} />
              </div>
            ))}
            <div className="st-pwform__foot">
              <button type="button" className="st-show" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />} {showPw ? "Hide" : "Show"} passwords
              </button>
              {pw.again && pw.next !== pw.again && <span className="st-err">Passwords don’t match.</span>}
              <button type="submit" className="br-btn br-btn--primary" disabled={!pwOk}>
                Save password
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
            {fbOn ? (
              <>
                <strong>Connected as {USER.name}</strong>
                <small>
                  {BRAND.name} Page · {BRAND.ig} · 2 ad accounts · since 4 Aug 2026
                </small>
              </>
            ) : (
              <>
                <strong>Not connected</strong>
                <small>Connect to see Instagram, Facebook posts, comments and ads inside Geek OS</small>
              </>
            )}
          </div>
          {fbOn ? (
            <>
              <span className="br-badge br-badge--green">Connected</span>
              <button
                type="button"
                className="br-btn br-btn--ghost br-btn--sm"
                onClick={() => {
                  setFbOn(false);
                  flash("Facebook business unlinked");
                }}
              >
                Unlink
              </button>
            </>
          ) : (
            <button
              type="button"
              className="br-btn br-btn--sm st-fbbtn"
              onClick={() => {
                setFbOn(true);
                flash("Facebook business connected");
              }}
            >
              <Facebook size={13} /> Connect Facebook
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
            <p className="br-card__sub">People from {BRAND.name} who can use this workspace</p>
          </div>
        </div>

        <ul className="st-team">
          {team.map((m, i) => (
            <li key={m.email}>
              <div className="br-who st-team__who">
                <span className="br-av" style={{ background: m.av }}>
                  {m.initials}
                </span>
                <span>
                  <strong>
                    {m.name}
                    {m.you ? " (you)" : ""}
                    {m.invited ? <em className="st-inv">Invited</em> : null}
                  </strong>
                  <small>{m.email}</small>
                </span>
              </div>
              <select
                className="st-role"
                value={m.role}
                disabled={m.you}
                onChange={(e) => {
                  const r = e.target.value;
                  setTeam(team.map((x, j) => (j === i ? { ...x, role: r, note: roleNote(r) } : x)));
                  flash(`${m.name} is now ${r}`);
                }}
                aria-label={`Role for ${m.name}`}
              >
                {ROLES.map((r) => (
                  <option key={r.role}>{r.role}</option>
                ))}
              </select>
              <span className="st-team__note">{m.note}</span>
              {m.you ? (
                <span className="st-team__rm" />
              ) : (
                <button
                  type="button"
                  className="st-team__rm"
                  onClick={() => {
                    setTeam(team.filter((x) => x.email !== m.email));
                    flash(`${m.name} removed`);
                  }}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>

        <form className="st-invite" onSubmit={invite}>
          <label className="st-invite__mail">
            <Send size={13} />
            <input type="email" placeholder={`name@${BRAND.site}`} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <select className="st-role" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role for new member">
            {ROLES.map((r) => (
              <option key={r.role}>{r.role}</option>
            ))}
          </select>
          <button type="submit" className="br-btn br-btn--primary" disabled={!emailOk}>
            <Plus size={14} /> Invite
          </button>
        </form>
        {email && !emailOk && <p className="st-err st-err--block">Use a work email ending in @{BRAND.site}.</p>}
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
