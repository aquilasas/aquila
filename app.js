/* AQUILA — interacciones
   1. Título hero: el peso de cada letra responde a la cercanía del mouse.
   2. Tarjetas con tilt 3D + brillo que sigue el cursor.
   3. Reveal progresivo, nav con fondo al scrollear, marquee infinito.
   4. Parallax: capas de fondo que se desplazan a distinta velocidad.
*/

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

/* ── 1. Peso variable por proximidad en el título ── */
const heroTitle = document.getElementById('heroTitle');
if (heroTitle) {
  const text = heroTitle.textContent;
  heroTitle.textContent = '';
  const chars = [];
  // Agrupar por palabra para que el quiebre de línea sea correcto
  for (const [i, word] of text.split(' ').entries()) {
    if (i > 0) heroTitle.appendChild(document.createTextNode(' '));
    const wordSpan = document.createElement('span');
    wordSpan.className = 'word';
    for (const ch of word) {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = ch;
      wordSpan.appendChild(span);
      chars.push(span);
    }
    heroTitle.appendChild(wordSpan);
  }

  if (!prefersReducedMotion && !isCoarsePointer) {
    const RADIUS = 140;      // px de influencia del cursor
    const BASE = 380, PEAK = 900;
    let mouseX = -9999, mouseY = -9999;
    let rafPending = false;

    const update = () => {
      rafPending = false;
      for (const span of chars) {
        const r = span.getBoundingClientRect();
        const dx = r.left + r.width / 2 - mouseX;
        const dy = r.top + r.height / 2 - mouseY;
        const dist = Math.hypot(dx, dy);
        const t = Math.max(0, 1 - dist / RADIUS);
        const eased = t * t * (3 - 2 * t); // smoothstep
        span.style.setProperty('--w', Math.round(BASE + (PEAK - BASE) * eased));
      }
    };

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
  }
}

/* ── 2. Tilt 3D + brillo en tarjetas y placa ── */
if (!prefersReducedMotion && !isCoarsePointer) {
  const MAX_TILT = 5; // grados
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.transform =
        `perspective(900px) rotateX(${(0.5 - py) * MAX_TILT}deg) rotateY(${(px - 0.5) * MAX_TILT}deg)`;
      el.style.setProperty('--gx', `${px * 100}%`);
      el.style.setProperty('--gy', `${py * 100}%`);
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

/* ── 3. Reveal progresivo al bajar ── */
/* Cada grupo con [data-stagger] reparte un retardo incremental entre sus hijos,
   así los elementos van apareciendo de a uno en lugar de todos de golpe. */
const STEP = 90; // ms entre un elemento y el siguiente
document.querySelectorAll('[data-stagger]').forEach((group) => {
  [...group.children].forEach((child, i) => {
    child.classList.add('reveal');
    child.style.setProperty('--d', `${i * STEP}ms`);
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  }
}, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* Nav: fondo de vidrio al scrollear */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* Menú mobile */
const burger = document.getElementById('burger');
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('menu-open');
  burger.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('.nav-links a').forEach((a) =>
  a.addEventListener('click', () => {
    nav.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
  })
);

/* Marquee: duplicar el contenido para el loop infinito */
const track = document.getElementById('marqueeTrack');
track.innerHTML += track.innerHTML;

/* ── 4. Parallax ── */
/* Cada [data-parallax] se desplaza en vertical una fracción de lo que se
   scrollea: valores positivos lo hacen ir más lento que la página (queda
   "atrás") y negativos, más rápido. El desplazamiento se publica en --py
   y el transform vive en el CSS, así no pisamos otras transformaciones. */
const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
if (parallaxEls.length && !prefersReducedMotion) {
  let parallaxPending = false;

  const applyParallax = () => {
    parallaxPending = false;
    const vh = window.innerHeight;
    for (const el of parallaxEls) {
      const r = el.getBoundingClientRect();
      // -1 cuando el elemento asoma por abajo, 0 al centro, 1 al salir por arriba
      const progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      const shift = progress * parseFloat(el.dataset.parallax) * 100;
      el.style.setProperty('--py', `${shift.toFixed(1)}px`);
    }
  };

  const onParallax = () => {
    if (!parallaxPending) {
      parallaxPending = true;
      requestAnimationFrame(applyParallax);
    }
  };

  window.addEventListener('scroll', onParallax, { passive: true });
  window.addEventListener('resize', onParallax, { passive: true });
  applyParallax();
}

/* Nav: resaltar la sección visible */
const navAnchors = [...nav.querySelectorAll('.nav-links a')];
const linkFor = (id) => navAnchors.find((a) => a.getAttribute('href') === `#${id}`);
const spyObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const link = linkFor(entry.target.id);
    if (link) link.classList.toggle('active', entry.isIntersecting);
  }
}, { rootMargin: '-35% 0px -55% 0px' });
['areas', 'leasing', 'equipo'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) spyObserver.observe(el);
});

/* Año en el footer */
document.getElementById('year').textContent = new Date().getFullYear();
