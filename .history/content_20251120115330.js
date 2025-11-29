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

    createAddNoteButton();
    createThemeToggleButton();
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
  btn.style.left = "20px"
