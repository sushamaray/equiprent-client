
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getToken() {
  const response = await fetch(`${API}/api/auth/token`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Please sign in with your Admin account.");
  }

  const data = await response.json();

  if (!data.token) {
    throw new Error("Authentication token unavailable.");
  }

  return data.token;
}

function priceOf(item) {
  return item.rentalPrice ?? item.pricePerDay ?? 0;
}

export default function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refresh, setRefresh] = useState(0);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
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
        if (!response.ok) {
          throw new Error("Please sign in with your Admin account.");
        }

        const data = await response.json();

        if (!data.token) {
          throw new Error("Authentication token unavailable.");
        }

        return data.token;
      })
      .then(async (token) => {
        const response = await fetch(
          `${API}/api/equipment/admin/pending?page=${page}&limit=10`,
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
            data.message || "Could not load pending equipment.",
          );
        }

        return data;
      })
      .then((data) => {
        if (controller.signal.aborted) return;

        setItems(Array.isArray(data.data) ? data.data : []);
        setTotal(data.pagination?.total ?? 0);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setError("");
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;

        setError(cause.message || "Failed to load equipment.");
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || `Equipment ${action} failed.`,
        );
      }

      setMessage(
        `${item.name} successfully ${action === "approve" ? "approved" : "rejected"}.`,
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

          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold"
          >
            View Website
          </Link>
        </header>

        <section className="mb-9">
          <p className="text-xs font-bold uppercase tracking-[2px] text-[#d97752]">
            ADMINISTRATION
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Admin Dashboard
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Review equipment submissions and manage marketplace approval.
          </p>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold text-slate-500">
              Pending Equipment
            </p>
            <p className="mt-3 text-3xl font-bold text-amber-700">
              {total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold text-slate-500">
              Current Page
            </p>
            <p className="mt-3 text-3xl font-bold">
              {page} / {totalPages}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold text-slate-500">
              Review Queue
            </p>
            <p className="mt-3 text-3xl font-bold text-emerald-800">
              {items.length}
            </p>
          </div>
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

        <section className="rounded-3xl border border-[#e3e8e3] bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Equipment Approval Queue
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Review each submission before it becomes public.
              </p>
            </div>

            <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">
              {total} pending
            </span>
          </div>

          {loading ? (
            <p className="py-14 text-center text-slate-500">
              Loading pending equipment...
            </p>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl">✓</div>
              <h3 className="mt-4 text-xl font-bold">
                All caught up!
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                There is no equipment waiting for approval.
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

                    <div className="min-w-0 p-5 sm:p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase text-amber-800">
                          Pending Review
                        </span>

                        <span className="text-xs text-slate-500">
                          {item.category}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold">
                        {item.name}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                        <div>
                          <p className="text-slate-500">Location</p>
                          <p className="mt-1 font-semibold">
                            {item.location}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Rental Price</p>
                          <p className="mt-1 font-semibold">
                            ৳{Number(priceOf(item)).toLocaleString("en-BD")} / {item.rentalType || "daily"}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Quantity</p>
                          <p className="mt-1 font-semibold">
                            {item.availableQuantity ?? 1}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Condition</p>
                          <p className="mt-1 font-semibold capitalize">
                            {item.condition || "Not specified"}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Submitted</p>
                          <p className="mt-1 font-semibold">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString()
                              : "N/A"}
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
                {page} / {totalPages}
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
          EquipRent Administration · Equipment Review
        </footer>
      </div>
    </main>
  );
}