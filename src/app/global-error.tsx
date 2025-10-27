"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("Global error:", error);

    // You could also send this to an error tracking service
    // trackError(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        fontFamily: "'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        margin: 0,
        padding: 0,
        backgroundColor: "#09090b",
        color: "#fafafa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}>
        <div style={{
          maxWidth: "42rem",
          width: "100%",
          padding: "1rem",
        }}>
          <div style={{
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "0.75rem",
            padding: "2rem",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}>
              <AlertTriangle style={{
                width: "2rem",
                height: "2rem",
                color: "#ef4444",
              }} />
              <h1 style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                margin: 0,
              }}>
                Application Error
              </h1>
            </div>

            <p style={{
              color: "#a1a1aa",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}>
              We encountered a critical error. Don&apos;t worry, your data is safe.
            </p>

            <div style={{
              backgroundColor: "#09090b",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1.5rem",
            }}>
              <p style={{
                fontSize: "0.875rem",
                fontFamily: "monospace",
                color: "#a1a1aa",
                wordBreak: "break-word",
                margin: 0,
              }}>
                {error.message || "An unknown error occurred"}
              </p>
              {error.digest && (
                <p style={{
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: "#71717a",
                  marginTop: "0.5rem",
                  marginBottom: 0,
                }}>
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div style={{
              display: "flex",
              gap: "0.75rem",
            }}>
              <button
                onClick={reset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: "#fafafa",
                  color: "#09090b",
                  border: "none",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#e4e4e7";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#fafafa";
                }}
              >
                <RefreshCw style={{ width: "1rem", height: "1rem" }} />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = "/"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: "transparent",
                  color: "#fafafa",
                  border: "1px solid #27272a",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#18181b";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
