// Extension popup logic

const $ = (id) => document.getElementById(id);

const loadingEl = $("loading");
const notSignedInEl = $("not-signed-in");
const signedInEl = $("signed-in");
const scanBtn = $("scan-btn");
const scanningEl = $("scanning");
const scanResultEl = $("scan-result");
const resultTextEl = $("result-text");
const lastScanInfoEl = $("last-scan-info");
const appCountEl = $("app-count");
const lastScanTimeEl = $("last-scan-time");
const userAvatarEl = $("user-avatar");
const userEmailEl = $("user-email");

function showState(state) {
  loadingEl.classList.add("hidden");
  notSignedInEl.classList.add("hidden");
  signedInEl.classList.add("hidden");

  if (state === "loading") loadingEl.classList.remove("hidden");
  else if (state === "not-signed-in") notSignedInEl.classList.remove("hidden");
  else if (state === "signed-in") signedInEl.classList.remove("hidden");
}

function formatTime(timestamp) {
  if (!timestamp) return "Never";
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function init() {
  showState("loading");

  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (status) => {
    if (chrome.runtime.lastError) {
      showState("not-signed-in");
      return;
    }

    if (!status || !status.signedIn) {
      showState("not-signed-in");
      return;
    }

    // Show signed-in state
    showState("signed-in");

    // Set user info
    const email = status.userEmail || "User";
    userEmailEl.textContent = email;
    userAvatarEl.textContent = email.charAt(0).toUpperCase();

    // Show last scan info if available
    if (status.lastScan) {
      lastScanInfoEl.classList.remove("hidden");
      appCountEl.textContent = status.lastCount || 0;
      lastScanTimeEl.textContent = formatTime(status.lastScan);
    }

    // Show sync result if recently completed
    if (status.syncResult && status.syncResult.success && status.lastScan) {
      const timeSinceScan = Date.now() - status.lastScan;
      if (timeSinceScan < 60000 && status.syncResult.count > 0) {
        showScanResult(status.syncResult.count);
      }
    }
  });
}

function showScanResult(count) {
  scanBtn.classList.add("hidden");
  scanningEl.classList.add("hidden");
  scanResultEl.classList.remove("hidden");

  if (count > 0) {
    resultTextEl.textContent = `Found ${count} app${count !== 1 ? "s" : ""} — synced to AppScope!`;
  } else {
    resultTextEl.textContent = "No apps found. Open the console on the Google permissions page for debug info.";
  }

  // Update last scan info
  lastScanInfoEl.classList.remove("hidden");
  appCountEl.textContent = count;
  lastScanTimeEl.textContent = "Just now";
}

function showScanError(msg) {
  scanningEl.classList.add("hidden");
  scanResultEl.classList.remove("hidden");
  scanBtn.classList.remove("hidden");
  resultTextEl.textContent = msg || "Scan failed. Try again.";
  scanBtn.textContent = "\uD83D\uDD0D Retry Scan";
}

// Track when we started scanning to avoid picking up stale results
let scanStartTime = 0;

// Scan button handler
scanBtn.addEventListener("click", () => {
  scanBtn.classList.add("hidden");
  scanResultEl.classList.add("hidden");
  scanningEl.classList.remove("hidden");
  scanStartTime = Date.now();

  // Open the permissions page — background clears old results first
  chrome.runtime.sendMessage({ type: "START_SCAN" }, (response) => {
    if (chrome.runtime.lastError) {
      showScanError("Could not open scan page.");
      return;
    }

    // Poll for results — the content script will send data to background
    let attempts = 0;
    const maxAttempts = 120; // 60 seconds (120 * 500ms) — allows time for pagination

    const pollResult = setInterval(() => {
      attempts++;

      chrome.storage.local.get(
        ["appscope_sync_result", "appscope_last_scan"],
        (data) => {
          const result = data.appscope_sync_result;
          const lastScan = data.appscope_last_scan;

          // Only accept results that are newer than when we started this scan
          if (result && lastScan && lastScan >= scanStartTime) {
            clearInterval(pollResult);
            if (result.success) {
              showScanResult(result.count);
            } else {
              showScanError(result.error || "Sync failed. Check if you're signed in.");
            }
            return;
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollResult);
            showScanError("Scan timed out. Make sure the Google permissions page loaded fully, then try again.");
          }
        }
      );
    }, 500);
  });
});

// Initialize on load
document.addEventListener("DOMContentLoaded", init);
