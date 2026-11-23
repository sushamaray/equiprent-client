
export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-[75vh] flex-col items-center justify-center bg-[#f7f8f5] px-4 text-center"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-800" />

        <span className="text-2xl font-black tracking-tight text-emerald-950">
          E<span className="text-amber-500">.</span>
        </span>
      </div>

      <h1 className="mt-8 text-2xl font-black text-emerald-950">
        Preparing Your Experience
      </h1>

      <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
        We are getting everything ready for your equipment rental
        experience.
      </p>

      <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
        Loading EquipRent...
      </p>
    </main>
  );
}