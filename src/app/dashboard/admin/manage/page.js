
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const tabs = [
  { key: "users", label: "All Users" },
  { key: "equipment", label: "All Equipment" },
  { key: "rentals", label: "All Rentals" },
];

const categories = [
  "Construction Equipment",
  "Photography Equipment",
  "Vehicles & Transportation",
  "Agriculture Equipment",
  "Electronics",
  "Event Equipment",
  "Camera",
  "Photography",
  "Audio",
  "Lighting",
  "Tools",
  "Sports",
  "Camping",
  "Other",
];

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

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
  });
}

function Status({ value }) {
  const active = [
    "approved",
    "confirmed",
    "completed",
    "paid",
    "admin",
  ];

  const danger = [
    "rejected",
    "cancelled",
    "failed",
  ];

  const style = active.includes(value)
    ? "bg-emerald-50 text-emerald-800"
    : danger.includes(value)
      ? "bg-red-50 text-red-700"
      : "bg-amber-50 text-amber-800";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold capitalize ${style}`}
    >
      {value || "Unknown"}
    </span>
  );
}

async function getToken(signal) {
  const response = await fetch(`${API}/api/auth/token`, {
    credentials: "include",
    cache: "no-store",
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.token) {
    throw new Error(
      "Please sign in with your Admin account.",
    );
  }

  return data.token;
}

async function apiRequest(path, method = "GET", body) {
  const jwt = await getToken();

  const response = await fetch(`${API}${path}`, {
    method,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${jwt}`,
      ...(body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Request failed.",
    );
  }

  return data;
}

function initialEquipmentForm(item) {
  return {
    name: item.name || "",
    description: item.description || "",
    category: item.category || "",
    location: item.location || "",
    rentalPrice: String(
      item.rentalPrice ?? item.pricePerDay ?? "",
    ),
    rentalType: item.rentalType || "daily",
    availableQuantity: String(
      item.availableQuantity ?? 1,
    ),
    availability: item.availability !== false,
    condition: item.condition || "",
    brand: item.brand || "",
    model: item.model || "",
    rentalTerms: item.rentalTerms || "",
    image: item.image || "",
  };
}

function Field({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  min,
  max,
  placeholder,
}) {
  return (
    <label className="block text-sm font-semibold text-[#192321]">
      {label}

      <input
        required={required}
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal outline-none transition focus:border-[#174f43] focus:bg-white"
      />
    </label>
  );
}

function EquipmentEditModal({
  equipment,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() =>
    initialEquipmentForm(equipment),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function close() {
    if (!saving) onClose();
  }

  async function save(event) {
    event.preventDefault();

    if (saving) return;

    setError("");

    const rentalPrice = Number(form.rentalPrice);
    const availableQuantity = Number(
      form.availableQuantity,
    );

    if (
      !Number.isSafeInteger(rentalPrice) ||
      rentalPrice <= 0
    ) {
      setError(
        "Rental price must be a positive whole BDT amount.",
      );
      return;
    }

    if (
      !Number.isSafeInteger(availableQuantity) ||
      availableQuantity < 0
    ) {
      setError(
        "Quantity must be a non-negative whole number.",
      );
      return;
    }

    if (form.availability && availableQuantity < 1) {
      setError(
        "Available equipment must have at least one unit.",
      );
      return;
    }

    const original = initialEquipmentForm(equipment);

    const normalized = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      location: form.location.trim(),
      rentalPrice,
      rentalType: form.rentalType,
      availableQuantity,
      availability: form.availability,
      condition: form.condition.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      rentalTerms: form.rentalTerms.trim(),
      image: form.image.trim(),
    };

    // Send only the fields that were changed.
    const changes = {};

    for (const [field, value] of Object.entries(
      normalized,
    )) {
      let previous = original[field];

      if (
        field === "rentalPrice" ||
        field === "availableQuantity"
      ) {
        previous = Number(previous);
      }

      if (value !== previous) {
        changes[field] = value;
      }
    }

    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    setSaving(true);

    try {
      const result = await apiRequest(
        `/api/admin/equipment/${equipment._id}`,
        "PATCH",
        changes,
      );

      onSaved(
        result.message ||
          "Equipment updated successfully.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update equipment.",
      );
      setSaving(false);
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-[#10241d]/65 p-4 backdrop-blur-sm sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-edit-equipment-title"
        className="my-auto w-full max-w-3xl rounded-3xl border border-[#e3e9e3] bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[2px] text-[#df704b]">
              Equipment Management
            </p>

            <h2
              id="admin-edit-equipment-title"
              className="mt-2 text-2xl font-extrabold tracking-tight text-[#174f43]"
            >
              Edit equipment
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Update listing information without changing
              existing bookings or payments.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={close}
            aria-label="Close edit form"
            className="rounded-xl border border-slate-200 px-3 py-2 text-xl text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={save} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label="Equipment Name"
                required
                value={form.name}
                onChange={(value) => update("name", value)}
              />
            </div>

            <label className="block text-sm font-semibold sm:col-span-2">
              Description

              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(event) =>
                  update("description", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal outline-none focus:border-[#174f43]"
              />
            </label>

            <label className="block text-sm font-semibold">
              Category

              <select
                required
                value={form.category}
                onChange={(event) =>
                  update("category", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal"
              >
                {!categories.includes(form.category) &&
                  form.category && (
                    <option value={form.category}>
                      {form.category}
                    </option>
                  )}

                {!form.category && (
                  <option value="">
                    Select category
                  </option>
                )}

                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <Field
              label="Location"
              required
              value={form.location}
              onChange={(value) =>
                update("location", value)
              }
            />

            <Field
              label="Rental Price (BDT)"
              required
              type="number"
              min="1"
              value={form.rentalPrice}
              onChange={(value) =>
                update("rentalPrice", value)
              }
            />

            <label className="block text-sm font-semibold">
              Rental Type

              <select
                value={form.rentalType}
                onChange={(event) =>
                  update("rentalType", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>

            <Field
              label="Available Quantity"
              required
              type="number"
              min="0"
              value={form.availableQuantity}
              onChange={(value) =>
                update("availableQuantity", value)
              }
            />

            <label className="block text-sm font-semibold">
              Availability

              <select
                value={String(form.availability)}
                onChange={(event) =>
                  update(
                    "availability",
                    event.target.value === "true",
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal"
              >
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
            </label>

            <Field
              label="Equipment Condition"
              value={form.condition}
              onChange={(value) =>
                update("condition", value)
              }
            />

            <Field
              label="Brand"
              value={form.brand}
              onChange={(value) =>
                update("brand", value)
              }
            />

            <Field
              label="Model"
              value={form.model}
              onChange={(value) =>
                update("model", value)
              }
            />

            <div className="sm:col-span-2">
              <Field
                label="Image URL (HTTPS)"
                type="url"
                value={form.image}
                onChange={(value) =>
                  update("image", value)
                }
                placeholder="https://..."
              />
            </div>

            <label className="block text-sm font-semibold sm:col-span-2">
              Rental Terms and Conditions

              <textarea
                rows={3}
                value={form.rentalTerms}
                onChange={(event) =>
                  update(
                    "rentalTerms",
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal outline-none focus:border-[#174f43]"
              />
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              disabled={saving}
              onClick={close}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#174f43] px-7 py-3 text-sm font-bold text-white hover:bg-[#236959] disabled:opacity-50"
            >
              {saving
                ? "Saving changes..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function AdminManagementPage() {
  const [tab, setTab] = useState("users");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getToken(controller.signal)
      .then(async (jwt) => {
        const response = await fetch(
          `${API}/api/admin/${tab}?page=${page}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
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
            data.message ||
              "Unable to load management data.",
          );
        }

        return data;
      })
      .then((data) => {
        if (controller.signal.aborted) return;

        setItems(
          Array.isArray(data.data)
            ? data.data
            : [],
        );

        setPagination({
          total: data.pagination?.total || 0,
          totalPages: Math.max(
            1,
            data.pagination?.totalPages || 1,
          ),
        });

        setError("");
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load records.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [tab, page, refresh]);

  const reload = useCallback(() => {
    setLoading(true);
    setRefresh((previous) => previous + 1);
  }, []);

  function chooseTab(value) {
    if (tab === value) return;

    setTab(value);
    setPage(1);
    setItems([]);
    setLoading(true);
    setError("");
    setMessage("");
  }

  function changePage(nextPage) {
    setPage(nextPage);
    setLoading(true);
  }

  async function changeRole(user, nextRole) {
    if (
      busy ||
      user.role === nextRole ||
      user.role === "admin"
    ) {
      return;
    }

    const roleLabel =
      nextRole.charAt(0).toUpperCase() +
      nextRole.slice(1);

    const warning =
      nextRole === "admin"
        ? `WARNING: ${user.name || user.email} will receive full Admin access to manage users, equipment, and rentals.\n\nAre you sure you trust this account?`
        : `Change ${user.name || user.email} to ${roleLabel}?`;

    if (!window.confirm(warning)) {
      return;
    }

    setBusy(String(user._id));
    setError("");
    setMessage("");

    try {
      const data = await apiRequest(
        `/api/admin/users/${user._id}/role`,
        "PATCH",
        { role: nextRole },
      );

      setMessage(
        data.message ||
          "User role updated successfully.",
      );

      reload();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to change role.",
      );
    } finally {
      setBusy("");
    }
  }

  async function reviewEquipment(item, action) {
    if (busy) return;

    if (!window.confirm(`${action} "${item.name}"?`)) {
      return;
    }

    setBusy(String(item._id));
    setError("");
    setMessage("");

    try {
      const data = await apiRequest(
        `/api/equipment/${item._id}/${action}`,
        "PATCH",
      );

      setMessage(
        data.message ||
          `Equipment ${action} successful.`,
      );

      reload();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Equipment review failed.",
      );
    } finally {
      setBusy("");
    }
  }

  async function deleteEquipment(item) {
    if (busy) return;

    if (
      !window.confirm(
        `Remove "${item.name}" from the marketplace? This cannot be undone from this page.`,
      )
    ) {
      return;
    }

    setBusy(String(item._id));
    setError("");
    setMessage("");

    try {
      const data = await apiRequest(
        `/api/admin/equipment/${item._id}`,
        "DELETE",
      );

      setMessage(
        data.message ||
          "Equipment removed successfully.",
      );

      if (
        items.length === 1 &&
        page > 1
      ) {
        changePage(page - 1);
      } else {
        reload();
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to delete equipment.",
      );
    } finally {
      setBusy("");
    }
  }

  function onEquipmentSaved(text) {
    setEditing(null);
    setMessage(text);
    setError("");
    reload();
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 text-[#192321] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#e3e8e3] pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[2px] text-[#df704b]">
              EQUIPRENT ADMIN
            </p>

            <p className="mt-2 text-lg font-extrabold text-[#174f43]">
              Management Center
            </p>
          </div>

          {/* Active page navigation */}
          <nav
            aria-label="Admin navigation"
            className="flex flex-wrap items-center gap-2 sm:gap-3"
          >
            <Link
              href="/dashboard/admin"
              className="rounded-full border border-[#dce6de] bg-white px-4 py-2 text-xs font-semibold text-[#53675b] transition-all duration-200 hover:border-[#c5dccb] hover:bg-[#eaf2eb] hover:text-[#174f43] sm:px-5 sm:text-sm"
            >
              Analytics
            </Link>

            <Link
              href="/dashboard/admin/manage"
              aria-current="page"
              className="rounded-full border border-[#174f43] bg-[#174f43] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:border-[#236959] hover:bg-[#236959] sm:px-5 sm:text-sm"
            >
              Manage Platform
            </Link>

            <Link
              href="/dashboard/profile"
              className="rounded-full border border-[#dce6de] bg-white px-4 py-2 text-xs font-semibold text-[#53675b] transition-all duration-200 hover:border-[#c5dccb] hover:bg-[#eaf2eb] hover:text-[#174f43] sm:px-5 sm:text-sm"
            >
              My Profile
            </Link>

            <Link
              href="/"
              className="rounded-full border border-[#dce6de] bg-white px-4 py-2 text-xs font-semibold text-[#53675b] transition-all duration-200 hover:border-[#c5dccb] hover:bg-[#eaf2eb] hover:text-[#174f43] sm:px-5 sm:text-sm"
            >
              View Website
            </Link>
          </nav>
        </header>

        <section className="mb-9">
          <p className="text-xs font-bold uppercase tracking-[2px] text-[#df704b]">
            Administration
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Platform Management
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Manage marketplace users, equipment listings,
            and rental records from one place.
          </p>
        </section>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => chooseTab(item.key)}
              aria-pressed={tab === item.key}
              className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                tab === item.key
                  ? "bg-[#174f43] text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

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
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6 sm:p-8">
            <div>
              <h2 className="text-xl font-bold">
                {
                  tabs.find(
                    (item) => item.key === tab,
                  )?.label
                }
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                {pagination.total} records · Live MongoDB data
              </p>
            </div>

            <button
              type="button"
              onClick={reload}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="space-y-4 p-8">
              {[1, 2, 3].map((number) => (
                <div
                  key={number}
                  className="h-16 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-[#174f43]">
                ◇
              </div>

              <h3 className="mt-5 text-lg font-bold">
                No records found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                There are no records to display in this section.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-[#f5f7f4] text-xs uppercase tracking-wide text-slate-500">
                  {tab === "users" && (
                    <tr>
                      <th className="px-5 py-4">
                        User
                      </th>
                      <th className="px-5 py-4">
                        Email
                      </th>
                      <th className="px-5 py-4">
                        Registered
                      </th>
                      <th className="px-5 py-4">
                        Role
                      </th>
                      <th className="px-5 py-4">
                        Actions
                      </th>
                    </tr>
                  )}

                  {tab === "equipment" && (
                    <tr>
                      <th className="px-5 py-4">
                        Equipment
                      </th>
                      <th className="px-5 py-4">
                        Category
                      </th>
                      <th className="px-5 py-4">
                        Price
                      </th>
                      <th className="px-5 py-4">
                        Status
                      </th>
                      <th className="px-5 py-4">
                        Actions
                      </th>
                    </tr>
                  )}

                  {tab === "rentals" && (
                    <tr>
                      <th className="px-5 py-4">
                        Customer
                      </th>
                      <th className="px-5 py-4">
                        Equipment
                      </th>
                      <th className="px-5 py-4">
                        Owner
                      </th>
                      <th className="px-5 py-4">
                        Rental Dates
                      </th>
                      <th className="px-5 py-4">
                        Amount
                      </th>
                      <th className="px-5 py-4">
                        Payment
                      </th>
                      <th className="px-5 py-4">
                        Booking
                      </th>
                    </tr>
                  )}
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr
                      key={String(item._id)}
                      className="align-top transition hover:bg-[#fafbf9]"
                    >
                      {tab === "users" && (
                        <>
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 font-bold text-[#174f43]">
                                {item.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.image}
                                    alt={
                                      item.name ||
                                      "User"
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  (
                                    item.name ||
                                    "U"
                                  )
                                    .charAt(0)
                                    .toUpperCase()
                                )}
                              </div>

                              <span className="font-bold">
                                {item.name ||
                                  "Unnamed User"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-5 text-slate-600">
                            {item.email}
                          </td>

                          <td className="px-5 py-5 text-slate-600">
                            {formatDate(
                              item.createdAt,
                            )}
                          </td>

                          <td className="px-5 py-5">
                            <Status
                              value={item.role}
                            />
                          </td>

                          <td className="px-5 py-5">
                            {item.role === "admin" ? (
                              <span className="inline-flex rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#174f43]">
                                Protected Admin
                              </span>
                            ) : (
                              <select
                                aria-label={`Change role for ${
                                  item.name ||
                                  item.email
                                }`}
                                value={
                                  item.role ||
                                  "customer"
                                }
                                disabled={Boolean(
                                  busy,
                                )}
                                onChange={(
                                  event,
                                ) =>
                                  changeRole(
                                    item,
                                    event.target
                                      .value,
                                  )
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#174f43] outline-none focus:border-[#174f43] disabled:opacity-50"
                              >
                                <option value="customer">
                                  Customer
                                </option>
                                <option value="owner">
                                  Owner
                                </option>
                                <option value="admin">
                                  Admin
                                </option>
                              </select>
                            )}
                          </td>
                        </>
                      )}

                      {tab === "equipment" && (
                        <>
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                {item.image && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.image}
                                    alt={
                                      item.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>

                              <div>
                                <p className="font-bold">
                                  {item.name}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    item.location
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5 text-slate-600">
                            {item.category}
                          </td>

                          <td className="px-5 py-5 font-bold text-[#174f43]">
                            {money(
                              item.rentalPrice ??
                                item.pricePerDay,
                            )}
                          </td>

                          <td className="px-5 py-5">
                            <Status
                              value={
                                item.status
                              }
                            />
                          </td>

                          <td className="px-5 py-5">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={Boolean(
                                  busy,
                                )}
                                onClick={() => {
                                  setError("");
                                  setMessage("");
                                  setEditing(
                                    item,
                                  );
                                }}
                                className="rounded-lg border border-[#174f43] px-3 py-2 text-xs font-bold text-[#174f43] hover:bg-emerald-50 disabled:opacity-50"
                              >
                                Edit
                              </button>

                              {item.status ===
                                "pending" && (
                                <>
                                  <button
                                    type="button"
                                    disabled={Boolean(
                                      busy,
                                    )}
                                    onClick={() =>
                                      reviewEquipment(
                                        item,
                                        "approve",
                                      )
                                    }
                                    className="rounded-lg bg-[#174f43] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                                  >
                                    Approve
                                  </button>

                                  <button
                                    type="button"
                                    disabled={Boolean(
                                      busy,
                                    )}
                                    onClick={() =>
                                      reviewEquipment(
                                        item,
                                        "reject",
                                      )
                                    }
                                    className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-bold text-amber-800 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                disabled={Boolean(
                                  busy,
                                )}
                                onClick={() =>
                                  deleteEquipment(
                                    item,
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}

                      {tab === "rentals" && (
                        <>
                          <td className="px-5 py-5">
                            <p className="font-bold">
                              {item.customerName ||
                                "Unknown Customer"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                item.customerEmail
                              }
                            </p>
                          </td>

                          <td className="px-5 py-5 font-semibold">
                            {item.equipmentName ||
                              "Unknown Equipment"}
                          </td>

                          <td className="px-5 py-5 text-slate-600">
                            {item.ownerName ||
                              "Unknown Owner"}
                          </td>

                          <td className="px-5 py-5 text-xs leading-6">
                            {formatDate(
                              item.startDate,
                            )}
                            <span className="block text-slate-400">
                              to
                            </span>
                            {formatDate(
                              item.endDate,
                            )}
                          </td>

                          <td className="px-5 py-5 font-bold text-[#174f43]">
                            {money(
                              item.totalPrice,
                            )}
                          </td>

                          <td className="px-5 py-5">
                            <Status
                              value={
                                item.paymentStatus
                              }
                            />
                          </td>

                          <td className="px-5 py-5">
                            <Status
                              value={
                                item.status
                              }
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading &&
            pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 border-t border-slate-100 p-6">
                <button
                  type="button"
                  disabled={
                    page <= 1 ||
                    Boolean(busy)
                  }
                  onClick={() =>
                    changePage(page - 1)
                  }
                  className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm text-slate-600">
                  Page {page} of{" "}
                  {
                    pagination.totalPages
                  }
                </span>

                <button
                  type="button"
                  disabled={
                    page >=
                      pagination.totalPages ||
                    Boolean(busy)
                  }
                  onClick={() =>
                    changePage(page + 1)
                  }
                  className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
        </section>

        <footer className="mt-12 border-t border-slate-200 py-8 text-center text-xs text-slate-500">
          EquipRent · Platform Administration
        </footer>
      </div>

      {editing && (
        <EquipmentEditModal
          key={String(
            editing._id,
          )}
          equipment={editing}
          onClose={() =>
            setEditing(null)
          }
          onSaved={
            onEquipmentSaved
          }
        />
      )}
    </main>
  );
}