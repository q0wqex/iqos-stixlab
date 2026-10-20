// ===================================================
// STIX LAB — Application Logic with 5 Criteria
// Tasting & Evaluation for Andrey & Katya
// ===================================================

const STORAGE_KEYS = {
  STICKS: "stixlab_sticks_v2",
  RATINGS: "stixlab_ratings_v2",
  USER1: "stixlab_user1_v2",
  USER2: "stixlab_user2_v2"
};

// Global State
let state = {
  sticks: [],
  ratings: {}, // key: stickId -> { u1: { taste, aroma, intensity, throat, aftertaste, total, verdict, notes }, u2: { ... }, mutualTotal }
  user1: { ...DEFAULT_USER1 },
  user2: { ...DEFAULT_USER2 },
  activeTab: "sheet",
  sheetBrandFilter: "HEETS",
  selectedStickIdForInspect: "heets-green-zing",
  currentFilterBrand: "ALL",
  currentFilterCategory: "ALL",
  currentFilterStatus: "ALL",
  searchQuery: "",
  sortBy: "mutual",
  activeRatingStickId: null,
  activeBlindStickId: null,

  // Temporary criteria state in rating modal
  modalRatingState: {
    u1: { taste: 4, aroma: 3, intensity: 4, throat: 5, aftertaste: 5 },
    u2: { taste: 4, aroma: 4, intensity: 5, throat: 5, aftertaste: 5 }
  }
};

// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initEventListeners();
  updateUserInterfaceLabels();
  renderCurrentTab();
  updateHeaderStats();

  // Initial selection for inspection card
  if (!state.selectedStickIdForInspect && state.sticks.length > 0) {
    state.selectedStickIdForInspect = state.sticks[0].id;
  }
  renderInspectCard(state.selectedStickIdForInspect);
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
    } else {
      // Use initial demo ratings (Green zing from user's table)
      state.ratings = { ...INITIAL_RATINGS };
      saveRatings();
    }

    const savedU1 = localStorage.getItem(STORAGE_KEYS.USER1);
    if (savedU1) state.user1 = JSON.parse(savedU1);

    const savedU2 = localStorage.getItem(STORAGE_KEYS.USER2);
    if (savedU2) state.user2 = JSON.parse(savedU2);
  } catch (err) {
    console.error("Error loading state:", err);
    state.sticks = [...INITIAL_STICKS];
    state.ratings = { ...INITIAL_RATINGS };
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

  // Spreadsheet brand filter buttons
  document.querySelectorAll(".sheet-brand-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sheet-brand-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.sheetBrandFilter = btn.getAttribute("data-sheet-brand");
      renderSpreadsheetView();
    });
  });

  // Edit rating from inspection card
  document.getElementById("btnInspectEditRate").addEventListener("click", () => {
    if (state.selectedStickIdForInspect) {
      openRateModal(state.selectedStickIdForInspect);
    }
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

  // Brand Filter Pills in Cards
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
  document.getElementById("btnAddNewStickFromSheet").addEventListener("click", () => openModal("addStickModal"));
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
  const u1Name = state.user1.name || "Андрей";
  const u1Short = state.user1.shortName || "Андрюша";
  const u2Name = state.user2.name || "Катя";
  const u2Short = state.user2.shortName || "Катюша";

  // Header chips
  document.getElementById("u1Avatar").textContent = state.user1.avatar;
  document.getElementById("u1Name").textContent = u1Name;
  document.getElementById("u2Avatar").textContent = state.user2.avatar;
  document.getElementById("u2Name").textContent = u2Name;

  // Sheet table headers
  document.getElementById("sheetThU1").textContent = u1Name;
  document.getElementById("sheetThU2").textContent = u2Name;

  // Inspect card user headers
  document.getElementById("inspectU1Header").textContent = u1Short;
  document.getElementById("inspectU2Header").textContent = u2Short;

  // Modal headers
  document.getElementById("modalU1Avatar").textContent = state.user1.avatar;
  document.getElementById("modalU1Name").textContent = u1Short;
  document.getElementById("modalU2Avatar").textContent = state.user2.avatar;
  document.getElementById("modalU2Name").textContent = u2Short;

  // Leaderboard column labels
  document.getElementById("leadU1Avatar").textContent = state.user1.avatar;
  document.getElementById("leadU1Title").textContent = `Топ ${u1Name}`;
  document.getElementById("leadU2Avatar").textContent = state.user2.avatar;
  document.getElementById("leadU2Title").textContent = `Топ ${u2Name}`;

  document.getElementById("thU1Name").textContent = `${state.user1.avatar} ${u1Name}`;
  document.getElementById("thU2Name").textContent = `${state.user2.avatar} ${u2Name}`;
}

// ================= TAB SWITCHING =================
function renderCurrentTab() {
  if (state.activeTab === "sheet") {
    renderSpreadsheetView();
  } else if (state.activeTab === "catalog") {
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
  const ratedCountU1 = Object.values(state.ratings).filter(r => r.u1 && r.u1.total > 0).length;
  const ratedCountU2 = Object.values(state.ratings).filter(r => r.u2 && r.u2.total > 0).length;

  document.getElementById("u1Count").textContent = ratedCountU1;
  document.getElementById("u2Count").textContent = ratedCountU2;

  // Wishlist count
  const wishlistCount = Object.values(state.ratings).filter(r => (r.u1 && r.u1.verdict === "love") || (r.u2 && r.u2.verdict === "love")).length;
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

// ================= TAB 1: SPREADSHEET VIEW =================
function renderSpreadsheetView() {
  const tbody = document.getElementById("excelTableBody");
  
  let sticks = state.sticks;
  if (state.sheetBrandFilter !== "ALL") {
    sticks = sticks.filter(s => s.brand === state.sheetBrandFilter);
  }

  if (sticks.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">
          Нет стиков в выбранной категории
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = sticks.map(stick => {
    const r = state.ratings[stick.id] || {};
    const u1Total = r.u1?.total ? formatDecimal(r.u1.total) : "";
    const u2Total = r.u2?.total ? formatDecimal(r.u2.total) : "";
    const mutual = r.mutualTotal ? formatDecimal(r.mutualTotal) : "";

    const isSelected = stick.id === state.selectedStickIdForInspect;
    const selectedClass = isSelected ? "selected-row" : "";

    // Badge styling matching iOS dark glass with crisp stick color accent
    const badgeStyle = `background: rgba(255, 255, 255, 0.06); color: #ffffff; border-left: 3.5px solid ${stick.color};`;

    return `
      <tr class="${selectedClass}" onclick="selectStickForInspect('${stick.id}')">
        <td>
          <span class="stick-badge-pill" style="${badgeStyle}">
            ${escapeHtml(stick.name)}
          </span>
        </td>
        <td>${escapeHtml(stick.description || '')}</td>
        <td class="cell-score score-u2">${u2Total}</td>
        <td class="cell-score score-u1">${u1Total}</td>
        <td class="cell-score score-total">${mutual}</td>
      </tr>
    `;
  }).join("");
}

function selectStickForInspect(stickId) {
  state.selectedStickIdForInspect = stickId;
  renderSpreadsheetView();
  renderInspectCard(stickId);
}

function renderInspectCard(stickId) {
  const stick = state.sticks.find(s => s.id === stickId);
  if (!stick) return;

  const r = state.ratings[stickId] || {};

  // Header with iOS specular glass gradient and accent
  const headerElem = document.getElementById("inspectStickHeader");
  headerElem.style.background = `linear-gradient(135deg, ${stick.color}24, rgba(255, 255, 255, 0.04))`;
  headerElem.style.borderLeft = `4px solid ${stick.color}`;
  headerElem.style.color = "#ffffff";
  document.getElementById("inspectStickName").textContent = stick.name;

  // Andrey (u1)
  const u1Body = document.getElementById("inspectU1Body");
  u1Body.innerHTML = RATING_CRITERIA.map(crit => {
    const val = r.u1?.[crit.id] ?? "—";
    return `
      <tr>
        <td>${crit.name}</td>
        <td style="text-align: right; font-weight: 700; font-family: var(--font-mono);">${val}</td>
      </tr>
    `;
  }).join("");
  document.getElementById("inspectU1Total").textContent = r.u1?.total ? formatDecimal(r.u1.total) : "—";

  // Katya (u2)
  const u2Body = document.getElementById("inspectU2Body");
  u2Body.innerHTML = RATING_CRITERIA.map(crit => {
    const val = r.u2?.[crit.id] ?? "—";
    return `
      <tr>
        <td>${crit.name}</td>
        <td style="text-align: right; font-weight: 700; font-family: var(--font-mono);">${val}</td>
      </tr>
    `;
  }).join("");
  document.getElementById("inspectU2Total").textContent = r.u2?.total ? formatDecimal(r.u2.total) : "—";

  // Mutual Total
  document.getElementById("inspectMutualTotal").textContent = r.mutualTotal ? formatDecimal(r.mutualTotal) : "—";
}

// ================= 5-CRITERIA RATING MODAL =================
function openRateModal(stickId) {
  const stick = state.sticks.find(s => s.id === stickId);
  if (!stick) return;

  state.activeRatingStickId = stickId;
  const rating = state.ratings[stickId] || {};

  // Header info
  document.getElementById("modalStickBrand").textContent = stick.brand;
  document.getElementById("modalStickTitle").textContent = stick.name;
  document.getElementById("modalStickDesc").textContent = stick.description || "";

  // Initialize modal state
  state.modalRatingState = {
    u1: {
      taste: rating.u1?.taste ?? 4,
      aroma: rating.u1?.aroma ?? 3,
      intensity: rating.u1?.intensity ?? 4,
      throat: rating.u1?.throat ?? 4,
      aftertaste: rating.u1?.aftertaste ?? 4
    },
    u2: {
      taste: rating.u2?.taste ?? 4,
      aroma: rating.u2?.aroma ?? 4,
      intensity: rating.u2?.intensity ?? 4,
      throat: rating.u2?.throat ?? 4,
      aftertaste: rating.u2?.aftertaste ?? 4
    }
  };

  // Render 5 criteria buttons for User 1
  renderModalCriteriaInputs("u1", "u1CriteriaInputs");

  // Render 5 criteria buttons for User 2
  renderModalCriteriaInputs("u2", "u2CriteriaInputs");

  // Verdicts & comments
  setRadioValue("u1Verdict", rating.u1?.verdict || "love");
  document.getElementById("u1Notes").value = rating.u1?.notes || "";

  setRadioValue("u2Verdict", rating.u2?.verdict || "love");
  document.getElementById("u2Notes").value = rating.u2?.notes || "";

  updateModalScoresCalculation();
  openModal("rateModal");
}

function renderModalCriteriaInputs(userKey, containerId) {
  const container = document.getElementById(containerId);
  const values = state.modalRatingState[userKey];

  container.innerHTML = RATING_CRITERIA.map(crit => {
    const curVal = values[crit.id];
    return `
      <div class="criterion-item">
        <div class="criterion-label-row">
          <span class="criterion-name">${crit.icon} ${crit.name}</span>
          <span class="criterion-val-badge" id="${userKey}_${crit.id}_badge">${curVal}</span>
        </div>
        <div class="criterion-btn-group">
          ${[1, 2, 3, 4, 5].map(num => `
            <button type="button" class="crit-btn ${num === curVal ? 'active' : ''}" 
              onclick="setCriterionScore('${userKey}', '${crit.id}', ${num})">
              ${num}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function setCriterionScore(userKey, criterionId, score) {
  state.modalRatingState[userKey][criterionId] = score;

  // Update badge
  const badge = document.getElementById(`${userKey}_${criterionId}_badge`);
  if (badge) badge.textContent = score;

  // Update active button state
  const container = document.getElementById(`${userKey}CriteriaInputs`);
  const critItem = container.querySelectorAll(".criterion-item")[RATING_CRITERIA.findIndex(c => c.id === criterionId)];
  if (critItem) {
    critItem.querySelectorAll(".crit-btn").forEach((btn, idx) => {
      btn.classList.toggle("active", idx + 1 === score);
    });
  }

  updateModalScoresCalculation();
}

function updateModalScoresCalculation() {
  const u1Values = Object.values(state.modalRatingState.u1);
  const u1Avg = (u1Values.reduce((a, b) => a + b, 0) / u1Values.length);
  document.getElementById("u1CriteriaTotal").textContent = formatDecimal(u1Avg);

  const u2Values = Object.values(state.modalRatingState.u2);
  const u2Avg = (u2Values.reduce((a, b) => a + b, 0) / u2Values.length);
  document.getElementById("u2CriteriaTotal").textContent = formatDecimal(u2Avg);

  const mutualAvg = (u1Avg + u2Avg) / 2;
  document.getElementById("modalMutualAvg").textContent = formatDecimal(mutualAvg);
}

function saveStickRating() {
  if (!state.activeRatingStickId) return;

  const u1Values = state.modalRatingState.u1;
  const u1Total = parseFloat((Object.values(u1Values).reduce((a, b) => a + b, 0) / 5).toFixed(1));
  const u1Verdict = getRadioValue("u1Verdict") || "love";
  const u1Notes = document.getElementById("u1Notes").value.trim();

  const u2Values = state.modalRatingState.u2;
  const u2Total = parseFloat((Object.values(u2Values).reduce((a, b) => a + b, 0) / 5).toFixed(1));
  const u2Verdict = getRadioValue("u2Verdict") || "love";
  const u2Notes = document.getElementById("u2Notes").value.trim();

  const mutualTotal = parseFloat(((u1Total + u2Total) / 2).toFixed(1));

  state.ratings[state.activeRatingStickId] = {
    u1: {
      ...u1Values,
      total: u1Total,
      verdict: u1Verdict,
      notes: u1Notes
    },
    u2: {
      ...u2Values,
      total: u2Total,
      verdict: u2Verdict,
      notes: u2Notes
    },
    mutualTotal,
    updatedAt: new Date().toISOString()
  };

  saveRatings();
  closeModal("rateModal");
  updateHeaderStats();
  renderCurrentTab();
  if (state.selectedStickIdForInspect === state.activeRatingStickId) {
    renderInspectCard(state.activeRatingStickId);
  }
  showToast("Оценка по критериям сохранена! ✨");
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

// ================= TAB 2: CARDS CATALOG =================
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
    const r = state.ratings[stick.id] || {};
    const u1 = r.u1;
    const u2 = r.u2;

    const u1ScoreDisplay = u1?.total ? formatDecimal(u1.total) : "—";
    const u2ScoreDisplay = u2?.total ? formatDecimal(u2.total) : "—";
    const mutualDisplay = r.mutualTotal ? formatDecimal(r.mutualTotal) : "—";

    const hasRated = !!(u1?.total || u2?.total);

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
        </div>

        <div>
          <!-- Dual Evaluation Summary -->
          <div class="card-dual-eval">
            <div class="eval-user-half">
              <div class="eval-user-top">
                <span>${state.user1.avatar} ${escapeHtml(state.user1.shortName || state.user1.name)}</span>
                <span class="score-u1" style="font-weight: 800; font-family: var(--font-mono);">${u1ScoreDisplay}</span>
              </div>
              ${getVerdictBadgeHtml(u1?.verdict)}
              ${u1?.notes ? `<span class="eval-user-note" title="${escapeHtml(u1.notes)}">«${escapeHtml(u1.notes)}»</span>` : ''}
            </div>

            <div class="eval-user-half">
              <div class="eval-user-top">
                <span>${state.user2.avatar} ${escapeHtml(state.user2.shortName || state.user2.name)}</span>
                <span class="score-u2" style="font-weight: 800; font-family: var(--font-mono);">${u2ScoreDisplay}</span>
              </div>
              ${getVerdictBadgeHtml(u2?.verdict)}
              ${u2?.notes ? `<span class="eval-user-note" title="${escapeHtml(u2.notes)}">«${escapeHtml(u2.notes)}»</span>` : ''}
            </div>
          </div>

          <div class="card-actions-bottom">
            <div class="avg-mutual-pill" title="Итог пары">
              <span>Итог:</span>
              <span class="avg-mutual-num">${mutualDisplay}</span>
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

function getFilteredAndSortedSticks() {
  return state.sticks.filter(stick => {
    // Brand
    if (state.currentFilterBrand !== "ALL") {
      if (state.currentFilterBrand === "CUSTOM" && !stick.isCustom) return false;
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
        if (!r || !r.u1?.total || !r.u2?.total) return false;
      } else if (state.currentFilterStatus === "unrated") {
        if (r && (r.u1?.total || r.u2?.total)) return false;
      } else if (state.currentFilterStatus === "favorites") {
        if (!r || (r.u1?.verdict !== "love" && r.u2?.verdict !== "love")) return false;
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
      const sA = rA.mutualTotal || 0;
      const sB = rB.mutualTotal || 0;
      if (sA !== sB) return sB - sA;
      return a.name.localeCompare(b.name);
    }

    if (state.sortBy === "u1") {
      const sA = rA.u1?.total || 0;
      const sB = rB.u1?.total || 0;
      if (sA !== sB) return sB - sA;
      return a.name.localeCompare(b.name);
    }

    if (state.sortBy === "u2") {
      const sA = rA.u2?.total || 0;
      const sB = rB.u2?.total || 0;
      if (sA !== sB) return sB - sA;
      return a.name.localeCompare(b.name);
    }

    if (state.sortBy === "name") {
      return a.name.localeCompare(b.name);
    }

    return 0;
  });
}

// ================= TAB 3: LEADERBOARD =================
function renderLeaderboard() {
  renderChampions();
  renderUserTopRanked("u1", "u1RankedList");
  renderUserTopRanked("u2", "u2RankedList");
  renderMutualTable();
}

function renderChampions() {
  const mutualDiv = document.getElementById("mutualChampionContent");
  const controversyDiv = document.getElementById("controversyContent");

  let bestStick = null;
  let bestScore = -1;

  let mostControversialStick = null;
  let maxScoreDiff = -1;

  state.sticks.forEach(stick => {
    const r = state.ratings[stick.id];
    if (r && r.u1?.total && r.u2?.total) {
      if (r.mutualTotal > bestScore) {
        bestScore = r.mutualTotal;
        bestStick = stick;
      }

      const diff = Math.abs(r.u1.total - r.u2.total);
      if (diff > maxScoreDiff && diff >= 0.6) {
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
        <span>Общий балл: <b style="color: var(--accent-gold); font-size: 1.25rem;">${formatDecimal(r.mutualTotal)}</b></span>
        <span>${state.user1.shortName || state.user1.name}: <b>${formatDecimal(r.u1.total)}</b></span>
        <span>${state.user2.shortName || state.user2.name}: <b>${formatDecimal(r.u2.total)}</b></span>
      </div>
    `;
  } else {
    mutualDiv.innerHTML = `
      <p style="color: var(--text-muted); font-size: 0.9rem; padding-top: 10px;">
        Оцените хотя бы 1 стик вместе, чтобы выявить победителя!
      </p>
    `;
  }

  if (mostControversialStick) {
    const r = state.ratings[mostControversialStick.id];
    controversyDiv.innerHTML = `
      <div class="champ-title-row">
        <span class="champ-stick-name">${escapeHtml(mostControversialStick.name)}</span>
        <span class="champ-brand" style="color: #f87171;">Разница: ${formatDecimal(maxScoreDiff)} б.</span>
      </div>
      <div class="champ-score-row">
        <span>${state.user1.shortName || state.user1.name}: <b>${formatDecimal(r.u1.total)}</b></span>
        <span>${state.user2.shortName || state.user2.name}: <b>${formatDecimal(r.u2.total)}</b></span>
      </div>
      <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 6px;">
        «Кажется, здесь вам стоит провести дополнительную дегустацию!»
      </p>
    `;
  } else {
    controversyDiv.innerHTML = `
      <p style="color: var(--text-muted); font-size: 0.9rem; padding-top: 10px;">
        Пока в ваших оценках полная гармония!
      </p>
    `;
  }
}

function renderUserTopRanked(userKey, containerId) {
  const container = document.getElementById(containerId);

  const ratedSticks = state.sticks
    .map(stick => ({ stick, rating: state.ratings[stick.id] }))
    .filter(item => item.rating && item.rating[userKey]?.total > 0)
    .sort((a, b) => b.rating[userKey].total - a.rating[userKey].total)
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
    const totalVal = formatDecimal(item.rating[userKey].total);

    return `
      <div class="ranked-item" onclick="openRateModal('${item.stick.id}')" style="cursor: pointer;">
        <span class="rank-num">#${idx + 1}</span>
        <div class="rank-stick-info">
          <div class="rank-stick-name">${escapeHtml(item.stick.name)}</div>
          <div class="rank-stick-brand">${item.stick.brand} • ${item.stick.categoryName || ''}</div>
        </div>
        <div class="rank-score" style="color: ${scoreColor};">
          ${totalVal}
        </div>
      </div>
    `;
  }).join("");
}

function renderMutualTable() {
  const tbody = document.getElementById("mutualLeaderboardBody");
  
  const rated = state.sticks
    .map(stick => ({ stick, rating: state.ratings[stick.id] }))
    .filter(item => item.rating && (item.rating.u1?.total || item.rating.u2?.total))
    .sort((a, b) => (b.rating.mutualTotal || 0) - (a.rating.mutualTotal || 0));

  if (rated.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">
          Вы пока не оценили ни одного стика
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rated.map((item, index) => {
    const r = item.rating;
    const u1 = r.u1?.total ? formatDecimal(r.u1.total) : "—";
    const u2 = r.u2?.total ? formatDecimal(r.u2.total) : "—";
    const mutual = r.mutualTotal ? formatDecimal(r.mutualTotal) : "—";

    let verdictText = "Обычный";
    if (r.u1?.verdict === "love" && r.u2?.verdict === "love") {
      verdictText = "🔥 Оба в восторге!";
    } else if (r.u1?.verdict === "love" || r.u2?.verdict === "love") {
      verdictText = "❤️ Купим снова";
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
        <td style="color: var(--u1-color); font-weight: 700;">${u1}</td>
        <td style="color: var(--u2-color); font-weight: 700;">${u2}</td>
        <td style="font-weight: 800; font-family: var(--font-mono); color: #fff;">${mutual}</td>
        <td><span style="font-size: 0.8rem;">${verdictText}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openRateModal('${item.stick.id}')">Изменить</button>
        </td>
      </tr>
    `;
  }).join("");
}

// ================= TAB 4: COMPATIBILITY =================
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
    headline.textContent = "Начните вашу дегустацию!";
    desc.textContent = "Оцените хотя бы 2-3 вкуса по 5 критериям, чтобы система рассчитала гармонию ваших предпочтений.";
    recBox.innerHTML = `
      <p>💡 <b>Совет:</b> Загляните в таблицу дегустации и оцените вкусы, которые вы уже пробовали!</p>
    `;
  } else {
    if (result.percent >= 80) {
      headline.textContent = "Идеальное совпадение вкусов! 🔥";
      desc.textContent = "Ваши оценки по 5 критериям практически идентичны. Вам отлично подойдет одна пачка на двоих!";
    } else if (result.percent >= 55) {
      headline.textContent = "Отличная гармония! ✨";
      desc.textContent = "У вас есть общие фавориты, но в нюансах (аромат или комфорт горла) вкусы могут немного отличаться.";
    } else {
      headline.textContent = "Яркие противоположности! ⚡";
      desc.textContent = "Каждый из вас ценит свои нюансы в стиках. Лучшее решение — покупать разные вкусы для каждого.";
    }

    recBox.innerHTML = generateCoupleRecommendation();
  }

  renderCriteriaPreferences();
}

function calculateCoupleCompatibility() {
  let bothCount = 0;
  let totalScoreDiff = 0;
  let agreements = 0;
  let disagreements = 0;

  state.sticks.forEach(stick => {
    const r = state.ratings[stick.id];
    if (r && r.u1?.total && r.u2?.total) {
      bothCount++;
      const diff = Math.abs(r.u1.total - r.u2.total);
      totalScoreDiff += diff;
      if (diff <= 0.4) agreements++;
      if (diff >= 1.0) disagreements++;
    }
  });

  if (bothCount === 0) {
    return { percent: 0, bothCount: 0, agreements: 0, disagreements: 0 };
  }

  // Max diff on 1-5 scale is 4. Avg diff of 0 => 100%, avg diff of 2 => 50%
  const avgDiff = totalScoreDiff / bothCount;
  const matchPercent = Math.max(0, Math.min(100, Math.round((1 - (avgDiff / 2)) * 100)));

  return {
    percent: matchPercent,
    bothCount,
    agreements,
    disagreements
  };
}

function renderCriteriaPreferences() {
  const container = document.getElementById("categoryPrefList");

  container.innerHTML = RATING_CRITERIA.map(crit => {
    let u1Total = 0, u1Count = 0;
    let u2Total = 0, u2Count = 0;

    Object.values(state.ratings).forEach(r => {
      if (r.u1?.[crit.id]) { u1Total += r.u1[crit.id]; u1Count++; }
      if (r.u2?.[crit.id]) { u2Total += r.u2[crit.id]; u2Count++; }
    });

    const u1Avg = u1Count > 0 ? (u1Total / u1Count).toFixed(1) : 0;
    const u2Avg = u2Count > 0 ? (u2Total / u2Count).toFixed(1) : 0;

    return `
      <div class="cat-pref-item">
        <div class="cat-pref-head">
          <span>${crit.icon} ${crit.name}</span>
          <span style="font-size: 0.78rem; font-family: var(--font-mono);">
            <span style="color: var(--u1-color);">${state.user1.shortName || state.user1.name}: ${formatDecimal(u1Avg)}</span> | 
            <span style="color: var(--u2-color);">${state.user2.shortName || state.user2.name}: ${formatDecimal(u2Avg)}</span>
          </span>
        </div>
        <div class="cat-bars-dual">
          <div class="cat-bar-u1" style="width: ${u1Avg * 20}%;"></div>
          <div class="cat-bar-u2" style="width: ${u2Avg * 20}%;"></div>
        </div>
      </div>
    `;
  }).join("");
}

function generateCoupleRecommendation() {
  const topMutual = state.sticks
    .map(s => ({ stick: s, rating: state.ratings[s.id] }))
    .filter(i => i.rating && i.rating.u1?.total >= 4.0 && i.rating.u2?.total >= 4.0)
    .sort((a, b) => b.rating.mutualTotal - a.rating.mutualTotal);

  if (topMutual.length > 0) {
    const s = topMutual[0].stick;
    return `
      <p>🎯 <b>Ваш беспроигрышный выбор:</b> <b>${escapeHtml(s.brand)} ${escapeHtml(s.name)}</b>! Оба оценили его на высокий балл (${formatDecimal(topMutual[0].rating.mutualTotal)}/5). Рекомендуем брать его в запас!</p>
    `;
  }

  return `
    <p>💡 Оценивайте больше стиков по 5 критериям, чтобы найти идеальный баланс вкуса и аромата!</p>
  `;
}

// ================= TAB 5: WISHLIST =================
function renderWishlist() {
  const grid = document.getElementById("wishlistGrid");

  const wishlistSticks = state.sticks.filter(stick => {
    const r = state.ratings[stick.id];
    return r && ((r.u1 && r.u1.verdict === "love") || (r.u2 && r.u2.verdict === "love"));
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
    const isBothLove = (r.u1?.verdict === "love" && r.u2?.verdict === "love");

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
            <span>${state.user1.shortName || state.user1.name}:</span>
            <b>${r.u1?.verdict === "love" ? "❤️ Купим!" : r.u1?.total ? formatDecimal(r.u1.total) : "—"}</b>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span>${state.user2.shortName || state.user2.name}:</span>
            <b>${r.u2?.verdict === "love" ? "❤️ Купим!" : r.u2?.total ? formatDecimal(r.u2.total) : "—"}</b>
          </div>
        </div>

        <button class="btn btn-secondary btn-sm" onclick="openRateModal('${stick.id}')">Изменить баллы</button>
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
        ${escapeHtml(stick.name)}
      </h2>
      <p style="color: var(--text-secondary); max-width: 420px; margin: 0 auto 12px; font-size: 0.9rem;">
        ${escapeHtml(stick.description || '')}
      </p>
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
      return r && ((r.u1 && r.u1.verdict === "love") || (r.u2 && r.u2.verdict === "love") || r.mutualTotal >= 4.0);
    });
  } else if (filterType === "unrated") {
    candidates = candidates.filter(s => {
      const r = state.ratings[s.id];
      return !r || (!r.u1?.total && !r.u2?.total);
    });
  }

  if (candidates.length === 0) {
    showToast("Нет подходящих стиков под фильтр");
    return;
  }

  const slot = document.getElementById("rouletteSlot");
  const spinBtn = document.getElementById("btnSpinRoulette");
  spinBtn.disabled = true;

  let counter = 0;
  const maxIterations = 18;
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

  if (!name) return;

  const notes = notesRaw ? notesRaw.split(",").map(n => n.trim()).filter(Boolean) : ["Свой вкус"];

  const newStick = {
    id: `custom-${Date.now()}`,
    brand,
    name,
    subName: "Свой выбор",
    color,
    accentColor: color,
    bgTint: "rgba(255, 255, 255, 0.08)",
    category,
    categoryName: getCategoryName(category),
    intensity: 4,
    cooling: 3,
    aroma: 4,
    hasCapsule: category === "capsule",
    description: description || "Пользовательский вкус стиков",
    notes,
    isCustom: true
  };

  state.sticks.unshift(newStick);
  saveSticks();

  closeModal("addStickModal");
  document.getElementById("addStickForm").reset();
  showToast(`Вкус «${name}» добавлен! 🎉`);
  renderCurrentTab();
  updateHeaderStats();
}

function getCategoryName(key) {
  switch (key) {
    case "citrus": return "Цитрусовые и пряные";
    case "berry": return "Ягодные и фруктовые";
    case "menthol": return "Свежесть и ментол";
    case "tobacco": return "Классический табак";
    case "capsule": return "С капсулой";
    default: return "Особый вкус";
  }
}

// ================= SETTINGS & BACKUP =================
function openSettingsModal() {
  document.getElementById("settingU1Avatar").value = state.user1.avatar;
  document.getElementById("settingU1Name").value = state.user1.name;
  document.getElementById("settingU1ShortName").value = state.user1.shortName || "Андрюша";
  document.getElementById("settingU2Avatar").value = state.user2.avatar;
  document.getElementById("settingU2Name").value = state.user2.name;
  document.getElementById("settingU2ShortName").value = state.user2.shortName || "Катюша";
  openModal("settingsModal");
}

function saveCoupleSettings() {
  state.user1.name = document.getElementById("settingU1Name").value.trim() || "Андрей";
  state.user1.shortName = document.getElementById("settingU1ShortName").value.trim() || "Андрюша";
  state.user1.avatar = document.getElementById("settingU1Avatar").value.trim() || "🧔‍♂️";

  state.user2.name = document.getElementById("settingU2Name").value.trim() || "Катя";
  state.user2.shortName = document.getElementById("settingU2ShortName").value.trim() || "Катюша";
  state.user2.avatar = document.getElementById("settingU2Avatar").value.trim() || "👩‍🦰";

  saveUsers();
  updateUserInterfaceLabels();
  renderCurrentTab();
  showToast("Имена обновлены! ✨");
}

function exportDataJson() {
  const exportPayload = {
    version: 2,
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

  showToast("Резервная копия сохранена! 💾");
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
      if (data.user1) state.user1 = data.user1;
      if (data.user2) state.user2 = data.user2;
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
      alert("Ошибка при чтении файла резервной копии.");
    }
  };
  reader.readAsText(file);
}

function resetAllData() {
  if (confirm("Вы уверены, что хотите сбросить оценки к исходным данным?")) {
    localStorage.removeItem(STORAGE_KEYS.STICKS);
    localStorage.removeItem(STORAGE_KEYS.RATINGS);
    localStorage.removeItem(STORAGE_KEYS.USER1);
    localStorage.removeItem(STORAGE_KEYS.USER2);
    
    state.sticks = [...INITIAL_STICKS];
    state.ratings = { ...INITIAL_RATINGS };
    state.user1 = { ...DEFAULT_USER1 };
    state.user2 = { ...DEFAULT_USER2 };
    
    saveSticks();
    saveRatings();
    saveUsers();

    updateUserInterfaceLabels();
    updateHeaderStats();
    renderCurrentTab();
    closeModal("settingsModal");
    showToast("Данные сброшены");
  }
}

// ================= CLIPBOARD EXPORTS =================
function copyLeaderboardToClipboard() {
  const rated = state.sticks
    .map(stick => ({ stick, rating: state.ratings[stick.id] }))
    .filter(item => item.rating && (item.rating.u1?.total || item.rating.u2?.total))
    .sort((a, b) => (b.rating.mutualTotal || 0) - (a.rating.mutualTotal || 0));

  if (rated.length === 0) {
    showToast("Нет оцененных стиков для экспорта");
    return;
  }

  let text = `💨 НАШ ТОП СТИКОВ ДЛЯ IQOS (${state.user1.avatar} ${state.user1.shortName || state.user1.name} & ${state.user2.avatar} ${state.user2.shortName || state.user2.name}):\n\n`;

  rated.slice(0, 10).forEach((item, idx) => {
    const r = item.rating;
    const u1 = r.u1?.total ? formatDecimal(r.u1.total) : "—";
    const u2 = r.u2?.total ? formatDecimal(r.u2.total) : "—";
    const mutual = r.mutualTotal ? formatDecimal(r.mutualTotal) : "—";
    text += `${idx + 1}. ${item.stick.brand} ${item.stick.name} — Итог: ${mutual} (${state.user1.shortName || state.user1.name}: ${u1}, ${state.user2.shortName || state.user2.name}: ${u2})\n`;
  });

  copyTextToClipboard(text, "Рейтинг скопирован для Telegram! 💬");
}

function copyWishlistToClipboard() {
  const wishlistSticks = state.sticks.filter(stick => {
    const r = state.ratings[stick.id];
    return r && ((r.u1 && r.u1.verdict === "love") || (r.u2 && r.u2.verdict === "love"));
  });

  if (wishlistSticks.length === 0) {
    showToast("Список покупок пуст");
    return;
  }

  let text = `🛒 СПИСОК СТИКОВ К ПОКУПКЕ (${state.user1.name} + ${state.user2.name}):\n\n`;
  wishlistSticks.forEach(stick => {
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

// ================= FORMAT UTILITIES =================
function formatDecimal(num) {
  if (num === null || num === undefined || isNaN(num)) return "—";
  return Number(num).toFixed(1).replace(".", ",");
}

function getTextColorForBg(hexColor) {
  // If it's a light tint, return dark text, else return white
  if (!hexColor || hexColor.startsWith("rgba")) return "#fff";
  const hex = hexColor.replace("#", "");
  if (hex.length === 6) {
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 150) ? "#1e293b" : "#ffffff";
  }
  return "#ffffff";
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
