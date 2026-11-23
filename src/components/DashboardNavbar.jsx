
"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

const exactRoutes = new Set([
  "/dashboard",
  "/dashboard/admin",
  "/dashboard/admin/manage",
  "/dashboard/owner",
  "/dashboard/owner/equipment",
  "/dashboard/owner/rentals",
  "/dashboard/profile",
]);

export default function DashboardNavbar() {
  const pathname = usePathname();

  if (!pathname) {
    return null;
  }

  const normalizedPath =
    pathname.length > 1
      ? pathname.replace(/\/+$/, "")
      : pathname;

  if (!exactRoutes.has(normalizedPath)) {
    return null;
  }

  return <Navbar />;
}