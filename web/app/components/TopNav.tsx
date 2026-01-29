"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/upload", label: "Upload" },
  { href: "/results", label: "Results" }
];

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setAuthed(Boolean(token));
  }, [pathname]);

  function onLogout() {
    localStorage.removeItem("token");
    setAuthed(false);
    router.push("/login");
  }

  return (
    <header className="topbar">
      <div className="brand">
        <span className="mono">TENEX // LABS</span>
        <h1>Tenex Log Analyzer</h1>
        <span className="subtle">SOC-ready timeline + anomaly review</span>
      </div>
      <nav className="nav">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={pathname === link.href ? "active" : undefined}
          >
            {link.label}
          </a>
        ))}
        {authed ? (
          <button className="ghost" type="button" onClick={onLogout}>
            Logout
          </button>
        ) : (
          <a href="/login" className={pathname === "/login" ? "active" : undefined}>
            Login
          </a>
        )}
      </nav>
    </header>
  );
}
