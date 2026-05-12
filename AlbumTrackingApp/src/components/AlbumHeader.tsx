"use client";

import { useState } from "react";
import { ArrowLeft, Download, FileJson, Table as TableIcon, Share2, Upload } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import DataImporter from "./DataImporter";
import { createClient } from "@/utils/supabase/client";

interface AlbumHeaderProps {
  album: any;
}

export default function AlbumHeader({ album }: AlbumHeaderProps) {
  const [showImporter, setShowImporter] = useState(false);
  const supabase = createClient();

  const handleExport = async (type: 'missing' | 'repeated') => {
    toast.loading(`Generando reporte de ${type === 'missing' ? 'faltantes' : 'repetidas'}...`, { id: 'export' });
    
    const { data: stickers } = await supabase
      .from('album_stickers')
      .select('sticker_code, status, repeated_count')
      .eq('album_id', album.id)
      .eq('status', type);

    if (!stickers || stickers.length === 0) {
      toast.error(`No hay cromos ${type === 'missing' ? 'faltantes' : 'repetidos'} registrados.`, { id: 'export' });
      return;
    }

    const content = type === 'missing' 
      ? stickers.map(s => s.sticker_code).join(', ')
      : stickers.map(s => `${s.sticker_code} (x${s.repeated_count})`).join(', ');

    const blob = new Blob([`${album.name} - ${type === 'missing' ? 'FALTANTES' : 'REPETIDAS'}\n\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${album.name}_${type}.txt`;
    link.click();
    
    toast.success("Reporte descargado", { id: 'export' });
  };

  return (
    <>
      <header className="flex flex-col gap-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a mis álbumes
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-widest">
                {album.category || 'Sin categoría'}
              </span>
              <span className="text-slate-400 dark:text-zinc-500 text-xs font-medium">
                Creado el {new Date(album.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">{album.name}</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => handleExport('missing')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              Exportar Faltantes
            </button>
            <button 
              onClick={() => handleExport('repeated')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              Exportar Repetidos
            </button>
            <div className="h-10 w-px bg-slate-200 dark:bg-zinc-800 hidden md:block mx-2" />
            <button 
              onClick={() => setShowImporter(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 font-semibold text-sm"
            >
              <Upload className="w-4 h-4" />
              Importar
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
