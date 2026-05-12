import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, BarChart3, PieChart, Activity, Award, TrendingUp, Inbox } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AlbumStatsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: album } = await supabase
    .from('albums')
    .select(`
      *,
      album_sections(*, album_stickers(status))
    `)
    .eq('id', id)
    .single();

  if (!album) notFound();

  const sectionsData = album.album_sections.map((sec: any) => {
    const total = sec.album_stickers.length;
    const collected = sec.album_stickers.filter((s: any) => s.status !== 'missing').length;
    const repeated = sec.album_stickers.reduce((acc: number, s: any) => acc + (s.repeated_count || 0), 0);
    const progress = total > 0 ? Math.round((collected / total) * 100) : 0;

    return {
      name: sec.name,
      total,
      collected,
      repeated,
      progress
    };
  });

  const totalStickers = album.total_stickers;
  const totalCollected = sectionsData.reduce((acc: number, s: any) => acc + s.collected, 0);
  const totalRepeated = sectionsData.reduce((acc: number, s: any) => acc + s.repeated, 0);
  const globalProgress = totalStickers > 0 ? Math.round((totalCollected / totalStickers) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto pb-20 pt-10">
      <Link href={`/dashboard/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-10 font-bold transition-all group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al álbum
      </Link>

      <header className="mb-12">
        <h1 className="text-5xl font-black tracking-tighter mb-4">Análisis de Colección</h1>
        <p className="text-slate-500 text-xl font-medium">{album.name} • <span className="text-blue-600">Estadísticas en tiempo real</span></p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-xl">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Progreso Total</p>
          <h2 className="text-4xl font-black">{globalProgress}%</h2>
          <div className="mt-4 w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${globalProgress}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-xl">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Cromos Pegados</p>
          <h2 className="text-4xl font-black">{totalCollected} <span className="text-xl text-slate-300">/ {totalStickers}</span></h2>
          <p className="text-xs text-slate-500 mt-2 font-bold">Faltan {totalStickers - totalCollected} para completar</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-xl">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 text-amber-600">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Repetidas</p>
          <h2 className="text-4xl font-black text-amber-500">{totalRepeated}</h2>
          <p className="text-xs text-slate-500 mt-2 font-bold">Listas para intercambio</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
        <div className="p-10 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-2xl font-black flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Desglose por Sección
          </h3>
        </div>
        <div className="p-10">
          <div className="space-y-8">
            {sectionsData.map((sec: any) => (
              <div key={sec.name} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="font-black text-lg">{sec.name}</h4>
                    <p className="text-xs text-slate-400 font-bold">{sec.collected} de {sec.total} cromos • {sec.repeated} repetidas</p>
                  </div>
                  <span className="font-black text-blue-600">{sec.progress}%</span>
                </div>
                <div className="w-full h-4 bg-slate-50 dark:bg-zinc-800 rounded-full overflow-hidden border border-slate-100 dark:border-zinc-700/50">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
                    style={{ width: `${sec.progress}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
