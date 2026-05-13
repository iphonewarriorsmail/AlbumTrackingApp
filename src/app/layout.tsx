import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlbumTrack | Seguimiento de Cromos",
  description: "Gestiona tus álbumes de cromos, pegadas, repetidas y faltantes con inteligencia artificial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 selection:bg-blue-100 dark:selection:bg-blue-900/30">
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto pt-28 pb-20 md:pb-0 px-4 py-8 md:px-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
