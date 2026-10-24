// ==========================================================================
// STIX LAB — Application Controller & Reactive State
// Redesigned for Andrey & Katya with iOS 27 Liquid Glass
// ==========================================================================

(function () {
  "use strict";

  // Storage Keys
  const STORAGE_KEY = "iqos_stixlab_v3_ratings";
  const THEME_STORAGE_KEY = "iqos_stixlab_theme";

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
    },
    currentTheme: "dark" // 'dark' | 'light'
  };

  // DOM Elements Cache
  const el = {
    // Branding & Header
    btnToggleTheme: document.getElementById("btnToggleTheme"),
    btnOpenMenu: document.getElementById("btnOpenMenu"),
    searchInput: document.getElementById("searchInput"),
    clearSearchBtn: document.getElementById("clearSearchBtn"),
    filterNav: document.getElementById("filterNav"),
    filterTabs: document.querySelectorAll(".filter-tab"),
    countAll: document.getElementById("countAll"),
    countHeets: document.getElementById("countHeets"),
    countFiit: document.getElementById("countFiit"),
    countTop: document.getElementById("countTop"),
    countUnrated: document.getElementById("countUnrated"),
    heroDashboard: document.getElementById("heroDashboard"),
    listMeta: document.getElementById("listMeta"),
    metaText: document.getElementById("metaText"),

    // Main Grid & Empty State
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
    criteriaComparisonStrip: document.getElementById("criteriaComparisonStrip"),

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

    // Menu / Analytics Modal
    menuBackdrop: document.getElementById("menuBackdrop"),
    menuModal: document.getElementById("menuModal"),
    closeMenuBtn: document.getElementById("closeMenuBtn"),
    statTastedCount: document.getElementById("statTastedCount"),
    statRemainingCount: document.getElementById("statRemainingCount"),
    statFavoriteTaste: document.getElementById("statFavoriteTaste"),
    statAgreementVal: document.getElementById("statAgreementVal"),
    statAgreementBar: document.getElementById("statAgreementBar"),
    themeSegmented: document.getElementById("themeSegmented"),
    btnExportJson: document.getElementById("btnExportJson"),
    btnImportJson: document.getElementById("btnImportJson"),
    fileImportInput: document.getElementById("fileImportInput"),
    btnResetToDefaults: document.getElementById("btnResetToDefaults"),

    // Toast
    toastNotice: document.getElementById("toastNotice"),
    toastMessage: document.getElementById("toastMessage")
  };

  // ==========================================================================
  // Initialization & Theme Setup
  // ==========================================================================

  function init() {
    initTheme();
    loadRatings();
    setupEventListeners();
    updateFilterCounts();
    renderHeroDashboard();
    renderSticksList();
    handleUrlHash();
  }

  function initTheme() {
    let savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (!savedTheme) {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
        savedTheme = "light";
      } else {
        savedTheme = "dark";
      }
    }
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    state.currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // Update meta theme color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", theme === "light" ? "#F4F4F7" : "#070709");
    }

    // Toggle icons in header button
    if (el.btnToggleTheme) {
      const darkIcon = el.btnToggleTheme.querySelector(".theme-icon-dark");
      const lightIcon = el.btnToggleTheme.querySelector(".theme-icon-light");
      if (darkIcon && lightIcon) {
        darkIcon.style.display = theme === "light" ? "block" : "none";
        lightIcon.style.display = theme === "light" ? "none" : "block";
      }
    }

    // Update segmented theme control in modal
    if (el.themeSegmented) {
      const buttons = el.themeSegmented.querySelectorAll(".theme-seg-btn");
      buttons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.themeVal === theme);
      });
    }
  }

  function toggleTheme() {
    const next = state.currentTheme === "dark" ? "light" : "dark";
    setTheme(next);
    showToast(next === "light" ? "Включена светлая тема ☀️" : "Включена тёмная тема 🌙");
  }

  // ==========================================================================
  // Storage & Ratings Loading
  // ==========================================================================

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
  // Calculations (Averages, Mutual Scores & Divergence)
  // ==========================================================================

  function calcUserAverage(userScores) {
    if (!userScores) return null;
    const values = Object.values(userScores).filter(v => typeof v === "number" && v >= 0 && v <= 5);
    if (values.length === 0) return null;
    const sum = values.reduce((acc, cur) => acc + cur, 0);
    return Math.round((sum / values.length) * 10) / 10;
  }

  function calcStickScores(stickId) {
    const r = state.ratings[stickId];
    if (!r) {
      return { u1Avg: null, u2Avg: null, mutual: null, diff: 0, isRated: false, notes: "" };
    }
    const u1Avg = calcUserAverage(r.u1);
    const u2Avg = calcUserAverage(r.u2);

    let mutual = null;
    let diff = 0;
    if (u1Avg !== null && u2Avg !== null) {
      mutual = Math.round(((u1Avg + u2Avg) / 2) * 10) / 10;
      diff = Math.round(Math.abs(u1Avg - u2Avg) * 10) / 10;
    } else if (u1Avg !== null) {
      mutual = u1Avg;
    } else if (u2Avg !== null) {
      mutual = u2Avg;
    }

    return {
      u1Avg,
      u2Avg,
      mutual,
      diff,
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
  // Hero Dashboard Rendering (Pair #1, Favorites & Split)
  // ==========================================================================

  function renderHeroDashboard() {
    if (!el.heroDashboard) return;

    // Show Hero Dashboard only in 'ALL' view with no active search query
    if (state.currentFilter !== "ALL" || state.searchQuery.trim().length > 0) {
      el.heroDashboard.style.display = "none";
      return;
    }

    // Compute key tasting metrics
    const ratedSticks = state.sticks
      .map(s => ({ ...s, scores: calcStickScores(s.id) }))
      .filter(s => s.scores.isRated);

    if (ratedSticks.length === 0) {
      el.heroDashboard.style.display = "none";
      return;
    }

    // 1. Overall Best (Mutual Top)
    const sortedMutual = [...ratedSticks].sort((a, b) => (b.scores.mutual || 0) - (a.scores.mutual || 0));
    const bestMutual = sortedMutual[0];

    // 2. Andrey's Favorite
    const sortedU1 = [...ratedSticks]
      .filter(s => s.scores.u1Avg !== null)
      .sort((a, b) => (b.scores.u1Avg || 0) - (a.scores.u1Avg || 0));
    const bestU1 = sortedU1[0];

    // 3. Katya's Favorite
    const sortedU2 = [...ratedSticks]
      .filter(s => s.scores.u2Avg !== null)
      .sort((a, b) => (b.scores.u2Avg || 0) - (a.scores.u2Avg || 0));
    const bestU2 = sortedU2[0];

    // 4. Taste Split / Divergence (where Andrey and Katya differed the most)
    const splitSticks = [...ratedSticks]
      .filter(s => s.scores.u1Avg !== null && s.scores.u2Avg !== null)
      .sort((a, b) => b.scores.diff - a.scores.diff);
    const maxSplit = splitSticks.length > 0 && splitSticks[0].scores.diff >= 1.0 ? splitSticks[0] : null;

    // 5. Tasting Progress
    const totalSticks = state.sticks.length;
    const tastedCount = ratedSticks.length;
    const progressPct = Math.round((tastedCount / totalSticks) * 100);

    // Build Hero Card HTML
    const bestMutualScore = bestMutual.scores.mutual !== null ? bestMutual.scores.mutual.toFixed(1) : "—";
    const bestU1Score = bestMutual.scores.u1Avg !== null ? bestMutual.scores.u1Avg.toFixed(1) : "—";
    const bestU2Score = bestMutual.scores.u2Avg !== null ? bestMutual.scores.u2Avg.toFixed(1) : "—";

    let miniGridHtml = "";
    if (bestU1 || bestU2 || maxSplit) {
      const u1Html = bestU1 ? `
        <div class="hero-mini-card" data-hero-stick="${bestU1.id}" title="Личный фаворит Андрея">
          <div class="mini-card-head head-andrey">
            <span class="avatar-dot avatar-andrey avatar-mini">A</span>
            <span>Фаворит Андрея</span>
          </div>
          <div class="mini-stick-name">${escapeHtml(bestU1.name)}</div>
          <div class="mini-score-line">Балл: <strong class="tnum">${bestU1.scores.u1Avg.toFixed(1)}</strong></div>
        </div>
      ` : "";

      const u2Html = bestU2 ? `
        <div class="hero-mini-card" data-hero-stick="${bestU2.id}" title="Личный фаворит Кати">
          <div class="mini-card-head head-katya">
            <span class="avatar-dot avatar-katya avatar-mini">K</span>
            <span>Фаворит Кати</span>
          </div>
          <div class="mini-stick-name">${escapeHtml(bestU2.name)}</div>
          <div class="mini-score-line">Балл: <strong class="tnum">${bestU2.scores.u2Avg.toFixed(1)}</strong></div>
        </div>
      ` : "";

      const splitHtml = maxSplit ? `
        <div class="hero-mini-card" data-hero-stick="${maxSplit.id}" title="Стик с наибольшим расхождением мнений пары">
          <div class="mini-card-head head-diverge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            <span>Контраст мнений</span>
          </div>
          <div class="mini-stick-name">${escapeHtml(maxSplit.name)}</div>
          <div class="mini-score-line">Разница: <strong class="tnum">±${maxSplit.scores.diff.toFixed(1)}</strong></div>
        </div>
      ` : (bestMutual ? `
        <div class="hero-mini-card" data-hero-stick="${bestMutual.id}" title="Главный общий лидер">
          <div class="mini-card-head" style="color: var(--color-mutual);">
            <span>🏆 Лидер пары</span>
          </div>
          <div class="mini-stick-name">${escapeHtml(bestMutual.name)}</div>
          <div class="mini-score-line">Итог: <strong class="tnum">${bestMutualScore}</strong></div>
        </div>
      ` : "");

      miniGridHtml = `
        <div class="hero-mini-grid">
          ${u1Html}
          ${u2Html}
          ${splitHtml}
        </div>
      `;
    }

    el.heroDashboard.innerHTML = `
      <div class="hero-top-card" data-hero-stick="${bestMutual.id}" style="--hero-accent-grad: ${bestMutual.colorGrad};" title="Нажмите для открытия подробностей">
        <div class="hero-top-info">
          <div class="hero-kicker-row">
            <span class="hero-kicker-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Выбор пары №1
            </span>
            <span class="brand-badge ${bestMutual.brand === "HEETS" ? "brand-heets" : "brand-fiit"}">${bestMutual.brand}</span>
          </div>
          <h2 class="hero-title">${escapeHtml(bestMutual.name)}</h2>
          <p class="hero-desc">${escapeHtml(bestMutual.desc || "")}</p>
        </div>
        <div class="hero-score-badge">
          <span class="hero-score-label">Общий</span>
          <span class="hero-score-val">${bestMutualScore}</span>
          <div class="hero-subscores">
            <span style="color: var(--color-andrey);">A ${bestU1Score}</span>
            <span style="color: var(--text-tertiary);">•</span>
            <span style="color: var(--color-katya);">K ${bestU2Score}</span>
          </div>
        </div>
      </div>

      ${miniGridHtml}

      <div class="hero-progress-card">
        <div class="progress-text-group">
          <span>Прогресс дегустации:</span>
          <strong class="tnum" style="color: var(--text-primary);">${tastedCount} из ${totalSticks} (${progressPct}%)</strong>
        </div>
        <div class="progress-track-mini">
          <div class="progress-fill-mini" style="width: ${progressPct}%;"></div>
        </div>
      </div>
    `;

    el.heroDashboard.style.display = "flex";
  }

  // ==========================================================================
  // Filtering & Rendering Sticks Collection
  // ==========================================================================

  function getFilteredSticks() {
    let list = [...state.sticks];

    // Filter by Brand / Top / Unrated
    if (state.currentFilter === "HEETS") {
      list = list.filter(s => s.brand === "HEETS");
    } else if (state.currentFilter === "FIIT") {
      list = list.filter(s => s.brand === "FIIT");
    } else if (state.currentFilter === "TOP") {
      list = list
        .map(s => ({ ...s, scores: calcStickScores(s.id) }))
        .filter(s => s.scores.isRated)
        .sort((a, b) => (b.scores.mutual || 0) - (a.scores.mutual || 0));
      return applySearchFilter(list);
    } else if (state.currentFilter === "UNRATED") {
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
        ? `<div class="card-user-note">
             <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
             <span>${escapeHtml(scores.notes)}</span>
           </div>`
        : "";

      // Scores column
      let scoreBadgeHtml = "";
      if (scores.isRated) {
        const u1Text = scores.u1Avg !== null ? scores.u1Avg.toFixed(1) : "—";
        const u2Text = scores.u2Avg !== null ? scores.u2Avg.toFixed(1) : "—";
        const mutualText = scores.mutual !== null ? scores.mutual.toFixed(1) : "—";

        // Difference indicator if scores disagree by >= 1.5
        const diffHtml = scores.diff >= 1.5
          ? `<span class="split-indicator-tag" title="Расхождение мнений: ${scores.diff.toFixed(1)}">⚡ ±${scores.diff.toFixed(1)}</span>`
          : "";

        scoreBadgeHtml = `
          <div class="card-mutual-score" title="Общий балл пары: ${mutualText}">
            <span class="card-mutual-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </span>
            <span class="card-score-num">${mutualText}</span>
          </div>
          <div class="card-subscores">
            <span class="mini-score-u1" title="Андрей: ${u1Text}">A ${u1Text}</span>
            <span class="mini-score-divider">•</span>
            <span class="mini-score-u2" title="Катя: ${u2Text}">K ${u2Text}</span>
          </div>
          ${diffHtml}
        `;
      } else {
        scoreBadgeHtml = `
          <div class="card-unrated-btn">
            <span>+ Оценить</span>
          </div>
        `;
      }

      const brandClass = stick.brand === "HEETS" ? "brand-heets" : "brand-fiit";
      const capsuleDot = stick.hasCapsule
        ? `<span class="capsule-dot" title="С капсулой">
             <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>
           </span>`
        : "";
      const categoryTag = stick.category ? `<span class="card-category-badge">${escapeHtml(stick.category)}</span>` : "";

      return `
        <article class="stick-card" data-id="${stick.id}" style="--swatch-shadow: ${stick.color}40">
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
  // Rating Bottom Sheet Logic & Criteria Breakdown
  // ==========================================================================

  function openRatingSheet(stickId) {
    const stick = state.sticks.find(s => s.id === stickId);
    if (!stick) return;

    state.activeStickId = stickId;
    state.activeTaster = "u1";

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
    el.sheetCapsuleBadge.style.display = stick.hasCapsule ? "inline-flex" : "none";
    el.sheetStickName.textContent = stick.name;
    el.sheetStickDesc.textContent = stick.desc;

    // Render notes pills
    el.sheetNotesList.innerHTML = (stick.notes || [])
      .map(n => `<span class="sheet-note-item">${escapeHtml(n)}</span>`)
      .join("");

    // Populate notes textarea
    el.stickCommentInput.value = state.editBuffer.notes;

    // Render criteria breakdown strip (if rated by both)
    renderCriteriaComparisonStrip();

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
    if (window.location.hash.startsWith("#stick=")) {
      history.replaceState(null, "", window.location.pathname);
    }
  }

  function renderCriteriaComparisonStrip() {
    if (!el.criteriaComparisonStrip) return;

    const u1Scores = state.editBuffer.u1 || {};
    const u2Scores = state.editBuffer.u2 || {};
    const hasU1 = Object.keys(u1Scores).length > 0;
    const hasU2 = Object.keys(u2Scores).length > 0;

    if (!hasU1 && !hasU2) {
      el.criteriaComparisonStrip.style.display = "none";
      return;
    }

    const rowsHtml = CRITERIA.map(crit => {
      const u1Val = u1Scores[crit.id] !== undefined ? u1Scores[crit.id] : 0;
      const u2Val = u2Scores[crit.id] !== undefined ? u2Scores[crit.id] : 0;
      const u1Pct = (u1Val / 5) * 100;
      const u2Pct = (u2Val / 5) * 100;

      return `
        <div class="strip-row">
          <span class="strip-label">${crit.short}</span>
          <div class="strip-bars">
            <div class="strip-bar-track" title="Андрей: ${u1Val}/5">
              <div class="strip-bar-fill-u1" style="width: ${u1Pct}%;"></div>
            </div>
            <div class="strip-bar-track" title="Катя: ${u2Val}/5">
              <div class="strip-bar-fill-u2" style="width: ${u2Pct}%;"></div>
            </div>
          </div>
          <span class="tnum" style="font-size: 10px; font-weight: 700; color: var(--text-tertiary); width: 34px; text-align: right;">
            ${u1Val}/${u2Val}
          </span>
        </div>
      `;
    }).join("");

    el.criteriaComparisonStrip.innerHTML = rowsHtml;
    el.criteriaComparisonStrip.style.display = "flex";
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
              <span class="both-user-tag both-tag-u1">
                <span class="avatar-dot avatar-andrey avatar-mini">A</span>
                Андрей:
              </span>
              <div class="both-scores-grid">${u1Buttons}</div>
            </div>
            <div class="both-user-subrow">
              <span class="both-user-tag both-tag-u2">
                <span class="avatar-dot avatar-katya avatar-mini">K</span>
                Катя:
              </span>
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
      case 1: return "Слабо";
      case 2: return "Норм";
      case 3: return "Хор";
      case 4: return "Ярко";
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

    renderCriteriaComparisonStrip();
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

    state.editBuffer.notes = el.stickCommentInput.value.trim();

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
    renderHeroDashboard();
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
      renderHeroDashboard();
      renderSticksList();
      closeRatingSheet();
      showToast("Оценки сброшены");
    }
  }

  // ==========================================================================
  // Options, Analytics & Sync Modal
  // ==========================================================================

  function openMenuModal() {
    let tasted = 0;
    let highestScore = -1;
    let favoriteStickName = "—";
    let closePairs = 0;
    let bothRatedCount = 0;

    state.sticks.forEach(s => {
      const sc = calcStickScores(s.id);
      if (sc.isRated) {
        tasted++;
        if (sc.mutual !== null && sc.mutual > highestScore) {
          highestScore = sc.mutual;
          favoriteStickName = s.name;
        }
        if (sc.u1Avg !== null && sc.u2Avg !== null) {
          bothRatedCount++;
          if (sc.diff <= 0.8) {
            closePairs++;
          }
        }
      }
    });

    el.statTastedCount.textContent = tasted;
    el.statRemainingCount.textContent = Math.max(0, state.sticks.length - tasted);
    el.statFavoriteTaste.textContent = favoriteStickName;

    // Agreement percentage
    const agreementPct = bothRatedCount > 0 ? Math.round((closePairs / bothRatedCount) * 100) : 100;
    if (el.statAgreementVal && el.statAgreementBar) {
      el.statAgreementVal.textContent = `${agreementPct}%`;
      el.statAgreementBar.style.width = `${agreementPct}%`;
    }

    el.menuBackdrop.classList.add("active");
  }

  function closeMenuModal() {
    el.menuBackdrop.classList.remove("active");
    if (window.location.hash === "#menu") {
      history.replaceState(null, "", window.location.pathname);
    }
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
          renderHeroDashboard();
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
      renderHeroDashboard();
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
  // URL Hash Deep Linking
  // ==========================================================================

  function handleUrlHash() {
    const hash = window.location.hash;
    if (!hash) return;

    if (hash.includes("theme=light")) {
      setTheme("light");
    } else if (hash.includes("theme=dark")) {
      setTheme("dark");
    }

    if (hash.startsWith("#stick=") || hash.includes("stick=")) {
      const match = hash.match(/stick=([a-z0-9\-]+)/);
      if (match) {
        openRatingSheet(match[1]);
        if (hash.includes("taster=both")) {
          switchTaster("both");
        } else if (hash.includes("taster=u2")) {
          switchTaster("u2");
        }
      }
    } else if (hash === "#menu" || hash.includes("menu")) {
      openMenuModal();
    } else if (hash.startsWith("#filter=") || hash.includes("filter=")) {
      const match = hash.match(/filter=([A-Z]+)/);
      if (match) {
        const filter = match[1];
        const tab = Array.from(el.filterTabs).find(t => t.dataset.filter === filter);
        if (tab) {
          el.filterTabs.forEach(t => t.classList.remove("active"));
          tab.classList.add("active");
          state.currentFilter = filter;
          renderHeroDashboard();
          renderSticksList();
        }
      }
    }
  }

  // ==========================================================================
  // Event Listeners Setup
  // ==========================================================================

  function setupEventListeners() {
    // Theme Toggles
    if (el.btnToggleTheme) {
      el.btnToggleTheme.addEventListener("click", toggleTheme);
    }

    if (el.themeSegmented) {
      el.themeSegmented.addEventListener("click", e => {
        const btn = e.target.closest(".theme-seg-btn");
        if (!btn) return;
        setTheme(btn.dataset.themeVal);
      });
    }

    // Search events
    el.searchInput.addEventListener("input", e => {
      state.searchQuery = e.target.value;
      el.clearSearchBtn.style.display = state.searchQuery ? "flex" : "none";
      renderHeroDashboard();
      renderSticksList();
    });

    el.clearSearchBtn.addEventListener("click", () => {
      state.searchQuery = "";
      el.searchInput.value = "";
      el.clearSearchBtn.style.display = "none";
      el.searchInput.focus();
      renderHeroDashboard();
      renderSticksList();
    });

    el.resetSearchBtn.addEventListener("click", () => {
      state.searchQuery = "";
      state.currentFilter = "ALL";
      el.searchInput.value = "";
      el.clearSearchBtn.style.display = "none";
      el.filterTabs.forEach(t => t.classList.toggle("active", t.dataset.filter === "ALL"));
      renderHeroDashboard();
      renderSticksList();
    });

    // Filter bar tab clicks
    el.filterNav.addEventListener("click", e => {
      const tab = e.target.closest(".filter-tab");
      if (!tab) return;
      el.filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      state.currentFilter = tab.dataset.filter;
      renderHeroDashboard();
      renderSticksList();
    });

    // Hero Dashboard clicks (delegate card tap)
    if (el.heroDashboard) {
      el.heroDashboard.addEventListener("click", e => {
        const card = e.target.closest("[data-hero-stick]");
        if (card && card.dataset.heroStick) {
          openRatingSheet(card.dataset.heroStick);
        }
      });
    }

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
      const scoreBtn = e.target.closest(".score-pill-btn");
      if (scoreBtn) {
        const critId = scoreBtn.dataset.crit;
        const score = parseInt(scoreBtn.dataset.score, 10);
        handleScoreSelect(state.activeTaster, critId, score);
        return;
      }

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

    // Touch swipe down on handle bar to dismiss
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

    // Hash change event
    window.addEventListener("hashchange", handleUrlHash);
  }

  // Run on DOM Ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
