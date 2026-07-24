/* AQUILA — interacciones
   1. Título hero: el peso de cada letra responde a la cercanía del mouse.
   2. Tarjetas con tilt 3D + brillo que sigue el cursor.
   3. Reveal on scroll, nav con fondo al scrollear, marquee infinito.
   4. Estimador: arma un mailto con la selección del usuario.
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
  document.querySelectorAll('[data-tilt], .logo-float').forEach((el) => {
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

/* ── 3. Reveal on scroll ── */
const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  }
}, { threshold: 0.12 });
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

/* ── 4. Estimador → mailto con la selección ── */
const selection = {
  monto: 'USD 50.000',
  moneda: 'Dólar Hard',
  bien: 'Rodados',
};

const bindChips = (containerId, key) => {
  const container = document.getElementById(containerId);
  container.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      selection[key] = chip.dataset.value;
      updateCta();
    });
  });
};

const cta = document.getElementById('estimatorCta');
const updateCta = () => {
  const subject = encodeURIComponent('Consulta de cuota de leasing');
  const body = encodeURIComponent(
    `Hola, quiero consultar la cuota estimada de un leasing.\n\n` +
    `· Monto estimado: ${selection.monto}\n` +
    `· Moneda: ${selection.moneda}\n` +
    `· Tipo de bien: ${selection.bien}\n\n` +
    `Datos de contacto:\n· Empresa:\n· Teléfono:\n`
  );
  cta.href = `mailto:info@aquilasas.com?subject=${subject}&body=${body}`;
};

bindChips('chipsMonto', 'monto');
bindChips('chipsMoneda', 'moneda');
bindChips('chipsBien', 'bien');
updateCta();

/* Nav: resaltar la sección visible */
const navAnchors = [...nav.querySelectorAll('.nav-links a')];
const linkFor = (id) => navAnchors.find((a) => a.getAttribute('href') === `#${id}`);
const spyObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const link = linkFor(entry.target.id);
    if (link) link.classList.toggle('active', entry.isIntersecting);
  }
}, { rootMargin: '-35% 0px -55% 0px' });
['areas', 'leasing', 'estimador', 'equipo'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) spyObserver.observe(el);
});

/* Año en el footer */
document.getElementById('year').textContent = new Date().getFullYear();
