
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
    image: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function validateForm() {
    if (form.name.trim().length < 2) {
      return "Please enter your full name.";
    }

    if (!form.email.trim()) {
      return "Please enter your email address.";
    }

    if (form.image.trim()) {
      try {
        const url = new URL(form.image.trim());

        if (url.protocol !== "https:") {
          return "Profile photo must use a valid HTTPS URL.";
        }
      } catch {
        return "Please enter a valid profile photo URL.";
      }
    }

    if (form.password.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (!/[A-Z]/.test(form.password)) {
      return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(form.password)) {
      return "Password must contain at least one lowercase letter.";
    }

    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
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
            ...(form.image.trim()
              ? { image: form.image.trim() }
              : {}),
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

  async function handleGoogleSignUp() {
    setError("");
    setGoogleLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/sign-in/social`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: "google",
            callbackURL: "/dashboard/profile",
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Google sign-up is not available. Check OAuth configuration.",
        );
      }

      if (!data.url) {
        throw new Error("Google authorization URL was not returned.");
      }

      const url = new URL(data.url);

      if (
        url.protocol !== "https:" ||
        !["accounts.google.com", "accounts.google.com"].includes(
          url.hostname,
        )
      ) {
        throw new Error("Unexpected Google authorization URL.");
      }

      window.location.assign(url.toString());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Google sign-up failed.",
      );

      setGoogleLoading(false);
    }
  }

  const busy = loading || googleLoading;

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

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold">
            Full Name
            <input
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              value={form.name}
              onChange={updateForm}
              placeholder="Your full name"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-emerald-700"
            />
          </label>

          <label className="block text-sm font-semibold">
            Email Address
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
            Profile Photo URL
            <input
              name="image"
              type="url"
              maxLength={2048}
              value={form.image}
              onChange={updateForm}
              placeholder="https://example.com/photo.jpg"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-emerald-700"
            />

            <span className="mt-2 block text-xs font-normal text-slate-500">
              Optional. Use a publicly accessible HTTPS image URL.
            </span>
          </label>

          {form.image && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.image}
                alt="Profile preview"
                className="h-14 w-14 rounded-full bg-slate-200 object-cover"
                onError={(event) => {
                  event.currentTarget.style.visibility = "hidden";
                }}
              />

              <span className="text-xs text-slate-600">
                Profile photo preview
              </span>
            </div>
          )}

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

            <span className="mt-2 block text-xs font-normal text-slate-500">
              Must include uppercase and lowercase letters.
            </span>
          </label>

          <label className="block text-sm font-semibold">
            Confirm Password
            <input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
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
            Show Password
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-900 px-6 py-4 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium text-slate-400">
            OR
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={busy}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <span className="text-lg font-bold text-blue-600">G</span>
          {googleLoading
            ? "Connecting to Google..."
            : "Continue with Google"}
        </button>

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