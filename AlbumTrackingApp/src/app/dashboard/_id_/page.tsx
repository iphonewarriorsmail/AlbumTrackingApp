"use client";

import { use, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import AlbumHeader from "@/components/AlbumHeader";
import StickerGrid from "@/components/StickerGrid";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";

export default function CollectionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [collection, setCollection] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [stickers, setStickers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      // Obtener la colección con los datos del álbum maestro
      const { data: colData } = await supabase
        .from('user_collections')
        .select('*, master_albums(*)')
        .eq('id', id)
        .single();

      if (!colData) return notFound();

      const { data: sectionsData } = await supabase
        .from('album_sections')
        .select('*')
        .eq('album_id', id)
        .order('order_index');

      const { data: stickersData } = await supabase
        .from('album_stickers')
        .select('*')
        .eq('album_id', id);

      setCollection(colData);
      setSections(sectionsData || []);
      setStickers(stickersData || []);
      setLoading(false);
    }

    loadData();
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
        album={{
          ...collection,
          category: collection.master_albums?.category,
          total_stickers: collection.master_albums?.total_stickers
        }} 
        isEditMode={isEditMode} 
        onToggleEdit={() => setIsEditMode(!isEditMode)} 
      />
      
      <StickerGrid 
        albumId={id}
        totalStickers={collection.master_albums?.total_stickers || 0}
        initialStickers={stickers}
        stickerType={collection.master_albums?.sticker_type || 'standard'}
        sections={sections}
        isEditMode={isEditMode}
      />
    </div>
  );
}
