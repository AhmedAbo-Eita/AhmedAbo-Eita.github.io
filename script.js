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
      }
    ],
    images: [],
    actions: []
  },
  "high-speed-digital-design": {
    isCourse: true,
    isOpenSource: true,
    typeBadgeText: "Verified ✦",
    typeBadgeClass: "badge-open-source",
    title: "High-Speed Digital Design Masterclass",
    tag: "Signal Integrity | Eric Bogatin | Apr 2026",
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
  "mixed-signal-hardware-design": {
    isCourse: true,
    isOpenSource: true,
    typeBadgeText: "Verified ✦",
    typeBadgeClass: "badge-open-source",
    title: "Mixed-Signal Hardware Design",
    tag: "PCB Design | FEDEVEL | Feb 2026",
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
  "mastering-embedded-systems": {
    isCourse: true,
    isOpenSource: true,
    typeBadgeText: "Verified ✦",
    typeBadgeClass: "badge-open-source",
    title: "Mastering Embedded Systems Diploma",
    tag: "Embedded | Learn In Depth | Oct 2024",
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
  "udemy-self-study": {
    isCourse: true,
    isOpenSource: false,
    typeBadgeText: "Self-Study ✦",
    typeBadgeClass: "badge-private",
    title: "Self-Study & Specialized Courses",
    tag: "Power Electronics | Embedded | Ongoing",
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
};

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
  if (!currentProjectImages || currentProjectImages.length === 0) return;
  currentImageIndex = (index + currentProjectImages.length) % currentProjectImages.length;
  const currentImg = currentProjectImages[currentImageIndex];

  modalMainImg.style.opacity = "0";
  setTimeout(() => {
    modalMainImg.src = currentImg.src;
    modalMainImg.alt = currentImg.caption || "Image Preview";
    modalImgCaption.textContent = currentImg.caption || "";
    modalGalleryCount.textContent = (currentProjectImages.length > 1) ? `${currentImageIndex + 1} / ${currentProjectImages.length}` : (modalDialog.classList.contains("modal-mode-certificate") ? "Verified ✦" : `1 / 1`);
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

  const isCertOnly = project.isCourse && project.images && project.images.length > 0;

  // Set Modal Mode
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

  // Set Dynamic Section Headings for details
  if (modalSpecsHeading) {
    modalSpecsHeading.textContent = project.isCourse ? "Credential & Verification" : "Technical Specifications";
  }
  if (modalFeaturesHeading) {
    modalFeaturesHeading.textContent = project.isCourse ? "Syllabus & Core Competencies" : "Key Hardware Features";
  }

  // Set Meta & Type Badge
  modalProjectTag.textContent = project.tag || (project.isCourse ? "Course & Certification" : "Hardware Project");
  if (modalTypeBadge) {
    if (project.typeBadgeText) {
      modalTypeBadge.style.display = "inline-flex";
      modalTypeBadge.textContent = project.typeBadgeText;
      modalTypeBadge.className = `modal-type-badge ${project.typeBadgeClass || ""}`;
    } else {
      modalTypeBadge.style.display = "none";
    }
  }
  modalProjectTitle.textContent = project.title || "Details";
  modalProjectDesc.textContent = project.description || "";

  // Render Specifications Table
  if (project.specs && project.specs.length > 0 && !isCertOnly) {
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

  // Render Features / Topics List
  if (project.features && project.features.length > 0 && !isCertOnly) {
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

  // Render Actions
  if (isCertOnly) {
    // Certificate download action rendered inside gallery
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
    } else {
      modalActions.style.display = "none";
      modalActions.innerHTML = "";
    }
  }

  // Render Images (Open Source & Certificate Modes)
  currentProjectImages = project.images || [];
  currentImageIndex = 0;

  if ((project.isOpenSource || isCertOnly) && currentProjectImages.length > 0) {
    modalMainImg.src = currentProjectImages[0].src;
    modalMainImg.alt = currentProjectImages[0].caption || "Image Preview";
    modalImgCaption.textContent = currentProjectImages[0].caption || "";
    modalGalleryCount.textContent = (currentProjectImages.length > 1) ? `1 / ${currentProjectImages.length}` : (isCertOnly ? (project.typeBadgeText || "Verified ✦") : `1 / 1`);

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

// Hook Project & Course Cards: Click & Keyboard Triggers to Open Modal Popup
document.querySelectorAll(".project-card[data-project-id], .course-card[data-course-id]").forEach((card) => {
  const cardId = card.getAttribute("data-project-id") || card.getAttribute("data-course-id");

  // Click trigger
  card.addEventListener("click", () => {
    openProjectModal(cardId);
  });

  // Keyboard accessibility
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openProjectModal(cardId);
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

