"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Users, UserPlus, Search, ArrowRightLeft, Loader2, Info, Star, Check, Clock, UserCheck, BookOpen, ChevronRight, Lock, EyeOff, Trash2, Layers, X } from "lucide-react";
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
  const [searchResult, setSearchResult] = useState<any>(null);
  const [friendStickersModal, setFriendStickersModal] = useState<{ isOpen: boolean, friendName: string, collections: any[] }>({ isOpen: false, friendName: "", collections: [] });
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
          .select('id, status, user_id, friend_id')
          .or(`user_id.eq.${authUser.id},friend_id.eq.${authUser.id}`);

        if (friendData && friendData.length > 0) {
          const friendIds = friendData.map(f => f.user_id === authUser.id ? f.friend_id : f.user_id);
          const { data: profiles } = await supabase
            .from('user_settings')
            .select('user_id, display_name, email, is_public')
            .in('user_id', friendIds);

          const uniqueFriendsMap = new Map();
          
          friendData.forEach(f => {
            const friendId = f.user_id === authUser.id ? f.friend_id : f.user_id;
            // Si ya existe, priorizar el estado 'accepted'
            if (!uniqueFriendsMap.has(friendId) || f.status === 'accepted') {
              const profile = profiles?.find(p => p.user_id === friendId);
              uniqueFriendsMap.set(friendId, {
                id: friendId,
                display_name: profile?.display_name || "Coleccionista",
                email: profile?.email || "",
                status: f.status as any,
                is_public: profile?.is_public ?? true
              });
            }
          });

          const formattedFriends = Array.from(uniqueFriendsMap.values());
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

  const handleSearch = async () => {
    if (!searchQuery || !user) return;
    const toastId = toast.loading("Buscando...");
    setSearchResult(null);
    try {
      const { data: target } = await supabase
        .from('user_settings')
        .select('user_id, display_name, is_public')
        .or(`display_name.ilike.%${searchQuery}%,email.ilike.${searchQuery}`)
        .maybeSingle();

      if (!target) {
        toast.error("No se encontró ningún coleccionista", { id: toastId });
        return;
      }

      if (target.user_id === user.id) {
        toast.error("No puedes agregarte a ti mismo", { id: toastId });
        return;
      }

      const existingFriend = friends.find(f => f.id === target.user_id);
      setSearchResult({ ...target, friendshipStatus: existingFriend?.status || null });
      toast.dismiss(toastId);
    } catch (error) {
      toast.error("Error en la búsqueda", { id: toastId });
    }
  };

  const sendFriendRequest = async () => {
    if (!searchResult || !user) return;
    const toastId = toast.loading("Enviando solicitud...");
    try {
      const { error } = await supabase.from('friendships').insert({
        user_id: user.id,
        friend_id: searchResult.user_id,
        status: 'pending'
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: searchResult.user_id,
        from_user_id: user.id,
        type: 'friend_request',
        content: `${user.email} quiere ser tu amigo.`
      });

      toast.success("Solicitud enviada", { id: toastId });
      setSearchResult(null);
      window.location.reload();
    } catch (error) {
      toast.error("Error al enviar solicitud", { id: toastId });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm("¿Seguro que quieres eliminar a este amigo?")) return;
    const toastId = toast.loading("Eliminando...");
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);
      
      if (error) throw error;
      toast.success("Amistad eliminada", { id: toastId });
      window.location.reload();
    } catch (err) {
      toast.error("Error al eliminar", { id: toastId });
    }
  };

  const viewFriendCollections = async (friendId: string, friendName: string) => {
    const toastId = toast.loading("Cargando colecciones...");
    try {
      const { data: cols } = await supabase
        .from('user_collections')
        .select('id, name')
        .eq('user_id', friendId)
        .eq('is_public', true);

      if (!cols || cols.length === 0) {
        toast.error("Este usuario no tiene colecciones públicas", { id: toastId });
        return;
      }

      const { data: stickers } = await supabase
        .from('album_stickers')
        .select('album_id, sticker_code, status')
        .in('album_id', cols.map(c => c.id));

      const collectionsWithStickers = cols.map(c => ({
        ...c,
        missing: (stickers || []).filter(s => s.album_id === c.id && s.status === 'missing').map(s => s.sticker_code),
        repeated: (stickers || []).filter(s => s.album_id === c.id && s.status === 'repeated').map(s => s.sticker_code),
      }));

      setFriendStickersModal({ isOpen: true, friendName, collections: collectionsWithStickers });
      toast.dismiss(toastId);
    } catch (err) {
      toast.error("Error al cargar datos", { id: toastId });
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
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all">
            Buscar
          </button>
        </div>
      </header>

      {searchResult && (
        <div className="mb-12 bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border-2 border-blue-100 dark:border-blue-900/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl">
               {searchResult.display_name[0]}
             </div>
             <div>
               <h3 className="font-black text-xl">{searchResult.display_name}</h3>
               <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                 {!searchResult.is_public && <Lock className="w-3 h-3" />}
                 {searchResult.is_public ? "Perfil Público" : "Perfil Privado"}
               </div>
             </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
             {searchResult.is_public && (
                <button onClick={() => viewFriendCollections(searchResult.user_id, searchResult.display_name)} className="px-6 py-3 bg-slate-100 dark:bg-zinc-800 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                  Ver Colecciones
                </button>
             )}
             {!searchResult.friendshipStatus ? (
               <button onClick={sendFriendRequest} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform flex items-center gap-2">
                 <UserPlus className="w-4 h-4" /> Enviar Solicitud
               </button>
             ) : (
               <div className={`px-6 py-3 font-bold rounded-xl text-sm flex items-center gap-2 ${searchResult.friendshipStatus === 'accepted' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'}`}>
                 {searchResult.friendshipStatus === 'accepted' ? (
                   <><Check className="w-4 h-4" /> Ya son amigos</>
                 ) : (
                   <><Clock className="w-4 h-4" /> Solicitud pendiente</>
                 )}
               </div>
             )}
          </div>
        </div>
      )}

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
                <div className="flex items-center gap-1">
                  {f.status === 'accepted' && f.is_public && (
                    <button onClick={() => viewFriendCollections(f.id, f.display_name)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Ver cromos">
                      <Layers className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleRemoveFriend(f.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
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

      {/* Modal de Colecciones del Amigo */}
      {friendStickersModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-900">
               <div>
                 <h2 className="text-2xl font-black">Cromos de {friendStickersModal.friendName}</h2>
                 <p className="text-slate-500 text-sm font-bold">Explora sus colecciones públicas</p>
               </div>
               <button onClick={() => setFriendStickersModal({ isOpen: false, friendName: "", collections: [] })} className="p-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full hover:scale-110 transition-transform shadow-sm">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto space-y-10 custom-scrollbar">
               {friendStickersModal.collections.map((col, idx) => (
                 <div key={idx} className="space-y-6">
                   <h3 className="font-black text-xl border-b border-slate-100 dark:border-zinc-800 pb-4">{col.name}</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3 bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                       <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full shadow-sm">Le Faltan ({col.missing.length})</span>
                       <div className="flex flex-wrap gap-2 mt-4">
                         {col.missing.length > 0 ? col.missing.map((m: string) => (
                           <span key={m} className="text-sm font-black px-3 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-sm">{m}</span>
                         )) : <span className="text-sm text-slate-500 font-medium">No le faltan cromos</span>}
                       </div>
                     </div>
                     <div className="space-y-3 bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                       <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full shadow-sm">Repetidos ({col.repeated.length})</span>
                       <div className="flex flex-wrap gap-2 mt-4">
                         {col.repeated.length > 0 ? col.repeated.map((r: string) => (
                           <span key={r} className="text-sm font-black px-3 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-sm">{r}</span>
                         )) : <span className="text-sm text-slate-500 font-medium">No tiene repetidos</span>}
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
               {friendStickersModal.collections.length === 0 && (
                 <p className="text-center text-slate-500 py-10 font-bold">Este usuario no tiene colecciones públicas.</p>
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
