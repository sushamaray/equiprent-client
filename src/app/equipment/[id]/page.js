
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BookingModal from "@/components/BookingModal";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

function Icon({ name, size = 20 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "arrow") {
    return (
      <svg {...props}>
        <path d="M7 17 17 7M8 7h9v9" />
      </svg>
    );
  }

  if (name === "location") {
    return (
      <svg {...props}>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg {...props}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg {...props}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    );
  }

  if (name === "document") {
    return (
      <svg {...props}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...props}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </svg>
    );
  }

  return null;
}

async function getAuthToken(signal) {
  const response = await fetch(`${API}/api/auth/token`, {
    credentials: "include",
    cache: "no-store",
    signal,
  });

  const data = await response.json().catch(() => ({}));

  return response.ok && data.token ? data.token : null;
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf1ed] py-4 last:border-b-0">
      <dt className="text-sm text-[#718078]">
        {label}
      </dt>

      <dd className="max-w-[65%] text-right text-sm font-bold capitalize text-[#192321]">
        {value || "Not specified"}
      </dd>
    </div>
  );
}

function LoadingDetails() {
  return (
    <div className="grid animate-pulse gap-7 lg:grid-cols-2">
      <div className="min-h-[380px] rounded-3xl bg-[#e8eee9] lg:min-h-[580px]" />

      <div className="space-y-6 rounded-3xl bg-white p-8">
        <div className="h-4 w-32 rounded bg-[#e8eee9]" />
        <div className="h-10 w-3/4 rounded bg-[#e8eee9]" />
        <div className="h-4 w-full rounded bg-[#e8eee9]" />
        <div className="h-4 w-2/3 rounded bg-[#e8eee9]" />
        <div className="h-20 rounded-xl bg-[#e8eee9]" />
        <div className="h-12 rounded-xl bg-[#e8eee9]" />
      </div>
    </div>
  );
}

export default function EquipmentDetails() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [equipment, setEquipment] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [token, setToken] = useState(null);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteReady, setFavoriteReady] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const returnPath = `/equipment/${id}`;

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    async function loadDetails() {
      try {
        const jwt = await getAuthToken(controller.signal);

        if (controller.signal.aborted) return;

        if (!jwt) {
          router.replace(
            `/sign-in?returnTo=${encodeURIComponent(
              `/equipment/${id}`,
            )}`,
          );
          return;
        }

        setToken(jwt);

        const response = await fetch(
          `${API}/api/equipment/${encodeURIComponent(id)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Equipment could not be found.",
          );
        }

        const item = data.equipment || data.data;

        if (!item) {
          throw new Error(
            "Equipment information is unavailable.",
          );
        }

        if (!controller.signal.aborted) {
          setEquipment(item);
          setError("");
        }

        try {
          const favoritesResponse = await fetch(
            `${API}/api/equipment/favorites`,
            {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
              cache: "no-store",
              signal: controller.signal,
            },
          );

          const favoriteData = await favoritesResponse
            .json()
            .catch(() => ({}));

          if (favoritesResponse.ok) {
            const favorites = Array.isArray(
              favoriteData.data,
            )
              ? favoriteData.data
              : [];

            const saved = favorites.some(
              (favorite) =>
                String(
                  favorite.equipmentId?._id ??
                    favorite.equipmentId ??
                    favorite.equipment?._id ??
                    "",
                ) === String(id),
            );

            if (!controller.signal.aborted) {
              setIsFavorite(saved);
            }
          }
        } catch (favoriteError) {
          if (favoriteError?.name === "AbortError") {
            return;
          }
        } finally {
          if (!controller.signal.aborted) {
            setFavoriteReady(true);
          }
        }
      } catch (cause) {
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load equipment.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => controller.abort();
  }, [id, router]);

  async function toggleFavorite() {
    if (!equipment || saving || !favoriteReady) {
      return;
    }

    if (!token) {
      router.push(
        `/sign-in?returnTo=${encodeURIComponent(
          returnPath,
        )}`,
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const equipmentId = String(equipment._id);

      const response = await fetch(
        isFavorite
          ? `${API}/api/equipment/favorites/${encodeURIComponent(
              equipmentId,
            )}`
          : `${API}/api/equipment/favorites`,
        {
          method: isFavorite ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(!isFavorite
              ? {
                  "Content-Type": "application/json",
                }
              : {}),
          },
          ...(!isFavorite
            ? {
                body: JSON.stringify({
                  equipmentId,
                }),
              }
            : {}),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not update favorites.",
        );
      }

      setIsFavorite((previous) => !previous);

      setMessage(
        isFavorite
          ? "Equipment removed from your favorites."
          : "Equipment added to your favorites!",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Failed to update favorites.",
      );
    } finally {
      setSaving(false);
    }
  }

  const available =
    equipment?.availability !== false &&
    Number(equipment?.availableQuantity ?? 1) > 0;

  const ownerName =
    equipment?.ownerName ||
    equipment?.owner?.name ||
    equipment?.ownerInfo?.name ||
    "";

  const ownerEmail =
    equipment?.ownerEmail ||
    equipment?.owner?.email ||
    equipment?.ownerInfo?.email ||
    "";

  const ownerPhone =
    equipment?.ownerPhone ||
    equipment?.owner?.phone ||
    equipment?.ownerInfo?.phone ||
    "";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f7f8f5] text-[#192321]">
        <div className="mx-auto max-w-7xl px-5 pb-24 pt-9 sm:px-7 lg:px-10">
          {/* BREADCRUMB */}
          <nav
            aria-label="Breadcrumb"
            className="mb-9 flex flex-wrap items-center gap-2 text-xs text-[#77857b]"
          >
            <Link
              href="/"
              className="hover:text-[#174f43]"
            >
              Home
            </Link>

            <span>/</span>

            <Link
              href="/equipment"
              className="hover:text-[#174f43]"
            >
              All Equipment
            </Link>

            <span>/</span>

            <span className="font-semibold text-[#174f43]">
              {equipment?.name || "Equipment Details"}
            </span>
          </nav>

          {/* PAGE HEADING */}
          <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[2px] text-[#df704b]">
                Equipment Marketplace
              </p>

              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Equipment Details
                <span className="text-[#df704b]">
                  .
                </span>
              </h1>

              <p className="mt-3 text-sm text-[#708077]">
                Explore equipment specifications and
                rental information.
              </p>
            </div>

            <Link
              href="/equipment"
              className="inline-flex items-center gap-2 rounded-xl border border-[#dce6dd] bg-white px-5 py-3 text-sm font-bold text-[#174f43] transition hover:bg-[#edf4ef]"
            >
              ← Back to Equipment
            </Link>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800"
            >
              {message}
            </div>
          )}

          {loading ? (
            <LoadingDetails />
          ) : equipment ? (
            <>
              {/* MAIN EQUIPMENT CARD */}
              <article className="grid overflow-hidden rounded-[26px] border border-[#e2eae3] bg-white shadow-[0_10px_40px_rgba(20,45,35,0.05)] lg:grid-cols-2">
                <div className="relative min-h-[330px] bg-[#eef1ec] sm:min-h-[450px] lg:min-h-[590px]">
                  {equipment.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={equipment.image}
                      alt={equipment.name}
                      className="absolute inset-0 h-full w-full object-contain p-6 sm:p-10"
                    />
                  ) : (
                    <div className="flex h-full min-h-[330px] items-center justify-center text-sm text-[#849489]">
                      Equipment image unavailable
                    </div>
                  )}

                  <span
                    className={`absolute left-5 top-5 rounded-full bg-white px-4 py-2 text-xs font-bold shadow-sm ${
                      available
                        ? "text-[#174f43]"
                        : "text-red-700"
                    }`}
                  >
                    {available
                      ? "● Available"
                      : "● Currently Unavailable"}
                  </span>
                </div>

                <div className="flex flex-col p-6 sm:p-9 lg:p-10">
                  <p className="text-xs font-extrabold uppercase tracking-[1.7px] text-[#df704b]">
                    {equipment.category ||
                      "Equipment"}
                  </p>

                  <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                    {equipment.name}
                  </h2>

                  <div className="mt-4 flex items-center gap-2 text-sm text-[#718078]">
                    <Icon name="location" size={17} />
                    <span>
                      {equipment.location ||
                        "Location not specified"}
                    </span>
                  </div>

                  <p className="mt-6 whitespace-pre-line text-sm leading-8 text-[#637268]">
                    {equipment.description ||
                      "No description provided."}
                  </p>

                  {/* PRICE */}
                  <div className="my-8 rounded-2xl border border-[#e2ebe3] bg-[#f4f8f4] p-6">
                    <p className="text-xs font-semibold text-[#78877c]">
                      Rental Price
                    </p>

                    <div className="mt-2 flex flex-wrap items-end gap-2">
                      <span className="text-3xl font-extrabold tracking-tight text-[#174f43]">
                        {money(
                          equipment.rentalPrice ??
                            equipment.pricePerDay,
                        )}
                      </span>

                      <span className="pb-1 text-sm capitalize text-[#718078]">
                        / {equipment.rentalType || "daily"}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold">
                    Equipment Specifications
                  </h3>

                  <dl className="mt-3">
                    <InfoRow
                      label="Category"
                      value={equipment.category}
                    />

                    <InfoRow
                      label="Rental Type"
                      value={equipment.rentalType || "daily"}
                    />

                    <InfoRow
                      label="Available Quantity"
                      value={String(
                        equipment.availableQuantity ?? 1,
                      )}
                    />

                    <InfoRow
                      label="Brand"
                      value={equipment.brand}
                    />

                    <InfoRow
                      label="Model"
                      value={equipment.model}
                    />

                    <InfoRow
                      label="Condition"
                      value={equipment.condition}
                    />
                  </dl>

                  {/* MAIN ACTIONS */}
                  <div className="mt-auto pt-8">
                    <button
                      type="button"
                      onClick={() => setBookingOpen(true)}
                      disabled={!available}
                      className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#174f43] px-6 py-4 text-sm font-bold text-white shadow-[0_7px_18px_rgba(23,79,67,0.15)] transition hover:bg-[#236959] disabled:cursor-not-allowed disabled:bg-[#aab6ad]"
                    >
                      <Icon name="calendar" size={19} />

                      {available
                        ? "Book This Equipment"
                        : "Currently Unavailable"}

                      {available && (
                        <Icon name="arrow" size={16} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={toggleFavorite}
                      disabled={saving || !favoriteReady}
                      aria-pressed={isFavorite}
                      className={`mt-3 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border px-6 py-4 text-sm font-bold transition disabled:opacity-50 ${
                        isFavorite
                          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border-[#dce6de] bg-white text-[#174f43] hover:border-[#174f43] hover:bg-[#eff5f0]"
                      }`}
                    >
                      <Icon name="heart" size={19} />

                      {saving
                        ? "Updating Favorites..."
                        : !favoriteReady
                          ? "Checking Favorites..."
                          : isFavorite
                            ? "Remove from Favorites"
                            : "Add to Favorites"}
                    </button>

                    <p className="mt-5 text-center text-xs leading-6 text-[#819086]">
                      Rental availability and pricing are
                      verified before secure Stripe Checkout.
                    </p>
                  </div>
                </div>
              </article>

              {/* OWNER AND RENTAL TERMS */}
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <section className="rounded-[22px] border border-[#e2eae3] bg-white p-6 shadow-sm sm:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf2ec] text-[#174f43]">
                      <Icon name="user" size={23} />
                    </span>

                    <div>
                      <h3 className="text-xl font-extrabold">
                        Owner Information
                      </h3>

                      <p className="mt-1 text-xs text-[#819086]">
                        Equipment listing owner
                      </p>
                    </div>
                  </div>

                  {ownerName ||
                  ownerEmail ||
                  ownerPhone ? (
                    <dl>
                      {ownerName && (
                        <InfoRow
                          label="Owner Name"
                          value={ownerName}
                        />
                      )}

                      {ownerEmail && (
                        <InfoRow
                          label="Email"
                          value={ownerEmail}
                        />
                      )}

                      {ownerPhone && (
                        <InfoRow
                          label="Contact Number"
                          value={ownerPhone}
                        />
                      )}
                    </dl>
                  ) : (
                    <p className="rounded-xl bg-[#f4f8f4] p-5 text-sm leading-7 text-[#718078]">
                      Owner information is not
                      available for this listing yet.
                    </p>
                  )}
                </section>

                <section className="rounded-[22px] border border-[#e2eae3] bg-white p-6 shadow-sm sm:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf2ec] text-[#174f43]">
                      <Icon name="document" size={23} />
                    </span>

                    <div>
                      <h3 className="text-xl font-extrabold">
                        Rental Terms
                      </h3>

                      <p className="mt-1 text-xs text-[#819086]">
                        Conditions for renting this equipment
                      </p>
                    </div>
                  </div>

                  {equipment.rentalTerms ? (
                    <p className="whitespace-pre-line text-sm leading-8 text-[#637268]">
                      {equipment.rentalTerms}
                    </p>
                  ) : (
                    <p className="text-sm leading-8 text-[#637268]">
                      Equipment-specific rental terms have
                      not been provided by the owner.
                    </p>
                  )}

                  <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#f4f8f4] p-4 text-[#174f43]">
                    <Icon name="check" size={19} />

                    <p className="text-xs leading-6">
                      Rental dates, quantity and total
                      price are checked during booking.
                    </p>
                  </div>
                </section>
              </div>

              {/* SECONDARY NAVIGATION */}
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/equipment"
                  className="rounded-xl border border-[#dce6de] bg-white px-6 py-3 text-sm font-bold text-[#174f43] transition hover:bg-[#edf4ef]"
                >
                  ← Explore More Equipment
                </Link>

                <Link
                  href="/dashboard/customer/favorites"
                  className="rounded-xl border border-[#dce6de] bg-white px-6 py-3 text-sm font-bold text-[#174f43] transition hover:bg-[#edf4ef]"
                >
                  My Favorites
                </Link>
              </div>
            </>
          ) : !error ? (
            <div className="rounded-3xl bg-white p-12 text-center">
              Equipment not found.
            </div>
          ) : null}
        </div>
      </main>

      <BookingModal
        equipment={bookingOpen ? equipment : null}
        onClose={() => setBookingOpen(false)}
      />
    </>
  );
}