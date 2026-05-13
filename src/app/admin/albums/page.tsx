"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, BookOpen, Trash2, Save, Loader2, ArrowLeft, Layers, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function AdminAlbumsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [albums, setAlbums] = useState<any[]>([]);
  const [newAlbum, setNewAlbum] = useState({
    name: "",
    category: "Fútbol",
    total_stickers: 638
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function checkAdminAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data: settings } = await supabase
        .from('user_settings')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (settings?.role !== 'admin') {
        toast.error("Acceso restringido. Solo administradores.");
        return router.push("/dashboard");
      }

      setIsAdmin(true);
      const { data } = await supabase.from('master_albums').select('*').order('created_at', { ascending: false });
      setAlbums(data || []);
      setLoading(false);
    }
    checkAdminAndLoad();
  }, [supabase, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('master_albums').insert([newAlbum]);
      if (error) throw error;
      toast.success("Álbum maestro creado");
      setNewAlbum({ name: "", category: "Fútbol", total_stickers: 638 });
      const { data } = await supabase.from('master_albums').select('*').order('created_at', { ascending: false });
      setAlbums(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este álbum maestro?")) return;
    try {
      const { error } = await supabase.from('master_albums').delete().eq('id', id);
      if (error) throw error;
      toast.success("Álbum eliminado");
      const { data } = await supabase.from('master_albums').select('*').order('created_at', { ascending: false });
      setAlbums(data || []);
    } catch (error: any) {
      toast.error("No se puede eliminar porque hay colecciones usándolo");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 pt-10 px-4">
      <div className="flex items-center justify-between mb-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 group hover:text-slate-900 font-bold">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Panel
        </Link>
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-xs font-black uppercase">
          <ShieldAlert className="w-4 h-4" /> Zona Administrativa
        </div>
      </div>

      <header className="mb-12">
        <h1 className="text-5xl font-black tracking-tighter">Gestión de Álbumes Oficiales</h1>
        <p className="text-slate-500 text-lg font-medium mt-2">Define los álbumes maestros disponibles en la plataforma.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <form onSubmit={handleCreate} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-zinc-800 shadow-2xl space-y-6">
            <h3 className="text-xl font-black flex items-center gap-3">
               <Plus className="w-6 h-6 text-blue-600" /> Nuevo Maestro
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre del Álbum</label>
                <input 
                  required
                  className="w-full bg-slate-50 dark:bg-zinc-800 border-none px-6 py-4 rounded-2xl font-bold text-sm mt-1"
                  placeholder="Ej: Mundial Qatar 2022"
                  value={newAlbum.name}
                  onChange={(e) => setNewAlbum({...newAlbum, name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-zinc-800 border-none px-6 py-4 rounded-2xl font-bold text-sm mt-1 cursor-pointer"
                  value={newAlbum.category}
                  onChange={(e) => setNewAlbum({...newAlbum, category: e.target.value})}
                >
                  <option>Fútbol</option>
                  <option>Cómics</option>
                  <option>Música</option>
                  <option>Cine/TV</option>
                  <option>Otros</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Cromos</label>
                <input 
                  type="number"
                  required
                  className="w-full bg-slate-50 dark:bg-zinc-800 border-none px-6 py-4 rounded-2xl font-bold text-sm mt-1"
                  value={newAlbum.total_stickers}
                  onChange={(e) => setNewAlbum({...newAlbum, total_stickers: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <button 
              disabled={saving}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Registrar Álbum</>}
            </button>
          </form>
        </div>

        {/* Listado */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4" /> Álbumes Registrados ({albums.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {albums.map((a) => (
              <div key={a.id} className="relative group">
                <Link href={`/admin/albums/${a.id}`} className="block h-full">
                  <div className="bg-white dark:bg-zinc-900 p-8 h-full rounded-[2.5rem] border border-slate-100 dark:border-zinc-800 shadow-xl group hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    </div>
                    
                    <h4 className="text-xl font-black mb-1 text-slate-900 dark:text-white">{a.name}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-slate-500">
                        {a.category}
                      </span>
                      <span className="text-[10px] font-black uppercase bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full text-blue-600">
                        {a.total_stickers} cromos
                      </span>
                    </div>
                  </div>
                </Link>
                <button 
                  onClick={(e) => { e.preventDefault(); handleDelete(a.id); }}
                  className="absolute top-8 right-8 p-2 text-slate-300 hover:text-red-500 transition-colors z-10"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
