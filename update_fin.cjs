const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetFin = `                    className="col-span-3 xl:flex-1 w-full bg-amber-500 text-zinc-950 font-round font-black py-4 xl:py-7 rounded-[1.5rem] xl:rounded-3xl text-[11px] xl:text-[10px] uppercase tracking-[0.2em] xl:tracking-[0.25em] hover:bg-amber-400 transition-all shadow-xl xl:shadow-2xl xl:shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 xl:gap-3 whitespace-nowrap"
                  >
                    Financiamiento Disponible <ShieldCheck size={16} className="text-zinc-950" />`;

const replaceFin = `                    className="col-span-3 xl:flex-1 w-full bg-white text-emerald-600 font-round font-black py-4 xl:py-7 rounded-[1.5rem] xl:rounded-3xl text-[12px] xl:text-[13px] uppercase tracking-[0.2em] xl:tracking-[0.25em] hover:bg-emerald-50 transition-all shadow-xl xl:shadow-2xl xl:shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 xl:gap-3 whitespace-nowrap"
                  >
                    Financiamiento Disponible <ShieldCheck size={20} className="text-emerald-500" />`;

const targetOferta = `        <button 
          onClick={() => window.open('https://gtautopr.com/pre-aprobacion/', '_blank')}
          className="relative w-full mt-2 md:mt-3 bg-sky-900/20 border-2 border-sky-400/60 p-3 md:p-5 rounded-[1rem] md:rounded-2xl flex items-center justify-between hover:bg-sky-800/40 hover:border-sky-300 transition-all group/finance shadow-[0_0_15px_rgba(14,165,233,0.4)] md:shadow-[0_0_20px_rgba(14,165,233,0.6)]"
        >
          <div className="absolute inset-0 rounded-[1rem] md:rounded-2xl ring-2 md:ring-4 ring-sky-400/30 animate-pulse pointer-events-none" />
          <div className="flex flex-col items-start text-left relative z-10 pr-2">
            <span className="text-[11px] md:text-base font-black uppercase tracking-widest text-sky-300 mb-0.5 md:mb-1 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]">Oferta de Financiamiento</span>
            <span className="text-[9px] md:text-sm text-sky-100 font-bold leading-tight drop-shadow-md">PRE-CUALIFICA SIN INDAGACION DE CREDITO y obtén más información sobre el proceso</span>
          </div>
          <ShieldCheck size={24} className="text-emerald-400 group-hover/finance:scale-110 transition-transform shrink-0 ml-1 md:ml-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)] relative z-10" />
        </button>`;

const replaceOferta = `        <button 
          onClick={() => window.open('https://gtautopr.com/pre-aprobacion/', '_blank')}
          className="relative w-full mt-2 md:mt-3 bg-white border-2 border-emerald-400/60 p-3 md:p-5 rounded-[1rem] md:rounded-2xl flex items-center justify-between hover:bg-emerald-50 hover:border-emerald-500 transition-all group/finance shadow-[0_0_15px_rgba(16,185,129,0.2)] md:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <div className="absolute inset-0 rounded-[1rem] md:rounded-2xl ring-2 md:ring-4 ring-emerald-400/30 animate-pulse pointer-events-none" />
          <div className="flex flex-col items-start text-left relative z-10 pr-2">
            <span className="text-sm md:text-lg font-black uppercase tracking-widest text-emerald-600 mb-0.5 md:mb-1 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">Oferta de Financiamiento</span>
            <span className="text-[10px] md:text-sm text-emerald-700 font-bold leading-tight">PRE-CUALIFICA SIN INDAGACION DE CREDITO y obtén más información sobre el proceso</span>
          </div>
          <ShieldCheck size={28} className="text-emerald-500 group-hover/finance:scale-110 transition-transform shrink-0 ml-1 md:ml-2 relative z-10" />
        </button>`;

let modified = false;
if (code.includes(targetFin)) {
  code = code.replace(targetFin, replaceFin);
  console.log("Replaced Fin");
  modified = true;
}
if (code.includes(targetOferta)) {
  code = code.replace(targetOferta, replaceOferta);
  console.log("Replaced Oferta");
  modified = true;
}

if (modified) fs.writeFileSync('src/App.tsx', code);

