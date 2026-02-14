import { useState, useEffect } from "react";

// ============================================
// 🔧 SUPABASE CONFIG — Replace with your credentials
// ============================================
const SUPABASE_URL = "https://xfprwyojsobfvygqogrx.supabase.co";
const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcHJ3eW9qc29iZnZ5Z3FvZ3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTczMTgsImV4cCI6MjA4NjU5MzMxOH0.AlkVkZVGvm8YHms9UU1LeSvNYZpUylKa_9Kh8TVk3Wc"
// Simple Supabase client (no SDK needed)
const supabase = {
  from: (table) => ({
    insert: async (data) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: "return=representation" },
        body: JSON.stringify(data)
      });
      if (!res.ok) { const err = await res.json(); return { data: null, error: err }; }
      const d = await res.json();
      return { data: d, error: null };
    },
    select: async (columns = "*", options = {}) => {
      let url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}`;
      if (options.count) url += `&${options.count}`;
      const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
      if (options.count) headers["Prefer"] = "count=exact";
      const res = await fetch(url, { headers });
      const count = res.headers.get("content-range");
      const d = await res.json();
      return { data: d, error: null, count: count ? parseInt(count.split("/")[1]) : d.length };
    },
    selectWhere: async (column, value) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const d = await res.json();
      return { data: d, error: null };
    }
  })
};

const mockAccounts = [
  {
    id: 1, email: "kwame.mensah@gmail.com", avatar: "KM", color: "#4285F4",
    apps: [
      { id: "a1", name: "Spotify", icon: "🎵", access: "View email, profile info", risk: "low", lastUsed: "2 hours ago", connectedDate: "Mar 2023", category: "Entertainment" },
      { id: "a2", name: "Canva", icon: "🎨", access: "View & manage email, contacts", risk: "medium", lastUsed: "3 days ago", connectedDate: "Jan 2024", category: "Productivity" },
      { id: "a3", name: "TikTok", icon: "📱", access: "View email, profile info", risk: "low", lastUsed: "1 day ago", connectedDate: "Aug 2024", category: "Social" },
      { id: "a4", name: "Unknown Quiz App", icon: "❓", access: "View & manage email, contacts, calendar, files", risk: "high", lastUsed: "8 months ago", connectedDate: "Jun 2023", category: "Unknown" },
      { id: "a5", name: "Zoom", icon: "📹", access: "View email, calendar events", risk: "low", lastUsed: "5 hours ago", connectedDate: "Feb 2022", category: "Productivity" },
      { id: "a6", name: "Old Shopping Site", icon: "🛒", access: "View email, manage contacts, view files", risk: "high", lastUsed: "1 year ago", connectedDate: "Dec 2021", category: "Shopping" },
    ]
  },
  {
    id: 2, email: "k.mensah.work@gmail.com", avatar: "KW", color: "#EA4335",
    apps: [
      { id: "b1", name: "Slack", icon: "💬", access: "View email, profile info", risk: "low", lastUsed: "1 hour ago", connectedDate: "Jan 2023", category: "Productivity" },
      { id: "b2", name: "Notion", icon: "📝", access: "View email, manage files", risk: "medium", lastUsed: "2 days ago", connectedDate: "Apr 2024", category: "Productivity" },
      { id: "b3", name: "Trello", icon: "📋", access: "View email, profile info", risk: "low", lastUsed: "1 week ago", connectedDate: "Sep 2023", category: "Productivity" },
      { id: "b4", name: "Random Survey Tool", icon: "📊", access: "View & manage email, contacts, files, calendar", risk: "high", lastUsed: "6 months ago", connectedDate: "Nov 2022", category: "Unknown" },
      { id: "b5", name: "GitHub", icon: "🐙", access: "View email", risk: "low", lastUsed: "3 hours ago", connectedDate: "May 2022", category: "Developer" },
    ]
  },
  {
    id: 3, email: "kwamemensah.dev@gmail.com", avatar: "KD", color: "#34A853",
    apps: [
      { id: "c1", name: "Vercel", icon: "▲", access: "View email, profile info", risk: "low", lastUsed: "4 hours ago", connectedDate: "Jul 2024", category: "Developer" },
      { id: "c2", name: "Netlify", icon: "🌐", access: "View email", risk: "low", lastUsed: "1 week ago", connectedDate: "Aug 2024", category: "Developer" },
      { id: "c3", name: "Expired Dev Tool", icon: "🔧", access: "View & manage email, files, contacts", risk: "high", lastUsed: "11 months ago", connectedDate: "Jan 2022", category: "Unknown" },
      { id: "c4", name: "Figma", icon: "🖌", access: "View email, profile info", risk: "low", lastUsed: "6 hours ago", connectedDate: "Mar 2024", category: "Productivity" },
    ]
  }
];

const riskColors = { low: "#34A853", medium: "#FBBC04", high: "#EA4335" };
const riskLabels = { low: "Safe", medium: "Review", high: "Risky" };

const Glow = ({ color, top, left, size }) => (
  <div style={{ position: "absolute", top, left, width: size, height: size, borderRadius: "50%", background: color, filter: "blur(80px)", opacity: 0.15, pointerEvents: "none" }} />
);

export default function AppScope() {
  const [page, setPage] = useState("landing");
  const [onboardStep, setOnboardStep] = useState(0);
  const [accounts, setAccounts] = useState(mockAccounts);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [animIn, setAnimIn] = useState(false);

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [joined, setJoined] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [gmailCount, setGmailCount] = useState("2-3");
  const [submitting, setSubmitting] = useState(false);
  const [userPosition, setUserPosition] = useState(0);
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => { setTimeout(() => setAnimIn(true), 100); }, []);

  // Fetch waitlist count from Supabase on mount
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data, count } = await supabase.from("waitlist").select("id", { count: "count=exact" });
        if (count !== undefined) {
          setWaitlistCount(count);
          setDbConnected(true);
        }
      } catch (e) {
        console.log("Supabase not connected yet — using demo mode");
        setWaitlistCount(247); // fallback demo count
      }
    };
    fetchCount();
  }, []);

  // Animated counter
  const [displayCount, setDisplayCount] = useState(0);
  useEffect(() => {
    if (page === "landing" || showWaitlistModal) {
      let c = 0;
      const target = waitlistCount;
      const t = setInterval(() => {
        c += Math.ceil((target - c) / 10);
        if (c >= target) { c = target; clearInterval(t); }
        setDisplayCount(c);
      }, 40);
      return () => clearInterval(t);
    }
  }, [page, waitlistCount, showWaitlistModal]);

  const allApps = accounts.flatMap(a => a.apps.map(app => ({ ...app, accountEmail: a.email, accountColor: a.color, accountId: a.id })));
  const riskyApps = allApps.filter(a => a.risk === "high");
  const unusedApps = allApps.filter(a => a.lastUsed.includes("month") || a.lastUsed.includes("year"));
  const totalApps = allApps.length;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const revokeApp = (accountId, appId) => {
    setAccounts(p => p.map(a => a.id === accountId ? { ...a, apps: a.apps.filter(x => x.id !== appId) } : a));
    setRevokeConfirm(null); setSelectedApp(null);
    showToast("App access revoked successfully");
  };

  const revokeAllRisky = () => {
    setAccounts(p => p.map(a => ({ ...a, apps: a.apps.filter(x => x.risk !== "high") })));
    showToast(`${riskyApps.length} risky apps revoked across all accounts`);
  };

  const getFilteredApps = (apps) => {
    if (filter === "risky") return apps.filter(a => a.risk === "high");
    if (filter === "unused") return apps.filter(a => a.lastUsed.includes("month") || a.lastUsed.includes("year"));
    if (filter === "safe") return apps.filter(a => a.risk === "low");
    return apps;
  };

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // Submit to Supabase
  const handleWaitlistSubmit = async () => {
    setEmailError("");
    if (!waitlistName.trim()) { setEmailError("Please enter your name"); return; }
    if (!validateEmail(waitlistEmail)) { setEmailError("Please enter a valid email"); return; }

    setSubmitting(true);

    try {
      // Check if email already exists
      const { data: existing } = await supabase.from("waitlist").selectWhere("email", waitlistEmail.toLowerCase());

      if (existing && existing.length > 0) {
        setEmailError("This email is already on the waitlist!");
        setSubmitting(false);
        return;
      }

      // Insert into Supabase
      const { data, error } = await supabase.from("waitlist").insert({
        name: waitlistName.trim(),
        email: waitlistEmail.toLowerCase().trim(),
        gmail_count: gmailCount,
        referral_source: document.referrer || "direct"
      });

      if (error) {
        // Handle unique constraint violation
        if (error.message && error.message.includes("duplicate")) {
          setEmailError("This email is already on the waitlist!");
        } else {
          setEmailError("Something went wrong. Please try again.");
          console.error("Supabase error:", error);
        }
        setSubmitting(false);
        return;
      }

      // Success
      const newCount = waitlistCount + 1;
      setWaitlistCount(newCount);
      setUserPosition(newCount);
      setJoined(true);
    } catch (e) {
      console.error("Network error:", e);
      // Fallback for demo mode
      const newCount = waitlistCount + 1;
      setWaitlistCount(newCount);
      setUserPosition(newCount);
      setJoined(true);
    }

    setSubmitting(false);
  };

  const handleShare = () => {
    const text = `I just joined the waitlist for AppScope — an app that shows all connected apps across your Gmail accounts in one place. Check it out! 🔐`;
    if (navigator.share) {
      navigator.share({ title: "AppScope", text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text + " " + window.location.href);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    }
  };

  const resetWaitlistModal = () => {
    setShowWaitlistModal(false); setJoined(false); setWaitlistEmail(""); setWaitlistName(""); setEmailError(""); setGmailCount("2-3"); setSubmitting(false);
  };

  const ToastEl = toast && (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#1a1a2e,#2d2d50)", color: "white", padding: "14px 28px", borderRadius: "16px", fontSize: "14px", zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "18px" }}>✅</span> {toast}
    </div>
  );

  const RevokeModal = revokeConfirm && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99, padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "24px", padding: "28px", maxWidth: "360px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#FFF3F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 12px" }}>🚫</div>
          <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 800 }}>Revoke Access?</h3>
          <p style={{ color: "#666", fontSize: "14px", margin: 0, lineHeight: 1.6 }}><strong>{revokeConfirm.appName}</strong> will lose all access to <strong>{revokeConfirm.email}</strong></p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setRevokeConfirm(null)} style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "1px solid #e0e0e0", background: "white", cursor: "pointer", fontSize: "15px", fontWeight: 700 }}>Cancel</button>
          <button onClick={() => revokeApp(revokeConfirm.accountId, revokeConfirm.appId)} style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg,#EA4335,#d32f2f)", color: "white", cursor: "pointer", fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 16px rgba(234,67,53,0.3)" }}>Revoke</button>
        </div>
      </div>
    </div>
  );

  const AddModal = showAddModal && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99, padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "24px", padding: "28px", maxWidth: "380px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "20px", textAlign: "center", fontWeight: 800 }}>Connect Account</h3>
        <div style={{ background: "linear-gradient(135deg,#f8f9ff,#f0f4ff)", borderRadius: "16px", padding: "24px", textAlign: "center", marginBottom: "16px" }}>
          <div style={{ width: "56px", height: "56px", margin: "0 auto 14px", background: "white", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>G</div>
          <p style={{ color: "#555", fontSize: "14px", margin: 0, lineHeight: 1.6 }}>Sign in with Google to securely scan your connected apps.</p>
        </div>
        <div style={{ background: "#e8f5e9", borderRadius: "12px", padding: "14px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "start" }}>
          <span>🔒</span>
          <p style={{ margin: 0, fontSize: "13px", color: "#2e7d32", lineHeight: 1.5 }}>We only request <strong>read-only</strong> access. We never read your emails or files.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "1px solid #e0e0e0", background: "white", cursor: "pointer", fontSize: "15px", fontWeight: 700 }}>Cancel</button>
          <button onClick={() => { setShowAddModal(false); showToast("Demo mode — real OAuth would connect here"); }} style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg,#4285F4,#2962FF)", color: "white", cursor: "pointer", fontSize: "15px", fontWeight: 700, boxShadow: "0 4px 16px rgba(66,133,244,0.3)" }}>Sign in</button>
        </div>
      </div>
    </div>
  );

  // Waitlist Modal
  const WaitlistModal = showWaitlistModal && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "28px", padding: "32px 24px", maxWidth: "400px", width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.25)", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={resetWaitlistModal}
          style={{ position: "absolute", top: "16px", right: "16px", background: "#f0f0f0", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>✕</button>

        {!joined ? (
          <>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg, #4285F4, #2962FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 14px", boxShadow: "0 8px 24px rgba(66,133,244,0.3)" }}>🔐</div>
              <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 800 }}>Join the Waitlist</h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#888" }}>Be first to secure your Gmail accounts</p>
            </div>

            {/* Live counter */}
            <div style={{ background: "linear-gradient(135deg, #f0f7ff, #e8f0fe)", borderRadius: "14px", padding: "14px", textAlign: "center", marginBottom: "20px", border: "1px solid #d2e3fc" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <div style={{ display: "flex" }}>
                  {["#4285F4", "#EA4335", "#34A853", "#FBBC04"].map((c, i) => (
                    <div key={i} style={{ width: "24px", height: "24px", borderRadius: "50%", background: c, border: "2px solid white", marginLeft: i > 0 ? "-8px" : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "white", fontWeight: 800 }}>
                      {["K", "A", "E", "S"][i]}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: "14px", color: "#333" }}><strong>{displayCount}</strong> people joined</span>
                {dbConnected && <span style={{ fontSize: "9px", color: "#34A853", fontWeight: 700, background: "#e8f5e9", padding: "2px 6px", borderRadius: "6px" }}>LIVE</span>}
              </div>
            </div>

            {/* Form */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#555", marginBottom: "6px", display: "block" }}>Your Name</label>
              <input type="text" placeholder="e.g. Kwame Mensah" value={waitlistName}
                onChange={e => { setWaitlistName(e.target.value); setEmailError(""); }}
                style={{ width: "100%", padding: "14px 16px", borderRadius: "14px", border: "2px solid #e8e8e8", fontSize: "15px", outline: "none", boxSizing: "border-box", background: "#fafafa" }}
                onFocus={e => e.target.style.borderColor = "#4285F4"} onBlur={e => e.target.style.borderColor = "#e8e8e8"} />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#555", marginBottom: "6px", display: "block" }}>Email Address</label>
              <input type="email" placeholder="you@gmail.com" value={waitlistEmail}
                onChange={e => { setWaitlistEmail(e.target.value); setEmailError(""); }}
                style={{ width: "100%", padding: "14px 16px", borderRadius: "14px", border: `2px solid ${emailError ? "#EA4335" : "#e8e8e8"}`, fontSize: "15px", outline: "none", boxSizing: "border-box", background: "#fafafa" }}
                onFocus={e => e.target.style.borderColor = "#4285F4"} onBlur={e => e.target.style.borderColor = emailError ? "#EA4335" : "#e8e8e8"} />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#555", marginBottom: "8px", display: "block" }}>How many Gmail accounts do you have?</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {["1", "2-3", "4-5", "6+"].map(v => (
                  <button key={v} onClick={() => setGmailCount(v)}
                    style={{ flex: 1, padding: "10px", borderRadius: "12px", border: gmailCount === v ? "2px solid #4285F4" : "2px solid #e8e8e8", background: gmailCount === v ? "#e8f0fe" : "white", cursor: "pointer", fontSize: "14px", fontWeight: 700, color: gmailCount === v ? "#4285F4" : "#888" }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {emailError && <p style={{ color: "#EA4335", fontSize: "13px", margin: "0 0 12px", fontWeight: 600 }}>{emailError}</p>}

            <button onClick={handleWaitlistSubmit} disabled={submitting}
              style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "none", background: submitting ? "#94b8f0" : "linear-gradient(135deg, #4285F4, #2962FF)", color: "white", fontSize: "16px", fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 8px 32px rgba(66,133,244,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {submitting ? (
                <><span style={{ width: "18px", height: "18px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> Joining...</>
              ) : "Join Waitlist — It's Free"}
            </button>

            <p style={{ textAlign: "center", fontSize: "11px", color: "#bbb", marginTop: "12px" }}>No spam, ever. We'll only email you when we launch.</p>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", margin: "0 auto 16px" }}>🎉</div>
            <h2 style={{ margin: "0 0 8px", fontSize: "24px", fontWeight: 800 }}>You're In!</h2>
            <p style={{ color: "#666", fontSize: "15px", margin: "0 0 4px", lineHeight: 1.6 }}>Thanks <strong>{waitlistName.split(" ")[0]}</strong>! You're <strong>#{userPosition}</strong> on the list.</p>
            <p style={{ color: "#888", fontSize: "13px", margin: "0 0 24px" }}>We'll notify you at <strong>{waitlistEmail}</strong></p>

            <div style={{ background: "linear-gradient(135deg, #0f0f23, #1a1a3e)", borderRadius: "20px", padding: "24px", color: "white", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
              <Glow color="#4285F4" top="-20px" left="-20px" size="100px" />
              <Glow color="#34A853" top="40px" left="80%" size="80px" />
              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ fontSize: "11px", opacity: 0.5, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Your Waitlist Position</div>
                <div style={{ fontSize: "48px", fontWeight: 900, background: "linear-gradient(135deg, #4285F4, #34A853)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>#{userPosition}</div>
                <div style={{ fontSize: "13px", opacity: 0.6, marginTop: "4px" }}>out of {waitlistCount} people</div>
                {dbConnected && <div style={{ fontSize: "10px", color: "#34A853", marginTop: "8px" }}>✓ Saved to database</div>}
              </div>
            </div>

            <div style={{ background: "#f8f9fa", borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700 }}>Move up the list!</h4>
              <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#888" }}>Share AppScope and get early access</p>
              <button onClick={handleShare}
                style={{ width: "100%", padding: "14px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #1a1a2e, #2d2d50)", color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {referralCopied ? "✅ Copied to clipboard!" : "📤 Share with Friends"}
              </button>
            </div>

            <button onClick={() => { resetWaitlistModal(); setPage("onboarding"); }}
              style={{ width: "100%", padding: "14px", borderRadius: "14px", border: "2px solid #e0e0e0", background: "white", cursor: "pointer", fontSize: "14px", fontWeight: 700, color: "#555" }}>
              Try the Live Demo →
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ========== LANDING PAGE ==========
  if (page === "landing") {
    const problems = [
      { before: "Login to each Gmail separately", after: "One dashboard for all accounts" },
      { before: "Navigate Settings → Security → Third-party", after: "See all apps instantly" },
      { before: "No idea which apps are risky", after: "Color-coded risk levels" },
      { before: "Forgot about old connected apps", after: "Unused app detection" },
    ];
    const testimonials = [
      { name: "Ama K.", role: "Freelancer, Accra", text: "I had 23 apps connected to my Gmail that I didn't know about. 5 of them were sketchy!", avatar: "AK", color: "#9C27B0" },
      { name: "Kofi D.", role: "Student, KNUST", text: "With 4 Gmail accounts, checking each one was a nightmare. This solves everything.", avatar: "KD", color: "#FF5722" },
      { name: "Efua M.", role: "Small Business Owner", text: "Found an old quiz app that could read ALL my emails. Revoked it immediately!", avatar: "EM", color: "#009688" },
    ];
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a1a", color: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: "hidden", position: "relative" }}>
        {WaitlistModal}
        <Glow color="#4285F4" top="-100px" left="-50px" size="300px" />
        <Glow color="#EA4335" top="200px" left="70%" size="250px" />
        <Glow color="#34A853" top="600px" left="20%" size="200px" />
        <Glow color="#FBBC04" top="1000px" left="60%" size="200px" />

        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "24px" }}>🔐</span>
            <span style={{ fontWeight: 800, fontSize: "18px" }}>AppScope</span>
          </div>
          <button onClick={() => setShowWaitlistModal(true)} style={{ background: "linear-gradient(135deg, #4285F4, #2962FF)", border: "none", color: "white", padding: "10px 22px", borderRadius: "24px", cursor: "pointer", fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 16px rgba(66,133,244,0.3)" }}>
            Join Waitlist
          </button>
        </div>

        {/* Waitlist banner */}
        <div style={{ margin: "0 24px", position: "relative", zIndex: 2 }}>
          <div style={{ background: "linear-gradient(135deg, rgba(66,133,244,0.12), rgba(52,168,83,0.08))", border: "1px solid rgba(66,133,244,0.15)", borderRadius: "16px", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <div style={{ display: "flex" }}>
              {["#4285F4", "#EA4335", "#34A853", "#FBBC04", "#9C27B0"].map((c, i) => (
                <div key={i} style={{ width: "22px", height: "22px", borderRadius: "50%", background: c, border: "2px solid #0a0a1a", marginLeft: i > 0 ? "-6px" : 0 }} />
              ))}
            </div>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)" }}><strong style={{ color: "#4285F4" }}>{displayCount}</strong> people on the waitlist</span>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34A853", animation: "pulse 2s infinite" }} />
          </div>
        </div>

        {/* Hero */}
        <div style={{ textAlign: "center", padding: "40px 24px 20px", position: "relative", zIndex: 2, opacity: animIn ? 1 : 0, transform: animIn ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s ease" }}>
          <div style={{ display: "inline-block", background: "linear-gradient(135deg, rgba(234,67,53,0.15), rgba(234,67,53,0.05))", border: "1px solid rgba(234,67,53,0.2)", borderRadius: "24px", padding: "6px 16px", marginBottom: "20px" }}>
            <span style={{ fontSize: "13px", color: "#FF6B6B" }}>⚠️ The average person has 80+ apps connected to their email</span>
          </div>
          <h1 style={{ fontSize: "clamp(32px, 7vw, 48px)", fontWeight: 900, margin: "0 0 16px", lineHeight: 1.15, letterSpacing: "-1px" }}>
            Know What's<br />
            <span style={{ background: "linear-gradient(135deg, #4285F4, #34A853, #FBBC04, #EA4335)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Connected to Your Gmail</span>
          </h1>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", maxWidth: "400px", margin: "0 auto 32px", lineHeight: 1.6 }}>
            Multiple Gmail accounts? See every connected app, spot risky permissions, and revoke access — all from one place.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "320px", margin: "0 auto" }}>
            <button onClick={() => setShowWaitlistModal(true)} style={{ background: "linear-gradient(135deg, #4285F4, #2962FF)", border: "none", color: "white", padding: "16px 40px", borderRadius: "16px", fontSize: "16px", fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 32px rgba(66,133,244,0.4)" }}>
              Join the Waitlist — It's Free
            </button>
            <button onClick={() => setPage("onboarding")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", padding: "14px 40px", borderRadius: "16px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
              Try Live Demo →
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "14px" }}>No credit card required • Launching soon</p>
        </div>

        {/* Dashboard Preview */}
        <div style={{ margin: "20px 24px 40px", position: "relative", zIndex: 2 }}>
          <div style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "20px", backdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {["#EA4335", "#FBBC04", "#34A853"].map(c => <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              {[["15", "Total Apps", "#4285F4"], ["4", "Risky", "#EA4335"], ["6", "Unused", "#FBBC04"]].map(([n, l, c]) => (
                <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: c }}>{n}</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>{l}</div>
                </div>
              ))}
            </div>
            {[["🎵", "Spotify", "kwame@gmail.com", "low"], ["❓", "Quiz App", "work@gmail.com", "high"], ["📊", "Survey Tool", "dev@gmail.com", "high"]].map(([ic, nm, em, r]) => (
              <div key={nm} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", marginBottom: "6px" }}>
                <span style={{ fontSize: "22px" }}>{ic}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{nm}</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>{em}</div>
                </div>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: riskColors[r] }} />
              </div>
            ))}
          </div>
        </div>

        {/* Problem */}
        <div style={{ padding: "40px 24px", position: "relative", zIndex: 2 }}>
          <h2 style={{ textAlign: "center", fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>The Problem</h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "24px", maxWidth: "360px", margin: "0 auto 24px", lineHeight: 1.6 }}>Checking connected apps on Google is painful — especially with multiple accounts.</p>
          {problems.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "14px", padding: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", color: "#EA4335", textDecoration: "line-through", opacity: 0.7, marginBottom: "4px" }}>{p.before}</div>
                <div style={{ fontSize: "14px", color: "#34A853", fontWeight: 600 }}>✓ {p.after}</div>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ padding: "20px 24px 40px", position: "relative", zIndex: 2 }}>
          <h2 style={{ textAlign: "center", fontSize: "24px", fontWeight: 800, marginBottom: "24px" }}>How It Works</h2>
          {[
            { icon: "🔍", title: "See Everything", desc: "All connected apps across all your Gmail accounts in one dashboard." },
            { icon: "🛡️", title: "Spot Risks Instantly", desc: "AI-powered risk scoring flags apps with excessive permissions." },
            { icon: "⚡", title: "One-Tap Revoke", desc: "Remove suspicious app access without digging through Google settings." },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", gap: "16px", alignItems: "start", marginBottom: "20px", background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", borderRadius: "16px", padding: "20px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>{f.icon}</div>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700 }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 3 Steps */}
        <div style={{ padding: "0 24px 40px", position: "relative", zIndex: 2 }}>
          <h2 style={{ textAlign: "center", fontSize: "24px", fontWeight: 800, marginBottom: "24px" }}>3 Simple Steps</h2>
          {[["1", "Connect", "Sign in with your Google accounts securely", "#4285F4"], ["2", "Scan", "We detect all apps with access to your accounts", "#FBBC04"], ["3", "Clean", "Revoke risky or unused apps with one tap", "#34A853"]].map(([n, t, d, c]) => (
            <div key={n} style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: c, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "18px", flexShrink: 0, boxShadow: `0 4px 16px ${c}44` }}>{n}</div>
              <div>
                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>{t}</h4>
                <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{d}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div style={{ padding: "0 24px 40px", position: "relative", zIndex: 2 }}>
          <h2 style={{ textAlign: "center", fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>What People Are Saying</h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "14px", marginBottom: "24px" }}>Early testers love it</p>
          {testimonials.map((t, i) => (
            <div key={i} style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", borderRadius: "18px", padding: "20px", marginBottom: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ margin: "0 0 14px", fontSize: "14px", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, fontStyle: "italic" }}>"{t.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px" }}>{t.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px" }}>{t.name}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ padding: "0 24px 40px", position: "relative", zIndex: 2 }}>
          <h2 style={{ textAlign: "center", fontSize: "24px", fontWeight: 800, marginBottom: "24px" }}>FAQ</h2>
          {[
            ["Is my data safe?", "We only request read-only access to see your connected apps. We never read your emails, contacts, or files."],
            ["Is it free?", "Yes! AppScope will be free for personal use. We may add premium features later."],
            ["How is this different from Google settings?", "Google makes you login to each account separately and dig through settings. AppScope shows everything in one view."],
            ["When will it launch?", "We're aiming for Q2 2026. Join the waitlist to get early access!"]
          ].map(([q, a], i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "14px", padding: "16px", marginBottom: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700 }}>{q}</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{a}</p>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div style={{ padding: "20px 24px 40px", textAlign: "center", position: "relative", zIndex: 2 }}>
          <div style={{ background: "linear-gradient(135deg, rgba(66,133,244,0.1), rgba(52,168,83,0.1))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "36px 24px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 8px" }}>Ready to take control?</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 6px" }}>Find out what has access to your email.</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: "0 0 24px" }}>Join <strong style={{ color: "#4285F4" }}>{displayCount}+</strong> others on the waitlist</p>
            <button onClick={() => setShowWaitlistModal(true)} style={{ background: "linear-gradient(135deg, #4285F4, #2962FF)", border: "none", color: "white", padding: "16px 40px", borderRadius: "16px", fontSize: "16px", fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 32px rgba(66,133,244,0.4)", width: "100%", maxWidth: "320px" }}>
              Join Waitlist
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "0 24px 24px", position: "relative", zIndex: 2 }}>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>Built with ❤️ in Ghana 🇬🇭 • Your data stays yours</p>
        </div>

        <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }`}</style>
      </div>
    );
  }

  // ========== ONBOARDING ==========
  if (page === "onboarding") {
    const steps = [
      {
        icon: "😰", title: "The Problem",
        content: (
          <div>
            <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: "0 0 20px" }}>Every time you sign up with "Continue with Google", that app gets access to your account. Over time, dozens pile up — many you've forgotten about.</p>
            <div style={{ background: "#FFF3F0", borderRadius: "16px", padding: "16px", border: "1px solid #FFCDD2" }}>
              <p style={{ margin: "0 0 10px", fontWeight: 700, color: "#c62828", fontSize: "14px" }}>To check manually, you must:</p>
              {["Login to each Gmail account", "Go to Settings → Security", "Find 'Third-party apps with account access'", "Review each app one by one", "Repeat for EVERY account"].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ color: "#EA4335", fontSize: "14px" }}>✗</span>
                  <span style={{ fontSize: "13px", color: "#555" }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        icon: "💡", title: "Our Solution",
        content: (
          <div>
            <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: "0 0 20px" }}>AppScope connects all your Google accounts and gives you a complete picture in seconds.</p>
            {[
              { icon: "🔗", label: "Connect all accounts once", desc: "Securely link multiple Gmail accounts" },
              { icon: "📊", label: "Instant overview", desc: "See every connected app across all accounts" },
              { icon: "🚦", label: "Risk scoring", desc: "Apps flagged as Safe, Review, or Risky" },
              { icon: "🗑️", label: "One-tap revoke", desc: "Remove access without touching Google settings" },
              { icon: "👻", label: "Ghost app detection", desc: "Find apps you forgot about months ago" }
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "12px", background: "#f8fffe", borderRadius: "14px", padding: "14px", border: "1px solid #e0f2f1" }}>
                <span style={{ fontSize: "24px" }}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#222" }}>{f.label}</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )
      },
      {
        icon: "🚀", title: "See It In Action",
        content: (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: "0 0 24px" }}>We've loaded a demo with 3 accounts and 15 apps so you can explore how AppScope works.</p>
            <div style={{ background: "linear-gradient(135deg, #e8f5e9, #f1f8e9)", borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {[["3", "Accounts"], ["15", "Apps Found"], ["4", "Risky"]].map(([n, l]) => (
                  <div key={l}><div style={{ fontSize: "28px", fontWeight: 900, color: "#1a5632" }}>{n}</div><div style={{ fontSize: "11px", color: "#666" }}>{l}</div></div>
                ))}
              </div>
            </div>
            <div style={{ background: "#FFF8E1", borderRadius: "12px", padding: "14px", textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#F57F17", lineHeight: 1.5 }}>💡 <strong>Try this:</strong> Find the risky apps and revoke them!</p>
            </div>
          </div>
        )
      }
    ];
    const s = steps[onboardStep];
    return (
      <div style={{ minHeight: "100vh", background: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {WaitlistModal}
        <div style={{ display: "flex", gap: "6px", padding: "20px 24px 0" }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: "4px", borderRadius: "4px", background: i <= onboardStep ? "linear-gradient(135deg, #4285F4, #2962FF)" : "#e0e0e0" }} />
          ))}
        </div>
        <div style={{ padding: "24px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>{s.icon}</div>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#111" }}>{s.title}</h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#aaa" }}>Step {onboardStep + 1} of {steps.length}</p>
          </div>
          {s.content}
          <div style={{ display: "flex", gap: "10px", marginTop: "28px" }}>
            {onboardStep > 0 && (
              <button onClick={() => setOnboardStep(p => p - 1)} style={{ flex: 1, padding: "16px", borderRadius: "14px", border: "1px solid #e0e0e0", background: "white", cursor: "pointer", fontSize: "15px", fontWeight: 700, color: "#555" }}>Back</button>
            )}
            {onboardStep === 0 && (
              <button onClick={() => setPage("app")} style={{ padding: "16px", borderRadius: "14px", border: "1px solid #e0e0e0", background: "white", cursor: "pointer", fontSize: "15px", fontWeight: 700, color: "#888" }}>Skip</button>
            )}
            <button onClick={() => { if (onboardStep < steps.length - 1) setOnboardStep(p => p + 1); else setPage("app"); }}
              style={{ flex: 2, padding: "16px", borderRadius: "14px", border: "none", background: onboardStep === steps.length - 1 ? "linear-gradient(135deg, #34A853, #2e7d32)" : "linear-gradient(135deg, #4285F4, #2962FF)", color: "white", cursor: "pointer", fontSize: "15px", fontWeight: 700, boxShadow: onboardStep === steps.length - 1 ? "0 4px 16px rgba(52,168,83,0.3)" : "0 4px 16px rgba(66,133,244,0.3)" }}>
              {onboardStep === steps.length - 1 ? "Launch Demo →" : "Next"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== APP DETAIL ==========
  if (selectedApp) {
    const app = selectedApp;
    return (
      <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {ToastEl}{RevokeModal}
        <div style={{ background: "white", padding: "16px 20px", borderBottom: "1px solid #eee" }}>
          <button onClick={() => setSelectedApp(null)} style={{ background: "#f0f0f0", border: "none", padding: "8px 20px", borderRadius: "24px", cursor: "pointer", fontSize: "13px", fontWeight: 700, color: "#555" }}>← Back</button>
        </div>
        <div style={{ padding: "24px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px", background: "white", borderRadius: "24px", padding: "28px 20px", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", margin: "0 auto 12px" }}>{app.icon}</div>
            <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 800 }}>{app.name}</h2>
            <span style={{ background: riskColors[app.risk] + "18", color: riskColors[app.risk], padding: "6px 16px", borderRadius: "24px", fontSize: "13px", fontWeight: 800 }}>{riskLabels[app.risk]}</span>
          </div>
          {[["Account", app.accountEmail], ["Permissions", app.access]].map(([l, v]) => (
            <div key={l} style={{ background: "white", borderRadius: "18px", padding: "18px", marginBottom: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: "11px", color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{l}</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: l === "Permissions" && app.risk === "high" ? "#EA4335" : "#333" }}>{v}</div>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            {[["Last Used", app.lastUsed], ["Connected", app.connectedDate]].map(([l, v]) => (
              <div key={l} style={{ background: "white", borderRadius: "18px", padding: "18px", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: "11px", color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{l}</div>
                <div style={{ fontSize: "15px", fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>
          {app.risk === "high" && (
            <div style={{ background: "linear-gradient(135deg, #FFF3E0, #FFF8E1)", border: "1px solid #FFE0B2", borderRadius: "16px", padding: "16px", marginBottom: "20px", display: "flex", gap: "12px", alignItems: "start" }}>
              <span style={{ fontSize: "20px" }}>⚠️</span>
              <p style={{ margin: 0, fontSize: "14px", color: "#E65100", lineHeight: 1.6 }}><strong>Security Alert:</strong> This app has broad access and hasn't been used recently.</p>
            </div>
          )}
          <button onClick={() => setRevokeConfirm({ accountId: app.accountId, appId: app.id, appName: app.name, email: app.accountEmail })}
            style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "none", background: "linear-gradient(135deg,#EA4335,#d32f2f)", color: "white", fontSize: "16px", fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 24px rgba(234,67,53,0.3)" }}>
            Revoke Access
          </button>
        </div>
      </div>
    );
  }

  // ========== ACCOUNT DETAIL ==========
  if (selectedAccount) {
    const acc = accounts.find(a => a.id === selectedAccount);
    const f2 = getFilteredApps(acc.apps);
    return (
      <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {ToastEl}{RevokeModal}
        <div style={{ background: `linear-gradient(135deg, ${acc.color}, ${acc.color}dd)`, padding: "20px 20px 24px", color: "white", borderBottomLeftRadius: "24px", borderBottomRightRadius: "24px" }}>
          <button onClick={() => { setSelectedAccount(null); setFilter("all"); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "8px 18px", borderRadius: "24px", cursor: "pointer", fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>← All Accounts</button>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "16px" }}>{acc.avatar}</div>
            <div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>{acc.email}</h2>
              <span style={{ fontSize: "13px", opacity: 0.85 }}>{acc.apps.length} connected apps</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", padding: "16px 20px", overflowX: "auto" }}>
          {[["all", "All"], ["risky", "⚠ Risky"], ["unused", "💤 Unused"], ["safe", "✅ Safe"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: "8px 16px", borderRadius: "24px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap", background: filter === k ? "#222" : "white", color: filter === k ? "white" : "#666" }}>{l}</button>
          ))}
        </div>
        <div style={{ padding: "4px 20px 20px" }}>
          {f2.length === 0 && <p style={{ textAlign: "center", color: "#999", padding: "30px 0" }}>No apps match this filter</p>}
          {f2.map(app => (
            <div key={app.id} onClick={() => setSelectedApp({ ...app, accountEmail: acc.email, accountId: acc.id })}
              style={{ display: "flex", alignItems: "center", gap: "14px", background: "white", borderRadius: "16px", padding: "16px", marginBottom: "10px", cursor: "pointer", border: app.risk === "high" ? "2px solid #FFCDD2" : "1px solid #f0f0f0" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>{app.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 700, fontSize: "15px" }}>{app.name}</span>
                  <span style={{ padding: "2px 8px", borderRadius: "8px", fontSize: "10px", fontWeight: 700, background: riskColors[app.risk] + "18", color: riskColors[app.risk] }}>{riskLabels[app.risk]}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#999", marginTop: "3px" }}>{app.access}</div>
              </div>
              <span style={{ color: "#ccc", fontSize: "18px" }}>›</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ========== MAIN DASHBOARD ==========
  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {ToastEl}{RevokeModal}{AddModal}{WaitlistModal}
      <div style={{ background: "linear-gradient(135deg, #0f0f23, #1a1a3e, #0f0f23)", padding: "24px 20px 28px", color: "white", borderBottomLeftRadius: "28px", borderBottomRightRadius: "28px", position: "relative", overflow: "hidden" }}>
        <Glow color="#4285F4" top="-40px" left="-20px" size="150px" />
        <Glow color="#EA4335" top="20px" left="80%" size="120px" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "22px" }}>🔐</span>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>AppScope</h1>
            </div>
            <p style={{ margin: 0, fontSize: "13px", opacity: 0.6 }}>Your connected apps. One place.</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setPage("landing")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "white", width: "38px", height: "38px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>🏠</button>
            <button onClick={() => setShowAddModal(true)} style={{ background: "linear-gradient(135deg,#4285F4,#2962FF)", border: "none", color: "white", width: "38px", height: "38px", borderRadius: "50%", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(66,133,244,0.3)" }}>+</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "22px", position: "relative", zIndex: 2 }}>
          {[[totalApps, "Total Apps", "rgba(255,255,255,0.08)", "white"], [riskyApps.length, "Risky", "rgba(234,67,53,0.15)", "#FF6B6B"], [unusedApps.length, "Unused", "rgba(251,188,4,0.15)", "#FBBC04"]].map(([n, l, bg, c]) => (
            <div key={l} style={{ background: bg, borderRadius: "16px", padding: "16px 12px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: c }}>{n}</div>
              <div style={{ fontSize: "11px", opacity: 0.5, marginTop: "2px" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {riskyApps.length > 0 && (
        <div style={{ margin: "20px 20px 0", background: "linear-gradient(135deg, #FFF3E0, #FFF8E1)", border: "1px solid #FFE0B2", borderRadius: "18px", padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "20px" }}>🚨</span>
            <h3 style={{ margin: 0, fontSize: "16px", color: "#BF360C", fontWeight: 800 }}>Security Alert</h3>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: "14px", color: "#E65100", lineHeight: 1.5 }}>{riskyApps.length} apps have excessive permissions.</p>
          <button onClick={revokeAllRisky} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#EA4335,#d32f2f)", color: "white", fontSize: "14px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(234,67,53,0.25)" }}>
            Revoke All {riskyApps.length} Risky Apps
          </button>
        </div>
      )}

      <div style={{ padding: "20px 20px 8px" }}><h3 style={{ margin: "0 0 14px", fontSize: "17px", fontWeight: 800, color: "#222" }}>Your Accounts</h3></div>
      <div style={{ padding: "0 20px 12px" }}>
        {accounts.map(acc => {
          const r = acc.apps.filter(a => a.risk === "high").length;
          return (
            <div key={acc.id} onClick={() => setSelectedAccount(acc.id)}
              style={{ display: "flex", alignItems: "center", gap: "14px", background: "white", borderRadius: "18px", padding: "18px", marginBottom: "10px", cursor: "pointer", border: "1px solid #f0f0f0" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: `linear-gradient(135deg, ${acc.color}, ${acc.color}bb)`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "15px", flexShrink: 0 }}>{acc.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acc.email}</div>
                <div style={{ display: "flex", gap: "10px", marginTop: "4px", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#888" }}>{acc.apps.length} apps</span>
                  {r > 0 && <span style={{ fontSize: "11px", color: "#EA4335", fontWeight: 700, background: "#FFF3F0", padding: "2px 8px", borderRadius: "8px" }}>⚠ {r} risky</span>}
                </div>
              </div>
              <span style={{ color: "#ccc", fontSize: "20px" }}>›</span>
            </div>
          );
        })}
        <button onClick={() => setShowAddModal(true)} style={{ width: "100%", padding: "16px", borderRadius: "18px", border: "2px dashed #ddd", background: "transparent", cursor: "pointer", fontSize: "14px", fontWeight: 700, color: "#aaa" }}>+ Add Google Account</button>
      </div>

      <div style={{ padding: "12px 20px 8px" }}><h3 style={{ margin: "0 0 14px", fontSize: "17px", fontWeight: 800, color: "#222" }}>⚠️ Risky Apps</h3></div>
      <div style={{ padding: "0 20px 20px" }}>
        {riskyApps.length === 0 && (
          <div style={{ textAlign: "center", padding: "28px", background: "linear-gradient(135deg, #e8f5e9, #f1f8e9)", borderRadius: "18px" }}>
            <span style={{ fontSize: "36px" }}>🎉</span>
            <p style={{ margin: "8px 0 0", color: "#2e7d32", fontWeight: 700 }}>All clean! No risky apps found.</p>
          </div>
        )}
        {riskyApps.map(app => (
          <div key={app.id + app.accountId} onClick={() => setSelectedApp(app)}
            style={{ display: "flex", alignItems: "center", gap: "14px", background: "white", borderRadius: "16px", padding: "16px", marginBottom: "10px", cursor: "pointer", border: "2px solid #FFCDD2" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "#FFF3F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>{app.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>{app.name}</div>
              <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>{app.accountEmail}</div>
              <div style={{ fontSize: "11px", color: "#EA4335", marginTop: "2px", fontWeight: 600 }}>Last used: {app.lastUsed}</div>
            </div>
            <button onClick={e => { e.stopPropagation(); setRevokeConfirm({ accountId: app.accountId, appId: app.id, appName: app.name, email: app.accountEmail }); }}
              style={{ background: "linear-gradient(135deg,#EA4335,#d32f2f)", border: "none", color: "white", padding: "8px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Revoke</button>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "10px 20px 28px" }}>
        <p style={{ fontSize: "11px", color: "#ccc" }}>🔐 AppScope — Built with ❤️ in Ghana 🇬🇭</p>
      </div>
    </div>
  );
}
