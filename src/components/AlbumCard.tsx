"use client";

import { useState } from "react";
import { MoreVertical, Plus, Trash2, Edit3, BarChart3, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface AlbumCardProps {
  id: string;
  name: string;
  category: string;
  progress: number;
  total: number;
  collected: number;
  onRefresh?: () => void;
}

export default function AlbumCard({ id, name, category, progress, total, collected, onRefresh }: AlbumCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Estás seguro de que quieres eliminar la colección "${name}"? Esta acción no se puede deshacer.`)) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase.from('user_collections').delete().eq('id', id);
      if (error) throw error;
      toast.success("Colección eliminada");
      if (onRefresh) onRefresh();
      else router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="group relative bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-zinc-800 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
      {deleting && (
        <div className="absolute inset-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm z-20 rounded-[2.5rem] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
            {category}
          </span>
          <h3 className="text-2xl font-black mt-3 group-hover:text-blue-600 transition-colors tracking-tight">
            {name}
          </h3>
        </div>
        
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className={`p-2.5 rounded-xl transition-all ${showMenu ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400'}`}
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-30 py-2 animate-in fade-in zoom-in-95 duration-200">
              <button className="w-full px-4 py-3 text-left text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800">
                <Edit3 className="w-4 h-4 text-slate-400" /> Editar Propiedades
              </button>
              <Link href={`/dashboard/${id}/stats`} className="w-full px-4 py-3 text-left text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800">
                <BarChart3 className="w-4 h-4 text-blue-500" /> Ver Estadísticas
              </Link>
              <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1" />
              <button 
                onClick={handleDelete}
                className="w-full px-4 py-3 text-left text-sm font-bold flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" /> Eliminar Colección
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between text-xs mb-3">
          <span className="text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest">Progreso</span>
          <span className="font-black text-blue-600 dark:text-blue-400">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-5">
          <div className="text-center">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pegadas</div>
            <div className="font-black text-slate-900 dark:text-white">{collected}</div>
          </div>
          <div className="text-center border-l border-slate-100 dark:border-zinc-800 pl-6">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faltantes</div>
            <div className="font-black text-red-500">{total - collected}</div>
          </div>
        </div>
      </div>
      
      <Link 
        href={`/dashboard/${id}`}
        className="mt-10 flex items-center justify-center gap-2 w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/10"
      >
        Gestionar Cromos <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export function NewAlbumCard() {
  return (
    <Link href="/dashboard/new" className="group flex flex-col items-center justify-center p-10 bg-white dark:bg-zinc-900 rounded-[2.5rem] border-4 border-dashed border-slate-100 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-500 min-h-[360px] text-center">
      <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-[2rem] flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:rotate-90 transition-all duration-500 shadow-lg group-hover:shadow-blue-500/40">
        <Plus className="w-10 h-10 text-slate-400 group-hover:text-white" />
      </div>
      <h3 className="text-2xl font-black tracking-tight">Nueva Colección</h3>
      <p className="text-sm text-slate-500 dark:text-zinc-500 mt-3 max-w-[200px] font-medium leading-relaxed">
        Empieza una nueva colección vinculada a un álbum oficial.
      </p>
    </Link>
  );
}
