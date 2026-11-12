"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, useToast } from "@/components/admin/settings/kit";

const INTEGRATIONS = [
  { name: "Instagram", sub: "Connected · @geekanimals" },
  { name: "WhatsApp", sub: "Connected · Cloud API" },
  { name: "Email", sub: "Connected · SMTP" },
];

/** /admin/settings (= Team) — team, pending invites, integrations, public page */
export default function SettingsTeam() {
  const [team, setTeam] = useState([
    { name: "Mayank", role: "Owner", since: "13 Sep 2026" },
    { name: "Shivam", role: "Admin", since: "17 Oct 2026" },
  ]);
  const [invites, setInvites] = useState([]);
  const [modal, setModal] = useState(null); // invite | {remove}
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Admin");
  const [err, setErr] = useState("");
  const [agency, setAgency] = useState("");
  const [site, setSite] = useState("");
  const [link, setLink] = useState("");
  const [toast, say] = useToast();

  const invite = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr("Enter a valid email.");
    setInvites((l) => [...l, { email: email.trim(), role, sent: "Just now" }]);
    say(`Invite sent to ${email.trim()}`);
    setEmail("");
    setErr("");
    setModal(null);
  };
  const remove = () => {
    setTeam((t) => t.filter((m) => m.name !== modal.remove));
    say(`${modal.remove} removed from the team`);
    setModal(null);
  };
  const save = () => {
    const slug = (agency.trim() || "Geek Creative Agency").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const url = `bountythreads.geekcreativeagency.com/a/${slug}`;
    setLink(url);
    try {
      navigator.clipboard?.writeText(`https://${url}`);
    } catch {
      /* ignore */
    }
    say("Saved — link copied");
  };

  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />

      <Panel
        className="st-team"
        title="Team"
        sub="People who run Geek OS with you."
        action={
          <button type="button" className="ad-btn ad-btn--primary" onClick={() => setModal("invite")}>
            Invite teammate
          </button>
        }
      >
        <Table
          rowH={56}
          minW={640}
          cols={[
            { label: "Member", w: 242 },
            { label: "Role", w: 209 },
            { label: "Since", w: 332 },
            { label: "", w: 293 },
          ]}
          rows={team.map((m) => [
            <b key="n">{m.name}</b>,
            m.role,
            m.since,
            m.role === "Owner" ? (
              ""
            ) : (
              <button key="r" type="button" className="sk-link" onClick={() => setModal({ remove: m.name })}>
                Remove
              </button>
            ),
          ])}
        />
      </Panel>

      <Panel title="Pending invites" className="st-inv">
        {invites.length ? (
          <Table
            rowH={52}
            minW={560}
            cols={[
              { label: "Email", w: 451 },
              { label: "Role", w: 200 },
              { label: "Sent", w: 200 },
              { label: "", w: 225 },
            ]}
            rows={invites.map((v, i) => [
              <b key="e">{v.email}</b>,
              v.role,
              v.sent,
              <button key="c" type="button" className="sk-link" onClick={() => setInvites((l) => l.filter((_, j) => j !== i))}>
                Cancel invite
              </button>,
            ])}
          />
        ) : (
          <p className="st-empty">No pending invites.</p>
        )}
      </Panel>

      <Panel title="Integrations">
        <div className="st-int">
          {INTEGRATIONS.map((x) => (
            <div key={x.name}>
              <strong>{x.name}</strong>
              <span>{x.sub}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Public workspace page"
        sub="Your agency page brands see when you share a link."
        action={
          <button type="button" className="ad-btn ad-btn--primary" onClick={save}>
            Save &amp; get link
          </button>
        }
      >
        <div className="st-pub">
          <input className="ad-input" placeholder="Geek Creative Agency" value={agency} onChange={(e) => setAgency(e.target.value)} aria-label="Agency name" />
          <input className="ad-input" placeholder="geekcreativeagency.com" value={site} onChange={(e) => setSite(e.target.value)} aria-label="Website" />
        </div>
        {link && (
          <p className="st-link">
            🔗 <a href={`https://${link}`} target="_blank" rel="noreferrer">{link}</a>
          </p>
        )}
      </Panel>

      {modal === "invite" && (
        <div className="ad-overlay" onClick={() => setModal(null)}>
          <form className="ad-modal st-modal" onClick={(e) => e.stopPropagation()} onSubmit={invite} role="dialog" aria-label="Invite teammate">
            <h2 className="ad-h2">Invite teammate</h2>
            <p className="st-modal__p">They get an email to join Geek OS with you.</p>
            <label className="ad-label" htmlFor="st-email">
              Email
            </label>
            <input id="st-email" className="ad-input" type="email" autoFocus placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="ad-label" htmlFor="st-role">
              Role
            </label>
            <select id="st-role" className="ad-input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Admin</option>
              <option>Campaign manager</option>
              <option>Viewer</option>
            </select>
            {err && <p className="st-err">{err}</p>}
            <div className="st-modal__btns">
              <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button type="submit" className="ad-btn ad-btn--primary">
                Send invite
              </button>
            </div>
          </form>
        </div>
      )}
      {modal?.remove && (
        <div className="ad-overlay" onClick={() => setModal(null)}>
          <div className="ad-modal st-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Remove teammate">
            <h2 className="ad-h2">Remove {modal.remove}?</h2>
            <p className="st-modal__p">They will lose access to Geek OS straight away. You can invite them again later.</p>
            <div className="st-modal__btns">
              <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setModal(null)}>
                Keep
              </button>
              <button type="button" className="ad-btn ad-btn--danger" onClick={remove}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      {toast}

      <style>{`
        .st-team .sk-tw { margin-top: 15px; }
        .st-team .sk-t th { height: 35px; }
        .st-team.sk-panel { padding-bottom: 25px; }
        .st-inv { padding-bottom: 24px; }
        .st-empty { padding: 28px 0 8px; text-align: center; font-size: 14px; color: #8a8aa0; }
        .st-int { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
        .st-int div { display: flex; flex-direction: column; min-height: 78px; padding: 16px 16px 12px; border-radius: 14px; background: var(--ad-soft-2); }
        .st-int strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.6px; color: var(--ad-ink); }
        .st-int span { margin-top: 3px; font-size: 12px; color: var(--ad-muted); }
        .st-pub { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
        .st-pub .ad-input { width: 270px; height: 43px; }
        .st-pub .ad-input::placeholder { color: #757575; }
        .st-link { margin-top: 14px; font-size: 13px; font-weight: 700; color: var(--ad-ink); }
        .st-link a { color: var(--ad-primary); word-break: break-all; }
        .st-modal { width: min(460px, 100%); padding: 24px; }
        .st-modal__p { margin: 8px 0 6px; font-size: 13.5px; line-height: 1.5; color: var(--ad-muted); }
        .st-modal .ad-label { margin-top: 14px; }
        .st-err { margin-top: 10px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
        .st-modal__btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
        @media (max-width: 640px) {
          .st-int { grid-template-columns: 1fr; }
          .st-pub .ad-input { width: 100%; }
          .st-modal__btns > * { flex: 1; }
        }
      `}</style>
    </AdminShell>
  );
}
