
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function SignInForm() {
  const params = useSearchParams();
  const registered = params.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/auth/sign-in/email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe: true }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error?.message || "Invalid email or password.",
        );
      }

      const destination = params.get("returnTo") || "/";
      window.location.assign(
        destination.startsWith("/") && !destination.startsWith("//")
          ? destination
          : "/",
      );
    } catch (cause) {
      setError(cause.message || "Sign in failed.");
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen grid place-items-center bg-[#f7f8f6] px-4 py-12 text-[#17231f]"
      style={{ fontFamily: '"Segoe UI", Arial, sans-serif' }}
    >
      <section className="w-full max-w-[470px] rounded-3xl border border-[#e5eae5] bg-white p-7 shadow-[0_12px_45px_rgba(20,45,35,0.05)] sm:p-10">

        <Link href="/" className="inline-block text-[25px] font-extrabold tracking-[-1.5px] text-[#174f43]">
          EquipRent<span className="text-[#df704b]">.</span>
        </Link>

        <div className="mb-8 mt-10">
          <p className="mb-3 text-[10px] font-bold tracking-[2.5px] text-[#d97752]">
            WELCOME BACK
          </p>

          <h1 className="text-[32px] font-bold tracking-[-1.4px] sm:text-[36px]">
            Sign in to your account
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#758079]">
            Access your EquipRent account and manage your equipment rentals.
          </p>
        </div>

        {registered && (
          <div
            role="status"
            className="mb-6 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <span className="font-bold">✓</span>
            Registration successful! Please sign in to continue.
          </div>
        )}

        {error && (
          <div role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-semibold">
            Email address
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-[#dfe5df] bg-[#fafbf9] px-4 py-3.5 text-sm font-normal outline-none transition focus:border-[#174f43] focus:bg-white focus:ring-2 focus:ring-[#174f43]/10"
            />
          </label>

          <label className="block text-sm font-semibold">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-2 w-full rounded-xl border border-[#dfe5df] bg-[#fafbf9] px-4 py-3.5 text-sm font-normal outline-none transition focus:border-[#174f43] focus:bg-white focus:ring-2 focus:ring-[#174f43]/10"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-between rounded-xl bg-[#174f43] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#236959] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
            <span>→</span>
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-[#758079]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-[#174f43] hover:underline">
            Create account
          </Link>
        </p>

        <div className="mt-8 border-t border-[#edf0ed] pt-6 text-center">
          <Link href="/" className="text-xs font-semibold text-[#758079] hover:text-[#174f43]">
            ← Back to equipment
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f7f8f6]">Loading...</main>}>
      <SignInForm />
    </Suspense>
  );
}