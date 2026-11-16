"use client";

import { useState } from "react";
import { PlaySquare } from "@/components/ui/Icons";

// Geek Influencer guide — desktop: long video, phone: the Short (vertical). Plays on tap (no YouTube load before).
const LONG = "4E_G2F3as0U";
const SHORT = "cAnIjgCMdbo";

function Player({ id, kind, label }) {
  const [on, setOn] = useState(false);
  return (
    <div className={`demo-player demo-player--${kind}`}>
      {on ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={label}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button type="button" className="demo-cover" aria-label={`Play: ${label}`} onClick={() => setOn(true)}>
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
          <span className="demo-play">
            <PlaySquare size={20} />
          </span>
          <span className="demo-caption">{label}</span>
        </button>
      )}
    </div>
  );
}

export default function WatchDemo() {
  return (
    <section className="demo" id="demo">
      <div className="demo-wrap">
        <p className="demo-eyebrow">Watch demo</p>
        <h2 className="demo-title">
          See how Geek Influencer OS <em>works</em>.
        </h2>
        <Player id={LONG} kind="long" label="Play the Geek Influencer guide" />
        <Player id={SHORT} kind="short" label="Play the quick guide" />
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
          aspect-ratio: 16 / 9;
          border-radius: 28px;
          overflow: hidden;
          background: linear-gradient(155deg, #3f4130 0%, #5d604a 45%, #7f8460 100%);
        }
        .demo-player--short { display: none; }
        .demo-player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
        .demo-cover {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          padding: 0;
          background: transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          cursor: pointer;
          font: inherit;
        }
        .demo-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .55; }
        .demo-cover > span { position: relative; }
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
        .demo-cover:hover .demo-play { transform: scale(1.08); }
        .demo-caption {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }

        @media (max-width: 1024px) {
          .demo-wrap { padding: 80px 32px 56px; }
          .demo-player { border-radius: 22px; }
        }
        @media (max-width: 640px) {
          .demo-wrap { padding: 64px 20px 40px; }
          .demo-player--long { display: none; }
          .demo-player--short { display: block; aspect-ratio: 9 / 16; max-width: 360px; margin: 0 auto; border-radius: 18px; }
          .demo-play { width: 62px; height: 62px; }
        }
      `}</style>
    </section>
  );
}
