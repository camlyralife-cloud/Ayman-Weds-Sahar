const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

const intro = document.getElementById('intro');
const introVideo = document.getElementById('introVideo');
const site = document.getElementById('site');
const curtain = document.getElementById('curtain');
let opened = false;
let revealed = false;

function revealSite() {
  if (revealed) return;
  revealed = true;

  intro.classList.add('fade-out');
  site.hidden = false;

  const canCinematic = curtain && !prefersReducedMotion && typeof gsap !== 'undefined';

  if (!canCinematic) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => site.classList.add('visible'));
    });
    setTimeout(() => {
      document.body.style.overflow = '';
      intro.remove();
      if (curtain) curtain.remove();
    }, 950);
    return;
  }

  const leftPanel = curtain.querySelector('.curtain-panel.left');
  const rightPanel = curtain.querySelector('.curtain-panel.right');
  const glow = curtain.querySelector('.curtain-glow');
  const particles = curtain.querySelectorAll('.curtain-particles span');

  curtain.hidden = false;
  gsap.set([leftPanel, rightPanel], { rotationY: 0, x: '0%', opacity: 1, filter: 'blur(0px)' });
  gsap.set(glow, { opacity: 0 });
  gsap.set(particles, { opacity: 0 });

  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    onComplete: () => {
      document.body.style.overflow = '';
      intro.remove();
      curtain.remove();
    },
  });

  tl.to(glow, { opacity: 0.9, duration: 0.5 }, 0)
    .to(particles, { opacity: 0.85, duration: 0.6, stagger: 0.06 }, 0.15)
    .to(leftPanel, { rotationY: -24, x: '-8%', filter: 'blur(3px)', opacity: 0, duration: 1.6 }, 0.2)
    .to(rightPanel, { rotationY: 24, x: '8%', filter: 'blur(3px)', opacity: 0, duration: 1.6 }, 0.2)
    .call(() => site.classList.add('visible'), [], 0.6)
    .to(glow, { opacity: 0, duration: 0.7 }, 1.6)
    .to(particles, { opacity: 0, duration: 0.6, stagger: 0.03 }, 1.6)
    .to(curtain, { opacity: 0, duration: 0.5 }, 2.0);
}

document.body.style.overflow = 'hidden';

if (intro && introVideo && site) {
  intro.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    intro.classList.add('playing');
    introVideo.muted = false;
    introVideo.play().catch(() => {
      introVideo.muted = true;
      introVideo.play().catch(() => revealSite());
    });
  });

  introVideo.addEventListener('ended', revealSite);
  introVideo.addEventListener('error', revealSite);
} else if (site) {
  site.hidden = false;
  site.classList.add('visible');
  document.body.style.overflow = '';
}

const scrollProgress = document.getElementById('scrollProgress');
const heroParallax = document.getElementById('heroParallax');
const timelineTrack = document.getElementById('timelineTrack');
const timelineFill = document.getElementById('timelineFill');
const timelineDots = document.querySelectorAll('.timeline-dot');
const timelineRows = document.querySelectorAll('.timeline-row');

const wasReached = new Array(timelineDots.length).fill(false);

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
    const dotRect = dot.getBoundingClientRect();
    const dotOffset = dotRect.top + dotRect.height / 2 - rect.top;
    const reached = fillPx >= dotOffset;
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

function onScroll() {
  if (scrollProgress) {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  if (heroParallax && !prefersReducedMotion) {
    const offset = Math.min(window.scrollY * 0.08, 40);
    heroParallax.style.transform = `translateY(${offset}px)`;
  }

  updateTimelineFill();
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

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
