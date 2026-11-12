// Brand logo placeholders — asli logos aane par yahan images laga dena.
const BRANDS = ["Brand 1", "Brand 2", "Brand 3", "Brand 4", "Brand 5", "Brand 6", "Brand 7", "Brand 8"];

export default function TrustedBrands() {
  return (
    <section className="tb">
      <div className="tb-wrap">
        <p className="tb-title">Trusted by brands across India</p>
        <ul className="tb-list">
          {BRANDS.map((b) => (
            <li key={b} className="tb-item">
              {b}
            </li>
          ))}
        </ul>
        <p className="tb-note">Logos shown with each brand&apos;s permission</p>
      </div>

      <style>{`
        .tb {
          background: #fcfdef;
          border-bottom: 1px solid #e6e8d4;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .tb-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 34px 32px 38px;
          text-align: center;
        }
        .tb-title {
          margin: 0 0 18px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #5d5f4d;
        }
        .tb-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 14px;
        }
        .tb-item {
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #f1f2e2;
          font-family: var(--font-serif), Georgia, serif;
          font-style: italic;
          font-size: 19px;
          color: #a5a88c;
        }
        .tb-note {
          margin: 16px 0 0;
          font-size: 11px;
          color: #9a9c88;
        }

        @media (max-width: 1024px) {
          .tb-list { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 640px) {
          .tb-wrap { padding: 28px 20px 30px; }
          .tb-list { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .tb-item { height: 42px; font-size: 17px; }
        }
      `}</style>
    </section>
  );
}
