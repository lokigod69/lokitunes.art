import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AudioEngine from "@/components/AudioEngine";
import { GlobalAudioPlayer } from "@/components/GlobalAudioPlayer";
import MonochromeToggle from "@/components/MonochromeToggle";
import { AdminAnalyticsRoot } from "@/components/AdminAnalyticsRoot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Loki Tunes - Sonic Resonance",
  description: "A sonic landscape where albums exist as resonant nodes. Explore musical evolution through immersive orb fields.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "any", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MonochromeToggle />
        <AdminAnalyticsRoot />
        {/* Hidden audio engine - always mounted so playback persists across routes */}
        <AudioEngine />

        {children}

        {/* Full player UI for non-home routes */}
        <GlobalAudioPlayer />
      </body>
    </html>
  );
}
