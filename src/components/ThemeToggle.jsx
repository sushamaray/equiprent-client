
"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "equiprent-theme";
const CHANGE_EVENT = "equiprent-theme-change";

function getTheme() {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.dataset.theme === "dark"
    ? "dark"
    : "light";
}

function getServerTheme() {
  return "light";
}

function subscribe(callback) {
  window.addEventListener(CHANGE_EVENT, callback);

  function handleStorage(event) {
    if (
      event.key === STORAGE_KEY ||
      event.key === null
    ) {
      const theme =
        event.newValue === "dark" ? "dark" : "light";

      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
      callback();
    }
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function SunIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.9 13.1A9 9 0 0 1 10.9 3.1 9 9 0 1 0 20.9 13.1Z" />
    </svg>
  );
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    getTheme,
    getServerTheme,
  );

  const isDark = theme === "dark";

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Still allow switching when storage is unavailable.
    }

    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDark ? "Switch to light mode" : "Switch to dark mode"
      }
      aria-pressed={isDark}
      title={isDark ? "Light mode" : "Dark mode"}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border transition duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#df704b]"
      style={{
        backgroundColor: "var(--er-surface)",
        borderColor: "var(--er-border)",
        color: "var(--er-text)",
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}