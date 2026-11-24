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

/*
 * 📸 Story screenshots — brief mein Story ho tab. Story ka proof = screenshot (Instagram se check nahi).
 * Creator apne app ke "Post" step se daalta hai; team yahan ek ek, ya bahut saari images ek saath:
 * naam mein @handle / naam / #serial ho to us creator par, warna list ke kram se (pehli row se) jinki story baaki hai.
 * Geek OS creator → api.bp_add_post_link (story + screenshot) · sheet creator → api.invite_add_post. Saare screenshots poore hone par creator "Done".
 */
const IMG = /\.(jpe?g|png|webp|heic|gif)$/i;
const norm = (s) => String(s || "").toLowerCase().replace(/^@/, "");

function guessKey(file, list) {
  const path = norm(file.webkitRelativePath || file.name);
  const base = norm(file.name.replace(/\.[^.]+$/, ""));
  const byHandle = list.filter((x) => x.handle && norm(x.handle).length >= 3 && path.includes(norm(x.handle))).sort((a, b) => norm(b.handle).length - norm(a.handle).length)[0];
  if (byHandle) return { key: byHandle.key, how: "handle" };
  const byName = list.find((x) => x.name && norm(x.name).replace(/\s+/g, "").length >= 4 && base.replace(/[\s_\-.]+/g, "").includes(norm(x.name).replace(/\s+/g, "")));
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
        shots: (r.stories || []).filter((s) => s.url),
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
    const got = imgs.slice(0, 500).map((file) => ({ file, url: URL.createObjectURL(file), ...guessKey(file, list) }));
    const want = {};
    list.forEach((c) => (want[c.key] = Math.max(0, need - c.shots.length)));
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

  const saveOne = async (file, c) => {
    const url = await uploadInsightsProof(file);
    const payload = { media_type: "story", screenshot_url: url };
    const r = c.participation_id ? await rpc("admin", "api.bp_add_post_link", { p_participation: c.participation_id, p_payload: payload }) : await rpc("admin", "api.invite_add_post", { p_invite: c.invite_id, p_payload: payload });
    if (r.error) throw new Error(errText(r.error));
  };
  const uploadBatch = async () => {
    const go = batch.filter((b) => b.key);
    if (!go.length) return show("Match at least one screenshot to a creator");
    let ok = 0;
    const fails = [];
    for (let i = 0; i < go.length; i++) {
      setBusy(`Uploading ${i + 1} / ${go.length}…`);
      const c = list.find((x) => x.key === go[i].key);
      try {
        await saveOne(go[i].file, c);
        ok++;
      } catch (e) {
        fails.push(`${c ? c.name || c.handle : go[i].file.name}: ${e.message}`);
      }
    }
    setBusy("");
    setBatch(null);
    reload();
    show(`✓ ${ok} story screenshot${ok === 1 ? "" : "s"} added${fails.length ? ` · ${fails.length} not added — ${fails.slice(0, 2).join(" · ")}` : ""}`);
  };
  const onOne = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || !oneFor) return;
    const c = list.find((x) => x.key === oneFor);
    setBusy(oneFor);
    try {
      await saveOne(file, c);
      show("✓ Story screenshot added");
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
                  Images named with the creator’s <b>@handle</b>, <b>name</b> or <b># serial</b> from the list (e.g. <code>priya.eats.jpg</code>, <code>12.png</code>) go to that creator. The rest go in <b>list order from the first row</b> to creators still missing a story — you see every match before saving.
                </small>
              </div>
              <div className="st-bulk__act">
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
                            <small>{b.how ? `matched by ${b.how}` : "⚠️ no match — pick the creator"}</small>
                          </td>
                          <td>
                            <select className="ga-input st-sel" value={b.key} onChange={(e) => setBatch((B) => B.map((x, j) => (j === i ? { ...x, key: e.target.value, how: e.target.value ? "you" : "" } : x)))}>
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
                    {busy && busy.startsWith("Uploading") ? busy : `Save ${matched} screenshot${matched === 1 ? "" : "s"}`}
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
                      {c.shots.map((s) => (
                        <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" download title={`Added ${new Date(s.at).toLocaleString("en-IN")} — open / download`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.url} alt="Story screenshot" className="st-th" />
                        </a>
                      ))}
                      {need > 0 && c.shots.length < need && <span className="ga-badge ga-badge--red">Missing {need - c.shots.length}</span>}
                      {need > 0 && c.shots.length >= need && <span className="ga-badge ga-badge--green">✓ Story done</span>}
                      {need > 0 && (
                        <button
                          type="button"
                          className="c2-tbtn"
                          disabled={busy === c.key}
                          onClick={() => {
                            setOneFor(c.key);
                            one.current && one.current.click();
                          }}
                        >
                          {busy === c.key ? "…" : "+ Add"}
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
        .st-bulk__act .ga-btn { height: 40px; }
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
        .st-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        @media (max-width: 900px) { .st-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>
    </AdminShell>
  );
}
