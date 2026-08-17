import { getPublishedPosts, getPostBySlug, getPostById, onBlogUpdate, renderMarkdown } from './blogService.js';

let currentCategory = 'ALL';
let searchQuery = '';
let activePost = null;

document.addEventListener('DOMContentLoaded', () => {
  initBlogPage();
  initCustomCursor();
  initMobileMenu();
  setupDeepLinking();

  // Listen to real-time updates from Content Writer Admin!
  onBlogUpdate(() => {
    renderBlog();
    if (activePost) {
      const refreshed = getPostById(activePost.id) || getPostBySlug(activePost.slug);
      if (refreshed && refreshed.status === 'published') {
        openReaderModal(refreshed, false);
      }
    }
  });
});

function initBlogPage() {
  const searchInput = document.getElementById('blogSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const pills = document.querySelectorAll('.cat-pill');
  const resetBtn = document.getElementById('resetFiltersBtn');

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      if (clearBtn) {
        clearBtn.style.display = searchQuery ? 'block' : 'none';
      }
      renderBlog();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchQuery = '';
        clearBtn.style.display = 'none';
        renderBlog();
      }
    });
  }

  // Category pill handlers
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.dataset.category || 'ALL';
      renderBlog();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentCategory = 'ALL';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.style.display = 'none';
      pills.forEach(p => {
        p.classList.toggle('active', (p.dataset.category || '').toUpperCase() === 'ALL');
      });
      renderBlog();
    });
  }

  // Reader Modal controls
  const modal = document.getElementById('articleReaderModal');
  const overlay = document.getElementById('readerOverlay');
  const closeBtn = document.getElementById('readerCloseBtn');
  const backBtn = document.getElementById('readerBackBtn');
  const shareBtn = document.getElementById('readerShareBtn');

  if (overlay) overlay.addEventListener('click', closeReaderModal);
  if (closeBtn) closeBtn.addEventListener('click', closeReaderModal);
  if (backBtn) backBtn.addEventListener('click', closeReaderModal);
  if (shareBtn) shareBtn.addEventListener('click', handleShare);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeReaderModal();
    }
  });

  renderBlog();
}

function renderBlog() {
  const allPosts = getPublishedPosts();

  // Filter posts
  const filtered = allPosts.filter(post => {
    const isAll = currentCategory.toUpperCase() === 'ALL';
    const matchCategory = isAll || (post.category && post.category.toLowerCase() === currentCategory.toLowerCase());
    const matchSearch = !searchQuery ||
      (post.title && post.title.toLowerCase().includes(searchQuery)) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery)) ||
      (post.author?.name && post.author.name.toLowerCase().includes(searchQuery)) ||
      (post.tag && post.tag.toLowerCase().includes(searchQuery));
    return matchCategory && matchSearch;
  });

  // Spotlight post (Featured post or first post when looking at ALL without search)
  const spotlightSection = document.getElementById('spotlightSection');
  if (spotlightSection) {
    const isAll = currentCategory.toUpperCase() === 'ALL';
    if (isAll && !searchQuery && filtered.length > 0) {
      const spotlightPost = filtered.find(p => p.featured) || filtered[0];
      spotlightSection.innerHTML = createSpotlightHTML(spotlightPost);
      spotlightSection.style.display = 'block';

      // Attach click to spotlight card
      const spotlightCard = spotlightSection.querySelector('.spotlight-card');
      if (spotlightCard) {
        spotlightCard.addEventListener('click', () => openReaderModal(spotlightPost));
      }
    } else {
      spotlightSection.style.display = 'none';
      spotlightSection.innerHTML = '';
    }
  }

  // Render Grid
  const grid = document.getElementById('articlesGrid');
  const emptyState = document.getElementById('noArticlesState');
  const postCountBadge = document.getElementById('articleCountBadge');
  const gridHeading = document.getElementById('feedHeading');

  if (gridHeading) {
    const isAll = currentCategory.toUpperCase() === 'ALL';
    gridHeading.textContent = isAll ? (searchQuery ? 'SEARCH RESULTS' : 'LATEST ACADEMY ARTICLES') : `${currentCategory.toUpperCase()} ARTICLES`;
  }

  if (postCountBadge) {
    postCountBadge.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? 'Story' : 'Stories'}`;
  }

  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // If showing spotlight on ALL view, exclude it from main grid to avoid visual redundancy
  let gridPosts = filtered;
  const isAll = currentCategory.toUpperCase() === 'ALL';
  if (isAll && !searchQuery && filtered.length > 1) {
    const spotlightPost = filtered.find(p => p.featured) || filtered[0];
    gridPosts = filtered.filter(p => p.id !== spotlightPost.id);
  }

  grid.innerHTML = gridPosts.map(post => createGridCardHTML(post)).join('');

  // Attach click listeners to cards
  grid.querySelectorAll('.blog-article-card').forEach(card => {
    const postId = card.dataset.id;
    card.addEventListener('click', () => {
      const post = getPostById(postId);
      if (post) openReaderModal(post);
    });
  });
}

function createSpotlightHTML(post) {
  return `
    <div class="spotlight-card" data-id="${post.id}">
      <div class="spotlight-image-container">
        <img src="${post.image}" alt="${escapeHTML(post.title)}" class="spotlight-img" loading="lazy" onerror="this.src='/assets/adivision1.png'" />
        <div class="spotlight-overlay"></div>
        <div class="spotlight-badge-row">
          <span class="spotlight-pill">⭐ FEATURED STORY</span>
          <span class="spotlight-category">${escapeHTML(post.category)}</span>
        </div>
      </div>
      <div class="spotlight-content">
        <div class="spotlight-meta-top">
          <span class="meta-date">${escapeHTML(post.date)}</span>
          <span class="meta-dot">•</span>
          <span class="meta-read-time">${escapeHTML(post.readTime)}</span>
        </div>
        <h2 class="spotlight-title">${escapeHTML(post.title)}</h2>
        <p class="spotlight-excerpt">${escapeHTML(post.excerpt)}</p>
        
        <div class="spotlight-footer">
          <div class="spotlight-author">
            <img src="${post.author?.avatar || '/assets/gurukul-logo.png'}" alt="${escapeHTML(post.author?.name || 'Author')}" class="author-avatar" />
            <div class="author-info">
              <span class="author-name">${escapeHTML(post.author?.name || 'Gurukul Staff')}</span>
              <span class="author-role">${escapeHTML(post.author?.role || 'Academy Coach')}</span>
            </div>
          </div>
          <button class="btn-read-spotlight" type="button">
            <span>Read Article</span>
            <svg class="tilted-arrow-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function createGridCardHTML(post) {
  return `
    <article class="blog-article-card" data-id="${post.id}">
      <div class="card-image-box">
        <img src="${post.image}" alt="${escapeHTML(post.title)}" class="card-post-img" loading="lazy" onerror="this.src='/assets/adivision1.png'" />
        <div class="card-img-gradient"></div>
        <div class="card-badges">
          <span class="card-category-badge">${escapeHTML(post.category)}</span>
          ${post.tag ? `<span class="card-sub-tag">${escapeHTML(post.tag)}</span>` : ''}
        </div>
      </div>
      <div class="card-body">
        <div class="card-meta-line">
          <span class="card-date">${escapeHTML(post.date)}</span>
          <span class="card-dot">•</span>
          <span class="card-read-time">${escapeHTML(post.readTime)}</span>
        </div>
        <h3 class="card-title">${escapeHTML(post.title)}</h3>
        <p class="card-excerpt">${escapeHTML(post.excerpt)}</p>
        <div class="card-bottom">
          <div class="card-author-inline">
            <img src="${post.author?.avatar || '/assets/gurukul-logo.png'}" alt="${escapeHTML(post.author?.name || 'Author')}" class="card-author-thumb" />
            <span class="card-author-name">${escapeHTML(post.author?.name || 'Gurukul Staff')}</span>
          </div>
          <span class="card-read-action">
            Read
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </span>
        </div>
      </div>
    </article>
  `;
}

function openReaderModal(post, updateHistory = true) {
  activePost = post;
  const modal = document.getElementById('articleReaderModal');
  const container = document.getElementById('readerContentContainer');
  if (!modal || !container) return;

  const renderedHTML = renderMarkdown(post.content);

  // Related posts (same category or others)
  const allPublished = getPublishedPosts();
  const relatedPosts = allPublished
    .filter(p => p.id !== post.id)
    .slice(0, 3);

  container.innerHTML = `
    <article class="reader-article">
      <div class="reader-hero-header">
        <div class="reader-badge-row">
          <span class="reader-category-pill">${escapeHTML(post.category)}</span>
          ${post.tag ? `<span class="reader-tag-pill">${escapeHTML(post.tag)}</span>` : ''}
          <span class="reader-read-time-pill">⏱️ ${escapeHTML(post.readTime)}</span>
        </div>
        <h1 class="reader-title">${escapeHTML(post.title)}</h1>
        <div class="reader-meta-author-row">
          <div class="reader-author-box">
            <img src="${post.author?.avatar || '/assets/gurukul-logo.png'}" alt="${escapeHTML(post.author?.name || 'Author')}" class="reader-author-avatar" />
            <div>
              <div class="reader-author-name">${escapeHTML(post.author?.name || 'Gurukul Staff')}</div>
              <div class="reader-author-role">${escapeHTML(post.author?.role || 'Academy Coach')}</div>
            </div>
          </div>
          <div class="reader-publish-date">Published on ${escapeHTML(post.date)}</div>
        </div>
      </div>

      <div class="reader-featured-media">
        <img src="${post.image}" alt="${escapeHTML(post.title)}" class="reader-main-img" onerror="this.src='/assets/adivision1.png'" />
      </div>

      <div class="reader-body-content">
        ${renderedHTML}
      </div>

      <div class="reader-author-bio-card">
        <img src="${post.author?.avatar || '/assets/gurukul-logo.png'}" alt="${escapeHTML(post.author?.name || 'Author')}" class="bio-avatar" />
        <div class="bio-text">
          <h4>Written by ${escapeHTML(post.author?.name || 'Gurukul Staff')}</h4>
          <p>${escapeHTML(post.author?.role || 'Elite Youth Development Staff at Gurukul Football Academy.')}</p>
        </div>
      </div>

      ${relatedPosts.length > 0 ? `
        <div class="reader-related-section">
          <h3 class="related-heading">MORE TACTICAL STORIES</h3>
          <div class="related-grid">
            ${relatedPosts.map(p => `
              <div class="related-card" data-id="${p.id}">
                <img src="${p.image}" alt="${escapeHTML(p.title)}" class="related-thumb" onerror="this.src='/assets/adivision1.png'" />
                <div class="related-info">
                  <span class="related-cat">${escapeHTML(p.category)}</span>
                  <h4 class="related-title">${escapeHTML(p.title)}</h4>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </article>
  `;

  // Attach click listeners to related cards
  container.querySelectorAll('.related-card').forEach(card => {
    card.addEventListener('click', () => {
      const p = getPostById(card.dataset.id);
      if (p) {
        container.scrollTop = 0;
        openReaderModal(p);
      }
    });
  });

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  if (updateHistory && post.slug) {
    const newUrl = `${window.location.pathname}?post=${encodeURIComponent(post.slug)}`;
    window.history.pushState({ postSlug: post.slug }, '', newUrl);
  }
}

function closeReaderModal() {
  const modal = document.getElementById('articleReaderModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  activePost = null;

  // Clean URL query param
  const cleanUrl = window.location.pathname;
  window.history.pushState({}, '', cleanUrl);
}

function handleShare() {
  if (!activePost) return;
  const shareUrl = `${window.location.origin}/blog.html?post=${encodeURIComponent(activePost.slug)}`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showShareToast('Article link copied to clipboard!');
    }).catch(() => {
      showShareToast(shareUrl);
    });
  } else {
    showShareToast(shareUrl);
  }
}

function showShareToast(msg) {
  const toast = document.getElementById('shareToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

function setupDeepLinking() {
  const urlParams = new URLSearchParams(window.location.search);
  const postSlug = urlParams.get('post');
  if (postSlug) {
    const post = getPostBySlug(postSlug);
    if (post && post.status === 'published') {
      setTimeout(() => openReaderModal(post, false), 150);
    }
  }

  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.postSlug) {
      const p = getPostBySlug(e.state.postSlug);
      if (p && p.status === 'published') {
        openReaderModal(p, false);
      }
    } else {
      closeReaderModal();
    }
  });
}

function initMobileMenu() {
  const toggle = document.getElementById('mobileMenuToggle');
  const navCapsule = document.querySelector('.nav-glass-capsule');
  if (toggle && navCapsule) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      navCapsule.classList.toggle('mobile-open');
    });
  }
}

function initCustomCursor() {
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
  });

  function renderCursor() {
    ballX += (mouseX - ballX) * 0.25;
    ballY += (mouseY - ballY) * 0.25;
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;

    ball.style.transform = `translate3d(${ballX - 12}px, ${ballY - 12}px, 0)`;
    ring.style.transform = `translate3d(${ringX - 22}px, ${ringY - 22}px, 0)`;

    requestAnimationFrame(renderCursor);
  }

  renderCursor();
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
