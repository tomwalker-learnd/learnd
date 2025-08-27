// src/components/dev/ErrorBoundary.tsx
import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; msg?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, msg: "" };

  static getDerivedStateFromError(err: unknown): State {
    return {
      hasError: true,
      msg: err instanceof Error ? err.message : String(err),
    };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // You can also send this to a logging service if desired
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: "system-ui" }}>
          <h1 style={{ marginBottom: 8, fontSize: "1.25rem", fontWeight: 600 }}>
            Something went wrong.
          </h1>
          <p style={{ marginBottom: 16, color: "#b91c1c" }}>
            {this.state.msg || "Unknown error"}
          </p>
          <button
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              background: "#3b82f6",
              color: "white",
              fontWeight: 500,
            }}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
