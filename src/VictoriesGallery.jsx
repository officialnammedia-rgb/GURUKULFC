import React from 'react';
import InfiniteGallery from '../components/ui/3d-gallery-photography.tsx';

export default function VictoriesGallery() {
  const victoryImages = [
    {
      src: '/assets/memories/WhatsApp Image 2026-08-15 at 10.43.34 AM.jpeg',
      alt: 'Gurukul FC Academy Squad & Coaches Matchday',
    },
    {
      src: '/assets/memories/WhatsApp Image 2026-08-15 at 10.37.07 AM.jpeg',
      alt: 'Academy Training Drill & Match Preparation',
    },
    {
      src: '/assets/memories/WhatsApp Image 2026-08-15 at 10.37.07 AM (1).jpeg',
      alt: 'Tactical Coaching & Player Development Session',
    },
    {
      src: '/assets/memories/WhatsApp Image 2026-08-15 at 10.37.08 AM.jpeg',
      alt: 'Youth Football Match Action & Teamwork',
    },
    {
      src: '/assets/memories/WhatsApp Image 2026-08-15 at 10.39.10 AM.jpeg',
      alt: 'Intensive Pitch Drills & Ball Mastery',
    },
    {
      src: '/assets/memories/WhatsApp Image 2026-08-15 at 10.39.11 AM.jpeg',
      alt: 'Young Champions in Action on the Field',
    },
    {
      src: '/assets/memories/WhatsApp Image 2026-08-15 at 10.39.11 AM (1).jpeg',
      alt: 'Technical Passing & Positioning Session',
    },
    {
      src: '/assets/memories/WhatsApp Image 2026-08-15 at 10.39.12 AM.jpeg',
      alt: 'Academy Matchday Squad Lineup',
    },
    {
      src: '/assets/memories/WhatsApp Image 2026-08-15 at 10.39.12 AM (1).jpeg',
      alt: 'Matchday Action & Academy Team Spirit',
    },
    {
      src: '/assets/memories/WhatsApp Image 2026-08-15 at 10.39.13 AM.jpeg',
      alt: 'Player Focus & Skills Conditioning',
    },
    {
      src: '/assets/memories/WhatsApp Image 2026-08-15 at 10.39.18 AM.jpeg',
      alt: 'Gurukul FC Team Celebration & Academy Bonding',
    },
    {
      src: '/assets/memories/WhatsApp Image 2026-08-15 at 10.39.20 AM.jpeg',
      alt: 'High Energy Academy Football Matchday',
    },
    {
      src: '/assets/memories/WhatsApp Image 2026-08-15 at 10.39.37 AM.jpeg',
      alt: 'Gurukul FC Young Stars & Victory Moments',
    },
    {
      src: '/assets/adivision1.png',
      alt: 'Delhi Division A League Champions Victory Ceremony',
    },
    {
      src: '/assets/adivision2.png',
      alt: 'Senior Squad Gold Cup Victory',
    },
    {
      src: '/assets/trophy-victory.png',
      alt: 'Championship Trophy Celebration',
    },
  ];

  return (
    <section className="victories-gallery-section" id="victories">
      <div className="victories-container">
        {/* Top Badge & Title Header */}
        <div className="victories-header">
          <div className="victories-badge-wrapper">
            <span className="victories-badge">
              🏆 OUR VICTORIES & HALL OF FAME
            </span>
          </div>
          <h2 className="victories-title">
            MEMORIES OF OUR <span className="text-highlight-red">ACADEMY</span>
          </h2>
          <p className="victories-subtitle">
            An interactive 3D hall of fame showcasing our historic trophies, division titles, championship celebrations, and unforgettable academy moments.
          </p>
        </div>

        {/* 3D Photography Canvas Container */}
        <div className="victories-canvas-wrapper">
          <InfiniteGallery
            images={victoryImages}
            speed={1.2}
            planeScale={3.0}
            zSpacing={3}
            visibleCount={10}
            falloff={{ near: 0.8, far: 14 }}
            className="victories-3d-gallery"
          />

          {/* Overlay Heading Text */}
          <div className="victories-canvas-overlay">
            <h3 className="overlay-heading">
              <span className="italic-text">Champions;</span> Built at Gurukul FC
            </h3>
            <p className="overlay-hint">
              <span>🖱️ Scroll or drag to navigate 3D memory cards</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
