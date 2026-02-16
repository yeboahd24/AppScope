import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { commonApps, categories, permissionOptions } from "./commonApps";

export default function GuidedScan({ session, onComplete }) {
  const [step, setStep] = useState(0);
  const [selectedApps, setSelectedApps] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPerms, setCustomPerms] = useState([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [extensionDetected, setExtensionDetected] = useState(false);
  const [autoScanning, setAutoScanning] = useState(false);

  // Detect Chrome extension
  useEffect(() => {
    const handlePong = (event) => {
      if (event.data && event.data.type === "APPSCOPE_PONG") {
        setExtensionDetected(true);
      }
    };
    window.addEventListener("message", handlePong);
    window.postMessage({ type: "APPSCOPE_PING" }, "*");
    // Timeout: if no response in 500ms, extension is not installed
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handlePong);
    }, 500);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("message", handlePong);
    };
  }, []);

  const handleAutoScan = () => {
    setAutoScanning(true);
    // Open Google permissions page — extension content script will auto-scrape
    window.open("https://myaccount.google.com/connections?filters=3,4", "_blank");
    // Poll for results via storage events
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const { count } = await supabase
          .from("user_apps")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .eq("is_revoked", false);
        if (count > 0) {
          clearInterval(poll);
          setAutoScanning(false);
          onComplete();
        }
      } catch {
        // ignore
      }
      if (attempts >= 30) {
        clearInterval(poll);
        setAutoScanning(false);
      }
    }, 2000);
  };

  const riskyPerms = ["Manage contacts", "Manage calendar", "Manage files", "Read emails", "Manage email"];

  const computeRisk = (perms) => {
    return perms.some((p) => riskyPerms.includes(p)) ? "risky" : "safe";
  };

  const toggleApp = (app) => {
    setSelectedApps((prev) => {
      const exists = prev.find((a) => a.name === app.name);
      if (exists) return prev.filter((a) => a.name !== app.name);
      return [...prev, { ...app, is_custom: false }];
    });
  };

  const addCustomApp = () => {
    if (!customName.trim()) return;
    if (customPerms.length === 0) return;
    const permsStr = customPerms.join(", ");
    const risk = computeRisk(customPerms);
    setSelectedApps((prev) => [
      ...prev,
      {
        name: customName.trim(),
        icon: "\ud83d\udd0c",
        permissions: permsStr,
        risk,
        category: "Other",
        is_custom: true,
      },
    ]);
    setCustomName("");
    setCustomPerms([]);
    setShowCustomForm(false);
  };

  const toggleCustomPerm = (perm) => {
    setCustomPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const updateAppRisk = (appName, newRisk) => {
    setSelectedApps((prev) =>
      prev.map((a) => (a.name === appName ? { ...a, risk: newRisk } : a))
    );
  };

  const removeApp = (appName) => {
    setSelectedApps((prev) => prev.filter((a) => a.name !== appName));
  };

  const saveApps = async () => {
    setSaving(true);
    setError("");
    try {
      const rows = selectedApps.map((app) => ({
        user_id: session.user.id,
        app_name: app.name,
        app_icon: app.icon,
        permissions: app.permissions,
        risk_level: app.risk,
        category: app.category || "Other",
        is_custom: app.is_custom || false,
      }));

      const { error: insertError } = await supabase.from("user_apps").upsert(rows, {
        onConflict: "user_id,app_name",
      });

      if (insertError) {
        setError("Failed to save. Please try again.");
        console.error(insertError);
        setSaving(false);
        return;
      }

      setStep(3);
    } catch (e) {
      setError("Network error. Please try again.");
      console.error(e);
    }
    setSaving(false);
  };

  const filteredCommonApps = commonApps.filter((app) => {
    const matchesCategory =
      categoryFilter === "All" || app.category === categoryFilter;
    const matchesSearch =
      !search || app.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const riskColors = { safe: "#34A853", risky: "#EA4335" };
  const riskLabels = { safe: "Safe", risky: "Risky" };

  // Step 0: Intro — open Google permissions
  if (step === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f6fa",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #0f0f23, #1a1a3e)",
            padding: "24px 20px 32px",
            color: "white",
            borderBottomLeftRadius: "28px",
            borderBottomRightRadius: "28px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
          <h1 style={{ margin: "0 0 8px", fontSize: "24px", fontWeight: 800 }}>
            Let's Scan Your Permissions
          </h1>
          <p style={{ margin: 0, fontSize: "14px", opacity: 0.7 }}>
            Step 1 of 4 — Open your Google permissions page
          </p>
        </div>

        <div style={{ padding: "24px 20px" }}>
          {extensionDetected ? (
            <>
              <div
                style={{
                  background: "linear-gradient(135deg, #e8f5e9, #f1f8e9)",
                  borderRadius: "20px",
                  padding: "24px",
                  marginBottom: "16px",
                  border: "1px solid #c8e6c9",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>&#x2705;</div>
                <h3 style={{ margin: "0 0 8px", fontSize: "17px", fontWeight: 700, color: "#2e7d32" }}>
                  Extension Detected!
                </h3>
                <p style={{ margin: 0, fontSize: "14px", color: "#555", lineHeight: 1.6 }}>
                  The AppScope extension will automatically scan your Google permissions and sync your apps.
                </p>
              </div>

              <button
                onClick={handleAutoScan}
                disabled={autoScanning}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "none",
                  background: autoScanning ? "#94b8f0" : "linear-gradient(135deg, #34A853, #2e7d32)",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: 800,
                  cursor: autoScanning ? "not-allowed" : "pointer",
                  boxShadow: "0 8px 32px rgba(52,168,83,0.3)",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {autoScanning ? (
                  <>
                    <span style={{ width: "18px", height: "18px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                    Scanning...
                  </>
                ) : "Auto Scan with Extension"}
              </button>

              <button
                onClick={() => setStep(1)}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "16px",
                  border: "2px solid #e0e0e0",
                  background: "white",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  color: "#888",
                }}
              >
                Or scan manually instead
              </button>
              {autoScanning && <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>}
            </>
          ) : (
            <>
              <div
                style={{
                  background: "white",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
                  marginBottom: "16px",
                }}
              >
                <h3 style={{ margin: "0 0 12px", fontSize: "17px", fontWeight: 700 }}>
                  Here's what to do:
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {[
                    "Click the button below to open your Google account permissions",
                    "You'll see a list of apps that have access to your Google account",
                    "Keep that tab open — you'll need it for the next step",
                  ].map((text, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", gap: "12px", alignItems: "start" }}
                    >
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: "#4285F4",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "13px",
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "#555",
                          lineHeight: 1.6,
                        }}
                      >
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: "linear-gradient(135deg, #EDE7F6, #E8EAF6)",
                  borderRadius: "18px",
                  padding: "18px",
                  marginBottom: "16px",
                  border: "1px solid #D1C4E9",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "18px" }}>&#x1f9e9;</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#4527A0" }}>
                    Chrome Extension
                  </span>
                  <span style={{
                    background: "#FF6F00",
                    color: "white",
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px",
                  }}>
                    BETA
                  </span>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#555", lineHeight: 1.6 }}>
                  Skip the manual checklist! Our extension auto-scans your Google permissions.
                  We're working on publishing it to the Chrome Web Store — for now, you can install it manually.
                </p>
                <div style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  marginBottom: "12px",
                  fontSize: "12px",
                  color: "#555",
                  lineHeight: 1.8,
                }}>
                  <strong style={{ color: "#333" }}>Quick Install:</strong><br />
                  1. Click "Download Extension" below<br />
                  2. Unzip the downloaded file<br />
                  3. Open <code style={{ background: "#f0f0f0", padding: "1px 6px", borderRadius: "4px", fontSize: "11px" }}>chrome://extensions</code><br />
                  4. Enable "Developer mode" (top right toggle)<br />
                  5. Click "Load unpacked" → select the <code style={{ background: "#f0f0f0", padding: "1px 6px", borderRadius: "4px", fontSize: "11px" }}>extension</code> folder
                </div>
                <a
                  href="/appscope-extension.zip"
                  download="appscope-extension.zip"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "10px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #7C4DFF, #651FFF)",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 4px 16px rgba(101,31,255,0.25)",
                  }}
                >
                  Download Extension (.zip)
                </a>
                <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#999", textAlign: "center" }}>
                  We'll notify you when it's live on the Chrome Web Store.
                </p>
              </div>

              <a
                href="https://myaccount.google.com/connections?filters=3,4"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "none",
                  background: "linear-gradient(135deg, #4285F4, #2962FF)",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: 800,
                  textAlign: "center",
                  textDecoration: "none",
                  boxShadow: "0 8px 32px rgba(66,133,244,0.3)",
                  boxSizing: "border-box",
                  marginBottom: "12px",
                }}
              >
                Open Google Permissions &#x2197;
              </a>

              <button
                onClick={() => setStep(1)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "2px solid #e0e0e0",
                  background: "white",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  color: "#555",
                }}
              >
                I've opened it — Next &#x2192;
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Checklist of apps
  if (step === 1) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f6fa",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #0f0f23, #1a1a3e)",
            padding: "20px 20px 24px",
            color: "white",
            borderBottomLeftRadius: "28px",
            borderBottomRightRadius: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <button
              onClick={() => setStep(0)}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "white",
                padding: "8px 16px",
                borderRadius: "24px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              ← Back
            </button>
            <span style={{ fontSize: "13px", opacity: 0.6 }}>Step 2 of 4</span>
          </div>
          <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 800 }}>
            Which apps do you see?
          </h2>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.6 }}>
            Check the apps you found on your Google permissions page
          </p>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "14px",
              border: "2px solid #e8e8e8",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
              background: "white",
              marginBottom: "12px",
            }}
          />

          {/* Category filter */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              paddingBottom: "12px",
              marginBottom: "8px",
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "24px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  background: categoryFilter === cat ? "#222" : "white",
                  color: categoryFilter === cat ? "white" : "#666",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* App list */}
          <div style={{ marginBottom: "16px" }}>
            {filteredCommonApps.map((app) => {
              const isSelected = selectedApps.some((a) => a.name === app.name);
              return (
                <div
                  key={app.name}
                  onClick={() => toggleApp(app)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: isSelected ? "#e8f5e9" : "white",
                    borderRadius: "14px",
                    padding: "14px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    border: isSelected
                      ? "2px solid #34A853"
                      : "1px solid #f0f0f0",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>{app.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>
                      {app.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#999" }}>
                      {app.permissions}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "8px",
                      fontSize: "10px",
                      fontWeight: 700,
                      background: riskColors[app.risk] + "18",
                      color: riskColors[app.risk],
                    }}
                  >
                    {riskLabels[app.risk]}
                  </span>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "8px",
                      border: isSelected
                        ? "2px solid #34A853"
                        : "2px solid #ddd",
                      background: isSelected ? "#34A853" : "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "14px",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && "✓"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom app entry */}
          {!showCustomForm ? (
            <button
              onClick={() => setShowCustomForm(true)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                border: "2px dashed #ddd",
                background: "transparent",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 700,
                color: "#aaa",
                marginBottom: "16px",
              }}
            >
              + Add an app not listed here
            </button>
          ) : (
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "16px",
                border: "1px solid #e0e0e0",
              }}
            >
              <h4 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: 700 }}>
                Add Custom App
              </h4>
              <input
                type="text"
                placeholder="App name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "2px solid #e8e8e8",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: "10px",
                }}
              />
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#555",
                }}
              >
                What permissions does it have?
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginBottom: "12px",
                }}
              >
                {permissionOptions.map((perm) => (
                  <button
                    key={perm}
                    onClick={() => toggleCustomPerm(perm)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "10px",
                      border: customPerms.includes(perm)
                        ? "2px solid #4285F4"
                        : "1px solid #e0e0e0",
                      background: customPerms.includes(perm) ? "#e8f0fe" : "white",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: customPerms.includes(perm) ? "#4285F4" : "#666",
                    }}
                  >
                    {perm}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    setShowCustomForm(false);
                    setCustomName("");
                    setCustomPerms([]);
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #e0e0e0",
                    background: "white",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomApp}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg,#4285F4,#2962FF)",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  Add App
                </button>
              </div>
            </div>
          )}

          {/* Selected count + next */}
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "16px",
              textAlign: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#555" }}>
              <strong>{selectedApps.length}</strong> app
              {selectedApps.length !== 1 ? "s" : ""} selected
            </p>
            <button
              onClick={() => setStep(2)}
              disabled={selectedApps.length === 0}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                border: "none",
                background:
                  selectedApps.length === 0
                    ? "#ccc"
                    : "linear-gradient(135deg,#4285F4,#2962FF)",
                color: "white",
                fontSize: "15px",
                fontWeight: 700,
                cursor: selectedApps.length === 0 ? "not-allowed" : "pointer",
                boxShadow:
                  selectedApps.length > 0
                    ? "0 4px 16px rgba(66,133,244,0.3)"
                    : "none",
              }}
            >
              Review Selection →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Review
  if (step === 2) {
    const safeCount = selectedApps.filter((a) => a.risk === "safe").length;
    const riskyCount = selectedApps.filter((a) => a.risk === "risky").length;

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f6fa",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #0f0f23, #1a1a3e)",
            padding: "20px 20px 24px",
            color: "white",
            borderBottomLeftRadius: "28px",
            borderBottomRightRadius: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <button
              onClick={() => setStep(1)}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "white",
                padding: "8px 16px",
                borderRadius: "24px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              ← Back
            </button>
            <span style={{ fontSize: "13px", opacity: 0.6 }}>Step 3 of 4</span>
          </div>
          <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 800 }}>
            Review Your Apps
          </h2>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.6 }}>
            Verify the risk levels are correct before saving
          </p>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            {[
              [selectedApps.length, "Total", "#4285F4"],
              [safeCount, "Safe", "#34A853"],
              [riskyCount, "Risky", "#EA4335"],
            ].map(([n, l, c]) => (
              <div
                key={l}
                style={{
                  background: "white",
                  borderRadius: "14px",
                  padding: "14px",
                  textAlign: "center",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ fontSize: "24px", fontWeight: 900, color: c }}>
                  {n}
                </div>
                <div style={{ fontSize: "11px", color: "#999" }}>{l}</div>
              </div>
            ))}
          </div>

          {/* App list */}
          {selectedApps.map((app) => (
            <div
              key={app.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "white",
                borderRadius: "14px",
                padding: "14px",
                marginBottom: "8px",
                border:
                  app.risk === "risky"
                    ? "2px solid #FFCDD2"
                    : "1px solid #f0f0f0",
              }}
            >
              <span style={{ fontSize: "24px" }}>{app.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{app.name}</div>
                <div style={{ fontSize: "11px", color: "#999" }}>
                  {app.permissions}
                </div>
              </div>
              <button
                onClick={() =>
                  updateAppRisk(
                    app.name,
                    app.risk === "safe" ? "risky" : "safe"
                  )
                }
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "10px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: riskColors[app.risk] + "18",
                  color: riskColors[app.risk],
                }}
              >
                {riskLabels[app.risk]}
              </button>
              <button
                onClick={() => removeApp(app.name)}
                style={{
                  background: "#f0f0f0",
                  border: "none",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}

          {error && (
            <p
              style={{
                color: "#EA4335",
                fontSize: "13px",
                fontWeight: 600,
                margin: "12px 0",
              }}
            >
              {error}
            </p>
          )}

          <button
            onClick={saveApps}
            disabled={saving}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "16px",
              border: "none",
              background: saving
                ? "#94b8f0"
                : "linear-gradient(135deg,#34A853,#2e7d32)",
              color: "white",
              fontSize: "16px",
              fontWeight: 800,
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 8px 32px rgba(52,168,83,0.3)",
              marginTop: "16px",
            }}
          >
            {saving ? "Saving..." : `Save ${selectedApps.length} Apps →`}
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Celebration
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0f23, #1a1a3e)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ textAlign: "center", color: "white", maxWidth: "360px" }}>
        <div style={{ fontSize: "72px", marginBottom: "16px" }}>🎉</div>
        <h1 style={{ margin: "0 0 8px", fontSize: "28px", fontWeight: 900 }}>
          Scan Complete!
        </h1>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "16px",
            opacity: 0.7,
            lineHeight: 1.6,
          }}
        >
          You've logged{" "}
          <strong style={{ color: "#4285F4" }}>{selectedApps.length}</strong> apps
          connected to your Google account.
        </p>
        <p style={{ margin: "0 0 32px", fontSize: "14px", opacity: 0.5 }}>
          {selectedApps.filter((a) => a.risk === "risky").length > 0
            ? `${selectedApps.filter((a) => a.risk === "risky").length} need your attention.`
            : "Everything looks good!"}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          {[
            [
              selectedApps.filter((a) => a.risk === "safe").length,
              "Safe",
              "#34A853",
            ],
            [
              selectedApps.filter((a) => a.risk === "risky").length,
              "Risky",
              "#EA4335",
            ],
          ].map(([n, l, c]) => (
            <div
              key={l}
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "20px",
              }}
            >
              <div style={{ fontSize: "32px", fontWeight: 900, color: c }}>
                {n}
              </div>
              <div style={{ fontSize: "12px", opacity: 0.5 }}>{l}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onComplete}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            border: "none",
            background: "linear-gradient(135deg,#4285F4,#2962FF)",
            color: "white",
            fontSize: "16px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(66,133,244,0.3)",
          }}
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );
}
