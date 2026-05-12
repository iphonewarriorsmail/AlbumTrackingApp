import { BookOpen, Search, Star, Zap, ChevronRight } from "lucide-react";

const templates = [
  {
    title: "Copa América 2024",
    total: 430,
    sections: ["Estadios", "Equipos", "Leyendas"],
    popularity: "Alta",
    color: "bg-blue-500"
  },
  {
    title: "Euro 2024 Germany",
    total: 728,
    sections: ["Host Cities", "Groups A-F", "Star Players"],
    popularity: "Muy Alta",
    color: "bg-emerald-500"
  },
  {
    title: "Pokémon TCG: Obsidian Flames",
    total: 197,
    sections: ["Common", "Holos", "Ex Cards", "Gold Rare"],
    popularity: "Tendencia",
    color: "bg-red-500"
  },
  {
    title: "Marvel Multiverse",
    total: 200,
    sections: ["Avengers", "X-Men", "Villains", "Shiny Cards"],
    popularity: "Media",
    color: "bg-purple-500"
  }
];

export default function ExplorePage() {
  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-4xl font-black tracking-tight">Explorar Plantillas</h1>
          <p className="text-slate-500 mt-2 text-lg">Descubre y usa estructuras de álbumes creadas por la comunidad o predefinidas.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar colecciones..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {templates.map((template, i) => (
          <div key={i} className="group bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[3rem] p-10 flex flex-col justify-between hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-500 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${template.color} opacity-5 blur-[80px] group-hover:opacity-20 transition-opacity`} />
            
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 ${template.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                  <Zap className="w-6 h-6" />
                </div>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
                  <Star className="w-3 h-3 fill-current" /> {template.popularity}
                </span>
              </div>

              <h2 className="text-3xl font-black mb-2 tracking-tight">{template.title}</h2>
              <p className="text-slate-500 mb-6 font-medium">Contiene {template.total} cromos distribuidos en {template.sections.length} secciones.</p>

              <div className="flex flex-wrap gap-2 mb-8">
                {template.sections.map((s, j) => (
                  <span key={j} className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform">
              Usar Plantilla <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <h3 className="text-3xl font-black mb-4 relative z-10">¿No encuentras lo que buscas?</h3>
        <p className="text-blue-100 mb-8 max-w-lg mx-auto relative z-10">Puedes crear una estructura personalizada desde cero usando nuestro asistente inteligente.</p>
        <button className="px-10 py-4 bg-white text-blue-600 rounded-2xl font-black shadow-xl hover:bg-blue-50 transition-colors relative z-10">
          Crear Personalizado
        </button>
      </div>
    </div>
  );
}
