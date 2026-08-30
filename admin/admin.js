/**
 * Visual Admin Studio & GitHub Cloud CMS (Loaded On-Demand)
 * Encrypted authentication, dynamic content manager & 1-click cloud sync
 */
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
        showToast("Admin Studio Unlocked");
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

const adminPinResetBtn = document.getElementById("adminPinResetBtn");
if (adminPinResetBtn) {
  adminPinResetBtn.addEventListener("click", () => {
    if (confirm("Reset admin password back to default '1234' and unlock access?")) {
      localStorage.removeItem("portfolio_admin_pin_hash");
      resetPinFails();
      if (adminPinInput) adminPinInput.value = "1234";
      showToast("Password reset to default '1234'. Click Unlock Studio to enter!");
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
  try {
    renderAdminAllTabs();
  } catch (err) {
    console.error("Error rendering admin tabs:", err);
  }
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

    // Smooth horizontal centering of active tab on mobile scrollable strip
    btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

    // Reset panel scroll position to top
    const mainPanel = document.querySelector(".admin-main-panel");
    if (mainPanel) mainPanel.scrollTop = 0;
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

// ==========================================================================
// ADMIN STUDIO DIRECT MEDIA UPLOADER & ASSET MANAGEMENT ENGINE
// ==========================================================================
const REPO_MEDIA_LIBRARY = {
  icons: [
    { label: "FEDEVEL Academy", path: "Icons/Fedevel.png" },
    { label: "Learn In Depth", path: "Icons/Learn_in_depth.png" },
    { label: "The Engineering EEcosystem", path: "Icons/The Engineering EEcosystem.png" },
    { label: "Udemy", path: "Icons/udemy.png" }
  ],
  projects: [
    { label: "Mixed Signal Board - Top 3D View", path: "Project/Mixed_Signal_Board_FEDEVEL_Course/Mixed_Signal_Board_FEDEVEL_Course_Front.png" },
    { label: "BLDC Motor Controller - Top 3D View", path: "Project/BLDC_MC_V1.0/bldc_top.png" },
    { label: "BLDC Motor Controller - Bottom 3D View", path: "Project/BLDC_MC_V1.0/bldc_bottom.png" }
  ],
  certificates: [
    { label: "Mixed-Signal Hardware Design", path: "certificates/Mixed-Signal Hardware Design_page-0001.jpg" },
    { label: "High Speed Digital Design 1", path: "certificates/high_speed_digital_design.jpeg" },
    { label: "High Speed Digital Design 2", path: "certificates/high_speed_digital_design_2.jpeg" },
    { label: "High Speed Digital Design 3", path: "certificates/high_speed_digital_design_3.jpeg" },
    { label: "High Speed Digital Design 4", path: "certificates/high_speed_digital_design_4_page-0001.jpg" },
    { label: "Mastering Embedded Systems", path: "certificates/mastering-embedded-systems.jpeg" }
  ],
  avatars: [
    { label: "Profile Photo 1 (Default)", path: "profile.jpg" },
    { label: "Profile Photo 2", path: "profile2.jpg" },
    { label: "Profile Photo 3", path: "profile3.jpeg" }
  ]
};

function readAndOptimizeMediaFile(file, maxDimension = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

    if (isPdf || isSvg) {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          dataUrl: e.target.result,
          name: file.name,
          isDoc: isPdf
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        let dataUrl;
        try {
          dataUrl = canvas.toDataURL(outputType, quality);
        } catch (err) {
          dataUrl = e.target.result;
        }

        resolve({
          dataUrl,
          name: file.name,
          isDoc: false
        });
      };
      img.onerror = () => {
        resolve({
          dataUrl: e.target.result,
          name: file.name,
          isDoc: false
        });
      };
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function buildMediaFieldHtml({ id, label, value = "", category = "all", helpText = "", accept = "image/*,.pdf,.svg" }) {
  const hasValue = Boolean(value && value.trim());
  const val = value ? value.trim() : "";
  const isPdf = val.toLowerCase().endsWith(".pdf") || val.startsWith("data:application/pdf");
  
  // Library options
  let libraryItems = [];
  if (category === "all") {
    Object.keys(REPO_MEDIA_LIBRARY).forEach((cat) => {
      libraryItems = libraryItems.concat(REPO_MEDIA_LIBRARY[cat]);
    });
  } else if (REPO_MEDIA_LIBRARY[category]) {
    libraryItems = REPO_MEDIA_LIBRARY[category];
  }

  const libraryOptionsHtml = libraryItems
    .map((item) => `<option value="${escapeHtml(item.path)}" ${val === item.path ? "selected" : ""}>${escapeHtml(item.label)} (${item.path})</option>`)
    .join("");

  return `
    <div class="admin-media-field" data-media-id="${id}">
      <label for="${id}">${escapeHtml(label)}</label>
      <div class="admin-media-box">
        <input type="hidden" id="${id}" class="admin-media-value-input" value="${escapeHtml(val)}">
        
        <!-- Live Preview Card (shown if value exists) -->
        <div class="admin-media-preview-card" style="display: ${hasValue ? "flex" : "none"};">
          ${
            isPdf
              ? `<div class="admin-media-doc-badge">PDF</div>`
              : `<img src="${hasValue ? escapeHtml(val) : ""}" alt="Preview" class="admin-media-thumb">`
          }
          <div class="admin-media-info">
            <span class="admin-media-name">${hasValue ? (val.startsWith("data:") ? "Uploaded File (Direct Storage)" : val) : "No file selected"}</span>
            <span class="admin-media-badge">${val.startsWith("data:") ? "In-Memory Optimized" : "Repository Asset"}</span>
          </div>
          <div class="admin-media-actions">
            <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost admin-media-replace-btn" title="Replace file">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Upload
            </button>
            <button type="button" class="admin-icon-btn danger admin-media-remove-btn" title="Remove / Clear">✕</button>
          </div>
        </div>

        <!-- Dropzone (shown if no value or when replacing) -->
        <div class="admin-media-dropzone" style="display: ${hasValue ? "none" : "flex"};">
          <div class="admin-media-dropzone-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </div>
          <div class="admin-media-dropzone-text">Click to upload or drag & drop file</div>
          <div class="admin-media-dropzone-subtext">PNG, JPG, WebP, SVG, or PDF</div>
          <input type="file" class="admin-media-file-input" accept="${accept}" style="display:none;">
        </div>

        <!-- Quick Library & Manual Toolbar -->
        <div class="admin-media-toolbar">
          ${
            libraryItems.length > 0
              ? `
            <select class="admin-media-library-select" title="Choose an existing asset from the repository library">
              <option value="">Choose from library...</option>
              ${libraryOptionsHtml}
            </select>
          `
              : ""
          }
          <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost admin-media-toggle-manual-btn" style="font-size:0.72rem;padding:4px 8px;">
            Path
          </button>
        </div>

        <div class="admin-media-manual-row">
          <input type="text" class="admin-media-manual-input" value="${escapeHtml(val)}" placeholder="e.g. Icons/Fedevel.png or https://...">
          <button type="button" class="admin-btn admin-btn-sm admin-btn-primary admin-media-apply-manual-btn">Apply</button>
        </div>

        ${helpText ? `<small class="admin-help-text">${escapeHtml(helpText)}</small>` : ""}
      </div>
    </div>
  `;
}

function initAllMediaFieldsIn(rootElement) {
  if (!rootElement) return;

  rootElement.querySelectorAll(".admin-media-field").forEach((field) => {
    const valueInput = field.querySelector(".admin-media-value-input");
    const previewCard = field.querySelector(".admin-media-preview-card");
    const dropzone = field.querySelector(".admin-media-dropzone");
    const fileInput = field.querySelector(".admin-media-file-input");
    const replaceBtn = field.querySelector(".admin-media-replace-btn");
    const removeBtn = field.querySelector(".admin-media-remove-btn");
    const librarySelect = field.querySelector(".admin-media-library-select");
    const toggleManualBtn = field.querySelector(".admin-media-toggle-manual-btn");
    const manualRow = field.querySelector(".admin-media-manual-row");
    const manualInput = field.querySelector(".admin-media-manual-input");
    const applyManualBtn = field.querySelector(".admin-media-apply-manual-btn");

    function updateMediaPreview(src, isDoc = false) {
      if (!src) {
        valueInput.value = "";
        previewCard.style.display = "none";
        dropzone.style.display = "flex";
        if (manualInput) manualInput.value = "";
        if (librarySelect) librarySelect.value = "";
        return;
      }

      valueInput.value = src;
      if (manualInput) manualInput.value = src;

      const checkPdf = isDoc || src.toLowerCase().endsWith(".pdf") || src.startsWith("data:application/pdf");
      const thumbEl = previewCard.querySelector(".admin-media-thumb");
      const docBadge = previewCard.querySelector(".admin-media-doc-badge");
      const nameEl = previewCard.querySelector(".admin-media-name");
      const badgeEl = previewCard.querySelector(".admin-media-badge");

      if (checkPdf) {
        if (thumbEl) thumbEl.style.display = "none";
        if (docBadge) docBadge.style.display = "grid";
        else {
          const newBadge = document.createElement("div");
          newBadge.className = "admin-media-doc-badge";
          newBadge.textContent = "PDF";
          previewCard.insertBefore(newBadge, previewCard.firstChild);
        }
      } else {
        if (docBadge) docBadge.style.display = "none";
        if (thumbEl) {
          thumbEl.src = src;
          thumbEl.style.display = "block";
        } else {
          const newThumb = document.createElement("img");
          newThumb.className = "admin-media-thumb";
          newThumb.src = src;
          newThumb.alt = "Preview";
          previewCard.insertBefore(newThumb, previewCard.firstChild);
        }
      }

      if (nameEl) nameEl.textContent = src.startsWith("data:") ? "Uploaded File (Direct Storage)" : src;
      if (badgeEl) badgeEl.textContent = src.startsWith("data:") ? "In-Memory Optimized" : "Repository Asset";

      previewCard.style.display = "flex";
      dropzone.style.display = "none";
    }

    // Dropzone Click
    dropzone?.addEventListener("click", () => fileInput?.click());
    replaceBtn?.addEventListener("click", () => fileInput?.click());

    // File Input change
    fileInput?.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const { dataUrl, isDoc } = await readAndOptimizeMediaFile(file);
        updateMediaPreview(dataUrl, isDoc);
        showToast("File uploaded successfully!");
      } catch (err) {
        console.error(err);
        showToast("Failed to process file: " + err.message, "error");
      }
    });

    // Drag & Drop
    dropzone?.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
    dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
    dropzone?.addEventListener("drop", async (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file) return;
      try {
        const { dataUrl, isDoc } = await readAndOptimizeMediaFile(file);
        updateMediaPreview(dataUrl, isDoc);
        showToast("File uploaded successfully!");
      } catch (err) {
        console.error(err);
        showToast("Failed to process file: " + err.message, "error");
      }
    });

    // Remove button
    removeBtn?.addEventListener("click", () => {
      updateMediaPreview("");
    });

    // Library Select
    librarySelect?.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val) {
        updateMediaPreview(val);
      }
    });

    // Manual toggle
    toggleManualBtn?.addEventListener("click", () => {
      if (manualRow) manualRow.classList.toggle("active");
    });

    applyManualBtn?.addEventListener("click", () => {
      if (manualInput) {
        updateMediaPreview(manualInput.value.trim());
        if (manualRow) manualRow.classList.remove("active");
      }
    });
  });
}

// 5. Admin Hero Tab
function renderAdminHeroTab() {
  const container = document.getElementById("adminHeroFormWrapper");
  const h = portfolioData.hero || {};
  if (!container) return;

  const avatarMediaHtml = buildMediaFieldHtml({
    id: "heroAvatar",
    label: "Profile Photo / Avatar",
    value: h.avatar || "profile.jpg",
    category: "avatars",
    helpText: "Upload a square portrait photo (PNG/JPG). It will display in the Hero section."
  });

  container.innerHTML = `
    <form id="adminHeroForm" class="admin-form-grid">
      <div class="admin-form-group full-width">
        ${avatarMediaHtml}
      </div>
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

  initAllMediaFieldsIn(container);

  document.getElementById("adminSaveHeroBtn").addEventListener("click", () => {
    portfolioData.hero = {
      ...portfolioData.hero,
      avatar: document.getElementById("heroAvatar")?.value.trim() || portfolioData.hero.avatar || "profile.jpg",
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

  const currentTheme = (portfolioData && portfolioData.theme) || (DEFAULT_PORTFOLIO_DATA && DEFAULT_PORTFOLIO_DATA.theme) || DEFAULT_THEME;
  const currentPreset = currentTheme.preset || "copper";
  const dark = currentTheme.dark || DEFAULT_THEME.dark;
  const light = currentTheme.light || DEFAULT_THEME.light;
  const fonts = currentTheme.fonts || DEFAULT_THEME.fonts;
  const pointer = currentTheme.pointer || DEFAULT_THEME.pointer || { enabled: true, mode: "glow", color: "", radius: 160, intensity: 12 };

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

    <!-- Pointer & Cursor Ambient Shadow / Glow Section -->
    <div class="admin-theme-section">
      <div class="admin-theme-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path><path d="m13 13 6 6"></path></svg>
        <span>Pointer & Cursor Ambient Shadow / Glow</span>
      </div>
      <p class="admin-theme-section-desc">Customize the ambient light shadow and glow radius that follows your cursor/pointer across the screen.</p>
      <div class="admin-pointer-grid">
        <div class="admin-pointer-card">
          <label for="pointerModeSelect">Shadow Effect Mode</label>
          <select id="pointerModeSelect" class="admin-font-select">
            <option value="glow" ${(pointer.mode || "glow") === "glow" ? "selected" : ""}>Radial Ambient Glow (Default)</option>
            <option value="spotlight" ${pointer.mode === "spotlight" ? "selected" : ""}>Focused Spotlight Beam</option>
            <option value="ring" ${pointer.mode === "ring" ? "selected" : ""}>Halo Pulse Ring</option>
            <option value="none" ${pointer.mode === "none" || pointer.enabled === false ? "selected" : ""}>Disabled (No Shadow)</option>
          </select>
        </div>

        <div class="admin-pointer-card">
          <label for="colorPointerColor">
            <span>Shadow Color</span>
            <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost" id="btnSyncPointerColor" style="font-size:0.68rem;padding:2px 6px;min-height:22px;">Sync Accent</button>
          </label>
          <div class="admin-color-input-wrapper">
            <input type="color" class="admin-color-picker-native" id="pickerPointerColor" value="${pointer.color || dark.accent || "#FF7E4A"}">
            <input type="text" class="admin-color-hex-input" id="colorPointerColor" value="${pointer.color || ""}" placeholder="AUTO (ACCENT)" maxlength="7">
          </div>
        </div>

        <div class="admin-pointer-card">
          <label for="rangePointerRadius">
            <span>Shadow Size / Radius</span>
            <span class="admin-range-value" id="valPointerRadius">${pointer.radius || 160}px</span>
          </label>
          <div class="admin-range-wrapper">
            <input type="range" class="admin-range-slider" id="rangePointerRadius" min="40" max="320" step="10" value="${pointer.radius || 160}">
          </div>
        </div>

        <div class="admin-pointer-card">
          <label for="rangePointerIntensity">
            <span>Shadow Intensity / Opacity</span>
            <span class="admin-range-value" id="valPointerIntensity">${pointer.intensity !== undefined ? pointer.intensity : 12}%</span>
          </label>
          <div class="admin-range-wrapper">
            <input type="range" class="admin-range-slider" id="rangePointerIntensity" min="0" max="50" step="1" value="${pointer.intensity !== undefined ? pointer.intensity : 12}">
          </div>
        </div>
      </div>

      <!-- Live Interactive Pointer Shadow Preview -->
      <div class="admin-pointer-preview-box" id="adminPointerPreviewBox" style="margin-top:10px;">
        <span>Move pointer here to preview interactive shadow</span>
        <div class="admin-pointer-preview-glow" id="adminPointerPreviewGlow"></div>
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
      if (!val.startsWith("#") && val.length > 0) val = "#" + val;
      if (/^#[0-9A-F]{6}$/i.test(val)) {
        picker.value = val;
        triggerLiveThemePreview();
      } else if (val === "") {
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

  syncColorPair("pickerPointerColor", "colorPointerColor");

  // Pointer Shadow Controls Listeners
  const pointerModeSelect = document.getElementById("pointerModeSelect");
  const rangePointerRadius = document.getElementById("rangePointerRadius");
  const valPointerRadius = document.getElementById("valPointerRadius");
  const rangePointerIntensity = document.getElementById("rangePointerIntensity");
  const valPointerIntensity = document.getElementById("valPointerIntensity");
  const btnSyncPointerColor = document.getElementById("btnSyncPointerColor");

  if (pointerModeSelect) pointerModeSelect.addEventListener("change", () => triggerLiveThemePreview());

  if (rangePointerRadius && valPointerRadius) {
    rangePointerRadius.addEventListener("input", (e) => {
      valPointerRadius.textContent = `${e.target.value}px`;
      triggerLiveThemePreview();
    });
  }

  if (rangePointerIntensity && valPointerIntensity) {
    rangePointerIntensity.addEventListener("input", (e) => {
      valPointerIntensity.textContent = `${e.target.value}%`;
      triggerLiveThemePreview();
    });
  }

  if (btnSyncPointerColor) {
    btnSyncPointerColor.addEventListener("click", () => {
      const darkAccent = document.getElementById("colorDarkAccent").value || "#FF7E4A";
      const colorInput = document.getElementById("colorPointerColor");
      const pickerInput = document.getElementById("pickerPointerColor");
      if (colorInput) colorInput.value = "";
      if (pickerInput) pickerInput.value = darkAccent;
      triggerLiveThemePreview();
      showToast("Pointer shadow color synced to accent!");
    });
  }

  // Interactive Pointer Shadow Preview Box
  const previewBox = document.getElementById("adminPointerPreviewBox");
  const previewGlow = document.getElementById("adminPointerPreviewGlow");
  if (previewBox && previewGlow) {
    previewBox.addEventListener("mousemove", (e) => {
      const rect = previewBox.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rad = rangePointerRadius ? parseInt(rangePointerRadius.value, 10) : 160;
      const intensity = rangePointerIntensity ? parseInt(rangePointerIntensity.value, 10) / 100 : 0.12;
      const customCol = document.getElementById("colorPointerColor")?.value.trim();
      const darkAccent = document.getElementById("colorDarkAccent")?.value || "#FF7E4A";
      const col = customCol && /^#[0-9A-F]{6}$/i.test(customCol) ? customCol : darkAccent;
      const mode = pointerModeSelect ? pointerModeSelect.value : "glow";

      if (mode === "none" || intensity === 0) {
        previewGlow.style.opacity = "0";
      } else {
        previewGlow.style.opacity = "1";
        previewGlow.style.left = `${x}px`;
        previewGlow.style.top = `${y}px`;
        previewGlow.style.width = `${rad * 1.5}px`;
        previewGlow.style.height = `${rad * 1.5}px`;
        previewGlow.style.background = `radial-gradient(circle, ${col} ${Math.min(100, intensity * 250)}%, transparent 70%)`;
      }
    });
    previewBox.addEventListener("mouseleave", () => {
      previewGlow.style.opacity = "0";
    });
  }

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

        if (document.getElementById("pickerPointerColor")) {
          document.getElementById("pickerPointerColor").value = preset.dark.accent;
        }

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

    const pMode = pointerModeSelect ? pointerModeSelect.value : "glow";
    const pColor = document.getElementById("colorPointerColor") ? document.getElementById("colorPointerColor").value.trim() : "";
    const pRadius = rangePointerRadius ? parseInt(rangePointerRadius.value, 10) : 160;
    const pIntensity = rangePointerIntensity ? parseInt(rangePointerIntensity.value, 10) : 12;

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
      },
      pointer: {
        enabled: pMode !== "none",
        mode: pMode,
        color: pColor,
        radius: pRadius,
        intensity: pIntensity
      }
    };

    if (portfolioData) portfolioData.theme = liveTheme;
    applyCustomTheme(liveTheme);
  }

  // Save Theme Button
  const saveBtn = document.getElementById("adminSaveThemeBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const activePresetBtn = document.querySelector("#adminPresetsGrid .admin-preset-card.active");
      const activePreset = activePresetBtn ? activePresetBtn.getAttribute("data-preset-id") : "custom";

      const pMode = pointerModeSelect ? pointerModeSelect.value : "glow";
      const pColor = document.getElementById("colorPointerColor") ? document.getElementById("colorPointerColor").value.trim() : "";
      const pRadius = rangePointerRadius ? parseInt(rangePointerRadius.value, 10) : 160;
      const pIntensity = rangePointerIntensity ? parseInt(rangePointerIntensity.value, 10) : 12;

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
        },
        pointer: {
          enabled: pMode !== "none",
          mode: pMode,
          color: pColor,
          radius: pRadius,
          intensity: pIntensity
        }
      };

      savePortfolioDataLocally();
      applyCustomTheme();
      renderAll();
      showToast("Theme, Typography & Pointer Shadow saved!");
    });
  }

  // Reset Theme Button
  const resetBtn = document.getElementById("adminResetThemeBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset theme, colors and typography back to Precision Copper default?")) {
        portfolioData.theme = JSON.parse(JSON.stringify(DEFAULT_THEME));
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

    const hoverMediaHtml = buildMediaFieldHtml({
      id: "editProjHoverImage",
      label: "Hover 3D Render Image / Main PCB Visual",
      value: p.hoverImage || "",
      category: "projects",
      helpText: "3D render or PCB visual shown when hovering project card and inside modal."
    });

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
          ${hoverMediaHtml}
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

      <!-- Gallery Images Builder with Direct Upload & Batch Support -->
      <div class="admin-builder-section">
        <div class="admin-builder-header">
          <h4>Gallery Visuals & 3D Renders</h4>
          <div style="display:flex;gap:6px;">
            <label class="admin-btn admin-btn-sm admin-btn-primary" style="cursor:pointer;margin:0;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <span>+ Upload Images</span>
              <input type="file" accept="image/*,.svg" multiple style="display:none;" onchange="handleBatchMediaUpload(this.files, 'editProjImagesContainer', false)">
            </label>
            <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost" onclick="addGalleryCardRow('editProjImagesContainer', {src:'',label:'Preview',caption:''}, false)">+ Add Row</button>
          </div>
        </div>
        <div id="editProjImagesContainer">
          <!-- Populated after render -->
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

    const iconMediaHtml = buildMediaFieldHtml({
      id: "editCourseIcon",
      label: "Institution / Organization Icon",
      value: c.iconSrc || "",
      category: "icons",
      helpText: "Square logo of academy or certification provider (PNG/SVG)."
    });

    const projectHoverMediaHtml = buildMediaFieldHtml({
      id: "editCourseProjectHoverImage",
      label: "Project 3D PCB Render / Hover Visual",
      value: c.projectHoverImage || "",
      category: "projects",
      helpText: "Photorealistic 3D PCB render shown when hovering over certificate card."
    });

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
        <div class="admin-form-group full-width">
          ${iconMediaHtml}
        </div>
        <div class="admin-form-group full-width">
          <label for="editCourseDesc">Overview & Syllabus Summary</label>
          <textarea id="editCourseDesc" rows="3">${c.description || ""}</textarea>
        </div>
      </div>

      <!-- Associated Hardware Project & 3D Preview (Stretch on Hover) -->
      <div class="admin-builder-section" style="border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--border)); background: rgba(255, 126, 74, 0.04); border-radius: 8px; padding: 16px;">
        <div class="admin-builder-header" style="margin-bottom: 12px;">
          <h4 style="color: var(--accent); display: flex; align-items: center; gap: 8px;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 9l10-7 10 7-10 7-10-7z"></path><path d="M2 17l10 7 10-7"></path><path d="M2 12l10 7 10-7"></path></svg>
            Associated Hardware Project & 3D Preview
          </h4>
        </div>
        <div class="admin-form-grid">
          <div class="admin-form-group full-width">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600;">
              <input type="checkbox" id="editCourseHasProject" ${c.hasProject ? "checked" : ""}>
              <span>Enable 3D PCB Preview & Dual Buttons (View Certificate + Explore Project)</span>
            </label>
          </div>
          <div class="admin-form-group full-width">
            <label for="editCourseProjectId">Associated Project ID (e.g. mixed-signal-board)</label>
            <input type="text" id="editCourseProjectId" value="${c.projectId || ""}" placeholder="e.g. mixed-signal-board">
          </div>
          <div class="admin-form-group full-width">
            ${projectHoverMediaHtml}
          </div>
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

      <!-- Certificate Images / Proofs with Direct Upload & Batch Support -->
      <div class="admin-builder-section">
        <div class="admin-builder-header">
          <h4>Certificate Image / Document Proof</h4>
          <div style="display:flex;gap:6px;">
            <label class="admin-btn admin-btn-sm admin-btn-primary" style="cursor:pointer;margin:0;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <span>+ Upload Certificate</span>
              <input type="file" accept="image/*,.pdf,.svg" multiple style="display:none;" onchange="handleBatchMediaUpload(this.files, 'editCourseImagesContainer', true)">
            </label>
            <button type="button" class="admin-btn admin-btn-sm admin-btn-ghost" onclick="addGalleryCardRow('editCourseImagesContainer', {src:'',label:'Certificate',caption:''}, true)">+ Add Row</button>
          </div>
        </div>
        <div id="editCourseImagesContainer">
          <!-- Populated after render -->
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

  // Initialize media dropzones in modal
  initAllMediaFieldsIn(adminItemModalBody);

  // Populate gallery cards for projects
  if (type === "project") {
    const projImages = isNew ? [] : (portfolioData.projects.find((pr) => pr.id === idOrIndex) || {}).images || [];
    const projContainer = document.getElementById("editProjImagesContainer");
    if (projContainer) {
      if (projImages.length > 0) {
        projImages.forEach((img) => addGalleryCardRow("editProjImagesContainer", img, false));
      }
    }
  }

  // Populate certificate cards for courses
  if (type === "course") {
    const courseImages = isNew ? [] : (portfolioData.courses.find((cr) => cr.id === idOrIndex) || {}).images || [];
    const courseContainer = document.getElementById("editCourseImagesContainer");
    if (courseContainer) {
      if (courseImages.length > 0) {
        courseImages.forEach((img) => addGalleryCardRow("editCourseImagesContainer", img, true));
      }
    }
  }

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

window.addGalleryCardRow = function (containerId, data = { src: "", label: "Preview", caption: "" }, isCertificate = false) {
  const c = document.getElementById(containerId);
  if (!c) return;
  const rowId = `gallery-row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const hasSrc = Boolean(data.src);
  const isPdf = data.src && (data.src.toLowerCase().endsWith(".pdf") || data.src.startsWith("data:application/pdf"));

  const card = document.createElement("div");
  card.className = "admin-gallery-card";
  card.id = rowId;
  card.innerHTML = `
    <div class="admin-gallery-card-thumb-wrap" title="Click to upload or replace visual">
      ${
        isPdf
          ? `<div class="admin-media-doc-badge" style="width:100%;height:100%;border:none;">PDF</div>`
          : `<img src="${hasSrc ? escapeHtml(data.src) : "favicon.svg"}" alt="Visual" class="admin-gallery-card-thumb" style="${hasSrc ? "" : "opacity:0.3;filter:grayscale(1);"}">`
      }
      <span class="admin-gallery-card-thumb-hover">Upload</span>
      <input type="file" class="gallery-file-input" accept="image/*,.pdf,.svg" style="display:none;">
    </div>
    <div class="admin-gallery-card-inputs">
      <div class="admin-gallery-card-inputs-row">
        <input type="text" class="img-label" value="${escapeHtml(data.label || (isCertificate ? "Certificate" : "Preview"))}" placeholder="${isCertificate ? "Label (e.g. Certificate)" : "Tab Label (e.g. Top 3D View)"}" style="flex:1;">
        <input type="text" class="img-src" value="${escapeHtml(data.src || "")}" placeholder="${isCertificate ? "Certificate Image Path or URL" : "Image Path or URL"}" style="flex:2;">
      </div>
      <input type="text" class="img-caption" value="${escapeHtml(data.caption || "")}" placeholder="Caption / Description...">
    </div>
    <div class="admin-gallery-card-actions">
      <button type="button" class="admin-icon-btn danger" onclick="this.closest('.admin-gallery-card').remove()" title="Delete Image">✕</button>
    </div>
  `;

  c.appendChild(card);

  // Setup file picking for thumbnail
  const thumbWrap = card.querySelector(".admin-gallery-card-thumb-wrap");
  const fileInput = card.querySelector(".gallery-file-input");
  const srcInput = card.querySelector(".img-src");

  thumbWrap?.addEventListener("click", () => fileInput?.click());

  fileInput?.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const { dataUrl, isDoc } = await readAndOptimizeMediaFile(file);
      srcInput.value = dataUrl;
      if (isDoc) {
        thumbWrap.innerHTML = `<div class="admin-media-doc-badge" style="width:100%;height:100%;border:none;">PDF</div><span class="admin-gallery-card-thumb-hover">Upload</span><input type="file" class="gallery-file-input" accept="image/*,.pdf,.svg" style="display:none;">`;
      } else {
        thumbWrap.innerHTML = `<img src="${dataUrl}" alt="Visual" class="admin-gallery-card-thumb"><span class="admin-gallery-card-thumb-hover">Upload</span><input type="file" class="gallery-file-input" accept="image/*,.pdf,.svg" style="display:none;">`;
      }
      showToast("Visual uploaded!");
    } catch (err) {
      console.error(err);
      showToast("Upload failed: " + err.message, "error");
    }
  });

  srcInput?.addEventListener("input", () => {
    const val = srcInput.value.trim();
    const imgEl = thumbWrap.querySelector("img");
    if (imgEl && val) {
      imgEl.src = val;
      imgEl.style.opacity = "1";
      imgEl.style.filter = "none";
    }
  });
};

window.handleBatchMediaUpload = async function (files, containerId, isCertificate = false) {
  if (!files || files.length === 0) return;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const { dataUrl, name, isDoc } = await readAndOptimizeMediaFile(file);
      const cleanName = name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      window.addGalleryCardRow(
        containerId,
        {
          src: dataUrl,
          label: isCertificate ? "Certificate" : cleanName,
          caption: cleanName
        },
        isCertificate
      );
    } catch (e) {
      console.error(e);
    }
  }
  showToast(`Uploaded ${files.length} visual${files.length > 1 ? "s" : ""}!`);
};

window.addImageRow = function (containerId) {
  window.addGalleryCardRow(containerId, { src: "", label: "Preview", caption: "" }, false);
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

      const images = Array.from(
        document.querySelectorAll("#editProjImagesContainer .admin-gallery-card, #editProjImagesContainer .admin-image-row")
      )
        .map((row) => ({
          src: row.querySelector(".img-src")?.value.trim() || "",
          label: row.querySelector(".img-label")?.value.trim() || "Preview",
          caption: row.querySelector(".img-caption")?.value.trim() || ""
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
      const hasProject = document.getElementById("editCourseHasProject") ? document.getElementById("editCourseHasProject").checked : false;
      const projectId = document.getElementById("editCourseProjectId") ? document.getElementById("editCourseProjectId").value.trim() : "";
      const projectHoverImage = document.getElementById("editCourseProjectHoverImage") ? document.getElementById("editCourseProjectHoverImage").value.trim() : "";

      const cardBullets = Array.from(document.querySelectorAll("#editCourseBulletsContainer input"))
        .map((i) => i.value.trim())
        .filter(Boolean);

      const images = Array.from(
        document.querySelectorAll("#editCourseImagesContainer .admin-gallery-card, #editCourseImagesContainer .admin-image-row")
      )
        .map((row) => ({
          src: row.querySelector(".img-src")?.value.trim() || "",
          label: row.querySelector(".img-label")?.value.trim() || "Certificate",
          caption: row.querySelector(".img-caption")?.value.trim() || ""
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
          hasProject,
          projectId,
          projectHoverImage,
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
          c.hasProject = hasProject;
          c.projectId = projectId;
          c.projectHoverImage = projectHoverImage;
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
        showToast("Successfully published to GitHub! Live site updates shortly.");
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

// Expose functions globally for the on-demand loader
window.openAdminPinModal = openAdminPinModal;
window.closeAdminPinModal = closeAdminPinModal;
window.openAdminStudio = openAdminStudio;
window.closeAdminStudio = closeAdminStudio;
window.toggleAdminStudio = function () {
  if (adminStudioOverlay && adminStudioOverlay.classList.contains("active")) {
    closeAdminStudio();
  } else {
    openAdminPinModal();
  }
};
window.initAdminStudio = function () {
  loadAdminSettings();
};
