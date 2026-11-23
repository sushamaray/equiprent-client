
"use client";

import Link from "next/link";

export default function Error({ reset }) {
  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#f7f8f5] px-4 py-16">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-4xl font-black text-red-600">
          !
        </div>

        <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">
          Something Went Wrong
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          We Hit a Small Bump
        </h1>

        <p className="mt-5 text-sm leading-7 text-slate-500">
          We could not load this page right now. Please try
          again. If the problem continues, return to the
          homepage.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-emerald-900 px-7 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}