const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `                <button 
                  onClick={() => setActiveTab('chat')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-center",
                    activeTab === 'chat' ? "bg-white text-sky-600 shadow-lg shadow-sky-500/20" : "text-zinc-400 hover:text-white"
                  )}
                >
                  Chat
                </button>
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-center relative",
                    activeTab === 'inventory' ? "bg-white text-sky-600 shadow-lg shadow-sky-500/20" : "text-zinc-400 hover:text-white"
                  )}
                >
                  Inventario
                  {activeTab === 'chat' && (
                    <span className="absolute top-2.5 right-6 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </button>`;

const replace1 = `                <button 
                  onClick={() => setActiveTab('chat')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-center relative",
                    activeTab === 'chat' ? "bg-white text-sky-600 shadow-lg shadow-sky-500/20" : "text-zinc-400 hover:text-white"
                  )}
                >
                  Chat
                  {activeTab === 'inventory' && (
                    <span className="absolute top-2.5 right-10 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-center relative",
                    activeTab === 'inventory' ? "bg-white text-sky-600 shadow-lg shadow-sky-500/20" : "text-zinc-400 hover:text-white"
                  )}
                >
                  Inventario
                </button>`;

if (code.includes(target1)) {
  code = code.replaceAll(target1, replace1);
  console.log("Success");
} else {
  console.log("Failed to find target");
}

fs.writeFileSync('src/App.tsx', code);
