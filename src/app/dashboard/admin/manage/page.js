
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const tabs = [
  { key: "users", label: "All Users" },
  { key: "equipment", label: "All Equipment" },
  { key: "rentals", label: "All Rentals" },
];

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

function Status({ value }) {
  const active = ["approved", "confirmed", "completed", "paid"];
  const danger = ["rejected", "cancelled"];

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
        active.includes(value)
          ? "bg-emerald-100 text-emerald-800"
          : danger.includes(value)
            ? "bg-red-100 text-red-800"
            : "bg-amber-100 text-amber-800"
      }`}
    >
      {value || "unknown"}
    </span>
  );
}

async function token() {
  const response = await fetch(`${API}/api/auth/token`, {
    credentials: "include",
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.token) {
    throw new Error("Please sign in as Admin.");
  }

  return data.token;
}

export default function AdminManagementPage() {
  const [tab, setTab] = useState("users");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [refresh, setRefresh] = useState(0);

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
          throw new Error("Please sign in as Admin.");
        }

        return data.token;
      })
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

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load management data.",
          );
        }

        return data;
      })
      .then((data) => {
        if (controller.signal.aborted) return;

        setItems(Array.isArray(data.data) ? data.data : []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(
          Math.max(1, data.pagination?.totalPages || 1),
        );
        setError("");
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(cause.message || "Request failed.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [tab, page, refresh]);

  function chooseTab(value) {
    setTab(value);
    setPage(1);
    setItems([]);
    setLoading(true);
    setError("");
    setMessage("");
  }

  function reload() {
    setLoading(true);
    setRefresh((value) => value + 1);
  }

  async function request(path, method, body) {
    const jwt = await token();

    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${jwt}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Action failed.");
    }

    return data;
  }

  async function changeRole(user, newRole) {
    if (busy || user.role === newRole) return;

    if (
      !window.confirm(
        `Change ${user.name || user.email} to ${newRole}?`,
      )
    ) {
      return;
    }

    setBusy(String(user._id));
    setError("");
    setMessage("");

    try {
      const data = await request(
        `/api/admin/users/${user._id}/role`,
        "PATCH",
        { role: newRole },
      );

      setMessage(data.message);
      reload();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy("");
    }
  }

  async function reviewEquipment(item, action) {
    if (busy) return;

    if (
      !window.confirm(`${action} "${item.name}"?`)
    ) {
      return;
    }

    setBusy(String(item._id));
    setError("");
    setMessage("");

    try {
      const data = await request(
        `/api/equipment/${item._id}/${action}`,
        "PATCH",
      );

      setMessage(data.message || `Equipment ${action} successful.`);
      reload();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy("");
    }
  }

  async function deleteEquipment(item) {
    if (busy) return;

    if (
      !window.confirm(
        `Remove "${item.name}" from the marketplace?`,
      )
    ) {
      return;
    }

    setBusy(String(item._id));
    setError("");
    setMessage("");

    try {
      const data = await request(
        `/api/admin/equipment/${item._id}`,
        "DELETE",
      );

      setMessage(data.message);
      reload();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 text-[#192321] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-6">
          <Link
            href="/"
            className="text-2xl font-extrabold text-[#174f43]"
          >
            EquipRent<span className="text-[#df704b]">.</span>
          </Link>

          <div className="flex gap-3">
            <Link
              href="/dashboard/admin"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold"
            >
              Analytics Dashboard
            </Link>

            <Link
              href="/dashboard/profile"
              className="rounded-full bg-[#174f43] px-5 py-2 text-sm font-semibold text-white"
            >
              My Profile
            </Link>
          </div>
        </header>

        <section className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[2px] text-[#d97752]">
            ADMINISTRATION
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Platform Management
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Manage users, equipment listings, and rental records.
          </p>
        </section>

        <div className="mb-8 flex flex-wrap gap-3">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => chooseTab(item.key)}
              className={`rounded-xl px-6 py-3 text-sm font-bold ${
                tab === item.key
                  ? "bg-[#174f43] text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {message}
          </p>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
            <div>
              <h2 className="text-xl font-bold">
                {tabs.find((item) => item.key === tab)?.label}
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                {total} total records
              </p>
            </div>

            <button
              type="button"
              onClick={reload}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="p-14 text-center text-slate-500">
              Loading records...
            </p>
          ) : items.length === 0 ? (
            <p className="p-14 text-center text-slate-500">
              No records found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#f5f7f4] text-xs uppercase text-slate-600">
                  {tab === "users" && (
                    <tr>
                      <th className="px-5 py-4">User</th>
                      <th className="px-5 py-4">Email</th>
                      <th className="px-5 py-4">Role</th>
                      <th className="px-5 py-4">Change Role</th>
                    </tr>
                  )}

                  {tab === "equipment" && (
                    <tr>
                      <th className="px-5 py-4">Equipment</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Price</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  )}

                  {tab === "rentals" && (
                    <tr>
                      <th className="px-5 py-4">Customer</th>
                      <th className="px-5 py-4">Equipment</th>
                      <th className="px-5 py-4">Owner</th>
                      <th className="px-5 py-4">Dates</th>
                      <th className="px-5 py-4">Amount</th>
                      <th className="px-5 py-4">Payment</th>
                      <th className="px-5 py-4">Booking</th>
                    </tr>
                  )}
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr
                      key={String(item._id)}
                      className="align-top hover:bg-slate-50"
                    >
                      {tab === "users" && (
                        <>
                          <td className="px-5 py-5 font-semibold">
                            {item.name || "Unnamed user"}
                          </td>

                          <td className="px-5 py-5 text-slate-600">
                            {item.email}
                          </td>

                          <td className="px-5 py-5">
                            <Status value={item.role} />
                          </td>

                          <td className="px-5 py-5">
                            {item.role === "admin" ? (
                              <span className="text-xs text-slate-400">
                                Protected Admin
                              </span>
                            ) : (
                              <select
                                aria-label={`Change role for ${item.name || item.email}`}
                                disabled={Boolean(busy)}
                                value={item.role}
                                onChange={(event) =>
                                  changeRole(item, event.target.value)
                                }
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:opacity-50"
                              >
                                <option value="customer">Customer</option>
                                <option value="owner">Owner</option>
                              </select>
                            )}
                          </td>
                        </>
                      )}

                      {tab === "equipment" && (
                        <>
                          <td className="px-5 py-5 font-semibold">
                            {item.name}
                            <p className="mt-2 text-xs font-normal text-slate-500">
                              {item.location}
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            {item.category}
                          </td>

                          <td className="px-5 py-5 font-semibold">
                            {money(item.rentalPrice ?? item.pricePerDay)}
                          </td>

                          <td className="px-5 py-5">
                            <Status value={item.status} />
                          </td>

                          <td className="px-5 py-5">
                            <div className="flex flex-wrap gap-2">
                              {item.status === "pending" && (
                                <>
                                  <button
                                    type="button"
                                    disabled={Boolean(busy)}
                                    onClick={() =>
                                      reviewEquipment(item, "approve")
                                    }
                                    className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                                  >
                                    Approve
                                  </button>

                                  <button
                                    type="button"
                                    disabled={Boolean(busy)}
                                    onClick={() =>
                                      reviewEquipment(item, "reject")
                                    }
                                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                disabled={Boolean(busy)}
                                onClick={() => deleteEquipment(item)}
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
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
                            <p className="font-semibold">
                              {item.customerName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.customerEmail}
                            </p>
                          </td>

                          <td className="px-5 py-5 font-semibold">
                            {item.equipmentName}
                          </td>

                          <td className="px-5 py-5">
                            {item.ownerName}
                          </td>

                          <td className="px-5 py-5 text-xs">
                            {item.startDate}
                            <br />
                            to
                            <br />
                            {item.endDate}
                          </td>

                          <td className="px-5 py-5 font-bold">
                            {money(item.totalPrice)}
                          </td>

                          <td className="px-5 py-5">
                            <Status value={item.paymentStatus} />
                          </td>

                          <td className="px-5 py-5">
                            <Status value={item.status} />
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 border-t border-slate-100 p-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setPage((value) => value - 1);
                  setLoading(true);
                }}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((value) => value + 1);
                  setLoading(true);
                }}
                className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
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