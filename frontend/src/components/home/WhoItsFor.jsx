import Link from "next/link";
import { ArrowRight } from "@/components/ui/Icons";

const AUDIENCES = [
  {
    no: "01",
    title: "For creators",
    text: "Turn your content into the career you dream of.",
    tags: ["AI dream plan", "Daily growth tasks", "Barter & paid deals", "Growth score"],
  },
  {
    no: "02",
    title: "For brands",
    text: "Launch campaigns, approve every creator and video, and watch results live.",
    tags: ["Approvals", "Live analytics", "Links & sales", "Reports"],
  },
  {
    no: "03",
    title: "For agencies",
    text: "Run campaigns end to end — creators, shipping, content, payouts and billing.",
    tags: ["Mass Barter Engine", "Payouts", "Team roles"],
  },
  {
    no: "04",
    title: "For celebrity managers",
    text: "Keep every relationship warm with IRM.",
    tags: ["Relationships", "Mentions", "History"],
  },
];

export default function WhoItsFor() {
  return (
    <section className="who" id="who">
      <div className="who-wrap">
        <div className="who-intro">
          <p className="who-eyebrow">Who it&apos;s for</p>
          <h2 className="who-title">
            One login. <em>A different world</em> for each of you.
          </h2>
          <p className="who-sub">Pick who you are — see exactly what the OS does for you.</p>
        </div>

        <ul className="who-list">
          {AUDIENCES.map((a) => (
            <li key={a.no}>
              <Link href="#early-access" className="who-row">
                <span className="who-no">{a.no}</span>
                <span className="who-body">
                  <span className="who-row__title">{a.title}</span>
                  <span className="who-row__text">{a.text}</span>
                  <span className="who-tags">
                    {a.tags.map((t) => (
                      <span key={t} className="who-tag">
                        {t}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="who-arrow">
                  <ArrowRight size={14} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .who {
          background: #fcfdef;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .who-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 110px 32px 110px;
          display: grid;
          grid-template-columns: 0.75fr 1.25fr;
          gap: 48px;
          align-items: start;
        }
        .who-intro { position: sticky; top: 140px; }
        .who-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .who-eyebrow::before {
          content: "";
          width: 20px;
          height: 1px;
          background: currentColor;
        }
        .who-title {
          margin: 0 0 22px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(36px, 4.3vw, 60px);
          line-height: 1.04;
          letter-spacing: -0.01em;
        }
        .who-title em { font-style: italic; color: #7e8462; }
        .who-sub {
          margin: 0;
          max-width: 320px;
          font-size: 15px;
          line-height: 1.6;
          color: #5d5f4d;
        }

        .who-list { list-style: none; margin: 0; padding: 0; }
        .who-list li { border-bottom: 1px solid #e3e5d0; }
        .who-row {
          display: grid;
          grid-template-columns: 82px 1fr auto;
          gap: 8px;
          padding: 26px 0 30px;
          color: inherit;
          text-decoration: none;
        }
        .who-no {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 40px;
          font-weight: 500;
          line-height: 1;
          color: #7e8462;
          padding-top: 6px;
        }
        .who-body { display: flex; flex-direction: column; }
        .who-row__title {
          font-family: var(--font-serif), Georgia, serif;
          font-size: clamp(26px, 2.6vw, 34px);
          line-height: 1.1;
          margin-bottom: 8px;
          transition: color .2s;
        }
        .who-row__text {
          font-size: 14.5px;
          line-height: 1.55;
          color: #6b6d5c;
          max-width: 470px;
        }
        .who-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }
        .who-tag {
          font-size: 12px;
          font-weight: 500;
          padding: 6px 11px;
          border-radius: 999px;
          background: #eff0de;
          color: #3a3c2c;
        }
        .who-arrow {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #dfe1cc;
          background: #fff;
          display: grid;
          place-items: center;
          transition: background .2s, color .2s, transform .2s;
        }
        .who-row:hover .who-arrow {
          background: #3f4130;
          color: #fff;
          transform: translateX(3px);
        }
        .who-row:hover .who-row__title { color: #6f7556; }

        @media (max-width: 1024px) {
          .who-wrap {
            grid-template-columns: 1fr;
            padding: 80px 32px;
            gap: 32px;
          }
          .who-intro { position: static; }
          .who-sub { max-width: 460px; }
        }
        @media (max-width: 640px) {
          .who-wrap { padding: 64px 20px; }
          .who-row { grid-template-columns: 52px 1fr; padding: 22px 0 24px; }
          .who-no { font-size: 30px; }
          .who-arrow { display: none; }
        }
      `}</style>
    </section>
  );
}
