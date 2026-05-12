"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Trophy, LayoutGrid, Settings, LogOut, User, Users, MessageSquare, LogIn } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.push("/login");
    router.refresh();
  };

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (isAuthPage) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
            <Trophy className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tighter">AlbumTrack</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {user ? (
            <>
              <Link href="/dashboard" className={`text-sm font-bold transition-colors ${pathname === "/dashboard" ? "text-blue-600" : "text-slate-500 hover:text-slate-900"}`}>
                Mis Álbumes
              </Link>
              <Link href="/community" className={`text-sm font-bold transition-colors ${pathname === "/community" ? "text-blue-600" : "text-slate-500 hover:text-slate-900"}`}>
                Comunidad
              </Link>
              <Link href="/messages" className={`text-sm font-bold transition-colors ${pathname === "/messages" ? "text-blue-600" : "text-slate-500 hover:text-slate-900"}`}>
                Mensajes
              </Link>
            </>
          ) : (
            <Link href="/explore" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
              Explorar
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-zinc-800">
              <Link href="/settings" className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                <Settings className="w-5 h-5" />
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border-2 border-white dark:border-zinc-900 shadow-sm">
                <User className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 px-4">
                Entrar
              </Link>
              <Link href="/signup" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
