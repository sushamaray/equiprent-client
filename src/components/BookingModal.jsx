
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const emptyForm = {
  startDate: "",
  endDate: "",
  quantity: 1,
  contactNumber: "",
  deliveryAddress: "",
  additionalNotes: "",
};

function localToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BookingModal({ equipment, onClose }) {
  const router = useRouter();

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const today = localToday();

  useEffect(() => {
    if (!equipment) return;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [equipment, onClose]);

  if (!equipment) return null;

  const availableQuantity = Math.max(
    0,
    Number(equipment.availableQuantity ?? 1),
  );

  function change(field, value) {
    setForm((previous) => {
      if (field === "startDate" && previous.endDate < value) {
        return {
          ...previous,
          startDate: value,
          endDate: "",
        };
      }

      return { ...previous, [field]: value };
    });
  }

  async function submit(event) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      if (
        form.startDate < today ||
        form.endDate < form.startDate
      ) {
        throw new Error("Please select valid future rental dates.");
      }

      const quantity = Number(form.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > availableQuantity
      ) {
        throw new Error("Please select a valid rental quantity.");
      }

      const tokenResponse = await fetch(
        `${API}/api/auth/token`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      const tokenData = await tokenResponse
        .json()
        .catch(() => ({}));

      if (!tokenResponse.ok || !tokenData.token) {
        router.push(
          `/sign-in?returnTo=${encodeURIComponent(
            `/equipment/${equipment._id}`,
          )}`,
        );
        return;
      }

      const response = await fetch(
        `${API}/api/payments/checkout-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenData.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            equipmentId: equipment._id,
            startDate: form.startDate,
            endDate: form.endDate,
            quantity,
            contactNumber: form.contactNumber.trim(),
            deliveryAddress: form.deliveryAddress.trim(),
            additionalNotes: form.additionalNotes.trim(),
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.checkout?.url) {
        throw new Error(
          data.message || "Unable to start secure checkout.",
        );
      }

      const checkoutURL = new URL(data.checkout.url);

      if (
        checkoutURL.protocol !== "https:" ||
        !(
          checkoutURL.hostname === "checkout.stripe.com" ||
          checkoutURL.hostname.endsWith(".checkout.stripe.com")
        )
      ) {
        throw new Error("Unexpected payment destination.");
      }

      window.location.assign(checkoutURL.href);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Booking request failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitting
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="rental-modal-title"
        className="relative my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#f8f9f6] p-6 shadow-2xl sm:p-9"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close booking form"
          className="absolute right-5 top-4 rounded-lg px-3 py-1 text-3xl text-slate-500 hover:bg-slate-200 disabled:opacity-50"
        >
          ×
        </button>

        <p className="pr-10 text-xs font-bold uppercase tracking-[2px] text-[#df704b]">
          Reserve Equipment
        </p>

        <h2
          id="rental-modal-title"
          className="mt-5 pr-8 text-2xl font-extrabold text-[#192321] sm:text-3xl"
        >
          {equipment.name}
        </h2>

        <p className="mt-3 text-sm text-slate-500">
          Your rental total is calculated securely by the server.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <form
          onSubmit={submit}
          className="mt-7 grid gap-5 sm:grid-cols-2"
        >
          <label className="text-sm font-semibold text-[#192321]">
            Rental start date
            <input
              required
              type="date"
              min={today}
              value={form.startDate}
              onChange={(event) =>
                change("startDate", event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-700"
            />
          </label>

          <label className="text-sm font-semibold text-[#192321]">
            Rental end date
            <input
              required
              type="date"
              min={form.startDate || today}
              value={form.endDate}
              onChange={(event) =>
                change("endDate", event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-700"
            />
          </label>

          <label className="text-sm font-semibold text-[#192321]">
            Required quantity
            <input
              required
              type="number"
              min="1"
              max={availableQuantity}
              value={form.quantity}
              onChange={(event) =>
                change("quantity", event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-700"
            />
          </label>

          <label className="text-sm font-semibold text-[#192321]">
            Contact number
            <input
              required
              type="tel"
              minLength={6}
              maxLength={30}
              value={form.contactNumber}
              onChange={(event) =>
                change("contactNumber", event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-700"
            />
          </label>

          <label className="text-sm font-semibold text-[#192321] sm:col-span-2">
            Delivery address
            <textarea
              required
              rows={2}
              minLength={5}
              maxLength={500}
              value={form.deliveryAddress}
              onChange={(event) =>
                change("deliveryAddress", event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-700"
            />
          </label>

          <label className="text-sm font-semibold text-[#192321] sm:col-span-2">
            Additional notes (optional)
            <textarea
              rows={2}
              maxLength={1000}
              value={form.additionalNotes}
              onChange={(event) =>
                change("additionalNotes", event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-700"
            />
          </label>

          <button
            type="submit"
            disabled={submitting || availableQuantity < 1}
            className="rounded-xl bg-[#174f43] px-6 py-4 text-sm font-bold text-white hover:bg-[#236959] disabled:opacity-50 sm:col-span-2"
          >
            {submitting
              ? "Preparing secure checkout..."
              : availableQuantity < 1
                ? "Currently unavailable"
                : "Continue to secure payment →"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          Booking is created only after Stripe confirms payment.
        </p>
      </section>
    </div>
  );
}