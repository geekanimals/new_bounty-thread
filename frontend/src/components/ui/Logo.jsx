import Link from "next/link";

// Geek Influencer OS logo — header aur footer dono mein use hota hai.
export default function Logo() {
  return (
    <Link href="/" className="gk-logo" aria-label="Geek Influencer OS home">
      <span className="gk-logo__mark">g</span>
      <span className="gk-logo__text">
        <span className="gk-logo__name">Geek</span>
        <span className="gk-logo__sub">Influencer OS</span>
      </span>

      <style>{`
        .gk-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #23251a;
        }
        .gk-logo__mark {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #3f4130;
          color: #f4f5e6;
          display: grid;
          place-items: center;
          font-family: var(--font-serif), Georgia, serif;
          font-style: italic;
          font-size: 22px;
          line-height: 1;
          padding-bottom: 4px;
        }
        .gk-logo__text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
        .gk-logo__name {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 22px;
          font-weight: 500;
        }
        .gk-logo__sub {
          margin-top: 3px;
          font-size: 8.5px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6b6d5c;
        }
      `}</style>
    </Link>
  );
}
