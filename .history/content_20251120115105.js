// Get the current website URL (cleaned)
const currentURL = window.location.origin;

// Load saved note
chrome.storage.sync.get([currentURL], function(result) {
    const savedText = result[currentURL] || "";

    // Create note box
    const note = document.createElement("textarea");
    note.value = savedText;
    note.style.position = "fixed";
    note.style.bottom = "20px";
    note.style.right = "20px";
    note.style.width = "200px";
    note.style.height = "150px";
    note.style.zIndex = "999999";
    note.style.padding = "10px";
    note.style.border = "2px solid #222";
    note.style.borderRadius = "8px";
    note.style.background = "#fff9c4"; // light yellow sticky note
    note.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
    note.style.fontSize = "14px";

    document.body.appendChild(note);

    // Auto-save on typing
    note.addEventListener("input", () => {
        chrome.storage.sync.set({ [currentURL]: note.value });
    });
});
