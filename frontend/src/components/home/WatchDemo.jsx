import { PlaySquare } from "@/components/ui/Icons";

export default function WatchDemo() {
  return (
    <section className="demo" id="demo">
      <div className="demo-wrap">
        <p className="demo-eyebrow">Watch demo</p>
        <h2 className="demo-title">
          See the whole OS in <em>90 seconds</em>.
        </h2>

        {/* Video placeholder — asli video aane par yahan <video> ya iframe lagana */}
        <button type="button" className="demo-player" aria-label="Play the demo, 1 minute 30 seconds">
          <span className="demo-play">
            <PlaySquare size={20} />
          </span>
          <span className="demo-caption">Play the demo · 1:30</span>
        </button>
      </div>

      <style>{`
        .demo {
          background: #fcfdef;
          color: #23251a;
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .demo-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 104px 32px 64px;
          text-align: center;
        }
        .demo-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 14px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6f7556;
        }
        .demo-eyebrow::before {
          content: "";
          width: 20px;
          height: 1px;
          background: currentColor;
        }
        .demo-title {
          margin: 0 0 34px;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400;
          font-size: clamp(32px, 3.6vw, 50px);
          line-height: 1.1;
          letter-spacing: -0.01em;
        }
        .demo-title em { font-style: italic; color: #7e8462; }

        .demo-player {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 7.6;
          border: 0;
          border-radius: 28px;
          background: linear-gradient(155deg, #3f4130 0%, #5d604a 45%, #7f8460 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          cursor: pointer;
          overflow: hidden;
          font: inherit;
        }
        .demo-play {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: #fcfdef;
          color: #3f4130;
          display: grid;
          place-items: center;
          transition: transform .25s;
        }
        .demo-player:hover .demo-play { transform: scale(1.08); }
        .demo-caption {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }

        @media (max-width: 1024px) {
          .demo-wrap { padding: 80px 32px 56px; }
          .demo-player { aspect-ratio: 16 / 9; border-radius: 22px; }
        }
        @media (max-width: 640px) {
          .demo-wrap { padding: 64px 20px 40px; }
          .demo-player { aspect-ratio: 4 / 3; border-radius: 18px; }
          .demo-play { width: 62px; height: 62px; }
        }
      `}</style>
    </section>
  );
}
