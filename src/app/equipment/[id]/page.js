
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BookingModal from "@/components/BookingModal";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const formatMoney = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

async function getCustomerToken(signal) {
  const response = await fetch(`${API}/api/auth/token`, {
    credentials: "include",
    cache: "no-store",
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.token) {
    throw new Error(
      "Please sign in as a Customer to use favorites.",
    );
  }

  return data.token;
}

export default function EquipmentDetails() {
  const { id } = useParams();

  const [equipment, setEquipment] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteReady, setFavoriteReady] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    fetch(`${API}/api/equipment/${encodeURIComponent(id)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Equipment could not be found.",
          );
        }

        return data.equipment || data.data;
      })
      .then((item) => {
        if (controller.signal.aborted) return;

        if (!item) {
          throw new Error("Equipment data is unavailable.");
        }

        setEquipment(item);
        setError("");
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load equipment.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    getCustomerToken(controller.signal)
      .then(async (token) => {
        const response = await fetch(
          `${API}/api/equipment/favorites`,
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
            data.message || "Unable to check favorites.",
          );
        }

        return data.data;
      })
      .then((favorites) => {
        if (controller.signal.aborted) return;

        const saved =
          Array.isArray(favorites) &&
          favorites.some(
            (item) =>
              String(item.equipmentId) === String(id),
          );

        setIsFavorite(saved);
      })
      .catch(() => {
        // Visitors may browse equipment without signing in.
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setFavoriteReady(true);
        }
      });

    return () => controller.abort();
  }, [id]);

  async function toggleFavorite() {
    if (!equipment || saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const token = await getCustomerToken();
      const equipmentId = String(equipment._id);

      const response = await fetch(
        isFavorite
          ? `${API}/api/equipment/favorites/${encodeURIComponent(equipmentId)}`
          : `${API}/api/equipment/favorites`,
        {
          method: isFavorite ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(isFavorite
              ? {}
              : { "Content-Type": "application/json" }),
          },
          ...(isFavorite
            ? {}
            : {
                body: JSON.stringify({
                  equipmentId,
                }),
              }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Could not update favorites.",
        );
      }

      setIsFavorite((previous) => !previous);
      setMessage(
        isFavorite
          ? "Equipment removed from your favorites."
          : "Equipment saved to your favorites!",
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

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 text-[#192321] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#e3e8e3] pb-6">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-[#174f43]"
          >
            EquipRent<span className="text-[#df704b]">.</span>
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/equipment"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold"
            >
              All Equipment
            </Link>

            <Link
              href="/dashboard/customer/favorites"
              className="rounded-full bg-[#174f43] px-5 py-2 text-sm font-semibold text-white"
            >
              My Favorites
            </Link>
          </div>
        </header>

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

        {loading ? (
          <div className="rounded-3xl bg-white p-16 text-center text-slate-500">
            Loading equipment details...
          </div>
        ) : equipment ? (
          <article className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-2">
            <div className="min-h-80 bg-slate-100 lg:min-h-[550px]">
              {equipment.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={equipment.image}
                  alt={equipment.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-80 items-center justify-center text-slate-400">
                  Equipment image unavailable
                </div>
              )}
            </div>

            <div className="p-6 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[2px] text-[#d97752]">
                {equipment.category} · {equipment.location}
              </p>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {equipment.name}
              </h1>

              <p className="mt-5 text-sm leading-7 text-slate-600">
                {equipment.description}
              </p>

              <div className="my-8 border-y border-slate-100 py-6">
                <span className="text-3xl font-extrabold text-[#174f43]">
                  {formatMoney(
                    equipment.rentalPrice ??
                      equipment.pricePerDay,
                  )}
                </span>

                <span className="ml-2 text-sm text-slate-500">
                  / {equipment.rentalType || "daily"}
                </span>
              </div>

              <h2 className="mb-4 text-lg font-bold">
                Equipment Information
              </h2>

              <dl className="space-y-4 text-sm">
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">
                    Rental Period
                  </dt>
                  <dd className="font-semibold">
                    {equipment.rentalType || "daily"}
                  </dd>
                </div>

                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">
                    Available Quantity
                  </dt>
                  <dd className="font-semibold">
                    {equipment.availableQuantity ?? 1}
                  </dd>
                </div>

                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">
                    Brand / Model
                  </dt>
                  <dd className="text-right font-semibold">
                    {[equipment.brand, equipment.model]
                      .filter(Boolean)
                      .join(" · ") || "Not specified"}
                  </dd>
                </div>

                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">
                    Condition
                  </dt>
                  <dd className="font-semibold">
                    {equipment.condition || "Not specified"}
                  </dd>
                </div>

                <div className="border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">
                    Rental Terms
                  </dt>
                  <dd className="mt-2 leading-6 font-medium">
                    {equipment.rentalTerms ||
                      "Confirm rental dates and details before checkout."}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setBookingOpen(true)}
                  disabled={
                    !equipment.availability ||
                    Number(equipment.availableQuantity ?? 1) < 1
                  }
                  className="flex-1 rounded-xl bg-[#174f43] px-6 py-4 text-center text-sm font-bold text-white hover:bg-[#236959] disabled:opacity-50"
                >
                  {equipment.availability
                    ? "Book This Equipment"
                    : "Currently Unavailable"}
                </button>

                <button
                  type="button"
                  onClick={toggleFavorite}
                  disabled={saving || !favoriteReady}
                  aria-pressed={isFavorite}
                  className={`flex-1 rounded-xl border px-6 py-4 text-sm font-bold transition disabled:opacity-50 ${
                    isFavorite
                      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      : "border-[#174f43] text-[#174f43] hover:bg-emerald-50"
                  }`}
                >
                  {saving
                    ? "Updating..."
                    : !favoriteReady
                      ? "Checking Favorites..."
                      : isFavorite
                        ? "♥ Remove from Favorites"
                        : "♡ Add to Favorites"}
                </button>
              </div>

              <p className="mt-5 text-xs leading-5 text-slate-500">
                Rental availability and final pricing are
                verified before Stripe Checkout.
              </p>
            </div>
          </article>
        ) : !error ? (
          <p className="rounded-2xl bg-white p-12 text-center">
            Equipment not found.
          </p>
        ) : null}
      </div>

      <BookingModal
        equipment={bookingOpen ? equipment : null}
        onClose={() => setBookingOpen(false)}
      />
    </main>
  );
}