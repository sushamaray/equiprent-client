
import "./globals.css";
import "./premium-polish.css";
import "./theme.css";

import DashboardNavbar from "@/components/DashboardNavbar";

export const metadata = {
  title: "EquipRent | Equipment Rental Marketplace",
  description:
    "Discover approved equipment, compare rental options, and rent securely with EquipRent.",
};

const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem("equiprent-theme");
    var theme = saved === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  } catch (error) {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>

      <body className="flex min-h-full flex-col">
        <DashboardNavbar />
        {children}
      </body>
    </html>
  );
}