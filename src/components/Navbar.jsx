
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const navigation = [
  {
    href: "/",
    label: "Home",
    icon: "home",
  },
  {
    href: "/equipment",
    label: "All Equipment",
    icon: "equipment",
  },
  {
    href: "/#how-it-works",
    label: "How It Works",
    icon: "steps",
  },
  {
    href: "/#about",
    label: "About Us",
    icon: "about",
  },
];

function dashboardPath(role) {
  if (role === "admin") return "/dashboard/admin";
  if (role === "owner") return "/dashboard/owner";
  return "/my-rentals";
}

function activeLink(pathname, href) {
  if (href === "/") return pathname === "/";
  if (href.includes("#")) return false;

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

function Icon({
  name,
  size = 18,
  strokeWidth = 1.8,
}) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "home") {
    return (
      <svg {...shared}>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
        <path d="M9 21v-8h6v8" />
      </svg>
    );
  }

  if (name === "equipment") {
    return (
      <svg {...shared}>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" />
      </svg>
    );
  }

  if (name === "steps") {
    return (
      <svg {...shared}>
        <circle cx="5" cy="5" r="2" />
        <circle cx="19" cy="12" r="2" />
        <circle cx="5" cy="19" r="2" />
        <path d="M7 5h7a5 5 0 0 1 5 5M17 12h-7a5 5 0 0 0-5 5" />
      </svg>
    );
  }

  if (name === "about") {
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
    );
  }

  if (name === "dashboard") {
    return (
      <svg {...shared}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg {...shared}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </svg>
    );
  }

  if (name === "login") {
    return (
      <svg {...shared}>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </svg>
    );
  }

  if (name === "arrow") {
    return (
      <svg {...shared}>
        <path d="M7 17 17 7M8 7h9v9" />
      </svg>
    );
  }

  if (name === "menu") {
    return (
      <svg {...shared}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg {...shared}>
        <path d="M5 5 19 19M19 5 5 19" />
      </svg>
    );
  }

  return null;
}

function Brand() {
  return (
    <Link
      href="/"
      aria-label="EquipRent Home"
      className="group flex shrink-0 items-center gap-3"
    >
      {/* New Home Icon Logo */}
      <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#174f43] text-white shadow-[0_6px_18px_rgba(23,79,67,0.18)] transition duration-300 group-hover:-rotate-6 group-hover:bg-[#236959]">
        <Icon
          name="home"
          size={25}
          strokeWidth={1.65}
        />
      </span>

      <span
        className="text-[23px] font-extrabold tracking-[-1.5px] text-[#174f43] sm:text-[25px]"
        style={{
          fontFamily:
            '"Segoe UI", Inter, Arial, sans-serif',
        }}
      >
        EquipRent
        <span className="text-[#df704b]">.</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch(
          `${API}/api/auth/get-session`,
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Unable to fetch session.");
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setUser(data?.user || null);
        }
      } catch {
        if (!controller.signal.aborted) {
          setUser(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => controller.abort();
  }, [pathname]);

  async function logout() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const response = await fetch(
        `${API}/api/auth/sign-out`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      if (!response.ok) {
        throw new Error("Sign out failed.");
      }

      setUser(null);
      setMenuOpen(false);

      router.replace("/");
      router.refresh();
    } catch {
      window.alert(
        "Could not sign out. Please try again.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const dashboard = dashboardPath(user?.role);

  const mobileLinks = user
    ? [
        ...navigation,
        {
          href: dashboard,
          label: "Dashboard",
          icon: "dashboard",
        },
        {
          href: "/dashboard/profile",
          label: "My Profile",
          icon: "about",
        },
      ]
    : navigation;

  return (
    <>
      <div
        aria-hidden="true"
        className="h-[82px] shrink-0"
      />

      <header className="fixed inset-x-0 top-0 z-[90] border-b border-[#e5ebe5] bg-[#fbfcfa]/95 shadow-[0_8px_35px_rgba(15,49,35,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex h-[82px] max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-7 xl:px-10">
          <Brand />

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 rounded-[18px] border border-[#e6ede7] bg-[#f2f6f1] p-1.5 xl:flex"
          >
            {navigation.map((item) => {
              const active = activeLink(
                pathname,
                item.href,
              );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    active ? "page" : undefined
                  }
                  className={`group relative inline-flex h-11 items-center gap-2 rounded-[13px] px-4 text-[12px] font-bold tracking-[-0.1px] transition-all duration-200 ${
                    active
                      ? "bg-white text-[#174f43] shadow-[0_3px_12px_rgba(23,79,67,0.09)]"
                      : "text-[#627469] hover:bg-white/80 hover:text-[#174f43]"
                  }`}
                >
                  <span
                    className={`transition ${
                      active
                        ? "text-[#174f43]"
                        : "text-[#879a8b] group-hover:text-[#174f43]"
                    }`}
                  >
                    <Icon name={item.icon} size={16} />
                  </span>

                  {item.label}

                  {active && (
                    <span className="absolute bottom-1 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[#df704b]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden shrink-0 items-center gap-2 xl:flex">
            {loading ? (
              <div className="h-11 w-44 animate-pulse rounded-xl bg-[#e7ece8]" />
            ) : user ? (
              <>
                <Link
                  href={dashboard}
                  className="group inline-flex h-11 items-center gap-2.5 rounded-[13px] bg-[#174f43] px-4 text-[12px] font-bold text-white shadow-[0_7px_18px_rgba(23,79,67,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#236959]"
                >
                  <Icon
                    name="dashboard"
                    size={16}
                    strokeWidth={1.9}
                  />

                  Dashboard

                  <span className="opacity-70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <Icon name="arrow" size={14} />
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  disabled={signingOut}
                  className="inline-flex h-11 items-center gap-2 rounded-[13px] border border-[#dce6de] bg-white px-4 text-[12px] font-bold text-[#50645a] transition hover:border-[#174f43] hover:bg-[#edf4ef] hover:text-[#174f43] disabled:opacity-50"
                >
                  <Icon name="logout" size={16} />

                  {signingOut
                    ? "Signing out..."
                    : "Logout"}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1 rounded-[18px] border border-[#e6ede7] bg-[#f2f6f1] p-1.5 shadow-[0_6px_20px_rgba(23,79,67,0.05)]">
                <Link
                  href="/sign-in"
                  className="group inline-flex h-11 items-center gap-2 rounded-[13px] bg-white px-4 text-[12px] font-bold text-[#174f43] shadow-[0_3px_12px_rgba(23,79,67,0.07)] transition duration-200 hover:-translate-y-0.5 hover:bg-white"
                >
                  <span className="text-[#7b8f84] transition group-hover:text-[#174f43]">
                    <Icon name="login" size={16} />
                  </span>

                  Login
                </Link>

                <Link
                  href="/register"
                  className="group inline-flex h-11 items-center gap-2 rounded-[13px] bg-[#174f43] px-5 text-[12px] font-bold text-white shadow-[0_7px_18px_rgba(23,79,67,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#236959]"
                >
                  Register

                  <span className="opacity-80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <Icon name="arrow" size={14} />
                  </span>
                </Link>
              </div>
            )}

            {/* Theme icon is the rightmost desktop control. */}
            <ThemeToggle />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 xl:hidden">
            {/* Theme icon stays beside the hamburger on mobile. */}
            <ThemeToggle />

            <button
              type="button"
              aria-label={
                menuOpen ? "Close menu" : "Open menu"
              }
              aria-expanded={menuOpen}
              aria-controls="equiprent-mobile-menu"
              onClick={() =>
                setMenuOpen((value) => !value)
              }
              className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-[#dce6de] bg-white text-[#174f43] shadow-sm transition hover:bg-[#eef4ef]"
            >
              <Icon
                name={menuOpen ? "close" : "menu"}
                size={21}
              />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="equiprent-mobile-menu"
            aria-label="Mobile navigation"
            className="max-h-[calc(100dvh-82px)] overflow-y-auto border-t border-[#e5ebe5] bg-[#fbfcfa] px-4 py-5 shadow-xl sm:px-7 xl:hidden"
          >
            <div className="mx-auto flex max-w-4xl flex-col gap-2">
              {mobileLinks.map((item) => {
                const active = activeLink(
                  pathname,
                  item.href,
                );

                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={
                      active ? "page" : undefined
                    }
                    className={`flex min-h-12 items-center gap-3 rounded-[13px] px-4 text-sm font-bold transition ${
                      active
                        ? "bg-[#174f43] text-white"
                        : "bg-[#f3f7f2] text-[#53675b] hover:bg-[#eaf2eb] hover:text-[#174f43]"
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      size={18}
                    />

                    {item.label}

                    {active && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-[#df704b]" />
                    )}
                  </Link>
                );
              })}

              <div className="mt-3 border-t border-[#e5ebe5] pt-4">
                {loading ? (
                  <div className="h-11 animate-pulse rounded-xl bg-[#e7ece8]" />
                ) : user ? (
                  <button
                    type="button"
                    onClick={logout}
                    disabled={signingOut}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[13px] border border-[#dce6de] bg-white px-5 text-sm font-bold text-[#174f43] shadow-sm disabled:opacity-50"
                  >
                    <Icon name="logout" size={18} />

                    {signingOut
                      ? "Signing out..."
                      : "Logout"}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/sign-in"
                      onClick={closeMenu}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-[13px] border border-[#dce6de] bg-[#f3f7f2] px-4 text-sm font-bold text-[#174f43] shadow-sm transition hover:bg-[#eaf2eb]"
                    >
                      <Icon name="login" size={17} />
                      Login
                    </Link>

                    <Link
                      href="/register"
                      onClick={closeMenu}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-[13px] bg-[#174f43] px-4 text-sm font-bold text-white shadow-[0_7px_18px_rgba(23,79,67,0.18)] transition hover:bg-[#236959]"
                    >
                      Register
                      <Icon name="arrow" size={15} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}