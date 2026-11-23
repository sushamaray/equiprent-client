
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SuccessToast from "@/components/SuccessToast";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function GoogleBadge() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-base font-extrabold text-[#174f43]">
      G
    </span>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-[#dfe5df] bg-[#fafbf9] px-4 py-3.5 text-sm font-normal outline-none transition focus:border-[#174f43] focus:ring-2 focus:ring-[#174f43]/10";

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
  const [success, setSuccess] = useState("");

  const busy = loading || googleLoading;

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

    if (form.password.length < 6) {
      return "Password must contain at least 6 characters.";
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

    if (busy) return;

    setError("");
    setSuccess("");

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

      setSuccess(
        "Account created successfully! Redirecting to sign in...",
      );

      await new Promise((resolve) => setTimeout(resolve, 850));

      router.push("/sign-in?registered=true");
      router.refresh();
    } catch (cause) {
      setSuccess("");
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
    if (busy) return;

    setError("");
    setSuccess("");
    setGoogleLoading(true);

    try {
      const callbackURL = new URL(
        "/dashboard/profile",
        window.location.origin,
      ).href;

      const errorCallbackURL = new URL(
        "/sign-in?oauthError=true",
        window.location.origin,
      ).href;

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
            callbackURL,
            errorCallbackURL,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        throw new Error(
          data.message ||
            data.error?.message ||
            "Google sign-up is not available. Check OAuth configuration.",
        );
      }

      const url = new URL(data.url);

      if (url.protocol !== "https:") {
        throw new Error("Unexpected Google authorization URL.");
      }

      window.location.assign(url.href);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Google sign-up failed.",
      );

      setGoogleLoading(false);
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-4 py-12 text-[#17231f]"
      style={{
        fontFamily: '"Segoe UI", Arial, sans-serif',
      }}
    >
      <SuccessToast message={success} />

      <section className="w-full max-w-[470px] rounded-3xl border border-[#e5eae5] bg-white p-7 shadow-[0_12px_45px_rgba(20,45,35,0.05)] sm:p-10">
        <Link
          href="/"
          className="inline-block text-[25px] font-extrabold tracking-[-1.5px] text-[#174f43]"
        >
          EquipRent
          <span className="text-[#df704b]">.</span>
        </Link>

        <div className="mb-8 mt-10">
          <p className="mb-3 text-[10px] font-bold tracking-[2.5px] text-[#d97752]">
            JOIN EQUIPRENT
          </p>

          <h1 className="text-[32px] font-bold tracking-[-1.4px] sm:text-[36px]">
            Create your account
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#758079]">
            Discover quality equipment and rent what you need.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
            />

            <span className="mt-2 block text-xs font-normal text-[#758079]">
              Optional. Use a publicly accessible HTTPS image URL.
            </span>
          </label>

          {form.image && (
            <div className="flex items-center gap-3 rounded-xl bg-[#f3f7f2] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.image}
                alt="Profile preview"
                className="h-14 w-14 rounded-full bg-[#e3e9e3] object-cover"
                onError={(event) => {
                  event.currentTarget.style.visibility = "hidden";
                }}
              />

              <span className="text-xs text-[#758079]">
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
              minLength={6}
              value={form.password}
              onChange={updateForm}
              placeholder="At least 6 characters"
              className={inputClass}
            />

            <span className="mt-2 block text-xs font-normal text-[#758079]">
              Minimum 6 characters, including uppercase and
              lowercase letters.
            </span>
          </label>

          <label className="block text-sm font-semibold">
            Confirm Password
            <input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              value={form.confirmPassword}
              onChange={updateForm}
              placeholder="Enter your password again"
              className={inputClass}
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#758079]">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) =>
                setShowPassword(event.target.checked)
              }
              className="h-4 w-4 accent-[#174f43]"
            />
            Show Password
          </label>

          <button
            type="submit"
            disabled={busy}
            className="flex min-h-[56px] w-full items-center justify-center rounded-xl bg-[#174f43] px-5 py-4 text-sm font-bold text-white shadow-[0_6px_18px_rgba(23,79,67,0.14)] transition hover:bg-[#236959] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {success
              ? "Redirecting..."
              : loading
                ? "Creating account..."
                : "Create Account"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium text-[#758079]">
            OR
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={busy}
          className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-xl border border-[#dfe5df] bg-[#f7faf7] px-5 py-4 text-sm font-bold text-[#174f43] transition hover:bg-[#eff5f0] disabled:opacity-60"
        >
          <GoogleBadge />
          {googleLoading
            ? "Connecting to Google..."
            : "Continue with Google"}
        </button>

        <p className="mt-7 text-center text-sm text-[#758079]">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-bold text-[#174f43] hover:underline"
          >
            Sign in
          </Link>
        </p>

        <div className="mt-8 border-t border-[#edf0ed] pt-6 text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-[#758079] hover:text-[#174f43]"
          >
            ← Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}