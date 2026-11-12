"use client";

import { useEffect, useState } from "react";

/**
 * Dummy login session — browser ke localStorage mein (backend aane par API se aayega).
 * { phone, sidekick, ig (Instagram connected?), setupDone, cookie, name, handle, city, followers }
 */
const KEY = "bounty_creator";
export const DEFAULT_SESSION = {
  phone: "",
  sidekick: "rumi",
  ig: true,
  setupDone: false,
  cookie: null,
  categories: ["lifestyle"],
  formats: [],
  languages: ["Hindi", "Hinglish"],
  dreamBrands: [],
  collab: ["barter", "paid"],
  rates: { reel: "1500", story: "", post: "", product: "" },
  available: "available",
};

export function readSession() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SESSION, ...JSON.parse(raw) } : { ...DEFAULT_SESSION };
  } catch {
    return { ...DEFAULT_SESSION };
  }
}

export function writeSession(patch) {
  const next = { ...readSession(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — chalega */
  }
  window.dispatchEvent(new Event("bounty-session"));
  return next;
}

export function clearSession() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("bounty-session"));
}

/** React hook: [session, update] — har component mein same session */
export function useSession() {
  const [s, setS] = useState(DEFAULT_SESSION);
  useEffect(() => {
    const sync = () => setS(readSession());
    sync();
    window.addEventListener("bounty-session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("bounty-session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [s, (patch) => setS(writeSession(patch))];
}
