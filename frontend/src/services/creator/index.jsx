/**
 * services/creator — Creator panel (Bounty) ka poora Supabase layer. Pages / components sirf yahin se import karein:
 *     import { useCreator, useMyCampaigns, signContract, fdate } from "@/services/creator";
 * Koi page seedha sbFor / rpc / invoke nahi bulata. lib/supabase.jsx neeche ki plumbing hai (door, client, rpc, invoke, useRpc, errText).
 *
 * Har call purane creator app (bounty-threads-app) ke usi function ka naya roop hai — wahi RPC / edge function, wahi args.
 * Har function ke upar Hinglish comment mein purane function ka naam likha hai.
 *
 * Files:
 *   core.jsx          door "creator", sb(), call() (public.*), api() (api.*), fn() (edge function), apiCreator(), K (localStorage keys), ls
 *   auth.jsx          creator store (useCreator / getCreator), loadCreator, WhatsApp OTP login, invites, flow flags, gates, signOut, track
 *   profile.jsx       profile save (saveSection, address, dream brands, skills, rates, availability), contact OTP,
 *                     account (export / delete), cookie consent, useSession (purana session shape)
 *   campaigns.jsx     covers, open campaigns, my campaigns, join gate, apply, har step ka action, video link check
 *   notifications.jsx alerts (🔔 + Inbox), mark read, notify prefs (WhatsApp / email updates)
 *   instagram.jsx     Instagram connect + wapsi, accounts (switch / disconnect), media kit row, sync, edits, DMs
 *   messages.jsx      WhatsApp chats (contact, conversations, messages, realtime, send)
 *   payments.jsx      payment flows, payment details save, payment proof links
 *   mediaKit.jsx      media kit edits, pinned posts, campaign work
 *   helpers.jsx       pure helpers — stages, numbers / dates, campaign labels & cards, cover photo, alerts, terms, profile %
 *
 * Return ka rule:
 *   - reads / actions          → { data, error } (lib/supabase jaisa, throw nahi)
 *   - hooks                    → { data | list | acct, loading, error, reload }
 *   - profile / login writes   → Error throw (page try/catch karke message dikhata hai) aur creator store reload
 *
 * Static UI content (categories, sidekicks, brands ki list, copy) components/creater/data.jsx mein hai — Supabase se nahi.
 */
export * from "./core";
export * from "./auth";
export * from "./profile";
export * from "./campaigns";
export * from "./notifications";
export * from "./instagram";
export * from "./messages";
export * from "./payments";
export * from "./mediaKit";
export * from "./helpers";
