"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Bell, Shield, Moon, Sun, Smartphone, LogOut, ChevronRight, Loader2, Check, Camera, Mail, AtSign } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";

interface UserSettings {
  display_name: string;
  avatar_url: string;
  notifications_enabled: boolean;
  mobile_sync_enabled: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [newEmail, setNewEmail] = useState("");
  const [settings, setSettings] = useState<UserSettings>({
    display_name: "",
    avatar_url: "",
    notifications_enabled: true,
    mobile_sync_enabled: true,
  });

  const [activeModal, setActiveModal] = useState<'profile' | 'security' | 'notifications' | 'sync' | 'email' | null>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        setNewEmail(user.email || "");
        const { data } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setSettings(data);
        } else {
          setSettings(prev => ({ 
            ...prev, 
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "" 
          }));
        }
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const saveSettings = async (updates: Partial<UserSettings>) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setSettings(prev => ({ ...prev, ...updates }));
      toast.success("Ajustes actualizados");
      setActiveModal(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user?.email) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Confirma el cambio en tu nuevo email (y en el antiguo si corresponde)");
      setActiveModal(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.push("/login");
    router.refresh();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-10">
      <header className="mb-12">
        <h1 className="text-4xl font-black tracking-tight">Ajustes</h1>
        <p className="text-slate-500 mt-2 text-lg">Personaliza tu cuenta y preferencias.</p>
      </header>

      <div className="space-y-12">
        {/* Profile Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-slate-100/50">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-800 shadow-xl">
              {settings.avatar_url ? (
                <img src={settings.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-blue-600" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black">{settings.display_name || "Coleccionista"}</h2>
            <div className="flex flex-col md:flex-row gap-4 mt-2">
              <p className="text-slate-500 flex items-center justify-center md:justify-start gap-2 text-sm font-medium">
                <Mail className="w-4 h-4" /> {user?.email}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveModal('profile')}
              className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm"
            >
              Editar Perfil
            </button>
            <button 
              onClick={() => setActiveModal('email')}
              className="px-6 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cambiar Email
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl text-emerald-600">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-black text-xl">Seguridad</h3>
            </div>
            <p className="text-sm text-slate-500">Cambia tu contraseña para mantener tu cuenta segura.</p>
            <button 
              onClick={() => setActiveModal('security')}
              className="w-full py-4 border border-slate-100 dark:border-zinc-800 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-between px-6"
            >
              Nueva Contraseña <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-2xl text-amber-600">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-black text-xl">Notificaciones</h3>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
              <span className="font-bold text-sm">Alertas de Intercambio</span>
              <button 
                onClick={() => saveSettings({ notifications_enabled: !settings.notifications_enabled })}
                className={`w-12 h-6 rounded-full relative transition-all ${settings.notifications_enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notifications_enabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full py-6 text-red-500 font-black flex items-center justify-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-[2.5rem] transition-all border-2 border-dashed border-red-100 dark:border-red-900/20"
        >
          <LogOut className="w-6 h-6" /> Cerrar Sesión Definitivamente
        </button>
      </div>

      {/* Modals */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-black mb-6">Perfil Público</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Nombre</label>
                <input 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                  value={settings.display_name}
                  onChange={(e) => setSettings({ ...settings, display_name: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setActiveModal(null)} className="flex-1 py-4 font-bold text-slate-500">Cancelar</button>
                <button onClick={() => saveSettings({})} disabled={saving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'email' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-2xl text-blue-600">
                <AtSign className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black">Actualizar Email</h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Nuevo Email</label>
                <input 
                  type="email"
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-500 italic">Recibirás un link de confirmación para validar el cambio.</p>
              <div className="flex gap-4">
                <button onClick={() => setActiveModal(null)} className="flex-1 py-4 font-bold text-slate-500">Cancelar</button>
                <button onClick={handleUpdateEmail} disabled={saving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'security' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-black mb-6">Nueva Contraseña</h3>
            <div className="space-y-6">
              <input 
                type="password"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <div className="flex gap-4">
                <button onClick={() => setActiveModal(null)} className="flex-1 py-4 font-bold text-slate-500">Cancelar</button>
                <button 
                  onClick={async () => {
                    setSaving(true);
                    const { error } = await supabase.auth.updateUser({ password: newPassword });
                    if (error) toast.error(error.message);
                    else { toast.success("Contraseña actualizada"); setActiveModal(null); }
                    setSaving(false);
                  }} 
                  disabled={saving} 
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Cambiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
