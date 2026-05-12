"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Users, UserPlus, Search, ArrowRightLeft, Loader2, Info, Star, Check, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

interface Friend {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string;
  status: 'pending' | 'accepted';
}

interface Match {
  friend_name: string;
  sticker_code: string;
  type: 'gives' | 'receives';
}

export default function CommunityPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadCommunity() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      
      if (authUser) {
        // 1. Cargar amigos reales con tipado explícito
        const { data: friendData } = await supabase
          .from('friendships')
          .select(`
            id,
            status,
            friend:friend_id(id, email),
            user:user_id(id, email)
          `)
          .or(`user_id.eq.${authUser.id},friend_id.eq.${authUser.id}`) as { data: any[] | null };

        if (friendData && friendData.length > 0) {
          // Mapear para obtener los datos de perfil de los amigos
          const friendIds = friendData.map(f => f.user.id === authUser.id ? f.friend.id : f.user.id);
          const { data: profiles } = await supabase
            .from('user_settings')
            .select('*')
            .in('user_id', friendIds);

          const formattedFriends = friendData.map(f => {
            const friendId = f.user.id === authUser.id ? f.friend.id : f.user.id;
            const profile = profiles?.find(p => p.user_id === friendId);
            const friendEmail = f.user.id === authUser.id ? f.friend.email : f.user.email;
            
            return {
              id: friendId,
              display_name: profile?.display_name || "Coleccionista",
              avatar_url: profile?.avatar_url || "",
              email: friendEmail,
              status: f.status as any
            };
          });
          setFriends(formattedFriends);

          const acceptedFriendIds = formattedFriends.filter(f => f.status === 'accepted').map(f => f.id);
          if (acceptedFriendIds.length > 0) {
            calculateMatches(authUser.id, acceptedFriendIds, formattedFriends);
          }
        }
      }
      setLoading(false);
    }
    loadCommunity();
  }, [supabase]);

  const calculateMatches = async (userId: string, friendIds: string[], currentFriends: Friend[]) => {
    try {
      // 1. Obtener mis faltantes
      const { data: myMissing } = await supabase
        .from('album_stickers')
        .select('sticker_code, album_id')
        .eq('status', 'missing');

      // 2. Obtener repetidas de amigos
      const { data: friendsRepeated } = await supabase
        .from('album_stickers')
        .select('sticker_code, album_id, albums(user_id)')
        .eq('status', 'repeated') as { data: any[] | null };

      if (!myMissing || !friendsRepeated) return;

      // Filtrar repetidas que pertenezcan a mis amigos
      const filteredRepeated = friendsRepeated.filter(fr => friendIds.includes(fr.albums?.user_id));

      const foundMatches: Match[] = [];
      myMissing.forEach(m => {
        const match = filteredRepeated.find(fr => fr.sticker_code === m.sticker_code);
        if (match) {
          const friendProfile = currentFriends.find(f => f.id === match.albums?.user_id);
          foundMatches.push({
            friend_name: friendProfile?.display_name || "Amigo",
            sticker_code: m.sticker_code,
            type: 'gives'
          });
        }
      });
      setMatches(foundMatches.slice(0, 4));
    } catch (err) {
      console.error("Error calculating matches:", err);
    }
  };

  const handleAddFriend = async () => {
    if (!searchEmail) return;
    const toastId = toast.loading("Buscando usuario...");

    try {
      const { data: targetUser } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('display_name', searchEmail)
        .single();

      if (targetUser && user) {
        const { error } = await supabase.from('friendships').insert({
          user_id: user.id,
          friend_id: targetUser.user_id,
          status: 'pending'
        });
        if (error) throw error;
        toast.success("Solicitud enviada", { id: toastId });
      } else {
        toast.error("Usuario no encontrado", { id: toastId });
      }
    } catch (error) {
      toast.error("Error al enviar solicitud", { id: toastId });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 pt-10">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Comunidad</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Tus amigos y oportunidades de intercambio.</p>
        </div>
        <div className="flex bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-slate-200 dark:border-zinc-800 w-full md:w-auto shadow-xl">
          <input 
            className="bg-transparent border-none px-4 py-2 outline-none text-sm w-full md:w-64"
            placeholder="Nombre de usuario del amigo..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
          <button 
            onClick={handleAddFriend}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Añadir
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-4">
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4" /> Mis Amigos ({friends.length})
          </h3>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {friends.map((f) => (
                <div key={f.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center font-black text-blue-600 text-xl">
                      {f.display_name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{f.display_name}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        {f.status === 'accepted' ? (
                          <span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1">
                            <Check className="w-3 h-3" /> Amigo
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {friends.length === 0 && (
                <div className="p-10 text-center text-slate-400 text-sm italic">
                  Aún no tienes amigos añadidos.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-500" /> Matches para Intercambio
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((m, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 right-0 p-6">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-black text-xl leading-tight">{m.friend_name} tiene la que te falta</h4>
                    <p className="text-slate-500 text-xs mt-1 font-bold">Sugerencia de intercambio inteligente</p>
                  </div>
                  <div className="inline-block px-10 py-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border-2 border-blue-100 dark:border-blue-800">
                    <span className="text-4xl font-black text-blue-600 tracking-tighter">{m.sticker_code}</span>
                  </div>
                  <button className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-slate-900/10">
                    Contactar Amigo
                  </button>
                </div>
              </div>
            ))}

            {matches.length === 0 && (
              <div className="col-span-full py-20 bg-slate-50 dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-[2.5rem] text-center">
                <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Info className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-black text-lg">No hay matches todavía</p>
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto font-medium">
                  Cuando tus amigos marquen repetidas que tú no tienes en tu álbum, aparecerán aquí automáticamente.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
