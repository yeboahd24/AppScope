import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import RevokeGuide from "./RevokeGuide";

const riskColors = { safe: "#34A853", risky: "#EA4335" };
const riskLabels = { safe: "Safe", risky: "Risky" };

export default function Dashboard({ session, onSignOut, onScanAgain }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);
  const [toast, setToast] = useState(null);
  const [extensionDetected, setExtensionDetected] = useState(false);
  const [extensionScanning, setExtensionScanning] = useState(false);

  const fetchApps = useCallback((ignore) => {
    supabase
      .from("user_apps")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_revoked", false)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!ignore && !error && data) setApps(data);
        if (!ignore) setLoading(false);
      });
  }, [session.user.id]);

  useEffect(() => {
    let ignore = false;
    fetchApps(ignore);
    return () => { ignore = true; };
  }, [fetchApps]);

  // Detect extension
  useEffect(() => {
    const handlePong = (event) => {
      if (event.data && event.data.type === "APPSCOPE_PONG") {
        setExtensionDetected(true);
      }
    };
    window.addEventListener("message", handlePong);
    window.postMessage({ type: "APPSCOPE_PING" }, "*");
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handlePong);
    }, 500);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("message", handlePong);
    };
  }, []);

  // Listen for extension sync events (custom event dispatched by auth-bridge)
  useEffect(() => {
    const handleSync = () => {
      fetchApps(false);
      showToast("Apps synced from extension");
    };
    window.addEventListener("appscope-sync", handleSync);
    return () => window.removeEventListener("appscope-sync", handleSync);
  }, [fetchApps]);

  const handleExtensionScan = () => {
    setExtensionScanning(true);
    window.open("https://myaccount.google.com/connections?filters=3,4", "_blank");
    // Poll for new data
    let attempts = 0;
    const startCount = apps.length;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const { data, error } = await supabase
          .from("user_apps")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("is_revoked", false)
          .order("created_at", { ascending: false });
        if (!error && data && data.length !== startCount) {
          clearInterval(poll);
          setApps(data);
          setExtensionScanning(false);
          showToast(`Synced ${data.length} apps from extension`);
        }
      } catch {
        // ignore
      }
      if (attempts >= 30) {
        clearInterval(poll);
        setExtensionScanning(false);
      }
    }, 2000);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRevoked = async (appId) => {
    const { error } = await supabase
      .from("user_apps")
      .update({ is_revoked: true, revoked_at: new Date().toISOString() })
      .eq("id", appId);

    if (!error) {
      setApps((prev) => prev.filter((a) => a.id !== appId));
      setSelectedApp(null);
      showToast("App marked as revoked");
    }
  };

  // If viewing revoke guide for an app
  if (selectedApp) {
    return (
      <RevokeGuide
        app={selectedApp}
        session={session}
        onBack={() => setSelectedApp(null)}
        onRevoked={handleRevoked}
      />
    );
  }

  const safeApps = apps.filter((a) => a.risk_level === "safe");
  const riskyApps = apps.filter((a) => a.risk_level === "risky");
  const totalApps = apps.length;

  const getFiltered = () => {
    if (filter === "safe") return safeApps;
    if (filter === "risky") return riskyApps;
    return apps;
  };

  const filteredApps = getFiltered();
  const userEmail = session.user.email;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f6fa",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg,#1a1a2e,#2d2d50)",
            color: "white",
            padding: "14px 28px",
            borderRadius: "16px",
            fontSize: "14px",
            zIndex: 999,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "18px" }}>✅</span> {toast}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f0f23, #1a1a3e, #0f0f23)",
          padding: "24px 20px 28px",
          color: "white",
          borderBottomLeftRadius: "28px",
          borderBottomRightRadius: "28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "-20px",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: "#4285F4",
            filter: "blur(80px)",
            opacity: 0.15,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontSize: "22px" }}>🔐</span>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>
                AppScope
              </h1>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                opacity: 0.6,
                maxWidth: "200px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userEmail}
            </p>
          </div>
          <button
            onClick={onSignOut}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              padding: "8px 16px",
              borderRadius: "24px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px",
            marginTop: "22px",
            position: "relative",
            zIndex: 2,
          }}
        >
          {[
            [totalApps, "Total Apps", "rgba(255,255,255,0.08)", "white"],
            [riskyApps.length, "Risky", "rgba(234,67,53,0.15)", "#FF6B6B"],
            [safeApps.length, "Safe", "rgba(52,168,83,0.15)", "#34A853"],
          ].map(([n, l, bg, c]) => (
            <div
              key={l}
              style={{
                background: bg,
                borderRadius: "16px",
                padding: "16px 12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: 900, color: c }}>
                {n}
              </div>
              <div style={{ fontSize: "11px", opacity: 0.5, marginTop: "2px" }}>
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extension download banner — shown at top when extension not detected */}
      {!extensionDetected && !loading && (
        <div
          style={{
            margin: "16px 20px 0",
            background: "linear-gradient(135deg, #EDE7F6, #E8EAF6)",
            borderRadius: "18px",
            padding: "18px",
            border: "1px solid #D1C4E9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "18px" }}>&#x1f9e9;</span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#4527A0" }}>
              Auto-Scan Extension
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
            Install our Chrome extension to automatically scan your Google permissions.
            We're working on publishing it to the Chrome Web Store — for now, install it manually.
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
            4. Enable "Developer mode" (top right)<br />
            5. Click "Load unpacked" → select the <code style={{ background: "#f0f0f0", padding: "1px 6px", borderRadius: "4px", fontSize: "11px" }}>extension</code> folder
          </div>
          <a
            href="/appscope-extension.zip"
            download="appscope-extension.zip"
            style={{
              display: "block",
              textAlign: "center",
              padding: "11px",
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
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              border: "3px solid #e0e0e0",
              borderTopColor: "#4285F4",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: "#999", fontSize: "14px" }}>Loading your apps...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Empty state */}
      {!loading && apps.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
          <h3
            style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 800 }}
          >
            No apps tracked yet
          </h3>
          <p
            style={{
              color: "#888",
              fontSize: "14px",
              margin: "0 0 20px",
              lineHeight: 1.6,
            }}
          >
            Run a scan to log the apps connected to your Google account.
          </p>
          <button
            onClick={onScanAgain}
            style={{
              padding: "14px 32px",
              borderRadius: "16px",
              border: "none",
              background: "linear-gradient(135deg,#4285F4,#2962FF)",
              color: "white",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(66,133,244,0.3)",
            }}
          >
            Start Scan
          </button>
        </div>
      )}

      {/* Risky alert */}
      {!loading && riskyApps.length > 0 && (
        <div
          style={{
            margin: "20px 20px 0",
            background: "linear-gradient(135deg, #FFF3E0, #FFF8E1)",
            border: "1px solid #FFE0B2",
            borderRadius: "18px",
            padding: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <span style={{ fontSize: "20px" }}>🚨</span>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                color: "#BF360C",
                fontWeight: 800,
              }}
            >
              Security Alert
            </h3>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#E65100",
              lineHeight: 1.5,
            }}
          >
            {riskyApps.length} app{riskyApps.length > 1 ? "s have" : " has"}{" "}
            excessive permissions. Tap to review and revoke.
          </p>
        </div>
      )}

      {/* Filter bar */}
      {!loading && apps.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "16px 20px 8px",
              overflowX: "auto",
            }}
          >
            {[
              ["all", "All"],
              ["risky", "⚠ Risky"],
              ["safe", "✅ Safe"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "24px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  background: filter === k ? "#222" : "white",
                  color: filter === k ? "white" : "#666",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* App list */}
          <div style={{ padding: "8px 20px 12px" }}>
            {filteredApps.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  color: "#999",
                  padding: "20px 0",
                }}
              >
                No apps match this filter
              </p>
            )}
            {filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  background: "white",
                  borderRadius: "16px",
                  padding: "16px",
                  marginBottom: "10px",
                  cursor: "pointer",
                  border:
                    app.risk_level === "risky"
                      ? "2px solid #FFCDD2"
                      : "1px solid #f0f0f0",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    background:
                      app.risk_level === "risky" ? "#FFF3F0" : "#f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                  }}
                >
                  {app.app_icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "15px" }}>
                      {app.app_name}
                    </span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "8px",
                        fontSize: "10px",
                        fontWeight: 700,
                        background: riskColors[app.risk_level] + "18",
                        color: riskColors[app.risk_level],
                      }}
                    >
                      {riskLabels[app.risk_level]}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#999", marginTop: "3px" }}>
                    {app.permissions}
                  </div>
                </div>
                <span style={{ color: "#ccc", fontSize: "18px" }}>›</span>
              </div>
            ))}
          </div>

          {/* Scan Again */}
          <div style={{ padding: "0 20px 12px" }}>
            {extensionDetected ? (
              <button
                onClick={handleExtensionScan}
                disabled={extensionScanning}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "16px",
                  border: "none",
                  background: extensionScanning ? "#94b8f0" : "linear-gradient(135deg, #4285F4, #2962FF)",
                  color: "white",
                  cursor: extensionScanning ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: 700,
                  boxShadow: "0 4px 16px rgba(66,133,244,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {extensionScanning ? (
                  <>
                    <span style={{ width: "16px", height: "16px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                    Scanning...
                  </>
                ) : "Scan with Extension"}
              </button>
            ) : (
              <button
                onClick={onScanAgain}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "16px",
                  border: "2px dashed #ddd",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#aaa",
                }}
              >
                Manual Scan
              </button>
            )}
          </div>
          {extensionScanning && <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>}
        </>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "10px 20px 28px" }}>
        <p style={{ fontSize: "11px", color: "#ccc" }}>
          🔐 AppScope Free Tier — 1 account •{" "}
          <span style={{ color: "#4285F4", fontWeight: 600 }}>
            Upgrade coming soon
          </span>
        </p>
      </div>
    </div>
  );
}
