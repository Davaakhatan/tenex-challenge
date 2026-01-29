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
          <div style={{ marginBottom: 20 }}>
            <h1>Tenex Log Analyzer</h1>
            <p style={{ color: "var(--muted)" }}>
              Prototype for SOC-style log analysis and anomaly detection
            </p>
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}
