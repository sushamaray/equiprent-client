
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "N/A";

  return `৳${amount.toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function getToken(signal) {
  const response = await fetch(
    `${API}/api/auth/token`,
    {
      credentials: "include",
      cache: "no-store",
      signal,
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.token) {
    throw new Error("AUTH_REQUIRED");
  }

  return data.token;
}

function HeartIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function LoadingTable() {
  return (
    <div
      aria-label="Loading saved equipment"
      className="space-y-4 p-6 sm:p-8"
    >
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-20 animate-pulse rounded-xl bg-[#edf2ed]"
        />
      ))}
    </div>
  );
}

function AvailabilityBadge({ equipment }) {
  const available =
    equipment?.availability !== false;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold ${
        available
          ? "bg-[#e9f5ed] text-[#176444]"
          : "bg-amber-50 text-amber-800"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          available
            ? "bg-emerald-600"
            : "bg-amber-500"
        }`}
      />
      {available ? "Available" : "Unavailable"}
    </span>
  );
}

export default function CustomerFavoritesPage() {
  const router = useRouter();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFavorites() {
      try {
        const token = await getToken(controller.signal);

        if (controller.signal.aborted) return;

        const response = await fetch(
          `${API}/api/equipment/favorites`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("AUTH_REQUIRED");
          }

          throw new Error(
            data.message ||
              "Unable to load your saved equipment.",
          );
        }

        if (!controller.signal.aborted) {
          setFavorites(
            Array.isArray(data.data) ? data.data : [],
          );
          setError("");
        }
      } catch (cause) {
        if (controller.signal.aborted) return;

        if (cause.message === "AUTH_REQUIRED") {
          router.replace(
            `/sign-in?returnTo=${encodeURIComponent(
              "/dashboard/customer/favorites",
            )}`,
          );
          return;
        }

        setError(
          cause instanceof Error
            ? cause.message
            : "Failed to load favorites.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadFavorites();

    return () => controller.abort();
  }, [refresh, router]);

  async function removeFavorite(equipmentId) {
    if (removingId) return;

    const confirmed = window.confirm(
      "Remove this equipment from your favorites?",
    );

    if (!confirmed) return;

    setRemovingId(equipmentId);
    setError("");
    setMessage("");

    try {
      const token = await getToken();

      const response = await fetch(
        `${API}/api/equipment/favorites/${encodeURIComponent(
          equipmentId,
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not remove equipment from favorites.",
        );
      }

      setFavorites((previous) =>
        previous.filter(
          (item) =>
            String(item.equipmentId) !==
            String(equipmentId),
        ),
      );

      setMessage(
        "Equipment removed from your favorites.",
      );
    } catch (cause) {
      if (cause.message === "AUTH_REQUIRED") {
        router.push(
          `/sign-in?returnTo=${encodeURIComponent(
            "/dashboard/customer/favorites",
          )}`,
        );
        return;
      }

      setError(
        cause instanceof Error
          ? cause.message
          : "Failed to remove favorite.",
      );
    } finally {
      setRemovingId("");
    }
  }

  function reload() {
    setLoading(true);
    setError("");
    setMessage("");
    setRefresh((value) => value + 1);
  }

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

            <Link
              href="/my-rentals"
              className="hover:text-[#174f43]"
            >
              Customer Dashboard
            </Link>

            <span>/</span>

            <span className="font-bold text-[#174f43]">
              My Favorites
            </span>
          </nav>

          {/* PAGE HEADING */}
          <section className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[2.5px] text-[#df704b]">
                Customer Dashboard
              </p>

              <h1 className="mt-4 text-4xl font-extrabold tracking-[-1.5px] sm:text-5xl">
                My Favorites
                <span className="text-[#df704b]">.</span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#728077]">
                Save equipment you like and quickly
                return to its rental details.
              </p>
            </div>

            <Link
              href="/equipment"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#174f43] px-6 text-sm font-bold text-white shadow-[0_7px_18px_rgba(23,79,67,0.14)] transition hover:bg-[#236959]"
            >
              Browse Equipment
              <span aria-hidden="true">↗</span>
            </Link>
          </section>

          {/* CUSTOMER NAVIGATION */}
          <nav
            aria-label="Customer dashboard navigation"
            className="mb-9 flex flex-wrap gap-3"
          >
            <Link
              href="/my-rentals"
              className="rounded-xl border border-[#dce6de] bg-white px-5 py-3 text-xs font-bold text-[#174f43] transition hover:bg-[#edf4ef]"
            >
              My Rentals
            </Link>

            <Link
              href="/dashboard/customer/favorites"
              aria-current="page"
              className="rounded-xl bg-[#174f43] px-5 py-3 text-xs font-bold text-white"
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

          {/* SUMMARY */}
          <section className="mb-9 flex flex-wrap items-center gap-5 rounded-[20px] border border-[#e4ebe5] bg-white p-6 shadow-[0_5px_20px_rgba(20,45,35,0.035)] sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf4ef] text-[#174f43]">
              <HeartIcon size={26} />
            </div>

            <div>
              <p className="text-xs font-semibold text-[#78877d]">
                Saved Equipment
              </p>

              <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#174f43]">
                {loading ? "—" : favorites.length}
              </p>
            </div>

            <p className="w-full text-xs text-[#829087] sm:ml-auto sm:w-auto">
              Your personal equipment shortlist
            </p>
          </section>

          {/* FEEDBACK */}
          {error && (
            <div
              role="alert"
              className="mb-7 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mb-7 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800"
            >
              {message}
            </div>
          )}

          {/* FAVORITES TABLE */}
          <section className="overflow-hidden rounded-[24px] border border-[#e2eae3] bg-white shadow-[0_8px_30px_rgba(20,45,35,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ebf0eb] p-6 sm:p-8">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Saved Equipment
                </h2>

                <p className="mt-2 text-xs text-[#829087]">
                  {loading
                    ? "Loading saved equipment..."
                    : `${favorites.length} saved items`}
                </p>
              </div>

              <button
                type="button"
                onClick={reload}
                disabled={loading || Boolean(removingId)}
                className="rounded-xl border border-[#dce6de] bg-white px-5 py-2.5 text-xs font-bold text-[#174f43] transition hover:bg-[#edf4ef] disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loading ? (
              <LoadingTable />
            ) : error && favorites.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-[#718078]">
                  Unable to display saved equipment.
                </p>

                <button
                  type="button"
                  onClick={reload}
                  className="mt-5 rounded-xl bg-[#174f43] px-6 py-3 text-sm font-bold text-white"
                >
                  Try Again
                </button>
              </div>
            ) : favorites.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4ef] text-[#174f43]">
                  <HeartIcon size={30} />
                </div>

                <h3 className="mt-6 text-xl font-extrabold">
                  No favorites saved yet
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#78877d]">
                  Explore the marketplace and save equipment
                  to keep it here for later.
                </p>

                <Link
                  href="/equipment"
                  className="mt-6 inline-flex rounded-xl bg-[#174f43] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#236959]"
                >
                  Explore Equipment
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-[#f3f7f2] text-[11px] uppercase tracking-[0.6px] text-[#69796e]">
                    <tr>
                      <th className="px-5 py-5">
                        Equipment
                      </th>
                      <th className="px-5 py-5">
                        Category
                      </th>
                      <th className="px-5 py-5">
                        Location
                      </th>
                      <th className="px-5 py-5">
                        Rental Price
                      </th>
                      <th className="px-5 py-5">
                        Availability
                      </th>
                      <th className="px-5 py-5">
                        Saved On
                      </th>
                      <th className="px-5 py-5">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#edf1ed]">
                    {favorites.map((favorite) => {
                      const equipment =
                        favorite.equipment || {};

                      const id = String(
                        favorite.equipmentId,
                      );

                      return (
                        <tr
                          key={String(favorite._id)}
                          className="align-middle transition hover:bg-[#fafcf9]"
                        >
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-4">
                              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-[#edf2ed]">
                                {equipment.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={equipment.image}
                                    alt={equipment.name || "Equipment"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-[10px] text-[#849288]">
                                    No image
                                  </div>
                                )}
                              </div>

                              <p className="max-w-52 font-bold text-[#192321]">
                                {equipment.name ||
                                  "Equipment"}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-5 text-[#56675d]">
                            {equipment.category || "N/A"}
                          </td>

                          <td className="px-5 py-5 text-[#56675d]">
                            {equipment.location || "N/A"}
                          </td>

                          <td className="px-5 py-5">
                            <p className="font-extrabold text-[#174f43]">
                              {formatMoney(
                                equipment.rentalPrice ??
                                  equipment.pricePerDay,
                              )}
                            </p>

                            <p className="mt-1 text-xs capitalize text-[#819086]">
                              / {equipment.rentalType || "daily"}
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <AvailabilityBadge
                              equipment={equipment}
                            />
                          </td>

                          <td className="whitespace-nowrap px-5 py-5 text-[#56675d]">
                            {formatDate(favorite.createdAt)}
                          </td>

                          <td className="px-5 py-5">
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={`/equipment/${encodeURIComponent(id)}`}
                                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#174f43] px-4 text-xs font-bold text-white transition hover:bg-[#236959]"
                              >
                                View Details
                              </Link>

                              <button
                                type="button"
                                disabled={Boolean(removingId)}
                                onClick={() => removeFavorite(id)}
                                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                {removingId === id
                                  ? "Removing..."
                                  : "Remove"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className="mt-6 text-xs leading-6 text-[#829087]">
            Favorites are saved to your account.
            Removing equipment here does not affect
            existing rental bookings.
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