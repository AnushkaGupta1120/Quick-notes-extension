chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { action: "showToolbar" });
  window.close(); // closes popup instantly → no white message box
});
