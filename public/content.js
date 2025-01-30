// Extracts all visible text from the webpage.
function getVisibleText() {
  return document.body.innerText;
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📩 Message received in content.js:", request); // Debugging log

  if (request.action === "getText") {
      console.log("✅ Extracting visible text..."); // Debugging log
      sendResponse({ text: getVisibleText() });
  }
});

console.log("✅ Content script (content.js) is running on this page!");
