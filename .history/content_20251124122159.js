// ========== CONFIG ==========
const PAGE_KEY = "notes_" + window.location.hostname;

// ========== STATE ==========
let notes = [];

// ========== SAVE ==========
function saveNotes() {
  chrome.storage.sync.set({ [PAGE_KEY]: notes });
}

// ========== LOAD ==========
chrome.storage.sync.get(PAGE_KEY, (res) => {
  notes = res[PAGE_KEY] || [];

  // Create toolbar
  createToolbar();

  // Create all saved notes (hidden until opened)
  notes.forEach((n) => createNoteElement(n));
});

// ========== TOOLBAR ==========
function createToolbar() {
  if (document.getElementById("qn-toolbar")) return;

  // Create the toolbar FIRST
  const bar = document.createElement("div");
  bar.id = "qn-toolbar";
  bar.style.position = "fixed";
  bar.style.top = "16px";
  bar.style.right = "16px";
  bar.style.zIndex = "999999999";
  bar.style.padding = "8px 12px";
  bar.style.borderRadius = "20px";
  bar.style.background = "white";
  bar.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  bar.style.display = "flex";
  bar.style.gap = "10px";
  bar.style.fontFamily = "sans-serif";

  // HIDE BUTTON - now bar EXISTS
  const hideBtn = document.createElement("button");
  hideBtn.textContent = "✕";
  hideBtn.style.padding = "4px 8px";
  hideBtn.style.border = "none";
  hideBtn.style.background = "transparent";
  hideBtn.style.cursor = "pointer";
  hideBtn.style.fontSize = "16px";

  hideBtn.onclick = () => {
    bar.style.display = "none";
    showFloatingButton();
  };

  // ADD NOTE BUTTON
  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Note";
  addBtn.style.padding = "6px 12px";
  addBtn.style.borderRadius = "16px";
  addBtn.style.background = "#1976d2";
  addBtn.style.color = "white";
  addBtn.style.border = "none";
  addBtn.style.cursor = "pointer";

  addBtn.onclick = () => {
    const newNote = {
      id: Date.now(),
      x: 100,
      y: 100,
      width: 220,
      height: 150,
      content: "",
    };
    notes.push(newNote);
    saveNotes();
    createNoteElement(newNote, true);
  };

  // SHOW NOTES BUTTON
  const showBtn = document.createElement("button");
  showBtn.textContent = "📂 Notes";
  showBtn.style.border = "none";
  showBtn.style.cursor = "pointer";
  showBtn.style.fontSize = "16px";
  showBtn.style.background = "transparent";

  showBtn.onclick = toggleNotesList;

  // Append buttons
  bar.appendChild(addBtn);
  bar.appendChild(showBtn);
  bar.appendChild(hideBtn);

  document.body.appendChild(bar);
}

// ========== SIMPLE NOTES LIST PANEL ==========
function toggleNotesList() {
  const existing = document.getElementById("qn-list");
  if (existing) return existing.remove();

  const panel = document.createElement("div");
  panel.id = "qn-list";
  panel.style.position = "fixed";
  panel.style.top = "60px";
  panel.style.right = "16px";
  panel.style.zIndex = "999999999";
  panel.style.width = "250px";
  panel.style.maxHeight = "300px";
  panel.style.overflowY = "auto";
  panel.style.borderRadius = "10px";
  panel.style.background = "white";
  panel.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  panel.style.padding = "10px";
  panel.style.fontFamily = "sans-serif";

  // only notes that actually have text
  const nonEmptyNotes = notes.filter(
    (n) => (n.content || "").trim() !== ""
  );

  if (nonEmptyNotes.length === 0) {
    panel.textContent = "No notes on this site.";
    document.body.appendChild(panel);
    return;
  }

  // newest first
  nonEmptyNotes
    .slice()
    .reverse()
    .forEach((n) => {
      const item = document.createElement("div");
      item.style.padding = "6px 4px";
      item.style.borderBottom = "1px solid #ddd";
      item.style.cursor = "pointer";
      item.textContent = n.content.trim().slice(0, 40);

      item.onclick = () => {
        document.getElementById("qn-list")?.remove();
        showNote(n.id);
      };

      panel.appendChild(item);
    });

  document.body.appendChild(panel);
}

// ========== SHOW SPECIFIC NOTE ==========
function showNote(id) {
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  const el = document.getElementById("note-" + id);
  if (el) {
    el.style.display = "flex";
    el.style.zIndex = "99999999"; // bring to front
  }
}

// ========== CREATE NOTE ==========
function createNoteElement(note, show = false) {
  const wrap = document.createElement("div");
  wrap.id = "note-" + note.id;
  wrap.style.position = "fixed";
  wrap.style.left = note.x + "px";
  wrap.style.top = note.y + "px";
  wrap.style.width = note.width + "px";
  wrap.style.height = note.height + "px";
  wrap.style.zIndex = "9999999";
  wrap.style.background = "#fffbe7";
  wrap.style.border = "1px solid #aaa";
  wrap.style.borderRadius = "6px";
  wrap.style.display = show ? "flex" : "none";
  wrap.style.flexDirection = "column";
  wrap.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  wrap.style.resize = "both";
  wrap.style.overflow = "hidden";
  wrap.style.fontFamily = "sans-serif";

  // HEADER
  const head = document.createElement("div");
  head.style.background = "#1976d2";
  head.style.color = "white";
  head.style.padding = "4px 8px";
  head.style.fontSize = "12px";
  head.style.display = "flex";
  head.style.justifyContent = "space-between";

  const title = document.createElement("span");
  title.textContent = "Note";

  // CLOSE BUTTON (hides note but keeps saved)
  const closeBtn = document.createElement("span");
  closeBtn.textContent = "✕";
  closeBtn.style.cursor = "pointer";
  closeBtn.onclick = () => (wrap.style.display = "none");

  head.appendChild(title);
  head.appendChild(closeBtn);

  // TEXTAREA
  const ta = document.createElement("textarea");
  ta.value = note.content || "";
  ta.style.flex = "1";
  ta.style.border = "none";
  ta.style.outline = "none";
  ta.style.padding = "6px";
  ta.style.fontSize = "13px";
  ta.style.background = "transparent";

  ta.oninput = () => {
    note.content = ta.value;
    saveNotes();
  };

  wrap.appendChild(head);
  wrap.appendChild(ta);
  document.body.appendChild(wrap);
}
function showFloatingButton() {
  if (document.getElementById("qn-reopen")) return;

  const btn = document.createElement("div");
  btn.id = "qn-reopen";
  btn.textContent = "📝";
  btn.style.position = "fixed";
  btn.style.bottom = "20px";
  btn.style.right = "20px";
  btn.style.zIndex = "999999999";
  btn.style.background = "#1976d2";
  btn.style.color = "white";
  btn.style.padding = "10px 14px";
  btn.style.borderRadius = "50%";
  btn.style.cursor = "pointer";
  btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  btn.style.fontSize = "20px";

  btn.onclick = () => {
    document.getElementById("qn-reopen")?.remove();
    document.getElementById("qn-toolbar").style.display = "flex";
  };

  document.body.appendChild(btn);
}
