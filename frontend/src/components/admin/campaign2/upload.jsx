"use client";

import { Panel, Note } from "@/components/admin/campaign2/kit";

/* Bulk upload — sample sheet (prototype). Asli backend aane par file parse hogi. */
export const SAMPLE_ROWS = [
  { status: "4. Approved", tone: "violet", name: "Asha Rao", ig: "@asha.creates", wa: "+91 98765 43210", email: "asha@example.com", city: "Mumbai", addr: "—", fee: "₹15,000 · 50% advance · UPI", ok: true, what: "New — joins on Approved after sign-up", sends: "✉️ sends: Invite (geek_campaign_access) on WhatsApp + email" },
  { status: "7. Address confirmed", tone: "orange", name: "Meera Shah", ig: "@meera.styles", wa: "+91 90000 11111", email: "—", city: "Pune", addr: "Flat 4B, Lake View · Maharashtra 411001", fee: "— set later", ok: true, what: "New — joins on Address confirmed after sign-up", sends: "✉️ sends: Invite on WhatsApp · 📸 fetched from Instagram" },
  { status: "8. Courier sent", tone: "orange", name: "Kabir Sen", ig: "@kabir.cooks", wa: "+91 98300 12345", email: "kabir@example.com", city: "Kolkata", addr: "12 Park St · West Bengal 700016", fee: "— set later", ok: false, what: "⛔ Not uploaded — “Courier sent” needs Courier, Tracking ID" },
  { status: "11. Video submitted", tone: "violet", name: "Tara Bose", ig: "@tara.eats", wa: "—", email: "tara@example.com", city: "Kolkata", addr: "5 Lake Rd · DTDC · D999", fee: "— set later", ok: false, what: "⛔ Not uploaded — needs Video link" },
];

export const STATUSES = ["1. Applied", "2. Screened", "3. Sent to brand", "4. Approved", "5. Contract sent", "6. Contract signed", "7. Address confirmed", "8. Courier sent", "9. Courier delivered", "10. Video brief sent", "11. Video submitted", "12. Client approved", "13. Posted"];

const KEY = (id) => `geek_upload_${id}`;
export function loadUpload(id) {
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY(id)) || "null");
  } catch {
    return null;
  }
}
export function saveUpload(id, data) {
  try {
    window.sessionStorage.setItem(KEY(id), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

const STEPS = ["Upload sheet", "Match columns", "Check & fix", "Done"];

/* Card: "📄 Bulk upload creators" + campaign type badge + 4 step stepper */
export function UploadCard({ step, children }) {
  return (
    <Panel
      className="up-card"
      title="📄 Bulk upload creators"
      sub="Upload, download & Google Sheet — everyone you upload lands on the step you write."
      actions={<span className="ad-badge ad-badge--violet up-type">🎁💰 Barter + Paid campaign</span>}
    >
      <ol className="up-steps">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const st = n < step || step > 4 ? "done" : n === step ? "on" : "";
          return (
            <li key={s} className={`up-step ${st ? `is-${st}` : ""}`}>
              <i>{st === "done" ? "✓" : n}</i>
              {s}
            </li>
          );
        })}
      </ol>
      {children}
      <style>{`
        .up-card .c2-panel__head { margin-bottom: 18px; }
        .up-card .c2-panel__act { padding-top: 9px; }
        .up-type { height: 26px; }
        .up-steps { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 25px; padding: 0; list-style: none; }
        .up-step { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; color: #9299aa; }
        .up-step i { width: 29px; height: 29px; border-radius: 50%; display: grid; place-items: center; font-style: normal; background: var(--ad-soft); color: #778199; }
        .up-step.is-on { color: #5a4bf2; }
        .up-step.is-on i { background: var(--ad-primary); color: #fff; }
        .up-step.is-done i { background: #e2f7ef; color: #0b9b6c; }
      `}</style>
    </Panel>
  );
}

/* WhatsApp/email OFF wali laal patti (har step par) */
export function MsgOff() {
  return (
    <Note tone="red" icon="⏸">
      <b>WhatsApp is OFF in Settings · email is OFF in Settings</b>— uploading still adds the creators and moves them to their step, but no message goes out while it’s OFF (those messages are skipped, not sent later — use Resend after turning it ON).
    </Note>
  );
}
