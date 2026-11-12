"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BountyShell from "@/components/creater/BountyShell";
import TrackerFrame, { useTracker } from "@/components/creater/TrackerSteps";
import { Pin } from "@/components/ui/Icons";

// Dummy saved addresses (profile se aayenge)
const ADDRESSES = [
  { id: "home", label: "Home", text: "B-204, Green Park Society, Malviya Nagar, Jaipur, Rajasthan 302017" },
  { id: "studio", label: "Studio", text: "12, Raja Park Main Road, near Apollo, Jaipur, Rajasthan 302004" },
];

/** /creater/my-campaigns/[id]/address — kit kahan bhejna hai */
export default function AddressStep() {
  const router = useRouter();
  const { c, base } = useTracker();
  const [addr, setAddr] = useState("home");

  return (
    <BountyShell>
      <title>{`Delivery address — ${c.title} — Bounty`}</title>
      <TrackerFrame step="address">
        <span className="ts-ic">📍</span>
        <h2>Where should {c.brand} send your kit?</h2>
        <div className="ad-list">
          {ADDRESSES.map((a) => (
            <label key={a.id} className={addr === a.id ? "is-on" : ""}>
              <input type="radio" name="addr" checked={addr === a.id} onChange={() => setAddr(a.id)} />
              <span>
                <strong>
                  <Pin size={12} /> {a.label}
                </strong>
                <small>{a.text}</small>
              </span>
            </label>
          ))}
        </div>
        <Link href="/creater/profile/address" className="ts-link">
          + Add a new address
        </Link>
        <div>
          <button type="button" className="bx-btn bx-btn--dark ts-mt" onClick={() => router.push(`${base}/package`)}>
            Confirm delivery address →
          </button>
        </div>
      </TrackerFrame>
      <style>{`
        .ad-list { display: grid; gap: 10px; margin-top: 12px; }
        .ad-list label { display: flex; gap: 10px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--bx-line); background: #fffaf0; cursor: pointer; }
        .ad-list label.is-on { border-color: var(--bx-teal); box-shadow: 0 0 0 3px rgba(46,156,148,.15); }
        .ad-list input { accent-color: var(--bx-teal); margin-top: 3px; }
        .ad-list strong { display: flex; align-items: center; gap: 5px; font-size: 13.5px; }
        .ad-list small { display: block; font-size: 12.5px; color: var(--bx-text); }
      `}</style>
    </BountyShell>
  );
}
