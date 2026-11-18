"use client";

import Link from "next/link";
import { uploadMedia } from "@/lib/media";
import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Panel, SubTabs, Note, TableState, useToast } from "@/components/admin/campaign2/kit";
import { rpc, useRpc, errText, sbFor, SUPABASE_URL } from "@/lib/supabase";

/*
 * ⭐ Review screenshots — Google review / District review deliverables.
 * Creator apne app se screenshot daalta hai; team yahan ek ek ya poora folder ek saath (naam se match: @handle, number, ya # serial).
 * Jab tak screenshot nahi, creator "done" nahi hota (DB gate: intel.tg_review_gate).
 */
const KINDS = [
  ["google_review", "⭐ Google review"],
  ["district_review", "🎟️ District review"],
];
const KL = Object.fromEntries(KINDS);
const IMG = /\.(jpe?g|png|webp|heic|gif)$/i;
const abs = (u) => (/^https?:/i.test(u || "") ? u : SUPABASE_URL + u);
const norm = (s) => String(s || "").toLowerCase().replace(/^@/, "");
const digits = (s) => String(s || "").replace(/\D/g, "");

/** file → { creatorKey, kind, how } */
function guess(file, list, fallbackKind) {
  const path = norm(file.webkitRelativePath || file.name);
  const base = norm(file.name.replace(/\.[^.]+$/, ""));
  const kind = /district/.test(path) ? "district_review" : /google/.test(path) ? "google_review" : fallbackKind;
  // 1) number in the name → phone (last 10 digits)
  const longNums = path.match(/\d{10,13}/g) || [];
  for (const n of longNums) {
    const c = list.find((x) => x.phone && digits(x.phone).slice(-10) === n.slice(-10));
    if (c) return { key: c.key, kind, how: "phone" };
  }
  // 2) Instagram handle inside the file / folder name (longest handle wins)
  const byHandle = list.filter((x) => x.handle && norm(x.handle).length >= 3 && path.includes(norm(x.handle))).sort((a, b) => norm(b.handle).length - norm(a.handle).length)[0];
  if (byHandle) return { key: byHandle.key, kind, how: "handle" };
  // 3) the name in the list
  const byName = list.find((x) => x.name && norm(x.name).replace(/\s+/g, "").length >= 4 && base.replace(/[\s_\-.]+/g, "").includes(norm(x.name).replace(/\s+/g, "")));
  if (byName) return { key: byName.key, kind, how: "name" };
  // 4) serial — "12.jpg", "12_google.png" → row #12 of the list below
  const m = /^(\d{1,4})(?:\D|$)/.exec(base);
  if (m && list[Number(m[1]) - 1]) return { key: list[Number(m[1]) - 1].key, kind, how: "serial" };
  return { key: "", kind, how: "" };
}

export default function ReviewScreens() {
  const { id } = useParams();
  const [toast, show] = useToast();
  const { data, error, loading, reload } = useRpc("admin", "api.campaign_review_proofs", { p_campaign: id }, { skip: !id || id === "sample" });
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const [kind0, setKind0] = useState("google_review");
  const [batch, setBatch] = useState(null); // [{ file, url, key, kind, how }]
  const [busy, setBusy] = useState("");
  const folderIn = useRef(null);
  const filesIn = useRef(null);
  const one = useRef(null);
  const [oneFor, setOneFor] = useState(null); // { key, kind }

  const need = (data && data.need) || {};
  const asks = KINDS.filter(([k]) => Number(need[k]) > 0);
  const list = useMemo(() => (data && data.creators) || [], [data]);
  const done = list.filter((c) => !(c.missing || []).length).length;
  const shown = list
    .map((c, i) => ({ ...c, n: i + 1 }))
    .filter((c) => (f === "missing" ? (c.missing || []).length : f === "done" ? !(c.missing || []).length : true))
    .filter((c) => {
      const t = q.trim().toLowerCase();
      return !t || [c.name, c.handle, c.phone, String(c.n)].filter(Boolean).join(" ").toLowerCase().includes(t);
    });

  const pickFiles = (files) => {
    const imgs = [...(files || [])].filter((x) => IMG.test(x.name));
    if (!imgs.length) return show("No images found (jpg, png, webp, heic)");
    setBatch(imgs.slice(0, 500).map((file) => ({ file, url: URL.createObjectURL(file), ...guess(file, list, kind0) })));
  };
  const upOne = async (file, c, kind) => {
    const ext = (file.name.match(/\.[^.]+$/) || [".jpg"])[0].toLowerCase();
    const path = `a/${data.campaign_id}/${c.key}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;
    const up = await uploadMedia("admin", "review-proofs", file, { scope: data.campaign_id, fallback: { bucket: "review-proofs", path } });
    return { participation_id: c.participation_id || null, invite_id: c.invite_id || null, kind, path: up.path };
  };
  const uploadBatch = async () => {
    const go = batch.filter((b) => b.key && b.kind);
    if (!go.length) return show("Match at least one screenshot to a creator");
    setBusy("batch");
    const rows = [],
      fails = [];
    for (let i = 0; i < go.length; i++) {
      setBusy(`Uploading ${i + 1} / ${go.length}…`);
      const c = list.find((x) => x.key === go[i].key);
      try {
        rows.push(await upOne(go[i].file, c, go[i].kind));
      } catch (e) {
        fails.push(`${go[i].file.name}: ${e.message}`);
      }
    }
    const r = rows.length ? await rpc("admin", "api.admin_add_review_proofs", { p_campaign: id, p_rows: rows }) : { data: { added: 0 } };
    setBusy("");
    if (r.error) return show(errText(r.error));
    setBatch(null);
    reload();
    show(`✓ ${(r.data && r.data.added) || 0} screenshot(s) added${fails.length ? ` · ${fails.length} failed: ${fails.slice(0, 3).join(" · ")}` : ""}`);
  };
  const onOne = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || !oneFor) return;
    const c = list.find((x) => x.key === oneFor.key);
    setBusy(oneFor.key);
    try {
      const row = await upOne(file, c, oneFor.kind);
      const r = await rpc("admin", "api.admin_add_review_proofs", { p_campaign: id, p_rows: [row] });
      if (r.error) throw new Error(errText(r.error));
      show("✓ Screenshot added");
      reload();
    } catch (er) {
      show(er.message);
    }
    setBusy("");
  };
  const del = async (p) => {
    if (!window.confirm("Remove this screenshot?")) return;
    const r = await rpc("admin", "api.delete_review_proof", { p_proof: p.proof_id });
    if (r.error) return show(errText(r.error));
    reload();
  };
  const matched = batch ? batch.filter((b) => b.key).length : 0;

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <SubTabs
        active="reviews"
        items={[
          { k: "content", label: "🎬 Content submissions", href: `/vault/campaigns/${id}/content` },
          { k: "reviews", label: "⭐ Review screenshots", href: `/vault/campaigns/${id}/reviews` },
        ]}
      />
      <Panel title="⭐ Review screenshots" sub="Google / District review proof from each creator. A creator is marked done only when their screenshots are in.">
        {data && !asks.length && (
          <Note tone="amber" icon="ℹ️">
            <b>This campaign doesn’t ask for reviews.</b> Add “Google reviews” / “District reviews” in{" "}
            <Link href={`/vault/campaigns/new/deliverables?edit=${id}`}>
              <u>Edit brief → Deliverables</u>
            </Link>
            .
          </Note>
        )}
        {asks.length > 0 && (
          <>
            <div className="rv-tiles">
              <button type="button" className={`rv-tile ${f === "all" ? "is-on" : ""}`} onClick={() => setF("all")}>
                <b>{list.length}</b>
                <span>Creators</span>
              </button>
              <button type="button" className={`rv-tile rv-tile--ok ${f === "done" ? "is-on" : ""}`} onClick={() => setF("done")}>
                <b>{done}</b>
                <span>All screenshots in</span>
              </button>
              <button type="button" className={`rv-tile rv-tile--bad ${f === "missing" ? "is-on" : ""}`} onClick={() => setF("missing")}>
                <b>{list.length - done}</b>
                <span>Waiting for screenshots</span>
              </button>
              <div className="rv-tile rv-need">
                <span>Each creator</span>
                {asks.map(([k, l]) => (
                  <b key={k}>
                    {need[k]} × {l}
                  </b>
                ))}
              </div>
            </div>

            <div className="rv-bulk">
              <div>
                <b>📁 Upload a folder of screenshots</b>
                <small>
                  Name each image by the creator’s <b>@handle</b>, <b>WhatsApp number</b> or <b># serial</b> from the list below (e.g. <code>priya.eats_google.jpg</code>, <code>9876543210.png</code>, <code>12.jpg</code>). A folder per creator works too. “google” / “district” in the name sets the type.
                </small>
              </div>
              <div className="rv-bulk__act">
                <select className="ga-input" value={kind0} onChange={(e) => setKind0(e.target.value)} aria-label="Type when the name doesn't say">
                  {asks.map(([k, l]) => (
                    <option key={k} value={k}>
                      Default: {l}
                    </option>
                  ))}
                </select>
                <button type="button" className="ga-btn ga-btn--primary" onClick={() => folderIn.current && folderIn.current.click()}>
                  Choose folder
                </button>
                <button type="button" className="ga-btn ga-btn--ghost" onClick={() => filesIn.current && filesIn.current.click()}>
                  Choose images
                </button>
                <input ref={folderIn} type="file" hidden multiple webkitdirectory="" directory="" onChange={(e) => (pickFiles(e.target.files), (e.target.value = ""))} />
                <input ref={filesIn} type="file" hidden multiple accept="image/*" onChange={(e) => (pickFiles(e.target.files), (e.target.value = ""))} />
                <input ref={one} type="file" hidden accept="image/*" onChange={onOne} />
              </div>
            </div>

            {batch && (
              <div className="rv-batch">
                <p className="rv-batch__h">
                  <b>
                    {matched} of {batch.length} matched
                  </b>{" "}
                  — check the matches, fix the rest, then upload.
                </p>
                <div className="c2-tw">
                  <table className="c2-t rv-bt">
                    <thead>
                      <tr>
                        <th>Screenshot</th>
                        <th>File</th>
                        <th>Creator</th>
                        <th>Type</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {batch.map((b, i) => (
                        <tr key={i} className={b.key ? "" : "is-bad"}>
                          <td>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={b.url} alt="" className="rv-th" />
                          </td>
                          <td className="rv-fn">
                            {b.file.webkitRelativePath || b.file.name}
                            <small>{b.how ? `matched by ${b.how}` : "⚠️ no match — pick the creator"}</small>
                          </td>
                          <td>
                            <select className="ga-input rv-sel" value={b.key} onChange={(e) => setBatch((B) => B.map((x, j) => (j === i ? { ...x, key: e.target.value, how: e.target.value ? "you" : "" } : x)))}>
                              <option value="">— skip this image —</option>
                              {list.map((c, n) => (
                                <option key={c.key} value={c.key}>
                                  #{n + 1} · {c.name || "—"}
                                  {c.handle ? ` · @${c.handle}` : ""}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select className="ga-input rv-sel" value={b.kind} onChange={(e) => setBatch((B) => B.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)))}>
                              {asks.map(([k, l]) => (
                                <option key={k} value={k}>
                                  {l}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <button type="button" className="c2-tbtn" onClick={() => setBatch((B) => B.filter((_, j) => j !== i))}>
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rv-batch__act">
                  <button type="button" className="ga-btn ga-btn--primary" onClick={uploadBatch} disabled={!!busy || !matched}>
                    {busy && busy !== "batch" && !list.some((c) => c.key === busy) ? busy : `Upload ${matched} screenshot${matched === 1 ? "" : "s"}`}
                  </button>
                  <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setBatch(null)} disabled={!!busy}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="rv-bar">
          <input className="ga-input rv-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Name, @handle, number or #" aria-label="Search" />
        </div>
        <div className="c2-tw">
          <table className="c2-t rv-t">
            <thead>
              <tr>
                <th>#</th>
                <th>Creator</th>
                <th>WhatsApp</th>
                {(asks.length ? asks : KINDS).map(([k, l]) => (
                  <th key={k}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TableState cols={3 + (asks.length || 2)} loading={loading && !data} error={!data && error} onRetry={reload} empty={data && !shown.length && "No creators in this view."} />
              {shown.map((c) => (
                <tr key={c.key}>
                  <td className="rv-mute">{c.n}</td>
                  <td>
                    <b>{c.name || "—"}</b>
                    {c.handle && <small className="rv-sub">@{c.handle}</small>}
                    {c.invite_id && <small className="rv-sub">not on Geek OS yet</small>}
                  </td>
                  <td className="rv-mute">{c.phone || "—"}</td>
                  {(asks.length ? asks : KINDS).map(([k]) => {
                    const ps = (c.proofs || []).filter((p) => p.kind === k);
                    const want = Number(need[k]) || 0;
                    return (
                      <td key={k}>
                        <div className="rv-cell">
                          {ps.map((p) => (
                            <span key={p.proof_id} className="rv-pf">
                              <a href={abs(p.url)} target="_blank" rel="noopener noreferrer" title={`By ${p.by === "team" ? "the team" : "the creator"}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={abs(p.url)} alt="" className="rv-th" />
                              </a>
                              <button type="button" onClick={() => del(p)} aria-label="Remove">
                                ✕
                              </button>
                            </span>
                          ))}
                          {want > 0 && ps.length < want && <span className="ga-badge ga-badge--red">Missing {want - ps.length}</span>}
                          {want > 0 && ps.length >= want && <span className="ga-badge ga-badge--green">✓</span>}
                          {want > 0 && (
                            <button
                              type="button"
                              className="c2-tbtn"
                              disabled={busy === c.key}
                              onClick={() => {
                                setOneFor({ key: c.key, kind: k });
                                one.current && one.current.click();
                              }}
                            >
                              {busy === c.key ? "…" : "＋ Add"}
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {toast}
      <style>{`
        .rv-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
        .rv-tile { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; padding: 14px; border-radius: 14px; border: 1px solid var(--ad-line); background: #fff; text-align: left; cursor: pointer; }
        .rv-tile b { font-family: var(--ad-head); font-size: 22px; color: var(--ad-ink); }
        .rv-tile span { font-size: 12px; color: var(--ad-muted); }
        .rv-tile.is-on { border-color: #6657e9; box-shadow: 0 0 0 2px rgba(103,87,245,.15); }
        .rv-tile--ok b { color: #16a34a; } .rv-tile--bad b { color: #dc2626; }
        .rv-need { cursor: default; background: var(--ad-soft-2); } .rv-need b { font-size: 13px; }
        .rv-bulk { display: flex; gap: 16px; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-top: 16px; padding: 14px; border-radius: 14px; border: 1px dashed #c9c3f5; background: #f7f5ff; }
        .rv-bulk > div:first-child { flex: 1 1 360px; }
        .rv-bulk b { font-size: 14px; color: var(--ad-ink); }
        .rv-bulk small { display: block; margin-top: 4px; font-size: 12px; line-height: 1.5; color: var(--ad-muted); }
        .rv-bulk small b { font-size: 12px; } .rv-bulk code { font-size: 11.5px; background: #fff; padding: 1px 5px; border-radius: 5px; }
        .rv-bulk__act { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .rv-bulk__act .ga-input { height: 40px; width: auto; }
        .rv-bulk__act .ga-btn { height: 40px; }
        .rv-batch { margin-top: 14px; padding: 14px; border-radius: 14px; border: 1px solid var(--ad-line); }
        .rv-batch__h { font-size: 13px; color: var(--ad-text); }
        .rv-batch__act { display: flex; gap: 8px; margin-top: 12px; }
        .rv-bt tr.is-bad td { background: #fff7e8; }
        .rv-fn { white-space: normal !important; max-width: 260px; font-size: 12px; word-break: break-all; }
        .rv-fn small { display: block; color: var(--ad-muted); }
        .rv-sel { height: 36px; min-width: 180px; font-size: 12.5px; }
        .rv-th { width: 46px; height: 46px; object-fit: cover; border-radius: 8px; border: 1px solid var(--ad-line); display: block; }
        .rv-bar { margin-top: 18px; }
        .rv-q { width: 280px; height: 38px; }
        .rv-t { margin-top: 10px; }
        .rv-t td { vertical-align: middle; }
        .rv-mute { font-size: 12px; color: var(--ad-muted); }
        .rv-sub { display: block; font-size: 11px; color: var(--ad-muted); }
        .rv-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .rv-pf { position: relative; }
        .rv-pf button { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; border: 0; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.2); font-size: 10px; cursor: pointer; }
        @media (max-width: 900px) { .rv-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>
    </AdminShell>
  );
}
