
import "./globals.css";
import "./premium-polish.css";

import DashboardNavbar from "@/components/DashboardNavbar";

export const metadata = {
  title: "EquipRent | Equipment Rental Marketplace",
  description:
    "Discover approved equipment, compare rental options, and rent securely with EquipRent.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <DashboardNavbar />
        {children}
      </body>
    </html>
  );
}