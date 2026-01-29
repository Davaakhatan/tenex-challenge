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
          <div className="shell">
            <aside className="sidebar fade-in">
              <div className="brand">
                <div className="mono">TENEX // LABS</div>
                <h1 style={{ margin: 0 }}>Log Analyzer</h1>
                <p className="subtle" style={{ margin: 0 }}>
                  SOC-style parsing, anomalies, and timeline insights.
                </p>
              </div>
              <nav className="nav">
                <a href="/">Overview</a>
                <a href="/login">Login</a>
                <a href="/upload">Upload</a>
                <a href="/results">Results</a>
              </nav>
              <div style={{ marginTop: 18 }} className="grid">
                <span className="badge">TypeScript</span>
                <span className="badge">Express API</span>
                <span className="badge">PostgreSQL</span>
              </div>
            </aside>
            <section className="grid fade-in">
              {children}
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}
