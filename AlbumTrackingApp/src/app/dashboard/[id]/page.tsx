"use client";

import { use, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import AlbumHeader from "@/components/AlbumHeader";
import StickerGrid from "@/components/StickerGrid";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";

export default function AlbumDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [album, setAlbum] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [stickers, setStickers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false); // Estado global de edición

  const supabase = createClient();

  useEffect(() => {
    async function loadAlbumData() {
      const { data: albumData } = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single();

      if (!albumData) return notFound();

      const { data: sectionsData } = await supabase
        .from('album_sections')
        .select('*')
        .eq('album_id', id)
        .order('order_index');

      const { data: stickersData } = await supabase
        .from('album_stickers')
        .select('*')
        .eq('album_id', id);

      setAlbum(albumData);
      setSections(sectionsData || []);
      setStickers(stickersData || []);
      setLoading(false);
    }

    loadAlbumData();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <AlbumHeader 
        album={album} 
        isEditMode={isEditMode} 
        onToggleEdit={() => setIsEditMode(!isEditMode)} 
      />
      
      <StickerGrid 
        albumId={id}
        totalStickers={album.total_stickers}
        initialStickers={stickers}
        stickerType={album.sticker_type}
        sections={sections}
        isEditMode={isEditMode} // Pasamos el modo edición a la grilla
      />
    </div>
  );
}
