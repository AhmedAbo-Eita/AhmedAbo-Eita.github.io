// ===== THEME TOGGLE =====
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeLabel').textContent = isDark ? 'LIGHT' : 'DARK';
}

// ===== PHOTO UPLOAD =====
function loadPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('photoImg');
    const placeholder = document.getElementById('photoPlaceholder');
    img.src = e.target.result;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ===== CIRCUIT CANVAS =====
const canvas = document.getElementById('circuitCanvas');
const ctx = canvas.getContext('2d');
let nodes = [];
let W, H;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

function getAccentColor() {
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'dark' ? 'rgba(0,212,255,' : 'rgba(0,119,170,';
}

class Node {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random() - 0.5) * 0.3;
    this.r = Math.random() * 2 + 1;
    this.alpha = Math.random() * 0.4 + 0.1;
    this.type = Math.random() > 0.7 ? 'square' : 'circle';
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
  }
  draw() {
    const c = getAccentColor();
    ctx.fillStyle = c + this.alpha + ')';
    ctx.strokeStyle = c + (this.alpha * 1.5) + ')';
    if (this.type === 'square') {
      ctx.fillRect(this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

for (let i = 0; i < 60; i++) nodes.push(new Node());

function drawConnections() {
  const c = getAccentColor();
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const alpha = (1 - dist / 120) * 0.12;
        ctx.strokeStyle = c + alpha + ')';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        // Orthogonal PCB-style connections
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[i].x, nodes[j].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, W, H);
  drawConnections();
  nodes.forEach(n => { n.update(); n.draw(); });
  requestAnimationFrame(animate);
}
animate();

// ===== INTERSECTION OBSERVER =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 100);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.exp-item, .project-card, .skill-group, .course-item').forEach(el => observer.observe(el));

// Stagger project cards
document.querySelectorAll('.project-card').forEach((card, i) => {
  card.style.transitionDelay = (i * 0.08) + 's';
});
document.querySelectorAll('.skill-group').forEach((g, i) => {
  g.style.transitionDelay = (i * 0.06) + 's';
});

// ===== COURSES CERTIFICATE HOVER/TAP LAZY LOADING & MULTI-CERT SLIDER =====
document.querySelectorAll('.course-item').forEach(item => {
  const pdfUrl = item.getAttribute('data-pdf');
  if (pdfUrl) {
    item.classList.add('has-cert');
    const certImg = item.querySelector('.course-cert-img');
    const counter = item.querySelector('.course-cert-counter');
    const prevBtn = item.querySelector('.cert-prev-btn');
    const nextBtn = item.querySelector('.cert-next-btn');
    const titleEl = item.querySelector('.course-cert-title');

    // Support comma-separated URLs for multiple certificates and names
    const pdfs = pdfUrl.split(',').map(s => s.trim()).filter(Boolean);
    const pdfNamesAttr = item.getAttribute('data-pdf-names');
    const pdfNames = pdfNamesAttr ? pdfNamesAttr.split(',').map(s => s.trim()) : [];
    
    let currentIndex = 0;
    let isAnimating = false;

    const getCertTitle = (index) => {
      if (pdfNames[index]) return pdfNames[index];
      const fallbackTitle = item.querySelector('.course-name').textContent;
      return pdfs.length > 1 ? `${fallbackTitle} - Part ${index + 1}` : fallbackTitle;
    };

    if (pdfs.length > 1) {
      if (prevBtn) prevBtn.style.display = 'flex';
      if (nextBtn) nextBtn.style.display = 'flex';
      if (counter) {
        counter.style.display = 'block';
        counter.textContent = `1 of ${pdfs.length}`;
      }

      const switchCertificate = (direction) => {
        if (isAnimating || !certImg) return;
        isAnimating = true;

        const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
        const inClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

        // 1. Slide out current frame and title
        certImg.classList.add(outClass);
        if (titleEl) titleEl.classList.add(outClass);

        setTimeout(() => {
          // 2. Change the source, counter, and title text while off-screen
          if (direction === 'next') {
            currentIndex = (currentIndex + 1) % pdfs.length;
          } else {
            currentIndex = (currentIndex - 1 + pdfs.length) % pdfs.length;
          }
          certImg.setAttribute('src', pdfs[currentIndex]);
          if (counter) counter.textContent = `${currentIndex + 1} of ${pdfs.length}`;
          if (titleEl) titleEl.textContent = getCertTitle(currentIndex);

          // 3. Teleport elements to the opposite side silently
          certImg.classList.remove(outClass);
          certImg.classList.add(inClass);
          if (titleEl) {
            titleEl.classList.remove(outClass);
            titleEl.classList.add(inClass);
          }

          // Force repaint
          certImg.offsetWidth;
          if (titleEl) titleEl.offsetWidth;

          // 4. Slide back in to center position
          certImg.classList.remove(inClass);
          if (titleEl) titleEl.classList.remove(inClass);

          // Unlock after slide-in animation finishes
          setTimeout(() => {
            isAnimating = false;
          }, 250);
        }, 250);
      };

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Stop click from bubbling and collapsing the card
          switchCertificate('prev');
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Stop click from bubbling and collapsing the card
          switchCertificate('next');
        });
      }
    }

    const loadPdf = () => {
      if (certImg && !certImg.getAttribute('src')) {
        certImg.setAttribute('src', pdfs[currentIndex]);
        if (titleEl) titleEl.textContent = getCertTitle(currentIndex);
      }
    };

    item.addEventListener('mouseenter', loadPdf);
    
    // Support for mobile tap / click toggle
    item.addEventListener('click', (e) => {
      // If the click happened on elements inside the certificate container, don't collapse
      if (e.target.closest('.course-cert-container')) return;
      
      loadPdf();
      item.classList.toggle('expanded');
    });
  }
});
