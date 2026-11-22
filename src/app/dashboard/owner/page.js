
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const formatMoney = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

function StatCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-[#e3e8e3] bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">
        {label}
      </p>

      <h3 className="mt-4 text-3xl font-extrabold text-[#174f43]">
        {value}
      </h3>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function EarningsChart({ data }) {
  const values = Array.isArray(data) ? data : [];

  const maxValue = Math.max(
    1,
    ...values.map((item) => Number(item.value || 0)),
  );

  return (
    <div className="rounded-3xl border border-[#e3e8e3] bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">
            Monthly Earnings
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Earnings from verified Stripe payments
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">
          Last 6 months
        </span>
      </div>

      {values.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          No earnings data available.
        </p>
      ) : (
        <div className="flex h-64 items-end gap-3 border-b border-slate-200 pb-2 sm:gap-6">
          {values.map((item, index) => {
            const amount = Number(item.value || 0);
            const height = Math.max(
              5,
              (amount / maxValue) * 170,
            );

            return (
              <div
                key={`${item.month}-${index}`}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-center text-[10px] font-bold text-slate-600 sm:text-xs">
                  {formatMoney(amount)}
                </span>

                <div
                  className="w-full max-w-16 rounded-t-lg bg-[#176b51]"
                  style={{ height: `${height}px` }}
                  title={`${item.month}: ${formatMoney(amount)}`}
                />

                <span className="text-center text-[10px] text-slate-500 sm:text-xs">
                  {item.month?.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {values.length > 0 &&
        values.every((item) => Number(item.value) === 0) && (
          <p className="mt-5 text-center text-sm text-slate-500">
            No paid rental earnings in this period.
          </p>
        )}
    </div>
  );
}

export default function OwnerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/api/auth/token`, {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.token) {
          throw new Error(
            "Please sign in with your Owner account.",
          );
        }

        return data.token;
      })
      .then(async (token) => {
        const response = await fetch(
          `${API}/api/analytics/owner`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load Owner analytics.",
          );
        }

        return data.data;
      })
      .then((data) => {
        if (controller.signal.aborted) return;

        setAnalytics(data);
        setError("");
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load dashboard.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [retry]);

  function reload() {
    setLoading(true);
    setError("");
    setRetry((value) => value + 1);
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 text-[#192321] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#e3e8e3] pb-6">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-[#174f43]"
          >
            EquipRent
            <span className="text-[#df704b]">.</span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            View Website
          </Link>
        </header>

        <section className="mb-9">
          <p className="text-xs font-bold uppercase tracking-[2px] text-[#d97752]">
            OWNER DASHBOARD
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Your Rental Business
              </h1>

              <p className="mt-3 text-sm text-slate-600">
                Track equipment, completed rentals, and earnings.
              </p>
            </div>

            <button
              type="button"
              onClick={reload}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#174f43] disabled:opacity-50"
            >
              Refresh Analytics
            </button>
          </div>
        </section>

        <nav
          aria-label="Owner dashboard navigation"
          className="mb-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Link
            href="/dashboard/owner/add-equipment"
            className="rounded-2xl bg-[#174f43] p-6 text-white transition hover:bg-[#236959]"
          >
            <span className="text-2xl">＋</span>

            <h2 className="mt-3 text-lg font-bold">
              Add Equipment
            </h2>

            <p className="mt-2 text-xs text-emerald-100">
              Create a new rental listing
            </p>
          </Link>

          <Link
            href="/dashboard/owner/equipment"
            className="rounded-2xl border border-[#e3e8e3] bg-white p-6 transition hover:shadow-lg"
          >
            <span className="text-2xl">▦</span>

            <h2 className="mt-3 text-lg font-bold">
              My Equipment
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              View, edit, and manage listings
            </p>
          </Link>

          <Link
            href="/dashboard/owner/rentals"
            className="rounded-2xl border border-[#e3e8e3] bg-white p-6 transition hover:shadow-lg"
          >
            <span className="text-2xl">▤</span>

            <h2 className="mt-3 text-lg font-bold">
              My Equipment Rentals
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              Review your equipment bookings
            </p>
          </Link>
        </nav>

        {error && (
          <div
            role="alert"
            className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            {error}

            <div className="mt-4">
              <Link
                href="/sign-in?returnTo=/dashboard/owner"
                className="font-semibold underline"
              >
                Sign in as Owner
              </Link>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : analytics ? (
          <>
            <section className="mb-9">
              <div className="mb-5">
                <h2 className="text-xl font-bold">
                  Business Overview
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Live data from your equipment and transactions
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label="Listed Equipment"
                  value={analytics.totalListedEquipment ?? 0}
                  description="Your active, non-deleted listings"
                />

                <StatCard
                  label="Completed Rentals"
                  value={analytics.completedRentals ?? 0}
                  description="Bookings marked completed"
                />

                <StatCard
                  label="Total Earnings"
                  value={formatMoney(analytics.totalEarnings)}
                  description="Verified paid transactions in BDT"
                />
              </div>
            </section>

            <EarningsChart data={analytics.monthlyEarnings} />
          </>
        ) : !error ? (
          <p className="rounded-2xl border bg-white p-10 text-center text-slate-500">
            No analytics data found.
          </p>
        ) : null}

        <footer className="mt-12 border-t border-slate-200 py-8 text-center text-xs text-slate-500">
          EquipRent · Owner Business Analytics
        </footer>
      </div>
    </main>
  );
}