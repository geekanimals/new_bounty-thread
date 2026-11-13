"use client";

/**
 * Brand ke alerts (🔔 aur /brands/notifications) — purana app.js pollAlerts (har 20 sec) + mark read.
 * Ek hi chhota store: bell aur notifications page dono same list dekhte hain, ek jagah read karo to dono jagah update.
 */
import { useEffect, useState } from "react";
import { api } from "./core";

let st = { list: [], loading: true, error: null, loaded: false };
const subs = new Set();
const emit = () => subs.forEach((f) => f(st));
let _timer = null;

/** get_my_notifications laao (purana pollAlerts → api.get_my_notifications { p_only_unread:false }) */
export async function loadNotifications() {
  const r = await api("get_my_notifications", { p_only_unread: false });
  st = { list: r.error ? st.list : r.data || [], loading: false, error: r.error ? r.error.message || String(r.error) : null, loaded: true };
  emit();
  return r;
}

/** React: { list, unread, loading, error, reload } — pehli baar load + har 20 sec (tab dikh raha ho tab) */
export function useNotifications() {
  const [s, setS] = useState(st);
  useEffect(() => {
    subs.add(setS);
    setS(st);
    if (!st.loaded) loadNotifications();
    if (!_timer)
      _timer = setInterval(() => {
        if (document.visibilityState === "visible") loadNotifications();
      }, 20000);
    return () => {
      subs.delete(setS);
      if (!subs.size && _timer) {
        clearInterval(_timer);
        _timer = null;
      }
    };
  }, []);
  return { ...s, unread: s.list.filter((x) => !x.read).length, reload: loadNotifications };
}

/** Ek alert read (purana mark_notification_read { p_id }) */
export async function markRead(id) {
  st = { ...st, list: st.list.map((x) => (x.notification_id === id ? { ...x, read: true } : x)) };
  emit();
  return api("mark_notification_read", { p_id: id });
}
/** Alert par kaam ho gaya (purana mark_notification_acted { p_id }) */
export const markActed = (id) => api("mark_notification_acted", { p_id: id });
/** Sab read (purana mark_all_notifications_read) */
export async function markAllRead() {
  st = { ...st, list: st.list.map((x) => ({ ...x, read: true })) };
  emit();
  const r = await api("mark_all_notifications_read");
  if (r.error) loadNotifications();
  return r;
}
/** Logout par list saaf */
export function clearNotifications() {
  st = { list: [], loading: true, error: null, loaded: false };
  emit();
}
