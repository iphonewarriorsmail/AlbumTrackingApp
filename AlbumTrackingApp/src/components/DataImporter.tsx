import { useState, useRef } from "react";
import { Upload, FileJson, Table as TableIcon, X, Loader2, AlertCircle, Camera } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import Tesseract from 'tesseract.js';

interface DataImporterProps {
  albumId: string;
  onImportComplete: () => void;
  onClose: () => void;
}

export default function DataImporter({ albumId, onImportComplete, onClose }: DataImporterProps) {
  const [mode, setMode] = useState<'json' | 'table' | 'image' | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleImport = async (overriddenContent?: string) => {
    const finalContent = overriddenContent || content;
    if (!finalContent) return;
    setLoading(true);

    try {
      let dataToInsert: any[] = [];

      if (mode === 'json') {
        const parsed = JSON.parse(finalContent);
        dataToInsert = Object.entries(parsed).map(([code, status]: [string, any]) => ({
          album_id: albumId,
          sticker_code: code,
          status: typeof status === 'number' ? 'repeated' : status,
          repeated_count: typeof status === 'number' ? status : (status === 'repeated' ? 1 : 0)
        }));
      } else {
        const codes = finalContent.split(/[\s,]+/).filter(c => c.trim());
        dataToInsert = codes.map(code => ({
          album_id: albumId,
          sticker_code: code,
          status: 'collected',
          repeated_count: 0
        }));
      }

      const { error } = await supabase
        .from('album_stickers')
        .upsert(dataToInsert, { onConflict: 'album_id, sticker_code' });

      if (error) throw error;

      toast.success("Importación completada");
      onImportComplete();
      onClose();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    toast.loading("Procesando imagen con OCR...", { id: 'ocr' });

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      // Extraer números de 1 a 3 dígitos (típico de cromos)
      const foundCodes = result.data.text.match(/\b\d{1,3}\b/g) || [];
      const uniqueCodes = Array.from(new Set(foundCodes));

      if (uniqueCodes.length > 0) {
        toast.success(`Se detectaron ${uniqueCodes.length} cromos`, { id: 'ocr' });
        setContent(uniqueCodes.join(', '));
        setMode('table');
      } else {
        toast.error("No se detectaron números claros en la imagen.", { id: 'ocr' });
      }
    } catch (error) {
      toast.error("Error al procesar OCR", { id: 'ocr' });
    } finally {
      setLoading(false);
      setOcrProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black">Carga Inteligente</h2>
            <p className="text-slate-500 text-sm mt-1">Actualiza tu álbum usando datos o imágenes.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {!mode ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => setMode('json')}
                className="flex flex-col items-center gap-4 p-6 bg-slate-50 dark:bg-zinc-800/50 rounded-3xl border border-slate-100 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50 transition-all group text-center"
              >
                <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <FileJson className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-bold text-sm">JSON</span>
              </button>
              <button 
                onClick={() => setMode('table')}
                className="flex flex-col items-center gap-4 p-6 bg-slate-50 dark:bg-zinc-800/50 rounded-3xl border border-slate-100 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50 transition-all group text-center"
              >
                <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <TableIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-bold text-sm">Lista/Tabla</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-4 p-6 bg-blue-600 text-white rounded-3xl border border-blue-500 hover:bg-blue-700 transition-all group text-center shadow-lg shadow-blue-500/20"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Escanear Foto</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={handleImageUpload}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                <AlertCircle className="w-3 h-3" />
                {mode === 'json' ? 'Pega tu objeto JSON' : 'Revisa los números detectados'}
              </div>
              <textarea 
                className="w-full h-48 p-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-sm resize-none"
                placeholder={mode === 'json' ? '{ "1": "collected", "2": "repeated" }' : '101, 102, 203, 405...'}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              {loading && ocrProgress > 0 && (
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setMode(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Atrás
                </button>
                <button 
                  disabled={loading || !content}
                  onClick={() => handleImport()}
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar y Cargar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
