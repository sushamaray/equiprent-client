
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const PAGE_SIZE = 9;

function priceOf(item) {
  return Number(item.rentalPrice ?? item.pricePerDay ?? 0);
}

export default function EquipmentCatalog() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("");
  const [rentalType, setRentalType] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/api/equipment?page=1&limit=50`, {
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

        setEquipment(
          Array.isArray(data.data) ? data.data : [],
        );
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;

        setError(
          cause.message || "Failed to load equipment.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const categories = useMemo(
    () =>
      [...new Set(equipment.map((item) => item.category).filter(Boolean))]
        .sort(),
    [equipment],
  );

  const filteredEquipment = useMemo(() => {
    let result = [...equipment];

    const query = search.trim().toLowerCase();
    const locationQuery = location.trim().toLowerCase();

    if (query) {
      result = result.filter((item) =>
        [
          item.name,
          item.description,
          item.category,
          item.brand,
          item.model,
        ]
          .filter(Boolean)
          .some((value) =>
            value.toLowerCase().includes(query),
          ),
      );
    }

    if (category !== "all") {
      result = result.filter(
        (item) => item.category === category,
      );
    }

    if (locationQuery) {
      result = result.filter((item) =>
        (item.location || "")
          .toLowerCase()
          .includes(locationQuery),
      );
    }

    if (rentalType !== "all") {
      result = result.filter(
        (item) => (item.rentalType || "daily") === rentalType,
      );
    }

    if (sort === "price-low") {
      result.sort((a, b) => priceOf(a) - priceOf(b));
    }

    if (sort === "price-high") {
      result.sort((a, b) => priceOf(b) - priceOf(a));
    }

    if (sort === "name") {
      result.sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    }

    if (sort === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0),
      );
    }

    return result;
  }, [equipment, search, category, location, rentalType, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEquipment.length / PAGE_SIZE),
  );

  const currentItems = filteredEquipment.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function resetFilters() {
    setSearch("");
    setCategory("all");
    setLocation("");
    setRentalType("all");
    setSort("newest");
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#192321]">
      <header className="sticky top-0 z-10 border-b border-[#e3e8e3] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-[#174f43]"
          >
            EquipRent<span className="text-[#df704b]">.</span>
          </Link>

          <div className="flex items-center gap-5 text-sm font-semibold">
            <Link href="/" className="text-slate-600 hover:text-emerald-800">
              Home
            </Link>
            <Link
              href="/my-rentals"
              className="text-slate-600 hover:text-emerald-800"
            >
              My Rentals
            </Link>
            <Link
              href="/sign-in"
              className="text-[#174f43] hover:underline"
            >
              Sign In
            </Link>
          </div>
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
              Browse approved equipment, compare rental options,
              and find the right equipment for your next project.
            </p>
          </div>

          <span className="text-sm font-semibold text-[#174f43]">
            {filteredEquipment.length} equipment listings
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold text-slate-600">
              Search
              <input
                type="search"
                placeholder="Search equipment..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal outline-none focus:border-[#174f43]"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Category
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal outline-none focus:border-[#174f43]"
              >
                <option value="all">All Categories</option>
                {categories.map((item) => (
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
                placeholder="Enter location..."
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setPage(1);
                }}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal outline-none focus:border-[#174f43]"
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Rental Type
              <select
                value={rentalType}
                onChange={(event) => {
                  setRentalType(event.target.value);
                  setPage(1);
                }}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3 text-sm font-normal outline-none focus:border-[#174f43]"
              >
                <option value="all">All Rental Types</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-500">
              Showing {currentItems.length} of {filteredEquipment.length} results
            </p>

            <label className="flex items-center gap-3 text-xs font-semibold">
              Sort by
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="newest">Newest</option>
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
        ) : currentItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
            <h2 className="text-xl font-bold">
              No equipment found
            </h2>
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
            {currentItems.map((item) => (
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
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}

                  <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-2 text-[10px] font-bold text-emerald-800 shadow-sm">
                    {item.availableQuantity ?? 1} available
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
                      className="rounded-xl bg-[#174f43] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#236959]"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setPage((value) => value - 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm font-semibold text-slate-600">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                setPage((value) => value + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
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