"use client";

import { useState } from "react";
import { ArrowLeft, ArrowUpFromLine, ArrowDownToLine, MoreVertical, Trash2, Edit3, BarChart3, Loader2, CheckCircle2, Eraser, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import DataImporter from "./DataImporter";
import { createClient } from "@/utils/supabase/client";

interface AlbumHeaderProps {
  album: any;
  isEditMode: boolean;
  onToggleEdit: () => void;
}

export default function AlbumHeader({ album, isEditMode, onToggleEdit }: AlbumHeaderProps) {
  const [showImporter, setShowImporter] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleExport = async (type: 'missing' | 'repeated') => {
    toast.loading(`Generando reporte...`, { id: 'export' });
    
    const { data: stickers } = await supabase
      .from('album_stickers')
      .select('sticker_code, status, repeated_count')
      .eq('album_id', album.id)
      .eq('status', type);

    if (!stickers || stickers.length === 0) {
      toast.error(`No hay cromos registrados como ${type}.`, { id: 'export' });
      return;
    }

    const content = type === 'missing' 
      ? stickers.map(s => s.sticker_code).join(', ')
      : stickers.map(s => `${s.sticker_code} (x${s.repeated_count})`).join(', ');

    const blob = new Blob([`${album.name} - ${type.toUpperCase()}\n\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${album.name}_${type}.txt`;
    link.click();
    
    toast.success("Reporte descargado", { id: 'export' });
  };

  const handleBulkAction = async (action: 'complete' | 'reset') => {
    const confirmMsg = action === 'complete' 
      ? "¿Estás seguro de marcar TODO el álbum como completado?" 
      : "¿Estás seguro de blanquear todo el álbum? Perderás todo el progreso.";
    
    if (!confirm(confirmMsg)) return;

    toast.loading("Procesando...", { id: 'bulk' });
    try {
      const { error } = await supabase
        .from('album_stickers')
        .update({ 
          status: action === 'complete' ? 'collected' : 'missing',
          repeated_count: 0 
        })
        .eq('album_id', album.id);

      if (error) throw error;
      toast.success(action === 'complete' ? "¡Álbum completado!" : "Álbum reseteado", { id: 'bulk' });
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message, { id: 'bulk' });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${album.name}"?`)) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('albums').delete().eq('id', album.id);
      if (error) throw error;
      toast.success("Álbum eliminado");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <header className="flex flex-col gap-8 relative">
        {deleting && (
          <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
            <Loader2 className="w-10 h-10 animate-spin text-red-500" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors group font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al Dashboard
          </Link>

          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`p-3 border rounded-2xl transition-all shadow-sm ${showMenu ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'}`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl z-50 py-3 animate-in fade-in zoom-in-95 duration-200 p-2">
                <button 
                  onClick={() => { onToggleEdit(); setShowMenu(false); }}
                  className={`w-full px-5 py-3 text-left text-sm font-black flex items-center gap-3 rounded-xl transition-colors ${isEditMode ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                >
                  <Settings2 className="w-4 h-4" /> {isEditMode ? 'Finalizar Gestión' : 'Gestionar Grupos'}
                </button>
                <Link href={`/dashboard/${album.id}/stats`} className="w-full px-5 py-3 text-left text-sm font-black flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  <BarChart3 className="w-4 h-4 text-blue-500" /> Estadísticas
                </Link>
                <div className="h-px bg-slate-100 dark:bg-zinc-800 my-2 mx-3" />
                <button 
                  onClick={() => handleBulkAction('complete')}
                  className="w-full px-5 py-3 text-left text-sm font-black flex items-center gap-3 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Marcar Todo Obtenido
                </button>
                <button 
                  onClick={() => handleBulkAction('reset')}
                  className="w-full px-5 py-3 text-left text-sm font-black flex items-center gap-3 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-colors"
                >
                  <Eraser className="w-4 h-4" /> Blanquear Álbum
                </button>
                <div className="h-px bg-slate-100 dark:bg-zinc-800 my-2 mx-3" />
                <button 
                  onClick={handleDelete}
                  className="w-full px-5 py-3 text-left text-sm font-black flex items-center gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar Álbum
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-xl shadow-slate-100/50">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20">
                {album.category || 'Colección'}
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-none">{album.name}</h1>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              <button 
                onClick={() => handleExport('missing')}
                className="p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 rounded-2xl hover:bg-white transition-all shadow-sm group"
                title="Exportar Faltantes"
              >
                <ArrowUpFromLine className="w-6 h-6 text-blue-600" />
              </button>
              <button 
                onClick={() => handleExport('repeated')}
                className="p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 rounded-2xl hover:bg-white transition-all shadow-sm group"
                title="Exportar Repetidas"
              >
                <ArrowUpFromLine className="w-6 h-6 text-amber-500" />
              </button>
            </div>
            <button 
              onClick={() => setShowImporter(true)}
              className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-[1.5rem] hover:opacity-90 transition-all shadow-xl font-black text-sm flex items-center gap-2"
            >
              <ArrowDownToLine className="w-5 h-5" /> Importar Datos
            </button>
          </div>
        </div>
      </header>

      {showImporter && (
        <DataImporter 
          albumId={album.id}
          onClose={() => setShowImporter(false)}
          onImportComplete={() => window.location.reload()}
        />
      )}
    </>
  );
}
