import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minimi — AI Web Research & Temporal Comparison Agent",
  description:
    "Production-grade AI agent featuring real-time web research, historical conversation memory, and verified temporal comparisons.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Doto:wght,ROND@601,100&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full bg-slate-100 text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
