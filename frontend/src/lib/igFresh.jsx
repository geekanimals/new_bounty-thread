"use client";

import { useEffect, useState } from "react";
import { invoke } from "@/lib/supabase";

/*
 * Instagram ki photos (profile pic, posts) ke link kuch din baad expire ho jaate hain (signed CDN link).
 * Purane app jaisa: photo na khule to ig-discover "lookup" se Instagram se taaza link laao
 * (ek handle ki lookup ek hi baar — sab photos usi ko share karti hain).
 */
const LOOK = {};
const norm = (h) => String(h || "").trim().replace(/^@/, "").toLowerCase();
export const igCode = (u) => (/instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i.exec(String(u || "")) || [])[1] || null;

export function igLookup(door, handle) {
  const h = norm(handle);
  if (!/^[a-z0-9._]{2,30}$/.test(h)) return Promise.resolve(null);
  if (!LOOK[h])
    LOOK[h] = invoke(door, "ig-discover", { action: "lookup", username: h, media_limit: 12 })
      .then((r) => (r.data && r.data.ok ? { pic: (r.data.profile && r.data.profile.profile_picture_url) || null, posts: r.data.posts || [] } : null))
      .catch(() => null);
  return LOOK[h];
}

/** taaza link: kind "pic" = profile photo, "post" = us post ki photo (permalink se milao) */
function freshFrom(x, kind, permalink) {
  if (!x) return null;
  if (kind === "pic") return x.pic;
  const c = igCode(permalink);
  const p = c && x.posts.find((m) => igCode(m.permalink) === c);
  return p ? (p.media_type === "VIDEO" ? p.thumbnail_url || p.media_url : p.media_url || p.thumbnail_url) || null : null;
}

/**
 * <IgImg door="admin" handle="name" src={url} kind="pic|post" permalink={…} />
 * Photo toot jaaye → Instagram se naya link; wo bhi na mile → `fallback` (ya kuch nahi).
 */
export default function IgImg({ door = "admin", handle, src, kind = "pic", permalink, fallback = null, ...rest }) {
  const [url, setUrl] = useState(src || null);
  const [dead, setDead] = useState(!src);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    setUrl(src || null);
    setDead(!src);
    setTried(false);
  }, [src]);
  // link hi nahi hai par handle hai → seedha Instagram se
  useEffect(() => {
    if (src || tried || !handle) return;
    setTried(true);
    let on = true;
    igLookup(door, handle).then((x) => {
      const u = freshFrom(x, kind, permalink);
      if (on && u) (setUrl(u), setDead(false));
    });
    return () => {
      on = false;
    };
  }, [src, tried, handle, door, kind, permalink]);

  const onError = () => {
    if (tried || !handle) return setDead(true);
    setTried(true);
    igLookup(door, handle).then((x) => {
      const u = freshFrom(x, kind, permalink);
      if (u && u !== url) setUrl(u);
      else setDead(true);
    });
  };
  if (dead || !url) return fallback;
  return <img src={url} alt="" referrerPolicy="no-referrer" loading="lazy" onError={onError} {...rest} />;
}
