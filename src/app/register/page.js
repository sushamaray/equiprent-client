
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/sign-up/email`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Registration failed. Please try again.",
        );
      }

      router.push("/sign-in?registered=true");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Registration failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-4 py-12 text-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight text-emerald-900"
        >
          EquipRent<span className="text-amber-500">.</span>
        </Link>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          Join EquipRent
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Create your account
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Discover quality equipment and rent what you need.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <label className="block text-sm font-semibold">
            Full name
            <input
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={form.name}
              onChange={updateForm}
              placeholder="Your full name"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-emerald-700"
            />
          </label>

          <label className="block text-sm font-semibold">
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={updateForm}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-emerald-700"
            />
          </label>

          <label className="block text-sm font-semibold">
            Password
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={updateForm}
              placeholder="At least 8 characters"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-emerald-700"
            />
          </label>

          <label className="block text-sm font-semibold">
            Confirm password
            <input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={updateForm}
              placeholder="Enter your password again"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-emerald-700"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) =>
                setShowPassword(event.target.checked)
              }
              className="h-4 w-4 accent-emerald-800"
            />
            Show password
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-900 px-6 py-4 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-bold text-emerald-800 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <Link
          href="/"
          className="mt-5 block text-center text-xs font-medium text-slate-500 hover:text-emerald-800"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}