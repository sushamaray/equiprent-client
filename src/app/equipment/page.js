
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const PAGE_SIZE = 9;

const CATEGORIES = [
  "Construction Equipment",
  "Photography Equipment",
  "Vehicles & Transportation",
  "Agriculture Equipment",
  "Electronics",
  "Event Equipment",
  "Camera",
  "Tools",
];

function priceOf(item) {
  return Number(item.rentalPrice ?? item.pricePerDay ?? 0);
}

export default function EquipmentCatalog() {
  const [equipment, setEquipment] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("");
  const [rentalType, setRentalType] = useState("all");
  const [availability, setAvailability] = useState("true");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      availability,
      sort,
    });

    if (search.trim()) params.set("search", search.trim());
    if (category !== "all") params.set("category", category);
    if (location.trim()) params.set("location", location.trim());
    if (rentalType !== "all") params.set("rentalType", rentalType);
    if (minPrice !== "") params.set("minPrice", minPrice);
    if (maxPrice !== "") params.set("maxPrice", maxPrice);

    fetch(`${API}/api/equipment?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load equipment.",
          );
        }

        return data;
      })
      .then((data) => {
        if (controller.signal.aborted) return;

        setEquipment(Array.isArray(data.data) ? data.data : []);
        setPagination(data.pagination || {
          total: 0,
          totalPages: 0,
        });
        setError("");
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;

        setError(cause.message || "Failed to load equipment.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    search,
    category,
    location,
    rentalType,
    availability,
    minPrice,
    maxPrice,
    sort,
    page,
  ]);

  function updateFilter(setter, value) {
    setLoading(true);
    setter(value);
    setPage(1);
  }

  function resetFilters() {
    setLoading(true);
    setSearch("");
    setCategory("all");
    setLocation("");
    setRentalType("all");
    setAvailability("true");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
  }

  function changePage(nextPage) {
    setLoading(true);
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#192321]">
      <header className="sticky top-0 z-20 border-b border-[#e3e8e3] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-[#174f43]"
          >
            EquipRent<span className="text-[#df704b]">.</span>
          </Link>

          <nav className="flex items-center gap-5 text-sm font-semibold">
            <Link href="/" className="text-slate-600 hover:text-emerald-800">
              Home
            </Link>
            <Link href="/my-rentals" className="text-slate-600 hover:text-emerald-800">
              My Rentals
            </Link>
            <Link href="/sign-in" className="text-[#174f43] hover:underline">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-8 pt-14">
        <p className="text-xs font-bold tracking-[2px] text-[#d97752]">
          EXPLORE EQUIPMENT
        </p>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Find what you need.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#758079]">
              Browse verified equipment listings and find the
              right rental for your next project.
            </p>
          </div>

          <span className="text-sm font-semibold text-[#174f43]">
            {pagination.total} listings found
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-5">
        <div className="rounded-2xl border border-[#e3e8e3] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Find Equipment</h2>

            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-semibold text-[#174f43] hover:underline"
            >
              Clear all filters
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-semibold text-slate-600">
              Search by name or description
              <input
                type="search"
                value={search}
                onChange={(e) => updateFilter(setSearch, e.target.value)}
                placeholder="Search equipment..."
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal outline-none focus:border-[#174f43]"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Category
              <select
                value={category}
                onChange={(e) => updateFilter(setCategory, e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Location
              <input
                type="search"
                value={location}
                onChange={(e) => updateFilter(setLocation, e.target.value)}
                placeholder="Enter location..."
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Rental Type
              <select
                value={rentalType}
                onChange={(e) => updateFilter(setRentalType, e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal"
              >
                <option value="all">All Rental Types</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Availability
              <select
                value={availability}
                onChange={(e) => updateFilter(setAvailability, e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal"
              >
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
                <option value="all">All Equipment</option>
              </select>
            </label>

            <div className="text-xs font-semibold text-slate-600">
              Price Range (BDT)
              <div className="mt-2 grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Min price"
                  value={minPrice}
                  onChange={(e) => updateFilter(setMinPrice, e.target.value)}
                  className="min-w-0 rounded-xl border border-slate-200 bg-[#fafbf9] px-3 py-3 text-sm font-normal"
                />

                <input
                  type="number"
                  min="0"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={(e) => updateFilter(setMaxPrice, e.target.value)}
                  className="min-w-0 rounded-xl border border-slate-200 bg-[#fafbf9] px-3 py-3 text-sm font-normal"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-500">
              Showing {equipment.length} of {pagination.total} results
            </p>

            <label className="flex items-center gap-3 text-xs font-semibold">
              Sort by
              <select
                value={sort}
                onChange={(e) => updateFilter(setSort, e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="newest">Recently Added</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-7">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
            {error}
          </div>
        ) : equipment.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
            <h2 className="text-xl font-bold">No equipment found</h2>

            <p className="mt-3 text-sm text-slate-500">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-xl bg-[#174f43] px-6 py-3 text-sm font-semibold text-white"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.map((item) => (
              <article
                key={item._id}
                className="overflow-hidden rounded-2xl border border-[#e5eae5] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-56 bg-[#edf0eb]">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}

                  <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-2 text-[10px] font-bold text-emerald-800 shadow-sm">
                    {item.availability
                      ? `${item.availableQuantity ?? 1} available`
                      : "Unavailable"}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#d97752]">
                    {item.category} · {item.location}
                  </p>

                  <h3 className="mt-2 line-clamp-1 text-lg font-bold">
                    {item.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
                    {item.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xl font-bold text-[#174f43]">
                        ৳{priceOf(item).toLocaleString("en-BD")}
                      </p>

                      <p className="text-[10px] text-slate-500">
                        per {item.rentalType || "day"}
                      </p>
                    </div>

                    <Link
                      href={`/equipment/${item._id}`}
                      className="rounded-xl bg-[#174f43] px-4 py-3 text-xs font-bold text-white hover:bg-[#236959]"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && pagination.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => changePage(page - 1)}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm font-semibold text-slate-600">
              {page} / {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => changePage(page + 1)}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>

      <footer className="border-t border-[#e3e8e3] bg-white px-5 py-8 text-center text-xs text-slate-500">
        EquipRent · Equipment Rental Marketplace
      </footer>
    </main>
  );
}