"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  MessageSquare, 
  Bell, 
  UserPlus, 
  ArrowLeftRight, 
  Check, 
  X, 
  Clock,
  Search,
  User as UserIcon,
  Send
} from "lucide-react";
import { toast } from "react-hot-toast";

type Tab = "chats" | "notifications";

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      // Fetch notifications
      const { data: notifs } = await supabase
        .from("notifications")
        .select(`
          *,
          from_user:user_settings!notifications_from_user_id_fkey(display_name, avatar_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      setNotifications(notifs || []);

      // Fetch friend requests (pending)
      const { data: requests } = await supabase
        .from("friendships")
        .select(`
          *,
          sender:user_settings!friendships_user_id_fkey(display_name, avatar_url)
        `)
        .eq("friend_id", user.id)
        .eq("status", "pending");

      // Merge friend requests into notifications for the UI
      const requestNotifs = (requests || []).map(req => ({
        id: req.id,
        type: "friend_request",
        from_user: req.sender,
        content: "quiere ser tu amigo",
        created_at: req.created_at,
        status: "unread",
        data: req
      }));

      setNotifications(prev => [...requestNotifs, ...prev].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const handleFriendRequest = async (id: string, status: "accepted" | "rejected") => {
    const { error } = await supabase
      .from("friendships")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Error al procesar la solicitud");
    } else {
      toast.success(status === "accepted" ? "¡Solicitud aceptada!" : "Solicitud rechazada");
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "friend_request": return <UserPlus className="w-5 h-5 text-blue-500" />;
      case "trade_suggestion": return <ArrowLeftRight className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pt-28 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar / Tabs */}
          <div className="w-full md:w-80 space-y-4">
            <h1 className="text-3xl font-black tracking-tighter mb-8">Centro de Mensajes</h1>
            
            <button 
              onClick={() => setActiveTab("chats")}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                activeTab === "chats" 
                ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" 
                : "bg-white dark:bg-zinc-900 text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" />
                <span className="font-bold">Chats</span>
              </div>
              {messages.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">3</span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                activeTab === "notifications" 
                ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" 
                : "bg-white dark:bg-zinc-900 text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <span className="font-bold">Actividad</span>
              </div>
              {notifications.length > 0 && (
                <span className="bg-blue-400 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
            
            {activeTab === "chats" ? (
              <div className="flex flex-1 items-center justify-center flex-col text-center p-12">
                <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">Tus conversaciones</h3>
                <p className="text-slate-500 max-w-xs">
                  Aquí aparecerán tus chats con otros coleccionistas. ¡Inicia una charla desde la Comunidad!
                </p>
                <button className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
                  Ir a la Comunidad
                </button>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold">Actividad Reciente</h2>
                  <button className="text-sm font-bold text-blue-600 hover:underline">
                    Marcar todo como leído
                  </button>
                </div>

                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-20">
                      <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium">No tienes notificaciones pendientes</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className="group p-4 bg-slate-50 dark:bg-zinc-950/50 rounded-2xl border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all flex items-start gap-4"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm shrink-0">
                          {getIcon(notif.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 dark:text-zinc-100">
                              {notif.from_user?.display_name || "Sistema"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-zinc-400">
                            {notif.content}
                          </p>

                          {notif.type === "friend_request" && (
                            <div className="flex gap-2 mt-4">
                              <button 
                                onClick={() => handleFriendRequest(notif.id, "accepted")}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                              >
                                <Check className="w-3 h-3" /> Aceptar
                              </button>
                              <button 
                                onClick={() => handleFriendRequest(notif.id, "rejected")}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors"
                              >
                                <X className="w-3 h-3" /> Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
