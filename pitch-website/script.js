// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add("visible"), Number(delay));
      }
    });
  },
  { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
);

document.querySelectorAll(".pain-grid, .feature-grid, .stakeholder-grid, .ask-grid, .solution-flow").forEach((grid) => {
  const children = grid.querySelectorAll(".pain-card, .feature-card, .flow-step, .stakeholder-card, .ask-card");
  children.forEach((child, i) => {
    child.dataset.delay = String(i * 100);
    revealObserver.observe(child);
  });
});

document.querySelectorAll("h2, .section-lead, .section-kicker, .hero h1, .hero-sub, .hero-actions, .hero-stats, .demo-box, .ask-cta").forEach((el) => {
  el.classList.add("scroll-reveal");
  revealObserver.observe(el);
});

// ===== SUBTLE PARALLAX ON CARDS =====
const parallaxEls = document.querySelectorAll(".pain-card, .feature-card, .stakeholder-card, .ask-card, .flow-step, .demo-box");
function updateParallax() {
  const vh = window.innerHeight;
  parallaxEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const offset = ((rect.top + rect.height / 2) - vh / 2) / vh;
    if (el.classList.contains("visible")) {
      el.style.transform = `translateY(${offset * 12}px)`;
    }
  });
  requestAnimationFrame(updateParallax);
}
requestAnimationFrame(updateParallax);

// ===== EXPANDING PAIN CARDS =====
document.querySelectorAll(".pain-card").forEach((card) => {
  const p = card.querySelector("p");
  if (!p) return;
  const fullText = p.textContent;
  const shortText = fullText.slice(0, 80) + "…";
  p.textContent = shortText;
  p.style.transition = "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)";
  card.addEventListener("mouseenter", () => { p.textContent = fullText; card.style.zIndex = "10"; });
  card.addEventListener("mouseleave", () => { p.textContent = shortText; card.style.zIndex = ""; });
});

// ===== EXPANDING FEATURE CARDS =====
document.querySelectorAll(".feature-card:not(.feature-hero-card)").forEach((card) => {
  const p = card.querySelector("p");
  if (!p) return;
  p.style.maxHeight = "44px";
  p.style.overflow = "hidden";
  p.style.transition = "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
  card.addEventListener("mouseenter", () => { p.style.maxHeight = "240px"; });
  card.addEventListener("mouseleave", () => { p.style.maxHeight = "44px"; });
});

// ===== PERSONA TABS =====
document.querySelectorAll(".persona-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const persona = tab.dataset.persona;
    document.querySelectorAll(".persona-tab").forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    document.querySelectorAll(".persona-content").forEach((c) => c.classList.remove("is-active"));
    const content = document.querySelector(`[data-persona-content="${persona}"]`);
    if (content) {
      content.classList.add("is-active");
      content.querySelectorAll(".pipeline-step").forEach((step, i) => {
        step.classList.remove("visible");
        setTimeout(() => step.classList.add("visible"), i * 80);
      });
    }
  });
});

// Animate the initial active pipeline once on load
setTimeout(() => {
  const active = document.querySelector(".persona-content.is-active");
  if (active) active.querySelectorAll(".pipeline-step").forEach((step, i) => {
    setTimeout(() => step.classList.add("visible"), i * 80);
  });
}, 300);

// Animate pipeline when its persona-content scrolls into view
const pipelineObs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll(".pipeline-step").forEach((step, i) => {
        setTimeout(() => step.classList.add("visible"), i * 80);
      });
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll(".persona-content").forEach((el) => pipelineObs.observe(el));

// ===== SMOOTH NAV =====
document.querySelectorAll('.nav-links a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    if (target) {
      const y = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  });
});

// Active nav highlighting
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");
const navObs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((link) => {
        link.classList.toggle("nav-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    }
  });
}, { threshold: 0.3 });
sections.forEach((s) => navObs.observe(s));

// ===== HERO COUNTER ANIMATION =====
function animateCounters() {
  document.querySelectorAll(".hero-stat strong").forEach((el) => {
    const target = el.textContent;
    const num = parseInt(target);
    if (isNaN(num)) return;
    const suffix = target.replace(String(num), "");
    let current = 0;
    const step = Math.max(1, Math.floor(num / 40));
    const interval = setInterval(() => {
      current += step;
      if (current >= num) { current = num; clearInterval(interval); }
      el.textContent = current + suffix;
    }, 30);
  });
}
const heroObs = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) { animateCounters(); heroObs.disconnect(); }
}, { threshold: 0.5 });
const heroStats = document.querySelector(".hero-stats");
if (heroStats) heroObs.observe(heroStats);

// Stat tilt on hover
document.querySelectorAll(".hero-stat").forEach((stat) => {
  stat.addEventListener("mousemove", (e) => {
    const rect = stat.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    stat.style.transform = `perspective(500px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.05)`;
  });
  stat.addEventListener("mouseleave", () => { stat.style.transform = ""; });
});

// ===== THEME SWITCHER =====
document.querySelectorAll(".theme-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const theme = btn.dataset.setTheme;
    document.querySelectorAll(".theme-btn").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    if (theme === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    localStorage.setItem("onestopsgtaxi-pitch-theme", theme);
  });
});

const saved = localStorage.getItem("onestopsgtaxi-pitch-theme");
if (saved && saved !== "default") {
  document.documentElement.setAttribute("data-theme", saved);
  document.querySelectorAll(".theme-btn").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.setTheme === saved);
  });
}
