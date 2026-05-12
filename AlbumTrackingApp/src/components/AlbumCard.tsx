import { MoreVertical, Plus } from "lucide-react";
import Link from "next/link";

interface AlbumCardProps {
  id: string;
  name: string;
  category: string;
  progress: number;
  total: number;
  collected: number;
}

export default function AlbumCard({ id, name, category, progress, total, collected }: AlbumCardProps) {
  return (
    <div className="group relative bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {category}
          </span>
          <h3 className="text-xl font-bold mt-1 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
        </div>
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500 dark:text-zinc-400 font-medium">Progreso</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(37,99,235,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-4 text-xs text-slate-400 dark:text-zinc-500">
          <span>{collected} pegadas</span>
          <span>{total - collected} faltantes</span>
        </div>
      </div>
      
      <Link 
        href={`/dashboard/${id}`}
        className="mt-8 block w-full py-3 bg-slate-50 dark:bg-zinc-800/50 hover:bg-blue-600 hover:text-white rounded-2xl text-sm font-semibold transition-all duration-200 border border-transparent hover:shadow-lg hover:shadow-blue-500/20 text-center"
      >
        Ver Detalles
      </Link>
    </div>
  );
}

export function NewAlbumCard() {
  return (
    <Link href="/dashboard/new" className="group flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-all duration-300 min-h-[320px]">
      <div className="w-14 h-14 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:rotate-90 transition-all duration-500">
        <Plus className="w-8 h-8 text-slate-400 group-hover:text-white" />
      </div>
      <h3 className="text-lg font-bold">Nuevo Álbum</h3>
      <p className="text-sm text-slate-500 dark:text-zinc-500 text-center mt-2 max-w-[160px]">
        Empieza a trackear una nueva colección
      </p>
    </Link>
  );
}
