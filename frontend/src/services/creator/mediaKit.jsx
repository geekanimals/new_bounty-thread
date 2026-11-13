"use client";

/**
 * Creator media kit — Instagram row (social_accounts) ke edits, pinned posts aur campaign work.
 * Purane media-kit (mkEdits / mkSave / mkPin / mkCampaignWork) jaisa. Row aur sync: services/creator/instagram
 * (useMyIg, syncIgMedia, saveIgEdits).
 */
import { api } from "./core";
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
