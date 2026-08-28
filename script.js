// ===== PORTFOLIO DATA ACTIVE STATE =====
let portfolioData = null;

// ===== THEME & COLOR CACHING & TYPOGRAPHY MANAGER =====
const THEME_PRESETS = [
  {
    id: "copper",
    name: "Precision Copper",
    desc: "Warm copper + desaturated teal — workshop default",
    dark: { accent: "#FF7E4A", accent2: "#5BC0BE", bg: "#0B0E14", bgElevated: "#12151F", surface: "#181B28", text: "#EAE6DD" },
    light: { accent: "#D65A28", accent2: "#2A7D7B", bg: "#FCFAF7", bgElevated: "#FFFFFF", surface: "#FFFFFF", text: "#1A1C1E" }
  },
  {
    id: "forge",
    name: "Iron Forge",
    desc: "Aged brass on cold steel — calipers, chassis, vise",
    dark: { accent: "#C48A4A", accent2: "#7E96A8", bg: "#0F1418", bgElevated: "#171C22", surface: "#1F242B", text: "#E6E1D8" },
    light: { accent: "#A65E2A", accent2: "#5B7385", bg: "#F3F0E8", bgElevated: "#FFFFFF", surface: "#FFFFFF", text: "#1E1C1A" }
  },
  {
    id: "graphite",
    name: "Graphite Amber",
    desc: "Desaturated amber signal on graphite — lab instrument",
    dark: { accent: "#C9A86A", accent2: "#8E9B90", bg: "#131415", bgElevated: "#1A1D1E", surface: "#212426", text: "#E8E6E1" },
    light: { accent: "#9C7A3A", accent2: "#6B7C6E", bg: "#F7F5F1", bgElevated: "#FFFFFF", surface: "#FFFFFF", text: "#1E1E1C" }
  },
  {
    id: "oxide",
    name: "Oxide Field",
    desc: "Iron oxide ink on sage olive — field manual",
    dark: { accent: "#B86A3D", accent2: "#7A866B", bg: "#13110F", bgElevated: "#1B1816", surface: "#24211E", text: "#EDE8E0" },
    light: { accent: "#8F4A24", accent2: "#5E6A52", bg: "#F4F1EB", bgElevated: "#FFFFFF", surface: "#FFFFFF", text: "#1E1A16" }
  },
  {
    id: "blueprint",
    name: "Blueprint Archive",
    desc: "Muted blueprint blue on linen — technical drawing",
    dark: { accent: "#6A8EA8", accent2: "#C2B8A3", bg: "#0D1623", bgElevated: "#132034", surface: "#1A2B42", text: "#DDE6F0" },
    light: { accent: "#4A6B8A", accent2: "#8B7F6E", bg: "#EEF2F6", bgElevated: "#FFFFFF", surface: "#FFFFFF", text: "#121C26" }
  },
  {
    id: "concrete",
    name: "Concrete Lab",
    desc: "Stone & concrete with ink — measured, quiet",
    dark: { accent: "#B8BFC6", accent2: "#8F9AA6", bg: "#0E0F11", bgElevated: "#16171A", surface: "#1E1F24", text: "#EDEEF0" },
    light: { accent: "#2E3440", accent2: "#6B7A8A", bg: "#F2F2F3", bgElevated: "#FFFFFF", surface: "#FFFFFF", text: "#0E0F11" }
  }
];

const GOOGLE_FONTS_HEADING = [
  { name: "Sora", family: "'Sora', sans-serif" },
  { name: "Instrument Sans", family: "'Instrument Sans', sans-serif" },
  { name: "Newsreader", family: "'Newsreader', serif" },
  { name: "IBM Plex Sans", family: "'IBM Plex Sans', sans-serif" },
  { name: "Space Grotesk", family: "'Space Grotesk', sans-serif" },
  { name: "Fragment Mono", family: "'Fragment Mono', monospace" }
];

const GOOGLE_FONTS_BODY = [
  { name: "Inter", family: "'Inter', system-ui, -apple-system, sans-serif" },
  { name: "IBM Plex Sans", family: "'IBM Plex Sans', sans-serif" },
  { name: "Work Sans", family: "'Work Sans', sans-serif" },
  { name: "Source Sans 3", family: "'Source Sans 3', sans-serif" },
  { name: "Instrument Sans", family: "'Instrument Sans', sans-serif" }
];

const GOOGLE_FONTS_MONO = [
  { name: "JetBrains Mono", family: "'JetBrains Mono', monospace" },
  { name: "IBM Plex Mono", family: "'IBM Plex Mono', monospace" },
  { name: "Fragment Mono", family: "'Fragment Mono', monospace" },
  { name: "Space Mono", family: "'Space Mono', monospace" }
];

const DEFAULT_THEME = {
  preset: "copper",
  dark: {
    accent: "#FF7E4A",
    accent2: "#5BC0BE",
    bg: "#0B0E14",
    bgElevated: "#12151F",
    surface: "#181B28",
    text: "#EAE6DD"
  },
  light: {
    accent: "#D65A28",
    accent2: "#2A7D7B",
    bg: "#FCFAF7",
    bgElevated: "#FFFFFF",
    surface: "#FFFFFF",
    text: "#1A1C1E"
  },
  fonts: {
    heading: "Sora",
    body: "Inter",
    mono: "JetBrains Mono"
  }
};

function hexToRgb(hex) {
  if (!hex) return "255, 126, 74";
  let c = hex.replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  if (c.length !== 6) return "255, 126, 74";
  const num = parseInt(c, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

function loadGoogleFont(fontName) {
  if (!fontName || fontName === "System Sans") return;
  const linkId = `gfont-${fontName.replace(/\s+/g, "-").toLowerCase()}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
  }
}

function getSystemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme() {
  try {
    const saved = sessionStorage.getItem("portfolio_theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch (e) {}
  return null;
}

let isDarkTheme = (document.documentElement.getAttribute("data-theme") || getStoredTheme() || getSystemTheme()) === "dark";
let accentRgb = isDarkTheme ? "255, 126, 74" : "214, 90, 40";
let secondAccentRgb = isDarkTheme ? "91, 192, 190" : "42, 125, 123";

function updateThemeColors() {
  isDarkTheme = document.documentElement.getAttribute("data-theme") === "dark";
  const currentThemeObj = (portfolioData && portfolioData.theme) || DEFAULT_THEME;
  const colors = (currentThemeObj && (isDarkTheme ? currentThemeObj.dark : currentThemeObj.light)) || {};

  accentRgb = hexToRgb(colors.accent || (isDarkTheme ? "#FF7E4A" : "#D65A28"));
  secondAccentRgb = hexToRgb(colors.accent2 || (isDarkTheme ? "#5BC0BE" : "#2A7D7B"));
}

function applyCustomTheme(themeData) {
  const currentTheme = themeData || (portfolioData && portfolioData.theme) || DEFAULT_THEME;
  if (!currentTheme) return;

  const isDark = (document.documentElement.getAttribute("data-theme") || "dark") === "dark";
  const colors = (isDark ? currentTheme.dark : currentTheme.light) || {};
  const fonts = currentTheme.fonts || {};
  const root = document.documentElement;

  // Colors
  if (colors.accent) {
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--border-strong", `color-mix(in srgb, ${colors.accent} 35%, transparent)`);
    root.style.setProperty("--glow", `color-mix(in srgb, ${colors.accent} 20%, transparent)`);
  }
  if (colors.accent2) {
    root.style.setProperty("--accent-2", colors.accent2);
  }
  if (colors.bg) {
    root.style.setProperty("--bg", colors.bg);
  }
  if (colors.bgElevated) {
    root.style.setProperty("--bg-elevated", colors.bgElevated);
  }
  if (colors.surface) {
    root.style.setProperty("--surface-strong", colors.surface);
  }
  if (colors.text) {
    root.style.setProperty("--text", colors.text);
  }

  // Fonts
  if (fonts.heading) {
    loadGoogleFont(fonts.heading);
    const headingDef = GOOGLE_FONTS_HEADING.find((f) => f.name === fonts.heading);
    root.style.setProperty("--font-heading", headingDef ? headingDef.family : `'${fonts.heading}', sans-serif`);
  }
  if (fonts.body) {
    loadGoogleFont(fonts.body);
    const bodyDef = GOOGLE_FONTS_BODY.find((f) => f.name === fonts.body);
    root.style.setProperty("--font-body", bodyDef ? bodyDef.family : `'${fonts.body}', sans-serif`);
  }
  if (fonts.mono) {
    loadGoogleFont(fonts.mono);
    const monoDef = GOOGLE_FONTS_MONO.find((f) => f.name === fonts.mono);
    root.style.setProperty("--font-mono", monoDef ? monoDef.family : `'${fonts.mono}', monospace`);
  }

  updateThemeColors();
}

function applyTheme(theme, persist = false) {
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  const themeLabel = document.getElementById("themeLabel");
  if (themeLabel) {
    themeLabel.textContent = theme === "light" ? "Light" : "Dark";
  }
  if (persist) {
    try {
      sessionStorage.setItem("portfolio_theme", theme);
    } catch (e) {}
  }
  applyCustomTheme();
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || (isDarkTheme ? "dark" : "light");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme, true);
}

// Automatically sync when system color scheme changes in OS
if (window.matchMedia) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemThemeChange = (e) => {
    try {
      sessionStorage.removeItem("portfolio_theme");
    } catch (err) {}
    applyTheme(e.matches ? "dark" : "light", false);
  };
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleSystemThemeChange);
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(handleSystemThemeChange);
  }
}

// Initial theme label and variable sync
applyTheme(document.documentElement.getAttribute("data-theme") || getStoredTheme() || getSystemTheme(), false);

// ===== CIRCUIT CANVAS (HIGH PERFORMANCE) =====
const canvas = document.getElementById("circuitCanvas");
const ctx = canvas ? canvas.getContext("2d", { alpha: true, desynchronized: true }) : null;
let width = 0;
let height = 0;
let traces = [];
let mouse = { x: 0, y: 0, active: false };
let isPageVisible = !document.hidden;
let animFrameId = null;

function resizeCanvas() {
  if (!canvas || !ctx) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
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
  if (!ctx) return;
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
  if (!ctx || !mouse.active) return;
  const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
  gradient.addColorStop(0, `rgba(${accentRgb}, 0.12)`);
  gradient.addColorStop(1, `rgba(${accentRgb}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(mouse.x - 160, mouse.y - 160, 320, 320);
}

function animateCanvas() {
  if (!ctx) return;
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
  if (isPageVisible && !animFrameId && ctx) {
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

if (canvas) {
  resizeCanvas();
  animFrameId = requestAnimationFrame(animateCanvas);
}

// ===== SCROLL REVEALS & ACTIVE NAV OBSERVERS =====
let revealObserver = null;
function initRevealObserver() {
  if (revealObserver) {
    revealObserver.disconnect();
  }
  revealObserver = new IntersectionObserver(
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
    element.style.transitionDelay = `${Math.min((index % 6) * 40, 200)}ms`;
    revealObserver.observe(element);
  });
}

// Active nav indicator
const navSections = document.querySelectorAll("main section[id]");
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

navSections.forEach((section) => navObserver.observe(section));

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

// ==========================================================================
// DEFAULT PORTFOLIO DATA STORE (Instant Offline Fallback & Source of Truth)
// ==========================================================================
const DEFAULT_PORTFOLIO_DATA = {
  hero: {
    eyebrow: "Hardware | Embedded | Power Electronics",
    title: "Reliable electronics from schematic to field.",
    description:
      "Hardware Design Engineer designing electronic systems, PCBs, and power stages for oil and gas tools, EV charging, motor control, and embedded sensing platforms.",
    email: "ahmedaboeita2233@gmail.com",
    linkedin: "https://www.linkedin.com/in/ahmed-aboeita-747948204/",
    github: "https://github.com/AhmedAbo-Eita",
    status: "Available for hardware design roles",
    signals: ["8-layer PCB", "Signal Integrity", "Power Conversion", "Field Testing"],
    quickStats: [
      { label: "Current", value: "MIT-Technologies" },
      { label: "Base", value: "Egypt / KL Malaysia" },
      { label: "Degree", value: "B.Sc. Electrical Power & Machines" }
    ]
  },
  experiences: [
    {
      id: "exp-1",
      role: "Hardware Design Engineer",
      company: "MIT-Technologies",
      dates: "Oct 2024 - Present",
      location: "Hybrid | Egypt / KL Malaysia",
      bullets: [
        "Developing electronic systems, circuits, and PCBs for smart oil and gas tools.",
        "Leading testing and troubleshooting to improve reliability and electronic performance.",
        "Driving design improvements through field feedback and emerging hardware practices."
      ]
    },
    {
      id: "exp-2",
      role: "Hardware Engineer - Internship",
      company: "EVFLASH",
      dates: "Apr 2024 - Aug 2024",
      location: "Cairo, Egypt",
      bullets: [
        "Designed hardware systems for electric vehicle off-board AC chargers.",
        "Analyzed system requirements and created PCB schematics.",
        "Built PCB layouts following industry manufacturing standards."
      ]
    },
    {
      id: "exp-3",
      role: "Hardware Design Trainee",
      company: "Under Dr. Ayman Samy Khalil",
      dates: "Jun 2023 - Oct 2023",
      location: "Training Program",
      bullets: [
        "Designed a DC-DC buck converter from scratch.",
        "Simulated converter behavior using MATLAB Simulink and LTspice.",
        "Generated schematics and PCB layouts using Altium Designer."
      ]
    }
  ],
  projects: [
    {
      id: "bldc-motor-driver",
      isOpenSource: true,
      typeBadgeText: "Open Source ✦",
      typeBadgeClass: "badge-open-source",
      title: "60V / 30A High-Performance BLDC & PMSM Motor Controller (ESC)",
      cardTitle: "BLDC Motor Driver",
      tag: "PCB | Power Electronics | Jan 2026",
      cardExcerpt:
        "High-performance 8-layer power PCB for a brushless DC motor driver, engineered for high-current applications and robust thermal behavior.",
      cardBullets: [
        "8-layer stackup with complex signal integrity management",
        "High-current routing and dedicated ground planes for EMI reduction",
        "Power MOSFETs and driver stages for industrial and robotic systems"
      ],
      hoverImage: "Project/BLDC_MC_V1.0/bldc_top.png",
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
    {
      "id": "ecco-lwd",
      isOpenSource: false,
      typeBadgeText: "Private ✦",
      typeBadgeClass: "badge-private",
      title: "ECCO LWD Tool - Ultrasonic Logging While Drilling",
      cardTitle: "ECCO LWD Tool",
      tag: "Oil & Gas | Sensing | Nov 2024",
      cardExcerpt:
        "Logging While Drilling tool using high-frequency ultrasonic sensing to evaluate wellbore conditions in real time. Currently at TRL5 and tested in drilling jobs.",
      cardBullets: [
        "Ultrasonic sensor firing and receiving board design",
        "MAG610 magnetometer interface circuit with MCU integration",
        "Hard iron and soft iron calibration for accurate sensor readings"
      ],
      hoverImage: "",
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
    {
      "id": "elog-system",
      isOpenSource: false,
      typeBadgeText: "Private ✦",
      typeBadgeClass: "badge-private",
      title: "ELOG System - Ultra-Low Power Mechanical Tool Tracker",
      cardTitle: "ELOG System",
      tag: "Embedded | IoT | Oct 2024",
      cardExcerpt:
        "Digital tracking platform for mechanical drilling tools, designed for ultra-low power operation and long-term field logging.",
      cardBullets: [
        "Ultra-low-power logging system targeting one-year battery life",
        "Accelerometer interface for inclination-based runtime detection",
        "Embedded sensing chain designed for harsh field conditions"
      ],
      hoverImage: "",
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
    {
      "id": "ev-fast-charger",
      isOpenSource: false,
      typeBadgeText: "Private ✦",
      typeBadgeClass: "badge-private",
      title: "Smart EV DC Fast Charger System",
      cardTitle: "Smart EV DC Fast Charger",
      tag: "EV | Power Electronics | Aug 2023",
      cardExcerpt:
        "Graduation project covering full EV fast charger design, including AC-DC active rectifier and DC-DC converter control strategies.",
      cardBullets: [
        "Simulated Dual Active Bridge and LLC resonant converters",
        "Implemented cascaded loop control for LLC converters",
        "Designed battery charging control using a DAB converter"
      ],
      hoverImage: "",
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
            "Dual-loop digital PI control for seamless CC/CV transition during lithium-ion battery charge cycles.",
            "Hardware overcurrent, overvoltage, and thermal protection cutoff circuits."
          ]
        }
      ],
      images: [],
      actions: []
    }
  ],
  skills: [
    {
      category: "Design",
      tags: ["PCB Design", "Schematics", "High-Speed Design", "Signal Integrity", "EMI/EMC"]
    },
    {
      category: "EDA Tools",
      tags: ["Altium Designer", "KiCad", "ADS", "LTspice"]
    },
    {
      category: "Simulation",
      tags: ["MATLAB", "Simulink", "LTspice", "MBD"]
    },
    {
      category: "Programming",
      tags: ["C", "Modern C++", "Python", "Embedded C", "Qt"]
    },
    {
      category: "Embedded",
      tags: ["ATmega", "STM32", "TI C2000", "ARM", "RTOS"]
    },
    {
      category: "Power Electronics",
      tags: ["DC-DC Converters", "Gate Drivers", "EV Charging", "DAB", "LLC"]
    }
  ],
  education: {
    degree: "B.Sc. Electrical Power & Machines Engineering",
    institution: "Faculty of Engineering - Alexandria University",
    dates: "Sep 2019 - Jun 2024",
    gpa: "3.01",
    gpaScale: "CGPA / 4.0"
  },
  courses: [
    {
      id: "high-speed-digital-design",
      isCourse: true,
      isOpenSource: true,
      typeBadgeText: "Verified ✦",
      typeBadgeClass: "badge-open-source",
      title: "High-Speed Digital Design Masterclass",
      cardTitle: "High-Speed Digital Design Masterclass",
      instructor: "Prof. Dr. Eric Bogatin",
      dates: "Apr 2026 - Present",
      type: "Online Masterclass",
      iconSrc: "Icons/The Engineering EEcosystem.png",
      iconDark: false,
      tag: "Signal Integrity | Eric Bogatin | Apr 2026",
      cardBullets: [
        "Identifying and solving noise, crosstalk, and power integrity issues",
        "Designing high-speed traces and board layers for impedance control",
        "Advanced modeling and measurements for timing and signal health"
      ],
      description:
        "Comprehensive 4-part masterclass led by Prof. Dr. Eric Bogatin covering high-speed transmission line fundamentals, return path continuity, differential pair routing, dielectric losses, crosstalk mitigation, and gigabit serial link design.",
      specs: [
        { param: "Instructor", value: "Prof. Dr. Eric Bogatin", note: "Signal Integrity Evangelist & Professor at CU Boulder" },
        { param: "Institution", value: "The Engineering EEcosystem", note: "Advanced Engineering Education Platform" },
        { param: "Scope & Series", value: "4-Part Comprehensive Masterclass", note: "Foundations, Single-Ended, Differential, Serial Links" },
        { param: "Core Engineering Domain", value: "Signal Integrity (SI) & Power Integrity (PI)", note: "High-frequency PCB stackup, impedance matching, EMC" }
      ],
      features: [
        {
          title: "Part 1: High-Speed Design Foundations",
          items: [
            "Bandwidth vs rise time relationships and lumped vs distributed circuit models.",
            "Characteristic impedance, return path continuity, and loop inductance control.",
            "Decoupling capacitor placement and PDN impedance optimization."
          ]
        },
        {
          title: "Part 2: Single-Ended Transmission Lines & Signal Behavior",
          items: [
            "Reflection noise, termination topologies (series, parallel, AC), and overshoot control.",
            "Microstrip and stripline impedance calculations and layer stackup rules.",
            "Dielectric constant (Dk) and dissipation factor (Df) high-frequency losses."
          ]
        },
        {
          title: "Part 3: Differential Pair Transmission Lines & Signals",
          items: [
            "Odd/even mode impedance, differential impedance (Zdiff), and common-mode conversion.",
            "Symmetric routing, intra-pair skew, and length matching constraints.",
            "Crosstalk minimization between adjacent high-speed differential pairs."
          ]
        },
        {
          title: "Part 4: High-Speed Serial Links",
          items: [
            "Eye diagram analysis, jitter decomposition (RJ, DJ, ISI), and BER targets.",
            "Loss compensation: Pre-emphasis, de-emphasis, and continuous-time linear equalization (CTLE).",
            "Via stubs, backdrilling, and high-speed connector breakouts."
          ]
        }
      ],
      images: [
        {
          src: "certificates/high_speed_digital_design.jpeg",
          caption: "Part 1: High-Speed Design Foundations — Prof. Dr. Eric Bogatin (The Engineering EEcosystem)",
          label: "Part 1"
        },
        {
          src: "certificates/high_speed_digital_design_2.jpeg",
          caption: "Part 2: Single-ended Transmission Lines & Signal Behavior — Prof. Dr. Eric Bogatin",
          label: "Part 2"
        },
        {
          src: "certificates/high_speed_digital_design_3.jpeg",
          caption: "Part 3: Differential Pair Transmission Lines and Signals — Prof. Dr. Eric Bogatin",
          label: "Part 3"
        },
        {
          src: "certificates/high_speed_digital_design_4_page-0001.jpg",
          caption: "Part 4: High-speed Serial Links — Prof. Dr. Eric Bogatin",
          label: "Part 4"
        }
      ],
      actions: [
        { label: "Download Certificate PDF ↗", url: "certificates/high_speed_digital_design.pdf", isPrimary: true }
      ]
    },
    {
      id: "mixed-signal-hardware-design",
      isCourse: true,
      isOpenSource: true,
      typeBadgeText: "Verified ✦",
      typeBadgeClass: "badge-open-source",
      title: "Mixed-Signal Hardware Design",
      cardTitle: "Mixed-Signal Hardware Design",
      instructor: "Philip Salmony",
      dates: "Jan 2026 - Feb 2026",
      type: "Online Course",
      iconSrc: "Icons/Fedevel.png",
      iconDark: true,
      tag: "PCB Design | FEDEVEL | Feb 2026",
      cardBullets: [
        "Full hardware life cycle from concept to manufacturing-ready prototypes",
        "4-layer board design integrating USB, MCUs, and switching converters",
        "High-precision analog filters, op-amps, and ADC/DAC interfaces"
      ],
      description:
        "Full hardware life cycle from concept to manufacturing-ready prototypes. Completed 4-layer mixed-signal board design integrating USB, microcontrollers, switching power converters, and high-precision analog sensing chains.",
      specs: [
        { param: "Instructor", value: "Philip Salmony", note: "Hardware Design Engineer & Educator" },
        { param: "Academy", value: "FEDEVEL Academy", note: "Professional Hardware Design Institution" },
        { param: "Board Architecture", value: "4-Layer Mixed-Signal Board", note: "Integrated digital MCU, USB, and precision analog frontend" },
        { param: "Design Tools", value: "Altium Designer", note: "Schematic capture, PCB layout, Gerber generation, and BOM management" }
      ],
      features: [
        {
          title: "Analog & Digital Partitioning",
          items: [
            "Proper ground plane management (star grounding & split ground planes with bridge routing).",
            "Minimizing digital switching noise coupling into sensitive analog sensor lines.",
            "Differential routing for precision ADC analog inputs and op-amp filters."
          ]
        },
        {
          title: "Power Supply & Converter Design",
          items: [
            "High-efficiency switching regulator layout with low-EMI switch node loops.",
            "Linear low-dropout (LDO) post-regulation for ultra-clean analog voltage rails.",
            "Input reverse-polarity protection, TVS surge clamping, and power sequencing."
          ]
        },
        {
          title: "Design for Manufacturing (DFM/DFA)",
          items: [
            "Generating IPC-compliant footprints, solder paste masks, and drill charts.",
            "BOM optimization and component lifecycle risk assessment.",
            "Automated test point placement and design for testability (DFT)."
          ]
        }
      ],
      images: [
        {
          src: "certificates/Mixed-Signal Hardware Design_page-0001.jpg",
          caption: "Mixed-Signal Hardware Design Certificate — FEDEVEL Academy (Philip Salmony)",
          label: "Certificate"
        }
      ],
      actions: [
        { label: "Download Certificate PDF ↗", url: "certificates/Mixed-Signal Hardware Design.pdf", isPrimary: true }
      ]
    },
    {
      id: "mastering-embedded-systems",
      isCourse: true,
      isOpenSource: true,
      typeBadgeText: "Verified ✦",
      typeBadgeClass: "badge-open-source",
      title: "Mastering Embedded Systems Diploma",
      cardTitle: "Mastering Embedded Systems Diploma",
      instructor: "Keroles Shenouda",
      dates: "Oct 2023 - Oct 2024",
      type: "Professional Diploma",
      iconSrc: "Icons/learn-in-depth.png",
      iconDark: false,
      tag: "Embedded | Learn In Depth | Oct 2024",
      cardBullets: [
        "In-depth embedded C, ARM Cortex-M architecture, and MCU peripherals",
        "Hardware abstraction layers (HAL), device drivers, and FreeRTOS scheduling",
        "Communication protocols: UART, SPI, I2C, CAN, and hardware debugging"
      ],
      description:
        "Intensive embedded systems engineering diploma covering bare-metal firmware development, hardware abstraction layers (HAL), communication protocols (UART, SPI, I2C, CAN), RTOS scheduling, and MCU peripherals across ARM Cortex-M, STM32, and TI C2000.",
      specs: [
        { param: "Program", value: "Mastering Embedded Systems Diploma", note: "Comprehensive Embedded Engineering Curriculum" },
        { param: "Platform", value: "Learn In Depth", note: "Professional Embedded Systems Academy" },
        { param: "Target Architectures", value: "ARM Cortex-M (STM32), AVR (ATmega), TI C2000", note: "32-bit & 8-bit embedded architectures" },
        { param: "Core Languages", value: "C, Embedded C, Modern C++", note: "Low-level register programming & MISRA-C standards" }
      ],
      features: [
        {
          title: "Microcontroller Peripherals & Drivers",
          items: [
            "Developed bare-metal register-level drivers for GPIO, Timers, PWM, ADC, and NVIC.",
            "Implemented master/slave drivers for UART, SPI, and I2C communication protocols.",
            "CAN bus architecture, message filtering, and transceiver interfacing."
          ]
        },
        {
          title: "Real-Time Operating Systems (FreeRTOS)",
          items: [
            "Task creation, preemptive priority scheduling, and context switching.",
            "Inter-task communication using Queues, Semaphores, and Event Groups.",
            "Memory management, stack overflow protection, and priority inversion mitigation."
          ]
        },
        {
          title: "Hardware-Software Co-Design",
          items: [
            "Interfacing sensors, motor drivers, LCDs, and wireless transceivers.",
            "Low-power operating modes and sleep-state current optimization.",
            "Debugging with hardware oscilloscopes, logic analyzers, and SWD/JTAG debuggers."
          ]
        }
      ],
      images: [
        {
          src: "certificates/mastering-embedded-systems.jpeg",
          caption: "Mastering Embedded Systems Diploma Certificate — Learn In Depth",
          label: "Diploma"
        }
      ],
      actions: [
        { label: "Download Certificate PDF ↗", url: "certificates/mastering-embedded-systems.pdf", isPrimary: true }
      ]
    },
    {
      id: "udemy-self-study",
      isCourse: true,
      isOpenSource: false,
      typeBadgeText: "Self-Study ✦",
      typeBadgeClass: "badge-private",
      title: "Self-Study & Specialized Courses",
      cardTitle: "Self-Study & Specialized Courses",
      instructor: "Various Instructors",
      dates: "Ongoing",
      type: "Self-Paced Courses",
      iconSrc: "Icons/Udemy.png",
      iconDark: false,
      tag: "Power Electronics | Embedded | Ongoing",
      cardBullets: [
        "DC-DC switch mode converter topologies, magnetics, and closed-loop control",
        "Model-Based Development (MBD) with MATLAB / Simulink for automotive",
        "Modern C++ and Qt 6 GUI applications for hardware test automation"
      ],
      description:
        "Continuous self-directed learning and deep-dive technical courses spanning power electronics topologies, model-based development, and software tools.",
      specs: [
        { param: "Focus Areas", value: "Power Electronics & GUI Development", note: "Automotive MBD, Simulink, and Qt 6 C++" },
        { param: "Platforms", value: "Udemy & Professional Courses", note: "Continuous technical advancement" }
      ],
      features: [
        {
          title: "Power Electronics & Electrical Protection",
          items: [
            "Design and analysis of DC-DC switch-mode converters (Buck, Boost, Flyback, Full-Bridge).",
            "Transformer design, magnetic core selection, and high-frequency inductor winding.",
            "Electrical power system protection schemes, relays, and circuit breakers."
          ]
        },
        {
          title: "Model-Based Development (MBD) for Automotive",
          items: [
            "MATLAB / Simulink and Stateflow control algorithms.",
            "Auto-code generation for automotive ECUs and motor control loops.",
            "MIL / SIL verification and testing."
          ]
        },
        {
          title: "Qt 6 C++ GUI Development",
          items: [
            "Cross-platform desktop application development for hardware testing tools.",
            "Real-time telemetry plotting, serial/CAN communication GUI widgets.",
            "Multi-threading for asynchronous hardware data logging."
          ]
        }
      ],
      images: [],
      actions: []
    }
  ],
  theme: {
    preset: "copper",
    dark: {
      accent: "#FF7E4A",
      accent2: "#5BC0BE",
      bg: "#0B0E14",
      bgElevated: "#12151F",
      surface: "#181B28",
      text: "#EAE6DD"
    },
    light: {
      accent: "#D65A28",
      accent2: "#2A7D7B",
      bg: "#FCFAF7",
      bgElevated: "#FFFFFF",
      surface: "#FFFFFF",
      text: "#1A1C1E"
    },
    fonts: {
      heading: "Sora",
      body: "Inter",
      mono: "JetBrains Mono"
    }
  }
};

// Global Active State
portfolioData = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
let projectsLookup = {};

// Load saved data or fetch from JSON
async function initPortfolioData() {
  const localSaved = localStorage.getItem("portfolio_data_override");
  if (localSaved) {
    try {
      portfolioData = JSON.parse(localSaved);
      applyCustomTheme();
      renderAll();
      return;
    } catch (e) {
      console.warn("Failed to parse local storage override, falling back to JSON / default", e);
    }
  }

  try {
    const res = await fetch("data/portfolio-data.json");
    if (res.ok) {
      const data = await res.json();
      portfolioData = data;
    }
  } catch (err) {
    console.info("Using embedded default portfolio data", err);
  }
  applyCustomTheme();
  renderAll();
}

function savePortfolioDataLocally() {
  localStorage.setItem("portfolio_data_override", JSON.stringify(portfolioData));
}

// ==========================================================================
// DYNAMIC DOM RENDER ENGINE
// ==========================================================================
function renderAll() {
  buildProjectsLookup();
  renderHero();
  renderExperiences();
  renderProjects();
  renderSkills();
  renderEducation();
  renderCourses();
  initRevealObserver();
  attachCardClickHandlers();
}

function buildProjectsLookup() {
  projectsLookup = {};
  if (portfolioData.projects) {
    portfolioData.projects.forEach((p) => {
      projectsLookup[p.id] = p;
    });
  }
  if (portfolioData.courses) {
    portfolioData.courses.forEach((c) => {
      projectsLookup[c.id] = c;
    });
  }
}

function renderHero() {
  const h = portfolioData.hero;
  if (!h) return;

  const eyebrowEl = document.querySelector(".hero-copy .eyebrow");
  if (eyebrowEl && h.eyebrow) eyebrowEl.textContent = h.eyebrow;

  const titleEl = document.querySelector(".hero-copy h1");
  if (titleEl && h.title) titleEl.textContent = h.title;

  const descEl = document.querySelector(".hero-copy .hero-desc");
  if (descEl && h.description) descEl.textContent = h.description;

  const emailLink = document.querySelector('.hero-actions a[href^="mailto:"]');
  if (emailLink && h.email) emailLink.setAttribute("href", `mailto:${h.email}`);

  const linkedinLink = document.querySelector('.hero-actions a[href*="linkedin.com"]');
  if (linkedinLink && h.linkedin) linkedinLink.setAttribute("href", h.linkedin);

  const githubLink = document.querySelector('.hero-actions a[href*="github.com"]');
  if (githubLink && h.github) githubLink.setAttribute("href", h.github);

  const signalStrip = document.querySelector(".signal-strip");
  if (signalStrip && h.signals && h.signals.length > 0) {
    signalStrip.innerHTML = h.signals.map((s) => `<span>${s}</span>`).join("");
  }

  const profileStatus = document.querySelector(".profile-status");
  if (profileStatus && h.status) {
    profileStatus.innerHTML = `<span class="status-dot"></span>${h.status}`;
  }

  const quickStatsEl = document.querySelector(".quick-stats");
  if (quickStatsEl && h.quickStats && h.quickStats.length > 0) {
    quickStatsEl.innerHTML = h.quickStats
      .map(
        (st) => `
      <div>
        <dt>${st.label}</dt>
        <dd>${st.value}</dd>
      </div>
    `
      )
      .join("");
  }
}

function renderExperiences() {
  const container = document.querySelector("#experience .timeline");
  if (!container || !portfolioData.experiences) return;

  container.innerHTML = portfolioData.experiences
    .map(
      (exp) => `
    <article class="timeline-item reveal" data-exp-id="${exp.id}">
      <div class="timeline-meta">
        <span>${exp.dates}</span>
        <span>${exp.location}</span>
      </div>
      <div class="timeline-body">
        <h3>${exp.role}</h3>
        <p class="company">${exp.company}</p>
        <ul>
          ${(exp.bullets || []).map((b) => `<li>${b}</li>`).join("")}
        </ul>
      </div>
    </article>
  `
    )
    .join("");
}

function renderProjects() {
  const container = document.querySelector("#projects .projects-grid");
  if (!container || !portfolioData.projects) return;

  container.innerHTML = portfolioData.projects
    .map((p) => {
      const badgeHtml = p.typeBadgeText
        ? `<span class="project-card-badge ${p.typeBadgeClass || (p.isOpenSource ? "badge-open-source" : "badge-private")}">${p.typeBadgeText}</span>`
        : "";

      const hoverImgHtml = p.hoverImage
        ? `<img src="${p.hoverImage}" alt="${p.cardTitle || p.title}" class="hover-3d-img" loading="lazy">`
        : "";

      return `
      <article class="project-card reveal" data-project-id="${p.id}" tabindex="0" role="button"
        aria-label="View ${p.cardTitle || p.title} technical specs">
        <div class="project-card-inner">
          <div class="project-card-header">
            <p class="project-tag">${p.tag || ""}</p>
            ${badgeHtml}
          </div>
          <h3>${p.cardTitle || p.title}</h3>
          <p>${p.cardExcerpt || p.description || ""}</p>
          <ul>
            ${(p.cardBullets || []).map((b) => `<li>${b}</li>`).join("")}
          </ul>
        </div>

        <div class="project-hover-overlay" aria-hidden="true">
          <div class="project-hover-content">
            ${hoverImgHtml}
            <button type="button" class="project-hover-btn" tabindex="-1">
              <span>Explore Project</span>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `;
    })
    .join("");
}

function renderSkills() {
  const container = document.querySelector("#skills .skills-grid");
  if (!container || !portfolioData.skills) return;

  container.innerHTML = portfolioData.skills
    .map(
      (s) => `
    <article class="skill-group reveal">
      <h3>${s.category}</h3>
      <div class="skill-tags">
        ${(s.tags || []).map((t) => `<span>${t}</span>`).join("")}
      </div>
    </article>
  `
    )
    .join("");
}

function renderEducation() {
  const container = document.querySelector("#education .education-card");
  const ed = portfolioData.education;
  if (!container || !ed) return;

  container.innerHTML = `
    <div>
      <h3>${ed.degree}</h3>
      <p>${ed.institution}</p>
      <span>${ed.dates}</span>
    </div>
    <div class="gpa-box">
      <strong>${ed.gpa}</strong>
      <span>${ed.gpaScale || "CGPA / 4.0"}</span>
    </div>
  `;
}

function renderCourses() {
  const container = document.querySelector("#courses .courses-list");
  if (!container || !portfolioData.courses) return;

  container.innerHTML = portfolioData.courses
    .map((c) => {
      const badgeHtml = c.typeBadgeText
        ? `<span class="project-card-badge ${c.typeBadgeClass || "badge-open-source"}">${c.typeBadgeText}</span>`
        : "";

      const iconClass = c.iconDark ? "course-icon course-icon-dark" : "course-icon";
      const iconHtml = c.iconSrc
        ? `<div class="${iconClass}"><img src="${c.iconSrc}" alt="${c.cardTitle || c.title}" loading="lazy"></div>`
        : "";

      const subtitle = [c.instructor, c.dates, c.type].filter(Boolean).join(" | ");

      return `
      <article class="course-card reveal" data-course-id="${c.id}" tabindex="0" role="button"
        aria-label="View ${c.cardTitle || c.title} certificate popup">
        <div class="course-card-inner">
          <div class="course-top">
            ${iconHtml}
            <div class="course-info">
              <div class="course-header-row">
                <h3>${c.cardTitle || c.title}</h3>
                ${badgeHtml}
              </div>
              <p>${subtitle}</p>
            </div>
          </div>
          <ul class="course-bullets">
            ${(c.cardBullets || []).map((b) => `<li>${b}</li>`).join("")}
          </ul>
        </div>

        <div class="course-hover-overlay" aria-hidden="true">
          <button type="button" class="course-hover-btn" tabindex="-1">
            <span>${c.images && c.images.length > 0 ? "View Certificate" : "Explore Syllabus"}</span>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </button>
        </div>
      </article>
    `;
    })
    .join("");
}

// ==========================================================================
// DYNAMIC MODAL DIALOG CONTROLLER (Projects & Courses)
// ==========================================================================
const modalOverlay = document.getElementById("projectModalOverlay");
const modalDialog = modalOverlay ? modalOverlay.querySelector(".project-modal-dialog") : null;
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalProjectTag = document.getElementById("modalProjectTag");
const modalTypeBadge = document.getElementById("modalTypeBadge");
const modalProjectTitle = document.getElementById("modalProjectTitle");
const modalProjectDesc = document.getElementById("modalProjectDesc");
const modalSpecsHeading = document.getElementById("modalSpecsHeading");
const modalSpecsTableBody = document.getElementById("modalSpecsTableBody");
const modalSpecsSection = document.getElementById("modalSpecsSection");
const modalFeaturesHeading = document.getElementById("modalFeaturesHeading");
const modalFeaturesSection = document.getElementById("modalFeaturesSection");
const modalFeaturesList = document.getElementById("modalFeaturesList");
const modalGalleryBadge = document.getElementById("modalGalleryBadge");
const modalActions = document.getElementById("modalActions");
const modalGalleryActions = document.getElementById("modalGalleryActions");
const modalMainImg = document.getElementById("modalMainImg");
const modalImgCaption = document.getElementById("modalImgCaption");
const modalThumbnails = document.getElementById("modalThumbnails");
const modalGalleryCount = document.getElementById("modalGalleryCount");

let currentProjectImages = [];
let currentImageIndex = 0;

function setModalImage(index) {
  if (!currentProjectImages || currentProjectImages.length === 0 || !modalMainImg) return;
  currentImageIndex = (index + currentProjectImages.length) % currentProjectImages.length;
  const currentImg = currentProjectImages[currentImageIndex];

  modalMainImg.style.opacity = "0";
  setTimeout(() => {
    modalMainImg.src = currentImg.src;
    modalMainImg.alt = currentImg.caption || "Image Preview";
    if (modalImgCaption) modalImgCaption.textContent = currentImg.caption || "";
    if (modalGalleryCount) {
      modalGalleryCount.textContent =
        currentProjectImages.length > 1
          ? `${currentImageIndex + 1} / ${currentProjectImages.length}`
          : modalDialog && modalDialog.classList.contains("modal-mode-certificate")
          ? "Verified ✦"
          : `1 / 1`;
    }
    modalMainImg.style.opacity = "1";
  }, 120);

  if (modalThumbnails) {
    const thumbs = modalThumbnails.querySelectorAll(".modal-thumb-btn");
    thumbs.forEach((btn, i) => {
      btn.classList.toggle("active", i === currentImageIndex);
    });
  }
}

function openProjectModal(projectId) {
  const project = projectsLookup[projectId];
  if (!project || !modalDialog || !modalOverlay) return;

  const isCertOnly = project.isCourse && project.images && project.images.length > 0;

  if (isCertOnly) {
    modalDialog.className = "project-modal-dialog modal-mode-certificate";
    if (modalGalleryBadge) modalGalleryBadge.textContent = project.title;
    if (modalGalleryCount) modalGalleryCount.textContent = project.typeBadgeText || "Verified ✦";
  } else if (project.isOpenSource) {
    modalDialog.className = "project-modal-dialog modal-mode-opensource";
    if (modalGalleryBadge) modalGalleryBadge.textContent = "Hardware Visuals";
  } else {
    modalDialog.className = "project-modal-dialog modal-mode-proprietary";
  }

  if (modalSpecsHeading) {
    modalSpecsHeading.textContent = project.isCourse ? "Credential & Verification" : "Technical Specifications";
  }
  if (modalFeaturesHeading) {
    modalFeaturesHeading.textContent = project.isCourse ? "Syllabus & Core Competencies" : "Key Hardware Features";
  }

  if (modalProjectTag) {
    modalProjectTag.textContent = project.tag || (project.isCourse ? "Course & Certification" : "Hardware Project");
  }

  if (modalTypeBadge) {
    if (project.typeBadgeText) {
      modalTypeBadge.style.display = "inline-flex";
      modalTypeBadge.textContent = project.typeBadgeText;
      modalTypeBadge.className = `modal-type-badge ${project.typeBadgeClass || ""}`;
    } else {
      modalTypeBadge.style.display = "none";
    }
  }

  if (modalProjectTitle) modalProjectTitle.textContent = project.title || "Details";
  if (modalProjectDesc) modalProjectDesc.textContent = project.description || "";

  // Render Specifications Table
  if (project.specs && project.specs.length > 0 && !isCertOnly) {
    if (modalSpecsSection) modalSpecsSection.style.display = "flex";
    if (modalSpecsTableBody) {
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
    }
  } else {
    if (modalSpecsSection) modalSpecsSection.style.display = "none";
  }

  // Render Features / Topics List
  if (project.features && project.features.length > 0 && !isCertOnly) {
    if (modalFeaturesSection) modalFeaturesSection.style.display = "flex";
    if (modalFeaturesList) {
      modalFeaturesList.innerHTML = project.features
        .map(
          (f) => `
        <div class="modal-feature-item">
          <div class="modal-feature-title">${f.title}</div>
          <ul>
            ${(f.items || []).map((it) => `<li>${it}</li>`).join("")}
          </ul>
        </div>
      `
        )
        .join("");
    }
  } else {
    if (modalFeaturesSection) modalFeaturesSection.style.display = "none";
  }

  // Render Actions
  if (isCertOnly) {
    if (modalActions) {
      modalActions.style.display = "none";
      modalActions.innerHTML = "";
    }
    if (modalGalleryActions) {
      if (project.actions && project.actions.length > 0) {
        modalGalleryActions.style.display = "flex";
        modalGalleryActions.innerHTML = project.actions
          .map(
            (a) => `
            <a href="${a.url}" target="_blank" rel="noreferrer" class="modal-github-btn">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="12" y2="18"></line><line x1="15" y1="15" x2="12" y2="18"></line></svg>
              <span>${a.label}</span>
            </a>
          `
          )
          .join("");
      } else {
        modalGalleryActions.style.display = "none";
        modalGalleryActions.innerHTML = "";
      }
    }
  } else {
    if (modalGalleryActions) {
      modalGalleryActions.style.display = "none";
      modalGalleryActions.innerHTML = "";
    }
    if (project.actions && project.actions.length > 0) {
      if (modalActions) {
        modalActions.style.display = "flex";
        modalActions.innerHTML = project.actions
          .map((a) => {
            let iconSvg = "";
            const urlLower = (a.url || "").toLowerCase();
            const labelLower = (a.label || "").toLowerCase();
            if (urlLower.includes("github.com") && !labelLower.includes("readme")) {
              iconSvg = `<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`;
            } else if (urlLower.includes(".pdf") || labelLower.includes("pdf") || labelLower.includes("certificate")) {
              iconSvg = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="12" y2="18"></line><line x1="15" y1="15" x2="12" y2="18"></line></svg>`;
            } else if (labelLower.includes("readme") || labelLower.includes("doc")) {
              iconSvg = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
            } else {
              iconSvg = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
            }
            return `
            <a href="${a.url}" target="_blank" rel="noreferrer" class="${a.isPrimary ? "modal-github-btn" : "modal-secondary-btn"}">
              ${iconSvg}
              <span>${a.label}</span>
            </a>
          `;
          })
          .join("");
      }
    } else {
      if (modalActions) {
        modalActions.style.display = "none";
        modalActions.innerHTML = "";
      }
    }
  }

  // Render Images
  currentProjectImages = project.images || [];
  currentImageIndex = 0;

  if ((project.isOpenSource || isCertOnly) && currentProjectImages.length > 0 && modalMainImg) {
    modalMainImg.src = currentProjectImages[0].src;
    modalMainImg.alt = currentProjectImages[0].caption || "Image Preview";
    if (modalImgCaption) modalImgCaption.textContent = currentProjectImages[0].caption || "";
    if (modalGalleryCount) {
      modalGalleryCount.textContent =
        currentProjectImages.length > 1
          ? `1 / ${currentProjectImages.length}`
          : isCertOnly
          ? project.typeBadgeText || "Verified ✦"
          : `1 / 1`;
    }

    if (modalThumbnails) {
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
  }

  const detailsCol = modalDialog.querySelector(".modal-details-col");
  if (detailsCol) detailsCol.scrollTop = 0;

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

function attachCardClickHandlers() {
  document.querySelectorAll(".project-card[data-project-id], .course-card[data-course-id]").forEach((card) => {
    const cardId = card.getAttribute("data-project-id") || card.getAttribute("data-course-id");
    card.onclick = () => openProjectModal(cardId);
    card.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openProjectModal(cardId);
      }
    };
  });
}

if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeProjectModal);
if (modalOverlay) {
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeProjectModal();
  });
}

window.addEventListener("keydown", (e) => {
  if (modalOverlay && modalOverlay.classList.contains("active")) {
    if (e.key === "Escape") closeProjectModal();
    else if (e.key === "ArrowRight" && currentProjectImages.length > 1) setModalImage(currentImageIndex + 1);
    else if (e.key === "ArrowLeft" && currentProjectImages.length > 1) setModalImage(currentImageIndex - 1);
  }
});

// ==========================================================================
// VISUAL ADMIN STUDIO CONTROLLER & CMS
// ==========================================================================
const adminTriggerBtn = document.getElementById("adminTriggerBtn");
const adminPinOverlay = document.getElementById("adminPinOverlay");
const adminPinForm = document.getElementById("adminPinForm");
const adminPinInput = document.getElementById("adminPinInput");
const adminPinCancelBtn = document.getElementById("adminPinCancelBtn");
const adminStudioOverlay = document.getElementById("adminStudioOverlay");
const adminCloseBtn = document.getElementById("adminCloseBtn");
const adminPublishBtn = document.getElementById("adminPublishBtn");
const adminDownloadBtn = document.getElementById("adminDownloadBtn");
const adminToast = document.getElementById("adminToast");

// Item Submodal
const adminItemModalOverlay = document.getElementById("adminItemModalOverlay");
const adminItemModalTitle = document.getElementById("adminItemModalTitle");
const adminItemModalBody = document.getElementById("adminItemModalBody");
const adminItemModalCloseBtn = document.getElementById("adminItemModalCloseBtn");
const adminItemModalCancelBtn = document.getElementById("adminItemModalCancelBtn");
const adminItemModalSaveBtn = document.getElementById("adminItemModalSaveBtn");

let currentEditingContext = null; // { type: 'experience'|'project'|'skill'|'course', id: string, isNew: boolean }

// Helper: Show Toast
function showToast(message, type = "success") {
  if (!adminToast) return;
  adminToast.textContent = message;
  adminToast.className = `admin-toast active ${type}`;
  setTimeout(() => {
    adminToast.classList.remove("active");
  }, 3500);
}

// --------------------------------------------------------------------------
// Secure Password vault — PBKDF2 + salt + iterations (not plain SHA-256)
// Format stored: pbkdf2$<iterations>$<saltHex>$<hashHex>
// Legacy fallback: plain SHA-256 hex "03ac674..." for "1234" is auto-migrated
// --------------------------------------------------------------------------
async function hashSha256(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hexToBuf(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) out[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return out;
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const PBKDF2_ITERATIONS = 120000; // ~150ms in modern browsers, slows brute-force 120k×
const SALT_BYTES = 16;
const LEGACY_DEFAULT_SHA256 = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

async function pbkdf2Hash(pin, saltHex, iterations) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBuf(saltHex), iterations, hash: "SHA-256" },
    key,
    256
  );
  return bufToHex(bits);
}

async function createPinRecord(pin) {
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  const saltHex = bufToHex(salt);
  const hashHex = await pbkdf2Hash(pin, saltHex, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

function parsePinRecord(rec) {
  if (!rec) return null;
  if (rec.startsWith("pbkdf2$")) {
    const parts = rec.split("$");
    if (parts.length === 4) return { scheme: "pbkdf2", iterations: parseInt(parts[1], 10), saltHex: parts[2], hashHex: parts[3] };
  }
  if (/^[0-9a-f]{64}$/i.test(rec)) return { scheme: "legacy-sha256", hashHex: rec.toLowerCase() };
  return null;
}

function getStoredPinRecord() {
  const raw = localStorage.getItem("portfolio_admin_pin_hash");
  if (!raw) return null; // no record yet — will be created lazily
  return parsePinRecord(raw);
}

async function verifyPin(inputPin, record) {
  if (!record) {
    // First-run: no stored record → accept default "1234" and migrate
    if (inputPin === "1234") return { ok: true, migrated: await createPinRecord("1234") };
    // For any other PIN on first run, check legacy default to avoid lockout on fresh install
    const legacy = await hashSha256(inputPin);
    if (timingSafeEqual(legacy, LEGACY_DEFAULT_SHA256)) return { ok: true, migrated: await createPinRecord(inputPin) };
    return { ok: false };
  }
  if (record.scheme === "pbkdf2") {
    const h = await pbkdf2Hash(inputPin, record.saltHex, record.iterations);
    return { ok: timingSafeEqual(h, record.hashHex) };
  }
  if (record.scheme === "legacy-sha256") {
    const h = await hashSha256(inputPin);
    const ok = timingSafeEqual(h, record.hashHex);
    if (ok) return { ok: true, migrated: await createPinRecord(inputPin) }; // auto-upgrade
    return { ok: false };
  }
  return { ok: false };
}

// Rate-limit: 5 fails → 2-min lockout (stored in localStorage so it survives refresh)
const PIN_MAX_FAILS = 5;
const PIN_LOCK_MS = 2 * 60 * 1000;
function getPinFailState() {
  try { return JSON.parse(localStorage.getItem("portfolio_pin_fail") || "null") || { count: 0, lockUntil: 0 }; } catch { return { count: 0, lockUntil: 0 }; }
}
function setPinFailState(s) { localStorage.setItem("portfolio_pin_fail", JSON.stringify(s)); }
function isPinLocked() {
  const s = getPinFailState();
  if (s.lockUntil && Date.now() < s.lockUntil) return { locked: true, msLeft: s.lockUntil - Date.now() };
  if (s.lockUntil && Date.now() >= s.lockUntil) { setPinFailState({ count: 0, lockUntil: 0 }); return { locked: false }; }
  return { locked: false };
}
function registerPinFail() {
  const s = getPinFailState();
  s.count += 1;
  if (s.count >= PIN_MAX_FAILS) { s.lockUntil = Date.now() + PIN_LOCK_MS; s.count = 0; }
  setPinFailState(s);
  return s;
}
function resetPinFails() { setPinFailState({ count: 0, lockUntil: 0 }); }

function openAdminPinModal() {
  if (adminPinOverlay && adminPinInput) {
    adminPinInput.value = "";
    adminPinOverlay.classList.add("active");
    adminPinOverlay.setAttribute("aria-hidden", "false");
    setTimeout(() => adminPinInput.focus(), 120);
  }
}

function closeAdminPinModal() {
  if (adminPinOverlay) {
    adminPinOverlay.classList.remove("active");
    adminPinOverlay.setAttribute("aria-hidden", "true");
  }
}

if (adminPinForm) {
  adminPinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const lock = isPinLocked();
    if (lock.locked) {
      const sec = Math.ceil(lock.msLeft / 1000);
      showToast(`Too many attempts. Try again in ${sec}s.`, "error");
      return;
    }
    const pin = (adminPinInput.value || "").trim();
    if (!pin) return;

    // Disable button while deriving (anti-spam)
    const submitBtn = adminPinForm.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = "0.6"; }

    try {
      const record = getStoredPinRecord();
      const res = await verifyPin(pin, record);
      if (res.ok) {
        if (res.migrated) localStorage.setItem("portfolio_admin_pin_hash", res.migrated);
        resetPinFails();
        closeAdminPinModal();
        openAdminStudio();
        showToast("Admin Studio Unlocked ✦");
      } else {
        const st = registerPinFail();
        if (st.lockUntil) showToast("Too many failures — locked for 2 minutes.", "error");
        else showToast(`Incorrect password. ${PIN_MAX_FAILS - st.count} attempts left.`, "error");
        adminPinInput.select();
      }
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = ""; }
    }
  });
}

if (adminPinCancelBtn) adminPinCancelBtn.addEventListener("click", closeAdminPinModal);
if (adminTriggerBtn) adminTriggerBtn.addEventListener("click", openAdminPinModal);

// Keyboard shortcut (Ctrl + Shift + A)
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
    e.preventDefault();
    if (adminStudioOverlay && adminStudioOverlay.classList.contains("active")) {
      closeAdminStudio();
    } else {
      openAdminPinModal();
    }
  }
});

function openAdminStudio() {
  if (!adminStudioOverlay) return;
  renderAdminAllTabs();
  adminStudioOverlay.classList.add("active");
  adminStudioOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeAdminStudio() {
  if (!adminStudioOverlay) return;
  adminStudioOverlay.classList.remove("active");
  adminStudioOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

if (adminCloseBtn) adminCloseBtn.addEventListener("click", closeAdminStudio);

// Admin Tabs Switching
document.querySelectorAll(".admin-sidebar-nav .admin-nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-sidebar-nav .admin-nav-item").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".admin-main-panel .admin-tab-pane").forEach((pane) => pane.classList.remove("active"));

    btn.classList.add("active");
    const targetTabId = btn.getAttribute("data-tab");
    const targetPane = document.getElementById(targetTabId);
    if (targetPane) targetPane.classList.add("active");
  });
});

// Render all tabs in Admin
function renderAdminAllTabs() {
  renderAdminExperienceList();
  renderAdminProjectsList();
  renderAdminSkillsList();
  renderAdminEducationTab();
  renderAdminCoursesList();
  renderAdminHeroTab();
  renderAdminThemeTab();
  loadAdminSettings();
}

// 1. Admin Experience Tab
function renderAdminExperienceList() {
  const container = document.getElementById("adminExperienceList");
  if (!container || !portfolioData.experiences) return;

  container.innerHTML = portfolioData.experiences
    .map(
      (exp, index) => `
    <div class="admin-item-card">
      <div class="admin-item-info">
        <div class="admin-item-title-row">
          <span class="admin-item-title">${exp.role}</span>
          <span class="admin-item-subtitle">@ ${exp.company}</span>
        </div>
        <div class="admin-item-meta">${exp.dates} | ${exp.location}</div>
      </div>
      <div class="admin-item-actions">
        <button type="button" class="admin-icon-btn" title="Move Up" onclick="moveAdminItem('experiences', ${index}, -1)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>
        <button type="button" class="admin-icon-btn" title="Move Down" onclick="moveAdminItem('experiences', ${index}, 1)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <button type="button" class="admin-icon-btn" title="Edit" onclick="openEditItemModal('experience', '${exp.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>
        <button type="button" class="admin-icon-btn danger" title="Delete" onclick="deleteAdminItem('experiences', '${exp.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

// 2. Admin Projects Tab
function renderAdminProjectsList() {
  const container = document.getElementById("adminProjectsList");
  if (!container || !portfolioData.projects) return;

  container.innerHTML = portfolioData.projects
    .map(
      (p, index) => `
    <div class="admin-item-card">
      <div class="admin-item-info">
        <div class="admin-item-title-row">
          <span class="admin-item-title">${p.cardTitle || p.title}</span>
          <span class="admin-item-badge ${p.isOpenSource ? "badge-open-source" : "badge-private"}">${p.typeBadgeText || (p.isOpenSource ? "Open Source" : "Private")}</span>
        </div>
        <div class="admin-item-meta">${p.tag || ""}</div>
      </div>
      <div class="admin-item-actions">
        <button type="button" class="admin-icon-btn" title="Move Up" onclick="moveAdminItem('projects', ${index}, -1)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>
        <button type="button" class="admin-icon-btn" title="Move Down" onclick="moveAdminItem('projects', ${index}, 1)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <button type="button" class="admin-icon-btn" title="Edit" onclick="openEditItemModal('project', '${p.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>
        <button type="button" class="admin-icon-btn danger" title="Delete" onclick="deleteAdminItem('projects', '${p.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

// 3. Admin Skills Tab
function renderAdminSkillsList() {
  const container = document.getElementById("adminSkillsList");
  if (!container || !portfolioData.skills) return;

  container.innerHTML = portfolioData.skills
    .map(
      (s, index) => `
    <div class="admin-item-card">
      <div class="admin-item-info">
        <div class="admin-item-title-row">
          <span class="admin-item-title">${s.category}</span>
          <span class="admin-item-meta">(${s.tags ? s.tags.length : 0} skills)</span>
        </div>
        <div class="admin-item-meta">${(s.tags || []).join(", ")}</div>
      </div>
      <div class="admin-item-actions">
        <button type="button" class="admin-icon-btn" title="Move Up" onclick="moveAdminItem('skills', ${index}, -1)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>
        <button type="button" class="admin-icon-btn" title="Move Down" onclick="moveAdminItem('skills', ${index}, 1)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <button type="button" class="admin-icon-btn" title="Edit" onclick="openEditItemModal('skill', '${index}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>
        <button type="button" class="admin-icon-btn danger" title="Delete" onclick="deleteAdminItem('skills', '${index}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

// 4. Admin Courses & Education Tab
function renderAdminEducationTab() {
  const container = document.getElementById("adminEducationFormWrapper");
  const ed = portfolioData.education || {};
  if (!container) return;

  container.innerHTML = `
    <form id="adminEducationForm" class="admin-form-grid">
      <div class="admin-form-group full-width">
        <label for="edDegree">Degree Name</label>
        <input type="text" id="edDegree" value="${ed.degree || ""}" required>
      </div>
      <div class="admin-form-group full-width">
        <label for="edInstitution">Institution / University</label>
        <input type="text" id="edInstitution" value="${ed.institution || ""}" required>
      </div>
      <div class="admin-form-group">
        <label for="edDates">Dates</label>
        <input type="text" id="edDates" value="${ed.dates || ""}" required>
      </div>
      <div class="admin-form-group">
        <label for="edGpa">GPA / Scale</label>
        <div style="display:flex;gap:8px;">
          <input type="text" id="edGpa" value="${ed.gpa || ""}" placeholder="3.01" style="flex:1;">
          <input type="text" id="edGpaScale" value="${ed.gpaScale || "CGPA / 4.0"}" placeholder="CGPA / 4.0" style="flex:1;">
        </div>
      </div>
      <div class="admin-form-group full-width">
        <button type="button" class="admin-btn admin-btn-primary" id="adminSaveEducationBtn" style="align-self:flex-start;">
          Save Education Details
        </button>
      </div>
    </form>
  `;

  document.getElementById("adminSaveEducationBtn").addEventListener("click", () => {
    portfolioData.education = {
      degree: document.getElementById("edDegree").value,
      institution: document.getElementById("edInstitution").value,
      dates: document.getElementById("edDates").value,
      gpa: document.getElementById("edGpa").value,
      gpaScale: document.getElementById("edGpaScale").value
    };
    savePortfolioDataLocally();
    renderAll();
    showToast("Education details updated!");
  });
}

function renderAdminCoursesList() {
  const container = document.getElementById("adminCoursesList");
  if (!container || !portfolioData.courses) return;

  container.innerHTML = portfolioData.courses
    .map(
      (c, index) => `
    <div class="admin-item-card">
      <div class="admin-item-info">
        <div class="admin-item-title-row">
          <span class="admin-item-title">${c.cardTitle || c.title}</span>
          <span class="admin-item-badge ${c.typeBadgeClass || "badge-open-source"}">${c.typeBadgeText || "Verified"}</span>
        </div>
        <div class="admin-item-meta">${c.instructor || ""} | ${c.dates || ""}</div>
      </div>
      <div class="admin-item-actions">
        <button type="button" class="admin-icon-btn" title="Move Up" onclick="moveAdminItem('courses', ${index}, -1)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
        </button>
        <button type="button" class="admin-icon-btn" title="Move Down" onclick="moveAdminItem('courses', ${index}, 1)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <button type="button" class="admin-icon-btn" title="Edit" onclick="openEditItemModal('course', '${c.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>
        <button type="button" class="admin-icon-btn danger" title="Delete" onclick="deleteAdminItem('courses', '${c.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

// 5. Admin Hero Tab
function renderAdminHeroTab() {
  const container = document.getElementById("adminHeroFormWrapper");
  const h = portfolioData.hero || {};
  if (!container) return;

  container.innerHTML = `
    <form id="adminHeroForm" class="admin-form-grid">
      <div class="admin-form-group full-width">
        <label for="heroEyebrow">Eyebrow Subtitle</label>
        <input type="text" id="heroEyebrow" value="${h.eyebrow || ""}">
      </div>
      <div class="admin-form-group full-width">
        <label for="heroTitle">Main Headline</label>
        <input type="text" id="heroTitle" value="${h.title || ""}" required>
      </div>
      <div class="admin-form-group full-width">
        <label for="heroDesc">Biography / Summary</label>
        <textarea id="heroDesc" rows="3">${h.description || ""}</textarea>
      </div>
      <div class="admin-form-group">
        <label for="heroEmail">Email Address</label>
        <input type="email" id="heroEmail" value="${h.email || ""}">
      </div>
      <div class="admin-form-group">
        <label for="heroStatus">Availability Status</label>
        <input type="text" id="heroStatus" value="${h.status || ""}">
      </div>
      <div class="admin-form-group">
        <label for="heroLinkedin">LinkedIn URL</label>
        <input type="url" id="heroLinkedin" value="${h.linkedin || ""}">
      </div>
      <div class="admin-form-group">
        <label for="heroGithub">GitHub Profile URL</label>
        <input type="url" id="heroGithub" value="${h.github || ""}">
      </div>
      <div class="admin-form-group full-width">
        <label for="heroSignals">Signals Strip (Comma Separated)</label>
        <input type="text" id="heroSignals" value="${(h.signals || []).join(", ")}">
      </div>
      <div class="admin-form-group full-width">
        <button type="button" class="admin-btn admin-btn-primary" id="adminSaveHeroBtn" style="align-self:flex-start;">
          Save Hero & Bio
        </button>
      </div>
    </form>
  `;

  document.getElementById("adminSaveHeroBtn").addEventListener("click", () => {
    portfolioData.hero = {
      ...portfolioData.hero,
      eyebrow: document.getElementById("heroEyebrow").value,
      title: document.getElementById("heroTitle").value,
      description: document.getElementById("heroDesc").value,
      email: document.getElementById("heroEmail").value,
      status: document.getElementById("heroStatus").value,
      linkedin: document.getElementById("heroLinkedin").value,
      github: document.getElementById("heroGithub").value,
      signals: document
        .getElementById("heroSignals")
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    };
    savePortfolioDataLocally();
    renderAll();
    showToast("Hero section updated!");
  });
}

// 6. Admin Theme & Styling Tab
function renderAdminThemeTab() {
  const container = document.getElementById("adminThemeWrapper");
  if (!container) return;

  const currentTheme = portfolioData.theme || DEFAULT_PORTFOLIO_DATA.theme;
  const currentPreset = currentTheme.preset || "copper";
  const dark = currentTheme.dark || DEFAULT_PORTFOLIO_DATA.theme.dark;
  const light = currentTheme.light || DEFAULT_PORTFOLIO_DATA.theme.light;
  const fonts = currentTheme.fonts || DEFAULT_PORTFOLIO_DATA.theme.fonts;

  container.innerHTML = `
    <!-- Curated Presets -->
    <div class="admin-theme-section">
      <div class="admin-theme-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="m4.93 4.93 4.24 4.24"></path><path d="m14.83 9.17 4.24-4.24"></path><path d="m14.83 14.83 4.24 4.24"></path><path d="m9.17 14.83-4.24 4.24"></path></svg>
        <span>Curated Color Palettes</span>
      </div>
      <p class="admin-theme-section-desc">Click any palette to preview immediately. You can fine-tune individual colors below.</p>
      <div class="admin-presets-grid" id="adminPresetsGrid">
        ${THEME_PRESETS.map(
          (p) => `
          <button type="button" class="admin-preset-card ${p.id === currentPreset ? "active" : ""}" data-preset-id="${p.id}">
            <div class="admin-preset-info">
              <h4>${p.name}</h4>
              <p>${p.desc}</p>
            </div>
            <div class="admin-preset-swatches">
              <span class="admin-swatch-dot" style="background:${p.dark.accent};" title="Accent: ${p.dark.accent}"></span>
              <span class="admin-swatch-dot" style="background:${p.dark.accent2};" title="Secondary: ${p.dark.accent2}"></span>
              <span class="admin-swatch-dot" style="background:${p.dark.bg};" title="Dark BG: ${p.dark.bg}"></span>
              <span class="admin-swatch-dot" style="background:${p.light.bg};" title="Light BG: ${p.light.bg}"></span>
            </div>
          </button>
        `
        ).join("")}
      </div>
    </div>

    <!-- Dark Mode Colors -->
    <div class="admin-theme-section">
      <div class="admin-theme-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
        <span>Dark Mode Colors</span>
      </div>
      <div class="admin-color-picker-grid">
        <div class="admin-color-item">
          <label for="colorDarkAccent">Primary Accent</label>
          <div class="admin-color-input-wrapper">
            <input type="color" class="admin-color-picker-native" id="pickerDarkAccent" value="${dark.accent || "#FF7E4A"}">
            <input type="text" class="admin-color-hex-input" id="colorDarkAccent" value="${dark.accent || "#FF7E4A"}" maxlength="7">
          </div>
        </div>
        <div class="admin-color-item">
          <label for="colorDarkAccent2">Secondary Accent</label>
          <div class="admin-color-input-wrapper">
            <input type="color" class="admin-color-picker-native" id="pickerDarkAccent2" value="${dark.accent2 || "#5BC0BE"}">
            <input type="text" class="admin-color-hex-input" id="colorDarkAccent2" value="${dark.accent2 || "#5BC0BE"}" maxlength="7">
          </div>
        </div>
        <div class="admin-color-item">
          <label for="colorDarkBg">Dark Background</label>
          <div class="admin-color-input-wrapper">
            <input type="color" class="admin-color-picker-native" id="pickerDarkBg" value="${dark.bg || "#0B0E14"}">
            <input type="text" class="admin-color-hex-input" id="colorDarkBg" value="${dark.bg || "#0B0E14"}" maxlength="7">
          </div>
        </div>
        <div class="admin-color-item">
          <label for="colorDarkSurface">Surface / Cards</label>
          <div class="admin-color-input-wrapper">
            <input type="color" class="admin-color-picker-native" id="pickerDarkSurface" value="${dark.surface || "#181B28"}">
            <input type="text" class="admin-color-hex-input" id="colorDarkSurface" value="${dark.surface || "#181B28"}" maxlength="7">
          </div>
        </div>
      </div>
    </div>

    <!-- Light Mode Colors -->
    <div class="admin-theme-section">
      <div class="admin-theme-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
        <span>Light Mode Colors</span>
      </div>
      <div class="admin-color-picker-grid">
        <div class="admin-color-item">
          <label for="colorLightAccent">Primary Accent</label>
          <div class="admin-color-input-wrapper">
            <input type="color" class="admin-color-picker-native" id="pickerLightAccent" value="${light.accent || "#D65A28"}">
            <input type="text" class="admin-color-hex-input" id="colorLightAccent" value="${light.accent || "#D65A28"}" maxlength="7">
          </div>
        </div>
        <div class="admin-color-item">
          <label for="colorLightAccent2">Secondary Accent</label>
          <div class="admin-color-input-wrapper">
            <input type="color" class="admin-color-picker-native" id="pickerLightAccent2" value="${light.accent2 || "#2A7D7B"}">
            <input type="text" class="admin-color-hex-input" id="colorLightAccent2" value="${light.accent2 || "#2A7D7B"}" maxlength="7">
          </div>
        </div>
        <div class="admin-color-item">
          <label for="colorLightBg">Light Background</label>
          <div class="admin-color-input-wrapper">
            <input type="color" class="admin-color-picker-native" id="pickerLightBg" value="${light.bg || "#FCFAF7"}">
            <input type="text" class="admin-color-hex-input" id="colorLightBg" value="${light.bg || "#FCFAF7"}" maxlength="7">
          </div>
        </div>
        <div class="admin-color-item">
          <label for="colorLightSurface">Surface / Cards</label>
          <div class="admin-color-input-wrapper">
            <input type="color" class="admin-color-picker-native" id="pickerLightSurface" value="${light.surface || "#FFFFFF"}">
            <input type="text" class="admin-color-hex-input" id="colorLightSurface" value="${light.surface || "#FFFFFF"}" maxlength="7">
          </div>
        </div>
      </div>
    </div>

    <!-- Typography & Fonts -->
    <div class="admin-theme-section">
      <div class="admin-theme-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
        <span>Typography & Fonts</span>
      </div>
      <div class="admin-typography-grid">
        <div class="admin-font-group">
          <label for="fontHeadingSelect">Headings & Titles</label>
          <select id="fontHeadingSelect" class="admin-font-select">
            ${GOOGLE_FONTS_HEADING.map((f) => `<option value="${f.name}" ${fonts.heading === f.name ? "selected" : ""}>${f.name}</option>`).join("")}
          </select>
          <div class="admin-font-preview-card" id="fontHeadingPreview">
            <span class="admin-font-preview-title" style="font-family:var(--font-heading);">Reliable electronics from schematic to field.</span>
            <span class="admin-font-preview-sample" style="font-family:var(--font-heading);">Heading sample typography (600/700 weight)</span>
          </div>
        </div>

        <div class="admin-font-group">
          <label for="fontBodySelect">Body Text & Descriptions</label>
          <select id="fontBodySelect" class="admin-font-select">
            ${GOOGLE_FONTS_BODY.map((f) => `<option value="${f.name}" ${fonts.body === f.name ? "selected" : ""}>${f.name}</option>`).join("")}
          </select>
          <div class="admin-font-preview-card" id="fontBodyPreview">
            <span class="admin-font-preview-sample" style="font-family:var(--font-body);color:var(--text);">Hardware Design Engineer designing power stages and embedded sensing platforms.</span>
          </div>
        </div>

        <div class="admin-font-group">
          <label for="fontMonoSelect">Code, Specs & Monospace Badges</label>
          <select id="fontMonoSelect" class="admin-font-select">
            ${GOOGLE_FONTS_MONO.map((f) => `<option value="${f.name}" ${fonts.mono === f.name ? "selected" : ""}>${f.name}</option>`).join("")}
          </select>
          <div class="admin-font-preview-card" id="fontMonoPreview">
            <span class="admin-font-preview-sample" style="font-family:var(--font-mono);color:var(--accent);">STM32G431RBT6 (170 MHz) // 8-layer PCB</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Row -->
    <div class="admin-form-group full-width admin-form-actions-row" style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border);">
      <button type="button" class="admin-btn admin-btn-primary" id="adminSaveThemeBtn">
        Save Theme & Fonts
      </button>
      <button type="button" class="admin-btn admin-btn-danger" id="adminResetThemeBtn">
        Reset Theme to Default
      </button>
    </div>
  `;

  // Sync color pickers with hex text inputs & live preview
  function syncColorPair(pickerId, inputId) {
    const picker = document.getElementById(pickerId);
    const input = document.getElementById(inputId);
    if (!picker || !input) return;

    picker.addEventListener("input", (e) => {
      input.value = e.target.value.toUpperCase();
      triggerLiveThemePreview();
    });

    input.addEventListener("input", (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith("#")) val = "#" + val;
      if (/^#[0-9A-F]{6}$/i.test(val)) {
        picker.value = val;
        triggerLiveThemePreview();
      }
    });
  }

  syncColorPair("pickerDarkAccent", "colorDarkAccent");
  syncColorPair("pickerDarkAccent2", "colorDarkAccent2");
  syncColorPair("pickerDarkBg", "colorDarkBg");
  syncColorPair("pickerDarkSurface", "colorDarkSurface");

  syncColorPair("pickerLightAccent", "colorLightAccent");
  syncColorPair("pickerLightAccent2", "colorLightAccent2");
  syncColorPair("pickerLightBg", "colorLightBg");
  syncColorPair("pickerLightSurface", "colorLightSurface");

  // Preset Selection Click
  document.querySelectorAll("#adminPresetsGrid .admin-preset-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#adminPresetsGrid .admin-preset-card").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const presetId = btn.getAttribute("data-preset-id");
      const preset = THEME_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        document.getElementById("pickerDarkAccent").value = preset.dark.accent;
        document.getElementById("colorDarkAccent").value = preset.dark.accent;
        document.getElementById("pickerDarkAccent2").value = preset.dark.accent2;
        document.getElementById("colorDarkAccent2").value = preset.dark.accent2;
        document.getElementById("pickerDarkBg").value = preset.dark.bg;
        document.getElementById("colorDarkBg").value = preset.dark.bg;
        document.getElementById("pickerDarkSurface").value = preset.dark.surface;
        document.getElementById("colorDarkSurface").value = preset.dark.surface;

        document.getElementById("pickerLightAccent").value = preset.light.accent;
        document.getElementById("colorLightAccent").value = preset.light.accent;
        document.getElementById("pickerLightAccent2").value = preset.light.accent2;
        document.getElementById("colorLightAccent2").value = preset.light.accent2;
        document.getElementById("pickerLightBg").value = preset.light.bg;
        document.getElementById("colorLightBg").value = preset.light.bg;
        document.getElementById("pickerLightSurface").value = preset.light.surface;
        document.getElementById("colorLightSurface").value = preset.light.surface;

        triggerLiveThemePreview(preset.id);
      }
    });
  });

  // Typography Select Listeners
  const fontHeadingSelect = document.getElementById("fontHeadingSelect");
  const fontBodySelect = document.getElementById("fontBodySelect");
  const fontMonoSelect = document.getElementById("fontMonoSelect");

  if (fontHeadingSelect) fontHeadingSelect.addEventListener("change", () => triggerLiveThemePreview());
  if (fontBodySelect) fontBodySelect.addEventListener("change", () => triggerLiveThemePreview());
  if (fontMonoSelect) fontMonoSelect.addEventListener("change", () => triggerLiveThemePreview());

  function triggerLiveThemePreview(presetId = null) {
    const activePresetBtn = document.querySelector("#adminPresetsGrid .admin-preset-card.active");
    const activePreset = presetId || (activePresetBtn ? activePresetBtn.getAttribute("data-preset-id") : "custom");

    const liveTheme = {
      preset: activePreset,
      dark: {
        accent: document.getElementById("colorDarkAccent").value,
        accent2: document.getElementById("colorDarkAccent2").value,
        bg: document.getElementById("colorDarkBg").value,
        bgElevated: document.getElementById("colorDarkBg").value,
        surface: document.getElementById("colorDarkSurface").value,
        text: dark.text || "#EAE6DD"
      },
      light: {
        accent: document.getElementById("colorLightAccent").value,
        accent2: document.getElementById("colorLightAccent2").value,
        bg: document.getElementById("colorLightBg").value,
        bgElevated: document.getElementById("colorLightBg").value,
        surface: document.getElementById("colorLightSurface").value,
        text: light.text || "#1A1C1E"
      },
      fonts: {
        heading: document.getElementById("fontHeadingSelect").value,
        body: document.getElementById("fontBodySelect").value,
        mono: document.getElementById("fontMonoSelect").value
      }
    };

    applyCustomTheme(liveTheme);
  }

  // Save Theme Button
  const saveBtn = document.getElementById("adminSaveThemeBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const activePresetBtn = document.querySelector("#adminPresetsGrid .admin-preset-card.active");
      const activePreset = activePresetBtn ? activePresetBtn.getAttribute("data-preset-id") : "custom";

      portfolioData.theme = {
        preset: activePreset,
        dark: {
          accent: document.getElementById("colorDarkAccent").value,
          accent2: document.getElementById("colorDarkAccent2").value,
          bg: document.getElementById("colorDarkBg").value,
          bgElevated: document.getElementById("colorDarkBg").value,
          surface: document.getElementById("colorDarkSurface").value,
          text: dark.text || "#EAE6DD"
        },
        light: {
          accent: document.getElementById("colorLightAccent").value,
          accent2: document.getElementById("colorLightAccent2").value,
          bg: document.getElementById("colorLightBg").value,
          bgElevated: document.getElementById("colorLightBg").value,
          surface: document.getElementById("colorLightSurface").value,
          text: light.text || "#1A1C1E"
        },
        fonts: {
          heading: document.getElementById("fontHeadingSelect").value,
          body: document.getElementById("fontBodySelect").value,
          mono: document.getElementById("fontMonoSelect").value
        }
      };

      savePortfolioDataLocally();
      applyCustomTheme();
      renderAll();
      showToast("Theme & Typography saved successfully! ✦");
    });
  }

  // Reset Theme Button
  const resetBtn = document.getElementById("adminResetThemeBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset theme, colors and typography back to Precision Copper default?")) {
        portfolioData.theme = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA.theme));
        savePortfolioDataLocally();
        applyCustomTheme();
        renderAll();
        renderAdminThemeTab();
        showToast("Theme reset to default Precision Copper.");
      }
    });
  }
}

// 7. Settings & GitHub Sync Tab
function loadAdminSettings() {
  const ghOwnerInput = document.getElementById("ghOwner");
  const ghRepoInput = document.getElementById("ghRepo");
  const ghBranchInput = document.getElementById("ghBranch");
  const ghTokenInput = document.getElementById("ghToken");
  const adminPinSetting = document.getElementById("adminPinSetting");

  if (ghOwnerInput) ghOwnerInput.value = localStorage.getItem("gh_owner") || "AhmedAbo-Eita";
  if (ghRepoInput) ghRepoInput.value = localStorage.getItem("gh_repo") || "AhmedAbo-Eita.github.io";
  if (ghBranchInput) ghBranchInput.value = localStorage.getItem("gh_branch") || "main";
  if (ghTokenInput) ghTokenInput.value = localStorage.getItem("gh_token") || "";
  if (adminPinSetting) adminPinSetting.value = "";
}

const adminSaveSettingsBtn = document.getElementById("adminSaveSettingsBtn");
if (adminSaveSettingsBtn) {
  adminSaveSettingsBtn.addEventListener("click", async () => {
    const owner = document.getElementById("ghOwner").value.trim();
    const repo = document.getElementById("ghRepo").value.trim();
    const branch = document.getElementById("ghBranch").value.trim();
    const token = document.getElementById("ghToken").value.trim();
    const newPin = document.getElementById("adminPinSetting").value.trim();

    if (owner) localStorage.setItem("gh_owner", owner);
    if (repo) localStorage.setItem("gh_repo", repo);
    if (branch) localStorage.setItem("gh_branch", branch);
    if (token) localStorage.setItem("gh_token", token);
    if (newPin) {
      if (newPin.length < 6) {
        showToast("Password must be at least 6 characters (12+ recommended).", "error");
        return;
      }
      // Warn on weak numeric-only short password, but allow
      if (/^\d+$/.test(newPin) && newPin.length < 8) {
        showToast("Weak password — use 8+ chars with letters/symbols for real security.", "error");
        // still proceed
      }
      const btn = adminSaveSettingsBtn;
      btn.disabled = true; btn.style.opacity = "0.6";
      try {
        const newRecord = await createPinRecord(newPin);
        localStorage.setItem("portfolio_admin_pin_hash", newRecord);
        document.getElementById("adminPinSetting").value = "";
        resetPinFails();
      } finally { btn.disabled = false; btn.style.opacity = ""; }
    }

    showToast("Settings saved successfully!");
  });
}

const adminResetDataBtn = document.getElementById("adminResetDataBtn");
if (adminResetDataBtn) {
  adminResetDataBtn.addEventListener("click", () => {
    if (confirm("Reset all content back to defaults? This will erase local edits.")) {
      localStorage.removeItem("portfolio_data_override");
      portfolioData = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
      applyCustomTheme();
      renderAll();
      renderAdminAllTabs();
      showToast("Reset to default portfolio content.");
    }
  });
}

// Global Move & Delete Handlers for Admin
window.moveAdminItem = function (collectionKey, index, direction) {
  const list = portfolioData[collectionKey];
  if (!list) return;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= list.length) return;

  const temp = list[index];
  list[index] = list[newIndex];
  list[newIndex] = temp;

  savePortfolioDataLocally();
  renderAll();
  renderAdminAllTabs();
};

window.deleteAdminItem = function (collectionKey, idOrIndex) {
  if (!confirm("Are you sure you want to delete this item?")) return;

  if (collectionKey === "skills") {
    const idx = parseInt(idOrIndex, 10);
    portfolioData.skills.splice(idx, 1);
  } else {
    portfolioData[collectionKey] = portfolioData[collectionKey].filter((item) => item.id !== idOrIndex);
  }

  savePortfolioDataLocally();
  renderAll();
  renderAdminAllTabs();
  showToast("Item deleted.");
};

// ==========================================================================
// ITEM EDIT MODAL BUILDER (Full Form Builder with Sub-items)
// ==========================================================================
window.openEditItemModal = function (type, idOrIndex, isNew = false) {
  currentEditingContext = { type, id: idOrIndex, isNew };
  adminItemModalTitle.textContent = isNew ? `Add New ${capitalize(type)}` : `Edit ${capitalize(type)}`;

  let formHtml = "";

  if (type === "experience") {
    const exp = isNew
      ? { id: `exp-${Date.now()}`, role: "", company: "", dates: "", location: "", bullets: [""] }
      : portfolioData.experiences.find((e) => e.id === idOrIndex) || {};

    formHtml = `
      <div class="admin-form-group">
        <label for="editExpRole">Job Title / Role</label>
        <input type="text" id="editExpRole" value="${exp.role || ""}" required>
      </div>
      <div class="admin-form-group">
        <label for="editExpCompany">Company / Organization</label>
        <input type="text" id="editExpCompany" value="${exp.company || ""}" required>
      </div>
      <div class="admin-form-group">
        <label for="editExpDates">Date Range (e.g. Oct 2024 - Present)</label>
        <input type="text" id="editExpDates" value="${exp.dates || ""}" required>
      </div>
      <div class="admin-form-group">
        <label for="editExpLocation">Location / Mode (e.g. Hybrid | Egypt / KL Malaysia)</label>
        <input type="text" id="editExpLocation" value="${exp.location || ""}">
      </div>
      <div class="admin-builder-section">
        <div class="admin-builder-header">
          <h4>Key Responsibilities & Achievements (Bullets)</h4>
          <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost" onclick="addBulletRow('editExpBulletsContainer')">+ Add Bullet</button>
        </div>
        <div id="editExpBulletsContainer">
          ${(exp.bullets || [""])
            .map(
              (b) => `
            <div class="admin-bullet-row">
              <input type="text" value="${escapeHtml(b)}" placeholder="Achievement or responsibility detail...">
              <button type="button" class="admin-icon-btn danger" onclick="this.parentElement.remove()" title="Delete">✕</button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  } else if (type === "project") {
    const p = isNew
      ? {
          id: `proj-${Date.now()}`,
          isOpenSource: true,
          typeBadgeText: "Open Source ✦",
          typeBadgeClass: "badge-open-source",
          title: "",
          cardTitle: "",
          tag: "",
          cardExcerpt: "",
          cardBullets: [""],
          hoverImage: "",
          description: "",
          specs: [{ param: "", value: "", note: "" }],
          features: [{ title: "", items: [""] }],
          images: [],
          actions: []
        }
      : portfolioData.projects.find((pr) => pr.id === idOrIndex) || {};

    formHtml = `
      <div class="admin-form-grid">
        <div class="admin-form-group">
          <label for="editProjCardTitle">Card Title (Short)</label>
          <input type="text" id="editProjCardTitle" value="${p.cardTitle || p.title || ""}" required>
        </div>
        <div class="admin-form-group">
          <label for="editProjTag">Tag (e.g. PCB | Power Electronics | Jan 2026)</label>
          <input type="text" id="editProjTag" value="${p.tag || ""}">
        </div>
        <div class="admin-form-group full-width">
          <label for="editProjFullTitle">Full Title (Modal Header)</label>
          <input type="text" id="editProjFullTitle" value="${p.title || ""}">
        </div>
        <div class="admin-form-group">
          <label for="editProjBadgeText">Badge Text</label>
          <input type="text" id="editProjBadgeText" value="${p.typeBadgeText || (p.isOpenSource ? "Open Source ✦" : "Private ✦")}">
        </div>
        <div class="admin-form-group">
          <label for="editProjBadgeClass">Badge Style</label>
          <select id="editProjBadgeClass">
            <option value="badge-open-source" ${p.isOpenSource ? "selected" : ""}>Cyan / Open Source (Glow)</option>
            <option value="badge-private" ${!p.isOpenSource ? "selected" : ""}>Silver / Private</option>
          </select>
        </div>
        <div class="admin-form-group full-width">
          <label for="editProjExcerpt">Card Excerpt</label>
          <textarea id="editProjExcerpt" rows="2">${p.cardExcerpt || p.description || ""}</textarea>
        </div>
        <div class="admin-form-group full-width">
          <label for="editProjHoverImage">Hover 3D Render Image Path (e.g. Project/BLDC_MC_V1.0/bldc_top.png)</label>
          <input type="text" id="editProjHoverImage" value="${p.hoverImage || ""}">
        </div>
        <div class="admin-form-group full-width">
          <label for="editProjDesc">Full Modal Description</label>
          <textarea id="editProjDesc" rows="3">${p.description || ""}</textarea>
        </div>
      </div>

      <!-- Card Bullets Builder -->
      <div class="admin-builder-section">
        <div class="admin-builder-header">
          <h4>Card Quick Bullets</h4>
          <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost" onclick="addBulletRow('editProjBulletsContainer')">+ Add Bullet</button>
        </div>
        <div id="editProjBulletsContainer">
          ${(p.cardBullets || [""])
            .map(
              (b) => `
            <div class="admin-bullet-row">
              <input type="text" value="${escapeHtml(b)}" placeholder="Key highlight...">
              <button type="button" class="admin-icon-btn danger" onclick="this.parentElement.remove()">✕</button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Technical Specifications Builder -->
      <div class="admin-builder-section">
        <div class="admin-builder-header">
          <h4>Technical Specifications Table</h4>
          <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost" onclick="addSpecRow('editProjSpecsContainer')">+ Add Spec Row</button>
        </div>
        <div id="editProjSpecsContainer">
          ${(p.specs || [])
            .map(
              (s) => `
            <div class="admin-spec-row">
              <input type="text" class="spec-param" value="${escapeHtml(s.param || "")}" placeholder="Parameter (e.g. Input Voltage)">
              <input type="text" class="spec-val" value="${escapeHtml(s.value || "")}" placeholder="Value (e.g. 24V – 60V)">
              <input type="text" class="spec-note" value="${escapeHtml(s.note || "")}" placeholder="Note (optional)">
              <button type="button" class="admin-icon-btn danger" onclick="this.parentElement.remove()">✕</button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Gallery Images Builder -->
      <div class="admin-builder-section">
        <div class="admin-builder-header">
          <h4>Gallery Visuals & Renders</h4>
          <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost" onclick="addImageRow('editProjImagesContainer')">+ Add Image</button>
        </div>
        <div id="editProjImagesContainer">
          ${(p.images || [])
            .map(
              (img) => `
            <div class="admin-image-row">
              <input type="text" class="img-src" value="${escapeHtml(img.src || "")}" placeholder="Image Path (e.g. Project/BLDC_MC_V1.0/bldc_top.png)">
              <input type="text" class="img-label" value="${escapeHtml(img.label || "")}" placeholder="Tab Label (e.g. Top 3D View)">
              <input type="text" class="img-caption" value="${escapeHtml(img.caption || "")}" placeholder="Caption">
              <button type="button" class="admin-icon-btn danger" onclick="this.parentElement.remove()">✕</button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Action Links Builder -->
      <div class="admin-builder-section">
        <div class="admin-builder-header">
          <h4>Action Buttons & Links</h4>
          <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost" onclick="addActionRow('editProjActionsContainer')">+ Add Action</button>
        </div>
        <div id="editProjActionsContainer">
          ${(p.actions || [])
            .map(
              (a) => `
            <div class="admin-action-row">
              <input type="text" class="act-label" value="${escapeHtml(a.label || "")}" placeholder="Label (e.g. View on GitHub ↗)">
              <input type="text" class="act-url" value="${escapeHtml(a.url || "")}" placeholder="URL">
              <label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;white-space:nowrap;">
                <input type="checkbox" class="act-primary" ${a.isPrimary ? "checked" : ""}> Primary
              </label>
              <button type="button" class="admin-icon-btn danger" onclick="this.parentElement.remove()">✕</button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  } else if (type === "skill") {
    const idx = parseInt(idOrIndex, 10);
    const s = isNew ? { category: "", tags: [] } : portfolioData.skills[idx] || {};

    formHtml = `
      <div class="admin-form-group">
        <label for="editSkillCategory">Skill Domain / Category Name</label>
        <input type="text" id="editSkillCategory" value="${s.category || ""}" placeholder="e.g. High-Speed Design" required>
      </div>
      <div class="admin-form-group">
        <label>Skill Tags (Press Enter or Comma to add)</label>
        <div class="admin-tags-container" id="editSkillTagsContainer">
          ${(s.tags || [])
            .map(
              (tag) => `
            <span class="admin-tag-pill">
              <span>${tag}</span>
              <button type="button" onclick="this.parentElement.remove()">✕</button>
            </span>
          `
            )
            .join("")}
          <input type="text" class="admin-tag-input" id="adminTagInput" placeholder="+ Add skill tag...">
        </div>
      </div>
    `;
  } else if (type === "course") {
    const c = isNew
      ? {
          id: `course-${Date.now()}`,
          isCourse: true,
          isOpenSource: true,
          typeBadgeText: "Verified ✦",
          typeBadgeClass: "badge-open-source",
          title: "",
          cardTitle: "",
          instructor: "",
          dates: "",
          type: "Online Course",
          iconSrc: "",
          iconDark: false,
          tag: "",
          cardBullets: [""],
          description: "",
          specs: [],
          features: [],
          images: [],
          actions: []
        }
      : portfolioData.courses.find((cr) => cr.id === idOrIndex) || {};

    formHtml = `
      <div class="admin-form-grid">
        <div class="admin-form-group full-width">
          <label for="editCourseTitle">Course / Certification Title</label>
          <input type="text" id="editCourseTitle" value="${c.cardTitle || c.title || ""}" required>
        </div>
        <div class="admin-form-group">
          <label for="editCourseInstructor">Instructor / Academy</label>
          <input type="text" id="editCourseInstructor" value="${c.instructor || ""}">
        </div>
        <div class="admin-form-group">
          <label for="editCourseDates">Dates</label>
          <input type="text" id="editCourseDates" value="${c.dates || ""}">
        </div>
        <div class="admin-form-group">
          <label for="editCourseType">Course Type / Format</label>
          <input type="text" id="editCourseType" value="${c.type || "Online Course"}">
        </div>
        <div class="admin-form-group">
          <label for="editCourseTag">Tag</label>
          <input type="text" id="editCourseTag" value="${c.tag || ""}">
        </div>
        <div class="admin-form-group">
          <label for="editCourseBadgeText">Badge Text</label>
          <input type="text" id="editCourseBadgeText" value="${c.typeBadgeText || "Verified ✦"}">
        </div>
        <div class="admin-form-group">
          <label for="editCourseIcon">Institution Icon Path (e.g. Icons/Fedevel.png)</label>
          <input type="text" id="editCourseIcon" value="${c.iconSrc || ""}">
        </div>
        <div class="admin-form-group full-width">
          <label for="editCourseDesc">Overview & Syllabus Summary</label>
          <textarea id="editCourseDesc" rows="3">${c.description || ""}</textarea>
        </div>
      </div>

      <!-- Card Bullets -->
      <div class="admin-builder-section">
        <div class="admin-builder-header">
          <h4>Syllabus Highlights (Bullets)</h4>
          <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost" onclick="addBulletRow('editCourseBulletsContainer')">+ Add Bullet</button>
        </div>
        <div id="editCourseBulletsContainer">
          ${(c.cardBullets || [""])
            .map(
              (b) => `
            <div class="admin-bullet-row">
              <input type="text" value="${escapeHtml(b)}" placeholder="Highlight topic...">
              <button type="button" class="admin-icon-btn danger" onclick="this.parentElement.remove()">✕</button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Certificate Images / Gallery -->
      <div class="admin-builder-section">
        <div class="admin-builder-header">
          <h4>Certificate Image / Proof (Optional)</h4>
          <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost" onclick="addImageRow('editCourseImagesContainer')">+ Add Image</button>
        </div>
        <div id="editCourseImagesContainer">
          ${(c.images || [])
            .map(
              (img) => `
            <div class="admin-image-row">
              <input type="text" class="img-src" value="${escapeHtml(img.src || "")}" placeholder="Certificate Image Path (e.g. certificates/Mixed-Signal Hardware Design_page-0001.jpg)">
              <input type="text" class="img-label" value="${escapeHtml(img.label || "")}" placeholder="Label (e.g. Certificate)">
              <input type="text" class="img-caption" value="${escapeHtml(img.caption || "")}" placeholder="Caption">
              <button type="button" class="admin-icon-btn danger" onclick="this.parentElement.remove()">✕</button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Actions (e.g. Download PDF) -->
      <div class="admin-builder-section">
        <div class="admin-builder-header">
          <h4>Certificate Download Link / Action</h4>
          <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost" onclick="addActionRow('editCourseActionsContainer')">+ Add Action</button>
        </div>
        <div id="editCourseActionsContainer">
          ${(c.actions || [])
            .map(
              (a) => `
            <div class="admin-action-row">
              <input type="text" class="act-label" value="${escapeHtml(a.label || "")}" placeholder="Label (e.g. Download Certificate PDF ↗)">
              <input type="text" class="act-url" value="${escapeHtml(a.url || "")}" placeholder="PDF / Verification Link">
              <label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;white-space:nowrap;">
                <input type="checkbox" class="act-primary" ${a.isPrimary ? "checked" : ""}> Primary
              </label>
              <button type="button" class="admin-icon-btn danger" onclick="this.parentElement.remove()">✕</button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  adminItemModalBody.innerHTML = formHtml;
  adminItemModalOverlay.classList.add("active");
  adminItemModalOverlay.setAttribute("aria-hidden", "false");

  // Tag input listener for skills
  if (type === "skill") {
    const tagInput = document.getElementById("adminTagInput");
    const container = document.getElementById("editSkillTagsContainer");
    if (tagInput && container) {
      tagInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          const val = tagInput.value.trim().replace(/^,|,$/g, "");
          if (val) {
            const pill = document.createElement("span");
            pill.className = "admin-tag-pill";
            pill.innerHTML = `<span>${escapeHtml(val)}</span><button type="button" onclick="this.parentElement.remove()">✕</button>`;
            container.insertBefore(pill, tagInput);
            tagInput.value = "";
          }
        }
      });
    }
  }
};

function closeEditItemModal() {
  if (adminItemModalOverlay) {
    adminItemModalOverlay.classList.remove("active");
    adminItemModalOverlay.setAttribute("aria-hidden", "true");
  }
  currentEditingContext = null;
}

if (adminItemModalCloseBtn) adminItemModalCloseBtn.addEventListener("click", closeEditItemModal);
if (adminItemModalCancelBtn) adminItemModalCancelBtn.addEventListener("click", closeEditItemModal);

// Dynamic Builder Helpers
window.addBulletRow = function (containerId) {
  const c = document.getElementById(containerId);
  if (!c) return;
  const row = document.createElement("div");
  row.className = "admin-bullet-row";
  row.innerHTML = `
    <input type="text" placeholder="Detail point...">
    <button type="button" class="admin-icon-btn danger" onclick="this.parentElement.remove()">✕</button>
  `;
  c.appendChild(row);
  row.querySelector("input").focus();
};

window.addSpecRow = function (containerId) {
  const c = document.getElementById(containerId);
  if (!c) return;
  const row = document.createElement("div");
  row.className = "admin-spec-row";
  row.innerHTML = `
    <input type="text" class="spec-param" placeholder="Parameter (e.g. Output Current)">
    <input type="text" class="spec-val" placeholder="Value (e.g. 30A Continuous)">
    <input type="text" class="spec-note" placeholder="Note (optional)">
    <button type="button" class="admin-icon-btn danger" onclick="this.parentElement.remove()">✕</button>
  `;
  c.appendChild(row);
  row.querySelector("input").focus();
};

window.addImageRow = function (containerId) {
  const c = document.getElementById(containerId);
  if (!c) return;
  const row = document.createElement("div");
  row.className = "admin-image-row";
  row.innerHTML = `
    <input type="text" class="img-src" placeholder="Image URL / Path">
    <input type="text" class="img-label" placeholder="Label (e.g. Top View)">
    <input type="text" class="img-caption" placeholder="Caption">
    <button type="button" class="admin-icon-btn danger" onclick="this.parentElement.remove()">✕</button>
  `;
  c.appendChild(row);
  row.querySelector("input").focus();
};

window.addActionRow = function (containerId) {
  const c = document.getElementById(containerId);
  if (!c) return;
  const row = document.createElement("div");
  row.className = "admin-action-row";
  row.innerHTML = `
    <input type="text" class="act-label" placeholder="Button Label">
    <input type="text" class="act-url" placeholder="URL">
    <label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;white-space:nowrap;">
      <input type="checkbox" class="act-primary" checked> Primary
    </label>
    <button type="button" class="admin-icon-btn danger" onclick="this.parentElement.remove()">✕</button>
  `;
  c.appendChild(row);
  row.querySelector("input").focus();
};

// Save Item Handler
if (adminItemModalSaveBtn) {
  adminItemModalSaveBtn.addEventListener("click", () => {
    if (!currentEditingContext) return;
    const { type, id, isNew } = currentEditingContext;

    if (type === "experience") {
      const role = document.getElementById("editExpRole").value.trim();
      const company = document.getElementById("editExpCompany").value.trim();
      const dates = document.getElementById("editExpDates").value.trim();
      const location = document.getElementById("editExpLocation").value.trim();
      const bullets = Array.from(document.querySelectorAll("#editExpBulletsContainer input"))
        .map((i) => i.value.trim())
        .filter(Boolean);

      if (!role || !company) {
        showToast("Please enter at least Role and Company.", "error");
        return;
      }

      if (isNew) {
        portfolioData.experiences.unshift({
          id: `exp-${Date.now()}`,
          role,
          company,
          dates,
          location,
          bullets
        });
      } else {
        const exp = portfolioData.experiences.find((e) => e.id === id);
        if (exp) {
          exp.role = role;
          exp.company = company;
          exp.dates = dates;
          exp.location = location;
          exp.bullets = bullets;
        }
      }
    } else if (type === "project") {
      const cardTitle = document.getElementById("editProjCardTitle").value.trim();
      const fullTitle = document.getElementById("editProjFullTitle").value.trim() || cardTitle;
      const tag = document.getElementById("editProjTag").value.trim();
      const typeBadgeText = document.getElementById("editProjBadgeText").value.trim();
      const typeBadgeClass = document.getElementById("editProjBadgeClass").value;
      const cardExcerpt = document.getElementById("editProjExcerpt").value.trim();
      const hoverImage = document.getElementById("editProjHoverImage").value.trim();
      const description = document.getElementById("editProjDesc").value.trim() || cardExcerpt;

      const cardBullets = Array.from(document.querySelectorAll("#editProjBulletsContainer input"))
        .map((i) => i.value.trim())
        .filter(Boolean);

      const specs = Array.from(document.querySelectorAll("#editProjSpecsContainer .admin-spec-row"))
        .map((row) => ({
          param: row.querySelector(".spec-param").value.trim(),
          value: row.querySelector(".spec-val").value.trim(),
          note: row.querySelector(".spec-note").value.trim()
        }))
        .filter((s) => s.param || s.value);

      const images = Array.from(document.querySelectorAll("#editProjImagesContainer .admin-image-row"))
        .map((row) => ({
          src: row.querySelector(".img-src").value.trim(),
          label: row.querySelector(".img-label").value.trim() || "Preview",
          caption: row.querySelector(".img-caption").value.trim()
        }))
        .filter((img) => img.src);

      const actions = Array.from(document.querySelectorAll("#editProjActionsContainer .admin-action-row"))
        .map((row) => ({
          label: row.querySelector(".act-label").value.trim(),
          url: row.querySelector(".act-url").value.trim(),
          isPrimary: row.querySelector(".act-primary").checked
        }))
        .filter((a) => a.label && a.url);

      if (!cardTitle) {
        showToast("Please enter a Project Title.", "error");
        return;
      }

      const isOpenSource = typeBadgeClass === "badge-open-source";

      if (isNew) {
        const newProj = {
          id: `proj-${Date.now()}`,
          isOpenSource,
          typeBadgeText,
          typeBadgeClass,
          title: fullTitle,
          cardTitle,
          tag,
          cardExcerpt,
          cardBullets,
          hoverImage,
          description,
          specs,
          features: [],
          images,
          actions
        };
        portfolioData.projects.unshift(newProj);
      } else {
        const p = portfolioData.projects.find((pr) => pr.id === id);
        if (p) {
          p.isOpenSource = isOpenSource;
          p.typeBadgeText = typeBadgeText;
          p.typeBadgeClass = typeBadgeClass;
          p.title = fullTitle;
          p.cardTitle = cardTitle;
          p.tag = tag;
          p.cardExcerpt = cardExcerpt;
          p.cardBullets = cardBullets;
          p.hoverImage = hoverImage;
          p.description = description;
          p.specs = specs;
          p.images = images;
          p.actions = actions;
        }
      }
    } else if (type === "skill") {
      const category = document.getElementById("editSkillCategory").value.trim();
      const tags = Array.from(document.querySelectorAll("#editSkillTagsContainer .admin-tag-pill span:first-child"))
        .map((s) => s.textContent.trim())
        .filter(Boolean);

      if (!category) {
        showToast("Please enter a Skill Category.", "error");
        return;
      }

      if (isNew) {
        portfolioData.skills.push({ category, tags });
      } else {
        const idx = parseInt(id, 10);
        if (portfolioData.skills[idx]) {
          portfolioData.skills[idx].category = category;
          portfolioData.skills[idx].tags = tags;
        }
      }
    } else if (type === "course") {
      const title = document.getElementById("editCourseTitle").value.trim();
      const instructor = document.getElementById("editCourseInstructor").value.trim();
      const dates = document.getElementById("editCourseDates").value.trim();
      const courseType = document.getElementById("editCourseType").value.trim();
      const tag = document.getElementById("editCourseTag").value.trim();
      const badgeText = document.getElementById("editCourseBadgeText").value.trim();
      const iconSrc = document.getElementById("editCourseIcon").value.trim();
      const description = document.getElementById("editCourseDesc").value.trim();

      const cardBullets = Array.from(document.querySelectorAll("#editCourseBulletsContainer input"))
        .map((i) => i.value.trim())
        .filter(Boolean);

      const images = Array.from(document.querySelectorAll("#editCourseImagesContainer .admin-image-row"))
        .map((row) => ({
          src: row.querySelector(".img-src").value.trim(),
          label: row.querySelector(".img-label").value.trim() || "Certificate",
          caption: row.querySelector(".img-caption").value.trim()
        }))
        .filter((img) => img.src);

      const actions = Array.from(document.querySelectorAll("#editCourseActionsContainer .admin-action-row"))
        .map((row) => ({
          label: row.querySelector(".act-label").value.trim(),
          url: row.querySelector(".act-url").value.trim(),
          isPrimary: row.querySelector(".act-primary").checked
        }))
        .filter((a) => a.label && a.url);

      if (!title) {
        showToast("Please enter a Course Title.", "error");
        return;
      }

      if (isNew) {
        const newCourse = {
          id: `course-${Date.now()}`,
          isCourse: true,
          isOpenSource: true,
          typeBadgeText: badgeText || "Verified ✦",
          typeBadgeClass: "badge-open-source",
          title,
          cardTitle: title,
          instructor,
          dates,
          type: courseType,
          iconSrc,
          iconDark: false,
          tag,
          cardBullets,
          description,
          specs: [],
          features: [],
          images,
          actions
        };
        portfolioData.courses.unshift(newCourse);
      } else {
        const c = portfolioData.courses.find((cr) => cr.id === id);
        if (c) {
          c.title = title;
          c.cardTitle = title;
          c.instructor = instructor;
          c.dates = dates;
          c.type = courseType;
          c.tag = tag;
          c.typeBadgeText = badgeText;
          c.iconSrc = iconSrc;
          c.cardBullets = cardBullets;
          c.description = description;
          c.images = images;
          c.actions = actions;
        }
      }
    }

    savePortfolioDataLocally();
    renderAll();
    renderAdminAllTabs();
    closeEditItemModal();
    showToast("Changes saved successfully!");
  });
}

// Add Item Buttons Listeners
document.getElementById("adminAddExperienceBtn")?.addEventListener("click", () => openEditItemModal("experience", null, true));
document.getElementById("adminAddProjectBtn")?.addEventListener("click", () => openEditItemModal("project", null, true));
document.getElementById("adminAddSkillCategoryBtn")?.addEventListener("click", () => openEditItemModal("skill", null, true));
document.getElementById("adminAddCourseBtn")?.addEventListener("click", () => openEditItemModal("course", null, true));

// ==========================================================================
// 1-CLICK GITHUB DIRECT CLOUD PUBLISH & EXPORT JSON
// ==========================================================================
if (adminPublishBtn) {
  adminPublishBtn.addEventListener("click", async () => {
    const owner = localStorage.getItem("gh_owner") || "AhmedAbo-Eita";
    const repo = localStorage.getItem("gh_repo") || "AhmedAbo-Eita.github.io";
    const branch = localStorage.getItem("gh_branch") || "main";
    const token = localStorage.getItem("gh_token");

    if (!token) {
      // Prompt user to go to settings tab to set token
      const settingsTabBtn = document.querySelector('.admin-sidebar-nav [data-tab="tab-settings"]');
      if (settingsTabBtn) settingsTabBtn.click();
      showToast("Please enter your GitHub Personal Access Token first.", "error");
      const tokenInput = document.getElementById("ghToken");
      if (tokenInput) tokenInput.focus();
      return;
    }

    const originalBtnHtml = adminPublishBtn.innerHTML;
    adminPublishBtn.innerHTML = `
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-anim"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
      <span>Publishing...</span>
    `;
    adminPublishBtn.disabled = true;

    try {
      const filePath = "data/portfolio-data.json";
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

      // 1. Get existing file SHA if it exists
      let sha = "";
      try {
        const getRes = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json"
          }
        });
        if (getRes.ok) {
          const getJson = await getRes.json();
          sha = getJson.sha;
        }
      } catch (e) {
        console.warn("Could not get existing file SHA, will try create", e);
      }

      // 2. Commit updated JSON
      const jsonContent = JSON.stringify(portfolioData, null, 2);
      const base64Content = btoa(unescape(encodeURIComponent(jsonContent)));

      const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `Update portfolio content via Admin Studio [${new Date().toISOString().split("T")[0]}]`,
          content: base64Content,
          branch,
          ...(sha ? { sha } : {})
        })
      });

      if (putRes.ok) {
        showToast("🚀 Successfully published to GitHub! Live site updates shortly.");
      } else {
        const errJson = await putRes.json();
        throw new Error(errJson.message || "Failed to commit file to GitHub");
      }
    } catch (err) {
      console.error(err);
      showToast(`Publish failed: ${err.message}`, "error");
    } finally {
      adminPublishBtn.innerHTML = originalBtnHtml;
      adminPublishBtn.disabled = false;
    }
  });
}

// Export JSON File
if (adminDownloadBtn) {
  adminDownloadBtn.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(portfolioData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "portfolio-data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Downloaded portfolio-data.json");
  });
}

// Utility Helpers
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Initialize on DOM load & check secret triggers
document.addEventListener("DOMContentLoaded", () => {
  initPortfolioData();

  // Stealth Trigger 1: URL parameter (e.g. yoursite.com/?admin or #admin)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("admin") || urlParams.has("cms") || window.location.hash === "#admin") {
    setTimeout(openAdminPinModal, 300);
  }

  // Stealth Trigger 2: Secret triple-click on footer copyright (great for mobile phone)
  let secretClickCount = 0;
  let secretClickTimer = null;
  const footerCopyright = document.getElementById("footerCopyright");
  if (footerCopyright) {
    footerCopyright.style.cursor = "default";
    footerCopyright.addEventListener("click", () => {
      secretClickCount++;
      clearTimeout(secretClickTimer);
      if (secretClickCount >= 3) {
        secretClickCount = 0;
        openAdminPinModal();
      } else {
        secretClickTimer = setTimeout(() => {
          secretClickCount = 0;
        }, 700);
      }
    });
  }
});

