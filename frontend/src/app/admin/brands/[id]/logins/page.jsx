"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import BrandPanel, { useBrand } from "@/components/admin/brand/BrandPanel";
import PTable from "@/components/admin/brand/PTable";
import { invoke, useRpc, errText } from "@/lib/supabase";
import { fmtDateTime, useToast } from "@/components/admin/brand/util";

/* Figma "Access" → brand portal ke roles (purana app: owner / approver / viewer) */
const ROLE = { owner: "Brand admin", approver: "Brand reviewer", viewer: "View only", removed: "Removed" };

/**
 * /admin/brands/[id]/logins — Brand logins + Brand portal (Figma 069)
 * Logins: brand_detail.logins · roles: admin_brand_portal
 * Create / new password / role / remove: edge function brand-login (create · reset · team_role · team_remove)
 */
export default function BrandLoginsPage() {
  const { id } = useParams();
  return (
    <BrandPanel id={id}>
      <BrandLogins />
    </BrandPanel>
  );
}

function BrandLogins() {
  const { d, b, reload } = useBrand();
  const portal = useRpc("admin", "api.admin_brand_portal", { p_brand: b.brand_id });
  const roles = Object.fromEntries((portal.data?.logins || []).map((x) => [x.member_id, x.role]));
  const rows = d.logins || [];
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: "", email: "", access: "owner" });
  const [busy, setBusy] = useState(false);
  const [creds, setCreds] = useState(null);
  const [ask, setAsk] = useState(null); // { kind: "remove" | "reset", x }
  const [toast, say] = useToast();

  const refresh = () => {
    reload(true);
    portal.reload(true);
  };

  const add = async (e) => {
    e.preventDefault();
    const email = f.email.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return say("Add a valid email");
    setBusy(true);
    const r = await invoke("admin", "brand-login", { action: "create", brand_id: b.brand_id, email, name: f.name.trim() });
    if (r.error) {
      setBusy(false);
      return say(errText(r.error));
    }
    // naya login "owner" banta hai — doosra access chuna ho to role set karo
    if (f.access !== "owner" && r.data?.member_id) {
      const r2 = await invoke("admin", "brand-login", { action: "team_role", brand_id: b.brand_id, member_id: r.data.member_id, role: f.access });
      if (r2.error) say(errText(r2.error));
    }
    setBusy(false);
    setCreds(r.data);
    setF({ name: "", email: "", access: "owner" });
    setAdding(false);
    refresh();
  };

  const setRole = async (x, role) => {
    const r = await invoke("admin", "brand-login", { action: role === "removed" ? "team_remove" : "team_role", brand_id: b.brand_id, member_id: x.member_id, role });
    if (r.error) return say(errText(r.error));
    say(role === "removed" ? `${x.name || x.email} can no longer sign in` : "Access changed ✓");
    refresh();
  };

  const reset = async (x) => {
    const r = await invoke("admin", "brand-login", { action: "reset", brand_id: b.brand_id, member_id: x.member_id });
    if (r.error) return say(errText(r.error));
    setCreds(r.data);
  };

  const confirm = async () => {
    const { kind, x } = ask;
    setAsk(null);
    if (kind === "remove") await setRole(x, "removed");
    else await reset(x);
  };

  const link = creds ? creds.login_url || `${window.location.origin}/brands` : "";
  const credText = creds
    ? `Your Geek OS login for ${b.name}\nLink: ${link}\nEmail: ${creds.email}\nPassword: ${creds.password}\n(Sign in with this email & password. In Settings you can change the password and link your Facebook business — after that "Continue with Facebook" signs you in.)`
    : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(credText);
      say("Copied ✓");
    } catch {
      say("Couldn’t copy — select the text instead");
    }
  };

  return (
    <>
      <section className="bp-sec bl-sec">
        <h3 className="bp-sec__t">Brand logins</h3>
        <div className="bl-t">
          <PTable
            minW={660}
            rowH={64}
            cols={[
              { label: "Person", w: "21%" },
              { label: "Email", w: "24%" },
              { label: "Access", w: "19%" },
              { label: "Last sign-in", w: "17%" },
              { label: "", w: "19%" },
            ]}
            rows={rows.map((x) => {
              const role = roles[x.member_id] || "owner";
              return [
                <span key="n" title={x.name || x.email}>
                  {x.name || "—"}
                </span>,
                <span key="e" title={x.email}>
                  {x.email || "—"}
                </span>,
                <select key="a" className="bl-role" value={ROLE[role] ? role : "owner"} onChange={(e) => setRole(x, e.target.value)} aria-label={`Access for ${x.email}`}>
                  {Object.entries(ROLE).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>,
                x.last_seen ? fmtDateTime(x.last_seen) : "Never",
                <span key="x" className="bl-acts">
                  <button type="button" className="pt-link bl-rm" onClick={() => setAsk({ kind: "reset", x })}>
                    New password
                  </button>
                  <button type="button" className="pt-link bl-rm" onClick={() => setAsk({ kind: "remove", x })}>
                    Remove
                  </button>
                </span>,
              ];
            })}
            empty="No brand logins yet."
          />
        </div>

        {ask && (
          <div className="bl-ask">
            <p>
              {ask.kind === "remove"
                ? `Remove ${ask.x.name || ask.x.email}? They’re signed out and can’t sign in again (you can give access back).`
                : `Make a new password for ${ask.x.email}? The old password stops working.`}
            </p>
            <div className="bp-btns">
              <button type="button" className={`ga-btn ${ask.kind === "remove" ? "ga-btn--danger" : "ga-btn--primary"}`} onClick={confirm}>
                {ask.kind === "remove" ? "Yes, remove" : "Make new password"}
              </button>
              <button type="button" className="bp-plain" onClick={() => setAsk(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {creds && (
          <div className="bl-creds">
            <p className="bl-ok">✓ Login ready — share it with the brand. The password is shown only now.</p>
            <dl>
              <dt>Link</dt>
              <dd>
                <a href={link} target="_blank" rel="noreferrer">
                  {link}
                </a>
              </dd>
              <dt>Email</dt>
              <dd>
                <b>{creds.email}</b>
              </dd>
              <dt>Password</dt>
              <dd>
                <code>{creds.password}</code>
              </dd>
            </dl>
            <div className="bp-btns">
              <button type="button" className="ga-btn ga-btn--primary" onClick={copy}>
                📋 Copy login
              </button>
              <a className="ga-btn ga-btn--ghost" href={`mailto:${encodeURIComponent(creds.email || "")}?subject=${encodeURIComponent("Your Geek OS login")}&body=${encodeURIComponent(credText)}`}>
                ✉️ Email it
              </a>
              <button type="button" className="bp-plain" onClick={() => setCreds(null)}>
                Done
              </button>
            </div>
          </div>
        )}

        {adding && (
          <form className="bl-form" onSubmit={add}>
            <input className="ga-input" placeholder="Name" maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Name" autoFocus />
            <input className="ga-input" placeholder="name@brand.in" type="email" maxLength={120} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-label="Email" />
            <select className="ga-input" value={f.access} onChange={(e) => setF({ ...f, access: e.target.value })} aria-label="Access">
              <option value="approver">Brand reviewer</option>
              <option value="owner">Brand admin</option>
              <option value="viewer">View only</option>
            </select>
            <button type="submit" className="ga-btn ga-btn--primary" disabled={busy}>
              {busy ? "Creating…" : "Create login"}
            </button>
          </form>
        )}
        <div className="bp-btns">
          <button type="button" className="ga-btn ga-btn--primary" onClick={() => setAdding(!adding)}>
            🔑 {adding ? "Cancel" : "Add a login"}
          </button>
          <a href="/brands" target="_blank" rel="noreferrer" className="ga-btn ga-btn--ghost">
            👁️ View as brand
          </a>
        </div>
      </section>

      <section className="bp-sec bl-portal" id="portal">
        <h3 className="bp-sec__t">🏢 Brand portal</h3>
        <p className="bp-sec__s">What {b.name} sees: their campaigns, the final creator list to approve, posts and the report.</p>
        <div className="bp-btns">
          <a href="/brands" target="_blank" rel="noreferrer" className="ga-btn ga-btn--ghost">
            Open brand portal ↗
          </a>
        </div>
      </section>

      {toast && <div className="ga-toast">{toast}</div>}

      <style>{`
        .bl-t { margin-top: 13px; }
        .bl-t .pt th { height: 37px; }
        .bl-rm { color: #6657e9; }
        .bl-acts { display: inline-flex; gap: 10px; }
        .bl-role { max-width: 100%; height: 30px; padding: 0 6px; border: 1px solid var(--ad-line); border-radius: 8px; background: #fff; font-size: 12.5px; color: var(--ad-ink); }
        .bl-sec .bp-btns { margin-top: 10px; }
        .bl-portal { margin-top: 19px !important; }
        .bl-portal .bp-sec__s { margin-top: 13px; }
        .bl-portal .bp-btns { margin-top: 9px; }
        .bl-form { display: grid; grid-template-columns: 1fr 1.2fr 1fr auto; gap: 8px; margin-top: 12px; }
        .bl-ask { margin-top: 12px; padding: 12px 14px; border-radius: 13px; background: var(--ad-red-bg); font-size: 13px; color: var(--ad-red); }
        .bl-ask .bp-btns { margin-top: 8px; }
        .bl-creds { margin-top: 12px; padding: 14px 16px; border-radius: 14px; border: 1px solid #cfe9dd; background: #f3fbf7; }
        .bl-ok { font-size: 13px; font-weight: 700; color: var(--ad-green); }
        .bl-creds dl { display: grid; grid-template-columns: 80px 1fr; gap: 6px 10px; margin: 10px 0 0; font-size: 13px; }
        .bl-creds dt { color: var(--ad-muted); }
        .bl-creds dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
        .bl-creds code { padding: 2px 6px; border-radius: 6px; background: #fff; border: 1px solid var(--ad-line); }
        .bl-creds a { color: #6657e9; font-weight: 700; }
        @media (max-width: 640px) { .bl-form { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
