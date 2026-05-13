import { createClient } from "@/utils/supabase/server";
import { BarChart3, PieChart, TrendingUp, Trophy, Layers } from "lucide-react";

export default async function StatsPage() {
  const supabase = await createClient();

  const { data: albums } = await supabase
    .from('albums')
    .select('*, album_stickers(count, status)');

  // Procesar estadísticas
  const totalAlbums = albums?.length || 0;
  let totalStickers = 0;
  let collectedCount = 0;
  let repeatedCount = 0;

  const albumStats = albums?.map(album => {
    const total = album.total_stickers;
    const collected = album.album_stickers?.filter((s: any) => s.status !== 'missing').length || 0;
    const repeated = album.album_stickers?.filter((s: any) => s.status === 'repeated').length || 0;
    
    totalStickers += total;
    collectedCount += collected;
    repeatedCount += repeated;

    return {
      name: album.name,
      progress: Math.round((collected / total) * 100),
      collected,
      total
    };
  }) || [];

  const globalProgress = totalStickers > 0 ? Math.round((collectedCount / totalStickers) * 100) : 0;

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h1 className="text-4xl font-black tracking-tight">Estadísticas Globales</h1>
        <p className="text-slate-500 mt-2">Un resumen detallado de todas tus colecciones activas.</p>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-500/30 flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">Global</span>
          </div>
          <div>
            <span className="text-5xl font-black">{globalProgress}%</span>
            <p className="text-blue-100 font-medium mt-1">Progreso Total Completado</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-slate-100 dark:bg-zinc-800 rounded-2xl">
              <Layers className="w-6 h-6 text-slate-600 dark:text-zinc-400" />
            </div>
          </div>
          <div>
            <span className="text-4xl font-black">{totalAlbums}</span>
            <p className="text-slate-500 font-medium mt-1">Álbumes en Seguimiento</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div>
            <span className="text-4xl font-black">{repeatedCount}</span>
            <p className="text-slate-500 font-medium mt-1">Total de Cromos Repetidos</p>
          </div>
        </div>
      </div>

      {/* Progress per Album (CSS Charts) */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[3rem] p-10">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-black">Progreso Individual</h2>
        </div>

        <div className="space-y-8">
          {albumStats.length > 0 ? albumStats.map((album, i) => (
            <div key={i} className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="font-bold text-lg">{album.name}</span>
                <span className="text-sm font-black text-blue-600">{album.progress}%</span>
              </div>
              <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${album.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-slate-400">
                <span>{album.collected} pegadas</span>
                <span>{album.total} total</span>
              </div>
            </div>
          )) : (
            <p className="text-slate-500 text-center py-10">No hay datos suficientes para mostrar estadísticas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
