"use client";

/**
 * Har upload yahin se — image pehle browser mein compress (quality nahi girti), phir Cloudflare R2 (edge function media-upload).
 * R2 abhi set nahi / band ho → purana tareeka (Supabase storage) — kuch nahi tootega.
 *
 *   const r = await uploadMedia("admin", "campaign-files", file, { scope: campaignId, fallback: { bucket: "campaign-files", path } });
 *   r → { url, key, path, where: "r2" | "supabase", size, before }
 */
import { sbFor, SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase";

const MAX_SIDE = 2560; // lambi side — isse badi photo kahin dikhai nahi jaati
const QUALITY = 0.85; // WebP 85% — aankh ko farak nahi dikhta
const SKIP_UNDER = 250 * 1024; // 250 KB se chhoti + choti size wali photo jaisi hai waisi
const COMPRESSIBLE = /^image\/(jpeg|jpg|png|webp|heic|heif|avif|bmp)$/i;

let _webp = null;
const webpOk = () => {
  if (_webp != null) return _webp;
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    _webp = c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    _webp = false;
  }
  return _webp;
};

/** File → compressed File (ya wahi file, agar chhoti karne se fayda nahi / browser padh nahi paaya) */
export async function compressImage(file, { maxSide = MAX_SIDE, quality = QUALITY, jpeg = false } = {}) {
  if (!file || !COMPRESSIBLE.test(file.type || "") || typeof document === "undefined") return file;
  let bmp;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // e.g. HEIC on Chrome — original hi jaayega
  }
  const { width: w0, height: h0 } = bmp;
  // jpeg: keep a small JPG / PNG as it is (WhatsApp takes those); anything else is redrawn as JPG
  const keepAsIs = jpeg ? /^image\/(jpeg|jpg|png)$/i.test(file.type || "") && file.size <= 4.5 * 1024 * 1024 && Math.max(w0, h0) <= maxSide : file.size <= SKIP_UNDER && Math.max(w0, h0) <= maxSide;
  if (keepAsIs) {
    bmp.close && bmp.close();
    return file;
  }
  const k = Math.min(1, maxSide / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * k)),
    h = Math.max(1, Math.round(h0 * k));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close && bmp.close();
  const type = !jpeg && webpOk() ? "image/webp" : "image/jpeg";
  const blob = await new Promise((r) => c.toBlob(r, type, type === "image/jpeg" ? 0.88 : quality));
  if (!blob || (blob.size >= file.size && !(jpeg && !/^image\/(jpeg|jpg|png)$/i.test(file.type || "")))) return file; // bada ho gaya → original
  const name = (file.name || "image").replace(/\.[^.]+$/, "") + (type === "image/webp" ? ".webp" : ".jpg");
  try {
    return new File([blob], name, { type, lastModified: Date.now() });
  } catch {
    blob.name = name;
    return blob;
  }
}

/** R2 par upload (server function) — { key, url } ya error */
async function toR2(door, area, file, scope) {
  const sb = sbFor(door);
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) throw Object.assign(new Error("Please sign in again"), { hard: true });
  const q = new URLSearchParams({ area, name: file.name || "file" });
  if (scope) q.set("scope", String(scope));
  const res = await fetch(`${SUPABASE_URL}/functions/v1/media-upload?${q}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_KEY, "content-type": file.type || "application/octet-stream" },
    body: file,
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || !d.ok) throw Object.assign(new Error(d.error || `Upload failed (${res.status})`), { fallback: !!d.fallback || res.status >= 500 || res.status === 404 });
  return d;
}

/**
 * area: campaign-files | review-proofs | post-media | payment-proofs (private)
 * fallback: { bucket, path } — R2 na chale to Supabase storage mein isi jagah (purana tareeka)
 */
export async function uploadMedia(door, area, file0, { scope, fallback, compress = true, jpeg = false } = {}) {
  const before = file0 ? file0.size : 0;
  const file = compress ? await compressImage(file0, jpeg ? { maxSide: 1600, jpeg: true } : undefined) : file0;
  try {
    const d = await toR2(door, area, file, scope);
    return { url: d.url, key: d.key, path: d.key, where: "r2", size: file.size, before, type: file.type };
  } catch (e) {
    if (!fallback || (!e.fallback && !/not set up/i.test(e.message || ""))) throw e;
    const path = fallback.path.replace(/\.[^.\/]+$/, "") + ((file.name || "").match(/\.[^.]+$/) || [""])[0];
    const { error } = await sbFor(door).storage.from(fallback.bucket).upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) throw new Error(error.message || "Upload failed");
    const pub = fallback.private ? null : sbFor(door).storage.from(fallback.bucket).getPublicUrl(path).data.publicUrl;
    return { url: pub, key: null, path, where: "supabase", size: file.size, before, type: file.type };
  }
}

/** private file (payment proof) → 10 min link. R2 key ("private/…") ya purana Supabase path, dono */
export async function privateLink(door, keyOrPath, supabaseBucket = "payment-proofs", { download = false } = {}) {
  if (!keyOrPath) return null;
  if (String(keyOrPath).startsWith("private/")) {
    const sb = sbFor(door);
    const {
      data: { session },
    } = await sb.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/media-upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token || ""}`, apikey: SUPABASE_KEY, "content-type": "application/json" },
      body: JSON.stringify({ action: "sign", key: keyOrPath, download }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || "Couldn't open the file");
    return d.url;
  }
  const { data, error } = await sbFor(door).storage.from(supabaseBucket).createSignedUrl(keyOrPath, 600, download ? { download: true } : undefined);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
