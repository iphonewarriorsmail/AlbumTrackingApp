"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Check, Plus, Minus, Info } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";

interface Sticker {
  sticker_code: string;
  status: 'missing' | 'collected' | 'repeated';
  repeated_count: number;
}

interface StickerGridProps {
  albumId: string;
  totalStickers: number;
  initialStickers: Sticker[];
  stickerType: string;
}

export default function StickerGrid({ albumId, totalStickers, initialStickers, stickerType }: StickerGridProps) {
  const [stickers, setStickers] = useState<Record<string, Sticker>>(
    initialStickers.reduce((acc, s) => ({ ...acc, [s.sticker_code]: s }), {})
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'missing' | 'collected' | 'repeated'>('all');

  const supabase = createClient();

  const allCodes = useMemo(() => {
    if (stickerType === 'numeric') {
      return Array.from({ length: totalStickers }, (_, i) => (i + 1).toString());
    }
    // Para alfanumérico, necesitaríamos la estructura. Por ahora simulamos 1..N
    return Array.from({ length: totalStickers }, (_, i) => (i + 1).toString());
  }, [totalStickers, stickerType]);

  const toggleSticker = async (code: string) => {
    const current = stickers[code] || { sticker_code: code, status: 'missing', repeated_count: 0 };
    let newStatus: 'missing' | 'collected' | 'repeated' = 'collected';
    let newRepeated = 0;

    if (current.status === 'collected') {
      newStatus = 'repeated';
      newRepeated = 1;
    } else if (current.status === 'repeated') {
      newStatus = 'missing';
      newRepeated = 0;
    }

    const updatedSticker = { ...current, status: newStatus, repeated_count: newRepeated };
    
    // Optimistic update
    setStickers(prev => ({ ...prev, [code]: updatedSticker }));

    try {
      const { error } = await supabase
        .from('album_stickers')
        .upsert({
          album_id: albumId,
          sticker_code: code,
          status: newStatus,
          repeated_count: newRepeated
        }, { onConflict: 'album_id, sticker_code' });

      if (error) throw error;
    } catch (error) {
      toast.error("Error al actualizar cromo");
      // Rollback
      setStickers(prev => ({ ...prev, [code]: current }));
    }
  };

  const updateRepeated = async (code: string, delta: number) => {
    const current = stickers[code];
    if (!current || current.status !== 'repeated') return;

    const newCount = Math.max(1, current.repeated_count + delta);
    if (newCount === current.repeated_count) return;

    const updatedSticker = { ...current, repeated_count: newCount };
    setStickers(prev => ({ ...prev, [code]: updatedSticker }));

    try {
      await supabase
        .from('album_stickers')
        .update({ repeated_count: newCount })
        .eq('album_id', albumId)
        .eq('sticker_code', code);
    } catch (error) {
      setStickers(prev => ({ ...prev, [code]: current }));
    }
  };

  const filteredCodes = allCodes.filter(code => {
    const s = stickers[code] || { status: 'missing' };
    const matchesSearch = code.includes(search);
    const matchesFilter = filter === 'all' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = useMemo(() => {
    const collected = Object.values(stickers).filter(s => s.status !== 'missing').length;
    const repeated = Object.values(stickers).reduce((acc, s) => acc + (s.repeated_count || 0), 0);
    return { collected, missing: totalStickers - collected, repeated };
  }, [stickers, totalStickers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-3xl border border-slate-100 dark:border-zinc-800">
        <div className="flex gap-6 px-4">
          <div className="text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pegadas</div>
            <div className="text-lg font-black text-blue-600">{stats.collected}</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Faltan</div>
            <div className="text-lg font-black text-red-500">{stats.missing}</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Repetidas</div>
            <div className="text-lg font-black text-amber-500">{stats.repeated}</div>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar nro..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={filter}
            onChange={(e: any) => setFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="missing">Faltantes</option>
            <option value="collected">Pegadas</option>
            <option value="repeated">Repetidas</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
        {filteredCodes.map(code => {
          const s = stickers[code] || { status: 'missing', repeated_count: 0 };
          return (
            <div key={code} className="relative group">
              <button
                onClick={() => toggleSticker(code)}
                className={`w-full aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-200 relative overflow-hidden ${
                  s.status === 'collected' 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : s.status === 'repeated'
                    ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-400 hover:border-blue-300 dark:hover:border-blue-900/50'
                }`}
              >
                <span className="text-sm font-black tracking-tighter">{code}</span>
                {s.status === 'collected' && <Check className="w-3 h-3 mt-1" />}
                {s.status === 'repeated' && <span className="text-[10px] font-bold mt-1">x{s.repeated_count}</span>}
              </button>
              
              {s.status === 'repeated' && (
                <div className="absolute -top-2 -right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateRepeated(code, 1); }}
                    className="w-6 h-6 bg-white dark:bg-zinc-800 rounded-full shadow-md flex items-center justify-center hover:bg-blue-50 transition-colors border border-slate-100 dark:border-zinc-700"
                  >
                    <Plus className="w-3 h-3 text-blue-600" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateRepeated(code, -1); }}
                    className="w-6 h-6 bg-white dark:bg-zinc-800 rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors border border-slate-100 dark:border-zinc-700"
                  >
                    <Minus className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredCodes.length === 0 && (
        <div className="py-20 text-center">
          <Info className="w-12 h-12 text-slate-200 dark:text-zinc-800 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No se encontraron cromos con ese filtro.</p>
        </div>
      )}
    </div>
  );
}
