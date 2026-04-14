import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Fraunces, Instrument_Sans } from "next/font/google";

import { authOptions } from "@/lib/auth";
import { Providers } from "@/components/providers";

import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Overlap — A calm, intelligent inbox",
  description:
    "A cross-provider email workspace with gentle AI prioritization, thoughtful drafting, and a layout tuned for focus.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${fraunces.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
