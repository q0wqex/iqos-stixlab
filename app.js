// ==========================================================================
// STIX LAB — Application Controller & Reactive State
// ==========================================================================

(function () {
  "use strict";

  // Storage key
  const STORAGE_KEY = "iqos_stixlab_v3_ratings";

  // Application State
  const state = {
    sticks: STICKS_DATA || [],
    ratings: {},
    currentFilter: "ALL", // 'ALL' | 'HEETS' | 'FIIT' | 'TOP' | 'UNRATED'
    searchQuery: "",
    activeStickId: null,
    activeTaster: "u1", // 'u1' (Andrey) | 'u2' (Katya) | 'both' (Together)
    editBuffer: {
      u1: {},
      u2: {},
      notes: ""
    }
  };

  // DOM Elements Cache
  const el = {
    // Header & Filters
    searchInput: document.getElementById("searchInput"),
    clearSearchBtn: document.getElementById("clearSearchBtn"),
    filterNav: document.getElementById("filterNav"),
    filterTabs: document.querySelectorAll(".filter-tab"),
    countAll: document.getElementById("countAll"),
    countHeets: document.getElementById("countHeets"),
    countFiit: document.getElementById("countFiit"),
    countTop: document.getElementById("countTop"),
    countUnrated: document.getElementById("countUnrated"),
    listMeta: document.getElementById("listMeta"),
    metaText: document.getElementById("metaText"),

    // Main List
    sticksGrid: document.getElementById("sticksGrid"),
    emptyState: document.getElementById("emptyState"),
    resetSearchBtn: document.getElementById("resetSearchBtn"),

    // Bottom Sheet Modal
    rateBackdrop: document.getElementById("rateBackdrop"),
    bottomSheet: document.getElementById("bottomSheet"),
    sheetHandle: document.getElementById("sheetHandle"),
    closeSheetBtn: document.getElementById("closeSheetBtn"),
    sheetColorStrip: document.getElementById("sheetColorStrip"),
    sheetBrandBadge: document.getElementById("sheetBrandBadge"),
    sheetCategoryBadge: document.getElementById("sheetCategoryBadge"),
    sheetCapsuleBadge: document.getElementById("sheetCapsuleBadge"),
    sheetStickName: document.getElementById("sheetStickName"),
    sheetStickDesc: document.getElementById("sheetStickDesc"),
    sheetNotesList: document.getElementById("sheetNotesList"),

    // Taster Tabs
    tabU1: document.getElementById("tabU1"),
    tabU2: document.getElementById("tabU2"),
    tabBoth: document.getElementById("tabBoth"),
    tabAvgU1: document.getElementById("tabAvgU1"),
    tabAvgU2: document.getElementById("tabAvgU2"),
    tabAvgBoth: document.getElementById("tabAvgBoth"),

    // Criteria Container
    criteriaContainer: document.getElementById("criteriaContainer"),
    stickCommentInput: document.getElementById("stickCommentInput"),

    // Sheet Footer
    sheetSummaryU1: document.getElementById("sheetSummaryU1"),
    sheetSummaryU2: document.getElementById("sheetSummaryU2"),
    sheetSummaryMutual: document.getElementById("sheetSummaryMutual"),
    btnSaveStickRating: document.getElementById("btnSaveStickRating"),
    btnResetStickRating: document.getElementById("btnResetStickRating"),

    // Menu Modal
    btnOpenMenu: document.getElementById("btnOpenMenu"),
    menuBackdrop: document.getElementById("menuBackdrop"),
    closeMenuBtn: document.getElementById("closeMenuBtn"),
    statTastedCount: document.getElementById("statTastedCount"),
    statRemainingCount: document.getElementById("statRemainingCount"),
    statFavoriteTaste: document.getElementById("statFavoriteTaste"),
    btnExportJson: document.getElementById("btnExportJson"),
    btnImportJson: document.getElementById("btnImportJson"),
    fileImportInput: document.getElementById("fileImportInput"),
    btnResetToDefaults: document.getElementById("btnResetToDefaults"),

    // Toast
    toastNotice: document.getElementById("toastNotice"),
    toastMessage: document.getElementById("toastMessage")
  };

  // ==========================================================================
  // Initialization & Storage
  // ==========================================================================

  function init() {
    loadRatings();
    setupEventListeners();
    updateFilterCounts();
    renderSticksList();
  }

  function loadRatings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        state.ratings = JSON.parse(stored);
      } else {
        // Pre-seed with actual initial ratings from Andrey and Katya's tasting table
        const base = JSON.parse(JSON.stringify(INITIAL_DEMO_RATINGS || {}));
        const oldStored = localStorage.getItem("iqos_stixlab_v2_ratings");
        if (oldStored) {
          try {
            const oldData = JSON.parse(oldStored);
            state.ratings = { ...base, ...oldData };
          } catch (_) {
            state.ratings = base;
          }
        } else {
          state.ratings = base;
        }
        saveRatings();
      }
    } catch (e) {
      console.warn("Could not read localStorage, fallback to demo:", e);
      state.ratings = JSON.parse(JSON.stringify(INITIAL_DEMO_RATINGS || {}));
    }
  }

  function saveRatings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.ratings));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  }

  // ==========================================================================
  // Calculation Helpers (5 Criteria Average & Mutual Score)
  // ==========================================================================

  function calcUserAverage(userScores) {
    if (!userScores) return null;
    // Scores range from 0 to 5 (0 means "No/Absent", e.g. no flavor intensity or finish)
    const values = Object.values(userScores).filter(v => typeof v === "number" && v >= 0 && v <= 5);
    if (values.length === 0) return null;
    const sum = values.reduce((acc, cur) => acc + cur, 0);
    return Math.round((sum / values.length) * 10) / 10;
  }

  function calcStickScores(stickId) {
    const r = state.ratings[stickId];
    if (!r) {
      return { u1Avg: null, u2Avg: null, mutual: null, isRated: false };
    }
    const u1Avg = calcUserAverage(r.u1);
    const u2Avg = calcUserAverage(r.u2);

    let mutual = null;
    if (u1Avg !== null && u2Avg !== null) {
      mutual = Math.round(((u1Avg + u2Avg) / 2) * 10) / 10;
    } else if (u1Avg !== null) {
      mutual = u1Avg;
    } else if (u2Avg !== null) {
      mutual = u2Avg;
    }

    return {
      u1Avg,
      u2Avg,
      mutual,
      isRated: mutual !== null,
      notes: r.notes || ""
    };
  }

  function calcBufferScores() {
    const u1Avg = calcUserAverage(state.editBuffer.u1);
    const u2Avg = calcUserAverage(state.editBuffer.u2);

    let mutual = null;
    if (u1Avg !== null && u2Avg !== null) {
      mutual = Math.round(((u1Avg + u2Avg) / 2) * 10) / 10;
    } else if (u1Avg !== null) {
      mutual = u1Avg;
    } else if (u2Avg !== null) {
      mutual = u2Avg;
    }

    return { u1Avg, u2Avg, mutual };
  }

  // ==========================================================================
  // Rendering & List Filtering
  // ==========================================================================

  function getFilteredSticks() {
    let list = [...state.sticks];

    // Filter by Brand / Top / Unrated
    if (state.currentFilter === "HEETS") {
      list = list.filter(s => s.brand === "HEETS");
    } else if (state.currentFilter === "FIIT") {
      list = list.filter(s => s.brand === "FIIT");
    } else if (state.currentFilter === "TOP") {
      // Top shows only sticks with ratings, ranked descending
      list = list
        .map(s => ({ ...s, scores: calcStickScores(s.id) }))
        .filter(s => s.scores.isRated)
        .sort((a, b) => (b.scores.mutual || 0) - (a.scores.mutual || 0));
      return applySearchFilter(list);
    } else if (state.currentFilter === "UNRATED") {
      // Unrated shows only sticks that have not been tasted yet
      list = list
        .map(s => ({ ...s, scores: calcStickScores(s.id) }))
        .filter(s => !s.scores.isRated);
      return applySearchFilter(list);
    }

    // Attach scores to each item
    list = list.map(s => ({ ...s, scores: calcStickScores(s.id) }));

    return applySearchFilter(list);
  }

  function applySearchFilter(list) {
    const q = state.searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter(s => {
      const matchName = s.name.toLowerCase().includes(q);
      const matchBrand = s.brand.toLowerCase().includes(q);
      const matchCategory = (s.category || "").toLowerCase().includes(q);
      const matchTag = (s.tag || "").toLowerCase().includes(q);
      const matchDesc = (s.desc || "").toLowerCase().includes(q);
      const matchNotes = (s.notes || []).some(n => n.toLowerCase().includes(q));
      return matchName || matchBrand || matchCategory || matchTag || matchDesc || matchNotes;
    });
  }

  function updateFilterCounts() {
    const totalAll = state.sticks.length;
    const totalHeets = state.sticks.filter(s => s.brand === "HEETS").length;
    const totalFiit = state.sticks.filter(s => s.brand === "FIIT").length;

    let ratedCount = 0;
    state.sticks.forEach(s => {
      const scores = calcStickScores(s.id);
      if (scores.isRated) ratedCount++;
    });

    const unratedCount = Math.max(0, totalAll - ratedCount);

    el.countAll.textContent = totalAll;
    el.countHeets.textContent = totalHeets;
    el.countFiit.textContent = totalFiit;
    el.countTop.textContent = ratedCount;
    if (el.countUnrated) el.countUnrated.textContent = unratedCount;
  }

  function renderSticksList() {
    const filtered = getFilteredSticks();

    // Toggle meta banner if in TOP or UNRATED view
    if (state.currentFilter === "TOP") {
      el.listMeta.style.display = "flex";
      el.metaText.textContent = `Рейтинг пары от высшего к низшему (${filtered.length} вкусов)`;
    } else if (state.currentFilter === "UNRATED") {
      el.listMeta.style.display = "flex";
      el.metaText.textContent = `Осталось продегустировать: ${filtered.length} вкусов`;
    } else {
      el.listMeta.style.display = "none";
    }

    // Handle Empty State
    if (filtered.length === 0) {
      el.sticksGrid.innerHTML = "";
      el.emptyState.style.display = "flex";
      return;
    }
    el.emptyState.style.display = "none";

    // Build Cards HTML
    const isTopMode = state.currentFilter === "TOP";
    const cardsHtml = filtered.map((stick, index) => {
      const scores = stick.scores || calcStickScores(stick.id);

      // Rank medal for TOP mode
      let rankHtml = "";
      if (isTopMode) {
        const rankNum = index + 1;
        let rankClass = "rank-other";
        let rankContent = `#${rankNum}`;
        if (rankNum === 1) { rankClass = "rank-1"; rankContent = "🥇"; }
        else if (rankNum === 2) { rankClass = "rank-2"; rankContent = "🥈"; }
        else if (rankNum === 3) { rankClass = "rank-3"; rankContent = "🥉"; }

        rankHtml = `<div class="rank-badge ${rankClass}">${rankContent}</div>`;
      }

      // Notes Chips
      const notesHtml = (stick.notes || [])
        .slice(0, 3)
        .map(n => `<span class="note-chip">${escapeHtml(n)}</span>`)
        .join("");

      // User tasting comment snippet
      const userNoteHtml = scores.notes
        ? `<div class="card-user-note">💬 ${escapeHtml(scores.notes)}</div>`
        : "";

      // Scores column
      let scoreBadgeHtml = "";
      if (scores.isRated) {
        const u1Text = scores.u1Avg !== null ? scores.u1Avg.toFixed(1) : "—";
        const u2Text = scores.u2Avg !== null ? scores.u2Avg.toFixed(1) : "—";
        const mutualText = scores.mutual !== null ? scores.mutual.toFixed(1) : "—";

        scoreBadgeHtml = `
          <div class="card-mutual-score" title="Общий балл пары: ${mutualText}">
            <span class="card-mutual-icon">💜</span>
            <span class="card-score-num">${mutualText}</span>
          </div>
          <div class="card-subscores">
            <span class="mini-score-u1" title="Андрей: ${u1Text}">🧔 ${u1Text}</span>
            <span class="mini-score-divider">•</span>
            <span class="mini-score-u2" title="Катя: ${u2Text}">👩 ${u2Text}</span>
          </div>
        `;
      } else {
        scoreBadgeHtml = `
          <div class="card-unrated-btn">
            <span>+ Оценить</span>
          </div>
        `;
      }

      const brandClass = stick.brand === "HEETS" ? "brand-heets" : "brand-fiit";
      const capsuleDot = stick.hasCapsule ? `<span class="capsule-dot" title="С капсулой">🔘</span>` : "";
      const categoryTag = stick.category ? `<span class="card-category-badge">${escapeHtml(stick.category)}</span>` : "";

      return `
        <article class="stick-card" data-id="${stick.id}" style="--card-accent-grad: ${stick.colorGrad}; --swatch-shadow: ${stick.color}40">
          ${rankHtml}
          <div class="card-swatch" style="background: ${stick.colorGrad}"></div>
          <div class="card-details">
            <div class="card-title-row">
              <span class="brand-badge ${brandClass}">${stick.brand}</span>
              ${categoryTag}
              ${capsuleDot}
              <h3 class="card-stick-name">${escapeHtml(stick.name)}</h3>
            </div>
            <div class="card-desc-line">${escapeHtml(stick.desc || "")}</div>
            <div class="card-notes-row">
              ${notesHtml}
            </div>
            ${userNoteHtml}
          </div>
          <div class="card-scores-col">
            ${scoreBadgeHtml}
          </div>
        </article>
      `;
    }).join("");

    el.sticksGrid.innerHTML = cardsHtml;
  }

  // ==========================================================================
  // Rating Bottom Sheet Logic
  // ==========================================================================

  function openRatingSheet(stickId) {
    const stick = state.sticks.find(s => s.id === stickId);
    if (!stick) return;

    state.activeStickId = stickId;
    state.activeTaster = "u1"; // default to Andrey, or retain last

    // Copy existing rating into edit buffer
    const current = state.ratings[stickId] || {};
    state.editBuffer = {
      u1: current.u1 ? { ...current.u1 } : {},
      u2: current.u2 ? { ...current.u2 } : {},
      notes: current.notes || ""
    };

    // Populate Sheet Header
    el.sheetColorStrip.style.setProperty("--sheet-color", stick.color);
    el.sheetBrandBadge.textContent = stick.brand;
    el.sheetBrandBadge.className = `sheet-brand-badge ${stick.brand === "HEETS" ? "brand-heets" : "brand-fiit"}`;
    if (el.sheetCategoryBadge) {
      el.sheetCategoryBadge.textContent = stick.category || "";
      el.sheetCategoryBadge.style.display = stick.category ? "inline-block" : "none";
    }
    el.sheetCapsuleBadge.style.display = stick.hasCapsule ? "inline-block" : "none";
    el.sheetStickName.textContent = stick.name;
    el.sheetStickDesc.textContent = stick.desc;

    // Render notes pills
    el.sheetNotesList.innerHTML = (stick.notes || [])
      .map(n => `<span class="sheet-note-item">${escapeHtml(n)}</span>`)
      .join("");

    // Populate notes textarea
    el.stickCommentInput.value = state.editBuffer.notes;

    // Render criteria & scores
    updateTasterTabUI();
    renderCriteriaControls();
    updateSheetScoresDisplay();

    // Show Bottom Sheet
    el.rateBackdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeRatingSheet() {
    el.rateBackdrop.classList.remove("active");
    document.body.style.overflow = "";
    state.activeStickId = null;
  }

  function switchTaster(taster) {
    state.activeTaster = taster;
    updateTasterTabUI();
    renderCriteriaControls();
  }

  function updateTasterTabUI() {
    el.tabU1.classList.toggle("active", state.activeTaster === "u1");
    el.tabU2.classList.toggle("active", state.activeTaster === "u2");
    el.tabBoth.classList.toggle("active", state.activeTaster === "both");

    const scores = calcBufferScores();
    el.tabAvgU1.textContent = scores.u1Avg !== null ? scores.u1Avg.toFixed(1) : "—";
    el.tabAvgU2.textContent = scores.u2Avg !== null ? scores.u2Avg.toFixed(1) : "—";
    el.tabAvgBoth.textContent = scores.mutual !== null ? scores.mutual.toFixed(1) : "—";

    // Set container active state class for accent coloring
    if (state.activeTaster === "u1") {
      el.criteriaContainer.className = "criteria-container taster-u1-active";
    } else if (state.activeTaster === "u2") {
      el.criteriaContainer.className = "criteria-container taster-u2-active";
    } else {
      el.criteriaContainer.className = "criteria-container taster-both-active";
    }
  }

  function renderCriteriaControls() {
    if (state.activeTaster === "both") {
      renderDualCriteriaControls();
      return;
    }

    const taster = state.activeTaster; // 'u1' or 'u2'
    const tasterName = taster === "u1" ? "Андрей 🧔" : "Катя 👩";
    const currentScores = state.editBuffer[taster] || {};

    const html = CRITERIA.map(crit => {
      const currentVal = (currentScores[crit.id] !== undefined && currentScores[crit.id] !== null)
        ? currentScores[crit.id]
        : null;
      const scoreBadgeText = currentVal !== null ? `${currentVal} / 5` : "Не оценено";
      const scoredClass = currentVal !== null ? "scored" : "";

      const buttonsHtml = [0, 1, 2, 3, 4, 5].map(num => {
        const isActive = currentVal === num ? "active" : "";
        return `
          <button type="button" class="score-pill-btn ${isActive}" data-crit="${crit.id}" data-score="${num}">
            <span class="score-pill-num">${num}</span>
            <span class="score-pill-sub">${getScoreShortLabel(num)}</span>
          </button>
        `;
      }).join("");

      return `
        <div class="criterion-card" data-crit-id="${crit.id}">
          <div class="criterion-head">
            <div class="criterion-info">
              <span class="criterion-icon">${crit.icon}</span>
              <div class="criterion-title-wrap">
                <span class="criterion-title">${crit.name}</span>
                <span class="criterion-desc">${crit.desc}</span>
              </div>
            </div>
            <span class="criterion-score-badge ${scoredClass}" id="badge-${crit.id}">${scoreBadgeText}</span>
          </div>
          <div class="scores-selector">
            ${buttonsHtml}
          </div>
        </div>
      `;
    }).join("");

    el.criteriaContainer.innerHTML = html;
  }

  function renderDualCriteriaControls() {
    // Mode "Вместе" (Both): shows both Andrey and Katya mini selectors side by side
    const u1Scores = state.editBuffer.u1 || {};
    const u2Scores = state.editBuffer.u2 || {};

    const html = CRITERIA.map(crit => {
      const u1Val = (u1Scores[crit.id] !== undefined && u1Scores[crit.id] !== null) ? u1Scores[crit.id] : null;
      const u2Val = (u2Scores[crit.id] !== undefined && u2Scores[crit.id] !== null) ? u2Scores[crit.id] : null;

      const u1Buttons = [0, 1, 2, 3, 4, 5].map(num => `
        <button type="button" class="both-mini-btn ${u1Val === num ? "active-u1" : ""}" data-dual-taster="u1" data-crit="${crit.id}" data-score="${num}">
          ${num}
        </button>
      `).join("");

      const u2Buttons = [0, 1, 2, 3, 4, 5].map(num => `
        <button type="button" class="both-mini-btn ${u2Val === num ? "active-u2" : ""}" data-dual-taster="u2" data-crit="${crit.id}" data-score="${num}">
          ${num}
        </button>
      `).join("");

      return `
        <div class="criterion-card" data-crit-id="${crit.id}">
          <div class="criterion-head">
            <div class="criterion-info">
              <span class="criterion-icon">${crit.icon}</span>
              <div class="criterion-title-wrap">
                <span class="criterion-title">${crit.name}</span>
                <span class="criterion-desc">${crit.short}</span>
              </div>
            </div>
          </div>
          <div class="both-mode-row">
            <div class="both-user-subrow">
              <span class="both-user-tag both-tag-u1">🧔 Андрей:</span>
              <div class="both-scores-grid">${u1Buttons}</div>
            </div>
            <div class="both-user-subrow">
              <span class="both-user-tag both-tag-u2">👩 Катя:</span>
              <div class="both-scores-grid">${u2Buttons}</div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    el.criteriaContainer.innerHTML = html;
  }

  function getScoreShortLabel(score) {
    switch (score) {
      case 0: return "Нет";
      case 1: return "Плохо";
      case 2: return "Слабо";
      case 3: return "Норм";
      case 4: return "Хорошо";
      case 5: return "Топ";
      default: return "";
    }
  }

  function handleScoreSelect(taster, critId, scoreNum) {
    if (!state.editBuffer[taster]) {
      state.editBuffer[taster] = {};
    }

    // Toggle score if tapped again
    if (state.editBuffer[taster][critId] === scoreNum) {
      delete state.editBuffer[taster][critId];
    } else {
      state.editBuffer[taster][critId] = scoreNum;
    }

    // Re-render controls to reflect state
    if (state.activeTaster === "both") {
      renderDualCriteriaControls();
    } else {
      renderCriteriaControls();
    }

    updateTasterTabUI();
    updateSheetScoresDisplay();
  }

  function updateSheetScoresDisplay() {
    const scores = calcBufferScores();
    el.sheetSummaryU1.textContent = scores.u1Avg !== null ? scores.u1Avg.toFixed(1) : "—";
    el.sheetSummaryU2.textContent = scores.u2Avg !== null ? scores.u2Avg.toFixed(1) : "—";
    el.sheetSummaryMutual.textContent = scores.mutual !== null ? scores.mutual.toFixed(1) : "—";
  }

  function saveCurrentStickRating() {
    if (!state.activeStickId) return;

    // Get notes
    state.editBuffer.notes = el.stickCommentInput.value.trim();

    // Check if any rating was actually given
    const u1Has = Object.keys(state.editBuffer.u1).length > 0;
    const u2Has = Object.keys(state.editBuffer.u2).length > 0;
    const hasNotes = state.editBuffer.notes.length > 0;

    if (!u1Has && !u2Has && !hasNotes) {
      delete state.ratings[state.activeStickId];
    } else {
      state.ratings[state.activeStickId] = {
        u1: { ...state.editBuffer.u1 },
        u2: { ...state.editBuffer.u2 },
        notes: state.editBuffer.notes,
        updatedAt: new Date().toISOString()
      };
    }

    saveRatings();
    updateFilterCounts();
    renderSticksList();
    closeRatingSheet();
    showToast("Оценка сохранена ✨");
  }

  function resetCurrentStickRating() {
    if (!state.activeStickId) return;
    if (confirm("Очистить оценки этого стика для Андрея и Кати?")) {
      delete state.ratings[state.activeStickId];
      saveRatings();
      updateFilterCounts();
      renderSticksList();
      closeRatingSheet();
      showToast("Оценки сброшены");
    }
  }

  // ==========================================================================
  // Options, Export/Import & Stats
  // ==========================================================================

  function openMenuModal() {
    // Calculate Pair Stats
    let tasted = 0;
    let highestScore = -1;
    let favoriteStickName = "—";

    state.sticks.forEach(s => {
      const sc = calcStickScores(s.id);
      if (sc.isRated) {
        tasted++;
        if (sc.mutual !== null && sc.mutual > highestScore) {
          highestScore = sc.mutual;
          favoriteStickName = s.name;
        }
      }
    });

    el.statTastedCount.textContent = tasted;
    el.statRemainingCount.textContent = Math.max(0, state.sticks.length - tasted);
    el.statFavoriteTaste.textContent = favoriteStickName;

    el.menuBackdrop.classList.add("active");
  }

  function closeMenuModal() {
    el.menuBackdrop.classList.remove("active");
  }

  function exportRatingsJson() {
    const dataStr = JSON.stringify(state.ratings, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stixlab-ratings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Also attempt copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(dataStr).then(() => {
        showToast("JSON сохранён и скопирован!");
      }).catch(() => {
        showToast("Файл JSON сохранён!");
      });
    } else {
      showToast("Файл JSON сохранён!");
    }
  }

  function importRatingsJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (typeof parsed === "object" && parsed !== null) {
          state.ratings = parsed;
          saveRatings();
          updateFilterCounts();
          renderSticksList();
          closeMenuModal();
          showToast("Оценки успешно загружены!");
        } else {
          alert("Неверный формат JSON файла.");
        }
      } catch (err) {
        alert("Ошибка чтения JSON файла: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function resetToDefaults() {
    if (confirm("Восстановить демонстрационные оценки? Ваши текущие изменения будут заменены.")) {
      state.ratings = JSON.parse(JSON.stringify(INITIAL_DEMO_RATINGS || {}));
      saveRatings();
      updateFilterCounts();
      renderSticksList();
      closeMenuModal();
      showToast("Восстановлены образцы оценок");
    }
  }

  // ==========================================================================
  // Toast Helper
  // ==========================================================================

  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    el.toastMessage.textContent = msg;
    el.toastNotice.classList.add("show");
    toastTimer = setTimeout(() => {
      el.toastNotice.classList.remove("show");
    }, 2400);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ==========================================================================
  // Event Listeners Setup
  // ==========================================================================

  function setupEventListeners() {
    // Search input events
    el.searchInput.addEventListener("input", e => {
      state.searchQuery = e.target.value;
      el.clearSearchBtn.style.display = state.searchQuery ? "flex" : "none";
      renderSticksList();
    });

    el.clearSearchBtn.addEventListener("click", () => {
      state.searchQuery = "";
      el.searchInput.value = "";
      el.clearSearchBtn.style.display = "none";
      el.searchInput.focus();
      renderSticksList();
    });

    el.resetSearchBtn.addEventListener("click", () => {
      state.searchQuery = "";
      state.currentFilter = "ALL";
      el.searchInput.value = "";
      el.clearSearchBtn.style.display = "none";
      el.filterTabs.forEach(t => t.classList.toggle("active", t.dataset.filter === "ALL"));
      renderSticksList();
    });

    // Filter bar tab clicks
    el.filterNav.addEventListener("click", e => {
      const tab = e.target.closest(".filter-tab");
      if (!tab) return;
      el.filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      state.currentFilter = tab.dataset.filter;
      renderSticksList();
    });

    // Sticks list clicks (delegate card tap)
    el.sticksGrid.addEventListener("click", e => {
      const card = e.target.closest(".stick-card");
      if (!card) return;
      const stickId = card.dataset.id;
      if (stickId) {
        openRatingSheet(stickId);
      }
    });

    // Bottom Sheet Controls
    el.closeSheetBtn.addEventListener("click", closeRatingSheet);
    el.rateBackdrop.addEventListener("click", e => {
      if (e.target === el.rateBackdrop) {
        closeRatingSheet();
      }
    });

    // Taster Tab Switcher
    el.tabU1.addEventListener("click", () => switchTaster("u1"));
    el.tabU2.addEventListener("click", () => switchTaster("u2"));
    el.tabBoth.addEventListener("click", () => switchTaster("both"));

    // Criteria button tap (event delegation)
    el.criteriaContainer.addEventListener("click", e => {
      // Single taster mode button
      const scoreBtn = e.target.closest(".score-pill-btn");
      if (scoreBtn) {
        const critId = scoreBtn.dataset.crit;
        const score = parseInt(scoreBtn.dataset.score, 10);
        handleScoreSelect(state.activeTaster, critId, score);
        return;
      }

      // Dual mode button
      const dualBtn = e.target.closest(".both-mini-btn");
      if (dualBtn) {
        const taster = dualBtn.dataset.dualTaster;
        const critId = dualBtn.dataset.crit;
        const score = parseInt(dualBtn.dataset.score, 10);
        handleScoreSelect(taster, critId, score);
        return;
      }
    });

    // Sheet Save & Reset
    el.btnSaveStickRating.addEventListener("click", saveCurrentStickRating);
    el.btnResetStickRating.addEventListener("click", resetCurrentStickRating);

    // Menu Modal
    el.btnOpenMenu.addEventListener("click", openMenuModal);
    el.closeMenuBtn.addEventListener("click", closeMenuModal);
    el.menuBackdrop.addEventListener("click", e => {
      if (e.target === el.menuBackdrop) {
        closeMenuModal();
      }
    });

    el.btnExportJson.addEventListener("click", exportRatingsJson);
    el.btnImportJson.addEventListener("click", () => el.fileImportInput.click());
    el.fileImportInput.addEventListener("change", e => {
      if (e.target.files && e.target.files[0]) {
        importRatingsJson(e.target.files[0]);
      }
    });
    el.btnResetToDefaults.addEventListener("click", resetToDefaults);

    // Keyboard shortcuts (Escape closes modals)
    window.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        if (el.rateBackdrop.classList.contains("active")) closeRatingSheet();
        if (el.menuBackdrop.classList.contains("active")) closeMenuModal();
      }
    });

    // Swipe down to dismiss Bottom Sheet on mobile
    let touchStartY = 0;
    el.sheetHandle.addEventListener("touchstart", e => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    el.sheetHandle.addEventListener("touchend", e => {
      const touchEndY = e.changedTouches[0].clientY;
      if (touchEndY - touchStartY > 60) {
        closeRatingSheet();
      }
    }, { passive: true });
  }

  // Run on DOM Ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
