// Har insaan ka id (member_id) database se aata hai — sirf ek sample pehle se banta hai, baaki khulne par.
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function ActivityPersonLayout({ children }) {
  return children;
}
