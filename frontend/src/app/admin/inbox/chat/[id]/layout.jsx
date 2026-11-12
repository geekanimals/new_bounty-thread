// Har chat ka page pehle se bane (Next cacheComponents).
// Ids yahan likhe hain kyunki Inbox.jsx "use client" file hai — server layout uska data nahi padh sakta.
// Inbox.jsx ke CHATS mein naya chat jode to uska id yahan bhi jodna.
const CHAT_IDS = ["knightcrawler", "swathi", "9873601", "smarty", "ansh-notnani", "archi-ranka"];

export function generateStaticParams() {
  return CHAT_IDS.map((id) => ({ id }));
}

export default function ChatLayout({ children }) {
  return children;
}
