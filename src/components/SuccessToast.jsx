
"use client";

export default function SuccessToast({ message }) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-5 z-[200] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-[#cce5d8] bg-white px-5 py-4 text-sm font-semibold text-[#174f43] shadow-[0_18px_60px_rgba(23,79,67,0.18)] sm:right-6"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e5f5eb]">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
      </span>
      <span>{message}</span>
    </div>
  );
}