// Chat ids = wa_conversations ke UUID (database se) — sirf ek sample pehle se banta hai, baaki khulne par
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function ChatLayout({ children }) {
  return children;
}
