"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMyReviewProofs, uploadReviewProof, errText } from "@/services/creator";
import { SUPABASE_URL } from "@/lib/supabase";

/**
 * ⭐ Google / District review — creator screenshot upload karta hai. Sirf tab dikhta hai jab campaign review maangta ho.
 * Jab tak screenshot nahi, campaign "complete" nahi hota.
 */
const KL = { google_review: ["⭐", "Google review"], district_review: ["🎟️", "District review"] };
const abs = (u) => (/^https?:/i.test(u || "") ? u : SUPABASE_URL + u);

export default function ReviewProofs({ campaignId }) {
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const inp = useRef(null);
  const kindRef = useRef("");
  const load = useCallback(async () => {
    const r = await getMyReviewProofs(campaignId);
    if (!r.error) setD(r.data || null);
  }, [campaignId]);
  useEffect(() => {
    if (campaignId) load();
  }, [campaignId, load]);
  if (!d) return null;
  const need = d.need || {};
  const kinds = Object.keys(KL).filter((k) => Number(need[k]) > 0);
  if (!kinds.length || !d.participation_id) return null;
  const missing = (d.missing || []).length;

  const pick = (k) => {
    kindRef.current = k;
    setErr("");
    inp.current && inp.current.click();
  };
  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy(kindRef.current);
    const r = await uploadReviewProof(campaignId, kindRef.current, file);
    setBusy("");
    if (r.error) return setErr(errText(r.error));
    load();
  };

  return (
    <details className="ov-fold rp" open={missing > 0}>
      <summary>
        ⭐ Review screenshots {missing > 0 ? <em>{missing} to upload</em> : <em className="rp-ok">All done ✓</em>}
      </summary>
      <p className="rp-sub">Post the review, then upload a clear screenshot of it here. Your campaign is complete only after the screenshots are in.</p>
      {kinds.map((k) => {
        const ps = (d.proofs || []).filter((p) => p.kind === k);
        const want = Number(need[k]) || 0;
        return (
          <div key={k} className="rp-row">
            <div className="rp-h">
              <b>
                {KL[k][0]} {KL[k][1]}
              </b>
              <span className={ps.length >= want ? "rp-ok" : "rp-miss"}>
                {Math.min(ps.length, want)} / {want}
              </span>
            </div>
            <div className="rp-imgs">
              {ps.map((p) => (
                <a key={p.proof_id} href={abs(p.url)} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={abs(p.url)} alt={`${KL[k][1]} screenshot`} />
                </a>
              ))}
              <button type="button" className="bx-btn bx-btn--dark rp-add" onClick={() => pick(k)} disabled={!!busy}>
                {busy === k ? "Uploading…" : ps.length >= want ? "＋ Add another" : "＋ Upload screenshot"}
              </button>
            </div>
          </div>
        );
      })}
      {err && <p className="rp-err">{err}</p>}
      <input ref={inp} type="file" accept="image/*" hidden onChange={onFile} />
      <style>{`
        .rp-sub { margin: 0 0 8px; font-size: 12.5px; color: var(--bx-muted); }
        .rp-row { margin-top: 10px; padding: 10px; border-radius: 10px; background: #fff; border: 1px solid var(--bx-line); }
        .rp-h { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
        .rp-ok { color: #1f8a4c; font-weight: 700; background: #def3e6 !important; }
        .rp-h .rp-ok, .rp-h .rp-miss { background: none !important; font-size: 13px; }
        .rp-miss { color: #b5481f; font-weight: 700; }
        .rp-imgs { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 8px; }
        .rp-imgs img { width: 64px; height: 64px; object-fit: cover; border-radius: 10px; border: 1px solid var(--bx-line); display: block; }
        .rp-add { height: 40px; padding: 0 14px; font-size: 13px; }
        .rp-err { margin: 8px 0 0; font-size: 12.5px; color: #c0392b; }
      `}</style>
    </details>
  );
}
