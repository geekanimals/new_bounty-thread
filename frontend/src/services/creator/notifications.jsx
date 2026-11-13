"use client";

/**
 * Creator alerts (🔔 + Inbox) aur notification settings.
 * Purane Bounty inbox / bell (get_my_notifications · mark_notification_read · mark_notification_acted ·
 * mark_all_notifications_read) aur settings (my_notify_prefs · wa_set_opt_out · set_email_updates) — wahi args.
 */
import { useRpc } from "@/lib/supabase";
import { DOOR, call, api } from "./core";

/** Saari alerts (padhi + anpadhi) — { data, loading, error, reload }. refreshMs = chupke se refresh */
export const useNotifications = ({ skip = false, refreshMs = 0 } = {}) => useRpc(DOOR, "api.get_my_notifications", { p_only_unread: false }, { skip, refreshMs });
/** Ek alert padh li (api.mark_notification_read) → { data, error } */
export const markRead = (id) => api("mark_notification_read", { p_id: id });
/** "Action needed" wali alert par kaam ho gaya (api.mark_notification_acted) → { data, error } */
export const markActed = (id) => api("mark_notification_acted", { p_id: id });
/** Sab padh li (api.mark_all_notifications_read) → { data, error } */
export const markAllRead = () => api("mark_all_notifications_read");

/** WhatsApp / email updates ki settings (my_notify_prefs) → { data: { whatsapp_linked, whatsapp_off, email_off }, error } */
export const getNotifyPrefs = () => call("my_notify_prefs");
/** WhatsApp updates band / chalu (wa_set_opt_out) → { data, error } */
export const setWaOptOut = (optOut) => call("wa_set_opt_out", { p_opt_out: optOut });
/** Email updates chalu / band (set_email_updates) → { data, error } */
export const setEmailUpdates = (on) => call("set_email_updates", { p_on: on });
