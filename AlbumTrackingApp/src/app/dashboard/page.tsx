import AlbumCard, { NewAlbumCard } from "@/components/AlbumCard";
import { createClient } from "@/utils/supabase/server";
import { Plus, BarChart3, TrendingUp, Award } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Obtenemos los álbumes con sus stickers para calcular progreso real
  const { data: albums } = await supabase
    .from('albums')
    .select(`
      *,
      album_stickers(status)
    `)
    .order('created_at', { ascending: false });

  const processedAlbums = albums?.map(album => {
    const stickers = album.album_stickers || [];
    const collectedCount = stickers.filter((s: any) => s.status !== 'missing').length;
    const progress = album.total_stickers > 0 
      ? Math.round((collectedCount / album.total_stickers) * 100) 
      : 0;

    return {
      ...album,
      collected: collectedCount,
      progress
    };
  }) || [];

  const totalCollected = processedAlbums.reduce((acc, a) => acc + a.collected, 0);
  const totalStickers = processedAlbums.reduce((acc, a) => acc + a.total_stickers, 0);
  const globalProgress = totalStickers > 0 ? Math.round((totalCollected / totalStickers) * 100) : 0;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
            Panel de Control
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-lg font-medium">
            Gestionas <span className="text-blue-600 font-black">{processedAlbums.length}</span> colecciones activas.
          </p>
        </div>
        
        <div className="flex bg-white dark:bg-zinc-900 p-2 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-xl items-center gap-6 px-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Progreso Global</p>
              <p className="text-sm font-black">{globalProgress}%</p>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-100 dark:bg-zinc-800" />
          <Link href="/community" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
            <BarChart3 className="w-4 h-4" /> Estadísticas
          </Link>
        </div>
      </header>

      {processedAlbums.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NewAlbumCard />
          {/* Placeholder visual para invitar al usuario */}
          <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 text-white flex flex-col justify-center relative overflow-hidden group shadow-2xl">
             <Award className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 text-white/10 group-hover:rotate-12 transition-transform duration-700" />
             <h2 className="text-3xl font-black mb-4 relative z-10">¡Empieza tu primera colección!</h2>
             <p className="text-blue-100 text-lg max-w-md relative z-10 font-medium">
               Usa nuestro escáner IA para digitalizar tu álbum físico en segundos y empieza a trackear tus repetidas.
             </p>
             <Link href="/dashboard/new" className="mt-8 bg-white text-blue-600 px-8 py-4 rounded-2xl font-black w-fit hover:scale-105 transition-all shadow-xl shadow-blue-950/20 relative z-10">
               Crear mi primer álbum
             </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <NewAlbumCard />
          {processedAlbums.map((album) => (
            <AlbumCard 
              key={album.id}
              id={album.id}
              name={album.name}
              category={album.category || 'Sin categoría'}
              total={album.total_stickers}
              collected={album.collected}
              progress={album.progress}
            />
          ))}
        </div>
      )}
    </div>
  );
}
