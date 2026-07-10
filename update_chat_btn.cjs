const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `                    className="col-span-1 xl:flex-1 bg-white text-black font-round font-black py-4 xl:py-7 rounded-[1.5rem] xl:rounded-3xl text-[11px] xl:text-[10px] uppercase tracking-[0.2em] xl:tracking-[0.3em] transition-all hover:bg-sky-500 hover:text-white shadow-2xl active:scale-95 flex items-center justify-center gap-2 xl:gap-3 group/btn"
                  >
                    LIVE CHAT
                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 xl:group-hover/btn:translate-x-2 transition-transform" />
                  </button>`;

const replacement1 = `                    className="col-span-1 xl:flex-1 bg-white text-sky-600 font-round font-black py-4 xl:py-7 rounded-[1.5rem] xl:rounded-3xl text-[11px] xl:text-[10px] uppercase tracking-[0.2em] xl:tracking-[0.3em] transition-all hover:bg-sky-50 shadow-2xl active:scale-95 flex items-center justify-center gap-2 xl:gap-3 group/btn"
                  >
                    <span className="relative flex h-2 w-2 xl:h-2.5 xl:w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
                    </span>
                    LIVE CHAT
                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 xl:group-hover/btn:translate-x-2 transition-transform" />
                  </button>`;

const target2 = `          <button 
            className="flex-1 bg-white text-black font-round font-black py-3 md:py-4 rounded-full md:rounded-[1.5rem] text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all hover:bg-sky-500 hover:text-white shadow-2xl active:scale-95 flex items-center justify-center gap-1.5 md:gap-2 group/btn"
            onClick={() => onChatClick?.(vehicle)}
          >
            LIVE CHAT
            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>`;

const replacement2 = `          <button 
            className="flex-1 bg-white text-sky-600 font-round font-black py-3 md:py-4 rounded-full md:rounded-[1.5rem] text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all hover:bg-sky-50 shadow-2xl active:scale-95 flex items-center justify-center gap-1.5 md:gap-2 group/btn"
            onClick={() => onChatClick?.(vehicle)}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
            </span>
            LIVE CHAT
            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  console.log("Replaced 1");
} else {
  console.log("Could not find target 1");
}

if (code.includes(target2)) {
  code = code.replace(target2, replacement2);
  console.log("Replaced 2");
} else {
  console.log("Could not find target 2");
}

fs.writeFileSync('src/App.tsx', code);
