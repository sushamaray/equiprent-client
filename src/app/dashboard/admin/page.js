
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

async function getToken() {
  const response = await fetch(`${API}/api/auth/token`, {
    credentials: "include",
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || !data.token) {
    throw new Error("Please sign in with your Admin account.");
  }

  return data.token;
}

function StatCard({ title, value, description, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-4 text-3xl font-bold ${accent || "text-slate-900"}`}>
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function MonthlyChart({ data }) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Monthly Bookings</h3>
          <p className="mt-1 text-xs text-slate-500">
            Booking activity over the last six months
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          Last 6 months
        </span>
      </div>

      <div className="flex h-56 items-end justify-around gap-3 border-b border-slate-200 px-2">
        {data.map((item) => (
          <div
            key={item.month}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="text-xs font-bold text-slate-600">
              {item.value}
            </span>

            <div
              className="w-full max-w-12 rounded-t-lg bg-emerald-700 transition-all duration-500"
              style={{
                height: `${Math.max(5, (item.value / max) * 145)}px`,
              }}
              title={`${item.month}: ${item.value} bookings`}
            />

            <span className="pb-2 text-center text-[10px] text-slate-500">
              {item.month.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>

      {data.every((item) => item.value === 0) && (
        <p className="mt-4 text-center text-xs text-slate-500">
          No bookings recorded during this period.
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [items, setItems] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/api/auth/token`, {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok || !data.token) {
          throw new Error("Please sign in with your Admin account.");
        }

        return data.token;
      })
      .then(async (token) => {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [analyticsResponse, equipmentResponse] =
          await Promise.all([
            fetch(`${API}/api/analytics/admin`, {
              headers,
              cache: "no-store",
              signal: controller.signal,
            }),

            fetch(
              `${API}/api/equipment/admin/pending?page=${page}&limit=10`,
              {
                headers,
                cache: "no-store",
                signal: controller.signal,
              },
            ),
          ]);

        const [analyticsData, equipmentData] =
          await Promise.all([
            analyticsResponse.json(),
            equipmentResponse.json(),
          ]);

        if (!analyticsResponse.ok) {
          throw new Error(
            analyticsData.message || "Failed to load analytics.",
          );
        }

        if (!equipmentResponse.ok) {
          throw new Error(
            equipmentData.message || "Failed to load equipment.",
          );
        }

        return { analyticsData, equipmentData };
      })
      .then(({ analyticsData, equipmentData }) => {
        if (controller.signal.aborted) return;

        setAnalytics(analyticsData.data);
        setItems(equipmentData.data || []);
        setTotalPages(
          Math.max(1, equipmentData.pagination?.totalPages || 1),
        );
        setError("");
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;

        setError(cause.message || "Dashboard loading failed.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [page, refresh]);

  async function reviewEquipment(item, action) {
    if (busyId) return;

    if (
      action === "reject" &&
      !window.confirm(`Reject "${item.name}"?`)
    ) {
      return;
    }

    setBusyId(item._id);
    setError("");
    setMessage("");

    try {
      const token = await getToken();

      const response = await fetch(
        `${API}/api/equipment/${item._id}/${action}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Equipment review failed.");
      }

      setMessage(
        `${item.name} successfully ${
          action === "approve" ? "approved" : "rejected"
        }.`,
      );

      setLoading(true);
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError(cause.message || "Equipment review failed.");
    } finally {
      setBusyId(null);
    }
  }

  function changePage(nextPage) {
    setLoading(true);
    setPage(nextPage);
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 text-[#192321] sm:px-6">
      <div className="mx-auto max-w-7xl">

        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#e3e8e3] pb-6">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-[#174f43]"
          >
            EquipRent<span className="text-[#df704b]">.</span>
          </Link>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold"
            >
              View Website
            </Link>

            <Link
              href="/sign-in"
              className="rounded-full bg-[#174f43] px-5 py-2 text-sm font-semibold text-white"
            >
              Sign In
            </Link>
          </div>
        </header>

        <section className="mb-9">
          <p className="text-xs font-bold uppercase tracking-[2px] text-[#d97752]">
            ADMINISTRATION
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Admin Dashboard
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Monitor marketplace performance and manage equipment approvals.
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {message}
          </div>
        )}

        {loading && !analytics ? (
          <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">
            Loading dashboard analytics...
          </div>
        ) : analytics && (
          <>
            <section className="mb-9">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Platform Overview</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Live statistics from MongoDB
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                  Database Analytics
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  title="Total Users"
                  value={analytics.totalUsers}
                  description="Registered platform users"
                />

                <StatCard
                  title="Total Equipment"
                  value={analytics.totalEquipment}
                  description="Non-deleted equipment listings"
                  accent="text-emerald-800"
                />

                <StatCard
                  title="Total Bookings"
                  value={analytics.totalBookings}
                  description="All recorded rental bookings"
                />

                <StatCard
                  title="Pending Approvals"
                  value={analytics.pendingApprovals}
                  description="Equipment awaiting admin review"
                  accent="text-amber-700"
                />

                <StatCard
                  title="Completed Rentals"
                  value={analytics.completedRentals}
                  description="Bookings marked completed"
                  accent="text-emerald-800"
                />

                <StatCard
                  title="Total Revenue"
                  value={money(analytics.totalRevenue)}
                  description="Verified paid transactions in BDT"
                  accent="text-emerald-800"
                />
              </div>
            </section>

            <section className="mb-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <MonthlyChart
                data={analytics.monthlyBookings || []}
              />
            </section>
          </>
        )}

        <section className="rounded-3xl border border-[#e3e8e3] bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Equipment Approval Queue
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Review owner submissions before publication.
              </p>
            </div>

            <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">
              {items.length} pending on this page
            </span>
          </div>

          {loading && !analytics ? (
            <p className="py-12 text-center text-slate-500">
              Loading equipment...
            </p>
          ) : items.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-4xl text-emerald-700">✓</div>
              <h3 className="mt-4 text-xl font-bold">All caught up!</h3>
              <p className="mt-2 text-sm text-slate-500">
                No equipment is waiting for approval.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item) => (
                <article
                  key={item._id}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  <div className="grid md:grid-cols-[220px_1fr]">
                    <div className="h-52 bg-slate-100 md:h-full">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase text-amber-800">
                          Pending Review
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.category}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold">{item.name}</h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                        <div>
                          <p className="text-slate-500">Location</p>
                          <p className="mt-1 font-semibold">{item.location}</p>
                        </div>

                        <div>
                          <p className="text-slate-500">Rental Price</p>
                          <p className="mt-1 font-semibold">
                            {money(item.rentalPrice ?? item.pricePerDay)}
                            / {item.rentalType || "daily"}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Quantity</p>
                          <p className="mt-1 font-semibold">
                            {item.availableQuantity ?? 1}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => reviewEquipment(item, "approve")}
                          className="rounded-xl bg-emerald-800 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {busyId === item._id
                            ? "Processing..."
                            : "Approve Equipment"}
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => reviewEquipment(item, "reject")}
                          className="rounded-xl border border-red-200 px-6 py-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-5">
              <button
                type="button"
                disabled={page <= 1 || Boolean(busyId)}
                onClick={() => changePage(page - 1)}
                className="rounded-xl border px-5 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages || Boolean(busyId)}
                onClick={() => changePage(page + 1)}
                className="rounded-xl border px-5 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>

        <footer className="py-8 text-center text-xs text-slate-500">
          EquipRent Administration · Live Platform Analytics
        </footer>
      </div>
    </main>
  );
}