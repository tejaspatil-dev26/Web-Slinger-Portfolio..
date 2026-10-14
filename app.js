// ============================================
//  SPIDYY — app.js  v2.0
//  Full animations, video modal, carousel, etc.
// ============================================

/* ─────────────────────────────
   CANVAS WEB CURSOR
───────────────────────────── */
const canvas = document.getElementById('webCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const mouse    = { x: -999, y: -999 };
const dot      = { x: -999, y: -999 };
const webTrail = [];
const TRAIL_LEN = 22;
let isOverChatbot = false;

document.addEventListener('mousemove', e => {
  const widget = document.getElementById('ai-chatbot-widget-container');
  if (widget && (widget.contains(e.target) || e.target.closest('#ai-chatbot-widget-container'))) {
    isOverChatbot = true;
    webTrail.length = 0;
  } else {
    isOverChatbot = false;
  }

  mouse.x = e.clientX;
  mouse.y = e.clientY;
  if (!isOverChatbot) {
    webTrail.push({ x: e.clientX, y: e.clientY });
    if (webTrail.length > TRAIL_LEN) webTrail.shift();
  }
});

function drawCursor() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isOverChatbot) {
    requestAnimationFrame(drawCursor);
    return;
  }

  // Smooth cursor dot chase
  dot.x += (mouse.x - dot.x) * 0.13;
  dot.y += (mouse.y - dot.y) * 0.13;

  // Web thread trail
  if (webTrail.length > 3) {
    for (let i = 1; i < webTrail.length - 1; i++) {
      const alpha = (i / webTrail.length) * 0.75;
      const width = (i / webTrail.length) * 2.5;
      const xc = (webTrail[i].x + webTrail[i + 1].x) / 2;
      const yc = (webTrail[i].y + webTrail[i + 1].y) / 2;

      ctx.beginPath();
      ctx.moveTo(webTrail[i - 1].x, webTrail[i - 1].y);
      ctx.quadraticCurveTo(webTrail[i].x, webTrail[i].y, xc, yc);
      ctx.strokeStyle = `rgba(220, 0, 0, ${alpha})`;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  // Outer ring pulse
  const time = Date.now() * 0.003;
  const ringRadius = 12 + Math.sin(time) * 2;

  ctx.beginPath();
  ctx.arc(dot.x, dot.y, ringRadius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(220, 0, 0, ${0.2 + Math.sin(time) * 0.1})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Core dot
  const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, 8);
  gradient.addColorStop(0, 'rgba(255, 80, 80, 1)');
  gradient.addColorStop(1, 'rgba(220, 0, 0, 0)');

  ctx.beginPath();
  ctx.arc(dot.x, dot.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Glow shadow
  ctx.beginPath();
  ctx.arc(dot.x, dot.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(220, 0, 0, 0.85)';
  ctx.shadowBlur = 15;
  ctx.shadowColor = 'rgba(220, 0, 0, 0.8)';
  ctx.fill();
  ctx.shadowBlur = 0;

  requestAnimationFrame(drawCursor);
}
drawCursor();


/* ─────────────────────────────
   LOADER & IN-BETWEEN WELCOME PAGE FLOW
───────────────────────────── */
const loaderBar     = document.getElementById('loaderBar');
const welcomeScreen = document.getElementById('welcomeScreen');

let loaderProgress = 0;

const loaderInterval = setInterval(() => {
  loaderProgress += Math.random() * 14 + 6;
  if (loaderProgress >= 100) {
    loaderProgress = 100;
    clearInterval(loaderInterval);
  }
  if (loaderBar) loaderBar.style.width = loaderProgress + '%';
}, 70);

window.addEventListener('load', () => {
  loaderProgress = 100;
  if (loaderBar) loaderBar.style.width = '100%';
  setTimeout(() => {
    // Reveal in-between page with full background image
    document.body.classList.add('welcome-active');
  }, 1600);
});

// Click anywhere on the in-between background page to open the portfolio
let hasEnteredPortfolio = false;

function enterPortfolio() {
  if (hasEnteredPortfolio) return;
  hasEnteredPortfolio = true;

  // Dissolve welcome page and reveal the complete portfolio presentation
  document.body.classList.remove('welcome-active');
  document.body.classList.add('portfolio-active', 'loaded');

  initRevealObserver();
  animateVillainBars(0);
}

if (welcomeScreen) {
  welcomeScreen.addEventListener('click', enterPortfolio);
}

// Allow Enter / Space / Arrow keys as well
document.addEventListener('keydown', e => {
  if (!hasEnteredPortfolio && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowDown')) {
    enterPortfolio();
  }
});


/* ─────────────────────────────
   NAVBAR
───────────────────────────── */
const navbar    = document.getElementById('navbar');
const navLinks  = document.querySelectorAll('.nav-link');
const sections  = document.querySelectorAll('section[id]');
const btt       = document.getElementById('backToTop');
const hamburger = document.getElementById('hamburger');
const navLinksEl = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  btt.classList.toggle('visible', window.scrollY > 400);

  // Active nav highlight
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 110) current = s.id;
  });
  navLinks.forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === `#${current}`);
  });
});

hamburger.addEventListener('click', () => {
  const open = navLinksEl.classList.toggle('mobile-open');
  Object.assign(navLinksEl.style, open ? {
    display: 'flex', flexDirection: 'column', position: 'fixed',
    top: '68px', left: '0', right: '0', background: 'rgba(8,8,8,.98)',
    padding: '20px 40px', gap: '16px', zIndex: '999', borderBottom: '1px solid rgba(220,0,0,.2)'
  } : { display: '' });
});

btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Smooth nav scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navLinksEl.classList.remove('mobile-open');
      navLinksEl.style.display = '';
    }
  });
});


/* ─────────────────────────────
   PARTICLES
───────────────────────────── */
const particleContainer = document.getElementById('particles');

function spawnParticle() {
  const p = document.createElement('div');
  p.className = 'particle';
  const size = Math.random() * 4 + 1;
  const dur  = Math.random() * 12 + 8;
  const del  = Math.random() * 8;
  Object.assign(p.style, {
    width:  size + 'px',
    height: size + 'px',
    left:   Math.random() * 100 + '%',
    animationDuration:  dur + 's',
    animationDelay:     del + 's',
    opacity: 0
  });
  particleContainer.appendChild(p);
}
for (let i = 0; i < 22; i++) spawnParticle();


/* ─────────────────────────────
   SCROLL REVEAL OBSERVER
───────────────────────────── */
function initRevealObserver() {
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay ? parseInt(el.dataset.delay) : 0;
        setTimeout(() => el.classList.add('visible'), delay);
      }
    });
  }, { threshold: 0.13 });

  document.querySelectorAll(
    '.reveal-left, .reveal-right, .reveal-up, .stat-item, .platform-col, .hist-card, .gallery-item'
  ).forEach(el => revealObs.observe(el));
}


/* ─────────────────────────────
   STAT COUNTER ANIMATION
───────────────────────────── */
const statNums = document.querySelectorAll('.stat-num');
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.target || '0');
    const dur = 2000;
    let startTime = null;

    function step(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
    counterObs.unobserve(el);
  });
}, { threshold: 0.5 });

statNums.forEach(el => counterObs.observe(el));


/* ─────────────────────────────
   HERO 3D PARALLAX
───────────────────────────── */
const heroImg = document.getElementById('heroImg');
let floatAngle = 0;

// Floating animation loop
function heroFloat() {
  floatAngle += 0.018;
  if (heroImg) {
    const yOff = Math.sin(floatAngle) * 14;
    heroImg.style.transform = `translateY(${yOff}px)`;
  }
  requestAnimationFrame(heroFloat);
}
heroFloat();

// Mouse parallax
window.addEventListener('mousemove', e => {
  const xR = (e.clientX / window.innerWidth  - 0.5) * 2;
  const yR = (e.clientY / window.innerHeight - 0.5) * 2;

  if (heroImg) {
    heroImg.style.transform = `
      translateY(${Math.sin(floatAngle) * 14}px)
      rotateY(${xR * 7}deg)
      rotateX(${-yR * 5}deg)
    `;
  }

  const webSvg = document.querySelector('.hero-web-svg');
  if (webSvg) webSvg.style.transform = `translate(${xR * 16}px, ${yR * 10}px)`;
});


/* ─────────────────────────────
   VILLAIN TABS + SHOWCASE
───────────────────────────── */
const vtabs   = document.querySelectorAll('.vtab');
const vpanels = document.querySelectorAll('.villain-panel');
let currentVI = 0;

function showVillain(idx) {
  currentVI = (idx + vpanels.length) % vpanels.length;

  vtabs.forEach((t, i) => t.classList.toggle('active', i === currentVI));
  vpanels.forEach((p, i) => {
    p.classList.toggle('active', i === currentVI);
  });

  // Animate stat bars with a small delay
  animateVillainBars(currentVI);
}

function animateVillainBars(idx) {
  // Reset all bars first
  document.querySelectorAll('.vps-fill').forEach(b => b.style.width = '0%');

  // Then animate the active panel's bars
  const panel = document.querySelectorAll('.villain-panel')[idx];
  if (!panel) return;

  setTimeout(() => {
    panel.querySelectorAll('.vps-fill').forEach(fill => {
      const target = fill.getAttribute('style').match(/width:\s*([\d.]+)%/)?.[1] || '0';
      fill.style.transition = 'none';
      fill.style.width = '0%';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fill.style.transition = 'width 1.3s cubic-bezier(.25,.46,.45,.94)';
          fill.style.width = target + '%';
        });
      });
    });
  }, 200);
}

vtabs.forEach((tab, i) => tab.addEventListener('click', () => showVillain(i)));

// Auto rotate villains
let villainTimer = setInterval(() => showVillain(currentVI + 1), 6000);
const showcaseEl = document.getElementById('villainShowcase');
if (showcaseEl) {
  showcaseEl.addEventListener('mouseenter', () => clearInterval(villainTimer));
  showcaseEl.addEventListener('mouseleave', () => {
    villainTimer = setInterval(() => showVillain(currentVI + 1), 6000);
  });
}

// Keyboard arrow support
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') showVillain(currentVI + 1);
  if (e.key === 'ArrowLeft')  showVillain(currentVI - 1);
});

/* ─────────────────────────────
   DETAIL MODAL (Superpowers Section)
───────────────────────────── */
const videoModal    = document.getElementById('videoModal');
const vmBackdrop    = document.getElementById('vmBackdrop');
const vmClose       = document.getElementById('vmClose');
const vmTitle       = document.getElementById('vmTitle');
const vmSub         = document.getElementById('vmSub');
const vmIcon        = document.getElementById('vmIcon');
const modalBodyText = document.getElementById('modalBodyText');

// Power card click
document.querySelectorAll('.power-card').forEach(card => {
  card.addEventListener('click', () => {
    const title = card.dataset.title || 'Technical Specialization';
    const sub   = card.dataset.sub   || 'AI/ML Engineering';
    const icon  = card.dataset.icon  || '⚡';
    const desc  = card.dataset.desc  || 'Deep technical focus on scalable architectures and intelligent algorithmic solutions.';

    if (vmTitle) vmTitle.textContent = title;
    if (vmSub)   vmSub.textContent   = sub;
    if (vmIcon)  vmIcon.textContent  = icon;
    if (modalBodyText) {
      modalBodyText.innerHTML = `
        <p style="font-size:1.05rem; color:#fff; margin-bottom:14px; font-weight:500;">${desc}</p>
        <p style="color:#aaa; font-size:0.9rem; margin-bottom:12px;">Actively leveraging this capability across projects including <strong>AI StudyMate</strong>, <strong>Cross-Platform AI Chatbot</strong>, and <strong>Eco-AI</strong>.</p>
        <div style="margin-top:18px;">
          <a href="#projects" class="btn btn-primary btn-sm" onclick="closeVideoModal()">View Project Implementations 🕸</a>
        </div>
      `;
    }

    if (videoModal) {
      videoModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  });
});

function closeVideoModal() {
  if (videoModal) videoModal.classList.remove('open');
  document.body.style.overflow = '';
}

if (vmClose) vmClose.addEventListener('click', closeVideoModal);
if (vmBackdrop) vmBackdrop.addEventListener('click', closeVideoModal);

/* ─────────────────────────────
   RESUME MODAL
───────────────────────────── */
const resumeModal = document.getElementById('resumeModal');
const rmBackdrop  = document.getElementById('rmBackdrop');
const rmClose     = document.getElementById('rmClose');
const resumeBtns = [
  ...document.querySelectorAll('#navResumeBtn, #heroResumeBtn, #contactResumeBtn, .nav-resume-btn, a[href="#resume"], [data-action="resume"]')
];

function openResumeModal(e) {
  if (e) e.preventDefault();
  if (resumeModal) {
    resumeModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeResumeModal() {
  if (resumeModal) resumeModal.classList.remove('open');
  document.body.style.overflow = '';
}

resumeBtns.forEach(btn => btn.addEventListener('click', openResumeModal));
if (rmClose) rmClose.addEventListener('click', closeResumeModal);
if (rmBackdrop) rmBackdrop.addEventListener('click', closeResumeModal);
const resumeContactBtn = document.getElementById('resumeContactBtn');
if (resumeContactBtn) {
  resumeContactBtn.addEventListener('click', () => {
    closeResumeModal();
  });
}

// Global escape key handler
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeVideoModal();
    closeResumeModal();
  }
});

/* ─────────────────────────────
   CONTACT FORM HANDLER (Direct Delivery to tejaspatil2629@gmail.com)
───────────────────────────── */
const contactForm = document.getElementById('contactForm');
const formStatus  = document.getElementById('formStatus');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn  = document.getElementById('cSubmitBtn');
    const nameVal    = document.getElementById('cName')?.value.trim();
    const emailVal   = document.getElementById('cEmail')?.value.trim();
    const subjectVal = document.getElementById('cSubject')?.value.trim() || 'Portfolio Web Signal';
    const messageVal = document.getElementById('cMessage')?.value.trim();

    if (!nameVal || !emailVal || !messageVal) return;

    if (submitBtn) {
      submitBtn.innerHTML = '<span>Transmitting Signal to Tejas...</span><span class="btn-icon">⚡</span>';
      submitBtn.style.opacity = '0.75';
      submitBtn.disabled = true;
    }

    if (formStatus) {
      formStatus.className = 'form-status';
      formStatus.style.display = 'none';
    }

    try {
      const response = await fetch('https://formsubmit.co/ajax/tejaspatil2629@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: nameVal,
          email: emailVal,
          subject: subjectVal,
          message: messageVal,
          _subject: `[Portfolio Web Signal] ${subjectVal} from ${nameVal}`,
          _captcha: 'false',
          _template: 'table'
        })
      });

      const result = await response.json();

      if (response.ok && (result.success === 'true' || result.success === true)) {
        if (formStatus) {
          formStatus.className = 'form-status success';
          formStatus.style.display = 'block';
          formStatus.innerHTML = `🕸 <strong>Signal Transmitted!</strong> Your message has been sent directly to <strong>tejaspatil2629@gmail.com</strong>. Tejas will get back to you shortly!`;
          formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        contactForm.reset();
        if (submitBtn) {
          submitBtn.innerHTML = '<span>Signal Delivered!</span><span class="btn-icon">✓</span>';
          submitBtn.style.background = 'var(--green)';
        }
      } else if (result.message && result.message.includes('Activation')) {
        // One-time activation notice from FormSubmit
        if (formStatus) {
          formStatus.className = 'form-status success';
          formStatus.style.display = 'block';
          formStatus.innerHTML = `📩 <strong>Almost done!</strong> FormSubmit sent a 1-click activation email to <strong>tejaspatil2629@gmail.com</strong>. Check your inbox and click <em>'Activate Form'</em> to receive all incoming messages!`;
          formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        contactForm.reset();
        if (submitBtn) {
          submitBtn.innerHTML = '<span>Activation Sent!</span><span class="btn-icon">✉️</span>';
          submitBtn.style.background = 'var(--blue)';
        }
      } else {
        throw new Error(result.message || 'Submission error');
      }
    } catch (err) {
      console.warn('FormSubmit transmission error, opening mailto fallback:', err);
      const mailtoUrl = `mailto:tejaspatil2629@gmail.com?subject=${encodeURIComponent(subjectVal)}&body=${encodeURIComponent(`Hi Tejas,\n\nName: ${nameVal}\nEmail: ${emailVal}\n\nMessage:\n${messageVal}`)}`;

      if (formStatus) {
        formStatus.className = 'form-status error';
        formStatus.style.display = 'block';
        formStatus.innerHTML = `⚠️ Direct network delivery encountered an issue. <a href="${mailtoUrl}" style="color:#ff6b6b; text-decoration:underline; font-weight:600;">Click here to send directly via your email app</a> to <strong>tejaspatil2629@gmail.com</strong>.`;
        formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      if (submitBtn) {
        submitBtn.innerHTML = '<span>Send via Email Client</span><span class="btn-icon">✉️</span>';
        submitBtn.style.background = 'var(--red)';
        submitBtn.onclick = () => { window.location.href = mailtoUrl; };
      }
    } finally {
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.innerHTML = '<span>Send Web Signal</span><span class="btn-icon">🕸</span>';
          submitBtn.style.background = '';
          submitBtn.style.opacity = '1';
          submitBtn.disabled = false;
          submitBtn.onclick = null;
        }
      }, 7000);
    }
  });
}


/* ─────────────────────────────
   ABOUT IMAGE MORPH (Spider-Man <-> Tejas Patil)
───────────────────────────── */
const morphWrapper = document.getElementById('morphImgWrapper');
if (morphWrapper) {
  morphWrapper.addEventListener('click', () => {
    morphWrapper.classList.toggle('active');
  });

  morphWrapper.addEventListener('mousemove', e => {
    const rect = morphWrapper.getBoundingClientRect();
    const xRel = (e.clientX - rect.left) / rect.width  - 0.5;
    const yRel = (e.clientY - rect.top)  / rect.height - 0.5;
    const container = morphWrapper.querySelector('.morph-container');
    if (container) {
      container.style.transform = `perspective(800px) rotateX(${-yRel * 10}deg) rotateY(${xRel * 10}deg) scale(1.02)`;
      container.style.transition = 'transform 0.1s ease-out';
    }
  });

  morphWrapper.addEventListener('mouseleave', () => {
    const container = morphWrapper.querySelector('.morph-container');
    if (container) {
      container.style.transform = '';
      container.style.transition = 'transform 0.5s ease-out';
    }
    morphWrapper.classList.remove('active');
  });
}


/* ─────────────────────────────
   GALLERY TILT (3D perspective)
───────────────────────────── */
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('mousemove', e => {
    const rect = item.getBoundingClientRect();
    const xRel = (e.clientX - rect.left) / rect.width  - 0.5;
    const yRel = (e.clientY - rect.top)  / rect.height - 0.5;
    item.style.transform = `perspective(700px) rotateX(${-yRel * 7}deg) rotateY(${xRel * 7}deg) scale(1.04)`;
  });
  item.addEventListener('mouseleave', () => { item.style.transform = ''; });
});


/* ─────────────────────────────
   BUTTON RIPPLE
───────────────────────────── */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const r = document.createElement('span');
    Object.assign(r.style, {
      position: 'absolute',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.25)',
      transform: 'scale(0)',
      animation: 'ripple .65s linear',
      width: '100px',
      height: '100px',
      left: (e.offsetX - 50) + 'px',
      top:  (e.offsetY - 50) + 'px',
      pointerEvents: 'none',
    });
    btn.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  });
});

// Inject ripple keyframe
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `@keyframes ripple { to { transform: scale(4); opacity: 0; } }`;
document.head.appendChild(rippleStyle);


/* ─────────────────────────────
   HISTORY CARD STAGGER
───────────────────────────── */
const histObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el    = entry.target;
      const delay = parseInt(el.dataset.delay || '0');
      setTimeout(() => el.classList.add('visible'), delay);
      histObs.unobserve(el);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.hist-card').forEach(c => histObs.observe(c));


/* ─────────────────────────────
   SCROLL-DRIVEN WEB SPIN
───────────────────────────── */
let lastSY = 0;
window.addEventListener('scroll', () => {
  const delta = window.scrollY - lastSY;
  lastSY = window.scrollY;

  document.querySelectorAll('.fwl').forEach((w, i) => {
    const cur = parseFloat(w.dataset.angle || '0') + delta * (.25 + i * .12);
    w.dataset.angle = cur;
    w.style.transform = `rotate(${cur}deg)`;
  });
});


/* ─────────────────────────────
   VILLAIN CARD ENTRANCE WHEN SCROLLED INTO VIEW
───────────────────────────── */
const villainSectionObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Trigger stat bar animation for current villain
      animateVillainBars(currentVI);
    }
  });
}, { threshold: 0.3 });

const villainsSection = document.getElementById('villains');
if (villainsSection) villainSectionObs.observe(villainsSection);


/* ─────────────────────────────
   PLATFORM SECTION OBSERVER
───────────────────────────── */
const platObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.platform-col').forEach((col, i) => {
        setTimeout(() => col.classList.add('visible'), i * 200);
      });
    }
  });
}, { threshold: 0.3 });

const platSection = document.querySelector('.platforms-section');
if (platSection) platObs.observe(platSection);


/* ─────────────────────────────
   GOBLIN CSS ART ANIMATION HOVER
───────────────────────────── */
const goblinArt = document.querySelector('.goblin-css-art');
if (goblinArt) {
  goblinArt.addEventListener('mouseenter', () => {
    const bomb = goblinArt.querySelector('.goblin-bomb');
    if (bomb) {
      bomb.style.animation = 'bombPulse .3s ease-in-out infinite, bombThrow 1s ease-out forwards';
    }
  });
}


/* ─────────────────────────────
   SCROLL-DRIVEN OUTWARD EXPANSION (spider_web_bg.jpg)
───────────────────────────── */
const webPortalCard = document.getElementById('webPortalCard');
const webPortalImg  = document.getElementById('webPortalImg');

let portalCurrentScale = 1.05;
let portalTargetScale  = 1.05;
let portalCurrentRot   = 0;
let portalTargetRot    = 0;

function updateWebPortalScroll() {
  if (webPortalCard && webPortalImg) {
    const rect = webPortalCard.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Check if card is visible or near viewport
    if (rect.top < windowH && rect.bottom > 0) {
      // Calculate progress from 0 (entering from bottom) to 1 (leaving from top)
      const progress = (windowH - rect.top) / (windowH + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));

      // As you scroll up/through, the photo expands outward into the screen
      portalTargetScale = 1.02 + (clamped * 0.42);
      portalTargetRot   = (clamped - 0.5) * 6; // subtle 3D dimension twist
    }
  }

  // Smooth lerp for fluid 60fps animation
  portalCurrentScale += (portalTargetScale - portalCurrentScale) * 0.12;
  portalCurrentRot   += (portalTargetRot - portalCurrentRot) * 0.12;

  if (webPortalImg) {
    webPortalImg.style.setProperty('--portal-scale', portalCurrentScale.toFixed(3));
    webPortalImg.style.setProperty('--portal-rot', `${portalCurrentRot.toFixed(2)}deg`);
  }

  requestAnimationFrame(updateWebPortalScroll);
}
requestAnimationFrame(updateWebPortalScroll);


/* ─────────────────────────────
   INTERACTIVE 3D TILT FOR CONTACT HUD CARDS & FORM
───────────────────────────── */
document.querySelectorAll('.contact-card, .contact-form-wrap').forEach(elem => {
  elem.addEventListener('mousemove', e => {
    const rect = elem.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 4.5;
    const rotY = ((x - centerX) / centerX) * 4.5;

    elem.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-4px)`;
  });

  elem.addEventListener('mouseleave', () => {
    elem.style.transform = '';
  });
});


/* ─────────────────────────────
   INTERACTIVE SIGNAL EQUALIZER ON TYPING
───────────────────────────── */
const signalBars = document.querySelectorAll('.signal-bar');
document.querySelectorAll('.form-input, .form-textarea').forEach(input => {
  input.addEventListener('input', () => {
    signalBars.forEach(bar => {
      const h = Math.floor(Math.random() * 16 + 6);
      bar.style.height = `${h}px`;
      bar.style.boxShadow = '0 0 10px rgba(255, 40, 40, 1)';
    });
  });
  input.addEventListener('blur', () => {
    signalBars.forEach(bar => {
      bar.style.boxShadow = '';
    });
  });
});


/* ─────────────────────────────
   CONSOLE BRANDING
───────────────────────────── */
console.log(
  '%c🕷 TEJAS SHARAD PATIL\n%cAI/ML Engineer & Software Developer | Built with Node.js + Pure CSS Animations',
  'color:#e00;font-size:20px;font-weight:bold;text-shadow:0 0 10px rgba(220,0,0,.5)',
  'color:#aaa;font-size:12px'
);
