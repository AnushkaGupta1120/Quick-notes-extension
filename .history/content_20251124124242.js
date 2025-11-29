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

  createToolbar();

  notes.forEach((n) => createNoteElement(n));
});

// ========== TOOLBAR ==========
function createToolbar() {
  if (document.getElementById("qn-toolbar")) return;

  const bar = document.createElement("div");
  bar.id = "qn-toolbar";

  // ====== DARK GLASSMORPHISM BAR ======
  bar.style.position = "fixed";
  bar.style.top = "20px";
  bar.style.right = "20px";
  bar.style.zIndex = "999999999";
  bar.style.padding = "10px 18px";
  bar.style.borderRadius = "999px";
  bar.style.background = "rgba(15, 23, 42, 0.75)"; // slate-900 with alpha
  bar.style.backdropFilter = "blur(18px)";
  bar.style.border = "1px solid rgba(148, 163, 184, 0.25)"; // slate-400
  bar.style.boxShadow = "0 18px 45px rgba(0,0,0,0.65)";
  bar.style.display = "flex";
  bar.style.alignItems = "center";
  bar.style.gap = "16px";
  bar.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  bar.style.color = "#e5e7eb"; // slate-200
  bar.style.transition = "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease";

  bar.onmouseenter = () => {
    bar.style.transform = "translateY(-1px)";
    bar.style.boxShadow = "0 22px 60px rgba(0,0,0,0.85)";
    bar.style.background = "rgba(15, 23, 42, 0.92)";
  };
  bar.onmouseleave = () => {
    bar.style.transform = "translateY(0)";
    bar.style.boxShadow = "0 18px 45px rgba(0,0,0,0.65)";
    bar.style.background = "rgba(15, 23, 42, 0.75)";
  };

  // helper for icon-only buttons
  function styleIconButton(btn) {
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.width = "34px";
    btn.style.height = "34px";
    btn.style.borderRadius = "999px";
    btn.style.border = "1px solid rgba(148, 163, 184, 0.35)";
    btn.style.background = "rgba(15, 23, 42, 0.6)";
    btn.style.color = "#e5e7eb";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "16px";
    btn.style.padding = "0";
    btn.style.outline = "none";
    btn.style.transition = "background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease";
    btn.style.boxShadow = "0 8px 20px rgba(0,0,0,0.35)";

    btn.onmouseenter = () => {
      btn.style.background = "rgba(30, 64, 175, 0.85)"; // blue-ish glow
      btn.style.borderColor = "rgba(191, 219, 254, 0.8)";
      btn.style.transform = "translateY(-1px)";
      btn.style.boxShadow = "0 12px 28px rgba(37, 99, 235, 0.7)";
    };
    btn.onmouseleave = () => {
      btn.style.background = "rgba(15, 23, 42, 0.6)";
      btn.style.borderColor = "rgba(148, 163, 184, 0.35)";
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = "0 8px 20px rgba(0,0,0,0.35)";
    };
  }

  // ========== + NOTE BUTTON ==========
  const addBtn = document.createElement("button");
  addBtn.textContent = "+";
  styleIconButton(addBtn);

  addBtn.onclick = () => {
    const newNote = {
      id: Date.now(),
      x: 120,
      y: 120,
      width: 260,
      height: 170,
      content: "",
    };
    notes.push(newNote);
    saveNotes();
    createNoteElement(newNote, true);
  };

  // ========== NOTES LIST BUTTON ==========
  const listBtn = document.createElement("button");
  listBtn.innerHTML = "📂"; // folder icon (you can swap this)
  styleIconButton(listBtn);
  listBtn.onclick = toggleNotesList;

  // ========== HIDE TOOLBAR BUTTON ==========
  const hideBtn = document.createElement("button");
  hideBtn.textContent = "✕";
  styleIconButton(hideBtn);
  hideBtn.onclick = () => {
    bar.style.display = "none";
    showFloatingButton();
  };

  // append all
  bar.appendChild(addBtn);
  bar.appendChild(listBtn);
  bar.appendChild(hideBtn);

  document.body.appendChild(bar);
}

// ========== FLOATING REOPEN BUTTON ==========
function showFloatingButton() {
  if (document.getElementById("qn-reopen")) return;

  const btn = document.createElement("div");
  btn.id = "qn-reopen";
  btn.textContent = "📝";
  btn.style.position = "fixed";
  btn.style.bottom = "22px";
  btn.style.right = "22px";
  btn.style.zIndex = "999999999";
  btn.style.width = "52px";
  btn.style.height = "52px";
  btn.style.borderRadius = "999px";
  btn.style.display = "flex";
  btn.style.alignItems = "center";
  btn.style.justifyContent = "center";
  btn.style.background = "rgba(15, 23, 42, 0.85)";
  btn.style.backdropFilter = "blur(18px)";
  btn.style.border = "1px solid rgba(148, 163, 184, 0.35)";
  btn.style.boxShadow = "0 18px 40px rgba(0,0,0,0.8)";
  btn.style.cursor = "pointer";
  btn.style.fontSize = "22px";
  btn.style.color = "#e5e7eb";
  btn.style.transition = "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease";

  btn.onmouseenter = () => {
    btn.style.transform = "translateY(-2px) scale(1.03)";
    btn.style.background = "rgba(30, 64, 175, 0.95)";
    btn.style.boxShadow = "0 22px 55px rgba(37, 99, 235, 0.8)";
  };
  btn.onmouseleave = () => {
    btn.style.transform = "translateY(0) scale(1)";
    btn.style.background = "rgba(15, 23, 42, 0.85)";
    btn.style.boxShadow = "0 18px 40px rgba(0,0,0,0.8)";
  };

  btn.onclick = () => {
    btn.remove();
    const bar = document.getElementById("qn-toolbar");
    if (bar) {
      bar.style.display = "flex";
    } else {
      createToolbar();
    }
  };

  document.body.appendChild(btn);
}

// ========== LIST PANEL ==========
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

  const nonEmptyNotes = notes.filter(
    (n) => (n.content || "").trim() !== ""
  );

  if (nonEmptyNotes.length === 0) {
    panel.textContent = "No notes on this site.";
    document.body.appendChild(panel);
    return;
  }

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

// ========== SHOW NOTE ==========
function showNote(id) {
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  const el = document.getElementById("note-" + id);
  if (el) {
    el.style.display = "flex";
    el.style.zIndex = "99999999";
  }
}

// ========== CREATE NOTE ELEMENT ==========
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

  const head = document.createElement("div");
  head.style.background = "#1976d2";
  head.style.color = "white";
  head.style.padding = "4px 8px";
  head.style.fontSize = "12px";
  head.style.display = "flex";
  head.style.justifyContent = "space-between";
  head.style.alignItems = "center";

  const title = document.createElement("span");
  title.textContent = "Note";

  // CLOSE (hide)
  const closeBtn = document.createElement("span");
  closeBtn.textContent = "✕";
  closeBtn.style.cursor = "pointer";
  closeBtn.onclick = () => (wrap.style.display = "none");

  // DELETE (remove)
  const deleteBtn = document.createElement("span");
  deleteBtn.textContent = "🗑";
  deleteBtn.style.cursor = "pointer";
  deleteBtn.style.marginLeft = "10px";
  deleteBtn.onclick = () => {
    notes = notes.filter(n => n.id !== note.id);
    saveNotes();
    wrap.remove();
  };

  const buttons = document.createElement("div");
  buttons.style.display = "flex";
  buttons.style.gap = "6px";
  buttons.appendChild(closeBtn);
  buttons.appendChild(deleteBtn);

  head.appendChild(title);
  head.appendChild(buttons);

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

// ========== LISTEN FOR POPUP ACTION ==========
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "showToolbar") {
    const bar = document.getElementById("qn-toolbar");
    if (bar) {
      bar.style.display = "flex";
    } else {
      createToolbar();
    }
  }
});
