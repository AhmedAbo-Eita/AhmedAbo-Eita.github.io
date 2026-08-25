// ===== THEME & COLOR CACHING — Precision Workshop =====
let isDarkTheme = document.documentElement.getAttribute("data-theme") === "dark";
let accentRgb = isDarkTheme ? "255, 126, 74" : "214, 90, 40";
let secondAccentRgb = isDarkTheme ? "91, 192, 190" : "42, 125, 123";

function updateThemeColors() {
  isDarkTheme = document.documentElement.getAttribute("data-theme") === "dark";
  accentRgb = isDarkTheme ? "255, 126, 74" : "214, 90, 40";
  secondAccentRgb = isDarkTheme ? "91, 192, 190" : "42, 125, 123";
}

function toggleTheme() {
  const html = document.documentElement;
  isDarkTheme = html.getAttribute("data-theme") === "dark";
  const newTheme = isDarkTheme ? "light" : "dark";
  html.setAttribute("data-theme", newTheme);
  document.getElementById("themeLabel").textContent = isDarkTheme ? "Light" : "Dark";
  updateThemeColors();
}

// ===== CIRCUIT CANVAS (HIGH PERFORMANCE) =====
const canvas = document.getElementById("circuitCanvas");
const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
let width = 0;
let height = 0;
let traces = [];
let mouse = { x: 0, y: 0, active: false };
let isPageVisible = !document.hidden;
let animFrameId = null;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  buildTraces();
}

function buildTraces() {
  const count = Math.min(42, Math.max(18, Math.floor((width * height) / 48000)));
  traces = Array.from({ length: count }, () => {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const horizontal = Math.random() > 0.42;
    const length = 70 + Math.random() * 200;
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      horizontal,
      length,
      pulse: Math.random(),
      speed: 0.004 + Math.random() * 0.008,
      nodeSize: 2 + Math.random() * 2,
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
  const alpha = 0.08 + Math.sin(trace.pulse * Math.PI) * 0.2;

  ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(trace.x, trace.y);
  ctx.lineTo(midX, midY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  const pulseX = trace.x + (endX - trace.x) * trace.pulse;
  const pulseY = trace.y + (endY - trace.y) * trace.pulse;
  ctx.fillStyle = `rgba(${secondAccentRgb}, 0.55)`;
  ctx.beginPath();
  ctx.arc(pulseX, pulseY, trace.nodeSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(${accentRgb}, 0.3)`;
  ctx.fillRect(trace.x - 2, trace.y - 2, 4, 4);
  ctx.fillRect(endX - 2, endY - 2, 4, 4);
}

function drawMouseField() {
  if (!mouse.active) return;
  const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
  gradient.addColorStop(0, `rgba(${accentRgb}, 0.12)`);
  gradient.addColorStop(1, `rgba(${accentRgb}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(mouse.x - 160, mouse.y - 160, 320, 320);
}

function animateCanvas() {
  if (!isPageVisible) {
    animFrameId = null;
    return;
  }
  ctx.clearRect(0, 0, width, height);
  drawMouseField();
  for (let i = 0; i < traces.length; i++) {
    drawTrace(traces[i]);
  }
  animFrameId = requestAnimationFrame(animateCanvas);
}

document.addEventListener("visibilitychange", () => {
  isPageVisible = !document.hidden;
  if (isPageVisible && !animFrameId) {
    animFrameId = requestAnimationFrame(animateCanvas);
  }
});

let resizeTimeout;
window.addEventListener(
  "resize",
  () => {
    if (resizeTimeout) cancelAnimationFrame(resizeTimeout);
    resizeTimeout = requestAnimationFrame(resizeCanvas);
  },
  { passive: true }
);

window.addEventListener(
  "mousemove",
  (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.active = true;
  },
  { passive: true }
);

window.addEventListener(
  "mouseleave",
  () => {
    mouse.active = false;
  },
  { passive: true }
);

resizeCanvas();
animFrameId = requestAnimationFrame(animateCanvas);

// ===== SCROLL REVEALS & ACTIVE NAV =====
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 40, 200)}ms`;
  revealObserver.observe(element);
});

// Active nav indicator
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-links a");
let activeSectionId = "";

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        if (activeSectionId !== id) {
          activeSectionId = id;
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
          });
        }
      }
    });
  },
  { rootMargin: "-30% 0px -60% 0px" }
);

sections.forEach((section) => navObserver.observe(section));

// Smooth navigation click handler
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");
    if (targetId === "#" || targetId.length <= 1) return;
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      e.preventDefault();
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// ===== PROJECT DETAILS DATA & DUAL-MODE MODAL =====
const projectsData = {
  "bldc-motor-driver": {
    isOpenSource: true,
    typeBadgeText: "Open Source ✦",
    typeBadgeClass: "badge-open-source",
    title: "60V / 30A High-Performance BLDC & PMSM Motor Controller (ESC)",
    tag: "PCB | Power Electronics | Jan 2026",
    description:
      "A compact, high-efficiency, 3-phase Field-Oriented Control (FOC) motor controller designed for high-power robotics, e-mobility, and industrial automation. Built on the STM32G431RBT6 ARM Cortex-M4 MCU and the TI DRV8353HRTAR smart gate driver, this board supports high-frequency switching up to 100 kHz with extensive hardware protection, sensor feedback, and connectivity.",
    specs: [
      { param: "Input DC Bus Voltage (V_BUS)", value: "24V – 60V (60V Maximum)", note: "High-voltage bulk capacitor bank + TVS transient clamping" },
      { param: "Maximum Phase Current", value: "30A Maximum", note: "Dependent on external heatsinking and thermal interface" },
      { param: "Maximum Switching Frequency", value: "Up to 100 kHz PWM", note: "Hardware-accelerated CORDIC/FMAC trigonometric engine" },
      { param: "Operating Temperature (T_A)", value: "-40°C to +125°C", note: "Designed for High-TG180 PCB substrates" },
      { param: "Main Processing Unit", value: "STM32G431RBT6 (170 MHz)", note: "ARM Cortex-M4 with FPU, 128KB Flash, 32KB SRAM" },
      { param: "Gate Driver IC", value: "TI DRV8353HRTAR", note: "Smart Gate Drive (1.4A source / 700mA sink)" },
      { param: "Power MOSFETs", value: "6x Infineon BSC027N10NS5", note: "100V, 2.7 mΩ, SuperSO-8 (TDSON-8)" },
      { param: "Current Sense Shunts", value: "3x 1 mΩ Metal Plate", note: "Low-side 3-shunt topology with Kelvin Sensing" },
      { param: "PCB Stackup / Form Factor", value: "8-Layer High-TG180 FR4", note: "2 oz outer copper / 1 oz inner planes" }
    ],
    features: [
      {
        title: "1. Processing & Control Core",
        items: [
          "STM32G431RBT6 MCU: High-performance motor control MCU with integrated CORDIC co-processor for near-zero latency Park/Clarke transformations.",
          "Dual Clock Source: 24 MHz primary oscillator for system PLL and 32.768 kHz crystal for precise real-time timing.",
          "Onboard Memory: 256 Kbit SPI EEPROM (25LC256-E/SN) for non-volatile calibration parameters, PID coefficients, and motor profiles."
        ]
      },
      {
        title: "2. Inverter Power Stage & Gate Drive",
        items: [
          "Smart Gate Driver (DRV8353H): Eliminates external gate resistors via software-tunable IDRIVE configuration with integrated V_DS monitoring for shoot-through protection.",
          "Optimized Power Stage: Low R_DS(on) (2.7 mΩ) 100V OptiMOS 5 MOSFETs paired with localized 1 nF + 4.7 Ω switch-node RC snubbers to eliminate parasitic ringing.",
          "DC-Link Decoupling: Low-ESR parallel ceramic capacitor bank (4x 47 µF + 2x 100 nF) immediately across the inverter bridge for fast switching transient absorption."
        ]
      },
      {
        title: "3. Sensing & Signal Conditioning",
        items: [
          "3-Phase Low-Side Current Sensing: 1 mΩ shunts routed via strict 4-wire Kelvin differential pairs directly into DRV8353 current sense amplifiers.",
          "Phase Voltage / Sensorless BEMF Sensing: Three buffered resistor divider networks (100 kΩ / 2.7 kΩ) with filter capacitors."
        ]
      }
    ],
    images: [
      {
        src: "Project/BLDC_MC_V1.0/bldc_top.png",
        caption: "Top-side 3D render of BLDC MC V1.0 (Controller, Gate Driver, Inverter Power Stage & Connectors)",
        label: "Top 3D View"
      },
      {
        src: "Project/BLDC_MC_V1.0/bldc_bottom.png",
        caption: "Bottom-side 3D render of BLDC MC V1.0 (Bulk Capacitors, Power Decoupling & Hall Sensor Conditioning)",
        label: "Bottom 3D View"
      }
    ],
    actions: [
      { label: "View on GitHub ↗", url: "https://github.com/AhmedAbo-Eita/BLDC_Motor_Driver", isPrimary: true },
      { label: "Hardware Readme ↗", url: "https://github.com/AhmedAbo-Eita/BLDC_Motor_Driver/blob/main/Hardware/BLDC_MC_V1.0/Readme.md", isPrimary: false }
    ]
  },
  "ecco-lwd": {
    isOpenSource: false,
    typeBadgeText: "",
    typeBadgeClass: "",
    title: "ECCO LWD Tool - Ultrasonic Logging While Drilling",
    tag: "Oil & Gas | Sensing | Nov 2024",
    description:
      "Logging While Drilling (LWD) downhole electronic platform utilizing high-frequency ultrasonic acoustic sensing to evaluate wellbore geometry, caliper dimensions, and cement integrity in real-time drilling jobs. Engineered specifically for harsh downhole environments featuring high ambient temperatures, severe shock, and intense vibration.",
    specs: [
      { param: "Technology Readiness Level", value: "TRL 5 (Field Tested)", note: "Deployed and validated in actual drilling operations" },
      { param: "Acoustic Transducers", value: "High-Frequency Ultrasonic Transceiver", note: "Custom high-voltage firing and low-noise receiving AFE" },
      { param: "Magnetic Telemetry", value: "MAG610 3-Axis Magnetometer", note: "Hard iron & soft iron digital calibration algorithms implemented" },
      { param: "Operating Environment", value: "Downhole Oil & Gas Wells", note: "High pressure, vibration damping, and elevated temperatures" },
      { param: "Key Engineering Role", value: "Circuit Design & Field Bring-Up", note: "PCB schematics, signal conditioning, and troubleshooting" }
    ],
    features: [
      {
        title: "Acoustic Transceiver & Front-End Architecture",
        items: [
          "High-voltage pulse excitation circuitry designed for fast acoustic transducer firing.",
          "High-gain, ultra-low-noise analog receiving chain with precision bandpass filtering.",
          "High-speed ADC digitization and real-time echo time-of-flight acoustic caliper calculation."
        ]
      },
      {
        title: "Directional Compass & Magnetometer Interface",
        items: [
          "MAG610 3-axis magnetometer integration for toolface azimuth and borehole orientation tracking.",
          "Embedded calibration routine for compensating tool chassis magnetic distortion."
        ]
      },
      {
        title: "Downhole Ruggedization & Reliability",
        items: [
          "PCB layout and component selection rated for harsh shock, vibration, and thermal stress.",
          "Field testing and root-cause analysis for zero-lost-time operations."
        ]
      }
    ],
    images: [],
    actions: []
  },
  "elog-system": {
    isOpenSource: false,
    typeBadgeText: "",
    typeBadgeClass: "",
    title: "ELOG System - Ultra-Low Power Mechanical Tool Tracker",
    tag: "Embedded | IoT | Oct 2024",
    description:
      "Autonomous digital tracking platform and environmental data logging system for downhole mechanical drilling tools. Designed from the ground up for ultra-low power consumption targeting more than one full year of continuous runtime on non-rechargeable battery packs.",
    specs: [
      { param: "Target Battery Life", value: "> 1 Year Autonomous Runtime", note: "Deep sleep duty cycling with sub-microamp standby current" },
      { param: "Motion & Runtime Detection", value: "3-Axis Accelerometer Interface", note: "Inclination and vibration-triggered dynamic wake-up" },
      { param: "Data Storage", value: "Non-Volatile Flash Memory", note: "High-density logging of tool vibration, shock, and runtime events" },
      { param: "Power Subsystem", value: "Ultra-Low Quiescent LDO & Regulators", note: "Power-gated sensors to prevent idle leakage" }
    ],
    features: [
      {
        title: "Ultra-Low Power Architecture",
        items: [
          "Duty-cycled sensing engine with hardware interrupt wake-up routines.",
          "Power-gated sensors to prevent parasitic current drain during inactive states.",
          "Sophisticated battery discharge profiling for reliable downhole estimation."
        ]
      },
      {
        title: "Sensor Integration & Detection",
        items: [
          "Accelerometer interface for orientation, tool rotation, and vibration tracking.",
          "Automated detection of mechanical tool engagement and operational runtime."
        ]
      }
    ],
    images: [],
    actions: []
  },
  "ev-fast-charger": {
    isOpenSource: false,
    typeBadgeText: "",
    typeBadgeClass: "",
    title: "Smart EV DC Fast Charger System",
    tag: "EV | Power Electronics | Aug 2023",
    description:
      "Comprehensive electric vehicle DC fast charger power stage and control architecture, including active grid rectification and bidirectional DC-DC converter topologies for high-efficiency battery charging profiles with smart digital control.",
    specs: [
      { param: "Converter Topologies", value: "Dual Active Bridge (DAB) & LLC Resonant", note: "Zero Voltage Switching (ZVS) high-frequency operation" },
      { param: "Control Scheme", value: "Cascaded Loop Digital Control", note: "Constant Current / Constant Voltage (CC/CV) battery charging profiles" },
      { param: "Simulation & Modeling", value: "MATLAB Simulink & LTspice", note: "Full system closed-loop verification and transient simulation" },
      { param: "Key Milestones", value: "Graduation Project (Excellence)", note: "Faculty of Engineering, Alexandria University" }
    ],
    features: [
      {
        title: "Power Stage Topology & Resonant Conversion",
        items: [
          "Active front-end PFC rectifier for high power factor and minimal grid harmonic distortion.",
          "High-frequency isolated DC-DC resonant stage (LLC/DAB) for galvanic isolation and high power density.",
          "Zero-Voltage Switching (ZVS) across a wide load range to minimize switching losses."
        ]
      },
      {
        title: "Closed-Loop Control & Protection",
        items: [
          "Cascaded voltage and current control loops tuned for rapid dynamic response.",
          "Automated transition between constant current (CC) and constant voltage (CV) charging phases."
        ]
      }
    ],
    images: [],
    actions: []
  }
};

const modalOverlay = document.getElementById("projectModalOverlay");
const modalDialog = modalOverlay ? modalOverlay.querySelector(".project-modal-dialog") : null;
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalProjectTag = document.getElementById("modalProjectTag");
const modalTypeBadge = document.getElementById("modalTypeBadge");
const modalProjectTitle = document.getElementById("modalProjectTitle");
const modalProjectDesc = document.getElementById("modalProjectDesc");
const modalSpecsTableBody = document.getElementById("modalSpecsTableBody");
const modalSpecsSection = document.getElementById("modalSpecsSection");
const modalFeaturesSection = document.getElementById("modalFeaturesSection");
const modalFeaturesList = document.getElementById("modalFeaturesList");
const modalActions = document.getElementById("modalActions");
const modalMainImg = document.getElementById("modalMainImg");
const modalImgCaption = document.getElementById("modalImgCaption");
const modalThumbnails = document.getElementById("modalThumbnails");
const modalGalleryCount = document.getElementById("modalGalleryCount");

let currentProjectImages = [];
let currentImageIndex = 0;

function setModalImage(index) {
  if (!currentProjectImages || currentProjectImages.length === 0) return;
  currentImageIndex = (index + currentProjectImages.length) % currentProjectImages.length;
  const currentImg = currentProjectImages[currentImageIndex];

  modalMainImg.style.opacity = "0";
  setTimeout(() => {
    modalMainImg.src = currentImg.src;
    modalMainImg.alt = currentImg.caption || "Project Image";
    modalImgCaption.textContent = currentImg.caption || "";
    modalGalleryCount.textContent = `${currentImageIndex + 1} / ${currentProjectImages.length}`;
    modalMainImg.style.opacity = "1";
  }, 120);

  // Update thumbnail active classes
  const thumbs = modalThumbnails.querySelectorAll(".modal-thumb-btn");
  thumbs.forEach((btn, i) => {
    btn.classList.toggle("active", i === currentImageIndex);
  });
}

function openProjectModal(projectId) {
  const project = projectsData[projectId];
  if (!project || !modalDialog) return;

  // Set Modal Mode (Open-Source vs Company Project)
  if (project.isOpenSource) {
    modalDialog.classList.remove("modal-mode-proprietary");
    modalDialog.classList.add("modal-mode-opensource");
  } else {
    modalDialog.classList.remove("modal-mode-opensource");
    modalDialog.classList.add("modal-mode-proprietary");
  }

  // Set Meta & Type Badge
  modalProjectTag.textContent = project.tag || "Hardware Project";
  if (modalTypeBadge) {
    if (project.typeBadgeText) {
      modalTypeBadge.style.display = "inline-flex";
      modalTypeBadge.textContent = project.typeBadgeText;
      modalTypeBadge.className = `modal-type-badge ${project.typeBadgeClass || ""}`;
    } else {
      modalTypeBadge.style.display = "none";
    }
  }
  modalProjectTitle.textContent = project.title || "Project Details";
  modalProjectDesc.textContent = project.description || "";

  // Render Specifications Table
  if (project.specs && project.specs.length > 0) {
    modalSpecsSection.style.display = "flex";
    modalSpecsTableBody.innerHTML = project.specs
      .map(
        (s) => `
        <tr>
          <td class="modal-specs-param">${s.param}</td>
          <td class="modal-specs-value">
            ${s.value}
            ${s.note ? `<small>${s.note}</small>` : ""}
          </td>
        </tr>
      `
      )
      .join("");
  } else {
    modalSpecsSection.style.display = "none";
  }

  // Render Features List
  if (project.features && project.features.length > 0) {
    modalFeaturesSection.style.display = "flex";
    modalFeaturesList.innerHTML = project.features
      .map(
        (f) => `
        <div class="modal-feature-item">
          <div class="modal-feature-title">${f.title}</div>
          <ul>
            ${f.items.map((it) => `<li>${it}</li>`).join("")}
          </ul>
        </div>
      `
      )
      .join("");
  } else {
    modalFeaturesSection.style.display = "none";
  }

  // Render Actions (Links)
  if (project.actions && project.actions.length > 0) {
    modalActions.style.display = "flex";
    modalActions.innerHTML = project.actions
      .map(
        (a) => `
        <a href="${a.url}" target="_blank" rel="noreferrer" class="${a.isPrimary ? "modal-github-btn" : "modal-secondary-btn"}">
          ${a.label}
        </a>
      `
      )
      .join("");
  } else {
    modalActions.style.display = "none";
    modalActions.innerHTML = "";
  }

  // Render Images (Open Source Mode only)
  currentProjectImages = project.images || [];
  currentImageIndex = 0;

  if (project.isOpenSource && currentProjectImages.length > 0) {
    modalMainImg.src = currentProjectImages[0].src;
    modalMainImg.alt = currentProjectImages[0].caption || "Project Image";
    modalImgCaption.textContent = currentProjectImages[0].caption || "";
    modalGalleryCount.textContent = `1 / ${currentProjectImages.length}`;

    if (currentProjectImages.length > 1) {
      modalThumbnails.style.display = "grid";
      modalThumbnails.innerHTML = currentProjectImages
        .map(
          (img, i) => `
          <button type="button" class="modal-thumb-btn ${i === 0 ? "active" : ""}" data-index="${i}" aria-label="View ${img.label}">
            <img src="${img.src}" alt="${img.label}">
            <span>${img.label}</span>
          </button>
        `
        )
        .join("");

      modalThumbnails.querySelectorAll(".modal-thumb-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-index"), 10);
          setModalImage(idx);
        });
      });
    } else {
      modalThumbnails.style.display = "none";
      modalThumbnails.innerHTML = "";
    }
  }

  // Reset scroll position inside modal container
  const detailsCol = modalDialog.querySelector(".modal-details-col");
  if (detailsCol) detailsCol.scrollTop = 0;

  // Show Modal with Animation
  document.body.classList.add("modal-open");
  modalOverlay.classList.add("active");
  modalOverlay.setAttribute("aria-hidden", "false");
}

function closeProjectModal() {
  document.body.classList.remove("modal-open");
  if (modalOverlay) {
    modalOverlay.classList.remove("active");
    modalOverlay.setAttribute("aria-hidden", "true");
  }
}

// Hook Project Cards: Click & Keyboard Triggers to Open Modal
document.querySelectorAll(".project-card[data-project-id]").forEach((card) => {
  const projectId = card.getAttribute("data-project-id");

  // Click trigger
  card.addEventListener("click", () => {
    openProjectModal(projectId);
  });

  // Keyboard accessibility
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openProjectModal(projectId);
    }
  });
});

if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", closeProjectModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeProjectModal();
    }
  });
}

window.addEventListener("keydown", (e) => {
  if (modalOverlay && modalOverlay.classList.contains("active")) {
    if (e.key === "Escape") {
      closeProjectModal();
    } else if (e.key === "ArrowRight" && currentProjectImages.length > 1) {
      setModalImage(currentImageIndex + 1);
    } else if (e.key === "ArrowLeft" && currentProjectImages.length > 1) {
      setModalImage(currentImageIndex - 1);
    }
  }
});

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
    return pdfNames[index] || item.querySelector("h3")?.textContent || "";
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

      // Trigger reflow
      void iframe.offsetWidth;
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

  item.addEventListener("mouseenter", loadPdf, { passive: true });
  item.addEventListener("click", (event) => {
    if (event.target.closest(".course-cert-container")) return;
    loadPdf();
    item.classList.toggle("expanded");
  });
});
