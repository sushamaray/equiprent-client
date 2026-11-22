
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORIES = [
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

export default function AddEquipmentPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Camera",
    location: "",
    rentalType: "daily",
    rentalPrice: "",
    availableQuantity: "1",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function selectImage(event) {
    const file = event.target.files?.[0];

    setError("");

    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }

    const supportedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!supportedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  }

  async function getAccessToken() {
    const response = await fetch(`${API_URL}/api/auth/token`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        "Please sign in with your Owner account before adding equipment.",
      );
    }

    const data = await response.json();

    if (!data.token) {
      throw new Error("Could not get an authentication token.");
    }

    return data.token;
  }

  async function submitEquipment(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!imageFile) {
      setError("Please select an equipment image.");
      return;
    }

    if (Number(form.rentalPrice) <= 0) {
      setError("Rental price must be greater than zero.");
      return;
    }

    if (
      !Number.isInteger(Number(form.availableQuantity)) ||
      Number(form.availableQuantity) < 1
    ) {
      setError("Available quantity must be at least 1.");
      return;
    }

    setLoading(true);

    try {
      const token = await getAccessToken();

      // Step 1: Upload image to ImgBB through our backend.
      const imageFormData = new FormData();
      imageFormData.append("image", imageFile);

      const uploadResponse = await fetch(
        `${API_URL}/api/equipment/upload-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: imageFormData,
        },
      );

      const uploadData = await uploadResponse
        .json()
        .catch(() => ({}));

      if (!uploadResponse.ok || !uploadData.image?.url) {
        throw new Error(
          uploadData.message || "Image upload failed.",
        );
      }

      // Step 2: Save equipment with the hosted image URL.
      const equipmentPayload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        rentalType: form.rentalType,
        rentalPrice: Number(form.rentalPrice),
        availableQuantity: Number(form.availableQuantity),
        image: uploadData.image.url,
      };

      const createResponse = await fetch(
        `${API_URL}/api/equipment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(equipmentPayload),
        },
      );

      const createData = await createResponse
        .json()
        .catch(() => ({}));

      if (!createResponse.ok) {
        throw new Error(
          createData.message || "Could not create equipment.",
        );
      }

      setSuccess(
        "Equipment submitted successfully! It may require admin approval before appearing publicly.",
      );

      setForm({
        name: "",
        description: "",
        category: "Camera",
        location: "",
        rentalType: "daily",
        rentalPrice: "",
        availableQuantity: "1",
      });

      setImageFile(null);
      setImagePreview("");

      const imageInput = document.getElementById(
        "equipment-image",
      );

      if (imageInput) {
        imageInput.value = "";
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-emerald-900"
          >
            EquipRent<span className="text-amber-500">.</span>
          </Link>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Go back
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            Owner Dashboard
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Add New Equipment
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            List your equipment for customers to rent.
            Upload a clear image and provide accurate rental details.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              {success}
            </div>
          )}

          <form
            onSubmit={submitEquipment}
            className="mt-8 space-y-6"
          >
            <div>
              <label
                htmlFor="equipment-name"
                className="mb-2 block text-sm font-semibold"
              >
                Equipment Name *
              </label>

              <input
                id="equipment-name"
                name="name"
                required
                minLength={3}
                maxLength={120}
                value={form.name}
                onChange={updateField}
                placeholder="Canon EOS R50 Camera"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label
                htmlFor="equipment-description"
                className="mb-2 block text-sm font-semibold"
              >
                Description *
              </label>

              <textarea
                id="equipment-description"
                name="description"
                required
                rows={4}
                value={form.description}
                onChange={updateField}
                placeholder="Describe the equipment, its condition, and included accessories."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-700"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="equipment-category"
                  className="mb-2 block text-sm font-semibold"
                >
                  Category *
                </label>

                <select
                  id="equipment-category"
                  name="category"
                  value={form.category}
                  onChange={updateField}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-700"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="equipment-location"
                  className="mb-2 block text-sm font-semibold"
                >
                  Location *
                </label>

                <input
                  id="equipment-location"
                  name="location"
                  required
                  value={form.location}
                  onChange={updateField}
                  placeholder="Dhaka, Bangladesh"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label
                  htmlFor="rental-type"
                  className="mb-2 block text-sm font-semibold"
                >
                  Rental Type *
                </label>

                <select
                  id="rental-type"
                  name="rentalType"
                  value={form.rentalType}
                  onChange={updateField}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-700"
                >
                  <option value="daily">Daily</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="rental-price"
                  className="mb-2 block text-sm font-semibold"
                >
                  Rental Price (BDT) *
                </label>

                <input
                  id="rental-price"
                  name="rentalPrice"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={form.rentalPrice}
                  onChange={updateField}
                  placeholder="1500"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label
                  htmlFor="available-quantity"
                  className="mb-2 block text-sm font-semibold"
                >
                  Available Quantity *
                </label>

                <input
                  id="available-quantity"
                  name="availableQuantity"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={form.availableQuantity}
                  onChange={updateField}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="equipment-image"
                className="mb-2 block text-sm font-semibold"
              >
                Equipment Image *
              </label>

              <input
                id="equipment-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selectImage}
                required={!imageFile}
                className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm"
              />

              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG, or WebP. Maximum 5 MB.
              </p>

              {imagePreview && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  {/* Local image preview before upload */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Selected equipment preview"
                    className="h-64 w-full object-contain bg-slate-50"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Uploading image and saving equipment..."
                : "Submit Equipment"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          EquipRent — Equipment Rental Marketplace
        </p>
      </div>
    </main>
  );
}
