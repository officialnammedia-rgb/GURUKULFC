/**
 * Player Achievements Page Logic & Interactive Carousel
 * Gurukul Football Academy
 */
import { initNeuralNoise } from './neural-noise.js';

// Initial Player Achievements Data
export const initialPlayers = [
  {
    id: 'ghana-cup-representative',
    name: 'Aaryan Sharma',
    jerseyNumber: '10',
    category: 'International',
    categoryLabel: 'International Honors',
    badgeText: 'Ghana Cup International Selection',
    badgeType: 'gold',
    position: 'Central Midfielder / Playmaker',
    tournament: 'Ghana Cup Youth International Tournament',
    location: 'Accra, Ghana & West Africa Circuit',
    year: '2025 – 2026',
    image: '/assets/indian-elite-player.png',
    heroImage: '/assets/squad-celebration.png',
    summary: 'Selected among elite grassroots prodigies to represent India at the prestigious Ghana Cup international youth soccer tournament, showcasing top-tier ball progression and tactical vision.',
    stats: [
      { label: 'International Matches', value: '4' },
      { label: 'Key Chances Created', value: '11' },
      { label: 'Pass Accuracy', value: '88%' },
      { label: 'Tournament Rank', value: 'Semi-Finalist' }
    ],
    highlights: [
      'Represented Gurukul FC and India against premier African & European youth academies in Accra, Ghana.',
      'Awarded "Playmaker of the Match" during the high-stakes group clash against West Coast Elite FA.',
      'Completed 14 successful progressive carries in 4 tournament fixtures.',
      'Trained directly under UEFA Licensed coaches during the tournament preparation camp in New Delhi.'
    ],
    scoutReport: 'Exceptional field awareness, quick spatial scanning, and elite vision under high-intensity pressing conditions. Capable of dictating tempo from deep midfield positions.'
  },
  {
    id: 'naman-division-a-captain',
    name: 'Naman',
    jerseyNumber: '07',
    category: 'Division A & Senior',
    categoryLabel: 'Senior League & Captaincy',
    badgeText: 'Division A Campaign Leader',
    badgeType: 'sky',
    position: 'Striker / Attacking Forward',
    tournament: 'DSA Senior Division A League',
    location: 'New Delhi, India',
    year: '2024 – 2026',
    image: '/assets/elite-player.png',
    heroImage: '/assets/adivision1.png',
    summary: 'Captain and offensive talisman driving Gurukul FC in Delhi Soccer Association (DSA) Division A competitions with prolific goal contributions, clinical finishing, and fearless leadership on the pitch.',
    stats: [
      { label: 'League Goals', value: '14' },
      { label: 'Assists', value: '8' },
      { label: 'Win Ratio as Captain', value: '78%' },
      { label: 'Man of Match Awards', value: '5' }
    ],
    highlights: [
      'Spearheaded Gurukul FC attack in the DSA Division A senior championship with 14 decisive goals.',
      'Scored a stunning brace in the promotion playoffs decider match to seal qualification.',
      'Established high-tempo training culture and mentorship for rising youth academy prospects.',
      'Recorded fastest hat-trick of the tournament season in under 18 minutes.'
    ],
    scoutReport: 'Explosive acceleration, lethal conversion inside the 18-yard box, and instinctive off-the-ball attacking movement. Exemplary leadership under pressure.'
  },
  {
    id: 'kabir-state-golden-boot',
    name: 'Kabir Verma',
    jerseyNumber: '09',
    category: 'Youth Academy',
    categoryLabel: 'Youth Championship MVP',
    badgeText: 'State Championship Golden Boot',
    badgeType: 'crimson',
    position: 'Winger / Inverted Forward',
    tournament: 'State Youth Championship & National Trials',
    location: 'Dr. Ambedkar Stadium & JLN Complex',
    year: '2025 – 2026',
    image: '/assets/indian-senior-kid.png',
    heroImage: '/assets/trophy-victory.png',
    summary: 'Rising academy star claiming the Golden Boot accolade in the State Youth Championship with electric 1v1 dribbling, relentless pressing, and high-impact goal scoring.',
    stats: [
      { label: 'Tournament Goals', value: '9' },
      { label: '1v1 Dribble Success', value: '84%' },
      { label: 'Matches Played', value: '6' },
      { label: 'Sprint Speed', value: '31.2 km/h' }
    ],
    highlights: [
      'Top goalscorer of the State U-17 Youth Cup with 9 goals in 6 consecutive matches.',
      'Selected for the State Team preparatory camp for National Sub-Junior Football Championship.',
      'Consistently clocked match-highest sprint speeds and high-intensity turnovers.',
      'Graduated through Gurukul FC Grassroots Development Pathway to Elite Squad.'
    ],
    scoutReport: 'Pacey dynamic winger with rapid change of direction and sharp curling strike technique. Strong tactical discipline in defensive recovery transitions.'
  }
];

let activeCategory = 'ALL';
let currentSlideIndex = 0;
let filteredPlayers = [...initialPlayers];
let touchStartX = 0;
let touchEndX = 0;
let isDragging = false;
let startPos = 0;
let currentTranslate = 0;
let prevTranslate = 0;
let animationID;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Neural Noise Shader Background
  try {
    initNeuralNoise();
  } catch (e) {
    console.warn('Neural noise initialization:', e);
  }

  initAchievementsPage();
  initCustomCursor();
  initMobileMenu();
  initSliderControls();
  initModal();
});

function initAchievementsPage() {
  renderCarousel();
  renderGrid();
  setupCategoryFilters();
}

/**
 * Render Carousel Track with Glassmorphism Player Cards
 */
function renderCarousel() {
  const track = document.getElementById('achievementsCarouselTrack');
  const pagination = document.getElementById('carouselPagination');
  if (!track) return;

  if (filteredPlayers.length === 0) {
    track.innerHTML = `
      <div class="no-achievements-message">
        <span class="no-data-icon">🏆</span>
        <h3>No player achievements in this category yet</h3>
        <p>Switch categories to explore other milestones or check back soon.</p>
      </div>
    `;
    if (pagination) pagination.innerHTML = '';
    return;
  }

  // Generate Cards
  track.innerHTML = filteredPlayers.map((player, index) => {
    const isActive = index === currentSlideIndex;
    return `
      <div class="achievement-slide-card ${isActive ? 'active-slide' : ''}" data-player-id="${player.id}" data-slide-index="${index}">
        <div class="glass-achievement-card">
          
          <!-- Card Top Header -->
          <div class="card-glass-header">
            <div class="badge-pill badge-${player.badgeType}">
              <span class="badge-glow-dot"></span>
              <span>${player.badgeText}</span>
            </div>
            <div class="jersey-circle">
              <span class="hash">#</span><span class="num">${player.jerseyNumber}</span>
            </div>
          </div>

          <!-- Player Visual & Hologram Frame -->
          <div class="player-photo-showcase">
            <div class="hologram-glow"></div>
            <img src="${player.image}" alt="${player.name} - Gurukul Football Academy" class="player-portrait-img" loading="lazy" />
            <div class="player-photo-overlay"></div>
            <div class="player-meta-strip">
              <span class="player-pos-tag">${player.position}</span>
              <span class="player-year-tag">${player.year}</span>
            </div>
          </div>

          <!-- Card Content Info -->
          <div class="card-glass-body">
            <div class="player-title-row">
              <h3 class="player-name-text">${player.name}</h3>
              <span class="player-category-label">${player.categoryLabel}</span>
            </div>

            <div class="tournament-info-box">
              <div class="tournament-name-row">
                <svg class="cup-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h10c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-2c-.55 0-1-.45-1-1v-2.34"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
                <span class="tournament-title">${player.tournament}</span>
              </div>
              <div class="tournament-location-row">
                <svg class="pin-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span class="location-text">${player.location}</span>
              </div>
            </div>

            <p class="player-summary-text">${player.summary}</p>

            <!-- Stats Micro Matrix -->
            <div class="card-stats-matrix">
              ${player.stats.slice(0, 3).map(stat => `
                <div class="micro-stat-item">
                  <span class="stat-number">${stat.value}</span>
                  <span class="stat-caption">${stat.label}</span>
                </div>
              `).join('')}
            </div>

            <!-- Card Bottom Action -->
            <div class="card-footer-action">
              <button class="view-profile-btn" data-player-id="${player.id}">
                <span>View Full Scouting Profile</span>
                <svg class="arrow-right-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>

          </div>

        </div>
      </div>
    `;
  }).join('');

  // Generate pagination dots
  if (pagination) {
    pagination.innerHTML = filteredPlayers.map((_, i) => `
      <button class="carousel-dot ${i === currentSlideIndex ? 'active' : ''}" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>
    `).join('');

    pagination.querySelectorAll('.carousel-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        goToSlide(parseInt(dot.dataset.index, 10));
      });
    });
  }

  // Attach card click handlers for modal
  track.querySelectorAll('.view-profile-btn, .achievement-slide-card').forEach(item => {
    item.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.achievement-slide-card');
      if (card) {
        const playerId = card.dataset.playerId;
        const player = initialPlayers.find(p => p.id === playerId);
        if (player) openPlayerModal(player);
      }
    });
  });

  updateSlidePosition();
}

/**
 * Render Full Grid View Below Carousel
 */
function renderGrid() {
  const gridContainer = document.getElementById('achievementsFullGrid');
  if (!gridContainer) return;

  gridContainer.innerHTML = filteredPlayers.map((player) => `
    <div class="grid-player-card" data-player-id="${player.id}">
      <div class="grid-card-inner">
        <div class="grid-card-media">
          <img src="${player.image}" alt="${player.name}" class="grid-player-thumb" loading="lazy" />
          <span class="grid-badge badge-${player.badgeType}">${player.badgeText}</span>
          <span class="grid-jersey">#${player.jerseyNumber}</span>
        </div>
        <div class="grid-card-details">
          <div class="grid-role-tag">${player.position}</div>
          <h4 class="grid-player-name">${player.name}</h4>
          <div class="grid-tournament-sub">${player.tournament} (${player.year})</div>
          <p class="grid-desc">${player.summary}</p>
          <div class="grid-stats-row">
            ${player.stats.map(s => `
              <div class="grid-stat-unit">
                <strong>${s.value}</strong>
                <small>${s.label}</small>
              </div>
            `).join('')}
          </div>
          <button class="grid-open-btn" data-player-id="${player.id}">
            <span>Inspect Achievements</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  gridContainer.querySelectorAll('.grid-player-card, .grid-open-btn').forEach(elem => {
    elem.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.grid-player-card');
      if (card) {
        const playerId = card.dataset.playerId;
        const player = initialPlayers.find(p => p.id === playerId);
        if (player) openPlayerModal(player);
      }
    });
  });
}

/**
 * Filter handling
 */
function setupCategoryFilters() {
  const pills = document.querySelectorAll('.achievement-filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.dataset.filter || 'ALL';

      if (activeCategory === 'ALL') {
        filteredPlayers = [...initialPlayers];
      } else {
        filteredPlayers = initialPlayers.filter(p => p.category === activeCategory);
      }

      currentSlideIndex = 0;
      renderCarousel();
      renderGrid();
    });
  });
}

/**
 * Carousel Navigation and Slider Controls
 */
function initSliderControls() {
  const prevBtn = document.getElementById('sliderPrevBtn');
  const nextBtn = document.getElementById('sliderNextBtn');
  const track = document.getElementById('achievementsCarouselTrack');
  const viewport = document.getElementById('carouselViewport');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentSlideIndex > 0) {
        goToSlide(currentSlideIndex - 1);
      } else {
        goToSlide(filteredPlayers.length - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentSlideIndex < filteredPlayers.length - 1) {
        goToSlide(currentSlideIndex + 1);
      } else {
        goToSlide(0);
      }
    });
  }

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('playerDetailModal');
    if (modal && modal.classList.contains('active')) return;

    if (e.key === 'ArrowLeft') {
      if (prevBtn) prevBtn.click();
    } else if (e.key === 'ArrowRight') {
      if (nextBtn) nextBtn.click();
    }
  });

  // Touch & Drag Gestures
  if (viewport) {
    viewport.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].clientX;
      handleSwipe();
    }, { passive: true });

    // Mouse drag
    viewport.addEventListener('mousedown', (e) => {
      isDragging = true;
      startPos = e.clientX;
      viewport.classList.add('grabbing');
    });

    viewport.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('grabbing');
      const diff = e.clientX - startPos;
      if (diff > 50) {
        if (prevBtn) prevBtn.click();
      } else if (diff < -50) {
        if (nextBtn) nextBtn.click();
      }
    });

    viewport.addEventListener('mouseleave', () => {
      if (isDragging) {
        isDragging = false;
        viewport.classList.remove('grabbing');
      }
    });
  }
}

function handleSwipe() {
  const swipeDiff = touchEndX - touchStartX;
  if (Math.abs(swipeDiff) > 40) {
    if (swipeDiff > 0) {
      // Swiped Right -> Previous
      if (currentSlideIndex > 0) goToSlide(currentSlideIndex - 1);
      else goToSlide(filteredPlayers.length - 1);
    } else {
      // Swiped Left -> Next
      if (currentSlideIndex < filteredPlayers.length - 1) goToSlide(currentSlideIndex + 1);
      else goToSlide(0);
    }
  }
}

function goToSlide(index) {
  if (index < 0 || index >= filteredPlayers.length) return;
  currentSlideIndex = index;
  updateSlidePosition();
}

function updateSlidePosition() {
  const track = document.getElementById('achievementsCarouselTrack');
  const cards = document.querySelectorAll('.achievement-slide-card');
  const dots = document.querySelectorAll('.carousel-dot');
  if (!track || cards.length === 0) return;

  cards.forEach((c, idx) => {
    if (idx === currentSlideIndex) {
      c.classList.add('active-slide');
    } else {
      c.classList.remove('active-slide');
    }
  });

  dots.forEach((dot, idx) => {
    if (idx === currentSlideIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  // Calculate slide offset
  const cardWidth = cards[0].offsetWidth;
  const gap = 24; // matches CSS gap
  const offset = currentSlideIndex * (cardWidth + gap);

  track.style.transform = `translateX(-${offset}px)`;
}

// Window resize re-alignment
window.addEventListener('resize', () => {
  updateSlidePosition();
});

/**
 * Player Detail Modal logic
 */
function initModal() {
  const modal = document.getElementById('playerDetailModal');
  const closeBtn = document.getElementById('closePlayerModalBtn');
  const overlay = document.getElementById('playerModalOverlay');

  if (closeBtn) {
    closeBtn.addEventListener('click', closePlayerModal);
  }

  if (overlay) {
    overlay.addEventListener('click', closePlayerModal);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePlayerModal();
  });
}

function openPlayerModal(player) {
  const modal = document.getElementById('playerDetailModal');
  const content = document.getElementById('playerModalContent');
  if (!modal || !content) return;

  content.innerHTML = `
    <div class="modal-profile-header">
      <div class="modal-banner-bg" style="background-image: url('${player.heroImage}');">
        <div class="modal-banner-gradient"></div>
      </div>
      
      <div class="modal-header-content">
        <div class="modal-player-avatar-wrap">
          <img src="${player.image}" alt="${player.name}" class="modal-player-avatar" />
          <span class="modal-jersey-pill">#${player.jerseyNumber}</span>
        </div>
        <div class="modal-header-meta">
          <div class="modal-badge-row">
            <span class="badge-pill badge-${player.badgeType}">${player.badgeText}</span>
            <span class="modal-year-tag">${player.year}</span>
          </div>
          <h2 class="modal-player-name">${player.name}</h2>
          <p class="modal-position-title">${player.position} &bull; ${player.categoryLabel}</p>
        </div>
      </div>
    </div>

    <div class="modal-profile-body">
      <!-- Tournament Bar -->
      <div class="modal-tournament-card">
        <div class="mt-left">
          <span class="mt-label">COMPETITION / HONORS</span>
          <h4 class="mt-title">${player.tournament}</h4>
          <span class="mt-location">${player.location}</span>
        </div>
        <div class="mt-right">
          <a href="https://wa.me/919625573511?text=Hi%20Gurukul%20FC!%20I%20saw%20${encodeURIComponent(player.name)}'s%20achievement%20in%20${encodeURIComponent(player.tournament)}%20and%20want%20to%20know%20about%20academy%20trials." target="_blank" rel="noopener noreferrer" class="inquire-prodigy-btn">
            <span>Inquire Trials</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="modal-section-title">
        <span class="title-glow-bar"></span>
        <h3>Performance Metrics & Match Stats</h3>
      </div>
      <div class="modal-stats-grid">
        ${player.stats.map(s => `
          <div class="m-stat-card">
            <span class="m-stat-val">${s.value}</span>
            <span class="m-stat-lbl">${s.label}</span>
          </div>
        `).join('')}
      </div>

      <!-- Highlights List -->
      <div class="modal-section-title">
        <span class="title-glow-bar"></span>
        <h3>Tournament Highlights & Accolades</h3>
      </div>
      <ul class="modal-highlights-list">
        ${player.highlights.map(h => `
          <li>
            <svg class="check-trophy-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>${h}</span>
          </li>
        `).join('')}
      </ul>

      <!-- Scouting Report -->
      <div class="modal-section-title">
        <span class="title-glow-bar"></span>
        <h3>UEFA Coaching & Tactical Scouting Notes</h3>
      </div>
      <div class="scout-report-quote-box">
        <div class="quote-symbol">&ldquo;</div>
        <p class="scout-quote-text">${player.scoutReport}</p>
        <span class="scout-author">— Gurukul FC Technical & Scouting Department</span>
      </div>

    </div>
  `;

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closePlayerModal() {
  const modal = document.getElementById('playerDetailModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/**
 * Custom Cursor Logic
 */
function initCustomCursor() {
  const ball = document.getElementById('footballCursorBall');
  const ring = document.getElementById('footballCursorRing');
  if (!ball || !ring) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    ball.style.transform = `translate3d(${mouseX - 12}px, ${mouseY - 12}px, 0)`;
  });

  function renderRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    ring.style.transform = `translate3d(${ringX - 20}px, ${ringY - 20}px, 0)`;
    requestAnimationFrame(renderRing);
  }
  renderRing();

  document.querySelectorAll('a, button, .achievement-slide-card, .grid-player-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.classList.add('cursor-hover');
    });
    el.addEventListener('mouseleave', () => {
      ring.classList.remove('cursor-hover');
    });
  });
}

/**
 * Mobile Drawer Menu
 */
function initMobileMenu() {
  const toggle = document.getElementById('mobileMenuToggle');
  const navCenter = document.querySelector('.nav-center');
  if (!toggle || !navCenter) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    navCenter.classList.toggle('mobile-open');
  });
}
