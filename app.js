document.addEventListener("DOMContentLoaded", () => {

  const state = {
    currentView: "dashboard",
    viewerNoteId: null,
    notesVisibleCount: 6,
    notesLoading: false,
    notesObserver: null
  };

  const el = id => document.getElementById(id);


  function loadDashboardCharts() {
     console.log("CHART FUNCTION CALLED");

    const categoryChart = document.getElementById("categoryChart");
    const overviewChart = document.getElementById("overviewChart");

    if (!categoryChart || !overviewChart) return;

    const notes = NotesManager.getAll();

    const activeNotes = notes.filter(note => !note.archived);


    /* =========================
       CATEGORY DATA
    ========================= */

    const categoryCount = {};

    activeNotes.forEach(note => {

      const category =
        note.category || "Uncategorized";

      categoryCount[category] =
        (categoryCount[category] || 0) + 1;

    });

    const categories =
      Object.entries(categoryCount);


    if (categories.length === 0) {

      categoryChart.innerHTML =
        `<div class="chart-empty">
          No category data yet.
        </div>`;

    } else {

      const maxValue = Math.max(
        ...categories.map(item => item[1])
      );

      categoryChart.innerHTML =
        categories.map(([name, count]) => {

          const percentage =
            (count / maxValue) * 100;

          return `
            <div class="bar-row">

              <div class="bar-info">

                <span>
                  ${escapeChartText(name)}
                </span>

                <strong>
                  ${count}
                </strong>

              </div>

              <div class="bar-track">

                <div
                  class="bar-fill"
                  style="width:${percentage}%">
                </div>

              </div>

            </div>
          `;

        }).join("");

    }


    /* =========================
       KNOWLEDGE OVERVIEW
    ========================= */

    const totalNotes =
      activeNotes.length;

    const favorites =
      activeNotes.filter(
        note => note.favorite
      ).length;

    const pinned =
      activeNotes.filter(
        note => note.pinned
      ).length;

    const archived =
      notes.filter(
        note => note.archived
      ).length;


    const overviewData = [
      ["Notes", totalNotes],
      ["Favorites", favorites],
      ["Pinned", pinned],
      ["Archived", archived]
    ];


    const maxOverview = Math.max(
      1,
      ...overviewData.map(item => item[1])
    );


    overviewChart.innerHTML =
      overviewData.map(([name, value]) => {

        const percentage =
          (value / maxOverview) * 100;

        return `
          <div class="overview-row">

            <div class="overview-label">

              <span>${name}</span>

              <strong>${value}</strong>

            </div>

            <div class="overview-track">

              <div
                class="overview-fill"
                style="width:${percentage}%">
              </div>

            </div>

          </div>
        `;

      }).join("");

  }


  function escapeChartText(text) {

    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }
  function seedDemoData() {
    if (NotesManager.getAll().length) return;

    const now = Date.now();
    const sampleNotes = [
      {
        id: Utils.createId(),
        title: "Welcome to MindVault",
        content: "MindVault helps you store notes, ideas, code snippets and references in one searchable place.\n\nTry creating, editing, favoriting, pinning and archiving notes.",
        category: "Getting Started",
        tags: ["welcome", "guide"],
        favorite: true,
        pinned: true,
        archived: false,
        createdAt: new Date(now - 86400000 * 2).toISOString(),
        updatedAt: new Date(now - 3600000).toISOString()
      },
      {
        id: Utils.createId(),
        title: "JavaScript LocalStorage",
        content: "LocalStorage stores key-value data in the browser. Data remains available even after refreshing or reopening the page.",
        category: "Programming",
        tags: ["javascript", "storage"],
        favorite: false,
        pinned: false,
        archived: false,
        createdAt: new Date(now - 86400000 * 4).toISOString(),
        updatedAt: new Date(now - 86400000).toISOString()
      }
    ];

    NotesManager.replaceAll(sampleNotes);
  }

  function setTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    const settings = StorageService.getSettings();
    settings.theme = theme;
    StorageService.saveSettings(settings);
    el("themeBtn").textContent = theme === "dark" ? "☀" : "☾";
  }

  function toggleTheme() {
    setTheme(document.body.classList.contains("dark") ? "light" : "dark");
  }

  function showView(view) {

    if (view === "notes" && state.currentView !== "notes") {
      resetNotesPagination();
    }

    state.currentView = view;

    document.querySelectorAll(".view-section")
        .forEach(section => {
            section.classList.remove("active");
        });

    document.querySelectorAll(".nav-item")
        .forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.view === view
            );
        });

    el(`${view}View`).classList.add("active");

    el("sidebar").classList.remove("open");

    renderAll();
}

  function openModal(id) {
    el(id).classList.add("show");
  }

  function closeModal(id) {
    el(id).classList.remove("show");
  }

  function syncTagDropdown() {
    const tagSelect = el("noteTags");
    const checkboxes = Array.from(document.querySelectorAll("#tagSelectMenu input[type='checkbox']"));
    const selected = checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);

    Array.from(tagSelect.options).forEach(option => {
      option.selected = selected.includes(option.value);
    });

    const label = el("tagSelectLabel");
    if (!selected.length) {
      label.textContent = "Select tags";
    } else if (selected.length === 1) {
      const checked = checkboxes.find(checkbox => checkbox.checked);
      label.textContent = checked ? checked.nextElementSibling.textContent.trim() : "1 tag selected";
    } else {
      label.textContent = `${selected.length} tags selected`;
    }
  }

  function setTagDropdown(tags = []) {
    const selectedTags = new Set(tags);
    document.querySelectorAll("#tagSelectMenu input[type='checkbox']").forEach(checkbox => {
      checkbox.checked = selectedTags.has(checkbox.value);
    });
    syncTagDropdown();
  }

  function syncCategoryDropdown() {
    const select = el("noteCategory");
    const label = el("categorySelectLabel");
    const options = Array.from(document.querySelectorAll("#categorySelectMenu .category-option"));
    const value = select?.value || "";

    options.forEach(option => {
      const selected = option.dataset.value === value;
      option.classList.toggle("selected", selected);
      option.setAttribute("aria-selected", String(selected));
    });

    const selectedOption = options.find(option => option.dataset.value === value);
    label.textContent = selectedOption ? selectedOption.textContent.trim() : "Select a category";
  }

  function setCategoryDropdown(category = "") {
    const select = el("noteCategory");
    if (select) select.value = category || "";
    syncCategoryDropdown();
  }

  function openNoteForm(note = null) {
    el("noteForm").reset();
    el("noteId").value = note?.id || "";
    el("noteTitle").value = note?.title || "";
    el("noteContent").value = note?.content || "";
    setCategoryDropdown(note?.category || "");
    setTagDropdown(note?.tags || []);
    el("noteFavorite").checked = Boolean(note?.favorite);
    el("notePinned").checked = Boolean(note?.pinned);
    el("modalTitle").textContent = note ? "Edit Note" : "Create New Note";
    el("tagSelect").classList.remove("open");
    el("tagSelectToggle").setAttribute("aria-expanded", "false");
    openModal("noteModal");
  }

  function noteCard(note) {
    const tags = (note.tags || []).slice(0, 4)
      .map(tag => `<span>#${Utils.escapeHTML(tag)}</span>`).join("");
    const extraTags = Math.max(0, (note.tags || []).length - 4);

    return `
      <article class="note-card ${note.pinned ? "pinned" : ""}">
        <div class="note-card-top">
          <span class="note-category">
            <span class="category-dot" aria-hidden="true"></span>
            ${Utils.escapeHTML(note.category || "Uncategorized")}
          </span>
          <span class="note-status">${note.favorite ? "★ Favorite" : ""}</span>
        </div>

        <div class="note-title-row">
          <div class="note-title-icon" aria-hidden="true">✦</div>
          <h3>${Utils.escapeHTML(note.title)}</h3>
        </div>

        <p class="note-excerpt">${Utils.escapeHTML(Utils.truncate(note.content, 180))}</p>

        <div class="note-tags">
          ${tags || `<span class="no-tags">No tags</span>`}
          ${extraTags ? `<span class="more-tags">+${extraTags}</span>` : ""}
        </div>

        <div class="note-footer">
          <div class="note-meta">
            <span class="note-meta-icon">↻</span>
            <small>Updated ${Utils.formatDate(note.updatedAt)}</small>
          </div>
          <div class="note-actions">
            <button title="View note" aria-label="View note" data-action="view" data-id="${note.id}">
              <span class="view-icon" aria-hidden="true"></span>
            </button>
            <button title="Favorite" aria-label="Favorite" data-action="favorite" data-id="${note.id}">${note.favorite ? "★" : "☆"}</button>
            <button title="Edit" aria-label="Edit" data-action="edit" data-id="${note.id}">✎</button>
            <button title="${note.archived ? "Restore" : "Archive"}" aria-label="${note.archived ? "Restore" : "Archive"}" data-action="archive" data-id="${note.id}">▣</button>
            <button title="Delete" aria-label="Delete" data-action="delete" data-id="${note.id}">×</button>
          </div>
        </div>
      </article>
    `;
  }

  function emptyState(targetId) {
    const states = {
      notesGrid: {
        icon: "✦",
        title: "No notes found",
        text: "Try another search or filter, or create a new note to start building your knowledge.",
        button: "+ Create Note"
      },
      favoritesGrid: {
        icon: "★",
        title: "No favorite notes yet",
        text: "Mark your most important notes as favorites and they will appear here.",
        button: "Browse Notes"
      },
      archiveGrid: {
        icon: "▣",
        title: "Your archive is empty",
        text: "Archived notes will stay here until you decide to restore them.",
        button: "View Notes"
      }
    };

    const item = states[targetId] || states.notesGrid;
    const action = targetId === "notesGrid" ? 'data-action="new-note"' : 'data-view-target="notes"';

    return `
      <div class="empty-state">
        <div class="empty-state-icon">${item.icon}</div>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
        <button class="primary-btn empty-state-btn" ${action}>${item.button}</button>
      </div>
    `;
  }

  function renderGrid(targetId, notes, useInfiniteScroll = false) {
    if (!useInfiniteScroll) {
      el(targetId).innerHTML = notes.length
        ? notes.map(noteCard).join("")
        : emptyState(targetId);
      return;
    }

    const grid = el(targetId);
    const visibleNotes = notes.slice(0, state.notesVisibleCount);
    const hasMore = visibleNotes.length < notes.length;

    if (!notes.length) {
      grid.innerHTML = emptyState(targetId);
      setupNotesObserver();
      return;
    }

    grid.innerHTML = visibleNotes.map(noteCard).join("");

    if (hasMore) {
      grid.insertAdjacentHTML("beforeend", `
        <div class="notes-load-sentinel" id="notesLoadSentinel" aria-live="polite">
          <div class="notes-loader" aria-hidden="true"></div>
          <span>Loading more notes...</span>
        </div>
      `);
    } else {
      grid.insertAdjacentHTML("beforeend", `
        <div class="notes-end-message" aria-live="polite">
          <span>✓</span> All notes loaded
        </div>
      `);
    }

    setupNotesObserver();
  }

  function resetNotesPagination() {
    state.notesVisibleCount = 6;
    state.notesLoading = false;
    if (state.notesObserver) {
      state.notesObserver.disconnect();
      state.notesObserver = null;
    }
  }

  function setupNotesObserver() {
    if (state.notesObserver) {
      state.notesObserver.disconnect();
      state.notesObserver = null;
    }

    const sentinel = el("notesLoadSentinel");
    if (!sentinel || !("IntersectionObserver" in window)) return;

    state.notesObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMoreNotes();
    }, {
      root: null,
      rootMargin: "120px 0px",
      threshold: 0.1
    });

    state.notesObserver.observe(sentinel);
  }

  function loadMoreNotes() {
    if (state.notesLoading) return;

    const query = el("globalSearch").value;
    const category = el("categoryFilter").value;
    const tag = el("tagFilter").value;
    const sort = el("sortFilter").value;
    const filteredNotes = SearchService.filter(
      NotesManager.getAll(),
      { query, category, tag, sort }
    );

    if (state.notesVisibleCount >= filteredNotes.length) return;

    state.notesLoading = true;

    const sentinel = el("notesLoadSentinel");
    if (sentinel) {
      sentinel.classList.add("loading");
      sentinel.querySelector("span").textContent = "Loading more notes...";
    }

    // Small delay gives the user a visible loading state while more cards are rendered.
    window.setTimeout(() => {
      state.notesVisibleCount += 6;
      state.notesLoading = false;
      renderNotes();
    }, 550);
  }

  function renderDashboard() {
    const notes = NotesManager.getAll();
    const activeNotes = notes.filter(note => !note.archived);
    const categories = new Set(activeNotes.map(note => note.category).filter(Boolean));
    const tags = new Set(activeNotes.flatMap(note => note.tags || []));
    const favorites = activeNotes.filter(note => note.favorite);

    el("totalNotes").textContent = activeNotes.length;
    el("totalCategories").textContent = categories.size;
    el("totalTags").textContent = tags.size;
    el("totalFavorites").textContent = favorites.length;

    el("heroTotalNotes").textContent = activeNotes.length;
    el("heroTotalCategories").textContent = categories.size;
    el("heroTotalFavorites").textContent = favorites.length;

    const recent = [...activeNotes]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);

    el("recentNotes").innerHTML = recent.length ? recent.map(note => `
      <div class="recent-note-item">
        <div class="recent-note-icon" aria-hidden="true">✦</div>
        <div class="recent-note-main">
          <h4>${Utils.escapeHTML(note.title)}</h4>
          <p>${Utils.escapeHTML(note.category || "Uncategorized")} · ${Utils.formatDate(note.updatedAt)}</p>
          <div class="recent-note-tags">
            ${(note.tags || []).slice(0, 2).map(tag => `<span>#${Utils.escapeHTML(tag)}</span>`).join("")}
          </div>
        </div>
        <button class="recent-open-btn" title="View note" aria-label="View note" data-action="view" data-id="${note.id}">
          <span class="view-icon" aria-hidden="true"></span>
        </button>
      </div>
    `).join("") : `
      <div class="dashboard-empty">
        <div class="empty-icon">✦</div>
        <h4>No recent notes</h4>
        <p>Your recently updated notes will appear here.</p>
        <button class="text-btn" data-view-target="dashboard" data-action="new-note">+ Create your first note</button>
      </div>
    `;

    el("favoritePreview").innerHTML = favorites.length ? favorites.slice(0, 5).map(note => `
      <div class="mini-note">
        <div>
          <h4>${Utils.escapeHTML(note.title)}</h4>
          <p>${Utils.escapeHTML(Utils.truncate(note.content, 55))}</p>
        </div>
        <button class="text-btn" data-action="view" data-id="${note.id}">View</button>
      </div>
    `).join("") : `<div class="empty-state">No favorite notes yet.</div>`;
  }

  function renderNotes() {
    const query = el("globalSearch").value;
    const category = el("categoryFilter").value;
    const tag = el("tagFilter").value;
    const sort = el("sortFilter").value;

    renderGrid(
      "notesGrid",
      SearchService.filter(NotesManager.getAll(), { query, category, tag, sort }),
      true
    );
    renderGrid("favoritesGrid", SearchService.filter(NotesManager.getAll(), { query, favoriteOnly: true, sort }));
    renderGrid("archiveGrid", SearchService.filter(NotesManager.getAll(), { query, archivedOnly: true, sort }));
  }

  function renderFilters() {
    const notes = NotesManager.getAll().filter(note => !note.archived);
    const categories = [...new Set(notes.map(note => note.category).filter(Boolean))].sort();
    const tags = [...new Set(notes.flatMap(note => note.tags || []))].sort();

    const currentCategory = el("categoryFilter").value;
    const currentTag = el("tagFilter").value;

    el("categoryFilter").innerHTML = `<option value="">All Categories</option>` +
      categories.map(cat => `<option value="${Utils.escapeHTML(cat)}">${Utils.escapeHTML(cat)}</option>`).join("");

    el("tagFilter").innerHTML = `<option value="">All Tags</option>` +
      tags.map(tag => `<option value="${Utils.escapeHTML(tag)}">${Utils.escapeHTML(tag)}</option>`).join("");

    el("categoryFilter").value = categories.includes(currentCategory) ? currentCategory : "";
    el("tagFilter").value = tags.includes(currentTag) ? currentTag : "";
  }

  function renderStatistics() {

    const notes = NotesManager.getAll();

    const active = notes.filter(note => !note.archived);
    const favorites = active.filter(note => note.favorite);
    const archived = notes.filter(note => note.archived);

    const lastSevenDays = active.filter(
        note =>
            Date.now() - new Date(note.createdAt).getTime()
            <= 7 * 86400000
    );

    // Statistics cards
    el("statTotalNotes").textContent = active.length;
    el("statFavorites").textContent = favorites.length;
    el("statArchived").textContent = archived.length;
    el("statRecent").textContent = lastSevenDays.length;


    // Most Used Tags
    const tagCount = {};

    active.flatMap(note => note.tags || []).forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
    });

    const tagStats = el("tagStats");

    if (tagStats) {
        tagStats.innerHTML = Object.keys(tagCount).length
            ? Object.entries(tagCount)
                .sort((a, b) => b[1] - a[1])
                .map(
                    ([tag, count]) =>
                        `<span>#${Utils.escapeHTML(tag)} · ${count}</span>`
                )
                .join("")
            : `<div class="empty-state">No tags yet.</div>`;
    }
}

  function renderStorage() {
    const count = NotesManager.getAll().length;
    el("storageText").textContent = `${count} note${count === 1 ? "" : "s"} saved`;
    el("storageProgress").style.width = `${Math.min(100, count * 5)}%`;
  }

  function renderAll() {

    renderDashboard();

    renderFilters();

    renderNotes();

    renderStatistics();

    renderStorage();


    // Update charts only when Statistics page is active
    if (state.currentView === "statistics") {
        loadDashboardCharts();
    }
}

  function openViewer(note) {
    state.viewerNoteId = note.id;
    el("viewerCategory").textContent = note.category || "UNCATEGORIZED";
    el("viewerTitle").textContent = note.title;
    el("viewerMeta").textContent = `Created ${Utils.formatDate(note.createdAt)} · Updated ${Utils.formatDate(note.updatedAt)} · ${(note.tags || []).map(tag => `#${tag}`).join(" ")}`;
    el("viewerContent").textContent = note.content;
    el("pinBtn").textContent = note.pinned ? "Unpin Note" : "Pin Note";

    const related = NotesManager.getAll()
      .filter(other =>
        other.id !== note.id &&
        !other.archived &&
        (other.tags || []).some(tag => (note.tags || []).includes(tag))
      )
      .slice(0, 3);

    el("relatedNotes").innerHTML = related.length
      ? `<h4>Related Notes</h4>` + related.map(item => `
          <button class="text-btn" data-action="view" data-id="${item.id}">${Utils.escapeHTML(item.title)}</button>
        `).join(" · ")
      : "";

    openModal("viewerModal");
  }

  function handleAction(action, id) {
    const note = NotesManager.getById(id);
    if (!note) return;

    if (action === "view") openViewer(note);
    if (action === "edit") openNoteForm(note);
    if (action === "favorite") {
      NotesManager.toggleFavorite(id);
      Utils.showToast("Favorite status updated.");
      renderAll();
    }
    if (action === "archive") {
      NotesManager.toggleArchive(id);
      Utils.showToast(note.archived ? "Note restored." : "Note archived.");
      renderAll();
    }
    if (action === "duplicate") {
      NotesManager.duplicate(id);
      Utils.showToast("Note duplicated.");
      renderAll();
    }
    if (action === "delete") {
      if (confirm(`Delete "${note.title}" permanently?`)) {
        NotesManager.remove(id);
        Utils.showToast("Note deleted.");
        renderAll();
      }
    }
  }

  document.addEventListener("click", event => {
    const tagSelect = el("tagSelect");
    const categorySelect = el("categorySelect");

    if (tagSelect && !event.target.closest("#tagSelect")) {
      tagSelect.classList.remove("open");
      el("tagSelectToggle").setAttribute("aria-expanded", "false");
    }

    if (categorySelect && !event.target.closest("#categorySelect")) {
      categorySelect.classList.remove("open");
      el("categorySelectToggle").setAttribute("aria-expanded", "false");
    }

    const categoryOption = event.target.closest("#categorySelectMenu .category-option");
    if (categoryOption) {
      setCategoryDropdown(categoryOption.dataset.value);
      categorySelect.classList.remove("open");
      el("categorySelectToggle").setAttribute("aria-expanded", "false");
    }

    const navButton = event.target.closest(".nav-item");
    if (navButton) showView(navButton.dataset.view);

    const targetView = event.target.closest("[data-view-target]");
    if (targetView) showView(targetView.dataset.viewTarget);

    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      if (actionButton.dataset.action === "new-note") {
        openNoteForm();
      } else {
        handleAction(actionButton.dataset.action, actionButton.dataset.id);
      }
    }

    const closeButton = event.target.closest(".close-modal");
    if (closeButton) closeModal(closeButton.dataset.close);
  });

  ["newNoteBtn", "newNoteBtn2", "heroCreateBtn"].forEach(id => {
    el(id).addEventListener("click", () => openNoteForm());
  });

  el("tagSelectToggle").addEventListener("click", () => {
    const tagSelect = el("tagSelect");
    const categorySelect = el("categorySelect");
    categorySelect.classList.remove("open");
    el("categorySelectToggle").setAttribute("aria-expanded", "false");
    const isOpen = tagSelect.classList.toggle("open");
    el("tagSelectToggle").setAttribute("aria-expanded", String(isOpen));
  });

  el("categorySelectToggle").addEventListener("click", () => {
    const categorySelect = el("categorySelect");
    const tagSelect = el("tagSelect");
    tagSelect.classList.remove("open");
    el("tagSelectToggle").setAttribute("aria-expanded", "false");
    const isOpen = categorySelect.classList.toggle("open");
    el("categorySelectToggle").setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll("#tagSelectMenu input[type='checkbox']").forEach(checkbox => {
    checkbox.addEventListener("change", syncTagDropdown);
  });

  syncCategoryDropdown();

  el("noteForm").addEventListener("submit", event => {
    event.preventDefault();

    const selectedCategory = el("noteCategory").value;
    if (!selectedCategory) {
      Utils.showToast("Please select a category.");
      el("categorySelectToggle").focus();
      return;
    }

    NotesManager.save({
      id: el("noteId").value || null,
      title: el("noteTitle").value.trim(),
      content: el("noteContent").value.trim(),
      category: el("noteCategory").value || "Uncategorized",
      tags: Array.from(el("noteTags").selectedOptions)
        .map(option => option.value.toLowerCase()),
      favorite: el("noteFavorite").checked,
      pinned: el("notePinned").checked
    });

    closeModal("noteModal");
    Utils.showToast("Note saved successfully.");
    renderAll();
  });

  el("globalSearch").addEventListener("input", () => {
    resetNotesPagination();
    if (state.currentView === "dashboard") showView("notes");
    renderNotes();
  });
  el("categoryFilter").addEventListener("change", () => {
    resetNotesPagination();
    renderNotes();
  });
  el("tagFilter").addEventListener("change", () => {
    resetNotesPagination();
    renderNotes();
  });
  el("sortFilter").addEventListener("change", () => {
    resetNotesPagination();
    renderNotes();
  });

  el("themeBtn").addEventListener("click", toggleTheme);
  el("settingsThemeBtn").addEventListener("click", toggleTheme);
  el("menuBtn").addEventListener("click", () => el("sidebar").classList.toggle("open"));

  el("copyBtn").addEventListener("click", async () => {
    const note = NotesManager.getById(state.viewerNoteId);
    if (!note) return;

    try {
      await navigator.clipboard.writeText(note.content);
      Utils.showToast("Note content copied.");
    } catch {
      Utils.showToast("Unable to copy automatically.");
    }
  });

  el("pinBtn").addEventListener("click", () => {
    if (!state.viewerNoteId) return;
    NotesManager.togglePin(state.viewerNoteId);
    const note = NotesManager.getById(state.viewerNoteId);
    el("pinBtn").textContent = note.pinned ? "Unpin Note" : "Pin Note";
    Utils.showToast(note.pinned ? "Note pinned." : "Note unpinned.");
    renderAll();
  });

  el("exportBtn").addEventListener("click", () => {
    const data = JSON.stringify(StorageService.exportData(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mindvault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    Utils.showToast("Knowledge base exported.");
  });

  el("importBtn").addEventListener("click", () => el("importInput").click());

  el("importInput").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const data = JSON.parse(await file.text());
      StorageService.importData(data);
      NotesManager.replaceAll(StorageService.getNotes());
      setTheme(StorageService.getSettings().theme || "light");
      renderAll();
      Utils.showToast("Knowledge base imported.");
    } catch (error) {
      alert(error.message || "Could not import this file.");
    } finally {
      event.target.value = "";
    }
  });

  el("clearBtn").addEventListener("click", () => {
    if (!confirm("This will permanently delete all notes. Continue?")) return;
    StorageService.clearAll();
    NotesManager.replaceAll([]);
    setTheme("light");
    renderAll();
    Utils.showToast("All data cleared.");
  });

  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) closeModal(backdrop.id);
    });
  });

  seedDemoData();
  setTheme(StorageService.getSettings().theme || "light");
  renderAll();
});
