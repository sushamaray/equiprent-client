
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import BookingModal from "@/components/BookingModal";

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

const inputStyle =
  "mt-2 w-full min-w-0 rounded-xl border border-[#e0e8e1] bg-[#fafbf9] px-4 py-3 text-sm font-normal text-[#192321] outline-none transition focus:border-[#174f43] focus:bg-white focus:ring-2 focus:ring-[#174f43]/10";

function priceOf(item) {
  return Number(item.rentalPrice ?? item.pricePerDay ?? 0);
}

function formatPrice(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M4 7h16M7 12h10M10 17h4" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function EquipmentCard({ item, onBook }) {
  const available =
    item.availability !== false &&
    Number(item.availableQuantity ?? 1) > 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#e4ebe5] bg-white shadow-[0_4px_20px_rgba(20,45,35,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d2e0d5] hover:shadow-[0_16px_40px_rgba(20,45,35,0.10)]">
      <div className="relative h-56 overflow-hidden bg-[#eef1eb] sm:h-60">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#87968c]">
            Equipment image unavailable
          </div>
        )}

        <div className="absolute left-4 top-4">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-bold shadow-sm ${
              available
                ? "bg-white/95 text-[#174f43]"
                : "bg-white/95 text-red-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                available ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            {available
              ? `${item.availableQuantity ?? 1} available`
              : "Unavailable"}
          </span>
        </div>

        <div className="absolute bottom-4 right-4">
          <span className="rounded-full bg-[#174f43]/90 px-3 py-1.5 text-[10px] font-semibold capitalize text-white backdrop-blur-sm">
            {item.rentalType || "daily"} rental
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[1.4px] text-[#d97752]">
          {item.category}
        </p>

        <h3 className="mt-3 line-clamp-2 min-h-[52px] text-[19px] font-bold leading-snug tracking-tight text-[#192321]">
          {item.name}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#738078]">
          <LocationIcon />
          <span className="truncate">
            {item.location || "Location unavailable"}
          </span>
        </div>

        <p className="mt-4 line-clamp-2 min-h-[42px] text-xs leading-[1.8] text-[#68766d]">
          {item.description || "Explore this equipment for rental."}
        </p>

        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between gap-3 border-t border-[#edf0ec] pt-5">
            <div>
              <p className="text-[11px] font-medium text-[#78867c]">
                Starting from
              </p>

              <p className="mt-1 text-[24px] font-extrabold tracking-tight text-[#174f43]">
                {formatPrice(priceOf(item))}
              </p>

              <p className="text-[11px] text-[#78867c]">
                per {item.rentalType || "day"}
              </p>
            </div>

            <Link
              href={`/equipment/${item._id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#dce6dd] bg-[#f9fbf8] px-4 text-xs font-bold text-[#174f43] transition hover:border-[#174f43] hover:bg-[#edf4ef]"
            >
              View Details ↗
            </Link>
          </div>

          <button
            type="button"
            onClick={() => onBook(item)}
            disabled={!available}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#174f43] px-5 py-3 text-sm font-bold text-white shadow-[0_5px_15px_rgba(23,79,67,0.12)] transition hover:bg-[#236959] disabled:cursor-not-allowed disabled:bg-[#a8b5ac] disabled:shadow-none"
          >
            {available
              ? "Book This Equipment"
              : "Currently Unavailable"}
            {available && <span aria-hidden="true">↗</span>}
          </button>
        </div>
      </div>
    </article>
  );
}

function CatalogContent({ initialCategory }) {
  const [equipment, setEquipment] = useState([]);
  const [selected, setSelected] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
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
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      availability,
      sort,
    });

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (category !== "all") {
      params.set("category", category);
    }

    if (location.trim()) {
      params.set("location", location.trim());
    }

    if (rentalType !== "all") {
      params.set("rentalType", rentalType);
    }

    if (minPrice !== "") {
      params.set("minPrice", minPrice);
    }

    if (maxPrice !== "") {
      params.set("maxPrice", maxPrice);
    }

    fetch(`${API}/api/equipment?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

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

        setPagination(
          data.pagination || {
            total: 0,
            totalPages: 0,
          },
        );

        setError("");
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Failed to load equipment.",
        );
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
    refresh,
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function reload() {
    setLoading(true);
    setRefresh((value) => value + 1);
  }

  const hasFilters =
    search.trim() !== "" ||
    category !== "all" ||
    location.trim() !== "" ||
    rentalType !== "all" ||
    availability !== "true" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    sort !== "newest";

  const categoryOptions =
    category !== "all" && !CATEGORIES.includes(category)
      ? [category, ...CATEGORIES]
      : CATEGORIES;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f7f8f5] text-[#192321]">
        {/* PAGE INTRODUCTION */}
        <section className="relative overflow-hidden border-b border-[#e4ebe5] bg-[#f1f5ef]">
          <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full border-[70px] border-white/40" />

          <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-14 sm:px-7 sm:pb-16 sm:pt-16 lg:px-10">
            <div className="mb-7 flex items-center gap-2 text-xs font-medium text-[#77857a]">
              <Link
                href="/"
                className="transition hover:text-[#174f43]"
              >
                Home
              </Link>
              <span>/</span>
              <span className="font-semibold text-[#174f43]">
                All Equipment
              </span>
            </div>

            <p className="text-xs font-extrabold uppercase tracking-[2.5px] text-[#df704b]">
              Explore the marketplace
            </p>

            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.13] tracking-[-2px] sm:text-5xl lg:text-[58px]">
              Find the right equipment
              <span className="text-[#174f43]">.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#68776d] sm:text-base">
              Discover approved equipment from trusted listings.
              Search, compare rental options, and find the right
              tools for your next project.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#d9e6da] bg-white px-4 py-2 text-xs font-bold text-[#174f43]">
                {pagination.total} equipment listings
              </span>

              <span className="rounded-full border border-[#d9e6da] bg-white px-4 py-2 text-xs font-medium text-[#68776d]">
                Daily · Weekly · Monthly rentals
              </span>
            </div>
          </div>
        </section>

        {/* FILTERS */}
        <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-7 lg:px-10">
          <div className="rounded-[22px] border border-[#e3e9e3] bg-white p-5 shadow-[0_8px_30px_rgba(20,45,35,0.035)] sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf2ec] text-[#174f43]">
                  <FilterIcon />
                </span>

                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">
                    Search & Filter
                  </h2>

                  <p className="mt-1 text-xs text-[#89958b]">
                    Refine your equipment search
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasFilters}
                className="rounded-full border border-[#e0e8e1] px-4 py-2.5 text-xs font-bold text-[#174f43] transition hover:bg-[#edf4ef] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear all filters
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-xs font-semibold text-[#53635a]">
                Search Equipment

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-[#89988e]">
                    <SearchIcon />
                  </span>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      updateFilter(
                        setSearch,
                        event.target.value,
                      )
                    }
                    placeholder="Name or description..."
                    className={`${inputStyle} pl-11`}
                  />
                </div>
              </label>

              <label className="block text-xs font-semibold text-[#53635a]">
                Category

                <select
                  value={category}
                  onChange={(event) =>
                    updateFilter(
                      setCategory,
                      event.target.value,
                    )
                  }
                  className={inputStyle}
                >
                  <option value="all">All Categories</option>

                  {categoryOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-[#53635a]">
                Location

                <input
                  type="search"
                  value={location}
                  onChange={(event) =>
                    updateFilter(
                      setLocation,
                      event.target.value,
                    )
                  }
                  placeholder="Search by location..."
                  className={inputStyle}
                />
              </label>

              <label className="block text-xs font-semibold text-[#53635a]">
                Rental Type

                <select
                  value={rentalType}
                  onChange={(event) =>
                    updateFilter(
                      setRentalType,
                      event.target.value,
                    )
                  }
                  className={inputStyle}
                >
                  <option value="all">All Rental Types</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>

              <label className="block text-xs font-semibold text-[#53635a]">
                Availability

                <select
                  value={availability}
                  onChange={(event) =>
                    updateFilter(
                      setAvailability,
                      event.target.value,
                    )
                  }
                  className={inputStyle}
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                  <option value="all">All Equipment</option>
                </select>
              </label>

              <div className="block text-xs font-semibold text-[#53635a]">
                Price Range (BDT)

                <div className="mt-2 grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="0"
                    aria-label="Minimum price"
                    placeholder="Min price"
                    value={minPrice}
                    onChange={(event) =>
                      updateFilter(
                        setMinPrice,
                        event.target.value,
                      )
                    }
                    className="w-full min-w-0 rounded-xl border border-[#e0e8e1] bg-[#fafbf9] px-3 py-3 text-sm font-normal outline-none focus:border-[#174f43]"
                  />

                  <input
                    type="number"
                    min="0"
                    aria-label="Maximum price"
                    placeholder="Max price"
                    value={maxPrice}
                    onChange={(event) =>
                      updateFilter(
                        setMaxPrice,
                        event.target.value,
                      )
                    }
                    className="w-full min-w-0 rounded-xl border border-[#e0e8e1] bg-[#fafbf9] px-3 py-3 text-sm font-normal outline-none focus:border-[#174f43]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RESULTS AND SORTING */}
        <section className="mx-auto max-w-7xl px-5 pb-24 pt-12 sm:px-7 lg:px-10">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[2px] text-[#df704b]">
                Browse Equipment
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Explore our collection
                <span className="text-[#df704b]">.</span>
              </h2>

              <p className="mt-2 text-sm text-[#78867c]">
                Showing {equipment.length} of{" "}
                {pagination.total} listings
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-3 text-xs font-bold text-[#53635a]">
                Sort by

                <select
                  value={sort}
                  onChange={(event) =>
                    updateFilter(
                      setSort,
                      event.target.value,
                    )
                  }
                  className="min-h-11 rounded-xl border border-[#dce6de] bg-white px-4 py-2.5 text-sm font-semibold text-[#174f43] outline-none focus:border-[#174f43]"
                >
                  <option value="newest">
                    Recently Added
                  </option>

                  <option value="price-low">
                    Price: Low to High
                  </option>

                  <option value="price-high">
                    Price: High to Low
                  </option>

                  <option value="name">
                    Name: A to Z
                  </option>
                </select>
              </label>

              <button
                type="button"
                onClick={reload}
                disabled={loading}
                aria-label="Refresh equipment listings"
                className="min-h-11 rounded-xl border border-[#dce6de] bg-white px-4 py-2.5 text-xs font-bold text-[#174f43] transition hover:bg-[#edf4ef] disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              aria-label="Loading equipment"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[20px] border border-[#e4ebe5] bg-white"
                >
                  <div className="h-56 animate-pulse bg-[#e7ece7]" />

                  <div className="space-y-4 p-6">
                    <div className="h-3 w-28 animate-pulse rounded-full bg-[#e7ece7]" />
                    <div className="h-5 w-3/4 animate-pulse rounded-full bg-[#e7ece7]" />
                    <div className="h-3 w-1/2 animate-pulse rounded-full bg-[#e7ece7]" />
                    <div className="h-12 animate-pulse rounded-xl bg-[#e7ece7]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-[20px] border border-red-200 bg-red-50 px-6 py-14 text-center"
            >
              <h3 className="text-xl font-bold text-red-800">
                Unable to load equipment
              </h3>

              <p className="mt-3 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={reload}
                className="mt-6 rounded-xl bg-[#174f43] px-6 py-3 text-sm font-bold text-white"
              >
                Try Again
              </button>
            </div>
          ) : equipment.length === 0 ? (
            <div className="rounded-[20px] border border-[#e4ebe5] bg-white px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4ef] text-[#174f43]">
                <SearchIcon />
              </div>

              <h3 className="mt-5 text-xl font-bold">
                No equipment found
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#7a887e]">
                Try changing your search terms, category,
                location, price range, or availability filters.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-xl bg-[#174f43] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#236959]"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {equipment.map((item) => (
                <EquipmentCard
                  key={String(item._id)}
                  item={item}
                  onBook={setSelected}
                />
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {!loading &&
            !error &&
            pagination.totalPages > 1 && (
              <nav
                aria-label="Equipment pagination"
                className="mt-12 flex flex-wrap items-center justify-center gap-4"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    changePage(page - 1)
                  }
                  className="rounded-xl border border-[#dce6de] bg-white px-5 py-3 text-sm font-bold text-[#174f43] transition hover:bg-[#edf4ef] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>

                <span className="rounded-xl bg-[#eaf2ec] px-5 py-3 text-xs font-bold text-[#174f43]">
                  Page {page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    page >= pagination.totalPages
                  }
                  onClick={() =>
                    changePage(page + 1)
                  }
                  className="rounded-xl border border-[#dce6de] bg-white px-5 py-3 text-sm font-bold text-[#174f43] transition hover:bg-[#edf4ef] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </nav>
            )}
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[#e3e9e3] bg-white px-5 py-9">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="text-xl font-extrabold tracking-tight text-[#174f43]"
            >
              EquipRent
              <span className="text-[#df704b]">.</span>
            </Link>

            <p className="text-xs text-[#78867c]">
              © {new Date().getFullYear()} EquipRent.
              Equipment rental, made practical.
            </p>
          </div>
        </footer>
      </main>

      {/* EXISTING SHARED BOOKING MODAL */}
      <BookingModal
        equipment={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function CatalogFromQuery() {
  const searchParams = useSearchParams();

  const requestedCategory =
    searchParams.get("category") || "all";

  return (
    <CatalogContent
      key={requestedCategory}
      initialCategory={requestedCategory}
    />
  );
}

export default function EquipmentCatalog() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f8f5] p-10 text-center text-sm text-[#758079]">
          Loading equipment marketplace...
        </main>
      }
    >
      <CatalogFromQuery />
    </Suspense>
  );
}