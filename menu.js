'use strict';

// Explicit anchor navigation uses one cancellable timeline, including when the
// operating system disables decorative animation. Wheel/touch input stays native.
let anchorScroll = null;
const cancelAnchorScroll = () => {
  if (anchorScroll) window.cancelAnimationFrame(anchorScroll.frame);
  anchorScroll = null;
};

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
  if (!link || link.hasAttribute('download')) return;
  const hash = link.getAttribute('href');
  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  event.preventDefault();
  cancelAnchorScroll();
  const startY = window.scrollY;
  const destination = () => Math.max(0, Math.min(
    document.documentElement.scrollHeight - window.innerHeight,
    target.getBoundingClientRect().top + window.scrollY - 24
  ));
  const distance = Math.abs(destination() - startY);
  const duration = Math.min(1600, Math.max(650, 600 + Math.sqrt(distance) * 12));
  const state = { frame: null, start: performance.now() };
  anchorScroll = state;

  const tick = (now) => {
    if (anchorScroll !== state) return;
    const progress = Math.min(1, (now - state.start) / duration);
    const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    window.scrollTo({ top: startY + (destination() - startY) * eased, behavior: 'instant' });
    if (progress < 1) state.frame = window.requestAnimationFrame(tick);
    else {
      anchorScroll = null;
      if (location.hash !== hash) history.pushState(null, '', hash);
      const temporaryTabIndex = !target.hasAttribute('tabindex');
      if (temporaryTabIndex) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (temporaryTabIndex) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
  };
  state.frame = window.requestAnimationFrame(tick);
});

window.addEventListener('wheel', cancelAnchorScroll, { passive: true });
window.addEventListener('touchstart', cancelAnchorScroll, { passive: true });
window.addEventListener('pointerdown', cancelAnchorScroll, { passive: true });
document.addEventListener('keydown', (event) => {
  if (['Escape', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancelAnchorScroll();
});

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');

if (menuButton && navigation) {
  const mobileViewport = window.matchMedia('(max-width: 800px)');

  const setMenuOpen = (open) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    navigation.classList.toggle('is-open', open);
    navigation.inert = mobileViewport.matches && !open;
  };

  const syncViewport = () => {
    const focusWasInMenu = navigation.contains(document.activeElement);
    setMenuOpen(false);
    if (mobileViewport.matches && focusWasInMenu) menuButton.focus();
  };

  navigation.classList.add('js-menu');
  menuButton.hidden = false;
  menuButton.addEventListener('click', () => {
    setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  navigation.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) {
      setMenuOpen(false);
      if (mobileViewport.matches) menuButton.focus();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      menuButton.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !navigation.contains(event.target) && !menuButton.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  mobileViewport.addEventListener('change', syncViewport);
  syncViewport();
}

// Motion is progressive enhancement: content remains available without JavaScript.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const isMotionEnabled = () => !reducedMotion.matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const helloCard = document.querySelector('.hello-card');
const photoFrames = Array.from(document.querySelectorAll('.hero-photo, .about-photo'));
const revealElements = document.querySelectorAll(
  '.hero-copy, .benefit, .about-copy, .about-photo, .section-heading, ' +
  '.service-card, .price-card, .reviews > div, .contact-inner, .site-footer'
);

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  revealElements.forEach((element) => {
    element.classList.add('reveal');
    if (element.matches('.benefit, .service-card, .price-card')) {
      const index = Array.from(element.parentElement.children).indexOf(element);
      element.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 75}ms`);
    }
    revealObserver.observe(element);
  });
}

const flightStory = document.querySelector('.flight-story');
const flightScreen = document.querySelector('.flight-screen');
const worldStage = document.querySelector('.world-stage');
const flightRoute = document.querySelector('.flight-route');
const flightPlane = document.querySelector('.flight-plane');
const flightChapters = Array.from(document.querySelectorAll('.flight-chapter'));
const landingPhoto = document.querySelector('.landing-photo');
const boardingPass = document.querySelector('.boarding-pass');
const flightProgress = document.querySelector('.flight-progress-fill');
const flightStep = document.querySelector('.flight-step');
const ambientPath = document.querySelector('.ambient-path');
const ambientPlane = document.querySelector('.ambient-plane');
const ambientWord = document.querySelector('.atmosphere-word');
const contactScene = document.querySelector('.contact');
const routeLength = flightRoute ? flightRoute.getTotalLength() : 0;
const ambientLength = ambientPath ? ambientPath.getTotalLength() : 0;
const journeyState = { top: 0, distance: 1, chapter: -1, word: '', sections: [] };
if (flightStory) document.documentElement.classList.add('journey-ready');
if (flightRoute) {
  flightRoute.style.strokeDasharray = String(routeLength);
  flightRoute.style.strokeDashoffset = String(routeLength);
}

const measureJourney = () => {
  if (!flightStory || !flightScreen) return;
  const rect = flightStory.getBoundingClientRect();
  journeyState.top = rect.top + window.scrollY;
  journeyState.distance = Math.max(1, rect.height - flightScreen.offsetHeight);
  const headingContainer = document.querySelector('.flight-headings');
  if (headingContainer && flightChapters[0]) {
    flightScreen.style.setProperty('--intro-copy-end', `${headingContainer.offsetTop + flightChapters[0].offsetHeight}px`);
  }
  journeyState.sections = Array.from(document.querySelectorAll('#home, #about, #services, #prices, #reviews, #contact')).map((element) => ({
    id: element.id, top: element.getBoundingClientRect().top + window.scrollY,
  }));
};

function placePlane(plane, path, length, progress) {
  if (!plane || !path) return;
  const distance = length * progress;
  const point = path.getPointAtLength(distance);
  const before = path.getPointAtLength(Math.max(0, distance - 1));
  const after = path.getPointAtLength(Math.min(length, distance + 1));
  const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
  plane.setAttribute('transform', `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${angle.toFixed(2)})`);
}

function renderJourney(scroll, pageProgress) {
  const progress = clamp((scroll - journeyState.top) / journeyState.distance, 0, 1);
  const flight = clamp((progress - 0.06) / 0.72, 0, 1);
  const arrival = clamp((progress - 0.72) / 0.25, 0, 1);
  const easedArrival = arrival * arrival * (3 - 2 * arrival);
  if (flightRoute) flightRoute.style.strokeDashoffset = String(routeLength * (1 - flight));
  placePlane(flightPlane, flightRoute, routeLength, flight);
  if (worldStage) {
    worldStage.style.transform = `perspective(1600px) rotateX(${(9 * (1 - progress)).toFixed(2)}deg) scale(${(1 + progress * 0.28).toFixed(3)})`;
    worldStage.style.opacity = String(1 - easedArrival * 0.78);
  }
  if (landingPhoto) {
    landingPhoto.style.opacity = String(easedArrival);
    landingPhoto.style.transform = `translate3d(0,${((1 - easedArrival) * 65).toFixed(2)}px,0) scale(${(0.9 + easedArrival * 0.1).toFixed(3)})`;
  }
  if (boardingPass) {
    boardingPass.style.transform = `perspective(800px) translate3d(0,${(-progress * 18).toFixed(2)}px,0) rotateY(${(-10 + progress * 22).toFixed(2)}deg) rotateZ(${(-3 + progress * 5).toFixed(2)}deg)`;
    boardingPass.style.opacity = String(1 - easedArrival * 0.2);
  }
  if (flightProgress) flightProgress.style.transform = `scaleX(${progress})`;
  const chapter = progress < 0.28 ? 0 : progress < 0.75 ? 1 : 2;
  if (chapter !== journeyState.chapter) {
    flightChapters.forEach((element, index) => {
      element.classList.toggle('is-current', index === chapter);
      element.setAttribute('aria-hidden', String(index !== chapter));
      element.inert = index !== chapter;
    });
    if (flightScreen) flightScreen.dataset.chapter = String(chapter);
    if (flightStep) flightStep.textContent = `0${chapter + 1} / 03`;
    journeyState.chapter = chapter;
  }
  placePlane(ambientPlane, ambientPath, ambientLength, pageProgress);
  document.documentElement.style.setProperty('--ambient-shift', `${(pageProgress * -120).toFixed(1)}px`);
  document.documentElement.style.setProperty('--word-shift', `${(Math.sin(pageProgress * Math.PI * 2) * 65).toFixed(1)}px`);
  const active = journeyState.sections.filter((section) => section.top <= scroll + motionState.height * 0.55).pop();
  const words = { home: 'Hello.', about: 'Discover.', services: 'Speak.', prices: 'Your next step.', reviews: 'Together.', contact: 'Let us begin.' };
  const word = active ? words[active.id] : 'Hello.';
  if (ambientWord && word !== journeyState.word) {
    ambientWord.textContent = word;
    journeyState.word = word;
  }
  if (contactScene) contactScene.style.setProperty('--contact-orbit', `${(pageProgress * 90).toFixed(1)}px`);
}

const motionState = {
  frame: null,
  previousTime: 0,
  currentScroll: window.scrollY,
  targetScroll: window.scrollY,
  maxScroll: 1,
  height: window.innerHeight,
  photos: [],
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const renderMotion = (time) => {
  motionState.frame = null;
  if (document.hidden) return;

  // Time-based damping feels the same on 60 Hz and high-refresh displays.
  const delta = motionState.previousTime ? Math.min(time - motionState.previousTime, 64) : 16;
  motionState.previousTime = time;
  const distance = motionState.targetScroll - motionState.currentScroll;
  motionState.currentScroll += reducedMotion.matches ? distance : distance * (1 - Math.exp(-delta / 100));
  if (Math.abs(distance) < 0.1) motionState.currentScroll = motionState.targetScroll;
  const progress = clamp(motionState.currentScroll / motionState.maxScroll, 0, 1);

  renderJourney(motionState.currentScroll, progress);

  motionState.photos.forEach(({ element, top, height }) => {
    const relative = (motionState.currentScroll + motionState.height / 2 - top - height / 2) / motionState.height;
    element.style.setProperty('--photo-shift', `${(clamp(relative, -1, 1) * 12).toFixed(2)}px`);
  });
  if (helloCard) {
    const localProgress = clamp(motionState.currentScroll / motionState.height, 0, 1);
    helloCard.style.setProperty('--hello-shift', `${(-localProgress * 18).toFixed(2)}px`);
    helloCard.style.setProperty('--hello-tilt', `${(localProgress * 12).toFixed(2)}deg`);
  }

  if (Math.abs(motionState.targetScroll - motionState.currentScroll) > 0.1) scheduleMotion();
  else motionState.previousTime = 0;
};

function scheduleMotion() {
  if (motionState.frame !== null || document.hidden) return;
  motionState.frame = window.requestAnimationFrame(renderMotion);
}

const measureMotion = () => {
  motionState.height = window.innerHeight;
  motionState.maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  motionState.targetScroll = window.scrollY;
  motionState.photos = photoFrames.map((element) => {
    const rect = element.getBoundingClientRect();
    return { element, top: rect.top + window.scrollY, height: rect.height };
  });
  measureJourney();
  scheduleMotion();
};

const syncMotionPreference = () => {
  if (motionState.frame !== null) window.cancelAnimationFrame(motionState.frame);
  motionState.frame = null;
  motionState.previousTime = 0;
  motionState.currentScroll = window.scrollY;
  const enabled = isMotionEnabled();
  document.documentElement.dataset.motion = enabled ? 'on' : 'off';
  document.documentElement.classList.toggle('motion-ready', enabled && 'IntersectionObserver' in window);
  measureMotion();
};

window.addEventListener('scroll', () => {
  motionState.targetScroll = window.scrollY;
  scheduleMotion();
}, { passive: true });
window.addEventListener('resize', measureMotion, { passive: true });
window.addEventListener('load', measureMotion, { once: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && motionState.frame !== null) {
    window.cancelAnimationFrame(motionState.frame);
    motionState.frame = null;
    motionState.previousTime = 0;
  } else if (!document.hidden) measureMotion();
});
if ('ResizeObserver' in window) new ResizeObserver(measureMotion).observe(document.body);
reducedMotion.addEventListener('change', syncMotionPreference);
syncMotionPreference();

// Shallow perspective only for a precise pointer; touch scrolling stays native.
document.querySelectorAll('.service-card, .price-card').forEach((card) => {
  let bounds = null;
  const resetTilt = () => {
    bounds = null;
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
  };
  card.addEventListener('pointerenter', () => {
    if (finePointer.matches && isMotionEnabled()) bounds = card.getBoundingClientRect();
  });
  card.addEventListener('pointermove', (event) => {
    if (!bounds || !finePointer.matches || !isMotionEnabled()) return;
    const x = clamp((event.clientX - bounds.left) / bounds.width - 0.5, -0.5, 0.5);
    const y = clamp((event.clientY - bounds.top) / bounds.height - 0.5, -0.5, 0.5);
    card.style.setProperty('--tilt-x', `${(-y * 5).toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${(x * 5).toFixed(2)}deg`);
  });
  card.addEventListener('pointerleave', resetTilt);
  card.addEventListener('pointercancel', resetTilt);
  finePointer.addEventListener('change', resetTilt);
  reducedMotion.addEventListener('change', resetTilt);
});
