
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

const rentalTypes = ["daily", "weekly", "monthly"];
const conditions = ["new", "excellent", "good", "fair"];

const initialForm = {
  name: "",
  description: "",
  category: "Camera",
  brand: "",
  model: "",
  condition: "good",
  rentalTerms: "",
  location: "",
  rentalType: "daily",
  rentalPrice: "",
  availableQuantity: "1",
  availability: true,
};

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

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  });
}

function approvalColor(status) {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function availabilityInfo(item) {
  const quantity = Number(item.availableQuantity ?? 1);

  if (item.availability === false) {
    return {
      label: "Unavailable",
      color: "border-slate-200 bg-slate-100 text-slate-600",
    };
  }

  if (quantity <= 0) {
    return {
      label: "Out of Stock",
      color: "border-red-200 bg-red-50 text-red-700",
    };
  }

  return {
    label: "Available",
    color: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${className}`}
    >
      {children}
    </span>
  );
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
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEquipment() {
      try {
        const authResponse = await fetch(`${API}/api/auth/token`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!authResponse.ok) {
          throw new Error("Please sign in with your Owner account.");
        }

        const authData = await authResponse.json();

        if (!authData.token) {
          throw new Error("Authentication token unavailable.");
        }

        const response = await fetch(
          `${API}/api/equipment/my?page=${page}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${authData.token}`,
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

        if (controller.signal.aborted) return;

        setItems(Array.isArray(data.data) ? data.data : []);
        setTotal(data.pagination?.total ?? 0);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setError("");
      } catch (cause) {
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Failed to load equipment.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadEquipment();

    return () => controller.abort();
  }, [page, refresh]);

  function reload() {
    setLoading(true);
    setRefresh((value) => value + 1);
  }

  function changePage(nextPage) {
    if (nextPage < 1 || nextPage > totalPages || busy) return;

    setLoading(true);
    setError("");
    setSuccess("");
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
      brand: item.brand || "",
      model: item.model || "",
      condition: conditions.includes(item.condition)
        ? item.condition
        : "good",
      rentalTerms: item.rentalTerms || "",
      location: item.location || "",
      rentalType: rentalTypes.includes(item.rentalType)
        ? item.rentalType
        : "daily",
      rentalPrice: String(priceOf(item)),
      availableQuantity: String(item.availableQuantity ?? 1),
      availability: item.availability !== false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    if (busy) return;

    setEditing(null);
    setForm(initialForm);
    setError("");
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function saveChanges(event) {
    event.preventDefault();

    if (!editing || busy) return;

    const rentalPrice = Number(form.rentalPrice);
    const availableQuantity = Number(form.availableQuantity);

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.category.trim() ||
      !form.location.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (!rentalTypes.includes(form.rentalType)) {
      setError("Select a valid rental type.");
      return;
    }

    if (!conditions.includes(form.condition)) {
      setError("Select a valid equipment condition.");
      return;
    }

    if (
      form.rentalPrice.trim() === "" ||
      !Number.isFinite(rentalPrice) ||
      rentalPrice <= 0 ||
      !Number.isSafeInteger(Math.round(rentalPrice * 100)) ||
      Math.round(rentalPrice * 100) <= 0
    ) {
      setError("Enter a valid rental price greater than zero.");
      return;
    }

    if (
      form.availableQuantity.trim() === "" ||
      !Number.isInteger(availableQuantity) ||
      availableQuantity < 0
    ) {
      setError("Quantity must be a whole number of zero or more.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      location: form.location.trim(),
      rentalType: form.rentalType,
      rentalPrice,
      availableQuantity,
      condition: form.condition,
      availability: form.availability,
    };

    // Optional fields cannot be sent as empty strings.
    // Existing optional values are preserved when left blank.
    if (form.brand.trim()) {
      payload.brand = form.brand.trim();
    }

    if (form.model.trim()) {
      payload.model = form.model.trim();
    }

    if (form.rentalTerms.trim()) {
      payload.rentalTerms = form.rentalTerms.trim();
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
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Could not update equipment.",
        );
      }

      setEditing(null);
      setForm(initialForm);
      setSuccess("Equipment updated successfully.");
      reload();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Update failed.",
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
        setForm(initialForm);
      }

      setSuccess("Equipment deleted successfully.");

      if (items.length === 1 && page > 1) {
        setLoading(true);
        setPage(page - 1);
      } else {
        reload();
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Delete failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  const availableCount = items.filter(
    (item) =>
      item.availability !== false &&
      Number(item.availableQuantity ?? 1) > 0,
  ).length;

  const approvedCount = items.filter(
    (item) => item.status === "approved",
  ).length;

  const pendingCount = items.filter(
    (item) => !item.status || item.status === "pending",
  ).length;

  const inputStyle =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  const labelStyle = "block text-sm font-semibold text-slate-700";

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-slate-900">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight text-emerald-950"
          >
            EquipRent<span className="text-amber-500">.</span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Home
            </Link>

            <Link
              href="/dashboard/owner"
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/owner/add-equipment"
              className="rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              + Add Equipment
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page Heading */}
        <section className="mb-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">
            Owner Dashboard
          </p>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                My Equipment
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Manage your rental listings, update pricing, control
                availability, and monitor approval status.
              </p>
            </div>

            <button
              type="button"
              onClick={reload}
              disabled={busy || loading}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Listings"}
            </button>
          </div>
        </section>

        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800"
          >
            {success}
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "Total Listings",
              value: total,
              accent: "text-emerald-900",
            },
            {
              label: "Available",
              value: availableCount,
              accent: "text-emerald-700",
            },
            {
              label: "Approved",
              value: approvedCount,
              accent: "text-blue-700",
            },
            {
              label: "Pending",
              value: pendingCount,
              accent: "text-amber-700",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </p>

              <p className={`mt-3 text-3xl font-black ${stat.accent}`}>
                {stat.value}
              </p>

              {stat.label !== "Total Listings" && (
                <p className="mt-2 text-xs text-slate-400">
                  Current page
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Edit Equipment */}
        {editing && (
          <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-emerald-950 px-6 py-6 text-white sm:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">
                  Listing Management
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Edit Equipment
                </h2>

                <p className="mt-1 text-sm text-emerald-100">
                  Update the details of your rental listing.
                </p>
              </div>

              <button
                type="button"
                onClick={cancelEdit}
                disabled={busy}
                className="rounded-full border border-white/30 px-5 py-2 text-sm font-bold transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={saveChanges}
              className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8"
            >
              <label className={labelStyle}>
                Equipment Name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  minLength={3}
                  className={inputStyle}
                />
              </label>

              <label className={labelStyle}>
                Category *
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className={inputStyle}
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

              <label className={labelStyle}>
                Brand
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="e.g. Canon"
                  className={inputStyle}
                />
              </label>

              <label className={labelStyle}>
                Model
                <input
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  placeholder="e.g. EOS R50"
                  className={inputStyle}
                />
              </label>

              <label className={labelStyle}>
                Condition
                <select
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  {conditions.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition.charAt(0).toUpperCase() +
                        condition.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelStyle}>
                Location *
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Dhaka"
                  className={inputStyle}
                />
              </label>

              <label className={labelStyle}>
                Rental Type *
                <select
                  name="rentalType"
                  value={form.rentalType}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>

              <label className={labelStyle}>
                Rental Price (BDT) *
                <input
                  name="rentalPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.rentalPrice}
                  onChange={handleChange}
                  required
                  className={inputStyle}
                />

                <span className="mt-2 block text-xs font-normal text-slate-400">
                  Price per {form.rentalType} rental period.
                </span>
              </label>

              <label className={labelStyle}>
                Available Quantity *
                <input
                  name="availableQuantity"
                  type="number"
                  min="0"
                  step="1"
                  value={form.availableQuantity}
                  onChange={handleChange}
                  required
                  className={inputStyle}
                />
              </label>

              <div className={labelStyle}>
                Listing Availability
                <label className="mt-2 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4">
                  <input
                    name="availability"
                    type="checkbox"
                    checked={form.availability}
                    onChange={handleChange}
                    className="h-4 w-4 accent-emerald-800"
                  />

                  <span className="text-sm font-medium text-slate-700">
                    Equipment available for rental
                  </span>
                </label>
              </div>

              <label className={`${labelStyle} sm:col-span-2`}>
                Description *
                <textarea
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleChange}
                  required
                  className={inputStyle}
                />
              </label>

              <label className={`${labelStyle} sm:col-span-2`}>
                Rental Terms
                <textarea
                  name="rentalTerms"
                  rows={3}
                  value={form.rentalTerms}
                  onChange={handleChange}
                  placeholder="e.g. Valid ID required. Return in original condition."
                  className={inputStyle}
                />
              </label>

              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6 sm:col-span-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-emerald-900 px-8 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                >
                  {busy ? "Saving Changes..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={busy}
                  className="rounded-full border border-slate-200 px-8 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Equipment Table */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-6 sm:px-8">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Equipment Listings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View and manage all your rental equipment.
              </p>
            </div>

            <Badge className="border-slate-200 bg-slate-100 text-slate-700">
              {total} Total Listings
            </Badge>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-800" />

              <p className="mt-5 text-sm font-medium text-slate-500">
                Loading your equipment...
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
                📦
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-900">
                No equipment found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                You have no equipment listings on this page.
                Add your first equipment to get started.
              </p>

              <Link
                href="/dashboard/owner/add-equipment"
                className="mt-6 inline-flex rounded-full bg-emerald-900 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Add Equipment
              </Link>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Equipment</th>
                    <th className="px-5 py-4">Rental Price</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Availability</th>
                    <th className="px-5 py-4">Approval</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const availability = availabilityInfo(item);

                    const canView =
                      item.status === "approved" &&
                      item.availability !== false &&
                      Number(item.availableQuantity ?? 1) > 0;

                    return (
                      <tr
                        key={item._id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                              {item.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                  No image
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-56 truncate font-bold text-slate-900">
                                {item.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {item.brand || "No brand"}
                                {item.model ? ` · ${item.model}` : ""}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {item.category} · {item.location}
                              </p>

                              <p className="mt-1 text-xs capitalize text-slate-400">
                                {item.condition || "good"} condition
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <p className="whitespace-nowrap font-black text-emerald-900">
                            ৳{formatPrice(priceOf(item))}
                          </p>

                          <p className="mt-1 text-xs capitalize text-slate-500">
                            Per {item.rentalType || "daily"}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <span className="text-sm font-bold text-slate-800">
                            {item.availableQuantity ?? 1}
                          </span>

                          <p className="mt-1 text-xs text-slate-400">
                            Units
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <Badge className={availability.color}>
                            {availability.label}
                          </Badge>
                        </td>

                        <td className="px-5 py-5">
                          <Badge
                            className={approvalColor(item.status)}
                          >
                            {item.status || "pending"}
                          </Badge>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            {canView && (
                              <Link
                                href={`/equipment/${item._id}`}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                              >
                                View
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              disabled={busy}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteItem(item)}
                              disabled={busy}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              Delete
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

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-6 py-5 sm:px-8">
              <p className="text-sm text-slate-500">
                Page{" "}
                <span className="font-bold text-slate-900">
                  {page}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-900">
                  {totalPages}
                </span>
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1 || busy}
                  onClick={() => changePage(page - 1)}
                  className="rounded-full border border-slate-200 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages || busy}
                  onClick={() => changePage(page + 1)}
                  className="rounded-full bg-emerald-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          Equipment availability and approval are managed separately.
          Only approved, available listings with stock show a public
          View Details action.
        </p>
      </div>
    </main>
  );
}