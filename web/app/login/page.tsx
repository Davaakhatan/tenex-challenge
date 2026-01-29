"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@tenex.local");
  const [password, setPassword] = useState("password");
  const [token, setToken] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      alert("Login failed");
      return;
    }
    const data = await res.json();
    setToken(data.token);
    localStorage.setItem("token", data.token);
  }

  return (
    <div className="card fade-in">
      <h2>Login</h2>
      <p style={{ color: "var(--muted)" }}>Use the demo credentials to proceed.</p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <input
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button className="button" type="submit">Sign In</button>
      </form>
      {token && <p className="badge">Token stored in localStorage</p>}
    </div>
  );
}
