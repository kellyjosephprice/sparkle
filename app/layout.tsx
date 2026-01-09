import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farkle",
  description: "A farkle game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
