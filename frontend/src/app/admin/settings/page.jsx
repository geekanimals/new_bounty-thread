"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, useToast, fmtDate, emptyState } from "@/components/admin/settings/kit";
import { sbFor, rpc, errText } from "@/lib/supabase";

/* Purane app ke roles (invites.role) — label Figma style mein */
const ROLES = [
  ["manager", "Team member (manager)"],
  ["owner", "Owner — full access"],
  ["brand", "Brand client (view their campaigns)"],
];
const ROLE_LABEL = { owner: "Owner", manager: "Manager", brand: "Brand client", creator: "Creator", admin: "Admin" };
const slugify = (v) =>
  String(v || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * /admin/settings (= Team) — purane app ka "Team & integrations":
 *  team = members table (apne org ke), invites = invites table (pending), public page = org_profiles,
 *  integrations = WhatsApp / Email master switch ki live halat.
 */
export default function SettingsTeam() {
  const sb = sbFor("admin");
  const [team, setTeam] = useState({ loading: true, rows: [], error: null });
  const [invites, setInvites] = useState([]);
  const [sw, setSw] = useState(null);
  const [modal, setModal] = useState(null); // invite | {remove}
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("manager");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [agency, setAgency] = useState("");
  const [site, setSite] = useState("");
  const [prof, setProf] = useState(null); // org_profiles row
  const [link, setLink] = useState("");
  const [me, setMe] = useState(null); // members row of the logged-in admin (org_id / org_name)
  const [toast, say] = useToast();

  const load = useCallback(async () => {
    const [m, i] = await Promise.all([
      sb.from("members").select("name,email,role,created_at").order("created_at", { ascending: true }),
      sb.from("invites").select("*").eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    setTeam({ loading: false, rows: m.data || [], error: m.error });
    setInvites(i.data || []);
  }, [sb]);

  useEffect(() => {
    load();
    (async () => {
      const { data: s } = await rpc("admin", "admin_messaging_switches");
      setSw(s || {});
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (user) {
        const { data: mm } = await sb.from("members").select("org_id,org_name").eq("id", user.id).maybeSingle();
        setMe(mm || {});
      }
      const { data: op } = await sb.from("org_profiles").select("*").maybeSingle();
      if (op) {
        setProf(op);
        setAgency(op.display_name || "");
        setSite(op.website || "");
        if (op.slug) setLink(`${window.location.host}/o/${op.slug}`);
      }
    })();
  }, [load, sb]);

  const invite = async (e) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(v)) return setErr("Enter a valid email.");
    setBusy(true);
    const row = { email: v, role, status: "pending" };
    if (me?.org_id) {
      row.org_id = me.org_id;
      row.org_name = me.org_name;
    }
    const { error } = await sb.from("invites").insert(row);
    setBusy(false);
    if (error) return setErr(errText(error));
    say(`Invite created for ${v} — copy its link below and send it`);
    setEmail("");
    setErr("");
    setModal(null);
    load();
  };
  const copyInvite = async (tok) => {
    const url = `${window.location.origin}/app.html?invite=${tok}`;
    try {
      await navigator.clipboard.writeText(url);
      say("Invite link copied");
    } catch {
      window.prompt("Share this invite link:", url);
    }
  };
  const cancelInvite = async (id) => {
    const { error } = await sb.from("invites").delete().eq("id", id);
    if (error) return say(errText(error), true);
    say("Invite cancelled");
    load();
  };
  // Purane app mein team member hatane ka koi function nahi tha — backend aane tak
  const remove = () => {
    say("Removing a teammate isn’t available yet — coming soon", true);
    setModal(null);
  };
  const save = async () => {
    const slug = slugify(prof?.slug || agency || me?.org_name || "");
    if (!slug) return say("Add your agency name first — it becomes your public link.", true);
    setBusy(true);
    const row = { slug, display_name: agency.trim() || null, website: site.trim() || null, is_public: prof ? prof.is_public !== false : true, updated_at: new Date().toISOString() };
    if (me?.org_id) row.org_id = me.org_id;
    const { error } = await sb.from("org_profiles").upsert(row, { onConflict: "org_id" });
    setBusy(false);
    if (error) return say(error.code === "23505" || /duplicate|unique/i.test(error.message) ? "That link is taken — change the agency name." : errText(error), true);
    setProf((p) => ({ ...(p || {}), ...row }));
    const url = `${window.location.host}/o/${slug}`;
    setLink(url);
    try {
      await navigator.clipboard?.writeText(`${window.location.protocol}//${url}`);
    } catch {
      /* ignore */
    }
    say("Saved — link copied");
  };

  const INTEGRATIONS = [
    { name: "Instagram", sub: "Creators connect with Instagram Login" },
    { name: "WhatsApp", sub: sw ? (sw.wa_on === false ? "Paused · automatic messages off" : "Connected · Cloud API") : "…" },
    { name: "Email", sub: sw ? (sw.email_on === false ? "Paused · automatic emails off" : "Connected") : "…" },
  ];

  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />

      <Panel
        className="st-team"
        title="Team"
        sub="People who run Geek OS with you."
        action={
          <button type="button" className="ga-btn ga-btn--primary" onClick={() => setModal("invite")}>
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
          empty={emptyState({ loading: team.loading, error: team.error, reload: load, empty: "Just you so far." })}
          rows={team.rows.map((m) => [
            <b key="n" title={m.email || ""}>{m.name || m.email}</b>,
            ROLE_LABEL[m.role] || m.role || "Member",
            fmtDate(m.created_at),
            m.role === "owner" ? (
              ""
            ) : (
              <button key="r" type="button" className="sk-link" onClick={() => setModal({ remove: m.name || m.email })}>
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
            rows={invites.map((v) => [
              <b key="e">{v.email}</b>,
              ROLE_LABEL[v.role] || v.role || "Creator",
              fmtDate(v.created_at),
              <span key="c" className="st-acts">
                {v.token && (
                  <button type="button" className="sk-link" onClick={() => copyInvite(v.token)}>
                    Copy link
                  </button>
                )}
                <button type="button" className="sk-link" onClick={() => cancelInvite(v.id)}>
                  Cancel invite
                </button>
              </span>,
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
          <button type="button" className="ga-btn ga-btn--primary" onClick={save} disabled={busy}>
            Save &amp; get link
          </button>
        }
      >
        <div className="st-pub">
          <input className="ga-input" placeholder="Geek Creative Agency" value={agency} onChange={(e) => setAgency(e.target.value)} aria-label="Agency name" />
          <input className="ga-input" placeholder="geekcreativeagency.com" value={site} onChange={(e) => setSite(e.target.value)} aria-label="Website" />
        </div>
        {link && (
          <p className="st-link">
            🔗 <a href={`//${link}`} target="_blank" rel="noreferrer">{link}</a>
          </p>
        )}
      </Panel>

      {modal === "invite" && (
        <div className="ga-overlay" onClick={() => setModal(null)}>
          <form className="ga-modal st-modal" onClick={(e) => e.stopPropagation()} onSubmit={invite} role="dialog" aria-label="Invite teammate">
            <h2 className="ga-h2">Invite teammate</h2>
            <p className="st-modal__p">When they sign up with this email (using the invite link), they join your workspace.</p>
            <label className="ga-label" htmlFor="st-email">
              Email
            </label>
            <input id="st-email" className="ga-input" type="email" autoFocus placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="ga-label" htmlFor="st-role">
              Role
            </label>
            <select id="st-role" className="ga-input" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            {err && <p className="st-err">{err}</p>}
            <div className="st-modal__btns">
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button type="submit" className="ga-btn ga-btn--primary" disabled={busy}>
                {busy ? "Sending…" : "Send invite"}
              </button>
            </div>
          </form>
        </div>
      )}
      {modal?.remove && (
        <div className="ga-overlay" onClick={() => setModal(null)}>
          <div className="ga-modal st-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Remove teammate">
            <h2 className="ga-h2">Remove {modal.remove}?</h2>
            <p className="st-modal__p">They will lose access to Geek OS straight away. You can invite them again later.</p>
            <div className="st-modal__btns">
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setModal(null)}>
                Keep
              </button>
              <button type="button" className="ga-btn ga-btn--danger" onClick={remove}>
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
        .st-acts { display: inline-flex; gap: 16px; }
        .st-empty { padding: 28px 0 8px; text-align: center; font-size: 14px; color: #8a8aa0; }
        .st-int { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
        .st-int div { display: flex; flex-direction: column; min-height: 78px; padding: 16px 16px 12px; border-radius: 14px; background: var(--ad-soft-2); }
        .st-int strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.6px; color: var(--ad-ink); }
        .st-int span { margin-top: 3px; font-size: 12px; color: var(--ad-muted); }
        .st-pub { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
        .st-pub .ga-input { width: 270px; height: 43px; }
        .st-pub .ga-input::placeholder { color: #757575; }
        .st-link { margin-top: 14px; font-size: 13px; font-weight: 700; color: var(--ad-ink); }
        .st-link a { color: var(--ad-primary); word-break: break-all; }
        .st-modal { width: min(460px, 100%); padding: 24px; }
        .st-modal__p { margin: 8px 0 6px; font-size: 13.5px; line-height: 1.5; color: var(--ad-muted); }
        .st-modal .ga-label { margin-top: 14px; }
        .st-err { margin-top: 10px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
        .st-modal__btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
        @media (max-width: 640px) {
          .st-int { grid-template-columns: 1fr; }
          .st-pub .ga-input { width: 100%; }
          .st-modal__btns > * { flex: 1; }
        }
      `}</style>
    </AdminShell>
  );
}
