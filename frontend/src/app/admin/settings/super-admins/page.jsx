"use client";

import { useState } from "react";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, useToast, fmtDate, emptyState } from "@/components/admin/settings/kit";
import { rpc, useRpc, errText } from "@/lib/supabase";

/** AdminShell ke andar — "You" pehchanne ke liye login kiye admin ka email chahiye */
function YouBadge({ email, children }) {
  const me = useAdmin();
  return me?.email && email && me.email.toLowerCase() === String(email).toLowerCase() ? (
    <span className="ad-badge ad-badge--violet">You</span>
  ) : (
    children
  );
}

/**
 * /admin/settings/super-admins — purane app jaisa:
 *  list = admin_list_platform_admins · do = admin_add_platform_admin(p_email) · hatao = admin_remove_platform_admin(p_user_id)
 */
export default function SettingsSuperAdmins() {
  const list = useRpc("admin", "admin_list_platform_admins");
  const admins = list.data || [];
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast, say] = useToast();

  const grant = (e) => {
    e.preventDefault();
    const v = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(v)) return setErr("Enter the email of an existing Geek OS user.");
    if (admins.some((a) => String(a.email || "").toLowerCase() === v.toLowerCase())) return setErr("Already a super admin.");
    setConfirm({ grant: { email: v } });
    setErr("");
  };
  const doIt = async () => {
    setBusy(true);
    if (confirm.grant) {
      const { error } = await rpc("admin", "admin_add_platform_admin", { p_email: confirm.grant.email });
      setBusy(false);
      if (error) {
        setConfirm(null);
        return setErr(errText(error));
      }
      say(`${confirm.grant.email} is now a super admin`);
      setEmail("");
    } else {
      const { error } = await rpc("admin", "admin_remove_platform_admin", { p_user_id: confirm.remove.user_id });
      setBusy(false);
      if (error) {
        setConfirm(null);
        return say(errText(error), true);
      }
      say(`${confirm.remove.email || "Admin"} removed`);
    }
    setConfirm(null);
    list.reload();
  };

  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />
      <Panel title="Add a super admin" sub="Super admins can see and change everything on Geek OS.">
        <form className="ss-form" onSubmit={grant}>
          <input className="ad-input" type="email" placeholder="User email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="User email" />
          <button type="submit" className="ad-btn ad-btn--primary">
            Grant super admin
          </button>
        </form>
        {err && <p className="ss-err">{err}</p>}
      </Panel>
      <Panel title="Current super admins" className="ss-list">
        <Table
          rowH={60}
          minW={720}
          cols={[
            { label: "Admin", w: 158 },
            { label: "Email", w: 510 },
            { label: "Since", w: 219 },
            { label: "", w: 189 },
          ]}
          empty={emptyState({ loading: list.loading, error: list.error, reload: list.reload, empty: "No super admins found." })}
          rows={admins.map((a) => [
            <b key="n">{a.name || (a.email || "").split("@")[0] || "—"}</b>,
            a.email || a.user_id,
            fmtDate(a.created_at),
            <YouBadge key="r" email={a.email}>
              <button type="button" className="sk-link" onClick={() => setConfirm({ remove: a })}>
                Remove
              </button>
            </YouBadge>,
          ])}
        />
      </Panel>

      {confirm && (
        <div className="ad-overlay" onClick={() => setConfirm(null)}>
          <div className="ad-modal ss-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Confirm">
            <h2 className="ad-h2">{confirm.grant ? "Grant super admin?" : "Remove super admin?"}</h2>
            <p className="ss-modal__p">
              {confirm.grant ? (
                <>
                  <b>{confirm.grant.email}</b> will be able to see and change everything on Geek OS.
                </>
              ) : (
                <>
                  <b>{confirm.remove.email || confirm.remove.name}</b> will lose super admin access. Their own account stays.
                </>
              )}
            </p>
            <div className="ss-modal__btns">
              <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button type="button" className={`ad-btn ${confirm.grant ? "ad-btn--primary" : "ad-btn--danger"}`} onClick={doIt} disabled={busy}>
                {confirm.grant ? "Grant access" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast}
      <style>{`
        .ss-form { display: flex; gap: 8px; margin-top: 18px; }
        .ss-form .ad-input { width: 270px; height: 43px; }
        .ss-form .ad-input::placeholder { color: #757575; }
        .ss-form .ad-btn { height: 40px; margin-top: 1px; }
        .ss-err { margin-top: 8px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
        .ss-list { padding-bottom: 20px; }
        .ss-modal { width: min(460px, 100%); padding: 24px; }
        .ss-modal__p { margin-top: 10px; font-size: 13.5px; line-height: 1.5; color: var(--ad-muted); }
        .ss-modal__p b { color: var(--ad-ink); }
        .ss-modal__btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
        @media (max-width: 640px) {
          .ss-form { flex-direction: column; }
          .ss-form .ad-input { width: 100%; }
          .ss-modal__btns > * { flex: 1; }
        }
      `}</style>
    </AdminShell>
  );
}
