import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Organizer",
  description: "Simple task organizer with Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
