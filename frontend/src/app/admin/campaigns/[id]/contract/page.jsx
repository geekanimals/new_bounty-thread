"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { useToast } from "@/components/admin/campaign/live";

const RULES = ["Collab rights — creator adds the brand as an Instagram collaborator", "Non-delivery = blacklist from the platform", "Re-ship the product at their cost to another creator we name"];
const RULE_KEYS = ["collab_rights", "blacklist_clause", "reship_clause"];
const ln = (v) => String(v ?? "");

/* Figma: Campaign workspace — Contract & video brief (purana bpTermsHtml + save_playbook) */
export default function WorkspaceContract() {
  const { id } = useParams();
  const c = { id };
  // playbook barter_tracker ke andar aata hai (purane app jaisa)
  const bt = useRpc("admin", "api.barter_tracker", { p_campaign: id }, { skip: !id || id === "sample" });
  const [k, setK] = useState({ product: "", value: "", due: "7", rights: "1", deliver: "", extra: "" });
  const [rules, setRules] = useState([true, true, true]);
  const [b, setB] = useState({ shoot: "", keys: "", tags: "", dos: "", donts: "", caption: "", refs: "", note: "" });
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useToast();

  // server ka playbook aate hi form bharo
  useEffect(() => {
    const pb = bt.data?.playbook;
    if (!pb) return;
    const kk = pb.contract || {};
    const bb = pb.brief || {};
    setK({ product: ln(kk.product), value: ln(kk.product_value), due: ln(kk.content_days ?? 7), rights: ln(kk.ad_rights_months ?? 1), deliver: ln(kk.deliverables), extra: ln(kk.extra_terms) });
    setRules(RULE_KEYS.map((x) => kk[x] !== false));
    setB({ shoot: ln(bb.what_to_shoot), keys: ln(bb.key_messages), tags: [bb.hashtags, bb.mentions].filter(Boolean).join(" "), dos: ln(bb.dos), donts: ln(bb.donts), caption: ln(bb.caption), refs: ln(bb.reference_links), note: ln(bb.posting_note) });
  }, [bt.data]);

  /* dono card ek hi RPC se save hote hain — save_playbook(contract, brief) */
  const save = async (which) => {
    if (!k.deliver.trim()) return setToast("Add the deliverables (e.g. 1 Reel + 2 Stories) — a contract without them can’t be signed.");
    const toks = b.tags.split(/[\s,]+/).filter(Boolean);
    const contract = {
      product: k.product.trim() || null,
      product_value: k.value.trim() ? Number(String(k.value).replace(/[^\d.]/g, "")) : null,
      deliverables: k.deliver.trim(),
      content_days: Math.min(60, Math.max(1, parseInt(k.due) || 7)),
      ad_rights_months: Math.min(24, Math.max(0, parseInt(k.rights) || 0)),
      collab_rights: rules[0],
      blacklist_clause: rules[1],
      reship_clause: rules[2],
      extra_terms: k.extra.trim() || null,
    };
    const brief = {
      what_to_shoot: b.shoot.trim() || null,
      key_messages: b.keys.trim() || null,
      dos: b.dos.trim() || null,
      donts: b.donts.trim() || null,
      caption: b.caption.trim() || null,
      reference_links: b.refs.trim() || null,
      hashtags: toks.filter((x) => x[0] !== "@").join(" ") || null,
      mentions: toks.filter((x) => x[0] === "@").join(" ") || null,
      posting_note: b.note.trim() || null,
    };
    setBusy(which);
    const { error } = await rpc("admin", "api.save_playbook", { p_campaign: id, p_contract: contract, p_brief: brief });
    setBusy("");
    if (error) return setToast(errText(error));
    setToast("Saved ✓ — every new contract and brief uses this.");
    bt.reload(true);
  };

  /* Resend contract — jinko contract gaya par sign nahi kiya (contract_sent), unko bp_send_contract */
  const resend = async () => {
    const list = (bt.data?.creators || []).filter((x) => x.stage === "contract_sent");
    if (!list.length) return setToast("Nobody is waiting to sign — every sent contract is signed.");
    if (!window.confirm(`Resend the contract to ${list.length} creator${list.length > 1 ? "s" : ""} who haven’t signed yet?`)) return;
    setBusy("resend");
    let ok = 0;
    let last = null;
    for (const x of list) {
      const { error } = await rpc("admin", "api.bp_send_contract", { p_participation: x.participation_id });
      if (error) last = error;
      else ok++;
    }
    setBusy("");
    setToast(last ? `${ok} sent · ${errText(last)}` : `✓ Contract re-sent to ${ok} creator${ok > 1 ? "s" : ""}`);
    bt.reload(true);
  };

  const F = ({ label, v, set, field }) => (
    <div className="wc-f">
      <label className="wc-l" htmlFor={`wc-${field}`}>
        {label}
      </label>
      <input id={`wc-${field}`} className="ad-input wc-in" value={v[field]} onChange={(e) => set((p) => ({ ...p, [field]: e.target.value }))} />
    </div>
  );

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      {bt.error && (
        <p className="wc-err">
          {errText(bt.error)}{" "}
          <button type="button" onClick={() => bt.reload()}>
            Retry
          </button>
        </p>
      )}

      <div className="wc-grid">
        <section className="ad-card wc-card">
          <div className="wc-head">
            <div>
              <h2 className="ad-h2">📜 Contract</h2>
              <p className="wc-sub">Goes out automatically when a creator is approved. Changes apply to contracts sent from now on.</p>
            </div>
            <button type="button" className="wc-resend" disabled={busy === "resend" || bt.loading} onClick={resend}>
              {busy === "resend" ? "Sending…" : "Resend contract"}
            </button>
          </div>
          <div className="wc-two">
            {F({ label: "Product the creator gets", v: k, set: setK, field: "product" })}
            {F({ label: "Product value (₹)", v: k, set: setK, field: "value" })}
            {F({ label: "Content due (days after delivery)", v: k, set: setK, field: "due" })}
            {F({ label: "Ad rights (months)", v: k, set: setK, field: "rights" })}
            {F({ label: "Deliverables", v: k, set: setK, field: "deliver" })}
          </div>
          <h3 className="wc-rules">Rules</h3>
          {RULES.map((r, i) => (
            <label key={r} className="wc-rule">
              <input type="checkbox" checked={rules[i]} onChange={() => setRules((p) => p.map((x, j) => (j === i ? !x : x)))} />
              {r}
            </label>
          ))}
          <button type="button" className="ad-btn ad-btn--primary wc-save" disabled={!!busy || bt.loading} onClick={() => save("k")}>
            {busy === "k" ? "Saving…" : "Save contract"}
          </button>
        </section>

        <section className="ad-card wc-card">
          <h2 className="ad-h2">🎬 Video brief</h2>
          <p className="wc-sub">Goes out automatically when the product is delivered.</p>
          <div className="wc-two wc-two--b">
            {F({ label: "What to shoot", v: b, set: setB, field: "shoot" })}
            {F({ label: "Key messages", v: b, set: setB, field: "keys" })}
            {F({ label: "Hashtags & mentions", v: b, set: setB, field: "tags" })}
            {F({ label: "Do’s", v: b, set: setB, field: "dos" })}
            {F({ label: "Don’ts", v: b, set: setB, field: "donts" })}
          </div>
          <button type="button" className="ad-btn ad-btn--primary wc-save wc-save--b" disabled={!!busy || bt.loading} onClick={() => save("b")}>
            {busy === "b" ? "Saving…" : "Save brief"}
          </button>
        </section>
      </div>
      {toast && <div className="ad-toast">{toast}</div>}

      <style>{`
        .wc-err { margin: -10px 0 16px; font-size: 13px; color: var(--ad-red); font-weight: 700; }
        .wc-err button { border: 0; background: none; color: var(--ad-primary); font-weight: 800; }
        .wc-grid { display: grid; grid-template-columns: minmax(0, 652fr) minmax(0, 450fr); gap: 20px; align-items: start; }
        .wc-card { padding: 22px 22px 22px; min-width: 0; }
        .wc-head { display: flex; justify-content: space-between; gap: 24px; }
        .wc-sub { margin-top: 8px; font-size: 12px; line-height: 1.33; color: var(--ad-muted); }
        .wc-resend { flex-shrink: 0; width: 86px; margin: 12px 28px 0 0; padding: 0; border: 0; background: none; font-size: 14px; font-weight: 800; line-height: 1.33; color: #6657e9; }
        .wc-resend:hover { color: var(--ad-primary-2); }
        .wc-two { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; margin-top: 20px; }
        .wc-two--b { margin-top: 18px; gap: 0 16px; }
        .wc-f { margin-bottom: 13px; min-width: 0; }
        .wc-l { display: block; margin-bottom: 9px; font-size: 12px; font-weight: 800; color: #60708c; }
        .wc-in { height: 41px; padding: 0 12px; border-color: #dfe2ee; font-size: 12px; font-weight: 800; color: #1d2943; text-overflow: ellipsis; }
        .wc-rules { margin-top: 14px; font-size: 16.4px; font-weight: 700; color: var(--ad-ink); }
        .wc-rule { display: flex; align-items: center; gap: 4px; margin-top: 12px; font-size: 12px; color: var(--ad-ink); cursor: pointer; }
        .wc-rule input { width: 13px; height: 13px; margin: 0 2px 0 4px; accent-color: #5a4bf2; }
        .wc-save { height: 41px; margin-top: 16px; padding: 0 16px; }
        .wc-save--b { margin-top: 4px; }
        @media (max-width: 1180px) { .wc-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .wc-card { padding: 18px 16px; }
          .wc-head { flex-direction: column; gap: 0; }
          .wc-resend { width: auto; margin: 10px 0 0; text-align: left; }
          .wc-two { grid-template-columns: 1fr; }
          .wc-rule { align-items: flex-start; }
          .wc-rule input { margin-top: 1px; flex-shrink: 0; }
          .wc-save { width: 100%; }
        }
      `}</style>
    </AdminShell>
  );
}
