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


// ====================================================================
// =======================  TOOLBAR (GLASS)  ==========================
// ====================================================================

function createToolbar() {
  if (document.getElementById("qn-toolbar")) return;

  const bar = document.createElement("div");
  bar.id = "qn-toolbar";

  // DARK GLASSMORPHISM NAVBAR
  bar.style.position = "fixed";
  bar.style.top = "20px";
  bar.style.right = "20px";
  bar.style.zIndex = "999999999";
  bar.style.padding = "10px 18px";
  bar.style.borderRadius = "999px";
  bar.style.background = "rgba(15, 23, 42, 0.75)";
  bar.style.backdropFilter = "blur(18px)";
  bar.style.border = "1px solid rgba(148, 163, 184, 0.25)";
  bar.style.boxShadow = "0 18px 45px rgba(0,0,0,0.65)";
  bar.style.display = "flex";
  bar.style.alignItems = "center";
  bar.style.gap = "16px";
  bar.style.fontFamily = "system-ui, sans-serif";
  bar.style.color = "#e5e7eb";
  bar.style.transition = "0.2s ease";

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

  // helper for icon buttons
  function styleIcon(btn) {
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.width = "34px";
    btn.style.height = "34px";
    btn.style.borderRadius = "999px";
    btn.style.border = "1px solid rgba(148,163,184,0.35)";
    btn.style.background = "rgba(15,23,42,0.6)";
    btn.style.color = "#e5e7eb";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "16px";
    btn.style.transition = "0.2s";
  }

  function hoverEffect(btn) {
    btn.onmouseenter = () => {
      btn.style.background = "rgba(30, 64, 175, 0.85)";
      btn.style.borderColor = "rgba(191,219,254,0.8)";
      btn.style.transform = "translateY(-1px)";
      btn.style.boxShadow = "0 12px 28px rgba(37,99,235,0.7)";
    };
    btn.onmouseleave = () => {
      btn.style.background = "rgba(15,23,42,0.6)";
      btn.style.borderColor = "rgba(148,163,184,0.35)";
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = "none";
    };
  }

  // ADD NOTE BUTTON
  const addBtn = document.createElement("button");
  addBtn.textContent = "+";
  styleIcon(addBtn);
  hoverEffect(addBtn);

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


  // NOTES LIST BUTTON
  const listBtn = document.createElement("button");
  listBtn.textContent = "📂";
  styleIcon(listBtn);
  hoverEffect(listBtn);
  listBtn.onclick = toggleNotesList;


  // HIDE TOOLBAR BUTTON
  const hideBtn = document.createElement("button");
  hideBtn.textContent = "✕";
  styleIcon(hideBtn);
  hoverEffect(hideBtn);

  hideBtn.onclick = () => {
    bar.style.display = "none";
    showFloatingButton();
  };

  bar.appendChild(addBtn);
  bar.appendChild(listBtn);
  bar.appendChild(hideBtn);

  document.body.appendChild(bar);
}



// ====================================================================
// ================ Floating Bubble (Reopen Toolbar) ===================
// ====================================================================

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
  btn.style.background = "rgba(15,23,42,0.85)";
  btn.style.backdropFilter = "blur(18px)";
  btn.style.border = "1px solid rgba(148,163,184,0.35)";
  btn.style.boxShadow = "0 18px 40px rgba(0,0,0,0.8)";
  btn.style.cursor = "pointer";
  btn.style.fontSize = "22px";
  btn.style.color = "#e5e7eb";
  btn.style.transition = "0.25s";

  btn.onmouseenter = () => {
    btn.style.transform = "translateY(-2px) scale(1.05)";
    btn.style.background = "rgba(30, 64, 175, 0.95)";
  };
  btn.onmouseleave = () => {
    btn.style.transform = "scale(1)";
    btn.style.background = "rgba(15,23,42,0.85)";
  };

  btn.onclick = () => {
    btn.remove();
    const bar = document.getElementById("qn-toolbar");
    if (bar) bar.style.display = "flex";
    else createToolbar();
  };

  document.body.appendChild(btn);
}



// ====================================================================
// ======================= NOTES LIST POPUP ===========================
// ====================================================================

function toggleNotesList() {
  const existing = document.getElementById("qn-list");
  if (existing) return existing.remove();

  const panel = document.createElement("div");
  panel.id = "qn-list";

  panel.style.position = "fixed";
  panel.style.top = "70px";
  panel.style.right = "20px";
  panel.style.zIndex = "999999999";
  panel.style.width = "260px";
  panel.style.maxHeight = "300px";
  panel.style.background = "rgba(15,23,42,0.75)";
  panel.style.backdropFilter = "blur(18px)";
  panel.style.border = "1px solid rgba(148,163,184,0.25)";
  panel.style.boxShadow = "0 18px 40px rgba(0,0,0,0.65)";
  panel.style.borderRadius = "14px";
  panel.style.padding = "12px";
  panel.style.overflowY = "auto";
  panel.style.fontFamily = "Inter, sans-serif";
  panel.style.color = "#e5e7eb";

  const nonEmptyNotes = notes.filter(n => (n.content || "").trim() !== "");

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
      item.style.padding = "8px 6px";
      item.style.borderBottom = "1px solid rgba(148,163,184,0.25)";
      item.style.cursor = "pointer";
      item.style.transition = "0.2s";

      item.textContent = n.content.trim().slice(0, 40);

      item.onmouseenter = () => item.style.background = "rgba(30,41,59,0.6)";
      item.onmouseleave = () => item.style.background = "transparent";

      item.onclick = () => {
        document.getElementById("qn-list")?.remove();
        showNote(n.id);
      };

      panel.appendChild(item);
    });

  document.body.appendChild(panel);
}



// ====================================================================
// =========================== SHOW NOTE ==============================
// ====================================================================

function showNote(id) {
  const el = document.getElementById("note-" + id);
  if (el) {
    el.style.display = "flex";
    el.style.zIndex = "99999999";
  }
}



// ====================================================================
// ====================== NOTE CARD (GLASS) ===========================
// ====================================================================

function createNoteElement(note, show = false) {
  const wrap = document.createElement("div");
  wrap.id = "note-" + note.id;

  // ========== BASIC NOTE STYLES ==========
  wrap.style.position = "fixed";
  wrap.style.left = note.x + "px";
  wrap.style.top = note.y + "px";
  wrap.style.width = note.width + "px";
  wrap.style.height = note.height + "px";
  wrap.style.zIndex = "9999999";
  wrap.style.background = "rgba(15,23,42,0.65)";
  wrap.style.backdropFilter = "blur(14px)";
  wrap.style.border = "1px solid rgba(148,163,184,0.25)";
  wrap.style.borderRadius = "14px";
  wrap.style.display = show ? "flex" : "none";
  wrap.style.flexDirection = "column";
  wrap.style.boxShadow = "0 18px 40px rgba(0,0,0,0.55)";
  wrap.style.overflow = "hidden";
  wrap.style.fontFamily = "Inter, sans-serif";
  wrap.style.transition = "0.15s ease";
  wrap.style.resize = "both";
  wrap.style.minWidth = "180px";
  wrap.style.minHeight = "120px";

  // ========== HEADER / DRAG AREA ==========
  const head = document.createElement("div");
  head.style.background = "rgba(255,255,255,0.06)";
  head.style.borderBottom = "1px solid rgba(148,163,184,0.25)";
  head.style.padding = "6px 10px";
  head.style.fontSize = "13px";
  head.style.fontWeight = "600";
  head.style.color = "#e5e7eb";
  head.style.display = "flex";
  head.style.justifyContent = "space-between";
  head.style.cursor = "move"; // <-- DRAG CURSOR

  const title = document.createElement("span");
  title.textContent = "Note";

  const closeBtn = document.createElement("span");
  closeBtn.textContent = "✕";
  closeBtn.style.cursor = "pointer";
  closeBtn.onclick = () => (wrap.style.display = "none");

  const deleteBtn = document.createElement("span");
  deleteBtn.textContent = "🗑";
  deleteBtn.style.cursor = "pointer";
  deleteBtn.onclick = () => {
    notes = notes.filter(n => n.id !== note.id);
    saveNotes();
    wrap.remove();
  };

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "8px";
  actions.appendChild(closeBtn);
  actions.appendChild(deleteBtn);

  head.appendChild(title);
  head.appendChild(actions);

  // ========== TEXTAREA ==========
  const ta = document.createElement("textarea");
  ta.value = note.content || "";
  ta.style.flex = "1";
  ta.style.padding = "12px";
  ta.style.border = "none";
  ta.style.outline = "none";
  ta.style.fontSize = "14px";
  ta.style.color = "#f1f5f9";
  ta.style.background = "transparent";
  ta.style.resize = "none"; // resizing handled by wrapper, not textarea

  ta.oninput = () => {
    note.content = ta.value;
    saveNotes();
  };

  wrap.appendChild(head);
  wrap.appendChild(ta);
  document.body.appendChild(wrap);

  // ====================================================================
  // ===================== DRAGGING FUNCTIONALITY =======================
  // ====================================================================
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  head.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - wrap.offsetLeft;
    offsetY = e.clientY - wrap.offsetTop;
    wrap.style.transition = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    wrap.style.left = e.clientX - offsetX + "px";
    wrap.style.top = e.clientY - offsetY + "px";
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;

      note.x = wrap.offsetLeft;
      note.y = wrap.offsetTop;
      saveNotes();

      wrap.style.transition = "0.15s ease";
    }
  });

  // ====================================================================
  // =================== SAVE POS & SIZE WHEN RESIZED ===================
  // ====================================================================

  const observer = new ResizeObserver(() => {
    note.width = wrap.offsetWidth;
    note.height = wrap.offsetHeight;
    saveNotes();
  });

  observer.observe(wrap);
}



// ====================================================================
// ========================= POPUP MESSAGE ============================
// ====================================================================

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "showToolbar") {
    const bar = document.getElementById("qn-toolbar");
    if (bar) bar.style.display = "flex";
    else createToolbar();
  }
});
