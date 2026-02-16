import { useState } from "react";

const riskColors = { safe: "#34A853", risky: "#EA4335" };
const riskLabels = { safe: "Safe", risky: "Risky" };

export default function RevokeGuide({ app, session, onBack, onRevoked }) {
  const [step, setStep] = useState(0);
  const [confirming, setConfirming] = useState(false);

  const handleMarkRevoked = async () => {
    setConfirming(true);
    await onRevoked(app.id);
    setConfirming(false);
  };

  // Step 0: App detail + instructions
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
            background: "white",
            padding: "16px 20px",
            borderBottom: "1px solid #eee",
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: "#f0f0f0",
              border: "none",
              padding: "8px 20px",
              borderRadius: "24px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
              color: "#555",
            }}
          >
            ← Back
          </button>
        </div>

        <div style={{ padding: "24px 20px" }}>
          {/* App info card */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "20px",
              background: "white",
              borderRadius: "24px",
              padding: "28px 20px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "20px",
                background: "#f8f9fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                margin: "0 auto 12px",
              }}
            >
              {app.app_icon}
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 800 }}>
              {app.app_name}
            </h2>
            <span
              style={{
                background: riskColors[app.risk_level] + "18",
                color: riskColors[app.risk_level],
                padding: "6px 16px",
                borderRadius: "24px",
                fontSize: "13px",
                fontWeight: 800,
              }}
            >
              {riskLabels[app.risk_level]}
            </span>
          </div>

          {/* Details */}
          {[
            ["Account", session.user.email],
            ["Permissions", app.permissions],
            ["Category", app.category],
          ].map(([l, v]) => (
            <div
              key={l}
              style={{
                background: "white",
                borderRadius: "18px",
                padding: "18px",
                marginBottom: "12px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#999",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "6px",
                }}
              >
                {l}
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color:
                    l === "Permissions" && app.risk_level === "risky"
                      ? "#EA4335"
                      : "#333",
                }}
              >
                {v}
              </div>
            </div>
          ))}

          {app.risk_level === "risky" && (
            <div
              style={{
                background: "linear-gradient(135deg, #FFF3E0, #FFF8E1)",
                border: "1px solid #FFE0B2",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "20px",
                display: "flex",
                gap: "12px",
                alignItems: "start",
              }}
            >
              <span style={{ fontSize: "20px" }}>⚠️</span>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#E65100",
                  lineHeight: 1.6,
                }}
              >
                <strong>Security Alert:</strong> This app has broad access to
                your account. We recommend revoking it.
              </p>
            </div>
          )}

          <button
            onClick={() => setStep(1)}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "16px",
              border: "none",
              background: "linear-gradient(135deg,#EA4335,#d32f2f)",
              color: "white",
              fontSize: "16px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 6px 24px rgba(234,67,53,0.3)",
            }}
          >
            Revoke This App
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Guided revoke instructions
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
          background: "white",
          padding: "16px 20px",
          borderBottom: "1px solid #eee",
        }}
      >
        <button
          onClick={() => setStep(0)}
          style={{
            background: "#f0f0f0",
            border: "none",
            padding: "8px 20px",
            borderRadius: "24px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 700,
            color: "#555",
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ padding: "24px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🔓</div>
          <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 800 }}>
            Revoke {app.app_name}
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#888" }}>
            Follow these steps to remove access
          </p>
        </div>

        {/* Step-by-step instructions */}
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
            marginBottom: "16px",
          }}
        >
          {[
            "Click the button below to open Google's permissions page",
            `Find "${app.app_name}" in the list of apps`,
            `Click on "${app.app_name}" to expand it`,
            'Click "Remove Access" or "Revoke Access"',
            "Confirm when Google asks you to verify",
            'Come back here and click "I\'ve Revoked It"',
          ].map((text, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "14px",
                alignItems: "start",
                marginBottom: i < 5 ? "16px" : 0,
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background:
                    i === 3
                      ? "linear-gradient(135deg,#EA4335,#d32f2f)"
                      : "#4285F4",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "14px",
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
                  paddingTop: "4px",
                }}
              >
                {text}
              </p>
            </div>
          ))}
        </div>

        {/* Deep link to Google permissions */}
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
          Open Google Permissions ↗
        </a>

        {/* Confirm revoked */}
        <button
          onClick={handleMarkRevoked}
          disabled={confirming}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            border: "none",
            background: confirming
              ? "#94b8f0"
              : "linear-gradient(135deg,#34A853,#2e7d32)",
            color: "white",
            fontSize: "16px",
            fontWeight: 800,
            cursor: confirming ? "not-allowed" : "pointer",
            boxShadow: "0 8px 32px rgba(52,168,83,0.3)",
            marginBottom: "12px",
          }}
        >
          {confirming ? "Saving..." : "I've Revoked It ✓"}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#bbb",
            lineHeight: 1.5,
          }}
        >
          This will mark the app as revoked in AppScope. Make sure you've
          actually removed it from Google first.
        </p>
      </div>
    </div>
  );
}
