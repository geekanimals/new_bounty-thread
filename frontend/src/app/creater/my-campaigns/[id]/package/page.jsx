"use client";

import { useRouter } from "next/navigation";
import BountyShell from "@/components/creater/BountyShell";
import TrackerFrame, { useTracker } from "@/components/creater/TrackerSteps";
import { Truck, Check } from "@/components/ui/Icons";

const SHIPMENT = [
  { label: "Packed by the brand", time: "8 Nov, 6:10 pm" },
  { label: "Shipped · Delhivery #DL8824113", time: "9 Nov, 11:42 am" },
  { label: "Out for delivery", time: "Today, 9:05 am" },
  { label: "Delivered", time: "Expected today" },
];

/** /creater/my-campaigns/[id]/package — package track karo, mil jaye to "Mark received" */
export default function PackageStep() {
  const router = useRouter();
  const { c, base } = useTracker();

  return (
    <BountyShell>
      <title>{`Track package — ${c.title} — Bounty`}</title>
      <TrackerFrame step="package">
        <span className="ts-ic">
          <Truck size={18} />
        </span>
        <h2>Your package is on the way</h2>
        <ul className="pk-ship">
          {SHIPMENT.map((x, i) => (
            <li key={x.label} className={i < 3 ? "is-on" : ""}>
              <i />
              <span>
                <strong>{x.label}</strong>
                <small>{x.time}</small>
              </span>
            </li>
          ))}
        </ul>
        <p className="pk-small">Got it? Mark it received — your {c.deadline.replace(" after delivery", "")} posting window starts now.</p>
        <button type="button" className="bx-btn bx-btn--dark" onClick={() => router.push(`${base}/draft`)}>
          <Check size={14} /> Mark received
        </button>
      </TrackerFrame>
      <style>{`
        .pk-ship { list-style: none; margin: 12px 0 14px; padding: 0; }
        .pk-ship li { position: relative; display: flex; gap: 12px; padding-bottom: 14px; }
        .pk-ship li::before { content: ""; position: absolute; left: 6px; top: 16px; bottom: 0; width: 2px; background: #e2d3b0; }
        .pk-ship li:last-child::before { display: none; }
        .pk-ship i { position: relative; z-index: 1; width: 14px; height: 14px; margin-top: 2px; border-radius: 50%; border: 2px solid #d3c19a; background: #fffaf0; flex-shrink: 0; }
        .pk-ship li.is-on i { border-color: var(--bx-teal); background: var(--bx-teal); }
        .pk-ship strong { display: block; font-size: 13.5px; }
        .pk-ship small { font-size: 12px; color: var(--bx-muted); }
        .pk-small { margin: 0 0 12px; font-size: 12.5px; color: var(--bx-text); }
      `}</style>
    </BountyShell>
  );
}
