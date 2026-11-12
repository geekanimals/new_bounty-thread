"use client";

import { useEffect, useState } from "react";

/**
 * Ek hi sidekick bolega — page apni baat (RumiTip) yahan bhejta hai,
 * aur jo sidekick screen par already hai (footer / sidebar / left panel) wahi bolta hai.
 */
let current = null;

export function pushTip(tip) {
  current = tip;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("bounty-tip", { detail: tip }));
}

/** Host (footer / sidebar / left panel) is hook se page ki baat padhta hai */
export function useRumiTip() {
  const [tip, setTip] = useState(null);
  useEffect(() => {
    setTip(current);
    const on = (e) => setTip(e.detail);
    window.addEventListener("bounty-tip", on);
    return () => window.removeEventListener("bounty-tip", on);
  }, []);
  return tip;
}
