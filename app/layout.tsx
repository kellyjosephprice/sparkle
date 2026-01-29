import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sparkle",
  description: "A dice scoring game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚄</text></svg>"
        />
      </head>
      <body className={`antialiased bg-black text-amber-50`}>{children}</body>
    </html>
  );
}
