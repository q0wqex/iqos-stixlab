// ===================================================
// STIX — Minimalist Logic (HEETS & FIIT Rater)
// ===================================================

const STORAGE_KEY = "stix_ratings_v3";

let state = {
  ratings: {}, // stickId -> { u1: 5, u2: 4, avg: 4.5 }
  currentFilter: "ALL",
  searchQuery: "",
  activeStickId: null,
  tempU1: 5,
  tempU2: 5
};

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
  loadRatings();
  initEvents();
  renderSticks();
  updateCounts();
});

function loadRatings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state.ratings = JSON.parse(saved);
    } else {
      // Default initial demo rating
      state.ratings = {
        "heets-green-zing": { u1: 4, u2: 5, avg: 4.5 },
        "fiit-crisp": { u1: 5, u2: 5, avg: 5.0 },
        "heets-purple-wave": { u1: 4, u2: 4, avg: 4.0 }
      };
      saveRatings();
    }
  } catch (e) {
    state.ratings = {};
  }
}

function saveRatings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.ratings));
}

function initEvents() {
  // Filter Buttons
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.currentFilter = btn.getAttribute("data-filter");
      renderSticks();
    });
  });

  // Search
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearch");

  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    clearBtn.style.display = state.searchQuery ? "block" : "none";
    renderSticks();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.searchQuery = "";
    clearBtn.style.display = "none";
    renderSticks();
  });

  // Modal Close
  document.getElementById("closeRateModal").addEventListener("click", closeModal);
  document.getElementById("rateModal").addEventListener("click", (e) => {
    if (e.target.id === "rateModal") closeModal();
  });

  // Star Pickers
  document.querySelectorAll("#u1Stars .star-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.tempU1 = parseInt(btn.getAttribute("data-score"), 10);
      updateModalStars();
    });
  });

  document.querySelectorAll("#u2Stars .star-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.tempU2 = parseInt(btn.getAttribute("data-score"), 10);
      updateModalStars();
    });
  });

  // Save Rating
  document.getElementById("btnSaveRating").addEventListener("click", () => {
    if (!state.activeStickId) return;

    const avg = parseFloat(((state.tempU1 + state.tempU2) / 2).toFixed(1));
    state.ratings[state.activeStickId] = {
      u1: state.tempU1,
      u2: state.tempU2,
      avg: avg
    };

    saveRatings();
    closeModal();
    renderSticks();
    updateCounts();
  });
}

function renderSticks() {
  const container = document.getElementById("sticksList");
  let list = [...STICKS];

  // Brand filter
  if (state.currentFilter === "HEETS") {
    list = list.filter(s => s.brand === "HEETS");
  } else if (state.currentFilter === "FIIT") {
    list = list.filter(s => s.brand === "FIIT");
  } else if (state.currentFilter === "TOP") {
    list = list.filter(s => state.ratings[s.id] && state.ratings[s.id].avg > 0);
    list.sort((a, b) => {
      const avgA = state.ratings[a.id]?.avg || 0;
      const avgB = state.ratings[b.id]?.avg || 0;
      return avgB - avgA;
    });
  }

  // Search filter
  if (state.searchQuery) {
    const q = state.searchQuery;
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      s.tag.toLowerCase().includes(q) ||
      s.brand.toLowerCase().includes(q)
    );
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Ничего не найдено</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((stick, index) => {
    const r = state.ratings[stick.id];
    const hasRating = !!r;
    const isTopFilter = state.currentFilter === "TOP";

    const mutualScore = hasRating ? r.avg.toFixed(1) : "—";
    const u1Score = hasRating ? `🧔 ${r.u1}` : "";
    const u2Score = hasRating ? `👩 ${r.u2}` : "";

    const isHighRating = hasRating && r.avg >= 4.5;
    const pillClass = isHighRating ? "top-rating" : (hasRating ? "has-rating" : "");

    const rankPrefix = isTopFilter ? `<span class="rank-badge">#${index + 1}</span>` : "";

    return `
      <div class="stick-item" style="--stick-color: ${stick.color};" onclick="openRateModal('${stick.id}')">
        <div class="stick-info">
          <div class="stick-name-row">
            ${rankPrefix}
            <span class="stick-name">${escapeHtml(stick.name)}</span>
            <span class="stick-tag">${escapeHtml(stick.tag)}</span>
          </div>
          <p class="stick-desc">${escapeHtml(stick.desc)}</p>
        </div>

        <div class="stick-scores">
          ${hasRating ? `
            <div class="scores-breakdown">
              <span class="u1-val">${u1Score}</span>
              <span class="u2-val">${u2Score}</span>
            </div>
          ` : `
            <span style="font-size: 0.72rem; color: var(--text-muted);">Оценить</span>
          `}
          <div class="mutual-pill ${pillClass}">
            ${mutualScore}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function updateCounts() {
  const allCount = STICKS.length;
  const heetsCount = STICKS.filter(s => s.brand === "HEETS").length;
  const fiitCount = STICKS.filter(s => s.brand === "FIIT").length;
  const topCount = Object.keys(state.ratings).filter(id => state.ratings[id].avg > 0).length;

  document.getElementById("countAll").textContent = allCount;
  document.getElementById("countHeets").textContent = heetsCount;
  document.getElementById("countFiit").textContent = fiitCount;
  document.getElementById("countTop").textContent = topCount;
}

// ================= MODAL LOGIC =================
function openRateModal(stickId) {
  const stick = STICKS.find(s => s.id === stickId);
  if (!stick) return;

  state.activeStickId = stickId;
  const r = state.ratings[stickId];

  state.tempU1 = r ? r.u1 : 5;
  state.tempU2 = r ? r.u2 : 5;

  document.getElementById("modalBrand").textContent = stick.brand;
  document.getElementById("modalName").textContent = stick.name;
  document.getElementById("modalDesc").textContent = stick.desc;

  updateModalStars();

  document.getElementById("rateModal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function updateModalStars() {
  // Update buttons state
  document.querySelectorAll("#u1Stars .star-btn").forEach(btn => {
    const val = parseInt(btn.getAttribute("data-score"), 10);
    btn.classList.toggle("active", val === state.tempU1);
  });

  document.querySelectorAll("#u2Stars .star-btn").forEach(btn => {
    const val = parseInt(btn.getAttribute("data-score"), 10);
    btn.classList.toggle("active", val === state.tempU2);
  });

  document.getElementById("u1ScoreDisplay").textContent = state.tempU1;
  document.getElementById("u2ScoreDisplay").textContent = state.tempU2;

  const avg = ((state.tempU1 + state.tempU2) / 2).toFixed(1);
  document.getElementById("modalMutualScore").textContent = avg;
}

function closeModal() {
  document.getElementById("rateModal").style.display = "none";
  document.body.style.overflow = "";
  state.activeStickId = null;
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
