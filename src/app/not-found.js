
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#f7f8f5] px-4 py-16">
      <div className="w-full max-w-2xl text-center">
        <div className="relative inline-flex items-center justify-center">
          <span className="text-[110px] font-black leading-none tracking-tighter text-emerald-950 sm:text-[160px]">
            404
          </span>

          <span className="absolute -right-5 -top-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-2xl font-black text-emerald-950 shadow-lg">
            ?
          </span>
        </div>

        <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">
          Page Not Found
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Looks Like You Took a Wrong Turn
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
          The page you are looking for does not exist or may
          have been moved. Explore our equipment marketplace
          to find what you need.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-emerald-900 px-7 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            Back to Homepage
          </Link>

          <Link
            href="/equipment"
            className="rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Browse Equipment
          </Link>
        </div>

        <p className="mt-12 text-sm font-black tracking-tight text-emerald-900">
          EquipRent<span className="text-amber-500">.</span>
        </p>
      </div>
    </main>
  );
}