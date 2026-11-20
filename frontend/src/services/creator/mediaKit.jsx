"use client";

/**
 * Creator media kit — Instagram row (social_accounts) ke edits, pinned posts aur campaign work.
 * Purane media-kit (mkEdits / mkSave / mkPin / mkCampaignWork) jaisa. Row aur sync: services/creator/instagram
 * (useMyIg, syncIgMedia, saveIgEdits).
 */
import { api, sb, fn } from "./core";
import { saveIgEdits } from "./instagram";

/** Media kit mein max pinned posts (purana "Pin your best work · up to 6") */
export const MAX_PINS = 6;

/** social_accounts.edits saaf copy — hand-written bio sirf usi account ka jiske liye likha tha (purana mkEdits) */
export function editsOf(a) {
  const E = a?.edits && typeof a.edits === "object" && !Array.isArray(a.edits) ? { ...a.edits } : {};
  const me = String(a?.ig_user_id || a?.username || "");
  if (E.bio && (!E.for || String(E.for) !== me)) delete E.bio;
  return E;
}

/** Pinned post ids (string) */
export const pinnedOf = (a) => (Array.isArray(a?.edits?.pinned) ? a.edits.pinned.map(String) : []);

/**
 * Post pin / unpin (edits.pinned). → { error, removed } | { full: true } (6 pehle se pinned)
 */
export async function togglePin(a, mediaId) {
  const id = String(mediaId);
  const pinned = pinnedOf(a);
  const on = pinned.includes(id);
  if (!on && pinned.length >= MAX_PINS) return { full: true, error: null };
  const E = a.edits && typeof a.edits === "object" && !Array.isArray(a.edits) ? { ...a.edits } : {};
  E.pinned = on ? pinned.filter((x) => x !== id) : [...pinned, id];
  const { error } = await saveIgEdits(a.id, E);
  return { error, removed: on };
}

/**
 * Brands wala naam / bio / sections save (purana mkSave). Instagram jaisa hi ho to override hata do.
 * → { data, error }
 */
export function saveKitProfile(a, { name, bio, show }) {
  const ne = { ...editsOf(a), show };
  const dn = String(name || "").trim();
  if (dn && dn !== (a.name || a.username)) ne.display_name = dn;
  else delete ne.display_name;
  const b = String(bio || "").trim();
  if (b && b !== String(a.biography || "").trim()) {
    ne.bio = b;
    ne.for = String(a.ig_user_id || a.username || "");
    ne.for_user = String(a.username || "").toLowerCase();
  } else {
    delete ne.bio;
    delete ne.for;
    delete ne.for_user;
  }
  return saveIgEdits(a.id, ne);
}

/** Geek par kiye campaign posts — sirf isi Instagram account ke (purana mkCampaignWork), naya pehle */
export async function getCampaignWork(username) {
  // backend: public_campaign_work — Bounty se post, link submit, bulk sheet… sab campaign posts (thumbnail + stats ke saath)
  try {
    const { data, error } = await sb.rpc("public_campaign_work", { p_username: String(username || "") });
    if (!error && Array.isArray(data)) return data;
  } catch { /* purane tareeke par aao */ }
  const { data } = await api("get_my_campaigns");
  const me = String(username || "").toLowerCase();
  const out = [];
  (Array.isArray(data) ? data : []).forEach((c) =>
    (c.posts || []).forEach((p) => {
      if (!c.applied_profile || !me || String(c.applied_profile).toLowerCase().replace(/^@/, "") === me) out.push({ ...p, campaign: c.campaign, brand: c.brand });
    })
  );
  return out.sort((x, y) => String(y.posted_at).localeCompare(String(x.posted_at)));
}

/* ---------- Publish to Instagram (purana mkComposer: instagram-publish + ig-media + get_my_posting_rules) ---------- */

/** Creator ki chal rahi campaigns ke posting rules — format, caption, @mentions, #hashtags, collaborator, approved video */
export async function getPostingRules() {
  const r = await api("get_my_posting_rules");
  return { data: Array.isArray(r.data) ? r.data : [], error: r.error || null };
}

/** Instagram ko JPEG chahiye — feed ka ratio 4:5 se 1.91:1 ke beech (safed padding), story par text ki patti */
export async function toInstagramJpeg(file, kind, overlay) {
  const bmp = await createImageBitmap(file);
  const maxEdge = kind === "story" ? 1920 : 1440;
  let w = bmp.width,
    h = bmp.height;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  w = Math.round(w * scale);
  h = Math.round(h * scale);
  let cw = w,
    ch = h;
  if (kind === "feed") {
    const r = w / h;
    if (r < 0.8) cw = Math.ceil(h * 0.8);
    else if (r > 1.91) ch = Math.ceil(w / 1.91);
  }
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, cw, ch);
  g.drawImage(bmp, Math.round((cw - w) / 2), Math.round((ch - h) / 2), w, h);
  if (bmp.close) bmp.close();
  const lines0 = overlay ? [overlay.text, overlay.mentions].map((x) => String(x || "").trim()).filter(Boolean) : [];
  if (lines0.length) {
    const fs = Math.max(24, Math.round(cw * 0.045)),
      pad = Math.round(fs * 0.6),
      maxW = cw - pad * 4;
    g.font = `600 ${fs}px -apple-system, "Segoe UI", Roboto, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const lines = [];
    for (const para of lines0) {
      let cur = "";
      for (const word of para.split(/\s+/)) {
        const t = cur ? cur + " " + word : word;
        if (g.measureText(t).width > maxW && cur) {
          lines.push(cur);
          cur = word;
        } else cur = t;
      }
      if (cur) lines.push(cur);
    }
    const lh = Math.round(fs * 1.3),
      boxH = lines.length * lh + pad * 2,
      y0 = Math.round(ch * 0.78 - boxH / 2);
    g.fillStyle = "rgba(0,0,0,0.45)";
    g.fillRect(pad, y0, cw - pad * 2, boxH);
    g.fillStyle = "#ffffff";
    lines.forEach((ln, i) => g.fillText(ln, cw / 2, y0 + pad + lh * i + lh / 2));
  }
  let q = 0.9,
    blob;
  do {
    blob = await new Promise((res) => c.toBlob(res, "image/jpeg", q));
    q -= 0.1;
  } while (blob && blob.size > 8 * 1024 * 1024 && q > 0.4);
  if (!blob) throw new Error("Couldn't prepare this image — try a JPG.");
  return new File([blob], (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

/** File → ig-media/<user>/… (instagram-publish sirf creator ke apne folder ki files leta hai) */
export async function uploadIgMedia(file, kind, overlay) {
  const { data: u } = await sb().auth.getUser();
  const uid = u && u.user && u.user.id;
  if (!uid) throw new Error("You're signed out. Sign in again to publish.");
  const isVid = /^video\//.test(file.type || "");
  const m = isVid ? file : await toInstagramJpeg(file, kind, overlay);
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${(m.name || (isVid ? "clip.mp4" : "photo.jpg")).replace(/[^a-zA-Z0-9._-]/g, "")}`;
  const bucket = sb().storage.from("ig-media");
  const up = await bucket.upload(path, m, { upsert: false, contentType: m.type || (isVid ? "video/mp4" : "image/jpeg") });
  if (up.error) throw up.error;
  return { type: isVid ? "video" : "image", url: bucket.getPublicUrl(path).data.publicUrl };
}

/** Instagram par post / reel / story — edge function instagram-publish */
export async function publishToInstagram(body) {
  const r = await fn("instagram-publish", body);
  if (r.error) return { data: null, error: r.error };
  if (r.data && r.data.error) return { data: null, error: new Error(r.data.error) };
  return { data: r.data, error: null };
}

/** Campaign post ko campaign par record karo (brief check + brand report) */
export const recordCampaignPost = (participationId, payload) => api("record_campaign_post", { p_participation: participationId, p_payload: payload });

/** @user list saaf karo */
export const igUsers = (s) =>
  String(s || "")
    .split(/[\s,]+/)
    .map((x) => x.replace(/^@/, "").trim())
    .filter((x) => /^[A-Za-z0-9._]{1,30}$/.test(x))
    .filter((x, i, a) => a.indexOf(x) === i);

/** Campaign se caption / tags / mentions (purana campPieces) */
export function campaignPieces(r) {
  const tags = [],
    ments = [];
  const addM = (m) => {
    m = String(m || "").replace(/^@/, "").trim();
    if (/^[A-Za-z0-9._]{1,30}$/.test(m) && !ments.some((x) => x.toLowerCase() === m.toLowerCase())) ments.push(m);
  };
  const addT = (t) => {
    t = String(t || "").trim();
    if (!t) return;
    if (t[0] === "@") return addM(t);
    if (t[0] !== "#") t = "#" + t;
    if (/^#[\p{L}\p{N}_]+$/u.test(t) && t.toLowerCase() !== "#ad" && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) tags.push(t);
  };
  String(r.brief_mentions || "")
    .split(/[\s,]+/)
    .forEach(addM);
  (r.mentions || []).forEach(addM);
  String(r.brief_hashtags || "")
    .split(/[\s,]+/)
    .forEach(addT);
  (r.hashtags || []).forEach(addT);
  const brandAt = ments[0] ? "@" + ments[0] : r.brand || "the brand";
  const line = String(r.caption || "").trim() || (r.product ? `Loving my ${r.product} from ${brandAt} ✨` : `Something new from ${brandAt} ✨`);
  return { tags, ments, line };
}
