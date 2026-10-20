// ===================================================
// STIX LAB — Application Logic
// Couple tasting & evaluation for IQOS sticks
// ===================================================

const STORAGE_KEYS = {
  STICKS: "stixlab_sticks_v1",
  RATINGS: "stixlab_ratings_v1",
  USER1: "stixlab_user1_v1",
  USER2: "stixlab_user2_v1"
};

// Global State
let state = {
  sticks: [],
  ratings: {}, // key: stickId -> { u1Score, u1Verdict, u1Notes, u2Score, u2Verdict, u2Notes, date }
  user1: { ...DEFAULT_USER1 },
  user2: { ...DEFAULT_USER2 },
  activeTab: "catalog",
  currentFilterBrand: "ALL",
  currentFilterCategory: "ALL",
  currentFilterStatus: "ALL",
  searchQuery: "",
  sortBy: "mutual",
  activeRatingStickId: null,
  activeBlindStickId: null
};

// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initEventListeners();
  updateUserInterfaceLabels();
  renderCurrentTab();
  updateHeaderStats();
});

function loadState() {
  try {
    const savedSticks = localStorage.getItem(STORAGE_KEYS.STICKS);
    if (savedSticks) {
      state.sticks = JSON.parse(savedSticks);
    } else {
      state.sticks = [...INITIAL_STICKS];
      saveSticks();
    }

    const savedRatings = localStorage.getItem(STORAGE_KEYS.RATINGS);
    if (savedRatings) {
      state.ratings = JSON.parse(savedRatings);
    }

    const savedU1 = localStorage.getItem(STORAGE_KEYS.USER1);
    if (savedU1) {
      state.user1 = JSON.parse(savedU1);
    }

    const savedU2 = localStorage.getItem(STORAGE_KEYS.USER2);
    if (savedU2) {
      state.user2 = JSON.parse(savedU2);
    }
  } catch (err) {
    console.error("Error loading state:", err);
    state.sticks = [...INITIAL_STICKS];
    state.ratings = {};
  }
}

function saveSticks() {
  localStorage.setItem(STORAGE_KEYS.STICKS, JSON.stringify(state.sticks));
}

function saveRatings() {
  localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(state.ratings));
}

function saveUsers() {
  localStorage.setItem(STORAGE_KEYS.USER1, JSON.stringify(state.user1));
  localStorage.setItem(STORAGE_KEYS.USER2, JSON.stringify(state.user2));
}

// ================= EVENT LISTENERS =================
function initEventListeners() {
  // Navigation Tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      state.activeTab = tabId;
      document.getElementById(`tab-${tabId}`).classList.add("active");
      renderCurrentTab();
    });
  });

  // Search
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    clearSearchBtn.style.display = state.searchQuery ? "block" : "none";
    renderSticksGrid();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.searchQuery = "";
    clearSearchBtn.style.display = "none";
    renderSticksGrid();
  });

  // Brand Filter Pills
  document.querySelectorAll("#brandPills .pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll("#brandPills .pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.currentFilterBrand = pill.getAttribute("data-brand");
      renderSticksGrid();
    });
  });

  // Category Filter Pills
  document.querySelectorAll("#categoryPills .pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll("#categoryPills .pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.currentFilterCategory = pill.getAttribute("data-category");
      renderSticksGrid();
    });
  });

  // Status Filter Pills
  document.querySelectorAll("#statusPills .pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll("#statusPills .pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.currentFilterStatus = pill.getAttribute("data-status");
      renderSticksGrid();
    });
  });

  // Sort Select
  document.getElementById("sortSelect").addEventListener("change", (e) => {
    state.sortBy = e.target.value;
    renderSticksGrid();
  });

  // Modals Open
  document.getElementById("btnAddNewStick").addEventListener("click", () => openModal("addStickModal"));
  document.getElementById("btnSettings").addEventListener("click", () => openSettingsModal());
  document.getElementById("coupleProfilesBar").addEventListener("click", () => openSettingsModal());
  document.getElementById("btnRoulette").addEventListener("click", () => openRouletteModal());
  document.getElementById("btnBlindTest").addEventListener("click", () => openBlindModal());

  // Modals Close
  document.getElementById("closeRateModal").addEventListener("click", () => closeModal("rateModal"));
  document.getElementById("btnCancelRate").addEventListener("click", () => closeModal("rateModal"));
  document.getElementById("closeAddStickModal").addEventListener("click", () => closeModal("addStickModal"));
  document.getElementById("btnCancelAddStick").addEventListener("click", () => closeModal("addStickModal"));
  document.getElementById("closeBlindModal").addEventListener("click", () => closeModal("blindTestModal"));
  document.getElementById("closeRouletteModal").addEventListener("click", () => closeModal("rouletteModal"));
  document.getElementById("closeSettingsModal").addEventListener("click", () => closeModal("settingsModal"));

  // Sliders input in rating modal
  const u1Range = document.getElementById("u1ScoreRange");
  const u2Range = document.getElementById("u2ScoreRange");
  u1Range.addEventListener("input", (e) => {
    document.getElementById("u1ScoreDisplay").textContent = e.target.value;
    updateModalMutualAvg();
  });
  u2Range.addEventListener("input", (e) => {
    document.getElementById("u2ScoreDisplay").textContent = e.target.value;
    updateModalMutualAvg();
  });

  // Save Rating
  document.getElementById("btnSaveRate").addEventListener("click", saveStickRating);

  // Add custom stick form
  document.getElementById("addStickForm").addEventListener("submit", handleAddCustomStick);

  // Blind test interactions
  document.getElementById("btnRevealMystery").addEventListener("click", revealMysteryStick);
  document.getElementById("btnPickAnotherMystery").addEventListener("click", pickMysteryStick);
  document.getElementById("btnOpenModalFromBlind").addEventListener("click", () => {
    closeModal("blindTestModal");
    if (state.activeBlindStickId) {
      openRateModal(state.activeBlindStickId);
    }
  });

  // Roulette
  document.getElementById("btnSpinRoulette").addEventListener("click", spinRoulette);

  // Settings: save couple names
  document.getElementById("btnSaveCoupleNames").addEventListener("click", saveCoupleSettings);

  // Settings: export / import JSON
  document.getElementById("btnExportJson").addEventListener("click", exportDataJson);
  document.getElementById("importJsonInput").addEventListener("change", importDataJson);
  document.getElementById("btnResetAllData").addEventListener("click", resetAllData);

  // Export Leaderboard / Wishlist to clipboard
  document.getElementById("btnExportLeaderboard").addEventListener("click", copyLeaderboardToClipboard);
  document.getElementById("btnShareWishlist").addEventListener("click", copyWishlistToClipboard);

  // Sliders in add custom stick
  document.getElementById("newStickIntensity").addEventListener("input", (e) => {
    document.getElementById("newIntensityVal").textContent = e.target.value;
  });
  document.getElementById("newStickCooling").addEventListener("input", (e) => {
    document.getElementById("newCoolingVal").textContent = e.target.value;
  });
}

// ================= MODAL HELPERS =================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
}

// ================= UI LABELS UPDATE =================
function updateUserInterfaceLabels() {
  // Header chips
  document.getElementById("u1Avatar").textContent = state.user1.avatar;
  document.getElementById("u1Name").textContent = state.user1.name;
  document.getElementById("u2Avatar").textContent = state.user2.avatar;
  document.getElementById("u2Name").textContent = state.user2.name;

  // Rate Modal labels
  document.getElementById("modalU1Avatar").textContent = state.user1.avatar;
  document.getElementById("modalU1Name").textContent = state.user1.name;
  document.getElementById("modalU2Avatar").textContent = state.user2.avatar;
  document.getElementById("modalU2Name").textContent = state.user2.name;

  // Leaderboard column labels
  document.getElementById("leadU1Avatar").textContent = state.user1.avatar;
  document.getElementById("leadU1Title").textContent = `Топ ${state.user1.name}`;
  document.getElementById("leadU2Avatar").textContent = state.user2.avatar;
  document.getElementById("leadU2Title").textContent = `Топ ${state.user2.name}`;

  document.getElementById("thU1Name").textContent = `${state.user1.avatar} ${state.user1.name}`;
  document.getElementById("thU2Name").textContent = `${state.user2.avatar} ${state.user2.name}`;

  // Sort labels
  const u1Sort = document.querySelector(".u1-label-sort");
  if (u1Sort) u1Sort.textContent = state.user1.name;
  const u2Sort = document.querySelector(".u2-label-sort");
  if (u2Sort) u2Sort.textContent = state.user2.name;
}

// ================= TAB SWITCHING =================
function renderCurrentTab() {
  if (state.activeTab === "catalog") {
    renderSticksGrid();
  } else if (state.activeTab === "leaderboard") {
    renderLeaderboard();
  } else if (state.activeTab === "compare") {
    renderCompatibility();
  } else if (state.activeTab === "wishlist") {
    renderWishlist();
  }
}

// ================= HEADER STATS =================
function updateHeaderStats() {
  const ratedCountU1 = Object.values(state.ratings).filter(r => r.u1Score > 0).length;
  const ratedCountU2 = Object.values(state.ratings).filter(r => r.u2Score > 0).length;

  document.getElementById("u1Count").textContent = ratedCountU1;
  document.getElementById("u2Count").textContent = ratedCountU2;

  // Wishlist count
  const wishlistCount = Object.values(state.ratings).filter(r => r.u1Verdict === "love" || r.u2Verdict === "love").length;
  document.getElementById("reorderCount").textContent = wishlistCount;

  // Mutual match calculation
  const match = calculateCoupleCompatibility();
  const matchValElem = document.getElementById("headerMatchVal");
  if (match.bothCount >= 1) {
    matchValElem.textContent = `${match.percent}%`;
  } else {
    matchValElem.textContent = "--%";
  }

  // Catalog total count badge
  document.getElementById("catalogTotalBadge").textContent = state.sticks.length;
}

// ================= RENDER STICKS GRID =================
function renderSticksGrid() {
  const grid = document.getElementById("sticksGrid");
  const filtered = getFilteredAndSortedSticks();

  document.getElementById("resultsCount").textContent = `Показано ${filtered.length} из ${state.sticks.length} стиков`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state glass-card" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
        <span style="font-size: 3rem;">🔍</span>
        <h3 style="margin-top: 10px;">Стики не найдены</h3>
        <p style="color: var(--text-muted); margin-top: 4px;">Попробуйте изменить поисковый запрос или фильтры</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(stick => {
    const rating = state.ratings[stick.id];
    const u1Score = rating?.u1Score ?? null;
    const u2Score = rating?.u2Score ?? null;

    let mutualAvgDisplay = "--";
    if (u1Score !== null && u2Score !== null && (u1Score > 0 || u2Score > 0)) {
      const avg = ((u1Score + u2Score) / 2).toFixed(1);
      mutualAvgDisplay = avg.endsWith(".0") ? avg.slice(0, -2) : avg;
    } else if (u1Score !== null && u1Score > 0) {
      mutualAvgDisplay = `${u1Score}*`;
    } else if (u2Score !== null && u2Score > 0) {
      mutualAvgDisplay = `${u2Score}*`;
    }

    const u1VerdictTag = getVerdictBadgeHtml(rating?.u1Verdict);
    const u2VerdictTag = getVerdictBadgeHtml(rating?.u2Verdict);

    const hasRated = (u1Score !== null && u1Score > 0) || (u2Score !== null && u2Score > 0);

    return `
      <div class="stick-card" style="--stick-color: ${stick.color};">
        <div>
          <div class="stick-card-top">
            <span class="stick-brand-badge">${stick.brand}</span>
            ${stick.hasCapsule ? '<span class="stick-capsule-badge">💥 Капсула</span>' : ''}
          </div>

          <div class="stick-header-title-row">
            <div class="stick-color-circle"></div>
            <div>
              <div class="stick-title">${escapeHtml(stick.name)}</div>
              ${stick.subName ? `<div class="stick-subtitle">${escapeHtml(stick.subName)}</div>` : ''}
            </div>
          </div>

          <p class="stick-desc">${escapeHtml(stick.description || '')}</p>

          <div class="stick-tags">
            ${(stick.notes || []).map(note => `<span class="note-tag">#${escapeHtml(note)}</span>`).join("")}
          </div>

          <div class="stick-meters-row">
            <div class="meter-col">
              <div class="meter-meta">
                <span>Крепость</span>
                <span>${stick.intensity || 5}/10</span>
              </div>
              <div class="meter-bar">
                <div class="meter-fill" style="width: ${(stick.intensity || 5) * 10}%;"></div>
              </div>
            </div>
            <div class="meter-col">
              <div class="meter-meta">
                <span>Холодок</span>
                <span>${stick.cooling || 0}/10</span>
              </div>
              <div class="meter-bar">
                <div class="meter-fill fill-cooling" style="width: ${(stick.cooling || 0) * 10}%;"></div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <!-- Couple Ratings Display -->
          <div class="card-dual-eval">
            <div class="eval-user-half">
              <div class="eval-user-top">
                <span>${state.user1.avatar} ${escapeHtml(state.user1.name)}</span>
                <span class="u1-score-val">${u1Score !== null && u1Score > 0 ? u1Score : '—'}</span>
              </div>
              ${u1VerdictTag}
              ${rating?.u1Notes ? `<span class="eval-user-note" title="${escapeHtml(rating.u1Notes)}">«${escapeHtml(rating.u1Notes)}»</span>` : ''}
            </div>

            <div class="eval-user-half">
              <div class="eval-user-top">
                <span>${state.user2.avatar} ${escapeHtml(state.user2.name)}</span>
                <span class="u2-score-val">${u2Score !== null && u2Score > 0 ? u2Score : '—'}</span>
              </div>
              ${u2VerdictTag}
              ${rating?.u2Notes ? `<span class="eval-user-note" title="${escapeHtml(rating.u2Notes)}">«${escapeHtml(rating.u2Notes)}»</span>` : ''}
            </div>
          </div>

          <div class="card-actions-bottom">
            <div class="avg-mutual-pill" title="Средний общий балл пары">
              <span>Итог:</span>
              <span class="avg-mutual-num">${mutualAvgDisplay}</span>
            </div>
            <button class="btn-rate-stick" onclick="openRateModal('${stick.id}')">
              ${hasRated ? '✏️ Изменить' : '⭐️ Оценить'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function getVerdictBadgeHtml(verdict) {
  if (verdict === "love") {
    return `<span class="eval-user-verdict verdict-tag-love">❤️ Купим снова</span>`;
  }
  if (verdict === "hate") {
    return `<span class="eval-user-verdict verdict-tag-hate">❌ Не нравится</span>`;
  }
  if (verdict === "neutral") {
    return `<span class="eval-user-verdict verdict-tag-neutral">🤔 Так себе</span>`;
  }
  return `<span class="eval-user-verdict" style="color: var(--text-muted); font-size: 0.7rem;">Не оценен</span>`;
}

// ================= FILTER & SORT =================
function getFilteredAndSortedSticks() {
  return state.sticks.filter(stick => {
    // Brand
    if (state.currentFilterBrand !== "ALL") {
      if (state.currentFilterBrand === "CUSTOM" && stick.brand !== "CUSTOM" && stick.isCustom !== true) return false;
      if (state.currentFilterBrand !== "CUSTOM" && stick.brand !== state.currentFilterBrand) return false;
    }

    // Category
    if (state.currentFilterCategory !== "ALL") {
      if (stick.category !== state.currentFilterCategory) return false;
    }

    // Status
    if (state.currentFilterStatus !== "ALL") {
      const r = state.ratings[stick.id];
      if (state.currentFilterStatus === "both-rated") {
        if (!r || r.u1Score <= 0 || r.u2Score <= 0) return false;
      } else if (state.currentFilterStatus === "unrated") {
        if (r && (r.u1Score > 0 || r.u2Score > 0)) return false;
      } else if (state.currentFilterStatus === "favorites") {
        if (!r || (r.u1Verdict !== "love" && r.u2Verdict !== "love")) return false;
      }
    }

    // Search query
    if (state.searchQuery) {
      const q = state.searchQuery;
      const matchName = stick.name.toLowerCase().includes(q);
      const matchBrand = stick.brand.toLowerCase().includes(q);
      const matchDesc = (stick.description || "").toLowerCase().includes(q);
      const matchNotes = (stick.notes || []).some(n => n.toLowerCase().includes(q));
      if (!matchName && !matchBrand && !matchDesc && !matchNotes) return false;
    }

    return true;
  }).sort((a, b) => {
    const rA = state.ratings[a.id] || {};
    const rB = state.ratings[b.id] || {};

    if (state.sortBy === "mutual") {
      const scoreA = getMutualScore(rA);
      const scoreB = getMutualScore(rB);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.name.localeCompare(b.name);
    }

    if (state.sortBy === "u1") {
      const sA = rA.u1Score || 0;
      const sB = rB.u1Score || 0;
      if (sA !== sB) return sB - sA;
      return a.name.localeCompare(b.name);
    }

    if (state.sortBy === "u2") {
      const sA = rA.u2Score || 0;
      const sB = rB.u2Score || 0;
      if (sA !== sB) return sB - sA;
      return a.name.localeCompare(b.name);
    }

    if (state.sortBy === "intensity") {
      return (b.intensity || 0) - (a.intensity || 0);
    }

    if (state.sortBy === "cooling") {
      return (b.cooling || 0) - (a.cooling || 0);
    }

    if (state.sortBy === "name") {
      return a.name.localeCompare(b.name);
    }

    return 0;
  });
}

function getMutualScore(rating) {
  if (!rating) return 0;
  const s1 = rating.u1Score || 0;
  const s2 = rating.u2Score || 0;
  if (s1 > 0 && s2 > 0) return (s1 + s2) / 2;
  if (s1 > 0) return s1 * 0.8; // slightly downrank single-rated in mutual
  if (s2 > 0) return s2 * 0.8;
  return 0;
}

// ================= RATE MODAL =================
function openRateModal(stickId) {
  const stick = state.sticks.find(s => s.id === stickId);
  if (!stick) return;

  state.activeRatingStickId = stickId;
  const rating = state.ratings[stickId] || {};

  // Header info
  document.getElementById("modalStickBrand").textContent = stick.brand;
  document.getElementById("modalStickTitle").textContent = `${stick.name} ${stick.subName || ''}`;
  document.getElementById("modalStickDesc").textContent = stick.description || "";

  document.getElementById("modalBarIntensity").style.width = `${(stick.intensity || 5) * 10}%`;
  document.getElementById("modalValIntensity").textContent = `${stick.intensity || 5}/10`;
  document.getElementById("modalBarCooling").style.width = `${(stick.cooling || 0) * 10}%`;
  document.getElementById("modalValCooling").textContent = `${stick.cooling || 0}/10`;
  document.getElementById("modalBarAroma").style.width = `${(stick.aroma || 5) * 10}%`;
  document.getElementById("modalValAroma").textContent = `${stick.aroma || 5}/10`;

  // User 1 values
  const u1Val = rating.u1Score ?? 0;
  document.getElementById("u1ScoreRange").value = u1Val;
  document.getElementById("u1ScoreDisplay").textContent = u1Val;
  document.getElementById("u1Notes").value = rating.u1Notes || "";
  setRadioValue("u1Verdict", rating.u1Verdict || "neutral");

  // User 2 values
  const u2Val = rating.u2Score ?? 0;
  document.getElementById("u2ScoreRange").value = u2Val;
  document.getElementById("u2ScoreDisplay").textContent = u2Val;
  document.getElementById("u2Notes").value = rating.u2Notes || "";
  setRadioValue("u2Verdict", rating.u2Verdict || "neutral");

  updateModalMutualAvg();
  openModal("rateModal");
}

function updateModalMutualAvg() {
  const u1 = parseFloat(document.getElementById("u1ScoreRange").value) || 0;
  const u2 = parseFloat(document.getElementById("u2ScoreRange").value) || 0;
  const avgEl = document.getElementById("modalMutualAvg");

  if (u1 > 0 && u2 > 0) {
    avgEl.textContent = ((u1 + u2) / 2).toFixed(1);
  } else if (u1 > 0) {
    avgEl.textContent = `${u1} (${state.user1.name})`;
  } else if (u2 > 0) {
    avgEl.textContent = `${u2} (${state.user2.name})`;
  } else {
    avgEl.textContent = "--";
  }
}

function saveStickRating() {
  if (!state.activeRatingStickId) return;

  const u1Score = parseFloat(document.getElementById("u1ScoreRange").value) || 0;
  const u1Verdict = getRadioValue("u1Verdict") || "neutral";
  const u1Notes = document.getElementById("u1Notes").value.trim();

  const u2Score = parseFloat(document.getElementById("u2ScoreRange").value) || 0;
  const u2Verdict = getRadioValue("u2Verdict") || "neutral";
  const u2Notes = document.getElementById("u2Notes").value.trim();

  state.ratings[state.activeRatingStickId] = {
    u1Score,
    u1Verdict,
    u1Notes,
    u2Score,
    u2Verdict,
    u2Notes,
    updatedAt: new Date().toISOString()
  };

  saveRatings();
  closeModal("rateModal");
  updateHeaderStats();
  renderCurrentTab();
  showToast("Оценка сохранена! ✨");
}

function setRadioValue(name, value) {
  const radios = document.querySelectorAll(`input[name="${name}"]`);
  radios.forEach(r => {
    r.checked = (r.value === value);
  });
}

function getRadioValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : null;
}

// ================= TAB 2: LEADERBOARD =================
function renderLeaderboard() {
  renderChampions();
  renderUserTopRanked("u1", "u1RankedList");
  renderUserTopRanked("u2", "u2RankedList");
  renderMutualTable();
}

function renderChampions() {
  const mutualDiv = document.getElementById("mutualChampionContent");
  const controversyDiv = document.getElementById("controversyContent");

  // Find Mutual Best (both scored > 0)
  let bestStick = null;
  let bestScore = -1;

  let mostControversialStick = null;
  let maxScoreDiff = -1;

  state.sticks.forEach(stick => {
    const r = state.ratings[stick.id];
    if (r && r.u1Score > 0 && r.u2Score > 0) {
      const avg = (r.u1Score + r.u2Score) / 2;
      if (avg > bestScore) {
        bestScore = avg;
        bestStick = stick;
      }

      const diff = Math.abs(r.u1Score - r.u2Score);
      if (diff > maxScoreDiff && diff >= 2) {
        maxScoreDiff = diff;
        mostControversialStick = stick;
      }
    }
  });

  if (bestStick) {
    const r = state.ratings[bestStick.id];
    mutualDiv.innerHTML = `
      <div class="champ-title-row">
        <span class="champ-stick-name">${escapeHtml(bestStick.name)}</span>
        <span class="champ-brand">${bestStick.brand}</span>
      </div>
      <p style="font-size: 0.88rem; color: var(--text-secondary);">${escapeHtml(bestStick.description || '')}</p>
      <div class="champ-score-row">
        <span>Общий балл: <b style="color: var(--accent-gold); font-size: 1.2rem;">${((r.u1Score + r.u2Score) / 2).toFixed(1)}</b></span>
        <span>${state.user1.avatar}: <b>${r.u1Score}</b></span>
        <span>${state.user2.avatar}: <b>${r.u2Score}</b></span>
      </div>
    `;
  } else {
    mutualDiv.innerHTML = `
      <p style="color: var(--text-muted); font-size: 0.9rem; padding-top: 10px;">
        Оцените хотя бы 1 стик вместе, чтобы выявить победителя пары!
      </p>
    `;
  }

  if (mostControversialStick) {
    const r = state.ratings[mostControversialStick.id];
    controversyDiv.innerHTML = `
      <div class="champ-title-row">
        <span class="champ-stick-name">${escapeHtml(mostControversialStick.name)}</span>
        <span class="champ-brand" style="color: #f87171;">Разница: ${maxScoreDiff} б.</span>
      </div>
      <div class="champ-score-row">
        <span>${state.user1.avatar} ${state.user1.name}: <b>${r.u1Score}/10</b></span>
        <span>${state.user2.avatar} ${state.user2.name}: <b>${r.u2Score}/10</b></span>
      </div>
      <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 6px;">
        «Кажется, здесь вам стоит провести дополнительную дегустацию!»
      </p>
    `;
  } else {
    controversyDiv.innerHTML = `
      <p style="color: var(--text-muted); font-size: 0.9rem; padding-top: 10px;">
        Пока в ваших вкусах полная гармония или мало общих оценок!
      </p>
    `;
  }
}

function renderUserTopRanked(userKey, containerId) {
  const container = document.getElementById(containerId);
  const scoreProp = userKey === "u1" ? "u1Score" : "u2Score";

  const ratedSticks = state.sticks
    .map(stick => ({ stick, rating: state.ratings[stick.id] }))
    .filter(item => item.rating && item.rating[scoreProp] > 0)
    .sort((a, b) => b.rating[scoreProp] - a.rating[scoreProp])
    .slice(0, 5);

  if (ratedSticks.length === 0) {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        Пока нет оценок от этого участника
      </div>
    `;
    return;
  }

  container.innerHTML = ratedSticks.map((item, idx) => {
    const scoreColor = userKey === "u1" ? "var(--u1-color)" : "var(--u2-color)";
    return `
      <div class="ranked-item" onclick="openRateModal('${item.stick.id}')" style="cursor: pointer;">
        <span class="rank-num">#${idx + 1}</span>
        <div class="rank-stick-info">
          <div class="rank-stick-name">${escapeHtml(item.stick.name)}</div>
          <div class="rank-stick-brand">${item.stick.brand} • ${item.stick.categoryName || ''}</div>
        </div>
        <div class="rank-score" style="color: ${scoreColor};">
          ${item.rating[scoreProp]}/10
        </div>
      </div>
    `;
  }).join("");
}

function renderMutualTable() {
  const tbody = document.getElementById("mutualLeaderboardBody");
  
  const rated = state.sticks
    .map(stick => ({ stick, rating: state.ratings[stick.id] }))
    .filter(item => item.rating && (item.rating.u1Score > 0 || item.rating.u2Score > 0))
    .sort((a, b) => getMutualScore(b.rating) - getMutualScore(a.rating));

  if (rated.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 30px; color: var(--text-muted);">
          Вы пока не оценили ни одного стика. Перейдите в каталог и начните дегустацию!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rated.map((item, index) => {
    const r = item.rating;
    const avg = (r.u1Score > 0 && r.u2Score > 0) 
      ? ((r.u1Score + r.u2Score) / 2).toFixed(1) 
      : ((r.u1Score || r.u2Score)).toFixed(1) + "*";

    let verdictText = "Обычный";
    if (r.u1Verdict === "love" && r.u2Verdict === "love") {
      verdictText = "🔥 Оба в восторге!";
    } else if (r.u1Verdict === "love" || r.u2Verdict === "love") {
      verdictText = "❤️ Купим снова";
    } else if (r.u1Verdict === "hate" || r.u2Verdict === "hate") {
      verdictText = "⚠️ На любителя";
    }

    return `
      <tr>
        <td><b>${index + 1}</b></td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: ${item.stick.color};"></span>
            <b>${escapeHtml(item.stick.name)}</b>
          </div>
        </td>
        <td>${item.stick.brand}</td>
        <td><span class="note-tag">${item.stick.categoryName || item.stick.category}</span></td>
        <td style="color: var(--u1-color); font-weight: 700;">${r.u1Score > 0 ? r.u1Score : '—'}</td>
        <td style="color: var(--u2-color); font-weight: 700;">${r.u2Score > 0 ? r.u2Score : '—'}</td>
        <td style="font-weight: 800; font-family: var(--font-mono); color: #fff;">${avg}</td>
        <td><span style="font-size: 0.8rem;">${verdictText}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openRateModal('${item.stick.id}')">Изменить</button>
        </td>
      </tr>
    `;
  }).join("");
}

// ================= TAB 3: COMPATIBILITY =================
function renderCompatibility() {
  const result = calculateCoupleCompatibility();

  document.getElementById("compatPercent").textContent = `${result.percent}%`;
  document.getElementById("statBothRated").textContent = result.bothCount;
  document.getElementById("statAgreements").textContent = result.agreements;
  document.getElementById("statDisagreements").textContent = result.disagreements;

  const headline = document.getElementById("compatHeadline");
  const desc = document.getElementById("compatDescription");
  const recBox = document.getElementById("coupleRecommendationBox");

  if (result.bothCount < 2) {
    headline.textContent = "Начните ваше вкусовое путешествие!";
    desc.textContent = "Оцените хотя бы 2-3 разных вкуса вместе, чтобы система рассчитала процент вашего вкусового взаимопонимания.";
    recBox.innerHTML = `
      <p>💡 <b>Совет для старта:</b> Возьмите пачку популярного бленда (например, <i>TEREA Amber</i> или <i>Purple Wave</i>), сделайте по 2-3 затяжки и запишите свои первые впечатления!</p>
    `;
  } else {
    if (result.percent >= 80) {
      headline.textContent = "Идеальное гастрономическое совпадение! 🔥";
      desc.textContent = "Вы удивительно похожи в своих вкусах на стики! Вам легко покупать одну пачку на двоих — вероятность споров минимальна.";
    } else if (result.percent >= 55) {
      headline.textContent = "Золотая середина с изюминкой! ✨";
      desc.textContent = "У вас есть общие фавориты, но в деталях каждый ценит свое. Например, один предпочитает свежесть, а другой — плотный табак.";
    } else {
      headline.textContent = "Противоположности притягиваются! ⚡";
      desc.textContent = "Ваши вкусовые рецепторы кардинально отличаются! Лучшее решение для вашей пары — всегда иметь две разные пачки в запасе.";
    }

    // Dynamic smart recommendation
    recBox.innerHTML = generateCoupleRecommendation(result);
  }

  renderCategoryPreferences();
}

function calculateCoupleCompatibility() {
  let bothCount = 0;
  let totalScoreDiff = 0;
  let agreements = 0;
  let disagreements = 0;

  state.sticks.forEach(stick => {
    const r = state.ratings[stick.id];
    if (r && r.u1Score > 0 && r.u2Score > 0) {
      bothCount++;
      const diff = Math.abs(r.u1Score - r.u2Score);
      totalScoreDiff += diff;
      if (diff <= 1.5) agreements++;
      if (diff >= 3) disagreements++;
    }
  });

  if (bothCount === 0) {
    return { percent: 0, bothCount: 0, agreements: 0, disagreements: 0 };
  }

  // Max diff per stick is 10. Avg diff of 0 => 100%, avg diff of 5 => 50%
  const avgDiff = totalScoreDiff / bothCount;
  const matchPercent = Math.max(0, Math.min(100, Math.round((1 - (avgDiff / 5)) * 100)));

  return {
    percent: matchPercent,
    bothCount,
    agreements,
    disagreements
  };
}

function renderCategoryPreferences() {
  const container = document.getElementById("categoryPrefList");
  const categories = [
    { key: "tobacco", label: "🍂 Классический табак" },
    { key: "berry", label: "🫐 Ягоды и фрукты" },
    { key: "citrus", label: "🍋 Цитрус и свежесть" },
    { key: "menthol", label: "❄️ Ментол и прохлада" },
    { key: "capsule", label: "💥 С капсулой" }
  ];

  container.innerHTML = categories.map(cat => {
    let u1Total = 0, u1Count = 0;
    let u2Total = 0, u2Count = 0;

    state.sticks.filter(s => s.category === cat.key).forEach(s => {
      const r = state.ratings[s.id];
      if (r) {
        if (r.u1Score > 0) { u1Total += r.u1Score; u1Count++; }
        if (r.u2Score > 0) { u2Total += r.u2Score; u2Count++; }
      }
    });

    const u1Avg = u1Count > 0 ? (u1Total / u1Count).toFixed(1) : 0;
    const u2Avg = u2Count > 0 ? (u2Total / u2Count).toFixed(1) : 0;

    return `
      <div class="cat-pref-item">
        <div class="cat-pref-head">
          <span>${cat.label}</span>
          <span style="font-size: 0.78rem; font-family: var(--font-mono);">
            <span style="color: var(--u1-color);">${state.user1.name}: ${u1Avg}</span> | 
            <span style="color: var(--u2-color);">${state.user2.name}: ${u2Avg}</span>
          </span>
        </div>
        <div class="cat-bars-dual">
          <div class="cat-bar-u1" style="width: ${u1Avg * 10}%;"></div>
          <div class="cat-bar-u2" style="width: ${u2Avg * 10}%;"></div>
        </div>
      </div>
    `;
  }).join("");
}

function generateCoupleRecommendation(matchData) {
  // Find highest rated mutual stick
  const topMutual = state.sticks
    .map(s => ({ stick: s, rating: state.ratings[s.id] }))
    .filter(i => i.rating && i.rating.u1Score >= 7 && i.rating.u2Score >= 7)
    .sort((a, b) => (b.rating.u1Score + b.rating.u2Score) - (a.rating.u1Score + a.rating.u2Score));

  if (topMutual.length > 0) {
    const s = topMutual[0].stick;
    return `
      <p>🎯 <b>Ваш беспроигрышный выбор:</b> <b>${escapeHtml(s.brand)} ${escapeHtml(s.name)}</b>! Оба оценили его на высший балл. Когда не знаете, что купить в табачном магазине — берите эту пачку, не прогадаете!</p>
      <p style="margin-top: 10px; font-size: 0.88rem; color: var(--text-secondary);">
        Всего надежных общих фаворитов в вашей копилке: <b>${topMutual.length}</b> вкуса.
      </p>
    `;
  }

  return `
    <p>💡 Продолжайте дегустировать стики из разных линеек — TEREA и HEETS скрывают еще множество ароматов от темного какао до ягодной свежести!</p>
  `;
}

// ================= TAB 4: WISHLIST =================
function renderWishlist() {
  const grid = document.getElementById("wishlistGrid");

  const wishlistSticks = state.sticks.filter(stick => {
    const r = state.ratings[stick.id];
    return r && (r.u1Verdict === "love" || r.u2Verdict === "love");
  });

  if (wishlistSticks.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
        <span style="font-size: 3rem;">🛒</span>
        <h3 style="margin-top: 10px;">Список покупок пока пуст</h3>
        <p style="margin-top: 4px;">При оценке стика выберите вердикт «❤️ Купим снова», и он появится здесь!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = wishlistSticks.map(stick => {
    const r = state.ratings[stick.id];
    const isBothLove = (r.u1Verdict === "love" && r.u2Verdict === "love");

    return `
      <div class="wishlist-item-card" style="border-left: 4px solid ${stick.color};">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span class="stick-brand-badge">${stick.brand}</span>
            ${isBothLove ? '<span style="font-size: 0.8rem; color: #ec4899; font-weight: 700;">🔥 Оба ХОТЯТ</span>' : ''}
          </div>
          <h4 style="font-size: 1.15rem; font-weight: 700; color: #fff;">${escapeHtml(stick.name)}</h4>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">${escapeHtml(stick.description || '')}</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.04); padding: 8px 12px; border-radius: 8px; font-size: 0.82rem;">
          <div style="display: flex; justify-content: space-between;">
            <span>${state.user1.name}:</span>
            <b>${r.u1Verdict === "love" ? "❤️ Купим!" : r.u1Score > 0 ? r.u1Score + "/10" : "Не пробовал"}</b>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span>${state.user2.name}:</span>
            <b>${r.u2Verdict === "love" ? "❤️ Купим!" : r.u2Score > 0 ? r.u2Score + "/10" : "Не пробовала"}</b>
          </div>
        </div>

        <button class="btn btn-secondary btn-sm" onclick="openRateModal('${stick.id}')">Изменить оценку</button>
      </div>
    `;
  }).join("");
}

// ================= BLIND TASTING MODE =================
function openBlindModal() {
  pickMysteryStick();
  openModal("blindTestModal");
}

function pickMysteryStick() {
  const randomStick = state.sticks[Math.floor(Math.random() * state.sticks.length)];
  state.activeBlindStickId = randomStick.id;

  const cardInner = document.getElementById("mysteryCardInner");
  const mysteryBack = document.getElementById("mysteryBack");
  const hint = document.getElementById("blindRateHint");
  const revealBtn = document.getElementById("btnRevealMystery");

  // Reset to front
  mysteryBack.innerHTML = "";
  cardInner.querySelector(".mystery-front").style.display = "block";
  hint.style.display = "none";
  revealBtn.style.display = "inline-flex";
}

function revealMysteryStick() {
  const stick = state.sticks.find(s => s.id === state.activeBlindStickId);
  if (!stick) return;

  const cardInner = document.getElementById("mysteryCardInner");
  const mysteryBack = document.getElementById("mysteryBack");
  const hint = document.getElementById("blindRateHint");
  const revealBtn = document.getElementById("btnRevealMystery");

  cardInner.querySelector(".mystery-front").style.display = "none";
  revealBtn.style.display = "none";

  mysteryBack.innerHTML = `
    <div style="text-align: center; animation: fadeIn 0.4s ease;">
      <span style="font-size: 2.4rem;">🎉</span>
      <div style="font-size: 0.85rem; color: var(--accent-gold); font-weight: 700; text-transform: uppercase; margin-top: 6px;">
        ${stick.brand}
      </div>
      <h2 style="font-size: 1.8rem; font-weight: 800; color: #fff; margin: 4px 0 10px;">
        ${escapeHtml(stick.name)} ${stick.subName || ''}
      </h2>
      <p style="color: var(--text-secondary); max-width: 420px; margin: 0 auto 12px; font-size: 0.9rem;">
        ${escapeHtml(stick.description || '')}
      </p>
      <div class="stick-tags" style="justify-content: center;">
        ${(stick.notes || []).map(n => `<span class="note-tag">#${escapeHtml(n)}</span>`).join("")}
      </div>
    </div>
  `;

  hint.style.display = "block";
}

// ================= ROULETTE =================
function openRouletteModal() {
  const slot = document.getElementById("rouletteSlot");
  slot.innerHTML = `<div class="slot-placeholder">Нажмите «Крутить», чтобы выбрать стик!</div>`;
  openModal("rouletteModal");
}

function spinRoulette() {
  const filterType = document.querySelector('input[name="rouletteFilter"]:checked').value;
  let candidates = [...state.sticks];

  if (filterType === "favorites") {
    candidates = candidates.filter(s => {
      const r = state.ratings[s.id];
      return r && (r.u1Verdict === "love" || r.u2Verdict === "love" || (r.u1Score >= 7 && r.u2Score >= 7));
    });
  } else if (filterType === "unrated") {
    candidates = candidates.filter(s => {
      const r = state.ratings[s.id];
      return !r || (r.u1Score === 0 && r.u2Score === 0);
    });
  }

  if (candidates.length === 0) {
    showToast("Нет стиков, подходящих под выбранный фильтр!");
    return;
  }

  const slot = document.getElementById("rouletteSlot");
  const spinBtn = document.getElementById("btnSpinRoulette");
  spinBtn.disabled = true;

  let counter = 0;
  const maxIterations = 20;
  const interval = setInterval(() => {
    const randomPick = candidates[Math.floor(Math.random() * candidates.length)];
    slot.innerHTML = `
      <div style="font-size: 1.3rem; font-weight: 700; color: ${randomPick.color};">
        ${randomPick.brand} • ${escapeHtml(randomPick.name)}
      </div>
    `;
    counter++;

    if (counter >= maxIterations) {
      clearInterval(interval);
      spinBtn.disabled = false;
      const finalPick = candidates[Math.floor(Math.random() * candidates.length)];
      
      slot.innerHTML = `
        <div style="text-align: center; animation: fadeIn 0.3s ease;">
          <span style="font-size: 2rem;">✨</span>
          <div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: 700; text-transform: uppercase;">
            Выбор пал на:
          </div>
          <h2 style="font-size: 1.8rem; font-weight: 800; color: #fff; margin: 4px 0;">
            ${escapeHtml(finalPick.name)}
          </h2>
          <div style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 12px;">
            ${finalPick.brand} (${finalPick.categoryName || finalPick.category})
          </div>
          <button class="btn btn-secondary btn-sm" onclick="closeModal('rouletteModal'); openRateModal('${finalPick.id}')">
            Оценить этот вкус
          </button>
        </div>
      `;
    }
  }, 90);
}

// ================= CUSTOM STICK FORM =================
function handleAddCustomStick(e) {
  e.preventDefault();

  const brand = document.getElementById("newStickBrand").value;
  const name = document.getElementById("newStickName").value.trim();
  const color = document.getElementById("newStickColor").value;
  const category = document.getElementById("newStickCategory").value;
  const description = document.getElementById("newStickDesc").value.trim();
  const notesRaw = document.getElementById("newStickNotes").value.trim();
  const intensity = parseInt(document.getElementById("newStickIntensity").value, 10);
  const cooling = parseInt(document.getElementById("newStickCooling").value, 10);

  if (!name) return;

  const notes = notesRaw ? notesRaw.split(",").map(n => n.trim()).filter(Boolean) : ["Свой вкус"];

  const newStick = {
    id: `custom-${Date.now()}`,
    brand,
    name,
    subName: "Свой выбор",
    color,
    accentColor: color,
    category,
    categoryName: getCategoryName(category),
    intensity,
    cooling,
    aroma: 6,
    hasCapsule: category === "capsule",
    description: description || "Пользовательский вкус стиков",
    notes,
    isCustom: true
  };

  state.sticks.unshift(newStick);
  saveSticks();

  closeModal("addStickModal");
  document.getElementById("addStickForm").reset();
  showToast(`Стик «${name}» добавлен! 🎉`);
  renderSticksGrid();
  updateHeaderStats();
}

function getCategoryName(key) {
  switch (key) {
    case "tobacco": return "Классический табак";
    case "berry": return "Ягодные и фруктовые";
    case "citrus": return "Цитрусовые и пряные";
    case "menthol": return "Свежесть и ментол";
    case "capsule": return "С капсулой";
    default: return "Особый вкус";
  }
}

// ================= SETTINGS & BACKUP =================
function openSettingsModal() {
  document.getElementById("settingU1Avatar").value = state.user1.avatar;
  document.getElementById("settingU1Name").value = state.user1.name;
  document.getElementById("settingU2Avatar").value = state.user2.avatar;
  document.getElementById("settingU2Name").value = state.user2.name;
  openModal("settingsModal");
}

function saveCoupleSettings() {
  const u1Name = document.getElementById("settingU1Name").value.trim() || "Парень";
  const u1Avatar = document.getElementById("settingU1Avatar").value.trim() || "🧔‍♂️";
  const u2Name = document.getElementById("settingU2Name").value.trim() || "Девушка";
  const u2Avatar = document.getElementById("settingU2Avatar").value.trim() || "👩‍🦰";

  state.user1.name = u1Name;
  state.user1.avatar = u1Avatar;
  state.user2.name = u2Name;
  state.user2.avatar = u2Avatar;

  saveUsers();
  updateUserInterfaceLabels();
  renderCurrentTab();
  showToast("Имена участников обновлены! ✨");
}

function exportDataJson() {
  const exportPayload = {
    version: 1,
    exportDate: new Date().toISOString(),
    user1: state.user1,
    user2: state.user2,
    ratings: state.ratings,
    customSticks: state.sticks.filter(s => s.isCustom)
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `iqos_stixlab_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast("Файл резервной копии скачан! 💾");
}

function importDataJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (data.ratings) {
        state.ratings = { ...state.ratings, ...data.ratings };
        saveRatings();
      }
      if (data.user1) {
        state.user1 = data.user1;
      }
      if (data.user2) {
        state.user2 = data.user2;
      }
      saveUsers();

      if (data.customSticks && Array.isArray(data.customSticks)) {
        data.customSticks.forEach(cs => {
          if (!state.sticks.some(s => s.id === cs.id)) {
            state.sticks.push(cs);
          }
        });
        saveSticks();
      }

      updateUserInterfaceLabels();
      updateHeaderStats();
      renderCurrentTab();
      closeModal("settingsModal");
      showToast("Данные успешно синхронизированы! 🚀");
    } catch (err) {
      console.error(err);
      alert("Ошибка при чтении файла. Убедитесь, что это корректный JSON бэкап.");
    }
  };
  reader.readAsText(file);
}

function resetAllData() {
  if (confirm("Вы уверены, что хотите сбросить все оценки и вернуть начальный каталог? Это действие нельзя отменить.")) {
    localStorage.clear();
    state.sticks = [...INITIAL_STICKS];
    state.ratings = {};
    state.user1 = { ...DEFAULT_USER1 };
    state.user2 = { ...DEFAULT_USER2 };
    saveSticks();
    saveRatings();
    saveUsers();

    updateUserInterfaceLabels();
    updateHeaderStats();
    renderCurrentTab();
    closeModal("settingsModal");
    showToast("Данные сброшены к начальным");
  }
}

// ================= CLIPBOARD EXPORTS =================
function copyLeaderboardToClipboard() {
  const rated = state.sticks
    .map(stick => ({ stick, rating: state.ratings[stick.id] }))
    .filter(item => item.rating && (item.rating.u1Score > 0 || item.rating.u2Score > 0))
    .sort((a, b) => getMutualScore(b.rating) - getMutualScore(a.rating));

  if (rated.length === 0) {
    showToast("Нет оцененных стиков для экспорта");
    return;
  }

  let text = `💨 НАШ ТОП СТИКОВ ДЛЯ IQOS (${state.user1.avatar} ${state.user1.name} & ${state.user2.avatar} ${state.user2.name}):\n\n`;

  rated.slice(0, 10).forEach((item, idx) => {
    const r = item.rating;
    const avg = ((r.u1Score + r.u2Score) / 2).toFixed(1);
    text += `${idx + 1}. ${item.stick.brand} ${item.stick.name} — ${avg}/10 (${state.user1.avatar}: ${r.u1Score}, ${state.user2.avatar}: ${r.u2Score})\n`;
  });

  copyTextToClipboard(text, "Рейтинг скопирован! Можно отправить в Telegram 💬");
}

function copyWishlistToClipboard() {
  const wishlistSticks = state.sticks.filter(stick => {
    const r = state.ratings[stick.id];
    return r && (r.u1Verdict === "love" || r.u2Verdict === "love");
  });

  if (wishlistSticks.length === 0) {
    showToast("Список покупок пуст");
    return;
  }

  let text = `🛒 СПИСОК СТИКОВ К ПОКУПКЕ (${state.user1.name} + ${state.user2.name}):\n\n`;
  wishlistSticks.forEach((stick, i) => {
    text += `▫️ ${stick.brand} ${stick.name}\n`;
  });

  copyTextToClipboard(text, "Список покупок скопирован для Telegram! 🛒");
}

function copyTextToClipboard(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => fallbackCopy(text, successMsg));
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
  showToast(successMsg);
}

// ================= TOAST NOTIFICATIONS =================
function showToast(message) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ================= UTILITIES =================
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
