// ====== MESSAGE FROM POPUP (CLICKING EXTENSION ICON) ======
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_SITE_PANEL") {
    toggleSitePanel();
  }
});

// ====== CONFIG ======
const PAGE_KEY = "notes_" + window.location.hostname;

const THEME_KEY = "quick_notes_theme";

// ====== STATE ======
let notes = [];
let currentTheme = "light";

// ====== SAVE NOTES ======
function saveNotes() {
  chrome.storage.sync.set({ [PAGE_KEY]: notes });
}

// ====== ONE-TIME MIGRATION FROM OLD KEY FORMAT ======
function migrateOldKeys(callback) {
  chrome.storage.sync.get(null, (all) => {
    const oldKeys = Object.keys(all).filter(k =>
      k.startsWith("notes_" + window.location.hostname + "/")
    );

    if (oldKeys.length === 0) {
      callback();
      return;
    }

    console.log("Migrating old keys:", oldKeys);

    // Load new bucket or create empty
    chrome.storage.sync.get(PAGE_KEY, (res) => {
      let mergedNotes = res[PAGE_KEY] || [];

      // Add notes from old keys
      oldKeys.forEach(oldKey => {
        if (Array.isArray(all[oldKey])) {
          mergedNotes = mergedNotes.concat(all[oldKey]);
        }
      });

      // Save merged notes to the new bucket
      chrome.storage.sync.set({ [PAGE_KEY]: mergedNotes }, () => {
        // Delete old keys
        chrome.storage.sync.remove(oldKeys, () => {
          console.log("Old keys removed after migration:", oldKeys);
          callback();
        });
      });
    });
  });
}

// ====== LOAD EVERYTHING ======
function loadData() {
  migrateOldKeys(() => {
    chrome.storage.sync.get([PAGE_KEY, THEME_KEY], (result) => {
      notes = result[PAGE_KEY] || [];
      currentTheme = result[THEME_KEY] || "light";

      notes.forEach((note) => {
        createNoteElement(note);
      });

      createToolbar();
    });
  });
}


// ====== THEME STYLES ======
function applyThemeStyles(el, isHeader = false) {
  if (currentTheme === "dark") {
    el.style.background = isHeader ? "#333" : "#222";
    el.style.color = "#f5f5f5";
    el.style.borderColor = "#555";
  } else {
    el.style.background = isHeader ? "#1976d2" : "#fffde7";
    el.style.color = isHeader ? "#ffffff" : "#222";
    el.style.borderColor = "#222";
  }
}

// ====== CREATE NOTE ELEMENT ======
function createNoteElement(note) {
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = (note.x || 20) + "px";
  wrapper.style.top = (note.y || 20) + "px";
  wrapper.style.width = (note.width || 220) + "px";
  wrapper.style.zIndex = "999999";
  wrapper.style.border = "2px solid";
  wrapper.style.borderRadius = "8px";
  wrapper.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.resize = "both";
  wrapper.style.overflow = "hidden";
  wrapper.style.fontFamily = "sans-serif";

  applyThemeStyles(wrapper);

  // Header
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.padding = "4px 8px";
  header.style.cursor = "move";
  applyThemeStyles(header, true);

  const title = document.createElement("span");
  title.textContent = "Note";
  title.style.fontSize = "12px";

  const btnGroup = document.createElement("div");
  btnGroup.style.display = "flex";
  btnGroup.style.gap = "4px";

  // AI Summarise
  const aiBtn = document.createElement("button");
  aiBtn.textContent = "AI";
  aiBtn.style.border = "none";
  aiBtn.style.background = "transparent";
  aiBtn.style.color = "inherit";
  aiBtn.style.borderRadius = "4px";
  aiBtn.style.cursor = "pointer";

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "✕";
  deleteBtn.style.border = "none";
  deleteBtn.style.background = "transparent";
  deleteBtn.style.color = "inherit";
  deleteBtn.style.borderRadius = "4px";
  deleteBtn.style.cursor = "pointer";

  btnGroup.appendChild(aiBtn);
  btnGroup.appendChild(deleteBtn);

  header.appendChild(title);
  header.appendChild(btnGroup);

  const textarea = document.createElement("textarea");
  textarea.value = note.content || "";
  textarea.style.flex = "1";
  textarea.style.border = "none";
  textarea.style.outline = "none";
  textarea.style.padding = "8px";
  textarea.style.fontSize = "13px";
  textarea.style.minHeight = "80px";
  textarea.style.resize = "none";
  textarea.style.background = "transparent";
  textarea.style.color = currentTheme === "dark" ? "#f5f5f5" : "#222";

  wrapper.appendChild(header);
  wrapper.appendChild(textarea);
  document.body.appendChild(wrapper);

  // EVENTS
  textarea.addEventListener("input", () => {
    const idx = notes.findIndex((n) => n.id === note.id);
    if (idx !== -1) {
      notes[idx].content = textarea.value;
      saveNotes();
    }
  });

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - wrapper.getBoundingClientRect().left;
    offsetY = e.clientY - wrapper.getBoundingClientRect().top;
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    wrapper.style.left = e.clientX - offsetX + "px";
    wrapper.style.top = e.clientY - offsetY + "px";
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = "";
      const rect = wrapper.getBoundingClientRect();
      const idx = notes.findIndex((n) => n.id === note.id);
      if (idx !== -1) {
        notes[idx].x = rect.left;
        notes[idx].y = rect.top;
        notes[idx].width = rect.width;
        notes[idx].height = rect.height;
        saveNotes();
      }
    }
  });

  const resizeObserver = new ResizeObserver(() => {
    const rect = wrapper.getBoundingClientRect();
    const idx = notes.findIndex((n) => n.id === note.id);
    if (idx !== -1) {
      notes[idx].width = rect.width;
      notes[idx].height = rect.height;
      saveNotes();
    }
  });
  resizeObserver.observe(wrapper);

 // Close note (SAVE + HIDE)
deleteBtn.addEventListener("click", () => {
  const idx = notes.findIndex((n) => n.id === note.id);
  if (idx !== -1) {
    // Save final position and text before closing
    const rect = wrapper.getBoundingClientRect();
    notes[idx].x = rect.left;
    notes[idx].y = rect.top;
    notes[idx].width = rect.width;
    notes[idx].height = rect.height;
    notes[idx].content = textarea.value;

    saveNotes();
  }

  wrapper.style.display = "none"; // Hide but DO NOT delete
  resizeObserver.disconnect();
});


  aiBtn.addEventListener("click", () => {
    const text = textarea.value;
    if (!text.trim()) return;
    textarea.value = simpleSummarise(text);
    notes.find((n) => n.id === note.id).content = textarea.value;
    saveNotes();
  });
}

// ====== SIMPLE QUICK SUMMARY ======
function simpleSummarise(text) {
  const s = text.split(/\.\s+/);
  return (
    (s[0] || "").slice(0, 200) +
    "\n\n(Quick summary – real AI coming soon)"
  );
}

// ====== TOOLBAR ======
function createToolbar() {
  if (document.getElementById("qn-toolbar")) return;

  const toolbar = document.createElement("div");
  toolbar.id = "qn-toolbar";
  toolbar.style.position = "fixed";
  toolbar.style.top = "16px";
  toolbar.style.right = "16px";
  toolbar.style.zIndex = "9999999";
  toolbar.style.display = "flex";
  toolbar.style.gap = "8px";
  toolbar.style.padding = "6px 10px";
  toolbar.style.borderRadius = "999px";
  toolbar.style.backdropFilter = "blur(8px)";
  toolbar.style.boxShadow = "0 2px 10px rgba(0,0,0,0.25)";
  toolbar.style.fontFamily = "sans-serif";

  toolbar.style.background =
    currentTheme === "dark" ? "rgba(34,34,34,0.9)" : "rgba(255,255,255,0.95)";
  toolbar.style.color = currentTheme === "dark" ? "#fff" : "#222";

  const panelBtn = document.createElement("button");
panelBtn.textContent = "📂";
panelBtn.title = "Open notes for this website";
panelBtn.style.border = "none";
panelBtn.style.cursor = "pointer";
panelBtn.style.fontSize = "18px";
panelBtn.style.background = "transparent";

panelBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "TOGGLE_SITE_PANEL" });
});

toolbar.appendChild(panelBtn);


  // + Note
  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Note";
  addBtn.style.padding = "6px 12px";
  addBtn.style.borderRadius = "20px";
  addBtn.style.border = "none";
  addBtn.style.background = "#1976d2";
  addBtn.style.color = "#fff";
  addBtn.style.cursor = "pointer";

  addBtn.addEventListener("click", () => {
    const newNote = {
      id: Date.now(),
      x: 120,
      y: 120,
      width: 240,
      height: 160,
      content: ""
    };
    notes.push(newNote);
    saveNotes();
    createNoteElement(newNote);
  });

  // 📂 Site notes panel button
  const siteBtn = document.createElement("button");
  siteBtn.textContent = "📂";
  siteBtn.style.width = "32px";
  siteBtn.style.height = "32px";
  siteBtn.style.borderRadius = "50%";
  siteBtn.style.border = "none";
  siteBtn.style.cursor = "pointer";
  siteBtn.addEventListener("click", () => toggleSitePanel());

  // Theme
  const themeBtn = document.createElement("button");
  themeBtn.textContent = currentTheme === "dark" ? "☀️" : "🌙";
  themeBtn.style.width = "32px";
  themeBtn.style.height = "32px";
  themeBtn.style.borderRadius = "50%";
  themeBtn.style.border = "none";
  themeBtn.style.cursor = "pointer";

  themeBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    chrome.storage.sync.set({ [THEME_KEY]: currentTheme }, () =>
      location.reload()
    );
  });

  toolbar.appendChild(addBtn);
  toolbar.appendChild(siteBtn);
  toolbar.appendChild(themeBtn);

  document.body.appendChild(toolbar);
}

// ====== PARSING HOSTNAME/PATH ======
function parseKey(key) {
  if (!key.startsWith("notes_")) return null;
  const raw = key.substring("notes_".length);
  const firstSlash = raw.indexOf("/");
  const hostname = firstSlash === -1 ? raw : raw.slice(0, firstSlash);
  const path = firstSlash === -1 ? "/" : raw.slice(firstSlash);
  return { hostname, path };
}

// ====== TOGGLE SITE PANEL ======
function toggleSitePanel() {
  const existing = document.getElementById("qn-site-panel");
  if (existing) {
    existing.remove();
    return;
  }

  chrome.storage.sync.get(null, (all) => {
    document.body.appendChild(buildSitePanel(all));
  });
}

// ====== BUILD SITE PANEL (THIS WEBSITE NOTES) ======
function buildSitePanel(all) {
  const hostname = window.location.hostname;

  const panel = document.createElement("div");
  panel.id = "qn-site-panel";
  panel.style.position = "fixed";
  panel.style.top = "56px";
  panel.style.right = "16px";
  panel.style.width = "340px";
  panel.style.maxHeight = "60vh";
  panel.style.overflowY = "auto";
  panel.style.zIndex = "9999999";
  panel.style.borderRadius = "16px";
  panel.style.padding = "10px 12px";
  panel.style.boxShadow = "0 4px 18px rgba(0,0,0,0.25)";
  panel.style.fontFamily = "sans-serif";

  panel.style.background =
    currentTheme === "dark" ? "#222" : "#fff";
  panel.style.color = currentTheme === "dark" ? "#f5f5f5" : "#222";

  // Header
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "8px";

  const title = document.createElement("div");
  title.textContent = `Notes on: ${hostname}`;
  title.style.fontSize = "14px";
  title.style.fontWeight = "600";

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "6px";

  const allBtn = document.createElement("button");
  allBtn.textContent = "All notes";
  allBtn.style.padding = "4px 8px";
  allBtn.style.borderRadius = "999px";
  allBtn.style.border = "none";
  allBtn.style.background = "#1976d2";
  allBtn.style.color = "#fff";
  allBtn.style.cursor = "pointer";

  allBtn.addEventListener("click", () => {
    panel.remove();
    chrome.storage.sync.get(null, (all) => openDashboardOverlay(all));
  });

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.padding = "2px 6px";
  closeBtn.style.borderRadius = "999px";
  closeBtn.style.border = "none";
  closeBtn.style.background = "transparent";
  closeBtn.style.cursor = "pointer";

  closeBtn.addEventListener("click", () => panel.remove());

  actions.appendChild(allBtn);
  actions.appendChild(closeBtn);

  header.appendChild(title);
  header.appendChild(actions);

  panel.appendChild(header);

  // List notes
  const list = document.createElement("div");
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.gap = "8px";

  let found = false;

  for (const key of Object.keys(all)) {
    if (!key.startsWith("notes_")) continue;

    const meta = parseKey(key);
    if (!meta || meta.hostname !== hostname) continue;

    const pageNotes = all[key] || [];
    if (!pageNotes.length) continue;

    found = true;

    const card = document.createElement("div");
    card.style.border = currentTheme === "dark" ? "1px solid #555" : "1px solid #ddd";
    card.style.background = currentTheme === "dark" ? "#2c2c2c" : "#fafafa";
    card.style.borderRadius = "10px";
    card.style.padding = "8px";

    const pathEl = document.createElement("div");
    pathEl.textContent = meta.path;
    pathEl.style.fontSize = "11px";
    pathEl.style.opacity = "0.8";
    card.appendChild(pathEl);

    const countEl = document.createElement("div");
    countEl.textContent = `${pageNotes.length} note${pageNotes.length > 1 ? "s" : ""}`;
    countEl.style.fontSize = "11px";
    countEl.style.marginBottom = "4px";
    card.appendChild(countEl);

    // Previews
    for (const n of pageNotes.slice(0, 2)) {
      const p = document.createElement("div");
      const text = (n.content || "").trim().replace(/\s+/g, " ");
      p.textContent = "• " + (text ? text.slice(0, 80) : "(empty note)");
      p.style.fontSize = "11px";
      p.style.opacity = "0.9";
      card.appendChild(p);
    }

    list.appendChild(card);
  }

  if (!found) {
    const empty = document.createElement("div");
    empty.textContent = "No notes yet on this website.";
    empty.style.opacity = "0.8";
    empty.style.fontSize = "12px";
    list.appendChild(empty);
  }

  panel.appendChild(list);
  return panel;
}

// ====== FULL DASHBOARD OVERLAY ======
function openDashboardOverlay(all) {
  const overlay = document.createElement("div");
  overlay.id = "qn-dashboard";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.3)";
  overlay.style.zIndex = "9999999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  const box = document.createElement("div");
  box.style.width = "520px";
  box.style.maxHeight = "70vh";
  box.style.overflowY = "auto";
  box.style.borderRadius = "18px";
  box.style.padding = "14px 16px";
  box.style.fontFamily = "sans-serif";

  if (currentTheme === "dark") {
    box.style.background = "#1f1f1f";
    box.style.color = "#fff";
  } else {
    box.style.background = "#fff";
    box.style.color = "#222";
  }

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.marginBottom = "10px";

  const title = document.createElement("div");
  title.textContent = "All Notes (by website)";
  title.style.fontSize = "15px";
  title.style.fontWeight = "600";

  const close = document.createElement("button");
  close.textContent = "✕";
  close.style.border = "none";
  close.style.background = "transparent";
  close.style.cursor = "pointer";
  close.addEventListener("click", () => overlay.remove());

  header.appendChild(title);
  header.appendChild(close);
  box.appendChild(header);

  const domains = {};

  for (const key of Object.keys(all)) {
    if (!key.startsWith("notes_")) continue;
    const meta = parseKey(key);
    if (!meta) continue;

    if (!domains[meta.hostname]) {
      domains[meta.hostname] = { total: 0, pages: 0 };
    }

    const pageNotes = all[key] || [];
    domains[meta.hostname].total += pageNotes.length;
    domains[meta.hostname].pages += 1;
  }

  const list = document.createElement("div");
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.gap = "8px";

  const domainNames = Object.keys(domains);

  if (!domainNames.length) {
    const empty = document.createElement("div");
    empty.textContent = "You have no saved notes.";
    empty.style.fontSize = "13px";
    empty.style.opacity = "0.8";
    list.appendChild(empty);
  } else {
    domainNames.sort().forEach((domain) => {
      const info = domains[domain];

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.padding = "8px 10px";
      row.style.borderRadius = "10px";
      row.style.border =
        currentTheme === "dark" ? "1px solid #555" : "1px solid #ddd";
      row.style.background =
        currentTheme === "dark" ? "#262626" : "#fafafa";

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";

      const nameEl = document.createElement("div");
      nameEl.textContent = domain;
      nameEl.style.fontSize = "13px";
      nameEl.style.fontWeight = "500";

      const metaEl = document.createElement("div");
      metaEl.textContent = `${info.total} notes • ${info.pages} page${
        info.pages > 1 ? "s" : ""
      }`;
      metaEl.style.fontSize = "11px";
      metaEl.style.opacity = "0.8";

      left.appendChild(nameEl);
      left.appendChild(metaEl);

      row.appendChild(left);
      list.appendChild(row);
    });
  }

  box.appendChild(list);
  overlay.appendChild(box);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

// INIT
loadData();
