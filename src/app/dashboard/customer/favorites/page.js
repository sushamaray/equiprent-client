
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const formatMoney = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

async function getToken(signal) {
  const response = await fetch(`${API}/api/auth/token`, {
    credentials: "include",
    cache: "no-store",
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.token) {
    throw new Error("Please sign in with your Customer account.");
  }

  return data.token;
}

export default function CustomerFavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getToken(controller.signal)
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
            data.message || "Failed to load favorites.",
          );
        }

        return data.data;
      })
      .then((items) => {
        if (controller.signal.aborted) return;

        setFavorites(Array.isArray(items) ? items : []);
        setError("");
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;

        setError(cause.message || "Could not load favorites.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [refresh]);

  async function removeFavorite(equipmentId) {
    if (removingId) return;

    setRemovingId(equipmentId);
    setError("");
    setMessage("");

    try {
      const token = await getToken();

      const response = await fetch(
        `${API}/api/equipment/favorites/${encodeURIComponent(equipmentId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Could not remove favorite.",
        );
      }

      setFavorites((previous) =>
        previous.filter(
          (item) => String(item.equipmentId) !== equipmentId,
        ),
      );

      setMessage("Equipment removed from your favorites.");
    } catch (cause) {
      setError(cause.message || "Failed to remove favorite.");
    } finally {
      setRemovingId("");
    }
  }

  function reload() {
    setLoading(true);
    setMessage("");
    setRefresh((value) => value + 1);
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

          <div className="flex flex-wrap gap-3">
            <Link
              href="/my-rentals"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold"
            >
              My Rentals
            </Link>

            <Link
              href="/equipment"
              className="rounded-full bg-[#174f43] px-5 py-2 text-sm font-semibold text-white"
            >
              Browse Equipment
            </Link>
          </div>
        </header>

        <section className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[2px] text-[#d97752]">
            CUSTOMER DASHBOARD
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            My Favorites
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Keep track of equipment you would like to rent.
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

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
            <div>
              <h2 className="text-xl font-bold">
                Saved Equipment
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                {favorites.length} saved items
              </p>
            </div>

            <button
              type="button"
              onClick={reload}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">
              Loading your favorites...
            </div>
          ) : favorites.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="text-xl font-bold">
                No favorites saved yet
              </h3>

              <p className="mt-3 text-sm text-slate-500">
                Explore rental equipment and save what you like.
              </p>

              <Link
                href="/equipment"
                className="mt-6 inline-block rounded-xl bg-[#174f43] px-6 py-3 text-sm font-semibold text-white"
              >
                Explore Equipment
              </Link>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-[#f5f7f4] text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-6 py-4">Equipment</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Rental Price</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {favorites.map((favorite) => {
                    const equipment = favorite.equipment;
                    const id = String(favorite.equipmentId);

                    return (
                      <tr key={String(favorite._id)}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            {equipment?.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={equipment.image}
                                alt={equipment.name}
                                className="h-16 w-20 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-16 w-20 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                                No image
                              </div>
                            )}

                            <p className="max-w-48 font-bold">
                              {equipment?.name || "Equipment"}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          {equipment?.category || "N/A"}
                        </td>

                        <td className="px-6 py-5">
                          {equipment?.location || "N/A"}
                        </td>

                        <td className="px-6 py-5 font-bold text-[#174f43]">
                          {formatMoney(
                            equipment?.rentalPrice ??
                              equipment?.pricePerDay,
                          )}

                          <span className="block text-xs font-normal text-slate-500">
                            / {equipment?.rentalType || "daily"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/equipment/${encodeURIComponent(id)}`}
                              className="rounded-lg bg-[#174f43] px-4 py-2 text-xs font-semibold text-white"
                            >
                              View Details
                            </Link>

                            <button
                              type="button"
                              disabled={Boolean(removingId)}
                              onClick={() => removeFavorite(id)}
                              className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
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

        <footer className="mt-12 border-t border-slate-200 py-8 text-center text-xs text-slate-500">
          EquipRent · Customer Favorites
        </footer>
      </div>
    </main>
  );
}