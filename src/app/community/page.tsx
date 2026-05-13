"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Users, UserPlus, Search, ArrowRightLeft, Loader2, Info, Star, Check, Clock, UserCheck, BookOpen, ChevronRight, Lock, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

interface Friend {
  id: string;
  display_name: string;
  email: string;
  status: 'pending' | 'accepted';
  is_public: boolean;
}

interface Match {
  friend_name: string;
  friend_id: string;
  sticker_code: string;
  collection_name: string;
  type: 'gives' | 'receives';
}

export default function CommunityPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [userCollections, setUserCollections] = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadCommunity() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      
      if (authUser) {
        // 1. Cargar mis colecciones públicas
        const { data: collections } = await supabase
          .from('user_collections')
          .select('id, name, master_album_id, is_public')
          .eq('user_id', authUser.id);
        setUserCollections(collections || []);

        // 2. Cargar amigos y solicitudes
        const { data: friendData } = await supabase
          .from('friendships')
          .select(`
            id, status, friend:friend_id(id, email), user:user_id(id, email)
          `)
          .or(`user_id.eq.${authUser.id},friend_id.eq.${authUser.id}`) as { data: any[] | null };

        if (friendData) {
          const friendIds = friendData.map(f => f.user.id === authUser.id ? f.friend.id : f.user.id);
          const { data: profiles } = await supabase
            .from('user_settings')
            .select('user_id, display_name, is_public')
            .in('user_id', friendIds);

          const formattedFriends = friendData.map(f => {
            const friendId = f.user.id === authUser.id ? f.friend.id : f.user.id;
            const profile = profiles?.find(p => p.user_id === friendId);
            return {
              id: friendId,
              display_name: profile?.display_name || "Coleccionista",
              email: f.user.id === authUser.id ? f.friend.email : f.user.email,
              status: f.status as any,
              is_public: profile?.is_public ?? true
            };
          });
          setFriends(formattedFriends);
          
          const acceptedFriends = formattedFriends.filter(f => f.status === 'accepted');
          if (acceptedFriends.length > 0) {
            calculatePrivacyMatches(authUser.id, acceptedFriends, collections || []);
          }
        }
      }
      setLoading(false);
    }
    loadCommunity();
  }, [supabase]);

  const calculatePrivacyMatches = async (userId: string, acceptedFriends: Friend[], myCollections: any[]) => {
    try {
      const friendIds = acceptedFriends.map(f => f.id);
      
      // Solo buscamos en colecciones de amigos que sean PÚBLICAS
      const { data: friendCollections } = await supabase
        .from('user_collections')
        .select('id, user_id, master_album_id, name, is_public')
        .in('user_id', friendIds)
        .eq('is_public', true);

      if (!friendCollections || friendCollections.length === 0) return;

      // Obtener stickers de mis colecciones públicas
      const myPublicCollections = myCollections.filter(c => c.is_public);
      if (myPublicCollections.length === 0) return;

      const { data: myStickers } = await supabase
        .from('album_stickers')
        .select('sticker_code, status, album_id')
        .in('album_id', myPublicCollections.map(c => c.id));

      const { data: friendsStickers } = await supabase
        .from('album_stickers')
        .select('sticker_code, status, album_id')
        .in('album_id', friendCollections.map(c => c.id));

      if (!myStickers || !friendsStickers) return;

      const foundMatches: Match[] = [];

      myPublicCollections.forEach(myCol => {
        const myColStickers = myStickers.filter(s => s.album_id === myCol.id);
        
        // Buscar colecciones del mismo álbum maestro en mis amigos
        const sameAlbumFriendsCols = friendCollections.filter(fc => fc.master_album_id === myCol.master_album_id);

        sameAlbumFriendsCols.forEach(fCol => {
          const friendColStickers = friendsStickers.filter(s => s.album_id === fCol.id);
          const friendProfile = acceptedFriends.find(f => f.id === fCol.user_id);

          // Cruce: Yo recibo
          myColStickers.filter(s => s.status === 'missing').forEach(ms => {
            if (friendColStickers.find(fs => fs.sticker_code === ms.sticker_code && fs.status === 'repeated')) {
              foundMatches.push({
                friend_name: friendProfile?.display_name || "Amigo",
                friend_id: friendProfile?.id || "",
                sticker_code: ms.sticker_code,
                collection_name: myCol.name,
                type: 'receives'
              });
            }
          });

          // Cruce: Yo doy
          myColStickers.filter(s => s.status === 'repeated').forEach(rs => {
            if (friendColStickers.find(fs => fs.sticker_code === rs.sticker_code && fs.status === 'missing')) {
              foundMatches.push({
                friend_name: friendProfile?.display_name || "Amigo",
                friend_id: friendProfile?.id || "",
                sticker_code: rs.sticker_code,
                collection_name: myCol.name,
                type: 'gives'
              });
            }
          });
        });
      });

      setMatches(foundMatches);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFriend = async () => {
    if (!searchQuery || !user) return;
    const toastId = toast.loading("Buscando...");
    try {
      const { data: target } = await supabase
        .from('user_settings')
        .select('user_id, display_name, is_public')
        .or(`display_name.ilike.%${searchQuery}%,email.eq.${searchQuery.toLowerCase()}`)
        .single();

      if (!target) throw new Error("Usuario no encontrado");

      // Regla: Si es público, agregar directo. Si es privado, solicitud pendiente.
      const status = target.is_public ? 'accepted' : 'pending';
      
      const { error } = await supabase.from('friendships').insert({
        user_id: user.id,
        friend_id: target.user_id,
        status: status
      });

      if (error) throw error;

      // Notificar al destinatario
      await supabase.from('notifications').insert({
        user_id: target.user_id,
        from_user_id: user.id,
        type: status === 'accepted' ? 'friend_accepted' : 'friend_request',
        content: status === 'accepted' 
          ? `${user.email} te ha añadido como amigo.` 
          : `${user.email} quiere ser tu amigo.`
      });

      toast.success(status === 'accepted' ? `¡${target.display_name} añadido!` : "Solicitud enviada", { id: toastId });
      window.location.reload();
    } catch (error) {
      toast.error("Error al procesar la solicitud", { id: toastId });
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 pt-10 px-4">
      <header className="mb-12 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div>
          <h1 className="text-6xl font-black tracking-tighter mb-2">Comunidad</h1>
          <p className="text-slate-500 text-xl font-medium">Búsqueda inteligente con privacidad integrada.</p>
        </div>
        
        <div className="flex bg-white dark:bg-zinc-900 p-2.5 rounded-[2rem] border-2 border-slate-100 dark:border-zinc-800 shadow-2xl w-full xl:w-96">
          <input 
            className="bg-transparent border-none px-6 py-3 outline-none text-sm w-full font-bold"
            placeholder="Buscar coleccionista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
          />
          <button onClick={handleAddFriend} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all">
            Añadir
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar Amigos */}
        <div className="lg:col-span-1 space-y-8">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4" /> Mis Amigos
          </h3>
          <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden">
            {friends.map(f => (
              <div key={f.id} className="p-6 flex items-center justify-between border-b border-slate-50 dark:border-zinc-800 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center font-black">
                    {f.display_name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{f.display_name}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase ${f.status === 'accepted' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {f.status === 'accepted' ? 'Amigo' : 'Pendiente'}
                      </span>
                      {!f.is_public && <Lock className="w-2.5 h-2.5 text-slate-300" />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Matches */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
             <h2 className="text-3xl font-black mb-2">Intercambios Disponibles</h2>
             <p className="text-blue-100 font-medium">Solo mostramos coincidencias de colecciones compartidas.</p>
             <ArrowRightLeft className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {matches.map((m, i) => (
              <div key={i} className={`bg-white dark:bg-zinc-900 border-2 p-8 rounded-[2.5rem] shadow-xl relative ${m.type === 'receives' ? 'border-blue-100' : 'border-amber-100'}`}>
                <div className="mb-6">
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${m.type === 'receives' ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'}`}>
                    {m.type === 'receives' ? 'Te falta' : 'Le falta'}
                  </span>
                  <h4 className="text-xl font-black mt-3">{m.friend_name} {m.type === 'receives' ? 'la tiene' : 'la necesita'}</h4>
                  <p className="text-slate-400 text-[10px] font-black uppercase mt-1">Colección: {m.collection_name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-8 py-4 rounded-2xl border-2 font-black text-3xl ${m.type === 'receives' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                    {m.sticker_code}
                  </div>
                  <button className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black text-sm">Contactar</button>
                </div>
              </div>
            ))}
            {matches.length === 0 && (
              <div className="col-span-full py-20 bg-slate-50 dark:bg-zinc-900 border-4 border-dashed border-slate-200 dark:border-zinc-800 rounded-[3rem] text-center">
                <EyeOff className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">No hay intercambios visibles.</p>
                <p className="text-xs text-slate-400 mt-2">Asegúrate de que tú y tus amigos tengan colecciones públicas.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
