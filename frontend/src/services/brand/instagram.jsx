"use client";

/**
 * Instagram — purane brand portal mein alag Instagram page nahi tha; brand ka Instagram uske linked Facebook business
 * ke Pages ke saath aata tha (brand-portal.js fbCard: brand_portal.facebook.pages[].instagram {username, followers, posts, picture}).
 * Yahan wahi dikhate hain; "Refresh" = purana data-bpxfbrefresh (brand-fb-login refresh).
 */
import { useBrand, canAct } from "./auth";
import { fbRefresh, fbLinkStart } from "./facebook";

/** React: brand ke Instagram accounts (brand_portal.facebook se) → { linked, accounts, refreshedAt, loading, error } */
export function useBrandInstagram() {
  const b = useBrand();
  const fb = (b.portal && b.portal.facebook) || null;
  const accounts = ((fb && fb.pages) || [])
    .filter((p) => p && p.instagram)
    .map((p) => ({ ...p.instagram, page: p.name, page_reach_28d: p.reach_28d, page_engaged_28d: p.engaged_28d, page_followers: p.followers }));
  return {
    loading: !b.ready || (b.loggedIn && !b.portal && !b.portalError),
    error: b.portalError,
    linked: !!fb,
    accounts,
    refreshedAt: fb ? fb.refreshed_at : null,
    can: canAct(b),
  };
}

/** Instagram numbers dobara laao (purana data-bpxfbrefresh) */
export const igRefresh = () => fbRefresh();
/** Facebook business link karo — Instagram usi se aata hai (purana fbStart("link")) */
export const igConnect = () => fbLinkStart();
