// ====== CONFIG ======
const PAGE_KEY =
  "notes_" + window.location.hostname + window.location.pathname;
const THEME_KEY = "quick_notes_theme"; // "light" or "dark"

// ====== STATE ======
let notes = [];
let currentTheme = "light";

// ====== UTIL: SAVE NOTES ======
function saveNotes() {
  chrome.storage.sync.set({ [PAGE_KEY]: notes });
}

// ====== UTIL: LOAD EVERYTHING ======
function loadData() {
  chrome.storage.sync.get([PAGE_KEY, THEME_KEY], (result) => {
    notes = result[PAGE_KEY] || [];
    currentTheme = result[THEME_KEY] || "light";

   notes.forEach((note) => {
  createNoteElement(note);
});

  createToolbar();

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

// ====== CREATE NOTE DOM ======
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

  // AI Summarise button
  const aiBtn = document.createElement("button");
  aiBtn.textContent = "AI";
  aiBtn.title = "Summarise note";
  aiBtn.style.border = "none";
  aiBtn.style.padding = "2px 6px";
  aiBtn.style.fontSize = "11px";
  aiBtn.style.borderRadius = "4px";
  aiBtn.style.cursor = "pointer";

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "✕";
  deleteBtn.title = "Delete note";
  deleteBtn.style.border = "none";
  deleteBtn.style.padding = "2px 6px";
  deleteBtn.style.fontSize = "11px";
  deleteBtn.style.borderRadius = "4px";
  deleteBtn.style.cursor = "pointer";

  // Match header theme for buttons
  aiBtn.style.background = "transparent";
  aiBtn.style.color = "inherit";
  deleteBtn.style.background = "transparent";
  deleteBtn.style.color = "inherit";

  btnGroup.appendChild(aiBtn);
  btnGroup.appendChild(deleteBtn);

  header.appendChild(title);
  header.appendChild(btnGroup);

  // Textarea
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

  // ====== EVENTS ======

  // Save on input
  textarea.addEventListener("input", () => {
    const idx = notes.findIndex((n) => n.id === note.id);
    if (idx !== -1) {
      notes[idx].content = textarea.value;
      saveNotes();
    }
  });

  // Dragging
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

  // Resize observer to save size
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

  // Delete note
  deleteBtn.addEventListener("click", () => {
    wrapper.remove();
    notes = notes.filter((n) => n.id !== note.id);
    saveNotes();
    resizeObserver.disconnect();
  });

  // AI Summarise (local simple summary for now)
  aiBtn.addEventListener("click", async () => {
    const originalText = textarea.value.trim();
    if (!originalText) {
      alert("Note is empty. Write something first 🙂");
      return;
    }

    // Simple local "summary" right now:
    const summary = simpleSummarise(originalText);
    textarea.value = summary;

    const idx = notes.findIndex((n) => n.id === note.id);
    if (idx !== -1) {
      notes[idx].content = textarea.value;
      saveNotes();
    }

    // 👉 If later you add real AI:
    // await callYourAISummariser(originalText).then(res => {
    //   textarea.value = res;
    //   notes[idx].content = res;
    //   saveNotes();
    // });
  });
}

// ====== SIMPLE LOCAL "AI" SUMMARY ======
function simpleSummarise(text) {
  // Very basic: take first 2 sentences or first 200 chars
  const sentences = text.split(/(?<=[.!?])\s+/);
  let summary = "";
  for (let i = 0; i < sentences.length && i < 2; i++) {
    summary += sentences[i] + " ";
  }
  summary = summary.trim();

  if (!summary) {
    summary = text.slice(0, 200) + (text.length > 200 ? "..." : "");
  }

  return summary + "\n\n(Quick summary – replace with real AI later)";
}

// ====== THEME TOGGLE BUTTON ======
function createThemeToggleButton() {
  const btn = document.createElement("button");
  btn.textContent = currentTheme === "dark" ? "☀️" : "🌙";
  btn.title = "Toggle light/dark theme";
  btn.style.position = "fixed";
  btn.style.bottom = "20px";
  btn.style.left = "20px";
  btn.style.zIndex = "999999";
  btn.style.padding = "6px 10px";
  btn.style.borderRadius = "20px";
  btn.style.border = "none";
  btn.style.cursor = "pointer";
  btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
  btn.style.fontSize = "14px";

  if (currentTheme === "dark") {
    btn.style.background = "#333";
    btn.style.color = "#fff";
  } else {
    btn.style.background = "#fff";
    btn.style.color = "#222";
  }

  btn.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    chrome.storage.sync.set({ [THEME_KEY]: currentTheme }, () => {
      // Reload page UI so all notes get new theme
      location.reload();
    });
  });

  document.body.appendChild(btn);
}

// ====== ADD NOTE BUTTON ======
function createAddNoteButton() {
  const btn = document.createElement("button");
  btn.textContent = "+ Note";
  btn.title = "Add new note on this page";
  btn.style.position = "fixed";
btn.style.top = "20px";
btn.style.right = "20px";

  btn.style.zIndex = "999999";
  btn.style.padding = "8px 12px";
  btn.style.borderRadius = "20px";
  btn.style.border = "none";
  btn.style.cursor = "pointer";
  btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
  btn.style.fontSize = "13px";
  btn.style.background = "#1976d2";
  btn.style.color = "#fff";

  btn.addEventListener("click", () => {
    const newNote = {
      id: Date.now(),
      x: 100 + notes.length * 20,
      y: 100 + notes.length * 20,
      width: 220,
      height: 150,
      content: ""
    };
    notes.push(newNote);
    saveNotes();
    createNoteElement(newNote);
  });

  document.body.appendChild(btn);
}
// ====== TOP-RIGHT TOOLBAR ======
function createToolbar() {
  // Prevent duplicate toolbar
  if (document.getElementById("qn-toolbar")) return;

  const toolbar = document.createElement("div");
  toolbar.id = "qn-toolbar";
  toolbar.style.position = "fixed";
  toolbar.style.top = "16px";
  toolbar.style.right = "16px";
  toolbar.style.zIndex = "9999999";
  toolbar.style.display = "flex";
  toolbar.style.gap = "10px";
  toolbar.style.padding = "8px 12px";
  toolbar.style.borderRadius = "999px";
  toolbar.style.alignItems = "center";
  toolbar.style.backdropFilter = "blur(8px)";
  toolbar.style.boxShadow = "0 2px 10px rgba(0,0,0,0.25)";
  toolbar.style.border = "1px solid rgba(255,255,255,0.2)";
  toolbar.style.fontFamily = "sans-serif";

  if (currentTheme === "dark") {
    toolbar.style.background = "rgba(34,34,34,0.85)";
    toolbar.style.color = "#fff";
  } else {
    toolbar.style.background = "rgba(255,255,255,0.9)";
    toolbar.style.color = "#222";
  }

  // + Note button
  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Note";
  addBtn.title = "Add new note";
  addBtn.style.border = "none";
  addBtn.style.cursor = "pointer";
  addBtn.style.padding = "6px 12px";
  addBtn.style.borderRadius = "20px";
  addBtn.style.fontSize = "13px";
  addBtn.style.fontWeight = "600";
  addBtn.style.background = "#1976d2";
  addBtn.style.color = "#fff";
  addBtn.style.boxShadow = "0 1px 4px rgba(0,0,0,0.2)";

  addBtn.addEventListener("click", () => {
    const newNote = {
      id: Date.now(),
      x: 100 + notes.length * 20,
      y: 100 + notes.length * 20,
      width: 240,
      height: 160,
      content: ""
    };
    notes.push(newNote);
    saveNotes();
    createNoteElement(newNote);
  });

  // Theme button
  const themeBtn = document.createElement("button");
  themeBtn.textContent = currentTheme === "dark" ? "☀️" : "🌙";
  themeBtn.title = "Toggle theme";
  themeBtn.style.width = "32px";
  themeBtn.style.height = "32px";
  themeBtn.style.borderRadius = "50%";
  themeBtn.style.border = "none";
  themeBtn.style.cursor = "pointer";
  themeBtn.style.fontSize = "16px";
  themeBtn.style.display = "flex";
  themeBtn.style.alignItems = "center";
  themeBtn.style.justifyContent = "center";

  themeBtn.style.background =
    currentTheme === "dark" ? "#444" : "rgba(240,240,240,0.9)";
  themeBtn.style.color = currentTheme === "dark" ? "#fff" : "#222";

  themeBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    chrome.storage.sync.set({ [THEME_KEY]: currentTheme }, () => {
      location.reload();
    });
  });

  // Add to toolbar
  toolbar.appendChild(addBtn);
  toolbar.appendChild(themeBtn);

  document.body.appendChild(toolbar);
}


// ====== INIT ======
loadData();
