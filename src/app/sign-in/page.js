"use client";

import { useState } from "react";
import Link from "next/link";

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setError(""); setSubmitting(true);
    try {
      const response = await fetch(`${api}/api/auth/sign-in/email`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error?.message || "Could not sign in. Check your email and password.");
      const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/";
      window.location.assign(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/");
    } catch (cause) { setError(cause.message); setSubmitting(false); }
  };

  return <main className="result-shell"><section className="result-card signin-card"><Link className="brand" href="/">EquipRent<span>.</span></Link><p className="eyebrow signin-eyebrow">CUSTOMER ACCOUNT</p><h1>Sign in to continue</h1><p>Use the email and password for your EquipRent account. Your login stays on the secure EquipRent server.</p>{error && <p className="notice error">{error}</p>}<form className="signin-form" onSubmit={submit}><label>Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="submit-button" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}<span>→</span></button></form><Link className="back-link" href="/">Back to equipment</Link></section></main>;
}
