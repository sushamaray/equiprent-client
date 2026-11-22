
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const categories = [
  "Camera",
  "Photography",
  "Electronics",
  "Audio",
  "Lighting",
  "Tools",
  "Sports",
  "Camping",
  "Other",
];

async function getToken() {
  const response = await fetch(`${API}/api/auth/token`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Please sign in with your Owner account.");
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

function statusColor(status) {
  if (status === "approved") {
    return "bg-green-100 text-green-800";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-800";
  }

  return "bg-yellow-100 text-yellow-800";
}

export default function OwnerEquipmentPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(0);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Camera",
    location: "",
    rentalType: "daily",
    rentalPrice: "",
    availableQuantity: "1",
  });

  useEffect(() => {
    const controller = new AbortController();

    // Fetch data asynchronously. No synchronous state update
    // or state-changing function call inside this effect.
    fetch(`${API}/api/auth/token`, {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Please sign in with your Owner account.");
        }

        const data = await response.json();

        if (!data.token) {
          throw new Error("Authentication token unavailable.");
        }

        return data.token;
      })
      .then(async (token) => {
        const response = await fetch(
          `${API}/api/equipment/my?page=${page}&limit=10`,
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
            data.message || "Failed to load equipment.",
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

        setError(
          cause instanceof Error
            ? cause.message
            : "Failed to load equipment.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [page, refresh]);

  function reload() {
    setLoading(true);
    setRefresh((value) => value + 1);
  }

  function changePage(nextPage) {
    setLoading(true);
    setPage(nextPage);
  }

  function startEdit(item) {
    setError("");
    setSuccess("");
    setEditing(item);

    setForm({
      name: item.name || "",
      description: item.description || "",
      category: item.category || "Other",
      location: item.location || "",
      rentalType: item.rentalType || "daily",
      rentalPrice: String(priceOf(item)),
      availableQuantity: String(item.availableQuantity ?? 1),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveChanges(event) {
    event.preventDefault();

    if (!editing || busy) return;

    const rentalPrice = Number(form.rentalPrice);
    const availableQuantity = Number(form.availableQuantity);

    if (!Number.isFinite(rentalPrice) || rentalPrice <= 0) {
      setError("Enter a valid rental price.");
      return;
    }

    if (
      !Number.isInteger(availableQuantity) ||
      availableQuantity < 1
    ) {
      setError("Quantity must be at least 1.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const token = await getToken();

      const response = await fetch(
        `${API}/api/equipment/${editing._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            category: form.category,
            location: form.location.trim(),
            rentalType: form.rentalType,
            rentalPrice,
            availableQuantity,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Could not update equipment.",
        );
      }

      setEditing(null);
      setSuccess("Equipment updated successfully.");
      reload();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Update failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(item) {
    if (busy) return;

    const confirmed = window.confirm(
      `Delete "${item.name}"? This equipment will be hidden from active listings.`,
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const token = await getToken();

      const response = await fetch(
        `${API}/api/equipment/${item._id}`,
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
          data.message || "Could not delete equipment.",
        );
      }

      if (editing?._id === item._id) {
        setEditing(null);
      }

      setSuccess("Equipment deleted successfully.");

      if (items.length === 1 && page > 1) {
        changePage(page - 1);
      } else {
        reload();
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Delete failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="text-2xl font-extrabold text-emerald-900"
          >
            EquipRent<span className="text-amber-500">.</span>
          </Link>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-full border bg-white px-5 py-2 text-sm font-semibold"
            >
              Home
            </Link>

            <Link
              href="/dashboard/owner/add-equipment"
              className="rounded-full bg-emerald-900 px-5 py-2 text-sm font-semibold text-white"
            >
              + Add Equipment
            </Link>
          </div>
        </header>

        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          Owner Dashboard
        </p>

        <h1 className="mt-2 text-4xl font-bold">My Equipment</h1>

        <p className="mb-8 mt-3 text-slate-600">
          View, edit, and manage your equipment listings.
        </p>

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="mb-5 rounded-xl bg-green-50 p-4 text-green-800"
          >
            {success}
          </p>
        )}

        {editing && (
          <section className="mb-8 rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Equipment</h2>

              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={busy}
                className="text-sm font-semibold text-slate-500"
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={saveChanges}
              className="grid gap-5 sm:grid-cols-2"
            >
              <label className="text-sm font-semibold">
                Equipment Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  minLength={3}
                  className="mt-2 w-full rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="text-sm font-semibold">
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border bg-white p-3 font-normal"
                >
                  {!categories.includes(form.category) && (
                    <option value={form.category}>
                      {form.category}
                    </option>
                  )}
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold">
                Location
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="text-sm font-semibold">
                Rental Type
                <select
                  name="rentalType"
                  value={form.rentalType}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border bg-white p-3 font-normal"
                >
                  <option value="daily">Daily</option>
                  <option value="hourly">Hourly</option>
                </select>
              </label>

              <label className="text-sm font-semibold">
                Rental Price (BDT)
                <input
                  name="rentalPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.rentalPrice}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="text-sm font-semibold">
                Available Quantity
                <input
                  name="availableQuantity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.availableQuantity}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="text-sm font-semibold sm:col-span-2">
                Description
                <textarea
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border p-3 font-normal"
                />
              </label>

              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-emerald-900 px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>
        )}

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Your Listings</h2>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm">
              {total} total
            </span>
          </div>

          {loading ? (
            <p className="py-12 text-center text-slate-500">
              Loading equipment...
            </p>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="text-xl font-bold">No equipment found</h3>
              <Link
                href="/dashboard/owner/add-equipment"
                className="mt-5 inline-block rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white"
              >
                Add Equipment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <article
                  key={item._id}
                  className="flex flex-col gap-5 rounded-2xl border p-4 sm:flex-row sm:items-center"
                >
                  <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-36">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor(item.status)}`}
                    >
                      {item.status || "pending"}
                    </span>

                    <h3 className="mt-3 text-lg font-bold">{item.name}</h3>

                    <p className="text-sm text-slate-500">
                      {item.category} · {item.location}
                    </p>

                    <p className="mt-2 font-bold text-emerald-900">
                      ৳{Number(priceOf(item)).toLocaleString("en-BD")}
                      <span className="text-sm font-normal text-slate-500">
                        {" "}/ {item.rentalType || "daily"}
                      </span>
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Quantity: {item.availableQuantity ?? 1}
                    </p>
                  </div>

                  <div className="flex gap-2 sm:flex-col">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => startEdit(item)}
                      className="rounded-xl border border-emerald-700 px-5 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => deleteItem(item)}
                      className="rounded-xl border border-red-200 px-5 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={page <= 1 || busy}
                onClick={() => changePage(page - 1)}
                className="rounded-xl border px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages || busy}
                onClick={() => changePage(page + 1)}
                className="rounded-xl border px-4 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}