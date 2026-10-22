/**
 * Coach Portal Page Logic
 * Gurukul Football Academy
 */
import { initNeuralNoise } from './neural-noise.js';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxX5BUYfTEyxT1Q6u_oNhCihi3YNL2BTxiI7FGnhozZwRKlgVOYEI1zgUmVNp_Ike2GeA/exec';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Neural Noise Background
  try {
    initNeuralNoise();
  } catch (err) {
    console.warn('Neural noise canvas init warning:', err);
  }

  // 2. Initialize Custom Football Cursor
  initCustomCursor();

  // 3. Initialize Coach Portal Features
  initCoachPortal();
});

/* --------------------------------------------------------------------------
   Custom Football Cursor Implementation
   -------------------------------------------------------------------------- */
function initCustomCursor() {
  const ball = document.getElementById('footballCursorBall');
  const ring = document.getElementById('footballCursorRing');

  if (!ball || !ring) return;

  if (window.matchMedia('(pointer: coarse)').matches) {
    ball.style.display = 'none';
    ring.style.display = 'none';
    return;
  }

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
    ballX += (mouseX - ballX) * 0.22;
    ballY += (mouseY - ballY) * 0.22;
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;

    ball.style.transform = `translate3d(${ballX - 10}px, ${ballY - 10}px, 0)`;
    ring.style.transform = `translate3d(${ringX - 18}px, ${ringY - 18}px, 0)`;

    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);
}

/* --------------------------------------------------------------------------
   Coach Portal Interactive Controls
   -------------------------------------------------------------------------- */
function initCoachPortal() {
  const iframe = document.getElementById('coachAppFrame');
  const frameWrapper = document.getElementById('coachFrameWrapper');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnReload = document.getElementById('btnReloadFrame');
  const btnCopyLink = document.getElementById('btnCopyLink');
  const toastEl = document.getElementById('coachToast');

  // Reload iframe
  if (btnReload && iframe) {
    btnReload.addEventListener('click', () => {
      iframe.src = SCRIPT_URL;
      showToast('Reloading coach application...');
    });
  }

  // Fullscreen toggle for frame container
  if (btnFullscreen && frameWrapper) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        frameWrapper.requestFullscreen().catch(() => {
          frameWrapper.classList.toggle('frame-expanded');
        });
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const isFs = !!document.fullscreenElement;
      frameWrapper.classList.toggle('is-fullscreen', isFs);
      btnFullscreen.innerHTML = isFs
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg><span>Exit Fullscreen</span>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg><span>Fullscreen</span>`;
    });
  }

  // Copy app link
  if (btnCopyLink) {
    btnCopyLink.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(SCRIPT_URL);
        showToast('Direct app URL copied to clipboard!');
      } catch (e) {
        showToast('App URL: ' + SCRIPT_URL);
      }
    });
  }

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3000);
  }
}
