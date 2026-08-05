const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const musicStateKey = 'wedding-bg-music-state-v1';
const audioEl = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
const musicAudioSrc = 'Assests/music.mp4';
let userInteracted = false;
let musicReady = false;
let musicEnabled = true;

function readMusicState() {
  try {
    const saved = window.sessionStorage.getItem(musicStateKey);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function persistMusicState() {
  try {
    window.sessionStorage.setItem(
      musicStateKey,
      JSON.stringify({
        enabled: musicEnabled,
        userInteracted,
        started: musicReady,
      })
    );
  } catch {
    // Ignore storage errors and continue gracefully.
  }
}

function updateMusicToggle() {
  if (!musicToggle || !audioEl) return;
  const isMuted = audioEl.muted || !musicEnabled;
  musicToggle.setAttribute('aria-pressed', String(isMuted));
  musicToggle.title = isMuted ? 'Unmute background music' : 'Mute background music';
  musicToggle.classList.toggle('is-muted', isMuted);
}

function stopMusic() {
  if (!audioEl) return;
  audioEl.pause();
  musicReady = false;
  persistMusicState();
}

function startMusic({ force = false } = {}) {
  if (!audioEl) return;

  if (!force && !userInteracted) return;
  if (!musicEnabled) return;

  if (!audioEl.src) {
    audioEl.src = musicAudioSrc;
  }

  if (audioEl.currentTime > 0 && !audioEl.paused) {
    musicReady = true;
    persistMusicState();
    return;
  }

  const playPromise = audioEl.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise
      .then(() => {
        musicReady = true;
        persistMusicState();
      })
      .catch(() => {
        musicReady = false;
        persistMusicState();
      });
  } else {
    musicReady = true;
    persistMusicState();
  }
}

function enableMusicFromInteraction() {
  if (userInteracted) return;
  userInteracted = true;
  musicEnabled = true;
  audioEl.muted = false;
  updateMusicToggle();
  startMusic({ force: true });
  persistMusicState();
}

function toggleMusic() {
  if (!audioEl) return;
  musicEnabled = !musicEnabled;
  audioEl.muted = !musicEnabled;
  updateMusicToggle();
  persistMusicState();

  if (musicEnabled && userInteracted) {
    startMusic({ force: true });
  } else {
    audioEl.pause();
  }
}

if (audioEl) {
  audioEl.loop = true;
  audioEl.setAttribute('playsinline', 'true');

  // Start buffering the music immediately (not deferred to idle). On slow
  // mobile networks, waiting until the user's tap to even begin fetching
  // audio data means playback can't start fast enough to stay inside the
  // browser's "trusted gesture" window, so .play() silently fails. The file
  // is small (~2.5MB) and audio is core to the experience, so we trade a
  // little upfront bandwidth for reliable playback on the first tap.
  audioEl.src = musicAudioSrc;
  audioEl.preload = 'auto';
  audioEl.load();

  const savedState = readMusicState();
  if (savedState) {
    musicEnabled = savedState.enabled !== false;
    userInteracted = Boolean(savedState.userInteracted);
  }

  audioEl.addEventListener('play', () => {
    musicReady = true;
    persistMusicState();
  });

  audioEl.addEventListener('pause', () => {
    if (!document.hidden && musicEnabled && userInteracted) {
      startMusic({ force: true });
    }
  });

  audioEl.addEventListener('ended', () => {
    if (audioEl.loop) {
      audioEl.currentTime = 0;
      startMusic({ force: true });
    }
  });

  // Multiple gesture types as fallbacks — mobile browsers vary in which
  // event they treat as a "trusted" gesture for unlocking audio playback.
  document.addEventListener('pointerdown', enableMusicFromInteraction, { once: true, passive: true });
  document.addEventListener('touchstart', enableMusicFromInteraction, { once: true, passive: true });
  document.addEventListener('touchend', enableMusicFromInteraction, { once: true, passive: true });
  document.addEventListener('click', enableMusicFromInteraction, { once: true });
  document.addEventListener('keydown', enableMusicFromInteraction, { once: true });

  if (musicToggle) {
    musicToggle.addEventListener('click', toggleMusic);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stopMusic();
    } else if (userInteracted && musicEnabled) {
      startMusic({ force: true });
    }
  });

  window.addEventListener('pagehide', stopMusic);
  window.addEventListener('beforeunload', stopMusic);

  updateMusicToggle();
  persistMusicState();

  // Best-effort: try playing immediately on page load, before any tap.
  // Most mobile browsers block this and the .catch() below is expected —
  // the gesture listeners above are the real, reliable trigger. But some
  // browsers (desktop, or returning visitors with site engagement) do allow
  // it, so we attempt it for free instead of always waiting for a tap.
  startMusic({ force: true });
}

const weddingDate = new Date('2026-09-19T19:30:00').getTime();

function setCountdownValue(id, value) {
  const el = document.getElementById(id);
  const formatted = String(value).padStart(2, '0');
  if (el.textContent === formatted) return;
  el.textContent = formatted;
  el.classList.remove('tick');
  void el.offsetWidth;
  el.classList.add('tick');
}

function updateCountdown() {
  const now = new Date().getTime();
  const difference = weddingDate - now;

  if (difference <= 0) {
    setCountdownValue('days', 0);
    setCountdownValue('hours', 0);
    setCountdownValue('minutes', 0);
    setCountdownValue('seconds', 0);
    return;
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  setCountdownValue('days', days);
  setCountdownValue('hours', hours);
  setCountdownValue('minutes', minutes);
  setCountdownValue('seconds', seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);

const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealElements.forEach((el) => revealObserver.observe(el));

const heroVideo = document.getElementById('heroVideo');
const heroSection = document.getElementById('home');
const content = document.getElementById('content');
const tapHint = document.getElementById('tapHint');
let opened = false;
let unlocked = false;

function unlockSite() {
  if (unlocked) return;
  unlocked = true;
  if (content) content.hidden = false;
  document.body.classList.add('opened');
  document.body.style.overflow = '';
}

document.body.style.overflow = 'hidden';

if (heroVideo && heroSection && content) {
  heroSection.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    if (tapHint) tapHint.classList.add('is-hidden');
    // Video stays muted permanently — music.mp4 is the only audio. Called
    // directly here (not just via the document-level listeners) so it's
    // guaranteed to run synchronously within this exact trusted gesture.
    if (typeof enableMusicFromInteraction === 'function') {
      enableMusicFromInteraction();
    }
    heroVideo.muted = true;
    heroVideo.play().catch(() => unlockSite());
  });

  heroVideo.addEventListener('ended', unlockSite);
  heroVideo.addEventListener('error', unlockSite);
} else {
  unlockSite();
}

const scrollProgress = document.getElementById('scrollProgress');
const timelineTrack = document.getElementById('timelineTrack');
const timelineFill = document.getElementById('timelineFill');
const timelineDots = document.querySelectorAll('.timeline-dot');
const timelineRows = document.querySelectorAll('.timeline-row');

const wasReached = new Array(timelineDots.length).fill(false);
let dotOffsets = [];

function measureDotOffsets() {
  if (!timelineTrack) return;
  const trackRect = timelineTrack.getBoundingClientRect();
  const trackTop = trackRect.top + window.scrollY;
  dotOffsets = Array.from(timelineDots).map((dot) => {
    const dotRect = dot.getBoundingClientRect();
    return dotRect.top + window.scrollY + dotRect.height / 2 - trackTop;
  });
}

function updateTimelineFill() {
  if (!timelineTrack || !timelineFill) return;

  const rect = timelineTrack.getBoundingClientRect();
  const readingLine = window.innerHeight * 0.62;
  const progress = prefersReducedMotion
    ? 1
    : Math.min(1, Math.max(0, (readingLine - rect.top) / rect.height));
  const fillPx = progress * rect.height;

  timelineFill.style.height = `${fillPx}px`;

  let lastReachedIndex = -1;
  const reachedStates = [];

  timelineDots.forEach((dot, i) => {
    const reached = fillPx >= (dotOffsets[i] ?? 0);
    reachedStates.push(reached);
    if (reached) lastReachedIndex = i;

    if (reached && !wasReached[i] && !prefersReducedMotion) {
      dot.classList.remove('ripple');
      void dot.offsetWidth;
      dot.classList.add('ripple');
    }
    wasReached[i] = reached;

    dot.classList.toggle('reached', reached);
  });

  reachedStates.forEach((reached, i) => {
    const row = timelineRows[i];
    const dot = timelineDots[i];
    if (!row || !dot) return;

    const isActive = reached && i === lastReachedIndex;
    row.classList.toggle('active', isActive);
    row.classList.toggle('passed', reached && !isActive);
    row.classList.toggle('reached', reached);
    dot.classList.toggle('active', isActive);
  });
}

let scrollTicking = false;

function handleScrollWork() {
  if (scrollProgress) {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  updateTimelineFill();
  scrollTicking = false;
}

function onScroll() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(handleScrollWork);
}

window.addEventListener('scroll', onScroll, { passive: true });

let resizeTimer;
window.addEventListener(
  'resize',
  () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      measureDotOffsets();
      handleScrollWork();
    }, 150);
  },
  { passive: true }
);

measureDotOffsets();
handleScrollWork();

timelineDots.forEach((dot) => {
  dot.addEventListener('animationend', (event) => {
    if (event.animationName === 'dotRipple') dot.classList.remove('ripple');
  });
});

if (!prefersReducedMotion) {
  document.addEventListener('click', (event) => {
    const fx = document.createElement('span');
    fx.className = 'click-fx';
    fx.style.left = `${event.clientX}px`;
    fx.style.top = `${event.clientY}px`;
    document.body.appendChild(fx);
    fx.addEventListener('animationend', () => fx.remove());
  });
}
