import React from 'react';
import InfiniteGallery from '../components/ui/3d-gallery-photography';

export default function VictoriesGallery() {
  const victoryImages = [
    {
      src: '/assets/adivision1.png',
      alt: 'Delhi Division A League Champions Victory Ceremony',
    },
    {
      src: '/assets/centers/opg-world-sec19b.png',
      alt: 'Youth Championship Winners Celebrating with Trophy',
    },
    {
      src: '/assets/adivision2.png',
      alt: 'Senior Squad Gold Cup Victory',
    },
    {
      src: '/assets/centers/rd-rajpal-sec9.png',
      alt: 'High Performance Tactical Training Session',
    },
    {
      src: '/assets/centers/bal-bharati-sec12.png',
      alt: 'Official League Match 11v11 Action',
    },
    {
      src: '/assets/stadium-grass.png',
      alt: 'FIFA Quality Pro Arena Night Floodlights',
    },
    {
      src: '/assets/centers/nk-bagrodia-sec4.png',
      alt: 'Under-15 Academy Development Squad',
    },
    {
      src: '/assets/centers/play-yard-sec7.png',
      alt: 'Evening Futsal & Technical Speed Drills',
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
