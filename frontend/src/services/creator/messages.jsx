"use client";

/**
 * Creator ke WhatsApp chats (campaign updates + Geek team) — purane whatsapp.js jaisa:
 * wa_contacts (number + pause) · wa_conversations · wa_messages · wa-send + realtime channel.
 * Instagram DMs: services/creator/instagram (igConversations / igThread / igSend).
 * Pause / resume: notifications.setWaOptOut.
 */
import { sb, fn } from "./core";

/** Mera WhatsApp contact row (wa_contacts) → { data: { phone_e164, verified_at, opt_out_at } | null, error } */
export const getWaContact = (userId) => sb().from("wa_contacts").select("phone_e164,verified_at,opt_out_at").eq("user_id", userId).maybeSingle();

/** Chats list (naya pehle, 200 tak) → { data, error } */
export const getWaConversations = () =>
  sb().from("wa_conversations").select("id,subject,contact_phone_e164,last_message_at").order("last_message_at", { ascending: false, nullsFirst: false }).limit(200);

/** Ek chat ke messages (purane pehle, 500 tak) → { data, error } */
export const getWaMessages = (conversationId) =>
  sb().from("wa_messages").select("id,direction,body,status,created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(500);

/**
 * Khule chat ke naye / badle messages realtime (Supabase channel). onInsert(row), onUpdate(row).
 * Return: band karne ka function — ya null agar realtime nahi mila (tab page poll kare).
 */
export function subscribeWaMessages(conversationId, { onInsert, onUpdate }) {
  const client = sb();
  if (typeof client.channel !== "function") return null;
  const filter = "conversation_id=eq." + conversationId;
  const ch = client
    .channel("wa:" + conversationId)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "wa_messages", filter }, (pl) => onInsert(pl.new))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "wa_messages", filter }, (pl) => onUpdate(pl.new))
    .subscribe();
  return () => client.removeChannel(ch);
}

/** Message bhejo (wa-send). Naya chat: { to_phone, text } · purana: { conversation_id, text } → { data, error } */
export const sendWa = (body) => fn("wa-send", body);

/** Realtime mil raha hai? (nahi to bhejne ke baad khud reload karo) */
export const hasRealtime = () => typeof sb().channel === "function";
