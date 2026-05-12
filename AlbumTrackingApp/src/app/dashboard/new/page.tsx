"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2, CheckCircle2, Plus, Trash2, Trophy, Bug, Clipboard, Sparkles, Check, Info } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import Tesseract from 'tesseract.js';

interface Section {
  name: string;
  count: number;
  detected?: number; // Nueva propiedad para almacenar detecciones por grupo
}

const COUNTRY_MAP: Record<string, string> = {
  "MEXICO": "MEX", "ARGENTINA": "ARG", "BRASIL": "BRA", "BROT": "BRA",
  "ECUADOR": "ECU", "HOLANDA": "HOL", "SUECIA": "SWE", "CANADA": "CAN",
  "ESPAÑA": "ESP", "ALEMANIA": "GER", "FRANCIA": "FRA", "URUGUAY": "URU",
  "COLOMBIA": "COL", "PORTUGAL": "POR", "MARRUECOS": "MAR", "SENEGAL": "SEN",
  "ESTADOS": "USA", "USA": "USA", "CANAD": "CAN", "ESPAN": "ESP"
};

export default function NewAlbumPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [debugText, setDebugText] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    sticker_type: "alphanumeric",
    total_stickers: "0",
  });

  const [hasSections, setHasSections] = useState(false);
  const [sections, setSections] = useState<Section[]>([{ name: "", count: 0, detected: 0 }]);

  const addSection = () => setSections([...sections, { name: "", count: 0, detected: 0 }]);
  const removeSection = (index: number) => setSections(sections.filter((_, i) => i !== index));
  const updateSection = (index: number, field: keyof Section, value: string | number) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
    const total = newSections.reduce((acc, s) => acc + (Number(s.count) || 0), 0);
    setFormData(prev => ({ ...prev, total_stickers: total.toString() }));
  };

  const applyWCTemplate = () => {
    setFormData({
      name: "Mundial 2026",
      category: "Fútbol",
      sticker_type: "alphanumeric",
      total_stickers: "460",
    });
    setHasSections(true);
    const wcTeams = Object.values(COUNTRY_MAP).slice(0, 20);
    const wcSections = [
      ...wcTeams.map(team => ({ name: team, count: 20, detected: 0 })),
      { name: "ESP", count: 20, detected: 0 },
      { name: "HIST", count: 20, detected: 0 },
      { name: "COCA", count: 20, detected: 0 }
    ];
    setSections(wcSections);
    toast.success("Plantilla Mundial 2026 cargada");
  };

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    const toastId = toast.loading("Analizando patrones...");

    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      setDebugText(text);
      setShowDebug(true);
      
      const lines = text.split('\n');
      const detectedSections: Section[] = [];
      let totalCollected = 0;
      let collectedStickers: string[] = [];

      lines.forEach(line => {
        const countryMatch = line.match(/([A-Z][a-z]+|[A-Z]{3})/);
        if (!countryMatch) return;

        let countryName = countryMatch[0].toUpperCase();
        const countryCode = COUNTRY_MAP[countryName] || countryName.substring(0, 3);
        const bubbles = line.match(/(\([^)]+\)|\[[^\]]+\]|\S{1,3}\))/g) || [];
        
        if (bubbles.length > 5) {
          let sectionCollected = 0;
          bubbles.forEach((bubble, index) => {
            if (index >= 20) return;
            const hasMark = /[oxire5s*#+Vz]/i.test(bubble);
            if (hasMark) {
              sectionCollected++;
              collectedStickers.push(`${countryCode}${index + 1}`);
            }
          });

          detectedSections.push({ 
            name: countryCode, 
            count: 20, 
            detected: sectionCollected 
          });
          totalCollected += sectionCollected;
        }
      });

      if (detectedSections.length > 0) {
        setHasSections(true);
        setSections(detectedSections);
        setDetectedCount(totalCollected);
        const total = detectedSections.reduce((acc, s) => acc + s.count, 0);
        setFormData(prev => ({ ...prev, total_stickers: total.toString(), name: "Mi Mundial 2026" }));
        toast.success(`Detección completada: ${totalCollected} marcas`, { id: toastId });
        (window as any)._tempCollected = collectedStickers;
      } else {
        toast.error("No se detectó el formato.", { id: toastId });
      }
    } catch (error) {
      toast.error("Error en el procesado", { id: toastId });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const tempCollected = (window as any)._tempCollected || [];
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Si no hay usuario, permitimos crear si el RLS está desactivado o manejamos un error
      // Para desarrollo, si no hay login, podrías usar un ID hardcoded o avisar al usuario.
      
      const { data: album, error: albumError } = await supabase
        .from('albums')
        .insert([{
          user_id: user?.id,
          name: formData.name,
          category: formData.category,
          sticker_type: formData.sticker_type,
          total_stickers: parseInt(formData.total_stickers),
        }])
        .select().single();

      if (albumError) throw albumError;

      for (const [index, section] of sections.entries()) {
        const { data: secData, error: secError } = await supabase
          .from('album_sections')
          .insert([{ album_id: album.id, name: section.name, order_index: index }])
          .select().single();

        if (secError) throw secError;

        const stickersToInsert = Array.from({ length: section.count }, (_, i) => {
          const num = i + 1;
          const code = `${section.name}${num}`;
          const isCollected = tempCollected.includes(code);
          return {
            album_id: album.id,
            section_id: secData.id,
            sticker_code: code,
            status: isCollected ? 'collected' : 'missing'
          };
        });

        const chunkSize = 100;
        for (let i = 0; i < stickersToInsert.length; i += chunkSize) {
          await supabase.from('album_stickers').insert(stickersToInsert.slice(i, i + chunkSize));
        }
      }

      toast.success("Álbum importado con éxito");
      router.push(`/dashboard/${album.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 mb-8 group hover:text-slate-900">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-200 dark:border-zinc-800 p-8 md:p-12 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Importar Álbum</h1>
            <p className="text-slate-500 font-medium">Digitaliza tu colección física con IA.</p>
          </div>
          <button onClick={applyWCTemplate} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-blue-500/20">
            <Sparkles className="w-5 h-5" /> Plantilla Mundial 2026
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Nombre</label>
              <input className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Categoría</label>
              <input className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            </div>
          </div>

          <div className="p-10 bg-slate-950 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden group border border-blue-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/40">
              <Camera className="w-10 h-10" />
            </div>
            <div className="flex-1 relative z-10">
              <h3 className="text-2xl font-black mb-1">Escaneo de Hoja de Control</h3>
              <p className="text-slate-400">Analizaremos los casilleros pintados para marcar tus cromos automáticamente.</p>
            </div>
            <button type="button" disabled={ocrLoading} onClick={() => fileInputRef.current?.click()} className="bg-white text-black px-10 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all relative z-10">
              {ocrLoading ? <Loader2 className="animate-spin w-6 h-6" /> : "Escanear Foto"}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleOCR} />
          </div>

          {showDebug && (
            <div className="p-8 bg-slate-100 dark:bg-zinc-800/50 rounded-[2rem] border border-slate-200 dark:border-zinc-800 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Bug className="w-4 h-4 text-blue-500" /> Resultados del Análisis IA
                </h4>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> {detectedCount} MARCAS DETECTADAS
                  </span>
                  <button type="button" onClick={() => navigator.clipboard.writeText(debugText)} className="text-blue-600 font-bold text-xs flex items-center gap-1">
                    <Clipboard className="w-3 h-3" /> Copiar Raw
                  </button>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl max-h-60 overflow-y-auto text-[11px] font-mono leading-relaxed text-slate-600 dark:text-zinc-400">
                {debugText}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between ml-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Estructura de Secciones Detectada</h3>
              <div className="flex gap-2">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                  {sections.length} GRUPOS
                </span>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                  {detectedCount} CROMOS PEGADOS
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-800/30 rounded-[2rem] border border-slate-100 dark:border-zinc-800 overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-800 z-10 shadow-sm border-b border-slate-100 dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 w-16">#</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">País / Sección</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 w-32 text-center">Detectados</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 w-32 text-center">Total</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {sections.map((section, index) => (
                      <tr key={index} className="group hover:bg-white dark:hover:bg-zinc-900 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{index + 1}</td>
                        <td className="px-6 py-4">
                          <input className="w-full bg-transparent border-none font-bold text-sm outline-none focus:text-blue-600 focus:ring-0" value={section.name} onChange={(e) => updateSection(index, 'name', e.target.value)} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-black px-3 py-1 rounded-full ${section.detected && section.detected > 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-100 text-slate-400 dark:bg-zinc-800'}`}>
                            {section.detected || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <input type="number" className="w-full bg-transparent border-none text-sm text-center font-bold outline-none focus:text-blue-600 focus:ring-0" value={section.count} onChange={(e) => updateSection(index, 'count', parseInt(e.target.value))} />
                        </td>
                        <td className="px-6 py-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => removeSection(index)} className="p-2 text-red-400 hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addSection} className="w-full py-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-slate-400 font-bold flex items-center justify-center gap-2 hover:text-blue-600 transition-colors">
                <Plus className="w-4 h-4" /> Añadir Nueva Sección Manualmente
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            {loading ? "Sincronizando con Supabase..." : "Guardar y Empezar Seguimiento"}
          </button>
        </form>
      </div>
    </div>
  );
}
