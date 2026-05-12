"use client";

import Link from "next/link";
import { Book, Layers, BarChart3, Settings, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Mis Álbumes", href: "/dashboard", icon: Book },
  { name: "Explorar", href: "/explore", icon: Layers },
  { name: "Estadísticas", href: "/stats", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 md:relative md:border-t-0 md:border-r md:w-64 md:h-screen md:flex-col md:px-4 md:py-6">
      <div className="flex md:flex-col justify-around md:justify-start items-center h-16 md:h-full md:gap-4">
        <div className="hidden md:flex items-center gap-2 px-2 mb-8 self-start">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Book className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">AlbumTrack</span>
        </div>

        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 rounded-xl transition-all duration-200 w-full ${
                isActive
                  ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <item.icon className={`w-6 h-6 md:w-5 md:h-5 ${isActive ? "animate-pulse" : ""}`} />
              <span className="text-[10px] md:text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}

        <div className="md:mt-auto flex md:flex-col w-full md:gap-2">
          <Link
            href="/settings"
            className="hidden md:flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Ajustes</span>
          </Link>
          <button className="flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full">
            <LogOut className="w-6 h-6 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-sm font-medium">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
