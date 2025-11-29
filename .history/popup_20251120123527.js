chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  chrome.tabs.sendMessage(tabs[0].id, { type: "TOGGLE_SITE_PANEL" });
  window.close(); // close browser popup
});
