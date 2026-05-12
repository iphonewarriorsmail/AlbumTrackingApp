import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import StickerGrid from "@/components/StickerGrid";
import AlbumHeader from "@/components/AlbumHeader";

export default async function AlbumDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: album, error: albumError } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single();

  if (albumError || !album) {
    notFound();
  }

  const { data: stickers, error: stickersError } = await supabase
    .from('album_stickers')
    .select('*')
    .eq('album_id', id);

  return (
    <div className="space-y-8 pb-20">
      <AlbumHeader album={album} />
      
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 p-6 md:p-10">
        <StickerGrid 
          albumId={id} 
          totalStickers={album.total_stickers} 
          initialStickers={stickers || []} 
          stickerType={album.sticker_type}
        />
      </div>
    </div>
  );
}
