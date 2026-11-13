/* id database se aata hai (UUID) — sirf ek sample pehle se banta hai, baaki pehli baar khulne par */
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function IdLayout({ children }) {
  return children;
}
