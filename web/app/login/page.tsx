"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@tenex.local");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      setError("Login failed. Check credentials.");
      return;
    }
    const data = await res.json();
    localStorage.setItem("token", data.token);
    router.push("/upload");
  }

  return (
    <div className="card">
      <h2 className="card-title">Login</h2>
      <p className="subtle">Use the demo credentials to continue.</p>
      <form onSubmit={onSubmit} className="grid" style={{ marginTop: 12 }}>
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
      {error && (
        <p className="badge" style={{ background: "var(--danger)", color: "#0f141b" }}>
          {error}
        </p>
      )}
    </div>
  );
}
