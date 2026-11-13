// Ye link har kisi ke liye alag hai (database se aata hai), isliye sirf ek sample pehle se banta hai —
// baaki pehli baar khulne par bante hain.
export function generateStaticParams() {
  return [{ username: "sample" }];
}

export default function Layout({ children }) {
  return children;
}
