/*
 * Same screenshot can't go on two creators (or twice on one) in a campaign.
 * Fingerprint = SHA-256 of the file (exact copy) + "sig" = the numbers read off it (catches a re-sent / re-compressed copy).
 * Server: api.proof_shot_check / api.proof_shot_add (table intel.ci_proof_shot).
 */
import { rpc, errText } from "@/lib/supabase";

/** File → hex SHA-256 */
export async function shotSha(file) {
  const buf = await file.arrayBuffer();
  const h = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** numbers read off a screenshot → "interactions=11;profile_visits=0;views=54" — only when 3+ numbers and views/likes/interactions among them */
export function sigOf(metrics) {
  const m = Object.entries(metrics || {}).filter(([k, v]) => k !== "source" && v != null && v !== "" && isFinite(Number(v)));
  if (m.length < 3 || !m.some(([k]) => ["views", "likes", "interactions", "reach"].includes(k))) return null;
  return m
    .map(([k, v]) => `${k}=${Number(v)}`)
    .sort()
    .join(";");
}

/** null = fine · otherwise a readable "already used" message. owner = { participation_id?, invite_id? } */
export async function shotDupMessage(door, campaignId, sha, sig, owner = {}, { allowSameCreator = false } = {}) {
  const { data, error } = await rpc(door, "api.proof_shot_check", { p_campaign: campaignId, p_sha: sha, p_sig: sig || null, p_participation: owner.participation_id || null, p_invite: owner.invite_id || null });
  if (error) {
    // the check itself failing must not block work — but say so in the console for us
    console.warn("proof_shot_check", errText(error));
    return null;
  }
  if (!data || !data.dup) return null;
  if (data.same_creator) return allowSameCreator ? null : "This screenshot is already added for this creator.";
  const how = data.exact ? "This exact screenshot" : "A screenshot with the very same numbers";
  return `${how} is already in this campaign${data.who ? ` — on @${data.who}` : ""}. Use the right creator's own screenshot.`;
}

/** after a save — remember it (best effort) */
export async function rememberShot(door, campaignId, sha, sig, owner = {}, post = null, url = null) {
  const { error } = await rpc(door, "api.proof_shot_add", { p_campaign: campaignId, p_sha: sha, p_sig: sig || null, p_participation: owner.participation_id || null, p_invite: owner.invite_id || null, p_post: post || null, p_url: url || null });
  if (error) console.warn("proof_shot_add", errText(error));
}
