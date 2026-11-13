"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creator/BountyShell";
import TrackerFrame, { useTracker, TrackerWait, StepMismatch, currentPath } from "@/components/creator/TrackerSteps";
import { normName, fdate, errText, getContract, signContract } from "@/services/creator";
import { Check } from "@/components/ui/Icons";

/**
 * /creator/my-campaigns/[id]/agreement — purane openContractModal jaisa:
 * api.get_my_contract → saare clauses (end tak scroll karna zaroori) → ASCI + non-delivery terms tick →
 * profile wala naam type karke sign (api.sign_contract_v2). Naam server par bhi match hota hai.
 */
export default function AgreementStep() {
  const t = useTracker();
  const P = t.m ? t.m.participation_id : null;
  const [k, setK] = useState(undefined); // undefined = loading, null = abhi bana nahi
  const [loadErr, setLoadErr] = useState(null);
  const [readAll, setReadAll] = useState(false);
  const [asci, setAsci] = useState(false);
  const [terms, setTerms] = useState(false);
  const [sign, setSign] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef(null);
  const accept = useRef(null);

  useEffect(() => {
    if (!P) return;
    let alive = true;
    getContract(P).then((r) => {
      if (!alive) return;
      if (r.error) setLoadErr(r.error);
      else setK(r.data || null);
    });
    return () => {
      alive = false;
    };
  }, [P]);

  // clauses chhote hon (scroll hi nahi) to seedha khul jaaye
  useEffect(() => {
    const sc = scroller.current;
    if (k && (!sc || sc.scrollHeight <= sc.clientHeight + 4)) setReadAll(true);
  }, [k]);
  useEffect(() => {
    if (readAll && accept.current) setTimeout(() => accept.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
  }, [readAll]);

  if (!t.m)
    return (
      <BountyShell>
        <TrackerWait t={t} />
      </BountyShell>
    );
  const { c } = t;
  const onStep = t.step === "agreement";

  const cl = (k && k.clauses) || [];
  const dl = (k && k.deliverables) || [];
  const risky = cl.some((x) => x.key === "non_delivery" || x.key === "reship");
  const noProd = k && !k.product && !k.product_value && !cl.some((x) => x.key === "reship");
  const days = (k && k.content_days) || 7;
  const nameOk = k && k.sign_as && normName(sign) === normName(k.sign_as);

  const onScroll = (e) => {
    const sc = e.currentTarget;
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 8) setReadAll(true);
  };
  const more = () => {
    const sc = scroller.current;
    if (!sc) return setReadAll(true);
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 8) return setReadAll(true);
    sc.scrollBy({ top: sc.clientHeight * 0.8, behavior: "smooth" });
  };

  const doSign = async () => {
    setErr("");
    if (!asci) return setErr("Please accept the ASCI guidelines to sign.");
    if (risky && !terms) return setErr("Please accept the non-delivery terms to sign.");
    if (!sign.trim()) return setErr("Please type your name to sign.");
    if (k.sign_as && !nameOk) return setErr(`Type your name exactly as on your profile: ${k.sign_as}`);
    setBusy(true);
    const r = await signContract(P, { name: sign.trim(), termsAck: risky ? terms : true });
    setBusy(false);
    if (r.error) return setErr(r.error.message || String(r.error));
    await t.reload();
  };

  const body = () => {
    if (!onStep && !(k && k.signed_at)) return <StepMismatch t={t} />;
    if (loadErr)
      return (
        <>
          <span className="ts-ic">✍️</span>
          <h2>Your agreement</h2>
          <p>Couldn&apos;t load the contract: {errText(loadErr)}</p>
        </>
      );
    if (k === undefined)
      return (
        <>
          <span className="ts-ic">✍️</span>
          <h2>Your agreement</h2>
          <p>Loading…</p>
        </>
      );
    if (k === null)
      return (
        <>
          <span className="ts-ic">✍️</span>
          <h2>Your agreement</h2>
          <p>Your contract is being prepared — check back in a minute.</p>
        </>
      );
    return (
      <>
        <span className="ts-ic">✍️</span>
        <h2>{k.signed_at ? "Your signed agreement" : "Review & sign your agreement"}</h2>
        <p className="ag-meta">
          {k.brand} × <b>{k.campaign}</b> ·{" "}
          {noProd ? (
            "💰 Paid campaign — nothing is shipped"
          ) : (
            <>
              Product: <b>{k.product || "—"}</b>
              {k.product_value ? ` (₹${Number(k.product_value).toLocaleString("en-IN")})` : ""}
            </>
          )}{" "}
          · Make: <b>{dl.length ? dl.map((x) => `${x.quantity || 1}× ${x.format || x.content_format || "content"}`).join(" + ") : "—"}</b> · Post within{" "}
          <b>{days} days</b> of {noProd ? "the video brief" : "delivery"}
        </p>
        {cl.length ? (
          <div className="ag-terms" ref={scroller} onScroll={onScroll}>
            {cl.map((x, i) => (
              <div key={x.key || i} className={`ag-cl ${["non_delivery", "reship", "approval"].includes(x.key) ? "is-warn" : ""}`}>
                <b>
                  {i + 1}. {x.title}
                </b>
                <div>{x.text}</div>
              </div>
            ))}
            <p className="ag-end">— End of contract —</p>
          </div>
        ) : (
          <p className="ts-note">
            Ad rights: {k.ad_rights_months || 1} month(s) · Collab rights: {k.collab_rights ? "Yes" : "No"}
          </p>
        )}

        {k.signed_at ? (
          <>
            <p className="ag-signed">
              <Check size={14} /> Signed {fdate(k.signed_at)}
            </p>
            {!onStep && (
              <div>
                <Link href={currentPath(t.m)} className="bx-btn bx-btn--dark">
                  Continue: {(t.steps.find((x) => x.key === t.step) || {}).label || "Overview"} →
                </Link>
              </div>
            )}
          </>
        ) : !readAll ? (
          <button type="button" className="ag-gate" onClick={more}>
            ↓ Read the whole contract — scroll to the end to accept and sign
          </button>
        ) : (
          <div ref={accept}>
            <label className="ag-check">
              <input type="checkbox" checked={asci} onChange={(e) => setAsci(e.target.checked)} />
              <span>
                I have read the whole contract, I will follow the <b>ASCI</b> guidelines, and I will <b>post only after the brand approves my video</b> in the app.
              </span>
            </label>
            {risky && (
              <label className="ag-check">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                <span>
                  {noProd ? (
                    <>
                      I understand that if I don&apos;t submit my video within {days} days of the video brief, <b>my account is blocked</b> and <b>no fee is paid</b> for this
                      campaign.
                    </>
                  ) : (
                    <>
                      I understand that if I receive the product and don&apos;t submit my video within {days} days, <b>my account is blocked</b> and I{" "}
                      <b>must send the product to another creator at my own cost</b>.
                    </>
                  )}
                </span>
              </label>
            )}
            {k.sign_as ? (
              <>
                <label className="bx-label" htmlFor="ag-sign">
                  Type your name exactly as on your profile <small>{k.sign_as}</small>
                </label>
                <input id="ag-sign" className="bx-input" autoComplete="off" value={sign} onChange={(e) => setSign(e.target.value)} placeholder={k.sign_as} />
                <p className={`ag-hint ${sign && nameOk ? "is-ok" : ""}`}>
                  {!sign.trim() ? "Only the name on your Geek OS profile can sign this contract." : nameOk ? "✓ Matches your profile" : `Doesn't match — type ${k.sign_as}`}
                </p>
              </>
            ) : (
              <p className="bx-err">
                Add your <b>first and last name</b> in your profile first — the contract is signed with that name. <Link href="/creator/profile/about">Open profile →</Link>
              </p>
            )}
            {err && <p className="ts-err">{err}</p>}
            <button type="button" className="bx-btn bx-btn--dark ts-mt" disabled={busy || !k.sign_as} onClick={doSign}>
              <Check size={14} /> {busy ? "Signing…" : "Sign agreement"}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <BountyShell>
      <title>{`Agreement — ${c.title} — Bounty`}</title>
      <TrackerFrame t={t} step={onStep ? "agreement" : undefined}>
        {body()}
      </TrackerFrame>
      <style>{`
        .ag-meta { margin: 0 0 12px !important; font-size: 13px !important; line-height: 1.6; }
        .ag-terms { max-height: 340px; overflow-y: auto; margin: 10px 0 14px; padding: 12px 14px; border-radius: 12px; background: #fffaf0; border: 1px solid var(--bx-line); font-size: 13px; line-height: 1.6; }
        .ag-cl { margin-bottom: 10px; }
        .ag-cl b { display: block; }
        .ag-cl.is-warn { padding: 8px 10px; border-radius: 10px; background: #fbe7b5; }
        .ag-end { margin: 6px 0 0; text-align: center; font-size: 12px; color: var(--bx-muted); }
        .ag-gate { display: block; width: 100%; padding: 12px; border-radius: 12px; border: 1px dashed var(--bx-gold); background: #fffaf0; font: inherit; font-size: 13px; font-weight: 700; color: var(--bx-rust); cursor: pointer; }
        .ag-check { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px; font-size: 13px; line-height: 1.5; }
        .ag-check input { width: 18px; height: 18px; margin-top: 1px; flex-shrink: 0; accent-color: var(--bx-green); }
        .ag-hint { margin: 6px 0 0; font-size: 12px; color: var(--bx-muted); }
        .ag-hint.is-ok { color: #12b76a; font-weight: 600; }
        .ag-signed { display: inline-flex; align-items: center; gap: 6px; margin: 0 0 12px; padding: 6px 12px; border-radius: 999px; background: var(--bx-ok-bg); color: var(--bx-ok); font-size: 13px; font-weight: 700; }
      `}</style>
    </BountyShell>
  );
}

