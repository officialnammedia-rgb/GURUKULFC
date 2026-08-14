// Mobile detection helper
const isMobileDevice = () => window.innerWidth <= 768 || 'ontouchstart' in window;


/* --------------------------------------------------------------------------
   Scroll Driven Holographic Blur Reveal for Division A 2nd Card
   -------------------------------------------------------------------------- */
function initScrollDrivenBlur() {
  // filter:blur() on every scroll frame murders mobile GPU perf
  if (isMobileDevice()) return;

  const frontCard = document.getElementById('parallaxFront');
  if (!frontCard) return;

  let hasRevealedPermanently = false;

  function checkBlur() {
    if (hasRevealedPermanently) return;

    const rect = frontCard.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const cardCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;
    const distanceFromCenter = Math.abs(viewportCenter - cardCenter);

    // Lock unblurred permanently once scrolled into viewport center
    if (distanceFromCenter < 140) {
      frontCard.style.filter = 'blur(0px)';
      frontCard.style.opacity = '1';
      hasRevealedPermanently = true;
      window.removeEventListener('scroll', checkBlur);
      window.removeEventListener('resize', checkBlur);
      return;
    }

    const maxDistance = windowHeight * 0.45;
    let progress = Math.min(distanceFromCenter / maxDistance, 1);
    let blurVal = progress * 10;
    let opacityVal = 1 - (progress * 0.35);

    frontCard.style.filter = `blur(${blurVal.toFixed(1)}px)`;
    frontCard.style.opacity = opacityVal.toFixed(2);
  }

  window.addEventListener('scroll', checkBlur, { passive: true });
  window.addEventListener('resize', checkBlur);
  checkBlur();
}

/* --------------------------------------------------------------------------
   Mobile Menu Toggle Implementation
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const navCenter = document.querySelector('.nav-center');
  const navLinks = document.querySelectorAll('.nav-glass-capsule .nav-link');

  if (!toggleBtn || !navCenter) return;

  function toggleMenu(e) {
    if (e) e.stopPropagation();
    const isActive = navCenter.classList.toggle('active');
    toggleBtn.classList.toggle('active', isActive);
  }

  function closeMenu() {
    navCenter.classList.remove('active');
    toggleBtn.classList.remove('active');
  }

  toggleBtn.addEventListener('click', toggleMenu);

  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (e) => {
    if (!navCenter.contains(e.target) && !toggleBtn.contains(e.target)) {
      closeMenu();
    }
  });
}

/* --------------------------------------------------------------------------
   Auto-Scroll & Manual Slider for 5 Facilities Carousel
   -------------------------------------------------------------------------- */
function initFacilitiesCarousel() {
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('prevSlideBtn');
  const nextBtn = document.getElementById('nextSlideBtn');
  const wrapper = document.getElementById('carouselTrackWrapper');
  const dots = document.querySelectorAll('.carousel-dots .dot');

  if (!track || !wrapper) return;

  const cards = track.querySelectorAll('.ancillary-card');
  if (cards.length === 0) return;

  let currentIndex = 0;
  let autoScrollTimer = null;

  function getCardsPerView() {
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    if (window.innerWidth < 1280) return 3;
    return 4;
  }

  function getMaxIndex() {
    const cardsPerView = getCardsPerView();
    return Math.max(0, cards.length - cardsPerView);
  }

  function updateCarousel() {
    const maxIdx = getMaxIndex();
    if (currentIndex > maxIdx) currentIndex = 0;
    if (currentIndex < 0) currentIndex = maxIdx;

    const cardWidth = cards[0].offsetWidth;
    const gap = 24; // 1.5rem
    const offset = currentIndex * (cardWidth + gap);

    track.style.transform = `translateX(-${offset}px)`;

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === Math.min(currentIndex, dots.length - 1));
    });
  }

  function nextSlide() {
    const maxIdx = getMaxIndex();
    if (currentIndex >= maxIdx) {
      currentIndex = 0;
    } else {
      currentIndex++;
    }
    updateCarousel();
  }

  function prevSlide() {
    const maxIdx = getMaxIndex();
    if (currentIndex <= 0) {
      currentIndex = maxIdx;
    } else {
      currentIndex--;
    }
    updateCarousel();
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      resetAutoScroll();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      resetAutoScroll();
    });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index') || '0', 10);
      currentIndex = idx;
      updateCarousel();
      resetAutoScroll();
    });
  });

  function startAutoScroll() {
    stopAutoScroll();
    autoScrollTimer = setInterval(nextSlide, 3500);
  }

  function stopAutoScroll() {
    if (autoScrollTimer) clearInterval(autoScrollTimer);
  }

  function resetAutoScroll() {
    stopAutoScroll();
    startAutoScroll();
  }

  wrapper.addEventListener('mouseenter', stopAutoScroll);
  wrapper.addEventListener('mouseleave', startAutoScroll);

  window.addEventListener('resize', updateCarousel);
  setTimeout(updateCarousel, 100);

  startAutoScroll();
}

/* --------------------------------------------------------------------------
   1. Interactive Grid Spotlight (Mouse Follower Effect)
   -------------------------------------------------------------------------- */
function initGridSpotlight() {
  // Skip mouse-follower spotlight on mobile — no mouse to follow
  if (isMobileDevice()) return;

  const hero = document.getElementById('hero');
  const spotlight = document.getElementById('spotlight');

  if (!hero || !spotlight) return;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    spotlight.style.left = `${x}px`;
    spotlight.style.top = `${y}px`;
    spotlight.style.opacity = '1';
  }, { passive: true });

  hero.addEventListener('mouseleave', () => {
    spotlight.style.opacity = '0';
  });
}

/* --------------------------------------------------------------------------
   2. Discover Section Tab Switcher (All 5 Centers & Facilities)
   -------------------------------------------------------------------------- */
const DATA_ITEMS = {
  pitches: [
    { id: 1, name: 'Camp Nou Arena 5v5', sub: 'FIFA Certified Turf • Barcelona, Central', badge: 'Available Now', rating: '4.9 ★' },
    { id: 2, name: 'Wembley Premier Pitch', sub: 'Indoor All-Weather • London Metro', badge: 'Popular Choice', rating: '4.8 ★' },
    { id: 3, name: 'Bernabeu Sky Turf 7v7', sub: 'Floodlight Synthetic • Madrid City', badge: 'Booked 85%', rating: '4.9 ★' },
    { id: 4, name: 'Allianz Arena Dome', sub: 'Multi-Sport & Pro Turf • Munich East', badge: 'Instant Reserve', rating: '4.7 ★' },
    { id: 5, name: 'San Siro Elite Complex', sub: 'Floodlight Pitch & Training • Milan South', badge: 'Top Rated', rating: '5.0 ★' }
  ],
  academies: [
    { id: 1, name: 'La Masia Youth Center', sub: 'Ages 8-18 • Elite Coaching Staff', badge: 'Top Rated', rating: '4.9 ★' },
    { id: 2, name: 'Red Devils Academy', sub: 'Pro Tactical & Conditioning Training', badge: 'Registration Open', rating: '4.8 ★' },
    { id: 3, name: 'Ajax Total Football Hub', sub: 'Skills & Development Camp', badge: '98% Score', rating: '4.9 ★' },
    { id: 4, name: 'Bayern Junior Pro Grounds', sub: 'High Performance Youth Academy', badge: 'Featured', rating: '4.9 ★' },
    { id: 5, name: 'Milan NextGen Center', sub: 'Tactical & Physical Excellence', badge: 'New Season', rating: '4.8 ★' }
  ],
  communities: [
    { id: 1, name: 'Friday Night Football Club', sub: '1,420 Active Players • Weekly Friendly Matches', badge: 'Join Free', rating: '5.0 ★' },
    { id: 2, name: 'Metro League Amateurs', sub: 'Seasonal Tournament Series', badge: '12 Teams Live', rating: '4.7 ★' },
    { id: 3, name: 'Urban Turf Collective', sub: 'Casual Pick-up Matches & Events', badge: 'Active Now', rating: '4.8 ★' },
    { id: 4, name: 'Sunset 7-a-side League', sub: 'Competitive Weekend Circuit', badge: 'Registration', rating: '4.9 ★' },
    { id: 5, name: 'All-Star Futsal Society', sub: 'Fast-Paced Nightly Pickups', badge: 'Daily Games', rating: '4.8 ★' }
  ]
};

function initTabSwitcher() {
  const tabs = document.querySelectorAll('.discover-tab');
  const container = document.getElementById('tabContentArea');

  if (!container) return;

  function renderContent(key) {
    const items = DATA_ITEMS[key] || [];
    container.innerHTML = `
      <div class="facility-list">
        ${items.map((item, idx) => `
          <div class="facility-item">
            <div class="facility-info">
              <div class="facility-num">${idx + 1}</div>
              <div>
                <div class="facility-name">${item.name}</div>
                <div class="facility-sub">${item.sub}</div>
              </div>
            </div>
            <div class="facility-meta">
              <span class="facility-rating">${item.rating}</span>
              <span class="facility-badge">${item.badge}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Initial render
  renderContent('pitches');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.getAttribute('data-tab');
      renderContent(key);
    });
  });
}

/* --------------------------------------------------------------------------
   3. Search Modal Functionality
   -------------------------------------------------------------------------- */
function initSearchModal() {
  const searchBtn = document.getElementById('searchBtn');
  const getStartedBtn = document.getElementById('getStartedBtn');
  const exploreBtn = document.getElementById('exploreBtn');
  const modal = document.getElementById('searchModal');
  const closeBtn = document.getElementById('closeSearchModal');
  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('searchResults');
  const tags = document.querySelectorAll('.quick-tags .tag');

  if (!modal) return;

  function openModal() {
    modal.classList.add('open');
    if (searchInput) searchInput.focus();
    renderSearchResults('');
  }

  function closeModal() {
    modal.classList.remove('open');
  }

  if (searchBtn) searchBtn.addEventListener('click', openModal);
  if (exploreBtn) exploreBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  const allPitches = [
    { name: 'Apex Sports Arena', type: '11-a-side Turf', loc: 'Downtown Center' },
    { name: 'Starlight Pitch 7s', type: '7-a-side Synthetic', loc: 'East District' },
    { name: 'Urban Cage Football', type: '5-a-side Indoor', loc: 'Harbor Quarter' },
    { name: 'Champion Stadium Pitch', type: 'FIFA Hybrid Grass', loc: 'Olympic Park' }
  ];

  function renderSearchResults(query) {
    if (!resultsContainer) return;
    const filtered = allPitches.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.type.toLowerCase().includes(query.toLowerCase()) ||
      p.loc.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length === 0) {
      resultsContainer.innerHTML = `<div style="padding: 1rem; color: #64748b; text-align: center;">No matching pitches found for "${query}". Try searching "Turf" or "5-a-side".</div>`;
      return;
    }

    resultsContainer.innerHTML = filtered.map(p => `
      <div class="facility-item" style="cursor: pointer;" onclick="alert('Viewing pitch details for ${p.name}!')">
        <div>
          <div class="facility-name">${p.name}</div>
          <div class="facility-sub">${p.type} • ${p.loc}</div>
        </div>
        <span class="facility-badge" style="background: #dcfce7; color: #166534;">Reserve Spot</span>
      </div>
    `).join('');
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value);
    });
  }

  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      const text = tag.innerText.replace(/^[^\w\s]+/, '').trim();
      if (searchInput) {
        searchInput.value = text;
        renderSearchResults(text);
      }
    });
  });
}

/* --------------------------------------------------------------------------
   4. Web Audio Stadium Cheer Ambience (Creative Beta Feature)
   -------------------------------------------------------------------------- */
function initAudioAmbience() {
  const soundBtn = document.getElementById('soundToggleBtn');
  let audioCtx = null;
  let isPlaying = false;
  let noiseNode = null;

  if (!soundBtn) return;

  soundBtn.addEventListener('click', () => {
    if (!isPlaying) {
      startAmbientSound();
      soundBtn.style.background = 'rgba(16, 185, 129, 0.4)';
      soundBtn.style.borderColor = '#10b981';
      isPlaying = true;
    } else {
      stopAmbientSound();
      soundBtn.style.background = '';
      soundBtn.style.borderColor = '';
      isPlaying = false;
    }
  });

  function startAmbientSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();

      // Synthesize soft ambient wind/stadium roar noise filter
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      const bandpass = audioCtx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 400;
      bandpass.Q.value = 3.0;

      const gain = audioCtx.createGain();
      gain.gain.value = 0.05; // Gentle background volume

      noiseNode.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(audioCtx.destination);

      noiseNode.start();
    } catch (e) {
      console.log('Audio Context error', e);
    }
  }

  function stopAmbientSound() {
    if (noiseNode) {
      noiseNode.stop();
      noiseNode.disconnect();
    }
    if (audioCtx) {
      audioCtx.close();
    }
  }
}

/* --------------------------------------------------------------------------
   5. Navbar & Smooth Scroll Interactions
   -------------------------------------------------------------------------- */
function initSmoothInteractions() {
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');

      // Handle anchor smooth scroll
      if (href && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      // Update active state
      navLinks.forEach(l => {
        l.classList.remove('active');
        const dot = l.querySelector('.active-dot');
        if (dot) dot.remove();
      });

      link.classList.add('active');
      const dot = document.createElement('span');
      dot.className = 'active-dot';
      link.prepend(dot);
    });
  });
}

/* --------------------------------------------------------------------------
   6. Ultra-Smooth Inertia Parallax Motion & Scrollable Depth Effect
   -------------------------------------------------------------------------- */
function initParallaxMotion() {
  // Skip the entire parallax rAF loop on mobile — huge perf win
  if (isMobileDevice()) return;

  const section = document.getElementById('milestone');
  const backCard = document.getElementById('parallaxBack');
  const frontCard = document.getElementById('parallaxFront');

  if (!section || !backCard || !frontCard) return;

  let currentProgress = 0;
  let targetProgress = 0;
  let mouseTiltX = 0;
  let mouseTiltY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;
  let isHovered = false;

  function calculateTargetProgress() {
    const rect = section.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (rect.top < windowHeight && rect.bottom > 0) {
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      targetProgress = (viewportCenter - sectionCenter) / (windowHeight / 2 + rect.height / 2);
    }
  }

  // Continuous animation loop using linear interpolation (lerp) for silky smooth physics
  function render() {
    currentProgress += (targetProgress - currentProgress) * 0.08;
    mouseTiltX += (targetTiltX - mouseTiltX) * 0.1;
    mouseTiltY += (targetTiltY - mouseTiltY) * 0.1;

    const backY = currentProgress * -50 + (isHovered ? mouseTiltX * 0.5 : 0);
    const frontY = currentProgress * 60 + (isHovered ? mouseTiltX : 0);

    const rotX = isHovered ? mouseTiltX : 0;
    const rotY = isHovered ? mouseTiltY : 0;

    backCard.style.transform = `translate3d(0, ${backY}px, 0) rotateX(${rotX * 0.5}deg) rotateY(${rotY * 0.5}deg) scale(1.02)`;
    frontCard.style.transform = `translate3d(0, ${frontY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.04)`;

    requestAnimationFrame(render);
  }

  section.addEventListener('mousemove', (e) => {
    isHovered = true;
    const rect = section.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;

    targetTiltX = mouseY * -14;
    targetTiltY = mouseX * 14;
  }, { passive: true });

  section.addEventListener('mouseleave', () => {
    isHovered = false;
    targetTiltX = 0;
    targetTiltY = 0;
  });

  window.addEventListener('scroll', calculateTargetProgress, { passive: true });
  window.addEventListener('resize', calculateTargetProgress, { passive: true });

  calculateTargetProgress();
  requestAnimationFrame(render);
}

/* --------------------------------------------------------------------------
   7. Scroll Reveal Animation Engine (IntersectionObserver)
   -------------------------------------------------------------------------- */
function initScrollReveals() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (elements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* --------------------------------------------------------------------------
   8. Interactive Football Mouse Cursor System
   -------------------------------------------------------------------------- */
function initFootballCursor() {
  // Skip custom cursor entirely on mobile/touch — no mouse, pointless rAF loop
  if (isMobileDevice()) return;

  const ball = document.getElementById('footballCursorBall');
  const ring = document.getElementById('footballCursorRing');

  if (!ball || !ring) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  let ballX = mouseX;
  let ballY = mouseY;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  const hoverSelectors = 'a, button, .nav-link, .ancillary-card, .stat-card, .parallax-card, input, .dot, .nav-arrow, .book-slot-btn';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverSelectors)) {
      document.body.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverSelectors)) {
      document.body.classList.remove('cursor-hover');
    }
  });

  function renderCursor() {
    ballX += (mouseX - ballX) * 0.28;
    ballY += (mouseY - ballY) * 0.28;

    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;

    ball.style.left = `${ballX}px`;
    ball.style.top = `${ballY}px`;

    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    requestAnimationFrame(renderCursor);
  }

  requestAnimationFrame(renderCursor);
}

/* --------------------------------------------------------------------------
   Dynamic Typewriter Effect with Blinking Cursor
   -------------------------------------------------------------------------- */
function initTypewriter() {
  const target = document.getElementById('typewriterText');
  if (!target) return;

  const phrases = [
    "DRIVEN TO SUCCEED.",
    "SHAPING FUTURE STARS.",
    "BUILT FOR CHAMPIONS.",
    "PROVEN DIVISION A PATHWAY."
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  target.textContent = "";

  function type() {
    const currentPhrase = phrases[phraseIndex];
    let typeSpeed = 75;

    if (isDeleting) {
      target.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 30;
    } else {
      target.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 75;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
      typeSpeed = 2200;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeSpeed = 300;
    }

    setTimeout(type, typeSpeed);
  }

  setTimeout(type, 300);
}

/* --------------------------------------------------------------------------
   INTERACTIVE PLAYER PATHWAY SVG DOTTED LINE SCROLL ANIMATION
   -------------------------------------------------------------------------- */
function initPathwayScrollAnimation() {
  const stickyWrapper = document.getElementById('pathwayStickyWrapper');
  const section = document.getElementById('services');
  const wrapper = document.querySelector('.pathway-wrapper');
  const svgCanvas = document.getElementById('pathwaySvgCanvas');
  const bgLine = document.getElementById('pathwayLineBg');
  const activeLine = document.getElementById('pathwayDottedLine');
  const beadRing = document.getElementById('pathwayBeadRing');
  const beadCore = document.getElementById('pathwayBeadCore');
  const beadGroup = document.getElementById('pathwayBeadGroup');
  const cards = Array.from(document.querySelectorAll('.pathway-card'));
  const dots = [1, 2, 3, 4].map(id => document.getElementById('nodeDot' + id));

  if (!stickyWrapper || !section || !wrapper || !svgCanvas || !activeLine || !bgLine || cards.length === 0) return;

  let pathLength = 0;
  let isTicking = false;

  // Calculate exact relative offset center immune to CSS transforms & scroll offsets
  function getRelativeCenter(el, parent) {
    if (!el || !parent) return { x: 0, y: 0 };
    let x = el.offsetWidth / 2;
    let y = el.offsetHeight / 2;
    let curr = el;
    while (curr && curr !== parent && curr.offsetParent) {
      x += curr.offsetLeft;
      y += curr.offsetTop;
      curr = curr.offsetParent;
    }
    return { x, y };
  }

  // Build smooth curve path passing through step node dot centers
  function buildSvgPath() {
    const wrapperWidth = wrapper.clientWidth || wrapper.offsetWidth;
    const wrapperHeight = wrapper.clientHeight || wrapper.offsetHeight;
    svgCanvas.setAttribute('width', wrapperWidth);
    svgCanvas.setAttribute('height', wrapperHeight);

    const points = dots.map(dot => getRelativeCenter(dot, wrapper));
    if (points.length < 4) return;

    let pathD = '';
    const isDesktop = window.innerWidth > 1120;

    if (isDesktop) {
      // Horizontal organic arching curve passing precisely through node dots
      pathD = `M ${points[0].x},${points[0].y} `;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const dx = p2.x - p1.x;
        const cp1x = p1.x + dx * 0.45;
        const cp2x = p1.x + dx * 0.55;
        // Smooth upward arch between dots connecting dots precisely at (p1.x, p1.y) and (p2.x, p2.y)
        const archY = Math.min(p1.y, p2.y) - 45;
        pathD += `C ${cp1x},${archY} ${cp2x},${archY} ${p2.x},${p2.y} `;
      }
    } else {
      // Mobile / Tablet stacked smooth curve
      pathD = `M ${points[0].x},${points[0].y} `;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const cy = p1.y + (p2.y - p1.y) * 0.5;
        pathD += `C ${p1.x},${cy} ${p2.x},${cy} ${p2.x},${p2.y} `;
      }
    }

    bgLine.setAttribute('d', pathD);
    activeLine.setAttribute('d', pathD);

    pathLength = activeLine.getTotalLength();
    activeLine.style.strokeDasharray = `${pathLength} ${pathLength}`;
    updateScrollAnimation();
  }

  // Update strokeDashoffset and traveler bead position based on sticky wrapper scroll progress
  function updateScrollAnimation() {
    if (!pathLength || !stickyWrapper || !section) return;

    const stickyRect = stickyWrapper.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const maxScroll = stickyWrapper.offsetHeight - windowHeight;

    if (maxScroll <= 0) return;

    const usePinnedJourney = window.innerWidth > 900;
    if (usePinnedJourney) {
      const isBefore = stickyRect.top > 0;
      const isAfter = stickyRect.bottom <= windowHeight;
      section.classList.toggle('is-js-pinned', !isBefore && !isAfter);
      section.classList.toggle('is-js-released', isAfter);
    } else {
      section.classList.remove('is-js-pinned', 'is-js-released');
    }

    // Calculate progress: 0 when sticky wrapper reaches top of viewport, 1 when pinned scroll region completes
    let progress = -stickyRect.top / maxScroll;
    progress = Math.max(0, Math.min(1, progress));

    const drawLength = pathLength * progress;
    activeLine.style.strokeDashoffset = pathLength - drawLength;

    // Position glowing traveler bead along active SVG line
    if (progress > 0.005 && progress < 0.995) {
      try {
        const point = activeLine.getPointAtLength(drawLength);
        if (beadRing && beadCore) {
          beadRing.setAttribute('cx', point.x);
          beadRing.setAttribute('cy', point.y);
          beadCore.setAttribute('cx', point.x);
          beadCore.setAttribute('cy', point.y);
          if (beadGroup) beadGroup.style.opacity = '1';
        }
      } catch (e) {
        // Fallback for edge cases
      }
    } else if (beadGroup) {
      beadGroup.style.opacity = '0';
    }

    // Toggle active illuminated glow state on step cards sequentially
    const nodeThresholds = [0.02, 0.28, 0.58, 0.85];
    cards.forEach((card, idx) => {
      const threshold = nodeThresholds[idx];
      if (progress >= threshold) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  function onScroll() {
    if (!isTicking) {
      requestAnimationFrame(() => {
        updateScrollAnimation();
        isTicking = false;
      });
      isTicking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    buildSvgPath();
  });

  // Delay initial path build to ensure proper DOM layout dimensions
  setTimeout(buildSvgPath, 250);
}

/* --------------------------------------------------------------------------
   World-Class Football Centers Hub Showcase Interactive Controller
   -------------------------------------------------------------------------- */
function initCentersHub() {
  const tabs = document.querySelectorAll('.center-tab-btn');
  const mainImg = document.getElementById('centerMainImg');
  const badge = document.getElementById('centerBadge');
  const tag = document.getElementById('centerTag');
  const title = document.getElementById('centerTitle');
  const ratingEl = document.getElementById('centerRating');
  const timingsEl = document.getElementById('centerTimings');
  const desc = document.getElementById('centerDesc');
  const specTurf = document.getElementById('specTurf');
  const specLighting = document.getElementById('specLighting');
  const specAnalytics = document.getElementById('specAnalytics');
  const specPhysio = document.getElementById('specPhysio');
  const location = document.getElementById('centerLocation');
  const directionsBtn = document.getElementById('centerDirectionsBtn');
  const bookTrialBtn = document.getElementById('centerBookTrialBtn');
  const galleryStrip = document.getElementById('centerGalleryStrip');

  if (tabs.length === 0 || !mainImg) return;

  const centersData = [
    {
      img: '/assets/centers/nk-bagrodia-sec4.png',
      badge: 'DWARKA SEC-4 • FIFA PRO TURF',
      tag: 'SECTOR 4 ACADEMY HUB',
      title: 'NK Bagrodia Public School (Sec-4)',
      ratingNum: '5.0 ★',
      ratingCount: '(65+ Reviews)',
      desc: 'Official training ground at NK Bagrodia Public School featuring FIFA Quality Pro synthetic turf and licensed UEFA & AFC coaches.',
      turf: 'FIFA Quality Pro Turf',
      physio: 'Licensed UEFA & AFC Coaches',
      location: 'NK Bagrodia School, Sec-4, Dwarka, Delhi - 110078',
      directionsUrl: 'https://share.google/TklWcLGjkioVBcITb',
      waMessage: 'Hi Gurukul FC! I would like to book a Free Trial at NK Bagrodia Public School (Sec-4).'
    },
    {
      img: '/assets/centers/play-yard-sec7.png',
      badge: 'DWARKA SEC-7 • PRO ARENA',
      tag: 'SECTOR 7 FUTSAL & SPORTS HUB',
      title: 'Play Yard Sports (Sec-7)',
      ratingNum: '4.9 ★',
      ratingCount: '(48+ Reviews)',
      desc: 'State-of-the-art synthetic turf and multi-sport facility at Play Yard Sports for technical footwork and agility training.',
      turf: 'FIFA Quality Pro Turf',
      physio: 'Licensed UEFA & AFC Coaches',
      location: 'Play Yard Sports, Sec-7, Dwarka, Delhi - 110075',
      directionsUrl: 'https://share.google/2BrTTanRrMGYj74rI',
      waMessage: 'Hi Gurukul FC! I would like to book a Free Trial at Play Yard Sports (Sec-7).'
    },
    {
      img: '/assets/centers/rd-rajpal-sec9.png',
      badge: 'DWARKA SEC-9 • FULL SIZE ARENA',
      tag: 'SECTOR 9 HEADQUARTERS HUB',
      title: 'R.D Rajpal School (Sec-9)',
      ratingNum: '5.0 ★',
      ratingCount: '(82+ Reviews)',
      desc: 'Full-size match ground at R.D Rajpal Public School for Division A & Division B senior squad training and youth elite development.',
      turf: 'FIFA Quality Pro Turf',
      physio: 'Licensed UEFA & AFC Coaches',
      location: 'R.D Rajpal Public School, Sec-9, Dwarka, Delhi - 110077',
      directionsUrl: 'https://share.google/M06v4ZgV8XU8ve8n1',
      waMessage: 'Hi Gurukul FC! I would like to book a Free Trial at R.D Rajpal School (Sec-9).'
    },
    {
      img: '/assets/centers/bal-bharati-sec12.png',
      badge: 'DWARKA SEC-12 • ELITE COMPLEX',
      tag: 'SECTOR 12 PERFORMANCE CENTER',
      title: 'Bal Bharati School (Sec-12)',
      ratingNum: '4.9 ★',
      ratingCount: '(95+ Reviews)',
      desc: 'Premier sports infrastructure at Bal Bharati Public School with 11-a-side match field and dedicated grassroots development batches.',
      turf: 'FIFA Quality Pro Turf',
      physio: 'Licensed UEFA & AFC Coaches',
      location: 'Bal Bharati Public School, Sec-12, Dwarka, Delhi - 110078',
      directionsUrl: 'https://share.google/KDeK4fIKtfuAtPKHF',
      waMessage: 'Hi Gurukul FC! I would like to book a Free Trial at Bal Bharati School (Sec-12).'
    },
    {
      img: '/assets/centers/opg-world-sec19b.png',
      badge: 'DWARKA SEC-19B • PRO GROUND',
      tag: 'SECTOR 19B COMPETITION CENTER',
      title: 'OPG World School (Sec-19B)',
      ratingNum: '5.0 ★',
      ratingCount: '(74+ Reviews)',
      desc: 'Premier competition facility at OPG World School, host ground for official youth tournaments and Division A match preparations.',
      turf: 'FIFA Quality Pro Turf',
      physio: 'Licensed UEFA & AFC Coaches',
      location: 'OPG World School, Sec-19B, Dwarka, Delhi - 110075',
      directionsUrl: 'https://share.google/VYYSSotR1WA58elck',
      waMessage: 'Hi Gurukul FC! I would like to book a Free Trial at OPG World School (Sec-19B).'
    }
  ];

  function updateCenterView(index) {
    const data = centersData[index];
    if (!data) return;

    mainImg.style.opacity = '0.3';
    setTimeout(() => {
      mainImg.src = data.img;
      mainImg.alt = data.title;
      mainImg.style.opacity = '1';
    }, 150);

    if (badge) badge.textContent = data.badge;
    if (tag) tag.textContent = data.tag;
    if (title) title.textContent = data.title;
    if (desc) desc.textContent = data.desc;
    if (specTurf) specTurf.textContent = data.turf;
    if (specLighting) specLighting.textContent = data.lighting;
    if (specAnalytics) specAnalytics.textContent = data.analytics;
    if (specPhysio) specPhysio.textContent = data.physio;
    if (timingsEl) timingsEl.textContent = data.timings;

    if (ratingEl) {
      ratingEl.innerHTML = `
        <span class="rating-stars">★★★★★</span>
        <span class="rating-num">${data.ratingNum}</span>
        <span class="rating-count">${data.ratingCount}</span>
      `;
    }

    if (location) {
      const svg = location.querySelector('svg');
      location.innerHTML = '';
      if (svg) location.appendChild(svg);
      const span = document.createElement('span');
      span.textContent = data.location;
      location.appendChild(span);
    }

    // Update Directions button link
    if (directionsBtn) {
      directionsBtn.href = data.directionsUrl;
    }

    // Update Small "Book Free Trial" WhatsApp button link
    if (bookTrialBtn) {
      const encodedMsg = encodeURIComponent(data.waMessage);
      bookTrialBtn.href = `https://wa.me/919625573511?text=${encodedMsg}`;
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      updateCenterView(index);
    });
  });

  // Initial call for first center
  updateCenterView(0);
}

/* --------------------------------------------------------------------------
   12. Instagram Reels Carousel & Play / Stop Inline Embed Player
   -------------------------------------------------------------------------- */
function initInstagramReelsCarousel() {
  const track = document.getElementById('reelsTrack');
  const prevBtn = document.getElementById('reelPrevBtn');
  const nextBtn = document.getElementById('reelNextBtn');
  const reelCards = document.querySelectorAll('.reel-card-item');

  if (!track) return;

  let autoScrollTimer = null;
  let isVideoPlaying = false;

  function stopAllReels() {
    reelCards.forEach(c => {
      const reelId = c.getAttribute('data-reel-id');
      const container = document.getElementById(`reelContainer-${reelId}`);
      const badge = c.querySelector('.reel-status-badge');

      if (container) {
        container.innerHTML = '';
        container.classList.remove('active');
      }
      c.classList.remove('playing');
      if (badge) badge.textContent = 'READY';
    });
    isVideoPlaying = false;
  }

  // Handle Play / Stop on Click
  reelCards.forEach(card => {
    const reelId = card.getAttribute('data-reel-id');
    const container = document.getElementById(`reelContainer-${reelId}`);
    const badge = card.querySelector('.reel-status-badge');

    card.addEventListener('click', (e) => {
      // Don't trigger if clicked directly on Instagram link
      if (e.target.closest('.instagram-icon-badge')) return;

      if (!container || !reelId) return;

      if (container.classList.contains('active')) {
        // Stop playing
        container.innerHTML = '';
        container.classList.remove('active');
        card.classList.remove('playing');
        if (badge) badge.textContent = 'STOPPED ❚❚';
        isVideoPlaying = false;
        scheduleAutoScrollResume();
      } else {
        // Start playing
        stopAllReels();

        container.innerHTML = `
          <div class="reel-close-bar" title="Close Reel Player">✕ CLOSE REEL</div>
          <iframe src="https://www.instagram.com/reel/${reelId}/embed/"
                  width="100%"
                  height="100%"
                  frameborder="0"
                  scrolling="no"
                  allowtransparency="true"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share">
          </iframe>
        `;
        container.classList.add('active');
        card.classList.add('playing');
        if (badge) badge.textContent = 'PLAYING ▶';
        isVideoPlaying = true;
        stopAutoScroll();

        // Close button listener
        const closeBtn = container.querySelector('.reel-close-bar');
        if (closeBtn) {
          closeBtn.addEventListener('click', (evt) => {
            evt.stopPropagation();
            container.innerHTML = '';
            container.classList.remove('active');
            card.classList.remove('playing');
            if (badge) badge.textContent = 'STOPPED ❚❚';
            isVideoPlaying = false;
            scheduleAutoScrollResume();
          });
        }
      }
    });
  });

  // Carousel Arrow Controls
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -340, behavior: 'smooth' });
      resetAutoScroll();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: 340, behavior: 'smooth' });
      resetAutoScroll();
    });
  }

  // Auto-scroll logic with auto-resume delay
  function startAutoScroll() {
    if (autoScrollTimer || isVideoPlaying) return;
    autoScrollTimer = setInterval(() => {
      if (isVideoPlaying) return;
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: 340, behavior: 'smooth' });
      }
    }, 4500);
  }

  function stopAutoScroll() {
    if (autoScrollTimer) {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
  }

  function scheduleAutoScrollResume() {
    stopAutoScroll();
    setTimeout(() => {
      if (!isVideoPlaying) {
        startAutoScroll();
      }
    }, 3500);
  }

  function resetAutoScroll() {
    stopAutoScroll();
    scheduleAutoScrollResume();
  }

  track.addEventListener('mouseenter', stopAutoScroll);
  track.addEventListener('mouseleave', () => {
    if (!isVideoPlaying) scheduleAutoScrollResume();
  });

  // Start auto-scroll initially
  startAutoScroll();
}

// Main Application JavaScript for GAmOn Hero Section
import { initNeuralNoise } from './neural-noise.js';

/* Initialize all modules when DOM is ready */
document.addEventListener('DOMContentLoaded', () => {
  initNeuralNoise();
  initScrollDrivenBlur();
  initMobileMenu();
  initGridSpotlight();
  initFacilitiesCarousel();
  initSearchModal();
  initAudioAmbience();
  initSmoothInteractions();
  initParallaxMotion();
  initScrollReveals();
  initFootballCursor();
  initTypewriter();
  initPathwayScrollAnimation();
  initCentersHub();
  initInstagramReelsCarousel();
});
