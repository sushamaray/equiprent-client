
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const formatMoney = (amount) =>
  `৳${Number(amount || 0).toLocaleString("en-BD")}`;

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-GB");
}

function formatId(value) {
  if (!value) return "N/A";

  return typeof value === "string"
    ? value
    : value.$oid || String(value);
}

function statusStyle(status) {
  switch (status) {
    case "confirmed":
    case "completed":
    case "paid":
      return "bg-emerald-100 text-emerald-800";

    case "rejected":
    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-800";

    case "pending":
      return "bg-amber-100 text-amber-800";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

async function getToken() {
  const response = await fetch(`${API}/api/auth/token`, {
    credentials: "include",
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.token) {
    throw new Error("Please sign in with your Owner account.");
  }

  return data.token;
}

export default function OwnerRentalsPage() {
  const [bookings, setBookings] = useState([]);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });

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
          `${API}/api/bookings/owner?page=${page}&limit=10`,
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
            data.message || "Failed to load Owner rentals.",
          );
        }

        return data;
      })
      .then((data) => {
        if (controller.signal.aborted) return;

        setBookings(Array.isArray(data.data) ? data.data : []);

        setPagination(
          data.pagination || {
            total: 0,
            totalPages: 0,
          },
        );

        setError("");
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load rentals.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [page, refresh]);

  function reload() {
    setLoading(true);
    setRefresh((value) => value + 1);
  }

  function changePage(nextPage) {
    setLoading(true);
    setPage(nextPage);
  }

  async function updateBooking(booking, action) {
    if (busyId) return;

    const id = formatId(booking._id);

    if (
      action === "reject" &&
      !(
        booking.status === "pending" &&
        booking.paymentStatus === "unpaid"
      )
    ) {
      setError(
        "Only unpaid pending bookings can be rejected. Paid bookings require a refund process.",
      );
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to ${action} this booking?`,
      )
    ) {
      return;
    }

    setBusyId(id);
    setError("");
    setMessage("");

    try {
      const token = await getToken();

      const response = await fetch(
        `${API}/api/bookings/${id}/${action}`,
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
          data.message || `Booking ${action} failed.`,
        );
      }

      setMessage(
        `Booking successfully ${
          action === "confirm" ? "confirmed" : "rejected"
        }.`,
      );

      if (bookings.length === 1 && page > 1) {
        changePage(page - 1);
      } else {
        reload();
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Booking update failed.",
      );
    } finally {
      setBusyId(null);
    }
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
            href="/dashboard/owner"
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold"
          >
            Owner Dashboard
          </Link>
        </header>

        <section className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[2px] text-[#d97752]">
            OWNER DASHBOARD
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            My Equipment Rentals
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Monitor bookings, customer rental information,
            payments, and booking statuses.
          </p>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Total Rentals
            </p>

            <h2 className="mt-3 text-3xl font-bold text-[#174f43]">
              {pagination.total}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Bookings on This Page
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {bookings.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Paid Bookings on This Page
            </p>

            <h2 className="mt-3 text-3xl font-bold text-emerald-800">
              {
                bookings.filter(
                  (booking) => booking.paymentStatus === "paid",
                ).length
              }
            </h2>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}

            <div className="mt-3">
              <Link
                href="/sign-in?returnTo=/dashboard/owner/rentals"
                className="font-semibold underline"
              >
                Sign in as Owner
              </Link>
            </div>
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

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-6">
            <div>
              <h2 className="text-xl font-bold">
                Rental Bookings
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                Only bookings belonging to your equipment
              </p>
            </div>

            <button
              type="button"
              onClick={reload}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="py-16 text-center text-slate-500">
              Loading rental bookings...
            </p>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center">
              <h3 className="text-xl font-bold">
                No rental bookings found
              </h3>

              <p className="mt-3 text-sm text-slate-500">
                Bookings will appear here when customers rent
                your equipment.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-[#f5f7f4] text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Equipment</th>
                    <th className="px-5 py-4">Rental Duration</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Booking</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {bookings.map((booking) => {
                    const id = formatId(booking._id);

                    const canConfirm =
                      booking.status === "pending";

                    const canReject =
                      booking.status === "pending" &&
                      booking.paymentStatus === "unpaid";

                    return (
                      <tr key={id} className="align-top hover:bg-slate-50">
                        <td className="px-5 py-5">
                          <p className="font-semibold">
                            {booking.customerName || "Customer"}
                          </p>

                          <p className="mt-1 break-all text-xs text-slate-500">
                            ID: {formatId(booking.customerId)}
                          </p>

                          {booking.contactNumber && (
                            <p className="mt-2 text-xs text-slate-600">
                              {booking.contactNumber}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-semibold">
                            {booking.equipmentName || "Equipment"}
                          </p>

                          <p className="mt-1 break-all text-xs text-slate-500">
                            ID: {formatId(booking.equipmentId)}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-semibold">
                            {formatDate(booking.startDate)}
                          </p>

                          <p className="my-1 text-xs text-slate-400">
                            to
                          </p>

                          <p className="font-semibold">
                            {formatDate(booking.endDate)}
                          </p>

                          <p className="mt-2 text-xs text-slate-500">
                            {booking.rentalDays ?? "N/A"} days
                          </p>
                        </td>

                        <td className="px-5 py-5 font-semibold">
                          {booking.quantity ?? 1}
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-bold text-[#174f43]">
                            {formatMoney(booking.totalPrice)}
                          </p>

                          <p className="mt-2 text-xs text-slate-500">
                            Booked {formatDate(booking.createdAt)}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle(booking.paymentStatus)}`}
                          >
                            {booking.paymentStatus || "unknown"}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle(booking.status)}`}
                          >
                            {booking.status || "unknown"}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex flex-col gap-2">
                            {canConfirm && (
                              <button
                                type="button"
                                disabled={Boolean(busyId)}
                                onClick={() =>
                                  updateBooking(booking, "confirm")
                                }
                                className="rounded-lg bg-[#174f43] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                {busyId === id
                                  ? "Processing..."
                                  : "Confirm"}
                              </button>
                            )}

                            {canReject && (
                              <button
                                type="button"
                                disabled={Boolean(busyId)}
                                onClick={() =>
                                  updateBooking(booking, "reject")
                                }
                                className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            )}

                            {!canConfirm && (
                              <span className="text-xs text-slate-400">
                                No actions
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 border-t border-slate-100 p-6">
              <button
                type="button"
                disabled={page <= 1 || Boolean(busyId)}
                onClick={() => changePage(page - 1)}
                className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-slate-600">
                Page {page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={
                  page >= pagination.totalPages ||
                  Boolean(busyId)
                }
                onClick={() => changePage(page + 1)}
                className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-slate-200 py-8 text-center text-xs text-slate-500">
          EquipRent · Owner Rental Management
        </footer>
      </div>
    </main>
  );
}