import type { Metadata } from "next";
import { BRAND } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND.name,
  description: `${BRAND.name} — waitlist coming soon`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
