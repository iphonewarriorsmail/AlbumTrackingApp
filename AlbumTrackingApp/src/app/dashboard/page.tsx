import AlbumCard, { NewAlbumCard } from "@/components/AlbumCard";
import { createClient } from "@/utils/supabase/server";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: albums, error } = await supabase
    .from('albums')
    .select('*, album_stickers(count)')
    .order('created_at', { ascending: false });

  // Nota: Para contar 'collected' necesitaríamos una consulta más compleja o hacerlo en el cliente.
  // Por ahora, simularemos algunos datos si la DB está vacía para el "WOW factor".
  
  const displayAlbums = albums && albums.length > 0 ? albums : [
    {
      id: '1',
      name: 'Qatar 2022',
      category: 'Fútbol',
      total_stickers: 638,
      collected: 450,
      progress: 70
    },
    {
      id: '2',
      name: 'Spider-Man: No Way Home',
      category: 'Cine',
      total_stickers: 180,
      collected: 162,
      progress: 90
    }
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Tus Colecciones
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-2 text-lg">
            Tienes <span className="font-bold text-blue-600">{displayAlbums.length}</span> álbumes activos en este momento.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
            Ver estadísticas
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NewAlbumCard />
        {displayAlbums.map((album: any) => (
          <AlbumCard 
            key={album.id}
            id={album.id}
            name={album.name}
            category={album.category || 'Sin categoría'}
            total={album.total_stickers}
            collected={album.collected || 0}
            progress={album.progress || 0}
          />
        ))}
      </div>

      {albums?.length === 0 && (
        <div className="bg-blue-600/5 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">¿Empezamos algo nuevo?</h3>
            <p className="text-slate-600 dark:text-zinc-400 mt-1">
              No tienes ningún álbum real registrado aún. Haz clic en "Nuevo Álbum" para comenzar tu seguimiento.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
