"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Check, Plus, Minus, Info, ChevronDown, ChevronRight, Edit3, ArrowUp, ArrowDown, Save, X, Maximize2, Minimize2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";

interface Section {
  id: string;
  name: string;
  order_index: number;
}

interface Sticker {
  sticker_code: string;
  status: 'missing' | 'collected' | 'repeated';
  repeated_count: number;
  section_id?: string;
}

interface StickerGridProps {
  albumId: string;
  totalStickers: number;
  initialStickers: Sticker[];
  stickerType: string;
  sections: Section[];
  isEditMode?: boolean; // Prop recibida para controlar la edición
}

export default function StickerGrid({ albumId, totalStickers, initialStickers, stickerType, sections: initialSections = [], isEditMode = false }: StickerGridProps) {
  const [stickers, setStickers] = useState<Record<string, Sticker>>({});
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'missing' | 'collected' | 'repeated'>('all');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const supabase = createClient();

  useEffect(() => {
    const initialMap = initialStickers.reduce((acc, s) => ({ ...acc, [s.sticker_code]: s }), {});
    setStickers(initialMap);
    setSections([...initialSections].sort((a, b) => a.order_index - b.order_index));
  }, [initialStickers, initialSections]);

  const naturalSort = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

  const groupedStickers = useMemo(() => {
    const groups: Record<string, Sticker[]> = {};
    sections.forEach(sec => {
      groups[sec.id] = Object.values(stickers)
        .filter(s => s.section_id === sec.id)
        .sort((a, b) => naturalSort(a.sticker_code, b.sticker_code));
    });
    return groups;
  }, [stickers, sections]);

  const toggleSticker = async (code: string) => {
    const current = stickers[code] || { sticker_code: code, status: 'missing', repeated_count: 0 };
    let newStatus: 'missing' | 'collected' | 'repeated' = 'collected';
    let newRepeated = 0;

    if (current.status === 'missing') { newStatus = 'collected'; newRepeated = 0; }
    else if (current.status === 'collected') { newStatus = 'repeated'; newRepeated = 1; }
    else if (current.status === 'repeated') { newStatus = 'missing'; newRepeated = 0; }

    const updatedSticker = { ...current, status: newStatus, repeated_count: newRepeated };
    setStickers(prev => ({ ...prev, [code]: updatedSticker }));

    try {
      await supabase.from('album_stickers').upsert({
        album_id: albumId,
        sticker_code: code,
        status: newStatus,
        repeated_count: newRepeated,
        section_id: current.section_id
      }, { onConflict: 'album_id, sticker_code' });
    } catch (error) {
      setStickers(prev => ({ ...prev, [code]: current }));
    }
  };

  const handleBulkCollapse = (collapse: boolean) => {
    const newState = sections.reduce((acc, s) => ({ ...acc, [s.id]: collapse }), {});
    setCollapsedSections(newState);
  };

  const handleRenameSection = async (id: string) => {
    if (!editingName) return;
    try {
      const { error } = await supabase.from('album_sections').update({ name: editingName }).eq('id', id);
      if (error) throw error;
      setSections(sections.map(s => s.id === id ? { ...s, name: editingName } : s));
      setEditingSectionId(null);
      toast.success("Grupo renombrado");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    const updatedSections = newSections.map((s, i) => ({ ...s, order_index: i }));
    setSections(updatedSections);
    for (const sec of updatedSections) {
      await supabase.from('album_sections').update({ order_index: sec.order_index }).eq('id', sec.id);
    }
  };

  const updateRepeated = async (code: string, delta: number) => {
    const current = stickers[code];
    if (!current) return;
    const newCount = Math.max(0, (current.repeated_count || 0) + delta);
    const newStatus = newCount > 0 ? 'repeated' : 'collected';
    setStickers(prev => ({ ...prev, [code]: { ...current, status: newStatus, repeated_count: newCount } }));
    await supabase.from('album_stickers').update({ repeated_count: newCount, status: newStatus }).eq('album_id', albumId).eq('sticker_code', code);
  };

  const stats = useMemo(() => {
    const stickerList = Object.values(stickers);
    const collected = stickerList.filter(s => s.status !== 'missing').length;
    return { collected, missing: totalStickers - collected, repeated: stickerList.reduce((acc, s) => acc + (s.repeated_count || 0), 0) };
  }, [stickers, totalStickers]);

  return (
    <div className="space-y-10">
      {/* Optimized Layout Toolbar */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-xl">
        <div className="flex gap-8 px-2">
          <div className="text-center">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pegadas</div>
            <div className="text-2xl font-black text-blue-600">{stats.collected}</div>
          </div>
          <div className="text-center border-x border-slate-100 dark:border-zinc-800 px-8">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faltan</div>
            <div className="text-2xl font-black text-red-500">{stats.missing}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Repetidas</div>
            <div className="text-2xl font-black text-amber-500">{stats.repeated}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          {/* Collapse Controls Unificados */}
          <div className="flex bg-slate-50 dark:bg-zinc-800 p-1 rounded-xl border border-slate-100 dark:border-zinc-700">
            <button onClick={() => handleBulkCollapse(false)} className="p-2 text-slate-500 hover:text-blue-600 rounded-lg transition-all" title="Expandir Todo"><Maximize2 className="w-4 h-4" /></button>
            <button onClick={() => handleBulkCollapse(true)} className="p-2 text-slate-500 hover:text-blue-600 rounded-lg transition-all" title="Contraer Todo"><Minimize2 className="w-4 h-4" /></button>
          </div>
          
          <div className="relative flex-1 lg:flex-none lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border-none rounded-xl text-sm font-bold" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <select className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black outline-none border-none shadow-md" value={filter} onChange={(e: any) => setFilter(e.target.value)}>
            <option value="all">TODOS</option>
            <option value="missing">FALTANTES</option>
            <option value="collected">OBTENIDOS</option>
            <option value="repeated">REPETIDOS</option>
          </select>
        </div>
      </div>

      <div className="space-y-12">
        {sections.map((section, index) => {
          const sectionStickers = groupedStickers[section.id] || [];
          const filtered = sectionStickers.filter(s => 
            s.sticker_code.toLowerCase().includes(search.toLowerCase()) &&
            (filter === 'all' || s.status === filter || (filter === 'collected' && s.status === 'repeated'))
          );

          if (filtered.length === 0 && search !== "") return null;
          const isCollapsed = collapsedSections[section.id];

          return (
            <div key={section.id} className="space-y-6 group/section">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-6">
                  <button onClick={() => setCollapsedSections(p => ({...p, [section.id]: !p[section.id]}))} className="w-10 h-10 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  
                  {isEditMode && editingSectionId === section.id ? (
                    <div className="flex items-center gap-2">
                      <input autoFocus className="bg-slate-50 dark:bg-zinc-800 border-2 border-blue-500 px-4 py-1.5 rounded-xl font-black text-xl outline-none" value={editingName} onChange={(e) => setEditingName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRenameSection(section.id)} />
                      <button onClick={() => handleRenameSection(section.id)} className="p-2 bg-emerald-500 text-white rounded-lg"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditingSectionId(null)} className="p-2 bg-slate-200 dark:bg-zinc-700 text-slate-500 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => { if (isEditMode) { setEditingSectionId(section.id); setEditingName(section.name); } }}
                      className={`flex items-center gap-3 ${isEditMode ? 'cursor-pointer group/title hover:text-blue-600 transition-colors' : ''}`}
                    >
                      <h3 className="text-2xl font-black tracking-tight">{section.name}</h3>
                      {isEditMode && <Edit3 className="w-4 h-4 text-slate-300 group-hover/title:text-blue-600 transition-all" />}
                    </div>
                  )}
                </div>

                {isEditMode && (
                  <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                    <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-sm hover:border-blue-500 transition-all disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-sm hover:border-blue-500 transition-all disabled:opacity-20"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4">
                  {filtered.map(s => (
                    <div key={s.sticker_code} className="relative group/sticker">
                      <button
                        onClick={() => toggleSticker(s.sticker_code)}
                        className={`w-full aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${
                          s.status !== 'missing' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-400'
                        }`}
                      >
                        <span className={`text-[11px] font-black ${s.status !== 'missing' ? 'text-white' : 'text-slate-500'}`}>{s.sticker_code}</span>
                        {s.status !== 'missing' && <Check className="w-3 h-3 mt-1" />}
                        {s.repeated_count > 0 && <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-white text-blue-600 rounded-lg text-[9px] font-black shadow-sm">x{s.repeated_count}</div>}
                      </button>
                      {s.status !== 'missing' && (
                        <div className="absolute -top-3 -right-3 flex flex-col gap-1 opacity-0 group-hover/sticker:opacity-100 transition-opacity z-20">
                          <button onClick={(e) => { e.stopPropagation(); updateRepeated(s.sticker_code, 1); }} className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-full shadow-xl flex items-center justify-center border border-slate-200 dark:border-zinc-700 hover:scale-110 active:scale-95 transition-all"><Plus className="w-4 h-4 text-blue-600" /></button>
                          <button onClick={(e) => { e.stopPropagation(); updateRepeated(s.sticker_code, -1); }} className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-full shadow-xl flex items-center justify-center border border-slate-200 dark:border-zinc-700 hover:scale-110 active:scale-95 transition-all"><Minus className="w-4 h-4 text-red-600" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
