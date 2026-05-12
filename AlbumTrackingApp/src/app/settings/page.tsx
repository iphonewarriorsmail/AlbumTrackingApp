"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { User, Mail, Shield, Globe, Lock, Save, Loader2, LogOut } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [email, setEmail] = useState("");
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      
      setEmail(user.email || "");

      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setSettings(data);
      setLoading(false);
    }
    loadSettings();
  }, [supabase, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          display_name: settings.display_name,
          is_public: settings.is_public
        });

      if (error) throw error;
      toast.success("Ajustes actualizados");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-10 px-4">
      <h1 className="text-5xl font-black tracking-tighter mb-12">Ajustes de Perfil</h1>

      <form onSubmit={handleSave} className="space-y-10">
        {/* Perfil */}
        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-10 border border-slate-200 dark:border-zinc-800 shadow-xl">
          <div className="flex items-center gap-4 mb-10 border-b border-slate-50 dark:border-zinc-800 pb-8">
             <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                <User className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-2xl font-black">Información Pública</h2>
                <p className="text-slate-500 font-medium">Cómo te ven otros coleccionistas.</p>
             </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre de Usuario / Alias</label>
              <input 
                className="w-full bg-slate-50 dark:bg-zinc-800 border-none px-6 py-4 rounded-2xl font-bold text-lg focus:ring-4 focus:ring-blue-500/20 transition-all"
                value={settings?.display_name || ""}
                onChange={(e) => setSettings({...settings, display_name: e.target.value})}
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email (Sólo lectura)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  disabled
                  className="w-full bg-slate-100 dark:bg-zinc-800/50 border-none pl-12 pr-6 py-4 rounded-2xl font-bold text-slate-400 cursor-not-allowed"
                  value={email}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Privacidad de Perfil */}
        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-10 border border-slate-200 dark:border-zinc-800 shadow-xl">
           <div className="flex items-center gap-4 mb-10">
             <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
                <Shield className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-2xl font-black">Privacidad Global</h2>
                <p className="text-slate-500 font-medium">Controla quién puede encontrarte.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <button 
                type="button"
                onClick={() => setSettings({...settings, is_public: true})}
                className={`flex items-center gap-4 p-8 rounded-3xl border-2 transition-all ${settings?.is_public ? 'bg-white border-blue-500 shadow-xl' : 'bg-transparent border-slate-100 opacity-50'}`}
             >
                <Globe className={`w-8 h-8 ${settings?.is_public ? 'text-blue-600' : ''}`} />
                <div className="text-left">
                  <p className="font-black text-lg">Perfil Público</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-relaxed">Añadir sin confirmación<br/>Colecciones públicas visibles</p>
                </div>
             </button>

             <button 
                type="button"
                onClick={() => setSettings({...settings, is_public: false})}
                className={`flex items-center gap-4 p-8 rounded-3xl border-2 transition-all ${!settings?.is_public ? 'bg-white border-slate-900 shadow-xl' : 'bg-transparent border-slate-100 opacity-50'}`}
             >
                <Lock className={`w-8 h-8 ${!settings?.is_public ? 'text-slate-900' : ''}`} />
                <div className="text-left">
                  <p className="font-black text-lg">Perfil Privado</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-relaxed">Requiere confirmación<br/>Colecciones ocultas para extraños</p>
                </div>
             </button>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            disabled={saving}
            className="flex-1 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> Guardar Cambios</>}
          </button>
          <button 
            type="button"
            onClick={handleLogout}
            className="px-10 py-6 bg-red-50 text-red-600 rounded-[2rem] font-black hover:bg-red-100 transition-all flex items-center gap-3"
          >
            <LogOut className="w-6 h-6" /> Cerrar Sesión
          </button>
        </div>
      </form>
    </div>
  );
}
