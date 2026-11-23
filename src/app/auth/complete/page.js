
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AuthCompletePage() {
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function completeLogin() {
      try {
        // Use the existing Next.js same-origin API proxy.
        const tokenResponse = await fetch("/api/auth/token", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        const tokenData = await tokenResponse
          .json()
          .catch(() => ({}));

        if (!tokenResponse.ok || !tokenData.token) {
          throw new Error(
            "Your login session could not be verified."
          );
        }

        // Fetch the authenticated user's actual role.
        const profileResponse = await fetch("/api/profile/me", {
          headers: {
            Authorization: `Bearer ${tokenData.token}`,
          },
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        const profileData = await profileResponse
          .json()
          .catch(() => ({}));

        if (!profileResponse.ok || !profileData.data) {
          throw new Error(
            profileData.message ||
              "Unable to determine your account role."
          );
        }

        if (controller.signal.aborted) return;

        const role = profileData.data.role;

        let destination = "/";

        if (role === "admin") {
          destination = "/dashboard/admin";
        } else if (role === "owner") {
          destination = "/dashboard/owner";
        }

        // Replace the temporary redirect page in history.
        window.location.replace(destination);
      } catch (cause) {
        if (controller.signal.aborted) return;

        setError(
          cause.message ||
            "Unable to complete the login process."
        );
      }
    }

    completeLogin();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-4 py-12 text-[#192321]">
      <section className="w-full max-w-md rounded-3xl border border-[#e3e8e3] bg-white p-8 text-center shadow-sm sm:p-10">
        <Link
          href="/"
          className="text-3xl font-extrabold tracking-tight text-[#174f43]"
        >
          EquipRent<span className="text-[#df704b]">.</span>
        </Link>

        {error ? (
          <>
            <h1 className="mt-8 text-2xl font-bold">
              Login verification failed
            </h1>

            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </p>

            <Link
              href="/sign-in"
              className="mt-6 inline-block rounded-xl bg-[#174f43] px-6 py-3 text-sm font-semibold text-white"
            >
              Back to Sign In
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto mt-10 h-12 w-12 animate-spin rounded-full border-4 border-[#dceae4] border-t-[#174f43]" />

            <h1 className="mt-7 text-2xl font-bold">
              Completing your sign in
            </h1>

            <p className="mt-3 text-sm text-slate-600">
              Verifying your account and redirecting you
              to the right page...
            </p>
          </>
        )}
      </section>
    </main>
  );
}