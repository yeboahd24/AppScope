// Background service worker for AppScope Chrome Extension
// Handles message routing, Supabase REST API calls, and risk scoring

const SUPABASE_URL = "https://xfprwyojsobfvygqogrx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcHJ3eW9qc29iZnZ5Z3FvZ3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTczMTgsImV4cCI6MjA4NjU5MzMxOH0.AlkVkZVGvm8YHms9UU1LeSvNYZpUylKa_9Kh8TVk3Wc";

// Known apps for risk matching (subset of commonApps.js)
const KNOWN_APPS = {
  "spotify": { risk: "safe", icon: "\ud83c\udfb5", category: "Entertainment" },
  "netflix": { risk: "safe", icon: "\ud83c\udfac", category: "Entertainment" },
  "youtube music": { risk: "safe", icon: "\ud83c\udfa7", category: "Entertainment" },
  "disney+": { risk: "safe", icon: "\u2728", category: "Entertainment" },
  "twitch": { risk: "safe", icon: "\ud83d\udfea", category: "Entertainment" },
  "tiktok": { risk: "safe", icon: "\ud83d\udcf1", category: "Social" },
  "instagram": { risk: "safe", icon: "\ud83d\udcf7", category: "Social" },
  "twitter / x": { risk: "safe", icon: "\ud83d\udc26", category: "Social" },
  "twitter": { risk: "safe", icon: "\ud83d\udc26", category: "Social" },
  "x": { risk: "safe", icon: "\ud83d\udc26", category: "Social" },
  "facebook": { risk: "risky", icon: "\ud83d\udc64", category: "Social" },
  "snapchat": { risk: "safe", icon: "\ud83d\udc7b", category: "Social" },
  "linkedin": { risk: "safe", icon: "\ud83d\udcbc", category: "Social" },
  "discord": { risk: "safe", icon: "\ud83c\udfae", category: "Social" },
  "reddit": { risk: "safe", icon: "\ud83e\udda0", category: "Social" },
  "slack": { risk: "safe", icon: "\ud83d\udcac", category: "Productivity" },
  "notion": { risk: "risky", icon: "\ud83d\udcdd", category: "Productivity" },
  "trello": { risk: "safe", icon: "\ud83d\udccb", category: "Productivity" },
  "asana": { risk: "safe", icon: "\u2705", category: "Productivity" },
  "zoom": { risk: "safe", icon: "\ud83d\udcf9", category: "Productivity" },
  "canva": { risk: "risky", icon: "\ud83c\udfa8", category: "Productivity" },
  "dropbox": { risk: "risky", icon: "\ud83d\udce6", category: "Productivity" },
  "evernote": { risk: "risky", icon: "\ud83d\udc18", category: "Productivity" },
  "monday.com": { risk: "safe", icon: "\ud83d\udcc5", category: "Productivity" },
  "calendly": { risk: "safe", icon: "\ud83d\uddd3\ufe0f", category: "Productivity" },
  "github": { risk: "safe", icon: "\ud83d\udc19", category: "Developer" },
  "gitlab": { risk: "safe", icon: "\ud83e\udd8a", category: "Developer" },
  "vercel": { risk: "safe", icon: "\u25b2", category: "Developer" },
  "netlify": { risk: "safe", icon: "\ud83c\udf10", category: "Developer" },
  "figma": { risk: "safe", icon: "\ud83d\udd8c", category: "Developer" },
  "heroku": { risk: "safe", icon: "\u2601\ufe0f", category: "Developer" },
  "replit": { risk: "safe", icon: "\ud83d\udcbb", category: "Developer" },
  "amazon": { risk: "safe", icon: "\ud83d\udce6", category: "Shopping" },
  "ebay": { risk: "safe", icon: "\ud83d\udecf\ufe0f", category: "Shopping" },
  "shopify": { risk: "safe", icon: "\ud83d\uded2", category: "Shopping" },
  "paypal": { risk: "safe", icon: "\ud83d\udcb3", category: "Finance" },
  "cash app": { risk: "safe", icon: "\ud83d\udcb5", category: "Finance" },
  "robinhood": { risk: "safe", icon: "\ud83d\udcc8", category: "Finance" },
};

// Risky permission keywords
const RISKY_KEYWORDS = [
  "manage", "delete", "send email", "modify", "write",
  "manage email", "manage contacts", "manage calendar", "manage files",
  "full access", "all data",
];

const SAFE_KEYWORDS = [
  "view", "see your", "basic info", "profile info", "sign in",
  "view email", "read only", "has access to your google",
  "has access to your account", "has access",
];

function scoreRisk(name, permissions) {
  // Check known apps first
  const key = name.toLowerCase().trim();
  for (const [knownName, data] of Object.entries(KNOWN_APPS)) {
    if (key === knownName || key.includes(knownName) || knownName.includes(key)) {
      return { risk: data.risk, icon: data.icon, category: data.category };
    }
  }

  // Score based on permission keywords
  const permsLower = permissions.toLowerCase();
  const hasRisky = RISKY_KEYWORDS.some((kw) => permsLower.includes(kw));
  const hasSafe = SAFE_KEYWORDS.some((kw) => permsLower.includes(kw));

  const risk = hasRisky ? "risky" : "safe";

  return { risk, icon: "\ud83d\udd0c", category: "Other" };
}

async function getSession() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["appscope_session"], (result) => {
      resolve(result.appscope_session || null);
    });
  });
}

async function syncAppsToSupabase(scrapedApps) {
  const session = await getSession();
  if (!session || !session.access_token || !session.user_id) {
    return { success: false, error: "Not signed in" };
  }

  // Score and prepare rows
  const rows = scrapedApps.map((app) => {
    const scored = scoreRisk(app.name, app.permissions);
    return {
      user_id: session.user_id,
      app_name: app.name,
      app_icon: scored.category !== "Other" ? scored.icon : app.name.charAt(0).toUpperCase(),
      permissions: app.permissions,
      risk_level: scored.risk,
      category: scored.category,
      is_custom: false,
    };
  });

  // Delete existing non-revoked, non-custom apps for this user first
  const deleteResp = await fetch(
    `${SUPABASE_URL}/rest/v1/user_apps?user_id=eq.${session.user_id}&is_revoked=eq.false&is_custom=eq.false`,
    {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${session.access_token}`,
      },
    }
  );

  if (!deleteResp.ok) {
    const delErr = await deleteResp.text();
    console.error("AppScope: Delete error", delErr);
  }

  // Insert fresh scan results
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/user_apps`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(rows),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AppScope: Supabase sync error", errorText);
    return { success: false, error: "Failed to sync to Supabase" };
  }

  // Save scan metadata
  chrome.storage.local.set({
    appscope_last_scan: Date.now(),
    appscope_last_count: scrapedApps.length,
  });

  return { success: true, count: scrapedApps.length };
}

// Message handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "APPS_SCRAPED") {
    // Auto-scrape result from content script
    // IMPORTANT: return true to keep the message channel open for async work
    // This prevents MV3 service worker from being killed during the sync
    console.log("[AppScope BG] Received", msg.apps.length, "scraped apps");

    if (msg.apps.length === 0) {
      // Nothing to sync — store the empty result so popup knows we tried
      chrome.storage.local.set({
        appscope_sync_result: { success: true, count: 0 },
        appscope_last_scan: Date.now(),
        appscope_last_count: 0,
      });
      sendResponse({ received: true, count: 0 });
      return false;
    }

    syncAppsToSupabase(msg.apps).then((result) => {
      console.log("[AppScope BG] Sync result:", result);
      chrome.storage.local.set({ appscope_sync_result: result });
      sendResponse({ received: true, count: result.count || 0 });
    }).catch((err) => {
      console.error("[AppScope BG] Sync error:", err);
      const errorResult = { success: false, error: err.message };
      chrome.storage.local.set({ appscope_sync_result: errorResult });
      sendResponse({ received: true, error: err.message });
    });
    return true; // MUST return true for async sendResponse
  }

  if (msg.type === "GET_STATUS") {
    // Popup asking for current status
    chrome.storage.local.get(
      [
        "appscope_session",
        "appscope_last_scan",
        "appscope_last_count",
        "appscope_sync_result",
      ],
      (data) => {
        sendResponse({
          signedIn: !!(data.appscope_session && data.appscope_session.access_token),
          userEmail: data.appscope_session?.user_email || null,
          lastScan: data.appscope_last_scan || null,
          lastCount: data.appscope_last_count || 0,
          syncResult: data.appscope_sync_result || null,
        });
      }
    );
    return true; // async response
  }

  if (msg.type === "MANUAL_SYNC") {
    // Popup triggered sync with provided apps
    syncAppsToSupabase(msg.apps).then((result) => {
      sendResponse(result);
    });
    return true; // async response
  }

  if (msg.type === "START_SCAN") {
    // Clear old scan results first so popup doesn't pick up stale data
    chrome.storage.local.remove(["appscope_sync_result"], () => {
      const scanUrl = "https://myaccount.google.com/connections?filters=3,4&hl=en";
      console.log("[AppScope BG] Opening scan URL:", scanUrl);

      chrome.tabs.create({ url: scanUrl, active: true }, (tab) => {
        chrome.storage.local.set({ appscope_scan_tab: tab.id });
        sendResponse({ tabId: tab.id });

        // Wait for the tab to finish loading, then programmatically inject the content script.
        // This is more reliable than relying on manifest content_scripts matching.
        const onUpdated = (tabId, changeInfo) => {
          if (tabId !== tab.id || changeInfo.status !== "complete") return;
          chrome.tabs.onUpdated.removeListener(onUpdated);

          console.log("[AppScope BG] Tab loaded, waiting for dynamic content...");

          // Give Google's JS 3 seconds to render initial content
          setTimeout(() => {
            console.log("[AppScope BG] Injecting content script into tab", tab.id);
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"],
            }).then(() => {
              console.log("[AppScope BG] Content script injected successfully");
            }).catch((err) => {
              console.error("[AppScope BG] Failed to inject content script:", err);
            });
          }, 4000);
        };

        chrome.tabs.onUpdated.addListener(onUpdated);
      });
    });
    return true; // async response
  }

  if (msg.type === "CLEAR_SESSION") {
    chrome.storage.local.remove([
      "appscope_session",
      "appscope_session_updated",
      "appscope_last_scan",
      "appscope_last_count",
      "appscope_sync_result",
    ]);
    sendResponse({ cleared: true });
    return false;
  }
});
