import "./globals.css";
import type { Metadata } from "next";
import TopNav from "./components/TopNav";

export const metadata: Metadata = {
  title: "Tenex Log Analyzer",
  description: "Upload logs and review anomalies"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <TopNav />
          {children}
        </main>
      </body>
    </html>
  );
}
