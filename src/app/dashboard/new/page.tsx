"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Sparkles, Loader2, BookOpen, Globe, Lock, ShieldCheck, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function NewCollectionPage() {
  const [loading, setLoading] = useState(false);
  const [masterAlbums, setMasterAlbums] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    master_album_id: "",
    is_public: true
  });
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadMasterData() {
      const { data } = await supabase.from('master_albums').select('*').order('name');
      setMasterAlbums(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, master_album_id: data[0].id }));
      }
    }
    loadMasterData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.master_album_id) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Debes estar logueado");

      // Obtener datos del álbum maestro seleccionado para heredar total y categoría
      const selectedMaster = masterAlbums.find(a => a.id === formData.master_album_id);
      if (!selectedMaster) throw new Error("Álbum maestro no encontrado");

      // 1. Crear la colección de usuario
      const { data: collection, error: colError } = await supabase
        .from('user_collections')
        .insert({
          name: formData.name,
          master_album_id: formData.master_album_id,
          user_id: user.id,
          is_public: formData.is_public,
          total_stickers: selectedMaster.total_stickers,
          category: selectedMaster.category
        })
        .select()
        .single();

      if (colError) throw colError;

      // 2. HERENCIA DE PLANTILLA: Copiar secciones y stickers
      const { data: masterSections } = await supabase
        .from('album_sections')
        .select('id, name, order_index')
        .eq('master_album_id', formData.master_album_id);

      if (masterSections && masterSections.length > 0) {
        for (const ms of masterSections) {
          // Copiar Sección
          const { data: newSection, error: secError } = await supabase
            .from('album_sections')
            .insert({
              album_id: collection.id,
              name: ms.name,
              order_index: ms.order_index
            })
            .select()
            .single();

          if (secError) continue;

          // Buscar y copiar stickers oficiales de esta sección maestra
          const { data: masterStickers } = await supabase
            .from('album_stickers')
            .select('sticker_code')
            .eq('section_id', ms.id)
            .eq('master_album_id', formData.master_album_id);

          if (masterStickers && masterStickers.length > 0) {
            const stickersToInsert = masterStickers.map(st => ({
              album_id: collection.id,
              section_id: newSection.id,
              sticker_code: st.sticker_code,
              status: 'missing',
              repeated_count: 0
            }));

            await supabase.from('album_stickers').insert(stickersToInsert);
          }
        }
      }

      toast.success("¡Colección creada con éxito!");
      router.push(`/dashboard/${collection.id}`);
    } catch (error: any) {
      console.error("Error creating collection:", error);
      toast.error(error.message || "Error al crear la colección");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-10 px-4">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 mb-10 group hover:text-slate-900 font-bold">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver a mis colecciones
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-slate-200 dark:border-zinc-800 p-10 md:p-16 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="mb-12">
            <h1 className="text-5xl font-black tracking-tighter mb-4">Empezar Colección</h1>
            <p className="text-slate-500 text-xl font-medium">Vincula un álbum oficial a tu perfil.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre de tu Colección</label>
                <input 
                  required
                  className="w-full bg-slate-50 dark:bg-zinc-800 border-none px-8 py-5 rounded-3xl font-bold text-lg focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner"
                  placeholder="Ej: Mi Álbum Mundial 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Seleccionar Álbum Oficial</label>
                <div className="relative">
                  <BookOpen className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
                  <select 
                    required
                    className="w-full bg-slate-50 dark:bg-zinc-800 border-none pl-16 pr-8 py-5 rounded-3xl font-bold text-lg appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner"
                    value={formData.master_album_id}
                    onChange={(e) => setFormData({...formData, master_album_id: e.target.value})}
                  >
                    {masterAlbums.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.total_stickers} cromos)</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl">Configuración de Privacidad</h3>
                      <p className="text-slate-500 text-sm font-medium">Controla quién puede ver tu progreso.</p>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, is_public: true})}
                    className={`flex items-center gap-4 p-6 rounded-3xl border-2 transition-all ${formData.is_public ? 'bg-white border-blue-500 shadow-xl' : 'bg-transparent border-slate-200 opacity-50'}`}
                  >
                    <Globe className={`w-6 h-6 ${formData.is_public ? 'text-blue-600' : ''}`} />
                    <div className="text-left">
                      <p className="font-black text-sm">Pública</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Visible para amigos</p>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, is_public: false})}
                    className={`flex items-center gap-4 p-6 rounded-3xl border-2 transition-all ${!formData.is_public ? 'bg-white border-slate-900 shadow-xl' : 'bg-transparent border-slate-200 opacity-50'}`}
                  >
                    <Lock className={`w-6 h-6 ${!formData.is_public ? 'text-slate-900' : ''}`} />
                    <div className="text-left">
                      <p className="font-black text-sm">Privada</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Solo tú puedes verla</p>
                    </div>
                  </button>
               </div>
            </div>

            <button 
              disabled={loading}
              className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-black rounded-[2rem] font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus className="w-6 h-6" /> Crear Colección</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
