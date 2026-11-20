"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creator/BountyShell";
import { useMyIg, getPostingRules, uploadIgMedia, publishToInstagram, recordCampaignPost, igUsers, campaignPieces, errText, syncIgMedia } from "@/services/creator";

const KINDS = {
  feed: { label: "Post", accept: "image/*,video/mp4,video/quicktime", multiple: true, max: 10, hint: "1 photo = post · 2–10 photos/videos = carousel. Any photo format — we turn it into a JPEG for Instagram.", btn: "Publish post", ok: "Posted to Instagram ✅" },
  reel: { label: "Reel", accept: "video/mp4,video/quicktime", multiple: false, max: 1, hint: "MP4 / MOV, vertical 9:16, 3–90 seconds.", btn: "Publish reel", ok: "Reel posted to Instagram ✅" },
  story: { label: "Story", accept: "image/*,video/mp4,video/quicktime", multiple: false, max: 1, hint: "Vertical 9:16 works best. Videos up to 60 seconds. Text you type is printed on a photo story.", btn: "Publish story", ok: "Story is live on Instagram ✅" },
};
const CAP_MAX = 2200;

/** Instagram kabhi apni bhasha (Hindi / Marathi…) mein error deta hai — hamesha saaf English mein dikhao */
function englishError(msg, collabs, tags) {
  msg = String(msg || "").trim();
  if (!msg) return "Couldn't publish — please try again.";
  const named = [...collabs, ...tags].filter((u) => msg.includes(u));
  if (/[^\x00-\x7F]/.test(msg)) {
    const head = msg.split(" — ")[0];
    if (named.length) return `${head} Instagram can't find or reach ${named.map((u) => "@" + u).join(", ")} — check the spelling, or remove them and try again.`;
    return `${head} Instagram didn't accept this post — check the file, caption and tagged accounts, then try again.`;
  }
  if (named.length && /access|exist|find/i.test(msg)) return `Instagram can't find or reach ${named.map((u) => "@" + u).join(", ")} — check the spelling, or remove them and try again.`;
  return msg;
}

/**
 * /creator/instagram — sidebar ka "Post to Instagram": seedha post / reel / story + live stories (purana Instagram page: 📤 Post · 🟣 Stories).
 * Campaign chuno → caption, @mentions, #hashtags, collaborator aur #ad campaign se apne aap bhar jaate hain.
 * Publish → edge function instagram-publish · campaign post → api.record_campaign_post (brief check + brand report).
 * ?p=<participation_id> → wahi campaign pehle se chuna hua ("Post from Bounty" from the Post step).
 */
export default function PublishPage() {
  const ig = useMyIg();
  const [rules, setRules] = useState([]);
  const [pid, setPid] = useState("");
  const [kind, setKind] = useState("feed");
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [collab, setCollab] = useState("");
  const [storyText, setStoryText] = useState("");
  const [showMentions, setShowMentions] = useState(true);
  const [shareFeed, setShareFeed] = useState(true);
  const [audio, setAudio] = useState("");
  const [cover, setCover] = useState(null);
  const [isAd, setIsAd] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  // top-centre "island" pop-up (Instagram jaisa): posting… → posted ✓ / failed
  const [isl, setIsl] = useState(null);
  const islT = useRef(null);
  const island = (v, hideMs) => {
    clearTimeout(islT.current);
    setIsl(v);
    if (hideMs) islT.current = setTimeout(() => setIsl(null), hideMs);
  };
  const [done, setDone] = useState(null);

  const [syncing, setSyncing] = useState(false);
  const [now, setNow] = useState(0);
  // chuni hui files ki chhoti photos (preview)
  const previews = useMemo(() => files.map((f) => ({ url: URL.createObjectURL(f), video: /^video\//.test(f.type || ""), name: f.name })), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u.url)), [previews]);
  // "5m ago" ke liye ghadi — har minute
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t0 = setTimeout(tick, 0);
    const t = setInterval(tick, 60000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, []);
  const refreshStories = async () => {
    setSyncing(true);
    try {
      await syncIgMedia(true);
      await ig.reload?.(true);
    } catch {}
    setSyncing(false);
  };
  const rule = useMemo(() => rules.find((r) => r.participation_id === pid) || null, [rules, pid]);
  const K = KINDS[kind];

  // campaign se sab kuch bharo (purana fillCampaign)
  const fill = (r, k) => {
    if (!r) return;
    const { tags: tg, ments, line } = campaignPieces(r);
    const inLine = (t) => new RegExp("(^|\\s)" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\w.])", "i").test(line);
    const extraM = ments.map((m) => "@" + m).filter((m) => !inLine(m));
    const extraT = tg.filter((t) => !inLine(t));
    setIsAd(true);
    if (k === "story") {
      setTags(ments.map((m) => "@" + m).join(", "));
      setStoryText([line, extraT.join(" "), "#ad"].filter(Boolean).join(" ").slice(0, 220));
      setCaption("");
      setCollab("");
    } else {
      setCaption(["#ad " + line, [extraM.join(" "), extraT.join(" ")].filter(Boolean).join("\n")].filter(Boolean).join("\n\n"));
      setCollab(r.collab_rights !== false && ments[0] ? "@" + ments[0] : "");
      setTags(ments.slice(1).map((m) => "@" + m).join(", "));
    }
  };
  const nextFormat = (r) => {
    const f = r.formats || [];
    return f.find((x) => x.done < x.need) || f[0] || { kind: "reel" };
  };

  useEffect(() => {
    let on = true;
    getPostingRules().then(({ data }) => {
      if (!on) return;
      setRules(data);
      const want = new URLSearchParams(window.location.search).get("p");
      const r = want && data.find((x) => x.participation_id === want);
      if (r) {
        const k = ["feed", "reel", "story"].includes(nextFormat(r).kind) ? nextFormat(r).kind : "reel";
        setPid(r.participation_id);
        setKind(k);
        fill(r, k);
      }
    });
    return () => {
      on = false;
    };
  }, []);

  const pickCampaign = (v) => {
    setPid(v);
    const r = rules.find((x) => x.participation_id === v);
    if (r) {
      const k = ["feed", "reel", "story"].includes(nextFormat(r).kind) ? nextFormat(r).kind : kind;
      setKind(k);
      fill(r, k);
    } else {
      setCaption("");
      setTags("");
      setCollab("");
      setStoryText("");
      setIsAd(false);
    }
  };
  const pickKind = (k) => {
    setKind(k);
    setFiles([]);
    if (rule) fill(rule, k);
  };
  const toggleAd = (v) => {
    setIsAd(v);
    const has = /(^|\s)#ad\b/i.test(caption);
    if (v && !has) setCaption((c) => ("#ad " + c).trim());
    if (!v && has) setCaption((c) => c.replace(/(^|\s)#ad\b/gi, "").trim());
  };

  const hashN = (caption.match(/#[\p{L}\p{N}_]+/gu) || []).length;
  const mentN = (caption.match(/@[A-Za-z0-9._]+/g) || []).length;
  const capOk = caption.length <= CAP_MAX && hashN <= 30 && mentN <= 20;

  const publish = async () => {
    setErr("");
    setDone(null);
    if (!files.length) return setErr("Pick a file first.");
    if (!capOk) return setErr("Caption is over Instagram's limits (2,200 characters · 30 hashtags · 20 mentions).");
    const vids = files.filter((f) => /^video\//.test(f.type || ""));
    if (kind === "reel" && !vids.length) return setErr("Reels need a video file.");
    if (kind === "feed" && files.length === 1 && vids.length) return setErr("A single video is a Reel — choose Reel.");
    if (files.some((f) => f.size > 50 * 1024 * 1024)) return setErr("Each file must be under 50 MB.");
    const collabs = igUsers(collab);
    if (collabs.length > 3) return setErr("Instagram allows at most 3 collaborators.");
    const tagList = igUsers(tags);
    const thumb = previews[0] && !previews[0].video ? previews[0].url : "";
    const steps = files.length + (kind === "reel" && cover ? 1 : 0) + 2;
    try {
      island({ phase: "busy", text: `Posting your ${K.label.toLowerCase()}…`, pct: 4, thumb });
      const media = [];
      for (let i = 0; i < files.length; i++) {
        setBusy(`Uploading ${i + 1}/${files.length}…`);
        island({ phase: "busy", text: files.length > 1 ? `Uploading ${i + 1}/${files.length}…` : "Uploading…", pct: Math.round(((i + 0.3) / steps) * 100), thumb });
        media.push(await uploadIgMedia(files[i], kind, kind === "story" ? { text: storyText, mentions: showMentions ? tagList.map((u) => "@" + u).join(" ") : "" } : null));
      }
      const body = { kind, media, caption: kind === "story" ? "" : caption, user_tags: tagList, collaborators: kind === "story" ? [] : collabs };
      if (kind === "reel") {
        body.reel = { share_to_feed: shareFeed, audio_name: audio.trim() };
        if (cover) {
          setBusy("Uploading cover…");
          body.reel.cover_url = (await uploadIgMedia(cover, "reel")).url;
        }
      }
      setBusy(vids.length ? "Publishing… (videos take up to a minute)" : "Publishing…");
      island({ phase: "busy", text: "Posting…", pct: Math.round(((steps - 1.5) / steps) * 100), thumb });
      const { data, error } = await publishToInstagram(body);
      if (error) throw error;
      const notes = [K.ok + (data && data.carousel ? " (carousel)" : "")];
      if (collabs.length && kind !== "story") notes.push("collaborator invite sent");
      const skipped = (data && data.skipped_tags) || [];
      const tagged = tagList.filter((u) => !skipped.includes(u));
      if (tagged.length) notes.push(kind === "story" ? `mentioned ${tagged.map((u) => "@" + u).join(", ")}` : `tagged ${tagged.map((u) => "@" + u).join(", ")}`);
      const skC = (data && data.skipped_collaborators) || [];
      if (skC.length) notes.push(`⚠️ couldn't add ${skC.map((u) => "@" + u).join(", ")} as collaborator — check the spelling (only existing professional accounts can be invited)`);
      if (skipped.length) notes.push(`⚠️ couldn't tag ${skipped.map((u) => "@" + u).join(", ")} — check the spelling (private accounts can't be tagged)`);
      if (rule) {
        if (rule.can_record_post && data && data.permalink) {
          const rr = await recordCampaignPost(rule.participation_id, { media_type: kind === "feed" ? "post" : kind, permalink: data.permalink, caption: body.caption });
          notes.push(rr.error ? "couldn't record it on the campaign: " + errText(rr.error) : rr.data && rr.data.caption_check === "issues" ? "⚠️ the caption is missing something from the brief" : "recorded on the campaign ✓");
        } else if (!rule.can_record_post) notes.push("this campaign isn't at the posting step yet, so it wasn't recorded there");
      }
      setDone({ text: notes.join(" · "), link: data && data.permalink });
      island({ phase: "done", text: kind === "story" ? "Your story is live" : kind === "reel" ? "Reel posted" : files.length > 1 ? "Carousel posted" : "Post done", thumb, link: data && data.permalink }, 6000);
      setFiles([]);
      setCover(null);
      setTimeout(refreshStories, 4000);
      getPostingRules().then(({ data: d }) => setRules(d));
    } catch (e) {
      const m = englishError(errText(e), igUsers(collab), igUsers(tags));
      setErr(m);
      island({ phase: "fail", text: "Couldn't post — see details", thumb }, 6000);
    } finally {
      setBusy("");
    }
  };

  const acct = ig.acct;
  const stories = (acct && Array.isArray(acct.recent_stories) ? acct.recent_stories : []).filter((x) => x && (x.media_url || x.thumbnail_url));
  const ago = (t) => {
    if (!now) return "";
    const m = Math.max(1, Math.round((now - new Date(t).getTime()) / 60000));
    return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
  };
  return (
    <BountyShell>
      <title>Post to Instagram — Bounty</title>
      {isl && (
        <div key={isl.phase} className={`pb-isl is-${isl.phase}`} role="status" aria-live="polite">
          <span className="pb-isl__th">{isl.thumb ? <img src={isl.thumb} alt="" /> : <i>{K.label === "Story" ? "⭕" : "📷"}</i>}</span>
          <span className="pb-isl__t">{isl.text}</span>
          {isl.phase === "busy" && (
            <span className="pb-isl__ring" style={{ "--p": isl.pct || 0 }} aria-hidden="true" />
          )}
          {isl.phase === "done" && (isl.link ? <a href={isl.link} target="_blank" rel="noopener noreferrer" className="pb-isl__go">View</a> : <b className="pb-isl__ok">✓</b>)}
          {isl.phase === "fail" && <b className="pb-isl__bad">!</b>}
        </div>
      )}
      <h1 className="bx-title">Post to Instagram</h1>
      <p className="bx-lede">Post, reel or story straight to {acct && acct.username ? `@${acct.username}` : "your Instagram"}. Campaign posts come filled in — caption, @mentions, #hashtags, collaborator and #ad.</p>

      {!ig.loading && !acct && (
        <section className="bx-card pb-empty">
          <p>Connect your Instagram first — then you can post from here.</p>
          <Link href="/creator/profile/instagram" className="bx-btn bx-btn--dark">
            Connect Instagram
          </Link>
        </section>
      )}

      {acct && (
        <div className="pb-grid">
          <section className="bx-card pb-card">
            {rules.length > 0 && (
              <label className="pb-f">
                <span className="pb-l">Is this for a campaign?</span>
                <select className="bx-input" value={pid} onChange={(e) => pickCampaign(e.target.value)}>
                  <option value="">No — personal post</option>
                  {rules.map((r) => (
                    <option key={r.participation_id} value={r.participation_id}>
                      {r.campaign || "Campaign"}
                      {r.brand ? ` · ${r.brand}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {rule && (
              <div className="pb-camp">
                <div className="pb-camp__t">
                  <b>📣 {rule.campaign}</b>
                  <span>
                    {[rule.brand, rule.product ? `🎁 ${rule.product}` : ""].filter(Boolean).join(" · ")}
                  </span>
                </div>
                {(rule.formats || []).length > 0 && (
                  <div className="pb-fmts">
                    {rule.formats.map((f) => (
                      <button key={f.kind + f.label} type="button" className={`pb-fmt ${f.kind === kind ? "is-on" : ""} ${f.done >= f.need ? "is-done" : ""}`} onClick={() => ["feed", "reel", "story"].includes(f.kind) && pickKind(f.kind)}>
                        {f.done >= f.need ? "✓ " : ""}
                        {f.label}
                        {f.need > 1 ? ` ${Math.min(f.done, f.need)}/${f.need}` : ""}
                      </button>
                    ))}
                  </div>
                )}
                {rule.approved_video && (
                  <p>
                    🎬 Post your <b>approved</b> video —{" "}
                    <a href={/^https?:\/\//i.test(rule.approved_video) ? rule.approved_video : "#"} target="_blank" rel="noopener noreferrer">
                      download it ↗
                    </a>
                  </p>
                )}
                {rule.posting_note && <p className="pb-muted">📝 {rule.posting_note}</p>}
                {!rule.can_record_post && <p className="pb-warn">⏳ The brand hasn&apos;t approved your video yet — post only after approval.</p>}
              </div>
            )}

            <div className="pb-kinds" role="tablist" aria-label="What to post">
              {Object.entries(KINDS).map(([k, v]) => (
                <button key={k} type="button" role="tab" aria-selected={kind === k} className={kind === k ? "is-on" : ""} onClick={() => pickKind(k)}>
                  {k === "feed" ? "🖼 " : k === "reel" ? "🎬 " : "⭕ "}
                  {k === "feed" ? "Post / Carousel" : v.label}
                </button>
              ))}
            </div>

            {previews.length ? (
              <div className="pb-drop pb-drop--on">
                {kind === "feed" && (
                  <p className="pb-cnt">
                    {previews.length > 1 ? `Carousel · ${previews.length}/10` : "Single post — add more to make a carousel"}
                    <small>{previews.length > 1 ? "First one is the cover. Use ‹ to reorder." : ""}</small>
                  </p>
                )}
                <span className="pb-thumbs">
                  {previews.map((p, i) => (
                    <span key={p.url} className="pb-thumb">
                      {p.video ? <video src={p.url} muted /> : <img src={p.url} alt="" />}
                      {p.video && <i>▶</i>}
                      {previews.length > 1 && <b className="pb-thumb__n">{i + 1}</b>}
                      <button type="button" className="pb-thumb__x" aria-label="Remove" onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}>×</button>
                      {i > 0 && (
                        <button type="button" className="pb-thumb__mv" aria-label="Move left" onClick={() => setFiles((f) => { const n = [...f]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}>‹</button>
                      )}
                    </span>
                  ))}
                  {kind === "feed" && previews.length < K.max ? (
                    <label className="pb-thumb pb-thumb--add">
                      <input type="file" accept={K.accept} multiple onChange={(e) => { const add = [...(e.target.files || [])]; e.target.value = ""; setFiles((f) => [...f, ...add].slice(0, K.max)); }} />
                      ＋ Add
                    </label>
                  ) : (
                    <label className="pb-thumb pb-thumb--add">
                      <input type="file" accept={K.accept} multiple={K.multiple} onChange={(e) => setFiles([...(e.target.files || [])].slice(0, K.max))} />
                      Change
                    </label>
                  )}
                </span>
              </div>
            ) : (
              <label className="pb-drop">
                <input type="file" accept={K.accept} multiple={K.multiple} onChange={(e) => setFiles([...(e.target.files || [])].slice(0, K.max))} />
                <span className="pb-drop__t">
                  <b>{kind === "feed" ? "Choose photos or videos" : kind === "reel" ? "Choose your video" : "Choose a photo or video"}</b>
                  <small>{K.hint}</small>
                </span>
              </label>
            )}

            {kind !== "story" ? (
              <label className="pb-f">
                <span className="pb-l">
                  Caption <em className={capOk ? "" : "pb-bad"}>{caption.length}/{CAP_MAX} · {hashN}/30 # · {mentN}/20 @</em>
                </span>
                <textarea className="bx-input pb-cap" rows={5} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption… use #hashtags and @mentions" />
              </label>
            ) : (
              <label className="pb-f">
                <span className="pb-l">Text on the story (printed on a photo)</span>
                <input className="bx-input" value={storyText} maxLength={220} onChange={(e) => setStoryText(e.target.value)} placeholder="e.g. Loving my new kit ✨" />
                <span className="pb-check">
                  <input type="checkbox" checked={showMentions} onChange={(e) => setShowMentions(e.target.checked)} /> Show the @mentions on the photo too
                </span>
              </label>
            )}

            <div className="pb-row">
              <label className="pb-f">
                <span className="pb-l">{kind === "story" ? "Mention accounts" : "Tag people"}</span>
                <input className="bx-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="@brand, @friend" />
              </label>
              {kind !== "story" && (
                <label className="pb-f">
                  <span className="pb-l">Collaborator (up to 3)</span>
                  <input className="bx-input" value={collab} onChange={(e) => setCollab(e.target.value)} placeholder="@brand" />
                </label>
              )}
            </div>

            {kind === "reel" && (
              <div className="pb-row">
                <label className="pb-f">
                  <span className="pb-l">Cover image (optional)</span>
                  <span className="pb-file">
                    <input type="file" accept="image/*" onChange={(e) => setCover((e.target.files || [])[0] || null)} />
                    <b>{cover ? "Change" : "Choose image"}</b>
                    <small>{cover ? cover.name : "JPG / PNG · 9:16"}</small>
                  </span>
                </label>
                <label className="pb-f">
                  <span className="pb-l">Audio name (optional)</span>
                  <input className="bx-input" value={audio} onChange={(e) => setAudio(e.target.value)} placeholder="Original audio" />
                </label>
              </div>
            )}
            <div className="pb-checks">
              {kind === "reel" && (
                <label className="pb-check">
                  <input type="checkbox" checked={shareFeed} onChange={(e) => setShareFeed(e.target.checked)} /> Also show on my profile grid
                </label>
              )}
              {kind !== "story" && pid && (
                <label className="pb-check">
                  <input type="checkbox" checked={isAd} onChange={(e) => toggleAd(e.target.checked)} /> Paid partnership — add #ad (ASCI)
                </label>
              )}
            </div>

            {err && <p className="ts-err">{err}</p>}
            {done && (
              <p className="pb-ok">
                {done.text}
                {done.link && (
                  <>
                    {" · "}
                    <a href={done.link} target="_blank" rel="noopener noreferrer">
                      View on Instagram ↗
                    </a>
                  </>
                )}
              </p>
            )}
            <button type="button" className="bx-btn bx-btn--dark bx-btn--lg pb-go" disabled={!!busy} onClick={publish}>
              {busy || `${K.btn} →`}
            </button>
            <p className="pb-muted pb-center">Music and stickers aren&apos;t available through Instagram&apos;s API — add them in the Instagram app if you need them.</p>
          </section>

          <aside className="pb-side">
            <section className="bx-card pb-stories">
              <h3>
                Live stories <small>{stories.length ? `${stories.length} · gone 24h after posting` : "last 24 hours"}</small>
                <button type="button" className="pb-ref" onClick={refreshStories} disabled={syncing}>
                  {syncing ? "…" : "↻"}
                </button>
              </h3>
              {stories.length ? (
                <div className="pb-strip">
                  {stories.map((x) => (
                    <a key={x.id} href={x.permalink || "#"} target="_blank" rel="noopener noreferrer" className="pb-story">
                      <img src={x.media_type === "VIDEO" ? x.thumbnail_url || x.media_url : x.media_url} alt="" referrerPolicy="no-referrer" loading="lazy" />
                      {x.media_type === "VIDEO" && <i>▶</i>}
                      <span>{ago(x.timestamp)}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="pb-muted">No live stories right now. Post one from here — it shows for 24 hours.</p>
              )}
            </section>
            <section className="bx-card pb-prev">
              <h3>Preview</h3>
              <div className={`pb-phone pb-phone--${kind}`}>
                <div className="pb-phone__head">
                  {acct.profile_picture_url && <img src={acct.profile_picture_url} alt="" referrerPolicy="no-referrer" />}
                  <b>{acct.username}</b>
                  {collab.trim() && <span> · with {igUsers(collab)[0] ? "@" + igUsers(collab)[0] : ""}</span>}
                </div>
                <div className="pb-phone__media">
                  {previews[0] ? previews[0].video ? <video src={previews[0].url} muted /> : <img src={previews[0].url} alt="" /> : <span>Your {K.label.toLowerCase()} shows here</span>}
                  {kind === "story" && storyText && <em>{storyText}</em>}
                  {kind === "feed" && previews.length > 1 && <b className="pb-phone__n">1/{previews.length}</b>}
                </div>
                {kind === "feed" && previews.length > 1 && (
                  <div className="pb-dots">{previews.map((p, i) => <i key={p.url} className={i === 0 ? "is-on" : ""} />)}</div>
                )}
                {kind !== "story" && caption && (
                  <p className="pb-phone__cap">
                    <b>{acct.username}</b> {caption.length > 180 ? caption.slice(0, 180) + "…" : caption}
                  </p>
                )}
              </div>
            </section>

          </aside>
        </div>
      )}

      <style>{`
        .pb-isl { position: fixed; z-index: 1000; left: 50%; top: max(10px, env(safe-area-inset-top)); transform: translateX(-50%); display: flex; align-items: center; gap: 10px;
          min-width: 220px; max-width: min(92vw, 380px); height: 44px; padding: 5px 8px 5px 5px; border-radius: 999px; background: #0b0b0c; color: #fff;
          box-shadow: 0 14px 34px -12px rgba(0,0,0,.6); font: 600 13.5px/1.2 var(--bx-sans, system-ui); animation: pbIsl .45s cubic-bezier(.2,1.3,.4,1) both; }
        @keyframes pbIsl { from { opacity: 0; transform: translateX(-50%) scale(.55, .7); min-width: 120px; } to { opacity: 1; transform: translateX(-50%) scale(1); } }
        .pb-isl__th { flex: 0 0 34px; width: 34px; height: 34px; border-radius: 50%; overflow: hidden; display: grid; place-items: center; background: #26262a; }
        .pb-isl__th img { width: 100%; height: 100%; object-fit: cover; }
        .pb-isl__th i { font-style: normal; font-size: 15px; }
        .pb-isl__t { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pb-isl__ring { flex: 0 0 26px; width: 26px; height: 26px; border-radius: 50%; margin-right: 4px;
          background: conic-gradient(#3fd17f calc(var(--p) * 1%), #333 0); -webkit-mask: radial-gradient(circle, transparent 8px, #000 9px); mask: radial-gradient(circle, transparent 8px, #000 9px); transition: background .4s; }
        .pb-isl__ok, .pb-isl__bad { flex: 0 0 26px; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; margin-right: 4px; font-size: 14px; }
        .pb-isl__ok { background: #2fbf6b; color: #fff; }
        .pb-isl__bad { background: #e0533d; color: #fff; }
        .pb-isl__go { flex: 0 0 auto; padding: 7px 13px; border-radius: 999px; background: #2fbf6b; color: #fff; font-size: 12.5px; font-weight: 700; text-decoration: none; }
        .pb-isl.is-done { animation: pbIsl .45s cubic-bezier(.2,1.3,.4,1) both; }
        @media (min-width: 900px) { .pb-isl { top: 16px; height: 48px; min-width: 260px; } }
        .pb-empty { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; padding: 18px 20px; margin-top: 16px; }
        .pb-empty p { margin: 0; }
        .pb-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(280px, 1fr); gap: 18px; align-items: start; margin-top: 18px; }
        .pb-card { display: grid; gap: 16px; padding: 22px; }
        .pb-f { display: grid; gap: 6px; min-width: 0; }
        .pb-l { font-size: 12px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: #8a6b32; }
        .pb-l em { margin-left: 8px; font-style: normal; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--bx-muted); }
        .pb-l em.pb-bad { color: #b8401f; }
        .pb-cap { min-height: 130px; resize: vertical; }
        .pb-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pb-checks { display: grid; gap: 8px; }
        .pb-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--bx-ink); }
        .pb-muted { margin: 0; font-size: 12px; color: var(--bx-muted); }
        .pb-center { text-align: center; }
        .pb-warn { margin: 6px 0 0; font-size: 12.5px; color: #b45309; }
        .pb-ok { margin: 0; padding: 10px 12px; border-radius: 12px; background: #dff0dc; color: #1f5f3a; font-size: 13px; font-weight: 600; }
        .pb-ok a { color: #1f5f3a; text-decoration: underline; }
        .pb-go { width: 100%; justify-content: center; }
        .pb-camp { padding: 12px 14px; border-radius: 12px; background: #fffaf0; border: 1px solid var(--bx-line); font-size: 13px; line-height: 1.55; }
        .pb-camp__t { display: flex; flex-direction: column; }
        .pb-camp__t span { color: var(--bx-muted); font-size: 12.5px; }
        .pb-camp p { margin: 6px 0 0; }
        .pb-camp a { font-weight: 700; color: #2e9c94; }
        .pb-fmts { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
        .pb-fmt { padding: 4px 11px; border-radius: 999px; border: 1px solid var(--bx-line); background: #fff; font-size: 12px; font-weight: 700; }
        .pb-fmt.is-done { color: #2f8f5b; }
        .pb-fmt.is-on { background: #123524; border-color: #123524; color: #fbf3e2; }
        .pb-kinds { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; border-radius: 14px; background: #f3e6c8; }
        .pb-kinds button { padding: 9px 10px; border-radius: 10px; border: 0; background: none; font-size: 13.5px; font-weight: 700; color: #6b5a3a; }
        .pb-kinds button.is-on { background: #123524; color: #fbf3e2; box-shadow: 0 6px 14px -10px rgba(0,0,0,.5); }
        .pb-drop { position: relative; display: block; padding: 18px; border-radius: 14px; border: 1.5px dashed #c9b98f; background: #fffaf0; cursor: pointer; transition: border-color .15s, background .15s; }
        .pb-drop:hover { border-color: #123524; background: #fff; }
        .pb-drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .pb-drop__t { display: grid; gap: 4px; text-align: center; }
        .pb-drop__t b { font-size: 14px; color: var(--bx-ink); }
        .pb-drop__t small { font-size: 12px; color: var(--bx-muted); }
        .pb-thumbs { display: flex; gap: 8px; flex-wrap: wrap; }
        .pb-thumb { position: relative; width: 74px; height: 92px; border-radius: 10px; overflow: hidden; background: #eadcb8; }
        .pb-thumb img, .pb-thumb video { width: 100%; height: 100%; object-fit: cover; }
        .pb-thumb i { position: absolute; top: 4px; right: 6px; color: #fff; font-style: normal; text-shadow: 0 1px 3px #000; }
        .pb-drop--on { cursor: default; }
        .pb-cnt { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin: 0 0 10px; font-size: 13px; font-weight: 700; color: var(--bx-ink); }
        .pb-cnt small { font-weight: 400; color: var(--bx-muted); }
        .pb-thumb__n { position: absolute; left: 5px; top: 5px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9px; background: rgba(0,0,0,.6); color: #fff; font-size: 11px; display: grid; place-items: center; }
        .pb-thumb__x, .pb-thumb__mv { position: absolute; width: 22px; height: 22px; border-radius: 50%; border: 0; background: rgba(0,0,0,.65); color: #fff; font-size: 14px; line-height: 1; display: grid; place-items: center; cursor: pointer; }
        .pb-thumb__x { right: 4px; bottom: 4px; }
        .pb-thumb__mv { left: 4px; bottom: 4px; }
        .pb-thumb--add { position: relative; cursor: pointer; }
        .pb-thumb--add input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .pb-phone__n { position: absolute; top: 8px; right: 8px; padding: 3px 8px; border-radius: 999px; background: rgba(0,0,0,.6); color: #fff; font-size: 11px; }
        .pb-dots { display: flex; justify-content: center; gap: 4px; padding: 8px 0 0; }
        .pb-dots i { width: 6px; height: 6px; border-radius: 50%; background: #d6ccb6; }
        .pb-dots i.is-on { background: #3897f0; }
        .pb-thumb--add { display: grid; place-items: center; font-size: 12px; font-weight: 700; color: #6b5a3a; border: 1px dashed #c9b98f; background: transparent; }
        .pb-side { display: grid; gap: 18px; position: sticky; top: 90px; }
        .pb-prev, .pb-stories { padding: 18px; }
        .pb-prev h3, .pb-stories h3 { display: flex; align-items: baseline; gap: 8px; margin: 0 0 12px; font-family: var(--bx-serif); font-size: 16px; font-weight: 600; color: var(--bx-ink); }
        .pb-stories h3 small { font-family: var(--bx-sans); font-size: 12px; font-weight: 400; color: var(--bx-muted); }
        .pb-ref { margin-left: auto; width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--bx-line); background: #fffaf0; font-size: 14px; }
        .pb-file { position: relative; display: flex; align-items: center; gap: 10px; min-height: 46px; padding: 6px 12px 6px 6px; border-radius: 12px; border: 1px dashed #c9b98f; background: #fffaf0; cursor: pointer; }
        .pb-file:hover { border-color: #123524; background: #fff; }
        .pb-file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .pb-file b { padding: 7px 12px; border-radius: 9px; background: #123524; color: #fbf3e2; font-size: 12.5px; white-space: nowrap; }
        .pb-file small { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--bx-muted); }
        .pb-phone { border-radius: 16px; overflow: hidden; background: #fff; border: 1px solid #eadfc6; }
        .pb-phone__head { display: flex; align-items: center; gap: 8px; padding: 9px 11px; font-size: 12.5px; }
        .pb-phone__head img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; }
        .pb-phone__head span { color: var(--bx-muted); }
        .pb-phone__media { position: relative; display: grid; place-items: center; aspect-ratio: 4 / 5; background: #f3ead6; color: var(--bx-muted); font-size: 12.5px; }
        .pb-phone { max-width: 320px; margin: 0 auto; }
        .pb-phone--reel, .pb-phone--story { max-width: 250px; }
        .pb-phone--reel .pb-phone__media, .pb-phone--story .pb-phone__media { aspect-ratio: 9 / 16; width: 100%; }
        .pb-phone__media img, .pb-phone__media video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .pb-phone__media em { position: absolute; left: 10px; right: 10px; bottom: 18%; padding: 8px 10px; border-radius: 8px; background: rgba(0,0,0,.45); color: #fff; font-style: normal; font-size: 13px; font-weight: 600; text-align: center; }
        .pb-phone__cap { margin: 0; padding: 9px 11px 12px; font-size: 12.5px; line-height: 1.45; white-space: pre-line; color: #14231a; }
        .pb-strip { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
        .pb-stories { padding: 14px 18px; }
        .pb-stories h3 { margin-bottom: 8px; }
        .pb-story { position: relative; flex: 0 0 auto; width: 64px; height: 112px; border-radius: 12px; overflow: hidden; background: #eadcb8; box-shadow: 0 0 0 2px #fbf1dc, 0 0 0 4px #d6823a; margin: 4px; }
        .pb-story img { width: 100%; height: 100%; object-fit: cover; }
        .pb-story i { position: absolute; top: 6px; right: 7px; color: #fff; font-style: normal; text-shadow: 0 1px 3px #000; }
        .pb-story span { position: absolute; left: 6px; bottom: 6px; font-size: 11px; font-weight: 600; color: #fff; text-shadow: 0 1px 2px #000; }
        @media (max-width: 1000px) { .pb-grid { grid-template-columns: 1fr; } .pb-side { position: static; } }
        @media (max-width: 600px) { .pb-row { grid-template-columns: 1fr; } .pb-card { padding: 16px; } }
      `}</style>
    </BountyShell>
  );
}
