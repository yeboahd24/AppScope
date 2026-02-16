// Auth bridge content script — runs on the AppScope web app domain
// Reads the Supabase session from localStorage and stores it in chrome.storage.local

(function () {
  function getSupabaseSession() {
    // Supabase stores auth in localStorage with a key pattern like:
    // sb-<project-ref>-auth-token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.access_token && data.user) {
            return {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              user_id: data.user.id,
              user_email: data.user.email,
            };
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    return null;
  }

  function syncSession() {
    const session = getSupabaseSession();
    if (session) {
      chrome.storage.local.set({
        appscope_session: session,
        appscope_session_updated: Date.now(),
      });
    }
  }

  // Sync on load
  syncSession();

  // Re-sync periodically (every 30 seconds) in case the user signs in/out
  setInterval(syncSession, 30000);

  // Listen for storage changes (e.g. when Supabase refreshes the token)
  window.addEventListener("storage", () => {
    syncSession();
  });

  // Respond to extension detection pings from the web app
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "APPSCOPE_PING") {
      window.postMessage(
        { type: "APPSCOPE_PONG", version: "1.0.0" },
        "*"
      );
    }
  });
})();
