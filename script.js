// ===== THEME TOGGLE =====
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", isDark ? "light" : "dark");
  document.getElementById("themeLabel").textContent = isDark ? "Light" : "Dark";
}

// ===== CIRCUIT CANVAS =====
const canvas = document.getElementById("circuitCanvas");
const ctx = canvas.getContext("2d");
let width = 0;
let height = 0;
let traces = [];
let mouse = { x: 0, y: 0, active: false };

function accentColor(alpha = 1) {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  return isDark ? `rgba(122, 241, 255, ${alpha})` : `rgba(0, 126, 167, ${alpha})`;
}

function secondAccent(alpha = 1) {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  return isDark ? `rgba(57, 255, 157, ${alpha})` : `rgba(0, 140, 97, ${alpha})`;
}

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  buildTraces();
}

function buildTraces() {
  const count = Math.max(22, Math.floor((width * height) / 44000));
  traces = Array.from({ length: count }, () => {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const horizontal = Math.random() > 0.42;
    const length = 70 + Math.random() * 210;
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      horizontal,
      length,
      pulse: Math.random(),
      speed: 0.004 + Math.random() * 0.008,
      nodeSize: 2 + Math.random() * 2.4,
    };
  });
}

function drawTrace(trace) {
  trace.x += trace.vx;
  trace.y += trace.vy;
  trace.pulse = (trace.pulse + trace.speed) % 1;

  if (trace.x < -220) trace.x = width + 40;
  if (trace.x > width + 220) trace.x = -40;
  if (trace.y < -220) trace.y = height + 40;
  if (trace.y > height + 220) trace.y = -40;

  const bend = trace.length * 0.34;
  const endX = trace.horizontal ? trace.x + trace.length : trace.x + bend;
  const endY = trace.horizontal ? trace.y + bend : trace.y + trace.length;
  const midX = trace.horizontal ? trace.x + bend : trace.x;
  const midY = trace.horizontal ? trace.y : trace.y + bend;
  const alpha = 0.1 + Math.sin(trace.pulse * Math.PI) * 0.22;

  ctx.strokeStyle = accentColor(alpha);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(trace.x, trace.y);
  ctx.lineTo(midX, midY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  const pulseX = trace.x + (endX - trace.x) * trace.pulse;
  const pulseY = trace.y + (endY - trace.y) * trace.pulse;
  ctx.fillStyle = secondAccent(0.55);
  ctx.beginPath();
  ctx.arc(pulseX, pulseY, trace.nodeSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = accentColor(0.32);
  ctx.fillRect(trace.x - 2, trace.y - 2, 4, 4);
  ctx.fillRect(endX - 2, endY - 2, 4, 4);
}

function drawMouseField() {
  if (!mouse.active) return;
  const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
  gradient.addColorStop(0, accentColor(0.13));
  gradient.addColorStop(1, accentColor(0));
  ctx.fillStyle = gradient;
  ctx.fillRect(mouse.x - 180, mouse.y - 180, 360, 360);
}

function animateCanvas() {
  ctx.clearRect(0, 0, width, height);
  drawMouseField();
  traces.forEach(drawTrace);
  requestAnimationFrame(animateCanvas);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("mousemove", (event) => {
  mouse = { x: event.clientX, y: event.clientY, active: true };
});
window.addEventListener("mouseleave", () => {
  mouse.active = false;
});

resizeCanvas();
animateCanvas();

// ===== SCROLL REVEALS AND ACTIVE NAV =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 45, 260)}ms`;
  revealObserver.observe(element);
});

const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
    });
  });
}, { rootMargin: "-45% 0px -50% 0px" });

sections.forEach((section) => navObserver.observe(section));

// ===== CERTIFICATE VIEWER =====
document.querySelectorAll(".course-item").forEach((item) => {
  const pdfUrl = item.getAttribute("data-pdf");
  if (!pdfUrl) return;

  item.classList.add("has-cert");
  const iframe = item.querySelector(".course-cert-iframe");
  const counter = item.querySelector(".course-cert-counter");
  const prevBtn = item.querySelector(".cert-prev-btn");
  const nextBtn = item.querySelector(".cert-next-btn");
  const titleEl = item.querySelector(".course-cert-title");
  const pdfs = pdfUrl.split(",").map((value) => value.trim()).filter(Boolean);
  const pdfNames = (item.getAttribute("data-pdf-names") || "").split(",").map((value) => value.trim());
  let currentIndex = 0;
  let isAnimating = false;

  function titleFor(index) {
    return pdfNames[index] || item.querySelector("h3").textContent;
  }

  function setFrame(index) {
    if (!iframe) return;
    iframe.setAttribute("src", `${pdfs[index]}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`);
    if (titleEl) titleEl.textContent = titleFor(index);
    if (counter) counter.textContent = `${index + 1} of ${pdfs.length}`;
  }

  function loadPdf() {
    if (iframe && !iframe.getAttribute("src")) setFrame(currentIndex);
  }

  function switchCertificate(direction) {
    if (isAnimating || pdfs.length < 2 || !iframe) return;
    isAnimating = true;
    const outClass = direction === "next" ? "slide-out-left" : "slide-out-right";
    const inClass = direction === "next" ? "slide-in-right" : "slide-in-left";

    iframe.classList.add(outClass);
    if (titleEl) titleEl.classList.add(outClass);

    window.setTimeout(() => {
      currentIndex = direction === "next"
        ? (currentIndex + 1) % pdfs.length
        : (currentIndex - 1 + pdfs.length) % pdfs.length;
      setFrame(currentIndex);

      iframe.classList.remove(outClass);
      iframe.classList.add(inClass);
      if (titleEl) {
        titleEl.classList.remove(outClass);
        titleEl.classList.add(inClass);
      }

      iframe.offsetWidth;
      iframe.classList.remove(inClass);
      if (titleEl) titleEl.classList.remove(inClass);

      window.setTimeout(() => {
        isAnimating = false;
      }, 260);
    }, 240);
  }

  if (pdfs.length < 2) {
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
    if (counter) counter.style.display = "none";
  } else {
    if (counter) counter.textContent = `1 of ${pdfs.length}`;
    prevBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      loadPdf();
      switchCertificate("prev");
    });
    nextBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      loadPdf();
      switchCertificate("next");
    });
  }

  item.addEventListener("mouseenter", loadPdf);
  item.addEventListener("click", (event) => {
    if (event.target.closest(".course-cert-container")) return;
    loadPdf();
    item.classList.toggle("expanded");
  });
});
