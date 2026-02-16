// Content script for myaccount.google.com/connections (formerly /permissions)
// Scrapes connected third-party app info from the Google account page

(function () {
  console.log("[AppScope] === Content script executing ===", window.location.href);

  // Guard against double-injection (manifest match + programmatic injection)
  if (window.__appscopeInjected) {
    console.log("[AppScope] Already injected, skipping.");
    return;
  }
  window.__appscopeInjected = true;

  const MAX_WAIT = 20000;
  const POLL_INTERVAL = 1500;

  // Google UI text to filter out — these are NOT app names
  const IGNORE_TEXT = [
    "third-party apps", "third party apps", "apps & services",
    "apps with account access", "signing in with google",
    "signed in with google", "remove access", "delete all connections",
    "see details", "learn more", "sign-in & security", "google account",
    "manage your account", "personal info", "data & privacy", "security",
    "people & sharing", "payments & subscriptions", "about", "back",
    "home", "help", "privacy", "terms", "google llc", "google",
    "these apps", "some level of access", "you gave", "has access",
    "can access", "go to", "review", "feedback", "search",
    "menu", "close", "cancel", "confirm", "done", "next",
    "account", "connections", "your connections", "filters",
    "third-party apps & services", "third-party apps with account access",
    "apps connected to your account", "show more", "load more",
    "sort by", "sort", "name", "recent", "date",
  ];

  function isIgnored(text) {
    const lower = text.toLowerCase().trim();
    if (lower.length < 2 || lower.length > 80) return true;
    return IGNORE_TEXT.some(ig => lower === ig || lower.startsWith(ig + " ") || lower.includes("has access to"));
  }

  // Get all leaf-node text in order within an element
  function getLeafTexts(el) {
    const texts = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walk.nextNode())) {
      const t = node.textContent.trim();
      if (t && t.length >= 2) texts.push(t);
    }
    return texts;
  }

  // Walk into shadow roots recursively to find all img elements
  function findAllImages(root) {
    const imgs = Array.from(root.querySelectorAll("img"));
    root.querySelectorAll("*").forEach(el => {
      if (el.shadowRoot) {
        imgs.push(...findAllImages(el.shadowRoot));
      }
    });
    return imgs;
  }

  // Find the "list item" container for an image by walking up
  // until we find an element whose parent has multiple similar children
  function findItemContainer(img) {
    let el = img.parentElement;
    for (let depth = 0; depth < 10; depth++) {
      if (!el || el === document.body || el === document.documentElement) return null;

      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        // If the parent has 2+ children that each contain an image,
        // this level is likely the "list item" level
        const siblingsWithImg = siblings.filter(s => s.querySelector("img"));
        if (siblingsWithImg.length >= 2) {
          return el;
        }
      }
      el = parent;
    }

    // Fallback: return a parent with a reasonable text length
    el = img.parentElement;
    for (let depth = 0; depth < 6; depth++) {
      if (!el || el === document.body) return null;
      const text = (el.textContent || "").trim();
      if (text.length >= 3 && text.length <= 400) return el;
      el = el.parentElement;
    }
    return null;
  }

  function scrapeApps() {
    const apps = [];
    const seen = new Set();

    console.log("[AppScope] Scraping started on:", window.location.href);

    // ── STRATEGY 1: Image-anchored scraping ──
    // Find all images, filter to app-icon-sized ones, then extract text from their containers
    const allImages = findAllImages(document);
    console.log("[AppScope] Total images found:", allImages.length);

    const iconImages = allImages.filter(img => {
      try {
        const rect = img.getBoundingClientRect();
        const w = rect.width || img.naturalWidth || 0;
        const h = rect.height || img.naturalHeight || 0;
        // App icons are typically 24-80px. Skip tiny icons and large banners.
        if (w < 18 || h < 18 || w > 150 || h > 150) return false;
        // Skip Google branding images
        const src = (img.src || "").toLowerCase();
        if (src.includes("googlelogo") || src.includes("/branding/")) return false;
        return true;
      } catch {
        return false;
      }
    });

    console.log("[AppScope] Icon-sized images:", iconImages.length);

    for (const img of iconImages) {
      const container = findItemContainer(img);
      if (!container) continue;

      const texts = getLeafTexts(container).filter(t => !isIgnored(t));
      if (texts.length === 0) continue;

      // First non-ignored text is likely the app name
      const name = texts[0];
      if (!name || name.length > 70 || name.length < 2) continue;
      if (seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());

      // Remaining texts could be permission descriptions
      const permTexts = texts.slice(1).filter(t => t.length > 3 && t.length < 200);

      apps.push({
        name,
        iconUrl: img.src || "",
        permissions: permTexts.length > 0
          ? permTexts.slice(0, 3).join("; ")
          : "Has access to your Google Account",
      });
    }

    console.log("[AppScope] Strategy 1 (image-anchored) found:", apps.length);

    // ── STRATEGY 2: Accessible role-based scraping ──
    if (apps.length === 0) {
      const roleItems = document.querySelectorAll(
        '[role="listitem"], [role="option"], [role="row"], [data-item-id]'
      );
      console.log("[AppScope] Strategy 2: role-based items found:", roleItems.length);

      for (const item of roleItems) {
        const texts = getLeafTexts(item).filter(t => !isIgnored(t));
        if (texts.length === 0) continue;

        const name = texts[0];
        if (!name || name.length > 70 || name.length < 2) continue;
        if (seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        const itemImg = item.querySelector("img");
        const permTexts = texts.slice(1).filter(t => t.length > 3 && t.length < 200);

        apps.push({
          name,
          iconUrl: itemImg ? itemImg.src : "",
          permissions: permTexts.length > 0
            ? permTexts.slice(0, 3).join("; ")
            : "Has access to your Google Account",
        });
      }
      console.log("[AppScope] Strategy 2 total:", apps.length);
    }

    // ── STRATEGY 3: aria-label on elements with images ──
    if (apps.length === 0) {
      const labeled = document.querySelectorAll("[aria-label]");
      console.log("[AppScope] Strategy 3: aria-label elements:", labeled.length);

      for (const el of labeled) {
        const label = (el.getAttribute("aria-label") || "").trim();
        if (isIgnored(label)) continue;
        if (!el.querySelector("img")) continue;
        if (seen.has(label.toLowerCase())) continue;
        seen.add(label.toLowerCase());

        const elImg = el.querySelector("img");
        apps.push({
          name: label,
          iconUrl: elImg ? elImg.src : "",
          permissions: "Has access to your Google Account",
        });
      }
      console.log("[AppScope] Strategy 3 total:", apps.length);
    }

    // ── STRATEGY 4: Brute-force — find repeated sibling elements containing images ──
    if (apps.length === 0) {
      console.log("[AppScope] Strategy 4: brute-force sibling analysis");

      // Find any parent that has 2+ children each containing an <img>
      const allEls = document.querySelectorAll("*");
      let listParent = null;
      let listItems = [];

      for (const el of allEls) {
        if (el.children.length < 2) continue;
        const childrenWithImg = Array.from(el.children).filter(c => c.querySelector("img"));
        if (childrenWithImg.length >= 2) {
          // This looks like a list container
          if (childrenWithImg.length > listItems.length) {
            listParent = el;
            listItems = childrenWithImg;
          }
        }
      }

      if (listParent && listItems.length >= 2) {
        console.log("[AppScope] Found list parent with", listItems.length, "items");

        for (const item of listItems) {
          const texts = getLeafTexts(item).filter(t => !isIgnored(t));
          if (texts.length === 0) continue;

          const name = texts[0];
          if (!name || name.length > 70 || name.length < 2) continue;
          if (seen.has(name.toLowerCase())) continue;
          seen.add(name.toLowerCase());

          const itemImg = item.querySelector("img");
          const permTexts = texts.slice(1).filter(t => t.length > 3 && t.length < 200);

          apps.push({
            name,
            iconUrl: itemImg ? itemImg.src : "",
            permissions: permTexts.length > 0
              ? permTexts.slice(0, 3).join("; ")
              : "Has access to your Google Account",
          });
        }
      }
      console.log("[AppScope] Strategy 4 total:", apps.length);
    }

    // ── STRATEGY 5: Last resort — dump page text analysis ──
    if (apps.length === 0) {
      console.log("[AppScope] Strategy 5: page text dump for debugging");
      // Log what we can see on the page so the user can report the structure
      const bodyText = document.body ? document.body.innerText : "";
      const lines = bodyText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      console.log("[AppScope] Page has", lines.length, "text lines. First 30:");
      lines.slice(0, 30).forEach((line, i) => console.log(`  [${i}] ${line}`));

      // Try to extract app names from the text dump
      // Look for lines that appear before "Has access" or "Can access" lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isIgnored(line)) continue;
        if (line.length < 2 || line.length > 60) continue;

        // Check if a nearby line mentions "access" (suggesting this line is an app name)
        const nearby = lines.slice(Math.max(0, i - 1), i + 3).join(" ").toLowerCase();
        if (nearby.includes("access") || nearby.includes("sign in") || nearby.includes("permission")) {
          if (!seen.has(line.toLowerCase())) {
            seen.add(line.toLowerCase());
            apps.push({
              name: line,
              iconUrl: "",
              permissions: "Has access to your Google Account",
            });
          }
        }
      }
      console.log("[AppScope] Strategy 5 total:", apps.length);
    }

    console.log("[AppScope] Final result:", apps.length, "apps found");
    if (apps.length > 0) {
      apps.forEach(a => console.log("[AppScope]  -", a.name));
    }

    return apps;
  }

  function sendResults(apps) {
    try {
      chrome.runtime.sendMessage(
        {
          type: "APPS_SCRAPED",
          apps: apps,
          url: window.location.href,
          timestamp: Date.now(),
        },
        () => {
          if (chrome.runtime.lastError) {
            console.log("[AppScope] Could not send to background:", chrome.runtime.lastError.message);
          } else {
            console.log("[AppScope] Sent", apps.length, "apps to background");
          }
        }
      );
    } catch (e) {
      console.log("[AppScope] Extension context invalidated — reload the extension and try again.");
    }
  }

  // ── Pagination: scroll page + click "Show more" to load all apps ──

  // Regex patterns for pagination buttons (must be specific to avoid "Learn more" etc.)
  const PAGINATION_PATTERNS = [
    /^show\s*more$/i,
    /^load\s*more$/i,
    /^see\s*more$/i,
    /^view\s*more$/i,
    /^show\s*all$/i,
    /^see\s*all$/i,
    /^view\s*all$/i,
    /^next$/i,
    /^next\s*page$/i,
    /show\s*more\s*apps/i,
    /load\s*more\s*apps/i,
  ];

  function isPaginationButton(text) {
    const trimmed = text.trim();
    return PAGINATION_PATTERNS.some(re => re.test(trimmed));
  }

  function clickShowMore() {
    // Collect all clickable elements
    const candidates = document.querySelectorAll(
      'button, [role="button"], a[role="button"], [jsaction*="click"], [jscontroller] [role="button"]'
    );

    // First pass: exact pagination text match
    for (const btn of candidates) {
      const text = (btn.textContent || "").trim();
      if (isPaginationButton(text)) {
        console.log("[AppScope] Clicking pagination button (text):", text);
        btn.click();
        return true;
      }
    }

    // Second pass: aria-label match
    for (const btn of candidates) {
      const label = (btn.getAttribute("aria-label") || "").trim();
      if (label && isPaginationButton(label)) {
        console.log("[AppScope] Clicking pagination button (aria):", label);
        btn.click();
        return true;
      }
    }

    // Third pass: look for Google-style "expand" / "down arrow" buttons at bottom of list
    // Google sometimes uses an arrow icon button to load more items
    const listContainers = document.querySelectorAll('[role="list"], [role="listbox"]');
    for (const list of listContainers) {
      // Check the next sibling or parent's next sibling for a button
      let el = list.nextElementSibling;
      for (let i = 0; i < 3 && el; i++) {
        const btns = el.matches("button, [role='button']")
          ? [el]
          : Array.from(el.querySelectorAll("button, [role='button']"));
        for (const btn of btns) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            console.log("[AppScope] Clicking button after list:", (btn.textContent || "").trim().slice(0, 40));
            btn.click();
            return true;
          }
        }
        el = el.nextElementSibling;
      }
    }

    return false;
  }

  // Find the scrollable ancestor of the app list (cached after first find)
  let _scrollContainer = null;
  function findScrollContainer() {
    if (_scrollContainer) return _scrollContainer;

    // Walk up from icon images to find the nearest scrollable ancestor
    const iconImgs = findAllImages(document).filter(img => {
      try {
        const r = img.getBoundingClientRect();
        return r.width >= 18 && r.width <= 150 && r.height >= 18 && r.height <= 150;
      } catch { return false; }
    });

    if (iconImgs.length > 0) {
      let el = iconImgs[0].parentElement;
      for (let i = 0; i < 20 && el && el !== document.body; i++) {
        if (el.scrollHeight > el.clientHeight + 50) {
          try {
            const style = window.getComputedStyle(el);
            const oy = style.overflowY;
            if (oy === "auto" || oy === "scroll" || oy === "overlay") {
              console.log("[AppScope] Found scroll container:", el.tagName, (el.className || "").slice(0, 40));
              _scrollContainer = el;
              return el;
            }
          } catch { /* skip */ }
        }
        el = el.parentElement;
      }
    }
    return null;
  }

  function scrollToBottom() {
    let scrolled = false;

    // 1. Scroll the main document/window
    const prevY = window.scrollY;
    window.scrollTo(0, document.body.scrollHeight);
    if (window.scrollY !== prevY) scrolled = true;

    // 2. Scroll the specific container that holds the app list
    const container = findScrollContainer();
    if (container) {
      const prev = container.scrollTop;
      container.scrollTop = container.scrollHeight;
      if (container.scrollTop !== prev) scrolled = true;
    }

    return scrolled;
  }

  function countVisibleIcons() {
    return findAllImages(document).filter(img => {
      try {
        const rect = img.getBoundingClientRect();
        const w = rect.width || img.naturalWidth || 0;
        const h = rect.height || img.naturalHeight || 0;
        return w >= 18 && h >= 18 && w <= 150 && h <= 150;
      } catch { return false; }
    }).length;
  }

  function logVisibleButtons() {
    const btns = document.querySelectorAll('button, [role="button"]');
    const visible = [];
    for (const btn of btns) {
      const rect = btn.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const text = (btn.textContent || "").trim().slice(0, 60);
      if (text) visible.push(text);
    }
    console.log("[AppScope] Visible buttons on page:", visible.length);
    visible.slice(0, 15).forEach(t => console.log("[AppScope]   btn:", t));
  }

  async function loadAllApps() {
    const MAX_ROUNDS = 20;
    let prevIconCount = countVisibleIcons();
    let stableRounds = 0;

    console.log("[AppScope] Loading all apps (scrolling + pagination)...");
    console.log("[AppScope] Initial icon count:", prevIconCount);
    logVisibleButtons();

    for (let round = 1; round <= MAX_ROUNDS; round++) {
      // Try scrolling
      const didScroll = scrollToBottom();

      // Wait a beat for lazy-load triggers
      await new Promise(r => setTimeout(r, 800));

      // Try clicking "Show more" type buttons
      const didClick = clickShowMore();

      // Wait for new content to render
      if (didScroll || didClick) {
        console.log("[AppScope] Round", round, "- scrolled:", didScroll, "clicked:", didClick);
        await new Promise(r => setTimeout(r, 2000));
      } else {
        // Even if nothing scrolled/clicked, wait a moment and check for new content
        // (some pages load content after a delay)
        await new Promise(r => setTimeout(r, 1000));
      }

      // Count icons to detect if new content loaded
      const currentCount = countVisibleIcons();
      console.log("[AppScope] Round", round, "- icons:", prevIconCount, "→", currentCount);

      if (currentCount > prevIconCount) {
        // New content loaded — reset stability counter
        stableRounds = 0;
        prevIconCount = currentCount;
      } else {
        stableRounds++;
        if (stableRounds >= 3) {
          console.log("[AppScope] Content stable for 3 rounds, pagination complete.");
          break;
        }
      }
    }
  }

  async function waitAndScrape() {
    console.log("[AppScope] Starting scan — waiting for initial render...");

    // Use MutationObserver to detect when content is being added
    let lastMutationTime = Date.now();
    const observer = new MutationObserver(() => {
      lastMutationTime = Date.now();
    });
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });

    // Wait for initial page content to stabilize
    await new Promise(r => setTimeout(r, 2000));

    // Wait until mutations stop (page finished rendering)
    let waitCount = 0;
    while (waitCount < 10) {
      const timeSinceLastMutation = Date.now() - lastMutationTime;
      if (timeSinceLastMutation > 1500) break;
      await new Promise(r => setTimeout(r, 1000));
      waitCount++;
    }

    console.log("[AppScope] Initial render complete, loading all pages...");

    // Scroll through and load all apps (don't let pagination errors kill the scan)
    try {
      await loadAllApps();
    } catch (err) {
      console.error("[AppScope] Pagination error (continuing with what we have):", err);
    }

    // Final scrape after all content is loaded
    const apps = scrapeApps();
    observer.disconnect();

    console.log("[AppScope] Scan complete:", apps.length, "apps total");
    sendResults(apps);
  }

  // Listen for manual scan trigger from popup or background
  try {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === "TRIGGER_SCRAPE") {
        console.log("[AppScope] Manual scrape triggered");
        const apps = scrapeApps();
        sendResponse({ apps, url: window.location.href, timestamp: Date.now() });
        return true;
      }
    });
  } catch (e) {
    console.log("[AppScope] Extension context invalidated — reload the extension and try again.");
  }

  // Respond to extension detection pings from the web app
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "APPSCOPE_PING") {
      window.postMessage({ type: "APPSCOPE_PONG", version: "1.0.0" }, "*");
    }
  });

  // Check if this is a permissions-related page
  const url = window.location.href.toLowerCase();
  const isPermissionsPage =
    url.includes("/permissions") ||
    url.includes("/connections") ||
    url.includes("/security") ||
    url.includes("myaccount.google.com");

  console.log("[AppScope] Content script loaded on:", window.location.href);
  console.log("[AppScope] Will scrape:", isPermissionsPage);
  console.log("[AppScope] Document readyState:", document.readyState);

  if (isPermissionsPage) {
    const start = () => waitAndScrape().catch(err => {
      console.error("[AppScope] Scan error:", err);
      sendResults([]);
    });
    if (document.readyState === "complete") {
      start();
    } else {
      window.addEventListener("load", start);
    }
  }
})();
