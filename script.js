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
let opened = false;

function revealSite() {
  intro.classList.add('fade-out');
  site.hidden = false;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => site.classList.add('visible'));
  });
  setTimeout(() => {
    document.body.style.overflow = '';
    intro.remove();
  }, 950);
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

function onScroll() {
  if (scrollProgress) {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  if (heroParallax) {
    const offset = Math.min(window.scrollY * 0.08, 40);
    heroParallax.style.transform = `translateY(${offset}px)`;
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

document.addEventListener('click', (event) => {
  const fx = document.createElement('span');
  fx.className = 'click-fx';
  fx.style.left = `${event.clientX}px`;
  fx.style.top = `${event.clientY}px`;
  document.body.appendChild(fx);
  fx.addEventListener('animationend', () => fx.remove());
});
