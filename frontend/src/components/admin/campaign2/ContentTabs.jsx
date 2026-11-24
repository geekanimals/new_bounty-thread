"use client";

import { SubTabs } from "@/components/admin/campaign2/kit";
import { useRpc } from "@/lib/supabase";

/*
 * Content ke sub tabs — campaign ke brief ke hisaab se hi:
 * 🎬 Content submissions (hamesha) · 📸 Story screenshots (brief mein Story ho tab) · ⭐ Review screenshots (Google / District review ho tab)
 * Data: api.campaign_proof_board(p_campaign).needs
 */
export function useProofNeeds(id) {
  const { data, loading, error, reload } = useRpc("admin", "api.campaign_proof_board", { p_campaign: id }, { skip: !id || id === "sample" });
  const needs = (data && data.needs) || {};
  return { board: data, needs, loading, error, reload, story: Number(needs.story) || 0, reviews: (Number(needs.google_review) || 0) + (Number(needs.district_review) || 0) };
}

export default function ContentTabs({ id, active }) {
  const { story, reviews, board } = useProofNeeds(id);
  const items = [{ k: "content", label: "🎬 Content submissions", href: `/vault/campaigns/${id}/content` }];
  // brief load hone tak jo tab khula hai wo dikhta rahe
  if (story > 0 || active === "stories") items.push({ k: "stories", label: `📸 Story screenshots${board && story ? ` · ${story} each` : ""}`, href: `/vault/campaigns/${id}/stories` });
  if (reviews > 0 || active === "reviews") items.push({ k: "reviews", label: "⭐ Review screenshots", href: `/vault/campaigns/${id}/reviews` });
  return <SubTabs active={active} items={items} />;
}
