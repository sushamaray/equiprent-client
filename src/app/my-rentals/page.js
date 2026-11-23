
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function money(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "N/A";

  return `৳${amount.toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function StatusBadge({ value, type = "booking" }) {
  const status = String(value || "unknown").toLowerCase();

  const positive = [
    "paid",
    "confirmed",
    "completed",
    "successful",
  ];

  const negative = [
    "failed",
    "cancelled",
    "canceled",
    "rejected",
    "refunded",
  ];

  const style = positive.includes(status)
    ? "bg-[#e9f5ed] text-[#176444]"
    : negative.includes(status)
      ? "bg-red-50 text-red-700"
      : "bg-amber-50 text-amber-800";

  const text =
    status === "unknown"
      ? "Not Available"
      : status.replaceAll("_", " ");

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold capitalize ${style}`}
      aria-label={`${type} status: ${text}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          positive.includes(status)
            ? "bg-emerald-600"
            : negative.includes(status)
              ? "bg-red-500"
              : "bg-amber-500"
        }`}
      />

      {text}
    </span>
  );
}

function SummaryCard({ label, value, description }) {
  return (
    <div className="rounded-[20px] border border-[#e4ebe5] bg-white p-6 shadow-[0_5px_20px_rgba(20,45,35,0.035)]">
      <p className="text-xs font-semibold text-[#78877d]">
        {label}
      </p>

      <p className="mt-4 text-3xl font-extrabold tracking-tight text-[#174f43]">
        {value}
      </p>

      <p className="mt-2 text-xs text-[#829087]">
        {description}
      </p>
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="space-y-4 p-6 sm:p-8">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-16 animate-pulse rounded-xl bg-[#edf2ed]"
        />
      ))}
    </div>
  );
}

function equipmentIdOf(booking) {
  const id =
    booking.equipmentId?._id ??
    booking.equipmentId ??
    booking.equipment?._id;

  return typeof id === "string" ? id : null;
}

function bookingEquipmentName(booking) {
  return (
    booking.equipmentName ||
    booking.equipment?.name ||
    booking.equipmentDetails?.name ||
    ""
  );
}

export default function MyRentals() {
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [equipmentNames, setEquipmentNames] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRentals() {
      try {
        const authResponse = await fetch(
          `${API}/api/auth/token`,
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const auth = await authResponse
          .json()
          .catch(() => ({}));

        if (!authResponse.ok || !auth.token) {
          router.replace(
            `/sign-in?returnTo=${encodeURIComponent(
              "/my-rentals",
            )}`,
          );
          return;
        }

        const response = await fetch(
          `${API}/api/bookings/my`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load your rentals.",
          );
        }

        const records = Array.isArray(data.data)
          ? data.data
          : [];

        if (controller.signal.aborted) return;

        setBookings(records);
        setError("");

        // Some older bookings may not include equipmentName.
        // Look up approved equipment names when available.
        const missingIds = [
          ...new Set(
            records
              .filter((booking) => !bookingEquipmentName(booking))
              .map(equipmentIdOf)
              .filter(Boolean),
          ),
        ];

        if (missingIds.length > 0) {
          const results = await Promise.all(
            missingIds.map(async (id) => {
              try {
                const equipmentResponse = await fetch(
                  `${API}/api/equipment/${encodeURIComponent(id)}`,
                  {
                    cache: "no-store",
                    signal: controller.signal,
                  },
                );

                if (!equipmentResponse.ok) {
                  return [id, null];
                }

                const equipmentData = await equipmentResponse
                  .json()
                  .catch(() => ({}));

                const equipment =
                  equipmentData.equipment || equipmentData.data;

                return [
                  id,
                  typeof equipment?.name === "string"
                    ? equipment.name
                    : null,
                ];
              } catch {
                return [id, null];
              }
            }),
          );

          if (!controller.signal.aborted) {
            setEquipmentNames(
              Object.fromEntries(
                results.filter(([, name]) => Boolean(name)),
              ),
            );
          }
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Failed to load rentals.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadRentals();

    return () => controller.abort();
  }, [router, refresh]);

  function reload() {
    setLoading(true);
    setError("");
    setRefresh((value) => value + 1);
  }

  const totalBookings = bookings.length;

  const paidBookings = bookings.filter(
    (booking) =>
      String(booking.paymentStatus || "").toLowerCase() ===
      "paid",
  ).length;

  const confirmedBookings = bookings.filter((booking) =>
    ["confirmed", "completed"].includes(
      String(booking.status || "").toLowerCase(),
    ),
  ).length;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f7f8f5] text-[#192321]">
        <div className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-7 lg:px-10">
          {/* BREADCRUMB */}
          <nav
            aria-label="Breadcrumb"
            className="mb-10 flex flex-wrap items-center gap-2 text-xs text-[#77857b]"
          >
            <Link
              href="/"
              className="hover:text-[#174f43]"
            >
              Home
            </Link>

            <span>/</span>

            <span className="font-semibold text-[#174f43]">
              My Rentals
            </span>
          </nav>

          {/* PAGE HEADING */}
          <section className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[2.5px] text-[#df704b]">
                Customer Dashboard
              </p>

              <h1 className="mt-4 text-4xl font-extrabold tracking-[-1.5px] sm:text-5xl">
                My Rentals
                <span className="text-[#df704b]">.</span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#728077]">
                Track your equipment bookings, rental dates,
                payment status and fulfillment progress.
              </p>
            </div>

            <Link
              href="/equipment"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#174f43] px-6 text-sm font-bold text-white shadow-[0_7px_18px_rgba(23,79,67,0.14)] transition hover:bg-[#236959]"
            >
              Explore Equipment
              <span aria-hidden="true">↗</span>
            </Link>
          </section>

          {/* DASHBOARD NAVIGATION */}
          <nav
            aria-label="Customer dashboard navigation"
            className="mb-9 flex flex-wrap gap-3"
          >
            <Link
              href="/my-rentals"
              aria-current="page"
              className="rounded-xl bg-[#174f43] px-5 py-3 text-xs font-bold text-white"
            >
              My Rentals
            </Link>

            <Link
              href="/dashboard/customer/favorites"
              className="rounded-xl border border-[#dce6de] bg-white px-5 py-3 text-xs font-bold text-[#174f43] transition hover:bg-[#edf4ef]"
            >
              My Favorites
            </Link>

            <Link
              href="/dashboard/profile"
              className="rounded-xl border border-[#dce6de] bg-white px-5 py-3 text-xs font-bold text-[#174f43] transition hover:bg-[#edf4ef]"
            >
              My Profile
            </Link>
          </nav>

          {/* SUMMARY CARDS */}
          <div className="mb-9 grid gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Total Rentals"
              value={loading ? "—" : totalBookings}
              description="Bookings returned by your account"
            />

            <SummaryCard
              label="Paid Bookings"
              value={loading ? "—" : paidBookings}
              description="Payments marked as paid"
            />

            <SummaryCard
              label="Confirmed / Completed"
              value={loading ? "—" : confirmedBookings}
              description="Bookings with confirmed progress"
            />
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div
              role="alert"
              className="mb-7 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* RENTALS TABLE */}
          <section className="overflow-hidden rounded-[24px] border border-[#e2eae3] bg-white shadow-[0_8px_30px_rgba(20,45,35,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ebf0eb] p-6 sm:p-8">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Rental History
                </h2>

                <p className="mt-2 text-xs text-[#829087]">
                  {loading
                    ? "Loading your booking records..."
                    : `${totalBookings} booking records`}
                </p>
              </div>

              <button
                type="button"
                onClick={reload}
                disabled={loading}
                className="rounded-xl border border-[#dce6de] bg-white px-5 py-2.5 text-xs font-bold text-[#174f43] transition hover:bg-[#edf4ef] disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loading ? (
              <LoadingTable />
            ) : error ? (
              <div className="px-6 py-14 text-center">
                <p className="text-sm text-[#738177]">
                  Unable to display rental records.
                </p>

                <button
                  type="button"
                  onClick={reload}
                  className="mt-5 rounded-xl bg-[#174f43] px-6 py-3 text-sm font-bold text-white"
                >
                  Try Again
                </button>
              </div>
            ) : bookings.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4ef] text-3xl text-[#174f43]">
                  ◇
                </div>

                <h3 className="mt-6 text-xl font-extrabold">
                  No rentals yet
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#78877d]">
                  You have not made any rental bookings yet.
                  Explore equipment to get started.
                </p>

                <Link
                  href="/equipment"
                  className="mt-6 inline-flex rounded-xl bg-[#174f43] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#236959]"
                >
                  Browse Equipment
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px] text-left text-sm">
                  <thead className="bg-[#f3f7f2] text-[11px] uppercase tracking-[0.6px] text-[#69796e]">
                    <tr>
                      <th className="px-5 py-5">
                        Equipment Name
                      </th>

                      <th className="px-5 py-5">
                        Start Date
                      </th>

                      <th className="px-5 py-5">
                        End Date
                      </th>

                      <th className="px-5 py-5">
                        Booking Date
                      </th>

                      <th className="px-5 py-5">
                        Total Amount
                      </th>

                      <th className="px-5 py-5">
                        Payment Status
                      </th>

                      <th className="px-5 py-5">
                        Booking Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#edf1ed]">
                    {bookings.map((booking) => {
                      const equipmentId =
                        equipmentIdOf(booking);

                      const equipmentName =
                        bookingEquipmentName(booking) ||
                        equipmentNames[equipmentId] ||
                        "Equipment name unavailable";

                      return (
                        <tr
                          key={String(booking._id)}
                          className="align-middle transition hover:bg-[#fafcf9]"
                        >
                          <td className="px-5 py-6">
                            {equipmentId ? (
                              <Link
                                href={`/equipment/${equipmentId}`}
                                className="font-bold text-[#192321] transition hover:text-[#174f43] hover:underline"
                              >
                                {equipmentName}
                              </Link>
                            ) : (
                              <span className="font-bold text-[#192321]">
                                {equipmentName}
                              </span>
                            )}

                            <p className="mt-2 text-[11px] text-[#819086]">
                              Booking #
                              {String(booking._id)
                                .slice(-8)
                                .toUpperCase()}
                            </p>

                            <p className="mt-1 text-xs text-[#718078]">
                              {Number(booking.quantity || 1)}{" "}
                              unit
                              {Number(booking.quantity || 1) === 1
                                ? ""
                                : "s"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-6 text-[#56675d]">
                            {formatDate(booking.startDate)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-6 text-[#56675d]">
                            {formatDate(booking.endDate)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-6 text-[#56675d]">
                            {formatDate(
                              booking.createdAt ??
                                booking.bookingDate,
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-6 font-extrabold text-[#174f43]">
                            {money(booking.totalPrice)}
                          </td>

                          <td className="px-5 py-6">
                            <StatusBadge
                              value={booking.paymentStatus}
                              type="Payment"
                            />
                          </td>

                          <td className="px-5 py-6">
                            <StatusBadge
                              value={booking.status}
                              type="Booking"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* BOTTOM NOTE */}
          <p className="mt-6 text-xs leading-6 text-[#829087]">
            Booking status is managed separately from payment
            status. A paid rental may still be awaiting owner
            confirmation.
          </p>
        </div>

        <footer className="border-t border-[#e3e9e3] bg-white px-5 py-8 text-center text-xs text-[#78877c]">
          © {new Date().getFullYear()} EquipRent.
          Equipment rental, made practical.
        </footer>
      </main>
    </>
  );
}