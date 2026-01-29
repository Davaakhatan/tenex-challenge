import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tenex Log Analyzer",
  description: "Upload logs and review anomalies"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <div className="nav fade-in">
            <div>
              <div className="mono" style={{ color: "var(--muted)" }}>TENEX // LABS</div>
              <h1 style={{ margin: "6px 0 0" }}>Tenex Log Analyzer</h1>
              <p style={{ color: "var(--muted)", marginTop: 6 }}>
                SOC-style log analysis, anomaly detection, and timeline insights
              </p>
            </div>
            <div className="nav-links">
              <a href="/">Overview</a>
              <a href="/login">Login</a>
              <a href="/upload">Upload</a>
              <a href="/results">Results</a>
            </div>
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}
