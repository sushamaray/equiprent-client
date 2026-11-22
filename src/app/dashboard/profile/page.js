
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const initialForm = {
  name: "",
  image: "",
  phone: "",
  address: "",
};

async function getToken(signal) {
  const response = await fetch(`${API}/api/auth/token`, {
    credentials: "include",
    cache: "no-store",
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.token) {
    throw new Error("Please sign in to manage your profile.");
  }

  return data.token;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getToken(controller.signal)
      .then(async (token) => {
        const response = await fetch(`${API}/api/profile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Profile loading failed.");
        }

        return data.data;
      })
      .then((user) => {
        if (controller.signal.aborted) return;

        setProfile(user);

        setForm({
          name: user.name || "",
          image: user.image || "",
          phone: user.phone || "",
          address: user.address || "",
        });
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(cause.message || "Unable to load profile.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const token = await getToken();

      const response = await fetch(`${API}/api/profile/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Profile update failed.");
      }

      setProfile(data.data);

      setForm({
        name: data.data.name || "",
        image: data.data.image || "",
        phone: data.data.phone || "",
        address: data.data.address || "",
      });

      setMessage("Profile updated successfully!");
    } catch (cause) {
      setError(cause.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  const dashboardLink =
    profile?.role === "admin"
      ? "/dashboard/admin"
      : profile?.role === "owner"
        ? "/dashboard/owner"
        : "/my-rentals";

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 text-[#192321] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#e3e8e3] pb-6">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-[#174f43]"
          >
            EquipRent<span className="text-[#df704b]">.</span>
          </Link>

          <Link
            href={dashboardLink}
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold"
          >
            Back to Dashboard
          </Link>
        </header>

        <section className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[2px] text-[#d97752]">
            ACCOUNT SETTINGS
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            My Profile
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Manage your personal information and contact details.
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

        {loading ? (
          <div className="rounded-3xl border bg-white p-12 text-center text-slate-500">
            Loading profile...
          </div>
        ) : profile ? (
          <form
            onSubmit={saveProfile}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
          >
            <div className="mb-8 flex flex-wrap items-center gap-5 border-b border-slate-100 pb-8">
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image}
                  alt="Profile"
                  className="h-24 w-24 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-800">
                  {(form.name || "?").charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold">
                  {profile.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {profile.email}
                </p>

                <span className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-800">
                  {profile.role}
                </span>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Full Name
                </label>

                <input
                  id="profile-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email (Read Only)
                </label>

                <input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-phone"
                  className="mb-2 block text-sm font-semibold"
                >
                  Phone Number
                </label>

                <input
                  id="profile-phone"
                  type="tel"
                  maxLength={30}
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  onChange={(event) =>
                    updateField("phone", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-image"
                  className="mb-2 block text-sm font-semibold"
                >
                  Photo URL (HTTPS)
                </label>

                <input
                  id="profile-image"
                  type="url"
                  maxLength={2048}
                  placeholder="https://..."
                  value={form.image}
                  onChange={(event) =>
                    updateField("image", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="profile-address"
                className="mb-2 block text-sm font-semibold"
              >
                Address
              </label>

              <textarea
                id="profile-address"
                rows={4}
                maxLength={300}
                placeholder="Enter your address"
                value={form.address}
                onChange={(event) =>
                  updateField("address", event.target.value)
                }
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-700"
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <p className="text-xs text-slate-500">
                Email and account role cannot be edited here.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#174f43] px-8 py-3 text-sm font-bold text-white hover:bg-[#236959] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
            Please sign in to view your profile.
          </div>
        )}
      </div>
    </main>
  );
}