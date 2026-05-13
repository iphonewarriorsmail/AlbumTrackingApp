import AlbumCard, { NewAlbumCard } from "@/components/AlbumCard";
import { createClient } from "@/utils/supabase/server";
import { Plus, BarChart3, TrendingUp, Globe, Lock } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Obtenemos las colecciones con sus stickers y datos del álbum maestro
  const { data: collections } = await supabase
    .from('user_collections')
    .select(`
      *,
      master_albums(name, total_stickers, category),
      album_stickers(status)
    `)
    .order('created_at', { ascending: false });

  const processedCollections = collections?.map(col => {
    const stickers = col.album_stickers || [];
    const collectedCount = stickers.filter((s: any) => s.status !== 'missing').length;
    const total = col.master_albums?.total_stickers || 0;
    const progress = total > 0 ? Math.round((collectedCount / total) * 100) : 0;

    return {
      ...col,
      master_name: col.master_albums?.name || "Álbum Desconocido",
      category: col.master_albums?.category || "General",
      total,
      collected: collectedCount,
      progress
    };
  }) || [];

  const totalCollected = processedCollections.reduce((acc, a) => acc + a.collected, 0);
  const totalPossible = processedCollections.reduce((acc, a) => acc + a.total, 0);
  const globalProgress = totalPossible > 0 ? Math.round((totalCollected / totalPossible) * 100) : 0;

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
            Mis Colecciones
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-lg font-medium">
            Tienes <span className="text-blue-600 font-black">{processedCollections.length}</span> colecciones activas.
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
            <BarChart3 className="w-4 h-4" /> Comunidad
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <NewAlbumCard />
        {processedCollections.map((col) => (
          <div key={col.id} className="relative group">
            <AlbumCard 
              id={col.id}
              name={col.name}
              category={col.category}
              total={col.total}
              collected={col.collected}
              progress={col.progress}
            />
            {/* Indicador de Privacidad */}
            <div className="absolute top-10 right-20 z-10">
               {col.is_public ? (
                 <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg" title="Público">
                   <Globe className="w-3.5 h-3.5" />
                 </div>
               ) : (
                 <div className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-400 rounded-lg" title="Privado">
                   <Lock className="w-3.5 h-3.5" />
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
