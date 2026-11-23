
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

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

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

const INITIAL_FORM = {
  name: "",
  description: "",
  category: "Camera",
  location: "",
  brand: "",
  model: "",
  condition: "good",
  rentalType: "daily",
  rentalPrice: "",
  availableQuantity: "1",
  rentalTerms: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[#dfe7df] bg-[#fbfcfa] px-4 py-3.5 text-sm text-[#192321] outline-none transition placeholder:text-[#9ba89d] focus:border-[#174f43] focus:ring-2 focus:ring-[#174f43]/10 disabled:opacity-60";

function SectionHeading({ number, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ec] text-xs font-extrabold text-[#174f43]">
        {number}
      </div>

      <div>
        <h2 className="text-lg font-extrabold tracking-tight text-[#192321] sm:text-xl">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-6 text-[#78877d]">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({ label, required = false, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#26372c]">
        {label}
        {required && (
          <span className="ml-1 text-[#df704b]">*</span>
        )}
      </label>

      {children}
    </div>
  );
}

function FileIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

export default function AddEquipmentPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");

  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

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

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

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
      setError(
        "Please select a JPG, PNG, or WebP image.",
      );

      setImageFile(null);
      setImagePreview("");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");

      setImageFile(null);
      setImagePreview("");
      event.target.value = "";
      return;
    }

    const preview = URL.createObjectURL(file);

    previewUrlRef.current = preview;
    setImageFile(file);
    setImagePreview(preview);
  }

  async function getAccessToken() {
    const response = await fetch(
      `${API_URL}/api/auth/token`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("AUTH_REQUIRED");
    }

    const data = await response
      .json()
      .catch(() => ({}));

    if (!data.token) {
      throw new Error("AUTH_REQUIRED");
    }

    return data.token;
  }

  async function submitEquipment(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    if (!imageFile) {
      setError("Please select an equipment image.");
      return;
    }

    const price = Number(form.rentalPrice);
    const quantity = Number(form.availableQuantity);

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isSafeInteger(Math.round(price * 100))
    ) {
      setError(
        "Rental price must be a valid amount greater than zero.",
      );
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      setError(
        "Available quantity must be at least 1.",
      );
      return;
    }

    if (
      !["daily", "weekly", "monthly"].includes(
        form.rentalType,
      )
    ) {
      setError("Please select a valid rental type.");
      return;
    }

    setLoading(true);

    try {
      const token = await getAccessToken();

      // Step 1: Upload equipment image to ImgBB
      // through the existing protected backend.
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

      if (
        !uploadResponse.ok ||
        !uploadData.image?.url
      ) {
        throw new Error(
          uploadData.message ||
            "Equipment image upload failed.",
        );
      }

      // Step 2: Create a pending equipment listing.
      // The backend identifies the Owner from JWT.
      const equipmentPayload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        condition: form.condition,
        rentalType: form.rentalType,
        rentalPrice: price,
        availableQuantity: quantity,
        rentalTerms: form.rentalTerms.trim(),
        image: uploadData.image.url,
      };

      // Backend validation accepts optional text
      // fields only when they contain text.
      if (!equipmentPayload.brand) {
        delete equipmentPayload.brand;
      }

      if (!equipmentPayload.model) {
        delete equipmentPayload.model;
      }

      if (!equipmentPayload.rentalTerms) {
        delete equipmentPayload.rentalTerms;
      }

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
          createData.message ||
            "Could not create equipment.",
        );
      }

      setSuccess(
        "Equipment submitted successfully! Your listing is pending Admin approval.",
      );

      setForm({ ...INITIAL_FORM });
      setImageFile(null);
      setImagePreview("");

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (cause) {
      if (cause?.message === "AUTH_REQUIRED") {
        router.push(
          `/sign-in?returnTo=${encodeURIComponent(
            "/dashboard/owner/add-equipment",
          )}`,
        );
        return;
      }

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
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f7f8f5] text-[#192321]">
        <div className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-7 lg:px-10">
          {/* BREADCRUMB */}
          <nav
            aria-label="Breadcrumb"
            className="mb-9 flex flex-wrap items-center gap-2 text-xs text-[#78877d]"
          >
            <Link
              href="/"
              className="hover:text-[#174f43]"
            >
              Home
            </Link>

            <span>/</span>

            <Link
              href="/dashboard/owner"
              className="hover:text-[#174f43]"
            >
              Owner Dashboard
            </Link>

            <span>/</span>

            <span className="font-bold text-[#174f43]">
              Add Equipment
            </span>
          </nav>

          {/* PAGE HEADING */}
          <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[2.5px] text-[#df704b]">
                Owner Dashboard
              </p>

              <h1 className="mt-4 text-3xl font-extrabold tracking-[-1.5px] sm:text-5xl">
                Add New Equipment
                <span className="text-[#df704b]">
                  .
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#728077]">
                Create your equipment listing, upload a
                clear photo, and set the rental terms.
                Every new listing requires Admin approval
                before appearing in the marketplace.
              </p>
            </div>

            <Link
              href="/dashboard/owner/equipment"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#dce6de] bg-white px-5 text-sm font-bold text-[#174f43] transition hover:bg-[#edf4ef]"
            >
              My Equipment
            </Link>
          </div>

          {/* OWNER NAVIGATION */}
          <nav
            aria-label="Owner dashboard navigation"
            className="mb-9 flex flex-wrap gap-3"
          >
            <Link
              href="/dashboard/owner"
              className="rounded-xl border border-[#dce6de] bg-white px-5 py-3 text-xs font-bold text-[#174f43] transition hover:bg-[#edf4ef]"
            >
              Overview
            </Link>

            <Link
              href="/dashboard/owner/add-equipment"
              aria-current="page"
              className="rounded-xl bg-[#174f43] px-5 py-3 text-xs font-bold text-white"
            >
              Add Equipment
            </Link>

            <Link
              href="/dashboard/owner/equipment"
              className="rounded-xl border border-[#dce6de] bg-white px-5 py-3 text-xs font-bold text-[#174f43] transition hover:bg-[#edf4ef]"
            >
              My Equipment
            </Link>

            <Link
              href="/dashboard/owner/rentals"
              className="rounded-xl border border-[#dce6de] bg-white px-5 py-3 text-xs font-bold text-[#174f43] transition hover:bg-[#edf4ef]"
            >
              Equipment Rentals
            </Link>
          </nav>

          {/* FEEDBACK */}
          {error && (
            <div
              role="alert"
              className="mb-7 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-7 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800"
            >
              {success}

              <div className="mt-3">
                <Link
                  href="/dashboard/owner/equipment"
                  className="text-sm font-bold underline"
                >
                  View My Equipment
                </Link>
              </div>
            </div>
          )}

          {/* EQUIPMENT FORM */}
          <form
            onSubmit={submitEquipment}
            className="space-y-6"
          >
            {/* BASIC INFORMATION */}
            <section className="rounded-[24px] border border-[#e2eae3] bg-white p-6 shadow-[0_8px_30px_rgba(20,45,35,0.035)] sm:p-9">
              <SectionHeading
                number="01"
                title="Basic Information"
                description="Tell customers what equipment you are offering."
              />

              <div className="space-y-6">
                <Field
                  label="Equipment Name"
                  required
                >
                  <input
                    name="name"
                    type="text"
                    required
                    minLength={3}
                    maxLength={120}
                    value={form.name}
                    onChange={updateField}
                    placeholder="Canon EOS R50 Camera"
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Description"
                  required
                >
                  <textarea
                    name="description"
                    required
                    minLength={10}
                    rows={5}
                    value={form.description}
                    onChange={updateField}
                    placeholder="Describe the equipment, features, included accessories and any important information."
                    className={`${inputClass} resize-y`}
                  />
                </Field>

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field
                    label="Category"
                    required
                  >
                    <select
                      name="category"
                      required
                      value={form.category}
                      onChange={updateField}
                      className={inputClass}
                    >
                      {CATEGORIES.map((category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Location"
                    required
                  >
                    <input
                      name="location"
                      type="text"
                      required
                      maxLength={150}
                      value={form.location}
                      onChange={updateField}
                      placeholder="Dhaka, Bangladesh"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Brand">
                    <input
                      name="brand"
                      type="text"
                      maxLength={100}
                      value={form.brand}
                      onChange={updateField}
                      placeholder="Canon"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Model">
                    <input
                      name="model"
                      type="text"
                      maxLength={100}
                      value={form.model}
                      onChange={updateField}
                      placeholder="EOS R50"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field
                  label="Condition"
                  required
                >
                  <select
                    name="condition"
                    required
                    value={form.condition}
                    onChange={updateField}
                    className={inputClass}
                  >
                    {CONDITIONS.map((condition) => (
                      <option
                        key={condition.value}
                        value={condition.value}
                      >
                        {condition.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            {/* RENTAL INFORMATION */}
            <section className="rounded-[24px] border border-[#e2eae3] bg-white p-6 shadow-[0_8px_30px_rgba(20,45,35,0.035)] sm:p-9">
              <SectionHeading
                number="02"
                title="Rental Information"
                description="Set the rental period, pricing and available quantity."
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label="Rental Type"
                  required
                >
                  <select
                    name="rentalType"
                    required
                    value={form.rentalType}
                    onChange={updateField}
                    className={inputClass}
                  >
                    <option value="daily">
                      Daily
                    </option>

                    <option value="weekly">
                      Weekly
                    </option>

                    <option value="monthly">
                      Monthly
                    </option>
                  </select>
                </Field>

                <Field
                  label={`Rental Price (BDT / ${form.rentalType})`}
                  required
                >
                  <input
                    name="rentalPrice"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.rentalPrice}
                    onChange={updateField}
                    placeholder={
                      form.rentalType === "daily"
                        ? "1200"
                        : form.rentalType === "weekly"
                          ? "7500"
                          : "25000"
                    }
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Available Quantity"
                  required
                >
                  <input
                    name="availableQuantity"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={form.availableQuantity}
                    onChange={updateField}
                    className={inputClass}
                  />
                </Field>

                <div className="flex items-center rounded-xl border border-[#e2ebe3] bg-[#f4f8f4] p-4">
                  <p className="text-xs leading-6 text-[#687b6d]">
                    Pricing is in BDT. Customers will
                    see this rate for the selected
                    rental period.
                  </p>
                </div>
              </div>
            </section>

            {/* RENTAL TERMS */}
            <section className="rounded-[24px] border border-[#e2eae3] bg-white p-6 shadow-[0_8px_30px_rgba(20,45,35,0.035)] sm:p-9">
              <SectionHeading
                number="03"
                title="Rental Terms"
                description="Explain the rental rules and any special conditions."
              />

              <Field label="Rental Terms and Conditions">
                <textarea
                  name="rentalTerms"
                  rows={5}
                  value={form.rentalTerms}
                  onChange={updateField}
                  placeholder="Example: Return equipment in the same condition. Keep all accessories together. Contact the owner before extending the rental period."
                  className={`${inputClass} resize-y`}
                />
              </Field>

              <p className="mt-3 text-xs leading-6 text-[#829087]">
                This information will appear on the
                public Equipment Details page after
                approval.
              </p>
            </section>

            {/* IMAGE UPLOAD */}
            <section className="rounded-[24px] border border-[#e2eae3] bg-white p-6 shadow-[0_8px_30px_rgba(20,45,35,0.035)] sm:p-9">
              <SectionHeading
                number="04"
                title="Equipment Image"
                description="Upload a clear photo so customers can identify the item."
              />

              <label
                htmlFor="equipment-image"
                className="block cursor-pointer rounded-[20px] border-2 border-dashed border-[#d5e2d7] bg-[#fafcf9] p-8 text-center transition hover:border-[#174f43] hover:bg-[#f1f7f2]"
              >
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf3ec] text-[#174f43]">
                  <FileIcon />
                </span>

                <span className="mt-4 block text-sm font-bold text-[#174f43]">
                  {imageFile
                    ? imageFile.name
                    : "Choose Equipment Image"}
                </span>

                <span className="mt-2 block text-xs text-[#819086]">
                  JPG, PNG or WebP · Maximum 5 MB
                </span>

                <input
                  id="equipment-image"
                  ref={fileInputRef}
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={selectImage}
                  required={!imageFile}
                  className="sr-only"
                />
              </label>

              {imagePreview && (
                <div className="mt-6 overflow-hidden rounded-[20px] border border-[#e2eae3] bg-[#f4f7f2]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Selected equipment preview"
                    className="h-72 w-full object-contain p-4"
                  />

                  <div className="border-t border-[#e2eae3] bg-white px-5 py-3 text-xs text-[#738177]">
                    Image preview · Uploaded when
                    you submit the listing
                  </div>
                </div>
              )}
            </section>

            {/* SUBMIT ACTION */}
            <section className="rounded-[24px] border border-[#e2eae3] bg-white p-6 shadow-[0_8px_30px_rgba(20,45,35,0.035)] sm:p-9">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-extrabold">
                    Ready to publish?
                  </h2>

                  <p className="mt-2 max-w-md text-xs leading-6 text-[#78877d]">
                    Your equipment will be saved
                    as pending. An Admin must
                    approve it before customers can
                    see or rent it.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-14 items-center justify-center rounded-xl bg-[#174f43] px-8 py-4 text-sm font-bold text-white shadow-[0_7px_18px_rgba(23,79,67,0.15)] transition hover:bg-[#236959] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Uploading and saving..."
                    : "Submit Equipment"}
                </button>
              </div>
            </section>
          </form>
        </div>
      </main>
    </>
  );
}