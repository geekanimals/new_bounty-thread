"use client";

/**
 * Creators (brand ki nazar se) — purana openCard / paintSaved:
 *  - profile card: api.brand_creator_card { p_participation, p_invite }
 *  - ⭐ save / remove: api.brand_favorite_set { p_participation, p_invite, p_on }
 *  - saved list: api.brand_favorites { p_brand:null }
 *
 * Naye app mein creator page ka URL /brands/creators/<id> hai:
 *   id = "p-<participation_id>" (app wala creator) ya "i-<invite_id>" (campaign sheet wala creator).
 */
import { useCallback, useEffect, useState } from "react";
import { api } from "./core";

/** Creator page ka link (participation ya invite se) */
export const creatorHref = (pid, inv) => (pid ? `/brands/creators/p-${pid}` : inv ? `/brands/creators/i-${inv}` : null);
/** URL id → { pid, inv } */
export const parseCreatorId = (id) => {
  const s = decodeURIComponent(String(id || ""));
  if (s.startsWith("p-")) return { pid: s.slice(2), inv: null };
  if (s.startsWith("i-")) return { pid: null, inv: s.slice(2) };
  return { pid: s || null, inv: null };
};

/** Creator profile card (purana openCard → api.brand_creator_card) → { data, error } */
export const getCreatorCard = (pid, inv) => api("brand_creator_card", { p_participation: pid || null, p_invite: inv || null });

/** React: creator card → { data, loading, error, reload, setSaved } */
export function useCreatorCard(pid, inv) {
  const [st, setSt] = useState({ data: null, loading: true, error: null });
  const load = useCallback(async () => {
    if (!pid && !inv) return setSt({ data: null, loading: false, error: "Creator not found." });
    setSt((s) => ({ ...s, loading: true }));
    const r = await getCreatorCard(pid, inv);
    setSt({ data: r.data, loading: false, error: r.error ? r.error.message || String(r.error) : null });
  }, [pid, inv]);
  useEffect(() => {
    load();
  }, [load]);
  return { ...st, reload: load, setSaved: (v) => setSt((s) => ({ ...s, data: s.data ? { ...s.data, saved: v } : s.data })) };
}

/** ⭐ Save / hatao (purana brand_favorite_set) → { data:{ saved }, error } */
export const setFavorite = (pid, inv, on) => api("brand_favorite_set", { p_participation: pid || null, p_invite: inv || null, p_on: !!on });

/** Saved creators (purana paintSaved → api.brand_favorites) */
export const getFavorites = () => api("brand_favorites", { p_brand: null });
/** React: saved creators → { list, loading, error, reload } */
export function useFavorites() {
  const [st, setSt] = useState({ list: [], loading: true, error: null });
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setSt((s) => ({ ...s, loading: true }));
    const r = await getFavorites();
    setSt((s) => ({ list: r.error ? s.list : r.data || [], loading: false, error: r.error ? r.error.message || String(r.error) : null }));
    return r;
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { ...st, reload: () => load(true) };
}
