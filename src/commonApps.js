// ~40 common apps that users may have connected to Google
// risk: "safe" or "risky" based on typical OAuth scopes
export const commonApps = [
  // Entertainment
  { name: "Spotify", icon: "\ud83c\udfb5", permissions: "View email, profile info", risk: "safe", category: "Entertainment" },
  { name: "Netflix", icon: "\ud83c\udfac", permissions: "View email, profile info", risk: "safe", category: "Entertainment" },
  { name: "YouTube Music", icon: "\ud83c\udfa7", permissions: "View email, profile info", risk: "safe", category: "Entertainment" },
  { name: "Disney+", icon: "\u2728", permissions: "View email, profile info", risk: "safe", category: "Entertainment" },
  { name: "Twitch", icon: "\ud83d\udfea", permissions: "View email, profile info", risk: "safe", category: "Entertainment" },

  // Social
  { name: "TikTok", icon: "\ud83d\udcf1", permissions: "View email, profile info", risk: "safe", category: "Social" },
  { name: "Instagram", icon: "\ud83d\udcf7", permissions: "View email, profile info", risk: "safe", category: "Social" },
  { name: "Twitter / X", icon: "\ud83d\udc26", permissions: "View email, profile info", risk: "safe", category: "Social" },
  { name: "Facebook", icon: "\ud83d\udc64", permissions: "View email, profile info, contacts", risk: "risky", category: "Social" },
  { name: "Snapchat", icon: "\ud83d\udc7b", permissions: "View email, profile info", risk: "safe", category: "Social" },
  { name: "LinkedIn", icon: "\ud83d\udcbc", permissions: "View email, profile info", risk: "safe", category: "Social" },
  { name: "Discord", icon: "\ud83c\udfae", permissions: "View email, profile info", risk: "safe", category: "Social" },
  { name: "Reddit", icon: "\ud83e\udda0", permissions: "View email, profile info", risk: "safe", category: "Social" },

  // Productivity
  { name: "Slack", icon: "\ud83d\udcac", permissions: "View email, profile info", risk: "safe", category: "Productivity" },
  { name: "Notion", icon: "\ud83d\udcdd", permissions: "View email, manage files", risk: "risky", category: "Productivity" },
  { name: "Trello", icon: "\ud83d\udccb", permissions: "View email, profile info", risk: "safe", category: "Productivity" },
  { name: "Asana", icon: "\u2705", permissions: "View email, profile info", risk: "safe", category: "Productivity" },
  { name: "Zoom", icon: "\ud83d\udcf9", permissions: "View email, calendar events", risk: "safe", category: "Productivity" },
  { name: "Canva", icon: "\ud83c\udfa8", permissions: "View & manage email, contacts", risk: "risky", category: "Productivity" },
  { name: "Dropbox", icon: "\ud83d\udce6", permissions: "View email, manage files", risk: "risky", category: "Productivity" },
  { name: "Evernote", icon: "\ud83d\udc18", permissions: "View email, manage files", risk: "risky", category: "Productivity" },
  { name: "Monday.com", icon: "\ud83d\udcc5", permissions: "View email, profile info", risk: "safe", category: "Productivity" },
  { name: "Calendly", icon: "\ud83d\uddd3\ufe0f", permissions: "View email, calendar events", risk: "safe", category: "Productivity" },

  // Developer
  { name: "GitHub", icon: "\ud83d\udc19", permissions: "View email", risk: "safe", category: "Developer" },
  { name: "GitLab", icon: "\ud83e\udd8a", permissions: "View email", risk: "safe", category: "Developer" },
  { name: "Vercel", icon: "\u25b2", permissions: "View email, profile info", risk: "safe", category: "Developer" },
  { name: "Netlify", icon: "\ud83c\udf10", permissions: "View email", risk: "safe", category: "Developer" },
  { name: "Figma", icon: "\ud83d\udd8c", permissions: "View email, profile info", risk: "safe", category: "Developer" },
  { name: "Heroku", icon: "\u2601\ufe0f", permissions: "View email, profile info", risk: "safe", category: "Developer" },
  { name: "Replit", icon: "\ud83d\udcbb", permissions: "View email, profile info", risk: "safe", category: "Developer" },

  // Shopping
  { name: "Amazon", icon: "\ud83d\udce6", permissions: "View email, profile info", risk: "safe", category: "Shopping" },
  { name: "eBay", icon: "\ud83d\udecf\ufe0f", permissions: "View email, profile info", risk: "safe", category: "Shopping" },
  { name: "Shopify Store", icon: "\ud83d\uded2", permissions: "View email, profile info", risk: "safe", category: "Shopping" },
  { name: "Wish", icon: "\u2b50", permissions: "View email, contacts, profile info", risk: "risky", category: "Shopping" },

  // Finance
  { name: "PayPal", icon: "\ud83d\udcb3", permissions: "View email, profile info", risk: "safe", category: "Finance" },
  { name: "Cash App", icon: "\ud83d\udcb5", permissions: "View email, profile info", risk: "safe", category: "Finance" },
  { name: "Robinhood", icon: "\ud83d\udcc8", permissions: "View email, profile info", risk: "safe", category: "Finance" },

  // Risky / Suspicious common ones
  { name: "Quiz App", icon: "\u2753", permissions: "View & manage email, contacts, calendar, files", risk: "risky", category: "Unknown" },
  { name: "Free VPN", icon: "\ud83d\udd12", permissions: "View email, manage contacts, view files", risk: "risky", category: "Unknown" },
  { name: "Personality Test", icon: "\ud83e\udde0", permissions: "View & manage email, contacts, files", risk: "risky", category: "Unknown" },
  { name: "IQ Test Online", icon: "\ud83d\udca1", permissions: "View & manage email, contacts, calendar", risk: "risky", category: "Unknown" },
];

export const categories = [
  "All",
  "Entertainment",
  "Social",
  "Productivity",
  "Developer",
  "Shopping",
  "Finance",
  "Unknown",
];

export const permissionOptions = [
  "View email",
  "View profile info",
  "View contacts",
  "Manage contacts",
  "View calendar",
  "Manage calendar",
  "View files",
  "Manage files",
  "Read emails",
  "Manage email",
];
