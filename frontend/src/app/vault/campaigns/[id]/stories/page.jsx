"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import ContentTabs, { useProofNeeds } from "@/components/admin/campaign2/ContentTabs";
import { Panel, Note, TableState, useToast } from "@/components/admin/campaign2/kit";
import { rpc, errText } from "@/lib/supabase";
import { uploadInsightsProof } from "@/components/admin/campaign/journey";
import { readInsightsOcr } from "@/lib/insightsOcr";
import { shotSha, sigOf, shotDupMessage, rememberShot } from "@/lib/proofShot";

/*
 * 📸 Story screenshots — brief mein Story ho tab. Story ka proof = screenshot (Instagram se check nahi).
 * Creator apne app ke "Post" step se daalta hai; team yahan ek ek, ya bahut saari images ek saath:
 * naam mein @handle / naam / #serial ho to us creator par, warna list ke kram se (pehli row se) jinki story baaki hai.
 * Geek OS creator → api.bp_add_post_link (story + screenshot) · sheet creator → api.invite_add_post. Saare screenshots poore hone par creator "Done".
 */
const IMG = /\.(jpe?g|png|webp|heic|gif)$/i;
const norm = (s) => String(s || "").toLowerCase().replace(/^@/, "");

// Geek OS creator par post / story tabhi jud sakti hai jab use video brief mil chuka ho (backend bhi yahi maanta hai)
const AFTER_BRIEF = new Set(["content_created", "content_submitted", "changes_requested", "content_approved", "published", "completed"]);
const canAdd = (c) => !!c.invite_id || AFTER_BRIEF.has(c.stage);
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function guessKey(file, list) {
  const path = norm((file.webkitRelativePath || file.name).replace(/\.[^./]+$/, ""));
  const base = norm(file.name.replace(/\.[^.]+$/, ""));
  // @handle poora shabd ho (aage-peeche letter / number / . na ho) — "art" ab "start.jpg" se match nahi hoga
  const byHandle = list
    .filter((x) => x.handle && norm(x.handle).length >= 3 && new RegExp(`(^|[^a-z0-9.])${esc(norm(x.handle))}([^a-z0-9.]|$)`).test(path))
    .sort((a, b) => norm(b.handle).length - norm(a.handle).length)[0];
  if (byHandle) return { key: byHandle.key, how: "handle" };
  const flat = base.replace(/[\s_\-.]+/g, "");
  const byName = list
    .filter((x) => x.name && norm(x.name).replace(/\s+/g, "").length >= 4 && flat.includes(norm(x.name).replace(/\s+/g, "")))
    .sort((a, b) => b.name.length - a.name.length)[0];
  if (byName) return { key: byName.key, how: "name" };
  const m = /^(\d{1,4})(?:\D|$)/.exec(base);
  if (m && list[Number(m[1]) - 1]) return { key: list[Number(m[1]) - 1].key, how: "serial" };
  return { key: "", how: "" };
}

export default function StoryShots() {
  const { id } = useParams();
  const [toast, show] = useToast();
  const { board, story: need, loading, error, reload } = useProofNeeds(id);
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const [batch, setBatch] = useState(null); // [{ file, url, key, how }]
  const [busy, setBusy] = useState("");
  const filesIn = useRef(null);
  const one = useRef(null);
  const [oneFor, setOneFor] = useState(null);

  const list = useMemo(
    () =>
      ((board && board.rows) || []).map((r) => ({
        ...r,
        key: r.participation_id ? "p-" + r.participation_id : "i-" + r.invite_id,
        shots: (r.stories || []).filter((s) => s.url || s.old), // old = 24 Nov se pehle sirf link se record hui story (purane rule mein maani gayi)
      })),
    [board]
  );
  const isDone = (c) => need > 0 && c.shots.length >= need;
  const done = list.filter(isDone).length;
  const shown = list
    .map((c, i) => ({ ...c, n: i + 1 }))
    .filter((c) => (f === "missing" ? !isDone(c) : f === "done" ? isDone(c) : true))
    .filter((c) => {
      const t = q.trim().toLowerCase();
      return !t || [c.name, c.handle, String(c.n)].filter(Boolean).join(" ").toLowerCase().includes(t);
    });

  // naam se match → baaki images list ke kram se (pehli row se) un creators ko jinki story abhi baaki hai
  const pickFiles = (files) => {
    const imgs = [...(files || [])].filter((x) => IMG.test(x.name)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (!imgs.length) return show("No images found (jpg, png, webp, heic)");
    const got = imgs.slice(0, 500).map((file) => {
      const g = guessKey(file, list);
      const c = g.key && list.find((x) => x.key === g.key);
      // naam se mila creator abhi video brief tak nahi pahuncha → yahan nahi jud sakta, team khud chune
      if (c && !canAdd(c)) return { file, url: URL.createObjectURL(file), key: "", how: "", note: `${c.handle ? "@" + c.handle : c.name} hasn’t got the video brief yet` };
      return { file, url: URL.createObjectURL(file), ...g };
    });
    const want = {};
    list.forEach((c) => (want[c.key] = canAdd(c) ? Math.max(0, need - c.shots.length) : 0));
    got.forEach((g) => g.key && (want[g.key] = (want[g.key] || 0) - 1));
    const queue = list.filter((c) => want[c.key] > 0).flatMap((c) => Array.from({ length: want[c.key] }, () => c.key));
    got.forEach((g) => {
      if (!g.key && queue.length) {
        g.key = queue.shift();
        g.how = "list order";
      }
    });
    setBatch(got);
  };

  // screenshot upload + (agar insights ka screenshot hai) uske numbers bhi padh ke saath save — report mein seedha dikhte hain
  // screenshot → (1) not already used in this campaign (same file / same numbers) → (2) upload → (3) story + its numbers saved → (4) remembered
  // replacing = the new one is saved first, then the old one removed (nothing is lost if the upload fails)
  const saveOne = async (file, c, { replace = null, seen = null } = {}) => {
    if (!replace && need > 0 && c.shots.length >= need) throw new Error("already has its story — use ↻ Replace to change it");
    const [sha, read] = await Promise.all([shotSha(file), readInsightsOcr(file, "story").catch(() => ({ metrics: {} }))]);
    const metrics = (read && read.metrics) || {};
    const sig = sigOf(metrics);
    if (seen) {
      if (seen.has(sha) || (sig && seen.has(sig))) throw new Error("the same screenshot is twice in this batch");
      seen.add(sha);
      if (sig) seen.add(sig);
    }
    const owner = { participation_id: c.participation_id, invite_id: c.invite_id };
    const dup = await shotDupMessage("admin", id, sha, sig, owner);
    if (dup && !(replace && /for this creator/.test(dup))) throw new Error(dup);
    const url = await uploadInsightsProof(file);
    const payload = { media_type: "story", screenshot_url: url };
    let postRef = null;
    if (c.participation_id) {
      const r = await rpc("admin", "api.bp_add_post_link", { p_participation: c.participation_id, p_payload: payload });
      if (r.error) throw new Error(errText(r.error));
      postRef = r.data && r.data.post_id;
      if (postRef && Object.keys(metrics).length) await rpc("admin", "api.bp_record_metrics", { p_participation: c.participation_id, p_payload: { ...metrics, screenshot_url: url, post_id: postRef } });
    } else {
      const r = await rpc("admin", "api.invite_add_post", { p_invite: c.invite_id, p_payload: { ...payload, metrics } });
      if (r.error) throw new Error(errText(r.error));
      postRef = r.data && r.data.id;
    }
    await rememberShot("admin", id, sha, sig, owner, postRef, url);
    if (replace) await removeStory(c, replace, { quiet: true });
    return Object.keys(metrics).length;
  };
  // ✕ on a story screenshot — the story, its numbers and its fingerprint go
  const removeStory = async (c, s, { quiet = false } = {}) => {
    if (!quiet && !window.confirm(`Remove this story screenshot from ${c.name || "@" + c.handle}? Its numbers go from the report too.`)) return false;
    const r = await rpc("admin", "api.delete_story_proof", c.participation_id ? { p_post: s.id } : { p_invite_post: s.id });
    if (r.error) {
      show(errText(r.error));
      return false;
    }
    if (!quiet) {
      show("Story screenshot removed");
      reload();
    }
    return true;
  };
  const uploadBatch = async () => {
    const go = batch.filter((b) => b.key);
    if (!go.length) return show("Match at least one screenshot to a creator");
    let ok = 0,
      withNums = 0;
    const fails = [];
    const seen = new Set(); // same picture twice in one batch
    for (let i = 0; i < go.length; i++) {
      setBusy(`Reading & uploading ${i + 1} / ${go.length}…`);
      const c = list.find((x) => x.key === go[i].key);
      try {
        if (await saveOne(go[i].file, c, { seen })) withNums++;
        ok++;
      } catch (e) {
        fails.push(`${c ? c.name || c.handle : go[i].file.name}: ${e.message}`);
      }
    }
    setBusy("");
    setBatch(null);
    reload();
    show(`✓ ${ok} story screenshot${ok === 1 ? "" : "s"} added${withNums ? ` · numbers read off ${withNums} (see the report)` : ""}${fails.length ? ` · ${fails.length} not added — ${fails.slice(0, 2).join(" · ")}` : ""}`);
  };
  const onOne = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || !oneFor) return;
    const c = list.find((x) => x.key === oneFor.key);
    setBusy(oneFor.key);
    try {
      const n = await saveOne(file, c, { replace: oneFor.replace || null });
      show(`✓ Story screenshot ${oneFor.replace ? "replaced" : "added"}${n ? ` · ${n} numbers read off it (see the report)` : ""}`);
      reload();
    } catch (er) {
      show(er.message);
    }
    setBusy("");
  };
  const matched = batch ? batch.filter((b) => b.key).length : 0;

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <ContentTabs id={id} active="stories" />
      <Panel title="📸 Story screenshots" sub="A story's proof is its screenshot. The creator adds it from the app's Post step after their reel / post — or you add it here, one by one or many at once. A creator is Done only when every story screenshot is in.">
        {board && !need && (
          <Note tone="amber" icon="ℹ️">
            <b>This campaign doesn’t ask for stories.</b> Add “Story” in{" "}
            <Link href={`/vault/campaigns/new/deliverables?edit=${id}`}>
              <u>Edit brief → Deliverables</u>
            </Link>{" "}
            if creators should post one.
          </Note>
        )}
        {need > 0 && (
          <>
            <div className="st-tiles">
              <button type="button" className={`st-tile ${f === "all" ? "is-on" : ""}`} onClick={() => setF("all")}>
                <b>{list.length}</b>
                <span>Creators</span>
              </button>
              <button type="button" className={`st-tile st-tile--ok ${f === "done" ? "is-on" : ""}`} onClick={() => setF("done")}>
                <b>{done}</b>
                <span>Story screenshots in</span>
              </button>
              <button type="button" className={`st-tile st-tile--bad ${f === "missing" ? "is-on" : ""}`} onClick={() => setF("missing")}>
                <b>{list.length - done}</b>
                <span>Waiting for the story</span>
              </button>
              <div className="st-tile st-need">
                <span>Each creator</span>
                <b>
                  {need} × Story screenshot
                </b>
              </div>
            </div>

            <div className="st-bulk">
              <div>
                <b>📁 Upload many story screenshots at once</b>
                <small>
                  Images named with the creator’s <b>@handle</b>, <b>name</b> or <b># serial</b> from the list (e.g. <code>priya.eats.jpg</code>, <code>12.png</code>) go to that creator. The rest go in <b>list order from the first row</b> to creators still missing a story — you see every match before saving. Story <b>insights</b> screenshots also fill the story&apos;s numbers in the report.
                </small>
              </div>
              <div className="st-bulk__act">
                <Link href={`/vault/campaigns/${id}/report?view=story-1`} className="ga-btn ga-btn--ghost st-rep">
                  📈 Story numbers in the report
                </Link>
                <button type="button" className="ga-btn ga-btn--primary" onClick={() => filesIn.current && filesIn.current.click()} disabled={!!busy}>
                  Choose images
                </button>
                <input ref={filesIn} type="file" hidden multiple accept="image/*" onChange={(e) => (pickFiles(e.target.files), (e.target.value = ""))} />
                <input ref={one} type="file" hidden accept="image/*" onChange={onOne} />
              </div>
            </div>

            {batch && (
              <div className="st-batch">
                <p className="st-batch__h">
                  <b>
                    {matched} of {batch.length} matched
                  </b>{" "}
                  — check each one, change any creator, then save.
                </p>
                <div className="c2-tw">
                  <table className="c2-t">
                    <thead>
                      <tr>
                        <th>Screenshot</th>
                        <th>File</th>
                        <th>Goes to</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {batch.map((b, i) => (
                        <tr key={i} className={b.key ? "" : "is-bad"}>
                          <td>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={b.url} alt="" className="st-th" />
                          </td>
                          <td className="st-fn">
                            {b.file.name}
                            <small>{b.how ? `matched by ${b.how}` : `⚠️ ${b.note || "no match"} — pick the creator`}</small>
                          </td>
                          <td>
                            <select className="ga-input st-sel" value={b.key} onChange={(e) => setBatch((B) => B.map((x, j) => (j === i ? { ...x, key: e.target.value, how: e.target.value ? "you" : "" } : x)))}>
                              <option value="">— skip this image —</option>
                              {list.map((c, n) => (
                                <option key={c.key} value={c.key} disabled={!canAdd(c)}>
                                  #{n + 1} · {c.name || "—"}
                                  {c.handle ? ` · @${c.handle}` : ""}
                                  {canAdd(c) ? "" : " (no video brief yet)"}
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
                <div className="st-batch__act">
                  <button type="button" className="ga-btn ga-btn--primary" onClick={uploadBatch} disabled={!!busy || !matched}>
                    {busy && busy.startsWith("Reading") ? busy : `Save ${matched} screenshot${matched === 1 ? "" : "s"}`}
                  </button>
                  <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setBatch(null)} disabled={!!busy}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="st-bar">
          <input className="ga-input st-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Name, @handle or #" aria-label="Search" />
        </div>
        <div className="c2-tw">
          <table className="c2-t st-t">
            <thead>
              <tr>
                <th>#</th>
                <th>Creator</th>
                <th>Step</th>
                <th>Story screenshots</th>
              </tr>
            </thead>
            <tbody>
              <TableState cols={4} loading={loading && !board} error={!board && error} onRetry={reload} empty={board && !shown.length && "No creators in this view."} />
              {shown.map((c) => (
                <tr key={c.key}>
                  <td className="st-mute">{c.n}</td>
                  <td>
                    <b>{c.name || "—"}</b>
                    {c.handle && <small className="st-sub">@{c.handle}</small>}
                    {c.invite_id && <small className="st-sub">not on Geek OS yet</small>}
                  </td>
                  <td className="st-mute">{String(c.stage || "—").replace(/_/g, " ")}</td>
                  <td>
                    <div className="st-cell">
                      {c.shots.map((s) =>
                        !s.url ? (
                          <a key={s.id} href={s.link || undefined} target="_blank" rel="noopener noreferrer" className="st-old" title={`Recorded ${new Date(s.at).toLocaleDateString("en-IN")} with a link, before screenshots were needed`}>
                            🔗 Story link
                          </a>
                        ) : (
                        <span key={s.id} className="st-pf">
                          <a href={s.url} target="_blank" rel="noopener noreferrer" download title={`Added ${new Date(s.at).toLocaleString("en-IN")} — open / download`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={s.url} alt="Story screenshot" className="st-th" />
                          </a>
                          <button type="button" aria-label="Remove this story screenshot" title="Remove" onClick={() => removeStory(c, s)} disabled={!!busy}>
                            ✕
                          </button>
                        </span>
                        )
                      )}
                      {need > 0 && c.shots.length < need && canAdd(c) && <span className="ga-badge ga-badge--red">Missing {need - c.shots.length}</span>}
                      {need > 0 && c.shots.length < need && !canAdd(c) && <span className="st-mute st-wait">After the video brief</span>}
                      {need > 0 && c.shots.length >= need && <span className="ga-badge ga-badge--green">✓ Story done</span>}
                      {need > 0 && canAdd(c) && c.shots.length < need && (
                        <button
                          type="button"
                          className="c2-tbtn"
                          disabled={busy === c.key}
                          onClick={() => {
                            setOneFor({ key: c.key });
                            one.current && one.current.click();
                          }}
                        >
                          {busy === c.key ? "…" : "+ Add"}
                        </button>
                      )}
                      {need > 0 && c.shots.length >= need && (
                        <button
                          type="button"
                          className="c2-tbtn"
                          disabled={busy === c.key}
                          title="Put a different screenshot in place of this one"
                          onClick={() => {
                            setOneFor({ key: c.key, replace: c.shots[c.shots.length - 1] });
                            one.current && one.current.click();
                          }}
                        >
                          {busy === c.key ? "…" : "↻ Replace"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {toast}
      <style>{`
        .st-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
        .st-tile { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; padding: 14px; border-radius: 14px; border: 1px solid var(--ad-line); background: #fff; text-align: left; cursor: pointer; }
        .st-tile b { font-family: var(--ad-head); font-size: 22px; color: var(--ad-ink); }
        .st-tile span { font-size: 12px; color: var(--ad-muted); }
        .st-tile.is-on { border-color: #6657e9; box-shadow: 0 0 0 2px rgba(103,87,245,.15); }
        .st-tile--ok b { color: #16a34a; } .st-tile--bad b { color: #dc2626; }
        .st-need { cursor: default; background: var(--ad-soft-2); } .st-need b { font-size: 13px; }
        .st-bulk { display: flex; gap: 16px; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-top: 16px; padding: 14px; border-radius: 14px; border: 1px dashed #c9c3f5; background: #f7f5ff; }
        .st-bulk > div:first-child { flex: 1 1 360px; }
        .st-bulk b { font-size: 14px; color: var(--ad-ink); }
        .st-bulk small { display: block; margin-top: 4px; font-size: 12px; line-height: 1.5; color: var(--ad-muted); }
        .st-bulk small b { font-size: 12px; } .st-bulk code { font-size: 11.5px; background: #fff; padding: 1px 5px; border-radius: 5px; }
        .st-bulk__act { display: flex; gap: 8px; flex-wrap: wrap; }
        .st-bulk__act .ga-btn { height: 40px; }
        .st-rep { display: inline-flex; align-items: center; text-decoration: none; }
        .st-batch { margin-top: 14px; padding: 14px; border-radius: 14px; border: 1px solid var(--ad-line); }
        .st-batch__h { font-size: 13px; color: var(--ad-text); }
        .st-batch__act { display: flex; gap: 8px; margin-top: 12px; }
        .st-batch tr.is-bad td { background: #fff7e8; }
        .st-fn { white-space: normal !important; max-width: 260px; font-size: 12px; word-break: break-all; }
        .st-fn small { display: block; color: var(--ad-muted); }
        .st-sel { height: 36px; min-width: 200px; font-size: 12.5px; }
        .st-th { width: 46px; height: 46px; object-fit: cover; border-radius: 8px; border: 1px solid var(--ad-line); display: block; }
        .st-bar { margin-top: 18px; }
        .st-q { width: 280px; height: 38px; }
        .st-t { margin-top: 10px; }
        .st-t td { vertical-align: middle; }
        .st-mute { font-size: 12px; color: var(--ad-muted); text-transform: capitalize; }
        .st-sub { display: block; font-size: 11px; color: var(--ad-muted); }
        .st-old { display: inline-flex; align-items: center; height: 46px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--ad-line); font-size: 12px; color: var(--ad-text); background: var(--ad-soft-2); }
        .st-wait { text-transform: none; }
        .st-pf { position: relative; display: inline-block; }
        .st-pf button { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; border: 0; background: #1f2433; color: #fff; font-size: 10px; line-height: 18px; cursor: pointer; opacity: .85; }
        .st-pf button:hover { background: #dc2626; opacity: 1; }
        .st-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        @media (max-width: 900px) { .st-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>
    </AdminShell>
  );
}
