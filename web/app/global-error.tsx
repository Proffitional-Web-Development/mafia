"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: globalThis.Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: "#0a0a0a",
            color: "#ededed",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#888", marginBottom: "1.5rem" }}>
            An unexpected error occurred. The team has been notified.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "1px solid #333",
              backgroundColor: "#1a1a1a",
              color: "#ededed",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
