# AppScope Chrome Extension — Technical Architecture

> How the Chrome extension works with AppScope to automatically detect connected apps.

---

## Architecture Overview

```
┌─────────────────────┐         ┌──────────────────┐         ┌───────────┐
│  Chrome Extension    │         │  AppScope Web App │         │  Supabase │
│                      │         │                   │         │           │
│ 1. User visits       │  POST   │ 3. Dashboard shows│  READ   │ user_apps │
│    Google permissions├────────►│    real apps with  ├────────►│  table    │
│    page              │ scraped │    risk badges     │         │           │
│                      │  apps   │                   │         │           │
│ 2. Extension reads   │         │                   │         │           │
│    the page DOM,     │         │                   │         │           │
│    extracts app list │         │                   │         │           │
└─────────────────────┘         └──────────────────┘         └───────────┘
```

---

## Step-by-Step Flow

1. **User signs into AppScope** with Google (as it works now)
2. **User installs** the AppScope Chrome extension (one-time)
3. **Extension detects** when the user visits `myaccount.google.com/permissions`
4. **Extension reads the page DOM** — scrapes each app's name, icon, and permission descriptions directly from the HTML
5. **Extension sends the data to Supabase** (using the user's auth token) — writes to the `user_apps` table
6. **AppScope dashboard instantly shows** real connected apps with risk scoring applied
7. **Re-scan** = just revisit the Google permissions page, extension auto-syncs

---

## What the Extension Would Need

| Component | Purpose |
|---|---|
| **Content Script** | Runs on `myaccount.google.com/permissions`, parses the app list from the DOM |
| **Background Script** | Handles auth token storage and Supabase communication |
| **Popup UI** | Small popup showing "Synced 12 apps" status + link to open AppScope dashboard |
| **Permissions** | `activeTab` + host permission for `myaccount.google.com` only |

---

## Key Advantage

No manual checklist. The user just opens their Google permissions page and the extension does everything automatically.

---

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Google can change the permissions page DOM structure at any time | Breaks scraping until we update | Monitor for changes; build flexible selectors; automated tests |
| Chrome Web Store review process takes a few days | Delays initial launch and updates | Submit early; follow Chrome extension guidelines strictly |
| Users need to trust and install an extension | Friction in onboarding | Minimal permissions; transparent privacy policy; open-source the extension code |

---

# 🚀 Publishing Your Chrome Extension (AppScope)

## 📦 Step-by-Step Guide

### 1️⃣ Go to Chrome Web Store Developer Console

Visit:

https://chrome.google.com/webstore/devconsole

---

### 2️⃣ Click **"New Item"**

Start a new extension submission.

---

### 3️⃣ Upload Your Extension

Upload your packaged file:



---

### 4️⃣ Fill in the Store Listing

Provide the required details:

- **Name:**  
  `AppScope - Gmail Security Scanner`

- **Description:**  
  `See which third-party apps have access to your Google account`

- **Category:**  
  `Productivity` (or `Security`)

- **Screenshots:**  
  Add 1–2 screenshots showing the popup working.

- **Icons:**  
  - Required: **128x128 store icon**
  - You can use placeholders temporarily.
  - Replace with proper branding before production.

---

### 5️⃣ Complete the Privacy Tab

You must declare:

- Why you need `host_permissions` for:

(To read connected apps from the permissions page)

- A **Privacy Policy URL**  
(Required since the extension accesses user data)

- That you use the `storage` permission  
(To store authentication tokens)

---

### 6️⃣ Submit for Review

Click:



Chrome Web Store review typically takes a few days.

---

## ⚠️ Important Notes

- Ensure your privacy policy is publicly accessible.
- Be clear and transparent about data usage.
- Minimize permissions to avoid rejection.
- Make sure your extension works without errors before submitting.


*Part of the AppScope product documentation*
*Built with ❤️ in Ghana 🇬🇭*