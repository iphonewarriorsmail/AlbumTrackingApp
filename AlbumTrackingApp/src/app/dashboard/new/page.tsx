"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Upload, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";

export default function NewAlbumPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    sticker_type: "numeric",
    total_stickers: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('albums')
        .insert([
          {
            name: formData.name,
            category: formData.category,
            sticker_type: formData.sticker_type,
            total_stickers: parseInt(formData.total_stickers),
          }
        ])
        .select();

      if (error) throw error;

      toast.success("Álbum creado correctamente");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Error al crear el álbum");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Volver al dashboard
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight">Nuevo Álbum</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-2">
            Configura tu colección para empezar el seguimiento.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Nombre del Álbum</label>
            <input
              required
              type="text"
              placeholder="Ej: Panini Qatar 2022"
              className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1">Categoría</label>
              <input
                type="text"
                placeholder="Ej: Fútbol, Cine, Animé"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold ml-1">Total de Cromos</label>
              <input
                required
                type="number"
                placeholder="Ej: 638"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={formData.total_stickers}
                onChange={(e) => setFormData({ ...formData, total_stickers: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Tipo de Cromo</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className={`p-4 rounded-2xl border transition-all text-left ${
                  formData.sticker_type === 'numeric' 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' 
                    : 'border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                }`}
                onClick={() => setFormData({ ...formData, sticker_type: 'numeric' })}
              >
                <div className="font-bold">Numérico</div>
                <div className="text-xs text-slate-500 mt-1">1, 2, 3...</div>
              </button>
              <button
                type="button"
                className={`p-4 rounded-2xl border transition-all text-left ${
                  formData.sticker_type === 'alphanumeric' 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' 
                    : 'border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                }`}
                onClick={() => setFormData({ ...formData, sticker_type: 'alphanumeric' })}
              >
                <div className="font-bold">Alfanumérico</div>
                <div className="text-xs text-slate-500 mt-1">A1, B2, C3...</div>
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 mt-8">
            <div className="flex flex-col items-center gap-4 bg-blue-600/5 dark:bg-blue-900/10 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <Camera className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="font-bold text-sm">¿Tienes una foto de la hoja de control?</div>
                <p className="text-xs text-slate-500 mt-1">Súbela para detectar automáticamente el total y la estructura.</p>
              </div>
              <button type="button" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Subir foto
              </button>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              {loading ? "Creando..." : "Crear Álbum"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
