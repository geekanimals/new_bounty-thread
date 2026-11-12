const STEPS = [
  {
    no: "01",
    title: "Brief the campaign",
    text: "Brands share goals, budget and dates. Geek plans the creators.",
    rows: [
      { name: "Wedding Season Looks", value: "₹6L" },
      { name: "~30 creators", value: "Sales" },
    ],
  },
  {
    no: "02",
    title: "Approve & create",
    text: "Brands approve creators and every video before it posts.",
    rows: [
      { name: "Meera Iyer", value: "Approved" },
      { name: "Tanvi Shah", value: "Video in review" },
    ],
  },
  {
    no: "03",
    title: "Go live & get paid",
    text: "Posts go live, results update live, creators get paid on time.",
    rows: [
      { name: "1.62M views", value: "+18%" },
      { name: "Payouts", value: "Sent" },
    ],
  },
];

export default function HowItWorks() {
  return (
    <section className="how" id="how">
      <div className="how-wrap">
        <div className="how-head">
          <div>
            <p className="how-eyebrow">How it works</p>
            <h2 className="how-title">
              From brief to <em>results</em>, in three steps.
            </h2>
          </div>
          <p className="how-note">Every step is tracked live — nothing lives in spreadsheets or WhatsApp groups.</p>
        </div>

        <div className="how-grid">
          {STEPS.map((s) => (
            <article key={s.no} className="how-card">
              <div className="how-card__top">
                <span className="how-step">Step {s.no}</span>
                <span className="how-num">{s.no}</span>
              </div>
              <h3 className="how-card__title">{s.title}</h3>
              <p className="how-card__text">{s.text}</p>

              <div className="how-mock">
                {s.rows.map((r) => (
                  <div key={r.name} className="how-mock__row">
                    <span className="how-mock__name">
                      <span className="how-dot" />
                      {r.name}
                    </span>
                    <span className="how-mock__val">{r.value}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .how {
          background: #f4f5e6;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .how-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 104px 32px 112px;
        }
        .how-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 32px;
          margin-bottom: 44px;
        }
        .how-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 18px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .how-eyebrow::before {
          content: "";
          width: 20px;
          height: 1px;
          background: currentColor;
        }
        .how-title {
          margin: 0;
          max-width: 640px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(36px, 4.3vw, 60px);
          line-height: 1.05;
          letter-spacing: -0.01em;
        }
        .how-title em { font-style: italic; color: #7e8462; }
        .how-note {
          margin: 0 0 8px;
          max-width: 290px;
          font-size: 14px;
          line-height: 1.55;
          color: #6b6d5c;
        }

        .how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        .how-card {
          background: #fff;
          border: 1px solid #e6e8d4;
          border-radius: 20px;
          padding: 28px 24px 24px;
          display: flex;
          flex-direction: column;
          transition: transform .25s, box-shadow .25s;
        }
        .how-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 48px -28px rgba(48, 50, 30, 0.35);
        }
        .how-card__top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .how-step {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .how-num {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 34px;
          line-height: 0.8;
          color: #e3e6cc;
        }
        .how-card__title {
          margin: 20px 0 14px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: 31px;
          line-height: 1.1;
        }
        .how-card__text {
          margin: 0 0 22px;
          font-size: 14px;
          line-height: 1.55;
          color: #6b6d5c;
          max-width: 300px;
        }
        .how-mock {
          margin-top: auto;
          background: #f4f5e6;
          border-radius: 14px;
          padding: 12px 12px 40px;
          display: grid;
          gap: 8px;
        }
        .how-mock__row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          background: #fff;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 12px;
        }
        .how-mock__name {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #23251a;
          font-weight: 500;
        }
        .how-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(140deg, #c9cca4, #7a7e5a);
          flex-shrink: 0;
        }
        .how-mock__val {
          font-size: 11px;
          font-weight: 600;
          color: #6f7556;
          white-space: nowrap;
        }

        @media (max-width: 1024px) {
          .how-wrap { padding: 80px 32px 88px; }
          .how-head { flex-direction: column; align-items: flex-start; }
          .how-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 680px) {
          .how-wrap { padding: 64px 20px 72px; }
          .how-grid { grid-template-columns: 1fr; }
          .how-card__title { font-size: 28px; }
        }
      `}</style>
    </section>
  );
}
