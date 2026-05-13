"use client";

import { use, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  ArrowLeft, Plus, ChevronUp, ChevronDown, Trash2, 
  Save, Loader2, Layers, BookOpen, GripVertical, Edit3,
  Hash, Tag
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function MasterAlbumDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [masterAlbum, setMasterAlbum] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [stickers, setStickers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: settings } = await supabase.from('user_settings').select('role').eq('user_id', user?.id).single();
      
      if (settings?.role !== 'admin') {
        router.push("/dashboard");
        return;
      }

      const { data: album } = await supabase.from('master_albums').select('*').eq('id', id).single();
      const { data: sectionsData } = await supabase
        .from('album_sections')
        .select('*')
        .eq('master_album_id', id)
        .order('order_index');

      setMasterAlbum(album);
      setSections(sectionsData || []);
      if (sectionsData && sectionsData.length > 0) {
        setSelectedSection(sectionsData[0].id);
      }
      setLoading(false);
    }
    loadData();
  }, [id, supabase, router]);

  useEffect(() => {
    if (selectedSection) {
      loadStickers(selectedSection);
    }
  }, [selectedSection]);

  async function loadStickers(sectionId: string) {
    const { data } = await supabase
      .from('album_stickers')
      .select('*')
      .eq('section_id', sectionId)
      .eq('master_album_id', id)
      .order('sticker_code');
    setStickers(data || []);
  }

  const handleAddSection = async () => {
    const name = prompt("Nombre del nuevo grupo (ej: Paises, Estadios):");
    if (!name) return;

    setSaving(true);
    try {
      const { data, error } = await supabase.from('album_sections').insert({
        master_album_id: id,
        name,
        order_index: sections.length
      }).select().single();

      if (error) throw error;
      setSections([...sections, data]);
      if (!selectedSection) setSelectedSection(data.id);
      toast.success("Grupo añadido");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStickers = async () => {
    if (!selectedSection) return;
    const codes = prompt("Introduce los códigos de cromos separados por comas (ej: ARG1, ARG2, ARG3):");
    if (!codes) return;

    const stickerList = codes.split(',').map(c => c.trim()).filter(c => c !== "");
    
    setSaving(true);
    try {
      const newStickers = stickerList.map(code => ({
        master_album_id: id,
        section_id: selectedSection,
        sticker_code: code,
        status: 'missing'
      }));

      const { error } = await supabase.from('album_stickers').insert(newStickers);
      if (error) throw error;
      
      loadStickers(selectedSection);
      toast.success(`${stickerList.length} cromos añadidos`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    const updated = newSections.map((s, i) => ({ ...s, order_index: i }));
    setSections(updated);

    const updates = updated.map(s => supabase.from('album_sections').update({ order_index: s.order_index }).eq('id', s.id));
    await Promise.all(updates);
  };

  const handleDeleteSticker = async (stickerId: string) => {
    try {
      const { error } = await supabase.from('album_stickers').delete().eq('id', stickerId);
      if (error) throw error;
      setStickers(stickers.filter(s => s.id !== stickerId));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 pt-10 px-4">
      <Link href="/admin/albums" className="inline-flex items-center gap-2 text-slate-500 mb-10 group hover:text-slate-900 font-bold">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al catálogo
      </Link>

      <header className="mb-12 bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
             <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter">{masterAlbum.name}</h1>
            <p className="text-slate-500 font-medium mt-1">Editor de Plantilla Oficial</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Grupos / Secciones</h3>
            <button onClick={handleAddSection} className="p-2 bg-blue-600 text-white rounded-xl hover:scale-110 transition-all shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden">
             {sections.map((s, index) => (
               <button 
                key={s.id}
                onClick={() => setSelectedSection(s.id)}
                className={`w-full p-6 text-left border-b border-slate-50 dark:border-zinc-800 transition-all flex items-center justify-between group ${selectedSection === s.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50'}`}
               >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${selectedSection === s.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {index + 1}
                    </div>
                    <span className={`font-black ${selectedSection === s.id ? 'text-blue-600' : 'text-slate-700'}`}>{s.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronUp onClick={(e) => { e.stopPropagation(); handleMove(index, 'up'); }} className="w-4 h-4 text-slate-300 hover:text-blue-600" />
                    <ChevronDown onClick={(e) => { e.stopPropagation(); handleMove(index, 'down'); }} className="w-4 h-4 text-slate-300 hover:text-blue-600" />
                  </div>
               </button>
             ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {selectedSection ? (
            <>
              <div className="flex justify-between items-center px-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Cromos en {sections.find(s => s.id === selectedSection)?.name}</h3>
                </div>
                <button 
                  onClick={handleAddStickers}
                  disabled={saving}
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Añadir Cromos
                </button>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-2xl p-8">
                 <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {stickers.map(s => (
                      <div key={s.id} className="relative group">
                        <div className="bg-slate-50 dark:bg-zinc-800 p-4 rounded-2xl border-2 border-transparent hover:border-blue-500 transition-all text-center">
                           <Hash className="w-3 h-3 text-slate-400 mx-auto mb-1" />
                           <span className="font-black text-sm">{s.sticker_code}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteSticker(s.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                 </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 font-bold uppercase text-xs tracking-widest bg-slate-50 dark:bg-zinc-900/50 rounded-[3rem] border-4 border-dashed border-slate-100">
               Selecciona un grupo para gestionar sus cromos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
